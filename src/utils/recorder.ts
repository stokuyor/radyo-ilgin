/**
 * Audio Recording Engine for Live Radio Stream.
 * Captures live broadcast chunks and automatically triggers device file download.
 */

export interface RecordingResult {
  blob: Blob;
  durationSeconds: number;
  fileName: string;
  sizeBytes: number;
}

export class StreamRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private startTime = 0;
  private timerInterval: number | null = null;
  private onTimeUpdateCallback?: (seconds: number) => void;
  private directAbortController: AbortController | null = null;
  private directChunks: Uint8Array[] = [];
  private mimeType = 'audio/webm';

  public isRecording = false;

  /**
   * Start recording the current live stream
   */
  public async startRecording(
    audioElement: HTMLAudioElement | null,
    streamUrl: string,
    onTimeUpdate?: (seconds: number) => void
  ): Promise<boolean> {
    if (this.isRecording) return false;
    this.isRecording = true;
    this.recordedChunks = [];
    this.directChunks = [];
    this.startTime = Date.now();
    this.onTimeUpdateCallback = onTimeUpdate;

    // Start UI timer
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(elapsed);
      }
    }, 500);

    // Strategy 1: Attempt HTMLMediaElement captureStream if available
    let streamCaptured = false;
    try {
      if (audioElement) {
        const stream =
          (audioElement as any).captureStream?.() ||
          (audioElement as any).mozCaptureStream?.();

        if (stream && stream.getAudioTracks().length > 0) {
          const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/mp4',
          ];
          const supportedType = types.find((t) => MediaRecorder.isTypeSupported(t)) || '';
          this.mimeType = supportedType || 'audio/webm';

          const recorder = new MediaRecorder(
            stream,
            supportedType ? { mimeType: supportedType } : undefined
          );

          recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              this.recordedChunks.push(event.data);
            }
          };

          recorder.start(1000); // 1-second chunks
          this.mediaRecorder = recorder;
          streamCaptured = true;
        }
      }
    } catch {
      // captureStream can fail on some mobile browsers if CORS isn't direct
      streamCaptured = false;
    }

    // Strategy 2: If captureStream not available or for direct audio stream fetch
    // Fetch directly via the CORS proxy endpoint /api/stream-proxy
    if (!streamCaptured) {
      try {
        const proxyUrl = `/api/stream-proxy?url=${encodeURIComponent(streamUrl)}`;
        this.directAbortController = new AbortController();

        fetch(proxyUrl, { signal: this.directAbortController.signal })
          .then((response) => {
            if (!response.body) return;
            const reader = response.body.getReader();
            const pump = (): Promise<void> => {
              return reader.read().then(({ done, value }) => {
                if (done || !this.isRecording) return;
                if (value) {
                  this.directChunks.push(value);
                }
                return pump();
              });
            };
            return pump();
          })
          .catch(() => {
            // aborted or ended
          });
      } catch {
        // fallback
      }
    }

    return true;
  }

  /**
   * Stop recording, assemble audio file and automatically trigger download on device
   */
  public async stopAndDownload(stationName: string): Promise<RecordingResult | null> {
    if (!this.isRecording) return null;
    this.isRecording = false;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    const elapsedSeconds = Math.max(
      1,
      Math.floor((Date.now() - this.startTime) / 1000)
    );

    // Stop MediaRecorder if running
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        if (!this.mediaRecorder) return resolve();
        this.mediaRecorder.onstop = () => resolve();
        try {
          this.mediaRecorder.stop();
        } catch {
          resolve();
        }
      });
    }

    // Abort direct fetch if active
    if (this.directAbortController) {
      this.directAbortController.abort();
      this.directAbortController = null;
    }

    let audioBlob: Blob;
    let fileExtension = 'webm';

    if (this.recordedChunks.length > 0) {
      audioBlob = new Blob(this.recordedChunks, { type: this.mimeType });
      if (this.mimeType.includes('mp4')) fileExtension = 'm4a';
      else if (this.mimeType.includes('ogg')) fileExtension = 'ogg';
      else fileExtension = 'webm';
    } else if (this.directChunks.length > 0) {
      audioBlob = new Blob(this.directChunks as unknown as BlobPart[], {
        type: 'audio/mpeg',
      });
      fileExtension = 'mp3';
    } else {
      // Fallback empty audio clip if aborted immediately
      audioBlob = new Blob([], { type: 'audio/webm' });
    }

    // Sanitize station name for file
    const safeStation = stationName
      .replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ_-]/g, '_')
      .slice(0, 24);

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    const fileName = `ILGIN_Radyo_${safeStation}_${dateStr}_${timeStr}.${fileExtension}`;

    // Automatic download to phone / computer
    if (typeof window !== 'undefined' && audioBlob.size > 0) {
      const downloadUrl = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
      }, 60000);
    }

    return {
      blob: audioBlob,
      durationSeconds: elapsedSeconds,
      fileName,
      sizeBytes: audioBlob.size,
    };
  }
}

export const streamRecorder = new StreamRecorder();
