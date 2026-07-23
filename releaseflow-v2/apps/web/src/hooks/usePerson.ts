'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOrgStore } from '@/stores/org-store';
import {
  fetchPerson,
  fetchPeople,
  checkPersonReadiness,
  fetchAssignmentSummary,
  toPersonCardModels,
} from '@/lib/person-service';
import type {
  PersonRecord,
  PersonReadinessResult,
  AssignmentSummary,
  PersonCardModel,
} from '@/lib/person-service';
import { getActivityByEntity } from '@/lib/activity-service';
import type { ActivityEventRecord } from '@/lib/activity-service';
import { toPersonOptions, type PersonOption } from '@/lib/person-field-picker-logic';

export type { PersonOption, PersonCardModel };

export function usePerson(personId: string | undefined) {
  const { activeOrgId } = useOrgStore();
  const [person, setPerson] = useState<PersonRecord | null>(null);
  const [activities, setActivities] = useState<ActivityEventRecord[]>([]);
  const [readiness, setReadiness] = useState<PersonReadinessResult | null>(null);
  const [assignmentSummary, setAssignmentSummary] = useState<AssignmentSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!personId || !activeOrgId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [p, acts, r, asgn] = await Promise.all([
        fetchPerson(personId),
        getActivityByEntity(activeOrgId, 'release', personId),
        checkPersonReadiness(personId),
        fetchAssignmentSummary(personId),
      ]);
      setPerson(p);
      setReadiness(r);
      setAssignmentSummary(asgn);

      const activityEvents =
        acts.length > 0
          ? acts
          : await getActivityByEntity(activeOrgId, 'track', personId);
      setActivities(activityEvents);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [personId, activeOrgId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    person,
    activities,
    readiness,
    assignmentSummary,
    loading,
    refresh: load,
  };
}

export function usePeople() {
  const [people, setPeople] = useState<PersonRecord[]>([]);
  const [personCards, setPersonCards] = useState<PersonCardModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { activeOrgId, orgVersion } = useOrgStore();

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!activeOrgId) {
        setPeople([]);
        setPersonCards([]);
        setLoading(false);
        return;
      }
      if (!opts?.silent) setLoading(true);
      try {
        const data = await fetchPeople(activeOrgId);
        setPeople(data);
        setPersonCards(await toPersonCardModels(activeOrgId, data));
      } catch {
        setPeople([]);
        setPersonCards([]);
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [activeOrgId],
  );

  useEffect(() => {
    void load();
  }, [load, orgVersion]);

  const filteredPeople = useMemo(() => {
    if (statusFilter === 'all') return people;
    return people.filter((p) => p.status === statusFilter);
  }, [people, statusFilter]);

  const filteredPersonCards = useMemo(() => {
    if (statusFilter === 'all') return personCards;
    return personCards.filter((p) => p.status === statusFilter);
  }, [personCards, statusFilter]);

  const personOptions = useMemo(
    () => toPersonOptions(people.filter((p) => p.status !== 'archived')),
    [people],
  );

  /** BUILD-018 — picker/search results as compact-ready card models (active only). */
  const pickerCardModels = useMemo(
    () => personCards.filter((p) => p.status !== 'archived'),
    [personCards],
  );

  return {
    people: filteredPeople,
    allPeople: people,
    personCards: filteredPersonCards,
    allPersonCards: personCards,
    pickerCardModels,
    personOptions,
    loading,
    refresh: load,
    statusFilter,
    setStatusFilter,
  };
}
