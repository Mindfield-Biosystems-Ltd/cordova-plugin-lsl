# Supported Devices and Tools

> Source: https://labstreaminglayer.readthedocs.io/info/supported_devices.html

---

**For device applications and tools hosted on GitHub, please make sure to read the respective repository's README and to check the release page for downloads.**

The lab streaming layer was originally developed to facilitate human-subject experiments that involve multi-modal data acquisition, including brain dynamics (primarily EEG), physiology (EOG, EMG, heart rate, respiration, skin conductance, etc.), as well as behavioral data (motion capture, eye tracking, touch interaction, facial expressions, etc.) and finally environmental and program state (for example, event markers). There exists already many devices and applications with LSL integration already provided. This page lists the integrations of which we are aware, but does not serve as an endorsement and most integrations are untested by the LSL team.

If you are looking for LSL support for a device that is not in the list, try specialized google searches (e.g., combine your device name, "LSL", and "GitHub"). If that fails to find a pre-existing solution, then you will need to get a device SDK to access the live signal stream and write your own application to push it to LSL -- this can be quite simple depending on the SDK.

## Supported Biosignal Hardware

The majority of EEG systems on the market are currently compatible with LSL.

The following systems are supported by programs included in the LSL distribution (untested systems marked with a (u)):

- [ABM B-Alert X4/X10/X24 wireless](https://github.com/labstreaminglayer/App-BAlertAthenaCLI)
- [BioSemi Active II Mk1 and Mk2](https://github.com/labstreaminglayer/App-BioSemi)
- [Blackrock Cerebus/NSP](https://github.com/labstreaminglayer/App-BlackrockTimestamps) (timestamps only)
- [Cognionics dry/wireless](https://github.com/labstreaminglayer/App-Cognionics)
- [EGI AmpServer](https://github.com/labstreaminglayer/App-EGIAmpServer)
- [Enobio dry/wireless](https://github.com/labstreaminglayer/App-Enobio) (u) (please use vendor-provided section)
- [g.Tec g.USBamp](https://github.com/labstreaminglayer/App-g.Tec/tree/master/g.USBamp) (buggy at high sampling rates)
- [g.Tec g.NEEDaccess](https://github.com/labstreaminglayer/App-g.Tec/tree/master/g.NEEDaccess) (including g.USBamp, g.HIamp, g.Nautilus)
- [MINDO dry/wireless](https://github.com/labstreaminglayer/App-MINDO)
- [Neuroscan Synamp II and Synamp Wireless](https://github.com/labstreaminglayer/App-Neuroscan) (u)
- [Neuroscan Acquire](https://github.com/labstreaminglayer/App-NeuroscanAcquire) (u)
- [Wearable Sensing](https://github.com/labstreaminglayer/App-WearableSensing)

The following devices support LSL via vendor-provided software:

- [ANT Neuro eego sports](https://www.ant-neuro.com/products/eego_sports/eego-software)
- [ANT Neuro eego mylab](https://www.ant-neuro.com/products/eego_mylab/software_features)
- [Bitbrain EEG & Biosignals platform](https://www.bitbrain.com/neurotechnology-products/software/programming-tools)
- [Bittium NeurOne Tesla](https://www.bittium.com/medical/support)
- [BrainAccess by NEUROtechnology](https://www.brainaccess.ai/)
- [Brain Products actiCHamp/actiCHamp Plus](https://github.com/brain-products/LSL-actiCHamp)
- [Brain Products BrainAmp series](https://github.com/brain-products/LSL-BrainAmpSeries)
- [Brain Products LiveAmp](https://github.com/brain-products/LSL-LiveAmp/)
- [BrainVision RDA client](https://github.com/brain-products/LSL-BrainVisionRDA)
- [Cognionics (all headsets)](http://www.cognionics.com/)
- [EB Neuro BE Plus LTM](http://www.ebneuro.biz/en/neurology/ebneuro/galileo-suite/be-plus-ltm)
- [Emotiv Brainware (e.g. EPOC) via EmotivPRO](https://github.com/Emotiv/labstreaminglayer)
- [IDUN Guardian via provided Python scripts](https://sdk-docs.idunguardian.com/examples.html#stream-data-to-lsl)
- [mBrainTrain SMARTING](http://www.mbraintrain.com/smarting/)
- neuroelectrics ([Enobio](http://www.neuroelectrics.com/products/enobio/), [StarStim](https://www.neuroelectrics.com/solutions/starstim)) via [NIC2](https://www.neuroelectrics.com/solution/software-integrations/nic2)
- [Mentalab Explore](https://github.com/Mentalab-hub/explorepy)
- [Neuracle NeuroHub](https://github.com/neuracle/Neuracle.LSLSample)
- [OpenBCI (all headsets)](http://docs.openbci.com/software/06-labstreaminglayer)
- [Starcat HackEEG Shield for Arduino](https://www.starcat.io/)
- [TMSi APEX](https://www.tmsi.artinis.com/tmsi-python-library)
- [TMSi SAGA](https://www.tmsi.artinis.com/tmsi-python-library)

The following are some of the devices we know about that support LSL natively through third party software:

- [Bittium Faros](https://www.bittium.com/medical/cardiology)
  - [Faros Streamer](https://github.com/bwrc/faros-streamer)
  - [Faros Streamer 2](https://github.com/bwrc/faros-streamer-2)

- [InteraXon Muse](http://www.choosemuse.com/)
  - [MU-01 - Muse - Released 2014 Example with Matlab](https://labstreaminglayer.readthedocs.io/info/matlab_example_with_muse.html)
  - [Muse (MU-02 2016) and Muse 2 (MU-03 2018)](https://github.com/alexandrebarachant/muse-lsl)
  - [Muse 2016, Muse 2, Muse S](https://github.com/kowalej/BlueMuse)

The following devices support LSL natively without any additional software:

- [Foc.us EEG Dev Kit](https://foc.us/eeg)
- [Neurosity Notion](https://neurosity.co/)
- [NeuroBehavioralSystems LabStreamer](https://www.neurobs.com/menu_presentation/menu_hardware/labstreamer)

The following systems are also supported by a separate program, the [OpenViBE acquisition server](https://labstreaminglayer.readthedocs.io/info/ovas.html), but note however that there is [an outstanding issue that prevents streams acquired with OpenViBE from synchronizing with other LSL streams](http://openvibe.inria.fr/tracker/view.php?id=197):

- ANT Neuro ASALAB EEG
- Brain Products QuickAmp, V-Amp, and BrainAmp series
- CTF/VSM (u)
- EGI NetAmp (u)
- g.USBamp
- Emotiv EPOC
- Micromed SD LTM
- MindMedia NeXus32
- Mitsar EEG 202 (u)
- OpenEEG ModularEEG and MonolithEEG
- TMSi Porti32 and Refa32

## Supported fNIRS Hardware

The following devices support LSL natively without any additional software:

- [Artinis Brite Family](https://www.artinis.com/brite-family), [Portalite](https://www.artinis.com/portalite), [PortaMon](https://www.artinis.com/portamon), [OxyMon](https://www.artinis.com/oxymon) and [Artinis NIRS-EEG package](https://www.artinis.com/nirs-eeg-package) via [OxySoft](https://www.artinis.com/oxysoft) and [Brite Connect](https://www.artinis.com/brite-connect)
- [Cortivision PHOTON CAP](https://www.cortivision.com/products/photon/)
- [GowerLabs LUMO](https://www.gowerlabs.co.uk/lumo)
- [NIRx NIRScout](https://nirx.net/nirscout) and [NIRSport 2](https://nirx.net/nirsport) via [Aurora](https://nirx.net/software) and [Turbo-Satori](https://nirx.net/turbosatori)

## Supported Electrophysiological Hardware

Various devices with ECG and/or EMG sensors are supported. Some of these have non-electrophys sensors as well (i.e., GSR, Respiration, Temperature, Accelerometer, etc.)

- [bitalino (using LSL for Python)](https://github.com/fsuarezj/bitalino_lsl) (wearables and various sensors)
- [CGX (Cognionics) AIM Physiological Monitor](https://www.cgxsystems.com/auxiliary-input-module-gen2) (ExG/Respiration/GSR/SPo2/Temp)
- [Heart Rate Service bands](https://github.com/abcsds/HRBand-LSL) (Many bluetooth HR bands such as the Polar H10)
- [Polar H10 ECG](https://github.com/markspan/PolarBLE?tab=readme-ov-file)
- [Shimmer Examples (using LSL for C#)](https://github.com/ShimmerEngineering/liblsl-Csharp/tree/shimmer_dev/examples/SendData) (ECG/EMG/GSR/Accelerometer/Gyroscope/Magnetometer/PPG/Temperature/etc)
- [Shimmer Examples (using LSL for Java)](https://github.com/ShimmerEngineering/liblsl-Java/tree/shimmer_dev/src/examples) (ECG/EMG/GSR/Accelerometer/Gyroscope/Magnetometer/PPG/Temperature/etc)
- [TMSi SPIRE EMG](https://www.tmsi.artinis.com/tmsi-python-library)
- [Zephyr BioHarness](https://github.com/labstreaminglayer/App-Zephyr) (ECG/Respiration/Accelerometer)

## Supported Eye Tracking Hardware

Several eye tracking systems are currently supported by LSL and included in the distribution (untested systems marked with a (u)):

- [7invensun Eye Tracker](https://github.com/FishBones-DIY/App-7invensun)
- Custom 2-camera eye trackers (with some hacking)
- [EyeLogic](https://github.com/EyeLogicSolutions/EyeLogic-LSL)
- [EyeTechDS - VT3-Mini](https://github.com/labstreaminglayer/App-EyeTechDS)
- Eye Tribe Tracker Pro
- [HTC Vive Eye](https://github.com/mit-ll/Signal-Acquisition-Modules-for-Lab-Streaming-Layer)
- [Pupil-Labs](https://github.com/labstreaminglayer/App-PupilLabs)
- [SMI iViewX](https://github.com/labstreaminglayer/App-SMIEyetracker)
- [SMI Eye Tracking Glasses](https://github.com/labstreaminglayer/App-SMIEyetracker)
- SR Research Eyelink (very basic)
- Tobii Eye trackers
  - [Tobii Pro](https://github.com/labstreaminglayer/App-TobiiPro)
  - [Tobii Glasses 3](https://github.com/tobiipro/Tobii.Glasses3.SDK/releases)
  - [Tobii StreamEngine (consumer devices)](https://github.com/labstreaminglayer/App-TobiiStreamEngine)

## Supported Human Interface Hardware

A wide range of Windows-compatible input hardware is supported by LSL and included with the distribution:

- [Input devices (keyboards, trackballs, presenters, etc.)](https://github.com/labstreaminglayer/App-Input)
- [DirectX-compatible joysticks, wheels](https://github.com/labstreaminglayer/App-GameController)
- [Gamepads (e.g. XBox Controller) - cross-platform](https://github.com/labstreaminglayer/App-Gamepad)
- [Nintendo Wiimote and official expansions](https://github.com/labstreaminglayer/App-Wiimote)

## Supported Motion Capture Hardware

Several motion-capture systems are currently supported by LSL. The ones we know of are:

- [AMTI force plates with serial I/O](https://github.com/labstreaminglayer/App-AMTIForcePlate)
- [PhaseSpace](https://github.com/labstreaminglayer/App-PhaseSpace)
- [Microsoft Kinect](https://github.com/labstreaminglayer/App-KinectMocap)
- [NaturalPoint OptiTrack](https://github.com/labstreaminglayer/App-OptiTrack) (some versions)
- [OpenVR](https://github.com/labstreaminglayer/App-OpenVR)
- [Qualisys](https://github.com/qualisys/qualisys_lsl_app)
- [Vicon](https://gitlab.com/vicon-pupil-data-parser/vajkonstrim) (LSL support unclear - check with authors)
- [Xsens](https://github.com/Torres-SMIL/xsens_labstreaminglayer_link)
- [UltraLeap Leap Motion](https://github.com/labstreaminglayer/LSL-LeapMotion)

## Supported Multimedia Hardware

Support for standard Windows-compatible multimedia hardware is included:

- DirectShow-compatible video hardware
- [Qt-compatible audio input](https://github.com/labstreaminglayer/App-AudioCapture)
- [mbtCameraLSL (Android)](https://play.google.com/store/apps/details?id=com.mbraintrain.mbtcameralsl&hl=en)
- [TimeShot (Windows multi-camera capture)](https://github.com/markspan/TimeShot)

## Supported Stimulation Hardware

The following stimulation devices (TMS, TDCS / TACS) have LSL support:

- [Soterix Medical MXN-33 Transcranial Electrical Stimulator](https://soterixmedical.com/research/hd/mxn-33)

## Supported Stimulus Presentation Software

The following stimulus presentations systems are usable out of the box with LSL:

- [EventIDE](http://wiki.okazolab.com/wiki.okazolab.com/LAB-Streaming-Layer-in-EventIDE)
- [E-Prime 3.0](https://github.com/PsychologySoftwareTools/eprime3-lsl-package-file/)
- [iMotions](https://www.imotions.com/)
- [Neurobehavioral Systems Presentation](https://www.neurobs.com/)
- Psychopy (using LSL for Python)
- PsychToolbox (using LSL for MATLAB)
- [Reiz](https://github.com/pyreiz/pyreiz)
- [Simulation and Neuroscience Application Platform (SNAP)](https://github.com/sccn/SNAP)
- Unity (using [LSL4Unity](https://github.com/labstreaminglayer/LSL4Unity) or liblsl C#)
- Unreal Engine ([Marketplace](https://www.unrealengine.com/marketplace/en-US/product/labstreaminglayer-plugin), [GitHub](https://github.com/labstreaminglayer/plugin-UE4))

## Miscellaneous Hardware

The following miscellaneous hardware is supported:

- [Generic serial port](https://github.com/labstreaminglayer/App-SerialPort)
- [Measurement Computing DAQ](https://github.com/labstreaminglayer/App-MeasurementComputing)
- [biosignalsplux sensors using OpenSignals](https://www.biosignalsplux.com/index.php/software/apis)
- [Vernier Go Direct sensors](https://github.com/labstreaminglayer/App-vernier)
- [Nonin Xpod PPG](https://github.com/labstreaminglayer/App-nonin)
- [Tyromotion Amadeo Robot](https://github.com/pyreiz/ctrl-tyromotion)
