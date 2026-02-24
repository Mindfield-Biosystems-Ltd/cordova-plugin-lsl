# cordova-plugin-lsl

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Cordova Android](https://img.shields.io/badge/Cordova--Android-%3E%3D14.0.0-green)](https://cordova.apache.org)
[![Cordova iOS](https://img.shields.io/badge/Cordova--iOS-%3E%3D8.0.0-green)](https://cordova.apache.org)

**Lab Streaming Layer (LSL) plugin for Apache Cordova.** Stream physiological biosignal data from mobile devices to LSL-compatible recording software like [LabRecorder](https://github.com/labstreaminglayer/App-LabRecorder).

This is the **first and only** Cordova plugin for LSL, enabling mobile biosignal apps to participate in the [Lab Streaming Layer](https://labstreaminglayer.readthedocs.io/) ecosystem used by neuroscience researchers worldwide.

## Features

- **Outlet (Sender):** Stream data from your mobile app to any LSL consumer
- **Multi-Stream:** Run multiple outlets simultaneously (e.g., 5 sensor streams at once)
- **Rich Metadata:** Embed channel labels, units, and device info in stream XML
- **High Precision:** Sub-millisecond timestamps via LSL's built-in clock synchronization
- **KnownPeers Discovery:** No multicast required — works on any Wi-Fi network
- **All Data Types:** float32, double64, int32, int16, int8, string
- **Native Performance:** Direct C API calls via JNI (Android) and Objective-C (iOS)
- **Memory Safe:** Automatic cleanup on app exit/navigation via native lifecycle hooks
- **TypeScript Support:** Full type definitions included

## Use Cases

- Stream EDA, Temperature, EMG, EEG, PPG data to LabRecorder for XDF recording
- Synchronize mobile sensor data with desktop EEG systems
- Multi-device research setups with synchronized timestamps
- Any Cordova/Ionic app that needs to send data to LSL consumers

## Requirements

| Platform | Minimum | Tested |
|----------|---------|--------|
| Cordova | 10.0.0 | 12.x |
| cordova-android | 14.0.0 | 14.0.0 |
| cordova-ios | 8.0.0 | 8.0.0 |
| Android | 10 (SDK 29) | 14 |
| iOS | 13.0 | 17.x |

## Installation

```bash
cordova plugin add cordova-plugin-lsl
```

Or from GitHub:

```bash
cordova plugin add https://github.com/Mindfield-Biosystems-Ltd/cordova-plugin-lsl.git
```

Or from a local path:

```bash
cordova plugin add ./cordova-plugin-lsl
```

## Quick Start

```javascript
document.addEventListener('deviceready', async function() {

    // 1. Create an outlet
    const outletId = await LSL.createOutlet({
        name: 'MyApp_EDA',
        type: 'EDA',
        channelCount: 1,
        sampleRate: 5.0,
        channelFormat: 'float32',
        sourceId: 'myapp-device-001',
        metadata: {
            manufacturer: 'My Company',
            device: 'My Sensor',
            channels: [
                { label: 'EDA', unit: 'microsiemens', type: 'EDA' }
            ]
        }
    });

    // 2. Show IP for KnownPeers setup on PC
    const ip = await LSL.getDeviceIP();
    console.log('Add this IP to lsl_api.cfg on your PC: ' + ip);

    // 3. Stream data
    const interval = setInterval(async () => {
        const edaValue = readSensorValue(); // your sensor reading
        await LSL.pushSample(outletId, [edaValue]);
    }, 200); // 5 Hz

    // 4. Cleanup when done
    // clearInterval(interval);
    // await LSL.destroyOutlet(outletId);

}, false);
```

## KnownPeers Setup (Required)

LSL uses **KnownPeers** for stream discovery across devices. No multicast or special permissions needed.

### Step 1: Get the Device IP

Your app displays the smartphone's IP address (from `LSL.getDeviceIP()`).

### Step 2: Create lsl_api.cfg on Your PC

**Windows:** `%HOMEPATH%\lsl_api\lsl_api.cfg`
**macOS/Linux:** `~/lsl_api/lsl_api.cfg`

```ini
[lab]
KnownPeers = {192.168.1.100}
```

Replace `192.168.1.100` with your smartphone's IP.

### Step 3: Open LabRecorder

1. Launch [LabRecorder](https://github.com/labstreaminglayer/App-LabRecorder/releases)
2. Click "Update" — your streams appear in the list
3. Select streams and start recording

For detailed instructions, see [docs/KNOWN-PEERS-SETUP.md](docs/KNOWN-PEERS-SETUP.md).

## API Reference

### Outlet Operations

#### `LSL.createOutlet(options)` → `Promise<string>`

Create a new LSL outlet.

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `name` | string | Yes | Stream name (e.g. "eSense_EDA") |
| `type` | string | Yes | Stream type (e.g. "EDA", "EMG") |
| `channelCount` | number | Yes | Number of channels (>= 1) |
| `sampleRate` | number | Yes | Sampling rate in Hz (0 for irregular) |
| `channelFormat` | string | Yes | `"float32"` \| `"double64"` \| `"int32"` \| `"int16"` \| `"int8"` \| `"string"` |
| `sourceId` | string | No | Unique source identifier |
| `metadata` | object | No | Stream metadata (see below) |

**Metadata object:**

| Field | Type | Description |
|-------|------|-------------|
| `manufacturer` | string | Manufacturer name |
| `device` | string | Device name |
| `channels` | array | Array of `{label, unit, type}` |

#### `LSL.pushSample(outletId, data, timestamp?)` → `Promise<void>`

Push a single sample. If `timestamp` is omitted, native code timestamps automatically.

**WARNING:** Never use `Date.now()` for timestamps. Only use values from `LSL.getLocalClock()`.

#### `LSL.pushChunk(outletId, data)` → `Promise<void>`

Push multiple samples at once. More efficient than individual `pushSample` calls. Recommended for sample rates above 10 Hz.

```javascript
await LSL.pushChunk(outletId, [
    [1.5],
    [1.6],
    [1.4],
    [1.7],
    [1.5]
]);
```

#### `LSL.hasConsumers(outletId)` → `Promise<boolean>`

Check if any consumers (e.g. LabRecorder) are connected.

#### `LSL.waitForConsumers(outletId, timeout)` → `Promise<boolean>`

Block until a consumer connects or timeout (in seconds) expires.

#### `LSL.destroyOutlet(outletId)` → `Promise<void>`

Destroy a single outlet and release its resources.

#### `LSL.destroyAllOutlets()` → `Promise<void>`

Destroy all outlets. Also called automatically on app exit.

### Utility

#### `LSL.getLocalClock()` → `Promise<number>`

Get the current LSL clock timestamp (high-resolution monotonic, in seconds).

#### `LSL.getLibraryVersion()` → `Promise<string>`

Get liblsl version (e.g. "1.17.5").

#### `LSL.getProtocolVersion()` → `Promise<number>`

Get LSL protocol version number.

#### `LSL.getDeviceIP()` → `Promise<string>`

Get the device's Wi-Fi IP address for KnownPeers configuration.

## Multiple Streams (eSense Example)

```javascript
// Create 5 separate outlets for 5 sensor types
const eda = await LSL.createOutlet({
    name: 'eSense_EDA', type: 'EDA',
    channelCount: 1, sampleRate: 5, channelFormat: 'float32'
});

const temp = await LSL.createOutlet({
    name: 'eSense_Temperature', type: 'Temperature',
    channelCount: 1, sampleRate: 5, channelFormat: 'float32'
});

const pulse = await LSL.createOutlet({
    name: 'eSense_Pulse', type: 'PPG',
    channelCount: 2, sampleRate: 5, channelFormat: 'float32'
});

const resp = await LSL.createOutlet({
    name: 'eSense_Respiration', type: 'Respiration',
    channelCount: 1, sampleRate: 5, channelFormat: 'float32'
});

const emg = await LSL.createOutlet({
    name: 'eSense_Muscle', type: 'EMG',
    channelCount: 2, sampleRate: 5, channelFormat: 'float32'
});

// Push data to each outlet independently
await LSL.pushSample(eda, [3.7]);
await LSL.pushSample(temp, [33.2]);
await LSL.pushSample(pulse, [72, 833]);
await LSL.pushSample(resp, [0.85]);
await LSL.pushSample(emg, [45.2, 82.0]);

// Cleanup
await LSL.destroyAllOutlets();
```

See [examples/](examples/) for complete working examples.

## PC Software for Testing

### LabRecorder (Primary)

- **Download:** [github.com/labstreaminglayer/App-LabRecorder/releases](https://github.com/labstreaminglayer/App-LabRecorder/releases)
- Records LSL streams to XDF files
- Supports KnownPeers configuration

### BrainVision LSL Viewer (Optional)

- **Download:** Free from [Brain Products](https://pressrelease.brainproducts.com/lsl-viewer/)
- Real-time visualization of LSL streams

## Best Practices

1. **Use `pushChunk` for rates > 10 Hz** to reduce JS bridge overhead
2. **Never use `Date.now()` for timestamps** — use `LSL.getLocalClock()` or omit (recommended)
3. **One outlet per sensor type** — separate streams for EDA, Temperature, etc.
4. **Call `destroyAllOutlets()` on cleanup** — though native lifecycle hooks provide fallback
5. **Use `cordova-plugin-insomnia`** for long recording sessions to prevent screen sleep
6. **Display `getDeviceIP()` to users** — they need it for KnownPeers setup on PC

## Troubleshooting

### Stream not visible in LabRecorder

1. Verify both devices are on the **same Wi-Fi network**
2. Check that `lsl_api.cfg` contains the correct smartphone IP
3. Some corporate/university Wi-Fi networks have **client isolation** enabled — use a mobile hotspot instead
4. Click "Update" in LabRecorder to refresh the stream list

### Connection drops during recording

1. Keep the app in the foreground
2. Use `cordova-plugin-insomnia` to prevent screen sleep
3. iOS may throttle background networking — keep screen active

### getDeviceIP returns error

1. Ensure Wi-Fi is connected (not cellular)
2. On Android 10+, the app may need `ACCESS_FINE_LOCATION` permission for IP detection

## Building liblsl from Source

Pre-built binaries are included in the plugin. To build from source:

```bash
# Android (requires Android NDK)
./scripts/build-android.sh

# iOS (requires Xcode + CMake)
./scripts/build-ios.sh
```

See [docs/BUILD-FROM-SOURCE.md](docs/BUILD-FROM-SOURCE.md) for details.

## Documentation

- [API Reference](docs/API-REFERENCE.md) — Full API documentation
- [LSL Protocol](docs/PROTOCOL.md) — LSL explained (vs OSC)
- [KnownPeers Setup](docs/KNOWN-PEERS-SETUP.md) — Step-by-step guide
- [Testing Guide](docs/TESTING-GUIDE.md) — PC software setup + tests
- [Build from Source](docs/BUILD-FROM-SOURCE.md) — Compile liblsl yourself

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License — Copyright (c) 2026 [Mindfield Biosystems Ltd.](https://www.mindfield.de)

See [LICENSE](LICENSE) for the full text.

## Credits

- [liblsl](https://github.com/sccn/liblsl) — Lab Streaming Layer C/C++ library (MIT)
- [Lab Streaming Layer](https://labstreaminglayer.readthedocs.io/) — The LSL ecosystem
- [LabRecorder](https://github.com/labstreaminglayer/App-LabRecorder) — XDF recording software
