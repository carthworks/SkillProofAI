/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_USE_MSW?: string;
  readonly VITE_FF_LLM_FEEDBACK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
