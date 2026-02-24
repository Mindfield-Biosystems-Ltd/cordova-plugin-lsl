/**
 * eSense Respiration - LSL Streaming Example
 *
 * Streams simulated respiration data over LSL at 5 Hz.
 * The signal represents respiratory amplitude (RA), modeled as a sinusoidal
 * breathing pattern. Normal resting breathing rate is 12-20 breaths per minute.
 *
 * Usage:
 *   Include this file in your Cordova app after cordova.js.
 *   The stream will appear as "eSense_Respiration" in LabRecorder.
 *   Add the device IP (shown in console) as a KnownPeer in lsl_api.cfg on your PC.
 *
 * Copyright (c) 2025 Mindfield Biosystems Ltd.
 */

document.addEventListener('deviceready', function() {

    // --- Configuration ---
    var STREAM_NAME  = 'eSense_Respiration';
    var SAMPLE_RATE  = 5;           // 5 Hz
    var PUSH_INTERVAL = 1000 / SAMPLE_RATE; // 200 ms

    // Simulation parameters
    var BREATHS_PER_MINUTE = 15;    // Normal resting respiratory rate
    var BREATH_FREQUENCY = BREATHS_PER_MINUTE / 60; // Hz (~0.25 Hz)

    var outletId = null;
    var pushTimer = null;

    // --- Step 1: Show the device IP for KnownPeers configuration ---
    LSL.getDeviceIP().then(function(ip) {
        console.log('[Resp] Device IP: ' + ip);
        console.log('[Resp] Add to lsl_api.cfg: [lab] KnownPeers = {' + ip + '}');
    }).catch(function(err) {
        console.warn('[Resp] Could not get device IP:', err);
    });

    // --- Step 2: Create the LSL outlet ---
    LSL.createOutlet({
        name: STREAM_NAME,
        type: 'Respiration',
        channelCount: 1,
        sampleRate: SAMPLE_RATE,
        channelFormat: 'float32',
        sourceId: 'esense-resp-001',
        metadata: {
            manufacturer: 'Mindfield Biosystems',
            device: 'eSense Respiration',
            channels: [
                { label: 'RespiratoryAmplitude', unit: 'RA', type: 'Respiration' }
            ]
        }
    }).then(function(id) {
        outletId = id;
        console.log('[Resp] Outlet created: ' + outletId);

        // --- Step 3: Start pushing respiration samples ---
        startStreaming();
    }).catch(function(err) {
        console.error('[Resp] Failed to create outlet:', err);
    });

    /**
     * Start the sample push loop.
     * Pushes one simulated respiration sample every 200 ms (5 Hz).
     */
    function startStreaming() {
        console.log('[Resp] Streaming started at ' + SAMPLE_RATE + ' Hz');
        console.log('[Resp] Simulated breathing rate: ' + BREATHS_PER_MINUTE + ' breaths/min');

        pushTimer = setInterval(function() {
            var respValue = simulateRespiration();

            // Push single-channel sample
            LSL.pushSample(outletId, [respValue]).catch(function(err) {
                console.error('[Resp] Push failed:', err);
            });
        }, PUSH_INTERVAL);
    }

    /**
     * Simulate a sinusoidal breathing pattern.
     *
     * The signal oscillates between -1.0 (full exhale) and +1.0 (full inhale)
     * at the configured breathing rate. Small noise is added for realism.
     *
     * Real data would come from a stretch sensor or nasal thermistor.
     */
    var startTime = Date.now();
    function simulateRespiration() {
        var elapsed = (Date.now() - startTime) / 1000; // seconds

        // Base sinusoidal breathing pattern
        // sin(2 * PI * frequency * time) produces one full cycle per breath
        var breathSignal = Math.sin(2 * Math.PI * BREATH_FREQUENCY * elapsed);

        // Add slight amplitude variation (breathing depth varies naturally)
        var amplitudeModulation = 0.9 + 0.1 * Math.sin(2 * Math.PI * 0.02 * elapsed);
        breathSignal *= amplitudeModulation;

        // Add small sensor noise
        var noise = (Math.random() - 0.5) * 0.05;
        breathSignal += noise;

        // Round to 4 decimal places
        return Math.round(breathSignal * 10000) / 10000;
    }

    /**
     * Cleanup: stop streaming and destroy the outlet.
     */
    function stopStreaming() {
        if (pushTimer !== null) {
            clearInterval(pushTimer);
            pushTimer = null;
            console.log('[Resp] Streaming stopped');
        }

        if (outletId !== null) {
            LSL.destroyOutlet(outletId).then(function() {
                console.log('[Resp] Outlet destroyed');
                outletId = null;
            }).catch(function(err) {
                console.error('[Resp] Failed to destroy outlet:', err);
            });
        }
    }

    // --- Step 4: Clean up on app pause ---
    document.addEventListener('pause', stopStreaming, false);

    // Expose for manual cleanup
    window.stopRespirationStream = stopStreaming;

}, false);
