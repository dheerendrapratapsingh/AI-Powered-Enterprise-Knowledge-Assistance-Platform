import styles from './StatusBadge.module.css';

export type DocStatus = 'uploaded' | 'extracting' | 'chunking' | 'embedding' | 'indexed' | 'failed';
export type OrgStatus = 'active' | 'onboarding' | 'suspended';
export type UserStatus = 'active' | 'invited' | 'inactive';

type Status = DocStatus | OrgStatus | UserStatus;

const CONFIG: Record<Status, { label: string; variant: string }> = {
  // Document processing
  uploaded:   { label: 'Uploaded',   variant: 'blue' },
  extracting: { label: 'Extracting', variant: 'yellow' },
  chunking:   { label: 'Chunking',   variant: 'yellow' },
  embedding:  { label: 'Embedding',  variant: 'yellow' },
  indexed:    { label: 'Indexed',    variant: 'green' },
  failed:     { label: 'Failed',     variant: 'red' },
  // Org status
  active:     { label: 'Active',     variant: 'green' },
  onboarding: { label: 'Onboarding', variant: 'yellow' },
  suspended:  { label: 'Suspended',  variant: 'red' },
  // User status
  invited:    { label: 'Invited',    variant: 'blue' },
  inactive:   { label: 'Inactive',   variant: 'gray' },
};

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = CONFIG[status] ?? { label: status, variant: 'gray' };
  return (
    <span className={`${styles.badge} ${styles[cfg.variant]}`}>
      <span className={styles.dot} />
      {cfg.label}
    </span>
  );
}
