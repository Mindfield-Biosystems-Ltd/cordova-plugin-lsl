/**
 * eSense EMG (Electromyography) - LSL Streaming Example
 *
 * Streams simulated EMG data over LSL at 5 Hz with 2 channels:
 *   Channel 0: CH1 - RMS amplitude (microvolts, uV)
 *   Channel 1: CH2 - RMS amplitude (microvolts, uV)
 *
 * The two channels correspond to two independent EMG electrodes
 * that can be placed on different body positions (e.g., left/right).
 *
 * Note: The eSense App allows selecting CH1 only, CH2 only, or both.
 * Adjust channelCount and metadata.channels accordingly:
 *   - Both channels: channelCount=2, channels=[CH1, CH2]
 *   - CH1 only:      channelCount=1, channels=[CH1]
 *   - CH2 only:      channelCount=1, channels=[CH2]
 *
 * Usage:
 *   Include this file in your Cordova app after cordova.js.
 *   The stream will appear as "eSense_Muscle" in LabRecorder.
 *   Add the device IP (shown in console) as a KnownPeer in lsl_api.cfg on your PC.
 *
 * Copyright (c) 2026 Mindfield Biosystems Ltd.
 */

document.addEventListener('deviceready', function() {

    // --- Configuration ---
    var STREAM_NAME  = 'eSense_Muscle';
    var SAMPLE_RATE  = 5;           // 5 Hz
    var PUSH_INTERVAL = 1000 / SAMPLE_RATE; // 200 ms

    // Simulation parameters
    var RMS_MIN = 5;      // Minimum RMS amplitude in uV (resting muscle)
    var RMS_MAX = 500;    // Maximum RMS amplitude in uV (strong contraction)

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
        sourceId: 'esense-muscle-001',
        metadata: {
            manufacturer: 'Mindfield Biosystems',
            device: 'eSense Muscle',
            channels: [
                { label: 'CH1', unit: 'microvolts', type: 'EMG' },
                { label: 'CH2', unit: 'microvolts', type: 'EMG' }
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
     * Each sample contains [CH1 RMS, CH2 RMS].
     */
    function startStreaming() {
        console.log('[EMG] Streaming started at ' + SAMPLE_RATE + ' Hz (2 channels: CH1, CH2)');

        pushTimer = setInterval(function() {
            var emg = simulateEMG();

            // Push 2-channel sample: [CH1_RMS, CH2_RMS]
            LSL.pushSample(outletId, [emg.ch1, emg.ch2]).catch(function(err) {
                console.error('[EMG] Push failed:', err);
            });
        }, PUSH_INTERVAL);
    }

    /**
     * Simulate EMG RMS amplitude for two independent channels.
     *
     * Simulates periodic muscle contractions:
     * - CH1 and CH2 have slightly different patterns (independent electrodes)
     * - Both values are RMS in microvolts
     *
     * Real data would come from surface EMG electrodes via the eSense Muscle sensor.
     */
    var startTime = Date.now();
    function simulateEMG() {
        var elapsed = (Date.now() - startTime) / 1000;

        // CH1: Simulate periodic contraction/relaxation cycles (~6 second cycle)
        var contraction1 = (Math.sin(2 * Math.PI * elapsed / 6) + 1) / 2; // 0..1
        var ch1 = 15 + contraction1 * 200;
        ch1 += (Math.random() - 0.5) * 10; // sensor noise

        // CH2: Similar pattern but slightly offset (independent electrode)
        var contraction2 = (Math.sin(2 * Math.PI * elapsed / 6 + 0.5) + 1) / 2;
        var ch2 = 12 + contraction2 * 180;
        ch2 += (Math.random() - 0.5) * 10;

        // Clamp both channels
        ch1 = Math.max(RMS_MIN, Math.min(RMS_MAX, ch1));
        ch2 = Math.max(RMS_MIN, Math.min(RMS_MAX, ch2));

        return {
            ch1: Math.round(ch1 * 10) / 10,
            ch2: Math.round(ch2 * 10) / 10
        };
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
