import { useState } from 'react';

interface ReleaseStage {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'pending' | 'blocked';
  date?: string;
  owner?: string;
  description?: string;
  milestone?: string;
}

interface ReleaseJourneyProps {
  stages: ReleaseStage[];
  variant?: 'full' | 'compact';
  onStageClick?: (stageId: string) => void;
  activeStageId?: string;
  className?: string;
}

const stageWorkflowColors: Record<string, string> = {
  Planning: 'bg-workflow-planning/10 text-workflow-planning',
  Recording: 'bg-workflow-recording/10 text-workflow-recording',
  Editing: 'bg-workflow-mixing/10 text-workflow-mixing',
  Mixing: 'bg-workflow-mixing/10 text-workflow-mixing',
  Mastering: 'bg-workflow-mastering/10 text-workflow-mastering',
  Artwork: 'bg-workflow-artwork/10 text-workflow-artwork',
  Publishing: 'bg-workflow-publishing/10 text-workflow-publishing',
  Distribution: 'bg-workflow-distribution/10 text-workflow-distribution',
  Released: 'bg-workflow-released/10 text-workflow-released',
};

function CompletedDot() {
  return (
    <div className="h-5 w-5 rounded-full bg-success-500 flex items-center justify-center shrink-0 transition-all duration-300">
      <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 6l2.5 2.5L10 3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function CurrentDot() {
  return (
    <div className="h-5 w-5 rounded-full bg-primary-500 animate-pulse ring-4 ring-primary-500/20 shrink-0 transition-all duration-300" />
  );
}

function PendingDot() {
  return (
    <div className="h-5 w-5 rounded-full bg-white border-2 border-surface-300 dark:bg-surface-800 dark:border-surface-600 shrink-0 transition-all duration-300" />
  );
}

function BlockedDot() {
  return (
    <div className="h-5 w-5 rounded-full bg-danger-500 flex items-center justify-center shrink-0 transition-all duration-300">
      <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="currentColor">
        <path d="M6 1a5 5 0 100 10A5 5 0 006 1zM5.25 3.5h1.5v3h-1.5v-3zm0 4.5h1.5v1.5h-1.5V8z" />
      </svg>
    </div>
  );
}

function CompactCompletedDot() {
  return <div className="h-3 w-3 rounded-full bg-success-500 shrink-0 transition-all duration-300" />;
}

function CompactCurrentDot() {
  return <div className="h-3 w-3 rounded-full bg-primary-500 animate-pulse shrink-0 transition-all duration-300" />;
}

function CompactPendingDot() {
  return <div className="h-3 w-3 rounded-full bg-surface-300 shrink-0 transition-all duration-300" />;
}

function CompactBlockedDot() {
  return <div className="h-3 w-3 rounded-full bg-danger-500 shrink-0 transition-all duration-300" />;
}

function renderDot(status: ReleaseStage['status']) {
  switch (status) {
    case 'completed':
      return <CompletedDot />;
    case 'current':
      return <CurrentDot />;
    case 'pending':
      return <PendingDot />;
    case 'blocked':
      return <BlockedDot />;
  }
}

function renderCompactDot(status: ReleaseStage['status']) {
  switch (status) {
    case 'completed':
      return <CompactCompletedDot />;
    case 'current':
      return <CompactCurrentDot />;
    case 'pending':
      return <CompactPendingDot />;
    case 'blocked':
      return <CompactBlockedDot />;
  }
}

function getConnectorFill(stages: ReleaseStage[], i: number): string {
  const current = stages[i];
  const next = stages[i + 1];
  if (!next) return '';

  if (next.status === 'current') {
    return 'bg-gradient-to-r from-success-500 to-primary-500 transition-all duration-300';
  }
  if (current?.status === 'completed' && next.status !== 'pending') {
    return 'bg-success-500 transition-all duration-300';
  }
  return 'bg-surface-200 transition-all duration-300';
}

function MilestoneMarker({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <div className="flex items-center gap-1 mt-0.5">
      <svg className="h-2 w-2 shrink-0" viewBox="0 0 10 10">
        <rect
          x="1"
          y="1"
          width="8"
          height="8"
          transform="rotate(45 5 5)"
          className={colorClass.split(' ')[0]}
          fill="currentColor"
        />
      </svg>
      <span className="text-xs text-text-400 truncate max-w-20">{label}</span>
    </div>
  );
}

export function ReleaseJourney({
  stages,
  variant = 'full',
  onStageClick,
  activeStageId,
  className = '',
}: ReleaseJourneyProps) {
  const [popoverStageId, setPopoverStageId] = useState<string | null>(null);

  if (stages.length === 0) return null;

  const completedCount = stages.filter((s) => s.status === 'completed').length;
  const currentIndex = stages.findIndex((s) => s.status === 'current');
  const valuenow = currentIndex >= 0 ? currentIndex : completedCount;

  function handleStageClick(stageId: string) {
    setPopoverStageId((prev) => (prev === stageId ? null : stageId));
    onStageClick?.(stageId);
  }

  if (variant === 'compact') {
    return (
      <div
        role="progressbar"
        aria-valuenow={valuenow}
        aria-valuemin={0}
        aria-valuemax={stages.length}
        aria-label="Release journey progress"
        className={`flex items-center gap-1 ${className}`}
      >
        {stages.map((stage, i) => {
          const isLast = i === stages.length - 1;
          return (
            <div
              key={stage.id}
              className={`flex items-center ${isLast ? '' : 'flex-1'}`}
              title={`${stage.label}: ${stage.status}`}
            >
              <div className="shrink-0">{renderCompactDot(stage.status)}</div>
              {!isLast && (
                <div className={`h-1 flex-1 ${getConnectorFill(stages, i)}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="progressbar"
      aria-valuenow={valuenow}
      aria-valuemin={0}
      aria-valuemax={stages.length}
      aria-label="Release journey progress"
      className={`overflow-x-auto ${className}`}
    >
      <div role="list" className="flex min-w-max">
        {stages.map((stage, i) => {
          const isLast = i === stages.length - 1;
          const isCurrent = stage.status === 'current';
          const isActive = activeStageId === stage.id;
          const showPopover = popoverStageId === stage.id && !!onStageClick;
          const workflowColor = stageWorkflowColors[stage.label] ?? 'bg-surface-100 text-text-500';
          const badgeClasses = workflowColor.split(' ');

          const stageNode = (
            <div
              role="listitem"
              className={`flex flex-col items-center relative ${isLast ? '' : 'flex-1'} ${
                isCurrent ? 'bg-primary-50/40 dark:bg-primary-900/15 rounded-xl px-4 py-2 -mx-2' : ''
              }`}
            >
              <div className="flex items-center w-full">
                {i > 0 && (
                  <div className={`h-1 flex-1 ${getConnectorFill(stages, i - 1)}`} />
                )}
                <button
                  type="button"
                  className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-full hover:scale-105 transition-transform duration-200"
                  aria-label={`Stage ${i + 1}: ${stage.label}, ${stage.status}`}
                  aria-current={stage.status === 'current' ? 'step' : undefined}
                  onClick={() => handleStageClick(stage.id)}
                >
                  {renderDot(stage.status)}
                </button>
                {!isLast && (
                  <div className={`h-1 flex-1 ${getConnectorFill(stages, i)}`} />
                )}
              </div>

              <span
                className={`mt-2 text-xs font-medium text-center transition-colors duration-200 ${
                  isCurrent ? 'text-text-900 font-semibold' : 'text-text-700'
                } ${isActive ? 'border-b-2 border-primary-500' : ''}`}
              >
                <span
                  className={`inline-block h-2 w-2 rounded-full mr-1 align-middle ${
                    badgeClasses[0] ?? 'bg-surface-200'
                  }`}
                />
                {stage.label}
              </span>

              {stage.date && (
                <span className="text-xs text-text-400 mt-0.5">{stage.date}</span>
              )}

              {stage.milestone && (
                <MilestoneMarker
                  label={stage.milestone}
                  colorClass={workflowColor}
                />
              )}

              {showPopover && (
                <div className="absolute top-full mt-2 z-10 animate-slide-up">
                  <div className="bg-white shadow-raised rounded-xl border border-surface-200 p-3 w-48">
                    {stage.owner && (
                      <p className="text-xs text-text-700">
                        <span className="text-text-400">Owner:</span> {stage.owner}
                      </p>
                    )}
                    {stage.description && (
                      <p className="text-xs text-text-500 mt-1">{stage.description}</p>
                    )}
                    {stage.milestone && (
                      <p className="text-xs text-text-500 mt-1">
                        <span className="text-text-400">Milestone:</span> {stage.milestone}
                      </p>
                    )}
                    {stage.date && (
                      <p className="text-xs text-text-500 mt-1">
                        <span className="text-text-400">Date:</span> {stage.date}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );

          return stageNode;
        })}
      </div>
    </div>
  );
}
