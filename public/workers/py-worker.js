/* Worker klasik: menjalankan kode Python peserta dengan Skulpt.
   Tidak dibundel Vite karena memakai importScripts() dari CDN. */
/* global Sk, importScripts */
var loaded = false;

function errText(e) {
  if (!e) return 'Error tak dikenal';
  if (e.toString && e.tp$name) return e.toString();
  if (e instanceof Error) return e.name + ': ' + e.message;
  try {
    return String(e);
  } catch (_) {
    return 'Error tak dikenal';
  }
}

function readFile(x) {
  if (Sk.builtinFiles === undefined || Sk.builtinFiles.files[x] === undefined) throw "File tidak ditemukan: '" + x + "'";
  return Sk.builtinFiles.files[x];
}

function toPy(v) {
  if (v === null || v === undefined) return Sk.builtin.none.none$;
  if (Array.isArray(v)) return new Sk.builtin.list(v.map(toPy));
  if (typeof v === 'object') {
    var kv = [];
    Object.keys(v).forEach(function (k) {
      kv.push(new Sk.builtin.str(k), toPy(v[k]));
    });
    return new Sk.builtin.dict(kv);
  }
  if (typeof v === 'boolean') return v ? Sk.builtin.bool.true$ : Sk.builtin.bool.false$;
  if (typeof v === 'number') return Number.isInteger(v) ? new Sk.builtin.int_(v) : new Sk.builtin.float_(v);
  return new Sk.builtin.str(String(v));
}

function toJs(v) {
  if (v === undefined || v === null || v === Sk.builtin.none.none$) return null;
  if (v instanceof Sk.builtin.bool) return v.v === 1 || v === Sk.builtin.bool.true$;
  if (v instanceof Sk.builtin.set || v instanceof Sk.builtin.frozenset) throw new Error('set tidak bisa dibandingkan, kembalikan list');
  if (v instanceof Sk.builtin.list || v instanceof Sk.builtin.tuple) return v.v.map(toJs);
  if (v instanceof Sk.builtin.dict) {
    var out = {};
    var it = Sk.abstr.iter(v);
    for (var k = it.tp$iternext(); k !== undefined; k = it.tp$iternext()) {
      out[String(Sk.ffi.remapToJs(k))] = toJs(v.mp$subscript(k));
    }
    return out;
  }
  return Sk.ffi.remapToJs(v);
}

self.onmessage = function (ev) {
  var d = ev.data;
  if (d.type === 'load') {
    if (loaded) return self.postMessage({ type: 'ready' });
    try {
      var base = 'https://cdn.jsdelivr.net/npm/skulpt@' + d.version + '/dist/';
      importScripts(base + 'skulpt.min.js', base + 'skulpt-stdlib.js');
      loaded = true;
      self.postMessage({ type: 'ready' });
    } catch (e) {
      self.postMessage({ type: 'load-error', error: errText(e) });
    }
    return;
  }
  if (d.type === 'run') run(d);
};

function run(d) {
  var logs = [];
  Sk.configure({
    output: function (t) {
      logs.push(t);
    },
    read: readFile,
    __future__: Sk.python3,
    execLimit: d.timeoutMs || 4000,
    yieldLimit: null,
  });
  var reply = function (payload) {
    payload.logs = logs.join('').replace(/\n$/, '');
    self.postMessage({ type: 'result', id: d.id, payload: payload });
  };
  Sk.execStart = Date.now();
  Sk.misceval
    .asyncToPromise(function () {
      return Sk.importMainWithBody('<stdin>', false, d.code, true);
    })
    .then(
      function (mod) {
        var fn = mod.$d[d.fnName];
        if (!fn || !Sk.builtin.checkCallable(fn)) {
          reply({ fatal: 'NameError: fungsi ' + d.fnName + ' tidak ditemukan. Pastikan namanya tidak diubah.' });
          return;
        }
        var results = [];
        var i = 0;
        var next = function () {
          if (i >= d.tests.length) {
            reply({ results: results });
            return;
          }
          var t = d.tests[i++];
          Sk.execStart = Date.now();
          Sk.misceval
            .asyncToPromise(function () {
              return Sk.misceval.callsimOrSuspendArray(fn, t.args.map(toPy));
            })
            .then(
              function (val) {
                try {
                  results.push({ ok: true, value: toJs(val) });
                } catch (e) {
                  results.push({ ok: false, error: errText(e) });
                }
                next();
              },
              function (e) {
                results.push({ ok: false, error: errText(e) });
                next();
              },
            );
        };
        next();
      },
      function (e) {
        reply({ fatal: errText(e) });
      },
    );
}
