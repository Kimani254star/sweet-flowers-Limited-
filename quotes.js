import { esc } from "./ui.js";

export const QUOTE_DEFAULTS = {
  company: "Sweet Flower Garden",
  currency: "KES",
  vatPercent: 16,
  validDays: 30,
  depositPercent: 50,
  terms: [
    "This quotation is valid for the number of days shown above.",
    "A deposit is required to confirm the booking; the balance is due on completion.",
    "Prices exclude any extra work not listed here and will be confirmed before it starts."
  ]
};

const sources = new Map();
export const rememberQuoteSource = (kind, id, data) => sources.set(kind + ":" + id, data);

const two = (n) => String(n).padStart(2, "0");
const isoDate = (d) => `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
const money = (n) => Number(n || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function newQuoteNumber() {
  const d = new Date();
  return `SFG-Q-${d.getFullYear()}${two(d.getMonth() + 1)}${two(d.getDate())}-${two(d.getHours())}${two(d.getMinutes())}`;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + Number(days || 0));
  return d;
}

function itemRow(desc = "", qty = 1, price = "") {
  return `<tr class="q-item">
    <td><input type="text" class="q-desc" value="${esc(desc)}" placeholder="Description"></td>
    <td><input type="number" class="q-qty" min="0" step="1" value="${esc(qty)}"></td>
    <td><input type="number" class="q-price" min="0" step="0.01" value="${esc(price)}" placeholder="0.00"></td>
    <td class="q-line">0.00</td>
    <td><button type="button" class="q-remove" title="Remove line">&times;</button></td>
  </tr>`;
}

function readQuote(root) {
  const items = [...root.querySelectorAll(".q-item")].map((tr) => ({
    desc: tr.querySelector(".q-desc").value.trim(),
    qty: Number(tr.querySelector(".q-qty").value) || 0,
    price: Number(tr.querySelector(".q-price").value) || 0
  })).filter((i) => i.desc || i.price);
  const vatPercent = Number(root.querySelector("#qVat").value) || 0;
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const vat = subtotal * vatPercent / 100;
  return {
    number: root.querySelector("#qNumber").value.trim(),
    date: root.querySelector("#qDate").value,
    validUntil: root.querySelector("#qValid").value,
    currency: root.querySelector("#qCurrency").value.trim() || QUOTE_DEFAULTS.currency,
    name: root.querySelector("#qName").value.trim(),
    email: root.querySelector("#qEmail").value.trim(),
    phone: root.querySelector("#qPhone").value.trim(),
    notes: root.querySelector("#qNotes").value.trim(),
    terms: root.querySelector("#qTerms").value.split("\n").map((t) => t.trim()).filter(Boolean),
    items, vatPercent, subtotal, vat, total: subtotal + vat
  };
}

function refreshTotals(root) {
  root.querySelectorAll(".q-item").forEach((tr) => {
    const line = (Number(tr.querySelector(".q-qty").value) || 0) * (Number(tr.querySelector(".q-price").value) || 0);
    tr.querySelector(".q-line").textContent = money(line);
  });
  const q = readQuote(root);
  root.querySelector("#qSubtotal").textContent = money(q.subtotal);
  root.querySelector("#qVatAmount").textContent = money(q.vat);
  root.querySelector("#qTotal").textContent = money(q.total);
  root.querySelector("#qDeposit").textContent = money(q.total * QUOTE_DEFAULTS.depositPercent / 100);
}

function printableQuote(q) {
  const rows = q.items.map((i, n) => `<tr><td>${n + 1}</td><td>${esc(i.desc)}</td><td class="r">${i.qty}</td><td class="r">${money(i.price)}</td><td class="r">${money(i.qty * i.price)}</td></tr>`).join("");
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${esc(q.number)}</title>
<style>
body{font-family:Arial,Helvetica,sans-serif;color:#222;margin:40px;font-size:14px}
h1{color:#1B5E20;margin:0}.top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #2E7D32;padding-bottom:14px;margin-bottom:20px}
.meta{text-align:right;line-height:1.6}table{width:100%;border-collapse:collapse;margin:16px 0}
th{background:#2E7D32;color:#fff;text-align:left;padding:8px}td{padding:8px;border-bottom:1px solid #ddd}.r{text-align:right}
.totals{width:300px;margin-left:auto}.totals td{border:none;padding:4px 8px}.grand td{font-weight:bold;font-size:16px;border-top:2px solid #2E7D32}
.terms{margin-top:24px;font-size:12px;color:#444}.terms li{margin-bottom:4px}
</style></head><body>
<div class="top"><div><h1>${esc(QUOTE_DEFAULTS.company)}</h1><div>QUOTATION</div></div>
<div class="meta"><strong>${esc(q.number)}</strong><br>Date: ${esc(q.date)}<br>Valid until: ${esc(q.validUntil)}</div></div>
<p><strong>Prepared for</strong><br>${esc(q.name)}<br>${esc(q.email)}<br>${esc(q.phone)}</p>
${q.notes ? `<p><strong>Notes</strong><br>${esc(q.notes).replace(/\n/g, "<br>")}</p>` : ""}
<table><thead><tr><th>#</th><th>Description</th><th class="r">Qty</th><th class="r">Unit price (${esc(q.currency)})</th><th class="r">Amount (${esc(q.currency)})</th></tr></thead><tbody>${rows}</tbody></table>
<table class="totals">
<tr><td>Subtotal</td><td class="r">${esc(q.currency)} ${money(q.subtotal)}</td></tr>
<tr><td>VAT (${q.vatPercent}%)</td><td class="r">${esc(q.currency)} ${money(q.vat)}</td></tr>
<tr class="grand"><td>Total</td><td class="r">${esc(q.currency)} ${money(q.total)}</td></tr>
<tr><td>Deposit (${QUOTE_DEFAULTS.depositPercent}%)</td><td class="r">${esc(q.currency)} ${money(q.total * QUOTE_DEFAULTS.depositPercent / 100)}</td></tr>
</table>
<div class="terms"><strong>Terms</strong><ol>${q.terms.map((t) => `<li>${esc(t)}</li>`).join("")}</ol></div>
</body></html>`;
}

