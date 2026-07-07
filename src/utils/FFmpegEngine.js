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

    // Run conversion command
    // e.g., ffmpeg -i input.mp3 output.wav
    await this.ffmpeg.exec(['-i', inputName, outputName]);

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
