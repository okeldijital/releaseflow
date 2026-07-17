import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/server/firebase-admin';
import { renderInvitationEmail } from '@/lib/email/templates/InvitationEmail';
import { sendEmail, buildEmailParams } from '@/lib/email/email-service';

export const runtime = 'nodejs';

import { normalizeInvitation } from '@/lib/invitation-repository';
import { PLATFORM_ROLE_LABELS } from '@/lib/platform-roles';

function buildInvitationUrl(token: string): string {
  const base = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!base) {
    throw new Error('APP_URL is not configured.');
  }
  return `${base.replace(/\/$/, '')}/invite/${token}`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authHeader = request.headers.get('authorization') ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await getAdminAuth().verifyIdToken(token);
    const uid = decoded.uid;

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing invitation id.' }, { status: 400 });
    }

    const db = getAdminDb();

    const invitationSnap = await db.collection('invitations').doc(id).get();
    if (!invitationSnap.exists) {
      return NextResponse.json({ error: 'Invitation not found.' }, { status: 404 });
    }
    const invitationRaw = { id: invitationSnap.id, ...invitationSnap.data() } as Record<string, unknown> & { id: string };
    const invitation = normalizeInvitation(invitationRaw);

    const membershipSnap = await db
      .collection('memberships')
      .where('userId', '==', uid)
      .where('organizationId', '==', invitation.organizationId)
      .where('status', '==', 'active')
      .limit(1)
      .get();
    if (membershipSnap.empty) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: 'Invitation is no longer pending.' }, { status: 409 });
    }

    const orgSnap = await db.collection('organizations').doc(invitation.organizationId).get();
    if (!orgSnap.exists) {
      return NextResponse.json({ error: 'Organization not found.' }, { status: 404 });
    }
    const org = orgSnap.data() as { name: string };

    const inviterSnap = await db.collection('users').doc(invitation.invitedByUserId).get();
    const inviter = inviterSnap.exists
      ? (inviterSnap.data() as { displayName?: string })
      : undefined;

    const inviterName = invitation.invitedByName?.trim() || inviter?.displayName?.trim() || 'Someone';
    const roleName = invitation.professionalRole || PLATFORM_ROLE_LABELS[invitation.platformRole] || invitation.platformRole;
    const acceptUrl = buildInvitationUrl(invitation.token);

    console.log('[Invitation Verification] ✓ Email link generated', {
      invitationId: invitation.id,
      tokenLength: invitation.token?.length ?? 0,
      tokenPrefix: invitation.token?.slice(0, 8),
      acceptUrl,
      inviteeEmail: invitation.inviteeEmail,
    });

    const html = renderInvitationEmail({
      orgName: org.name,
      inviterName,
      roleName,
      acceptUrl,
      expiresInDays: 7,
    });

    try {
      await sendEmail(
        buildEmailParams(
          invitation.inviteeEmail,
          `You're invited to join ${org.name}`,
          html,
        ),
      );
    } catch (emailErr) {
      const message = emailErr instanceof Error ? emailErr.message : 'Email delivery failed';
      return NextResponse.json({ success: false, error: message }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Email delivery failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
