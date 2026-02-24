/**
 * test-api-validation.js
 *
 * Jasmine unit tests for the JS API input validation in www/lsl.js.
 * Tests that invalid inputs are rejected with appropriate error messages
 * before any cordova.exec call is made.
 */

var mockCordova = require('../helpers/mock-cordova');

describe('LSL API Input Validation', function() {
    var LSL;
    var mockExec;

    beforeAll(function() {
        LSL = mockCordova.loadLSL();
    });

    beforeEach(function() {
        mockExec = jasmine.createSpy('exec');
        mockCordova.setMockExec(mockExec);
    });

    afterAll(function() {
        mockCordova.uninstall();
    });

    // --- Helper: valid options baseline ---
    function validOptions() {
        return {
            name: 'TestStream',
            type: 'EDA',
            channelCount: 1,
            sampleRate: 5.0,
            channelFormat: 'float32'
        };
    }

    // ======================== createOutlet ========================

    describe('createOutlet', function() {

        it('rejects when options is not an object (null)', function(done) {
            LSL.createOutlet(null).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('options must be an object');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when options is not an object (string)', function(done) {
            LSL.createOutlet('notAnObject').then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('options must be an object');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when options is not an object (undefined)', function(done) {
            LSL.createOutlet(undefined).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('options must be an object');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when name is missing', function(done) {
            var opts = validOptions();
            delete opts.name;
            LSL.createOutlet(opts).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('options.name');
                expect(err).toContain('non-empty string');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when name is empty string', function(done) {
            var opts = validOptions();
            opts.name = '';
            LSL.createOutlet(opts).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('options.name');
                expect(err).toContain('non-empty string');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when type is missing', function(done) {
            var opts = validOptions();
            delete opts.type;
            LSL.createOutlet(opts).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('options.type');
                expect(err).toContain('non-empty string');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when type is empty string', function(done) {
            var opts = validOptions();
            opts.type = '';
            LSL.createOutlet(opts).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('options.type');
                expect(err).toContain('non-empty string');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when channelCount is not a positive integer (zero)', function(done) {
            var opts = validOptions();
            opts.channelCount = 0;
            LSL.createOutlet(opts).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('options.channelCount');
                expect(err).toContain('positive integer');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when channelCount is not a positive integer (negative)', function(done) {
            var opts = validOptions();
            opts.channelCount = -3;
            LSL.createOutlet(opts).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('options.channelCount');
                expect(err).toContain('positive integer');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when channelCount is not a positive integer (float)', function(done) {
            var opts = validOptions();
            opts.channelCount = 2.5;
            LSL.createOutlet(opts).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('options.channelCount');
                expect(err).toContain('positive integer');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when channelCount is not a positive integer (string)', function(done) {
            var opts = validOptions();
            opts.channelCount = 'three';
            LSL.createOutlet(opts).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('options.channelCount');
                expect(err).toContain('positive integer');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when sampleRate is negative', function(done) {
            var opts = validOptions();
            opts.sampleRate = -1;
            LSL.createOutlet(opts).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('options.sampleRate');
                expect(err).toContain('non-negative');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when channelFormat is invalid', function(done) {
            var opts = validOptions();
            opts.channelFormat = 'uint64';
            LSL.createOutlet(opts).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('options.channelFormat');
                expect(err).toContain('must be one of');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when channelFormat is empty string', function(done) {
            var opts = validOptions();
            opts.channelFormat = '';
            LSL.createOutlet(opts).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('options.channelFormat');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when metadata.channels is not an array', function(done) {
            var opts = validOptions();
            opts.metadata = { channels: 'not-an-array' };
            LSL.createOutlet(opts).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('metadata.channels must be an array');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when metadata.channels is an object instead of array', function(done) {
            var opts = validOptions();
            opts.metadata = { channels: { label: 'ch1' } };
            LSL.createOutlet(opts).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('metadata.channels must be an array');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when channel objects lack required fields (missing label)', function(done) {
            var opts = validOptions();
            opts.metadata = {
                channels: [
                    { unit: 'microsiemens', type: 'EDA' }
                ]
            };
            LSL.createOutlet(opts).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('channel');
                expect(err).toContain('label');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when channel objects lack required fields (missing unit)', function(done) {
            var opts = validOptions();
            opts.metadata = {
                channels: [
                    { label: 'EDA', type: 'EDA' }
                ]
            };
            LSL.createOutlet(opts).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('channel');
                expect(err).toContain('unit');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when channel objects lack required fields (missing type)', function(done) {
            var opts = validOptions();
            opts.metadata = {
                channels: [
                    { label: 'EDA', unit: 'microsiemens' }
                ]
            };
            LSL.createOutlet(opts).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('channel');
                expect(err).toContain('type');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when a channel entry is null', function(done) {
            var opts = validOptions();
            opts.metadata = {
                channels: [null]
            };
            LSL.createOutlet(opts).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('channel');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('accepts valid options with sampleRate 0 (irregular rate)', function(done) {
            var opts = validOptions();
            opts.sampleRate = 0;
            mockExec.and.callFake(function(success) {
                success('outlet-123');
            });
            LSL.createOutlet(opts).then(function(id) {
                expect(id).toBe('outlet-123');
                expect(mockExec).toHaveBeenCalled();
                done();
            }).catch(function(err) {
                done.fail('Should not reject: ' + err);
            });
        });

    });

    // ======================== pushSample ========================

    describe('pushSample', function() {

        it('rejects when outletId is empty', function(done) {
            LSL.pushSample('', [1.0]).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('outletId');
                expect(err).toContain('non-empty string');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when outletId is not a string', function(done) {
            LSL.pushSample(123, [1.0]).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('outletId');
                expect(err).toContain('non-empty string');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when data is not an array', function(done) {
            LSL.pushSample('outlet-1', 'notArray').then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('data must be an array');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when data is empty', function(done) {
            LSL.pushSample('outlet-1', []).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('data must not be empty');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when timestamp is not a number', function(done) {
            LSL.pushSample('outlet-1', [1.0], 'not-a-number').then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('timestamp must be a number');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when timestamp is NaN', function(done) {
            LSL.pushSample('outlet-1', [1.0], NaN).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('timestamp must be a number');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

    });

    // ======================== pushChunk ========================

    describe('pushChunk', function() {

        it('rejects when data contains non-arrays', function(done) {
            LSL.pushChunk('outlet-1', [[1.0], 'notArray']).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('Each element in data must be an array');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when data contains a number instead of array', function(done) {
            LSL.pushChunk('outlet-1', [42]).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('Each element in data must be an array');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when data is empty', function(done) {
            LSL.pushChunk('outlet-1', []).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('data must not be empty');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when data is not an array', function(done) {
            LSL.pushChunk('outlet-1', 'invalid').then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('data must be an array');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when outletId is empty', function(done) {
            LSL.pushChunk('', [[1.0]]).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('outletId');
                expect(err).toContain('non-empty string');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

    });

    // ======================== hasConsumers ========================

    describe('hasConsumers', function() {

        it('rejects when outletId is empty', function(done) {
            LSL.hasConsumers('').then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('outletId');
                expect(err).toContain('non-empty string');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when outletId is not a string', function(done) {
            LSL.hasConsumers(null).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('outletId');
                expect(err).toContain('non-empty string');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

    });

    // ======================== waitForConsumers ========================

    describe('waitForConsumers', function() {

        it('rejects when timeout is not positive (zero)', function(done) {
            LSL.waitForConsumers('outlet-1', 0).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('timeout');
                expect(err).toContain('positive number');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when timeout is not positive (negative)', function(done) {
            LSL.waitForConsumers('outlet-1', -5).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('timeout');
                expect(err).toContain('positive number');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when timeout is not a number', function(done) {
            LSL.waitForConsumers('outlet-1', 'ten').then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('timeout');
                expect(err).toContain('positive number');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when outletId is empty', function(done) {
            LSL.waitForConsumers('', 10).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('outletId');
                expect(err).toContain('non-empty string');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

    });

    // ======================== destroyOutlet ========================

    describe('destroyOutlet', function() {

        it('rejects when outletId is empty', function(done) {
            LSL.destroyOutlet('').then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('outletId');
                expect(err).toContain('non-empty string');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('rejects when outletId is not a string', function(done) {
            LSL.destroyOutlet(42).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toContain('outletId');
                expect(err).toContain('non-empty string');
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

    });

});
