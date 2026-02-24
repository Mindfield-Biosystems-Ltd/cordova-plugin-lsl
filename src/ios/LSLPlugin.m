/**
 * cordova-plugin-lsl
 * Lab Streaming Layer (LSL) plugin for Apache Cordova.
 *
 * Copyright (c) 2026 Mindfield Biosystems Ltd.
 * Licensed under the MIT License.
 */

#import "LSLPlugin.h"
#import <lsl_c.h>
#import <ifaddrs.h>
#import <arpa/inet.h>
#import <net/if.h>

#pragma mark - Outlet Wrapper

/**
 * Internal wrapper holding native LSL pointers and metadata for a single outlet.
 */
@interface LSLOutletWrapper : NSObject

@property (nonatomic, copy) NSString *outletId;
@property (nonatomic, assign) lsl_outlet outlet;
@property (nonatomic, assign) lsl_streaminfo info;
@property (nonatomic, assign) int channelFormat;
@property (nonatomic, assign) int channelCount;
@property (nonatomic, copy) NSString *name;
@property (nonatomic, copy) NSString *type;
@property (nonatomic, assign) BOOL destroyed;

- (void)destroy;

@end

@implementation LSLOutletWrapper

- (void)destroy {
    @synchronized (self) {
        if (self.destroyed) return;
        self.destroyed = YES;

        if (self.outlet) {
            lsl_destroy_outlet(self.outlet);
            self.outlet = NULL;
        }
        if (self.info) {
            lsl_destroy_streaminfo(self.info);
            self.info = NULL;
        }

        NSLog(@"[LSLPlugin] Outlet %@ (%@/%@) destroyed", self.outletId, self.name, self.type);
    }
}

@end

#pragma mark - LSLPlugin Implementation

@interface LSLPlugin ()

/** Thread-safe dictionary of outletId -> LSLOutletWrapper. */
@property (nonatomic, strong) NSMutableDictionary<NSString *, LSLOutletWrapper *> *outlets;

/** Counter for generating unique outlet IDs. */
@property (nonatomic, assign) NSInteger outletCounter;

/** Serial queue for thread-safe outlet operations. */
@property (nonatomic, strong) dispatch_queue_t lslQueue;

@end

@implementation LSLPlugin

#pragma mark - Lifecycle

- (void)pluginInitialize {
    self.outlets = [NSMutableDictionary new];
    self.outletCounter = 0;
    self.lslQueue = dispatch_queue_create("de.mindfield.cordova.lsl", DISPATCH_QUEUE_SERIAL);
    NSLog(@"[LSLPlugin] Initialized");
}

- (void)onAppTerminate {
    NSLog(@"[LSLPlugin] onAppTerminate: Cleaning up all outlets");
    [self destroyAllOutletsInternal];
}

- (void)onReset {
    NSLog(@"[LSLPlugin] onReset: Cleaning up all outlets");
    [self destroyAllOutletsInternal];
}

#pragma mark - Channel Format Constants

static int parseChannelFormat(NSString *format) {
    if ([format isEqualToString:@"float32"])  return cft_float32;
    if ([format isEqualToString:@"double64"]) return cft_double64;
    if ([format isEqualToString:@"string"])   return cft_string;
    if ([format isEqualToString:@"int32"])    return cft_int32;
    if ([format isEqualToString:@"int16"])    return cft_int16;
    if ([format isEqualToString:@"int8"])     return cft_int8;
    return -1;
}

#pragma mark - Outlet Operations

