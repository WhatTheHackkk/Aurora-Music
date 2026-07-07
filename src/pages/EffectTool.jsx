import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Play, Square, Download, Settings, RefreshCw } from 'lucide-react';
import { audioEngine } from '../utils/AudioEngine';

export default function EffectTool({ type, title, description, color, icon }) {
  const [file, setFile] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  
  // Effect state
  const [bass, setBass] = useState(0);
  const [volume, setVolume] = useState(1);
  const [tempo, setTempo] = useState(1);
  const [eq, setEq] = useState({ low: 0, mid: 0, high: 0 });
  const [position3d, setPosition3d] = useState({ x: 0, y: 0, z: 0 });
  const [autoPan, setAutoPan] = useState({ rate: 2, depth: 0.5 });
  const [reverb, setReverb] = useState(0.5);
  const [stereoPan, setStereoPan] = useState(0);
  const [isReversed, setIsReversed] = useState(false);
  const [isMono, setIsMono] = useState(false);
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
        if (type === 'bass-booster') setBass(10);
        if (type === 'volume') setVolume(1.5);
        if (type === 'tempo') setTempo(1.5);
        if (type === 'equalizer') setEq({ low: 5, mid: 0, high: 5 });
        if (type === '3d-audio') setPosition3d({ x: 5, y: 0, z: -2 });
        if (type === 'autopanner') setAutoPan({ rate: 2, depth: 0.5 });
        if (type === 'reverb') setReverb(0.5);
        if (type === 'reverse') setIsReversed(true); 
        if (type === 'stereo-panner') setStereoPan(0);
        if (type === 'downmixer') setIsMono(true);
        
        applyEffects();
      } catch (err) {
        console.error("Error loading file:", err);
        alert("Could not load audio file.");
      } finally {
        if (type === 'trimmer') {
          const maxDur = audioEngine.audioBuffer ? audioEngine.audioBuffer.duration : 100;
          setTrim({ start: 0, end: maxDur, max: maxDur });
        }
        setIsLoading(false);
      }
    }
  };

  const applyEffects = () => {
    if (type === 'bass-booster') audioEngine.setBass(bass);
    if (type === 'volume') audioEngine.setVolume(volume);
    if (type === 'tempo') audioEngine.setPlaybackRate(tempo);
    if (type === 'equalizer') audioEngine.setEq(eq.low, eq.mid, eq.high);
    if (type === '3d-audio') audioEngine.set3DPosition(position3d.x, position3d.y, position3d.z);
    if (type === 'autopanner') audioEngine.setAutoPan(autoPan.rate, autoPan.depth);
    if (type === 'reverb') audioEngine.setReverb(reverb);
    if (type === 'stereo-panner') audioEngine.setStereoPan(stereoPan);
    if (type === 'reverse') audioEngine.toggleReverse(isReversed);
    if (type === 'downmixer') audioEngine.toggleDownmix(isMono);
    if (type === 'trimmer') audioEngine.setTrim(trim.start, trim.end);
  };

  // Sync state changes to engine
  useEffect(() => {
    applyEffects();
  }, [bass, volume, tempo, eq, position3d, autoPan, reverb, stereoPan, isReversed, isMono, trim]);

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
              <span style={{ color: color }}>{bass} dB</span>
            </label>
            <input 
              type="range" 
              min="0" max="30" step="1" 
              value={bass} 
              onChange={(e) => setBass(Number(e.target.value))} 
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
            <input 
              type="range" 
              min="0" max="3" step="0.1" 
              value={volume} 
              onChange={(e) => setVolume(Number(e.target.value))} 
            />
          </div>
        );
      case 'tempo':
        return (
          <div style={{ marginTop: '2rem' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 600 }}>
              <span>Playback Speed</span>
              <span style={{ color: color }}>{tempo}x</span>
            </label>
            <input 
              type="range" 
              min="0.5" max="2" step="0.1" 
              value={tempo} 
              onChange={(e) => setTempo(Number(e.target.value))} 
            />
          </div>
        );
      case 'equalizer':
        return (
          <div style={{ marginTop: '2rem', display: 'flex', gap: '2rem' }}>
            {['low', 'mid', 'high'].map(band => (
              <div key={band} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ marginBottom: '1rem', fontWeight: 600, textTransform: 'capitalize' }}>{band}</span>
                <input 
                  type="range" 
                  style={{ transform: 'rotate(270deg)', width: '150px', margin: '4rem 0' }}
                  min="-20" max="20" step="1" 
                  value={eq[band]} 
                  onChange={(e) => setEq({...eq, [band]: Number(e.target.value)})} 
                />
                <span style={{ color: color }}>{eq[band]} dB</span>
              </div>
            ))}
          </div>
        );
      case '3d-audio':
        return (
          <div style={{ marginTop: '2rem' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 600 }}>
              <span>3D Position (Left/Right)</span>
              <span style={{ color: color }}>{position3d.x}</span>
            </label>
            <input 
              type="range" 
              min="-10" max="10" step="1" 
              value={position3d.x} 
              onChange={(e) => setPosition3d({...position3d, x: Number(e.target.value)})} 
            />
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', marginTop: '2rem', fontWeight: 600 }}>
              <span>Distance (Forward/Back)</span>
              <span style={{ color: color }}>{position3d.z}</span>
            </label>
            <input 
              type="range" 
              min="-10" max="10" step="1" 
              value={position3d.z} 
              onChange={(e) => setPosition3d({...position3d, z: Number(e.target.value)})} 
            />
          </div>
        );
      case 'autopanner':
        return (
          <div style={{ marginTop: '2rem' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 600 }}>
              <span>Rate (Hz)</span>
              <span style={{ color: color }}>{autoPan.rate} Hz</span>
            </label>
            <input type="range" min="0.1" max="10" step="0.1" value={autoPan.rate} onChange={(e) => setAutoPan({...autoPan, rate: Number(e.target.value)})} />
            
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', marginTop: '2rem', fontWeight: 600 }}>
              <span>Depth</span>
              <span style={{ color: color }}>{(autoPan.depth * 100).toFixed(0)}%</span>
            </label>
            <input type="range" min="0" max="1" step="0.05" value={autoPan.depth} onChange={(e) => setAutoPan({...autoPan, depth: Number(e.target.value)})} />
          </div>
        );
      case 'reverb':
        return (
          <div style={{ marginTop: '2rem' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 600 }}>
              <span>Reverb Mix (Wet/Dry)</span>
              <span style={{ color: color }}>{(reverb * 100).toFixed(0)}%</span>
            </label>
            <input type="range" min="0" max="1" step="0.05" value={reverb} onChange={(e) => setReverb(Number(e.target.value))} />
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
