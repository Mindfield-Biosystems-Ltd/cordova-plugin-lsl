# KnownPeers Setup Guide

Step-by-step guide to connect your mobile app's LSL streams with LabRecorder on your PC.

## Overview

LSL uses **KnownPeers** to discover streams across devices. Your PC sends unicast queries to specific IP addresses (your phone) to find available streams. This works on any Wi-Fi network, including corporate/university networks with client isolation.

## Prerequisites

- Phone and PC on the **same Wi-Fi network**
- [LabRecorder](https://github.com/labstreaminglayer/App-LabRecorder/releases) installed on PC
- Your app with cordova-plugin-lsl running on the phone

## Step 1: Get the Phone's IP Address

In your app, call:

```javascript
const ip = await LSL.getDeviceIP();
// Display this IP to the user, e.g. "192.168.1.100"
```

Alternatively, check the phone's Wi-Fi settings:
- **Android:** Settings → Wi-Fi → Connected network → Details
- **iOS:** Settings → Wi-Fi → (i) next to connected network

## Step 2: Create lsl_api.cfg on Your PC

### Windows

Create the file at: `%HOMEPATH%\lsl_api\lsl_api.cfg`

Full path example: `C:\Users\YourName\lsl_api\lsl_api.cfg`

```powershell
# Create directory
mkdir %HOMEPATH%\lsl_api

# Create config file
notepad %HOMEPATH%\lsl_api\lsl_api.cfg
```

### macOS / Linux

Create the file at: `~/lsl_api/lsl_api.cfg`

```bash
mkdir -p ~/lsl_api
nano ~/lsl_api/lsl_api.cfg
```

### File Contents

```ini
[lab]
KnownPeers = {192.168.1.100}
```

Replace `192.168.1.100` with your phone's actual IP address.

### Multiple Phones

For multiple devices, separate IPs with commas:

```ini
[lab]
KnownPeers = {192.168.1.100, 192.168.1.101, 192.168.1.102}
```

## Step 3: Start Streaming on the Phone

In your app, create an outlet and start pushing data:

```javascript
const outletId = await LSL.createOutlet({
    name: 'eSense_EDA',
    type: 'EDA',
    channelCount: 1,
    sampleRate: 5,
    channelFormat: 'float32'
});

// Start sending data
setInterval(async () => {
    await LSL.pushSample(outletId, [sensorValue]);
}, 200);
```

## Step 4: Open LabRecorder

1. Launch LabRecorder
2. Click **"Update"** to scan for streams
3. Your stream(s) should appear in the list:
   ```
   eSense_EDA (on 192.168.1.100)
   ```
4. **Check the stream(s)** you want to record
5. Choose an output file name
6. Click **"Start"** to begin recording

## Step 5: Verify Recording

1. Let it record for at least 30 seconds
2. Click **"Stop"**
3. Open the XDF file with Python or MATLAB to verify data

## Troubleshooting

### Stream not appearing in LabRecorder

**Check Wi-Fi connection:**
- Both devices must be on the same subnet
- Try pinging the phone from PC: `ping 192.168.1.100`

**Check lsl_api.cfg:**
- Verify file location is correct for your OS
- Verify IP address is correct and current
- Ensure file is saved as plain text (not .txt in disguise)
- Curly braces around IP are required: `{192.168.1.100}`

**Client Isolation:**
Some Wi-Fi networks (especially corporate/university) block device-to-device traffic.
- Solution: Use a **mobile hotspot** from one of the devices
- Or ask IT to whitelist the devices

**Firewall:**
- Ensure your PC firewall allows incoming TCP connections from the phone
- LabRecorder may need a firewall exception
- LSL typically uses ports 16572-16600

### Stream appears but no data

- Verify the app is actively calling `pushSample` or `pushChunk`
- Check that the app is in the foreground (background restrictions)
- Try `LSL.hasConsumers()` to verify the connection from the app side

### IP address changes

- Phone IP may change after reconnecting to Wi-Fi
- Update `lsl_api.cfg` with the new IP
- Consider using a static IP assignment on your router

### Connection drops

- Keep the app in foreground during recording
- Use `cordova-plugin-insomnia` to prevent screen lock
- For long sessions, monitor `hasConsumers` and alert if connection drops

## Network Diagram

```
Phone (192.168.1.100)          Wi-Fi Router          PC (192.168.1.50)
┌─────────────────┐         ┌──────────┐         ┌──────────────────┐
│  App with LSL   │ ◄─────► │          │ ◄─────► │  lsl_api.cfg:    │
│  Outlet         │  Wi-Fi  │  Router  │  Wi-Fi  │  KnownPeers =   │
│                 │         │          │         │  {192.168.1.100} │
│  Port: 16572+  │         │          │         │                  │
│                 │         │          │         │  LabRecorder     │
│  Streams:       │ ──TCP──►│──────────│──TCP──► │  Records XDF     │
│  - eSense_EDA   │         │          │         │                  │
│  - eSense_Temp  │         │          │         │                  │
└─────────────────┘         └──────────┘         └──────────────────┘
```

## Alternative: Mobile Hotspot

If your Wi-Fi network has client isolation:

1. Enable **Mobile Hotspot** on the phone
2. Connect the PC to the phone's hotspot
3. The phone's IP is typically `192.168.43.1` (Android) or `172.20.10.1` (iOS)
4. Set this IP in `lsl_api.cfg`

This bypasses all network restrictions since the phone IS the router.
