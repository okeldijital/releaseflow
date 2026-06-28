interface RingConfig {
  r: number;
  strokeWidth: number;
}

interface SizeConfig {
  dimension: number;
  center: number;
  rings: [RingConfig, RingConfig, RingConfig, RingConfig];
  valueClass: string;
  labelClass: string;
}

const RING_DIMENSIONS = {
  lg: 200,
  md: 144,
  sm: 96,
} as const;

const sizeConfigs: Record<'lg' | 'md' | 'sm', SizeConfig> = {
  lg: {
    dimension: RING_DIMENSIONS.lg,
    center: RING_DIMENSIONS.lg / 2,
    rings: [
      { r: 76, strokeWidth: 9 },
      { r: 64, strokeWidth: 8 },
      { r: 53, strokeWidth: 7 },
      { r: 43, strokeWidth: 6 },
    ],
    valueClass: 'text-3xl',
    labelClass: 'text-sm',
  },
  md: {
    dimension: RING_DIMENSIONS.md,
    center: RING_DIMENSIONS.md / 2,
    rings: [
      { r: 54, strokeWidth: 7 },
      { r: 45, strokeWidth: 6 },
      { r: 37, strokeWidth: 5 },
      { r: 30, strokeWidth: 4 },
    ],
    valueClass: 'text-2xl',
    labelClass: 'text-xs',
  },
  sm: {
    dimension: RING_DIMENSIONS.sm,
    center: RING_DIMENSIONS.sm / 2,
    rings: [
      { r: 36, strokeWidth: 5 },
      { r: 30, strokeWidth: 4 },
      { r: 25, strokeWidth: 3 },
      { r: 21, strokeWidth: 2 },
    ],
    valueClass: 'text-xl',
    labelClass: 'text-xs',
  },
};

function getRingColor(value: number, thresholds: [number, number]) {
  const [greenMin, orangeMin] = thresholds;
  if (value >= greenMin) {
    return { stroke: 'text-success-500', track: 'text-success-100' };
  }
  if (value >= orangeMin) {
    return { stroke: 'text-warning-500', track: 'text-warning-100' };
  }
  return { stroke: 'text-danger-500', track: 'text-danger-100' };
}

function getHealthLabel(score: number): string {
  if (score >= 80) return 'Healthy';
  if (score >= 60) return 'Attention';
  if (score >= 40) return 'At Risk';
  return 'Critical';
}

function getHealthLabelClass(score: number): string {
  if (score >= 80) return 'text-success-500';
  if (score >= 60) return 'text-warning-500';
  if (score >= 40) return 'text-warning-500';
  return 'text-danger-500';
}

function getReadinessLabel(score: number): string {
  return score >= 70 ? 'Ready' : 'Incomplete';
}

function getTimelineLabel(score: number): string {
  if (score >= 80) return 'On Track';
  if (score >= 50) return 'Slipping';
  return 'At Risk';
}

function renderRing(
  cx: number,
  cy: number,
  r: number,
  strokeWidth: number,
  value: number,
  colorTrack: string,
  colorStroke: string,
) {
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;
  return (
    <>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        className={`fill-none ${colorTrack}`}
        strokeWidth={strokeWidth}
        stroke="currentColor"
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        className={`fill-none ${colorStroke} transition-[stroke-dashoffset] duration-300 ease-out`}
        strokeWidth={strokeWidth}
        stroke="currentColor"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </>
  );
}

interface HealthRingProps {
  size?: 'lg' | 'md' | 'sm';
  health: number;
  readiness: number;
  timelineConfidence: number;
  workflowCompletion: number;
  currentStage?: string;
  daysUntilRelease?: number;
  className?: string;
}

export function HealthRing({
  size = 'md',
  health,
  readiness,
  timelineConfidence,
  workflowCompletion,
  currentStage,
  daysUntilRelease,
  className = '',
}: HealthRingProps) {
  const config = sizeConfigs[size];
  const { center } = config;

  const healthClamped = Math.max(0, Math.min(100, health));
  const readinessClamped = Math.max(0, Math.min(100, readiness));
  const timelineClamped = Math.max(0, Math.min(100, timelineConfidence));
  const workflowClamped = Math.max(0, Math.min(100, workflowCompletion));

  const healthLabel = getHealthLabel(healthClamped);
  const healthLabelClass = getHealthLabelClass(healthClamped);
  const readinessLabel = getReadinessLabel(readinessClamped);
  const timelineLabel = getTimelineLabel(timelineClamped);

  const healthColors = getRingColor(healthClamped, [80, 40]);
  const readinessColors = getRingColor(readinessClamped, [70, 40]);
  const timelineColors = getRingColor(timelineClamped, [80, 50]);
  const workflowColors = getRingColor(workflowClamped, [90, 60]);

  const ariaParts: string[] = [
    `Release Health: ${Math.round(healthClamped)} percent - ${healthLabel}.`,
    `Readiness: ${Math.round(readinessClamped)} percent - ${readinessLabel}.`,
    `Timeline Confidence: ${Math.round(timelineClamped)} percent - ${timelineLabel}.`,
    `Workflow Completion: ${Math.round(workflowClamped)} percent.`,
  ];

  return (
    <div
      role="img"
      aria-label={ariaParts.join(' ')}
      className={`relative group inline-flex items-center justify-center ${className}`}
    >
      <svg
        width={config.dimension}
        height={config.dimension}
        viewBox={`0 0 ${config.dimension} ${config.dimension}`}
        className="-rotate-90"
      >
        {renderRing(
          center,
          center,
          config.rings[3].r,
          config.rings[3].strokeWidth,
          workflowClamped,
          workflowColors.track,
          workflowColors.stroke,
        )}
        {renderRing(
          center,
          center,
          config.rings[2].r,
          config.rings[2].strokeWidth,
          timelineClamped,
          timelineColors.track,
          timelineColors.stroke,
        )}
        {renderRing(
          center,
          center,
          config.rings[1].r,
          config.rings[1].strokeWidth,
          readinessClamped,
          readinessColors.track,
          readinessColors.stroke,
        )}
        {renderRing(
          center,
          center,
          config.rings[0].r,
          config.rings[0].strokeWidth,
          healthClamped,
          healthColors.track,
          healthColors.stroke,
        )}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className={`font-bold text-text-900 ${config.valueClass}`}>
          {Math.round(healthClamped)}%
        </span>
        {size !== 'sm' && (
          <span className={`font-medium mt-0.5 ${config.labelClass} ${healthLabelClass}`}>
            {healthLabel}
          </span>
        )}
        {size === 'lg' && currentStage && (
          <span className="bg-primary-50 text-primary-700 text-xs rounded-full px-3 py-1 mt-1">
            {currentStage}
          </span>
        )}
        {size === 'lg' && daysUntilRelease !== undefined && (
          <span className="text-xs text-text-400 mt-0.5">
            {daysUntilRelease} day{daysUntilRelease === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
        <div className="bg-text-900 text-surface-50 text-xs rounded-lg px-2 py-1 shadow-raised whitespace-nowrap">
          <div>Health: {Math.round(healthClamped)}% — {healthLabel}</div>
          <div>Readiness: {Math.round(readinessClamped)}% — {readinessLabel}</div>
          <div>Timeline: {Math.round(timelineClamped)}% — {timelineLabel}</div>
          <div>Workflow: {Math.round(workflowClamped)}%</div>
        </div>
      </div>
    </div>
  );
}