- (void)createOutlet:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        NSDictionary *options = [command argumentAtIndex:0 withDefault:nil];
        if (!options || ![options isKindOfClass:[NSDictionary class]]) {
            CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                       messageAsString:@"createOutlet: options must be an object."];
            [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
            return;
        }

        NSString *name = options[@"name"];
        NSString *type = options[@"type"];
        NSNumber *channelCountNum = options[@"channelCount"];
        NSNumber *sampleRateNum = options[@"sampleRate"];
        NSString *channelFormatStr = options[@"channelFormat"];
        NSString *sourceId = options[@"sourceId"] ?: @"";
        NSDictionary *metadata = options[@"metadata"];

        int channelFormat = parseChannelFormat(channelFormatStr);
        if (channelFormat == -1) {
            CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                       messageAsString:@"createOutlet: Invalid channelFormat."];
            [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
            return;
        }

        int channelCount = [channelCountNum intValue];
        double sampleRate = [sampleRateNum doubleValue];

        // Create stream info
        lsl_streaminfo info = lsl_create_streaminfo(
            [name UTF8String],
            [type UTF8String],
            channelCount,
            sampleRate,
            (lsl_channel_format_t)channelFormat,
            [sourceId UTF8String]
        );

        if (!info) {
            CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                       messageAsString:@"Failed to create LSL stream info."];
            [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
            return;
        }

        // Add metadata if provided
        if (metadata && [metadata isKindOfClass:[NSDictionary class]]) {
            lsl_xml_ptr desc = lsl_get_desc(info);
            if (desc) {
                NSString *manufacturer = metadata[@"manufacturer"];
                if (manufacturer) {
                    lsl_append_child_value(desc, "manufacturer", [manufacturer UTF8String]);
                }

                NSString *device = metadata[@"device"];
                if (device) {
                    lsl_append_child_value(desc, "device", [device UTF8String]);
                }

                NSArray *channels = metadata[@"channels"];
                if (channels && [channels isKindOfClass:[NSArray class]]) {
                    lsl_xml_ptr channelsNode = lsl_append_child(desc, "channels");
                    if (channelsNode) {
                        for (NSDictionary *ch in channels) {
                            if (![ch isKindOfClass:[NSDictionary class]]) continue;
                            lsl_xml_ptr channelNode = lsl_append_child(channelsNode, "channel");
                            if (channelNode) {
                                NSString *label = ch[@"label"];
                                NSString *unit = ch[@"unit"];
                                NSString *chType = ch[@"type"];
                                if (label) lsl_append_child_value(channelNode, "label", [label UTF8String]);
                                if (unit) lsl_append_child_value(channelNode, "unit", [unit UTF8String]);
                                if (chType) lsl_append_child_value(channelNode, "type", [chType UTF8String]);
                            }
                        }
                    }
                }
            }
        }

        // Create outlet (chunk_size=0 for default, max_buffered=360 seconds)
        lsl_outlet outlet = lsl_create_outlet(info, 0, 360);
        if (!outlet) {
            lsl_destroy_streaminfo(info);
            CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                       messageAsString:@"Failed to create LSL outlet."];
            [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
            return;
        }

        // Generate unique outlet ID
        NSString *outletId;
        @synchronized (self) {
            self.outletCounter++;
            outletId = [NSString stringWithFormat:@"outlet_%ld", (long)self.outletCounter];
        }

        // Store wrapper
        LSLOutletWrapper *wrapper = [LSLOutletWrapper new];
        wrapper.outletId = outletId;
        wrapper.outlet = outlet;
        wrapper.info = info;
        wrapper.channelFormat = channelFormat;
        wrapper.channelCount = channelCount;
        wrapper.name = name;
        wrapper.type = type;
        wrapper.destroyed = NO;

        @synchronized (self.outlets) {
            self.outlets[outletId] = wrapper;
        }

        NSLog(@"[LSLPlugin] Created outlet: %@ (%@, %@, %dch, %.1fHz)",
              outletId, name, type, channelCount, sampleRate);

        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                    messageAsString:outletId];
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }];
}

- (void)pushSample:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        NSDictionary *args = [command argumentAtIndex:0 withDefault:nil];
        NSString *outletId = args[@"outletId"];
        NSArray *data = args[@"data"];
        NSNumber *timestampNum = args[@"timestamp"];
        double timestamp = timestampNum ? [timestampNum doubleValue] : 0.0;

        LSLOutletWrapper *wrapper;
        @synchronized (self.outlets) {
            wrapper = self.outlets[outletId];
        }

        if (!wrapper || wrapper.destroyed) {
            CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                       messageAsString:[NSString stringWithFormat:@"Outlet not found: %@", outletId]];
            [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
            return;
        }

        if ((int)data.count != wrapper.channelCount) {
            CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                       messageAsString:[NSString stringWithFormat:
                                                           @"Data length (%lu) does not match channelCount (%d).",
                                                           (unsigned long)data.count, wrapper.channelCount]];
            [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
            return;
        }

        [self pushSampleNative:wrapper data:data timestamp:timestamp];

        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }];
}

