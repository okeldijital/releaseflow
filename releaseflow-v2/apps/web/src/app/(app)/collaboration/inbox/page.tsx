'use client';

import { CollaborationModule } from '../_components/collaboration-module';

/**
 * BUILD-220C — /collaboration/inbox
 * Underlying implementation: existing notifications inbox (not a new product).
 */
export default function CollaborationInboxPage() {
  return <CollaborationModule tab="inbox" />;
}
