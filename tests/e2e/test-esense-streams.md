# E2E Test: All 5 eSense Sensor Streams

Manual end-to-end test for streaming all 5 eSense sensor types simultaneously through cordova-plugin-lsl and recording them with LabRecorder.

---

## Prerequisites

| Component | Requirement |
|-----------|-------------|
| LabRecorder | >= 1.16, installed on PC |
| Cordova test app | Installed on device with cordova-plugin-lsl |
| Network | Device and PC on the same Wi-Fi subnet |
| lsl_api.cfg | Configured with device IP as KnownPeer (see `test-labrecorder.md`) |

---

## Stream Definitions

All 5 streams that the eSense app creates via cordova-plugin-lsl:

| # | Stream Name | Type | Channels | Channel Labels | Units | Rate |
|---|-------------|------|----------|----------------|-------|------|
| 1 | eSense_EDA | EDA | 1 | EDA | microsiemens | 5 Hz |
| 2 | eSense_Temperature | Temperature | 1 | Temperature | celsius | 5 Hz |
| 3 | eSense_Pulse | PPG | 2 | BPM, IBI | bpm, ms | 5 Hz |
| 4 | eSense_Respiration | Respiration | 1 | Respiration | breaths_per_min | 5 Hz |
| 5 | eSense_EMG | EMG | 2 | RMS, MedianFreq | uV, Hz | 5 Hz |

Total channels across all streams: **7**

---

## Test Procedure

### Step 1: Start All 5 Streams on Device

Create all 5 outlets in the Cordova test app:

```javascript
var outlets = {};
var intervals = {};

function createAllStreams() {
    var configs = [
        {
            key: 'eda',
            name: 'eSense_EDA',
            type: 'EDA',
            channelCount: 1,
            sampleRate: 5,
            channelFormat: 'float32',
            sourceId: 'esense-eda-001',
            metadata: {
                manufacturer: 'Mindfield Biosystems',
                device: 'eSense EDA',
                channels: [{ label: 'EDA', unit: 'microsiemens', type: 'EDA' }]
            }
        },
        {
            key: 'temperature',
            name: 'eSense_Temperature',
            type: 'Temperature',
            channelCount: 1,
            sampleRate: 5,
            channelFormat: 'float32',
            sourceId: 'esense-temp-001',
            metadata: {
                manufacturer: 'Mindfield Biosystems',
                device: 'eSense Temperature',
                channels: [{ label: 'Temperature', unit: 'celsius', type: 'Temperature' }]
            }
        },
        {
            key: 'pulse',
            name: 'eSense_Pulse',
            type: 'PPG',
            channelCount: 2,
            sampleRate: 5,
            channelFormat: 'float32',
            sourceId: 'esense-pulse-001',
            metadata: {
                manufacturer: 'Mindfield Biosystems',
                device: 'eSense Pulse',
                channels: [
                    { label: 'BPM', unit: 'bpm', type: 'PPG' },
                    { label: 'IBI', unit: 'ms', type: 'PPG' }
                ]
            }
        },
        {
            key: 'respiration',
            name: 'eSense_Respiration',
            type: 'Respiration',
            channelCount: 1,
            sampleRate: 5,
            channelFormat: 'float32',
            sourceId: 'esense-resp-001',
            metadata: {
                manufacturer: 'Mindfield Biosystems',
                device: 'eSense Respiration',
                channels: [{ label: 'Respiration', unit: 'breaths_per_min', type: 'Respiration' }]
            }
        },
        {
            key: 'emg',
            name: 'eSense_EMG',
            type: 'EMG',
            channelCount: 2,
            sampleRate: 5,
            channelFormat: 'float32',
            sourceId: 'esense-emg-001',
            metadata: {
                manufacturer: 'Mindfield Biosystems',
                device: 'eSense EMG',
                channels: [
                    { label: 'RMS', unit: 'uV', type: 'EMG' },
                    { label: 'MedianFreq', unit: 'Hz', type: 'EMG' }
                ]
            }
        }
    ];

    var chain = Promise.resolve();
    configs.forEach(function (cfg) {
        var key = cfg.key;
        delete cfg.key; // remove non-LSL field
        chain = chain.then(function () {
            return LSL.createOutlet(cfg).then(function (id) {
                outlets[key] = id;
                console.log('Created:', cfg.name, '->', id);
            });
        });
    });

    return chain.then(function () {
        console.log('All 5 outlets created.');
    });
}

createAllStreams();
```