- (void)pushChunk:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        NSDictionary *args = [command argumentAtIndex:0 withDefault:nil];
        NSString *outletId = args[@"outletId"];
        NSArray *chunk = args[@"data"];

        LSLOutletWrapper *wrapper;
        @synchronized (self.outlets) {
            wrapper = self.outlets[outletId];
        }

        if (!wrapper || wrapper.destroyed) {
            CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                       messageAsString:[NSString stringWithFormat:@"Outlet not found: %@", outletId]];
            [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
            return;
        }

        int cc = wrapper.channelCount;
        NSUInteger numSamples = chunk.count;

        // Validate all samples first
        for (NSUInteger i = 0; i < numSamples; i++) {
            NSArray *sample = chunk[i];
            if (![sample isKindOfClass:[NSArray class]] || (int)sample.count != cc) {
                CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                           messageAsString:[NSString stringWithFormat:
                                                               @"Sample %lu has invalid length.", (unsigned long)i]];
                [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
                return;
            }
        }

        // Use native push_chunk for performance (single liblsl call)
        [self pushChunkNative:wrapper chunk:chunk numSamples:numSamples];

        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }];
}

- (void)hasConsumers:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        NSString *outletId = [command argumentAtIndex:0 withDefault:nil];

        LSLOutletWrapper *wrapper;
        @synchronized (self.outlets) {
            wrapper = self.outlets[outletId];
        }

        if (!wrapper || wrapper.destroyed) {
            CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                       messageAsString:[NSString stringWithFormat:@"Outlet not found: %@", outletId]];
            [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
            return;
        }

        BOOL hasConsumers = lsl_have_consumers(wrapper.outlet) > 0;
        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                      messageAsBool:hasConsumers];
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }];
}

- (void)waitForConsumers:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        NSDictionary *args = [command argumentAtIndex:0 withDefault:nil];
        NSString *outletId = args[@"outletId"];
        double timeout = [args[@"timeout"] doubleValue];

        LSLOutletWrapper *wrapper;
        @synchronized (self.outlets) {
            wrapper = self.outlets[outletId];
        }

        if (!wrapper || wrapper.destroyed) {
            CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                       messageAsString:[NSString stringWithFormat:@"Outlet not found: %@", outletId]];
            [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
            return;
        }

        // This call blocks until consumer connects or timeout
        BOOL found = lsl_wait_for_consumers(wrapper.outlet, timeout) > 0;
        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                      messageAsBool:found];
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }];
}

- (void)destroyOutlet:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        NSString *outletId = [command argumentAtIndex:0 withDefault:nil];

        LSLOutletWrapper *wrapper;
        @synchronized (self.outlets) {
            wrapper = self.outlets[outletId];
            if (wrapper) {
                [self.outlets removeObjectForKey:outletId];
            }
        }

        if (!wrapper) {
            CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                       messageAsString:[NSString stringWithFormat:@"Outlet not found: %@", outletId]];
            [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
            return;
        }

        [wrapper destroy];
        NSLog(@"[LSLPlugin] Destroyed outlet: %@", outletId);

        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }];
}

- (void)destroyAllOutlets:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        [self destroyAllOutletsInternal];

        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }];
}

#pragma mark - Utility Operations

- (void)getLocalClock:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        double clock = lsl_local_clock();
        NSDictionary *dict = @{@"timestamp": @(clock)};
        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                messageAsDictionary:dict];
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }];
}

- (void)getLibraryVersion:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        int version = lsl_library_version();
        int major = version / 100;
        int minor = version % 100;
        NSString *versionStr = [NSString stringWithFormat:@"%d.%d", major, minor];

        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                    messageAsString:versionStr];
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }];
}

