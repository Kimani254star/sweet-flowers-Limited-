import { $, openLogin, closeLogin, openRegister, closeRegister, showPage } from "./ui.js";
import { registerCustomer, login, requireRole, logout, updateOwnProfile, createSalesAccount, removeSalesAccount, DASHBOARD_FOR } from "./auth.js";
import { submitBooking, updateBookingStatus } from "./bookings.js";
import { addGalleryImage, deleteGalleryImage, renderPublicGallery } from "./gallery.js";
import { loadAdminDashboard, loadSalesDashboard, loadCustomerDashboard, watchTables } from "./dashboards.js";

// Inline onclick="..." attributes in the HTML call these.
Object.assign(window, {
  openLogin, closeLogin, openRegister, closeRegister,
  showAdminPage: (id) => showPage("admin-page", id),
  showCustomerPage: (id) => showPage("customer-page", id),
  logoutAdmin: logout, logoutSales: logout, logoutCustomer: logout
});

const page = document.body.getAttribute("data-page");
const run = (fn) => async (e) => {
  e.preventDefault();
  try { await fn(e); } catch (err) { alert(err.message || "Something went wrong."); }
};

// Highlight the current page in the main nav
document.querySelectorAll(".main-nav-link").forEach((a) =>
  a.classList.toggle("active", a.getAttribute("data-target") === page));

// Registration
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

// Login -> the right dashboard for the account's role
$("loginForm")?.addEventListener("submit", run(async () => {
  const profile = await login($("loginEmail").value.trim(), $("loginPassword").value);
  window.location.href = DASHBOARD_FOR[profile.role] || "customer-dashboard.html";
}));

// Booking form
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

// Quote request form
$("quoteRequestForm")?.addEventListener("submit", run(async (e) => {
  await submitBooking({
    customer: $("quoteName").value, email: $("quoteEmail").value, phone: $("quotePhone").value,
    service: $("quoteService").value + " (Quote Request)", date: "As soon as possible",
    description: $("quoteMessage")?.value || null
  });
  alert("Quotation request submitted to operational dashboard database.");
  e.target.reset();
}));

// Booking status changes (admin + sales tables)
document.addEventListener("change", async (e) => {
  const sel = e.target.closest(".status-select");
  if (!sel) return;
  try { await updateBookingStatus(sel.dataset.bookingId, sel.value); }
  catch (err) { alert(err.message); }
});

// Delete / remove buttons in the admin tables
document.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  try {
    if (btn.dataset.action === "remove-sales" && confirm("Remove this sales account?")) {
      await removeSalesAccount(btn.dataset.id);
    } else if (btn.dataset.action === "delete-gallery" && confirm("Delete this gallery image?")) {
      await deleteGalleryImage(btn.dataset.id, btn.dataset.path);
    }
  } catch (err) { alert(err.message); }
});

// Page guards + dashboards
async function boot() {
  if (page === "gallery") await renderPublicGallery();

  if (page === "admin-dashboard") {
    if (!(await requireRole(["admin"]))) return;
    const reload = () => loadAdminDashboard().catch((err) => alert(err.message));
    await reload();
    watchTables(["sfg_bookings", "sfg_profiles", "sfg_gallery"], reload);

    $("salesAccountForm")?.addEventListener("submit", run(async (e) => {
      const name = $("salesName").value.trim();
      await createSalesAccount({ name, email: $("salesEmail").value.trim(), phone: $("salesPhone").value.trim(), password: $("salesPassword").value });
      alert("Sales account created for " + name + ".");
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

  if (page === "sales-dashboard") {
    const profile = await requireRole(["sales", "admin"]);
    if (!profile) return;
    const reload = () => loadSalesDashboard(profile).catch((err) => alert(err.message));
    await reload();
    watchTables(["sfg_bookings", "sfg_profiles"], reload);
  }

  if (page === "customer-dashboard") {
    const profile = await requireRole(["customer", "sales", "admin"]);
    if (!profile) return;
    const reload = () => loadCustomerDashboard(profile).catch((err) => alert(err.message));
    await reload();
    watchTables(["sfg_bookings"], reload);

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
