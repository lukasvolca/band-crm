// Background service worker — intermediário de storage
// Content scripts não acessam chrome.storage diretamente (bloqueado pelo Edge Tracking Prevention)
// Toda leitura/escrita passa por aqui via chrome.runtime.sendMessage

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "set_pending") {
    chrome.storage.local.set({ band_crm_pending: msg.payload }, () => {
      sendResponse({ ok: true });
    });
    return true; // mantém canal aberto para resposta assíncrona
  }

  if (msg.action === "get_pending") {
    chrome.storage.local.get("band_crm_pending", (data) => {
      sendResponse({ payload: data.band_crm_pending || null });
    });
    return true;
  }

  if (msg.action === "clear_pending") {
    chrome.storage.local.remove("band_crm_pending", () => {
      sendResponse({ ok: true });
    });
    return true;
  }
});
