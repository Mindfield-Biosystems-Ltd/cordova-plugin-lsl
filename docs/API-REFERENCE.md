# API Reference — cordova-plugin-lsl

Complete API documentation for cordova-plugin-lsl v1.0.0.

## Global Object

After `deviceready`, the `LSL` object is available globally:

```javascript
document.addEventListener('deviceready', function() {
    // LSL is now available
    console.log(typeof LSL); // "object"
}, false);
```

In TypeScript/Ionic:

```typescript
declare var LSL: import('cordova-plugin-lsl').LSLPlugin;
```

---

## Outlet Operations

### `LSL.createOutlet(options)` → `Promise<string>`

Creates a new LSL outlet (data sender).

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `options.name` | string | Yes | Human-readable stream name. Appears in LabRecorder. |
| `options.type` | string | Yes | Stream content type. Common values: `"EDA"`, `"Temperature"`, `"PPG"`, `"Respiration"`, `"EMG"`, `"EEG"`. |
| `options.channelCount` | number | Yes | Number of data channels (>= 1). |
| `options.sampleRate` | number | Yes | Nominal sampling rate in Hz. Use `0` for irregular-rate streams. |
| `options.channelFormat` | string | Yes | Data format per channel. One of: `"float32"`, `"double64"`, `"int32"`, `"int16"`, `"int8"`, `"string"`. |
| `options.sourceId` | string | No | Unique identifier for the data source (e.g. device serial). Helps LSL disambiguate streams. Default: `""`. |
| `options.metadata` | object | No | Rich metadata embedded in the LSL stream info XML. |
| `options.metadata.manufacturer` | string | No | Manufacturer name. |
| `options.metadata.device` | string | No | Device model/name. |
| `options.metadata.channels` | array | No | Array of channel descriptions. Each: `{label: string, unit: string, type: string}`. |

**Returns:** Promise resolving with a unique outlet ID string (e.g. `"outlet_1"`).

**Errors:**
- Invalid or missing required parameters (JS validation)
- Failed to create native LSL stream info or outlet

**Example:**

```javascript
const outletId = await LSL.createOutlet({
    name: 'eSense_EDA',
    type: 'EDA',
    channelCount: 1,
    sampleRate: 5.0,
    channelFormat: 'float32',
    sourceId: 'esense-eda-ABC123',
    metadata: {
        manufacturer: 'Mindfield Biosystems',
        device: 'eSense EDA',
        channels: [
            { label: 'EDA', unit: 'microsiemens', type: 'EDA' }
        ]
    }
});
console.log('Created outlet:', outletId); // "outlet_1"
```

---

### `LSL.pushSample(outletId, data, timestamp?)` → `Promise<void>`

Pushes a single sample (one time point) to an outlet.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `outletId` | string | Yes | Outlet ID from `createOutlet`. |
| `data` | number[] | Yes | Sample values. Length **must** match `channelCount`. |
| `timestamp` | number | No | LSL timestamp from `getLocalClock()`. If omitted, native code stamps automatically (recommended). |

**IMPORTANT:** Never use `Date.now()` or `new Date().getTime()` for timestamps. These are wall-clock times and are NOT compatible with LSL's monotonic clock. Either omit the timestamp (recommended) or use `LSL.getLocalClock()`.

**Example:**

```javascript
// Recommended: let native code timestamp (most accurate)
await LSL.pushSample(outletId, [3.7]);

// Custom timestamp (only if you need precise control)
const ts = await LSL.getLocalClock();
await LSL.pushSample(outletId, [3.7], ts);

// Multi-channel
await LSL.pushSample(pulseOutletId, [72, 833]); // BPM, IBI
```

---

### `LSL.pushChunk(outletId, data)` → `Promise<void>`

Pushes multiple samples at once. More efficient than calling `pushSample` in a loop because it crosses the JS-native bridge only once.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `outletId` | string | Yes | Outlet ID from `createOutlet`. |
| `data` | number[][] | Yes | Array of samples. Each inner array length must match `channelCount`. |

**When to use:** Recommended when sample rate > 10 Hz or when you batch readings.

**Example:**

```javascript
// Buffer 5 samples, push at once
const buffer = [];
buffer.push([3.5]);
buffer.push([3.6]);
buffer.push([3.7]);
buffer.push([3.8]);
buffer.push([3.9]);
await LSL.pushChunk(outletId, buffer);
```

---

### `LSL.hasConsumers(outletId)` → `Promise<boolean>`

Checks if any consumers (e.g. LabRecorder, LSL Viewer) are currently connected to this outlet.

**Example:**

```javascript
const connected = await LSL.hasConsumers(outletId);
if (connected) {
    console.log('LabRecorder is receiving data');
}
```

---

### `LSL.waitForConsumers(outletId, timeout)` → `Promise<boolean>`

