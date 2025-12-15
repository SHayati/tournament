import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

function isTruthy(value: string | undefined | null) {
  if (!value) return false;
  return ['1', 'true', 'yes', 'y', 'on'].includes(String(value).trim().toLowerCase());
}

function quoteIdentifier(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

async function safeQuery<T = unknown>(sql: string) {
  const prisma = new PrismaClient();
  try {
    const rows = (await prisma.$queryRawUnsafe(sql)) as T;
    return { ok: true as const, rows };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    };
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

export async function GET(req: Request) {
  // Hard gate: endpoint is disabled unless explicitly enabled.
  if (!isTruthy(process.env.DEBUG_DB_INSPECT)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, 'dev.db'),
    path.join(cwd, 'prisma', 'dev.db'),
  ];

  const pragmaDatabaseList = await safeQuery<Array<{ seq: number; name: string; file: string }>>(
    'PRAGMA database_list;'
  );

  const tablesQuery = await safeQuery<Array<{ name: string }>>(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
  );

  const tables = tablesQuery.ok ? tablesQuery.rows.map((r) => r.name) : [];

  // Keep output bounded.
  const limitedTables = tables.slice(0, 25);

  const tableCounts: Record<string, unknown> = {};
  const tableSamples: Record<string, unknown> = {};

  for (const tableName of limitedTables) {
    const qTable = quoteIdentifier(tableName);

    const countResult = await safeQuery<Array<{ count: number }>>(
      `SELECT COUNT(*) as count FROM ${qTable};`
    );
    tableCounts[tableName] = countResult.ok ? countResult.rows?.[0]?.count ?? null : countResult.error;

    const sampleResult = await safeQuery<unknown>(
      `SELECT * FROM ${qTable} LIMIT 3;`
    );
    tableSamples[tableName] = sampleResult.ok ? sampleResult.rows : sampleResult.error;
  }

  const existsMap: Record<string, boolean> = {};
  for (const p of candidates) existsMap[p] = fs.existsSync(p);

  // If PRAGMA reveals an absolute file path, check that too.
  if (pragmaDatabaseList.ok) {
    for (const row of pragmaDatabaseList.rows) {
      if (row?.file && typeof row.file === 'string' && row.file !== ':memory:') {
        existsMap[row.file] = fs.existsSync(row.file);
      }
    }
  }

  return NextResponse.json({
    now: new Date().toISOString(),
    node: process.version,
    platform: process.platform,
    cwd,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL,
    },
    fileCandidates: existsMap,
    pragmaDatabaseList,
    tablesQuery,
    tableCounts,
    tableSamples,
    notes: [
      "If PRAGMA database_list shows a different file than prisma/dev.db, Prisma is pointing at a different SQLite file.",
      "SQLite will create a new empty DB file automatically if the target path doesn't exist.",
      "If you see 'Unable to open the database file', it's usually a bad path or missing permissions/mount.",
    ],
  });
}
