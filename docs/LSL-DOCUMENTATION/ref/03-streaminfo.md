# Stream Info

> Source: https://labstreaminglayer.readthedocs.io/projects/liblsl/ref/streaminfo.html

A stream info object stores the stream's metadata.

## class `stream_info`

### Constructor

```cpp
stream_info(
    const std::string &name,
    const std::string &type,
    int32_t channel_count = 1,
    double nominal_srate = IRREGULAR_RATE,
    channel_format_t channel_format = cf_float32,
    const std::string &source_id = std::string()
)
```

Construct a new stream_info object. Core stream information is specified here. Any remaining meta-data can be added later.

**Parameters:**

| Parameter | Description |
|-----------|-------------|
| `name` | Name of the stream. Describes the device (or product series) that this stream makes available (for use by programs, experimenters or data analysts). Cannot be empty. |
| `type` | Content type of the stream. Please see [XDF Meta-Data](https://github.com/sccn/xdf/wiki/Meta-Data) for pre-defined content-type names, but you can also make up your own. The content type is the preferred way to find streams (as opposed to searching by name). |
| `channel_count` | Number of channels per sample. This stays constant for the lifetime of the stream. |
| `nominal_srate` | The sampling rate (in Hz) as advertised by the data source, if regular (otherwise set to IRREGULAR_RATE). |
| `channel_format` | Format/type of each channel. If your channels have different formats, consider supplying multiple streams or use the largest type that can hold them all (such as cf_double64). |
| `source_id` | Unique identifier of the device or source of the data, if available (such as the serial number). This is critical for system robustness since it allows recipients to recover from failure even after the serving app, device or computer crashes (just by finding a stream with the same source id on the network again). Therefore, it is highly recommended to always try to provide whatever information can uniquely identify the data source itself. |

### Public Functions

#### `name()`
```cpp
std::string name() const
```
Name of the stream. This is a human-readable name. For streams offered by device modules, it refers to the type of device or product series that is generating the data of the stream. If the source is an application, the name may be a more generic or specific identifier. Multiple streams with the same name can coexist, though potentially at the cost of ambiguity.

#### `type()`
```cpp
std::string type() const
```
Content type of the stream. The content type is a short string such as "EEG", "Gaze" which describes the content carried by the channel (if known). To be useful to applications and automated processing systems using the recommended content types is preferred. Content types usually follow those pre-defined in [XDF Meta-Data](https://github.com/sccn/xdf/wiki/Meta-Data).

#### `channel_count()`
```cpp
int32_t channel_count() const
```
Number of channels of the stream. A stream has at least one channel; the channel count stays constant for all samples.

#### `nominal_srate()`
```cpp
double nominal_srate() const
```
Sampling rate of the stream, according to the source (in Hz). If a stream is irregularly sampled, this should be set to IRREGULAR_RATE.

Note that no data will be lost even if this sampling rate is incorrect or if a device has temporary hiccups, since all samples will be recorded anyway (except for those dropped by the device itself). However, when the recording is imported into an application, a good importer may correct such errors more accurately if the advertised sampling rate was close to the specs of the device.

#### `channel_format()`
```cpp
channel_format_t channel_format() const
```
Channel format of the stream. All channels in a stream have the same format. However, a device might offer multiple time-synched streams each with its own format.

#### `source_id()`
```cpp
std::string source_id() const
```
Unique identifier of the stream's source, if available. The unique source (or device) identifier is an optional piece of information that, if available, allows that endpoints (such as the recording program) can re-acquire a stream automatically once it is back online.

#### `version()`
```cpp
int32_t version() const
```
Protocol version used to deliver the stream.

#### `created_at()`
```cpp
double created_at() const
```
Creation time stamp of the stream. This is the time stamp when the stream was first created (as determined via lsl::local_clock() on the providing machine).

#### `uid()`
```cpp
std::string uid() const
```
Unique ID of the stream outlet instance (once assigned). This is a unique identifier of the stream outlet, and is guaranteed to be different across multiple instantiations of the same outlet (e.g., after a re-start).

#### `session_id()`
```cpp
std::string session_id() const
```
Session ID for the given stream. The session id is an optional human-assigned identifier of the recording session. While it is rarely used, it can be used to prevent concurrent recording activities on the same sub-network from seeing each other's streams.

#### `hostname()`
```cpp
std::string hostname() const
```
Hostname of the providing machine.

#### `desc()`
```cpp
xml_element desc()
```
Extended description of the stream. It is highly recommended that at least the channel labels are described here. See code examples on the LSL wiki. Other information, such as amplifier settings, measurement units if deviating from defaults, setup information, subject information, etc., can be specified here, as well. Meta-data recommendations follow the XDF file format project ([XDF Meta-Data](https://github.com/sccn/xdf/wiki/Meta-Data)).

**Important:** if you use a stream content type for which meta-data recommendations exist, please try to lay out your meta-data in agreement with these recommendations for compatibility with other applications.

#### `matches_query()`
```cpp
bool matches_query(const char *query) const
```
Tries to match the stream info XML element against an [XPath](https://en.wikipedia.org/wiki/XPath#Syntax_and_semantics_(XPath_1.0)) query.

Example query strings:
```
channel_count>5 and type='EEG'
type='TestStream' or contains(name,'Brain')
name='ExampleStream'
```

#### `as_xml()`
```cpp
std::string as_xml() const
```
Retrieve the entire streaminfo in XML format. This yields an XML document (in string form) whose top-level element is `<info>`. The info element contains one element for each field of the streaminfo class, including:

- the core elements `<name>`, `<type>`, `<channel_count>`, `<nominal_srate>`, `<channel_format>`, `<source_id>`
- the misc elements `<version>`, `<created_at>`, `<uid>`, `<session_id>`, `<v4address>`, `<v4data_port>`, `<v4service_port>`, `<v6address>`, `<v6data_port>`, `<v6service_port>`
- the extended description element `<desc>` with user-defined sub-elements.

#### `channel_bytes()`
```cpp
int32_t channel_bytes() const
```
Number of bytes occupied by a channel (0 for string-typed channels).

#### `sample_bytes()`
```cpp
int32_t sample_bytes() const
```
Number of bytes occupied by a sample (0 for string-typed channels).

#### `handle()`
```cpp
lsl_streaminfo handle() const
```
Get the implementation handle.

#### Default constructor
```cpp
stream_info()
```

#### Copy constructor
```cpp
stream_info(const stream_info &rhs)
```

#### Assignment operator
```cpp
stream_info &operator=(const stream_info &rhs)
```

#### Destructor
```cpp
~stream_info()
```

### Public Static Functions

#### `from_xml()`
```cpp
static stream_info from_xml(const std::string &xml)
```
Utility function to create a stream_info from an XML representation.
