/**
 * test-exec-calls.js
 *
 * Jasmine unit tests that verify cordova.exec is called with the correct
 * service name, action, and arguments for each LSL API method.
 */

var mockCordova = require('../helpers/mock-cordova');

describe('LSL exec() call parameters', function() {
    var LSL;
    var mockExec;

    beforeAll(function() {
        LSL = mockCordova.loadLSL();
    });

    beforeEach(function() {
        mockExec = jasmine.createSpy('exec').and.callFake(function(success) {
            // Default: resolve immediately so promises complete
            success();
        });
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

        it('calls exec with SERVICE=LSLPlugin, action=createOutlet', function(done) {
            mockExec.and.callFake(function(success) {
                success('outlet-abc');
            });

            LSL.createOutlet(validOptions()).then(function() {
                expect(mockExec).toHaveBeenCalledTimes(1);

                var callArgs = mockExec.calls.argsFor(0);
                // callArgs: [success, error, service, action, args]
                expect(callArgs[2]).toBe('LSLPlugin');
                expect(callArgs[3]).toBe('createOutlet');
                done();
            }).catch(done.fail);
        });

        it('passes options as first element of args array', function(done) {
            var opts = validOptions();
            opts.sourceId = 'device-001';
            opts.metadata = {
                manufacturer: 'Mindfield',
                channels: [
                    { label: 'EDA', unit: 'microsiemens', type: 'EDA' }
                ]
            };

            mockExec.and.callFake(function(success) {
                success('outlet-abc');
            });

            LSL.createOutlet(opts).then(function() {
                var callArgs = mockExec.calls.argsFor(0);
                var execArgs = callArgs[4]; // the args array
                expect(Array.isArray(execArgs)).toBe(true);
                expect(execArgs.length).toBe(1);

                var arg = execArgs[0];
                expect(arg.name).toBe('TestStream');
                expect(arg.type).toBe('EDA');
                expect(arg.channelCount).toBe(1);
                expect(arg.sampleRate).toBe(5.0);
                expect(arg.channelFormat).toBe('float32');
                expect(arg.sourceId).toBe('device-001');
                expect(arg.metadata).toBeDefined();
                expect(arg.metadata.manufacturer).toBe('Mindfield');
                expect(Array.isArray(arg.metadata.channels)).toBe(true);
                done();
            }).catch(done.fail);
        });

        it('passes empty string for sourceId when not provided', function(done) {
            mockExec.and.callFake(function(success) {
                success('outlet-abc');
            });

            LSL.createOutlet(validOptions()).then(function() {
                var arg = mockExec.calls.argsFor(0)[4][0];
                expect(arg.sourceId).toBe('');
                done();
            }).catch(done.fail);
        });

        it('passes null for metadata when not provided', function(done) {
            mockExec.and.callFake(function(success) {
                success('outlet-abc');
            });

            LSL.createOutlet(validOptions()).then(function() {
                var arg = mockExec.calls.argsFor(0)[4][0];
                expect(arg.metadata).toBeNull();
                done();
            }).catch(done.fail);
        });

    });

    // ======================== pushSample ========================

    describe('pushSample', function() {

        it('calls exec with correct args structure (no timestamp)', function(done) {
            LSL.pushSample('outlet-1', [3.14, 2.71]).then(function() {
                expect(mockExec).toHaveBeenCalledTimes(1);

                var callArgs = mockExec.calls.argsFor(0);
                expect(callArgs[2]).toBe('LSLPlugin');
                expect(callArgs[3]).toBe('pushSample');

                var execArgs = callArgs[4];
                expect(Array.isArray(execArgs)).toBe(true);
                expect(execArgs.length).toBe(1);

                var arg = execArgs[0];
                expect(arg.outletId).toBe('outlet-1');
                expect(arg.data).toEqual([3.14, 2.71]);
                expect(arg.timestamp).toBeUndefined();
                done();
            }).catch(done.fail);
        });

        it('calls exec with timestamp when provided', function(done) {
            LSL.pushSample('outlet-1', [1.0], 123.456).then(function() {
                var arg = mockExec.calls.argsFor(0)[4][0];
                expect(arg.outletId).toBe('outlet-1');
                expect(arg.data).toEqual([1.0]);
                expect(arg.timestamp).toBe(123.456);
                done();
            }).catch(done.fail);
        });

        it('omits timestamp when undefined', function(done) {
            LSL.pushSample('outlet-1', [1.0], undefined).then(function() {
                var arg = mockExec.calls.argsFor(0)[4][0];
                expect(arg.hasOwnProperty('timestamp')).toBe(false);
                done();
            }).catch(done.fail);
        });

        it('omits timestamp when null', function(done) {
            LSL.pushSample('outlet-1', [1.0], null).then(function() {
                var arg = mockExec.calls.argsFor(0)[4][0];
                expect(arg.hasOwnProperty('timestamp')).toBe(false);
                done();
            }).catch(done.fail);
        });

    });

    // ======================== pushChunk ========================

    describe('pushChunk', function() {

        it('calls exec with correct args structure', function(done) {
            var chunk = [[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]];

            LSL.pushChunk('outlet-2', chunk).then(function() {
                expect(mockExec).toHaveBeenCalledTimes(1);

                var callArgs = mockExec.calls.argsFor(0);
                expect(callArgs[2]).toBe('LSLPlugin');
                expect(callArgs[3]).toBe('pushChunk');

                var execArgs = callArgs[4];
                expect(Array.isArray(execArgs)).toBe(true);
                expect(execArgs.length).toBe(1);

                var arg = execArgs[0];
                expect(arg.outletId).toBe('outlet-2');
                expect(arg.data).toEqual(chunk);
                done();
            }).catch(done.fail);
        });

    });

    // ======================== destroyOutlet ========================

    describe('destroyOutlet', function() {

        it('calls exec with string outletId as first args element', function(done) {
            LSL.destroyOutlet('outlet-xyz').then(function() {
                expect(mockExec).toHaveBeenCalledTimes(1);

                var callArgs = mockExec.calls.argsFor(0);
                expect(callArgs[2]).toBe('LSLPlugin');
                expect(callArgs[3]).toBe('destroyOutlet');

                var execArgs = callArgs[4];
                expect(Array.isArray(execArgs)).toBe(true);
                expect(execArgs[0]).toBe('outlet-xyz');
                done();
            }).catch(done.fail);
        });

    });

    // ======================== destroyAllOutlets ========================

    describe('destroyAllOutlets', function() {

        it('calls exec with empty args array', function(done) {
            LSL.destroyAllOutlets().then(function() {
                expect(mockExec).toHaveBeenCalledTimes(1);

                var callArgs = mockExec.calls.argsFor(0);
                expect(callArgs[2]).toBe('LSLPlugin');
                expect(callArgs[3]).toBe('destroyAllOutlets');

                var execArgs = callArgs[4];
                expect(Array.isArray(execArgs)).toBe(true);
                expect(execArgs.length).toBe(0);
                done();
            }).catch(done.fail);
        });

    });

    // ======================== getLocalClock ========================

    describe('getLocalClock', function() {

        it('calls exec with action getLocalClock and empty args', function(done) {
            mockExec.and.callFake(function(success) {
                success(1234567.89);
            });

            LSL.getLocalClock().then(function() {
                expect(mockExec).toHaveBeenCalledTimes(1);

                var callArgs = mockExec.calls.argsFor(0);
                expect(callArgs[2]).toBe('LSLPlugin');
                expect(callArgs[3]).toBe('getLocalClock');

                var execArgs = callArgs[4];
                expect(Array.isArray(execArgs)).toBe(true);
                expect(execArgs.length).toBe(0);
                done();
            }).catch(done.fail);
        });

    });

    // ======================== getLibraryVersion ========================

    describe('getLibraryVersion', function() {

        it('calls exec with action getLibraryVersion and empty args', function(done) {
            mockExec.and.callFake(function(success) {
                success('1.17.5');
            });

            LSL.getLibraryVersion().then(function() {
                expect(mockExec).toHaveBeenCalledTimes(1);

                var callArgs = mockExec.calls.argsFor(0);
                expect(callArgs[2]).toBe('LSLPlugin');
                expect(callArgs[3]).toBe('getLibraryVersion');

                var execArgs = callArgs[4];
                expect(Array.isArray(execArgs)).toBe(true);
                expect(execArgs.length).toBe(0);
                done();
            }).catch(done.fail);
        });

    });

    // ======================== getDeviceIP ========================

    describe('getDeviceIP', function() {

        it('calls exec with action getDeviceIP and empty args', function(done) {
            mockExec.and.callFake(function(success) {
                success('192.168.1.100');
            });

            LSL.getDeviceIP().then(function() {
                expect(mockExec).toHaveBeenCalledTimes(1);

                var callArgs = mockExec.calls.argsFor(0);
                expect(callArgs[2]).toBe('LSLPlugin');
                expect(callArgs[3]).toBe('getDeviceIP');

                var execArgs = callArgs[4];
                expect(Array.isArray(execArgs)).toBe(true);
                expect(execArgs.length).toBe(0);
                done();
            }).catch(done.fail);
        });

    });

});
