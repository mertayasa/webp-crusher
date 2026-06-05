import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { TOOLS } from '../data/tools';

export default function Home() {
  return (
    <div style={s.container}>
      <div style={s.hero}>
        <h1 style={s.title}>Free & Private Client-Side Image Tools</h1>
        <p style={s.subtitle}>
          All processing happens right in your browser. Your files never leave your device.
        </p>
      </div>

      <div className="home-grid">
        {TOOLS.map((tool) => (
          <Link to={tool.path} key={tool.id} style={s.card}>
            <div style={{ ...s.iconWrapper, color: tool.color, background: `${tool.color}15` }}>
              <tool.icon size={28} />
            </div>
            <div style={s.cardContent}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <h2 style={s.cardTitle}>{tool.name}</h2>
                {tool.comingSoon && <span style={s.comingSoonBadge}>Coming Soon</span>}
              </div>
              <p style={s.cardDesc}>{tool.desc}</p>
            </div>
            <div style={s.arrow}>
              <ArrowRight size={18} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  container: {
    maxWidth: 1000,
    margin: '0 auto',
    padding: '40px 24px',
    animation: 'slide-in 300ms ease',
  },
  hero: {
    textAlign: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 800,
    color: 'var(--text)',
    marginBottom: 12,
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: 16,
    color: 'var(--text-muted)',
    maxWidth: 600,
    margin: '0 auto',
    lineHeight: 1.5,
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    textDecoration: 'none',
    transition: 'all 200ms ease',
    boxShadow: 'var(--shadow-card)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text)',
    marginBottom: 0,
  },
  comingSoonBadge: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    background: 'var(--accent-subtle)',
    color: 'var(--accent)',
    padding: '2px 6px',
    borderRadius: 4,
    letterSpacing: '0.5px',
  },
  cardDesc: {
    fontSize: 13,
    color: 'var(--text-muted)',
    lineHeight: 1.4,
  },
  arrow: {
    color: 'var(--text-dim)',
    transition: 'transform 200ms ease, color 200ms ease',
  },
};
