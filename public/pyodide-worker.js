// Quartz Judge - Python judge worker (module, same-origin).
// Imports self-hosted Pyodide (NO CDN) via /pyodide/pyodide.mjs and runs one
// scoped test per message:
//   { type: "run", code, args } -> { ok: true, value } | { ok: false, errorType, error }
// An infinite user loop blocks this worker; the main thread terminates it.
import { loadPyodide } from "/pyodide/pyodide.mjs";

const POOL_INDEX_URL = self.location.origin + "/pyodide/";
let runtime = null;
let initError = null;
let readyResolve = null;
let readyReject = null;
const readyPromise = new Promise(function (res, rej) {
  readyResolve = res;
  readyReject = rej;
});

loadPyodide({ indexURL: POOL_INDEX_URL })
  .then(function (py) {
    runtime = py;
    readyResolve();
    self.postMessage({ type: "ready" });
  })
  .catch(function (err) {
    initError = err && err.message ? err.message : String(err);
    readyReject(initError);
    self.postMessage({ type: "init-error", error: initError });
  });

function isSyntaxError(err) {
  var name = err && err.name ? String(err.name) : "";
  var msg = err && err.message ? String(err.message) : String(err);
  return name === "SyntaxError" || msg.indexOf("SyntaxError:") > -1;
}

self.onmessage = function (e) {
  var data = e.data || {};
  if (data.type !== "run") return;
  var runId = data.__runId;
  function respond(result) {
    result.__runId = runId;
    self.postMessage(result);
  }
  readyPromise.then(
    function () {
      var scope;
      try {
        scope = runtime.toPy({});
        try {
          runtime.runPython(data.code, { globals: scope });
        } catch (err) {
          respond({
            type: "result",
            ok: false,
            errorType: isSyntaxError(err) ? "syntax" : "runtime",
            error: err && err.message ? err.message : String(err),
          });
          return;
        }
        try {
          var hasFn = runtime.runPython("'solution' in globals()", {
            globals: scope,
          });
          if (!hasFn) {
            respond({ type: "result", ok: false, errorType: "nofn" });
            return;
          }
          if (scope.set) scope.set("__args__", runtime.toPy(data.args));
          runtime.runPython(
            "\nimport json\n\ndef __quartz_serialize__(value):\n    return json.dumps(value, default=str)\n",
            { globals: scope },
          );
          var jsonStr = runtime.runPython(
            "__quartz_serialize__(solution(*__args__))",
            { globals: scope },
          );
          var value = JSON.parse(String(jsonStr));
          respond({ type: "result", ok: true, value: value });
        } catch (err) {
          var msg2 = err && err.message ? err.message : String(err);
          respond({
            type: "result",
            ok: false,
            errorType: "runtime",
            error: msg2,
          });
        }
      } catch (err) {
        respond({
          type: "result",
          ok: false,
          errorType: "runtime",
          error: err && err.message ? err.message : String(err),
        });
      }
    },
    function (initErr) {
      respond({
        type: "result",
        ok: false,
        errorType: "runtime",
        error: initErr,
      });
    },
  );
};
