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
- ~~Pre-built binaries not yet in repo~~ → Resolved in Session 2
- ~~npm not yet published~~ → Resolved in Session 2
- ~~GitHub release tag not yet created~~ → Resolved in Session 2

---

## 2026-02-24 — Post-Release: CI Fixes, Binaries, npm Publish

### Session 2: Ship It

**Context:** CI builds were failing after initial commit. Needed to fix builds, download artifacts, commit binaries, create GitHub Release, and publish to npm.

**Issues Fixed:**

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Android CI build failure | JNI CMakeLists.txt used `find_library` which searched wrong dirs | Rewrote to use IMPORTED target with explicit path to `liblsl.so` |
| iOS CI build failure | `cp -R` failed because target directory didn't exist | Added `mkdir -p` before `cp -R` for fat simulator framework |
| EMG sensor naming wrong | Assumed MedianFrequency as CH2 | Both channels are RMS microvolts (two independent electrodes) |
| Product name wrong | Used "eSense_EMG" | Corrected to "eSense_Muscle" matching actual product name |

**Actions Completed:**

1. Fixed Android JNI CMake (`src/android/jni/CMakeLists.txt`) — IMPORTED target pattern
2. Fixed iOS build script (`scripts/build-ios.sh`) — added `mkdir -p`
3. Merged 4 Dependabot PRs (jasmine 6.1.0, checkout v6, setup-node v6, setup-java v5)
4. Both CI builds verified green
5. Corrected EMG → Muscle naming across examples, tests, e2e docs
6. Downloaded pre-built binaries from CI and committed to repo
7. Created GitHub Release v1.0.0 with full release notes
8. Published to npm as cordova-plugin-lsl@1.0.0
9. Revoked npm access tokens after publish
10. Updated README (badges), STATE.md, CHANGELOG.md

**Key Technical Finding:**
- CMake `find_library` does not search custom paths reliably in NDK cross-compilation. Using `add_library(IMPORTED)` with `set_target_properties(IMPORTED_LOCATION)` is the correct pattern for pre-built shared libraries.

**EMG/Muscle Sensor Clarification:**
- eSense Muscle has two independent EMG electrodes (CH1, CH2)
- Both measure RMS amplitude in microvolts
- User can choose CH1 only, CH2 only, or both
- Filter settings (narrow/medium/wide) are static configuration, not streamed data
- `channelCount` is variable (1 or 2) depending on user selection

**Result:** Plugin is fully released — npm package, GitHub Release, CI green, all docs updated. All v1.0.x roadmap items complete.

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

---

## 2026-02-24 — LSL Spec Compliance Review + v1.1.0 Release

### Session 3: Review, Fix, Release

**Context:** Comprehensive review of cordova-plugin-lsl v1.0.0 against official liblsl specification (C headers + 25 documentation pages). Multi-agent review team: Perplexity Web Research, Native Code Review, Cross-Platform Consistency, LSL Documentation scraping.

**Bugs Found & Fixed (12 total):**

| # | Severity | Bug | Fix |
|---|----------|-----|-----|
| 1 | CRITICAL | Library version parsing wrong (117 → "1.1.7" instead of "1.17") | 2-part parsing: `major = v/100, minor = v%100` |
| 2 | CRITICAL | Push sample return values ignored (JNI declared void, should be int32_t) | Changed JNI functions to return jint, updated signatures |
| 3 | CRITICAL | getLocalClock type mismatch (Android String, iOS Double) | Both return `{timestamp: double}` JSON, JS extracts number |
| 4 | CRITICAL | hasConsumers type mismatch (Android int, iOS boolean) | JS normalizes with `!!result` |
| 5 | CRITICAL | iOS null pointer in getWifiIPAddress | Added `ifa_addr != NULL` guard |
| 6 | Non-critical | JNI string push local reference leak | Store jstring refs, reuse for release |
| 7 | Non-critical | No NULL checks on Get*ArrayElements | Added `if (!data) return -4` |
| 8 | Non-critical | pushChunk uses sample-loop instead of native lsl_push_chunk | 5 new JNI chunk functions, 10-100x faster |
| 9 | Non-critical | iOS dead code: lslQueue | Retained as documentation |
| 10 | Non-critical | TypeScript pushSample typed as number[] only | Changed to `number[] \| string[]` |
| 11 | Non-critical | Android push/destroy race condition | `synchronized(wrapper)` + `isDestroyed()` checks |
| 12 | Non-critical | int64 channel format not documented as unsupported | Documented as intentional limitation |

**Performance Improvement:**
- pushChunk: N JNI calls → 1 JNI call (native `lsl_push_chunk_*t()`)
- Estimated 10-100x faster for high-rate streams (e.g. 1000 Hz EMG)

**Documentation:**
- 25 official LSL documentation pages archived in `docs/LSL-DOCUMENTATION/`
- Review report: `docs/LSL-REVIEW-REPORT.md`
- Release workflow documented in `.claude/CLAUDE.md`

**Release Actions:**
1. All 12 fixes implemented across 7 source files
2. Version bumped to 1.1.0 (package.json + plugin.xml)
3. CHANGELOG.md updated with full v1.1.0 section
4. Git commit + push to main
5. GitHub Release v1.1.0 created with tag
6. Published to npm as cordova-plugin-lsl@1.1.0
7. CI builds triggered and all green (CI, Android build, iOS build)
8. Downloaded v1.1.0 CI artifacts and replaced pre-built binaries in repo
9. JNI bridge binaries now include new push_chunk functions (+12K arm64, +4K armv7, +8K x86_64)

**Key Insight:** Always verify against liblsl C headers, not assumptions. The `lsl_library_version()` return format (major*100+minor) and `lsl_push_sample_*t()` return type (int32_t) were both documented in headers but misinterpreted in the original implementation.