- (void)getProtocolVersion:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        int version = lsl_protocol_version();
        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                       messageAsInt:version];
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }];
}

- (void)getDeviceIP:(CDVInvokedUrlCommand *)command {
    [self.commandDelegate runInBackground:^{
        NSString *ip = [self getWifiIPAddress];
        if (ip) {
            CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                        messageAsString:ip];
            [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
        } else {
            CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                                                       messageAsString:@"Could not determine Wi-Fi IP address. Ensure Wi-Fi is connected."];
            [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
        }
    }];
}

#pragma mark - Internal Helpers

/**
 * Destroy all outlets. Called from onAppTerminate/onReset and destroyAllOutlets action.
 */
- (void)destroyAllOutletsInternal {
    NSArray<LSLOutletWrapper *> *allOutlets;
    @synchronized (self.outlets) {
        allOutlets = [self.outlets.allValues copy];
        [self.outlets removeAllObjects];
    }

    for (LSLOutletWrapper *wrapper in allOutlets) {
        [wrapper destroy];
    }

    if (allOutlets.count > 0) {
        NSLog(@"[LSLPlugin] Destroyed %lu outlet(s)", (unsigned long)allOutlets.count);
    }
}

/**
 * Push a chunk of samples using native lsl_push_chunk_* for performance.
 * Flattens the 2D array into a 1D C buffer and pushes in one liblsl call.
 * Falls back to sample-by-sample for string format.
 */
- (void)pushChunkNative:(LSLOutletWrapper *)wrapper chunk:(NSArray *)chunk numSamples:(NSUInteger)numSamples {
    int cc = wrapper.channelCount;
    unsigned long totalElements = numSamples * cc;

    switch (wrapper.channelFormat) {
        case cft_float32: {
            float *flat = (float *)malloc(totalElements * sizeof(float));
            for (NSUInteger i = 0; i < numSamples; i++) {
                NSArray *sample = chunk[i];
                for (int j = 0; j < cc; j++) {
                    flat[i * cc + j] = (float)[sample[j] doubleValue];
                }
            }
            lsl_push_chunk_ft(wrapper.outlet, flat, totalElements, 0.0);
            free(flat);
            break;
        }
        case cft_double64: {
            double *flat = (double *)malloc(totalElements * sizeof(double));
            for (NSUInteger i = 0; i < numSamples; i++) {
                NSArray *sample = chunk[i];
                for (int j = 0; j < cc; j++) {
                    flat[i * cc + j] = [sample[j] doubleValue];
                }
            }
            lsl_push_chunk_dt(wrapper.outlet, flat, totalElements, 0.0);
            free(flat);
            break;
        }
        case cft_int32: {
            int32_t *flat = (int32_t *)malloc(totalElements * sizeof(int32_t));
            for (NSUInteger i = 0; i < numSamples; i++) {
                NSArray *sample = chunk[i];
                for (int j = 0; j < cc; j++) {
                    flat[i * cc + j] = (int32_t)[sample[j] doubleValue];
                }
            }
            lsl_push_chunk_it(wrapper.outlet, flat, totalElements, 0.0);
            free(flat);
            break;
        }
        case cft_int16: {
            int16_t *flat = (int16_t *)malloc(totalElements * sizeof(int16_t));
            for (NSUInteger i = 0; i < numSamples; i++) {
                NSArray *sample = chunk[i];
                for (int j = 0; j < cc; j++) {
                    flat[i * cc + j] = (int16_t)[sample[j] doubleValue];
                }
            }
            lsl_push_chunk_st(wrapper.outlet, flat, totalElements, 0.0);
            free(flat);
            break;
        }
        case cft_int8: {
            char *flat = (char *)malloc(totalElements * sizeof(char));
            for (NSUInteger i = 0; i < numSamples; i++) {
                NSArray *sample = chunk[i];
                for (int j = 0; j < cc; j++) {
                    flat[i * cc + j] = (char)[sample[j] doubleValue];
                }
            }
            lsl_push_chunk_ct(wrapper.outlet, flat, totalElements, 0.0);
            free(flat);
            break;
        }
        case cft_string: {
            // String format: fall back to sample-by-sample
            for (NSUInteger i = 0; i < numSamples; i++) {
                [self pushSampleNative:wrapper data:chunk[i] timestamp:0.0];
            }
            break;
        }
        default:
            NSLog(@"[LSLPlugin] Unsupported channel format for chunk: %d", wrapper.channelFormat);
            break;
    }
}

