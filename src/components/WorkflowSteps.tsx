import { useState } from 'react';
import { CheckCircle2, ListOrdered, ChevronRight } from 'lucide-react';
import styles from './WorkflowSteps.module.css';

export interface WorkflowStep {
  stepNumber: number;
  title: string;
  description: string;
  actionUrl?: string;
  actionLabel?: string;
}

interface WorkflowStepsProps {
  workflowTitle?: string;
  steps: WorkflowStep[];
}

export function WorkflowSteps({ workflowTitle = 'Standard Operating Procedure', steps }: WorkflowStepsProps) {
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (stepNum: number) => {
    setCompletedSteps(prev => ({ ...prev, [stepNum]: !prev[stepNum] }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <ListOrdered size={16} className={styles.icon} />
          <span>{workflowTitle}</span>
        </div>
        <span className={styles.progress}>
          {Object.values(completedSteps).filter(Boolean).length} / {steps.length} completed
        </span>
      </div>

      <div className={styles.stepList}>
        {steps.map((step) => {
          const isDone = !!completedSteps[step.stepNumber];
          return (
            <div
              key={step.stepNumber}
              className={`${styles.stepCard} ${isDone ? styles.stepDone : ''}`}
            >
              <button
                className={styles.checkBtn}
                onClick={() => toggleStep(step.stepNumber)}
                aria-label={`Mark step ${step.stepNumber} complete`}
              >
                {isDone ? (
                  <CheckCircle2 size={18} className={styles.doneIcon} />
                ) : (
                  <div className={styles.stepBadge}>{step.stepNumber}</div>
                )}
              </button>

              <div className={styles.stepContent}>
                <h4 className={`${styles.stepHeading} ${isDone ? styles.headingDone : ''}`}>
                  {step.title}
                </h4>
                <p className={styles.stepDesc}>{step.description}</p>
                {step.actionUrl && (
                  <a
                    href={step.actionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.actionBtn}
                  >
                    <span>{step.actionLabel || 'Go to resource'}</span>
                    <ChevronRight size={14} />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
