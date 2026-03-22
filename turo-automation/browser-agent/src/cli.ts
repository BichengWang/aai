import { runCommand } from './commands.js';

async function main() {
  const command = process.argv[2];

  if (!command) {
    throw new Error('Missing command');
  }

  process.stdout.write(`${JSON.stringify(await runCommand(command), null, 2)}\n`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${JSON.stringify({ ok: false, error: message }, null, 2)}\n`);
  process.exit(1);
});
