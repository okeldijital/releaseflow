import { useState, useMemo } from 'react';

interface StageOwner {
  name: string;
  avatarUrl?: string;
}

interface StageTask {
  id: string;
  title: string;
  status: 'done' | 'in-progress' | 'pending';
}

interface WorkflowStage {
  id: string;
  name: string;
  status: 'completed' | 'in-progress' | 'pending' | 'blocked' | 'at-risk';
  owner?: StageOwner;
  progress: number;
  dependencies?: string[];
  dueDate?: string;
  blockers?: string[];
  tasks?: StageTask[];
  onComplete?: (stageId: string) => void;
  onAction?: (stageId: string, action: string) => void;
}

type SortField = 'order' | 'status' | 'dueDate' | 'progress';

interface WorkflowBoardProps {
  stages: WorkflowStage[];
  showOwners?: boolean;
  showProgress?: boolean;
  activeStageId?: string;
  onStageClick?: (stageId: string) => void;
  className?: string;
}

const statusDotClasses: Record<WorkflowStage['status'], string> = {
  completed: 'bg-success-500',
  'in-progress': 'bg-info-500',
  pending: 'bg-surface-300',
  blocked: 'bg-danger-500',
  'at-risk': 'bg-warning-500',
};

const progressColorClasses: Record<WorkflowStage['status'], string> = {
  completed: 'bg-success-500',
  'in-progress': 'bg-primary-500',
  pending: 'bg-surface-300',
  blocked: 'bg-danger-500',
  'at-risk': 'bg-warning-500',
};

const statusSortPriority: Record<WorkflowStage['status'], number> = {
  completed: 0,
  'in-progress': 1,
  'at-risk': 2,
  blocked: 3,
  pending: 4,
};

type StageHealth = 'healthy' | 'warning' | 'critical';

const healthBadgeClasses: Record<StageHealth, string> = {
  healthy: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  critical: 'bg-danger-50 text-danger-700',
};

const taskStatusColors: Record<StageTask['status'], string> = {
  done: 'text-success-500',
  'in-progress': 'text-info-500',
  pending: 'text-text-400',
};

function isDateOverdue(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

function getStageHealth(stage: WorkflowStage): StageHealth {
  const hasBlockers = stage.blockers && stage.blockers.length > 0;
  const overdue = stage.dueDate ? isDateOverdue(stage.dueDate) : false;
  const hasIncompleteTasks = stage.tasks ? stage.tasks.some((t) => t.status !== 'done') : false;

  if (hasBlockers && overdue) return 'critical';
  if (hasIncompleteTasks && overdue) return 'warning';
  return 'healthy';
}

function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-text-700 font-medium mb-1">{title}</p>
      {description && <p className="text-sm text-text-500">{description}</p>}
    </div>
  );
}

function OwnerInfo({ owner }: { owner: StageOwner }) {
  return (
    <div className="flex items-center gap-2">
      {owner.avatarUrl ? (
        <img
          src={owner.avatarUrl}
          alt={owner.name}
          className="h-6 w-6 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="h-6 w-6 rounded-full bg-surface-200 flex items-center justify-center shrink-0">
          <span className="text-xs font-medium text-text-500">
            {owner.name[0]?.toUpperCase()}
          </span>
        </div>
      )}
      <span className="text-xs text-text-500">{owner.name}</span>
    </div>
  );
}

function ProgressSection({ stage }: { stage: WorkflowStage }) {
  const tasks = stage.tasks ?? [];
  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const totalCount = tasks.length;
  const clampedProgress = Math.min(100, Math.max(0, stage.progress));
  const allDone = totalCount > 0 && doneCount === totalCount;

  return (
    <div className="flex-1 px-4 min-w-0">
      <div className="flex items-center gap-2">
        <div className="h-1 bg-surface-200 rounded-full flex-1 min-w-0">
          <div
            className={`h-1 rounded-full transition-all duration-300 ${progressColorClasses[stage.status]}`}
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
        {totalCount > 0 && (
          <span
            className={`text-xs font-medium shrink-0 ${allDone ? 'text-success-500' : 'text-text-500'}`}
          >
            {doneCount}/{totalCount}
          </span>
        )}
      </div>
    </div>
  );
}

