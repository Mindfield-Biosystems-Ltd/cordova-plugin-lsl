# Development Log — cordova-plugin-lsl

Chronological record of development decisions and progress.

---

## 2026-02-24 — Initial Release v1.0.0

### Session 1: Full Implementation

**Context:** First and only Cordova plugin for Lab Streaming Layer (LSL). Created for Mindfield eSense App to enable biosignal streaming to researchers.

**Decisions Made:**

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Scope v1.0 | Outlet only (no Inlet) | eSense App is a sender; receiver can come in v2.0 |
| Discovery | KnownPeers (not Multicast) | No Apple Multicast entitlement needed, works on all networks |
| API Style | Promise-only (no callbacks) | Modern JS/TS, cleaner async/await usage |
| Channel Format | All 6 LSL types | Generic plugin, not eSense-specific |
| liblsl Version | v1.17.5 | Latest release (2026-01-15), minor ASIO fix over v1.17.4 |
| Cordova Targets | android 14+, ios 8+ | Current latest stable versions |
| iOS Min | 13.0 | Matches cordova-ios 8.0.0 minimum |
| Android Min | SDK 29 (Android 10) | Matches cordova-android 14.0.0 era devices |
| Thread Safety | ConcurrentHashMap (Java), @synchronized (ObjC) | Multi-outlet concurrent access |
| Memory Safety | Native lifecycle hooks | Prevents leaks on app kill/navigate |

**Architecture:**

```
JS API (www/lsl.js)
    ↓ cordova.exec()
Native Plugin (Java / ObjC)
    ↓ JNI / direct C call
liblsl C API (pre-built .so / .xcframework)
    ↓ TCP
LabRecorder (PC)
```

**Key Technical Findings:**
- liblsl on iOS builds as `lsl.framework` (Apple framework bundle), not `liblsl.dylib`
- Android requires separate JNI bridge (`liblsl_jni.so`) since pre-built `liblsl.so` doesn't include JNI entry points
- `JNI_OnLoad` registration approach preferred over JNI name mangling for cleaner code
- JS `Date.now()` is NOT compatible with LSL timestamps — must use `lsl_local_clock()`
- iOS Wi-Fi IP: `getifaddrs` on `en0` is the reliable method
- Android Wi-Fi IP: `ConnectivityManager` on API 29+, `WifiManager` fallback

**Files Created:** 52 files, ~9800 lines of code

**Tests:** 77 Jasmine unit tests, all passing

**Open Items:**
- Pre-built binaries not yet in repo (CI builds need tuning)
- npm not yet published
- GitHub release tag not yet created

### Research Findings

**liblsl:**
- v1.17.5 (2026-01-15) is the latest. Minor change: ASIO symbol visibility fix.
- v1.17.4 (2026-01-12) was the previous release.
- Gap from v1.16.2 (2023-05-28) to v1.17.4 — nearly 3 years.
- LSL got its first reference paper published in 2025.

**iOS 26 (Sept 2025):**
- 9.2% market share as of Dec 2025
- NSLocalNetworkUsageDescription unchanged
- Xcode 26 stable Dec 2025
- Our plugin compatible without changes
- Apple April 2026: apps need latest SDK (affects app, not plugin)

**cordova-ios 8.0.0 (Nov 2025):**
- Major release after 2 years of development
- Swift as primary language for platform projects
- Min: iOS 13, Xcode 15, Node.js 20.17
- visionOS support via CordovaLib

**cordova-lib 13.0.0 (Nov 2025):**
- `cordova create plugin` command removed
- Node.js >= 20.17.0 || >= 22.9.0 required
