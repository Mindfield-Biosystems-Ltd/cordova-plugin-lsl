# Building for Android

Source: https://labstreaminglayer.readthedocs.io/dev/build_android.html

---

## Prerequisites

You'll need: the [Android SDK](https://developer.android.com/studio#command-tools)
(in doubt, install the whole [Android Studio](https://developer.android.com/studio#downloads)).
With it, install (preferred) the most recent NDK version or a specific NDK version you need.

> **Note (Unity):** Each Unity version needs liblsl to be compiled with a specific NDK version,
> e.g. NDK 16 for Unity 2019.2. For a list, consult the
> [Unity docs, section "Change the Android NDK path"](https://docs.unity3d.com/Manual/android-sdksetup.html)

Generally, an NDK installed with the Android SDK manager is preferred,
because the SDK and some support files are newer.

Make sure the NDK is installed in a path without spaces.
If it is already installed, use start Powershell as Administrator and create a link:

```powershell
New-Item -ItemType SymbolicLink -Path "C:\NDK" -Target "C:\Space Path\NDK"
```

At the time of writing this, [CMake](https://labstreaminglayer.readthedocs.io/dev/cmake.html#buildenvcmake) shipped with the Android SDK
is too old, so you need to install a recent version.

## Building liblsl

Open a Terminal / Developer Command Prompt and retrieve the needed packages:

```bash
git clone --depth=1 https://github.com/sccn/labstreaminglayer.git
git submodule update --init LSL/liblsl LSL/liblsl-Java
```

Next, chdir to the labstreaminglayer/LSL/liblsl-Java subdirectory
and configure your environment in the `local.properties`:

```properties
ndk.dir=C\:\\Users\\user\\AppData\\Local\\Android\\Sdk\\ndk\\16.1.4479499
android.ndkVersion=16.1.4479499
sdk.dir=C\:\\Users\\user\\AppData\\Local\\Android\\Sdk
cmake.dir=C\:\\Program Files\\CMake
```

> **Note:** For older NDK versions without C++11 support, the alternative STL
> has to be enabled with the CMake option `-DANDROID_STL=c++_static` in
> `build.gradle`

Make sure to escape all special characters and double-check the paths.

After that, you can start the build from the command line:

```bash
gradlew assembleRelease
```

After some time, this will create `build/outputs/aar/liblsl-Java-Release.aar`.
Open it with 7zip (or rename it to liblsl.zip) and extract the jni/ folder
containing the native libraries.

> **Note:** For Android apps, you can add the .aar file as dependency, no need to mess
> with the .so files.
