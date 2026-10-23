(function () {
  if (window.__sfgRightBar) return;
  window.__sfgRightBar = true;

  var CALLS = [["Erickson Mayetti", "0705 391 000"], ["Joseph Kimani", "0717 346 231"]];
  var TOOLS = [
    ["google", "🌐", "Google"],
    ["phone", "📞", "Phone"],
    ["excel", "📊", "Excel"]
  ];

  var css =
    "#sfgRightBar{position:fixed;right:0;top:0;bottom:0;width:10rem;z-index:8990;display:flex;flex-direction:column;gap:8px;padding:8px 4px;overflow-y:auto;background:#000;color:#fff;box-sizing:border-box}" +
    "#sfgRightBar button{width:100%;min-height:32px;flex:none;display:flex;align-items:center;justify-content:flex-start;gap:8px;text-align:left;border:0;background:transparent;color:#fff;border-radius:4px;font-size:14px;line-height:1.25;cursor:pointer;transition:all .3s;padding:6px;font-family:inherit}" +
    "#sfgRightBar button:hover,#sfgRightBar button.on{background:#2E7D32;color:#fff}" +
    "body.sfgrb-on{padding-right:10rem;box-sizing:border-box}" +
    "#sfgRbPanel{position:fixed;top:1rem;right:11rem;width:20rem;max-width:calc(100vw - 12rem);max-height:calc(100vh - 2rem);z-index:8991;display:none;flex-direction:column;overflow:hidden;background:#fff;color:#0f172a;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 25px 50px -12px rgba(0,0,0,.25);font-size:13px;line-height:1.4;font-family:inherit}" +
    "#sfgRbPanel.open{display:flex}" +
    "#sfgRbPanel *{box-sizing:border-box;font-family:inherit}" +
    "#sfgRbHead{padding:12px;color:#fff;background:#2E7D32;font-weight:700;display:flex;justify-content:space-between;align-items:center}" +
    "#sfgRbHead button{background:none;border:0;color:#fff;font-weight:700;font-size:14px;cursor:pointer}" +
    "#sfgRbBody{padding:12px;overflow-y:auto;display:flex;flex-direction:column;gap:10px}" +
    ".sfgrb-card{border:1px solid #e5e7eb;border-radius:8px;padding:8px 10px}" +
    ".sfgrb-card b{display:block}" +
    ".sfgrb-row{display:flex;gap:6px;margin-top:6px}" +
    ".sfgrb-btn{flex:1;display:inline-block;text-align:center;padding:8px 10px;border:0;border-radius:6px;background:#2E7D32;color:#fff;font-weight:700;font-size:13px;cursor:pointer;text-decoration:none}" +
    ".sfgrb-btn.wa{background:#128C7E}" +
    ".sfgrb-btn.o{background:#fff;color:#1B5E20;border:1px solid #2E7D32}" +
    "#sfgRbPanel input{width:100%;height:34px;padding:0 8px;border:1px solid #d1d5db;border-radius:6px;font:inherit}" +
    ".sfgrb-note{color:#6b7280;font-size:12px;margin:0}" +
    "@media (max-width:700px){#sfgRightBar{width:48px}#sfgRightBar button{justify-content:center}.sfgrb-l{display:none}body.sfgrb-on{padding-right:48px}#sfgRbPanel{right:56px;left:8px;width:auto;max-width:none}}";

  var bar, panel, titleEl, bodyEl, current = null;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function normalize(raw) {
    var d = String(raw || "").replace(/[^\d+]/g, "");
    if (!d) return "";
    if (d.charAt(0) === "+") return d.slice(1);
    if (d.charAt(0) === "0") return "254" + d.slice(1);
    return d;
  }

  function closePanel() {
    panel.classList.remove("open");
    current = null;
    [].forEach.call(bar.querySelectorAll("button.on"), function (b) { b.classList.remove("on"); });
  }

  function openPanel(key, title, html) {
    if (current === key) return closePanel();
    closePanel();
    current = key;
    titleEl.textContent = title;
    bodyEl.innerHTML = html;
    panel.classList.add("open");
    var b = bar.querySelector('[data-t="' + key + '"]');
    if (b) b.classList.add("on");
  }

  function phonePanel() {
    var quick = CALLS.map(function (c) {
      var n = normalize(c[1]);
      return '<div class="sfgrb-card"><b>' + esc(c[0]) + "</b>" + esc(c[1]) +
        '<div class="sfgrb-row"><a class="sfgrb-btn" href="tel:+' + n + '">📞 Call</a>' +
        '<a class="sfgrb-btn wa" href="https://wa.me/' + n + '" target="_blank" rel="noopener">WhatsApp</a></div></div>';
    }).join("");
    openPanel("phone", "📞 Phone",
      quick +
      '<div class="sfgrb-card"><b>Dial a customer</b>' +
      '<input id="sfgRbNum" type="tel" placeholder="e.g. 0712 345 678" style="margin-top:6px">' +
      '<div class="sfgrb-row"><button type="button" class="sfgrb-btn" id="sfgRbCall">📞 Call</button>' +
      '<button type="button" class="sfgrb-btn wa" id="sfgRbWa">WhatsApp</button></div>' +
      '<p class="sfgrb-note" style="margin-top:6px">Numbers starting with 0 are dialled as Kenya (+254).</p></div>');
    var num = document.getElementById("sfgRbNum");
    document.getElementById("sfgRbCall").onclick = function () {
      var n = normalize(num.value);
      if (!n) return alert("Type a phone number first.");
      window.location.href = "tel:+" + n;
    };
    document.getElementById("sfgRbWa").onclick = function () {
      var n = normalize(num.value);
      if (!n) return alert("Type a phone number first.");
      window.open("https://wa.me/" + n, "_blank", "noopener");
    };
  }

  function cellText(td) {
    var clone = td.cloneNode(true);
    [].forEach.call(clone.querySelectorAll("select"), function (s) {
      var sel = td.querySelector("select");
      s.replaceWith(document.createTextNode(sel && sel.selectedOptions[0] ? sel.selectedOptions[0].text : ""));
    });
    [].forEach.call(clone.querySelectorAll("button"), function (b) { b.remove(); });
    return clone.textContent.replace(/\s+/g, " ").trim();
  }

  function csvCell(v) {
    v = String(v);
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }

  function visibleTables() {
    return [].filter.call(document.querySelectorAll("main table, .admin-main table"), function (t) {
      return t.offsetParent !== null && t.querySelector("tbody tr");
    });
  }

  function tableCsv(t) {
    var heads = [].map.call(t.querySelectorAll("thead th"), function (th) { return th.textContent.trim(); });
    var skip = heads.map(function (h) { return /^(action|quote)$/i.test(h); });
    var lines = [];
    lines.push(heads.filter(function (h, i) { return !skip[i]; }).map(csvCell).join(","));
    [].forEach.call(t.querySelectorAll("tbody tr"), function (tr) {
      var cells = [].map.call(tr.children, function (td) { return cellText(td); });
      if (cells.length !== heads.length) return;
      lines.push(cells.filter(function (c, i) { return !skip[i]; }).map(csvCell).join(","));
    });
    return lines.join("\r\n");
  }

  function downloadTables() {
    var tables = visibleTables();
    if (!tables.length) return alert("There is no table on this page to download.");
    var parts = tables.map(function (t) {
      var h = t.previousElementSibling;
      var title = h && /^H[1-4]$/.test(h.tagName) ? csvCell(h.textContent.trim()) + "\r\n" : "";
      return title + tableCsv(t);
    });
    var blob = new Blob(["\uFEFF" + parts.join("\r\n\r\n")], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    var page = (document.body.getAttribute("data-page") || "page").replace(/[^a-z0-9-]/gi, "");
    a.href = URL.createObjectURL(blob);
    a.download = "sweet-flower-garden-" + page + "-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function excelPanel() {
    openPanel("excel", "📊 Excel",
      '<p class="sfgrb-note">Download the table you are looking at and open it in Excel.</p>' +
      '<button type="button" class="sfgrb-btn" id="sfgRbDl">📥 Download this page for Excel</button>' +
      '<a class="sfgrb-btn o" href="https://www.office.com/launch/excel" target="_blank" rel="noopener">Open Excel online</a>');
    document.getElementById("sfgRbDl").onclick = downloadTables;
  }

  function build() {
    var st = document.createElement("style");
    st.id = "sfgRbCss";
    st.textContent = css;
    document.head.appendChild(st);

    bar = document.createElement("aside");
    bar.id = "sfgRightBar";
    bar.innerHTML = TOOLS.map(function (t) {
      return '<button type="button" data-t="' + t[0] + '" title="' + t[2] + '"><span>' + t[1] + '</span><span class="sfgrb-l">' + t[2] + "</span></button>";
    }).join("");

    panel = document.createElement("div");
    panel.id = "sfgRbPanel";
    panel.innerHTML = '<div id="sfgRbHead"><span id="sfgRbTitle"></span><button type="button" data-c="1">✕</button></div><div id="sfgRbBody"></div>';

    document.body.appendChild(bar);
    document.body.appendChild(panel);
    document.body.classList.add("sfgrb-on");
    titleEl = document.getElementById("sfgRbTitle");
    bodyEl = document.getElementById("sfgRbBody");

    bar.addEventListener("click", function (e) {
      var b = e.target.closest("[data-t]");
      if (!b) return;
      var t = b.getAttribute("data-t");
      if (t === "google") { closePanel(); window.open("https://www.google.com/", "_blank", "noopener"); }
      else if (t === "phone") phonePanel();
      else if (t === "excel") excelPanel();
    });
    panel.addEventListener("click", function (e) { if (e.target.closest("[data-c]")) closePanel(); });
  }

  if (document.body) build(); else document.addEventListener("DOMContentLoaded", build);
})();
