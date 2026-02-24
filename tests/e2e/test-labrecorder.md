# E2E Test: cordova-plugin-lsl with LabRecorder

Manual end-to-end test procedure for verifying LSL stream visibility and recording with LabRecorder on a PC.

---

## Prerequisites

### Software

| Component | Version | Download |
|-----------|---------|----------|
| LabRecorder | >= 1.16 | https://github.com/labstreaminglayer/App-LabRecorder/releases |
| Python 3 (optional, for XDF verification) | >= 3.8 | https://python.org |
| pyxdf (optional) | >= 1.16 | `pip install pyxdf` |

### Hardware

- Android or iOS device with the Cordova test app installed
- PC with LabRecorder installed
- Both device and PC on the **same Wi-Fi network** (same subnet)

### Network Configuration

LSL uses multicast/broadcast for stream discovery. On many Wi-Fi networks, multicast is blocked. If LabRecorder cannot discover streams automatically, configure **KnownPeers** manually.

**Step 1:** Get the device's IP address from the app (the plugin provides `LSL.getDeviceIP()`).

**Step 2:** Create or edit `lsl_api.cfg` next to the LabRecorder executable:

```ini
[lab]
KnownPeers = {192.168.1.100}
```

Replace `192.168.1.100` with the actual device IP. Multiple peers can be listed:

```ini
[lab]
KnownPeers = {192.168.1.100, 192.168.1.101}
```

**Step 3:** Restart LabRecorder after editing the config file.

---

## Test Procedure: Single Stream (EDA)

### 1. Start the Stream on Device

In the Cordova test app, create an EDA outlet:

```javascript
var outletId;
LSL.createOutlet({
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
}).then(function (id) {
    outletId = id;
    console.log('Outlet created:', id);
});
```

Start pushing samples (simulated data for testing):

```javascript
var sampleInterval = setInterval(function () {
    var value = 2.0 + Math.random() * 3.0; // 2.0 - 5.0 microsiemens
    LSL.pushSample(outletId, [value]);
}, 200); // 5 Hz = every 200ms
```

### 2. Open LabRecorder on PC

1. Launch LabRecorder
2. Click **Update** (refresh stream list)
3. The stream `eSense_EDA` should appear in the stream list

### 3. Expected Results in LabRecorder

| Field | Expected Value |
|-------|---------------|
| Stream Name | eSense_EDA |
| Type | EDA |
| Channel Count | 1 |
| Sample Rate | 5.0 Hz |
| Format | float32 |
| Source ID | esense-eda-001 |

### 4. Record Data

1. Select the `eSense_EDA` stream checkbox
2. Choose a filename (e.g., `test_eda.xdf`)
3. Click **Start**
4. Let it record for at least **30 seconds**
5. Click **Stop**

### 5. Stop the Stream on Device

```javascript
clearInterval(sampleInterval);
LSL.destroyOutlet(outletId);
```

---

## Verification: Open XDF in Python

### Install pyxdf

```bash
pip install pyxdf matplotlib numpy
```

### Verify the Recording

```python
import pyxdf
import matplotlib.pyplot as plt
import numpy as np

# Load the XDF file
data, header = pyxdf.load_xdf('test_eda.xdf')

# Find the EDA stream
for stream in data:
    info = stream['info']
    name = info['name'][0]
    print(f"Stream: {name}")
    print(f"  Type: {info['type'][0]}")
    print(f"  Channel Count: {info['channel_count'][0]}")
    print(f"  Nominal Rate: {info['nominal_srate'][0]}")
    print(f"  Format: {info['channel_format'][0]}")
    print(f"  Source ID: {info['source_id'][0]}")
    print(f"  Samples recorded: {len(stream['time_stamps'])}")

    if name == 'eSense_EDA':
        timestamps = stream['time_stamps']
        values = stream['time_series'][:, 0]

        # Check sample rate
        if len(timestamps) > 1:
            intervals = np.diff(timestamps)
            actual_rate = 1.0 / np.mean(intervals)
            print(f"  Actual sample rate: {actual_rate:.2f} Hz")
            print(f"  Duration: {timestamps[-1] - timestamps[0]:.1f} s")

        # Plot
        plt.figure(figsize=(12, 4))
        plt.plot(timestamps - timestamps[0], values)
        plt.xlabel('Time (s)')
        plt.ylabel('EDA (microsiemens)')
        plt.title('eSense EDA - LSL Recording')
        plt.grid(True)
        plt.tight_layout()
        plt.savefig('test_eda_plot.png', dpi=100)
        plt.show()
```

