'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOrgStore } from '@/stores/org-store';
import {
  fetchPerson, fetchPeople,
  checkPersonReadiness, fetchAssignmentSummary,
} from '@/lib/person-service';
import type { PersonRecord, PersonReadinessResult, AssignmentSummary } from '@/lib/person-service';
import { getActiveMembershipsForPerson } from '@/lib/person-membership-repository';
import type { PersonMembershipRecord } from '@/lib/person-membership-repository';
import { getActivityByEntity } from '@/lib/activity-service';
import type { ActivityEventRecord } from '@/lib/activity-service';
import { toPersonOptions, type PersonOption } from '@/lib/person-field-picker-logic';

export type { PersonOption };

export function usePerson(personId: string | undefined) {
  const { activeOrgId } = useOrgStore();
  const [person, setPerson] = useState<PersonRecord | null>(null);
  const [memberships, setMemberships] = useState<PersonMembershipRecord[]>([]);
  const [activities, setActivities] = useState<ActivityEventRecord[]>([]);
  const [readiness, setReadiness] = useState<PersonReadinessResult | null>(null);
  const [assignmentSummary, setAssignmentSummary] = useState<AssignmentSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!personId || !activeOrgId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [p, mems, acts, r, asgn] = await Promise.all([
        fetchPerson(personId),
        getActiveMembershipsForPerson(personId),
        getActivityByEntity('release', personId),
        checkPersonReadiness(personId),
        fetchAssignmentSummary(personId),
      ]);
      setPerson(p);
      setMemberships(mems);
      setReadiness(r);
      setAssignmentSummary(asgn);

      const activityEvents = acts.length > 0 ? acts : await getActivityByEntity('track', personId);
      setActivities(activityEvents);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [personId, activeOrgId]);

  useEffect(() => { void load(); }, [load]);

  return {
    person, memberships, activities, readiness, assignmentSummary,
    loading, refresh: load,
  };
}

export function usePeople() {
  const [people, setPeople] = useState<PersonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { activeOrgId, orgVersion } = useOrgStore();

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!activeOrgId) {
      setPeople([]);
      setLoading(false);
      return;
    }
    if (!opts?.silent) setLoading(true);
    try {
      const data = await fetchPeople(activeOrgId);
      setPeople(data);
    } catch {
      setPeople([]);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => { void load(); }, [load, orgVersion]);

  const filteredPeople = useMemo(() => {
    if (statusFilter === 'all') return people;
    return people.filter((p) => p.status === statusFilter);
  }, [people, statusFilter]);

  const personOptions = useMemo(
    () => toPersonOptions(people.filter((p) => p.status !== 'archived')),
    [people],
  );

  return {
    people: filteredPeople,
    allPeople: people,
    personOptions,
    loading,
    refresh: load,
    statusFilter,
    setStatusFilter,
  };
}
