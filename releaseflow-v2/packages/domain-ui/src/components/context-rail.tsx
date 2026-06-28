import { type ReactNode, useState } from 'react';

interface AttentionItem {
  id: string;
  label: string;
  type: 'approval' | 'review' | 'deadline' | 'blocker';
  href?: string;
}

interface WorkflowSnapshot {
  completedStages: number;
  totalStages: number;
  currentStage: string;
  stages: { name: string; status: 'completed' | 'in-progress' | 'pending' | 'blocked' }[];
}

interface ContextRailProps {
  releaseName: string;
  releaseType: string;
  releaseHref?: string;
  currentStage: string;
  releaseDate: string;
  health: number;
  readiness?: number;
  attentionItems: AttentionItem[];
  workflowSnapshot?: WorkflowSnapshot;
  dependencySummary?: { total: number; blocking: number; completed: number };
  distributionSummary?: { platforms: number; live: number; pending: number };
  className?: string;
}

const attentionTypeConfig: Record<AttentionItem['type'], { dot: string; text: string; label: string }> = {
  approval: { dot: 'bg-warning-500', text: 'text-warning-500', label: 'Approval' },
  review: { dot: 'bg-info-500', text: 'text-info-500', label: 'Review' },
  deadline: { dot: 'bg-danger-500', text: 'text-danger-500', label: 'Deadline' },
  blocker: { dot: 'bg-danger-500', text: 'text-danger-500', label: 'Blocker' },
};

const stageDotClasses: Record<string, string> = {
  completed: 'h-3 w-3 rounded-full bg-success-500 shrink-0',
  'in-progress': 'h-3 w-3 rounded-full bg-primary-500 ring-2 ring-primary-500/20 shrink-0',
  pending: 'h-3 w-3 rounded-full bg-surface-300 shrink-0',
  blocked: 'h-3 w-3 rounded-full bg-danger-500 shrink-0',
};

function getHealthColor(health: number) {
  if (health >= 80) return 'bg-success-500';
  if (health >= 40) return 'bg-warning-500';
  return 'bg-danger-500';
}

function getHealthLabel(health: number) {
  if (health >= 80) return 'Healthy';
  if (health >= 40) return 'Unstable';
  return 'Critical';
}

function getDependencyColor(completed: number, blocking: number) {
  if (blocking === 0) return 'bg-success-500';
  if (completed === 0) return 'bg-danger-500';
  return 'bg-warning-500';
}