### Verification Checklist

- [ ] XDF file loads without errors
- [ ] Stream name matches: `eSense_EDA`
- [ ] Stream type matches: `EDA`
- [ ] Channel count is 1
- [ ] Nominal sample rate is 5.0 Hz
- [ ] Channel format is `float32`
- [ ] Source ID matches: `esense-eda-001`
- [ ] Number of samples is approximately `duration_seconds * 5`
- [ ] Actual sample rate is within 10% of 5 Hz (4.5 - 5.5 Hz)
- [ ] Values are in the expected range (2.0 - 5.0 for simulated data)
- [ ] No gaps in timestamps longer than 1 second

---

## Verification: Open XDF in MATLAB

```matlab
% Requires xdfimport: https://github.com/xdf-modules/xdf-Matlab
streams = load_xdf('test_eda.xdf');

for i = 1:length(streams)
    name = streams{i}.info.name;
    fprintf('Stream: %s\n', name);
    fprintf('  Type: %s\n', streams{i}.info.type);
    fprintf('  Channels: %s\n', streams{i}.info.channel_count);
    fprintf('  Rate: %s Hz\n', streams{i}.info.nominal_srate);
    fprintf('  Samples: %d\n', length(streams{i}.time_stamps));

    if strcmp(name, 'eSense_EDA')
        figure;
        t = streams{i}.time_stamps - streams{i}.time_stamps(1);
        plot(t, streams{i}.time_series(1,:));
        xlabel('Time (s)');
        ylabel('EDA (microsiemens)');
        title('eSense EDA - LSL Recording');
        grid on;
    end
end
```

---

## Troubleshooting

### Stream Not Visible in LabRecorder

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| No streams appear | Multicast blocked | Add device IP to `lsl_api.cfg` KnownPeers |
| No streams appear | Different subnets | Ensure device and PC are on the same Wi-Fi network and subnet |
| No streams appear | Firewall blocking | Allow LabRecorder and liblsl through the firewall (UDP ports 16571-16600) |
| No streams appear | Outlet not created | Check the Cordova console for `createOutlet` errors |
| Stream appears then disappears | Device Wi-Fi sleeping | Disable Wi-Fi power saving / keep app in foreground |

### Stream Visible but Recording Empty

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| 0 samples in XDF | Not pushing samples | Verify `pushSample` is being called at the expected interval |
| 0 samples in XDF | Recording stopped too early | Record for at least 10 seconds |
| Missing samples | Interval timer drift | Use `pushChunk` for batch sending instead of per-sample `pushSample` |

### XDF File Issues

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| pyxdf load error | Corrupt file | Re-record; ensure LabRecorder stopped cleanly |
| Wrong sample rate | Timer not accurate | Check `setInterval` drift; actual BLE sensor data will use hardware timing |
| Timestamps not monotonic | Clock sync issue | Use `LSL.getLocalClock()` for explicit timestamps |

### Firewall Rules (Windows)

If LabRecorder cannot find streams, create inbound firewall rules:

```powershell
# Run as Administrator
netsh advfirewall firewall add rule name="LSL Discovery" dir=in action=allow protocol=UDP localport=16571-16600
netsh advfirewall firewall add rule name="LSL Data" dir=in action=allow protocol=TCP localport=16571-16600
```

### Firewall Rules (macOS)

On macOS, allow LabRecorder through the firewall when prompted, or manually add it:

```
System Settings -> Privacy & Security -> Firewall -> Options -> Add LabRecorder
```

---

## Pass/Fail Criteria

| Criterion | Pass | Fail |
|-----------|------|------|
| Stream appears in LabRecorder | Visible within 30s of creation | Not visible after 30s with KnownPeers configured |
| Stream metadata correct | All fields match config | Any field mismatch |
| Recording contains data | Sample count > 0 | Empty recording |
| Sample rate accurate | Within 20% of nominal (4.0-6.0 Hz for 5 Hz) | Outside tolerance |
| No crashes | App and LabRecorder stable | Crash during test |
| Clean shutdown | destroyOutlet succeeds, stream disappears from LabRecorder | Stream persists or error on destroy |

---

*Last updated: 2025-02-24*
*cordova-plugin-lsl v1.0.0*
