import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Headphones, 
  ArrowLeftRight, 
  Speaker, 
  Sliders, 
  EarOff, 
  Music, 
  Radio, 
  History, 
  Split, 
  FastForward, 
  Scissors, 
  MicOff, 
  Volume2, 
  Activity, 
  FileAudio,
  Merge,
  Image,
  ActivitySquare
} from 'lucide-react';

const tools = [
  { id: '3d-audio', title: '3D Audio', description: 'Enhance the stereo sound by adding a 3D effect to it', icon: Headphones, color: '#E53E3E', category: 'effects' },
  { id: 'bass-booster', title: 'Bass Booster', description: 'Boost the bass of a song making it more bass heavy', icon: Speaker, color: '#D69E2E', category: 'effects' },
  { id: 'equalizer', title: 'Equalizer', description: 'Adjust the frequencies of your audio', icon: Sliders, color: '#38A169', category: 'effects' },
  { id: 'pitch-shifter', title: 'Pitch Shifter', description: 'Change the pitch of your audio', icon: Music, color: '#3182CE', category: 'effects' },
  { id: 'volume', title: 'Volume Changer', description: 'Make your audio louder or quieter', icon: Volume2, color: '#38A169', category: 'effects' },
  { id: 'tempo', title: 'Tempo Changer', description: 'Make an audio file play faster or slower', icon: FastForward, color: '#E53E3E', category: 'effects' },
  { id: 'converter', title: 'Converter', description: 'Convert any audio file to another file format', icon: FileAudio, color: '#3182CE', category: 'other' },
  
  // Placeholders for tools we haven't built yet, routing to 404 or a generic "coming soon"
  { id: 'autopanner', title: 'Auto Panner', description: 'Make the audio alternate from left to right', icon: ArrowLeftRight, color: '#DD6B20', category: 'effects' },
  { id: 'reverb', title: 'Reverb', description: 'Increase the room size of your audio', icon: Radio, color: '#00B5D8', category: 'effects' },
  { id: 'noise-reducer', title: 'Noise Reducer', description: 'Reduce background noise from recordings', icon: EarOff, color: '#319795', category: 'effects', comingSoon: true },
  { id: 'reverse', title: 'Reverse Audio', description: 'Reverse an audio file and make it play backwards', icon: History, color: '#805AD5', category: 'effects' },
  { id: 'stereo-panner', title: 'Stereo Panner', description: 'Pan the audio to left or right', icon: ArrowLeftRight, color: '#D53F8C', category: 'effects' },
  { id: 'trimmer', title: 'Trimmer / Cutter', description: 'Cut out a part of your audio file', icon: Scissors, color: '#DD6B20', category: 'effects' },
  { id: 'vocal-remover', title: 'Vocal Remover', description: 'Remove the vocals from a song leaving only the instrumental', icon: MicOff, color: '#D69E2E', category: 'effects', comingSoon: true },
  { id: 'downmixer', title: 'Downmixer', description: 'Reduce the amount of audio channels', icon: Merge, color: '#00B5D8', category: 'other' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const ToolCard = ({ tool }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const content = (
    <motion.div 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="glass" 
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        padding: '2rem',
        borderRadius: 'var(--radius-lg)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
      {/* Background glowing orb for hover effect */}
      <motion.div 
        className="glow-orb"
        style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: `radial-gradient(circle at 50% 50%, ${tool.color}15 0%, transparent 50%)`,
          opacity: 0,
          zIndex: 0,
          pointerEvents: 'none'
        }}
        whileHover={{ opacity: 1, scale: 1.1 }}
        transition={{ duration: 0.4 }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 1 }}>
        <div style={{
          background: `${tool.color}20`, // 20 hex is 12% opacity
          padding: '0.75rem',
          borderRadius: '0.75rem',
          color: tool.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <tool.icon size={32} />
        </div>
        <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{tool.title}</h3>
      </div>
      <p style={{ margin: 0, color: 'var(--muted)', zIndex: 1, lineHeight: 1.5 }}>
        {tool.description}
      </p>
      
      {tool.comingSoon && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: 'rgba(255,255,255,0.1)',
          padding: '0.25rem 0.5rem',
          borderRadius: '1rem',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          color: 'var(--muted)'
        }}>
          Soon
        </div>
      )}
    </motion.div>
  );

  return (
    <motion.div variants={itemVariants} whileHover={{ y: -8, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      {tool.comingSoon ? (
        <div style={{ height: '100%', opacity: 0.7, cursor: 'not-allowed' }}>
          {content}
        </div>
      ) : (
        <Link to={`/${tool.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
          {content}
        </Link>
      )}
    </motion.div>
  );
};

export default function Home() {
  const effects = tools.filter(t => t.category === 'effects');
  const other = tools.filter(t => t.category === 'other');

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '6rem' }}>
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ textAlign: 'center', marginBottom: '4rem' }}
      >
        <h1 style={{ marginBottom: '1rem' }}>
          Your <span className="gradient-text">online</span> audio toolkit
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
          A collection of easy-to-use, lightning-fast web tools for all your audio files. 
          Processed entirely securely in your browser.
        </p>
      </motion.div>

      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', textTransform: 'uppercase', fontSize: '1rem', letterSpacing: '0.1em', color: 'var(--muted)' }}>Effects</h2>
        <motion.div 
          className="tools-grid"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {effects.map(tool => <ToolCard key={tool.id} tool={tool} />)}
        </motion.div>
      </section>

      <section>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', textTransform: 'uppercase', fontSize: '1rem', letterSpacing: '0.1em', color: 'var(--muted)' }}>Other tools</h2>
        <motion.div 
          className="tools-grid"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {other.map(tool => <ToolCard key={tool.id} tool={tool} />)}
        </motion.div>
      </section>
    </div>
  );
}
