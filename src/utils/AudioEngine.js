class AudioEngine {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.sourceNode = null;
    this.audioBuffer = null;
    this.originalBuffer = null; // Store original for reverse/un-reverse
    
    // Core Nodes
    this.gainNode = this.audioContext.createGain();
    
    // Effects Nodes
    this.bassFilter = this.audioContext.createBiquadFilter();
    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.value = 200;

    this.eqLow = this.audioContext.createBiquadFilter();
    this.eqLow.type = 'lowshelf';
    this.eqLow.frequency.value = 320;
    
    this.eqMid = this.audioContext.createBiquadFilter();
    this.eqMid.type = 'peaking';
    this.eqMid.frequency.value = 1000;
    this.eqMid.Q.value = 0.5;
    
    this.eqHigh = this.audioContext.createBiquadFilter();
    this.eqHigh.type = 'highshelf';
    this.eqHigh.frequency.value = 3200;

    this.panner3d = this.audioContext.createPanner();
    this.panner3d.panningModel = 'HRTF';
    this.panner3d.distanceModel = 'inverse';

    this.stereoPanner = this.audioContext.createStereoPanner();

    // Reverb
    this.convolver = this.audioContext.createConvolver();
    this.dryGain = this.audioContext.createGain();
    this.wetGain = this.audioContext.createGain();
    this.wetGain.gain.value = 0; // Default off
    this.generateImpulseResponse(2.0, 2.0); // 2 sec duration, 2 sec decay

    // Auto Panner LFO
    this.lfo = this.audioContext.createOscillator();
    this.lfo.type = 'sine';
    this.lfoGain = this.audioContext.createGain();
    this.lfoGain.gain.value = 0; // Default off
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.stereoPanner.pan);
    this.lfo.start(); // Runs continuously
    
    // Setup routing chain
    // source -> bass -> eqLow -> eqMid -> eqHigh -> panner3d -> stereoPanner -> [dry/wet] -> gain -> destination
    this.bassFilter.connect(this.eqLow);
    this.eqLow.connect(this.eqMid);
    this.eqMid.connect(this.eqHigh);
    this.eqHigh.connect(this.panner3d);
    this.panner3d.connect(this.stereoPanner);
    
    // Parallel processing for reverb
    this.stereoPanner.connect(this.dryGain);
    this.stereoPanner.connect(this.convolver);
    this.convolver.connect(this.wetGain);
    
    this.dryGain.connect(this.gainNode);
    this.wetGain.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    this.isPlaying = false;
    this.playbackRate = 1.0;
    this.isReversed = false;
    this.isMono = false;
    this.trimStart = 0;
    this.trimEnd = 0; // 0 means full length
  }

  generateImpulseResponse(duration, decay) {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = (length - i) / length;
      left[i] = (Math.random() * 2 - 1) * Math.pow(n, decay);
      right[i] = (Math.random() * 2 - 1) * Math.pow(n, decay);
    }
    this.convolver.buffer = impulse;
  }

  async loadFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    this.originalBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    this.audioBuffer = this.originalBuffer;
    this.isReversed = false;
    this.isMono = false;
    this.trimStart = 0;
    this.trimEnd = this.audioBuffer.duration;
  }

  play() {
    if (!this.audioBuffer) return;
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.playbackRate.value = this.playbackRate;
    
    this.sourceNode.connect(this.bassFilter);
    
    const duration = this.trimEnd > this.trimStart ? this.trimEnd - this.trimStart : this.audioBuffer.duration;
    this.sourceNode.start(0, this.trimStart, duration);
    this.isPlaying = true;
    
    this.sourceNode.onended = () => {
      this.isPlaying = false;
    };
  }

  stop() {
    if (this.sourceNode && this.isPlaying) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.isPlaying = false;
    }
  }

  // --- Effects Configurations ---

  setVolume(value) {
    this.gainNode.gain.value = value;
  }

  setBass(value) {
    this.bassFilter.gain.value = value;
  }

  setEq(low, mid, high) {
    this.eqLow.gain.value = low;
    this.eqMid.gain.value = mid;
    this.eqHigh.gain.value = high;
  }

  set3DPosition(x, y, z) {
    this.panner3d.positionX.value = x;
    this.panner3d.positionY.value = y;
    this.panner3d.positionZ.value = z;
  }
  
  setPlaybackRate(value) {
    this.playbackRate = value;
    if (this.sourceNode) {
      this.sourceNode.playbackRate.value = value;
    }
  }

  setStereoPan(value) {
    this.stereoPanner.pan.value = value;
  }

  setAutoPan(rate, depth) {
    // rate is freq in Hz (0.1 to 10), depth is amount (0 to 1)
    this.lfo.frequency.value = rate;
    this.lfoGain.gain.value = depth;
  }

  setReverb(mix) {
    // mix from 0 to 1
    this.wetGain.gain.value = mix;
    this.dryGain.gain.value = 1 - mix;
  }

  toggleReverse(shouldReverse) {
    if (!this.originalBuffer) return;
    this.isReversed = shouldReverse;
    
    if (shouldReverse) {
      // Create reversed buffer
      const reversed = this.audioContext.createBuffer(
        this.originalBuffer.numberOfChannels,
        this.originalBuffer.length,
        this.originalBuffer.sampleRate
      );
      for (let i = 0; i < this.originalBuffer.numberOfChannels; i++) {
        const dest = reversed.getChannelData(i);
        const src = this.originalBuffer.getChannelData(i);
        for (let j = 0; j < src.length; j++) {
          dest[j] = src[src.length - 1 - j];
        }
      }
      this.audioBuffer = reversed;
    } else {
      this.audioBuffer = this.originalBuffer;
    }
    
    // Restart if currently playing
    if (this.isPlaying) {
      this.stop();
      this.play();
    }
  }

  setTrim(start, end) {
    this.trimStart = start;
    this.trimEnd = end;
  }

  toggleDownmix(shouldDownmix) {
    if (!this.originalBuffer) return;
    this.isMono = shouldDownmix;

    if (shouldDownmix && this.originalBuffer.numberOfChannels > 1) {
      // Create mono buffer
      const mono = this.audioContext.createBuffer(
        1,
        this.originalBuffer.length,
        this.originalBuffer.sampleRate
      );
      const monoData = mono.getChannelData(0);
      const left = this.originalBuffer.getChannelData(0);
      const right = this.originalBuffer.getChannelData(1);

      for (let i = 0; i < this.originalBuffer.length; i++) {
        monoData[i] = (left[i] + right[i]) / 2;
      }
      this.audioBuffer = mono;
    } else {
      this.audioBuffer = this.originalBuffer;
    }

    if (this.isPlaying) {
      this.stop();
      this.play();
    }
  }

  // Generate an offline rendering to download the modified file
  async export(fileName, format = 'wav') {
    if (!this.audioBuffer) return null;

    const exportDuration = this.trimEnd > this.trimStart ? this.trimEnd - this.trimStart : this.audioBuffer.duration;
    const length = Math.floor(exportDuration * this.audioBuffer.sampleRate);

    // Use current buffer (which might be reversed or mono)
    const offlineCtx = new OfflineAudioContext(
      this.audioBuffer.numberOfChannels,
      length,
      this.audioBuffer.sampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = this.audioBuffer;
    source.playbackRate.value = this.playbackRate;

    const bass = offlineCtx.createBiquadFilter();
    bass.type = 'lowshelf';
    bass.frequency.value = 200;
    bass.gain.value = this.bassFilter.gain.value;

    const eqLow = offlineCtx.createBiquadFilter();
    eqLow.type = 'lowshelf';
    eqLow.frequency.value = 320;
    eqLow.gain.value = this.eqLow.gain.value;

    const eqMid = offlineCtx.createBiquadFilter();
    eqMid.type = 'peaking';
    eqMid.frequency.value = 1000;
    eqMid.Q.value = 0.5;
    eqMid.gain.value = this.eqMid.gain.value;

    const eqHigh = offlineCtx.createBiquadFilter();
    eqHigh.type = 'highshelf';
    eqHigh.frequency.value = 3200;
    eqHigh.gain.value = this.eqHigh.gain.value;

    const panner3d = offlineCtx.createPanner();
    panner3d.panningModel = 'HRTF';
    panner3d.distanceModel = 'inverse';
    panner3d.positionX.value = this.panner3d.positionX.value;
    panner3d.positionY.value = this.panner3d.positionY.value;
    panner3d.positionZ.value = this.panner3d.positionZ.value;

    const stereoPanner = offlineCtx.createStereoPanner();
    stereoPanner.pan.value = this.stereoPanner.pan.value;
    
    // We can't perfectly replicate LFO auto-pan in offline export easily without connecting an oscillator in offline context
    // Let's add the LFO to the offline context
    const offlineLFO = offlineCtx.createOscillator();
    offlineLFO.type = 'sine';
    offlineLFO.frequency.value = this.lfo.frequency.value;
    const offlineLFOGain = offlineCtx.createGain();
    offlineLFOGain.gain.value = this.lfoGain.gain.value;
    offlineLFO.connect(offlineLFOGain);
    offlineLFOGain.connect(stereoPanner.pan);
    offlineLFO.start(0);

    const convolver = offlineCtx.createConvolver();
    convolver.buffer = this.convolver.buffer;
    const dryGain = offlineCtx.createGain();
    dryGain.gain.value = this.dryGain.gain.value;
    const wetGain = offlineCtx.createGain();
    wetGain.gain.value = this.wetGain.gain.value;

    const gain = offlineCtx.createGain();
    gain.gain.value = this.gainNode.gain.value;

    source.connect(bass);
    bass.connect(eqLow);
    eqLow.connect(eqMid);
    eqMid.connect(eqHigh);
    eqHigh.connect(panner3d);
    panner3d.connect(stereoPanner);
    
    stereoPanner.connect(dryGain);
    stereoPanner.connect(convolver);
    convolver.connect(wetGain);
    
    dryGain.connect(gain);
    wetGain.connect(gain);
    gain.connect(offlineCtx.destination);

    const duration = this.trimEnd > this.trimStart ? this.trimEnd - this.trimStart : this.audioBuffer.duration;
    source.start(0, this.trimStart, duration);
    
    const renderedBuffer = await offlineCtx.startRendering();
    
    return this.bufferToWave(renderedBuffer, renderedBuffer.length);
  }

  // Utility to convert AudioBuffer to WAV Blob (Upgraded to 32-bit Float)
  bufferToWave(abuffer, len) {
    let numOfChan = abuffer.numberOfChannels,
        length = len * numOfChan * 4 + 44, // 4 bytes per sample for 32-bit float
        buffer = new ArrayBuffer(length),
        view = new DataView(buffer),
        channels = [], i, sample,
        offset = 0,
        pos = 0;

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(3); // 3 = IEEE Float (was 1 for PCM)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 4 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 4); // block-align
    setUint16(32); // 32-bit float

    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    for (i = 0; i < abuffer.numberOfChannels; i++)
      channels.push(abuffer.getChannelData(i));

    while(pos < length) {
      for (i = 0; i < numOfChan; i++) {
        sample = channels[i][offset];
        // 32-bit float avoids clipping entirely
        view.setFloat32(pos, sample, true);
        pos += 4;
      }
      offset++;
    }

    return new Blob([buffer], {type: "audio/wav"});

    function setUint16(data) {
      view.setUint16(pos, data, true);
      pos += 2;
    }

    function setUint32(data) {
      view.setUint32(pos, data, true);
      pos += 4;
    }
  }
}

export const audioEngine = new AudioEngine();
