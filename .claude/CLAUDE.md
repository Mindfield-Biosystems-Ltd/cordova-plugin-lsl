# cordova-plugin-lsl - Workspace Instructions

## Quick Start

**Version:** 1.1.0
**Status:** Released on GitHub, npm publish pending auth
**Repo:** https://github.com/Mindfield-Biosystems-Ltd/cordova-plugin-lsl

### Key Files
- `docs/STATE.md` - Current status, versions, platform compat
- `docs/DEVLOG.md` - Chronological development history
- `CHANGELOG.md` - Keep a Changelog format
- `docs/LSL-REVIEW-REPORT.md` - Spec compliance review (v1.1.0)
- `docs/LSL-DOCUMENTATION/` - 25 archived LSL spec pages

---

## Architecture

```
JS API (www/lsl.js, www/lsl.d.ts)
    | cordova.exec()
Native Plugin (LSLPlugin.java / LSLPlugin.m)
    | JNI (lsl_jni.c) / direct C call
liblsl C API (pre-built .so / .xcframework, v1.17.5)
    | TCP/UDP
LabRecorder (PC)
```

### Source Files

| File | Lines | Description |
|------|-------|-------------|
| `src/android/jni/lsl_jni.c` | ~300 | JNI bridge: maps Java native methods to liblsl C |
| `src/android/LSLPlugin.java` | ~730 | Android Cordova plugin (CordovaPlugin) |
| `src/android/LSLOutletWrapper.java` | ~91 | Thread-safe outlet wrapper |
| `src/ios/LSLPlugin.m` | ~630 | iOS Cordova plugin (CDVPlugin) |
| `www/lsl.js` | ~340 | JavaScript API with input validation |
| `www/lsl.d.ts` | ~143 | TypeScript definitions |

### liblsl Headers (Reference)
Located at: `src/ios/liblsl.xcframework/ios-arm64/lsl.framework/Headers/lsl/`
- `common.h` - Enums, error codes, version functions
- `outlet.h` - push_sample, push_chunk, have_consumers
- `inlet.h` - pull_sample (not used yet)
- `streaminfo.h` - Stream metadata
- `types.h` - Opaque type definitions

---

## Release Workflow (KRITISCH)

**Bei jeder neuen Version MUESSEN diese Schritte in Reihenfolge durchgefuehrt werden:**

### 1. Code-Aenderungen abschliessen

Alle Fixes/Features implementiert und getestet.

### 2. Version bumpen (3 Stellen!)

```
package.json    -> "version": "X.Y.Z"
plugin.xml      -> version="X.Y.Z"
```

Beide Dateien MUESSEN die gleiche Version haben!

### 3. CHANGELOG.md aktualisieren

Format: [Keep a Changelog](https://keepachangelog.com/)

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Fixed
- Description of fix

### Changed
- Description of change

### Added
- Description of addition
```

Am Ende des Files die Link-Referenzen aktualisieren:
```markdown
[Unreleased]: https://github.com/Mindfield-Biosystems-Ltd/cordova-plugin-lsl/compare/vX.Y.Z...HEAD
[X.Y.Z]: https://github.com/Mindfield-Biosystems-Ltd/cordova-plugin-lsl/compare/vPREVIOUS...vX.Y.Z
```

### 4. docs/STATE.md aktualisieren

- Version-Tabelle
- Roadmap (erledigt markieren, naechste Phase hinzufuegen)
- Known Issues falls noetig

### 5. docs/DEVLOG.md Eintrag hinzufuegen

Chronologischer Eintrag mit:
- Session-Nummer
- Was gemacht wurde
- Entscheidungen und Begruendung
- Key Findings

### 6. README.md pruefen

- Version Badge / Version-Angabe aktualisieren falls noetig
- Neue Features dokumentieren falls noetig

### 7. Git Commit + Push

```bash
cd cordova-plugin-lsl
git add [spezifische Dateien]  # NIEMALS git add .
git commit -m "fix: beschreibung (vX.Y.Z)"
git push origin main
```

### 8. Git Tag + GitHub Release

```bash
git tag -a vX.Y.Z -m "vX.Y.Z - Release Title"
git push origin vX.Y.Z
gh release create vX.Y.Z --title "vX.Y.Z - Title" --notes "..."
```

### 9. npm publish

```bash
npm publish
```

**Voraussetzung:** `npm login` muss einmal auf der Maschine laufen (Credentials fuer npmjs.com).
Falls nicht eingeloggt: `npm error ENEEDAUTH` - Q muss `npm login` ausfuehren.

### 10. Verifizierung

```bash
# GitHub Release existiert?
gh release view vX.Y.Z

# npm Version korrekt?
npm view cordova-plugin-lsl version

# Tag korrekt?
git tag -l | grep vX.Y.Z
```

---

## Bekannte Protokoll-Details (liblsl)

### lsl_library_version() Format
Gibt `major * 100 + minor` zurueck (z.B. 117 = v1.17).
**KEIN Patch-Level im Return-Wert!**
Korrekte Parsing: `major = v/100, minor = v%100`

### lsl_push_sample_*t() Return-Wert
Gibt `int32_t` zurueck: 0 = OK, negative = Error Code.
Error Codes: -1 timeout, -2 lost, -3 argument_error, -4 internal_error.

### Timestamp 0.0
Im C API bewirkt timestamp=0.0 dass liblsl `lsl_local_clock()` zum Push-Zeitpunkt nutzt.
`LSL_DEDUCED_TIMESTAMP = -1.0` = Zeitstempel aus Vorgaenger-Sample ableiten.

### Thread Safety
Outlets sind NICHT thread-safe laut Doku. Concurrent push braucht Synchronisierung.
Unsere Loesung: `synchronized(wrapper)` (Android), `@synchronized(self)` (iOS).

### RBG Byte Order fuer Color
NICHT relevant fuer LSL, aber im gleichen Workspace (Hue App): RBG nicht RGB!

---

## Commands

```bash
# Tests
cd cordova-plugin-lsl && npm test

# Lint (falls konfiguriert)
npm run lint

# Build-Verifikation
# Kein lokaler Build moeglich ohne NDK/Xcode - CI pruefen:
gh run list --limit 5
```

---

## Wichtige Erkenntnisse (aus v1.1.0 Review)

1. **Immer gegen liblsl Header verifizieren**, nicht gegen Annahmen
2. **Cross-Platform Return Types** muessen im JS Layer normalisiert werden
3. **JNI Local References** muessen IMMER mit DeleteLocalRef freigegeben werden
4. **Get*ArrayElements** kann NULL zurueckgeben (OOM) - immer pruefen
5. **push_chunk > push_sample Loop** fuer High-Rate Streams (10-100x schneller)
6. **iOS multicast entitlement** ist restricted - immer KnownPeers empfehlen
