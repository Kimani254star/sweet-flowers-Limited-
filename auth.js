import { supabase, createIsolatedClient } from "./supabase.js";

export const DASHBOARD_FOR = {
  admin: "admin-dashboard.html",
  sales: "sales-dashboard.html",
  service: "service-dashboard.html",
  accounts: "accounts-dashboard.html",
  customer: "customer-dashboard.html"
};

export async function registerCustomer({ name, email, phone, password }) {
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name, phone } } });
  if (error) throw error;
  if (data.user && data.user.identities && data.user.identities.length === 0) throw new Error("Email already registered.");
  return data; // data.session is null when email confirmation is switched on
}

export async function login(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const profile = await getProfile();
  if (!profile) throw new Error("No profile found for this account.");
  return profile;
}

export async function getProfile() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const uid = session.user.id;
  let { data, error } = await supabase.from("sfg_profiles").select("*").eq("id", uid).maybeSingle();
  if (error) throw error;
  if (!data) {
    // Account exists in the shared Supabase project but has no website profile yet.
    const meta = session.user.user_metadata || {};
    const row = { id: uid, email: session.user.email, name: meta.name || "", phone: meta.phone || "", role: "customer" };
    const ins = await supabase.from("sfg_profiles").insert(row).select().single();
    if (ins.error) throw ins.error;
    data = ins.data;
  }
  return data;
}

export async function requireRole(roles) {
  const profile = await getProfile().catch(() => null);
  if (!profile || !roles.includes(profile.role)) {
    window.location.href = "index.html";
    return null;
  }
  return profile;
}

export async function logout() {
  await supabase.auth.signOut();
  window.location.href = "index.html";
}

export async function updateOwnProfile(id, { name, phone }) {
  const { error } = await supabase.from("sfg_profiles").update({ name, phone }).eq("id", id);
  if (error) throw error;
}

export async function listByRole(role) {
  const { data, error } = await supabase.from("sfg_profiles").select("*").eq("role", role).order("created_at");
  if (error) throw error;
  return data || [];
}
export const listCustomers = () => listByRole("customer");
export async function listStaff() {
  const { data, error } = await supabase.from("sfg_profiles").select("*").neq("role", "customer").order("created_at");
  if (error) throw error;
  return data || [];
}

// Admin / developer adds any kind of user from Settings.
export async function createUserAccount({ name, email, phone, password, role }) {
  const isolated = createIsolatedClient();
  const { data, error } = await isolated.auth.signUp({ email, password, options: { data: { name, phone } } });
  if (error) throw error;
  if (!data.user || (data.user.identities && data.user.identities.length === 0)) throw new Error("That email is already registered.");
  if (role !== "customer") {
    const { error: roleError } = await supabase.from("sfg_profiles").update({ role }).eq("id", data.user.id);
    if (roleError) throw roleError;
  }
}

// Browsers cannot delete auth users, so "Remove" takes the staff access away (the person becomes a plain customer).
export async function removeStaffAccess(id) {
  const { error } = await supabase.from("sfg_profiles").update({ role: "customer" }).eq("id", id);
  if (error) throw error;
}

// Sends the reset email. The link brings the person back to index.html,
// where main.js shows the "choose a new password" box.
export async function requestPasswordReset(email) {
  const redirectTo = new URL("index.html", window.location.href).href;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

export async function setNewPassword(password) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}
