/**
 * High-Fidelity Audio Recording Engine for Live Radio Stream.
 * Captures live broadcast stream chunks and generates pristine, playable MP3/AAC audio files.
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
  private directChunks: Uint8Array[] = [];
  private startTime = 0;
  private timerInterval: number | null = null;
  private onTimeUpdateCallback?: (seconds: number) => void;
  private abortController: AbortController | null = null;
  private detectedMimeType = 'audio/mpeg';
  private detectedExt = 'mp3';

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
    this.detectedMimeType = 'audio/mpeg';
    this.detectedExt = 'mp3';

    // Start UI timer
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(elapsed);
      }
    }, 500);

    // Strategy 1: Direct Live Stream Bitstream Reader (Best quality, authentic MP3/AAC)
    try {
      this.abortController = new AbortController();

      fetch(streamUrl, {
        headers: { Accept: '*/*' },
        signal: this.abortController.signal,
      })
        .then((response) => {
          if (!response.ok || response.status >= 400) {
            return;
          }

          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('aac')) {
            this.detectedMimeType = 'audio/aac';
            this.detectedExt = 'aac';
          } else if (contentType.includes('mpeg') || contentType.includes('mp3')) {
            this.detectedMimeType = 'audio/mpeg';
            this.detectedExt = 'mp3';
          } else if (contentType.includes('ogg')) {
            this.detectedMimeType = 'audio/ogg';
            this.detectedExt = 'ogg';
          }

          if (!response.body) return;
          const reader = response.body.getReader();

          const pump = (): Promise<void> => {
            return reader.read().then(({ done, value }) => {
              if (done || !this.isRecording) return;
              if (value && value.length > 0) {
                this.directChunks.push(value);
              }
              return pump();
            });
          };

          return pump();
        })
        .catch(() => {
          // fetch aborted or error
        });
    } catch {
      // ignore
    }

    // Strategy 2: Parallel MediaRecorder on HTMLMediaElement as resilient backup
    try {
      if (audioElement) {
        const stream =
          (audioElement as any).captureStream?.() ||
          (audioElement as any).mozCaptureStream?.();

        if (stream && stream.getAudioTracks().length > 0) {
          const mimeTypes = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/mp4',
            'audio/ogg',
          ];
          const supported = mimeTypes.find((t) => MediaRecorder.isTypeSupported(t)) || '';

          const recorder = new MediaRecorder(
            stream,
            supported ? { mimeType: supported } : undefined
          );

          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              this.recordedChunks.push(e.data);
            }
          };

          recorder.start(1000);
          this.mediaRecorder = recorder;
        }
      }
    } catch {
      // captureStream can fail if CORS not present on some devices
    }

    return true;
  }

  /**
   * Stop recording, assemble genuine audio file and trigger instant download
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

    // Abort direct stream fetch
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    let audioBlob: Blob | null = null;
    let fileExtension = this.detectedExt;

    // Prefer bitstream direct chunks if available (> 5KB)
    const directTotalBytes = this.directChunks.reduce(
      (sum, chunk) => sum + chunk.length,
      0
    );

    if (directTotalBytes > 4000) {
      audioBlob = new Blob(this.directChunks as unknown as BlobPart[], {
        type: this.detectedMimeType,
      });
      fileExtension = this.detectedExt;
    } else if (this.recordedChunks.length > 0) {
      // Fallback to MediaRecorder chunks
      const mediaType = this.mediaRecorder?.mimeType || 'audio/webm';
      audioBlob = new Blob(this.recordedChunks, { type: mediaType });
      if (mediaType.includes('mp4')) fileExtension = 'm4a';
      else if (mediaType.includes('ogg')) fileExtension = 'ogg';
      else fileExtension = 'webm';
    }

    // Safety check: if audioBlob is null or too small (< 2KB), recording has no playable content
    if (!audioBlob || audioBlob.size < 2000) {
      return null;
    }

    // Format clean filename: ILGIN_Radyo_[Station]_[Date]_[Time].[ext]
    const safeStation = stationName
      .replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ_-]/g, '_')
      .slice(0, 20);

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    const fileName = `ILGIN_Radyo_${safeStation}_${dateStr}_${timeStr}.${fileExtension}`;

    // Trigger instant browser download to device
    if (typeof window !== 'undefined') {
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
