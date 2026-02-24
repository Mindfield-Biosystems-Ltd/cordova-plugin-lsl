# Stream Inlets

> Source: https://labstreaminglayer.readthedocs.io/projects/liblsl/ref/inlet.html

## class `stream_inlet`

### Constructor

```cpp
stream_inlet(const stream_info &info, int32_t max_buflen = 360, int32_t max_chunklen = 0, bool recover = true)
```

Construct a new stream inlet from a resolved stream info.

**Parameters:**

| Parameter | Description |
|-----------|-------------|
| `info` | A resolved stream info object (as coming from one of the resolver functions). Note: the stream_inlet may also be constructed with a fully-specified stream_info, if the desired channel format and count is already known up-front, but this is strongly discouraged and should only ever be done if there is no time to resolve the stream up-front (e.g., due to limitations in the client program). |
| `max_buflen` | Optionally the maximum amount of data to buffer (in seconds if there is a nominal sampling rate, otherwise x100 in samples). Recording applications want to use a fairly large buffer size here, while real-time applications would only buffer as much as they need to perform their next calculation. |
| `max_chunklen` | Optionally the maximum size, in samples, at which chunks are transmitted (the default corresponds to the chunk sizes used by the sender). Recording applications can use a generous size here (leaving it to the network how to pack things), while real-time applications may want a finer (perhaps 1-sample) granularity. If left unspecified (=0), the sender determines the chunk granularity. |
| `recover` | Try to silently recover lost streams that are recoverable (=those that have a source_id set). In all other cases (recover is false or the stream is not recoverable) functions may throw a lost_error if the stream's source is lost (e.g., due to an app or computer crash). |

### Destructor

```cpp
~stream_inlet()
```
The inlet will automatically disconnect if destroyed.

### Stream Management Functions

#### `info()`
```cpp
stream_info info(double timeout = FOREVER)
```
Retrieve the complete information of the given stream, including the extended description. Can be invoked at any time of the stream's lifetime.

**Exceptions:** `timeout_error` (if the timeout expires), or `lost_error` (if the stream source has been lost).

#### `open_stream()`
```cpp
void open_stream(double timeout = FOREVER)
```
Subscribe to the data stream. All samples pushed in at the other end from this moment onwards will be queued and eventually be delivered in response to `pull_sample()` or `pull_chunk()` calls. Pulling a sample without some preceding `open_stream` is permitted (the stream will then be opened implicitly).

**Exceptions:** `timeout_error` (if the timeout expires), or `lost_error` (if the stream source has been lost).

#### `close_stream()`
```cpp
void close_stream()
```
Drop the current data stream. All samples that are still buffered or in flight will be dropped and transmission and buffering of data for this inlet will be stopped. If an application stops being interested in data from a source (temporarily or not) but keeps the outlet alive, it should call `close_stream()` to not waste unnecessary system and network resources.

### Time Correction Functions

#### `time_correction()` (simple)
```cpp
double time_correction(double timeout = FOREVER)
```
Retrieve an estimated time correction offset for the given stream.

The first call to this function takes several milliseconds until a reliable first estimate is obtained. Subsequent calls are instantaneous (and rely on periodic background updates). On a well-behaved network, the precision of these estimates should be below 1 ms (empirically it is within +/-0.2 ms).

- 0.2 ms is typical of wired networks.
- 2 ms is typical of wireless networks.
- The number can be much higher on poor networks.

**Return:** The time correction estimate. This is the number that needs to be added to a time stamp that was remotely generated via `lsl_local_clock()` to map it into the local clock domain of this machine.

**Exceptions:** `lsl::timeout_error` (if the timeout expires), or `lsl::lost_error` (if the stream source has been lost).

#### `time_correction()` (extended)
```cpp
double time_correction(double *remote_time, double *uncertainty, double timeout = FOREVER)
```
Same as above but with additional output parameters:

| Parameter | Description |
|-----------|-------------|
| `remote_time` | The current time of the remote computer that was used to generate this time_correction. If desired, the client can fit time_correction vs remote_time to improve the real-time time_correction further. |
| `uncertainty` | The maximum uncertainty of the given time correction. |

### Post-Processing

#### `set_postprocessing()`
```cpp
void set_postprocessing(uint32_t flags = post_ALL)
```
Set post-processing flags to use. By default, the inlet performs NO post-processing and returns the ground-truth time stamps, which can then be manually synchronized using `time_correction()`, and then smoothed/dejittered if desired.

This function allows automating these two and possibly more operations.

**Warning:** when you enable this, you will no longer receive or be able to recover the original time stamps.

**Parameters:**
- `flags` -- An integer that is the result of bitwise OR'ing one or more options from `processing_options_t` together (e.g., `post_clocksync|post_dejitter`); the default is to enable all options.

### Pull Sample Functions

#### `pull_sample()` (C array)
```cpp
template<class T, int N>
double pull_sample(T sample[N], double timeout = FOREVER)
```
Pull a sample from the inlet and read it into an array of values. Handles type checking & conversion.

**Return:** The capture time of the sample on the remote machine, or 0.0 if no new sample was available. To remap this time stamp to the local clock, add the value returned by `time_correction()` to it.

**Exceptions:** `lost_error` (if the stream source has been lost).

#### `pull_sample()` (std::vector)
```cpp
double pull_sample(std::vector<float> &sample, double timeout = FOREVER)
```
Pull a sample from the inlet and read it into a std vector of values. Handles type checking & conversion and allocates the necessary memory in the vector if necessary.

#### `pull_sample()` (pointer)
```cpp
double pull_sample(float *buffer, int32_t buffer_elements, double timeout = FOREVER)
```
Pull a sample from the inlet and read it into a pointer to values. Handles type checking & conversion.

