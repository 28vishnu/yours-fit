/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FITNESS_AI_ENDPOINT?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_GITHUB_REPOSITORY?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
