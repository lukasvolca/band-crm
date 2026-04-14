import { useState } from "react";

// Gera uma cor consistente a partir do nome
function nameToColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  // Evita tons muito próximos do vermelho #E01B24 (hue ~350-10) para não conflitar com o design
  const safehue = hue < 20 || hue > 340 ? (hue + 60) % 360 : hue;
  return `hsl(${safehue}, 55%, 35%)`;
}

function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

function InitialsFallback({ name, size }) {
  const dim = size === "lg" ? "w-16 h-16 text-lg" : "w-10 h-10 text-sm";
  return (
    <div
      className={`${dim} flex-shrink-0 flex items-center justify-center font-black`}
      style={{ backgroundColor: nameToColor(name) }}
    >
      <span className="text-white" style={{ letterSpacing: "-0.03em" }}>
        {getInitials(name)}
      </span>
    </div>
  );
}

/**
 * ContactAvatar
 * Priority: avatar_url (manual upload) > instagram (unavatar.io) > initials
 */
export default function ContactAvatar({
  name = "",
  instagram = "",
  avatarUrl = "",
  size = "md",
}) {
  const [imgError, setImgError] = useState(false);
  const dim = size === "lg" ? "w-16 h-16" : "w-10 h-10";

  const handle = instagram?.replace("@", "").trim();

  // 1. Manual upload
  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${dim} flex-shrink-0 object-cover`}
        onError={() => setImgError(true)}
      />
    );
  }

  // 2. Instagram via unavatar.io
  if (handle && !imgError) {
    return (
      <img
        src={`https://unavatar.io/instagram/${handle}`}
        alt={name}
        className={`${dim} flex-shrink-0 object-cover`}
        onError={() => setImgError(true)}
        referrerPolicy="no-referrer"
      />
    );
  }

  // 3. Initials fallback
  return <InitialsFallback name={name} size={size} />;
}
