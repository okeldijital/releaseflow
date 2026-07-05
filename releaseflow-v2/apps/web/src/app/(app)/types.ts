export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: unknown;
}

export type ReleaseType = 'single' | 'ep' | 'album' | 'remix' | 'compilation';

export type RecordingType = 'original' | 'remix';
export type ReleaseStatus = 'draft' | 'planning' | 'in_production' | 'on_hold' | 'ready_for_distribution' | 'released' | 'cancelled' | 'archived';

export interface Release {
  id: string;
  title: string;
  displayTitle?: string;
  version?: string;
  releaseType: ReleaseType;
  status: ReleaseStatus;
  organizationId: string;
  createdBy: string;
  targetReleaseDate?: unknown;
  estimatedReleaseDate?: unknown;
  upc?: string;
  catalogNumber?: string;
  label?: string;
  copyright?: string;
  pLine?: string;
  cLine?: string;
  genre?: string;
  subgenre?: string;
  language?: string;
  explicit?: boolean;
  createdAt: unknown;
  updatedAt?: unknown;
}

export type WorkflowStatus = 'not_started' | 'in_progress' | 'blocked' | 'review' | 'approved' | 'completed';
export type HealthStatus = 'green' | 'amber' | 'red';

export interface Workflow {
  id: string;
  releaseId: string;
  templateId: ReleaseType;
  status: WorkflowStatus;
  progress: number;
  health?: HealthStatus;
  currentStageId: string | null;
  startedAt: unknown;
  updatedAt: unknown;
}

export type StageStatus = 'not_started' | 'in_progress' | 'blocked' | 'review' | 'approved' | 'completed';

export interface Stage {
  id: string;
  workflowId: string;
  name: string;
  order: number;
  status: StageStatus;
  dueDate?: unknown;
  assignedRole?: string;
  startedAt?: unknown;
  completedAt?: unknown;
}

export interface Track {
  id: string;
  title: string;
  releaseId: string;
  version?: string;
  duration?: number;
  isrc?: string;
  writers?: string[];
  publishers?: string[];
  producers?: string[];
  featuredArtists?: string[];
  remixers?: string[];
  createdAt: unknown;
}

export interface Contributor {
  id: string;
  userId: string;
  releaseId: string;
  contributorRole: string;
  createdAt: unknown;
}

export type TrackStatus = 'draft' | 'active' | 'archived';

export type ArtistType = 'original_artist' | 'remix_artist' | 'cover_artist' | 'producer' | 'dj' | 'band' | 'label';
export type ArtistStatus = 'active' | 'inactive';

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  spotify?: string;
  soundcloud?: string;
  website?: string;
}

export interface Artist {
  id: string;
  name: string;
  slug: string;
  artistType: ArtistType;
  bio?: string;
  country?: string;
  genres?: string[];
  imageUrl?: string;
  socialLinks?: SocialLinks;
  status: ArtistStatus;
  createdAt: unknown;
  updatedAt: unknown;
}

export type ReleaseArtistRole = 'primary' | 'featured' | 'remixer' | 'original_artist' | 'cover_performer' | 'guest_artist';

export interface ReleaseArtist {
  id: string;
  releaseId: string;
  artistId: string;
  role: ReleaseArtistRole;
  isPrimary: boolean;
}

export type CreditRole = 'producer' | 'composer' | 'lyricist' | 'arranger' | 'mix_engineer' | 'mastering_engineer' | 'remixer' | 'featured_artist';

export interface TrackCredit {
  id: string;
  trackId: string;
  artistId: string;
  role: CreditRole;
}

export interface Membership {
  id: string;
  organizationId: string;
  userId: string;
  roleId: string;
  status: string;
  invitedBy?: string;
  createdAt: unknown;
}

export interface Role {
  id: string;
  name: string;
  organizationId: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  stageId: string;
  releaseId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  dueDate?: unknown;
  entityType?: string;
  entityId?: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: unknown;
}

export type DeliverableType = 'audio' | 'artwork' | 'document' | 'metadata' | 'video' | 'other';
export type DeliverableStatus = 'draft' | 'in_review' | 'approved' | 'rejected' | 'archived';

export interface Deliverable {
  id: string;
  releaseId: string;
  stageId?: string;
  taskId?: string;
  campaignId?: string;
  type: DeliverableType;
  title: string;
  status: DeliverableStatus;
  version?: string;
  ownerId: string;
  createdAt: unknown;
}

export type RequirementStatus = 'required' | 'submitted' | 'approved';

export interface ReleaseRequirement {
  id: string;
  releaseId: string;
  name: string;
  status: RequirementStatus;
  createdAt: unknown;
  updatedAt: unknown;
}