### Step 2: Start Pushing Simulated Data

```javascript
function startPushing() {
    // EDA: 2-5 microsiemens, slow drift
    var edaBase = 3.0;
    intervals.eda = setInterval(function () {
        edaBase += (Math.random() - 0.5) * 0.1;
        edaBase = Math.max(1.0, Math.min(10.0, edaBase));
        LSL.pushSample(outlets.eda, [edaBase]);
    }, 200);

    // Temperature: 30-35 celsius, very slow drift
    var tempBase = 32.0;
    intervals.temperature = setInterval(function () {
        tempBase += (Math.random() - 0.5) * 0.02;
        tempBase = Math.max(28.0, Math.min(38.0, tempBase));
        LSL.pushSample(outlets.temperature, [tempBase]);
    }, 200);

    // Pulse: BPM 60-100, IBI calculated from BPM
    var bpmBase = 72;
    intervals.pulse = setInterval(function () {
        bpmBase += (Math.random() - 0.5) * 2;
        bpmBase = Math.max(50, Math.min(120, bpmBase));
        var ibi = 60000.0 / bpmBase; // ms
        LSL.pushSample(outlets.pulse, [bpmBase, ibi]);
    }, 200);

    // Respiration: 12-20 breaths/min
    var respBase = 16.0;
    intervals.respiration = setInterval(function () {
        respBase += (Math.random() - 0.5) * 0.5;
        respBase = Math.max(8.0, Math.min(30.0, respBase));
        LSL.pushSample(outlets.respiration, [respBase]);
    }, 200);

    // EMG: RMS 10-100 uV, Median Freq 50-200 Hz
    var emgRms = 50.0;
    intervals.emg = setInterval(function () {
        emgRms += (Math.random() - 0.5) * 5;
        emgRms = Math.max(5.0, Math.min(200.0, emgRms));
        var medFreq = 80 + (Math.random() - 0.5) * 20;
        LSL.pushSample(outlets.emg, [emgRms, medFreq]);
    }, 200);

    console.log('All 5 streams pushing at 5 Hz.');
}

startPushing();
```

### Step 3: Verify in LabRecorder

1. Open LabRecorder on PC
2. Click **Update** to refresh the stream list
3. All 5 streams should appear:
   - [ ] `eSense_EDA` (EDA, 1ch, 5Hz, float32)
   - [ ] `eSense_Temperature` (Temperature, 1ch, 5Hz, float32)
   - [ ] `eSense_Pulse` (PPG, 2ch, 5Hz, float32)
   - [ ] `eSense_Respiration` (Respiration, 1ch, 5Hz, float32)
   - [ ] `eSense_EMG` (EMG, 2ch, 5Hz, float32)
4. Verify each stream's metadata by clicking on it in LabRecorder

### Step 4: Record for 1 Minute

1. Select **all 5 streams** (check all boxes)
2. Set filename: `test_all_esense_1min.xdf`
3. Click **Start**
4. Wait **60 seconds**
5. Click **Stop**

### Step 5: Stop All Streams on Device

```javascript
function stopAll() {
    Object.keys(intervals).forEach(function (key) {
        clearInterval(intervals[key]);
    });
    intervals = {};

    return LSL.destroyAllOutlets().then(function () {
        outlets = {};
        console.log('All outlets destroyed.');
    });
}

stopAll();
```

---

## Verification: XDF File Contains All 5 Streams

### Python Verification Script

