const isProductionNetlifyBuild =
  process.env.NETLIFY === "true" && process.env.CONTEXT === "production";

if (isProductionNetlifyBuild) {
  const viteUrl = process.env.VITE_SUPABASE_URL?.trim();
  const viteKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  const urlValue =
    viteUrl && viteUrl !== "https://your-project-ref.supabase.co"
      ? viteUrl
      : process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const keyValue =
    viteKey && viteKey !== "your-publishable-key"
      ? viteKey
      : process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  let validUrl = false;

  try {
    const url = new URL(urlValue);
    validUrl =
      url.protocol === "https:" &&
      url.hostname !== "your-project-ref.supabase.co" &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash;
  } catch {
    // A missing or malformed URL fails the check below.
  }

  if (!validUrl || !keyValue || keyValue === "your-publishable-key") {
    console.error(
      "Production auth build blocked: set a valid VITE_SUPABASE_URL and " +
        "VITE_SUPABASE_PUBLISHABLE_KEY in Netlify's build environment."
    );
    process.exitCode = 1;
  }
}