/**
 * Push a single sample using the correct native type for the channel format.
 * JS numbers arrive as NSNumber (double) - we cast safely to the target C type.
 */
- (void)pushSampleNative:(LSLOutletWrapper *)wrapper data:(NSArray *)data timestamp:(double)timestamp {
    int count = wrapper.channelCount;

    switch (wrapper.channelFormat) {
        case cft_float32: {
            float *sample = (float *)malloc(count * sizeof(float));
            for (int i = 0; i < count; i++) {
                sample[i] = (float)[data[i] doubleValue];
            }
            lsl_push_sample_ft(wrapper.outlet, sample, timestamp);
            free(sample);
            break;
        }
        case cft_double64: {
            double *sample = (double *)malloc(count * sizeof(double));
            for (int i = 0; i < count; i++) {
                sample[i] = [data[i] doubleValue];
            }
            lsl_push_sample_dt(wrapper.outlet, sample, timestamp);
            free(sample);
            break;
        }
        case cft_int32: {
            int32_t *sample = (int32_t *)malloc(count * sizeof(int32_t));
            for (int i = 0; i < count; i++) {
                sample[i] = (int32_t)[data[i] doubleValue];
            }
            lsl_push_sample_it(wrapper.outlet, sample, timestamp);
            free(sample);
            break;
        }
        case cft_int16: {
            int16_t *sample = (int16_t *)malloc(count * sizeof(int16_t));
            for (int i = 0; i < count; i++) {
                sample[i] = (int16_t)[data[i] doubleValue];
            }
            lsl_push_sample_st(wrapper.outlet, sample, timestamp);
            free(sample);
            break;
        }
        case cft_int8: {
            char *sample = (char *)malloc(count * sizeof(char));
            for (int i = 0; i < count; i++) {
                sample[i] = (char)[data[i] doubleValue];
            }
            lsl_push_sample_ct(wrapper.outlet, sample, timestamp);
            free(sample);
            break;
        }
        case cft_string: {
            const char **sample = (const char **)malloc(count * sizeof(const char *));
            for (int i = 0; i < count; i++) {
                sample[i] = [data[i] isKindOfClass:[NSString class]]
                    ? [data[i] UTF8String]
                    : [[data[i] description] UTF8String];
            }
            lsl_push_sample_strt(wrapper.outlet, sample, timestamp);
            free(sample);
            break;
        }
        default:
            NSLog(@"[LSLPlugin] Unsupported channel format: %d", wrapper.channelFormat);
            break;
    }
}

/**
 * Get the device's Wi-Fi IP address using BSD socket interfaces.
 * Returns the first non-loopback IPv4 address on en0 (Wi-Fi).
 */
- (NSString *)getWifiIPAddress {
    struct ifaddrs *interfaces = NULL;
    struct ifaddrs *addr = NULL;
    NSString *wifiAddress = nil;

    if (getifaddrs(&interfaces) != 0) {
        return nil;
    }

    addr = interfaces;
    while (addr != NULL) {
        // Check for IPv4 on Wi-Fi interface (en0); ifa_addr can be NULL
        if (addr->ifa_addr != NULL && addr->ifa_addr->sa_family == AF_INET) {
            NSString *ifName = [NSString stringWithUTF8String:addr->ifa_name];
            if ([ifName isEqualToString:@"en0"]) {
                struct sockaddr_in *sockAddr = (struct sockaddr_in *)addr->ifa_addr;
                char *ipStr = inet_ntoa(sockAddr->sin_addr);
                wifiAddress = [NSString stringWithUTF8String:ipStr];
                break;
            }
        }
        addr = addr->ifa_next;
    }

    freeifaddrs(interfaces);
    return wifiAddress;
}

@end