```python
import pyxdf
import numpy as np

data, header = pyxdf.load_xdf('test_all_esense_1min.xdf')

print(f"Number of streams in XDF: {len(data)}")
print("=" * 70)

expected_streams = {
    'eSense_EDA':         {'type': 'EDA',         'channels': 1, 'rate': 5.0},
    'eSense_Temperature': {'type': 'Temperature', 'channels': 1, 'rate': 5.0},
    'eSense_Pulse':       {'type': 'PPG',         'channels': 2, 'rate': 5.0},
    'eSense_Respiration': {'type': 'Respiration', 'channels': 1, 'rate': 5.0},
    'eSense_EMG':         {'type': 'EMG',         'channels': 2, 'rate': 5.0},
}

found_streams = set()

for stream in data:
    info = stream['info']
    name = info['name'][0]
    stype = info['type'][0]
    ch_count = int(info['channel_count'][0])
    nom_rate = float(info['nominal_srate'][0])
    n_samples = len(stream['time_stamps'])
    duration = 0
    actual_rate = 0

    if n_samples > 1:
        timestamps = stream['time_stamps']
        duration = timestamps[-1] - timestamps[0]
        intervals = np.diff(timestamps)
        actual_rate = 1.0 / np.mean(intervals)

    found_streams.add(name)

    print(f"\nStream: {name}")
    print(f"  Type:           {stype}")
    print(f"  Channels:       {ch_count}")
    print(f"  Nominal Rate:   {nom_rate} Hz")
    print(f"  Samples:        {n_samples}")
    print(f"  Duration:       {duration:.1f} s")
    print(f"  Actual Rate:    {actual_rate:.2f} Hz")

    # Validate against expected
    if name in expected_streams:
        exp = expected_streams[name]
        status = "PASS" if (
            stype == exp['type'] and
            ch_count == exp['channels'] and
            abs(nom_rate - exp['rate']) < 0.1 and
            n_samples > 0
        ) else "FAIL"
        print(f"  Validation:     {status}")
    else:
        print(f"  Validation:     UNEXPECTED STREAM")

# Check all expected streams are present
print("\n" + "=" * 70)
missing = set(expected_streams.keys()) - found_streams
if missing:
    print(f"FAIL: Missing streams: {missing}")
else:
    print("PASS: All 5 expected streams found in XDF file.")
```

### Verification Checklist

- [ ] XDF file loads without errors
- [ ] Exactly 5 streams present
- [ ] All stream names match expected names
- [ ] All stream types match expected types
- [ ] All channel counts match (1, 1, 2, 1, 2)
- [ ] All nominal rates are 5.0 Hz
- [ ] All streams have > 0 samples
- [ ] All streams have approximately 300 samples (60s * 5Hz)
- [ ] No stream has fewer than 200 samples (allows for startup delay)

---

## Rate Verification

Test different sample rates to verify timing accuracy.

### Test Matrix

| Stream | Configured Rate | Push Interval | Expected Samples (60s) |
|--------|----------------|---------------|------------------------|
| EDA | 2 Hz | 500 ms | ~120 |
| Temperature | 5 Hz | 200 ms | ~300 |
| Pulse | 10 Hz | 100 ms | ~600 |
| Respiration | 5 Hz | 200 ms | ~300 |
| EMG | 10 Hz | 100 ms | ~600 |

### Rate Test Procedure

1. Modify `createAllStreams()` to use different sample rates per the table above
2. Adjust `setInterval` durations accordingly
3. Record for 60 seconds
4. Verify actual rates in the XDF file:

```python
for stream in data:
    name = stream['info']['name'][0]
    nom_rate = float(stream['info']['nominal_srate'][0])
    timestamps = stream['time_stamps']
    if len(timestamps) > 10:
        actual_rate = 1.0 / np.mean(np.diff(timestamps))
        deviation = abs(actual_rate - nom_rate) / nom_rate * 100
        status = "PASS" if deviation < 20 else "FAIL"
        print(f"{name}: nominal={nom_rate}Hz, actual={actual_rate:.2f}Hz, "
              f"deviation={deviation:.1f}% [{status}]")
```

### Rate Acceptance Criteria

| Rate | Acceptable Range | Tolerance |
|------|-----------------|-----------|
| 2 Hz | 1.6 - 2.4 Hz | 20% |
| 5 Hz | 4.0 - 6.0 Hz | 20% |
| 10 Hz | 8.0 - 12.0 Hz | 20% |

Note: JavaScript `setInterval` is not a real-time clock. On mobile devices, timing may drift under CPU load. The 20% tolerance accounts for this. Real sensor data from eSense hardware will have better timing characteristics since it is driven by the sensor's hardware clock.

---

## Duration Test (30 Minutes)

Long-running stability test to verify no memory leaks, crashes, or stream degradation.

### Procedure

1. Create all 5 streams (Step 1 above)
2. Start pushing data (Step 2 above)
3. Start recording in LabRecorder
4. Wait **30 minutes** (1800 seconds)
5. Observe device during the test:
   - [ ] App remains in foreground
   - [ ] No ANR (Application Not Responding) dialogs
   - [ ] Device does not overheat excessively
