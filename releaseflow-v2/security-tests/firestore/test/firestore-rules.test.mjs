import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

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
