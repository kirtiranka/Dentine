export class DeepgramLiveTranscriber {
  private socket: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  public async start(
    onTranscript: (text: string, isFinal: boolean) => void,
    onError: (err: any) => void
  ): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Deepgram WebSocket API accepts auth via the 'token' subprotocol in browsers
      const url = 'wss://api.deepgram.com/v1/listen?model=nova-3&endpointing=false&language=en&smart_format=true&interim_results=true';
      this.socket = new WebSocket(url, ['token', this.apiKey]);

      this.socket.onopen = () => {
        this.mediaRecorder = new MediaRecorder(this.stream!, {
          mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
        });

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(event.data);
          }
        };

        // Stream in 250ms chunks
        this.mediaRecorder.start(250);
      };

      this.socket.onmessage = (message) => {
        const data = JSON.parse(message.data);
        const transcript = data.channel?.alternatives?.[0]?.transcript;
        if (transcript) {
          onTranscript(transcript, !!data.is_final);
        }
      };

      this.socket.onerror = (err) => {
        onError(err);
      };
    } catch (err) {
      onError(err);
    }
  }

  public stop(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.close();
    }
  }
}