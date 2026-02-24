/**
 * cordova-plugin-lsl - Integration Test: Multi-Outlet Simultaneous Streams
 *
 * Runs on a real device inside a Cordova test app using cordova-plugin-test-framework.
 * Tests creating and managing 5 simultaneous LSL outlets matching the eSense sensor suite:
 *   - EDA (1ch, float32, 5Hz)
 *   - Temperature (1ch, float32, 5Hz)
 *   - Pulse/PPG (2ch, float32, 5Hz)
 *   - Respiration (1ch, float32, 5Hz)
 *   - EMG (2ch, float32, 5Hz)
 *
 * Prerequisites:
 *   - cordova-plugin-lsl installed in the test app
 *   - cordova-plugin-test-framework installed
 *   - Device has Wi-Fi enabled (LSL requires network)
 *
 * Copyright (c) 2025 Mindfield Biosystems Ltd.
 * Licensed under the MIT License.
 */

exports.defineAutoTests = function (it, expect, pending) {

    // ----------------------------------------------------------------
    // Stream configurations for all 5 eSense sensor types
    // ----------------------------------------------------------------
    var streamConfigs = {
        eda: {
            name: 'eSense_EDA',
            type: 'EDA',
            channelCount: 1,
            sampleRate: 5,
            channelFormat: 'float32',
            sourceId: 'esense-eda-test',
            metadata: {
                manufacturer: 'Mindfield Biosystems',
                device: 'eSense EDA',
                channels: [
                    { label: 'EDA', unit: 'microsiemens', type: 'EDA' }
                ]
            }
        },
        temperature: {
            name: 'eSense_Temperature',
            type: 'Temperature',
            channelCount: 1,
            sampleRate: 5,
            channelFormat: 'float32',
            sourceId: 'esense-temp-test',
            metadata: {
                manufacturer: 'Mindfield Biosystems',
                device: 'eSense Temperature',
                channels: [
                    { label: 'Temperature', unit: 'celsius', type: 'Temperature' }
                ]
            }
        },
        pulse: {
            name: 'eSense_Pulse',
            type: 'PPG',
            channelCount: 2,
            sampleRate: 5,
            channelFormat: 'float32',
            sourceId: 'esense-pulse-test',
            metadata: {
                manufacturer: 'Mindfield Biosystems',
                device: 'eSense Pulse',
                channels: [
                    { label: 'BPM', unit: 'bpm', type: 'PPG' },
                    { label: 'IBI', unit: 'ms', type: 'PPG' }
                ]
            }
        },
        respiration: {
            name: 'eSense_Respiration',
            type: 'Respiration',
            channelCount: 1,
            sampleRate: 5,
            channelFormat: 'float32',
            sourceId: 'esense-resp-test',
            metadata: {
                manufacturer: 'Mindfield Biosystems',
                device: 'eSense Respiration',
                channels: [
                    { label: 'Respiration', unit: 'breaths_per_min', type: 'Respiration' }
                ]
            }
        },
        emg: {
            name: 'eSense_EMG',
            type: 'EMG',
            channelCount: 2,
            sampleRate: 5,
            channelFormat: 'float32',
            sourceId: 'esense-emg-test',
            metadata: {
                manufacturer: 'Mindfield Biosystems',
                device: 'eSense EMG',
                channels: [
                    { label: 'RMS', unit: 'uV', type: 'EMG' },
                    { label: 'MedianFreq', unit: 'Hz', type: 'EMG' }
                ]
            }
        }
    };

    // Store outlet IDs for cross-test access
    var outletIds = {};

    // ----------------------------------------------------------------
    // Cleanup helper
    // ----------------------------------------------------------------
    function cleanupAll(done) {
        LSL.destroyAllOutlets().then(function () {
            outletIds = {};
            done();
        }).catch(function () {
            outletIds = {};
            done();
        });
    }

    // ----------------------------------------------------------------
    // Test: Create all 5 outlets simultaneously
    // ----------------------------------------------------------------
    it('should create 5 outlets simultaneously', function (done) {
        var names = ['eda', 'temperature', 'pulse', 'respiration', 'emg'];
        var promises = names.map(function (name) {
            return LSL.createOutlet(streamConfigs[name]);
        });

        Promise.all(promises).then(function (ids) {
            expect(ids.length).toBe(5);

            for (var i = 0; i < ids.length; i++) {
                expect(typeof ids[i]).toBe('string');
                expect(ids[i].indexOf('outlet_')).toBe(0);
                outletIds[names[i]] = ids[i];
            }

            // All 5 IDs should be unique
            var uniqueIds = ids.filter(function (id, index, self) {
                return self.indexOf(id) === index;
            });
            expect(uniqueIds.length).toBe(5);

            done();
        }).catch(function (err) {
            expect(err).toBeUndefined();
            cleanupAll(done);
        });
    });

    // ----------------------------------------------------------------
    // Test: Push samples to all 5 outlets
    // ----------------------------------------------------------------
    it('should push samples to all 5 outlets', function (done) {
        // If previous test failed and outlets were not created, skip
        if (Object.keys(outletIds).length !== 5) {
            pending('Skipped: outlets not created from previous test');
            return;
        }

        // Sample data matching each stream's channel count
        var sampleData = {
            eda: [3.75],                    // 1ch: microsiemens
            temperature: [32.5],            // 1ch: celsius
            pulse: [72, 833],               // 2ch: bpm, ibi_ms
            respiration: [16.0],            // 1ch: breaths per minute
            emg: [45.2, 125.0]             // 2ch: rms_uV, median_freq
        };

        var names = Object.keys(sampleData);
        var promises = names.map(function (name) {
            return LSL.pushSample(outletIds[name], sampleData[name]);
        });

        Promise.all(promises).then(function () {
            // All pushes succeeded
            expect(true).toBe(true);
            done();
        }).catch(function (err) {
            expect(err).toBeUndefined();
            done();
        });
    });

    // ----------------------------------------------------------------
    // Test: Push chunks to all 5 outlets
    // ----------------------------------------------------------------
    it('should push chunks to all 5 outlets', function (done) {
        if (Object.keys(outletIds).length !== 5) {
            pending('Skipped: outlets not created');
            return;
        }

        // 5 samples per chunk for each stream
        var chunkData = {
            eda: [[1.0], [2.0], [3.0], [4.0], [5.0]],
            temperature: [[30.0], [30.5], [31.0], [31.5], [32.0]],
            pulse: [[70, 857], [71, 845], [72, 833], [73, 822], [74, 811]],
            respiration: [[14.0], [14.5], [15.0], [15.5], [16.0]],
            emg: [[40.0, 100.0], [42.0, 110.0], [44.0, 120.0], [46.0, 130.0], [48.0, 140.0]]
        };

        var names = Object.keys(chunkData);
        var promises = names.map(function (name) {
            return LSL.pushChunk(outletIds[name], chunkData[name]);
        });

        Promise.all(promises).then(function () {
            expect(true).toBe(true);
            done();
        }).catch(function (err) {
            expect(err).toBeUndefined();
            done();
        });
    });

    // ----------------------------------------------------------------
    // Test: All outlets report no consumers (standalone device)
    // ----------------------------------------------------------------
    it('all 5 outlets should report no consumers', function (done) {
        if (Object.keys(outletIds).length !== 5) {
            pending('Skipped: outlets not created');
            return;
        }

        var names = Object.keys(outletIds);
        var promises = names.map(function (name) {
            return LSL.hasConsumers(outletIds[name]);
        });

        Promise.all(promises).then(function (results) {
            expect(results.length).toBe(5);
            for (var i = 0; i < results.length; i++) {
                expect(results[i]).toBe(false);
            }
            done();
        }).catch(function (err) {
            expect(err).toBeUndefined();
            done();
        });
    });

    // ----------------------------------------------------------------
    // Test: Sustained multi-stream push (simulate 2 seconds at 5Hz)
    // ----------------------------------------------------------------
    it('should handle sustained pushes across all 5 outlets (10 samples each)', function (done) {
        if (Object.keys(outletIds).length !== 5) {
            pending('Skipped: outlets not created');
            return;
        }

        var samplesPerStream = 10;
        var pushCount = 0;
        var expectedTotal = 5 * samplesPerStream;

        function generateSample(name, index) {
            switch (name) {
                case 'eda': return [2.0 + index * 0.1];
                case 'temperature': return [30.0 + index * 0.05];
                case 'pulse': return [70 + index, 857 - index * 5];
                case 'respiration': return [14.0 + index * 0.2];
                case 'emg': return [40.0 + index * 0.5, 100.0 + index * 2];
                default: return [0];
            }
        }

        var names = Object.keys(outletIds);
        var allPushes = [];

        for (var s = 0; s < samplesPerStream; s++) {
            for (var n = 0; n < names.length; n++) {
                (function (name, sampleIndex) {
                    allPushes.push(function () {
                        return LSL.pushSample(outletIds[name], generateSample(name, sampleIndex));
                    });
                })(names[n], s);
            }
        }

        // Execute all pushes sequentially to avoid overwhelming the native queue
        var chain = Promise.resolve();
        allPushes.forEach(function (pushFn) {
            chain = chain.then(function () {
                pushCount++;
                return pushFn();
            });
        });

        chain.then(function () {
            expect(pushCount).toBe(expectedTotal);
            done();
        }).catch(function (err) {
            expect(err).toBeUndefined();
            done();
        });
    });

    // ----------------------------------------------------------------
    // Test: destroyAllOutlets cleans up all 5 outlets
    // ----------------------------------------------------------------
    it('destroyAllOutlets should destroy all 5 outlets', function (done) {
        if (Object.keys(outletIds).length !== 5) {
            pending('Skipped: outlets not created');
            return;
        }

        var savedIds = {};
        Object.keys(outletIds).forEach(function (key) {
            savedIds[key] = outletIds[key];
        });

        LSL.destroyAllOutlets().then(function () {
            outletIds = {};
            // Verify all outlets are gone by trying to push to each
            var names = Object.keys(savedIds);
            var verifyPromises = names.map(function (name) {
                return LSL.pushSample(savedIds[name], [0])
                    .then(function () {
                        // Should NOT succeed
                        return { name: name, alive: true };
                    })
                    .catch(function (err) {
                        // Expected: outlet is destroyed
                        return { name: name, alive: false, error: err };
                    });
            });

            return Promise.all(verifyPromises);
        }).then(function (results) {
            for (var i = 0; i < results.length; i++) {
                expect(results[i].alive).toBe(false);
            }
            done();
        }).catch(function (err) {
            expect(err).toBeUndefined();
            cleanupAll(done);
        });
    });

    // ----------------------------------------------------------------
    // Test: Create outlets again after destroyAllOutlets (re-creation)
    // ----------------------------------------------------------------
    it('should create new outlets after destroyAllOutlets', function (done) {
        // Create 2 outlets to verify the plugin is still functional
        var promises = [
            LSL.createOutlet(streamConfigs.eda),
            LSL.createOutlet(streamConfigs.temperature)
        ];

        Promise.all(promises).then(function (ids) {
            expect(ids.length).toBe(2);
            expect(typeof ids[0]).toBe('string');
            expect(typeof ids[1]).toBe('string');
            expect(ids[0]).not.toBe(ids[1]);

            // Clean up
            return LSL.destroyAllOutlets();
        }).then(function () {
            done();
        }).catch(function (err) {
            expect(err).toBeUndefined();
            cleanupAll(done);
        });
    });

    // ----------------------------------------------------------------
    // Cleanup
    // ----------------------------------------------------------------
    it('cleanup: destroyAllOutlets after multi-outlet tests', function (done) {
        cleanupAll(done);
    });
};
