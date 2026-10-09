import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";

const PROJECT_ID = "releaseflow-rules-test";
const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST;
const PRODUCTION_PROJECT_IDS = new Set(["releaseflow-prod"]);

let env;

function requireIsolatedEmulator() {
  if (!EMULATOR_HOST || !/^127\.0\.0\.1:8080$/.test(EMULATOR_HOST) && !/^localhost:8080$/.test(EMULATOR_HOST)) {
    throw new Error("SAFETY STOP: FIRESTORE_EMULATOR_HOST must explicitly be 127.0.0.1:8080 or localhost:8080.");
  }
  if (!PROJECT_ID || PRODUCTION_PROJECT_IDS.has(PROJECT_ID)) {
    throw new Error("SAFETY STOP: a dedicated non-production emulator project ID is required.");
  }
}

before(async () => {
  requireIsolatedEmulator();
  const rules = await readFile(resolve(process.cwd(), "../../firestore.rules"), "utf8");
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { host: "127.0.0.1", port: 8080, rules },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "organizations/org-a"), { ownerId: "user-owner-a", name: "Synthetic Org A" });
    await setDoc(doc(db, "organizations/org-b"), { ownerId: "user-owner-b", name: "Synthetic Org B" });
    await setDoc(doc(db, "organizations/org-a/members/user-owner-a"), {
      userId: "user-owner-a", organizationId: "org-a", roleId: "owner", status: "active"
    });
    await setDoc(doc(db, "organizations/org-a/members/user-member-a"), {
      userId: "user-member-a", organizationId: "org-a", roleId: "collaborator", status: "active"
    });
    await setDoc(doc(db, "organizations/org-b/members/user-owner-b"), {
      userId: "user-owner-b", organizationId: "org-b", roleId: "owner", status: "active"
    });
    await setDoc(doc(db, "memberships/member-owner-a"), {
      userId: "user-owner-a", organizationId: "org-a", roleId: "owner", status: "active"
    });
    await setDoc(doc(db, "memberships/member-member-a"), {
      userId: "user-member-a", organizationId: "org-a", roleId: "collaborator", status: "active"
    });
    await setDoc(doc(db, "memberships/member-owner-b"), {
      userId: "user-owner-b", organizationId: "org-b", roleId: "owner", status: "active"
    });
    await setDoc(doc(db, "releases/release-a"), {
      organizationId: "org-a", createdBy: "user-owner-a", lifecycle: "draft", version: 1, title: "Synthetic Release A"
    });
    await setDoc(doc(db, "releases/release-b"), {
      organizationId: "org-b", createdBy: "user-owner-b", lifecycle: "draft", version: 1, title: "Synthetic Release B"
    });
    await setDoc(doc(db, "workflows/workflow-b"), {
      organizationId: "org-b", name: "Synthetic Workflow B"
    });
    await setDoc(doc(db, "assets/asset-b"), {
      organizationId: "org-b", name: "Synthetic Asset B"
    });
    await setDoc(doc(db, "people/person-b"), {
      organizationId: "org-b", userId: "user-owner-b", email: "person-b@example.com", displayName: "Org B Person"
    });
    await setDoc(doc(db, "activity_events/event-b"), {
      organizationId: "org-b", actorId: "user-owner-b", action: "release.updated", entityType: "release", entityId: "release-b"
    });
    await setDoc(doc(db, "activity_events/event-a"), {
      organizationId: "org-a", actorId: "user-owner-a", action: "release.created", entityType: "release", entityId: "release-a"
    });
    await setDoc(doc(db, "invitations/invite-token-a"), {
      token: "invite-token-a",
      status: "pending",
      organizationId: "org-a",
      organizationName: "Synthetic Org A",
      inviteeEmail: "invitee@example.com",
      platformRole: "collaborator",
      invitedByUserId: "user-owner-a",
      createdAt: 1,
      expiresAt: 4102444800000
    });
  });
});

after(async () => {
  if (env) await env.cleanup();
});

test("non-member cannot self-create an active elevated organization member index", async () => {
  const db = env.authenticatedContext("user-outsider-b").firestore();
  await assertFails(setDoc(doc(db, "organizations/org-a/members/user-outsider-b"), {
    userId: "user-outsider-b", organizationId: "org-a", roleId: "administrator", status: "active"
  }));
});

test("non-member cannot self-create an owner membership", async () => {
  const db = env.authenticatedContext("user-outsider-b").firestore();
  await assertFails(setDoc(doc(db, "memberships/attacker-owner"), {
    userId: "user-outsider-b", organizationId: "org-a", roleId: "owner", status: "active"
  }));
});

test("organization B owner cannot read organization A release", async () => {
  const db = env.authenticatedContext("user-owner-b").firestore();
  await assertFails(getDoc(doc(db, "releases/release-a")));
});

test("organization B owner cannot update or delete organization A release", async () => {
  const db = env.authenticatedContext("user-owner-b").firestore();
  await assertFails(updateDoc(doc(db, "releases/release-a"), { title: "Unauthorized edit" }));
  await assertFails(deleteDoc(doc(db, "releases/release-a")));
});

