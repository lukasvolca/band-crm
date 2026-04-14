// Roda em todas as páginas do instagram.com
// Lê a mensagem do parâmetro ?band_crm_msg= da URL — sem storage, sem tracking prevention

const LOG = (...a) => console.log("[BandCRM]", ...a);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function waitForElement(selectors, timeout = 20000) {
  return new Promise((resolve) => {
    const check = () => {
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) return el;
      }
      return null;
    };
    const found = check();
    if (found) return resolve(found);

    const observer = new MutationObserver(() => {
      const el = check();
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

function isProfilePage() {
  const path = window.location.pathname;
  return (
    /^\/[^/]+\/?$/.test(path) &&
    ![
      "explore",
      "direct",
      "reels",
      "stories",
      "accounts",
      "p",
      "tv",
      "reel",
    ].includes(path.replace(/\//g, ""))
  );
}

function isDirectPage() {
  return window.location.pathname.startsWith("/direct/");
}

async function sendDM(message) {
  LOG("sendDM iniciado, buscando campo de texto...");

  const inputSelectors = [
    'div[contenteditable="true"][aria-placeholder*="ensagem"]',
    'div[contenteditable="true"][aria-placeholder*="essage"]',
    'div[contenteditable="true"][data-lexical-editor]',
    'div[role="textbox"][contenteditable="true"]',
    'div[contenteditable="true"]',
  ];
  const input = await waitForElement(inputSelectors);

  // Se não encontrou pelo seletor, usa o elemento focado (modal já deixa focado)
  const target = input || document.activeElement;
  if (input) {
    LOG("Campo encontrado:", input.outerHTML.slice(0, 120));
    input.click();
    input.focus();
    await sleep(900 + Math.random() * 700); // delay humano
  } else {
    LOG(
      "Campo não encontrado pelo seletor, usando document.activeElement:",
      document.activeElement?.tagName,
      document.activeElement?.getAttribute("contenteditable"),
    );
    await sleep(900 + Math.random() * 700);
  }

  LOG("Tentando insertText...");
  await sleep(400 + Math.random() * 400); // delay humano
  const ok = document.execCommand("insertText", false, message);
  LOG(
    "insertText retornou:",
    ok,
    "| conteúdo:",
    target?.innerText?.slice(0, 50),
  );

  await sleep(900 + Math.random() * 700);

  if (!target?.innerText?.trim()) {
    LOG("insertText falhou, tentando DataTransfer paste...");
    const dt = new DataTransfer();
    dt.setData("text/plain", message);
    (target || document.activeElement).dispatchEvent(
      new ClipboardEvent("paste", {
        clipboardData: dt,
        bubbles: true,
        cancelable: true,
      }),
    );
    await sleep(900 + Math.random() * 700);
    LOG("Após paste:", target?.innerText?.slice(0, 50));
  }

  LOG("Enviando com Enter...");
  await sleep(700 + Math.random() * 600); // delay humano
  (target || document.activeElement).dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Enter",
      code: "Enter",
      keyCode: 13,
      which: 13,
      bubbles: true,
    }),
  );

  await sleep(2000 + Math.random() * 1200); // delay humano antes de fechar
  // Sinaliza para o opener (CRM) que terminou
  try {
    if (window.opener) {
      window.opener.postMessage({ type: "band_crm_sent", status: "ok" }, "*");
    }
  } catch (e) {}
  window.close();
}

(async () => {
  LOG("Script iniciado, URL:", window.location.href);

  // Lê mensagem diretamente do parâmetro da URL
  const params = new URLSearchParams(window.location.search);
  const message = params.get("band_crm_msg");

  if (!message) {
    LOG("Sem parâmetro band_crm_msg, encerrando.");
    return;
  }
  LOG("Mensagem encontrada na URL:", decodeURIComponent(message).slice(0, 50));

  const decodedMessage = decodeURIComponent(message);

  // ── FASE 1: página de perfil ──────────────────────────────────────────────
  if (isProfilePage()) {
    LOG("Fase 1: perfil, aguardando 3s...");
    await sleep(3000);

    const XPATH =
      "/html/body/div[1]/div/div/div[2]/div/div/div[1]/div[2]/div[2]/section/main/div/div/header/section[2]/div/div/div/div/div[2]/div";
    const xpathBtn = document.evaluate(
      XPATH,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    ).singleNodeValue;

    const textBtn = Array.from(
      document.querySelectorAll('div[role="button"], button'),
    ).find((el) => {
      const txt = el.innerText?.trim().toLowerCase();
      return (
        txt === "enviar mensagem" || txt === "message" || txt === "send message"
      );
    });

    const btn = xpathBtn || textBtn;
    LOG("Botão encontrado:", !!btn, btn?.innerText?.trim());

    if (!btn) {
      LOG("ERRO: botão não encontrado");
      return;
    }

    LOG("Clicando no botão, aguardando modal de chat aparecer...");
    btn.click();

    // O botão abre um mini-modal na mesma página (sem mudar a URL).
    // Basta esperar o campo de texto aparecer no DOM.
    await sendDM(decodedMessage);
    return;
  }
})();
