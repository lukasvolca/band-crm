import { useState } from "react";
import { supabase } from "../lib/supabase";

const DEFAULT_KANBAN_TITLES = [
  { value: "novo", label: "Novo", color: "#64748b" },
  { value: "andamento", label: "Em andamento", color: "#fbbf24" },
  { value: "fechou", label: "Fechou", color: "#22c55e" },
  { value: "descartado", label: "Descartado", color: "#ef4444" },
];

function getGlobalKanbanTitles() {
  try {
    const saved = localStorage.getItem("band_crm_kanban_titles");
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return [...DEFAULT_KANBAN_TITLES];
}

export default function ContactKanbanModal({ contact, groups, onClose, onSaved }) {
  const [kanbanCols, setKanbanCols] = useState(() => {
    const globalTitles = getGlobalKanbanTitles();
    const savedItems = contact?.kanban && typeof contact.kanban === "object" && !Array.isArray(contact.kanban) ? contact.kanban : {};
    return globalTitles.map(t => ({
      ...t,
      items: savedItems[t.value] || []
    }));
  });

  const [selectedGroups, setSelectedGroups] = useState(contact?.contact_groups?.map(cg => cg.group_id) || []);

  const [form, setForm] = useState({
    name: contact?.name || "",
    instagram: contact?.instagram || "",
    email: contact?.email || "",
    phone: contact?.phone || "",
    priority: contact?.priority || null,
    stage: contact?.stage || "novo",
    notes: contact?.notes || "",
    kanban: contact?.kanban && typeof contact.kanban === "object" && !Array.isArray(contact.kanban) ? contact.kanban : {},
    checklist: contact?.checklist || { divulgar: null, ouviu: null, merchan: null, colar: null }
  });
  const [saving, setSaving] = useState(false);

  function syncKanbanToForm(cols) {
    const newKanbanObj = {};
    cols.forEach(c => { newKanbanObj[c.value] = c.items; });
    setForm(prev => ({ ...prev, kanban: newKanbanObj }));
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase.from("contacts").update(form).eq("id", contact.id);
    setSaving(false);
    
    if (error) {
       console.error("Save error:", error);
       if (error.message.includes("does not exist") || error.message.includes("Could not find the")) {
           alert("ATENÇÃO: Faltam criar colunas no Supabase!\n\nNa sua tabela 'contacts', você precisa criar as colunas:\n- 'stage' (tipo text)\n- 'kanban' (tipo JSONB)\n- 'checklist' (tipo JSONB)");
       } else {
           alert("Erro ao salvar: " + error.message);
       }
       return;
    }

    // sync groups
    await supabase.from("contact_groups").delete().eq("contact_id", contact.id);
    if (selectedGroups.length > 0) {
      await supabase.from("contact_groups").insert(
        selectedGroups.map((group_id) => ({
          contact_id: contact.id,
          group_id,
        })),
      );
    }
    
    onSaved?.();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div
        className="bg-surface-container-low border border-outline-variant/20 rounded-lg shadow-2xl p-0 flex flex-col"
        style={{ width: '92vw', height: '92vh', maxWidth: '1800px', maxHeight: '98vh' }}
      >
        <div className="flex justify-between items-center px-8 py-6 border-b border-outline-variant/10">
          <h3 className="text-xl font-black uppercase tracking-tight text-on-surface">Contato: {form.name}</h3>
          <button onClick={onClose} className="text-on-surface/40 hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex flex-col md:flex-row gap-8 px-8 pt-6 pb-8 flex-1 overflow-hidden">
            {/* Dados principais (coluna menor) */}
            <div className="w-full md:w-1/4 min-w-[220px] flex flex-col gap-4 overflow-y-auto pr-4 h-full pb-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-primary-container">Nome</label>
                <div className="flex gap-2 items-end">
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-transparent border-b border-outline-variant/30 text-on-surface py-2 text-sm font-medium focus:outline-none focus:border-primary-container" />
                </div>
              </div>
              
              {groups?.length > 0 && (
                <div className="mt-1">
                  <label className="block text-[0.65rem] font-black uppercase tracking-widest text-primary-container mb-2">Grupos</label>
                  <div className="flex flex-wrap gap-1.5">
                    {groups.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setSelectedGroups(prev => prev.includes(g.id) ? prev.filter(x => x !== g.id) : [...prev, g.id])}
                        className={`px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-tighter transition-colors rounded ${
                          selectedGroups.includes(g.id)
                            ? "bg-primary-container text-white"
                            : "bg-surface-container-high text-on-surface/50 hover:text-on-surface hover:bg-surface-container-highest"
                        }`}
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <label className="block text-xs font-black uppercase tracking-widest text-primary-container mt-2">Instagram</label>
              <input value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} className="w-full bg-transparent border-b border-outline-variant/30 text-on-surface py-2 text-sm font-medium focus:outline-none focus:border-primary-container" />
              <label className="block text-xs font-black uppercase tracking-widest text-primary-container mt-4">Email</label>
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full bg-transparent border-b border-outline-variant/30 text-on-surface py-2 text-sm font-medium focus:outline-none focus:border-primary-container" />
              <label className="block text-xs font-black uppercase tracking-widest text-primary-container mt-4">Telefone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full bg-transparent border-b border-outline-variant/30 text-on-surface py-2 text-sm font-medium focus:outline-none focus:border-primary-container" />
              <label className="block text-xs font-black uppercase tracking-widest text-primary-container mt-4">Prioridade</label>
              <div className="flex gap-2 mt-1">
                {[1,2,3,4,5].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, priority: f.priority === v ? null : v }))}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${form.priority === v ? 'border-primary-container' : 'border-outline-variant/30'} transition-colors`}
                    style={{ background: form.priority && v <= form.priority ? '#ef4444' : 'transparent' }}
                    title={['Muito Frio','Frio','Morno','Quente','Muito Quente'][v-1]}
                  >
                    {form.priority === v && <span className="material-symbols-outlined text-xs text-primary-container">check</span>}
                  </button>
                ))}
              </div>

              {/* Checklist */}
              <label className="block text-xs font-black uppercase tracking-widest text-primary-container mt-6">Checklist</label>
              <div className="flex flex-col gap-3 mt-1">
                {[
                  { id: 'divulgar', text: '1. Pode divulgar?', opts: ['sim', 'não'] },
                  { id: 'ouviu', text: '2. Já ouviu todas as músicas?', opts: ['sim', 'não'] },
                  { id: 'merchan', text: '3. Tem interesse no merchan?', opts: ['sim', 'não'] },
                  { id: 'colar', text: '4. Vai colar com a banda?', opts: ['presencial', 'online', 'os dois'] }
                ].map(item => (
                  <div key={item.id} className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-on-surface/80">{item.text}</span>
                    <div className="flex gap-4">
                      {item.opts.map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setForm(f => ({ 
                             ...f, 
                             checklist: { ...(f.checklist || {}), [item.id]: f.checklist?.[item.id] === opt ? null : opt } 
                          }))}
                          className={`flex items-center gap-1 text-xs transition-colors ${form.checklist?.[item.id] === opt ? 'text-primary-container font-black' : 'text-on-surface/60 hover:text-on-surface'}`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {form.checklist?.[item.id] === opt ? 'check_box' : 'check_box_outline_blank'}
                          </span>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Kanban (coluna maior) */}
            <div className="w-full md:w-3/4 flex flex-col gap-8 h-full">
              <div className="flex flex-col gap-4 flex-1 overflow-hidden min-h-[300px]">
                <label className="block text-xs font-black uppercase tracking-widest text-primary-container leading-none">Status (Kanban)</label>
                <div className="flex gap-2 flex-1 overflow-x-auto pb-2">
                  {kanbanCols.map((col, colIndex) => (
                    <div key={col.value || colIndex} className={`flex-1 min-w-[200px] flex flex-col rounded border-2 transition-colors ${form.stage === col.value ? 'border-primary-container bg-primary-container/5' : 'border-outline-variant/30 bg-surface-container-low'}`}>
                      {/* Column Header */}
                      <div 
                         className={`p-2 flex flex-col gap-1 cursor-pointer transition-colors ${form.stage === col.value ? 'bg-primary-container text-white' : 'hover:bg-on-surface/5 hover:border-outline-variant/50 border-b border-transparent'}`}
                         onClick={() => setForm(f => ({ ...f, stage: col.value }))}
                      >
                         <input 
                           value={col.label}
                           onChange={(e) => {
                              const newCols = [...kanbanCols];
                              newCols[colIndex].label = e.target.value;
                              setKanbanCols(newCols);
                              // Sync title globally
                              const globalSave = newCols.map(c => ({ value: c.value, label: c.label, color: c.color }));
                              localStorage.setItem("band_crm_kanban_titles", JSON.stringify(globalSave));
                           }}
                           onClick={e => e.stopPropagation()}
                           className={`w-full bg-transparent text-xs font-black uppercase tracking-widest text-center focus:outline-none ${form.stage === col.value ? 'text-white placeholder-white/70' : 'text-on-surface placeholder-on-surface/30'}`}
                           placeholder="TÍTULO DA COLUNA"
                         />
                      </div>
                      
                      {/* Column Body - Items */}
                      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
                         {col.items?.map((item, itemIndex) => (
                            <div key={item.id} className={`bg-surface-container rounded p-2 flex gap-2 items-start border shadow-sm relative group overflow-hidden transition-colors ${item.completed ? 'border-primary-container/30 bg-surface-container-highest/20' : 'border-outline-variant/10'}`}>
                               <button 
                                 onClick={() => {
                                     const newCols = [...kanbanCols];
                                     newCols[colIndex].items[itemIndex].completed = !newCols[colIndex].items[itemIndex].completed;
                                     setKanbanCols(newCols);
                                     syncKanbanToForm(newCols);
                                 }}
                                 className={`mt-0.5 text-[18px] transition-colors material-symbols-outlined flex-shrink-0 ${item.completed ? 'text-primary-container' : 'text-on-surface/40 hover:text-on-surface'}`}
                               >
                                 {item.completed ? 'check_box' : 'check_box_outline_blank'}
                               </button>

                               <textarea 
                                  value={item.text}
                                  onChange={(e) => {
                                     const newCols = [...kanbanCols];
                                     newCols[colIndex].items[itemIndex].text = e.target.value;
                                     setKanbanCols(newCols);
                                     syncKanbanToForm(newCols);
                                  }}
                                  rows={1}
                                  className={`w-full bg-transparent text-sm focus:outline-none resize-none transition-all ${item.completed ? 'text-on-surface/50 line-through' : 'text-on-surface'}`}
                                  placeholder="Nova tarefa..."
                                  onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                               />

                               <button 
                                 onClick={() => {
                                     const newCols = [...kanbanCols];
                                     newCols[colIndex].items.splice(itemIndex, 1);
                                     setKanbanCols(newCols);
                                     syncKanbanToForm(newCols);
                                 }} 
                                 className="text-on-surface/40 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                 title="Excluir item"
                               >
                                 <span className="material-symbols-outlined text-[16px]">delete</span>
                               </button>
                            </div>
                         ))}
                         
                         <button 
                           onClick={() => {
                              const newCols = [...kanbanCols];
                              if(!newCols[colIndex].items) newCols[colIndex].items = [];
                              newCols[colIndex].items.push({ id: Date.now() + Math.random(), text: "", completed: false });
                              setKanbanCols(newCols);
                              syncKanbanToForm(newCols);
                           }}
                           className="w-full py-2 flex items-center justify-center gap-1 mt-1 rounded text-xs font-bold text-on-surface/40 hover:text-on-surface hover:bg-on-surface/10 transition-colors border border-dashed border-outline-variant/30"
                         >
                           <span className="material-symbols-outlined text-[16px]">add</span> ADICIONAR ITEM
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Área de notas pessoais */}
              <div className="flex flex-col gap-2 flex-1 pb-4">
                <label className="block text-xs font-black uppercase tracking-widest text-primary-container">Notas pessoais</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={10} className="w-full h-full bg-transparent border-b border-outline-variant/30 text-on-surface py-2 text-sm font-medium focus:outline-none focus:border-primary-container resize-none" />
                <button onClick={handleSave} disabled={saving} className="mt-6 py-3 bg-primary-container text-white text-xs font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-opacity">
                  {saving ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

}
