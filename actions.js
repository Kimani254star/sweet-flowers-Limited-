import { supabase } from "./supabase.js";
import { esc } from "./ui.js";
import { removeStaffAccess } from "./auth.js";
import { deleteGalleryImage } from "./gallery.js";
import { viewSavedQuote, editQuote, getSavedQuote } from "./quotes.js";
import { viewInvoice, getInvoice } from "./invoices.js";

const records = new Map();
export const rememberRecord = (kind, id, row) => records.set(kind + ":" + id, row);

export function actionButtons(kind, id, o = {}) {
  const b = (op, label, cls) =>
    `<button type="button" class="act-btn ${cls}" data-action="row" data-op="${op}" data-kind="${kind}" data-id="${esc(id)}">${label}</button>`;
  return `<div class="act-wrap">${b("preview", "Preview", "act-preview")}${o.edit === false ? "" : b("edit", "Edit", "act-edit")}${b("email", "Email", "act-email")}${o.del === false ? "" : b("delete", "Delete", "act-delete")}</div>`;
}

const changed = () => document.dispatchEvent(new CustomEvent("sfg:changed"));
const when = (v) => (v ? new Date(v).toLocaleString() : "");
const money = (n) => Number(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const blank = (v) => (v === "" || v === undefined ? null : v);

function modal(id, html) {
  document.getElementById(id)?.remove();
  const wrap = document.createElement("div");
  wrap.id = id;
  wrap.className = "modal";
  wrap.style.display = "flex";
  wrap.innerHTML = `<div class="modal-content quote-modal"><span class="close-modal" data-close="1">&times;</span>${html}</div>`;
  wrap.addEventListener("click", (e) => {
    if (e.target === wrap || e.target.closest("[data-close]")) wrap.remove();
  });
  document.body.appendChild(wrap);
  return wrap;
}

function editForm(title, fields, onSave) {
  const html = `<h2>${esc(title)}</h2>` + fields.map((f) => {
    const v = f.value ?? "";
    let input;
    if (f.type === "select") {
      input = `<select data-f="${f.key}">${f.options.map((o) => `<option value="${esc(o[0])}"${String(o[0]) === String(v) ? " selected" : ""}>${esc(o[1])}</option>`).join("")}</select>`;
    } else if (f.type === "textarea") {
      input = `<textarea data-f="${f.key}" rows="3">${esc(v)}</textarea>`;
    } else {
      input = `<input data-f="${f.key}" type="${f.type || "text"}" value="${esc(v)}"${f.readonly ? " readonly" : ""}>`;
    }
    return `<label>${esc(f.label)}</label>${input}`;
  }).join("") + `<button type="button" class="login-button" data-save="1">Save Changes</button>`;
  const wrap = modal("sfgEditModal", html);
  wrap.querySelector("[data-save]").onclick = async (e) => {
    const vals = {};
    wrap.querySelectorAll("[data-f]").forEach((el) => { vals[el.getAttribute("data-f")] = el.value.trim(); });
    e.target.disabled = true;
    try {
      await onSave(vals);
      wrap.remove();
      changed();
    } catch (err) {
      e.target.disabled = false;
      alert(err.message || "Could not save.");
    }
  };
}

function preview(title, rows, imageUrl) {
  const body = rows.filter((r) => r[1] !== undefined && r[1] !== null && r[1] !== "")
    .map((r) => `<p><strong>${esc(r[0])}:</strong> ${esc(r[1]).replace(/\n/g, "<br>")}</p>`).join("");
  const img = imageUrl ? `<img src="${esc(imageUrl)}" alt="" style="max-width:100%;border-radius:8px;margin-bottom:10px">` : "";
  modal("sfgPreviewModal", `<h2>${esc(title)}</h2>${img}${body}`);
}

function mail(to, subject, body) {
  window.location.href = "mailto:" + encodeURIComponent(to || "").replace(/%40/g, "@") +
    "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
}

async function update(table, id, patch) {
  const { data, error } = await supabase.from(table).update(patch).eq("id", id).select("id");
  if (error) throw error;
  if (!data || !data.length) throw new Error("Nothing was changed. You may not have permission to edit this.");
}

async function remove(table, id) {
  const { data, error } = await supabase.from(table).delete().eq("id", id).select("id");
  if (error) throw error;
  if (!data || !data.length) throw new Error("Nothing was deleted. You may not have permission to delete this.");
  changed();
}

const ROLE_OPTIONS = [["sales", "Sales"], ["service", "Customer Service"], ["accounts", "Accounts"], ["customer", "Customer"], ["admin", "Admin / Developer"]];

const person = (staff) => ({
  preview: (r) => preview(staff ? "Staff Account" : "Customer", [["Name", r.name], ["Email", r.email], ["Phone", r.phone], ["Role", r.role], ["Joined", when(r.created_at)]]),
  edit: (r) => editForm(staff ? "Edit Staff Account" : "Edit Customer", [
    { key: "name", label: "Full Name", value: r.name },
    { key: "phone", label: "Phone Number", type: "tel", value: r.phone },
    { key: "email", label: "Email (cannot be changed here)", value: r.email, readonly: true },
    ...(staff ? [{ key: "role", label: "Role", type: "select", options: ROLE_OPTIONS, value: r.role }] : [])
  ], (v) => update("sfg_profiles", r.id, staff ? { name: v.name, phone: v.phone, role: v.role } : { name: v.name, phone: v.phone })),
  email: (r) => mail(r.email, "Sweet Flower Garden", `Hello ${r.name || ""},\n\n`),
  delete: async (r) => {
    if (staff) {
      if (!confirm("Delete this staff account? Their staff access is removed and they become a plain customer.")) return;
      await removeStaffAccess(r.id);
      changed();
    } else {
      if (!confirm("Delete this customer's profile from the website? Their login stays in Supabase.")) return;
      await remove("sfg_profiles", r.id);
    }
  }
});

const quoteBody = (r) => {
  const cur = r.currency || "KES";
  const lines = (r.items || []).map((i) => `- ${i.desc} x ${i.qty} @ ${cur} ${money(i.price)}`).join("\n");
  return lines + `\n\nSubtotal: ${cur} ${money(r.subtotal)}\nVAT (${Number(r.vat_percent) || 0}%): ${cur} ${money(r.vat)}\nTotal: ${cur} ${money(r.total)}\n`;
};

const HANDLERS = {
  customer: person(false),
  staff: person(true),

  gallery: {
    preview: (r) => preview(r.caption || "Gallery image", [["Caption", r.caption], ["Added", when(r.created_at)]], r.image_url),
    edit: (r) => editForm("Edit Gallery Caption", [{ key: "caption", label: "Caption", value: r.caption }], (v) => update("sfg_gallery", r.id, { caption: v.caption })),
    email: (r) => mail("", "Sweet Flower Garden photo", `${r.caption || "Photo"}\n${r.image_url}\n`),
    delete: async (r) => {
      if (!confirm("Delete this gallery image?")) return;
      await deleteGalleryImage(r.id, r.storage_path);
      changed();
    }
  },

  booking: {
    preview: (r) => preview("Booking / Inquiry", [
      ["Customer", r.customer], ["Email", r.email], ["Phone", r.phone], ["Service", r.service],
      ["Date", [r.date, r.time].filter(Boolean).join(" ")], ["County", r.county], ["Address", r.address],
      ["Status", r.status], ["Message", r.description], ["Our reply", r.reply], ["Received", when(r.created_at)]
    ]),
    edit: (r) => editForm("Edit Booking", [
      { key: "customer", label: "Customer", value: r.customer },
      { key: "email", label: "Email", type: "email", value: r.email },
      { key: "phone", label: "Phone", type: "tel", value: r.phone },
      { key: "service", label: "Service", value: r.service },
      { key: "date", label: "Date", value: r.date },
      { key: "time", label: "Time", value: r.time },
      { key: "county", label: "County", value: r.county },
      { key: "address", label: "Address", value: r.address },
      { key: "description", label: "Description", type: "textarea", value: r.description }
    ], (v) => update("sfg_bookings", r.id, {
      customer: v.customer, email: v.email, phone: v.phone, service: v.service, date: v.date,
      time: blank(v.time), county: blank(v.county), address: blank(v.address), description: blank(v.description)
    })),
    email: (r) => mail(r.email, `Your inquiry: ${r.service || "Sweet Flower Garden"}`,
      `Hello ${r.customer || ""},\n\nThank you for contacting Sweet Flower Garden about ${r.service || "our services"}.\n\n${r.reply ? r.reply + "\n\n" : ""}Kind regards,\nSweet Flower Garden\n`),
    delete: (r) => (confirm("Delete this booking? This cannot be undone.") ? remove("sfg_bookings", r.id) : null)
  },

  quote: {
    preview: (r) => viewSavedQuote(r.id),
    edit: (r) => editQuote(r.id),
    email: (r) => mail(r.email, `Quotation ${r.quote_number}`,
      `Hello ${r.customer || ""},\n\nHere is your quotation ${r.quote_number} from Sweet Flower Garden.\n\n${quoteBody(r)}\nKind regards,\nSweet Flower Garden\n`),
    delete: (r) => (confirm("Delete quote " + r.quote_number + "? This cannot be undone.") ? remove("sfg_quotes", r.id) : null)
  },

  invoice: {
    preview: (r) => viewInvoice(r.id),
    edit: (r) => editForm("Edit Invoice " + r.invoice_number, [
      { key: "due_date", label: "Due date", type: "date", value: r.due_date },
      { key: "status", label: "Status", type: "select", options: [["Unpaid", "Unpaid"], ["Paid", "Paid"]], value: r.status },
      { key: "notes", label: "Notes", type: "textarea", value: r.notes }
    ], (v) => update("sfg_invoices", r.id, {
      due_date: blank(v.due_date), status: v.status, notes: blank(v.notes),
      paid_at: v.status === "Paid" ? (r.paid_at || new Date().toISOString()) : null
    })),
    email: (r) => mail(r.email, `Invoice ${r.invoice_number}`,
      `Hello ${r.customer || ""},\n\nHere is your invoice ${r.invoice_number} from Sweet Flower Garden. Payment is due by ${r.due_date || "the due date"}.\n\n${quoteBody(r)}\nKind regards,\nSweet Flower Garden\n`),
    delete: (r) => (confirm("Delete invoice " + r.invoice_number + "? This cannot be undone.") ? remove("sfg_invoices", r.id) : null)
  }
};

export async function rowAction(op, kind, id) {
  const r = records.get(kind + ":" + id) || (kind === "quote" ? getSavedQuote(id) : kind === "invoice" ? getInvoice(id) : null);
  if (!r) return alert("Could not find that record. Refresh the page and try again.");
  await HANDLERS[kind][op](r);
}
