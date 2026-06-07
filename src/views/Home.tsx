"use client";
import { useState } from 'react';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { TOOLS } from '../data/tools';

type FilterCategory = 'all' | 'image' | 'pdf' | 'utility';

const FILTERS: { id: FilterCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'image', label: 'Image Manipulation' },
  { id: 'pdf', label: 'PDF Manipulation' },
  { id: 'utility', label: 'Utilities' },
];

export default function Home() {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');

  const visibleTools = activeFilter === 'all'
    ? TOOLS
    : TOOLS.filter((t) => (t as any).category === activeFilter);

  return (
    <div style={s.container}>
      <div style={s.hero}>
        <h1 style={s.title}>Free &amp; Private Client-Side Image Tools</h1>
        <p style={s.subtitle}>
          All processing happens right in your browser. Your files never leave your device.
        </p>

        {/* Pill Filter Tabs */}
        <div style={s.filterRow}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              style={{
                ...s.pill,
                ...(activeFilter === f.id ? s.pillActive : s.pillInactive),
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="home-grid">
        {visibleTools.map((tool) => (
          <Link href={tool.path} key={tool.id} style={s.card}>
            <div style={{ ...s.iconWrapper, color: tool.color, background: `${tool.color}15` }}>
              <tool.icon size={28} />
            </div>
            <div style={s.cardContent}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <h2 style={s.cardTitle}>{tool.name}</h2>
                {(tool as any).comingSoon && <span style={s.comingSoonBadge}>Coming Soon</span>}
                {(tool as any).isBeta && <span style={s.betaBadge}>BETA</span>}
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

  // Pill filter row
  filterRow: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 28,
  },
  pill: {
    padding: '8px 20px',
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    borderWidth: '1.5px',
    borderStyle: 'solid',
    borderColor: 'var(--border)',
    fontFamily: 'inherit',
    transition: 'all 200ms ease',
    outline: 'none',
  },
  pillActive: {
    background: 'var(--text)',
    color: 'var(--bg)',
    borderColor: 'var(--text)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
    transform: 'translateY(-1px)',
  },
  pillInactive: {
    background: 'transparent',
    color: 'var(--text-muted)',
    borderColor: 'var(--border)',
  },

  // Tool card
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
  betaBadge: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    background: 'rgba(245, 158, 11, 0.15)',
    color: '#f59e0b',
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
