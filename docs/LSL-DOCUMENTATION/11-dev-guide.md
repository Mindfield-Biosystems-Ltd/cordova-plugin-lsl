# Developer's Guide

> Source: https://labstreaminglayer.readthedocs.io/dev/dev_guide.html

---

LabStreamingLayer (LSL) is a library (liblsl) and a suite of apps and tools.

Even for developers, it's possible to build applications for LSL or build liblsl for an entirely new device without ever having to look at the liblsl source code. The guides are therefore split into an app developer's guide and a liblsl developer's guide.

The labstreaminglayer source code is similarly split into Apps and LSL (core library and language interfaces), each of which comprises several submodules. One could work with the repository, submodules and all, as a [full tree](https://labstreaminglayer.readthedocs.io/dev/full_tree.html), but this is not recommended. Most developers will be better working on individual apps or individual language interfaces.

## App Development

[This guide](https://labstreaminglayer.readthedocs.io/dev/app_dev.html) is for you if you are:

- adding LSL support for a device to send its data to other applications;
- writing an application that receives data (e.g., to process and possibly resend on a new stream);
- trying to build an existing application that does not already have a release for your platform.

The distribution includes a range of code examples in C, C++, Python, MATLAB, Java, and C# including some very simple sender and receiver programs, as well as some fairly extensive demo apps to help you get started.

See [LSL Coding Examples](https://labstreaminglayer.readthedocs.io/dev/examples.html) for a broader overview of example programs and general programming tips and tricks. Also make sure to glance over the [FAQs](https://labstreaminglayer.readthedocs.io/info/faqs.html).

## Library Development

[The guide](https://labstreaminglayer.readthedocs.io/dev/lib_dev.html) is for you if you are:

- trying to build liblsl for a platform that does not already have a release
  - Please check the [liblsl release page](https://github.com/sccn/liblsl/releases) first.
  - Please let us know so we can add the platform to the list of automated builds, if possible.
- trying to use liblsl in a language that does not already have an interface
  - [Already supported: Android, C#, Java, Matlab, Python](https://github.com/sccn/labstreaminglayer/tree/master/LSL)
