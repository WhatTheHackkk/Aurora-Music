import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileAudio, RefreshCw, Download, Settings } from 'lucide-react';
import { ffmpegEngine } from '../utils/FFmpegEngine';

const SUPPORTED_FORMATS = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'];

export default function Converter() {
  const [file, setFile] = useState(null);
  const [outputFormat, setOutputFormat] = useState('wav');
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Initialize FFmpeg in background
    ffmpegEngine.load().catch(console.error);
    
    // Setup progress listener
    ffmpegEngine.onProgress((p) => {
      setProgress(p);
    });
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResultUrl(null);
      setProgress(0);
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
      setFile(e.dataTransfer.files[0]);
      setResultUrl(null);
      setProgress(0);
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsConverting(true);
    setProgress(0);
    setResultUrl(null);

    try {
      const blob = await ffmpegEngine.convertFile(file, outputFormat);
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
    } catch (err) {
      console.error("Conversion failed:", err);
      alert("Conversion failed. Please try a different file or format.");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: '800px' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <FileAudio color="var(--primary)" size={40} />
          Audio Converter
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1.1rem', marginTop: '1rem' }}>
          Convert your audio files instantly, right in your browser. No data leaves your device.
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
                <FileAudio size={32} color="var(--primary)" />
                <div>
                  <h4 style={{ margin: 0 }}>{file.name}</h4>
                  <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>
              {!isConverting && !resultUrl && (
                <button onClick={() => setFile(null)} className="btn" style={{ background: 'transparent', color: 'var(--muted)' }}>Change File</button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Settings size={18} /> Convert to format:
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {SUPPORTED_FORMATS.map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setOutputFormat(fmt)}
                    className="btn"
                    style={{
                      background: outputFormat === fmt ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                      color: outputFormat === fmt ? 'white' : 'var(--foreground)',
                      border: `1px solid ${outputFormat === fmt ? 'var(--primary)' : 'var(--card-border)'}`
                    }}
                    disabled={isConverting}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {isConverting && (
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <RefreshCw className="loader" size={24} />
                  <span style={{ fontWeight: 600 }}>Converting... {progress}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <motion.div 
                    style={{ height: '100%', background: 'var(--primary)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {!isConverting && !resultUrl && (
              <button onClick={handleConvert} className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
                <RefreshCw size={20} /> Convert to {outputFormat.toUpperCase()}
              </button>
            )}

            {resultUrl && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '2rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}
              >
                <h3 style={{ color: '#34d399', marginBottom: '1rem' }}>Conversion Complete!</h3>
                <a href={resultUrl} download={`converted_${file.name.split('.')[0]}.${outputFormat}`} style={{ textDecoration: 'none' }}>
                  <button className="btn btn-primary" style={{ background: '#10b981', padding: '1rem 2rem' }}>
                    <Download size={20} /> Download File
                  </button>
                </a>
                <button onClick={() => { setFile(null); setResultUrl(null); }} className="btn" style={{ marginLeft: '1rem', background: 'transparent', color: 'var(--foreground)' }}>
                  Convert Another
                </button>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
