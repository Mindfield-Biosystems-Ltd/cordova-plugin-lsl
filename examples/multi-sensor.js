/**
 * eSense Multi-Sensor - LSL Streaming Example
 *
 * Streams ALL 5 eSense sensor types simultaneously over LSL:
 *   1. EDA (1 ch)         - Electrodermal Activity in microsiemens
 *   2. Temperature (1 ch) - Skin temperature in degrees Celsius
 *   3. Pulse (2 ch)       - BPM and IBI (inter-beat interval)
 *   4. Respiration (1 ch) - Respiratory amplitude
 *   5. EMG (2 ch)         - Two independent EMG electrodes (RMS microvolts)
 *
 * Total: 5 LSL outlets, 7 channels across all streams.
 *
 * This example demonstrates:
 *   - Creating multiple outlets in parallel
 *   - Using pushChunk for efficient batched data transmission
 *   - Centralized error handling
 *   - Proper cleanup of all outlets
 *   - Displaying the device IP for KnownPeers configuration
 *
 * Usage:
 *   Include this file in your Cordova app after cordova.js.
 *   Five streams will appear in LabRecorder (eSense_EDA, eSense_Temperature, etc.).
 *   Add the device IP (shown in console) as a KnownPeer in lsl_api.cfg on your PC.
 *
 * Copyright (c) 2026 Mindfield Biosystems Ltd.
 */