#### `pull_numeric_struct()`
```cpp
template<class T>
double pull_numeric_struct(T &sample, double timeout = FOREVER)
```
Pull a sample from the inlet and read it into a custom C-style struct. Overall size checking but no type checking or conversion are done. Do not use for variable-size/string-formatted streams.

#### `pull_numeric_raw()`
```cpp
double pull_numeric_raw(void *sample, int32_t buffer_bytes, double timeout = FOREVER)
```
Pull a sample from the inlet and read it into a pointer to raw data. No type checking or conversions are done (not recommended!). Do not use for variable-size/string-formatted streams.

### Pull Chunk Functions

#### `pull_chunk()` (with timestamps)
```cpp
template<class T>
bool pull_chunk(std::vector<std::vector<T>> &chunk, std::vector<double> &timestamps)
```
Pull a chunk of samples from the inlet. This is the most complete version, returning both the data and a timestamp for each sample.

**Return:** True if some data was obtained.

#### `pull_chunk()` (latest timestamp only)
```cpp
template<class T>
double pull_chunk(std::vector<std::vector<T>> &chunk)
```
Pull a chunk of samples from the inlet. This version returns only the most recent sample's time stamp.

**Return:** The time when the most recent sample was captured on the remote machine, or 0.0 if no new sample was available.

#### `pull_chunk()` (no timestamps)
```cpp
template<class T>
std::vector<std::vector<T>> pull_chunk()
```
Pull a chunk of samples from the inlet. This function does not return time stamps for the samples.

Invoked as: `mychunk = pull_chunk<float>();`

#### `pull_chunk_multiplexed()` (pointer-based)
```cpp
std::size_t pull_chunk_multiplexed(
    float *data_buffer,
    double *timestamp_buffer,
    std::size_t data_buffer_elements,
    std::size_t timestamp_buffer_elements,
    double timeout = 0.0
)
```
Pull a chunk of data from the inlet into a pre-allocated buffer. This is a high-performance function that performs no memory allocations (useful for very high data rates or on low-powered devices).

**IMPORTANT:** The provided data buffer size is measured in channel values (e.g., floats) rather than in samples.

**Parameters:**

| Parameter | Description |
|-----------|-------------|
| `data_buffer` | A pointer to a buffer of data values where the results shall be stored. |
| `timestamp_buffer` | A pointer to a buffer of timestamp values where time stamps shall be stored. If this is NULL, no time stamps will be returned. |
| `data_buffer_elements` | The size of the data buffer, in channel data elements (of type T). Must be a multiple of the stream's channel count. |
| `timestamp_buffer_elements` | The size of the timestamp buffer. If a timestamp buffer is provided then this must correspond to the same number of samples as data_buffer_elements. |
| `timeout` | The timeout for this operation. When the timeout expires, the function may return before the entire buffer is filled. The default value of 0.0 will retrieve only data available for immediate pickup. |

**Return:** `data_elements_written` -- Number of channel data elements written to the data buffer.

#### `pull_chunk_multiplexed()` (vector-based)
```cpp
template<typename T>
bool pull_chunk_multiplexed(
    std::vector<T> &chunk,
    std::vector<double> *timestamps = nullptr,
    double timeout = 0.0,
    bool append = false
)
```
Pull a multiplexed chunk of samples and optionally the sample timestamps from the inlet.

**Parameters:**

| Parameter | Description |
|-----------|-------------|
| `chunk` | A vector to hold the multiplexed (Sample 1 Channel 1, S1C2, S2C1, S2C2, ...) samples |
| `timestamps` | A vector to hold the timestamps or nullptr |
| `timeout` | Time to wait for the first sample. The default value of 0.0 will not wait for data to arrive, pulling only samples already received. |
| `append` | (True:) Append data or (false:) clear them first |

#### `pull_chunk_numeric_structs()` (with timestamps)
```cpp
template<class T>
bool pull_chunk_numeric_structs(std::vector<T> &chunk, std::vector<double> &timestamps)
```
Pull a chunk of samples as C-style structs, returning both data and timestamps.

#### `pull_chunk_numeric_structs()` (latest timestamp only)
```cpp
template<class T>
double pull_chunk_numeric_structs(std::vector<T> &chunk)
```
Returns only the most recent sample's time stamp.

#### `pull_chunk_numeric_structs()` (no timestamps)
```cpp
template<class T>
std::vector<T> pull_chunk_numeric_structs()
```
Does not return time stamps. Invoked as: `mychunk = pull_chunk<mystruct>();`

### Query Functions

#### `samples_available()`
```cpp
std::size_t samples_available()
```
Query whether samples are currently available for immediate pickup. Note that it is not a good idea to use `samples_available()` to determine whether a `pull_*()` call would block: to be sure, set the pull timeout to 0.0 or an acceptably low value. If the underlying implementation supports it, the value will be the number of samples available (otherwise it will be 1 or 0).

#### `was_clock_reset()`
```cpp
bool was_clock_reset()
```
Query whether the clock was potentially reset since the last call to `was_clock_reset()`. This is a rarely-used function that is only useful to applications that combine multiple time_correction values to estimate precise clock drift; it allows to tolerate cases where the source machine was hot-swapped or restarted in between two measurements.

#### `smoothing_halftime()`
```cpp
void smoothing_halftime(float value)
```
Override the half-time (forget factor) of the time-stamp smoothing. The default is 90 seconds unless a different value is set in the config file. Using a longer window will yield lower jitter in the time stamps, but longer windows will have trouble tracking changes in the clock rate (usually due to temperature changes); the default is able to track changes up to 10 degrees C per minute sufficiently well.
