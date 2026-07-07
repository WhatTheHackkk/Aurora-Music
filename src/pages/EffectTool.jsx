import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Play, Square, Download, Settings, RefreshCw } from 'lucide-react';
import { audioEngine } from '../utils/AudioEngine';

const Visualizer = ({ isPlaying, color }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if (!isPlaying) return;
    
    let animationId;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const render = () => {
      animationId = requestAnimationFrame(render);
      const data = audioEngine.getVisualizerData();
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / data.length) * 2.5;
      let x = 0;
      
      for (let i = 0; i < data.length; i++) {
        const barHeight = (data[i] / 255) * canvas.height;
        
        // Add a nice glowing gradient effect
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, `${color}40`);
        gradient.addColorStop(1, color);
        
        ctx.fillStyle = gradient;
        // Rounded tops
        ctx.beginPath();
        ctx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, [4, 4, 0, 0]);
        ctx.fill();
        
        x += barWidth + 2;
      }
    };
    
    render();
    
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, color]);

  return (
    <canvas 
      ref={canvasRef} 
      width={800} 
      height={120} 
      style={{ 
        width: '100%', 
        height: '120px', 
        borderRadius: 'var(--radius-md)', 
        background: 'rgba(0,0,0,0.2)', 
        marginBottom: '2rem',
        boxShadow: `0 0 20px ${color}10`
      }} 
    />
  );
};

