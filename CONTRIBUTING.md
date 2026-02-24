# Contributing to cordova-plugin-lsl

Thank you for your interest in contributing! This plugin bridges Lab Streaming Layer (LSL) and Apache Cordova, enabling mobile biosignal streaming for neuroscience research.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a feature branch: `git checkout -b feature/my-feature`
4. Make your changes
5. Run tests: `npm test`
6. Commit with conventional commits: `git commit -m "feat: add new feature"`
7. Push and create a Pull Request

## Development Setup

### Prerequisites

- Node.js 18+
- Apache Cordova CLI 12+
- Android SDK (for Android development)
- Xcode 15+ (for iOS development)
- CMake 3.20+ (for building liblsl from source)

### Running Tests

```bash
# Unit tests (JS API validation)
npm test

# Integration tests (requires Cordova test app on device)
# See tests/integration/README.md
```

### Building liblsl from Source

```bash
# Android (requires ANDROID_NDK_HOME)
./scripts/build-android.sh

# iOS (requires Xcode)
./scripts/build-ios.sh
```

## Code Style

- **JavaScript:** Standard style, ES5 compatible (Cordova requirement)
- **Java:** Standard Android/Cordova conventions
- **Objective-C:** Standard Apple/Cordova conventions
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`)

## Reporting Issues

Use the [issue templates](.github/ISSUE_TEMPLATE/) for:
- **Bug reports:** Include platform, Cordova version, and steps to reproduce
- **Feature requests:** Describe the use case and expected behavior

## Pull Request Guidelines

1. One feature/fix per PR
2. Include tests for new functionality
3. Update documentation if the API changes
4. Ensure all existing tests pass
5. Follow conventional commit messages

## Architecture Overview

```
www/lsl.js          → JS API Bridge (input validation, cordova.exec calls)
src/android/        → Java CordovaPlugin → JNI → liblsl C API
src/ios/            → Objective-C CDVPlugin → direct liblsl C API calls
```

Key design decisions:
- **Promise-only API** (no callback pattern) for modern JS/TS usage
- **Thread-safe outlet management** (ConcurrentHashMap on Android, @synchronized on iOS)
- **Native lifecycle hooks** for memory leak prevention
- **Pre-built binaries** for zero-config installation

## Scope

### In Scope (v1.x)
- Outlet (sender) functionality
- All LSL channel formats
- Stream metadata
- Multi-outlet support
- Android + iOS

### Out of Scope (v1.x)
- Inlet (receiver) functionality — planned for v2.0
- Capacitor support — planned for v2.0
- Stream recording on device

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