export interface AssetReference {
  id: string;
  deliverableId: string;
  provider: string;
  url: string;
  filename: string;
  uploadedAt: unknown;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type LifecycleState = 'draft' | 'requested' | 'under_review' | 'approved' | 'rejected' | 'changes_requested';
export type ApprovalEntityType = 'release' | 'track' | 'specification' | 'asset' | 'deliverable';

export interface ApprovalRequest {
  id: string;
  deliverableId: string;
  requesterId: string;
  approverId: string;
  status: ApprovalStatus;
  entityType?: ApprovalEntityType;
  entityId?: string;
  lifecycleState?: LifecycleState;
  dueDate?: string | null;
  notes?: string | null;
  respondedAt?: unknown;
  createdAt: unknown;
  organizationId?: string;
}

export type NotificationType =
  | 'approval.requested'
  | 'approval.responded'
  | 'task.assigned'
  | 'mention'
  | 'approval'
  | 'comment'
  | 'assignment'
  | 'deadline';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  archived: boolean;
  referenceId?: string;
  referenceType?: string;
  createdAt: unknown;
}

export type DistributionPackageStatus = 'draft' | 'generated' | 'sent' | 'completed';

export interface DistributionPackage {
  id: string;
  releaseId: string;
  status: DistributionPackageStatus;
  completeness: number;
  metadataReady: boolean;
  deliverablesReady: boolean;
  requirementsReady: boolean;
  generatedAt: unknown;
  createdAt: unknown;
}

export type CampaignType = 'pre_save' | 'social' | 'press' | 'playlist' | 'advertising';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';

export interface Campaign {
  id: string;
  releaseId: string;
  name: string;
  type: CampaignType;
  startDate?: unknown;
  endDate?: unknown;
  status: CampaignStatus;
  ownerId: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export type CampaignTaskType = 'schedule_post' | 'send_press_release' | 'submit_playlist_pitch' | 'launch_ad';
export type CampaignTaskStatus = 'todo' | 'in_progress' | 'done';

export interface CampaignTask {
  id: string;
  campaignId: string;
  type: CampaignTaskType;
  title: string;
  description?: string;
  status: CampaignTaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  dueDate?: unknown;
  createdAt: unknown;
  updatedAt: unknown;
}

export type RightsHolderType = 'artist' | 'publisher' | 'label' | 'pro' | 'distributor';

export interface RightsHolder {
  id: string;
  name: string;
  type: RightsHolderType;
  contact?: string;
  territory?: string;
  createdAt: unknown;
  updatedAt: unknown;
}

export type OwnershipType = 'master' | 'publishing' | 'mechanical' | 'neighbouring';

export interface ReleaseOwnership {
  id: string;
  releaseId: string;
  rightsHolderId: string;
  ownershipType: OwnershipType;
  percentage: number;
}

export interface TrackOwnership {
  id: string;
  trackId: string;
  rightsHolderId: string;
  ownershipType: OwnershipType;
  percentage: number;
}

export type BudgetStatus = 'on_budget' | 'at_risk' | 'over_budget';

export interface ReleaseBudget {
  id: string;
  releaseId: string;
  plannedBudget: number;
  actualCost: number;
  remainingBudget: number;
  variance: number;
  status: BudgetStatus;
  createdAt: unknown;
  updatedAt: unknown;
}

export type CostCategory = 'production' | 'mixing' | 'mastering' | 'artwork' | 'video' | 'marketing' | 'pr' | 'advertising' | 'distribution';
export type CostItemStatus = 'planned' | 'incurred' | 'paid';

export interface CostItem {
  id: string;
  releaseId: string;
  category: CostCategory;
  vendor?: string;
  description: string;
  amount: number;
  status: CostItemStatus;
  dueDate?: unknown;
  createdAt: unknown;
}

export interface ResourceAssignment {
  id: string;
  userId: string;
  releaseId: string;
  role: string;
  capacity: number;
  utilization: number;
}

export type AlertPriority = 'high' | 'medium' | 'low';

export interface OperationalAlert {
  id: string;
  releaseId: string;
  rule: string;
  priority: AlertPriority;
  message: string;
  entityType: string;
  entityId: string;
  resolved: boolean;
  createdAt: unknown;
}

export type DependencyCategory = 'legal' | 'licensing' | 'distribution' | 'approval' | 'vendor' | 'marketing';
export type DependencyStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'overdue';

export interface Dependency {
  id: string;
  releaseId: string;
  title: string;
  category: DependencyCategory;
  owner: string;
  status: DependencyStatus;
  dueDate?: unknown;
  blocking: boolean;
  createdAt: unknown;
  updatedAt: unknown;
}

export type ActivityType =
  | 'release.created'
  | 'workflow.generated'
  | 'stage.started'
  | 'stage.completed'
  | 'task.created'
  | 'task.completed'
  | 'task.assigned'
  | 'task.reassigned'
  | 'task.unassigned'
  | 'comment.added'
  | 'deliverable.created'
  | 'deliverable.updated'
  | 'deliverable.approved'
  | 'deliverable.rejected'
  | 'approval.requested'
  | 'approval.approved'
  | 'approval.rejected'
  | 'notification.created'
  | 'notification.read'
  | 'notification.archived'
  | 'campaign.created'
  | 'campaign.activated'
  | 'campaign.completed'
  | 'campaign.task.created'
  | 'campaign.task.completed'
  | 'release.status.changed';

export interface Activity {
  id: string;
  type: ActivityType;
  releaseId: string;
  workflowId?: string;
  stageId?: string;
  actorId: string;
  metadata?: Record<string, unknown>;
  createdAt: unknown;
}