function StageActions({ stage }: { stage: WorkflowStage }) {
  if (stage.status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 bg-success-50 text-success-500 rounded-full px-3 py-1 text-xs font-medium shrink-0">
        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 6l2.5 2.5L10 3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Done
      </span>
    );
  }

  if (stage.status === 'blocked') {
    return (
      <button
        className="text-xs bg-danger-500 text-white rounded-lg px-3 py-1 hover:bg-danger-600 transition-all duration-200 shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          stage.onAction?.('resolve', 'resolve');
        }}
      >
        Resolve
      </button>
    );
  }

  if (stage.status === 'at-risk') {
    return (
      <button
        className="text-xs bg-warning-500 text-white rounded-lg px-3 py-1 hover:bg-warning-600 transition-all duration-200 shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          stage.onAction?.('review', 'review');
        }}
      >
        Review
      </button>
    );
  }

  return null;
}

function ActiveStageActions({ stage }: { stage: WorkflowStage }) {
  return (
    <button
      className="text-xs bg-primary-500 text-white rounded-lg px-3 py-1 hover:bg-primary-600 transition-all duration-200 shrink-0"
      onClick={(e) => {
        e.stopPropagation();
        stage.onComplete?.(stage.id);
        stage.onAction?.(stage.id, 'complete');
      }}
    >
      Complete
    </button>
  );
}

