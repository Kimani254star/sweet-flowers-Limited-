import { esc } from "./ui.js";
import { supabase } from "./supabase.js";

const inquiries = new Map();
export const rememberInquiry = (id, data) => inquiries.set(String(id), data);

async function saveReply(id, reply) {
  const { data: { session } } = await supabase.auth.getSession();
  const { error } = await supabase.from("sfg_bookings")
    .update({ reply, replied_at: new Date().toISOString(), replied_by: session ? session.user.id : null })
    .eq("id", id);
  if (error) throw error;
}

export function openReply(id) {
  const inq = inquiries.get(String(id));
  if (!inq) return alert("Could not find that inquiry. Refresh the page and try again.");

  document.getElementById("replyModal")?.remove();
  const wrap = document.createElement("div");
  wrap.id = "replyModal";
  wrap.className = "modal";
  wrap.style.display = "flex";
  wrap.innerHTML = `<div class="modal-content quote-modal">
    <span class="close-modal" id="rClose">&times;</span>
    <h2>Reply to Inquiry</h2>
    <p><strong>${esc(inq.customer)}</strong> &middot; ${esc(inq.email)} &middot; ${esc(inq.phone)}</p>
    <p><strong>Service:</strong> ${esc(inq.service)}</p>
    <p><strong>Their message:</strong><br>${esc(inq.message || "No message.").replace(/\n/g, "<br>")}</p>
    <label>Your reply</label>
    <textarea id="rText" rows="6" placeholder="Type your reply to the customer">${esc(inq.reply || "")}</textarea>
    <button type="button" class="login-button" id="rSend">Send Reply</button>
  </div>`;
  document.body.appendChild(wrap);

  wrap.addEventListener("click", (e) => {
    if (e.target.id === "rClose" || e.target === wrap) wrap.remove();
    if (e.target.id === "rSend") {
      const text = wrap.querySelector("#rText").value.trim();
      if (!text) return alert("Type a reply first.");
      e.target.disabled = true;
      saveReply(id, text)
        .then(() => { alert("Reply sent. The customer will see it in My Bookings."); wrap.remove(); })
        .catch((err) => { e.target.disabled = false; alert(err.message || "Could not send the reply."); });
    }
  });
}
