import { supabase } from "./supabase.js";
import { showPrintable, getSavedQuote } from "./quotes.js";

const store = new Map();
const two = (n) => String(n).padStart(2, "0");
const isoDate = (d) => `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;

export const INVOICE_DUE_DAYS = 14;

export async function listInvoices() {
  const { data, error } = await supabase.from("sfg_invoices").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  (data || []).forEach((r) => store.set(String(r.id), r));
  return data || [];
}

export async function convertToInvoice(quoteId) {
  const q = getSavedQuote(quoteId);
  if (!q) return alert("Could not find that quote. Refresh the page and try again.");
  if (!confirm("Convert quote " + q.quote_number + " to an invoice?")) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please log in again.");
  const today = new Date();
  const due = new Date(today);
  due.setDate(due.getDate() + INVOICE_DUE_DAYS);
  const { error } = await supabase.from("sfg_invoices").insert({
    invoice_number: String(q.quote_number).replace(/^SFG-Q-/, "SFG-INV-"),
    quote_id: q.id, invoice_date: isoDate(today), due_date: isoDate(due),
    created_by: session.user.id, user_id: q.user_id || null,
    customer: q.customer, email: q.email, phone: q.phone, currency: q.currency,
    vat_percent: q.vat_percent, items: q.items, notes: q.notes, terms: q.terms,
    subtotal: q.subtotal, vat: q.vat, total: q.total, status: "Unpaid"
  });
  if (error) throw error;
}

export async function markInvoicePaid(id) {
  if (!confirm("Mark this invoice as paid?")) return;
  const { error } = await supabase.from("sfg_invoices")
    .update({ status: "Paid", paid_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export function viewInvoice(id) {
  const r = store.get(String(id));
  if (!r) return alert("Could not find that invoice. Refresh the page and try again.");
  showPrintable({
    number: r.invoice_number, date: r.invoice_date || "", validUntil: r.due_date || "",
    currency: r.currency || "KES", name: r.customer || "", email: r.email || "", phone: r.phone || "",
    notes: r.notes || "", terms: r.terms || [], items: r.items || [], vatPercent: Number(r.vat_percent) || 0,
    subtotal: Number(r.subtotal) || 0, vat: Number(r.vat) || 0, total: Number(r.total) || 0
  }, { label: "INVOICE", dateLabel: "Due date", invoice: true, status: String(r.status || "Unpaid").toUpperCase() });
}
