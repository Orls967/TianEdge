import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import { ReactNode } from 'react';

export function LoadingState({ message = 'Loading laboratory module...' }: { message?: string }) {
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '32px',
        color: 'var(--text-secondary)',
      }}
    >
      <Loader2 size={22} style={{ color: 'var(--accent-primary)' }} />
      <span className="mono" style={{ fontSize: 'var(--text-mono-sm)' }}>
        {message}
      </span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '8px',
        padding: '28px 20px',
        border: '1px dashed var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <Inbox size={20} style={{ color: 'var(--text-muted)' }} />
      <strong style={{ fontSize: '0.95rem' }}>{title}</strong>
      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '42ch' }}>{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({
  title = 'Module Error',
  message,
  action,
}: {
  title?: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '14px 16px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(239, 68, 68, 0.5)',
        background: 'rgba(239, 68, 68, 0.1)',
        color: '#FECACA',
      }}
    >
      <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        <strong style={{ display: 'block', marginBottom: '4px' }}>{title}</strong>
        <p style={{ margin: 0, fontSize: '0.85rem' }}>{message}</p>
        {action && <div style={{ marginTop: '10px' }}>{action}</div>}
      </div>
    </div>
  );
}
