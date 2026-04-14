import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const CHANNELS = [
  { value: "whatsapp", label: "WhatsApp", icon: "chat" },
  { value: "email", label: "Email", icon: "mail" },
  { value: "instagram", label: "Instagram", icon: "photo_camera" },
  { value: "all", label: "Todos", icon: "hub" },
];

function CampaignModal({ campaign, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: campaign?.name || "",
    description: campaign?.description || "",
    message_template: campaign?.message_template || "",
    channel: campaign?.channel || "whatsapp",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    if (campaign) {
      await supabase.from("campaigns").update(form).eq("id", campaign.id);
    } else {
      await supabase.from("campaigns").insert(form);
    }
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-surface-container-low w-full max-w-lg border border-outline-variant/20">
        <div className="flex justify-between items-center px-6 py-5 border-b border-outline-variant/10">
          <h3 className="text-lg font-black uppercase tracking-tight text-on-surface">
            {campaign ? "Editar Campanha" : "Nova Campanha"}
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
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
              placeholder="Ex: Divulgar músicas"
              className="w-full bg-transparent border-b border-outline-variant/30 text-on-surface py-2 text-sm font-medium focus:outline-none focus:border-primary-container transition-colors placeholder:text-on-surface/20"
            />
          </div>
          <div>
            <label className="block text-[0.6rem] font-black uppercase tracking-[0.2em] text-primary-container mb-2">
              Descrição
            </label>
            <input
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Descrição da campanha"
              className="w-full bg-transparent border-b border-outline-variant/30 text-on-surface py-2 text-sm font-medium focus:outline-none focus:border-primary-container transition-colors placeholder:text-on-surface/20"
            />
          </div>
          <div>
            <label className="block text-[0.6rem] font-black uppercase tracking-[0.2em] text-primary-container mb-2">
              Canal
            </label>
            <div className="flex gap-2 flex-wrap">
              {CHANNELS.map((ch) => (
                <button
                  key={ch.value}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, channel: ch.value }))}
                  className={`flex items-center gap-2 px-3 py-2 text-[0.6rem] font-black uppercase tracking-tighter transition-colors
                    ${form.channel === ch.value ? "bg-primary-container text-white" : "bg-surface-container-high text-on-surface/50 hover:text-on-surface"}`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {ch.icon}
                  </span>
                  {ch.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[0.6rem] font-black uppercase tracking-[0.2em] text-primary-container mb-2">
              Mensagem Template
            </label>
            <textarea
              value={form.message_template}
              onChange={(e) =>
                setForm((p) => ({ ...p, message_template: e.target.value }))
              }
              placeholder="Digite a mensagem. Use {nome} para personalizar."
              rows={4}
              className="w-full bg-transparent border-b border-outline-variant/30 text-on-surface py-2 text-sm font-medium focus:outline-none focus:border-primary-container transition-colors placeholder:text-on-surface/20 resize-none"
            />
            <p className="text-[0.55rem] text-on-surface/30 mt-1 uppercase tracking-wide">
              Use {"{nome}"} para inserir o nome do contato automaticamente
            </p>
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

function SendModal({ campaign, onClose }) {
  // --- Comunicação com abas filhas (Instagram) ---
  useEffect(() => {
    function handleMsg(e) {
      if (e.data && e.data.type === "band_crm_sent") {
        setBandCrmSignal((s) => s + 1);
      }
    }
    window.addEventListener("message", handleMsg);
    return () => window.removeEventListener("message", handleMsg);
  }, []);

  // Sinalização para controle do fluxo
  const [bandCrmSignal, setBandCrmSignal] = useState(0);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [contacts, setContacts] = useState([]);
  const [sending, setSending] = useState(false);
  const [sentIds, setSentIds] = useState(new Set());
  const [exempt, setExempt] = useState(new Set());
  const [sendingProgress, setSendingProgress] = useState({
    current: 0,
    total: 0,
    pausing: false,
    countdown: 0,
  });

  useEffect(() => {
    supabase
      .from("groups")
      .select("*")
      .order("name")
      .then(({ data }) => setGroups(data || []));
  }, []);

  useEffect(() => {
    if (!selectedGroup) {
      setContacts([]);
      return;
    }
    supabase
      .from("contact_groups")
      .select("contacts(*)")
      .eq("group_id", selectedGroup)
      .then(({ data }) =>
        setContacts(data?.map((cg) => cg.contacts).filter(Boolean) || []),
      );
  }, [selectedGroup]);

  function buildMessage(contact) {
    return (campaign.message_template || "").replace(
      "{nome}",
      contact.name || "",
    );
  }

  const CLOSE_DELAY = 12; // segundos para WhatsApp/Email (usuário aperta Enter/Enviar)

  async function dispatch(contact, channel, autoClose = false) {
    const msg = buildMessage(contact);
    let win = null;

    if (channel === "whatsapp" && contact.phone) {
      const phone = contact.phone.replace(/\D/g, "");
      win = window.open(
        `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
        "_blank",
      );
    } else if (channel === "email" && contact.email) {
      win = window.open(
        `mailto:${contact.email}?body=${encodeURIComponent(msg)}`,
        "_blank",
      );
    } else if (channel === "instagram" && contact.instagram) {
      const handle = contact.instagram.replace("@", "");
      // Passa a mensagem diretamente na URL — sem storage, sem problemas de tracking
      const encodedMsg = encodeURIComponent(msg);
      win = window.open(
        `https://www.instagram.com/${handle}/?band_crm_msg=${encodedMsg}`,
        "_blank",
      );
      if (!win) {
        alert(
          "O navegador bloqueou o pop-up. Libere pop-ups para este site para continuar o disparo automático.",
        );
        throw new Error("Pop-up bloqueado");
      }
      // A extensão gerencia o envio e fecha a aba; sem countdown aqui
      autoClose = false;
    }

    // Delay humano extra para garantir envio real
    await new Promise((r) => setTimeout(r, 1800 + Math.random() * 1200));

    if (win && autoClose) {
      for (let c = CLOSE_DELAY; c > 0; c--) {
        setSendingProgress((p) => ({ ...p, countdown: c }));
        await new Promise((r) => setTimeout(r, 1000));
      }
      setSendingProgress((p) => ({ ...p, countdown: 0 }));
      try {
        win.close();
      } catch (_) {}
    }

    await supabase.from("message_history").insert({
      contact_id: contact.id,
      campaign_id: campaign.id,
      channel,
      status: "sent",
    });
    setSentIds((prev) => new Set([...prev, contact.id]));
  }

  async function dispatchAll() {
    const filtered = contacts.filter((c) => !exempt.has(c.id));
    if (!filtered.length) return;
    setSending(true);
    const ch = campaign.channel === "all" ? "whatsapp" : campaign.channel;
    setSendingProgress({ current: 0, total: filtered.length, pausing: false });

    let signalCount = 0;
    for (let i = 0; i < filtered.length; i++) {
      // Instagram: espera sinal da aba OU timeout de 10s
      if (ch === "instagram") {
        const prevSignal = bandCrmSignal;
        await dispatch(filtered[i], ch, true);
        await Promise.race([
          new Promise((resolve) => {
            const check = () => {
              if (bandCrmSignal > prevSignal) resolve();
              else setTimeout(check, 100);
            };
            check();
          }),
          new Promise((resolve) => setTimeout(resolve, 11000)),
        ]);
      } else {
        await dispatch(filtered[i], ch, true);
      }
      setSendingProgress((p) => ({ ...p, current: i + 1 }));
    }
    setSending(false);
    setSendingProgress({ current: 0, total: 0, pausing: false });
  }

  const channelIcon = {
    whatsapp: "chat",
    email: "mail",
    instagram: "photo_camera",
    all: "hub",
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-surface-container-low w-full max-w-xl border border-outline-variant/20 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center px-6 py-5 border-b border-outline-variant/10 flex-shrink-0">
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-on-surface">
              {campaign.name}
            </h3>
            <p className="text-[0.6rem] text-primary-container font-bold uppercase tracking-widest mt-0.5">
              Disparo de mensagens
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface/40 hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="px-6 py-4 border-b border-outline-variant/10 flex-shrink-0">
          <label className="block text-[0.6rem] font-black uppercase tracking-[0.2em] text-primary-container mb-2">
            Selecionar Grupo
          </label>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full bg-surface-container-low border-b border-outline-variant/30 text-on-surface py-2 text-sm font-medium focus:outline-none focus:border-primary-container transition-colors"
          >
            <option value="">Escolha um grupo...</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {contacts.length > 0 && (
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-outline-variant/10">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`flex items-center justify-between px-6 py-4 ${sentIds.has(contact.id) ? "opacity-40" : "hover:bg-surface-container-low"} transition-colors`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!exempt.has(contact.id)}
                        onChange={(e) => {
                          setExempt((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) {
                              next.delete(contact.id);
                            } else {
                              next.add(contact.id);
                            }
                            return next;
                          });
                        }}
                        className="accent-primary-container w-4 h-4"
                        disabled={sending}
                        title="Incluir/Isentar deste disparo"
                      />
                      <div>
                        <p className="text-sm font-black uppercase tracking-tight text-on-surface">
                          {contact.name}
                        </p>
                        <p className="text-[0.6rem] text-on-surface/40">
                          {contact.phone ||
                            contact.email ||
                            contact.instagram ||
                            "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      {sentIds.has(contact.id) && (
                        <span className="text-[0.55rem] text-on-surface/30 uppercase tracking-widest">
                          enviado
                        </span>
                      )}
                      {campaign.channel === "all" ? (
                        <>
                          {contact.phone && (
                            <button
                              onClick={() => dispatch(contact, "whatsapp")}
                              className="p-1.5 bg-surface-container-high hover:bg-primary-container text-on-surface/50 hover:text-white transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">
                                chat
                              </span>
                            </button>
                          )}
                          {contact.email && (
                            <button
                              onClick={() => dispatch(contact, "email")}
                              className="p-1.5 bg-surface-container-high hover:bg-primary-container text-on-surface/50 hover:text-white transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">
                                mail
                              </span>
                            </button>
                          )}
                          {contact.instagram && (
                            <button
                              onClick={() => dispatch(contact, "instagram")}
                              className="p-1.5 bg-surface-container-high hover:bg-primary-container text-on-surface/50 hover:text-white transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">
                                photo_camera
                              </span>
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => dispatch(contact, campaign.channel)}
                          disabled={sentIds.has(contact.id)}
                          className="p-1.5 bg-surface-container-high hover:bg-primary-container text-on-surface/50 hover:text-white transition-colors disabled:opacity-30"
                        >
                          <span className="material-symbols-outlined text-sm">
                            {channelIcon[campaign.channel]}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-outline-variant/10 flex-shrink-0">
              {sending && (
                <div className="mb-3">
                  <div className="flex justify-between text-[0.6rem] font-black uppercase tracking-widest text-on-surface/40 mb-1.5">
                    <span>
                      {sendingProgress.countdown > 0
                        ? `Fechando aba em ${sendingProgress.countdown}s... aperte Enter agora`
                        : sendingProgress.pausing
                          ? "Aguardando próximo lote..."
                          : `Enviando ${sendingProgress.current} de ${sendingProgress.total}`}
                    </span>
                    <span>
                      {Math.round(
                        (sendingProgress.current / sendingProgress.total) * 100,
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full h-0.5 bg-surface-container-high">
                    <div
                      className="h-full bg-primary-container transition-all duration-300"
                      style={{
                        width: `${(sendingProgress.current / sendingProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
              <button
                onClick={dispatchAll}
                disabled={sending}
                className="w-full py-3 bg-gradient-to-b from-primary-container to-on-primary-fixed-variant text-white text-xs font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">
                  send
                </span>
                {sending
                  ? sendingProgress.countdown > 0
                    ? `Aba fecha em ${sendingProgress.countdown}s...`
                    : sendingProgress.pausing
                      ? "Pausando entre lotes..."
                      : `Enviando ${sendingProgress.current}/${sendingProgress.total}...`
                  : `Enviar para todos (${contacts.length})`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState(null);
  const [sendCampaign, setSendCampaign] = useState(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    setLoading(true);
    const { data } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    setCampaigns(data || []);
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!confirm("Excluir esta campanha?")) return;
    await supabase.from("campaigns").delete().eq("id", id);
    fetchCampaigns();
  }

  const channelLabel = {
    whatsapp: "WhatsApp",
    email: "Email",
    instagram: "Instagram",
    all: "Todos",
  };
  const channelIcon = {
    whatsapp: "chat",
    email: "mail",
    instagram: "photo_camera",
    all: "hub",
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex justify-between items-center px-8 py-5 bg-surface sticky top-0 z-30 border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black text-on-surface tracking-[-0.02em] uppercase">
            Campanhas
          </h2>
          <div className="h-4 w-px bg-outline-variant/30" />
          <span className="text-on-surface/30 text-xs uppercase tracking-widest">
            {campaigns.length} campanhas
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-8 py-6">
        {loading ? (
          <div className="py-20 text-center text-on-surface/20 text-xs uppercase tracking-widest">
            Carregando...
          </div>
        ) : campaigns.length === 0 ? (
          <div className="py-20 text-center text-on-surface/20 text-xs uppercase tracking-widest">
            Nenhuma campanha criada
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-px bg-outline-variant/10">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="bg-surface flex items-center justify-between px-6 py-5 hover:bg-surface-container-low transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-base font-black uppercase tracking-tight text-on-surface group-hover:text-primary-container transition-colors">
                      {campaign.name}
                    </h4>
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-surface-container-high text-[0.55rem] font-black uppercase tracking-tight text-on-surface/50">
                      <span className="material-symbols-outlined text-xs">
                        {channelIcon[campaign.channel]}
                      </span>
                      {channelLabel[campaign.channel]}
                    </span>
                  </div>
                  {campaign.description && (
                    <p className="text-[0.65rem] text-on-surface/40">
                      {campaign.description}
                    </p>
                  )}
                  {campaign.message_template && (
                    <p className="text-[0.65rem] text-on-surface/25 mt-1 truncate max-w-lg">
                      {campaign.message_template}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 items-center ml-4">
                  <button
                    onClick={() => setSendCampaign(campaign)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-container text-white text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-sm">
                      send
                    </span>
                    Disparar
                  </button>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditCampaign(campaign);
                        setModalOpen(true);
                      }}
                      className="p-2 text-on-surface/50 hover:text-on-surface transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">
                        edit
                      </span>
                    </button>
                    <button
                      onClick={() => handleDelete(campaign.id)}
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
          setEditCampaign(null);
          setModalOpen(true);
        }}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary-container text-white flex items-center justify-center hover:outline hover:outline-2 hover:outline-white transition-all z-40"
        title="Nova campanha"
      >
        <span
          className="material-symbols-outlined text-2xl"
          style={{ fontVariationSettings: "'wght' 700" }}
        >
          add
        </span>
      </button>

      {modalOpen && (
        <CampaignModal
          campaign={editCampaign}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            fetchCampaigns();
          }}
        />
      )}
      {sendCampaign && (
        <SendModal
          campaign={sendCampaign}
          onClose={() => setSendCampaign(null)}
        />
      )}
    </div>
  );
}
