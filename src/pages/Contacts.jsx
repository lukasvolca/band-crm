import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import ContactModal from "../components/ContactModal";
import ContactKanbanModal from "../components/ContactKanbanModal";
import CSVImportModal from "../components/CSVImportModal";
import ContactAvatar from "../components/ContactAvatar";

const PRIORITY = [
  { value: 1, label: "Muito Frio", color: "#60a5fa" },
  { value: 2, label: "Frio", color: "#93c5fd" },
  { value: 3, label: "Morno", color: "#9ca3af" },
  { value: 4, label: "Quente", color: "#fb923c" },
  { value: 5, label: "Muito Quente", color: "#ef4444" },
];

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editContact, setEditContact] = useState(null);
  const [kanbanModalOpen, setKanbanModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [actionMenu, setActionMenu] = useState(null);
  const [sort, setSort] = useState({ field: 'created_at', dir: 'desc' });
  const [selected, setSelected] = useState(new Set());
  const [bulkGroupOpen, setBulkGroupOpen] = useState(false);
  const menuRef = useRef(null);

  function toggleSort(field) {
    setSort((prev) =>
      prev.field === field
        ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { field, dir: 'asc' }
    );
  }

  useEffect(() => {
    fetchContacts();
    fetchGroups();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActionMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchContacts() {
    setLoading(true);
    const { data } = await supabase
      .from("contacts")
      .select("*, contact_groups(group_id, groups(name))")
      .order("created_at", { ascending: false });
    setContacts(data || []);
    setLoading(false);
  }

  async function fetchGroups() {
    const { data } = await supabase.from("groups").select("*").order("name");
    setGroups(data || []);
  }

  async function updatePriority(contactId, value) {
    await supabase.from("contacts").update({ priority: value }).eq("id", contactId);
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, priority: value } : c)),
    );
  }

  async function handleDelete(id) {
    await supabase.from("contacts").delete().eq("id", id);
    setActionMenu(null);
    fetchContacts();
  }

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length && filtered.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((c) => c.id)));
    }
  }

  async function handleBulkDelete() {
    if (!selected.size) return;
    await supabase.from('contacts').delete().in('id', [...selected]);
    setSelected(new Set());
    fetchContacts();
  }

  async function handleBulkAddToGroup(groupId) {
    if (!groupId || !selected.size) return;
    const rows = [...selected].map((id) => ({ contact_id: id, group_id: groupId }));
    await supabase.from('contact_groups').upsert(rows, { onConflict: 'contact_id,group_id' });
    setBulkGroupOpen(false);
    setSelected(new Set());
    fetchContacts();
  }

  const filtered = contacts
    .filter((c) => {
      const matchSearch =
        !search ||
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.instagram?.toLowerCase().includes(search.toLowerCase());
      const matchGroup =
        !filterGroup ||
        c.contact_groups?.some((cg) => cg.group_id === filterGroup);
      return matchSearch && matchGroup;
    })
    .sort((a, b) => {
      const { field, dir } = sort;
      let av, bv;
      if (field === 'created_at') {
        av = new Date(a.created_at).getTime();
        bv = new Date(b.created_at).getTime();
      } else if (field === 'name') {
        av = a.name?.toLowerCase() ?? '';
        bv = b.name?.toLowerCase() ?? '';
      } else if (field === 'priority') {
        // null always goes to end regardless of direction
        if (a.priority == null && b.priority == null) return 0;
        if (a.priority == null) return 1;
        if (b.priority == null) return -1;
        av = a.priority;
        bv = b.priority;
      } else if (field === 'instagram') {
        av = a.instagram?.toLowerCase() ?? '';
        bv = b.instagram?.toLowerCase() ?? '';
      } else if (field === 'contact') {
        av = (a.phone || a.email || '').toLowerCase();
        bv = (b.phone || b.email || '').toLowerCase();
      } else {
        return 0;
      }
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <header className="flex justify-between items-center px-8 py-5 bg-surface sticky top-0 z-30 border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black text-on-surface tracking-[-0.02em] uppercase">
            Contatos
          </h2>
          <div className="h-4 w-px bg-outline-variant/30" />
          <span className="text-primary-container text-sm font-bold">
            {contacts.length}
          </span>
          <span className="text-on-surface/30 text-xs uppercase tracking-widest">
            registros
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface/30 text-lg">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="BUSCAR..."
              className="bg-surface-container-low border-b border-outline-variant/20 text-on-surface pl-9 pr-4 py-2 text-xs font-bold focus:outline-none focus:border-primary-container w-52 placeholder:text-on-surface/30 transition-colors"
            />
          </div>
          {/* Group filter */}
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="bg-surface-container-low border-b border-outline-variant/20 text-on-surface/60 py-2 px-3 text-xs font-bold focus:outline-none focus:border-primary-container transition-colors"
          >
            <option value="">TODOS OS GRUPOS</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name.toUpperCase()}
              </option>
            ))}
          </select>
          {/* Import CSV */}
          <button
            onClick={() => setCsvModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-outline-variant/30 text-on-surface/50 hover:text-on-surface hover:border-outline-variant transition-colors text-xs font-bold uppercase tracking-widest"
          >
            <span className="material-symbols-outlined text-base">
              upload_file
            </span>
            CSV
          </button>
        </div>
      </header>

      {/* Table */}
      <div className="flex-1 overflow-auto px-8 py-6">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-0 border-b-2 border-on-surface/80 uppercase text-[0.6rem] font-black tracking-[0.15em] py-3 px-4 text-on-surface/40">
          {[
            { label: 'Nome', field: 'name', span: 3 },
            { label: 'Adicionado em', field: 'created_at', span: 2 },
            { label: 'Instagram', field: 'instagram', span: 2 },
            { label: 'Contato', field: 'contact', span: 3 },
            { label: 'Prioridade', field: 'priority', span: 1 },
          ].map(({ label, field, span }) => (
            <div key={label} className={`col-span-${span} flex items-center gap-2`}>
              {label === 'Nome' && (
                <button
                  onClick={toggleSelectAll}
                  className={`w-4 h-4 flex-shrink-0 border flex items-center justify-center transition-colors ${
                    selected.size > 0 && selected.size === filtered.length
                      ? 'bg-primary-container border-primary-container'
                      : 'border-on-surface/20 bg-transparent'
                  }`}
                >
                  {selected.size === filtered.length && filtered.length > 0 ? (
                    <span className="material-symbols-outlined text-white leading-none" style={{ fontSize: '11px', fontVariationSettings: "'wght' 700" }}>check</span>
                  ) : selected.size > 0 ? (
                    <span className="material-symbols-outlined text-primary-container leading-none" style={{ fontSize: '11px', fontVariationSettings: "'wght' 700" }}>remove</span>
                  ) : null}
                </button>
              )}
              {field ? (
                <button
                  onClick={() => toggleSort(field)}
                  className={`flex items-center gap-1 uppercase tracking-[0.15em] text-[0.6rem] font-black transition-colors hover:text-on-surface
                    ${sort.field === field ? 'text-primary-container' : ''}`}
                >
                  {label}
                  <span className="material-symbols-outlined text-[0.7rem] leading-none">
                    {sort.field === field
                      ? sort.dir === 'asc' ? 'arrow_upward' : 'arrow_downward'
                      : 'unfold_more'}
                  </span>
                </button>
              ) : (
                <span>{label}</span>
              )}
            </div>
          ))}
          <div className="col-span-1 text-right">
            <span className="text-[0.6rem] font-black uppercase tracking-[0.15em] text-on-surface/40">Ação</span>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-on-surface/20 text-xs uppercase tracking-widest">
            Carregando...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-on-surface/20 text-xs uppercase tracking-widest">
            Nenhum contato encontrado
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {filtered.map((contact) => (
              <div
                key={contact.id}
                className="grid grid-cols-12 gap-0 items-center py-5 px-4 hover:bg-surface-container-low transition-colors group relative"
              >
                {/* Name + Avatar + Groups */}
                <div className="col-span-3 flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSelect(contact.id); }}
                    className={`w-4 h-4 flex-shrink-0 border flex items-center justify-center transition-colors ${
                      selected.has(contact.id)
                        ? 'bg-primary-container border-primary-container'
                        : 'border-on-surface/20 bg-transparent'
                    }`}
                  >
                    {selected.has(contact.id) && (
                      <span className="material-symbols-outlined text-white leading-none" style={{ fontSize: '11px', fontVariationSettings: "'wght' 700" }}>check</span>
                    )}
                  </button>
                  <div
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                    onClick={() => { setEditContact(contact); setKanbanModalOpen(true); }}
                  >
                    <ContactAvatar
                      name={contact.name}
                      instagram={contact.instagram}
                      avatarUrl={contact.avatar_url}
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-black uppercase tracking-tight group-hover:text-primary-container transition-colors truncate">
                        {contact.name}
                      </h4>
                      <p className="text-[0.6rem] text-on-surface/30 uppercase tracking-wide truncate max-w-[160px] mt-0.5">
                        {contact.contact_groups?.length
                          ? contact.contact_groups.map((cg) => cg.groups?.name).filter(Boolean).join(', ')
                          : 'sem grupo'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Added date */}
                <div className="col-span-2">
                  <p className="text-[0.55rem] font-black uppercase tracking-widest text-on-surface/30 mb-0.5">Adicionado em</p>
                  <p className="text-xs font-medium text-on-surface/60">
                    {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(contact.created_at))}
                  </p>
                </div>

                {/* Instagram */}
                <div className="col-span-2">
                  {contact.instagram ? (
                    <a
                      href={`https://www.instagram.com/${contact.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[0.68rem] font-bold text-primary-container hover:underline cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      @{contact.instagram.replace("@", "")}
                    </a>
                  ) : (
                    <span className="text-on-surface/20 text-xs">—</span>
                  )}
                </div>

                {/* Contact info */}
                <div className="col-span-3">
                  {contact.email && (
                    <p className="text-xs font-medium tracking-tight truncate">
                      {contact.email}
                    </p>
                  )}
                  {contact.phone && (
                    <p className="text-[0.65rem] text-on-surface/40 font-bold">
                      {contact.phone}
                    </p>
                  )}
                </div>

                {/* Priority dots — cumulative fill */}
                <div className="col-span-1 flex gap-1 items-center">
                  {PRIORITY.map((p) => (
                    <button
                      key={p.value}
                      title={p.label}
                      onClick={() =>
                        updatePriority(
                          contact.id,
                          contact.priority === p.value ? null : p.value,
                        )
                      }
                      className="w-3 h-3 transition-transform hover:scale-125 flex-shrink-0"
                      style={{
                        backgroundColor:
                          contact.priority != null && p.value <= contact.priority
                            ? p.color
                            : 'rgba(255,255,255,0.1)',
                        boxShadow:
                          contact.priority === p.value
                            ? `0 0 6px ${p.color}`
                            : 'none',
                      }}
                    />
                  ))}
                </div>

                {/* Action menu */}
                <div
                  className="col-span-1 text-right relative"
                  ref={actionMenu === contact.id ? menuRef : null}
                >
                  <button
                    onClick={() =>
                      setActionMenu(
                        actionMenu === contact.id ? null : contact.id,
                      )
                    }
                    className="p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-on-surface/50">
                      more_vert
                    </span>
                  </button>
                  {actionMenu === contact.id && (
                    <div className="absolute right-0 top-full mt-1 bg-surface-container-high border border-outline-variant/20 z-50 min-w-[130px]">
                      <button
                        onClick={() => {
                          setEditContact(contact);
                          setModalOpen(true);
                          setActionMenu(null);
                        }}
                        className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-on-surface/70 hover:bg-surface-bright hover:text-on-surface transition-colors flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">
                          edit
                        </span>
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-primary-container hover:bg-primary-container hover:text-white transition-colors flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">
                          delete
                        </span>
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-surface-container-high border border-outline-variant/30 flex items-center gap-3 px-5 py-3 shadow-2xl">
          <span className="text-xs font-black uppercase tracking-widest text-on-surface/60 whitespace-nowrap">
            {selected.size} selecionado{selected.size !== 1 ? 's' : ''}
          </span>
          <div className="w-px h-4 bg-outline-variant/30" />
          <div className="relative">
            <button
              onClick={() => setBulkGroupOpen((v) => !v)}
              className="flex items-center gap-2 px-3 py-1.5 border border-outline-variant/30 text-xs font-bold uppercase tracking-widest text-on-surface/70 hover:text-on-surface hover:border-outline-variant transition-colors whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-sm">group_add</span>
              Adicionar ao grupo
            </button>
            {bulkGroupOpen && (
              <div className="absolute bottom-full mb-2 left-0 bg-surface-container-high border border-outline-variant/20 z-50 min-w-[160px]">
                {groups.length === 0 && (
                  <p className="px-4 py-3 text-xs text-on-surface/30 uppercase tracking-widest">Sem grupos</p>
                )}
                {groups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handleBulkAddToGroup(g.id)}
                    className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-on-surface/70 hover:bg-surface-bright hover:text-on-surface transition-colors"
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary-container text-white text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            Excluir
          </button>
          <button
            onClick={() => { setSelected(new Set()); setBulkGroupOpen(false); }}
            className="p-1 text-on-surface/40 hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => {
          setEditContact(null);
          setModalOpen(true);
        }}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary-container text-white flex items-center justify-center hover:outline hover:outline-2 hover:outline-white transition-all z-40"
        title="Novo contato"
      >
        <span
          className="material-symbols-outlined text-2xl"
          style={{ fontVariationSettings: "'wght' 700" }}
        >
          add
        </span>
      </button>

      {/* Modals */}
      {modalOpen && (
        <ContactModal
          contact={editContact}
          groups={groups}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            fetchContacts();
          }}
        />
      )}
      {kanbanModalOpen && editContact && (
        <ContactKanbanModal
          contact={editContact}
          groups={groups}
          onClose={() => setKanbanModalOpen(false)}
          onSaved={() => {
            setKanbanModalOpen(false);
            fetchContacts();
          }}
        />
      )}
      {csvModalOpen && (
        <CSVImportModal
          groups={groups}
          onClose={() => setCsvModalOpen(false)}
          onImported={() => {
            setCsvModalOpen(false);
            fetchContacts();
          }}
        />
      )}
    </div>
  );
}
