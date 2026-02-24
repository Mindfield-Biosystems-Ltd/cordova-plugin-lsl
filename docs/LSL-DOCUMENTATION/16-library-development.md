# Library Development

Source: https://labstreaminglayer.readthedocs.io/dev/lib_dev.html

---

> **Note:** Stop reading if you just want to...
>
> - stream data from one of the [Supported Devices and Tools](https://labstreaminglayer.readthedocs.io/info/supported_devices.html) or record data with the
>   LabRecorder. You can download pre-built releases for the apps and LabRecorder from each
>   repositories release page.
>
> - create or use a program to stream or receive data via the LabStreamingLayer. You can
>   download a liblsl release following instructions on the
>   [liblsl repository](https://github.com/sccn/liblsl/)

Follow this guide if you...

- want to add / modify core liblsl

  - Please create a [GitHub issue](https://github.com/sccn/liblsl/issues)
    first to ask for advice and to get pre-approval if you would like your
    modification to be included in the official library.

- want to build liblsl for a device / OS with no official release (e.g. an embedded Linux device)

## Building liblsl

Before attempting to build liblsl, please make sure you have configured your [LSL build environment](https://labstreaminglayer.readthedocs.io/dev/build_env.html).

This part of the guide describes the process of building liblsl from source
for Windows, Mac OS, and Linux. Since liblsl is cross-platform (it is written
in standard C++ and its dependencies are all cross-platform), this process should be pretty
straightforward. The following paragraphs provide a step-by-step instruction of
the build process on all three platforms.

### Getting the source

Open a Terminal / Developer Command Prompt and cd to a convenient location to download and build the library.

```bash
git clone --depth=1 https://github.com/sccn/liblsl.git
```

The resulting folder structure is as follows.

```
(working directory)
└── liblsl
    ├── {...}
    ├── include
    ├── lslboost
    ├── project
    ├── src
    └── testing
```

### Configuring the liblsl project

> **Note:** Most popular IDEs have integrated CMake support. Typically, all that is necessary is to open
> the root liblsl folder (i.e., the folder containing `CMakeLists.txt`) and select the
> appropriate CMake options in the IDE.
> If you wish to use the IDE's integrated cmake, then you do not need to follow the
> terminal commands below.

```bash
cd liblsl
cmake -S . -B build -G <generator name> <other options>
```

Note: call `cmake -G` without a generator name to get a list of available generators.

Example: `cmake -S . -B build -G "Visual Studio 16 2019" -A x64 -DCMAKE_INSTALL_PREFIX="build/install"`

If you used a generator, you can now open the IDE project file. Then build the install target.

Alternatively, you can build directly from command line:

```bash
cmake --build build -j --config Release --target install
```

In either case, this will create an `install` folder in your build folder.
This `install` folder is your [LSL_INSTALL_ROOT](https://labstreaminglayer.readthedocs.io/dev/LSL_INSTALL_ROOT.html) that you might use when
[building other applications.](https://labstreaminglayer.readthedocs.io/dev/app_dev.html)

## Build options for liblsl

There are several liblsl-specific build options.
All of them can be set either in the GUI (cmake-gui or IDE) or on the
command line (`cmake -Dfoo=bar`).

### CMAKE_INSTALL_PREFIX

This is not an LSL-provided option, but it's a common and important option when building the install target.
See the [official documentation](https://cmake.org/cmake/help/latest/variable/CMAKE_INSTALL_PREFIX.html).
This argument is often necessary on Windows because otherwise it will attempt to install into C:\Program Files
which will fail without administrative rights. A good value to pass is "build/install".

### LSL_DEBUGLOG

Enable (lots of) additional debug messages. Defaults to OFF.

### LSL_BUILD_EXAMPLES

The liblsl distributions includes several example programs.
Enabling this option builds them alongside liblsl.

### LSL_BUILD_STATIC

By default, a shared library (.so on Unix, .dylib on OS X and .dll on
Windows) is built. This also exports a static library.

### LSL_LEGACY_CPP_ABI

Once upon a time there was a C++-ABI, but it only worked under very specific
circumstances and created hard to debug errors otherwise. Don't enable this
unless you know exactly what you are doing.

### LSL_FORCE_FANCY_LIBNAME

By default, CMake decides what to name the library (see [Binaries](https://labstreaminglayer.readthedocs.io/info/faqs.html#liblslarch)).
On Windows this is `lsl.<extension>`
and for Unix (Linux/Mac) it is `liblsl.<extension>`.
Enabling this option will force the library to be named
`liblsl<ptrsize>.<extension>`
on all platforms.

### LSL_UNITTESTS

liblsl includes two types of unittests: internal tests, that check that
various internal components work as intended, and external tests that
test the API as programs would.

### LSL_UNIXFOLDERS

Macs, Unix / Android systems and distributions like Anaconda have a specific
directory layout (binaries in `prefix/bin`, includes in
`prefix/include` and so on), whereas Windows users prefer
everything in a single folder.
If enabled, the [LSL_INSTALL_ROOT](https://labstreaminglayer.readthedocs.io/dev/LSL_INSTALL_ROOT.html) folder will have a layout as it
should be on Unix systems.

### LSL_WINVER

Change the minimum targeted Windows version, defaults to 0x0601 for
Windows 7.

### LSL_OPTIMIZATIONS

Enable some more compiler optimizations. Defaults to ON.

### LSL_BUNDLED_PUGIXML

Use the bundled pugixml by default. Defaults to ON.

## Modifying liblsl

First read [the introduction](https://labstreaminglayer.readthedocs.io/info/intro.html) to learn about LSL components and classes.
[The C++ API documentation](https://labstreaminglayer.readthedocs.io/projects/liblsl/index.html) is a work-in-progress but might also be a good reference.

## Updating Boost

liblsl uses boost.
Because embedding liblsl in an application that links to an other Boost version (notably Matlab)
causes runtime errors, we bundle a subset of boost in lslboost.

To update the included lslboost, install Boost bcp and use the update_lslboost.sh script.

## Building liblsl language bindings

The most notable language bindings are [pylsl (Python)](https://github.com/labstreaminglayer/pylsl) and [liblsl-Matlab](https://github.com/labstreaminglayer/liblsl-Matlab). See their respective pages for building guides.

See also the repositories for [CSharp](https://github.com/labstreaminglayer/liblsl-Csharp), [Unity Custom Package](https://github.com/labstreaminglayer/LSL4Unity), [Rust](https://github.com/labstreaminglayer/liblsl-rust), [Java](https://github.com/labstreaminglayer/liblsl-Java), and [Julia (external)](https://github.com/samuelpowell/LSL.jl).

## Full Tree Dev

For advanced users (mostly core developers), it might be useful to simultaneously develop multiple apps and/or libraries. For this, please see the [Working With The LabStreamingLayer Repository](https://labstreaminglayer.readthedocs.io/dev/full_tree.html) documentation to setup the lib and app tree,
then follow the build instructions in [Building LabStreamingLayer Full Tree](https://labstreaminglayer.readthedocs.io/dev/build_full_tree.html).

## Maintaining package manager ports

Ports of liblsl are available via a number of third-party package managers.
When new releases of liblsl are published,
these ports can be updated using the following steps:

### vcpkg

vcpkg ports are managed in the [microsoft/vcpkg](https://github.com/microsoft/vcpkg) repository on GitHub
and changes or additions are submitted in the form of pull requests.
For a general overview of vcpkg, see [https://github.com/microsoft/vcpkg/tree/master/docs](https://github.com/microsoft/vcpkg/tree/master/docs).

The liblsl port is maintained at [https://github.com/microsoft/vcpkg/tree/master/ports/liblsl](https://github.com/microsoft/vcpkg/tree/master/ports/liblsl).

- For new liblsl releases where no changes have been made in the CMake build scripts,
  it should be enough to update the library versions in [vcpkg.json](https://github.com/microsoft/vcpkg/blob/master/ports/liblsl/vcpkg.json)
  and in [portfile.cmake](https://github.com/microsoft/vcpkg/blob/master/ports/liblsl/portfile.cmake).

- If there have been changes in the CMake build scripts, portfile.cmake may need to be adapted accordingly.
  If any dependencies have changed (e.g. the version of Boost), the dependency information in vcpkg.json needs to be updated, as well.

### Conan

Conan packages are managed in the [conan-io/conan-center-index](https://github.com/conan-io/conan-center-index) repository on GitHub
and changes or additions are submitted in the form of pull requests.
For a general overview of the Conan package maintenance process, see [Adding Packages to ConanCenter](https://github.com/conan-io/conan-center-index/blob/master/docs/how_to_add_packages.md).

The liblsl port is maintained at [https://github.com/conan-io/conan-center-index/tree/master/recipes/liblsl](https://github.com/conan-io/conan-center-index/tree/master/recipes/liblsl).

- For new liblsl releases where no changes have been made in the CMake build scripts,
  it should be enough to add the new library version to [config.yml](https://github.com/conan-io/conan-center-index/blob/master/recipes/liblsl/config.yml)
  and to [conandata.yml](https://github.com/conan-io/conan-center-index/blob/master/recipes/liblsl/all/conandata.yml).

- If there have been changes in the CMake build scripts, [conanfile.py](https://github.com/conan-io/conan-center-index/blob/master/recipes/liblsl/all/conanfile.py) may need to be adapted accordingly.
  If any dependencies have changed (e.g. the version of Boost), the dependency information in conanfile.py needs to be updated, as well.

### homebrew

No documentation yet.
See [https://github.com/labstreaminglayer/homebrew-tap](https://github.com/labstreaminglayer/homebrew-tap)
