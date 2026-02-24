/**
 * Mock cordova/exec module loader.
 *
 * This helper intercepts require('cordova/exec') so that www/lsl.js
 * can be loaded outside of a real Cordova environment.
 *
 * Usage in test files:
 *   var mockCordova = require('../helpers/mock-cordova');
 *   var LSL = mockCordova.loadLSL();
 *   var mockExec = mockCordova.mockExec;
 */

var Module = require('module');
var path = require('path');

var _originalResolveFilename = Module._resolveFilename;

// The shared mock exec spy — will be replaced per-test via reset()
var currentMockExec = function() {};

/**
 * Install the cordova/exec interception.
 * Must be called once before requiring www/lsl.js.
 */
function install() {
    Module._resolveFilename = function(request, parent) {
        if (request === 'cordova/exec') {
            // Return our mock module path
            return path.resolve(__dirname, '_cordova-exec-mock.js');
        }
        return _originalResolveFilename.apply(this, arguments);
    };
}

/**
 * Uninstall the cordova/exec interception.
 */
function uninstall() {
    Module._resolveFilename = _originalResolveFilename;
}

/**
 * Set the current mock exec function.
 * @param {Function} fn - The mock function (typically a jasmine spy).
 */
function setMockExec(fn) {
    currentMockExec = fn;
}

/**
 * Get the current mock exec function reference.
 * @returns {Function}
 */
function getMockExec() {
    return currentMockExec;
}

/**
 * Load (or reload) the LSL module with a fresh require.
 * Clears the module cache for both lsl.js and the mock so each
 * test suite gets a clean module instance.
 *
 * @returns {Object} The LSL module exports.
 */
function loadLSL() {
    var lslPath = path.resolve(__dirname, '../../www/lsl.js');
    var mockPath = path.resolve(__dirname, '_cordova-exec-mock.js');

    // Clear cached modules so we get fresh instances
    delete require.cache[lslPath];
    delete require.cache[mockPath];

    install();
    var LSL = require(lslPath);
    return LSL;
}

module.exports = {
    install: install,
    uninstall: uninstall,
    setMockExec: setMockExec,
    getMockExec: getMockExec,
    loadLSL: loadLSL
};
