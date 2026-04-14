import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import ContactAvatar from "./ContactAvatar";

const EMPTY = {
  name: "",
  phone: "",
  email: "",
  instagram: "",
  notes: "",
  avatar_url: "",
};

export default function ContactModal({ contact, groups, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    if (contact) {
      setForm({
        name: contact.name || "",
        phone: contact.phone || "",
        email: contact.email || "",
        instagram: contact.instagram || "",
        notes: contact.notes || "",
        avatar_url: contact.avatar_url || "",
      });
      setSelectedGroups(contact.contact_groups?.map((cg) => cg.group_id) || []);
    }
  }, [contact]);

  async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError("");
    const ext = file.name.split(".").pop();
    const path = `avatars/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setError("Erro ao enviar imagem: " + upErr.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setForm((prev) => ({ ...prev, avatar_url: data.publicUrl }));
    setUploading(false);
  }

  function toggleGroup(id) {
    setSelectedGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    // eslint-disable-next-line no-unused-vars
    const { avatar_url, ...formWithoutAvatar } = form;
    const payload = { ...formWithoutAvatar };

    let contactId = contact?.id;

    if (contact) {
      const { error } = await supabase
        .from("contacts")
        .update(payload)
        .eq("id", contact.id);
      if (error) {
        setError(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("contacts")
        .insert(payload)
        .select()
        .single();
      if (error) {
        setError(error.message);
        setSaving(false);
        return;
      }
      contactId = data.id;
    }

    // Sync groups
    await supabase.from("contact_groups").delete().eq("contact_id", contactId);
    if (selectedGroups.length > 0) {
      await supabase.from("contact_groups").insert(
        selectedGroups.map((group_id) => ({
          contact_id: contactId,
          group_id,
        })),
      );
    }

    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-surface-container-low w-full max-w-lg border border-outline-variant/20">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-outline-variant/10">
          <h3 className="text-lg font-black uppercase tracking-tight text-on-surface">
            {contact ? "Editar Contato" : "Novo Contato"}
          </h3>
          <button
            onClick={onClose}
            className="text-on-surface/40 hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-6">
          {/* Avatar upload */}
          <div className="flex items-center gap-5">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative group flex-shrink-0"
              title="Alterar foto"
            >
              <ContactAvatar
                name={form.name}
                instagram={form.instagram}
                avatarUrl={form.avatar_url}
                size="lg"
              />
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-white text-xl">
                  {uploading ? "hourglass_empty" : "photo_camera"}
                </span>
              </div>
            </button>
            <div className="flex flex-col gap-2">
              <p className="text-[0.6rem] font-black uppercase tracking-[0.15em] text-on-surface/40">
                Foto do contato
              </p>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-widest text-on-surface/40 hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-sm">
                  upload
                </span>
                {uploading ? "Enviando..." : "Upload manual"}
              </button>
            </div>
          </div>

          {[
            {
              field: "name",
              label: "Nome *",
              placeholder: "Nome completo",
              type: "text",
              required: true,
            },
            {
              field: "phone",
              label: "Telefone",
              placeholder: "+55 11 99999-9999",
              type: "text",
            },
            {
              field: "email",
              label: "Email",
              placeholder: "email@exemplo.com",
              type: "email",
            },
            {
              field: "instagram",
              label: "Instagram",
              placeholder: "@handle",
              type: "text",
            },
          ].map(({ field, label, placeholder, type, required }) => (
            <div key={field}>
              <label className="block text-[0.6rem] font-black uppercase tracking-[0.2em] text-primary-container mb-2">
                {label}
              </label>
              <input
                type={type}
                value={form[field]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [field]: e.target.value }))
                }
                required={required}
                placeholder={placeholder}
                className="w-full bg-transparent border-b border-outline-variant/30 text-on-surface py-2 text-sm font-medium focus:outline-none focus:border-primary-container transition-colors placeholder:text-on-surface/20"
              />
            </div>
          ))}

          {/* Notes */}
          <div>
            <label className="block text-[0.6rem] font-black uppercase tracking-[0.2em] text-primary-container mb-2">
              Notas
            </label>
            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Observações sobre o contato..."
              rows={2}
              className="w-full bg-transparent border-b border-outline-variant/30 text-on-surface py-2 text-sm font-medium focus:outline-none focus:border-primary-container transition-colors placeholder:text-on-surface/20 resize-none"
            />
          </div>

          {/* Groups */}
          {groups.length > 0 && (
            <div>
              <label className="block text-[0.6rem] font-black uppercase tracking-[0.2em] text-primary-container mb-3">
                Grupos
              </label>
              <div className="flex flex-wrap gap-2">
                {groups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGroup(g.id)}
                    className={`px-3 py-1.5 text-[0.6rem] font-black uppercase tracking-tighter transition-colors
                      ${
                        selectedGroups.includes(g.id)
                          ? "bg-primary-container text-white"
                          : "bg-surface-container-high text-on-surface/50 hover:text-on-surface"
                      }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-[0.7rem] text-primary-container font-bold uppercase">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
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
