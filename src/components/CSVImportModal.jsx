import { useRef, useState } from "react";
import { supabase } from "../lib/supabase";

function parseCSV(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
  return lines
    .slice(1)
    .map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/['"]/g, ""));
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] || "";
      });
      return obj;
    })
    .filter((row) => row.name);
}

export default function CSVImportModal({ groups, onClose, onImported }) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState([]);
  const [filename, setFilename] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseCSV(ev.target.result);
      setPreview(rows);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!preview.length) return;
    setImporting(true);
    setError("");

    const mapped = preview
      .map((row) => ({
        name: row.name || row.nome || "",
        phone: row.phone || row.telefone || row.fone || "",
        email: row.email || "",
        instagram: row.instagram || "",
        notes: row.notes || row.notas || "",
      }))
      .filter((r) => r.name);

    const { data, error } = await supabase
      .from("contacts")
      .insert(mapped)
      .select("id");
    if (error) {
      setError(error.message);
      setImporting(false);
      return;
    }

    if (selectedGroup && data?.length) {
      await supabase
        .from("contact_groups")
        .insert(
          data.map((c) => ({ contact_id: c.id, group_id: selectedGroup })),
        );
    }

    setImporting(false);
    onImported();
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-surface-container-low w-full max-w-lg border border-outline-variant/20">
        <div className="flex justify-between items-center px-6 py-5 border-b border-outline-variant/10">
          <h3 className="text-lg font-black uppercase tracking-tight text-on-surface">
            Importar CSV
          </h3>
          <button
            onClick={onClose}
            className="text-on-surface/40 hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="px-6 py-6 flex flex-col gap-6">
          {/* Instructions */}
          <div className="bg-surface-container-highest px-4 py-3">
            <p className="text-[0.65rem] text-on-surface/50 font-medium leading-relaxed">
              O CSV deve ter colunas:{" "}
              <span className="text-primary-container font-bold">
                name, phone, email, instagram, notes
              </span>{" "}
              (ou em português: nome, telefone, instagram, notas). A primeira
              linha deve ser o cabeçalho.
            </p>
          </div>

          {/* File input */}
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFile}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full py-4 border border-dashed border-outline-variant/30 text-on-surface/40 hover:border-primary-container hover:text-on-surface text-xs font-bold uppercase tracking-widest transition-colors flex flex-col items-center gap-2"
            >
              <span className="material-symbols-outlined text-2xl">
                upload_file
              </span>
              {filename || "Selecionar arquivo CSV"}
            </button>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <p className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-primary-container mb-2">
                {preview.length} contatos encontrados
              </p>
              <div className="bg-surface-container-highest max-h-36 overflow-y-auto">
                {preview.slice(0, 5).map((row, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 border-b border-outline-variant/10 text-xs font-medium text-on-surface/60"
                  >
                    {row.name || row.nome} {row.email ? `· ${row.email}` : ""}{" "}
                    {row.phone || row.telefone
                      ? `· ${row.phone || row.telefone}`
                      : ""}
                  </div>
                ))}
                {preview.length > 5 && (
                  <div className="px-3 py-2 text-[0.6rem] text-on-surface/30 uppercase tracking-widest">
                    + {preview.length - 5} mais...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assign to group */}
          {groups.length > 0 && (
            <div>
              <label className="block text-[0.6rem] font-black uppercase tracking-[0.2em] text-primary-container mb-2">
                Adicionar ao grupo (opcional)
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full bg-surface-container-low border-b border-outline-variant/30 text-on-surface py-2 text-sm font-medium focus:outline-none focus:border-primary-container transition-colors"
              >
                <option value="">Nenhum grupo</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <p className="text-[0.7rem] text-primary-container font-bold uppercase">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-outline-variant/30 text-on-surface/50 hover:text-on-surface text-xs font-black uppercase tracking-widest transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={!preview.length || importing}
              className="flex-1 py-3 bg-gradient-to-b from-primary-container to-on-primary-fixed-variant text-white text-xs font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-30 transition-opacity"
            >
              {importing ? "Importando..." : `Importar ${preview.length || 0}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
