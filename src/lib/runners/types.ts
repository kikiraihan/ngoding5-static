export interface RawRun {
  results?: { ok: boolean; value?: unknown; error?: string }[];
  logs: string;
  fatal?: string;
  timeout?: boolean;
}
