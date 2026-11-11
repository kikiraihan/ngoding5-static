"""Runner Python untuk `ngoding verify`.

Dipanggil oleh scripts/verify.mjs dengan `python3 -I scripts/verify_py.py`.
Masukan (stdin, JSON): {"kind": "problem", "code", "fn", "tests"} atau {"kind": "quiz", "code"}
Keluaran (stdout, JSON): {"results": [...], "logs": "..."} atau {"stdout": "...", "error"?: "..."}
"""
import contextlib
import io
import json
import sys


def to_jsonable(v):
    if isinstance(v, tuple):
        return [to_jsonable(x) for x in v]
    if isinstance(v, list):
        return [to_jsonable(x) for x in v]
    if isinstance(v, dict):
        return {str(k): to_jsonable(x) for k, x in v.items()}
    if isinstance(v, (set, frozenset)):
        raise TypeError("set tidak bisa dibandingkan, kembalikan list")
    return v


def main():
    job = json.loads(sys.stdin.read())
    real_stdout = sys.stdout
    buf = io.StringIO()
    env = {"__name__": "__main__"}

    if job["kind"] == "quiz":
        err = None
        with contextlib.redirect_stdout(buf):
            try:
                exec(compile(job["code"], "<quiz>", "exec"), env)
            except Exception as e:  # noqa: BLE001
                err = f"{type(e).__name__}: {e}"
        out = {"stdout": buf.getvalue()}
        if err:
            out["error"] = err
        real_stdout.write(json.dumps(out))
        return

    try:
        with contextlib.redirect_stdout(buf):
            exec(compile(job["code"], "<solusi>", "exec"), env)
        fn = env.get(job["fn"])
        if not callable(fn):
            raise NameError(f"Fungsi {job['fn']} tidak ditemukan")
    except Exception as e:  # noqa: BLE001
        real_stdout.write(json.dumps({"fatal": f"{type(e).__name__}: {e}"}))
        return

    results = []
    for t in job["tests"]:
        try:
            with contextlib.redirect_stdout(buf):
                value = fn(*json.loads(json.dumps(t["args"])))
            results.append({"ok": True, "value": to_jsonable(value)})
        except Exception as e:  # noqa: BLE001
            results.append({"ok": False, "error": f"{type(e).__name__}: {e}"})
    real_stdout.write(json.dumps({"results": results, "logs": buf.getvalue()}))


if __name__ == "__main__":
    main()
