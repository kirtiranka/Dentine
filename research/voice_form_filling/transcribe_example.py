from pathlib import Path
from openai import OpenAI

client = OpenAI()

audio_file_path = Path("Recording.wav")

if not audio_file_path.exists():
    raise FileNotFoundError(f"File not found: {audio_file_path}")

with open(audio_file_path, "rb") as audio_file:
    # Use "whisper-1" or "gpt-4o-transcribe"
    transcription = client.audio.transcriptions.create(
        model="gpt-4o-transcribe",
        file=audio_file,
        # Optional: set response_format="verbose_json" or "srt" if you need timestamps
        response_format="text",
    )

print("Transcription:")
print(transcription)
