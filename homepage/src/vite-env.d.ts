/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly NEXT_PUBLIC_SUPABASE_URL?: string;
  readonly NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_AUTH_CALLBACK_URL?: string;
  readonly VITE_ROUTER_BASENAME?: string;
  readonly VITE_ANTHROPIC_API_KEY?: string;
  readonly VITE_ANTHROPIC_API_URL?: string;
  readonly VITE_ANTHROPIC_MODEL?: string;
  readonly VITE_LLM_API_KEY?: string;
  readonly VITE_LLM_BASE_URL?: string;
  readonly VITE_LLM_MODEL?: string;
  readonly VITE_OPENAI_COMPAT_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
