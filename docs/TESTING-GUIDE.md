# Testing Guide

Complete guide for testing cordova-plugin-lsl with PC-based LSL recording software.

## PC Software Setup

### Primary: LabRecorder v1.16.5

LabRecorder is the standard tool for recording LSL streams to XDF files.

**Download:**
- [GitHub Releases](https://github.com/labstreaminglayer/App-LabRecorder/releases)
- Windows: Download standalone `.exe` or `.msi`
- macOS: `brew install labrecorder` (via Homebrew)
- Linux: AppImage from GitHub releases

**Features:**
- Discovers LSL streams on the network
- Records all selected streams to a single XDF file
- Supports KnownPeers for cross-device discovery

### Secondary: BrainVision LSL Viewer

Real-time visualization of LSL streams with line graphs.

**Download:**
- [Brain Products (free)](https://pressrelease.brainproducts.com/lsl-viewer/)
- Windows only

**Use case:** Visual debugging — see data flowing in real-time.

### Optional: Python + pyXDF

For programmatic verification of recorded XDF files.

```bash
pip install pyxdf matplotlib
```

```python
import pyxdf
import matplotlib.pyplot as plt

data, header = pyxdf.load_xdf('recording.xdf')

for stream in data:
    name = stream['info']['name'][0]
    ts = stream['time_stamps']
    values = stream['time_series']
    print(f"{name}: {len(ts)} samples, {values.shape[1]} channels")

    plt.figure()
    plt.plot(ts, values)
    plt.title(name)
    plt.xlabel('Time (s)')
    plt.show()
```

## KnownPeers Configuration

Before any test, set up KnownPeers on the PC:

1. Get the phone's IP from `LSL.getDeviceIP()` or Wi-Fi settings
2. Create `lsl_api.cfg` (see [KNOWN-PEERS-SETUP.md](KNOWN-PEERS-SETUP.md))
3. Verify connectivity: `ping <phone-ip>` from PC

## Test Scenarios

### Test 1: Single Stream (EDA)

**Purpose:** Verify basic outlet creation and data flow.

**Steps:**
1. Start the app with EDA streaming enabled
2. Open LabRecorder on PC
3. Click "Update" — `eSense_EDA` should appear
4. Select the stream, start recording
5. Let it run for 60 seconds
6. Stop recording

**Expected Results:**
- Stream appears in LabRecorder within 5 seconds of "Update"
- Sample count: ~300 samples (60s x 5 Hz)
- No data gaps in the XDF file
- Values within expected range (0.5-20 uS for EDA)

### Test 2: Multi-Stream (All 5 Sensors)

**Purpose:** Verify multiple simultaneous outlets.

**Steps:**
1. Start the app with all 5 sensors streaming
2. Open LabRecorder, click "Update"
3. All 5 streams should appear:
   - `eSense_EDA` (1 ch)
   - `eSense_Temperature` (1 ch)
   - `eSense_Pulse` (2 ch)
   - `eSense_Respiration` (1 ch)
   - `eSense_Muscle` (2 ch)
4. Select all 5, start recording
5. Record for 120 seconds
6. Stop and verify XDF

**Expected Results:**
- All 5 streams visible simultaneously
- 7 total channels across all streams
- Timestamps synchronized (within 1ms of each other)
- No stream drops during recording

### Test 3: Sample Rate Verification

**Purpose:** Verify configurable sample rates.

**Steps:**
1. Create outlets at 2 Hz, 5 Hz, and 10 Hz
2. Record for 60 seconds each
3. Count samples in XDF

**Expected Results:**
- 2 Hz: ~120 samples (60 x 2)
- 5 Hz: ~300 samples (60 x 5)
- 10 Hz: ~600 samples (60 x 10)
- Tolerance: +/- 5%

### Test 4: Reconnection

**Purpose:** Verify behavior when LabRecorder disconnects and reconnects.

**Steps:**
1. Start streaming, connect LabRecorder
2. Close LabRecorder (stream should continue on phone)
3. Reopen LabRecorder, click "Update"
4. Stream should reappear
5. Start new recording

**Expected Results:**
- Phone continues streaming without error
- Stream reappears in LabRecorder after reconnect
- No crash or memory leak on phone

### Test 5: Duration (30 Minutes)

**Purpose:** Verify stability over extended recording.

**Steps:**
1. Start all 5 streams
2. Use `cordova-plugin-insomnia` to prevent screen sleep
3. Record with LabRecorder for 30 minutes
4. Monitor phone memory usage

**Expected Results:**
- No data gaps in the 30-minute recording
- Phone memory usage stable (no continuous increase)
- No app crashes or stream drops
- XDF file contains ~9000 samples per 5 Hz stream

### Test 6: hasConsumers / waitForConsumers

**Purpose:** Verify consumer detection works.

**Steps:**
1. Create outlet, call `hasConsumers` — should return `false`
2. Connect LabRecorder
3. Call `hasConsumers` — should return `true`
4. Disconnect LabRecorder
5. Call `hasConsumers` — should return `false`

**Alternative:**
1. Create outlet
2. Call `waitForConsumers(outletId, 30)`
3. Within 30 seconds, connect LabRecorder
4. Promise should resolve with `true`

### Test 7: Cleanup

**Purpose:** Verify proper resource cleanup.

**Steps:**
1. Create 5 outlets
2. Call `destroyAllOutlets()`
3. Check LabRecorder — all streams should disappear
4. Create new outlets — should work without issues

**Alternative (App Kill):**
1. Create outlets, connect LabRecorder
2. Force-kill the app (swipe away)
3. Streams should disappear from LabRecorder
4. Reopen app, create new outlets — should work

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Stream not in LabRecorder | Wrong IP in KnownPeers | Verify IP, update lsl_api.cfg |
| Stream not in LabRecorder | Client isolation | Use mobile hotspot |
| Stream not in LabRecorder | Firewall | Add LabRecorder to firewall exceptions |
| Data gaps in XDF | App backgrounded | Use cordova-plugin-insomnia |
| Wrong sample count | Timer drift | Use pushChunk for better accuracy |
| Crash on outlet creation | liblsl not loaded | Check native library paths |
| Memory increasing | Outlet leak | Ensure destroyOutlet is called |
