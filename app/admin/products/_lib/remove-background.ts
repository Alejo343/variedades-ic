// Client side of public/workers/remove-bg.js (BEN2 in the browser, see the
// worker for the why). One worker per tab, created on first use, so the
// model loads once and the next photos skip the download and session setup.

import { alphaBounds, fitInSquare } from "@/lib/domain/image-frame";

/** Standard product photo: transparent square, object centered with this margin on its longest side. */
export const FRAME_SIZE = 1200;
export const FRAME_MARGIN = 0.08;

export type RemoveBgProgress =
  | { stage: "download"; loaded: number; total: number }
  | { stage: "processing" };

type WorkerMessage =
  | { id: number; type: "download"; loaded: number; total: number }
  | { id: number; type: "processing" }
  | { id: number; type: "done"; blob: Blob }
  | { id: number; type: "error"; message: string };

let worker: Worker | null = null;
let nextId = 0;

/** PNG with alpha of `imageUrl` without its background. */
export function removeBackground(imageUrl: string, onProgress?: (p: RemoveBgProgress) => void): Promise<Blob> {
  worker ??= new Worker("/workers/remove-bg.js", { type: "module" });
  const w = worker;
  const id = ++nextId;

  return new Promise((resolve, reject) => {
    function cleanup() {
      w.removeEventListener("message", onMessage);
      w.removeEventListener("error", onError);
    }
    function onMessage(e: MessageEvent<WorkerMessage>) {
      const msg = e.data;
      if (msg.id !== id) return;
      if (msg.type === "download") onProgress?.({ stage: "download", loaded: msg.loaded, total: msg.total });
      else if (msg.type === "processing") onProgress?.({ stage: "processing" });
      else {
        cleanup();
        if (msg.type === "done") resolve(msg.blob);
        else reject(new Error(msg.message));
      }
    }
    // The worker itself failed (e.g. the CDN import did not load): drop it so
    // the next try starts a fresh one.
    function onError() {
      cleanup();
      w.terminate();
      if (worker === w) worker = null;
      reject(new Error("No se pudo cargar el modelo. Revisa la conexión e intenta de nuevo."));
    }
    w.addEventListener("message", onMessage);
    w.addEventListener("error", onError);
    w.postMessage({ id, url: new URL(imageUrl, location.href).href });
  });
}

/**
 * Crop a cut-out to its object and place it on the standard frame
 * (`FRAME_SIZE` square, transparent, `FRAME_MARGIN` around the longest side),
 * so every photo ends up the same however much background was removed.
 */
export async function frameCutout(cutout: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(cutout);
  try {
    const src = document.createElement("canvas");
    src.width = bitmap.width;
    src.height = bitmap.height;
    const srcCtx = src.getContext("2d", { willReadFrequently: true });
    if (!srcCtx) throw new Error("El navegador no permite procesar la imagen");
    srcCtx.drawImage(bitmap, 0, 0);
    const bounds = alphaBounds(srcCtx.getImageData(0, 0, src.width, src.height).data, src.width, src.height);
    if (!bounds) throw new Error("No se encontró ningún producto en la foto");

    const dest = fitInSquare(bounds.width, bounds.height, FRAME_SIZE, FRAME_MARGIN);
    const out = document.createElement("canvas");
    out.width = FRAME_SIZE;
    out.height = FRAME_SIZE;
    const ctx = out.getContext("2d");
    if (!ctx) throw new Error("El navegador no permite procesar la imagen");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(src, bounds.x, bounds.y, bounds.width, bounds.height, dest.x, dest.y, dest.width, dest.height);

    return await new Promise<Blob>((resolve, reject) =>
      out.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo generar la imagen"))), "image/png"),
    );
  } finally {
    bitmap.close();
  }
}