function ExpandedContent({ stage }: { stage: WorkflowStage }) {
  return (
    <div className="px-4 py-3 space-y-2">
      {stage.tasks && stage.tasks.length > 0 && (
        <div>
          <span className="text-xs font-medium text-text-500">Tasks:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {stage.tasks.map((task) => (
              <span
                key={task.id}
                className={`text-xs ${taskStatusColors[task.status]} bg-surface-100 rounded px-2 py-1`}
              >
                {task.title}
                {task.status === 'done' ? ' ✓' : task.status === 'in-progress' ? ' ◷' : ' ○'}
              </span>
            ))}
          </div>
        </div>
      )}
      {stage.dependencies && stage.dependencies.length > 0 && (
        <div>
          <span className="text-xs font-medium text-text-500">Dependencies:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {stage.dependencies.map((dep) => (
              <span key={dep} className="text-xs bg-surface-100 text-text-500 rounded px-2 py-1">
                {dep}
              </span>
            ))}
          </div>
        </div>
      )}
      {stage.blockers && stage.blockers.length > 0 && (
        <div>
          <span className="text-xs font-medium text-text-500">Blockers:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {stage.blockers.map((blocker, i) => (
              <span key={i} className="text-xs text-danger-500 bg-danger-50 rounded px-2 py-1">
                {blocker}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SortHeader({
  label,
  field,
  currentSort,
  onToggle,
}: {
  label: string;
  field: SortField;
  currentSort: { field: SortField; asc: boolean };
  onToggle: (field: SortField) => void;
}) {
  const isActive = currentSort.field === field;
  return (
    <button
      onClick={() => onToggle(field)}
      className={`text-xs font-medium cursor-pointer transition-all duration-200 ${
        isActive ? 'text-primary-700' : 'text-text-500 hover:text-text-700'
      }`}
    >
      {label}
      {isActive && (
        <span className="ml-0.5 inline-block text-xs">
          {currentSort.asc ? '▲' : '▼'}
        </span>
      )}
    </button>
  );
}

export function WorkflowBoard({
  stages,
  showOwners = true,
  showProgress = true,
  activeStageId,
  onStageClick,
  className = '',
}: WorkflowBoardProps) {
  const [filter, setFilter] = useState<WorkflowStage['status'] | 'all'>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<{ field: SortField; asc: boolean }>({
    field: 'order',
    asc: true,
  });

  const filteredStages = useMemo(() => {
    let result =
      filter === 'all' ? [...stages] : stages.filter((s) => s.status === filter);

    result.sort((a, b) => {
      let cmp = 0;
      switch (sort.field) {
        case 'status':
          cmp = (statusSortPriority[a.status] ?? 0) - (statusSortPriority[b.status] ?? 0);
          break;
        case 'dueDate': {
          const da = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
          const db = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
          cmp = da - db;
          break;
        }
        case 'progress':
          cmp = a.progress - b.progress;
          break;
        case 'order':
        default:
          cmp = stages.indexOf(a) - stages.indexOf(b);
          break;
      }
      return sort.asc ? cmp : -cmp;
    });

    return result;
  }, [stages, filter, sort]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSort = (field: SortField) => {
    setSort((prev) => ({
      field,
      asc: prev.field === field ? !prev.asc : true,
    }));
  };

  const filterOptions: { label: string; value: WorkflowStage['status'] | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'in-progress' },
    { label: 'Blocked', value: 'blocked' },
    { label: 'Completed', value: 'completed' },
  ];

  if (stages.length === 0) return null;

  const renderStageRow = (stage: WorkflowStage, isActive: boolean, isMobile: boolean) => {
    const health = getStageHealth(stage);
    const overdue = stage.dueDate ? isDateOverdue(stage.dueDate) : false;
    const isExpanded = expandedIds.has(stage.id);
    const ChevronIcon = isExpanded
      ? () => (
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )
      : () => (
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 3l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );

    const rowContent = (
      <>
        <div
          className={`flex items-center cursor-pointer ${
            overdue && !isMobile ? 'border-l-2 border-l-danger-500' : ''
          } ${isActive ? 'ring-2 ring-primary-500 bg-primary-50/30' : ''} ${
            isExpanded ? 'bg-surface-50' : ''
          } transition-all duration-200`}
          onClick={() => {
            toggleExpand(stage.id);
            onStageClick?.(stage.id);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleExpand(stage.id);
              onStageClick?.(stage.id);
            }
          }}
        >
          <span
            className={`h-3 w-3 rounded-full shrink-0 ml-4 ${statusDotClasses[stage.status]} ${
              isActive ? 'animate-pulse' : ''
            }`}
          />

          <div className="px-4 py-3 min-w-32 flex items-center gap-2">
            <div>
              <span className="text-sm font-medium text-text-900">{stage.name}</span>
              {stage.dueDate && (
                <span className={`text-xs flex items-center gap-1 mt-0.5 ${overdue ? 'text-danger-500' : 'text-text-500'}`}>
                  {overdue && (
                    <svg className="h-3 w-3 shrink-0 text-danger-500" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="6" cy="6" r="4" />
                      <path d="M6 3.5v2.5l1 1" strokeLinecap="round" />
                    </svg>
                  )}
                  {stage.dueDate}
                  {overdue && <span className="text-xs text-danger-500 font-medium">Overdue</span>}
                </span>
              )}
            </div>
            {health !== 'healthy' && (
              <span className={`text-xs rounded-full px-3 py-1 font-medium shrink-0 ${healthBadgeClasses[health]}`}>
                {health === 'critical' ? 'Critical' : 'Warning'}
              </span>
            )}
          </div>

          {showOwners && stage.owner && (
            <div className="px-4 py-3 min-w-32">
              <OwnerInfo owner={stage.owner} />
            </div>
          )}
          {showOwners && !stage.owner && (
            <div className="px-4 py-3 min-w-32">
              <span className="text-xs text-text-400">—</span>
            </div>
          )}

          {showProgress && <ProgressSection stage={stage} />}

          <div className="px-4 py-3 flex items-center gap-2 shrink-0">
            {isActive ? (
              <ActiveStageActions stage={stage} />
            ) : (
              <StageActions stage={stage} />
            )}
            <span className="text-text-400">
              <ChevronIcon />
            </span>
          </div>
        </div>

        {isExpanded && <ExpandedContent stage={stage} />}
      </>
    );

    return (
      <div key={stage.id} role="listitem" className="border-b border-surface-100 last:border-0">
        {rowContent}
      </div>
    );
  };

  return (
    <div
      role="list"
      aria-label="Workflow Stages"
      className={`rounded-xl border border-surface-200 bg-white overflow-hidden ${className}`}
    >
      <div className="px-4 py-3 border-b border-surface-100 flex flex-wrap items-center gap-2">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-all duration-200 ${
              filter === opt.value
                ? 'bg-primary-500 text-white'
                : 'bg-surface-100 text-text-500 hover:bg-surface-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-4">
          <SortHeader label="Order" field="order" currentSort={sort} onToggle={toggleSort} />
          <SortHeader label="Status" field="status" currentSort={sort} onToggle={toggleSort} />
          <SortHeader label="Due Date" field="dueDate" currentSort={sort} onToggle={toggleSort} />
          <SortHeader label="Progress" field="progress" currentSort={sort} onToggle={toggleSort} />
        </div>
      </div>

      <div className="hidden md:block">
        {filteredStages.length === 0 ? (
          <EmptyState title="No stages" description="No stages match the selected filter." />
        ) : (
          filteredStages.map((stage) => {
            const isActive = activeStageId === stage.id;
            return (
              <div key={stage.id}>{renderStageRow(stage, isActive, false)}</div>
            );
          })
        )}
      </div>

      <div className="md:hidden p-3 flex flex-col gap-3">
        {filteredStages.length === 0 ? (
          <EmptyState title="No stages" description="No stages match the selected filter." />
        ) : (
          filteredStages.map((stage) => {
            const isActive = activeStageId === stage.id;
            const health = getStageHealth(stage);
            const overdue = stage.dueDate ? isDateOverdue(stage.dueDate) : false;
            const isExpanded = expandedIds.has(stage.id);

            return (
              <div
                key={stage.id}
                className={`rounded-lg border border-surface-200 bg-white overflow-hidden ${
                  isActive ? 'ring-2 ring-primary-500' : ''
                } ${overdue ? 'border-l-2 border-l-danger-500' : ''} ${
                  isExpanded ? 'bg-surface-50' : ''
                }`}
              >
                <div
                  className="flex items-start gap-3 p-3 cursor-pointer"
                  onClick={() => {
                    toggleExpand(stage.id);
                    onStageClick?.(stage.id);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleExpand(stage.id);
                      onStageClick?.(stage.id);
                    }
                  }}
                >
                  <span
                    className={`h-3 w-3 rounded-full shrink-0 mt-1 ${statusDotClasses[stage.status]} ${
                      isActive ? 'animate-pulse' : ''
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-text-900">{stage.name}</span>
                      {health !== 'healthy' && (
                        <span className={`text-xs rounded-full px-3 py-1 font-medium ${healthBadgeClasses[health]}`}>
                          {health === 'critical' ? 'Critical' : 'Warning'}
                        </span>
                      )}
                      {isActive ? (
                        <ActiveStageActions stage={stage} />
                      ) : (
                        <StageActions stage={stage} />
                      )}
                    </div>
                    {stage.dueDate && (
                      <span className={`text-xs flex items-center gap-1 mt-0.5 ${overdue ? 'text-danger-500' : 'text-text-500'}`}>
                        {overdue && (
                          <svg className="h-3 w-3 shrink-0 text-danger-500" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="6" cy="6" r="4" />
                            <path d="M6 3.5v2.5l1 1" strokeLinecap="round" />
                          </svg>
                        )}
                        {stage.dueDate}
                        {overdue && <span className="text-xs text-danger-500 font-medium">Overdue</span>}
                      </span>
                    )}
                    {showOwners && (
                      <div className="mt-2">
                        {stage.owner ? (
                          <OwnerInfo owner={stage.owner} />
                        ) : (
                          <span className="text-xs text-text-400">—</span>
                        )}
                      </div>
                    )}
                    {showProgress && (
                      <div className="mt-2">
                        <ProgressSection stage={stage} />
                      </div>
                    )}
                  </div>
                  <span className="text-text-400 mt-1 shrink-0">
                    {isExpanded ? (
                      <svg className="h-4 w-4" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 3l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                </div>
                {isExpanded && <ExpandedContent stage={stage} />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
