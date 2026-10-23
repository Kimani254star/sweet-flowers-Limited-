const SELECTOR = ".gallery-grid img, .gallery-manage-item img";

const css =
  "#sfgLb{position:fixed;inset:0;z-index:10000;display:none;align-items:center;justify-content:center;flex-direction:column;background:rgba(0,0,0,.9);padding:16px;box-sizing:border-box}" +
  "#sfgLb.open{display:flex}" +
  "#sfgLb img{max-width:92vw;max-height:80vh;object-fit:contain;border-radius:8px;box-shadow:0 10px 40px rgba(0,0,0,.6)}" +
  "#sfgLb p{color:#fff;margin:12px 0 0;text-align:center;font-size:16px;max-width:90vw}" +
  "#sfgLb small{color:#bbb;margin-top:4px}" +
  "#sfgLb button{position:absolute;border:0;background:rgba(255,255,255,.15);color:#fff;cursor:pointer;border-radius:50%;width:44px;height:44px;font-size:24px;line-height:1}" +
  "#sfgLb button:hover{background:rgba(255,255,255,.3)}" +
  "#sfgLbClose{top:16px;right:16px}" +
  "#sfgLbPrev{left:16px;top:50%;transform:translateY(-50%)}" +
  "#sfgLbNext{right:16px;top:50%;transform:translateY(-50%)}" +
  SELECTOR.split(",").map((s) => s.trim()).join(",") + "{cursor:zoom-in}";

let box, imgEl, capEl, countEl, list = [], index = 0;

function build() {
  const st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);
  box = document.createElement("div");
  box.id = "sfgLb";
  box.innerHTML = '<button type="button" id="sfgLbClose" aria-label="Close">&times;</button>' +
    '<button type="button" id="sfgLbPrev" aria-label="Previous">&#8249;</button>' +
    '<img alt=""><p></p><small></small>' +
    '<button type="button" id="sfgLbNext" aria-label="Next">&#8250;</button>';
  document.body.appendChild(box);
  imgEl = box.querySelector("img");
  capEl = box.querySelector("p");
  countEl = box.querySelector("small");
  box.addEventListener("click", (e) => {
    if (e.target.id === "sfgLbPrev") show(index - 1);
    else if (e.target.id === "sfgLbNext") show(index + 1);
    else if (e.target !== imgEl && e.target !== capEl) close();
  });
}

function show(i) {
  if (!list.length) return;
  index = (i + list.length) % list.length;
  const src = list[index];
  imgEl.src = src.currentSrc || src.src;
  const cap = src.alt && src.alt !== "Gallery image" ? src.alt : "";
  capEl.textContent = cap;
  capEl.style.display = cap ? "block" : "none";
  countEl.textContent = list.length > 1 ? (index + 1) + " / " + list.length : "";
  box.querySelector("#sfgLbPrev").style.display = list.length > 1 ? "block" : "none";
  box.querySelector("#sfgLbNext").style.display = list.length > 1 ? "block" : "none";
}

function open(img) {
  if (!box) build();
  const scope = img.closest(".gallery-grid, .gallery-manage-grid") || document;
  list = [...scope.querySelectorAll(SELECTOR)];
  box.classList.add("open");
  document.body.style.overflow = "hidden";
  show(Math.max(0, list.indexOf(img)));
}

function close() {
  if (!box) return;
  box.classList.remove("open");
  imgEl.removeAttribute("src");
  document.body.style.overflow = "";
}

document.addEventListener("click", (e) => {
  const img = e.target.closest(SELECTOR);
  if (img && !box?.contains(img)) open(img);
});

document.addEventListener("keydown", (e) => {
  if (!box || !box.classList.contains("open")) return;
  if (e.key === "Escape") close();
  else if (e.key === "ArrowLeft") show(index - 1);
  else if (e.key === "ArrowRight") show(index + 1);
});
