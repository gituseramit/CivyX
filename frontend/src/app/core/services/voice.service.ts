import { Injectable, signal } from '@angular/core';

export type RecordingState = 'idle' | 'recording' | 'stopped';

@Injectable({ providedIn: 'root' })
export class VoiceService {
  state = signal<RecordingState>('idle');
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;

  get isRecording(): boolean {
    return this.state() === 'recording';
  }

  async startRecording(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone not supported in this browser');
    }

    this.chunks = [];
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const mimeType = this.getSupportedMimeType();
    this.mediaRecorder = new MediaRecorder(this.stream, mimeType ? { mimeType } : undefined);

    this.mediaRecorder.ondataavailable = (e: BlobEvent) => {
      if (e.data && e.data.size > 0) this.chunks.push(e.data);
    };

    this.mediaRecorder.start(100); // collect in 100ms chunks
    this.state.set('recording');
  }

  stopRecording(): Promise<{ blob: Blob; base64: string; filename: string }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) { reject(new Error('No recording in progress')); return; }

      this.mediaRecorder.onstop = async () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.chunks, { type: mimeType });
        const ext  = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'webm';
        const base64 = await this.blobToBase64(blob);
        this.state.set('stopped');
        this.stopStream();
        resolve({ blob, base64, filename: `recording.${ext}` });
      };

      this.mediaRecorder.onerror = (e) => reject(e);
      this.mediaRecorder.stop();
    });
  }

  cancelRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.stopStream();
    this.chunks = [];
    this.state.set('idle');
  }

  private stopStream(): void {
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
  }

  private getSupportedMimeType(): string {
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
    return types.find(t => MediaRecorder.isTypeSupported(t)) || '';
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Strip the data URL prefix: "data:audio/webm;base64,"
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
