'use client';

/**
 * AUTH-001 — React hook over AuthorizationService session context.
 * Components must not inspect roleIds or permission matrices directly.
 */

import { useMemo } from 'react';
import { useRoleStore } from '@/stores/role-store';
import { AuthorizationService } from '@/lib/auth/authorization-service';
import type { Permission } from '@releaseflow/core/auth/permissions';

export function usePermissions() {
  const role = useRoleStore((s) => s.role);
  const roleId = useRoleStore((s) => s.roleId);
  const permissions = useRoleStore((s) => s.permissions);
  const loading = useRoleStore((s) => s.loading);
  const organizationId = useRoleStore((s) => s.organizationId);

  return useMemo(
    () => ({
      role,
      roleId,
      permissions,
      loading,
      organizationId,
      can: (p: Permission | string) => AuthorizationService.can(p),
      cannot: (p: Permission | string) => AuthorizationService.cannot(p),
      explain: (p: Permission | string) => AuthorizationService.explain(p),
      isCollaborator: AuthorizationService.isCollaboratorWorkspace(),
      // Business capabilities
      canCreateRelease: AuthorizationService.canCreateRelease(),
      canEditRelease: AuthorizationService.canEditRelease(),
      canDeleteRelease: AuthorizationService.canDeleteRelease(),
      canPublishRelease: AuthorizationService.canPublishRelease(),
      canApproveRelease: AuthorizationService.canApproveRelease(),
      canInviteCollaborators: AuthorizationService.canInviteCollaborators(),
      canInviteUsers: AuthorizationService.canInviteUsers(),
      canManageOrganization: AuthorizationService.canManageOrganization(),
      canViewAdministration: AuthorizationService.canViewAdministration(),
      canAccessAdmin: AuthorizationService.canViewAdministration(),
      canManageAssignments: AuthorizationService.canManageAssignments(),
      canAssignWork: AuthorizationService.canAssignWork(),
      canViewTeamSchedule: AuthorizationService.canViewTeamSchedule(),
      canReschedule: AuthorizationService.canRescheduleAssignments(),
      canRescheduleAssignments: AuthorizationService.canRescheduleAssignments(),
      canViewReadiness: AuthorizationService.canViewReadiness(),
      canViewReleaseReadiness: AuthorizationService.canViewReleaseReadiness(),
      canGoNoGo: AuthorizationService.canGoNoGo(),
      canComment: AuthorizationService.canComment(),
      canReviewAssignment: AuthorizationService.canReviewAssignment(),
      canViewNotifications: AuthorizationService.canViewNotifications(),
      canManageUsers: AuthorizationService.canManageUsers(),
      canViewAnalytics: AuthorizationService.canViewAnalytics(),
      canManagePeople: AuthorizationService.canManagePeople(),
      canViewReleases: AuthorizationService.canViewReleases(),
      canViewAssignments: AuthorizationService.canViewAssignments(),
      canViewPersonalSchedule: AuthorizationService.canViewPersonalSchedule(),
    }),
    [role, roleId, permissions, loading, organizationId],
  );
}
