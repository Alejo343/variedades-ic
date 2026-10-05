"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, RefreshCw, Upload } from "lucide-react";
import {
  PRODUCT_IMPORT_COLUMNS,
  parseProductSheet,
  type ProductImportPlan,
  type ProductImportRow,
  type RowError,
} from "@/lib/domain/product-import";
import { formatCOP } from "../../../_lib/format";

const TEMPLATE_NAME = "plantilla-productos-ic-variedades.xlsx";
const DATA_SHEET = "Productos";

function downloadTemplate() {
  const wb = XLSX.utils.book_new();

  const data = XLSX.utils.aoa_to_sheet([PRODUCT_IMPORT_COLUMNS.map((c) => c.header)]);
  data["!cols"] = PRODUCT_IMPORT_COLUMNS.map((c) => ({ wch: Math.max(c.header.length + 4, c.key === "name" || c.key === "description" ? 34 : 14) }));
  XLSX.utils.book_append_sheet(wb, data, DATA_SHEET);

  const help = XLSX.utils.aoa_to_sheet([
    ["Columna", "¿Obligatoria?", "Qué escribir", "Ejemplo"],
    ...PRODUCT_IMPORT_COLUMNS.map((c) => [
      c.header,
      c.required === "always" ? "Sí" : c.required === "new" ? "Sí, en productos nuevos" : "No",
      c.help,
      c.example,
    ]),
    [],
    ["Llena la hoja “Productos”: una fila por producto, sin cambiar los encabezados."],
    ["Montos en pesos, sin decimales (50000 o $50.000). Celdas vacías en productos existentes = no se cambia ese dato."],
  ]);
  help["!cols"] = [{ wch: 18 }, { wch: 24 }, { wch: 90 }, { wch: 34 }];
  XLSX.utils.book_append_sheet(wb, help, "Instrucciones");

  // Own download instead of XLSX.writeFile: that one revokes the blob URL right
  // away, which some browsers treat as a cancelled download.
  const bytes = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  const url = URL.createObjectURL(
    new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = TEMPLATE_NAME;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

type Stage =
  | { kind: "idle" }
  | { kind: "reading" }
  | { kind: "structure"; fileName: string; missing: string[] }
  | { kind: "preview"; fileName: string; rows: ProductImportRow[]; parseErrors: RowError[]; plan: ProductImportPlan }
  | { kind: "done"; created: number; updated: number; unchanged: number };

export function ProductImporter() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const stepTwoRef = useRef<HTMLElement>(null);
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  const [dragging, setDragging] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");

  async function readFile(file: File) {
    setError("");
    setStage({ kind: "reading" });
    try {
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = wb.Sheets[DATA_SHEET] ?? wb.Sheets[wb.SheetNames[0]];
      const sheetRows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });
      const parsed = parseProductSheet(sheetRows);

      if (!parsed.ok) {
        setStage({ kind: "structure", fileName: file.name, missing: parsed.missingColumns });
        return;
      }
      if (parsed.rows.length === 0 && parsed.errors.length === 0) {
        setStage({ kind: "idle" });
        setError("La hoja “Productos” está vacía. Llena al menos una fila debajo de los encabezados.");
        return;
      }

      let plan: ProductImportPlan = { creates: [], updates: [], unchanged: [], errors: [] };
      if (parsed.rows.length > 0) {
        const res = await fetch("/api/admin/products/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: parsed.rows, dryRun: true }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "No se pudo revisar el archivo");
        plan = data.plan;
      }
      setStage({ kind: "preview", fileName: file.name, rows: parsed.rows, parseErrors: parsed.errors, plan });
      requestAnimationFrame(() => stepTwoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (err) {
      setStage({ kind: "idle" });
      setError(err instanceof Error ? err.message : "No se pudo leer el archivo. ¿Es un .xlsx?");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function apply() {
    if (stage.kind !== "preview") return;
    setApplying(true);
    setError("");
    const res = await fetch("/api/admin/products/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: stage.rows, dryRun: false }),
    });
    const data = await res.json();
    setApplying(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "No se pudo importar");
      if (data.plan) setStage({ ...stage, plan: data.plan });
      return;
    }
    setStage({ kind: "done", created: data.created, updated: data.updated, unchanged: data.unchanged });
    router.refresh();
  }

  const uploadZone = (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) readFile(file);
      }}
      onClick={() => fileRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
      className={`rounded-2xl border-2 border-dashed p-8 flex flex-col items-center text-center cursor-pointer transition ${
        dragging ? "border-[var(--adm-brand)] bg-[var(--adm-brand-soft)]" : "border-[var(--adm-line-strong)] hover:border-[var(--adm-brand)] hover:bg-[var(--adm-surface-2)]"
      }`}
    >
      <span className="w-12 h-12 rounded-2xl grid place-items-center bg-[var(--adm-brand-soft)] text-[var(--adm-brand)] mb-3">
        <Upload size={22} />
      </span>
      <p className="font-semibold">{stage.kind === "reading" ? "Revisando el archivo…" : "Arrastra aquí la plantilla llena"}</p>
      <p className="text-[13px] text-[var(--adm-ink-3)] mt-1">o haz clic para elegirla (.xlsx)</p>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) readFile(file);
        }}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Step 1 */}
      <section className="adm-card overflow-hidden">
        <div className="adm-card-head">
          <div className="flex items-center gap-3">
            <StepNumber n={1} />
            <div>
              <h2 className="adm-card-title">Descarga la plantilla y llénala</h2>
              <p className="adm-card-desc">Solo se aceptan archivos con esta estructura. No cambies los encabezados.</p>
            </div>
          </div>
          <button type="button" onClick={downloadTemplate} className="adm-btn adm-btn-brand">
            <Download />
            Descargar plantilla
          </button>
        </div>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Columna</th>
                <th>Obligatoria</th>
                <th>Qué escribir</th>
                <th>Ejemplo</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCT_IMPORT_COLUMNS.map((c) => (
                <tr key={c.key}>
                  <td className="t-strong whitespace-nowrap">{c.header}</td>
                  <td className="whitespace-nowrap">
                    {c.required === "always" ? (
                      <span className="adm-badge adm-badge-danger adm-badge-plain">Sí</span>
                    ) : c.required === "new" ? (
                      <span className="adm-badge adm-badge-warn adm-badge-plain">En nuevos</span>
                    ) : (
                      <span className="adm-badge adm-badge-plain">No</span>
                    )}
                  </td>
                  <td className="text-[13px] min-w-[280px]">{c.help}</td>
                  <td className="num text-[12.5px] whitespace-nowrap">{c.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 border-t border-[var(--adm-line)] grid grid-cols-1 md:grid-cols-3 gap-3 text-[13px] text-[var(--adm-ink-2)]">
          <p>
            <strong className="text-[var(--adm-ink)]">Producto nuevo:</strong> deja el SKU vacío; se crea con su SKU automático.
          </p>
          <p>
            <strong className="text-[var(--adm-ink)]">Producto existente:</strong> se reconoce por SKU, código de proveedor o nombre. Las celdas vacías no cambian nada.
          </p>
          <p>
            <strong className="text-[var(--adm-ink)]">Cantidad:</strong> fija el stock al número que pongas y queda registrado como ajuste en Inventario.
          </p>
        </div>
      </section>

      {/* Step 2 */}
      <section ref={stepTwoRef} className="adm-card p-5 flex flex-col gap-4 scroll-mt-24">
        <div className="flex items-center gap-3">
          <StepNumber n={2} />
          <div>
            <h2 className="adm-card-title">Sube el archivo</h2>
            <p className="adm-card-desc">Verás una vista previa antes de guardar; nada se modifica hasta que confirmes.</p>
          </div>
        </div>

        {error && (
          <p className="adm-alert adm-alert-danger">
            <AlertTriangle />
            <span>{error}</span>
          </p>
        )}

        {stage.kind === "done" ? (
          <div className="adm-alert adm-alert-ok items-center">
            <CheckCircle2 />
            <div className="flex-1">
              <p className="font-semibold">Importación completada</p>
              <p>
                {stage.created} productos creados · {stage.updated} actualizados · {stage.unchanged} sin cambios
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStage({ kind: "idle" })} className="adm-btn adm-btn-sm">
                Importar otro
              </button>
              <Link href="/admin/products" className="adm-btn adm-btn-primary adm-btn-sm">
                Ver productos
              </Link>
            </div>
          </div>
        ) : stage.kind === "structure" ? (
          <>
            <div className="adm-alert adm-alert-danger">
              <FileSpreadsheet />
              <div>
                <p className="font-semibold">“{stage.fileName}” no tiene la estructura de la plantilla</p>
                <p className="mt-0.5">
                  Faltan las columnas: <strong>{stage.missing.join(", ")}</strong>. Descarga la plantilla del paso 1, copia tus
                  datos en ella y vuelve a subirla.
                </p>
              </div>
            </div>
            {uploadZone}
          </>
        ) : stage.kind === "preview" ? (
          <Preview stage={stage} applying={applying} onApply={apply} onReset={() => setStage({ kind: "idle" })} />
        ) : (
          uploadZone
        )}
      </section>
    </div>
  );
}

