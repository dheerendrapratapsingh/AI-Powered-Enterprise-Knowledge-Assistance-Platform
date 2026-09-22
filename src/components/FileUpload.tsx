import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { UploadCloud } from 'lucide-react';
import styles from './FileUpload.module.css';

interface FileUploadProps {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxMB?: number;
}

const ACCEPTED_TYPES = '.pdf,.docx,.txt,.csv,.md';

export function FileUpload({
  onFiles,
  accept = ACCEPTED_TYPES,
  multiple = true,
  maxMB = 50,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const validate = (files: FileList | null): File[] => {
    if (!files) return [];
    setError('');
    const valid: File[] = [];
    Array.from(files).forEach((file) => {
      if (file.size > maxMB * 1024 * 1024) {
        setError(`"${file.name}" exceeds ${maxMB}MB limit.`);
        return;
      }
      valid.push(file);
    });
    return valid;
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const valid = validate(e.dataTransfer.files);
    if (valid.length) onFiles(valid);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const valid = validate(e.target.files);
    if (valid.length) onFiles(valid);
    e.target.value = '';
  };

  return (
    <div
      className={`${styles.zone} ${isDragging ? styles.dragging : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      aria-label="Upload documents"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        style={{ display: 'none' }}
        aria-hidden
      />
      <UploadCloud size={36} className={styles.icon} />
      <p className={styles.primary}>
        {isDragging ? 'Drop files here' : 'Drag & drop files here'}
      </p>
      <p className={styles.secondary}>
        or <span className={styles.link}>browse</span> · PDF, DOCX, TXT, CSV, MD · Max {maxMB}MB
      </p>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
