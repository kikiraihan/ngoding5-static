// Tanda tangan fungsi & template awal (starter) per bahasa (FE-13).
import type { FnSig, Language, LangId } from './types';

export function toSnake(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z])([A-Z][a-z])/g, '$1_$2').toLowerCase();
}

export function fnNameFor(name: string, lang: LangId | string): string {
  return lang === 'python' ? toSnake(name) : name;
}

function typeOf(t: string, lang: Language): string {
  return lang.types[t] ?? t;
}

/** Nilai nol per tipe Go, untuk `return` di template awal agar kode langsung bisa dikompilasi. */
function goZero(t: string): string {
  if (t === 'int' || t === 'float') return '0';
  if (t === 'bool') return 'false';
  if (t === 'str') return '""';
  return 'nil';
}

/** Tanda tangan ringkas untuk ditampilkan: fizzBuzz(n: number) → string[] */
export function signature(fn: FnSig, lang: Language): string {
  if (lang.id === 'go') return `func ${fn.name}(${fn.params.map((p) => `${p.name} ${typeOf(p.type, lang)}`).join(', ')}) ${typeOf(fn.returns, lang)}`;
  const params = fn.params.map((p) => `${fnNameFor(p.name, lang.id)}: ${typeOf(p.type, lang)}`).join(', ');
  return lang.id === 'python'
    ? `def ${fnNameFor(fn.name, 'python')}(${params}) -> ${typeOf(fn.returns, lang)}`
    : `function ${fn.name}(${params}): ${typeOf(fn.returns, lang)}`;
}

export function starter(fn: FnSig, lang: Language): string {
  if (lang.id === 'go') {
    return (
      `// Boleh menambah import di atas fungsi, mis. import "strings".\n\n` +
      `${signature(fn, lang)} {\n\t// tulis kode kamu di sini\n\treturn ${goZero(fn.returns)}\n}\n`
    );
  }
  if (lang.id === 'python') {
    const params = fn.params.map((p) => toSnake(p.name)).join(', ');
    const doc = fn.params.map((p) => `${toSnake(p.name)}: ${typeOf(p.type, lang)}`).join(', ');
    return `def ${toSnake(fn.name)}(${params}):\n    # ${doc} -> ${typeOf(fn.returns, lang)}\n    # tulis kode kamu di sini\n    pass\n`;
  }
  const jsdoc = [
    '/**',
    ...fn.params.map((p) => ` * @param {${typeOf(p.type, lang)}} ${p.name}`),
    ` * @returns {${typeOf(fn.returns, lang)}}`,
    ' */',
  ].join('\n');
  return `${jsdoc}\nfunction ${fn.name}(${fn.params.map((p) => p.name).join(', ')}) {\n  // tulis kode kamu di sini\n}\n`;
}
