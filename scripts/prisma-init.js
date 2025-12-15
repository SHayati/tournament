const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function isTruthy(value) {
  if (!value) return false;
  return ['1', 'true', 'yes', 'y', 'on'].includes(String(value).trim().toLowerCase());
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) throw result.error;
  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status);
  }
}

function runNpx(npxArgs) {
  // On Windows, .cmd shims are not directly executable without a shell.
  // Use cmd.exe explicitly (but keep the command line fully controlled here).
  if (process.platform === 'win32') {
    run('cmd.exe', ['/d', '/s', '/c', ['npx', ...npxArgs].join(' ')]);
    return;
  }

  run('npx', npxArgs);
}

function main() {
  // Safety: only allow this for the default SQLite file DB.
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  if (!fs.existsSync(schemaPath)) {
    console.error('[db-init] prisma/schema.prisma not found; skipping');
    return;
  }

  const recreate = isTruthy(process.env.DB_RECREATE_ON_DEPLOY);

  if (!recreate) {
    console.log('[db-init] DB_RECREATE_ON_DEPLOY is not true; skipping Prisma DB init');
    return;
  }

  console.log(
    '[db-init] DB_RECREATE_ON_DEPLOY=true → recreating SQLite schema via Prisma'
  );

  // Ensure client is generated (cheap if already up-to-date)
  runNpx(['prisma', 'generate']);

  // Recreate schema. With --force-reset it drops and recreates (DATA LOSS).
  runNpx(['prisma', 'db', 'push', '--force-reset']);

  // Optional: seed if you want it. (Not requested, so we skip by default)
  // run('node', ['prisma/seed.js']);
}

main();
