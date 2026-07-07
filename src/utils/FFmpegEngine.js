import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

class FFmpegEngine {
  constructor() {
    this.ffmpeg = new FFmpeg();
    this.loaded = false;
    this.loadingPromise = null;
  }

  async load() {
    if (this.loaded) return;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = (async () => {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
      
      // Load ffmpeg.wasm
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      this.loaded = true;
    })();

    return this.loadingPromise;
  }

  onProgress(callback) {
    this.ffmpeg.on('progress', ({ progress, time }) => {
      callback(Math.round(progress * 100));
    });
  }

  async convertFile(file, outputFormat) {
    if (!this.loaded) await this.load();

    const inputName = `input_${Date.now()}.${file.name.split('.').pop()}`;
    const outputName = `output_${Date.now()}.${outputFormat}`;

    // Write file to FFmpeg FS
    await this.ffmpeg.writeFile(inputName, await fetchFile(file));

    // Run conversion command with MAX QUALITY parameters
    let ffmpegArgs = ['-i', inputName];
    
    if (outputFormat === 'mp3') {
      ffmpegArgs.push('-q:a', '0'); // Highest quality VBR for MP3
    } else if (outputFormat === 'ogg') {
      ffmpegArgs.push('-q:a', '10'); // Highest quality for OGG
    } else if (outputFormat === 'wav') {
      ffmpegArgs.push('-c:a', 'pcm_f32le'); // 32-bit float for WAV
    } else if (outputFormat === 'flac') {
      ffmpegArgs.push('-compression_level', '12'); // Max FLAC compression (still lossless, but best file size)
    }

    ffmpegArgs.push(outputName);
    
    await this.ffmpeg.exec(ffmpegArgs);

    // Read the result
    const data = await this.ffmpeg.readFile(outputName);

    // Clean up
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);

    // Create a Blob from the result data
    const blob = new Blob([data.buffer], { type: `audio/${outputFormat}` });
    return blob;
  }
}

// Export a singleton instance
export const ffmpegEngine = new FFmpegEngine();
