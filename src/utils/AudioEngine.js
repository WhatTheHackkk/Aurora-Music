class AudioEngine {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.sourceNode = null;
    this.audioBuffer = null;
    this.originalBuffer = null; // Store original for reverse/un-reverse
    
    // Core Nodes
    this.gainNode = this.audioContext.createGain();
    
    // 1. Bass Booster
    this.bassFilter = this.audioContext.createBiquadFilter();
    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.value = 150; // default crossover

    // 2. 5-Band Equalizer
    this.eq60 = this.audioContext.createBiquadFilter();
    this.eq60.type = 'lowshelf';
    this.eq60.frequency.value = 60;
    
    this.eq250 = this.audioContext.createBiquadFilter();
    this.eq250.type = 'peaking';
    this.eq250.frequency.value = 250;
    this.eq250.Q.value = 1.0;
    
    this.eq1000 = this.audioContext.createBiquadFilter();
    this.eq1000.type = 'peaking';
    this.eq1000.frequency.value = 1000;
    this.eq1000.Q.value = 1.0;
    
    this.eq4000 = this.audioContext.createBiquadFilter();
    this.eq4000.type = 'peaking';
    this.eq4000.frequency.value = 4000;
    this.eq4000.Q.value = 1.0;

    this.eq12000 = this.audioContext.createBiquadFilter();
    this.eq12000.type = 'highshelf';
    this.eq12000.frequency.value = 12000;

    // 3. 3D Audio Panner
    this.panner3d = this.audioContext.createPanner();
    this.panner3d.panningModel = 'HRTF';
    this.panner3d.distanceModel = 'inverse';

    // 4. Stereo Panner
    this.stereoPanner = this.audioContext.createStereoPanner();

    // 5. Echo / Delay (Parallel)
    this.delayNode = this.audioContext.createDelay(5.0); // max 5 seconds
    this.delayNode.delayTime.value = 0.5; // default 500ms
    this.feedbackGain = this.audioContext.createGain();
    this.feedbackGain.gain.value = 0.0; // default off
    this.echoFilter = this.audioContext.createBiquadFilter();
    this.echoFilter.type = 'lowpass';
    this.echoFilter.frequency.value = 2000; // darkens echo

    // 6. Reverb (Parallel)
    this.convolver = this.audioContext.createConvolver();
    this.dryGain = this.audioContext.createGain();
    this.wetGain = this.audioContext.createGain();
    this.wetGain.gain.value = 0; // Default off
    this.generateImpulseResponse(2.0, 2.0); // 2 sec duration, 2 sec decay default

    // 7. Auto Panner LFO
    this.lfo = this.audioContext.createOscillator();
    this.lfo.type = 'sine';
    this.lfoGain = this.audioContext.createGain();
    this.lfoGain.gain.value = 0; // Default off
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.stereoPanner.pan);
    this.lfo.start(); // Runs continuously
    
    // Setup routing chain
    // source -> bass -> EQ -> panner3d -> stereoPanner -> [Delay] + [Reverb] + [Dry] -> gain -> destination
    this.bassFilter.connect(this.eq60);
    this.eq60.connect(this.eq250);
    this.eq250.connect(this.eq1000);
    this.eq1000.connect(this.eq4000);
    this.eq4000.connect(this.eq12000);
    this.eq12000.connect(this.panner3d);
    this.panner3d.connect(this.stereoPanner);
    
    // Split parallel paths from stereoPanner
    this.stereoPanner.connect(this.dryGain);     // Dry signal path
    this.stereoPanner.connect(this.convolver);   // Reverb path
    this.stereoPanner.connect(this.delayNode);   // Echo path

    // Echo feedback loop
    this.delayNode.connect(this.echoFilter);
    this.echoFilter.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode);
    this.echoFilter.connect(this.gainNode); // Echo goes to master out

    // Reverb to master
    this.convolver.connect(this.wetGain);
    this.wetGain.connect(this.gainNode);
    
    // Dry to master
    this.dryGain.connect(this.gainNode);
    
    // Master out
    this.gainNode.connect(this.audioContext.destination);

    this.isPlaying = false;
    this.playbackRate = 1.0;
    this.isReversed = false;
    this.isMono = false;
    this.trimStart = 0;
    this.trimEnd = 0;
  }

  generateImpulseResponse(duration, decay) {
    if (!this.audioContext) return;
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

  setBass(gain, freq) {
    this.bassFilter.gain.value = gain;
    this.bassFilter.frequency.value = freq;
  }

  setEq(eq60, eq250, eq1000, eq4000, eq12000) {
    this.eq60.gain.value = eq60;
    this.eq250.gain.value = eq250;
    this.eq1000.gain.value = eq1000;
    this.eq4000.gain.value = eq4000;
    this.eq12000.gain.value = eq12000;
  }

  set3DPosition(x, y, z) {
    this.panner3d.positionX.value = x;
    this.panner3d.positionY.value = y;
    this.panner3d.positionZ.value = z;
  }

  setEcho(delayTime, feedback, filterFreq) {
    this.delayNode.delayTime.value = delayTime;
    this.feedbackGain.gain.value = feedback;
    this.echoFilter.frequency.value = filterFreq;
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

  setAutoPan(rate, depth, type = 'sine') {
    this.lfo.frequency.value = rate;
    this.lfoGain.gain.value = depth;
    this.lfo.type = type;
  }

  setReverb(mix, duration, decay) {
    this.wetGain.gain.value = mix;
    this.dryGain.gain.value = 1 - mix;
    if (duration !== undefined && decay !== undefined) {
      this.generateImpulseResponse(duration, decay);
    }
  }

  toggleReverse(shouldReverse) {
    if (!this.originalBuffer) return;
    this.isReversed = shouldReverse;
    
    if (shouldReverse) {
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

  async export(fileName, format = 'wav') {
    if (!this.audioBuffer) return null;

    const exportDuration = this.trimEnd > this.trimStart ? this.trimEnd - this.trimStart : this.audioBuffer.duration;
    // Add 2 seconds to export length to allow for reverb/echo trails
    const length = Math.floor((exportDuration + 2.0) * this.audioBuffer.sampleRate);

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
    bass.frequency.value = this.bassFilter.frequency.value;
    bass.gain.value = this.bassFilter.gain.value;

    const eq60 = offlineCtx.createBiquadFilter();
    eq60.type = 'lowshelf';
    eq60.frequency.value = 60;
    eq60.gain.value = this.eq60.gain.value;

    const eq250 = offlineCtx.createBiquadFilter();
    eq250.type = 'peaking';
    eq250.frequency.value = 250;
    eq250.Q.value = 1.0;
    eq250.gain.value = this.eq250.gain.value;

    const eq1000 = offlineCtx.createBiquadFilter();
    eq1000.type = 'peaking';
    eq1000.frequency.value = 1000;
    eq1000.Q.value = 1.0;
    eq1000.gain.value = this.eq1000.gain.value;

    const eq4000 = offlineCtx.createBiquadFilter();
    eq4000.type = 'peaking';
    eq4000.frequency.value = 4000;
    eq4000.Q.value = 1.0;
    eq4000.gain.value = this.eq4000.gain.value;

    const eq12000 = offlineCtx.createBiquadFilter();
    eq12000.type = 'highshelf';
    eq12000.frequency.value = 12000;
    eq12000.gain.value = this.eq12000.gain.value;

    const panner3d = offlineCtx.createPanner();
    panner3d.panningModel = 'HRTF';
    panner3d.distanceModel = 'inverse';
    panner3d.positionX.value = this.panner3d.positionX.value;
    panner3d.positionY.value = this.panner3d.positionY.value;
    panner3d.positionZ.value = this.panner3d.positionZ.value;

    const stereoPanner = offlineCtx.createStereoPanner();
    stereoPanner.pan.value = this.stereoPanner.pan.value;
    
    // Auto Panner
    const offlineLFO = offlineCtx.createOscillator();
    offlineLFO.type = this.lfo.type;
    offlineLFO.frequency.value = this.lfo.frequency.value;
    const offlineLFOGain = offlineCtx.createGain();
    offlineLFOGain.gain.value = this.lfoGain.gain.value;
    offlineLFO.connect(offlineLFOGain);
    offlineLFOGain.connect(stereoPanner.pan);
    offlineLFO.start(0);

    // Echo
    const delayNode = offlineCtx.createDelay(5.0);
    delayNode.delayTime.value = this.delayNode.delayTime.value;
    const feedbackGain = offlineCtx.createGain();
    feedbackGain.gain.value = this.feedbackGain.gain.value;
    const echoFilter = offlineCtx.createBiquadFilter();
    echoFilter.type = 'lowpass';
    echoFilter.frequency.value = this.echoFilter.frequency.value;

    // Reverb
    const convolver = offlineCtx.createConvolver();
    convolver.buffer = this.convolver.buffer;
    const dryGain = offlineCtx.createGain();
    dryGain.gain.value = this.dryGain.gain.value;
    const wetGain = offlineCtx.createGain();
    wetGain.gain.value = this.wetGain.gain.value;

    const gain = offlineCtx.createGain();
    gain.gain.value = this.gainNode.gain.value;

    // Graph Connection
    source.connect(bass);
    bass.connect(eq60);
    eq60.connect(eq250);
    eq250.connect(eq1000);
    eq1000.connect(eq4000);
    eq4000.connect(eq12000);
    eq12000.connect(panner3d);
    panner3d.connect(stereoPanner);
    
    // Split
    stereoPanner.connect(dryGain);
    stereoPanner.connect(convolver);
    stereoPanner.connect(delayNode);

    // Echo feedback loop
    delayNode.connect(echoFilter);
    echoFilter.connect(feedbackGain);
    feedbackGain.connect(delayNode);
    echoFilter.connect(gain);

    convolver.connect(wetGain);
    wetGain.connect(gain);
    dryGain.connect(gain);
    
    gain.connect(offlineCtx.destination);

    source.start(0, this.trimStart, exportDuration);
    
    const renderedBuffer = await offlineCtx.startRendering();
    return this.bufferToWave(renderedBuffer, renderedBuffer.length);
  }

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
    setUint16(3); // 3 = IEEE Float
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