document.addEventListener('deviceready', function() {

    // --- Configuration ---
    var SAMPLE_RATE  = 5;                     // All streams at 5 Hz
    var PUSH_INTERVAL = 1000 / SAMPLE_RATE;   // 200 ms
    var CHUNK_SIZE = 5;                        // Collect 5 samples, push as chunk every 1 second

    // Holds all outlet IDs (keyed by sensor name)
    var outlets = {
        eda: null,
        temperature: null,
        pulse: null,
        respiration: null,
        emg: null
    };

    // Holds interval handles for cleanup
    var pushTimers = [];

    // Sample buffers for chunk-based pushing
    var buffers = {
        eda: [],
        temperature: [],
        pulse: [],
        respiration: [],
        emg: []
    };

    // ========================================================================
    // Step 1: Show the device IP address
    // ========================================================================
    // This is critical for LSL discovery across the network.
    // The user must add this IP to lsl_api.cfg on their recording PC.

    LSL.getDeviceIP().then(function(ip) {
        console.log('========================================');
        console.log('  eSense Multi-Sensor LSL Streaming');
        console.log('========================================');
        console.log('  Device IP: ' + ip);
        console.log('');
        console.log('  Add to lsl_api.cfg on your PC:');
        console.log('  [lab]');
        console.log('  KnownPeers = {' + ip + '}');
        console.log('========================================');

        // Display in the app UI if an element exists
        var ipDisplay = document.getElementById('device-ip');
        if (ipDisplay) {
            ipDisplay.textContent = ip;
        }
    }).catch(function(err) {
        console.warn('[Multi] Could not get device IP:', err);
        console.warn('[Multi] LSL discovery may not work across subnets without KnownPeers.');
    });

    // ========================================================================
    // Step 2: Create all 5 outlets in parallel
    // ========================================================================

    var outletPromises = [
        // --- EDA Outlet ---
        LSL.createOutlet({
            name: 'eSense_EDA',
            type: 'EDA',
            channelCount: 1,
            sampleRate: SAMPLE_RATE,
            channelFormat: 'float32',
            sourceId: 'esense-eda-multi',
            metadata: {
                manufacturer: 'Mindfield Biosystems',
                device: 'eSense EDA',
                channels: [
                    { label: 'EDA', unit: 'microsiemens', type: 'EDA' }
                ]
            }
        }).then(function(id) {
            outlets.eda = id;
            console.log('[Multi] EDA outlet created: ' + id);
            return id;
        }),

        // --- Temperature Outlet ---
        LSL.createOutlet({
            name: 'eSense_Temperature',
            type: 'Temperature',
            channelCount: 1,
            sampleRate: SAMPLE_RATE,
            channelFormat: 'float32',
            sourceId: 'esense-temp-multi',
            metadata: {
                manufacturer: 'Mindfield Biosystems',
                device: 'eSense Temperature',
                channels: [
                    { label: 'Temperature', unit: 'degrees Celsius', type: 'Temperature' }
                ]
            }
        }).then(function(id) {
            outlets.temperature = id;
            console.log('[Multi] Temperature outlet created: ' + id);
            return id;
        }),

        // --- Pulse Outlet (2 channels) ---
        LSL.createOutlet({
            name: 'eSense_Pulse',
            type: 'PPG',
            channelCount: 2,
            sampleRate: SAMPLE_RATE,
            channelFormat: 'float32',
            sourceId: 'esense-pulse-multi',
            metadata: {
                manufacturer: 'Mindfield Biosystems',
                device: 'eSense Pulse',
                channels: [
                    { label: 'BPM', unit: 'bpm', type: 'PPG' },
                    { label: 'IBI', unit: 'milliseconds', type: 'PPG' }
                ]
            }
        }).then(function(id) {
            outlets.pulse = id;
            console.log('[Multi] Pulse outlet created: ' + id);
            return id;
        }),

        // --- Respiration Outlet ---
        LSL.createOutlet({
            name: 'eSense_Respiration',
            type: 'Respiration',
            channelCount: 1,
            sampleRate: SAMPLE_RATE,
            channelFormat: 'float32',
            sourceId: 'esense-resp-multi',
            metadata: {
                manufacturer: 'Mindfield Biosystems',
                device: 'eSense Respiration',
                channels: [
                    { label: 'RespiratoryAmplitude', unit: 'RA', type: 'Respiration' }
                ]
            }
        }).then(function(id) {
            outlets.respiration = id;
            console.log('[Multi] Respiration outlet created: ' + id);
            return id;
        }),

        // --- EMG Outlet (2 channels: two independent electrodes) ---
        LSL.createOutlet({
            name: 'eSense_Muscle',
            type: 'EMG',
            channelCount: 2,
            sampleRate: SAMPLE_RATE,
            channelFormat: 'float32',
            sourceId: 'esense-muscle-multi',
            metadata: {
                manufacturer: 'Mindfield Biosystems',
                device: 'eSense Muscle',
                channels: [
                    { label: 'CH1', unit: 'microvolts', type: 'EMG' },
                    { label: 'CH2', unit: 'microvolts', type: 'EMG' }
                ]
            }
        }).then(function(id) {
            outlets.emg = id;
            console.log('[Multi] EMG outlet created: ' + id);
            return id;
        })
    ];

    // Wait for all outlets to be created, then start streaming
    Promise.all(outletPromises).then(function() {
        console.log('[Multi] All 5 outlets created successfully');
        startAllStreams();
    }).catch(function(err) {
        console.error('[Multi] Failed to create one or more outlets:', err);
        console.error('[Multi] Cleaning up any outlets that were created...');
        cleanupAll();
    });

    // ========================================================================
    // Step 3: Start streaming all sensors in parallel
    // ========================================================================

    /**
     * Start push loops for all 5 sensors.
     * Uses pushChunk for efficiency: collects CHUNK_SIZE samples in a buffer,
     * then sends them as a single chunk. This reduces the number of native
     * bridge calls from 5/second to 1/second per outlet.
     */
    function startAllStreams() {
        console.log('[Multi] Starting all streams at ' + SAMPLE_RATE + ' Hz (chunk size: ' + CHUNK_SIZE + ')');

        // Collect samples at SAMPLE_RATE Hz into buffers
        var sampleTimer = setInterval(function() {
            var elapsed = (Date.now() - streamStartTime) / 1000;

            // Generate and buffer one sample for each sensor
            buffers.eda.push([simulateEDA()]);
            buffers.temperature.push([simulateTemperature()]);

            var pulse = simulatePulse();
            buffers.pulse.push([pulse.bpm, pulse.ibi]);

            buffers.respiration.push([simulateRespiration(elapsed)]);

            var emg = simulateEMG(elapsed);
            buffers.emg.push([emg.ch1, emg.ch2]);

            // When buffer is full, push chunk and clear
            if (buffers.eda.length >= CHUNK_SIZE) {
                flushAllBuffers();
            }
        }, PUSH_INTERVAL);

        pushTimers.push(sampleTimer);
    }

    /**
     * Flush all sample buffers by pushing chunks to their respective outlets.
     * pushChunk is more efficient than calling pushSample repeatedly.
     */
    function flushAllBuffers() {
        var sensorNames = ['eda', 'temperature', 'pulse', 'respiration', 'emg'];

        sensorNames.forEach(function(sensor) {
            var outletId = outlets[sensor];
            var buffer = buffers[sensor];

            if (outletId && buffer.length > 0) {
                // Copy and clear buffer before async push
                var chunk = buffer.slice();
                buffers[sensor] = [];

                LSL.pushChunk(outletId, chunk).catch(function(err) {
                    console.error('[Multi] ' + sensor + ' pushChunk failed:', err);
                });
            }
        });
    }

    // ========================================================================
    // Simulation functions
    // ========================================================================

    var streamStartTime = Date.now();

    // --- EDA Simulation ---
    var currentEDA = 5.0;
    function simulateEDA() {
        var step = (Math.random() - 0.5) * 0.3;
        currentEDA += step;
        if (currentEDA < 0.5) currentEDA = 0.5;
        if (currentEDA > 20.0) currentEDA = 20.0;
        return Math.round(currentEDA * 100) / 100;
    }

    // --- Temperature Simulation ---
    var currentTemp = 33.5;
    function simulateTemperature() {
        var step = (Math.random() - 0.5) * 0.05;
        currentTemp += step;
        if (currentTemp < 30.0) currentTemp = 30.0;
        if (currentTemp > 37.0) currentTemp = 37.0;
        return Math.round(currentTemp * 100) / 100;
    }

    // --- Pulse Simulation ---
    var currentBPM = 72;
    function simulatePulse() {
        var drift = (Math.random() - 0.5) * 2.0;
        var regression = (72 - currentBPM) * 0.02;
        currentBPM += drift + regression;
        currentBPM += Math.sin(Date.now() / 4000) * 1.5;
        if (currentBPM < 60) currentBPM = 60;
        if (currentBPM > 100) currentBPM = 100;
        var bpm = Math.round(currentBPM * 10) / 10;
        var ibi = Math.round(60000 / bpm * 10) / 10;
        return { bpm: bpm, ibi: ibi };
    }

    // --- Respiration Simulation ---
    function simulateRespiration(elapsed) {
        var breathFreq = 15 / 60; // 15 breaths/min
        var signal = Math.sin(2 * Math.PI * breathFreq * elapsed);
        signal *= 0.9 + 0.1 * Math.sin(2 * Math.PI * 0.02 * elapsed);
        signal += (Math.random() - 0.5) * 0.05;
        return Math.round(signal * 10000) / 10000;
    }

    // --- EMG Simulation (2 independent electrodes) ---
    function simulateEMG(elapsed) {
        var contraction1 = (Math.sin(2 * Math.PI * elapsed / 6) + 1) / 2;
        var ch1 = 15 + contraction1 * 200 + (Math.random() - 0.5) * 10;
        ch1 = Math.max(5, Math.min(500, ch1));
        ch1 = Math.round(ch1 * 10) / 10;
        var contraction2 = (Math.sin(2 * Math.PI * elapsed / 6 + 0.5) + 1) / 2;
        var ch2 = 12 + contraction2 * 180 + (Math.random() - 0.5) * 10;
        ch2 = Math.max(5, Math.min(500, ch2));
        ch2 = Math.round(ch2 * 10) / 10;
        return { ch1: ch1, ch2: ch2 };
    }

    // ========================================================================
    // Step 4: Cleanup
    // ========================================================================

    /**
     * Stop all streams and destroy all outlets.
     * Uses destroyAllOutlets() for efficient bulk cleanup.
     */
    function cleanupAll() {
        // Stop all push timers
        pushTimers.forEach(function(timer) {
            clearInterval(timer);
        });
        pushTimers = [];
        console.log('[Multi] All push timers stopped');

        // Clear all buffers
        var sensorNames = ['eda', 'temperature', 'pulse', 'respiration', 'emg'];
        sensorNames.forEach(function(sensor) {
            buffers[sensor] = [];
        });

        // Destroy all outlets in one call (more efficient than destroying individually)
        LSL.destroyAllOutlets().then(function() {
            console.log('[Multi] All outlets destroyed');
            outlets.eda = null;
            outlets.temperature = null;
            outlets.pulse = null;
            outlets.respiration = null;
            outlets.emg = null;
        }).catch(function(err) {
            console.error('[Multi] Failed to destroy outlets:', err);
        });
    }

    // Clean up when the app pauses or exits
    document.addEventListener('pause', cleanupAll, false);

    // Expose cleanup function globally
    window.stopAllStreams = cleanupAll;

    // Also expose individual outlet info for debugging
    window.getMultiSensorStatus = function() {
        return {
            outlets: outlets,
            timersActive: pushTimers.length,
            bufferSizes: {
                eda: buffers.eda.length,
                temperature: buffers.temperature.length,
                pulse: buffers.pulse.length,
                respiration: buffers.respiration.length,
                emg: buffers.emg.length
            }
        };
    };

}, false);