function StepNumber({ n }: { n: number }) {
  return (
    <span className="w-8 h-8 rounded-full grid place-items-center bg-[var(--adm-ink)] text-white text-[13px] font-semibold shrink-0">{n}</span>
  );
}

function Preview({
  stage,
  applying,
  onApply,
  onReset,
}: {
  stage: Extract<Stage, { kind: "preview" }>;
  applying: boolean;
  onApply: () => void;
  onReset: () => void;
}) {
  const { plan, parseErrors, fileName } = stage;
  const errors = [...parseErrors, ...plan.errors].sort((a, b) => a.rowNumber - b.rowNumber);
  const nothingToDo = plan.creates.length === 0 && plan.updates.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 text-[13.5px] font-medium mr-2">
          <FileSpreadsheet size={16} className="text-[var(--adm-ink-3)]" />
          {fileName}
        </span>
        <span className="adm-badge adm-badge-ok">{plan.creates.length} nuevos</span>
        <span className="adm-badge adm-badge-info">{plan.updates.length} se actualizan</span>
        <span className="adm-badge">{plan.unchanged.length} sin cambios</span>
        {errors.length > 0 && <span className="adm-badge adm-badge-danger">{errors.length} con error</span>}
      </div>

      {errors.length > 0 && (
        <div className="rounded-xl border border-[#f1c6c1] overflow-hidden">
          <p className="px-4 py-2.5 bg-[var(--adm-danger-soft)] text-[13.5px] font-semibold text-[#8f1d1d]">
            Corrige estas filas en tu Excel y vuelve a subirlo (no se importa nada mientras haya errores)
          </p>
          <ul className="divide-y divide-[#f6dcd8] max-h-64 overflow-y-auto">
            {errors.map((e, i) => (
              <li key={i} className="px-4 py-2 text-[13px] flex gap-3">
                <span className="num text-[var(--adm-danger)] font-semibold w-16 shrink-0">Fila {e.rowNumber}</span>
                <span>{e.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {plan.creates.length > 0 && (
        <div className="rounded-xl border border-[var(--adm-line)] overflow-hidden">
          <p className="px-4 py-2.5 bg-[var(--adm-surface-2)] text-[13.5px] font-semibold">Productos nuevos ({plan.creates.length})</p>
          <div className="adm-table-wrap max-h-80 overflow-y-auto">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Fila</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th className="t-right">Precio</th>
                  <th className="t-right">Costo</th>
                  <th className="t-right">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {plan.creates.map((c) => (
                  <tr key={c.rowNumber}>
                    <td className="num text-[var(--adm-ink-3)]">{c.rowNumber}</td>
                    <td className="t-strong">{c.fields.name}</td>
                    <td>{c.categoryName ?? "—"}</td>
                    <td className="t-right num">{formatCOP(c.fields.price)}</td>
                    <td className="t-right num">{formatCOP(c.fields.purchasePrice)}</td>
                    <td className="t-right num t-strong">{c.initialStock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {plan.updates.length > 0 && (
        <div className="rounded-xl border border-[var(--adm-line)] overflow-hidden">
          <p className="px-4 py-2.5 bg-[var(--adm-surface-2)] text-[13.5px] font-semibold">Productos que se actualizan ({plan.updates.length})</p>
          <div className="adm-table-wrap max-h-80 overflow-y-auto">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Fila</th>
                  <th>Producto</th>
                  <th>Cambios</th>
                </tr>
              </thead>
              <tbody>
                {plan.updates.map((u) => (
                  <tr key={u.rowNumber}>
                    <td className="num text-[var(--adm-ink-3)] align-top">{u.rowNumber}</td>
                    <td className="align-top">
                      <p className="t-strong">{u.name}</p>
                      <p className="num text-[12px] text-[var(--adm-ink-3)]">{u.sku}</p>
                    </td>
                    <td>
                      <ul className="flex flex-col gap-0.5 text-[13px]">
                        {u.changes.map((ch) => (
                          <li key={ch.field}>
                            <span className="text-[var(--adm-ink-3)]">{ch.field}:</span>{" "}
                            <span className="line-through text-[var(--adm-ink-3)]">{ch.from}</span> →{" "}
                            <span className="font-medium text-[var(--adm-ink)]">{ch.to}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
        <button type="button" onClick={onReset} className="adm-btn">
          <RefreshCw />
          Subir otro archivo
        </button>
        <button type="button" onClick={onApply} disabled={applying || errors.length > 0 || nothingToDo} className="adm-btn adm-btn-primary">
          {applying
            ? "Importando…"
            : errors.length > 0
              ? "Corrige los errores para importar"
              : nothingToDo
              ? "No hay cambios para importar"
              : `Importar ${plan.creates.length + plan.updates.length} productos`}
        </button>
      </div>
    </div>
  );
}
