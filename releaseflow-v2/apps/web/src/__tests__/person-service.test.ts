import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  checkPersonReadiness,
  createNewPerson,
  editPerson,
  archivePerson,
  restorePerson,
  fetchAssignmentSummary,
} from '@/lib/person-service';
import * as repo from '@/lib/people-repository';

vi.mock('@/lib/people-repository', () => ({
  createPerson: vi.fn(),
  updatePerson: vi.fn(),
  getPerson: vi.fn(),
  getPeopleByOrg: vi.fn(),
  archivePerson: vi.fn(),
  restorePerson: vi.fn(),
  updateSkills: vi.fn(),
  getAssignmentSummary: vi.fn(),
}));

describe('person service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createNewPerson', () => {
    it('throws if display name is empty', async () => {
      await expect(createNewPerson({ organizationId: 'o1', displayName: '', email: 'test@test.com', primaryRole: 'Engineer' }))
        .rejects.toThrow('Display name is required');
    });

    it('throws if email is empty', async () => {
      await expect(createNewPerson({ organizationId: 'o1', displayName: 'Jane', email: '', primaryRole: 'Engineer' }))
        .rejects.toThrow('Email is required');
    });

    it('throws if org ID is empty', async () => {
      await expect(createNewPerson({ organizationId: '', displayName: 'Jane', email: 'j@t.com', primaryRole: 'Engineer' }))
        .rejects.toThrow('Organization ID is required');
    });

    it('calls createPerson with valid fields', async () => {
      const mock = vi.mocked(repo.createPerson);
      mock.mockResolvedValue({ id: 'p1', displayName: 'Jane', email: 'j@t.com', primaryRole: 'Engineer', organizationId: 'o1', status: 'active' });
      const result = await createNewPerson({ organizationId: 'o1', displayName: 'Jane', email: 'j@t.com', primaryRole: 'Engineer' });
      expect(result.id).toBe('p1');
      expect(mock).toHaveBeenCalledOnce();
    });
  });

  describe('archivePerson', () => {
    it('throws if already archived', async () => {
      vi.mocked(repo.getPerson).mockResolvedValue({ id: 'p1', displayName: 'Jane', status: 'archived', organizationId: 'o1', email: 'j@t.com', primaryRole: 'Engineer' });
      await expect(archivePerson('p1')).rejects.toThrow('already archived');
    });

    it('archives active person', async () => {
      vi.mocked(repo.getPerson).mockResolvedValue({ id: 'p1', displayName: 'Jane', status: 'active', organizationId: 'o1', email: 'j@t.com', primaryRole: 'Engineer' });
      await archivePerson('p1');
      expect(repo.archivePerson).toHaveBeenCalledWith('p1');
    });
  });

  describe('restorePerson', () => {
    it('throws if not archived', async () => {
      vi.mocked(repo.getPerson).mockResolvedValue({ id: 'p1', displayName: 'Jane', status: 'active', organizationId: 'o1', email: 'j@t.com', primaryRole: 'Engineer' });
      await expect(restorePerson('p1')).rejects.toThrow('not archived');
    });

    it('restores archived person', async () => {
      vi.mocked(repo.getPerson).mockResolvedValue({ id: 'p1', displayName: 'Jane', status: 'archived', organizationId: 'o1', email: 'j@t.com', primaryRole: 'Engineer' });
      await restorePerson('p1');
      expect(repo.restorePerson).toHaveBeenCalledWith('p1');
    });
  });

  describe('editPerson', () => {
    it('calls updatePerson', async () => {
      await editPerson('p1', { displayName: 'Jane Updated' });
      expect(repo.updatePerson).toHaveBeenCalledWith('p1', { displayName: 'Jane Updated' });
    });
  });

  describe('checkPersonReadiness', () => {
    it('returns 0% if person not found', async () => {
      vi.mocked(repo.getPerson).mockResolvedValue(null);
      const result = await checkPersonReadiness('p1');
      expect(result.ready).toBe(false);
      expect(result.percentage).toBe(0);
    });

    it('returns percentages based on profile completion', async () => {
      vi.mocked(repo.getPerson).mockResolvedValue({
        id: 'p1', displayName: 'Jane', email: 'j@t.com', primaryRole: 'Engineer',
        department: 'Production', skills: ['Producer'], avatarUrl: 'https://example.com/avatar.jpg',
        organizationId: 'o1', status: 'active',
      });
      const result = await checkPersonReadiness('p1');
      expect(result.percentage).toBe(100);
      expect(result.ready).toBe(true);
    });

    it('detects missing fields', async () => {
      vi.mocked(repo.getPerson).mockResolvedValue({
        id: 'p1', displayName: 'Jane', email: 'j@t.com', primaryRole: '—',
        organizationId: 'o1', status: 'active',
      });
      const result = await checkPersonReadiness('p1');
      expect(result.ready).toBe(false);
      expect(result.missing).toContain('Profile Photo');
      expect(result.missing).toContain('Department');
    });
  });

  describe('fetchAssignmentSummary', () => {
    it('returns summary from repo', async () => {
      vi.mocked(repo.getAssignmentSummary).mockResolvedValue({ current: 2, completed: 5, overdue: 1, upcoming: 3 });
      const result = await fetchAssignmentSummary('p1');
      expect(result.current).toBe(2);
      expect(result.completed).toBe(5);
    });
  });
});
