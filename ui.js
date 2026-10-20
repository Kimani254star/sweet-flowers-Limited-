export const $ = (id) => document.getElementById(id);

// Everything that comes from the database is escaped before it goes into innerHTML.
export function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
export function setText(id, v) { const el = $(id); if (el) el.textContent = v; }
export function setHtml(id, html) { const el = $(id); if (el) el.innerHTML = html; }

export const openLogin = () => { $("loginModal").style.display = "flex"; };
export const closeLogin = () => { $("loginModal").style.display = "none"; };
export const openRegister = () => { $("registerModal").style.display = "flex"; };
export const closeRegister = () => { $("registerModal").style.display = "none"; };

export function showPage(groupClass, id) {
  document.querySelectorAll("." + groupClass).forEach((p) => (p.style.display = "none"));
  $(id).style.display = "block";
}