export default function EffectTool({ type, title, description, color, icon }) {
  const [file, setFile] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  
  // Effect state
  const [bass, setBass] = useState({ gain: 0, freq: 150 });
  const [volume, setVolume] = useState(1);
  const [tempo, setTempo] = useState(1);
  const [eq, setEq] = useState({ eq60: 0, eq250: 0, eq1000: 0, eq4000: 0, eq12000: 0 });
  const [position3d, setPosition3d] = useState({ x: 0, y: 0, z: 0, delayTime: 0.5, feedback: 0, filterFreq: 2000 });
  const [autoPan, setAutoPan] = useState({ rate: 2, depth: 0.5, type: 'sine' });
  const [reverb, setReverb] = useState({ mix: 0.5, roomSize: 2.0, decay: 2.0 });
  const [stereoPan, setStereoPan] = useState(0);
  const [isReversed, setIsReversed] = useState(false);
  const [isMono, setIsMono] = useState(false);
  const [isVocalRemover, setIsVocalRemover] = useState(false);
  const [trim, setTrim] = useState({ start: 0, end: 100, max: 100 });
  
  const fileInputRef = useRef(null);

  // Clean up on unmount or file change
  useEffect(() => {
    return () => {
      audioEngine.stop();
    };
  }, [file]);

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setIsPlaying(false);
      
      // Load file into audio engine
      try {
        await audioEngine.loadFile(selectedFile);
        
        // Reset effects based on type
        if (type === 'bass-booster') setBass({ gain: 10, freq: 150 });
        if (type === 'volume') setVolume(1.5);
        if (type === 'tempo') setTempo(1.5);
        if (type === 'equalizer') setEq({ eq60: 5, eq250: 3, eq1000: 0, eq4000: 2, eq12000: 5 });
        if (type === '3d-audio') setPosition3d({ x: 5, y: 0, z: -2, delayTime: 0.2, feedback: 0.4, filterFreq: 1500 });
        if (type === 'autopanner') setAutoPan({ rate: 2, depth: 0.5, type: 'sine' });
        if (type === 'reverb') setReverb({ mix: 0.5, roomSize: 2.0, decay: 2.0 });
        
        // New features
        if (type === 'slowed-reverb') {
          setTempo(0.85);
          setReverb({ mix: 0.4, roomSize: 4.0, decay: 3.5 });
        }
        if (type === 'nightcore') {
          setTempo(1.25);
        }
        if (type === '8d-audio') {
          setAutoPan({ rate: 0.1, depth: 1.0, type: 'sine' });
          setReverb({ mix: 0.6, roomSize: 3.5, decay: 3.0 });
        }
        
        if (type === 'reverse') setIsReversed(true); 
        if (type === 'stereo-panner') setStereoPan(0);
        if (type === 'downmixer') setIsMono(true);
        if (type === 'vocal-remover') setIsVocalRemover(true);
        
        applyEffects();
      } catch (err) {
        console.error("Error loading file:", err);
        alert("Could not load audio file.");
      } finally {
        if (type === 'trimmer') {
          const maxDur = audioEngine.audioBuffer ? audioEngine.audioBuffer.duration : 100;
          setTrim({ start: 0, end: maxDur, max: maxDur });
        }
      }
    }
  };

  const applyEffects = () => {
    if (type === 'bass-booster') audioEngine.setBass(bass.gain, bass.freq);
    if (type === 'volume') audioEngine.setVolume(volume);
    
    if (type === 'tempo' || type === 'slowed-reverb') audioEngine.setPlaybackRate(tempo, false);
    if (type === 'nightcore') audioEngine.setPlaybackRate(tempo, true); // true = pitch shift
    
    if (type === 'equalizer') audioEngine.setEq(eq.eq60, eq.eq250, eq.eq1000, eq.eq4000, eq.eq12000);
    if (type === '3d-audio') {
      audioEngine.set3DPosition(position3d.x, position3d.y, position3d.z);
      audioEngine.setEcho(position3d.delayTime, position3d.feedback, position3d.filterFreq);
    }
    if (type === 'autopanner' || type === '8d-audio') audioEngine.setAutoPan(autoPan.rate, autoPan.depth, autoPan.type);
    if (type === 'reverb' || type === 'slowed-reverb' || type === '8d-audio') audioEngine.setReverb(reverb.mix, reverb.roomSize, reverb.decay);
    if (type === 'stereo-panner') audioEngine.setStereoPan(stereoPan);
    if (type === 'reverse') audioEngine.toggleReverse(isReversed);
    if (type === 'downmixer') audioEngine.toggleDownmix(isMono);
    if (type === 'vocal-remover') audioEngine.toggleVocalRemover(isVocalRemover);
    if (type === 'trimmer') audioEngine.setTrim(trim.start, trim.end);
  };

  // Sync state changes to engine
  useEffect(() => {
    if (!file) return;
    applyEffects();
  }, [bass, volume, tempo, eq, position3d, autoPan, reverb, stereoPan, isReversed, isMono, isVocalRemover, trim]);

  const togglePlay = () => {
    if (isPlaying) {
      audioEngine.stop();
      setIsPlaying(false);
    } else {
      audioEngine.play();
      setIsPlaying(true);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await audioEngine.export();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${file.name.split('.')[0]}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export audio.");
    } finally {
      setIsExporting(false);
    }
  };

  const renderControls = () => {
    switch (type) {
      case 'bass-booster':
        return (
          <div style={{ marginTop: '2rem' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 600 }}>
              <span>Bass Boost Level</span>
              <span style={{ color: color }}>{bass.gain} dB</span>
            </label>
            <input 
              type="range" min="0" max="30" step="1" 
              value={bass.gain} onChange={(e) => setBass({...bass, gain: Number(e.target.value)})} 
            />
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', marginTop: '2rem', fontWeight: 600 }}>
              <span>Crossover Frequency</span>
              <span style={{ color: color }}>{bass.freq} Hz</span>
            </label>
            <input 
              type="range" min="40" max="300" step="5" 
              value={bass.freq} onChange={(e) => setBass({...bass, freq: Number(e.target.value)})} 
            />
          </div>
        );
      case 'volume':
        return (
          <div style={{ marginTop: '2rem' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 600 }}>
              <span>Volume Multiplier</span>
              <span style={{ color: color }}>{volume}x</span>
            </label>
            <input type="range" min="0" max="3" step="0.1" value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
          </div>
        );
      case 'tempo':
        return (
          <div style={{ marginTop: '2rem' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 600 }}>
              <span>Playback Speed (Preserves Pitch)</span>
              <span style={{ color: color }}>{tempo}x</span>
            </label>
            <input type="range" min="0.5" max="2" step="0.05" value={tempo} onChange={(e) => setTempo(Number(e.target.value))} />
          </div>
        );
      case 'nightcore':
        return (
          <div style={{ marginTop: '2rem' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 600 }}>
              <span>Nightcore Intensity (Speed + Pitch)</span>
              <span style={{ color: color }}>{tempo.toFixed(2)}x</span>
            </label>
            <input type="range" min="1.0" max="2.0" step="0.05" value={tempo} onChange={(e) => setTempo(Number(e.target.value))} />
          </div>
        );
      case 'equalizer':
        const eqBands = [
          { key: 'eq60', label: '60 Hz (Sub)' },
          { key: 'eq250', label: '250 Hz (Low)' },
          { key: 'eq1000', label: '1 kHz (Mid)' },
          { key: 'eq4000', label: '4 kHz (High-Mid)' },
          { key: 'eq12000', label: '12 kHz (Air)' }
        ];
        return (
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
            {eqBands.map(band => (
              <div key={band.key} style={{ flex: 1, minWidth: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ marginBottom: '1rem', fontWeight: 600, fontSize: '0.85rem', textAlign: 'center' }}>{band.label}</span>
                <input 
                  type="range" 
                  style={{ transform: 'rotate(270deg)', width: '150px', margin: '4rem 0' }}
                  min="-20" max="20" step="1" 
                  value={eq[band.key]} 
                  onChange={(e) => setEq({...eq, [band.key]: Number(e.target.value)})} 
                />
                <span style={{ color: color }}>{eq[band.key] > 0 ? '+' : ''}{eq[band.key]} dB</span>
              </div>
            ))}
          </div>
        );
      case '3d-audio':
        return (
          <div style={{ marginTop: '2rem' }}>
            <h4 style={{ marginBottom: '1.5rem', color: 'var(--muted)' }}>Spatial Positioning</h4>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 600 }}>
              <span>Left / Right (X-Axis)</span>
              <span style={{ color: color }}>{position3d.x}</span>
            </label>
            <input type="range" min="-10" max="10" step="1" value={position3d.x} onChange={(e) => setPosition3d({...position3d, x: Number(e.target.value)})} />
            
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', marginTop: '2rem', fontWeight: 600 }}>
              <span>Forward / Back (Z-Axis)</span>
              <span style={{ color: color }}>{position3d.z}</span>
            </label>
            <input type="range" min="-10" max="10" step="1" value={position3d.z} onChange={(e) => setPosition3d({...position3d, z: Number(e.target.value)})} />

            <h4 style={{ marginBottom: '1.5rem', marginTop: '3rem', color: 'var(--muted)' }}>3D Room Echo (Haas Effect)</h4>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 600 }}>
              <span>Echo Delay Time</span>
              <span style={{ color: color }}>{(position3d.delayTime * 1000).toFixed(0)} ms</span>
            </label>
            <input type="range" min="0" max="1" step="0.05" value={position3d.delayTime} onChange={(e) => setPosition3d({...position3d, delayTime: Number(e.target.value)})} />
            
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', marginTop: '2rem', fontWeight: 600 }}>
              <span>Echo Feedback (Amount)</span>
              <span style={{ color: color }}>{(position3d.feedback * 100).toFixed(0)}%</span>
            </label>
            <input type="range" min="0" max="0.9" step="0.05" value={position3d.feedback} onChange={(e) => setPosition3d({...position3d, feedback: Number(e.target.value)})} />
          </div>
        );
      case 'autopanner':
        return (
          <div style={{ marginTop: '2rem' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 600 }}>
              <span>LFO Shape</span>
              <span style={{ color: color }}>{autoPan.type.toUpperCase()}</span>
            </label>
            <select 
              value={autoPan.type} 
              onChange={(e) => setAutoPan({...autoPan, type: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}
            >
              <option value="sine">Sine (Smooth)</option>
              <option value="triangle">Triangle (Linear)</option>
              <option value="square">Square (Hard Jump)</option>
            </select>

            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 600 }}>
              <span>Rate (Speed)</span>
              <span style={{ color: color }}>{autoPan.rate} Hz</span>
            </label>
            <input type="range" min="0.1" max="10" step="0.1" value={autoPan.rate} onChange={(e) => setAutoPan({...autoPan, rate: Number(e.target.value)})} />
            
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', marginTop: '2rem', fontWeight: 600 }}>
              <span>Pan Depth</span>
              <span style={{ color: color }}>{(autoPan.depth * 100).toFixed(0)}%</span>
            </label>
            <input type="range" min="0" max="1" step="0.05" value={autoPan.depth} onChange={(e) => setAutoPan({...autoPan, depth: Number(e.target.value)})} />
          </div>
        );
      case 'reverb':
        return (
          <div style={{ marginTop: '2rem' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 600 }}>
              <span>Wet / Dry Mix</span>
              <span style={{ color: color }}>{(reverb.mix * 100).toFixed(0)}%</span>
            </label>
            <input type="range" min="0" max="1" step="0.05" value={reverb.mix} onChange={(e) => setReverb({...reverb, mix: Number(e.target.value)})} />
            
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', marginTop: '2rem', fontWeight: 600 }}>
              <span>Room Size (Duration)</span>
              <span style={{ color: color }}>{reverb.roomSize.toFixed(1)}s</span>
            </label>
            <input type="range" min="0.5" max="5.0" step="0.1" value={reverb.roomSize} onChange={(e) => setReverb({...reverb, roomSize: Number(e.target.value)})} />
            
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', marginTop: '2rem', fontWeight: 600 }}>
              <span>Decay Time</span>
              <span style={{ color: color }}>{reverb.decay.toFixed(1)}s</span>
            </label>
            <input type="range" min="0.5" max="5.0" step="0.1" value={reverb.decay} onChange={(e) => setReverb({...reverb, decay: Number(e.target.value)})} />
          </div>
        );
      case 'slowed-reverb':
        return (
          <div style={{ marginTop: '2rem' }}>
            <h4 style={{ marginBottom: '1.5rem', color: 'var(--muted)' }}>Ethereal Settings</h4>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 600 }}>
              <span>Playback Speed</span>
              <span style={{ color: color }}>{tempo.toFixed(2)}x</span>
            </label>
            <input type="range" min="0.5" max="1" step="0.01" value={tempo} onChange={(e) => setTempo(Number(e.target.value))} />

            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', marginTop: '2rem', fontWeight: 600 }}>
              <span>Reverb Room Size</span>
              <span style={{ color: color }}>{reverb.roomSize.toFixed(1)}s</span>
            </label>
            <input type="range" min="1.0" max="6.0" step="0.1" value={reverb.roomSize} onChange={(e) => setReverb({...reverb, roomSize: Number(e.target.value)})} />
            
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', marginTop: '2rem', fontWeight: 600 }}>
              <span>Reverb Mix</span>
              <span style={{ color: color }}>{(reverb.mix * 100).toFixed(0)}%</span>
            </label>
            <input type="range" min="0" max="1" step="0.05" value={reverb.mix} onChange={(e) => setReverb({...reverb, mix: Number(e.target.value)})} />
          </div>
        );
      case '8d-audio':
        return (
          <div style={{ marginTop: '2rem' }}>
            <h4 style={{ marginBottom: '1.5rem', color: 'var(--muted)' }}>8D Orbit Settings</h4>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 600 }}>
              <span>Orbit Speed (Hz)</span>
              <span style={{ color: color }}>{autoPan.rate.toFixed(2)} Hz</span>
            </label>
            <input type="range" min="0.05" max="0.5" step="0.01" value={autoPan.rate} onChange={(e) => setAutoPan({...autoPan, rate: Number(e.target.value)})} />

            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', marginTop: '2rem', fontWeight: 600 }}>
              <span>Room Size</span>
              <span style={{ color: color }}>{reverb.roomSize.toFixed(1)}s</span>
            </label>
            <input type="range" min="1.0" max="6.0" step="0.1" value={reverb.roomSize} onChange={(e) => setReverb({...reverb, roomSize: Number(e.target.value)})} />
          </div>
        );
      case 'vocal-remover':
        return (
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button 
              className="btn" 
              style={{ background: isVocalRemover ? color : 'transparent', color: isVocalRemover ? 'white' : 'var(--foreground)', border: `1px solid ${color}` }}
              onClick={() => setIsVocalRemover(!isVocalRemover)}
            >
              {isVocalRemover ? 'Vocals Removed (Karaoke Mode)' : 'Normal Audio (Click to Remove Vocals)'}
            </button>
            <p style={{ marginTop: '1.5rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
              Note: This uses phase cancellation. It removes audio panned to the exact center (typically lead vocals), but may also reduce center-panned instruments like bass or kick drums.
            </p>
          </div>
        );
      case 'reverse':
        return (
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button 
              className="btn" 
              style={{ background: isReversed ? color : 'transparent', color: isReversed ? 'white' : 'var(--foreground)', border: `1px solid ${color}` }}
              onClick={() => setIsReversed(!isReversed)}
            >
              {isReversed ? 'Reversed Audio (Active)' : 'Normal Audio (Click to Reverse)'}
            </button>
          </div>
        );
      case 'downmixer':
        return (
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button 
              className="btn" 
              style={{ background: isMono ? color : 'transparent', color: isMono ? 'white' : 'var(--foreground)', border: `1px solid ${color}` }}
              onClick={() => setIsMono(!isMono)}
            >
              {isMono ? 'Mono Audio (Downmixed)' : 'Stereo Audio (Original)'}
            </button>
          </div>
        );
      case 'stereo-panner':
        return (
          <div style={{ marginTop: '2rem' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 600 }}>
              <span>Pan (Left / Right)</span>
              <span style={{ color: color }}>{stereoPan < 0 ? 'L ' + Math.abs(stereoPan) : stereoPan > 0 ? 'R ' + stereoPan : 'Center'}</span>
            </label>
            <input type="range" min="-1" max="1" step="0.1" value={stereoPan} onChange={(e) => setStereoPan(Number(e.target.value))} />
          </div>
        );
      case 'trimmer':
        return (
          <div style={{ marginTop: '2rem' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 600 }}>
              <span>Start Time (s)</span>
              <span style={{ color: color }}>{trim.start.toFixed(1)}s</span>
            </label>
            <input type="range" min="0" max={trim.max} step="0.1" value={trim.start} onChange={(e) => setTrim({...trim, start: Math.min(Number(e.target.value), trim.end - 0.1)})} />
            
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', marginTop: '2rem', fontWeight: 600 }}>
              <span>End Time (s)</span>
              <span style={{ color: color }}>{trim.end.toFixed(1)}s</span>
            </label>
            <input type="range" min="0" max={trim.max} step="0.1" value={trim.end} onChange={(e) => setTrim({...trim, end: Math.max(Number(e.target.value), trim.start + 0.1)})} />
          </div>
        );
      default:
        return (
          <div style={{ marginTop: '2rem', padding: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <Settings style={{ color: 'var(--muted)', marginBottom: '1rem' }} size={32} />
            <p>Advanced controls for this tool are currently under development.</p>
          </div>
        );
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropEvent = { target: { files: e.dataTransfer.files } };
      handleFileChange(dropEvent);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: '800px' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          {title}
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1.1rem', marginTop: '1rem' }}>
          {description}
        </p>
      </div>

      <motion.div 
        className="glass" 
        style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {!file ? (
          <div 
            className={`file-upload-wrapper ${isDragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="upload-icon" />
            <h3 style={{ marginBottom: '0.5rem' }}>Drag & drop your audio file</h3>
            <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>or click to browse</p>
            <input 
              type="file" 
              accept="audio/*" 
              onChange={handleFileChange} 
              ref={fileInputRef}
            />
            <button className="btn btn-secondary">Browse Files</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: `${color}20`, padding: '0.75rem', borderRadius: '0.5rem', color: color }}>
                   <Settings size={24} />
                </div>
                <div>
                  <h4 style={{ margin: 0 }}>{file.name}</h4>
                  <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>
              <button onClick={() => { setFile(null); audioEngine.stop(); }} className="btn" style={{ background: 'transparent', color: 'var(--muted)' }}>Remove</button>
            </div>

            <Visualizer isPlaying={isPlaying} color={color} />

            {renderControls()}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button 
                onClick={togglePlay} 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '1rem', fontSize: '1.1rem' }}
              >
                {isPlaying ? (
                  <><Square size={20} /> Stop Preview</>
                ) : (
                  <><Play size={20} /> Play Preview</>
                )}
              </button>

              <button 
                onClick={handleExport} 
                disabled={isExporting}
                className="btn btn-primary" 
                style={{ flex: 1, padding: '1rem', fontSize: '1.1rem', background: isExporting ? 'var(--muted)' : color }}
              >
                {isExporting ? (
                  <><RefreshCw className="loader" size={20} /> Processing...</>
                ) : (
                  <><Download size={20} /> Download</>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
