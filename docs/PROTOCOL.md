# LSL Protocol — How It Works

This document explains the Lab Streaming Layer (LSL) protocol, how it compares to OSC, and why it's the standard for neuroscience research.

## What is LSL?

**Lab Streaming Layer (LSL)** is an open-source system for real-time streaming, time synchronization, and recording of time-series data across devices and applications on a local network.

Developed at the Swartz Center for Computational Neuroscience (SCCN) at UC San Diego, LSL is the de facto standard for multi-device data acquisition in neuroscience, brain-computer interfaces, and physiological research.

## LSL vs OSC

| Aspect | OSC (Open Sound Control) | LSL (Lab Streaming Layer) |
|--------|--------------------------|---------------------------|
| **Transport** | UDP (unreliable, no delivery guarantee) | TCP (reliable, ordered delivery) |
| **Discovery** | Manual (must know IP:Port) | KnownPeers or Multicast (automatic) |
| **Time Sync** | None (relies on NTP or manual offset) | Built-in sub-millisecond synchronization |
| **Metadata** | None | Rich XML (channels, units, device info) |
| **Recording** | Requires custom solution | XDF format, multi-stream, synchronized |
| **Data Types** | int32, float32, string, blob | float32, double64, int32, int16, int8, string |
| **Multi-Stream** | Separate ports per stream | Single discovery, multiple streams |
| **Buffering** | None (fire and forget) | Configurable ring buffer |
| **Target Users** | Musicians, media artists | Researchers, neuroscientists |
| **Software** | Custom receivers | LabRecorder, BrainVision LSL Viewer, MATLAB, Python |

### Why Researchers Prefer LSL

1. **Time Synchronization:** LSL synchronizes clocks across devices with sub-millisecond accuracy. Critical for correlating EEG with physiological signals.

2. **XDF Recording:** LabRecorder saves all streams into a single XDF file with synchronized timestamps. No manual alignment needed.

3. **Rich Metadata:** Each stream carries XML metadata describing channels, units, device info. Analysis software can auto-configure.

4. **Reliable Transport:** TCP ensures no data loss. UDP/OSC silently drops packets under load.

## How LSL Works

### Stream Architecture

```
┌─────────────────┐     TCP      ┌───────────────────┐
│   Outlet         │ ──────────→ │   Inlet            │
│   (Sender)       │             │   (Receiver)       │
│                  │             │                    │
│   - Stream Info  │             │   - Resolves       │
│   - Push Samples │             │     streams        │
│   - Buffer       │             │   - Pull Samples   │
│                  │             │   - Time Correction│
└─────────────────┘             └───────────────────┘
    Smartphone                       PC (LabRecorder)
```

### Stream Info (Metadata)

Every stream carries structured metadata:

```xml
<info>
    <name>eSense_EDA</name>
    <type>EDA</type>
    <channel_count>1</channel_count>
    <nominal_srate>5.0</nominal_srate>
    <channel_format>float32</channel_format>
    <source_id>esense-eda-001</source_id>
    <desc>
        <manufacturer>Mindfield Biosystems</manufacturer>
        <device>eSense EDA</device>
        <channels>
            <channel>
                <label>EDA</label>
                <unit>microsiemens</unit>
                <type>EDA</type>
            </channel>
        </channels>
    </desc>
</info>
```

### Discovery: KnownPeers

This plugin uses **KnownPeers** mode for stream discovery:

1. The outlet (phone) binds to a TCP port and announces itself
2. The inlet (PC) queries KnownPeers IPs for available streams
3. TCP connection is established for data transfer
4. Time offset negotiation begins automatically

No multicast required — works on any Wi-Fi network, including restrictive corporate networks.

### Time Synchronization

LSL provides automatic clock synchronization:

1. Each device has a high-resolution monotonic clock (`lsl_local_clock`)
2. When an inlet connects to an outlet, they exchange clock samples
3. The offset is estimated with sub-millisecond precision
4. All timestamps in the recorded XDF file are aligned to a common clock

This means you can combine data from a phone (EDA sensor) and a desktop EEG system, and the timestamps will be synchronized automatically.

## Data Flow in This Plugin

```
┌──────────────┐
│  Your App    │
│  (JS/TS)     │
│              │
│  LSL.push    │
│  Sample()    │
└──────┬───────┘
       │ cordova.exec()
       ▼
┌──────────────┐
│  Native      │
│  Plugin      │
│  (Java/ObjC) │
│              │
│  Convert to  │
│  C types     │
└──────┬───────┘
       │ JNI / direct C call
       ▼
┌──────────────┐
│  liblsl      │
│  (C library) │
│              │
│  Buffer +    │
│  TCP Send    │
└──────┬───────┘
       │ TCP
       ▼
┌──────────────┐
│  LabRecorder │
│  (PC)        │
│              │
│  Receive +   │
│  Write XDF   │
└──────────────┘
```

## XDF File Format

LabRecorder saves data in XDF (Extensible Data Format):

- **Multi-stream:** All streams in a single file
- **Synchronized:** All timestamps aligned via LSL clock sync
- **Self-describing:** Stream metadata embedded in the file header
- **Open format:** Readable by MATLAB (xdf library), Python (pyxdf), and many analysis tools

### Reading XDF in Python

```python
import pyxdf

data, header = pyxdf.load_xdf('recording.xdf')

for stream in data:
    print(f"Stream: {stream['info']['name'][0]}")
    print(f"Type: {stream['info']['type'][0]}")
    print(f"Samples: {stream['time_series'].shape}")
    print(f"Timestamps: {stream['time_stamps'].shape}")
```

### Reading XDF in MATLAB

```matlab
[streams, header] = load_xdf('recording.xdf');

for i = 1:length(streams)
    fprintf('Stream: %s\n', streams{i}.info.name);
    fprintf('Type: %s\n', streams{i}.info.type);
    fprintf('Samples: %d x %d\n', size(streams{i}.time_series));
end
```

## Further Reading

- [LSL Documentation](https://labstreaminglayer.readthedocs.io/)
- [LSL GitHub Organization](https://github.com/labstreaminglayer)
- [XDF Format Specification](https://github.com/sccn/xdf)
- [pyXDF (Python XDF Reader)](https://github.com/xdf-modules/pyxdf)
- [liblsl API Documentation](https://labstreaminglayer.readthedocs.io/projects/liblsl/ref/index.html)
