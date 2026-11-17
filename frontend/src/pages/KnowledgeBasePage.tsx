import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  BookOpen,
  ShieldCheck,
  Building2,
  MapPin,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { SiteNavbar } from '../components/SiteNavbar';
import { SiteFooter } from '../components/SiteFooter';
import styles from './KnowledgeBasePage.module.css';

interface CatalogDoc {
  id: string | number;
  name: string;
  category: string;
  department: string;
  source_type: string;
  source_url?: string;
  chunk_count: number;
  created_at?: string;
}

const FALLBACK_DOCS: CatalogDoc[] = [
  {
    id: 1,
    name: 'B.Tech CSE Core Curriculum & Syllabus Regulations',
    category: 'Academic Syllabi',
    department: 'School of Computer Science and Engineering',
    source_type: 'manual',
    chunk_count: 28
  },
  {
    id: 2,
    name: 'B.Tech CSBS Curriculum & Academic Structure',
    category: 'Academic Syllabi',
    department: 'School of Computer Science & TCS',
    source_type: 'manual',
    chunk_count: 20
  },
  {
    id: 3,
    name: 'Academic Regulations, FFCS Guidelines & Grading System',
    category: 'Student Regulations',
    department: 'Office of Academic Affairs',
    source_type: 'manual',
    chunk_count: 22
  },
  {
    id: 4,
    name: 'Hostel Rules, Night Curfew & Sunday Outing Guidelines',
    category: 'Hostel & Residential Life',
    department: 'Office of the Chief Warden',
    source_type: 'manual',
    chunk_count: 14
  },
  {
    id: 5,
    name: 'Faculty Cabins & School of Computer Science Directory',
    category: 'Faculty & Administration',
    department: 'SCOPE & Deanery Office',
    source_type: 'manual',
    chunk_count: 18
  },
  {
    id: 6,
    name: 'B.Tech CSE AI & ML Specialization Syllabi',
    category: 'Academic Syllabi',
    department: 'School of Computer Science and Engineering',
    source_type: 'manual',
    chunk_count: 24
  },
  {
    id: 7,
    name: 'Anti-Ragging Directives & Student Conduct Policy',
    category: 'Student Regulations',
    department: 'Disciplinary Committee',
    source_type: 'manual',
    chunk_count: 8
  },
  {
    id: 8,
    name: 'VIT-AP Examination Cell Rules & Condonation Guidelines',
    category: 'Student Regulations',
    department: 'Controller of Examinations',
    source_type: 'crawl',
    chunk_count: 12
  },
  {
    id: 9,
    name: 'Campus Medical Center & Health Support Emergency Protocol',
    category: 'Hostel & Residential Life',
    department: 'Campus Health Center',
    source_type: 'manual',
    chunk_count: 9
  }
];

const CATEGORIES = [
  'All Sources',
  'Academic Syllabi',
  'Student Regulations',
  'Hostel & Residential Life',
  'Faculty & Administration'
];

