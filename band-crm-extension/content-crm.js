// Roda em localhost:5173
// Escuta o evento lançado pelo Band CRM e salva a mensagem pendente via background
window.addEventListener("band_crm_send", (e) => {
  chrome.runtime.sendMessage({
    action: "set_pending",
    payload: {
      message: e.detail.message,
      handle: e.detail.handle,
      timestamp: Date.now(),
    },
  });
});
