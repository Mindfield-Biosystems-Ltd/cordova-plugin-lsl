/**
 * cordova-plugin-lsl
 * Lab Streaming Layer (LSL) plugin for Apache Cordova.
 *
 * Copyright (c) 2026 Mindfield Biosystems Ltd.
 * Licensed under the MIT License.
 */
package de.mindfield.cordova.lsl;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaWebView;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.net.wifi.WifiManager;
import android.net.wifi.WifiInfo;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.LinkProperties;
import android.util.Log;

import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Collections;
import java.util.Enumeration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Cordova Plugin for Lab Streaming Layer (LSL).
 * Provides outlet (sender) functionality for streaming biosignal data.
 *
 * Uses JNI to interface with the native liblsl C library.
 */
public class LSLPlugin extends CordovaPlugin {

    private static final String TAG = "LSLPlugin";

    // Thread-safe map of outletId -> LSLOutletWrapper
    private final ConcurrentHashMap<String, LSLOutletWrapper> outlets = new ConcurrentHashMap<>();

    // Counter for generating unique outlet IDs
    private final AtomicInteger outletCounter = new AtomicInteger(0);

    // Background thread pool for blocking LSL operations
    private ExecutorService executor;

    // Load native libraries: liblsl (core) + liblsl_jni (JNI bridge)
    static {
        try {
            System.loadLibrary("lsl");
            System.loadLibrary("lsl_jni");
        } catch (UnsatisfiedLinkError e) {
            Log.e(TAG, "Failed to load native libraries: " + e.getMessage());
        }
    }

    // ======================== JNI Declarations ========================

    // Stream Info
    private static native long lsl_create_streaminfo(String name, String type,
            int channelCount, double sampleRate, int channelFormat, String sourceId);
    private static native void lsl_destroy_streaminfo(long info);
    private static native long lsl_get_desc(long info);

    // XML Metadata
    private static native long lsl_append_child(long parent, String name);
    private static native long lsl_append_child_value(long parent, String name, String value);

    // Outlet
    private static native long lsl_create_outlet(long info, int chunkSize, int maxBuffered);
    private static native void lsl_destroy_outlet(long outlet);
    private static native void lsl_push_sample_f(long outlet, float[] data, double timestamp);
    private static native void lsl_push_sample_d(long outlet, double[] data, double timestamp);
    private static native void lsl_push_sample_i(long outlet, int[] data, double timestamp);
    private static native void lsl_push_sample_s(long outlet, short[] data, double timestamp);
    private static native void lsl_push_sample_c(long outlet, byte[] data, double timestamp);
    private static native void lsl_push_sample_str(long outlet, String[] data, double timestamp);
    private static native int lsl_have_consumers(long outlet);
    private static native int lsl_wait_for_consumers(long outlet, double timeout);

    // Utility
    private static native double lsl_local_clock();
    private static native int lsl_library_version();
    private static native int lsl_protocol_version();

    // ======================== Channel Format Constants ========================

    private static final int LSL_FORMAT_FLOAT32 = 1;
    private static final int LSL_FORMAT_DOUBLE64 = 2;
    private static final int LSL_FORMAT_STRING = 3;
    private static final int LSL_FORMAT_INT32 = 4;
    private static final int LSL_FORMAT_INT16 = 5;
    private static final int LSL_FORMAT_INT8 = 6;

