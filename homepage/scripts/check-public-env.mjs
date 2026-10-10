import { loadEnv } from "vite";

const env = loadEnv("production", process.cwd(), ["VITE_", "NEXT_PUBLIC_"]);
const secretNames = Object.keys(env)
  .filter((name) => name !== "VITE_SUPABASE_PUBLISHABLE_KEY")
  .filter((name) => /(?:^|_)(?:API_KEY|KEY|SECRET|TOKEN|PASSWORD)(?:_|$)|SERVICE_ROLE/i.test(name))
  .sort();

if (secretNames.length) {
  console.error(
    `Public build variables must not contain secrets: ${secretNames.join(", ")}. ` +
      "Remove the public prefix and keep credentials in the server environment."
  );
  process.exitCode = 1;
}
