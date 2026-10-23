import { supabase } from "./supabase.js";
import { $, openLogin, closeLogin, openRegister, closeRegister, openForgot, closeForgot, openReset, closeReset, showPage } from "./ui.js";
import { registerCustomer, login, requireRole, logout, updateOwnProfile, createUserAccount, removeStaffAccess, requestPasswordReset, setNewPassword, getProfile, DASHBOARD_FOR } from "./auth.js";
import { submitBooking, updateBookingStatus } from "./bookings.js";
import { addGalleryImage, deleteGalleryImage, renderPublicGallery, renderGallerySection } from "./gallery.js";
import { openQuote, viewSavedQuote } from "./quotes.js";
import "./lightbox.js";
import { openReply } from "./replies.js";
import { rowAction } from "./actions.js";
import { convertToInvoice, markInvoicePaid, viewInvoice } from "./invoices.js";
import { loadAdminDashboard, loadSalesDashboard, loadCustomerDashboard, watchTables } from "./dashboards.js";

Object.assign(window, {
  openLogin, closeLogin, openRegister, closeRegister, openForgot, closeForgot,
  showAdminPage: (id) => showPage("admin-page", id),
  showCustomerPage: (id) => showPage("customer-page", id),
  logoutAdmin: logout, logoutSales: logout, logoutCustomer: logout
});

const page = document.body.getAttribute("data-page");
const run = (fn) => async (e) => {
  e.preventDefault();
  try { await fn(e); } catch (err) { alert(err.message || "Something went wrong."); }
};

document.querySelectorAll(".main-nav-link").forEach((a) =>
  a.classList.toggle("active", a.getAttribute("data-target") === page));

$("registerForm")?.addEventListener("submit", run(async () => {
  const password = $("regPassword").value;
  if (password !== $("regConfirm").value) return alert("Passwords do not match.");
  const { session } = await registerCustomer({
    name: $("regName").value.trim(), email: $("regEmail").value.trim(),
    phone: $("regPhone").value.trim(), password
  });
  alert(session ? "Account created successfully." : "Account created. Check your email to confirm it, then log in.");
  closeRegister();
  openLogin();
}));

$("loginForm")?.addEventListener("submit", run(async () => {
  const profile = await login($("loginEmail").value.trim(), $("loginPassword").value);
  window.location.href = DASHBOARD_FOR[profile.role] || "customer-dashboard.html";
}));

$("forgotForm")?.addEventListener("submit", run(async (e) => {
  await requestPasswordReset($("forgotEmail").value.trim());
  alert("If that email has an account, a reset link is on its way. Check your inbox (and spam).");
  e.target.reset();
  closeForgot();
}));

supabase.auth.onAuthStateChange((event) => {
  if (event === "PASSWORD_RECOVERY" && $("resetModal")) openReset();
});

$("resetForm")?.addEventListener("submit", run(async () => {
  const pw = $("newPassword").value;
  if (pw !== $("newPasswordConfirm").value) return alert("Passwords do not match.");
  await setNewPassword(pw);
  alert("Password updated.");
  closeReset();
  const profile = await getProfile();
  window.location.href = DASHBOARD_FOR[profile?.role] || "index.html";
}));

$("bookingForm")?.addEventListener("submit", run(async (e) => {
  await submitBooking({
    customer: $("bookingName").value, email: $("bookingEmail").value, phone: $("bookingPhone").value,
    service: $("bookingService").value, date: $("bookingDate").value, time: $("bookingTime")?.value || null,
    county: $("bookingCounty")?.value || null, address: $("bookingAddress")?.value || null,
    description: ($("propertyType")?.value ? "Property type: " + $("propertyType").value + "\n" : "") + ($("bookingDescription")?.value || "")
  });
  alert("Booking submitted successfully.");
  e.target.reset();
}));

$("quoteRequestForm")?.addEventListener("submit", run(async (e) => {
  await submitBooking({
    customer: $("quoteName").value, email: $("quoteEmail").value, phone: $("quotePhone").value,
    service: $("quoteService").value + " (Quote Request)", date: "As soon as possible",
    description: $("quoteMessage")?.value || null
  });
  alert("Quotation request submitted to operational dashboard database.");
  e.target.reset();
}));

document.addEventListener("change", async (e) => {
  const sel = e.target.closest(".status-select");
  if (!sel) return;
  try { await updateBookingStatus(sel.dataset.bookingId, sel.value); }
  catch (err) { alert(err.message); }
});

