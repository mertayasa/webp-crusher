import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { CSSProperties } from 'react';

export default function BackButton() {
  return (
    <Link to="/" style={s.btn}>
      <ArrowLeft size={16} />
      <span>Back to Tools</span>
    </Link>
  );
}

const s: Record<string, CSSProperties> = {
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    background: 'var(--bg-surface)',
    color: 'var(--text-muted)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 150ms ease',
    marginBottom: 24,
  }
};
