// Fills a panel from window.TBX ({ copy, data }) and draws the pixel background.
// render.mjs injects TBX; opening a panel in a browser without it shows keys.
(() => {
  const TBX = window.TBX || { copy: {}, data: {} };
  const get = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  for (const el of document.querySelectorAll("[data-copy]")) {
    const key = el.dataset.copy, text = TBX.copy[key];
    if (text === "NONE") { el.remove(); continue; }
    el.innerHTML = !text || text === "TODO"
      ? `<span class="todo">TODO: ${esc(key)}</span>`
      : text.split(/\n\s*\n/).map((p) => esc(p.replace(/\n/g, " "))).join(el.dataset.paras === "p" ? "</p><p>" : "<br><br>");
  }
  // "Title: one line" cards.
  for (const el of document.querySelectorAll("[data-card]")) {
    const key = el.dataset.card, text = TBX.copy[key];
    const todo = !text || text === "TODO";
    const [title, ...rest] = todo ? [] : text.split(":");
    el.querySelector("h3").innerHTML = todo ? `<span class="todo">TODO</span>` : esc(title.trim());
    const p = el.querySelector("p");
    if (todo) p.innerHTML = `<span class="hint">${esc(key)}</span>`;
    else if (rest.length) p.textContent = rest.join(":").trim();
    else p.remove();
  }
  for (const el of document.querySelectorAll("[data-fact]")) {
    const v = get(TBX.data, el.dataset.fact);
    el.textContent = v == null ? "?" : v;
  }

  // blue-bg.gif frames via WebCodecs, scaled like the site: center top / cover.
  window.frameCount = 1;
  window.setFrame = async () => {};
  const canvas = document.querySelector(".bg canvas");
  if (!canvas) { window.panelReady = document.fonts.ready; return; }
  window.panelReady = (async () => {
    await document.fonts.ready;
    const bytes = await (await fetch("../../skills/fl1nt-design/assets/images/blue-bg.gif")).arrayBuffer();
    const dec = new ImageDecoder({ data: bytes, type: "image/gif" });
    await dec.tracks.ready;
    window.frameCount = dec.tracks.selectedTrack.frameCount;
    const box = canvas.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(box.width * dpr); canvas.height = Math.round(box.height * dpr);
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    window.setFrame = async (i) => {
      const { image } = await dec.decode({ frameIndex: i });
      const s = Math.max(canvas.width / image.displayWidth, canvas.height / image.displayHeight);
      const w = image.displayWidth * s, h = image.displayHeight * s;
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, (canvas.width - w) / 2, 0, w, h);
      image.close();
    };
    await window.setFrame(0);
  })();
})();
