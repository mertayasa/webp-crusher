import type { CSSProperties } from 'react';
import { Construction } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import BackButton from '../components/BackButton';
import OtherTools from '../components/OtherTools';
import { TOOLS } from '../data/tools';

export default function ComingSoon() {
  const location = useLocation();
  const currentToolId = location.pathname.split('/')[1] || '';
  const currentTool = TOOLS.find(t => t.id === currentToolId);

  return (
    <main style={s.main}>
      <BackButton />
      
      {currentTool && (
        <div style={s.toolHero}>
          <h1 style={s.toolTitle}>{currentTool.name}</h1>
          <p style={s.toolDesc}>
            {currentTool.desc} <strong>100% private</strong> — all processing happens directly in your browser, and your files never leave your device.
          </p>
        </div>
      )}
      
      <div style={s.container}>
        <Construction size={48} color="var(--accent)" />
        <h1 style={s.title}>Coming Soon</h1>
        <p style={s.text}>This tool is currently under construction. Please check back later!</p>
      </div>

      <OtherTools currentToolId={currentToolId} />
    </main>
  );
}

const s: Record<string, CSSProperties> = {
  main: {
    flex: 1, 
    maxWidth: 860, 
    width: '100%', 
    margin: '0 auto',
    padding: '28px 24px', 
    display: 'flex', 
    flexDirection: 'column',
  },
  toolHero: {
    marginBottom: 8,
  },
  toolTitle: {
    fontSize: 28,
    fontWeight: 800,
    color: 'var(--text)',
    marginBottom: 8,
    letterSpacing: '-0.5px',
  },
  toolDesc: {
    fontSize: 15,
    color: 'var(--text-muted)',
    lineHeight: 1.5,
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 24px',
    textAlign: 'center',
    gap: '16px',
    animation: 'slide-in 300ms ease',
    flex: 1,
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--text)',
  },
  text: {
    fontSize: '16px',
    color: 'var(--text-muted)',
    maxWidth: '400px',
  },
};
