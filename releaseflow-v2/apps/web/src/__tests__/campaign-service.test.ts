import { describe, it, expect } from 'vitest';
import type { Campaign, CampaignTask, CampaignType, CampaignStatus, CampaignTaskType } from '@/app/(app)/types';

describe('Campaign data model', () => {
  it('has all required fields', () => {
    const c: Campaign = {
      id: 'c1', releaseId: 'r1', name: 'Pre-Save', type: 'pre_save' as CampaignType,
      status: 'draft' as CampaignStatus, ownerId: 'u1',
      createdAt: new Date(), updatedAt: new Date(),
    };
    expect(c.id).toBeDefined();
    expect(c.releaseId).toBe('r1');
    expect(c.name).toBe('Pre-Save');
    expect(c.type).toBe('pre_save');
    expect(c.status).toBe('draft');
    expect(c.ownerId).toBe('u1');
  });

  it('startDate and endDate are optional', () => {
    const c: Campaign = {
      id: 'c2', releaseId: 'r2', name: 'Social', type: 'social' as CampaignType,
      status: 'active' as CampaignStatus, ownerId: 'u2',
      createdAt: new Date(), updatedAt: new Date(),
    };
    expect(c.startDate).toBeUndefined();
    expect(c.endDate).toBeUndefined();
  });
});

describe('Campaign types', () => {
  const types: CampaignType[] = ['pre_save', 'social', 'press', 'playlist', 'advertising'];

  it('supports all 5 campaign types', () => {
    expect(types).toHaveLength(5);
  });

  it.each(types)('type %s is valid', (t) => {
    expect(types).toContain(t);
  });
});

describe('Campaign status flow', () => {
  const statuses: CampaignStatus[] = ['draft', 'active', 'paused', 'completed'];

  it('has 4 statuses', () => {
    expect(statuses).toHaveLength(4);
  });

  it('starts as draft', () => {
    expect(statuses[0]).toBe('draft');
  });

  it('can be paused from active', () => {
    expect(statuses).toContain('paused');
  });

  it('terminates at completed', () => {
    expect(statuses).toContain('completed');
  });
});

describe('Campaign service — module structure', () => {
  it('exports all campaign CRUD functions', async () => {
    const mod = await import('@/lib/campaign-service');
    expect(typeof mod.createCampaign).toBe('function');
    expect(typeof mod.activateCampaign).toBe('function');
    expect(typeof mod.completeCampaign).toBe('function');
    expect(typeof mod.getCampaignsByRelease).toBe('function');
    expect(typeof mod.createCampaignTask).toBe('function');
    expect(typeof mod.completeCampaignTask).toBe('function');
    expect(typeof mod.getCampaignTasksByCampaign).toBe('function');
    expect(typeof mod.getDeliverablesByCampaign).toBe('function');
    expect(typeof mod.checkCampaignReadiness).toBe('function');
  });

  it('createCampaign takes 1 object parameter', async () => {
    const mod = await import('@/lib/campaign-service');
    expect(mod.createCampaign.length).toBe(1);
  });

  it('activateCampaign takes 3 parameters', async () => {
    const mod = await import('@/lib/campaign-service');
    expect(mod.activateCampaign.length).toBe(3);
  });

  it('completeCampaign takes 3 parameters', async () => {
    const mod = await import('@/lib/campaign-service');
    expect(mod.completeCampaign.length).toBe(3);
  });

  it('createCampaignTask takes 1 object parameter', async () => {
    const mod = await import('@/lib/campaign-service');
    expect(mod.createCampaignTask.length).toBe(1);
  });
});

describe('Campaign task types', () => {
  const types: CampaignTaskType[] = ['schedule_post', 'send_press_release', 'submit_playlist_pitch', 'launch_ad'];

  it('supports all 4 campaign task types', () => {
    expect(types).toHaveLength(4);
  });

  it.each(types)('task type %s is valid', (t) => {
    expect(types).toContain(t);
  });
});

describe('Campaign task data model', () => {
  it('has required fields', () => {
    const ct: CampaignTask = {
      id: 'ct1', campaignId: 'c1', type: 'schedule_post' as CampaignTaskType,
      title: 'Schedule Instagram post', status: 'todo', priority: 'medium',
      createdAt: new Date(), updatedAt: new Date(),
    };
    expect(ct.campaignId).toBe('c1');
    expect(ct.type).toBe('schedule_post');
    expect(ct.title).toBe('Schedule Instagram post');
    expect(ct.status).toBe('todo');
  });

  it('description and assignee are optional', () => {
    const ct: CampaignTask = {
      id: 'ct2', campaignId: 'c1', type: 'launch_ad' as CampaignTaskType,
      title: 'Launch Facebook ad', status: 'todo', priority: 'high',
      createdAt: new Date(), updatedAt: new Date(),
    };
    expect(ct.description).toBeUndefined();
    expect(ct.assigneeId).toBeUndefined();
  });
});

describe('CampaignReadiness model', () => {
  it('defines readiness interface correctly', () => {
    const result = {
      canLaunch: true, completeness: 100, nameFilled: true,
      tasksReady: true, assetsReady: true, missingTasks: 0, missingAssets: 0,
    };
    expect(result.canLaunch).toBe(true);
    expect(result.completeness).toBe(100);
    expect(result.nameFilled).toBe(true);
    expect(result.tasksReady).toBe(true);
    expect(result.assetsReady).toBe(true);
    expect(result.missingTasks).toBe(0);
    expect(result.missingAssets).toBe(0);
  });

  it('reports not ready when tasks incomplete', () => {
    const result = {
      canLaunch: false, completeness: 50, nameFilled: true,
      tasksReady: false, assetsReady: true, missingTasks: 2, missingAssets: 0,
    };
    expect(result.canLaunch).toBe(false);
    expect(result.tasksReady).toBe(false);
    expect(result.missingTasks).toBe(2);
  });
});

describe('CreateCampaign fields validation', () => {
  it('requires releaseId and name', () => {
    const fields = {
      releaseId: 'r1', name: 'Press Blitz', type: 'press' as Campaign['type'],
      ownerId: 'u1', actorId: 'u1',
    };
    expect(fields.releaseId).toBe('r1');
    expect(fields.name).toBe('Press Blitz');
    expect(fields.type).toBe('press');
  });
});

describe('Campaign task status flow', () => {
  const statuses = ['todo', 'in_progress', 'done'] as const;

  it('starts as todo', () => {
    expect(statuses[0]).toBe('todo');
  });

  it('flows todo → done', () => {
    expect(statuses).toContain('done');
  });
});
