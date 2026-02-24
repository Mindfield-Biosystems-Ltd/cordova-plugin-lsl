/**
 * Mock replacement for cordova/exec.
 *
 * This module is resolved in place of 'cordova/exec' by the mock-cordova helper.
 * It delegates all calls to the currently registered mock function.
 */

var mockCordova = require('./mock-cordova');

function exec(success, error, service, action, args) {
    var fn = mockCordova.getMockExec();
    if (typeof fn === 'function') {
        fn(success, error, service, action, args);
    }
}

module.exports = exec;
