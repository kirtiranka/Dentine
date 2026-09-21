import os
import threading
import pyaudio

from deepgram import DeepgramClient
from deepgram.core.events import EventType
from websockets import ConnectionClosed, ConnectionClosedOK

DEEPGRAM_API_KEY = os.environ.get("DEEPGRAM_API_KEY", "")

if DEEPGRAM_API_KEY == "":
    raise ValueError("DEEPGRAM_API_KEY environment variable is not set.")

# Audio recording configuration
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000  # 16kHz standard for speech recognition
CHUNK_SIZE = 4096  # Number of audio frames per buffer

client = DeepgramClient(api_key=DEEPGRAM_API_KEY)


def get_microphone_transcribed_chunk() -> str:
    # Tell Deepgram to expect raw PCM linear16 at 16,000 Hz
    with client.listen.v1.connect(
        model="nova-3",
        language="en",
        smart_format=True,
        encoding="linear16",
        sample_rate=RATE,
        channels=CHANNELS,
    ) as connection:
        ready = threading.Event()
        stop_event = threading.Event()

        full_message = []

        def on_message(result):
            if result.type == "Results":
                channel = result.channel
                alt = channel.alternatives[0]
                transcript = alt.transcript
                if transcript:
                    print(transcript)
                    full_message.append(transcript)

                if transcript and "ready to submit" in transcript.lower():
                    print("End dictation command received. Stopping...")
                    stop_event.set()
                    # Optionally notify Deepgram you're done sending audio before closing
                    try:
                        connection.finish()
                    except Exception:
                        pass
                    connection.close()

        connection.on(EventType.OPEN, lambda _: ready.set())
        connection.on(EventType.MESSAGE, on_message)

        def record_microphone():
            ready.wait()

            audio = pyaudio.PyAudio()
            stream = audio.open(
                format=FORMAT,
                channels=CHANNELS,
                rate=RATE,
                input=True,
                frames_per_buffer=CHUNK_SIZE,
            )

            print("Microphone live. Speak into your mic...")

            try:
                while not stop_event.is_set():
                    data = stream.read(CHUNK_SIZE, exception_on_overflow=False)
                    # Double-check before sending to avoid hitting the closed socket
                    if stop_event.is_set():
                        break
                    try:
                        connection.send_media(data)
                    except (ConnectionClosedOK, ConnectionClosed):
                        # The socket was closed intentionally by on_message
                        break
            finally:
                stream.stop_stream()
                stream.close()
                audio.terminate()

        # Start mic stream on a daemon worker thread
        mic_thread = threading.Thread(target=record_microphone, daemon=True)
        mic_thread.start()

        try:
            connection.start_listening()
        except KeyboardInterrupt:
            print("\nStopping...")
            stop_event.set()

        return " ".join(full_message).strip()


# get_microphone_transcribed_chunk()
