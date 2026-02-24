/**
 * eSense EMG (Electromyography) - LSL Streaming Example
 *
 * Streams simulated EMG data over LSL at 5 Hz with 2 channels:
 *   Channel 0: RMS Amplitude (microvolts, uV) - typically 5-500 uV
 *   Channel 1: Median Frequency (Hz) - typically 50-150 Hz
 *
 * RMS amplitude reflects muscle tension level.
 * Median frequency shifts with fatigue (decreases as muscle fatigues).
 *
 * Usage:
 *   Include this file in your Cordova app after cordova.js.
 *   The stream will appear as "eSense_EMG" in LabRecorder.
 *   Add the device IP (shown in console) as a KnownPeer in lsl_api.cfg on your PC.
 *
 * Copyright (c) 2025 Mindfield Biosystems Ltd.
 */

document.addEventListener('deviceready', function() {

    // --- Configuration ---
    var STREAM_NAME  = 'eSense_EMG';
    var SAMPLE_RATE  = 5;           // 5 Hz
    var PUSH_INTERVAL = 1000 / SAMPLE_RATE; // 200 ms

    // Simulation parameters
    var RMS_MIN = 5;      // Minimum RMS amplitude in uV (resting muscle)
    var RMS_MAX = 500;    // Maximum RMS amplitude in uV (strong contraction)
    var FREQ_MIN = 50;    // Minimum median frequency in Hz
    var FREQ_MAX = 150;   // Maximum median frequency in Hz

    var outletId = null;
    var pushTimer = null;

    // --- Step 1: Show the device IP for KnownPeers configuration ---
    LSL.getDeviceIP().then(function(ip) {
        console.log('[EMG] Device IP: ' + ip);
        console.log('[EMG] Add to lsl_api.cfg: [lab] KnownPeers = {' + ip + '}');
    }).catch(function(err) {
        console.warn('[EMG] Could not get device IP:', err);
    });

    // --- Step 2: Create the LSL outlet with 2 channels ---
    LSL.createOutlet({
        name: STREAM_NAME,
        type: 'EMG',
        channelCount: 2,
        sampleRate: SAMPLE_RATE,
        channelFormat: 'float32',
        sourceId: 'esense-emg-001',
        metadata: {
            manufacturer: 'Mindfield Biosystems',
            device: 'eSense EMG',
            channels: [
                { label: 'RMS', unit: 'microvolts', type: 'EMG' },
                { label: 'MedianFrequency', unit: 'Hz', type: 'EMG' }
            ]
        }
    }).then(function(id) {
        outletId = id;
        console.log('[EMG] Outlet created: ' + outletId);

        // --- Step 3: Start pushing EMG samples ---
        startStreaming();
    }).catch(function(err) {
        console.error('[EMG] Failed to create outlet:', err);
    });

    /**
     * Start the sample push loop.
     * Pushes one 2-channel sample every 200 ms (5 Hz).
     * Each sample contains [RMS amplitude, Median frequency].
     */
    function startStreaming() {
        console.log('[EMG] Streaming started at ' + SAMPLE_RATE + ' Hz (2 channels: RMS, MedianFreq)');

        pushTimer = setInterval(function() {
            var emg = simulateEMG();

            // Push 2-channel sample: [RMS, MedianFrequency]
            LSL.pushSample(outletId, [emg.rms, emg.medianFreq]).catch(function(err) {
                console.error('[EMG] Push failed:', err);
            });
        }, PUSH_INTERVAL);
    }

    /**
     * Simulate EMG RMS amplitude and median frequency.
     *
     * Simulates periodic muscle contractions:
     * - RMS rises during contraction, falls during relaxation
     * - Median frequency drops slightly as muscle fatigues (higher RMS = more fatigue)
     *
     * Real data would come from surface EMG electrodes via the eSense sensor.
     */
    var startTime = Date.now();
    var currentRMS = 20; // Starting RMS in uV (light tension)
    function simulateEMG() {
        var elapsed = (Date.now() - startTime) / 1000;

        // Simulate periodic contraction/relaxation cycles (~6 second cycle)
        var contractionPhase = (Math.sin(2 * Math.PI * elapsed / 6) + 1) / 2; // 0..1

        // RMS amplitude: baseline + contraction component + noise
        var baseline = 15;
        var contractionAmplitude = 200;
        var rms = baseline + contractionPhase * contractionAmplitude;
        rms += (Math.random() - 0.5) * 10; // sensor noise

        // Clamp
        if (rms < RMS_MIN) rms = RMS_MIN;
        if (rms > RMS_MAX) rms = RMS_MAX;
        rms = Math.round(rms * 10) / 10;

        // Median frequency: inversely related to fatigue/RMS level
        // Higher contraction -> slight frequency drop (fatigue effect)
        var baseFreq = 100;
        var fatigueShift = -contractionPhase * 20; // drops up to 20 Hz under load
        var medianFreq = baseFreq + fatigueShift + (Math.random() - 0.5) * 5;

        // Clamp
        if (medianFreq < FREQ_MIN) medianFreq = FREQ_MIN;
        if (medianFreq > FREQ_MAX) medianFreq = FREQ_MAX;
        medianFreq = Math.round(medianFreq * 10) / 10;

        return { rms: rms, medianFreq: medianFreq };
    }

    /**
     * Cleanup: stop streaming and destroy the outlet.
     */
    function stopStreaming() {
        if (pushTimer !== null) {
            clearInterval(pushTimer);
            pushTimer = null;
            console.log('[EMG] Streaming stopped');
        }

        if (outletId !== null) {
            LSL.destroyOutlet(outletId).then(function() {
                console.log('[EMG] Outlet destroyed');
                outletId = null;
            }).catch(function(err) {
                console.error('[EMG] Failed to destroy outlet:', err);
            });
        }
    }

    // --- Step 4: Clean up on app pause ---
    document.addEventListener('pause', stopStreaming, false);

    // Expose for manual cleanup
    window.stopEMGStream = stopStreaming;

}, false);
