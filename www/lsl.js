/**
 * cordova-plugin-lsl
 * Lab Streaming Layer (LSL) plugin for Apache Cordova.
 *
 * Copyright (c) 2026 Mindfield Biosystems Ltd.
 * Licensed under the MIT License.
 */

var exec = require('cordova/exec');

var SERVICE = 'LSLPlugin';

var VALID_CHANNEL_FORMATS = [
    'float32', 'double64', 'int32', 'int16', 'int8', 'string'
];

/**
 * Validate that a value is a non-empty string.
 * @param {*} val
 * @param {string} name
 * @returns {string|null} Error message or null if valid.
 */
function validateString(val, name) {
    if (typeof val !== 'string' || val.length === 0) {
        return name + ' must be a non-empty string.';
    }
    return null;
}

/**
 * Validate that a value is a positive number.
 * @param {*} val
 * @param {string} name
 * @returns {string|null} Error message or null if valid.
 */
function validatePositiveNumber(val, name) {
    if (typeof val !== 'number' || isNaN(val) || val <= 0) {
        return name + ' must be a positive number.';
    }
    return null;
}

/**
 * Validate that a value is a non-negative integer.
 * @param {*} val
 * @param {string} name
 * @returns {string|null} Error message or null if valid.
 */
function validatePositiveInt(val, name) {
    if (typeof val !== 'number' || isNaN(val) || val < 1 || val !== Math.floor(val)) {
        return name + ' must be a positive integer.';
    }
    return null;
}

/**
 * Lab Streaming Layer API.
 * @namespace LSL
 */
