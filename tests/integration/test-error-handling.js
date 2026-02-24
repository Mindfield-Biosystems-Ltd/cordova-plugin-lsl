/**
 * cordova-plugin-lsl - Integration Test: Error Handling
 *
 * Runs on a real device inside a Cordova test app using cordova-plugin-test-framework.
 * Tests error conditions and edge cases:
 *   - Double destroy (destroy same outlet twice)
 *   - Push to non-existent outlet
 *   - Push wrong data length
 *   - Create outlet with invalid format (JS validation)
 *   - destroyAllOutlets when no outlets exist
 *
 * Prerequisites:
 *   - cordova-plugin-lsl installed in the test app
 *   - cordova-plugin-test-framework installed
 *
 * Copyright (c) 2025 Mindfield Biosystems Ltd.
 * Licensed under the MIT License.
 */

exports.defineAutoTests = function (it, expect, pending) {

    // ----------------------------------------------------------------
    // Helper: minimal valid config for creating test outlets
    // ----------------------------------------------------------------
    var validConfig = {
        name: 'Test_ErrorHandling',
        type: 'EDA',
        channelCount: 1,
        sampleRate: 5,
        channelFormat: 'float32',
        sourceId: 'test-error-handling'
    };

    // ----------------------------------------------------------------
    // Cleanup helper
    // ----------------------------------------------------------------
    function cleanupAll(done) {
        LSL.destroyAllOutlets().then(function () {
            done();
        }).catch(function () {
            done();
        });
    }

    // ================================================================
    // DOUBLE DESTROY
    // ================================================================

    it('double destroy: second destroyOutlet should reject with error', function (done) {
        var outletId;

        LSL.createOutlet(validConfig).then(function (id) {
            outletId = id;
            // First destroy - should succeed
            return LSL.destroyOutlet(outletId);
        }).then(function () {
            // Second destroy - same outlet ID, should fail
            return LSL.destroyOutlet(outletId);
        }).then(function () {
            // Should NOT reach here
            expect('second destroy succeeded').toBe('should have failed');
            done();
        }).catch(function (err) {
            // Expected: native returns "Outlet not found: outlet_N"
            expect(err).toBeDefined();
            expect(typeof err).toBe('string');
            expect(err.toLowerCase()).toContain('not found');
            done();
        });
    });

    // ================================================================
    // PUSH TO NON-EXISTENT OUTLET
    // ================================================================

    it('pushSample to a non-existent outlet ID should reject', function (done) {
        LSL.pushSample('outlet_999999', [1.0]).then(function () {
            expect('pushSample to non-existent outlet succeeded').toBe('should have failed');
            done();
        }).catch(function (err) {
            expect(err).toBeDefined();
            expect(typeof err).toBe('string');
            expect(err.toLowerCase()).toContain('not found');
            done();
        });
    });

    it('pushChunk to a non-existent outlet ID should reject', function (done) {
        LSL.pushChunk('outlet_999999', [[1.0], [2.0]]).then(function () {
            expect('pushChunk to non-existent outlet succeeded').toBe('should have failed');
            done();
        }).catch(function (err) {
            expect(err).toBeDefined();
            expect(typeof err).toBe('string');
            expect(err.toLowerCase()).toContain('not found');
            done();
        });
    });

    it('hasConsumers on a non-existent outlet ID should reject', function (done) {
        LSL.hasConsumers('outlet_999999').then(function () {
            expect('hasConsumers on non-existent outlet succeeded').toBe('should have failed');
            done();
        }).catch(function (err) {
            expect(err).toBeDefined();
            expect(typeof err).toBe('string');
            expect(err.toLowerCase()).toContain('not found');
            done();
        });
    });

    it('waitForConsumers on a non-existent outlet ID should reject', function (done) {
        LSL.waitForConsumers('outlet_999999', 0.5).then(function () {
            expect('waitForConsumers on non-existent outlet succeeded').toBe('should have failed');
            done();
        }).catch(function (err) {
            expect(err).toBeDefined();
            expect(typeof err).toBe('string');
            expect(err.toLowerCase()).toContain('not found');
            done();
        });
    });

    it('destroyOutlet on a non-existent outlet ID should reject', function (done) {
        LSL.destroyOutlet('outlet_999999').then(function () {
            expect('destroyOutlet on non-existent outlet succeeded').toBe('should have failed');
            done();
        }).catch(function (err) {
            expect(err).toBeDefined();
            expect(typeof err).toBe('string');
            expect(err.toLowerCase()).toContain('not found');
            done();
        });
    });

    // ================================================================
    // PUSH WRONG DATA LENGTH
    // ================================================================

    it('pushSample with too few channels should reject', function (done) {
        var twoChannelConfig = {
            name: 'Test_2ch',
            type: 'PPG',
            channelCount: 2,
            sampleRate: 5,
            channelFormat: 'float32',
            sourceId: 'test-wrong-length-few'
        };

        var outletId;

        LSL.createOutlet(twoChannelConfig).then(function (id) {
            outletId = id;
            // Push only 1 value for a 2-channel outlet
            return LSL.pushSample(outletId, [1.0]);
        }).then(function () {
            expect('pushSample with wrong length succeeded').toBe('should have failed');
            return LSL.destroyOutlet(outletId);
        }).then(function () {
            done();
        }).catch(function (err) {
            // Expected: native returns "Data length (1) does not match channelCount (2)."
            expect(err).toBeDefined();
            expect(typeof err).toBe('string');
            expect(err.toLowerCase()).toContain('does not match');
            // Clean up the outlet
            LSL.destroyOutlet(outletId).then(done).catch(done);
        });
    });

    it('pushSample with too many channels should reject', function (done) {
        var outletId;

        LSL.createOutlet(validConfig).then(function (id) {
            outletId = id;
            // Push 3 values for a 1-channel outlet
            return LSL.pushSample(outletId, [1.0, 2.0, 3.0]);
        }).then(function () {
            expect('pushSample with wrong length succeeded').toBe('should have failed');
            return LSL.destroyOutlet(outletId);
        }).then(function () {
            done();
        }).catch(function (err) {
            expect(err).toBeDefined();
            expect(typeof err).toBe('string');
            expect(err.toLowerCase()).toContain('does not match');
            LSL.destroyOutlet(outletId).then(done).catch(done);
        });
    });

    it('pushChunk with mismatched sample length should reject', function (done) {
        var outletId;

        LSL.createOutlet(validConfig).then(function (id) {
            outletId = id;
            // First sample correct (1 value), second wrong (2 values)
            return LSL.pushChunk(outletId, [[1.0], [2.0, 3.0]]);
        }).then(function () {
            expect('pushChunk with wrong sample length succeeded').toBe('should have failed');
            return LSL.destroyOutlet(outletId);
        }).then(function () {
            done();
        }).catch(function (err) {
            expect(err).toBeDefined();
            expect(typeof err).toBe('string');
            expect(err.toLowerCase()).toContain('does not match');
            LSL.destroyOutlet(outletId).then(done).catch(done);
        });
    });

    // ================================================================
    // JS-LEVEL VALIDATION (createOutlet with invalid options)
    // ================================================================

    it('createOutlet with no options should reject from JS validation', function (done) {
        LSL.createOutlet(null).then(function () {
            expect('createOutlet with null succeeded').toBe('should have failed');
            done();
        }).catch(function (err) {
            expect(err).toBeDefined();
            expect(typeof err).toBe('string');
            expect(err).toContain('createOutlet');
            done();
        });
    });

    it('createOutlet with empty name should reject from JS validation', function (done) {
        var bad = {
            name: '',
            type: 'EDA',
            channelCount: 1,
            sampleRate: 5,
            channelFormat: 'float32'
        };

        LSL.createOutlet(bad).then(function () {
            expect('createOutlet with empty name succeeded').toBe('should have failed');
            done();
        }).catch(function (err) {
            expect(err).toBeDefined();
            expect(err).toContain('name');
            expect(err).toContain('non-empty string');
            done();
        });
    });

    it('createOutlet with invalid channelFormat should reject from JS validation', function (done) {
        var bad = {
            name: 'Test',
            type: 'EDA',
            channelCount: 1,
            sampleRate: 5,
            channelFormat: 'uint32'  // not in valid formats
        };

        LSL.createOutlet(bad).then(function () {
            expect('createOutlet with invalid format succeeded').toBe('should have failed');
            done();
        }).catch(function (err) {
            expect(err).toBeDefined();
            expect(err).toContain('channelFormat');
            done();
        });
    });

    it('createOutlet with zero channelCount should reject from JS validation', function (done) {
        var bad = {
            name: 'Test',
            type: 'EDA',
            channelCount: 0,
            sampleRate: 5,
            channelFormat: 'float32'
        };

        LSL.createOutlet(bad).then(function () {
            expect('createOutlet with 0 channels succeeded').toBe('should have failed');
            done();
        }).catch(function (err) {
            expect(err).toBeDefined();
            expect(err).toContain('channelCount');
            expect(err).toContain('positive integer');
            done();
        });
    });

    it('createOutlet with negative channelCount should reject from JS validation', function (done) {
        var bad = {
            name: 'Test',
            type: 'EDA',
            channelCount: -1,
            sampleRate: 5,
            channelFormat: 'float32'
        };

        LSL.createOutlet(bad).then(function () {
            expect('createOutlet with -1 channels succeeded').toBe('should have failed');
            done();
        }).catch(function (err) {
            expect(err).toBeDefined();
            expect(err).toContain('channelCount');
            done();
        });
    });

    it('createOutlet with negative sampleRate should reject from JS validation', function (done) {
        var bad = {
            name: 'Test',
            type: 'EDA',
            channelCount: 1,
            sampleRate: -5,
            channelFormat: 'float32'
        };

        LSL.createOutlet(bad).then(function () {
            expect('createOutlet with negative sampleRate succeeded').toBe('should have failed');
            done();
        }).catch(function (err) {
            expect(err).toBeDefined();
            expect(err).toContain('sampleRate');
            done();
        });
    });

    it('createOutlet with non-numeric channelCount should reject', function (done) {
        var bad = {
            name: 'Test',
            type: 'EDA',
            channelCount: 'one',
            sampleRate: 5,
            channelFormat: 'float32'
        };

        LSL.createOutlet(bad).then(function () {
            expect('createOutlet with string channelCount succeeded').toBe('should have failed');
            done();
        }).catch(function (err) {
            expect(err).toBeDefined();
            expect(err).toContain('channelCount');
            done();
        });
    });

    it('createOutlet with fractional channelCount should reject', function (done) {
        var bad = {
            name: 'Test',
            type: 'EDA',
            channelCount: 1.5,
            sampleRate: 5,
            channelFormat: 'float32'
        };

        LSL.createOutlet(bad).then(function () {
            expect('createOutlet with fractional channelCount succeeded').toBe('should have failed');
            done();
        }).catch(function (err) {
            expect(err).toBeDefined();
            expect(err).toContain('channelCount');
            expect(err).toContain('positive integer');
            done();
        });
    });

    it('createOutlet with invalid metadata.channels (not array) should reject', function (done) {
        var bad = {
            name: 'Test',
            type: 'EDA',
            channelCount: 1,
            sampleRate: 5,
            channelFormat: 'float32',
            metadata: {
                channels: 'not-an-array'
            }
        };

        LSL.createOutlet(bad).then(function () {
            expect('createOutlet with bad channels succeeded').toBe('should have failed');
            done();
        }).catch(function (err) {
            expect(err).toBeDefined();
            expect(err).toContain('channels');
            expect(err).toContain('array');
            done();
        });
    });

    it('createOutlet with channel missing label should reject', function (done) {
        var bad = {
            name: 'Test',
            type: 'EDA',
            channelCount: 1,
            sampleRate: 5,
            channelFormat: 'float32',
            metadata: {
                channels: [
                    { unit: 'microsiemens', type: 'EDA' }  // missing label
                ]
            }
        };

        LSL.createOutlet(bad).then(function () {
            expect('createOutlet with missing label succeeded').toBe('should have failed');
            done();
        }).catch(function (err) {
            expect(err).toBeDefined();
            expect(err).toContain('label');
            done();
        });
    });

    // ================================================================
    // JS-LEVEL VALIDATION (pushSample with invalid args)
    // ================================================================

    it('pushSample with empty outletId should reject from JS validation', function (done) {
        LSL.pushSample('', [1.0]).then(function () {
            expect('pushSample with empty ID succeeded').toBe('should have failed');
            done();
        }).catch(function (err) {
            expect(err).toBeDefined();
            expect(err).toContain('outletId');
            expect(err).toContain('non-empty string');
            done();
        });
    });

    it('pushSample with non-array data should reject from JS validation', function (done) {
        LSL.pushSample('outlet_1', 'not-an-array').then(function () {
            expect('pushSample with string data succeeded').toBe('should have failed');
            done();
        }).catch(function (err) {
            expect(err).toBeDefined();
            expect(err).toContain('data');
            expect(err).toContain('array');
            done();
        });
    });

    it('pushSample with empty array should reject from JS validation', function (done) {
        LSL.pushSample('outlet_1', []).then(function () {
            expect('pushSample with empty array succeeded').toBe('should have failed');
            done();
        }).catch(function (err) {
            expect(err).toBeDefined();
            expect(err).toContain('data');
            expect(err).toContain('empty');
            done();
        });
    });

    it('pushSample with invalid timestamp should reject from JS validation', function (done) {
        LSL.pushSample('outlet_1', [1.0], 'not-a-number').then(function () {
            expect('pushSample with string timestamp succeeded').toBe('should have failed');
            done();
        }).catch(function (err) {
            expect(err).toBeDefined();
            expect(err).toContain('timestamp');
            done();
        });
    });

    // ================================================================
    // JS-LEVEL VALIDATION (pushChunk with invalid args)
    // ================================================================

    it('pushChunk with non-array data should reject from JS validation', function (done) {
        LSL.pushChunk('outlet_1', 'not-an-array').then(function () {
            expect('pushChunk with string data succeeded').toBe('should have failed');
            done();
        }).catch(function (err) {
            expect(err).toBeDefined();
            expect(err).toContain('pushChunk');
            expect(err).toContain('array');
            done();
        });
    });

    it('pushChunk with empty array should reject from JS validation', function (done) {
        LSL.pushChunk('outlet_1', []).then(function () {
            expect('pushChunk with empty array succeeded').toBe('should have failed');
            done();
        }).catch(function (err) {
            expect(err).toBeDefined();
            expect(err).toContain('pushChunk');
            expect(err).toContain('empty');
            done();
        });
    });

    it('pushChunk with non-array elements should reject from JS validation', function (done) {
        LSL.pushChunk('outlet_1', [1.0, 2.0]).then(function () {
            expect('pushChunk with non-array elements succeeded').toBe('should have failed');
            done();
        }).catch(function (err) {
            expect(err).toBeDefined();
            expect(err).toContain('pushChunk');
            expect(err).toContain('array');
            done();
        });
    });

    // ================================================================
    // DESTROY ALL OUTLETS WHEN NONE EXIST
    // ================================================================

    it('destroyAllOutlets with no active outlets should succeed', function (done) {
        // First ensure no outlets exist
        LSL.destroyAllOutlets().then(function () {
            // Now call again - should still succeed (no-op)
            return LSL.destroyAllOutlets();
        }).then(function () {
            // Success - no error
            expect(true).toBe(true);
            done();
        }).catch(function (err) {
            expect(err).toBeUndefined();
            done();
        });
    });

    it('destroyAllOutlets called 3 times consecutively should all succeed', function (done) {
        LSL.destroyAllOutlets()
            .then(function () { return LSL.destroyAllOutlets(); })
            .then(function () { return LSL.destroyAllOutlets(); })
            .then(function () {
                expect(true).toBe(true);
                done();
            }).catch(function (err) {
                expect(err).toBeUndefined();
                done();
            });
    });

    // ================================================================
    // EDGE CASE: sampleRate of 0 (irregular rate) should be accepted
    // ================================================================

    it('createOutlet with sampleRate 0 (irregular) should succeed', function (done) {
        var irregularConfig = {
            name: 'Test_Irregular',
            type: 'Markers',
            channelCount: 1,
            sampleRate: 0,
            channelFormat: 'string',
            sourceId: 'test-irregular-rate'
        };

        LSL.createOutlet(irregularConfig).then(function (outletId) {
            expect(typeof outletId).toBe('string');
            return LSL.destroyOutlet(outletId);
        }).then(function () {
            done();
        }).catch(function (err) {
            expect(err).toBeUndefined();
            done();
        });
    });

    // ================================================================
    // Cleanup
    // ================================================================

    it('cleanup: destroyAllOutlets after error handling tests', function (done) {
        cleanupAll(done);
    });
};
