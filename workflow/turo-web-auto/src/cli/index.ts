import 'dotenv/config';
import { runCommand } from '../core/commands.js';

async function main() {
  const [, , command, ...args] = process.argv;

  if (!command) {
    console.error('Usage: tsx src/cli/index.ts <command>');
    process.exit(1);
  }

  const result = await runCommand(command, args);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${JSON.stringify({ ok: false, error: message }, null, 2)}\n`);
  process.exit(1);
});