function CollapsibleSection({
  id,
  title,
  expanded,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-surface-200">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={`context-section-${id}`}
        className="w-full flex items-center justify-between p-4 hover:bg-surface-50 transition-colors duration-200"
      >
        <h4 className="text-xs font-medium text-text-400 uppercase tracking-wider">
          {title}
        </h4>
        <svg
          className={`h-4 w-4 text-text-400 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {expanded && (
        <div id={`context-section-${id}`} className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
}

const DEFAULT_EXPANDED = new Set(['release', 'stage', 'date', 'health']);

export function ContextRail({
  releaseName,
  releaseType,
  releaseHref,
  currentStage,
  releaseDate,
  health,
  readiness,
  attentionItems,
  workflowSnapshot,
  dependencySummary,
  distributionSummary,
  className = '',
}: ContextRailProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(DEFAULT_EXPANDED));
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleSection(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const clampedHealth = Math.min(100, Math.max(0, health));
  const healthColor = getHealthColor(clampedHealth);
  const healthLabel = getHealthLabel(clampedHealth);

  const hasReadiness = readiness !== undefined;
  const hasWorkflow = workflowSnapshot !== undefined;
  const hasDependencies = dependencySummary !== undefined;
  const hasDistribution = distributionSummary !== undefined;

  const releaseLinkClass = releaseHref
    ? 'text-base font-semibold text-primary-700 hover:text-primary-500 transition-colors duration-200 cursor-pointer'
    : 'text-base font-semibold text-text-900';

  const releaseContent = (
    <>
      {releaseHref ? (
        <a href={releaseHref} className={releaseLinkClass}>
          {releaseName}
        </a>
      ) : (
        <p className={releaseLinkClass}>{releaseName}</p>
      )}
      <p className="text-xs text-text-500 mt-0.5">{releaseType}</p>
    </>
  );

  return (
    <aside
      role="complementary"
      aria-label="Release Context"
      className={`bg-white lg:w-80 lg:border-l lg:border-surface-200 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto border-b border-surface-200 ${className}`}
    >
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-expanded={mobileOpen}
        aria-controls="context-rail-content"
        className="flex items-center justify-between w-full p-4 lg:hidden hover:bg-surface-50 transition-colors duration-200"
      >
        <span className="text-sm font-medium text-text-900">Release Context</span>
        <svg
          className={`h-4 w-4 text-text-400 transition-transform duration-200 ${mobileOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M4 10l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div id="context-rail-content" className={`lg:block ${mobileOpen ? 'block' : 'hidden'}`}>
        <CollapsibleSection
          id="release"
          title="Release"
          expanded={expanded.has('release')}
          onToggle={() => toggleSection('release')}
        >
          {releaseContent}
        </CollapsibleSection>

        <CollapsibleSection
          id="stage"
          title="Stage"
          expanded={expanded.has('stage')}
          onToggle={() => toggleSection('stage')}
        >
          <span className="inline-block bg-primary-50 text-primary-700 text-xs font-medium rounded-full px-3 py-1">
            {currentStage}
          </span>
        </CollapsibleSection>

        <CollapsibleSection
          id="date"
          title="Release Date"
          expanded={expanded.has('date')}
          onToggle={() => toggleSection('date')}
        >
          <p className="text-xs text-text-500 flex items-center gap-1">
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="2" width="10" height="10" rx="2" />
              <path d="M2 5h10M5 1v2M9 1v2" strokeLinecap="round" />
            </svg>
            {releaseDate}
          </p>
        </CollapsibleSection>

        <CollapsibleSection
          id="health"
          title="Health"
          expanded={expanded.has('health')}
          onToggle={() => toggleSection('health')}
        >
          <div className="bg-surface-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${healthColor}`}
              style={{ width: `${clampedHealth}%` }}
            />
          </div>
          <p className="text-xs text-text-500 mt-1">{clampedHealth}% &middot; {healthLabel}</p>
        </CollapsibleSection>

        {hasReadiness && (
          <CollapsibleSection
            id="readiness"
            title="Readiness"
            expanded={expanded.has('readiness')}
            onToggle={() => toggleSection('readiness')}
          >
            <div className="bg-surface-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-success-500 transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, readiness))}%` }}
              />
            </div>
            <p className="text-xs text-text-500 mt-1">{readiness}% ready</p>
          </CollapsibleSection>
        )}

        {hasWorkflow && (
          <CollapsibleSection
            id="workflow"
            title="Workflow"
            expanded={expanded.has('workflow')}
            onToggle={() => toggleSection('workflow')}
          >
            <div className="flex items-center gap-1" aria-label={`Workflow: ${workflowSnapshot.completedStages} of ${workflowSnapshot.totalStages} stages complete`}>
              {workflowSnapshot.stages.map((stage, i) => {
                const isLast = i === workflowSnapshot.stages.length - 1;
                const dotClass = stageDotClasses[stage.status] ?? 'h-3 w-3 rounded-full bg-surface-300 shrink-0';
                return (
                  <div key={i} className={`flex items-center ${isLast ? '' : 'flex-1'}`} title={stage.name}>
                    <div className={dotClass} />
                    {!isLast && <div className="h-1 flex-1 bg-surface-200" />}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-text-500 mt-1">
              {workflowSnapshot.completedStages} of {workflowSnapshot.totalStages} stages complete
            </p>
          </CollapsibleSection>
        )}

        {hasDependencies && (
          <CollapsibleSection
            id="dependencies"
            title="Dependencies"
            expanded={expanded.has('dependencies')}
            onToggle={() => toggleSection('dependencies')}
          >
            {dependencySummary.total === 0 ? (
              <p className="text-xs text-text-400">No dependencies</p>
            ) : (
              <>
                <div className="bg-surface-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ease-out ${getDependencyColor(dependencySummary.completed, dependencySummary.blocking)}`}
                    style={{ width: `${Math.round((dependencySummary.completed / dependencySummary.total) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-text-500 mt-1">
                  {dependencySummary.completed} of {dependencySummary.total} deps cleared
                  {dependencySummary.blocking > 0 && (
                    <span className="text-danger-500 ml-1">&middot; {dependencySummary.blocking} blocking</span>
                  )}
                </p>
              </>
            )}
          </CollapsibleSection>
        )}

        {hasDistribution && (
          <CollapsibleSection
            id="distribution"
            title="Distribution"
            expanded={expanded.has('distribution')}
            onToggle={() => toggleSection('distribution')}
          >
            {distributionSummary.platforms === 0 ? (
              <p className="text-xs text-text-400">No distribution platforms</p>
            ) : (
              <>
                <p className="text-xs text-text-700">
                  {distributionSummary.platforms} {distributionSummary.platforms === 1 ? 'platform' : 'platforms'}, {distributionSummary.live} live
                </p>
                {distributionSummary.pending > 0 && (
                  <p className="text-xs text-text-500 mt-0.5">{distributionSummary.pending} pending</p>
                )}
              </>
            )}
          </CollapsibleSection>
        )}

        <CollapsibleSection
          id="attention"
          title="Requires Attention"
          expanded={expanded.has('attention')}
          onToggle={() => toggleSection('attention')}
        >
          {attentionItems.length === 0 ? (
            <p className="text-xs text-text-400">Nothing requires attention</p>
          ) : (
            <div role="list" aria-label="Attention items">
              {attentionItems.map((item) => {
                const config = attentionTypeConfig[item.type];
                const content = (
                  <div className="flex items-center text-sm text-text-700 py-2 border-b border-surface-100 last:border-0">
                    <span className={`h-2 w-2 rounded-full mr-2 shrink-0 ${config.dot}`} />
                    <span className="flex-1">{item.label}</span>
                    <span className={`text-xs shrink-0 ml-2 font-medium ${config.text}`}>
                      {config.label}
                    </span>
                  </div>
                );

                if (item.href) {
                  return (
                    <a
                      key={item.id}
                      href={item.href}
                      role="listitem"
                      className="block hover:bg-surface-50 transition-colors duration-200 -mx-2 px-2 rounded-lg"
                    >
                      {content}
                    </a>
                  );
                }

                return (
                  <div
                    key={item.id}
                    role="listitem"
                    className="hover:bg-surface-50 transition-colors duration-200 -mx-2 px-2 rounded-lg"
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          )}
        </CollapsibleSection>
      </div>
    </aside>
  );
}
