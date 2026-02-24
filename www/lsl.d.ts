/**
 * cordova-plugin-lsl
 * Lab Streaming Layer (LSL) plugin for Apache Cordova.
 *
 * Copyright (c) 2026 Mindfield Biosystems Ltd.
 * Licensed under the MIT License.
 */

/** Supported LSL channel data formats. */
export type ChannelFormat = 'float32' | 'double64' | 'int32' | 'int16' | 'int8' | 'string';

/** Channel metadata description. */
export interface ChannelInfo {
    /** Channel label (e.g. "EDA", "HeartRate"). */
    label: string;
    /** Unit of measurement (e.g. "microsiemens", "bpm"). */
    unit: string;
    /** Channel type (e.g. "EDA", "PPG"). */
    type: string;
}

/** Stream metadata embedded in the LSL stream info XML. */
export interface StreamMetadata {
    /** Manufacturer name (e.g. "Mindfield Biosystems"). */
    manufacturer?: string;
    /** Device name (e.g. "eSense EDA"). */
    device?: string;
    /** Channel descriptions. Length should match channelCount. */
    channels?: ChannelInfo[];
}

/** Options for creating an LSL outlet. */
export interface CreateOutletOptions {
    /** Stream name (e.g. "eSense_EDA"). */
    name: string;
    /** Stream type (e.g. "EDA", "Temperature", "EMG", "PPG", "Respiration"). */
    type: string;
    /** Number of channels (>= 1). */
    channelCount: number;
    /** Nominal sampling rate in Hz (e.g. 5.0). Use 0 for irregular rate. */
    sampleRate: number;
    /** Data format for channel values. */
    channelFormat: ChannelFormat;
    /** Unique source identifier for the device. */
    sourceId?: string;
    /** Optional stream metadata (manufacturer, device, channel descriptions). */
    metadata?: StreamMetadata;
}

/** Lab Streaming Layer API. */
export interface LSLPlugin {
    // ==================== OUTLET (Sender) ====================

    /**
     * Create a new LSL outlet for streaming data.
     * @param options - Outlet configuration.
     * @returns Promise resolving with the outlet ID.
     */
    createOutlet(options: CreateOutletOptions): Promise<string>;

    /**
     * Push a single sample to an outlet.
     * @param outletId - The outlet ID returned by createOutlet.
     * @param data - Array of sample values (length must match channelCount).
     * @param timestamp - Optional LSL timestamp from getLocalClock(). If omitted, native code timestamps automatically.
     *
     * WARNING: Do NOT use Date.now() for timestamps. Only use values from getLocalClock().
     */
    pushSample(outletId: string, data: number[], timestamp?: number): Promise<void>;

    /**
     * Push a chunk of samples to an outlet (more efficient than multiple pushSample calls).
     * Recommended for sample rates above 10 Hz.
     * @param outletId - The outlet ID returned by createOutlet.
     * @param data - Array of sample arrays.
     */
    pushChunk(outletId: string, data: number[][]): Promise<void>;

    /**
     * Check if any consumers (e.g. LabRecorder) are currently connected to the outlet.
     * @param outletId - The outlet ID.
     * @returns True if at least one consumer is connected.
     */
    hasConsumers(outletId: string): Promise<boolean>;

    /**
     * Wait until at least one consumer connects to the outlet or timeout expires.
     * @param outletId - The outlet ID.
     * @param timeout - Maximum wait time in seconds.
     * @returns True if a consumer connected, false if timeout reached.
     */
    waitForConsumers(outletId: string, timeout: number): Promise<boolean>;

    /**
     * Destroy an outlet and release its resources.
     * @param outletId - The outlet ID.
     */
    destroyOutlet(outletId: string): Promise<void>;

    /**
     * Destroy all outlets and release all resources.
     * Call this during app cleanup or before creating new outlets.
     */
    destroyAllOutlets(): Promise<void>;

    // ==================== UTILITY ====================

    /**
     * Get the current LSL clock time.
     * Use this for custom timestamps with pushSample().
     *
     * WARNING: Do NOT use Date.now() - it is NOT compatible with LSL's clock.
     * @returns LSL timestamp in seconds (high-resolution monotonic clock).
     */
    getLocalClock(): Promise<number>;

    /**
     * Get the version of the underlying liblsl library.
     * @returns Version string (e.g. "1.17.5").
     */
    getLibraryVersion(): Promise<string>;

    /**
     * Get the LSL protocol version number.
     * @returns Protocol version as integer.
     */
    getProtocolVersion(): Promise<number>;

    /**
     * Get the device's current Wi-Fi IP address.
     * Display this to the user so they can add it to lsl_api.cfg as KnownPeer on their PC.
     * @returns IP address string (e.g. "192.168.1.100").
     */
    getDeviceIP(): Promise<string>;
}

declare global {
    /** Lab Streaming Layer API - available after cordova deviceready event. */
    var LSL: LSLPlugin;
}

export {};
