import { supabase } from "./supabase.js";
import { rememberQuoteSource, listQuotes } from "./quotes.js";
import { rememberInquiry } from "./replies.js";
import { listInvoices } from "./invoices.js";
import { actionButtons, rememberRecord } from "./actions.js";
import { esc, setText, setHtml, $ } from "./ui.js";
import { listCustomers, listStaff } from "./auth.js";
import { listBookings } from "./bookings.js";
import { listGallery } from "./gallery.js";

const STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled"];

const quoteBtn = (kind, id) => `<button class="quote-btn" data-action="make-quote" data-kind="${kind}" data-id="${esc(id)}">Create Quote</button>`;

const customerRows = (list, role) =>
  list.map((u, i) => {
    rememberRecord("customer", u.id, u);
    rememberQuoteSource("customer", u.id, { name: u.name, email: u.email, phone: u.phone, service: "", notes: "", userId: u.id });
    return `<tr><td>${i + 1}</td><td>${esc(u.name)}</td><td>${esc(u.phone)}</td><td>${esc(u.email)}</td><td>${quoteBtn("customer", u.id)}</td><td>${actionButtons("customer", u.id, { edit: role === "admin", del: role === "admin" })}</td></tr>`;
  }).join("");

function statusCell(b, editable) {
  if (!editable) return `<strong>${esc(b.status)}</strong>`;
  return `<select class="status-select" data-booking-id="${esc(b.id)}">` +
    STATUSES.map((s) => `<option${s === b.status ? " selected" : ""}>${s}</option>`).join("") + `</select>`;
}

const isInquiry = (b) => /\(Quote Request\)$/.test(String(b.service || ""));

