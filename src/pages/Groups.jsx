import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function GroupModal({ group, onClose, onSaved }) {
  const [name, setName] = useState(group?.name || "");
  const [description, setDescription] = useState(group?.description || "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    if (group) {
      await supabase
        .from("groups")
        .update({ name, description })
        .eq("id", group.id);
    } else {
      await supabase.from("groups").insert({ name, description });
    }
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-surface-container-low w-full max-w-md border border-outline-variant/20">
        <div className="flex justify-between items-center px-6 py-5 border-b border-outline-variant/10">
          <h3 className="text-lg font-black uppercase tracking-tight text-on-surface">
            {group ? "Editar Grupo" : "Novo Grupo"}
          </h3>
          <button
            onClick={onClose}
            className="text-on-surface/40 hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-6">
          <div>
            <label className="block text-[0.6rem] font-black uppercase tracking-[0.2em] text-primary-container mb-2">
              Nome *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Casas de Show"
              className="w-full bg-transparent border-b border-outline-variant/30 text-on-surface py-2 text-sm font-medium focus:outline-none focus:border-primary-container transition-colors placeholder:text-on-surface/20"
            />
          </div>
          <div>
            <label className="block text-[0.6rem] font-black uppercase tracking-[0.2em] text-primary-container mb-2">
              Descrição
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição opcional"
              className="w-full bg-transparent border-b border-outline-variant/30 text-on-surface py-2 text-sm font-medium focus:outline-none focus:border-primary-container transition-colors placeholder:text-on-surface/20"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-outline-variant/30 text-on-surface/50 hover:text-on-surface text-xs font-black uppercase tracking-widest transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-gradient-to-b from-primary-container to-on-primary-fixed-variant text-white text-xs font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [contactCounts, setContactCounts] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  async function fetchGroups() {
    setLoading(true);
    const { data } = await supabase
      .from("groups")
      .select("*, contact_groups(contact_id)")
      .order("name");
    if (data) {
      setGroups(data);
      const counts = {};
      data.forEach((g) => {
        counts[g.id] = g.contact_groups?.length || 0;
      });
      setContactCounts(counts);
    }
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!confirm("Excluir este grupo? Os contatos não serão excluídos."))
      return;
    await supabase.from("groups").delete().eq("id", id);
    fetchGroups();
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex justify-between items-center px-8 py-5 bg-surface sticky top-0 z-30 border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black text-on-surface tracking-[-0.02em] uppercase">
            Grupos
          </h2>
          <div className="h-4 w-px bg-outline-variant/30" />
          <span className="text-on-surface/30 text-xs uppercase tracking-widest">
            {groups.length} grupos
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-8 py-6">
        {loading ? (
          <div className="py-20 text-center text-on-surface/20 text-xs uppercase tracking-widest">
            Carregando...
          </div>
        ) : groups.length === 0 ? (
          <div className="py-20 text-center text-on-surface/20 text-xs uppercase tracking-widest">
            Nenhum grupo criado
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-px bg-outline-variant/10">
            {groups.map((group) => (
              <div
                key={group.id}
                className="bg-surface flex items-center justify-between px-6 py-5 hover:bg-surface-container-low transition-colors group"
              >
                <div>
                  <h4 className="text-base font-black uppercase tracking-tight text-on-surface group-hover:text-primary-container transition-colors">
                    {group.name}
                  </h4>
                  {group.description && (
                    <p className="text-[0.65rem] text-on-surface/40 mt-0.5">
                      {group.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-[0.6rem] font-black uppercase tracking-widest text-on-surface/30">
                    {contactCounts[group.id] || 0} contatos
                  </span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditGroup(group);
                        setModalOpen(true);
                      }}
                      className="p-2 text-on-surface/50 hover:text-on-surface transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">
                        edit
                      </span>
                    </button>
                    <button
                      onClick={() => handleDelete(group.id)}
                      className="p-2 text-on-surface/50 hover:text-primary-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">
                        delete
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => {
          setEditGroup(null);
          setModalOpen(true);
        }}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary-container text-white flex items-center justify-center hover:outline hover:outline-2 hover:outline-white transition-all z-40"
        title="Novo grupo"
      >
        <span
          className="material-symbols-outlined text-2xl"
          style={{ fontVariationSettings: "'wght' 700" }}
        >
          add
        </span>
      </button>

      {modalOpen && (
        <GroupModal
          group={editGroup}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            fetchGroups();
          }}
        />
      )}
    </div>
  );
}
