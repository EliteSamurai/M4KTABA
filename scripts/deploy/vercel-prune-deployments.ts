#!/usr/bin/env tsx
/**
 * Delete all Vercel deployments except the last N (default 2).
 *
 * Requires: VERCEL_TOKEN, VERCEL_PROJECT_ID in env (e.g. from .env.local).
 * Optional: VERCEL_TEAM_ID if the project is under a team.
 *
 * Usage:
 *   pnpm tsx scripts/deploy/vercel-prune-deployments.ts          # keep last 2
 *   pnpm tsx scripts/deploy/vercel-prune-deployments.ts --keep 5
 *   pnpm tsx scripts/deploy/vercel-prune-deployments.ts --dry-run
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const VERCEL_API = 'https://api.vercel.com';

async function listDeployments(opts: {
  token: string;
  projectId: string;
  teamId?: string;
  limit?: number;
  until?: number;
}): Promise<{
  deployments: { uid: string; created: number; url: string | null; state: string }[];
  nextUntil: number | null;
}> {
  const { token, projectId, teamId, limit = 100, until } = opts;
  const params = new URLSearchParams({
    projectId,
    limit: String(limit),
    ...(until != null && { until: String(until) }),
    ...(teamId && { teamId }),
  });
  const res = await fetch(`${VERCEL_API}/v6/deployments?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`List deployments failed: ${res.status} ${t}`);
  }
  const data = await res.json();
  const deployments = (data.deployments || []).map((d: any) => ({
    uid: d.uid,
    created: d.created,
    url: d.url ?? null,
    state: d.state ?? 'UNKNOWN',
  }));
  const nextUntil = data.pagination?.next ?? null;
  return { deployments, nextUntil };
}

async function listAllDeployments(opts: {
  token: string;
  projectId: string;
  teamId?: string;
}): Promise<{ uid: string; created: number; url: string | null; state: string }[]> {
  const all: { uid: string; created: number; url: string | null; state: string }[] = [];
  let until: number | undefined;
  for (;;) {
    const { deployments, nextUntil } = await listDeployments({ ...opts, limit: 100, until });
    all.push(...deployments);
    if (nextUntil == null || deployments.length < 100) break;
    until = nextUntil;
  }
  return all;
}

async function deleteDeployment(opts: {
  token: string;
  deploymentId: string;
  teamId?: string;
}): Promise<void> {
  const { token, deploymentId, teamId } = opts;
  const params = teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';
  const res = await fetch(`${VERCEL_API}/v13/deployments/${deploymentId}${params}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Delete ${deploymentId} failed: ${res.status} ${t}`);
  }
}

function main() {
  const keep = parseInt(process.argv.find((a) => a.startsWith('--keep='))?.split('=')[1] ?? '2', 10);
  const dryRun = process.argv.includes('--dry-run');

  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID ?? process.env.VERCEL_ORG_ID;

  if (!token) {
    console.error('Missing VERCEL_TOKEN. Set it in .env.local or the environment.');
    process.exit(1);
  }
  if (!projectId) {
    console.error('Missing VERCEL_PROJECT_ID. Set it in .env.local or the environment.');
    process.exit(1);
  }

  (async () => {
    console.log(`Listing deployments for project ${projectId} (keeping last ${keep})...`);
    const deployments = await listAllDeployments({ token, projectId, teamId });
    // Newest first
    deployments.sort((a, b) => b.created - a.created);

    const toKeep = deployments.slice(0, keep);
    const toDelete = deployments.slice(keep);

    if (toDelete.length === 0) {
      console.log('Nothing to delete.');
      return;
    }

    console.log(`Keeping ${toKeep.length}:`);
    toKeep.forEach((d, i) => console.log(`  ${i + 1}. ${d.uid} ${d.url ?? '(no url)'} ${d.state}`));
    console.log(`Deleting ${toDelete.length}:`);
    toDelete.forEach((d, i) => console.log(`  ${i + 1}. ${d.uid} ${d.url ?? '(no url)'} ${d.state}`));

    if (dryRun) {
      console.log('\nDry run — no deletions performed.');
      return;
    }

    for (const d of toDelete) {
      await deleteDeployment({ token, deploymentId: d.uid, teamId });
      console.log(`Deleted ${d.uid}`);
    }
    console.log('Done.');
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

main();
