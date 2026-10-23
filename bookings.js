import { supabase } from "./supabase.js";

export async function submitBooking(fields) {
  const { data: { session } } = await supabase.auth.getSession();
  const row = { ...fields, user_id: session ? session.user.id : null, status: "Pending" };
  const { error } = await supabase.from("sfg_bookings").insert(row);
  if (error) throw error;
}

export async function listBookings() {
  const { data, error } = await supabase.from("sfg_bookings").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateBookingStatus(id, status) {
  const { error } = await supabase.from("sfg_bookings").update({ status }).eq("id", id);
  if (error) throw error;
}