var LSL = {

    // ======================== OUTLET (Sender) ========================

    /**
     * Create a new LSL outlet for streaming data.
     *
     * @param {Object} options - Outlet configuration.
     * @param {string} options.name - Stream name (e.g. "eSense_EDA").
     * @param {string} options.type - Stream type (e.g. "EDA", "Temperature", "EMG").
     * @param {number} options.channelCount - Number of channels (>= 1).
     * @param {number} options.sampleRate - Sampling rate in Hz (e.g. 5.0). Use 0 for irregular rate.
     * @param {string} options.channelFormat - Data format: "float32"|"double64"|"int32"|"int16"|"int8"|"string".
     * @param {string} [options.sourceId] - Unique source identifier for the device.
     * @param {Object} [options.metadata] - Stream metadata.
     * @param {string} [options.metadata.manufacturer] - Manufacturer name.
     * @param {string} [options.metadata.device] - Device name.
     * @param {Array<Object>} [options.metadata.channels] - Channel descriptions.
     * @param {string} options.metadata.channels[].label - Channel label.
     * @param {string} options.metadata.channels[].unit - Channel unit.
     * @param {string} options.metadata.channels[].type - Channel type.
     * @returns {Promise<string>} Resolves with outlet ID.
     */
    createOutlet: function(options) {
        return new Promise(function(resolve, reject) {
            if (!options || typeof options !== 'object') {
                return reject('createOutlet: options must be an object.');
            }

            var err;

            err = validateString(options.name, 'options.name');
            if (err) return reject('createOutlet: ' + err);

            err = validateString(options.type, 'options.type');
            if (err) return reject('createOutlet: ' + err);

            err = validatePositiveInt(options.channelCount, 'options.channelCount');
            if (err) return reject('createOutlet: ' + err);

            if (typeof options.sampleRate !== 'number' || isNaN(options.sampleRate) || options.sampleRate < 0) {
                return reject('createOutlet: options.sampleRate must be a non-negative number.');
            }

            if (VALID_CHANNEL_FORMATS.indexOf(options.channelFormat) === -1) {
                return reject('createOutlet: options.channelFormat must be one of: ' + VALID_CHANNEL_FORMATS.join(', ') + '.');
            }

            if (options.sourceId !== undefined && options.sourceId !== null) {
                err = validateString(options.sourceId, 'options.sourceId');
                if (err) return reject('createOutlet: ' + err);
            }

            if (options.metadata !== undefined && options.metadata !== null) {
                if (typeof options.metadata !== 'object') {
                    return reject('createOutlet: options.metadata must be an object.');
                }
                if (options.metadata.channels !== undefined) {
                    if (!Array.isArray(options.metadata.channels)) {
                        return reject('createOutlet: options.metadata.channels must be an array.');
                    }
                    for (var i = 0; i < options.metadata.channels.length; i++) {
                        var ch = options.metadata.channels[i];
                        if (!ch || typeof ch !== 'object') {
                            return reject('createOutlet: Each channel must be an object with label, unit, and type.');
                        }
                        if (typeof ch.label !== 'string' || typeof ch.unit !== 'string' || typeof ch.type !== 'string') {
                            return reject('createOutlet: Each channel must have string label, unit, and type.');
                        }
                    }
                }
            }

            var args = {
                name: options.name,
                type: options.type,
                channelCount: options.channelCount,
                sampleRate: options.sampleRate,
                channelFormat: options.channelFormat,
                sourceId: options.sourceId || '',
                metadata: options.metadata || null
            };

            exec(resolve, reject, SERVICE, 'createOutlet', [args]);
        });
    },

    /**
     * Push a single sample to an outlet.
     *
     * @param {string} outletId - The outlet ID returned by createOutlet.
     * @param {number[]} data - Array of sample values (length must match channelCount).
     * @param {number} [timestamp] - Optional LSL timestamp (from getLocalClock). If omitted, native code timestamps automatically.
     * @returns {Promise<void>}
     */
    pushSample: function(outletId, data, timestamp) {
        return new Promise(function(resolve, reject) {
            var err = validateString(outletId, 'outletId');
            if (err) return reject('pushSample: ' + err);

            if (!Array.isArray(data)) {
                return reject('pushSample: data must be an array.');
            }

            if (data.length === 0) {
                return reject('pushSample: data must not be empty.');
            }

            var args = {
                outletId: outletId,
                data: data
            };

            if (timestamp !== undefined && timestamp !== null) {
                if (typeof timestamp !== 'number' || isNaN(timestamp)) {
                    return reject('pushSample: timestamp must be a number (use LSL.getLocalClock()).');
                }
                args.timestamp = timestamp;
            }

            exec(resolve, reject, SERVICE, 'pushSample', [args]);
        });
    },

    /**
     * Push a chunk of samples to an outlet (more efficient than multiple pushSample calls).
     *
     * @param {string} outletId - The outlet ID returned by createOutlet.
     * @param {number[][]} data - Array of sample arrays.
     * @returns {Promise<void>}
     */
    pushChunk: function(outletId, data) {
        return new Promise(function(resolve, reject) {
            var err = validateString(outletId, 'outletId');
            if (err) return reject('pushChunk: ' + err);

            if (!Array.isArray(data)) {
                return reject('pushChunk: data must be an array of arrays.');
            }

            if (data.length === 0) {
                return reject('pushChunk: data must not be empty.');
            }

            for (var i = 0; i < data.length; i++) {
                if (!Array.isArray(data[i])) {
                    return reject('pushChunk: Each element in data must be an array.');
                }
            }

            exec(resolve, reject, SERVICE, 'pushChunk', [{
                outletId: outletId,
                data: data
            }]);
        });
    },

    /**
     * Check if any consumers are currently connected to the outlet.
     *
     * @param {string} outletId - The outlet ID.
     * @returns {Promise<boolean>} True if at least one consumer is connected.
     */
    hasConsumers: function(outletId) {
        return new Promise(function(resolve, reject) {
            var err = validateString(outletId, 'outletId');
            if (err) return reject('hasConsumers: ' + err);

            exec(function(result) {
                // Normalize: Android returns int (0/1), iOS returns boolean
                resolve(!!result);
            }, reject, SERVICE, 'hasConsumers', [outletId]);
        });
    },

    /**
     * Wait until at least one consumer connects to the outlet.
     *
     * @param {string} outletId - The outlet ID.
     * @param {number} timeout - Maximum wait time in seconds.
     * @returns {Promise<boolean>} True if a consumer connected, false if timeout.
     */
    waitForConsumers: function(outletId, timeout) {
        return new Promise(function(resolve, reject) {
            var err = validateString(outletId, 'outletId');
            if (err) return reject('waitForConsumers: ' + err);

            err = validatePositiveNumber(timeout, 'timeout');
            if (err) return reject('waitForConsumers: ' + err);

            exec(function(result) {
                // Normalize: Android returns int (0/1), iOS returns boolean
                resolve(!!result);
            }, reject, SERVICE, 'waitForConsumers', [{
                outletId: outletId,
                timeout: timeout
            }]);
        });
    },

    /**
     * Destroy an outlet and release its resources.
     *
     * @param {string} outletId - The outlet ID.
     * @returns {Promise<void>}
     */
    destroyOutlet: function(outletId) {
        return new Promise(function(resolve, reject) {
            var err = validateString(outletId, 'outletId');
            if (err) return reject('destroyOutlet: ' + err);

            exec(resolve, reject, SERVICE, 'destroyOutlet', [outletId]);
        });
    },

    /**
     * Destroy all outlets and release all resources. Useful for cleanup.
     *
     * @returns {Promise<void>}
     */
    destroyAllOutlets: function() {
        return new Promise(function(resolve, reject) {
            exec(resolve, reject, SERVICE, 'destroyAllOutlets', []);
        });
    },

    // ======================== UTILITY ========================

    /**
     * Get the current LSL clock time.
     * Use this for custom timestamps with pushSample.
     * WARNING: Do NOT use Date.now() - it is NOT compatible with LSL's clock.
     *
     * @returns {Promise<number>} LSL timestamp in seconds.
     */
    getLocalClock: function() {
        return new Promise(function(resolve, reject) {
            exec(function(result) {
                // Native returns {timestamp: double} for cross-platform consistency
                if (result && typeof result === 'object' && typeof result.timestamp === 'number') {
                    resolve(result.timestamp);
                } else if (typeof result === 'number') {
                    resolve(result);
                } else {
                    resolve(parseFloat(result));
                }
            }, reject, SERVICE, 'getLocalClock', []);
        });
    },

    /**
     * Get the version of the underlying liblsl library.
     *
     * @returns {Promise<string>} Version string (e.g. "1.17").
     */
    getLibraryVersion: function() {
        return new Promise(function(resolve, reject) {
            exec(resolve, reject, SERVICE, 'getLibraryVersion', []);
        });
    },

    /**
     * Get the LSL protocol version.
     *
     * @returns {Promise<number>} Protocol version number.
     */
    getProtocolVersion: function() {
        return new Promise(function(resolve, reject) {
            exec(resolve, reject, SERVICE, 'getProtocolVersion', []);
        });
    },

    /**
     * Get the device's current Wi-Fi IP address.
     * Display this to the user so they can configure KnownPeers on their PC.
     *
     * @returns {Promise<string>} IP address string (e.g. "192.168.1.100").
     */
    getDeviceIP: function() {
        return new Promise(function(resolve, reject) {
            exec(resolve, reject, SERVICE, 'getDeviceIP', []);
        });
    }
};

module.exports = LSL;
