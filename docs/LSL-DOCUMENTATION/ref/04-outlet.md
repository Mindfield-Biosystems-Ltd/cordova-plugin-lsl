# Stream Outlets

> Source: https://labstreaminglayer.readthedocs.io/projects/liblsl/ref/outlet.html

## class `stream_outlet`

A stream outlet. Outlets are used to make streaming data (and the meta-data) available on the lab network.

### Constructor

```cpp
stream_outlet(const stream_info &info, int32_t chunk_size = 0, int32_t max_buffered = 360)
```

Establish a new stream outlet. This makes the stream discoverable.

**Parameters:**

| Parameter | Description |
|-----------|-------------|
| `info` | The stream information to use for creating this stream. Stays constant over the lifetime of the outlet. |
| `chunk_size` | Optionally the desired chunk granularity (in samples) for transmission. If unspecified, each push operation yields one chunk. Inlets can override this setting. |
| `max_buffered` | Optionally the maximum amount of data to buffer (in seconds if there is a nominal sampling rate, otherwise x100 in samples). The default is 6 minutes of data. |

### Destructor

```cpp
~stream_outlet()
```
The stream will no longer be discoverable after destruction and all paired inlets will stop delivering data.

### Push Sample Functions

#### `push_sample()` (C array)
```cpp
template<class T, int32_t N>
void push_sample(const T data[N], double timestamp = 0.0, bool pushthrough = true)
```
Push a C array of values as a sample into the outlet. Each entry in the array corresponds to one channel. The function handles type checking & conversion.

**Parameters:**

| Parameter | Description |
|-----------|-------------|
| `data` | An array of values to push (one per channel). |
| `timestamp` | Optionally the capture time of the sample, in agreement with lsl::local_clock(); if omitted, the current time is used. |
| `pushthrough` | Whether to push the sample through to the receivers instead of buffering it with subsequent samples. Note that the chunk_size, if specified at outlet construction, takes precedence over the pushthrough flag. |

#### `push_sample()` (std::vector)
```cpp
void push_sample(const std::vector<float> &data, double timestamp = 0.0, bool pushthrough = true)
```
Push a std vector of values as a sample into the outlet. Each entry in the vector corresponds to one channel. The function handles type checking & conversion.

#### `push_sample()` (pointer)
```cpp
void push_sample(const float *data, double timestamp = 0.0, bool pushthrough = true)
```
Push a pointer to some values as a sample into the outlet. This is a lower-level function for cases where data is available in some buffer. Handles type checking & conversion.

#### `push_numeric_struct()`
```cpp
template<class T>
void push_numeric_struct(const T &sample, double timestamp = 0.0, bool pushthrough = true)
```
Push a packed C struct (of numeric data) as one sample into the outlet. Overall size checking but no type checking or conversion are done. Cannot be used for variable-size / string-formatted data.

#### `push_numeric_raw()`
```cpp
void push_numeric_raw(const void *sample, double timestamp = 0.0, bool pushthrough = true)
```
Push a pointer to raw numeric data as one sample into the outlet. This is the lowest-level function; performs no checking whatsoever. Cannot be used for variable-size / string-formatted channels.

### Push Chunk Functions

#### `push_chunk()` (vector of samples, single timestamp)
```cpp
template<class T>
void push_chunk(const std::vector<T> &samples, double timestamp = 0.0, bool pushthrough = true)
```
Push a chunk of samples (batched into an STL vector) into the outlet.

**Parameters:**

| Parameter | Description |
|-----------|-------------|
| `samples` | A vector of samples in some supported format (each sample can be a data pointer, data array, or std vector of data). |
| `timestamp` | Optionally the capture time of the most recent sample, in agreement with local_clock(); if omitted, the current time is used. The time stamps of other samples are automatically derived according to the sampling rate of the stream. |
| `pushthrough` | Whether to push the chunk through to the receivers instead of buffering it with subsequent samples. |

#### `push_chunk()` (vector of samples, per-sample timestamps)
```cpp
template<class T>
void push_chunk(const std::vector<T> &samples, const std::vector<double> &timestamps, bool pushthrough = true)
```
Push a chunk of samples with a separate time stamp for each sample (for irregular-rate streams).

#### `push_chunk_numeric_structs()` (single timestamp)
```cpp
template<class T>
void push_chunk_numeric_structs(const std::vector<T> &samples, double timestamp = 0.0, bool pushthrough = true)
```
Push a chunk of numeric data as C-style structs (batched into an STL vector) into the outlet. Performs some size checking but no type checking. Cannot be used for variable-size / string-formatted data.

#### `push_chunk_numeric_structs()` (per-sample timestamps)
```cpp
template<class T>
void push_chunk_numeric_structs(const std::vector<T> &samples, const std::vector<double> &timestamps, bool pushthrough = true)
```
Push a chunk of numeric data from C-style structs with per-sample timestamps.

#### `push_chunk_multiplexed()` (vector, per-sample timestamps)
```cpp
void push_chunk_multiplexed(const std::vector<float> &buffer, const std::vector<double> &timestamps, bool pushthrough = true)
```
Push a chunk of multiplexed data into the outlet. One timestamp per sample is provided.

**Parameters:**

| Parameter | Description |
|-----------|-------------|
| `buffer` | A buffer of channel values holding the data for zero or more successive samples to send. |
| `timestamps` | A buffer of timestamp values holding time stamps for each sample in the data buffer. |
| `pushthrough` | Whether to push the chunk through to the receivers instead of buffering it with subsequent samples. |

#### `push_chunk_multiplexed()` (pointer, single timestamp)
```cpp
void push_chunk_multiplexed(const float *buffer, std::size_t buffer_elements, double timestamp = 0.0, bool pushthrough = true)
```
Push a chunk of multiplexed samples into the outlet. Single timestamp provided.

**IMPORTANT:** The provided buffer size is measured in channel values (e.g., floats) rather than in samples.

#### `push_chunk_multiplexed()` (pointer, per-sample timestamps)
```cpp
void push_chunk_multiplexed(const float *data_buffer, const double *timestamp_buffer, std::size_t data_buffer_elements, bool pushthrough = true)
```
Push a chunk of multiplexed samples with per-sample timestamps.

**IMPORTANT:** The provided buffer size is measured in channel values (e.g., floats) rather than in samples.

### Query Functions

#### `have_consumers()`
```cpp
bool have_consumers()
```
Check whether consumers are currently registered. While it does not hurt, there is technically no reason to push samples if there is no consumer.

#### `wait_for_consumers()`
```cpp
bool wait_for_consumers(double timeout)
```
Wait until some consumer shows up (without wasting resources).

**Return:** True if the wait was successful, false if the timeout expired.

#### `info()`
```cpp
stream_info info() const
```
Retrieve the stream info provided by this outlet. This is what was used to create the stream (and also has the Additional Network Information fields assigned).
