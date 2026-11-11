// Program uji Go yang bisa dijalankan sendiri (go run / go.dev/play).
// Go belum punya runtime di browser, jadi kode pengguna digabung dengan main() berisi semua kasus uji.
import type { Problem } from './types';
import { callStr, lit } from './format';

/** Buang `package ...` di kode pengguna; program uji menulis `package main` sendiri. */
function stripPackage(code: string): string {
  return code.replace(/^package\s+\w+\s*;?[ \t]*$/m, '');
}

/** Ubah teks bebas menjadi raw string Go yang aman (backtick tidak boleh ada di dalamnya). */
function rawStr(s: string): string {
  return s.includes('`') ? JSON.stringify(s) : '`' + s + '`';
}

export function goTestProgram(problem: Problem, code: string): string {
  const fn = problem.function;
  const types = fn.params.map((p) => p.type);
  const mode = problem.compare || 'exact';
  let hiddenNo = 0;
  const cases = problem.tests
    .map((t, i) => {
      const label = t.hidden ? `tersembunyi #${++hiddenNo}` : `#${i + 1}`;
      const call = callStr(fn.name, t.args, 'go', types);
      return `\tngodingUji(${JSON.stringify(label)}, ${rawStr(call)}, ${lit(t.expected, 'go', fn.returns)}, func() any { return ${call} })`;
    })
    .join('\n');

  return `// Program uji Ngoding5: ${problem.title} (${problem.id})
// Jalankan: simpan sebagai main.go lalu \`go run main.go\`, atau tempel di https://go.dev/play
package main

import (
\tngodingFmt "fmt"
\tngodingReflect "reflect"
\tngodingSort "sort"
)

// ===== kode kamu =====

${stripPackage(code).trim()}

// ===== uji otomatis (jangan diubah) =====

var ngodingLulus, ngodingTotal int

func main() {
${cases}
\tngodingFmt.Printf("\\nSkor %d/%d\\n", ngodingLulus, ngodingTotal)
\tif ngodingLulus == ngodingTotal {
\t\tngodingFmt.Println("Semua kasus lulus. Mantap!")
\t}
}

func ngodingUji(label, panggil string, harap any, jalankan func() any) {
\tngodingTotal++
\tvar hasil, galat any
\tfunc() {
\t\tdefer func() { galat = recover() }()
\t\thasil = jalankan()
\t}()
\tswitch {
\tcase galat != nil:
\t\tngodingFmt.Printf("GAGAL  %s  %s\\n       panic: %v\\n", label, panggil, galat)
\tcase ngodingSama(hasil, harap, ${JSON.stringify(mode)}):
\t\tngodingLulus++
\t\tngodingFmt.Printf("LULUS  %s  %s\\n", label, panggil)
\tdefault:
\t\tngodingFmt.Printf("GAGAL  %s  %s\\n       diharapkan %#v\\n       hasil kamu %#v\\n", label, panggil, harap, hasil)
\t}
}

// ngodingSama membandingkan hasil; slice/map nil dianggap sama dengan yang kosong.
func ngodingSama(a, b any, mode string) bool {
\tva, vb := ngodingReflect.ValueOf(a), ngodingReflect.ValueOf(b)
\tif !va.IsValid() || !vb.IsValid() {
\t\treturn va.IsValid() == vb.IsValid()
\t}
\tif va.Kind() != vb.Kind() {
\t\treturn false
\t}
\tswitch va.Kind() {
\tcase ngodingReflect.Slice:
\t\tif va.Len() != vb.Len() {
\t\t\treturn false
\t\t}
\t\tif mode == "unordered" {
\t\t\tka, kb := make([]string, va.Len()), make([]string, vb.Len())
\t\t\tfor i := 0; i < va.Len(); i++ {
\t\t\t\tka[i] = ngodingFmt.Sprintf("%#v", va.Index(i).Interface())
\t\t\t\tkb[i] = ngodingFmt.Sprintf("%#v", vb.Index(i).Interface())
\t\t\t}
\t\t\tngodingSort.Strings(ka)
\t\t\tngodingSort.Strings(kb)
\t\t\treturn ngodingReflect.DeepEqual(ka, kb)
\t\t}
\t\tfor i := 0; i < va.Len(); i++ {
\t\t\tif !ngodingSama(va.Index(i).Interface(), vb.Index(i).Interface(), mode) {
\t\t\t\treturn false
\t\t\t}
\t\t}
\t\treturn true
\tcase ngodingReflect.Map:
\t\tif va.Len() != vb.Len() {
\t\t\treturn false
\t\t}
\t\tfor _, k := range va.MapKeys() {
\t\t\tw := vb.MapIndex(k)
\t\t\tif !w.IsValid() || !ngodingSama(va.MapIndex(k).Interface(), w.Interface(), mode) {
\t\t\t\treturn false
\t\t\t}
\t\t}
\t\treturn true
\tcase ngodingReflect.Float64:
\t\tif mode == "float" {
\t\t\tx, y := va.Float(), vb.Float()
\t\t\tbatas := 1e-6
\t\t\tif y > 1 || y < -1 {
\t\t\t\tbatas *= max(y, -y)
\t\t\t}
\t\t\treturn max(x-y, y-x) <= batas
\t\t}
\t}
\treturn a == b
}
`;
}
