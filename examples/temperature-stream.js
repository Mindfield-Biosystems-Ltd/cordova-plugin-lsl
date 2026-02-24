/**
 * eSense Temperature - LSL Streaming Example
 *
 * Streams simulated skin temperature data over LSL at 5 Hz.
 * Skin temperature typically ranges from 30 degC (cold/stressed)
 * to 37 degC (warm/relaxed) when measured at the fingertip.
 *
 * Usage:
 *   Include this file in your Cordova app after cordova.js.
 *   The stream will appear as "eSense_Temperature" in LabRecorder.
 *   Add the device IP (shown in console) as a KnownPeer in lsl_api.cfg on your PC.
 *
 * Copyright (c) 2025 Mindfield Biosystems Ltd.
 */

document.addEventListener('deviceready', function() {

    // --- Configuration ---
    var STREAM_NAME  = 'eSense_Temperature';
    var SAMPLE_RATE  = 5;           // 5 Hz
    var PUSH_INTERVAL = 1000 / SAMPLE_RATE; // 200 ms

    // Simulation parameters
    var TEMP_MIN = 30.0;  // Minimum skin temperature in degC
    var TEMP_MAX = 37.0;  // Maximum skin temperature in degC

    var outletId = null;
    var pushTimer = null;

    // --- Step 1: Show the device IP for KnownPeers configuration ---
    LSL.getDeviceIP().then(function(ip) {
        console.log('[Temp] Device IP: ' + ip);
        console.log('[Temp] Add to lsl_api.cfg: [lab] KnownPeers = {' + ip + '}');
    }).catch(function(err) {
        console.warn('[Temp] Could not get device IP:', err);
    });

    // --- Step 2: Create the LSL outlet ---
    LSL.createOutlet({
        name: STREAM_NAME,
        type: 'Temperature',
        channelCount: 1,
        sampleRate: SAMPLE_RATE,
        channelFormat: 'float32',
        sourceId: 'esense-temp-001',
        metadata: {
            manufacturer: 'Mindfield Biosystems',
            device: 'eSense Temperature',
            channels: [
                { label: 'Temperature', unit: 'degrees Celsius', type: 'Temperature' }
            ]
        }
    }).then(function(id) {
        outletId = id;
        console.log('[Temp] Outlet created: ' + outletId);

        // --- Step 3: Start pushing temperature samples ---
        startStreaming();
    }).catch(function(err) {
        console.error('[Temp] Failed to create outlet:', err);
    });

    /**
     * Start the sample push loop.
     * Pushes one simulated temperature sample every 200 ms (5 Hz).
     */
    function startStreaming() {
        console.log('[Temp] Streaming started at ' + SAMPLE_RATE + ' Hz');

        pushTimer = setInterval(function() {
            var tempValue = simulateTemperature();

            // Push single-channel sample
            LSL.pushSample(outletId, [tempValue]).catch(function(err) {
                console.error('[Temp] Push failed:', err);
            });
        }, PUSH_INTERVAL);
    }

    /**
     * Simulate skin temperature with slow drift.
     * Real data: eSense Temperature sensor provides slow-changing readings
     * as skin temperature responds gradually to arousal/relaxation.
     */
    var currentTemp = 33.5; // Starting temperature (typical resting fingertip)
    function simulateTemperature() {
        // Very slow random walk (temperature changes gradually)
        var step = (Math.random() - 0.5) * 0.05;
        currentTemp += step;

        // Clamp to valid range
        if (currentTemp < TEMP_MIN) currentTemp = TEMP_MIN;
        if (currentTemp > TEMP_MAX) currentTemp = TEMP_MAX;

        // Round to 2 decimal places (sensor precision)
        return Math.round(currentTemp * 100) / 100;
    }

    /**
     * Cleanup: stop streaming and destroy the outlet.
     */
    function stopStreaming() {
        if (pushTimer !== null) {
            clearInterval(pushTimer);
            pushTimer = null;
            console.log('[Temp] Streaming stopped');
        }

        if (outletId !== null) {
            LSL.destroyOutlet(outletId).then(function() {
                console.log('[Temp] Outlet destroyed');
                outletId = null;
            }).catch(function(err) {
                console.error('[Temp] Failed to destroy outlet:', err);
            });
        }
    }

    // --- Step 4: Clean up on app pause ---
    document.addEventListener('pause', stopStreaming, false);

    // Expose for manual cleanup
    window.stopTemperatureStream = stopStreaming;

}, false);
