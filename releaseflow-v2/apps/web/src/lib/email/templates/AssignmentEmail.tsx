import React from 'react';

interface AssignmentEmailProps {
  assignedByName: string;
  entityType: string;
  entityTitle: string;
  role: string;
  url: string;
  orgName?: string;
}

export function AssignmentEmail({
  assignedByName, entityType, entityTitle,
  role, url, orgName,
}: AssignmentEmailProps) {
  return (
    <div style={{
      maxWidth: '560px', margin: '0 auto', padding: '24px',
      backgroundColor: '#ffffff', borderRadius: '12px',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <div style={{ textAlign: 'center' as const, padding: '8px 0' }}>
        <span style={{ fontSize: '20px', fontWeight: 800, color: '#6366f1', letterSpacing: '-0.5px' }}>ReleaseFlow</span>
      </div>
      <div style={{ padding: '32px 0 16px', textAlign: 'center' as const }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a2e', margin: '0 0 8px' }}>New Assignment</h1>
        {orgName && <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>{orgName}</p>}
      </div>
      <p style={{ fontSize: '16px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }}>
        {assignedByName} assigned you as <strong>{role}</strong> on <strong>{entityTitle}</strong> ({entityType}).
      </p>
      <div style={{ textAlign: 'center' as const, margin: '0 0 24px' }}>
        <a href={url} style={{ display: 'inline-block', padding: '12px 32px', backgroundColor: '#6366f1', color: '#ffffff', textDecoration: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600 }}>View Details</a>
      </div>
      <div style={{ padding: '24px 0', textAlign: 'center' as const, borderTop: '1px solid #e5e7eb', marginTop: '24px' }}>
        {orgName && <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 4px' }}>{orgName}</p>}
        <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>&mdash; ReleaseFlow</p>
      </div>
    </div>
  );
}

export function renderAssignmentEmail(props: AssignmentEmailProps): string {
  return `<!DOCTYPE html>
<html><body><div style="max-width:560px;margin:0 auto;padding:24px;background:#fff;border-radius:12px;font-family:sans-serif">
<div style="text-align:center;padding:8px 0"><span style="font-size:20px;font-weight:800;color:#6366f1">ReleaseFlow</span></div>
<div style="padding:32px 0 16px;text-align:center"><h1 style="font-size:24px;font-weight:700;color:#1a1a2e;margin:0 0 8px">New Assignment</h1></div>
<p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 16px">${props.assignedByName} assigned you as <strong>${props.role}</strong> on <strong>${props.entityTitle}</strong> (${props.entityType}).</p>
<div style="text-align:center;margin:0 0 24px"><a href="${props.url}" style="display:inline-block;padding:12px 32px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">View Details</a></div>
<div style="padding:24px 0;text-align:center;border-top:1px solid #e5e7eb;margin-top:24px"><p style="font-size:12px;color:#9ca3af;margin:0">&mdash; ReleaseFlow</p></div>
</div></body></html>`;
}
