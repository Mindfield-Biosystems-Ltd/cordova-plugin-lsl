/**
 * cordova-plugin-lsl - Integration Test: Outlet Lifecycle
 *
 * Runs on a real device inside a Cordova test app using cordova-plugin-test-framework.
 * Tests the full lifecycle of an LSL outlet: create, push, query, destroy.
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
    // Helper: standard EDA outlet config (1 channel, float32, 5 Hz)
    // ----------------------------------------------------------------
    var edaConfig = {
        name: 'Test_EDA',
        type: 'EDA',
        channelCount: 1,
        sampleRate: 5,
        channelFormat: 'float32',
        sourceId: 'test-lifecycle-eda',
        metadata: {
            manufacturer: 'Mindfield Biosystems',
            device: 'eSense EDA (Test)',
            channels: [
                { label: 'EDA', unit: 'microsiemens', type: 'EDA' }
            ]
        }
    };

    // Track outlets for cleanup in case a test fails mid-way
    var createdOutletIds = [];

    // Cleanup helper - destroy any outlets left over from failed tests
    function cleanupOutlets(done) {
        if (typeof LSL === 'undefined') {
            done();
            return;
        }
        LSL.destroyAllOutlets().then(function () {
            createdOutletIds = [];
            done();
        }).catch(function () {
            createdOutletIds = [];
            done();
        });
    }

    // ----------------------------------------------------------------
    // Test: LSL global object exists after deviceready
    // ----------------------------------------------------------------
    it('LSL global object should be defined', function (done) {
        expect(LSL).toBeDefined();
        expect(typeof LSL.createOutlet).toBe('function');
        expect(typeof LSL.pushSample).toBe('function');
        expect(typeof LSL.hasConsumers).toBe('function');
        expect(typeof LSL.destroyOutlet).toBe('function');
        expect(typeof LSL.destroyAllOutlets).toBe('function');
        expect(typeof LSL.getLocalClock).toBe('function');
        expect(typeof LSL.getLibraryVersion).toBe('function');
        expect(typeof LSL.getProtocolVersion).toBe('function');
        expect(typeof LSL.getDeviceIP).toBe('function');
        done();
    });

    // ----------------------------------------------------------------
    // Test: createOutlet returns a valid outlet ID
    // ----------------------------------------------------------------
    it('createOutlet should return a string outlet ID', function (done) {
        LSL.createOutlet(edaConfig).then(function (outletId) {
            expect(outletId).toBeDefined();
            expect(typeof outletId).toBe('string');
            expect(outletId.length).toBeGreaterThan(0);
            // Native returns "outlet_N" pattern
            expect(outletId.indexOf('outlet_')).toBe(0);
            createdOutletIds.push(outletId);
            return LSL.destroyOutlet(outletId);
        }).then(function () {
            createdOutletIds.pop();
            done();
        }).catch(function (err) {
            expect(err).toBeUndefined(); // Force failure with error message
            cleanupOutlets(done);
        });
    });

    // ----------------------------------------------------------------
    // Test: pushSample succeeds on a live outlet
    // ----------------------------------------------------------------
    it('pushSample should succeed with correct channel count', function (done) {
        var outletId;

        LSL.createOutlet(edaConfig).then(function (id) {
            outletId = id;
            createdOutletIds.push(id);
            // Push a single EDA sample (1 channel)
            return LSL.pushSample(outletId, [3.75]);
        }).then(function () {
            // Success - no error thrown
            expect(true).toBe(true);
            return LSL.destroyOutlet(outletId);
        }).then(function () {
            createdOutletIds.pop();
            done();
        }).catch(function (err) {
            expect(err).toBeUndefined();
            cleanupOutlets(done);
        });
    });

    // ----------------------------------------------------------------
    // Test: pushSample with explicit LSL timestamp
    // ----------------------------------------------------------------
    it('pushSample should accept an explicit LSL timestamp', function (done) {
        var outletId;

        LSL.createOutlet(edaConfig).then(function (id) {
            outletId = id;
            createdOutletIds.push(id);
            return LSL.getLocalClock();
        }).then(function (timestamp) {
            expect(typeof timestamp).toBe('number');
            expect(timestamp).toBeGreaterThan(0);
            return LSL.pushSample(outletId, [4.20], timestamp);
        }).then(function () {
            expect(true).toBe(true);
            return LSL.destroyOutlet(outletId);
        }).then(function () {
            createdOutletIds.pop();
            done();
        }).catch(function (err) {
            expect(err).toBeUndefined();
            cleanupOutlets(done);
        });
    });

    // ----------------------------------------------------------------
    // Test: pushChunk succeeds with multiple samples
    // ----------------------------------------------------------------
    it('pushChunk should push multiple samples at once', function (done) {
        var outletId;

        LSL.createOutlet(edaConfig).then(function (id) {
            outletId = id;
            createdOutletIds.push(id);
            // Push 5 EDA samples as a chunk
            return LSL.pushChunk(outletId, [
                [1.0],
                [2.0],
                [3.0],
                [4.0],
                [5.0]
            ]);
        }).then(function () {
            expect(true).toBe(true);
            return LSL.destroyOutlet(outletId);
        }).then(function () {
            createdOutletIds.pop();
            done();
        }).catch(function (err) {
            expect(err).toBeUndefined();
            cleanupOutlets(done);
        });
    });

    // ----------------------------------------------------------------
    // Test: hasConsumers returns false when no PC is connected
    // ----------------------------------------------------------------
    it('hasConsumers should return false when no consumer is connected', function (done) {
        var outletId;

        LSL.createOutlet(edaConfig).then(function (id) {
            outletId = id;
            createdOutletIds.push(id);
            return LSL.hasConsumers(outletId);
        }).then(function (hasConsumers) {
            // On a standalone device with no LabRecorder connected,
            // there should be no consumers.
            expect(hasConsumers).toBe(false);
            return LSL.destroyOutlet(outletId);
        }).then(function () {
            createdOutletIds.pop();
            done();
        }).catch(function (err) {
            expect(err).toBeUndefined();
            cleanupOutlets(done);
        });
    });

    // ----------------------------------------------------------------
    // Test: waitForConsumers times out when no consumer connects
    // ----------------------------------------------------------------
    it('waitForConsumers should return false on timeout', function (done) {
        var outletId;

        LSL.createOutlet(edaConfig).then(function (id) {
            outletId = id;
            createdOutletIds.push(id);
            // Wait 1 second - should timeout since no consumer is connected
            return LSL.waitForConsumers(outletId, 1.0);
        }).then(function (found) {
            expect(found).toBe(false);
            return LSL.destroyOutlet(outletId);
        }).then(function () {
            createdOutletIds.pop();
            done();
        }).catch(function (err) {
            expect(err).toBeUndefined();
            cleanupOutlets(done);
        });
    });

    // ----------------------------------------------------------------
    // Test: destroyOutlet releases resources
    // ----------------------------------------------------------------
    it('destroyOutlet should succeed on a valid outlet', function (done) {
        LSL.createOutlet(edaConfig).then(function (outletId) {
            createdOutletIds.push(outletId);
            return LSL.destroyOutlet(outletId);
        }).then(function () {
            createdOutletIds.pop();
            // Destroy succeeded without error
            expect(true).toBe(true);
            done();
        }).catch(function (err) {
            expect(err).toBeUndefined();
            cleanupOutlets(done);
        });
    });

    // ----------------------------------------------------------------
    // Test: pushSample to a destroyed outlet should fail
    // ----------------------------------------------------------------
    it('pushSample to a destroyed outlet should reject', function (done) {
        var destroyedId;

        LSL.createOutlet(edaConfig).then(function (outletId) {
            destroyedId = outletId;
            return LSL.destroyOutlet(outletId);
        }).then(function () {
            // Outlet is destroyed - pushSample should fail
            return LSL.pushSample(destroyedId, [1.0]);
        }).then(function () {
            // Should NOT reach here
            expect('pushSample succeeded on destroyed outlet').toBe('should have failed');
            done();
        }).catch(function (err) {
            // Expected: native returns "Outlet not found: outlet_N"
            expect(err).toBeDefined();
            expect(typeof err).toBe('string');
            expect(err.toLowerCase()).toContain('not found');
            done();
        });
    });

    // ----------------------------------------------------------------
    // Test: hasConsumers on a destroyed outlet should fail
    // ----------------------------------------------------------------
    it('hasConsumers on a destroyed outlet should reject', function (done) {
        var destroyedId;

        LSL.createOutlet(edaConfig).then(function (outletId) {
            destroyedId = outletId;
            return LSL.destroyOutlet(outletId);
        }).then(function () {
            return LSL.hasConsumers(destroyedId);
        }).then(function () {
            expect('hasConsumers succeeded on destroyed outlet').toBe('should have failed');
            done();
        }).catch(function (err) {
            expect(err).toBeDefined();
            expect(err.toLowerCase()).toContain('not found');
            done();
        });
    });

    // ----------------------------------------------------------------
    // Test: Full lifecycle sequence
    // ----------------------------------------------------------------
    it('full lifecycle: create -> push multiple -> query -> destroy -> verify dead', function (done) {
        var outletId;

        LSL.createOutlet(edaConfig).then(function (id) {
            outletId = id;
            expect(typeof outletId).toBe('string');

            // Push 10 samples
            var pushChain = Promise.resolve();
            for (var i = 0; i < 10; i++) {
                (function (val) {
                    pushChain = pushChain.then(function () {
                        return LSL.pushSample(outletId, [val * 0.5]);
                    });
                })(i);
            }
            return pushChain;
        }).then(function () {
            return LSL.hasConsumers(outletId);
        }).then(function (has) {
            expect(has).toBe(false);
            return LSL.destroyOutlet(outletId);
        }).then(function () {
            // Verify outlet is dead
            return LSL.pushSample(outletId, [999.0]);
        }).then(function () {
            expect('push after destroy should fail').toBe('but it succeeded');
            done();
        }).catch(function (err) {
            // This is the expected path - push to destroyed outlet fails
            expect(err).toBeDefined();
            done();
        });
    });

    // ----------------------------------------------------------------
    // Test: getLocalClock returns a positive number
    // ----------------------------------------------------------------
    it('getLocalClock should return a positive number', function (done) {
        LSL.getLocalClock().then(function (clock) {
            expect(typeof clock).toBe('number');
            expect(clock).toBeGreaterThan(0);
            done();
        }).catch(function (err) {
            expect(err).toBeUndefined();
            done();
        });
    });

    // ----------------------------------------------------------------
    // Test: getLibraryVersion returns a version string
    // ----------------------------------------------------------------
    it('getLibraryVersion should return a version string', function (done) {
        LSL.getLibraryVersion().then(function (version) {
            expect(typeof version).toBe('string');
            expect(version.length).toBeGreaterThan(0);
            // Expect format like "1.17.5"
            expect(version).toMatch(/^\d+\.\d+\.\d+$/);
            done();
        }).catch(function (err) {
            expect(err).toBeUndefined();
            done();
        });
    });

    // ----------------------------------------------------------------
    // Test: getProtocolVersion returns a number
    // ----------------------------------------------------------------
    it('getProtocolVersion should return a positive number', function (done) {
        LSL.getProtocolVersion().then(function (version) {
            expect(typeof version).toBe('number');
            expect(version).toBeGreaterThan(0);
            done();
        }).catch(function (err) {
            expect(err).toBeUndefined();
            done();
        });
    });

    // ----------------------------------------------------------------
    // Test: getDeviceIP returns a valid IPv4 address
    // ----------------------------------------------------------------
    it('getDeviceIP should return a valid IPv4 address', function (done) {
        LSL.getDeviceIP().then(function (ip) {
            expect(typeof ip).toBe('string');
            expect(ip.length).toBeGreaterThan(0);
            // Expect IPv4 format
            expect(ip).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
            done();
        }).catch(function (err) {
            // May fail if Wi-Fi is not connected - this is acceptable
            // but the error should be a meaningful string
            expect(typeof err).toBe('string');
            done();
        });
    });

    // ----------------------------------------------------------------
    // Cleanup: destroy any remaining outlets after all tests
    // ----------------------------------------------------------------
    it('cleanup: destroyAllOutlets after test suite', function (done) {
        cleanupOutlets(done);
    });
};
