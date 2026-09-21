import pyaudio

p = pyaudio.PyAudio()

print("Available Input Devices:")
# Loop through all available hardware devices
for i in range(p.get_device_count()):
    device_info = p.get_device_info_by_index(i)
    # Check if the device has at least 1 input channel (is a microphone)
    if device_info.get("maxInputChannels") > 0:
        print(f"Device ID {i}: {device_info.get('name')}")

p.terminate()
