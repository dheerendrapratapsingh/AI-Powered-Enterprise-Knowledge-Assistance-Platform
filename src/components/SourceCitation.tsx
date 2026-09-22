import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import styles from './SourceCitation.module.css';

export interface Citation {
  id: string;
  docTitle: string;
  page?: number;
  snippet: string;
  relevanceScore?: number;
}

interface SourceCitationProps {
  citations: Citation[];
}

export function SourceCitation({ citations }: SourceCitationProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!citations || citations.length === 0) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <BookOpen size={14} className={styles.headerIcon} />
        <span>Sources & Citations ({citations.length})</span>
      </div>
      <div className={styles.citationList}>
        {citations.map((c) => {
          const isExpanded = expandedId === c.id;
          return (
            <div key={c.id} className={`${styles.card} ${isExpanded ? styles.expanded : ''}`}>
              <div
                className={styles.cardHeader}
                onClick={() => setExpandedId(isExpanded ? null : c.id)}
              >
                <div className={styles.sourceMeta}>
                  <span className={styles.docTitle}>{c.docTitle}</span>
                  {c.page !== undefined && <span className={styles.pageTag}>p. {c.page}</span>}
                  {c.relevanceScore !== undefined && (
                    <span className={styles.scoreTag}>
                      {Math.round(c.relevanceScore * 100)}% match
                    </span>
                  )}
                </div>
                <button className={styles.expandBtn} aria-label="Toggle excerpt">
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
              {isExpanded && (
                <div className={styles.snippetBody}>
                  <p className={styles.snippetText}>"{c.snippet}"</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