6. Stop recording in LabRecorder
7. Stop all streams on device (Step 5 above)

### Expected Results (30 min at 5 Hz)

| Stream | Expected Samples | Min Acceptable |
|--------|-----------------|----------------|
| eSense_EDA | ~9,000 | 7,200 (80%) |
| eSense_Temperature | ~9,000 | 7,200 (80%) |
| eSense_Pulse | ~9,000 | 7,200 (80%) |
| eSense_Respiration | ~9,000 | 7,200 (80%) |
| eSense_EMG | ~9,000 | 7,200 (80%) |

### Duration Test Verification

```python
import pyxdf
import numpy as np

data, header = pyxdf.load_xdf('test_all_esense_30min.xdf')

print("30-Minute Duration Test Results")
print("=" * 70)

for stream in data:
    name = stream['info']['name'][0]
    timestamps = stream['time_stamps']
    n = len(timestamps)

    if n < 2:
        print(f"{name}: FAIL - only {n} samples")
        continue

    duration = timestamps[-1] - timestamps[0]
    actual_rate = 1.0 / np.mean(np.diff(timestamps))

    # Check for gaps (pauses > 2 seconds)
    intervals = np.diff(timestamps)
    gaps = np.where(intervals > 2.0)[0]
    max_gap = np.max(intervals) if len(intervals) > 0 else 0

    # Check for rate stability over time (split into 5-minute windows)
    window_rates = []
    window_size = 300  # 5 minutes in seconds
    t0 = timestamps[0]
    for w_start in np.arange(0, duration, window_size):
        mask = (timestamps - t0 >= w_start) & (timestamps - t0 < w_start + window_size)
        window_ts = timestamps[mask]
        if len(window_ts) > 10:
            w_rate = 1.0 / np.mean(np.diff(window_ts))
            window_rates.append(w_rate)

    rate_stability = np.std(window_rates) if len(window_rates) > 1 else 0

    status = "PASS" if n >= 7200 and len(gaps) == 0 else "FAIL"

    print(f"\n{name}:")
    print(f"  Samples:        {n}")
    print(f"  Duration:       {duration:.1f} s ({duration/60:.1f} min)")
    print(f"  Actual Rate:    {actual_rate:.2f} Hz")
    print(f"  Gaps > 2s:      {len(gaps)}")
    print(f"  Max Interval:   {max_gap:.3f} s")
    print(f"  Rate Stability: {rate_stability:.3f} Hz std across 5-min windows")
    print(f"  Result:         {status}")
```

### Duration Test Pass/Fail Criteria

| Criterion | Pass | Fail |
|-----------|------|------|
| App stability | No crash for 30 minutes | Crash or ANR |
| Sample count | >= 80% of expected (7,200+ per stream) | < 80% |
| Gaps | No gaps > 2 seconds | Any gap > 2 seconds |
| Rate stability | Rate std < 1.0 Hz across 5-min windows | Rate std >= 1.0 Hz |
| Memory | No visible memory growth in device monitor | OOM or growing memory |
| All streams present | All 5 streams in XDF file | Any stream missing |
| Clean shutdown | destroyAllOutlets succeeds | Error on shutdown |

---

## Troubleshooting

### Streams Disappear During Long Test

| Cause | Solution |
|-------|----------|
| Wi-Fi power saving | Android: Settings > Battery > disable optimization for app |
| App backgrounded | Keep app in foreground; use wake lock if needed |
| OS killed app | Increase app priority; use foreground service |
| Network change | Reconnect to same Wi-Fi; restart streams |

### Sample Count Lower Than Expected

| Cause | Solution |
|-------|----------|
| setInterval drift | Use `pushChunk` with accumulated samples instead |
| CPU throttling | Reduce other app activity during test |
| GC pauses | Normal for JavaScript; < 5% loss is acceptable |

### LabRecorder Shows Streams Then Loses Them

| Cause | Solution |
|-------|----------|
| LSL heartbeat timeout | Ensure device keeps pushing samples continuously |
| KnownPeers not configured | Verify `lsl_api.cfg` has correct device IP |
| IP address changed | Re-check device IP with `LSL.getDeviceIP()` |

---

*Last updated: 2025-02-24*
*cordova-plugin-lsl v1.0.0*
