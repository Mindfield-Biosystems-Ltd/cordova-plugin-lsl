# LSL Coding Examples

Source: https://labstreaminglayer.readthedocs.io/dev/examples.html

---

There are essentially two types of programs interacting with LSL: programs that provide data, such as a data source that represents a particular acquisition device, and programs that consume data (and occasionally mixtures of the two), such as a viewer, a recorder, or a program that takes some action based on real-time data.

The main difference between LSL and other data transport interfaces is that it is not connection-oriented (although the underlying implementation uses connection-oriented transport). It is closer to a "publish-subscribe" model. A data producer creates a named "outlet" object (perhaps with meta-data) and pushes samples into it without ever caring about who is listening. So functionally it is offering a stream of data plus some meta-data about it.

A data consumer who is interested in a particular type of stream queries the network for a matching one ("resolves it"), for example based on the name, type or some other content-based query and then creates an "inlet" object to receive samples from the stream. It can also separately obtain the meta-data of the stream. The consumer then pulls out samples from the stream. The sequence of samples that the consumer sees is in order, without omissions (unless a buffer's memory is exhausted), and type-safe. The data is buffered at both endpoints if there are transmission delays anywhere (e.g., interrupted network connection) but otherwise delivered as fast as the system allows.

The objects and functions to perform these tasks are provided by a single cross-platform library (liblsl). The library comes with a C header file, a C++ header file and wrapper classes for other languages.

Note: if you have trouble establishing communication between these programs across different computers especially on Windows, take a look at the NetworkConnectivity page and read the Network Troubleshooting section.

## API Documentation

It is recommended that you clone the repository to get the respective code. The documentation is at the following locations:

- C: [C header file](https://github.com/sccn/liblsl/blob/master/include/lsl_c.h)
- C++: [C++ header file](https://github.com/sccn/liblsl/blob/master/include/lsl_cpp.h), [in progress API documentation](https://labstreaminglayer.readthedocs.io/projects/liblsl/index.html)
- Python: [pylsl module](https://github.com/labstreaminglayer/liblsl-Python/blob/master/pylsl/pylsl.py)
- Java: [JavaDocs](https://github.com/labstreaminglayer/liblsl-Java/blob/master/javadoc/index.html)
- C#: [LSL module](https://github.com/labstreaminglayer/liblsl-Csharp/blob/master/LSL.cs)
- MATLAB: [class files](https://github.com/labstreaminglayer/liblsl-Matlab).
- Other languages (R, Octave, Ruby, Lua, Perl, Go): [SWIG interfaces](https://github.com/labstreaminglayer/liblsl-Generic) (the C or C++ header file is the API reference).

The API documentation covers all classes, functions and types and should
hopefully leave no questions unanswered.
Note that a typical application will only need a small subset of the API
(as used in the example programs).

## C Example Programs: Basic to Advanced

These two example programs illustrate the bread-and-butter use of LSL as it is executing in almost any device module that comes with the distribution:

- [Sending a multi-channel time series into LSL.](https://github.com/sccn/liblsl/blob/master/examples/SendDataC.c)
- [Receiving a multi-channel time series from LSL.](https://github.com/sccn/liblsl/blob/master/examples/ReceiveDataC.c)

These two example programs illustrate a more special-purpose use case, namely sending arbitrary string-formatted data at irregular sampling rate. Such streams are used by programs that produce event markers, for example:

- [Sending a stream of strings with irregular timing.](https://github.com/sccn/liblsl/blob/master/examples/SendStringMarkersC.c)
- [Receiving a stream of strings with irregular timing.](https://github.com/sccn/liblsl/blob/master/examples/ReceiveStringMarkersC.c)

The last example shows how to attach properly formatted meta-data to a stream, and how to read it out again at the receiving end. While meta-data is strictly optional, it is very useful to make streams self-describing. LSL has adopted the convention to name meta-data fields according to the XDF file format specification whenever the content type matches (for example EEG, Gaze, MoCap, VideoRaw, etc); the spec is [here](https://github.com/sccn/xdf/wiki/Meta-Data).

- [Handling stream meta-data.](https://github.com/sccn/liblsl/blob/master/examples/HandleMetaDataC.c)

## C++ Example Programs: Basic to Advanced

These two example programs illustrate the shortest amount of code that is necessary to get a C++ program linked to LSL:

- [Minimal data sending example.](https://github.com/sccn/liblsl/blob/master/examples/SendDataSimple.cpp)
- [Minimal data receiving example.](https://github.com/sccn/liblsl/blob/master/examples/ReceiveDataSimple.cpp)

These two example programs demonstrate how to write more complete LSL clients in C++ (they are 1:1 equivalents of the corresponding C programs):

- [Sending a multi-channel time series into LSL.](https://github.com/sccn/liblsl/blob/master/examples/SendData.cpp)
- [Receiving a multi-channel time series from LSL.](https://github.com/sccn/liblsl/blob/master/examples/ReceiveData.cpp)

These two programs transmit their data at the granularity of chunks instead of samples. This is mostly a convenience matter, since inlets and outlets can be configured to automatically batch samples into chunks for transmission. They also show how structs can be used to represent the sample data, instead of numeric arrays:

- [Sending a multi-channel time series at chunk granularity.](https://github.com/sccn/liblsl/blob/master/examples/SendDataInChunks.cpp)
- [Receiving a multi-channel time series at chunk granularity.](https://github.com/sccn/liblsl/blob/master/examples/ReceiveDataInChunks.cpp)

These two example programs illustrate a more special-purpose use case, namely sending arbitrary string-formatted data at irregular sampling rate. Such streams are used by programs that produce event markers, for example:

- [Sending a stream of strings with irregular timing.](https://github.com/sccn/liblsl/blob/master/examples/SendStringMarkers.cpp)
- [Receiving a stream of strings with irregular timing.](https://github.com/sccn/liblsl/blob/master/examples/ReceiveStringMarkers.cpp)

The last example shows how to attach properly formatted meta-data to a stream, and how to read it out again at the receiving end:

- [Handling stream meta-data.](https://github.com/sccn/liblsl/blob/master/examples/HandleMetaData.cpp)

## C/C++ Special-Purpose Example Programs

These programs illustrate some special use cases of LSL that are also relevant for C programmers.

This example illustrates in more detail how streams can be resolved on the network:

- [Resolving all streams on the lab network, one-shot and continuous.](https://github.com/sccn/liblsl/blob/master/examples/GetAllStreams.cpp)

This example shows how to query the full XML meta-data of a stream (which may be several megabytes large):

- [Retrieving the XML meta-data of a stream.](https://github.com/sccn/liblsl/blob/master/examples/GetFullinfo.cpp)

This example shows how to obtain time-correction values for a given stream:

- [Querying the time-correction information for a stream.](https://github.com/sccn/liblsl/blob/master/examples/GetTimeCorrection.cpp)

## Python Example Programs: Basic to Advanced

These examples show how to transmit a numeric multi-channel time series through LSL:

- [Sending a multi-channel time series into LSL.](https://github.com/labstreaminglayer/liblsl-Python/tree/master/pylsl/examples/SendData.py)
- [Receiving a multi-channel time series from LSL.](https://github.com/labstreaminglayer/liblsl-Python/tree/master/pylsl/examples/ReceiveData.py)

The following examples show how to send and receive data in chunks, which can be more convenient. The data sender also demonstrates how to attach meta-data to the stream.

- [Sending a multi-channel time series in chunks.](https://github.com/labstreaminglayer/liblsl-Python/tree/master/pylsl/examples/SendDataAdvanced.py)
- [Receiving a multi-channel time series in chunks.](https://github.com/labstreaminglayer/liblsl-Python/tree/master/pylsl/examples/ReceiveDataInChunks.py)

These examples show a special-purpose use case that is mostly relevant for stimulus-presentation programs or other applications that want to emit 'event' markers or other application state:

- [Sending string-formatted irregular streams.](https://github.com/labstreaminglayer/liblsl-Python/tree/master/pylsl/examples/SendStringMarkers.py)
- [Receiving string-formatted irregular streams.](https://github.com/labstreaminglayer/liblsl-Python/tree/master/pylsl/examples/ReceiveStringMarkers.py)

The last example shows how to attach properly formatted meta-data to a stream:

- [Handling stream meta-data.](https://github.com/labstreaminglayer/liblsl-Python/tree/master/pylsl/examples/HandleMetadata.py)

## MATLAB Example Programs: Basic to Advanced

These examples show how to transmit a numeric multi-channel time series through LSL:

- [Sending a multi-channel time series into LSL.](https://github.com/labstreaminglayer/liblsl-Matlab/tree/master/examples/SendData.m)
- [Receiving a multi-channel time series from LSL.](https://github.com/labstreaminglayer/liblsl-Matlab/tree/master/examples/ReceiveData.m)

These examples do the same as before, but now transmit the data at the granularity of chunks:

- [Sending data at chunk granularity.](https://github.com/labstreaminglayer/liblsl-Matlab/tree/master/examples/SendDataInChunks.m)
- [Receiving data at chunk granularity.](https://github.com/labstreaminglayer/liblsl-Matlab/tree/master/examples/ReceiveDataInChunks.m)

These examples show a special-purpose use case for 'event' markers:

- [Sending string-formatted irregular streams.](https://github.com/labstreaminglayer/liblsl-Matlab/tree/master/examples/SendStringMarkers.m)
- [Receiving string-formatted irregular streams.](https://github.com/labstreaminglayer/liblsl-Matlab/tree/master/examples/ReceiveStringMarkers.m)

The last example shows how to attach properly formatted meta-data to a stream:

- [Handling stream meta-data.](https://github.com/labstreaminglayer/liblsl-Matlab/tree/master/examples/HandleMetaData.m)

## Java Example Programs: Basic to Advanced

These examples show how to transmit a numeric multi-channel time series through LSL:

- [Sending a multi-channel time series into LSL.](https://github.com/labstreaminglayer/liblsl-Java/tree/master/src/examples/SendData.java)
- [Receiving a multi-channel time series from LSL.](https://github.com/labstreaminglayer/liblsl-Java/tree/master/src/examples/ReceiveData.java)

The following examples show how to transmit data in form of chunks instead of samples:

- [Sending a multi-channel time series in chunks.](https://github.com/labstreaminglayer/liblsl-Java/tree/master/src/examples/SendDataInChunks.java)
- [Receiving a multi-channel time series in chunks.](https://github.com/labstreaminglayer/liblsl-Java/tree/master/src/examples/ReceiveDataInChunks.java)

These examples show a special-purpose use case for 'event' markers:

- [Sending string-formatted irregular streams.](https://github.com/labstreaminglayer/liblsl-Java/tree/master/src/examples/SendStringMarkers.java)
- [Receiving string-formatted irregular streams.](https://github.com/labstreaminglayer/liblsl-Java/tree/master/src/examples/ReceiveStringMarkers.java)

The last example shows how to attach properly formatted meta-data to a stream:

- [Handling stream meta-data.](https://github.com/labstreaminglayer/liblsl-Java/tree/master/src/examples/HandleMetaData.java)

## C# Example Programs: Basic to Advanced

These examples show how to transmit a numeric multi-channel time series through LSL:

- [Sending a multi-channel time series into LSL.](https://github.com/labstreaminglayer/liblsl-Csharp/blob/master/examples/SendData/SendData.cs)
- [Receiving a multi-channel time series from LSL.](https://github.com/labstreaminglayer/liblsl-Csharp/blob/master/examples/ReceiveData/ReceiveData.cs)

The following examples show how to transmit data in form of chunks:

- [Sending a multi-channel time series in chunks.](https://github.com/labstreaminglayer/liblsl-Csharp/blob/master/examples/SendDataInChunks/SendDataInChunks.cs)
- [Receiving a multi-channel time series in chunks.](https://github.com/labstreaminglayer/liblsl-Csharp/blob/master/examples/ReceiveDataInChunks/ReceiveDataInChunks.cs)

These examples show a special-purpose use case for 'event' markers:

- [Sending string-formatted irregular streams.](https://github.com/labstreaminglayer/liblsl-Csharp/blob/master/examples/SendStringMarkers/SendStringMarkers.cs)
- [Receiving string-formatted irregular streams.](https://github.com/labstreaminglayer/liblsl-Csharp/blob/master/examples/ReceiveStringMarkers/ReceiveStringMarkers.cs)

The last example shows how to attach properly formatted meta-data to a stream:

- [Handling stream meta-data.](https://github.com/labstreaminglayer/liblsl-Csharp/blob/master/examples/HandleMetaData/HandleMetaData.cs)

## Real-World Example Programs

These sample codes are from actual 'production' software that is used to do data transmission:

- [App-KinectMocap](https://github.com/labstreaminglayer/App-KinectMocap): multi-channel signal with body joint positions and meta-data.
- [App-Input](https://github.com/labstreaminglayer/App-Input): irregular marker stream based on keyboard inputs.
- [App-BAlert](https://github.com/labstreaminglayer/App-BAlert): reading from an EEG device in a separate thread.
- [App-EyeLink](https://github.com/labstreaminglayer/App-EyeLink): reading from an eye tracker in Python.

Also, all applications in the Apps directory are open-source and can serve as examples, and most of them are very similar in how they pass on data to LSL.
