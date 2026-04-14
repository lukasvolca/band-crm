import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const channelIcon = {
  whatsapp: "chat",
  email: "mail",
  instagram: "photo_camera",
};
const channelLabel = {
  whatsapp: "WhatsApp",
  email: "Email",
  instagram: "Instagram",
};

export default function History() {
  const [history, setHistory] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCampaign, setFilterCampaign] = useState("");
  const [filterChannel, setFilterChannel] = useState("");

  useEffect(() => {
    fetchHistory();
    supabase
      .from("campaigns")
      .select("id, name")
      .order("name")
      .then(({ data }) => setCampaigns(data || []));
  }, []);

  async function fetchHistory() {
    setLoading(true);
    const { data } = await supabase
      .from("message_history")
      .select("*, contacts(name, phone, email, instagram), campaigns(name)")
      .order("sent_at", { ascending: false })
      .limit(200);
    setHistory(data || []);
    setLoading(false);
  }

  const filtered = history.filter((h) => {
    const matchCampaign = !filterCampaign || h.campaign_id === filterCampaign;
    const matchChannel = !filterChannel || h.channel === filterChannel;
    return matchCampaign && matchChannel;
  });

  function formatDate(str) {
    if (!str) return "—";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(str));
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex justify-between items-center px-8 py-5 bg-surface sticky top-0 z-30 border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black text-on-surface tracking-[-0.02em] uppercase">
            Histórico
          </h2>
          <div className="h-4 w-px bg-outline-variant/30" />
          <span className="text-on-surface/30 text-xs uppercase tracking-widest">
            {filtered.length} registros
          </span>
        </div>
        <div className="flex gap-3">
          <select
            value={filterCampaign}
            onChange={(e) => setFilterCampaign(e.target.value)}
            className="bg-surface-container-low border-b border-outline-variant/20 text-on-surface/60 py-2 px-3 text-xs font-bold focus:outline-none focus:border-primary-container transition-colors"
          >
            <option value="">TODAS AS CAMPANHAS</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name.toUpperCase()}
              </option>
            ))}
          </select>
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="bg-surface-container-low border-b border-outline-variant/20 text-on-surface/60 py-2 px-3 text-xs font-bold focus:outline-none focus:border-primary-container transition-colors"
          >
            <option value="">TODOS OS CANAIS</option>
            <option value="whatsapp">WHATSAPP</option>
            <option value="email">EMAIL</option>
            <option value="instagram">INSTAGRAM</option>
          </select>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="grid grid-cols-12 gap-0 border-b-2 border-on-surface/80 uppercase text-[0.6rem] font-black tracking-[0.15em] py-3 px-4 text-on-surface/40">
          <div className="col-span-3">Contato</div>
          <div className="col-span-3">Campanha</div>
          <div className="col-span-2">Canal</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Data</div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-on-surface/20 text-xs uppercase tracking-widest">
            Carregando...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-on-surface/20 text-xs uppercase tracking-widest">
            Nenhum registro encontrado
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {filtered.map((h) => (
              <div
                key={h.id}
                className="grid grid-cols-12 gap-0 items-center py-4 px-4 hover:bg-surface-container-low transition-colors"
              >
                <div className="col-span-3">
                  <p className="text-sm font-bold text-on-surface">
                    {h.contacts?.name || "—"}
                  </p>
                  <p className="text-[0.6rem] text-on-surface/30">
                    {h.contacts?.email || h.contacts?.phone || ""}
                  </p>
                </div>
                <div className="col-span-3">
                  <p className="text-xs text-on-surface/60 font-medium">
                    {h.campaigns?.name || "—"}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="flex items-center gap-1.5 text-[0.65rem] font-bold text-on-surface/50">
                    <span className="material-symbols-outlined text-sm">
                      {channelIcon[h.channel] || "hub"}
                    </span>
                    {channelLabel[h.channel] || h.channel}
                  </span>
                </div>
                <div className="col-span-2">
                  <span
                    className={`inline-block px-2 py-0.5 text-[0.55rem] font-black uppercase tracking-tighter
                    ${h.status === "sent" ? "bg-white text-black" : "bg-primary-container text-white"}`}
                  >
                    {h.status === "sent" ? "Enviado" : "Falha"}
                  </span>
                </div>
                <div className="col-span-2 text-right">
                  <p className="text-[0.6rem] text-on-surface/30 font-medium">
                    {formatDate(h.sent_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