test("organization A collaborator cannot read organization B release", async () => {
  const db = env.authenticatedContext("user-member-a").firestore();
  await assertFails(getDoc(doc(db, "releases/release-b")));
});

test("organization A collaborator cannot mutate organization B release", async () => {
  const db = env.authenticatedContext("user-member-a").firestore();
  await assertFails(updateDoc(doc(db, "releases/release-b"), { title: "Unauthorized edit" }));
  await assertFails(deleteDoc(doc(db, "releases/release-b")));
});

test("unauthenticated client cannot read private release", async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, "releases/release-a")));
});

test("owner can read own organization's release", async () => {
  const db = env.authenticatedContext("user-owner-a").firestore();
  await assertSucceeds(getDoc(doc(db, "releases/release-a")));
});

test("authenticated non-member cannot read a representative broadly guarded workflow", async () => {
  const db = env.authenticatedContext("user-outsider-b").firestore();
  await assertFails(getDoc(doc(db, "workflows/workflow-b")));
});

test("authenticated non-member cannot read a representative broadly guarded asset", async () => {
  const db = env.authenticatedContext("user-outsider-b").firestore();
  await assertFails(getDoc(doc(db, "assets/asset-b")));
});

test("owner can create an organization and its owner membership index", async () => {
  const db = env.authenticatedContext("new-owner").firestore();
  await assertSucceeds(setDoc(doc(db, "organizations/org-new"), {
    ownerId: "new-owner", name: "Synthetic New Org"
  }));
  await assertSucceeds(setDoc(doc(db, "memberships/membership-new-owner"), {
    organizationId: "org-new",
    userId: "new-owner",
    roleId: "owner",
    status: "active"
  }));
  await assertSucceeds(setDoc(doc(db, "organizations/org-new/members/new-owner"), {
    userId: "new-owner",
    roleId: "owner",
    status: "active"
  }));
});

test("invitee with matching authenticated email can accept an invitation and create membership records atomically", async () => {
  const db = env.authenticatedContext("user-invitee", { email: "invitee@example.com" }).firestore();
  const batch = writeBatch(db);
  const now = Date.now();
  batch.update(doc(db, "invitations/invite-token-a"), {
    status: "accepted",
    acceptedAt: now,
    updatedAt: now
  });
  batch.set(doc(db, "memberships/membership-invitee"), {
    organizationId: "org-a",
    userId: "user-invitee",
    roleId: "contributor",
    status: "active",
    invitationToken: "invite-token-a"
  });
  batch.set(doc(db, "organizations/org-a/members/user-invitee"), {
    userId: "user-invitee",
    roleId: "contributor",
    status: "active",
    invitationToken: "invite-token-a"
  });
  await assertSucceeds(batch.commit());
});

test("invitee with mismatched authenticated email cannot accept an invitation", async () => {
  const db = env.authenticatedContext("user-wrong-email", { email: "wrong@example.com" }).firestore();
  const batch = writeBatch(db);
  const now = Date.now();
  batch.update(doc(db, "invitations/invite-token-a"), {
    status: "accepted",
    acceptedAt: now,
    updatedAt: now
  });
  batch.set(doc(db, "memberships/membership-wrong-email"), {
    organizationId: "org-a",
    userId: "user-wrong-email",
    roleId: "contributor",
    status: "active",
    invitationToken: "invite-token-a"
  });
  batch.set(doc(db, "organizations/org-a/members/user-wrong-email"), {
    userId: "user-wrong-email",
    roleId: "contributor",
    status: "active",
    invitationToken: "invite-token-a"
  });
  await assertFails(batch.commit());
});

test("organization A collaborator cannot read organization B people records", async () => {
  const db = env.authenticatedContext("user-member-a").firestore();
  await assertFails(getDoc(doc(db, "people/person-b")));
});

test("organization A collaborator cannot read organization B activity events", async () => {
  const db = env.authenticatedContext("user-member-a").firestore();
  await assertFails(getDoc(doc(db, "activity_events/event-b")));
});

test("organization A member can read own organization's activity events", async () => {
  const db = env.authenticatedContext("user-member-a").firestore();
  await assertSucceeds(getDoc(doc(db, "activity_events/event-a")));
});

test("organization A member cannot alter or delete immutable activity events", async () => {
  const db = env.authenticatedContext("user-member-a").firestore();
  await assertFails(updateDoc(doc(db, "activity_events/event-a"), { action: "tampered" }));
  await assertFails(deleteDoc(doc(db, "activity_events/event-a")));
});

test("organization A member cannot create an activity event in organization B", async () => {
  const db = env.authenticatedContext("user-member-a").firestore();
  await assertFails(setDoc(doc(db, "activity_events/forged-event"), {
    organizationId: "org-b", actorId: "user-member-a", action: "release.deleted", entityId: "release-b"
  }));
});
