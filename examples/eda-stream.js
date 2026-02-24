/**
 * eSense EDA (Electrodermal Activity) - LSL Streaming Example
 *
 * Streams simulated EDA data over LSL at 5 Hz.
 * EDA measures skin conductance in microsiemens (uS), typically ranging
 * from 0.5 uS (low arousal) to 20 uS (high arousal).
 *
 * Usage:
 *   Include this file in your Cordova app after cordova.js.
 *   The stream will appear as "eSense_EDA" in LabRecorder or other LSL clients.
 *   Add the device IP (shown in console) as a KnownPeer in lsl_api.cfg on your PC.
 *
 * Copyright (c) 2025 Mindfield Biosystems Ltd.
 */

document.addEventListener('deviceready', function() {

    // --- Configuration ---
    var STREAM_NAME  = 'eSense_EDA';
    var SAMPLE_RATE  = 5;           // 5 Hz (one sample every 200 ms)
    var PUSH_INTERVAL = 1000 / SAMPLE_RATE; // 200 ms

    // Simulation parameters
    var EDA_MIN = 0.5;   // Minimum EDA in microsiemens
    var EDA_MAX = 20.0;  // Maximum EDA in microsiemens

    // Holds the outlet ID after creation
    var outletId = null;
    // Holds the setInterval handle for cleanup
    var pushTimer = null;

    // --- Step 1: Show the device IP so the user can configure KnownPeers ---
    LSL.getDeviceIP().then(function(ip) {
        console.log('[EDA] Device IP: ' + ip);
        console.log('[EDA] Add this IP to lsl_api.cfg on your PC:');
        console.log('[EDA]   [lab] KnownPeers = {' + ip + '}');

        // You could also display this in the UI:
        // document.getElementById('ip-display').textContent = ip;
    }).catch(function(err) {
        console.warn('[EDA] Could not get device IP:', err);
    });

    // --- Step 2: Create the LSL outlet ---
    LSL.createOutlet({
        name: STREAM_NAME,
        type: 'EDA',
        channelCount: 1,
        sampleRate: SAMPLE_RATE,
        channelFormat: 'float32',
        sourceId: 'esense-eda-001',
        metadata: {
            manufacturer: 'Mindfield Biosystems',
            device: 'eSense EDA',
            channels: [
                { label: 'EDA', unit: 'microsiemens', type: 'EDA' }
            ]
        }
    }).then(function(id) {
        outletId = id;
        console.log('[EDA] Outlet created: ' + outletId);

        // --- Step 3: Start pushing samples at the configured rate ---
        startStreaming();
    }).catch(function(err) {
        console.error('[EDA] Failed to create outlet:', err);
    });

    /**
     * Start the sample push loop.
     * Pushes one simulated EDA sample every 200 ms (5 Hz).
     */
    function startStreaming() {
        console.log('[EDA] Streaming started at ' + SAMPLE_RATE + ' Hz');

        pushTimer = setInterval(function() {
            // Generate a simulated EDA value with slow drift
            var edaValue = simulateEDA();

            // Push a single-channel sample (array with one element)
            LSL.pushSample(outletId, [edaValue]).catch(function(err) {
                console.error('[EDA] Push failed:', err);
            });
        }, PUSH_INTERVAL);
    }

    /**
     * Simulate EDA values with a slow random walk.
     * Real eSense data would come from the Bluetooth sensor.
     */
    var currentEDA = 5.0; // Starting value in microsiemens
    function simulateEDA() {
        // Random walk: small step up or down
        var step = (Math.random() - 0.5) * 0.3;
        currentEDA += step;

        // Clamp to valid range
        if (currentEDA < EDA_MIN) currentEDA = EDA_MIN;
        if (currentEDA > EDA_MAX) currentEDA = EDA_MAX;

        return currentEDA;
    }

    /**
     * Cleanup: stop streaming and destroy the outlet.
     * Call this when the user navigates away or the app pauses.
     */
    function stopStreaming() {
        if (pushTimer !== null) {
            clearInterval(pushTimer);
            pushTimer = null;
            console.log('[EDA] Streaming stopped');
        }

        if (outletId !== null) {
            LSL.destroyOutlet(outletId).then(function() {
                console.log('[EDA] Outlet destroyed');
                outletId = null;
            }).catch(function(err) {
                console.error('[EDA] Failed to destroy outlet:', err);
            });
        }
    }

    // --- Step 4: Clean up when the app pauses or exits ---
    document.addEventListener('pause', stopStreaming, false);

    // Expose stop function globally for manual cleanup
    window.stopEDAStream = stopStreaming;

}, false);