Blocks until at least one consumer connects or the timeout expires.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `outletId` | string | Yes | Outlet ID. |
| `timeout` | number | Yes | Maximum wait time in **seconds**. |

**Returns:** `true` if a consumer connected, `false` if timeout expired.

**Example:**

```javascript
console.log('Waiting for LabRecorder to connect...');
const connected = await LSL.waitForConsumers(outletId, 30);
if (connected) {
    console.log('Consumer connected! Starting data stream.');
} else {
    console.log('Timeout — no consumer found.');
}
```

---

### `LSL.destroyOutlet(outletId)` → `Promise<void>`

Destroys a single outlet and releases all associated native resources.

After calling this, the `outletId` is invalid. Any connected consumers will see the stream disappear.

**Example:**

```javascript
await LSL.destroyOutlet(outletId);
// outletId is now invalid
```

---

### `LSL.destroyAllOutlets()` → `Promise<void>`

Destroys all outlets at once. Useful for cleanup when stopping all streams.

This is also called automatically by native lifecycle hooks when:
- The app is terminated (swipe-kill)
- The WebView is reset (page navigation)

**Example:**

```javascript
await LSL.destroyAllOutlets();
```

---

## Utility Functions

### `LSL.getLocalClock()` → `Promise<number>`

Returns the current time on LSL's high-resolution monotonic clock, in seconds.

Use this only if you need custom timestamps for `pushSample`. In most cases, omitting the timestamp and letting native code stamp automatically is simpler and more accurate.

**Example:**

```javascript
const t = await LSL.getLocalClock();
console.log('LSL clock:', t); // e.g. 12345.678901
```

---

### `LSL.getLibraryVersion()` → `Promise<string>`

Returns the version string of the underlying liblsl native library.

**Example:**

```javascript
const version = await LSL.getLibraryVersion();
console.log('liblsl version:', version); // "1.17.5"
```

---

### `LSL.getProtocolVersion()` → `Promise<number>`

Returns the LSL protocol version as an integer.

**Example:**

```javascript
const proto = await LSL.getProtocolVersion();
console.log('LSL protocol version:', proto); // e.g. 110
```

---

### `LSL.getDeviceIP()` → `Promise<string>`

Returns the device's current Wi-Fi IPv4 address. Display this to users so they can configure `lsl_api.cfg` on their PC.

Returns an error if Wi-Fi is not connected (cellular-only connections cannot be used for LSL).

**Example:**

```javascript
try {
    const ip = await LSL.getDeviceIP();
    document.getElementById('ip-display').textContent = ip;
    // User adds this IP to lsl_api.cfg on PC
} catch (e) {
    console.error('Not connected to Wi-Fi');
}
```

---

## Channel Formats

| Format | JS Type | C Type | Bytes | Use Case |
|--------|---------|--------|-------|----------|
| `float32` | number | float | 4 | Most biosignals (EDA, temperature, EMG) |
| `double64` | number | double | 8 | High-precision data |
| `int32` | number | int32_t | 4 | Integer sensor values |
| `int16` | number | int16_t | 2 | Compact integer data |
| `int8` | number | int8_t | 1 | Very compact data |
| `string` | string | char* | var | Text annotations, markers |

**Recommendation:** Use `float32` for physiological data. It provides sufficient precision for all common biosignal types while keeping bandwidth low.

---

## Error Handling

All methods return Promises that reject with a descriptive error string on failure.

```javascript
try {
    await LSL.pushSample('invalid_id', [1.0]);
} catch (error) {
    console.error('LSL error:', error);
    // "Outlet not found: invalid_id"
}
```

Common errors:
- `"Outlet not found: ..."` — outlet was destroyed or ID is invalid
- `"Data length (X) does not match channelCount (Y)"` — wrong number of values
- `"Could not determine Wi-Fi IP address"` — Wi-Fi not connected
- `"Failed to create LSL outlet"` — native library error

---

## TypeScript

Import types from the plugin:

```typescript
import type { CreateOutletOptions, ChannelFormat, StreamMetadata } from 'cordova-plugin-lsl';

// LSL is available as a global after deviceready
declare var LSL: import('cordova-plugin-lsl').LSLPlugin;

const options: CreateOutletOptions = {
    name: 'eSense_EDA',
    type: 'EDA',
    channelCount: 1,
    sampleRate: 5,
    channelFormat: 'float32'
};

const outletId: string = await LSL.createOutlet(options);
```

---

## Thread Safety

The plugin is fully thread-safe:
- **Android:** `ConcurrentHashMap` for outlet storage, `ExecutorService` for background operations
- **iOS:** `@synchronized` blocks for outlet dictionary access, `runInBackground` for native calls

All LSL operations run on background threads to avoid blocking the UI.