document.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  try {
    if (btn.dataset.action === "row") {
      await rowAction(btn.dataset.op, btn.dataset.kind, btn.dataset.id);
    } else if (btn.dataset.action === "make-quote") {
      openQuote(btn.dataset.kind, btn.dataset.id);
    } else if (btn.dataset.action === "reply-booking") {
      openReply(btn.dataset.id);
    } else if (btn.dataset.action === "convert-invoice") {
      await convertToInvoice(btn.dataset.id);
    } else if (btn.dataset.action === "mark-paid") {
      await markInvoicePaid(btn.dataset.id);
    } else if (btn.dataset.action === "view-invoice") {
      viewInvoice(btn.dataset.id);
    } else if (btn.dataset.action === "view-quote") {
      viewSavedQuote(btn.dataset.id);
    } else if (btn.dataset.action === "remove-staff" && confirm("Remove this person's staff access?")) {
      await removeStaffAccess(btn.dataset.id);
    } else if (btn.dataset.action === "delete-gallery" && confirm("Delete this gallery image?")) {
      await deleteGalleryImage(btn.dataset.id, btn.dataset.path);
    }
  } catch (err) { alert(err.message); }
});

const FALLBACK_IMG = "data:image/svg+xml;utf8," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%" height="100%" fill="#2E7D32"/><text x="50%" y="52%" font-size="64" text-anchor="middle">🌿</text></svg>');
document.addEventListener("error", (e) => {
  const img = e.target;
  if (img.tagName === "IMG" && !img.dataset.fallback) { img.dataset.fallback = "1"; img.src = FALLBACK_IMG; }
}, true);

async function boot() {
  if (page === "gallery") await renderPublicGallery();
  if (page === "home") await renderGallerySection("homeGallery", "homeGalleryGrid", 6);
  if (page === "projects") await renderGallerySection("projectsGallery", "projectsGalleryGrid", 9);

  if (page === "admin-dashboard") {
    if (!(await requireRole(["admin"]))) return;
    const reload = () => loadAdminDashboard().catch((err) => alert(err.message));
    await reload();
    watchTables(["sfg_bookings", "sfg_profiles", "sfg_gallery", "sfg_quotes", "sfg_invoices"], reload);
    document.addEventListener("sfg:changed", reload);

    $("userForm")?.addEventListener("submit", run(async (e) => {
      const name = $("userName").value.trim();
      await createUserAccount({
        name, email: $("userEmail").value.trim(), phone: $("userPhone").value.trim(),
        password: $("userPassword").value, role: $("userRole").value
      });
      alert("User added: " + name + ".");
      e.target.reset();
      await reload();
    }));

    $("galleryForm")?.addEventListener("submit", run(async (e) => {
      const file = $("galleryImageFile").files[0];
      if (!file) return alert("Choose an image to upload.");
      await addGalleryImage(file, $("galleryCaption").value.trim());
      e.target.reset();
      await reload();
    }));
  }

  const STAFF_PAGES = { "sales-dashboard": "sales", "service-dashboard": "service", "accounts-dashboard": "accounts" };
  if (STAFF_PAGES[page]) {
    const profile = await requireRole([STAFF_PAGES[page], "admin"]);
    if (!profile) return;
    const editable = STAFF_PAGES[page] !== "accounts";
    const reload = () => loadSalesDashboard(profile, editable).catch((err) => alert(err.message));
    await reload();
    watchTables(["sfg_bookings", "sfg_profiles", "sfg_quotes", "sfg_invoices"], reload);
    document.addEventListener("sfg:changed", reload);
  }

  if (page === "customer-dashboard") {
    const profile = await requireRole(["customer", "sales", "service", "accounts", "admin"]);
    if (!profile) return;
    const reload = () => loadCustomerDashboard(profile).catch((err) => alert(err.message));
    await reload();
    watchTables(["sfg_bookings", "sfg_quotes", "sfg_invoices"], reload);

    $("profileEditForm")?.addEventListener("submit", run(async () => {
      profile.name = $("editName").value.trim();
      profile.phone = $("editPhone").value.trim();
      await updateOwnProfile(profile.id, profile);
      alert("Profile updated.");
      await reload();
    }));
  }
}
boot().catch((err) => console.error(err));
