export type LangId = 'javascript' | 'python';
export type Level = 'Mudah' | 'Sedang' | 'Sulit';
export type Mode = 'code' | 'quiz';
export type CompareMode = 'exact' | 'float' | 'unordered';

export interface Tema {
  slug: string;
  label: string;
  mode: Mode;
  order: number;
  desc: string;
}

export interface Language {
  id: LangId;
  label: string;
  short: string;
  ext: string;
  prefix: string;
  runnable: boolean;
  timeoutMs: number;
  indent: string;
  comment: string;
  naming: 'camelCase' | 'snake_case';
  types: Record<string, string>;
}

export interface LevelMeta {
  id: Level;
  slug: string;
  label: string;
  order: number;
}

export interface Meta {
  dataVersion: string;
  builtAt: string;
  temas: Tema[];
  languages: Language[];
  levels: LevelMeta[];
}

export interface ProblemSummary {
  id: string;
  title: string;
  tema: string;
  level: Level;
  tags: string[];
  langs: LangId[];
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuizSummary {
  id: string;
  title: string;
  tema: string;
  level: Level;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface FnSig {
  name: string;
  params: { name: string; type: string }[];
  returns: string;
}

export interface TestCase {
  args: unknown[];
  expected: unknown;
  hidden?: boolean;
}

export interface Problem {
  id: string;
  revision: number;
  tema: string;
  level: Level;
  title: string;
  desc: string;
  tags: string[];
  function: FnSig;
  tests: TestCase[];
  compare: CompareMode;
  hints: string[];
  commonMistakes: { text: string; failsTest?: number }[];
  solutions: Partial<Record<string, string>>;
  explanationHtml: string;
  createdAt: string;
  updatedAt: string;
}

export interface Quiz {
  id: string;
  revision: number;
  lang: LangId;
  tema: string;
  level: Level;
  title: string;
  code: string;
  answer: string;
  explain: string;
  concepts: string[];
  createdAt: string;
  updatedAt: string;
}

/** Hasil satu kasus uji setelah dibandingkan. */
export interface CaseResult {
  index: number;
  hidden: boolean;
  args: unknown[];
  expected: unknown;
  ok: boolean;
  value?: unknown;
  error?: string;
  pass: boolean;
}

export interface RunOutcome {
  lang: LangId;
  cases: CaseResult[];
  passed: number;
  total: number;
  logs: string;
  /** Error yang menggagalkan semua kasus (syntax error, waktu habis, fungsi tidak ada). */
  fatal?: string;
  at: number;
}