const fmt = (n) => Number(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

async function loadFinance(role) {
  const canMarkPaid = ["admin", "accounts"].includes(role);
  let quotes = [];
  let invoices = [];
  try {
    [quotes, invoices] = await Promise.all([listQuotes(), listInvoices()]);
  } catch (err) {
    console.error(err);
    return;
  }
  const invoicedQuotes = new Set(invoices.map((i) => String(i.quote_id)));
  const total = invoices.reduce((s, i) => s + Number(i.total || 0), 0);
  const paid = invoices.filter((i) => i.status === "Paid").reduce((s, i) => s + Number(i.total || 0), 0);
  setText("finQuoteCount", quotes.filter((q) => q.status === "Sent").length);
  setText("finInvoiceCount", invoices.length);
  setText("finInvoiced", fmt(total));
  setText("finPaid", fmt(paid));
  setText("finOutstanding", fmt(total - paid));
  setText("homeInvoiced", fmt(total));
  setText("homeOutstanding", fmt(total - paid));

  const quoteAction = (q) => {
    const view = actionButtons("quote", q.id, { del: role === "admin" });
    if (q.status !== "Sent") return view;
    if (invoicedQuotes.has(String(q.id))) return view + " <small>&#10003; Invoiced</small>";
    return view + `<button class="quote-btn" data-action="convert-invoice" data-id="${esc(q.id)}">Convert to Invoice</button>`;
  };
  setHtml("financeQuoteBody", quotes.map((q) =>
    `<tr><td>${esc(q.quote_number)}</td><td>${esc(q.customer)}</td><td>${esc(q.quote_date || String(q.created_at || "").slice(0, 10))}</td><td>${esc(q.currency)} ${fmt(q.total)}</td><td>${q.status === "Sent" ? "Sent" : "Customer-made"}</td><td>${quoteAction(q)}</td></tr>`
  ).join("") || "<tr><td colspan='6'>No quotes yet.</td></tr>");

  setHtml("financeInvoiceBody", invoices.map((i) => {
    const view = actionButtons("invoice", i.id, { edit: canMarkPaid, del: role === "admin" });
    const pay = canMarkPaid && i.status !== "Paid" ? ` <button class="quote-btn" data-action="mark-paid" data-id="${esc(i.id)}">Mark Paid</button>` : "";
    return `<tr><td>${esc(i.invoice_number)}</td><td>${esc(i.customer)}</td><td>${esc(i.due_date || "")}</td><td>${esc(i.currency)} ${fmt(i.total)}</td><td><strong>${esc(i.status)}</strong></td><td>${view}${pay}</td></tr>`;
  }).join("") || "<tr><td colspan='6'>No invoices yet.</td></tr>");
}

const ROLE_LABELS = { admin: "Admin / Developer", sales: "Sales", service: "Customer Service", accounts: "Accounts" };

function bookingRows(list, editable = true, role = "admin") {
  list.forEach((b) => rememberRecord("booking", b.id, b));
  list.forEach((b) => rememberQuoteSource("booking", b.id, {
    name: b.customer, email: b.email, phone: b.phone, userId: b.user_id, bookingId: b.id,
    service: String(b.service || "").replace(/ \(Quote Request\)$/, ""), notes: b.description || ""
  }));
  list.forEach((b) => rememberInquiry(b.id, { customer: b.customer, email: b.email, phone: b.phone, service: b.service, message: b.description, reply: b.reply }));
  return list.map((b, i) => `<tr>
    <td>${i + 1}</td>
    <td>${esc(b.customer)}</td>
    <td>${esc(b.email)} <br> <small>${esc(b.phone)}</small></td>
    <td>${esc(b.service)}</td>
    <td>${esc(b.date)}${b.time ? " " + esc(b.time) : ""}</td>
    <td>${statusCell(b, editable)}</td>
    <td>${quoteBtn("booking", b.id)} <button class="quote-btn" data-action="reply-booking" data-id="${esc(b.id)}">${b.reply ? "Edit Reply" : "Reply"}</button>${b.reply ? " <small>&#10003; Replied</small>" : ""}</td>
    <td>${actionButtons("booking", b.id, { edit: editable, del: role === "admin" })}</td>
  </tr>`).join("");
}

export async function loadAdminDashboard() {
  await loadFinance("admin");
  const [customers, staff, bookings, gallery] = await Promise.all([listCustomers(), listStaff(), listBookings(), listGallery()]);
  setText("customerCount", customers.length);
  const inquiries = bookings.filter(isInquiry);
  const realBookings = bookings.filter((b) => !isInquiry(b));
  setText("bookingCount", realBookings.length);
  setText("inquiryCount", inquiries.length);
  setText("salesCount", staff.length);
  setText("galleryCount", gallery.length);

  setHtml("customerBody", customerRows(customers, "admin") || "<tr><td colspan='6'>No registered customers yet.</td></tr>");
  setHtml("bookingBody", bookingRows(realBookings, true, "admin") || "<tr><td colspan='8'>No bookings yet.</td></tr>");
  setHtml("inquiryBody", bookingRows(inquiries, true, "admin") || "<tr><td colspan='8'>No inquiries yet.</td></tr>");

  staff.forEach((u) => rememberRecord("staff", u.id, u));
  gallery.forEach((g) => rememberRecord("gallery", g.id, g));
  setHtml("userBody", staff.map((u, i) => `<tr>
    <td>${i + 1}</td><td>${esc(u.name)}</td><td>${esc(u.phone)}</td><td>${esc(u.email)}</td>
    <td>${esc(ROLE_LABELS[u.role] || u.role)}</td>
    <td>${actionButtons("staff", u.id, { del: u.role !== "admin" })}</td>
  </tr>`).join("") || "<tr><td colspan='6'>No staff accounts yet.</td></tr>");

  setHtml("galleryManageGrid", gallery.map((g) => `<div class="gallery-manage-item">
    <img src="${esc(g.image_url)}" alt="${esc(g.caption || "Gallery image")}">
    <p>${esc(g.caption || "")}</p>
    ${actionButtons("gallery", g.id)}
  </div>`).join("") || "<p>No uploaded images yet.</p>");
}

export async function loadSalesDashboard(profile, editable = true) {
  setText("salesWelcomeName", profile.name);
  await loadFinance(profile.role);
  const [customers, bookings] = await Promise.all([listCustomers(), listBookings()]);
  const inquiries = bookings.filter(isInquiry);
  const realBookings = bookings.filter((b) => !isInquiry(b));
  setText("salesBookingCount", realBookings.length);
  setText("salesInquiryCount", inquiries.length);
  setText("salesCustomerCount", customers.length);
  setHtml("salesBookingBody", bookingRows(realBookings, editable, profile.role) || "<tr><td colspan='8'>No bookings yet.</td></tr>");
  setHtml("salesInquiryBody", bookingRows(inquiries, editable, profile.role) || "<tr><td colspan='8'>No inquiries yet.</td></tr>");
  setHtml("salesCustomerBody", customerRows(customers, profile.role) || "<tr><td colspan='6'>No registered customers yet.</td></tr>");
}

export async function loadCustomerDashboard(profile) {
  setText("welcomeName", profile.name);
  setText("profileName", profile.name);
  setText("profileEmail", profile.email);
  setText("profilePhone", profile.phone);
  if ($("editName")) $("editName").value = profile.name;
  if ($("editPhone")) $("editPhone").value = profile.phone;

  rememberQuoteSource("me", "me", { name: profile.name, email: profile.email, phone: profile.phone, service: "", notes: "" });
  const mine = await listBookings();
  mine.forEach((b) => rememberQuoteSource("booking", b.id, {
    name: profile.name, email: profile.email, phone: profile.phone, userId: profile.id, bookingId: b.id,
    service: String(b.service || "").replace(/ \(Quote Request\)$/, ""), notes: b.description || ""
  }));
  const quotes = await listQuotes();
  const myInvoices = await listInvoices().catch(() => []);
  setHtml("customerInvoiceBody", myInvoices.map((i) =>
    `<tr><td>${esc(i.invoice_number)}</td><td>${esc(i.due_date || "")}</td><td>${esc(i.currency)} ${fmt(i.total)}</td><td><strong>${esc(i.status)}</strong></td><td><button class="quote-btn" data-action="view-invoice" data-id="${esc(i.id)}">View / Print</button></td></tr>`
  ).join("") || "<tr><td colspan='5'>No invoices yet.</td></tr>");
  setText("myQuoteCount", quotes.length);
  setHtml("customerQuoteBody", quotes.map((r) =>
    `<tr><td>${esc(r.quote_number)}</td><td>${esc(r.quote_date || String(r.created_at || "").slice(0, 10))}</td><td>${esc(r.currency)} ${Number(r.total || 0).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</td><td>${r.status === "Sent" ? "<strong>From Sweet Flower Garden</strong>" : "Made by me"}</td><td><button class="quote-btn" data-action="view-quote" data-id="${esc(r.id)}">View / Print</button></td></tr>`
  ).join("") || "<tr><td colspan='5'>No quotes yet.</td></tr>");
  setText("myBookingCount", mine.length);
  setText("myPendingCount", mine.filter((b) => b.status === "Pending").length);
  setText("myCompletedCount", mine.filter((b) => b.status === "Completed").length);
  setHtml("customerBookingBody", mine.map((b) =>
    `<tr><td>${esc(b.service)}</td><td>${esc(b.date)}</td><td>${statusCell(b, false)}</td><td>${b.reply ? esc(b.reply).replace(/\n/g, "<br>") : "<small>Waiting for our reply</small>"}</td><td>${quoteBtn("booking", b.id)}</td></tr>`).join("") ||
    "<tr><td colspan='5'>No bookings yet.</td></tr>");
}

export function watchTables(tables, reload) {
  const channel = supabase.channel("sfg-" + Math.random().toString(36).slice(2));
  tables.forEach((table) => channel.on("postgres_changes", { event: "*", schema: "public", table }, () => reload()));
  channel.subscribe();
}
