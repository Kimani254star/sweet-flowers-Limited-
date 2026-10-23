import { supabase } from "./supabase.js";

const BUCKET = "sfg-gallery";

export async function listGallery() {
  const { data, error } = await supabase.from("sfg_gallery").select("*").order("created_at");
  if (error) throw error;
  return data || [];
}

export async function addGalleryImage(file, caption) {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${Date.now()}-${safe}`;
  const up = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (up.error) throw up.error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const { error } = await supabase.from("sfg_gallery").insert({ image_url: data.publicUrl, storage_path: path, caption });
  if (error) { await supabase.storage.from(BUCKET).remove([path]); throw error; }
}

export async function deleteGalleryImage(id, path) {
  const { error } = await supabase.from("sfg_gallery").delete().eq("id", id);
  if (error) throw error;
  if (path) await supabase.storage.from(BUCKET).remove([path]);
}

export async function renderPublicGallery() {
  const grid = document.getElementById("galleryGrid");
  if (!grid) return;
  const items = await listGallery();
  items.forEach((g) => {
    const img = document.createElement("img");
    img.src = g.image_url;
    img.alt = g.caption || "Sweet Flower Garden project photo";
    img.loading = "lazy";
    img.decoding = "async";
    grid.appendChild(img);
  });
}

export async function renderGallerySection(sectionId, gridId, limit = 6) {
  const section = document.getElementById(sectionId);
  const grid = document.getElementById(gridId);
  if (!section || !grid) return;
  const items = (await listGallery()).reverse().slice(0, limit);
  if (!items.length) return;
  grid.innerHTML = "";
  items.forEach((g) => {
    const img = document.createElement("img");
    img.src = g.image_url;
    img.alt = g.caption || "Sweet Flower Garden project photo";
    img.loading = "lazy";
    grid.appendChild(img);
  });
  section.style.display = "block";
}