export function KnowledgeBasePage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<CatalogDoc[]>(FALLBACK_DOCS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Sources');

  useEffect(() => {
    async function fetchCatalog() {
      try {
        const res = await fetch('/api/public/knowledge-catalog');
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success' && Array.isArray(data.documents) && data.documents.length > 0) {
            setDocuments(data.documents);
          }
        }
      } catch (err) {
        console.warn('Could not fetch dynamic catalog, using fallback assets:', err);
      }
    }
    fetchCatalog();
  }, []);

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === 'All Sources' ||
        doc.category.toLowerCase().includes(selectedCategory.toLowerCase());

      return matchesSearch && matchesCat;
    });
  }, [documents, searchQuery, selectedCategory]);

  const handleQueryDocument = (docName: string) => {
    navigate(`/copilot?prompt=${encodeURIComponent(`What are the key regulations or topics covered in ${docName}?`)}`);
  };

  return (
    <div className={styles.pageWrapper}>
      <SiteNavbar onLaunchCopilot={() => navigate('/copilot')} />

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <div className={styles.eyebrowBadge}>
              <span className={styles.eyebrowDot}></span>
              <span>INDEXED CAMPUS ASSETS</span>
            </div>

            <h1 className={styles.heroHeadline}>
              Explore the knowledge <br />
              <span className={styles.heroHeadlineGradient}>behind your campus.</span>
            </h1>

            <p className={styles.heroDescription}>
              Discover academic resources, university regulations, and institutional documents that help power VIT-AP Copilot.
            </p>
          </div>

          {/* Four Knowledge Pillars */}
          <div className={styles.pillarsGrid}>
            <div className={styles.pillarCard}>
              <div className={styles.pillarIconWrap}>
                <BookOpen size={20} />
              </div>
              <h3 className={styles.pillarTitle}>Academic Resources</h3>
              <p className={styles.pillarDesc}>
                Official curriculum handbooks, branch-specific syllabus units, and prerequisite matrices.
              </p>
              <div className={styles.pillarDocList}>
                <span className={styles.pillarDocItem}>• B.Tech CSE Core Syllabus</span>
                <span className={styles.pillarDocItem}>• B.Tech CSBS Curriculum</span>
                <span className={styles.pillarDocItem}>• Elective Bucket Documents</span>
              </div>
            </div>

            <div className={styles.pillarCard}>
              <div className={styles.pillarIconWrap}>
                <ShieldCheck size={20} />
              </div>
              <h3 className={styles.pillarTitle}>University Regulations</h3>
              <p className={styles.pillarDesc}>
                Academic handbooks, attendance requirements, examination rules, and grading policies.
              </p>
              <div className={styles.pillarDocList}>
                <span className={styles.pillarDocItem}>• Academic Regulations 2023</span>
                <span className={styles.pillarDocItem}>• FAT Attendance Thresholds</span>
                <span className={styles.pillarDocItem}>• FFCS Credit Minimums</span>
              </div>
            </div>

            <div className={styles.pillarCard}>
              <div className={styles.pillarIconWrap}>
                <Building2 size={20} />
              </div>
              <h3 className={styles.pillarTitle}>Hostel Information</h3>
              <p className={styles.pillarDesc}>
                Residential guidelines, weekday &amp; Sunday outing procedures, and leave approval rules.
              </p>
              <div className={styles.pillarDocList}>
                <span className={styles.pillarDocItem}>• Outing Return Guidelines</span>
                <span className={styles.pillarDocItem}>• Home Leave Protocols</span>
                <span className={styles.pillarDocItem}>• Health Center 24/7 Contacts</span>
              </div>
            </div>

            <div className={styles.pillarCard}>
              <div className={styles.pillarIconWrap}>
                <MapPin size={20} />
              </div>
              <h3 className={styles.pillarTitle}>University Directory</h3>
              <p className={styles.pillarDesc}>
                Faculty cabin numbers, school deaneries, departmental offices, and institutional contacts.
              </p>
              <div className={styles.pillarDocList}>
                <span className={styles.pillarDocItem}>• SCOPE Faculty Cabins</span>
                <span className={styles.pillarDocItem}>• Dean of Academics Office</span>
                <span className={styles.pillarDocItem}>• Student Welfare Deanery</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Document Discovery & Search Section */}
      <section className={styles.discoverySection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTag}>SEARCH REPOSITORY</div>
            <h2 className={styles.sectionTitle}>Document Discovery</h2>
            <p className={styles.sectionSubtitle}>
              Browse through authentic institutional documents indexed and referenced by VIT-AP Copilot.
            </p>
          </div>

          <div className={styles.searchToolbar}>
            {/* Search Input */}
            <div className={styles.searchBarWrapper}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search institutional documents, syllabi codes, hostel manuals, or department names..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Pills */}
            <div className={styles.categoryPills}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`${styles.pillBtn} ${selectedCategory === cat ? styles.pillBtnActive : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Grid */}
          <div className={styles.catalogGrid}>
            {filteredDocs.length > 0 ? (
              filteredDocs.map((doc) => (
                <div key={doc.id} className={styles.docCard}>
                  <div>
                    <div className={styles.docCardHeader}>
                      <span className={styles.docCategoryBadge}>{doc.category}</span>
                      <span className={styles.docSourceTag}>
                        {doc.source_type === 'crawl' ? 'PORTAL SYNC' : 'OFFICIAL PDF'}
                      </span>
                    </div>

                    <h3 className={styles.docName}>{doc.name}</h3>
                    <div className={styles.docDept}>{doc.department}</div>
                  </div>

                  <div className={styles.docFooterRow}>
                    <div className={styles.docChunkBadge}>
                      <span className={styles.chunkDot}></span>
                      <span>{doc.chunk_count || 12} Chunks Indexed</span>
                    </div>

                    <button
                      className={styles.queryDocBtn}
                      onClick={() => handleQueryDocument(doc.name)}
                    >
                      <span>Query</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateTitle}>No institutional documents matched your query</div>
                <p className={styles.emptyStateDesc}>
                  Try clearing your search terms or selecting &quot;All Sources&quot; to view all indexed assets.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section 6: Knowledge & Transparency */}
      <section className={styles.transparencySection}>
        <div className={styles.container}>
          <div className={styles.transparencyCard}>
            <div>
              <h2 className={styles.transparencyTitle}>Knowledge and Transparency</h2>
              <p className={styles.transparencyText}>
                VIT-AP Copilot uses available institutional documents to answer student questions. Where supporting
                references are provided, you can inspect the cited document name and page coordinates directly.
              </p>
              <div className={styles.transparencyBadgeList}>
                <div className={styles.transparencyBadgeItem}>
                  <CheckCircle2 size={16} color="#38BDF8" />
                  <span>Only official university handbooks and notices are indexed.</span>
                </div>
                <div className={styles.transparencyBadgeItem}>
                  <CheckCircle2 size={16} color="#38BDF8" />
                  <span>Unverifiable assumptions or outside claims are rejected.</span>
                </div>
                <div className={styles.transparencyBadgeItem}>
                  <CheckCircle2 size={16} color="#38BDF8" />
                  <span>Whenever policies change, records are updated by administrators.</span>
                </div>
              </div>
            </div>

            <div className={styles.transparencyBoxRight}>
              <div className={styles.transparencyBoxTitle}>
                How Citations Work in Chat
              </div>
              <p className={styles.transparencyBoxBody}>
                When Copilot explains an outing deadline or course requirement, look for the source pill at the base of the
                message. Clicking on it shows the exact source document (e.g. <em>Ladies_Hostel_Handbook.pdf</em>) and the
                corresponding page number.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: Final CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaBox}>
            <h2 className={styles.ctaTitle}>Have a question about your university?</h2>
            <p className={styles.ctaDesc}>
              Ask about course curricula, hostel outing timings, or faculty cabins with verified answers.
            </p>
            <button className={styles.ctaBtn} onClick={() => navigate('/copilot')}>
              <span>Launch Copilot</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

export default KnowledgeBasePage;