    // ======================== Lifecycle ========================

    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
        executor = Executors.newCachedThreadPool();
        Log.i(TAG, "LSLPlugin initialized");
    }

    @Override
    public void onDestroy() {
        Log.i(TAG, "onDestroy: Cleaning up all outlets");
        destroyAllOutletsInternal();
        if (executor != null) {
            executor.shutdownNow();
            executor = null;
        }
        super.onDestroy();
    }

    @Override
    public void onReset() {
        Log.i(TAG, "onReset: Cleaning up all outlets");
        destroyAllOutletsInternal();
        super.onReset();
    }

    // ======================== Action Routing ========================

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext)
            throws JSONException {

        switch (action) {
            case "createOutlet":
                createOutlet(args.getJSONObject(0), callbackContext);
                return true;
            case "pushSample":
                pushSample(args.getJSONObject(0), callbackContext);
                return true;
            case "pushChunk":
                pushChunk(args.getJSONObject(0), callbackContext);
                return true;
            case "hasConsumers":
                hasConsumers(args.getString(0), callbackContext);
                return true;
            case "waitForConsumers":
                waitForConsumers(args.getJSONObject(0), callbackContext);
                return true;
            case "destroyOutlet":
                destroyOutlet(args.getString(0), callbackContext);
                return true;
            case "destroyAllOutlets":
                destroyAllOutlets(callbackContext);
                return true;
            case "getLocalClock":
                getLocalClock(callbackContext);
                return true;
            case "getLibraryVersion":
                getLibraryVersion(callbackContext);
                return true;
            case "getProtocolVersion":
                getProtocolVersion(callbackContext);
                return true;
            case "getDeviceIP":
                getDeviceIP(callbackContext);
                return true;
            default:
                return false;
        }
    }

    // ======================== Outlet Operations ========================

    private void createOutlet(final JSONObject options, final CallbackContext callbackContext) {
        // lsl_create_outlet may block briefly, run on background thread
        executor.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    String name = options.getString("name");
                    String type = options.getString("type");
                    int channelCount = options.getInt("channelCount");
                    double sampleRate = options.getDouble("sampleRate");
                    String channelFormatStr = options.getString("channelFormat");
                    String sourceId = options.optString("sourceId", "");

                    int channelFormat = parseChannelFormat(channelFormatStr);
                    if (channelFormat == -1) {
                        callbackContext.error("Invalid channelFormat: " + channelFormatStr);
                        return;
                    }

                    // Create stream info
                    long info = lsl_create_streaminfo(name, type, channelCount,
                            sampleRate, channelFormat, sourceId);
                    if (info == 0) {
                        callbackContext.error("Failed to create LSL stream info.");
                        return;
                    }

                    // Add metadata if provided
                    if (options.has("metadata") && !options.isNull("metadata")) {
                        JSONObject metadata = options.getJSONObject("metadata");
                        appendMetadata(info, metadata);
                    }

                    // Create outlet (chunk_size=0 for default, max_buffered=360 seconds)
                    long outlet = lsl_create_outlet(info, 0, 360);
                    if (outlet == 0) {
                        lsl_destroy_streaminfo(info);
                        callbackContext.error("Failed to create LSL outlet.");
                        return;
                    }

                    // Generate unique outlet ID
                    String outletId = "outlet_" + outletCounter.incrementAndGet();

                    // Store wrapper
                    LSLOutletWrapper wrapper = new LSLOutletWrapper(
                            outletId, outlet, info, channelFormat, channelCount, name, type);
                    outlets.put(outletId, wrapper);

                    Log.i(TAG, "Created outlet: " + outletId + " (" + name + ", " + type
                            + ", " + channelCount + "ch, " + sampleRate + "Hz)");

                    callbackContext.success(outletId);

                } catch (JSONException e) {
                    callbackContext.error("Invalid options: " + e.getMessage());
                } catch (Exception e) {
                    Log.e(TAG, "createOutlet error: " + e.getMessage(), e);
                    callbackContext.error("createOutlet failed: " + e.getMessage());
                }
            }
        });
    }

    private void pushSample(final JSONObject args, final CallbackContext callbackContext) {
        executor.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    String outletId = args.getString("outletId");
                    JSONArray dataArr = args.getJSONArray("data");
                    double timestamp = args.optDouble("timestamp", 0.0);

                    LSLOutletWrapper wrapper = outlets.get(outletId);
                    if (wrapper == null) {
                        callbackContext.error("Outlet not found: " + outletId);
                        return;
                    }

                    if (dataArr.length() != wrapper.channelCount) {
                        callbackContext.error("Data length (" + dataArr.length()
                                + ") does not match channelCount (" + wrapper.channelCount + ").");
                        return;
                    }

                    pushSampleNative(wrapper.outletPtr, wrapper.channelFormat,
                            wrapper.channelCount, dataArr, timestamp);

                    callbackContext.success();

                } catch (JSONException e) {
                    callbackContext.error("Invalid pushSample args: " + e.getMessage());
                } catch (Exception e) {
                    Log.e(TAG, "pushSample error: " + e.getMessage(), e);
                    callbackContext.error("pushSample failed: " + e.getMessage());
                }
            }
        });
    }

    private void pushChunk(final JSONObject args, final CallbackContext callbackContext) {
        executor.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    String outletId = args.getString("outletId");
                    JSONArray chunk = args.getJSONArray("data");

                    LSLOutletWrapper wrapper = outlets.get(outletId);
                    if (wrapper == null) {
                        callbackContext.error("Outlet not found: " + outletId);
                        return;
                    }

                    for (int i = 0; i < chunk.length(); i++) {
                        JSONArray sample = chunk.getJSONArray(i);
                        if (sample.length() != wrapper.channelCount) {
                            callbackContext.error("Sample " + i + " length (" + sample.length()
                                    + ") does not match channelCount (" + wrapper.channelCount + ").");
                            return;
                        }
                        pushSampleNative(wrapper.outletPtr, wrapper.channelFormat,
                                wrapper.channelCount, sample, 0.0);
                    }

                    callbackContext.success();

                } catch (JSONException e) {
                    callbackContext.error("Invalid pushChunk args: " + e.getMessage());
                } catch (Exception e) {
                    Log.e(TAG, "pushChunk error: " + e.getMessage(), e);
                    callbackContext.error("pushChunk failed: " + e.getMessage());
                }
            }
        });
    }

    private void hasConsumers(final String outletId, final CallbackContext callbackContext) {
        executor.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    LSLOutletWrapper wrapper = outlets.get(outletId);
                    if (wrapper == null) {
                        callbackContext.error("Outlet not found: " + outletId);
                        return;
                    }

                    boolean hasConsumers = lsl_have_consumers(wrapper.outletPtr) > 0;
                    callbackContext.success(hasConsumers ? 1 : 0);

                } catch (Exception e) {
                    Log.e(TAG, "hasConsumers error: " + e.getMessage(), e);
                    callbackContext.error("hasConsumers failed: " + e.getMessage());
                }
            }
        });
    }

    private void waitForConsumers(final JSONObject args, final CallbackContext callbackContext) {
        executor.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    String outletId = args.getString("outletId");
                    double timeout = args.getDouble("timeout");

                    LSLOutletWrapper wrapper = outlets.get(outletId);
                    if (wrapper == null) {
                        callbackContext.error("Outlet not found: " + outletId);
                        return;
                    }

                    // This call blocks until consumer connects or timeout
                    boolean found = lsl_wait_for_consumers(wrapper.outletPtr, timeout) > 0;
                    callbackContext.success(found ? 1 : 0);

                } catch (JSONException e) {
                    callbackContext.error("Invalid waitForConsumers args: " + e.getMessage());
                } catch (Exception e) {
                    Log.e(TAG, "waitForConsumers error: " + e.getMessage(), e);
                    callbackContext.error("waitForConsumers failed: " + e.getMessage());
                }
            }
        });
    }

    private void destroyOutlet(final String outletId, final CallbackContext callbackContext) {
        executor.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    LSLOutletWrapper wrapper = outlets.remove(outletId);
                    if (wrapper == null) {
                        callbackContext.error("Outlet not found: " + outletId);
                        return;
                    }

                    wrapper.destroy();
                    Log.i(TAG, "Destroyed outlet: " + outletId);
                    callbackContext.success();

                } catch (Exception e) {
                    Log.e(TAG, "destroyOutlet error: " + e.getMessage(), e);
                    callbackContext.error("destroyOutlet failed: " + e.getMessage());
                }
            }
        });
    }

    private void destroyAllOutlets(final CallbackContext callbackContext) {
        executor.execute(new Runnable() {
            @Override
            public void run() {
                destroyAllOutletsInternal();
                callbackContext.success();
            }
        });
    }

    // ======================== Utility Operations ========================

    private void getLocalClock(final CallbackContext callbackContext) {
        executor.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    double clock = lsl_local_clock();
                    callbackContext.success(String.valueOf(clock));
                } catch (Exception e) {
                    callbackContext.error("getLocalClock failed: " + e.getMessage());
                }
            }
        });
    }

    private void getLibraryVersion(final CallbackContext callbackContext) {
        executor.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    int version = lsl_library_version();
                    int major = version / 100;
                    int minor = (version % 100) / 10;
                    int patch = version % 10;
                    callbackContext.success(major + "." + minor + "." + patch);
                } catch (Exception e) {
                    callbackContext.error("getLibraryVersion failed: " + e.getMessage());
                }
            }
        });
    }

    private void getProtocolVersion(final CallbackContext callbackContext) {
        executor.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    int version = lsl_protocol_version();
                    callbackContext.success(version);
                } catch (Exception e) {
                    callbackContext.error("getProtocolVersion failed: " + e.getMessage());
                }
            }
        });
    }

    private void getDeviceIP(final CallbackContext callbackContext) {
        executor.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    String ip = getWifiIPAddress();
                    if (ip != null && !ip.isEmpty()) {
                        callbackContext.success(ip);
                    } else {
                        callbackContext.error("Could not determine Wi-Fi IP address. Ensure Wi-Fi is connected.");
                    }
                } catch (Exception e) {
                    callbackContext.error("getDeviceIP failed: " + e.getMessage());
                }
            }
        });
    }

    // ======================== Internal Helpers ========================

    /**
     * Destroy all outlets. Called from onDestroy/onReset and destroyAllOutlets action.
     */
    private void destroyAllOutletsInternal() {
        int count = outlets.size();
        for (LSLOutletWrapper wrapper : outlets.values()) {
            try {
                wrapper.destroy();
            } catch (Exception e) {
                Log.e(TAG, "Error destroying outlet " + wrapper.outletId + ": " + e.getMessage());
            }
        }
        outlets.clear();
        if (count > 0) {
            Log.i(TAG, "Destroyed " + count + " outlet(s)");
        }
    }

    /**
     * Parse channel format string to liblsl constant.
     */
    private int parseChannelFormat(String format) {
        switch (format) {
            case "float32":  return LSL_FORMAT_FLOAT32;
            case "double64": return LSL_FORMAT_DOUBLE64;
            case "string":   return LSL_FORMAT_STRING;
            case "int32":    return LSL_FORMAT_INT32;
            case "int16":    return LSL_FORMAT_INT16;
            case "int8":     return LSL_FORMAT_INT8;
            default:         return -1;
        }
    }

    /**
     * Push a single sample using the correct native type for the channel format.
     * JS numbers are always doubles - we cast safely to the target type.
     */
    private void pushSampleNative(long outletPtr, int channelFormat, int channelCount,
            JSONArray data, double timestamp) throws JSONException {

        switch (channelFormat) {
            case LSL_FORMAT_FLOAT32: {
                float[] sample = new float[channelCount];
                for (int i = 0; i < channelCount; i++) {
                    sample[i] = (float) data.getDouble(i);
                }
                lsl_push_sample_f(outletPtr, sample, timestamp);
                break;
            }
            case LSL_FORMAT_DOUBLE64: {
                double[] sample = new double[channelCount];
                for (int i = 0; i < channelCount; i++) {
                    sample[i] = data.getDouble(i);
                }
                lsl_push_sample_d(outletPtr, sample, timestamp);
                break;
            }
            case LSL_FORMAT_INT32: {
                int[] sample = new int[channelCount];
                for (int i = 0; i < channelCount; i++) {
                    sample[i] = (int) data.getDouble(i);
                }
                lsl_push_sample_i(outletPtr, sample, timestamp);
                break;
            }
            case LSL_FORMAT_INT16: {
                short[] sample = new short[channelCount];
                for (int i = 0; i < channelCount; i++) {
                    sample[i] = (short) data.getDouble(i);
                }
                lsl_push_sample_s(outletPtr, sample, timestamp);
                break;
            }
            case LSL_FORMAT_INT8: {
                byte[] sample = new byte[channelCount];
                for (int i = 0; i < channelCount; i++) {
                    sample[i] = (byte) data.getDouble(i);
                }
                lsl_push_sample_c(outletPtr, sample, timestamp);
                break;
            }
            case LSL_FORMAT_STRING: {
                String[] sample = new String[channelCount];
                for (int i = 0; i < channelCount; i++) {
                    sample[i] = data.getString(i);
                }
                lsl_push_sample_str(outletPtr, sample, timestamp);
                break;
            }
            default:
                throw new IllegalArgumentException("Unsupported channel format: " + channelFormat);
        }
    }

    /**
     * Append metadata XML to stream info.
     * Only supports shallow mapping: manufacturer, device, channels[].
     */
    private void appendMetadata(long info, JSONObject metadata) throws JSONException {
        long desc = lsl_get_desc(info);
        if (desc == 0) return;

        if (metadata.has("manufacturer")) {
            lsl_append_child_value(desc, "manufacturer", metadata.getString("manufacturer"));
        }
        if (metadata.has("device")) {
            lsl_append_child_value(desc, "device", metadata.getString("device"));
        }
        if (metadata.has("channels") && !metadata.isNull("channels")) {
            JSONArray channels = metadata.getJSONArray("channels");
            long channelsNode = lsl_append_child(desc, "channels");
            if (channelsNode != 0) {
                for (int i = 0; i < channels.length(); i++) {
                    JSONObject ch = channels.getJSONObject(i);
                    long channelNode = lsl_append_child(channelsNode, "channel");
                    if (channelNode != 0) {
                        if (ch.has("label")) {
                            lsl_append_child_value(channelNode, "label", ch.getString("label"));
                        }
                        if (ch.has("unit")) {
                            lsl_append_child_value(channelNode, "unit", ch.getString("unit"));
                        }
                        if (ch.has("type")) {
                            lsl_append_child_value(channelNode, "type", ch.getString("type"));
                        }
                    }
                }
            }
        }
    }

    /**
     * Get the device's Wi-Fi IP address.
     * Uses ConnectivityManager on Android 10+ for accuracy.
     */
    private String getWifiIPAddress() {
        try {
            Context context = cordova.getActivity().getApplicationContext();

            // Android 10+ preferred method
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                ConnectivityManager cm = (ConnectivityManager)
                        context.getSystemService(Context.CONNECTIVITY_SERVICE);
                if (cm != null) {
                    Network activeNetwork = cm.getActiveNetwork();
                    if (activeNetwork != null) {
                        NetworkCapabilities caps = cm.getNetworkCapabilities(activeNetwork);
                        if (caps != null && caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
                            LinkProperties linkProps = cm.getLinkProperties(activeNetwork);
                            if (linkProps != null) {
                                for (java.net.LinkAddress addr : linkProps.getLinkAddresses()) {
                                    InetAddress inetAddr = addr.getAddress();
                                    if (!inetAddr.isLoopbackAddress()
                                            && inetAddr instanceof java.net.Inet4Address) {
                                        return inetAddr.getHostAddress();
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Fallback: WifiManager (deprecated but widely compatible)
            WifiManager wifiManager = (WifiManager)
                    context.getSystemService(Context.WIFI_SERVICE);
            if (wifiManager != null) {
                WifiInfo wifiInfo = wifiManager.getConnectionInfo();
                int ipInt = wifiInfo.getIpAddress();
                if (ipInt != 0) {
                    return String.format("%d.%d.%d.%d",
                            (ipInt & 0xff), (ipInt >> 8 & 0xff),
                            (ipInt >> 16 & 0xff), (ipInt >> 24 & 0xff));
                }
            }

            // Last resort: enumerate network interfaces
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            if (interfaces != null) {
                for (NetworkInterface ni : Collections.list(interfaces)) {
                    if (ni.isLoopback() || !ni.isUp()) continue;
                    // Prefer wlan interfaces
                    if (!ni.getName().startsWith("wlan")) continue;
                    Enumeration<InetAddress> addrs = ni.getInetAddresses();
                    for (InetAddress addr : Collections.list(addrs)) {
                        if (!addr.isLoopbackAddress() && addr instanceof java.net.Inet4Address) {
                            return addr.getHostAddress();
                        }
                    }
                }
            }

        } catch (Exception e) {
            Log.e(TAG, "Error getting Wi-Fi IP: " + e.getMessage(), e);
        }
        return null;
    }
}
