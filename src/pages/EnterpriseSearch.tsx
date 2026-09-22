import { useState } from 'react';
import { Search, FileText, ExternalLink, Sparkles, Tag, BookOpen } from 'lucide-react';
import styles from './EnterpriseSearch.module.css';

interface SearchResult {
  id: string;
  title: string;
  docType: string;
  dept: string;
  matchedChunk: string;
  similarity: number;
  updatedAt: string;
  highlights: string[];
}

const SAMPLE_RESULTS: SearchResult[] = [
  {
    id: 'res_1',
    title: 'Q3 Product Security & Compliance Policy',
    docType: 'PDF',
    dept: 'Engineering',
    matchedChunk: 'All production database access requires mandatory Multi-Factor Authentication (MFA) via hardware security key or enterprise TOTP authenticator. Session tokens expire after 4 hours of inactivity.',
    similarity: 0.94,
    updatedAt: '2 days ago',
    highlights: ['Multi-Factor Authentication', 'MFA', 'Session tokens expire'],
  },
  {
    id: 'res_2',
    title: 'Employee Onboarding & Equipment Guidelines',
    docType: 'DOCX',
    dept: 'Human Resources',
    matchedChunk: 'Engineering hires are eligible for either an M3 Max MacBook Pro 36GB or Dell XPS 15 developer edition. Hardware requisitions must be filed 7 business days prior to start date via ServiceNow.',
    similarity: 0.88,
    updatedAt: '1 week ago',
    highlights: ['Hardware requisitions', 'ServiceNow', 'start date'],
  },
  {
    id: 'res_3',
    title: 'Incident Response SOP — Tier 1 to Tier 3 Escalation',
    docType: 'Markdown',
    dept: 'DevOps / SRE',
    matchedChunk: 'P1/Critical outages must be acknowledged within 5 minutes. The Incident Commander immediately initiates a dedicated Slack war room (#incident-active) and bridges the Zoom incident call.',
    similarity: 0.85,
    updatedAt: '3 weeks ago',
    highlights: ['P1/Critical outages', 'Slack war room', 'Incident Commander'],
  },
  {
    id: 'res_4',
    title: 'Global Travel and Expense Reimbursement Policy',
    docType: 'PDF',
    dept: 'Finance',
    matchedChunk: 'Meal allowances for domestic travel are capped at $75/day without individual itemized receipts required for meals under $25. Flight bookings must be made through Concur at least 14 days in advance.',
    similarity: 0.79,
    updatedAt: '1 month ago',
    highlights: ['Concur', 'Meal allowances', 'Reimbursement'],
  },
];

export function EnterpriseSearch() {
  const [query, setQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [results, setResults] = useState<SearchResult[]>(SAMPLE_RESULTS);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setResults(SAMPLE_RESULTS);
      return;
    }
    setIsSearching(true);
    setTimeout(() => {
      const filtered = SAMPLE_RESULTS.filter(
        (r) =>
          r.title.toLowerCase().includes(query.toLowerCase()) ||
          r.matchedChunk.toLowerCase().includes(query.toLowerCase()) ||
          r.dept.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setIsSearching(false);
    }, 300);
  };

  const filteredResults =
    selectedDept === 'All'
      ? results
      : results.filter((r) => r.dept.toLowerCase() === selectedDept.toLowerCase());

  return (
    <div className={styles.container}>
      {/* Search Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.badge}>
            <Sparkles size={14} /> Semantic & Keyword Hybrid Search
          </div>
          <h1 className={styles.title}>Enterprise Knowledge Search</h1>
          <p className={styles.subtitle}>
            Search across all indexed organizational documents, SOPs, policies, and knowledge bases using FAISS dense vector retrieval.
          </p>

          <form onSubmit={handleSearch} className={styles.searchBar}>
            <Search className={styles.searchIcon} size={20} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search policies, SOPs, engineering docs, hardware guidelines..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className={styles.searchBtn}>
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {/* Filters bar */}
        <div className={styles.filterBar}>
          <div className={styles.deptPills}>
            {['All', 'Engineering', 'Human Resources', 'DevOps / SRE', 'Finance'].map((dept) => (
              <button
                key={dept}
                className={`${styles.deptPill} ${selectedDept === dept ? styles.deptPillActive : ''}`}
                onClick={() => setSelectedDept(dept)}
              >
                {dept}
              </button>
            ))}
          </div>
          <span className={styles.countText}>
            Showing {filteredResults.length} indexed {filteredResults.length === 1 ? 'match' : 'matches'}
          </span>
        </div>

        {/* Results List */}
        {isSearching ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>Searching FAISS vector index & computing similarity scores...</p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className={styles.emptyState}>
            <BookOpen size={48} className={styles.emptyIcon} />
            <h3>No matching documents found</h3>
            <p>Try refining your query or resetting department filters.</p>
          </div>
        ) : (
          <div className={styles.resultList}>
            {filteredResults.map((item) => (
              <div key={item.id} className={`glass-panel ${styles.resultCard}`}>
                <div className={styles.cardHeader}>
                  <div className={styles.docInfo}>
                    <div className={styles.docIcon}>
                      <FileText size={18} />
                    </div>
                    <div>
                      <h3 className={styles.docTitle}>{item.title}</h3>
                      <div className={styles.metaRow}>
                        <span className={styles.deptTag}>{item.dept}</span>
                        <span className={styles.dot}>•</span>
                        <span className={styles.docFormat}>{item.docType}</span>
                        <span className={styles.dot}>•</span>
                        <span className={styles.timeTag}>Updated {item.updatedAt}</span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.similarityScore}>
                    <div className={styles.scoreNumber}>{Math.round(item.similarity * 100)}%</div>
                    <span className={styles.scoreLabel}>vector match</span>
                  </div>
                </div>

                <div className={styles.snippetBlock}>
                  <p className={styles.snippetText}>
                    "... {item.matchedChunk} ..."
                  </p>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.tags}>
                    {item.highlights.map((h) => (
                      <span key={h} className={styles.tag}>
                        <Tag size={11} /> {h}
                      </span>
                    ))}
                  </div>
                  <a href="#view" className={styles.viewDocLink}>
                    <span>View full document</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