export function openQuote(kind, id) {
  const src = sources.get(kind + ":" + id);
  if (!src) return alert("Could not find that record. Refresh the page and try again.");

  document.getElementById("quoteModal")?.remove();
  const today = new Date();
  const wrap = document.createElement("div");
  wrap.id = "quoteModal";
  wrap.className = "modal";
  wrap.style.display = "flex";
  wrap.innerHTML = `<div class="modal-content quote-modal">
    <span class="close-modal" id="qClose">&times;</span>
    <h2>Create Quote</h2>
    <div class="quote-grid">
      <div><label>Quote No.</label><input id="qNumber" value="${esc(newQuoteNumber())}"></div>
      <div><label>Date</label><input id="qDate" type="date" value="${isoDate(today)}"></div>
      <div><label>Valid until</label><input id="qValid" type="date" value="${isoDate(addDays(today, QUOTE_DEFAULTS.validDays))}"></div>
      <div><label>Currency</label><input id="qCurrency" value="${esc(QUOTE_DEFAULTS.currency)}"></div>
      <div><label>Customer</label><input id="qName" value="${esc(src.name)}"></div>
      <div><label>Email</label><input id="qEmail" value="${esc(src.email)}"></div>
      <div><label>Phone</label><input id="qPhone" value="${esc(src.phone)}"></div>
      <div><label>VAT %</label><input id="qVat" type="number" min="0" step="0.5" value="${QUOTE_DEFAULTS.vatPercent}"></div>
    </div>
    <label>Notes</label>
    <textarea id="qNotes" rows="2">${esc(src.notes)}</textarea>
    <table class="quote-items"><thead><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Amount</th><th></th></tr></thead>
      <tbody id="qItems">${itemRow(src.service)}</tbody></table>
    <button type="button" class="quote-btn" id="qAdd">+ Add line</button>
    <div class="quote-totals">
      <div>Subtotal: <strong id="qSubtotal">0.00</strong></div>
      <div>VAT: <strong id="qVatAmount">0.00</strong></div>
      <div>Total: <strong id="qTotal">0.00</strong></div>
      <div>Deposit (${QUOTE_DEFAULTS.depositPercent}%): <strong id="qDeposit">0.00</strong></div>
    </div>
    <label>Terms (one per line)</label>
    <textarea id="qTerms" rows="4">${esc(QUOTE_DEFAULTS.terms.join("\n"))}</textarea>
    <button type="button" class="login-button" id="qPrint">Print / Save as PDF</button>
  </div>`;
  document.body.appendChild(wrap);

  const items = wrap.querySelector("#qItems");
  wrap.addEventListener("input", () => refreshTotals(wrap));
  wrap.addEventListener("click", (e) => {
    if (e.target.id === "qClose" || e.target === wrap) wrap.remove();
    if (e.target.id === "qAdd") { items.insertAdjacentHTML("beforeend", itemRow()); refreshTotals(wrap); }
    if (e.target.classList.contains("q-remove") && items.children.length > 1) { e.target.closest("tr").remove(); refreshTotals(wrap); }
    if (e.target.id === "qPrint") {
      const q = readQuote(wrap);
      if (!q.items.length) return alert("Add at least one line with a description or price.");
      const w = window.open("", "_blank");
      if (!w) return alert("Allow pop-ups for this site to print the quote.");
      w.document.write(printableQuote(q));
      w.document.close();
      w.focus();
      w.print();
    }
  });
  refreshTotals(wrap);
}
