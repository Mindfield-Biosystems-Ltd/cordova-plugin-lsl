/**
 * eSense Pulse (PPG) - LSL Streaming Example
 *
 * Streams simulated pulse/PPG data over LSL at 5 Hz with 2 channels:
 *   Channel 0: BPM (beats per minute) - typically 60-100 bpm at rest
 *   Channel 1: IBI (inter-beat interval in milliseconds) - typically 600-1000 ms
 *
 * BPM and IBI are inversely related: IBI = 60000 / BPM
 *
 * Usage:
 *   Include this file in your Cordova app after cordova.js.
 *   The stream will appear as "eSense_Pulse" in LabRecorder.
 *   Add the device IP (shown in console) as a KnownPeer in lsl_api.cfg on your PC.
 *
 * Copyright (c) 2025 Mindfield Biosystems Ltd.
 */

document.addEventListener('deviceready', function() {

    // --- Configuration ---
    var STREAM_NAME  = 'eSense_Pulse';
    var SAMPLE_RATE  = 5;           // 5 Hz
    var PUSH_INTERVAL = 1000 / SAMPLE_RATE; // 200 ms

    // Simulation parameters
    var BPM_MIN = 60;    // Minimum heart rate (bpm)
    var BPM_MAX = 100;   // Maximum heart rate (bpm)

    var outletId = null;
    var pushTimer = null;

    // --- Step 1: Show the device IP for KnownPeers configuration ---
    LSL.getDeviceIP().then(function(ip) {
        console.log('[Pulse] Device IP: ' + ip);
        console.log('[Pulse] Add to lsl_api.cfg: [lab] KnownPeers = {' + ip + '}');
    }).catch(function(err) {
        console.warn('[Pulse] Could not get device IP:', err);
    });

    // --- Step 2: Create the LSL outlet with 2 channels ---
    LSL.createOutlet({
        name: STREAM_NAME,
        type: 'PPG',
        channelCount: 2,
        sampleRate: SAMPLE_RATE,
        channelFormat: 'float32',
        sourceId: 'esense-pulse-001',
        metadata: {
            manufacturer: 'Mindfield Biosystems',
            device: 'eSense Pulse',
            channels: [
                { label: 'BPM', unit: 'bpm', type: 'PPG' },
                { label: 'IBI', unit: 'milliseconds', type: 'PPG' }
            ]
        }
    }).then(function(id) {
        outletId = id;
        console.log('[Pulse] Outlet created: ' + outletId);

        // --- Step 3: Start pushing pulse samples ---
        startStreaming();
    }).catch(function(err) {
        console.error('[Pulse] Failed to create outlet:', err);
    });

    /**
     * Start the sample push loop.
     * Pushes one 2-channel sample every 200 ms (5 Hz).
     * Each sample contains [BPM, IBI].
     */
    function startStreaming() {
        console.log('[Pulse] Streaming started at ' + SAMPLE_RATE + ' Hz (2 channels: BPM, IBI)');

        pushTimer = setInterval(function() {
            var pulse = simulatePulse();

            // Push 2-channel sample: [BPM, IBI]
            LSL.pushSample(outletId, [pulse.bpm, pulse.ibi]).catch(function(err) {
                console.error('[Pulse] Push failed:', err);
            });
        }, PUSH_INTERVAL);
    }

    /**
     * Simulate heart rate with natural variability (heart rate variability).
     * BPM drifts slowly; IBI is derived as 60000 / BPM.
     * Real data would come from the eSense Pulse PPG sensor.
     */
    var currentBPM = 72; // Starting heart rate (typical resting)
    function simulatePulse() {
        // Random walk with slight regression to mean
        var meanBPM = 72;
        var drift = (Math.random() - 0.5) * 2.0;
        var regression = (meanBPM - currentBPM) * 0.02;
        currentBPM += drift + regression;

        // Add small HRV-like fluctuation
        currentBPM += Math.sin(Date.now() / 4000) * 1.5;

        // Clamp to valid range
        if (currentBPM < BPM_MIN) currentBPM = BPM_MIN;
        if (currentBPM > BPM_MAX) currentBPM = BPM_MAX;

        var bpm = Math.round(currentBPM * 10) / 10;
        // IBI (inter-beat interval) is inversely related to BPM
        var ibi = Math.round(60000 / bpm * 10) / 10;

        return { bpm: bpm, ibi: ibi };
    }

    /**
     * Cleanup: stop streaming and destroy the outlet.
     */
    function stopStreaming() {
        if (pushTimer !== null) {
            clearInterval(pushTimer);
            pushTimer = null;
            console.log('[Pulse] Streaming stopped');
        }

        if (outletId !== null) {
            LSL.destroyOutlet(outletId).then(function() {
                console.log('[Pulse] Outlet destroyed');
                outletId = null;
            }).catch(function(err) {
                console.error('[Pulse] Failed to destroy outlet:', err);
            });
        }
    }

    // --- Step 4: Clean up on app pause ---
    document.addEventListener('pause', stopStreaming, false);

    // Expose for manual cleanup
    window.stopPulseStream = stopStreaming;

}, false);
