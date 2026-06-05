import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { TOOLS } from '../data/tools';

interface OtherToolsProps {
  currentToolId: string;
}

export default function OtherTools({ currentToolId }: OtherToolsProps) {
  const otherTools = TOOLS.filter(t => t.id !== currentToolId);

  return (
    <div style={s.container}>
      <h3 style={s.heading}>More Tools You Might Like</h3>
      <div className="home-grid" style={s.gridOverrides}>
        {otherTools.map((tool) => (
          <Link href={tool.path} key={tool.id} style={s.card}>
            <div style={{ ...s.iconWrapper, color: tool.color, background: `${tool.color}15` }}>
              <tool.icon size={22} />
            </div>
            <div style={s.cardContent}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <h4 style={s.cardTitle}>{tool.name}</h4>
                {tool.comingSoon && <span style={s.comingSoonBadge}>Coming Soon</span>}
              </div>
              <p style={s.cardDesc}>{tool.desc}</p>
            </div>
            <div style={s.arrow}>
              <ArrowRight size={16} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  container: {
    marginTop: 48,
    paddingTop: 48,
    borderTop: '1px solid var(--border)',
    width: '100%',
    maxWidth: 860,
    marginInline: 'auto',
  },
  heading: {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--text)',
    marginBottom: 24,
  },
  gridOverrides: {
    // Override the 3-column layout on desktop to fit better in the narrower 860px container
    // Let's use the home-grid but it will automatically adapt.
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    textDecoration: 'none',
    transition: 'all 200ms ease',
    cursor: 'pointer',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: 0,
  },
  comingSoonBadge: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    background: 'var(--accent-subtle)',
    color: 'var(--accent)',
    padding: '2px 5px',
    borderRadius: 4,
    letterSpacing: '0.5px',
  },
  cardDesc: {
    fontSize: 12,
    color: 'var(--text-muted)',
    lineHeight: 1.3,
  },
  arrow: {
    color: 'var(--text-dim)',
  },
};
