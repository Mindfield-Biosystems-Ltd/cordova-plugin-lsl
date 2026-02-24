/**
 * cordova-plugin-lsl
 * Lab Streaming Layer (LSL) plugin for Apache Cordova.
 *
 * Copyright (c) 2026 Mindfield Biosystems Ltd.
 * Licensed under the MIT License.
 */

#import <Cordova/CDVPlugin.h>

/**
 * Cordova Plugin for Lab Streaming Layer (LSL).
 * Provides outlet (sender) functionality for streaming biosignal data.
 *
 * Directly calls the liblsl C API from Objective-C.
 */
@interface LSLPlugin : CDVPlugin

// Outlet operations
- (void)createOutlet:(CDVInvokedUrlCommand *)command;
- (void)pushSample:(CDVInvokedUrlCommand *)command;
- (void)pushChunk:(CDVInvokedUrlCommand *)command;
- (void)hasConsumers:(CDVInvokedUrlCommand *)command;
- (void)waitForConsumers:(CDVInvokedUrlCommand *)command;
- (void)destroyOutlet:(CDVInvokedUrlCommand *)command;
- (void)destroyAllOutlets:(CDVInvokedUrlCommand *)command;

// Utility
- (void)getLocalClock:(CDVInvokedUrlCommand *)command;
- (void)getLibraryVersion:(CDVInvokedUrlCommand *)command;
- (void)getProtocolVersion:(CDVInvokedUrlCommand *)command;
- (void)getDeviceIP:(CDVInvokedUrlCommand *)command;

@end
