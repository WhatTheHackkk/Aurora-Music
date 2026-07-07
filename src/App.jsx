import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Waves, Menu, X } from 'lucide-react';
import Home from './pages/Home';
import Converter from './pages/Converter';
import EffectTool from './pages/EffectTool';
import './index.css';

// Layout component to wrap our pages
const Layout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <div className="aurora-bg">
        <div className="aurora-orb-1"></div>
        <div className="aurora-orb-2"></div>
        <div className="aurora-orb-3"></div>
      </div>
      <header style={{ borderBottom: '1px solid var(--card-border)', background: 'var(--card)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem' }}>
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'white' }}>
            <img src="/logo.png" alt="Aurora" style={{ width: '40px', height: '40px', borderRadius: '8px', boxShadow: '0 0 15px rgba(167, 139, 250, 0.3)' }} />
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Aurora</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="desktop-nav">
            <Link to="/" style={{ color: 'var(--muted)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'white'} onMouseLeave={e => e.target.style.color = 'var(--muted)'}>Tools</Link>
            <a href="#" style={{ color: 'var(--muted)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'white'} onMouseLeave={e => e.target.style.color = 'var(--muted)'}>About</a>
          </nav>

          {/* Mobile Menu Button */}
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{
                overflow: 'hidden',
                background: 'rgba(24, 24, 27, 0.95)',
                borderBottom: '1px solid var(--card-border)',
                display: 'flex',
                flexDirection: 'column',
                padding: '0 1.5rem',
              }}
            >
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} style={{ padding: '1rem 0', color: 'white', textDecoration: 'none', fontWeight: 500, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Tools</Link>
              <a href="#" onClick={() => setIsMobileMenuOpen(false)} style={{ padding: '1rem 0', color: 'white', textDecoration: 'none', fontWeight: 500 }}>About</a>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
      
      <main style={{ minHeight: 'calc(100vh - 73px)', display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>

      <footer style={{ borderTop: '1px solid var(--card-border)', padding: '2rem 0', textAlign: 'center', color: 'var(--muted)', fontSize: '0.875rem' }}>
        <div className="container">
          <p>© {new Date().getFullYear()} Aurora. An Audioalter Clone built with Web Audio API & FFmpeg.wasm.</p>
        </div>
      </footer>
    </>
  );
};

// Animated Route Wrapper
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/converter" element={<PageTransition><Converter /></PageTransition>} />
        
        {/* We use a generic EffectTool component for various effects, passing props to configure it */}
        <Route path="/bass-booster" element={<PageTransition><EffectTool type="bass-booster" title="Bass Booster" description="Boost the bass of a song making it more bass heavy" icon="Speaker" color="#D69E2E" /></PageTransition>} />
        <Route path="/equalizer" element={<PageTransition><EffectTool type="equalizer" title="Equalizer" description="Adjust the frequencies of your audio" icon="Sliders" color="#38A169" /></PageTransition>} />
        <Route path="/pitch-shifter" element={<PageTransition><EffectTool type="pitch-shifter" title="Pitch Shifter" description="Change the pitch of your audio" icon="Music" color="#3182CE" /></PageTransition>} />
        <Route path="/volume" element={<PageTransition><EffectTool type="volume" title="Volume Changer" description="Make your audio louder or quieter" icon="Volume2" color="#38A169" /></PageTransition>} />
        <Route path="/tempo" element={<PageTransition><EffectTool type="tempo" title="Tempo Changer" description="Make an audio file play faster or slower" icon="FastForward" color="#E53E3E" /></PageTransition>} />
        <Route path="/3d-audio" element={<PageTransition><EffectTool type="3d-audio" title="3D Audio" description="Enhance the stereo sound by adding a 3D effect to it" icon="Headphones" color="#E53E3E" /></PageTransition>} />
        <Route path="/autopanner" element={<PageTransition><EffectTool type="autopanner" title="Auto Panner" description="Make the audio alternate from left to right" icon="ArrowLeftRight" color="#DD6B20" /></PageTransition>} />
        <Route path="/reverb" element={<PageTransition><EffectTool type="reverb" title="Reverb" description="Increase the room size of your audio" icon="Radio" color="#00B5D8" /></PageTransition>} />
        <Route path="/reverse" element={<PageTransition><EffectTool type="reverse" title="Reverse Audio" description="Reverse an audio file and make it play backwards" icon="History" color="#805AD5" /></PageTransition>} />
        <Route path="/stereo-panner" element={<PageTransition><EffectTool type="stereo-panner" title="Stereo Panner" description="Pan the audio to left or right" icon="ArrowLeftRight" color="#D53F8C" /></PageTransition>} />
        <Route path="/trimmer" element={<PageTransition><EffectTool type="trimmer" title="Trimmer / Cutter" description="Cut out a part of your audio file" icon="Scissors" color="#DD6B20" /></PageTransition>} />
        <Route path="/downmixer" element={<PageTransition><EffectTool type="downmixer" title="Downmixer" description="Reduce the amount of audio channels" icon="Merge" color="#00B5D8" /></PageTransition>} />
        <Route path="/slowed-reverb" element={<PageTransition><EffectTool type="slowed-reverb" title="Slowed + Reverb" description="Give your audio an ethereal, dreamy vibe" icon="Radio" color="#805AD5" /></PageTransition>} />
        <Route path="/nightcore" element={<PageTransition><EffectTool type="nightcore" title="Nightcore Preset" description="Speed up your audio and shift the pitch up for high energy" icon="FastForward" color="#E53E3E" /></PageTransition>} />
        <Route path="/8d-audio" element={<PageTransition><EffectTool type="8d-audio" title="8D Audio Generator" description="Create an immersive 360-degree rotating audio experience" icon="Headphones" color="#D53F8C" /></PageTransition>} />
        <Route path="/vocal-remover" element={<PageTransition><EffectTool type="vocal-remover" title="Vocal Remover" description="Isolate the instrumental by canceling out center-panned vocals" icon="MicOff" color="#D69E2E" /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 0.98 }}
    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
  >
    {children}
  </motion.div>
);

function App() {
  return (
    <Router>
      <Layout>
        <AnimatedRoutes />
      </Layout>
    </Router>
  );
}

export default App;
