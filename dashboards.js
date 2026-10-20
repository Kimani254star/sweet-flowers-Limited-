import { supabase } from "./supabase.js";
import { esc, setText, setHtml, $ } from "./ui.js";
import { listCustomers, listStaff } from "./auth.js";
import { listBookings } from "./bookings.js";
import { listGallery } from "./gallery.js";

const STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled"];

const customerRows = (list) =>
  list.map((u, i) => `<tr><td>${i + 1}</td><td>${esc(u.name)}</td><td>${esc(u.phone)}</td><td>${esc(u.email)}</td></tr>`).join("");

function statusCell(b, editable) {
  if (!editable) return `<strong>${esc(b.status)}</strong>`;
  return `<select class="status-select" data-booking-id="${esc(b.id)}">` +
    STATUSES.map((s) => `<option${s === b.status ? " selected" : ""}>${s}</option>`).join("") + `</select>`;
}

const ROLE_LABELS = { admin: "Admin / Developer", sales: "Sales", service: "Customer Service", accounts: "Accounts" };

function bookingRows(list, editable = true) {
  return list.map((b, i) => `<tr>
    <td>${i + 1}</td>
    <td>${esc(b.customer)}</td>
    <td>${esc(b.email)} <br> <small>${esc(b.phone)}</small></td>
    <td>${esc(b.service)}</td>
    <td>${esc(b.date)}${b.time ? " " + esc(b.time) : ""}</td>
    <td>${statusCell(b, editable)}</td>
  </tr>`).join("");
}

export async function loadAdminDashboard() {
  const [customers, staff, bookings, gallery] = await Promise.all([listCustomers(), listStaff(), listBookings(), listGallery()]);
  setText("customerCount", customers.length);
  setText("bookingCount", bookings.length);
  setText("salesCount", staff.length);
  setText("galleryCount", gallery.length);

  setHtml("customerBody", customerRows(customers) || "<tr><td colspan='4'>No registered customers yet.</td></tr>");
  setHtml("bookingBody", bookingRows(bookings) || "<tr><td colspan='6'>No bookings yet.</td></tr>");

  setHtml("userBody", staff.map((u, i) => `<tr>
    <td>${i + 1}</td><td>${esc(u.name)}</td><td>${esc(u.phone)}</td><td>${esc(u.email)}</td>
    <td>${esc(ROLE_LABELS[u.role] || u.role)}</td>
    <td>${u.role === "admin" ? "" : `<button class="toolbar-delete-btn" data-action="remove-staff" data-id="${esc(u.id)}">Remove</button>`}</td>
  </tr>`).join("") || "<tr><td colspan='6'>No staff accounts yet.</td></tr>");

  setHtml("galleryManageGrid", gallery.map((g) => `<div class="gallery-manage-item">
    <img src="${esc(g.image_url)}" alt="${esc(g.caption || "Gallery image")}">
    <p>${esc(g.caption || "")}</p>
    <button class="toolbar-delete-btn" data-action="delete-gallery" data-id="${esc(g.id)}" data-path="${esc(g.storage_path || "")}">Delete</button>
  </div>`).join("") || "<p>No uploaded images yet.</p>");
}

export async function loadSalesDashboard(profile, editable = true) {
  setText("salesWelcomeName", profile.name);
  const [customers, bookings] = await Promise.all([listCustomers(), listBookings()]);
  setText("salesBookingCount", bookings.length);
  setText("salesCustomerCount", customers.length);
  setHtml("salesBookingBody", bookingRows(bookings, editable) || "<tr><td colspan='6'>No bookings yet.</td></tr>");
  setHtml("salesCustomerBody", customerRows(customers) || "<tr><td colspan='4'>No registered customers yet.</td></tr>");
}

export async function loadCustomerDashboard(profile) {
  setText("welcomeName", profile.name);
  setText("profileName", profile.name);
  setText("profileEmail", profile.email);
  setText("profilePhone", profile.phone);
  if ($("editName")) $("editName").value = profile.name;
  if ($("editPhone")) $("editPhone").value = profile.phone;

  const mine = await listBookings();
  setText("myBookingCount", mine.length);
  setText("myPendingCount", mine.filter((b) => b.status === "Pending").length);
  setText("myCompletedCount", mine.filter((b) => b.status === "Completed").length);
  setHtml("customerBookingBody", mine.map((b) =>
    `<tr><td>${esc(b.service)}</td><td>${esc(b.date)}</td><td>${statusCell(b, false)}</td></tr>`).join("") ||
    "<tr><td colspan='3'>No bookings yet.</td></tr>");
}

// Live sync: any change made from another browser/device refreshes this dashboard.
export function watchTables(tables, reload) {
  const channel = supabase.channel("sfg-" + Math.random().toString(36).slice(2));
  tables.forEach((table) => channel.on("postgres_changes", { event: "*", schema: "public", table }, () => reload()));
  channel.subscribe();
}
