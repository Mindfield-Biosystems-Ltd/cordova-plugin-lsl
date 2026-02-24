/**
 * test-promise-handling.js
 *
 * Jasmine unit tests that verify promises resolve and reject correctly
 * based on exec success/error callbacks and validation outcomes.
 */

var mockCordova = require('../helpers/mock-cordova');

describe('LSL Promise handling', function() {
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

        it('resolves with string on exec success', function(done) {
            mockExec.and.callFake(function(success, error, service, action, args) {
                success('outlet-abc-123');
            });

            LSL.createOutlet(validOptions()).then(function(result) {
                expect(result).toBe('outlet-abc-123');
                expect(typeof result).toBe('string');
                done();
            }).catch(done.fail);
        });

        it('rejects with string on exec error', function(done) {
            mockExec.and.callFake(function(success, error, service, action, args) {
                error('Native error: stream creation failed');
            });

            LSL.createOutlet(validOptions()).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toBe('Native error: stream creation failed');
                done();
            });
        });

        it('rejects with error object on exec error', function(done) {
            var errorObj = { code: 'INIT_FAILED', message: 'LSL init failed' };
            mockExec.and.callFake(function(success, error) {
                error(errorObj);
            });

            LSL.createOutlet(validOptions()).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toEqual(errorObj);
                done();
            });
        });

    });

    // ======================== pushSample ========================

    describe('pushSample', function() {

        it('resolves on exec success', function(done) {
            mockExec.and.callFake(function(success) {
                success();
            });

            LSL.pushSample('outlet-1', [42.0]).then(function(result) {
                expect(result).toBeUndefined();
                done();
            }).catch(done.fail);
        });

        it('rejects on exec error', function(done) {
            mockExec.and.callFake(function(success, error) {
                error('Outlet not found');
            });

            LSL.pushSample('outlet-1', [42.0]).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toBe('Outlet not found');
                done();
            });
        });

        it('resolves with timestamp provided', function(done) {
            mockExec.and.callFake(function(success) {
                success();
            });

            LSL.pushSample('outlet-1', [1.0, 2.0], 9999.123).then(function() {
                expect(mockExec).toHaveBeenCalledTimes(1);
                done();
            }).catch(done.fail);
        });

    });

    // ======================== pushChunk ========================

    describe('pushChunk', function() {

        it('resolves on exec success', function(done) {
            mockExec.and.callFake(function(success) {
                success();
            });

            LSL.pushChunk('outlet-1', [[1.0], [2.0], [3.0]]).then(function(result) {
                expect(result).toBeUndefined();
                done();
            }).catch(done.fail);
        });

        it('rejects on exec error', function(done) {
            mockExec.and.callFake(function(success, error) {
                error('Channel count mismatch');
            });

            LSL.pushChunk('outlet-1', [[1.0], [2.0]]).then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toBe('Channel count mismatch');
                done();
            });
        });

    });

    // ======================== destroyOutlet ========================

    describe('destroyOutlet', function() {

        it('resolves on exec success', function(done) {
            mockExec.and.callFake(function(success) {
                success();
            });

            LSL.destroyOutlet('outlet-1').then(function(result) {
                expect(result).toBeUndefined();
                done();
            }).catch(done.fail);
        });

        it('rejects on exec error', function(done) {
            mockExec.and.callFake(function(success, error) {
                error('Outlet does not exist');
            });

            LSL.destroyOutlet('outlet-nonexistent').then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toBe('Outlet does not exist');
                done();
            });
        });

    });

    // ======================== destroyAllOutlets ========================

    describe('destroyAllOutlets', function() {

        it('resolves on exec success', function(done) {
            mockExec.and.callFake(function(success) {
                success();
            });

            LSL.destroyAllOutlets().then(function(result) {
                expect(result).toBeUndefined();
                done();
            }).catch(done.fail);
        });

        it('rejects on exec error', function(done) {
            mockExec.and.callFake(function(success, error) {
                error('Cleanup failed');
            });

            LSL.destroyAllOutlets().then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toBe('Cleanup failed');
                done();
            });
        });

    });

    // ======================== getLocalClock ========================

    describe('getLocalClock', function() {

        it('resolves with number on exec success', function(done) {
            mockExec.and.callFake(function(success) {
                success(1234567.890123);
            });

            LSL.getLocalClock().then(function(result) {
                expect(typeof result).toBe('number');
                expect(result).toBe(1234567.890123);
                done();
            }).catch(done.fail);
        });

        it('rejects on exec error', function(done) {
            mockExec.and.callFake(function(success, error) {
                error('LSL not initialized');
            });

            LSL.getLocalClock().then(function() {
                done.fail('Expected rejection');
            }).catch(function(err) {
                expect(err).toBe('LSL not initialized');
                done();
            });
        });

    });

    // ======================== getLibraryVersion ========================

    describe('getLibraryVersion', function() {

        it('resolves with string on exec success', function(done) {
            mockExec.and.callFake(function(success) {
                success('1.17.5');
            });

            LSL.getLibraryVersion().then(function(result) {
                expect(typeof result).toBe('string');
                expect(result).toBe('1.17.5');
                done();
            }).catch(done.fail);
        });

    });

    // ======================== getDeviceIP ========================

    describe('getDeviceIP', function() {

        it('resolves with string on exec success', function(done) {
            mockExec.and.callFake(function(success) {
                success('192.168.1.100');
            });

            LSL.getDeviceIP().then(function(result) {
                expect(typeof result).toBe('string');
                expect(result).toBe('192.168.1.100');
                done();
            }).catch(done.fail);
        });

    });

    // ======================== Validation rejects without calling exec ========================

    describe('Validation errors reject without calling exec', function() {

        it('createOutlet with invalid options does not call exec', function(done) {
            LSL.createOutlet(null).then(function() {
                done.fail('Expected rejection');
            }).catch(function() {
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('pushSample with empty outletId does not call exec', function(done) {
            LSL.pushSample('', [1.0]).then(function() {
                done.fail('Expected rejection');
            }).catch(function() {
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('pushSample with empty data does not call exec', function(done) {
            LSL.pushSample('outlet-1', []).then(function() {
                done.fail('Expected rejection');
            }).catch(function() {
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('pushChunk with invalid data does not call exec', function(done) {
            LSL.pushChunk('outlet-1', [42]).then(function() {
                done.fail('Expected rejection');
            }).catch(function() {
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('hasConsumers with empty outletId does not call exec', function(done) {
            LSL.hasConsumers('').then(function() {
                done.fail('Expected rejection');
            }).catch(function() {
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('waitForConsumers with invalid timeout does not call exec', function(done) {
            LSL.waitForConsumers('outlet-1', -5).then(function() {
                done.fail('Expected rejection');
            }).catch(function() {
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

        it('destroyOutlet with empty outletId does not call exec', function(done) {
            LSL.destroyOutlet('').then(function() {
                done.fail('Expected rejection');
            }).catch(function() {
                expect(mockExec).not.toHaveBeenCalled();
                done();
            });
        });

    });

});
