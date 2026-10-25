// Background removal for product photos, run in the admin's own browser.
//
// Model: BEN2 (MIT) through Transformers.js, the same setup as
// `runonweb/remove-bg` (github.com/midudev/runonweb.ai). It lives in public/
// as plain JS and imports the self-contained Transformers.js bundle from the
// CDN, so neither Next's bundler nor the VPS install ever see Transformers.js
// / ONNX Runtime (as an npm dependency it would pull ~450 MB of
// onnxruntime-node into node_modules for nothing).
//
// Protocol: in `{ id, url }` → out `{ id, type: "download", loaded, total }`
// (model download, first use only), `{ id, type: "processing" }`, then
// `{ id, type: "done", blob }` (PNG with alpha) or `{ id, type: "error", message }`.
import { env, pipeline } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1/dist/transformers.min.js";

env.allowLocalModels = false;
// Threaded WASM needs cross-origin isolation (SharedArrayBuffer). Without it
// ONNX Runtime crashes with "memory access out of bounds" at the end of the
// first download; one thread avoids it.
if (!self.crossOriginIsolated) env.backends.onnx.wasm.numThreads = 1;

let remover = null;
let currentId = 0;
const files = new Map();

function load() {
  remover ??= pipeline("background-removal", "onnx-community/BEN2-ONNX", {
    // WASM only: BEN2's fp16-in / fp32-out LayerNorm breaks the WebGPU shader
    // in onnxruntime-web 1.30+ (microsoft/onnxruntime#32627). fp16 is the only
    // weight BEN2 ships: ~219 MB, kept in Cache Storage after the first use.
    device: "wasm",
    dtype: "fp16",
    progress_callback: (p) => {
      if (p.status !== "progress" || !p.file) return;
      files.set(p.file, { loaded: p.loaded ?? 0, total: p.total ?? 0 });
      let loaded = 0;
      let total = 0;
      for (const f of files.values()) {
        loaded += f.loaded;
        total += f.total;
      }
      self.postMessage({ id: currentId, type: "download", loaded, total });
    },
  }).catch((err) => {
    remover = null;
    throw err;
  });
  return remover;
}

self.onmessage = async ({ data: { id, url } }) => {
  currentId = id;
  try {
    const remove = await load();
    self.postMessage({ id, type: "processing" });
    const [result] = await remove([url]);
    if (!result) throw new Error("El modelo no devolvió ninguna imagen");
    const blob = await result.toBlob("image/png");
    self.postMessage({ id, type: "done", blob });
  } catch (err) {
    self.postMessage({ id, type: "error", message: err instanceof Error ? err.message : String(err) });
  }
};
