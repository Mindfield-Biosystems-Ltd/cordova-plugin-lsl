# Building LSL Apps

Source: https://labstreaminglayer.readthedocs.io/dev/app_build.html

---

The instructions below are recommended for most users.
Most LabStreamingLayer applications have a similar structure
and use similar build tools. These instructions are general
and should work for most applications.
Always be sure to read the specific application build instructions first.

> **Note:** You can create a project comprising both liblsl and the app.
> These builds are preferable if you need to change / debug both the app and liblsl,
> but because compiling liblsl takes considerably longer than most apps you should
> generally download a
> [pre-built liblsl](https://github.com/sccn/liblsl/releases) instead or
> [build it yourself](https://labstreaminglayer.readthedocs.io/dev/lib_dev.html#build-liblsl).

1. Make sure you have a working [LSL build environment](https://labstreaminglayer.readthedocs.io/dev/build_env.html).

2. Get the source code for your application.

   - If you are creating a new C++ application to add support for a device then
     generate a project from the
     [AppTemplate_cpp_qt](https://github.com/labstreaminglayer/AppTemplate_cpp_qt/generate)

   - git clone the application

3. Clean the build directory

   - You can use a GUI file manager to do this part or you can do it by command
     line as below.

   - Open a terminal/shell/command prompt and change to the repository
     directory.

   - If the build directory is already there then delete it

     - Windows: `rmdir /S build`; Others: `rm -Rf build`

4. Configure the project using [LSL build environment](https://labstreaminglayer.readthedocs.io/dev/build_env.html#lslbuildenv) cmake.

   - **Option 1 - Windows (Recommended) - Visual Studio 2017 or later**

     - Open the `CMakeLists.txt` file in Visual Studio (File->Open->CMake)
     - Change CMake settings via CMake/Project->Change CMake Settings
       - See [Common CMake Settings](#common-cmake-options) below
     - Change the selected project from the drop-down menu (x64-Debug,
       x64-Release). This will trigger a CMake re-configure with the new variables.

   - **Option 2 - Using commandline**

     - Open a Terminal window or, on Windows, a `x64 Native Tools Command Prompt for VS2017` (or VS2019, as needed).
     - Run cmake with appropriate [commandline options](#common-cmake-options).
       - `cmake -S . -B build -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX="build/install" other options`

   - **Option 3 - Using the GUI**

     - Open a terminal/shell/command prompt and change to the repository directory.
     - Run `cmake-gui -S . -B build`
     - Do an initial Configure. Agree to create the directory if asked.
     - Select your compiler and click Finish.
     - Use the interface to set or add options/paths (Add Entry).
       - Qt5_DIR or Qt6_DIR if the guessed path is not right
       - [Boost](https://labstreaminglayer.readthedocs.io/dev/build_env.html#boost) if the default was not correct
       - A path where redistributable binaries get copied (`CMAKE_INSTALL_PREFIX`)
       - Build type (`CMAKE_BUILD_TYPE`, either `Release` or `Debug`). You can change this in Visual Studio later.
     - Click on Configure again to confirm changes.
     - Click on Generate to create the build files / Visual Studio Solution file

5. Build the project

   - If using command line

     - Start the build process (`cmake --build . --config Release --target install`)
     - (see also [install](https://labstreaminglayer.readthedocs.io/dev/cmake.html#cmakeinstalltarget))

   - If using Visual Studio >=2017 built-in CMake utilities

     - Use the menu Build > Install > ApplicationName

This will create a distribution tree in the folder specified by
[CMAKE_INSTALL_PREFIX](https://labstreaminglayer.readthedocs.io/dev/cmake.html#cmakeinstalltarget) similar to this:

## 'installed' directory tree

```
├── AppX
│   ├── AppX.exe
│   ├── liblsl64.dll
│   ├── Qt5Xml.dll
│   ├── Qt5Gui.dll
│   ├── VendorDevice.dll
│   └── AppX_configuration.ini
└── LSL
  ├── share
  │   ├── LSL
  │   │   ├── LSLCMake.cmake
  │   │   ├── LSLConfig.cmake
  │   │   └── LSLCMake.cmake
  ├── include
  │   ├── lsl_c.h
  │   └── lsl_cpp.h
  └── lib
    ├── liblsl64.dll
    ├── liblsl64.lib
    └── lslboost.lib
```

On Unix systems (Linux+OS X) the executable's library path is changed to
include `../LSL/lib/` and the executable folder (`./`) so common
libraries (Qt, Boost) can be distributed in a single library directory
or put in the same folder.
On Windows, the library is copied to (and searched in) the executable folder.

## Common CMake Options

The cmake build system has many options. If you are using the CMake GUI
then these options will be presented to you before you generate the
project/makefiles.

If you are using the commandline then default options will generate
makefiles for liblsl only. If you want to use the commandline to
generate a project for an IDE, or to generate a project that builds LSL
Apps, then you will have to provide some optional arguments to the cmake
command.

- [Generator](https://cmake.org/cmake/help/latest/manual/cmake-generators.7.html#cmake-generators):
  `-G <generator name>`
  - On Windows, don't forget platform modifiers:
    - `-A x64` for 64-bit
    - `-A Win32` if targeting 32-bit Windows.

- [CMAKE_INSTALL_PREFIX](https://cmake.org/cmake/help/latest/variable/CMAKE_INSTALL_PREFIX.html):
  - `-DCMAKE_INSTALL_PREFIX="build/install"` is a good default.

- App dependencies (required by some apps). See [LSL build environment](https://labstreaminglayer.readthedocs.io/dev/build_env.html#lslbuildenv) for more info:
  - `-DVendor_ROOT=<path/to/vendor/sdk>`
  - `-DQt5_DIR=<path/to/qt/binaries>/lib/cmake/Qt5`
  - `-DQt6_DIR=<path/to/qt/binaries>/lib/cmake/Qt6`
    - On MacOS, it's rarely necessary, but the path can be learned from homebrew:
      `-DQt5_DIR=$(brew --prefix qt5)/lib/cmake/Qt5`
      `-DQt6_DIR=$(brew --prefix qt)/lib/cmake/Qt6`
  - `-DBOOST_ROOT=<path/to/boost>` (usually not needed)

- Location of liblsl (see [LSL_INSTALL_ROOT](https://labstreaminglayer.readthedocs.io/dev/LSL_INSTALL_ROOT.html))
  - Probably not required if liblsl was installed with homebrew, on Ubuntu as a deb package,
    or if this is a full labstreaminglayer tree with LSL as a sister directory.
  - `-DLSL_INSTALL_ROOT=path/to/liblsl/`

- Use `-DLSL_UNIXFOLDERS=0` on MacOS if your application is not bundled with its dylib.

- On Windows, to build a more universal executable:
  - `-T v142,host=x86`

- Please check the application's README and/or BUILD document for more options.

## Configure CMake options in VS 2017 / VS 2019

If you are using Visual Studio 2017's built-in CMake Tools then the
default options would have been used to configure the project. To set
any variables you have to edit a file. Use the CMake menu > Change CMake
Settings > ApplicationName. This will open a json file. For each
configuration, add a 'variables' entry with a list of
key/value pairs. For example, under `"name": "x64-Release",` and
immediately after `"ctestCommandArgs": ""` add the following:

```json
,
      "variables": [
        {
          "name": "Qt5_DIR",
          "value": "C:\\Qt\\5.11.1\\msvc2015_64\\lib\\cmake\\Qt5 "
        },
        {
          "name": "BOOST_ROOT",
          "value": "C:\\local\\boost_1_67_0"
        },
        {
          "name": "Vendor_ROOT",
          "value": "C:\\path\\to\\vendor\\sdk"
        },
        {
          "name": "LSL_INSTALL_ROOT",
          "value": "C:\\path\\to\\liblsl\\install"
        }
      ]
```
