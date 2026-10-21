// post.js
// Renders a long-form project write-up from posts.js (post.html?p=<slug>):
// header + cover animation, sticky table of contents, content blocks,
// image lightbox, and a slide-deck viewer.

(() => {
  "use strict";

  const root = document.getElementById("post");
  const slug = new URLSearchParams(location.search).get("p");
  const post = (window.POSTS || {})[slug];
  const PH = !!(window.SITE && window.SITE.showPlaceholders);

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // **bold**, *italic*, `code`, [text](url), and $inline math$ (typeset with KaTeX)
  const mdText = (s) =>
    esc(s)
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text, url) =>
        /^https?:/.test(url) ? `<a href="${url}" target="_blank" rel="noopener">${text}</a>` : `<a href="${url}">${text}</a>`
      )
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, "<code>$1</code>");
  const md = (s) =>
    String(s ?? "")
      .split(/(\$[^$]+\$)/g)
      .map((part) =>
        part.length > 2 && part.startsWith("$") && part.endsWith("$")
          ? `<span class="math" data-tex="${esc(part.slice(1, -1))}">${esc(part.slice(1, -1))}</span>`
          : mdText(part)
      )
      .join("");

  document.getElementById("year").textContent = new Date().getFullYear();

  // A project without a write-up yet gets a "coming soon" page built from content.js
  const slugOf = (p) =>
    p.post ||
    p.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const project = ((window.SITE && window.SITE.projects) || []).find((p) => slugOf(p) === slug);

  if (!post && project) {
    document.title = `${project.title} · Rhea Senthil Kumar`;
    const links = (project.links || []).filter((l) => l.url);
    root.innerHTML = `
      <header class="post-header">
        <a class="post-back" href="index.html#projects">← All projects</a>
        <p class="section-label">Project · ${esc(project.date)}</p>
        <h1>${esc(project.title)}</h1>
        <p class="post-subtitle">${md(project.summary)}</p>
        <div class="tags">${project.stack.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
      </header>

      <div class="post-cover">${project.image ? `<img src="${esc(project.image)}" alt="">` : `<canvas data-viz="${esc(project.viz)}" aria-hidden="true"></canvas>`}</div>

      <div class="wip-banner glass-card">
        <span class="wip-icon" aria-hidden="true"><i></i><i></i><i></i></span>
        <div>
          <span class="wip-label">Work in progress</span>
          <h2>The full write-up is coming soon.</h2>
          <p>I'm writing up the story behind this project: the problem, the approach, the results, and what I learned. In the meantime, here's the summary.</p>
        </div>
      </div>

      <article class="post-body wip-body">
        <h2 class="post-h2">At a glance</h2>
        <div class="post-stats"><div><b class="gradient-text">${esc(project.metric)}</b><span>headline result</span></div></div>
        <ul class="post-list">${project.bullets.map((b) => `<li>${md(b)}</li>`).join("")}</ul>
        ${
          links.length
            ? `<div class="link-row post-links">${links
                .map((l) => `<a class="chip-link" href="${esc(l.url)}" ${/^https?:/.test(l.url) ? 'target="_blank" rel="noopener"' : ""}>${esc(l.label)} <span aria-hidden="true">↗</span></a>`)
                .join("")}</div>`
            : ""
        }
      </article>

      <div class="post-end">
        <a class="secondary-btn" href="index.html#projects">← Back to all projects</a>
        <a class="primary-btn" href="index.html#contact">Ask me about it</a>
      </div>`;
    root.querySelectorAll(".post-cover, .wip-banner, .post-stats").forEach((el) => el.classList.add("reveal"));
    return;
  }

  if (!post) {
    root.innerHTML = `
      <div class="post-missing">
        <h1>Write-up not found</h1>
        <p>There's no post called “${esc(slug || "")}” in posts.js.</p>
        <a class="primary-btn" href="index.html#projects">← Back to projects</a>
      </div>`;
    return;
  }

  document.title = `${post.title} · Rhea Senthil Kumar`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.content = post.subtitle;

  // ---------------------------------------------------------------- blocks

  const linkBtns = (links) =>
    links
      .map((l) =>
        l.url
          ? `<a class="chip-link" href="${esc(l.url)}" ${/^https?:/.test(l.url) ? 'target="_blank" rel="noopener"' : ""}>${esc(l.label)} <span aria-hidden="true">↗</span></a>`
          : PH
            ? `<span class="chip-link is-empty" title="Placeholder: add a URL in posts.js">+ ${esc(l.label)}</span>`
            : ""
      )
      .join("");

  const fig = (f, extra = "") => `
    <figure class="post-fig ${f.wide ? "is-wide" : ""} ${extra}">
      <button class="fig-frame" type="button" data-zoom="${esc(f.src)}" data-caption="${esc(f.caption || "")}" aria-label="Enlarge figure">
        <img src="${esc(f.src)}" alt="${esc(f.caption || "")}" loading="lazy">
      </button>
      ${f.caption ? `<figcaption>${md(f.caption)}</figcaption>` : ""}
    </figure>`;

  const toc = [];
  const words = [];

  const block = (b) => {
    if (b.h2) {
      toc.push({ id: b.id, label: b.h2 });
      return `<h2 id="${esc(b.id)}" class="post-h2">${esc(b.h2)}</h2>`;
    }
    if (b.p) {
      words.push(b.p);
      return `<p>${md(b.p)}</p>`;
    }
    if (b.callout) {
      words.push(b.callout);
      return `<aside class="post-callout">${b.label ? `<span>${esc(b.label)}</span>` : ""}<p>${md(b.callout)}</p></aside>`;
    }
    if (b.stats) {
      return `<div class="post-stats">${b.stats.map((s) => `<div><b class="gradient-text">${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join("")}</div>`;
    }
    if (b.list) {
      words.push(...b.list);
      return `<ul class="post-list">${b.list.map((i) => `<li>${md(i)}</li>`).join("")}</ul>`;
    }
    if (b.steps) {
      b.steps.forEach((s) => words.push(s.text));
      return `<ol class="post-steps">${b.steps.map((s) => `<li><b>${md(s.title)}</b><span>${md(s.text)}</span></li>`).join("")}</ol>`;
    }
    if (b.math) {
      return `<figure class="post-math"><div class="math math-block" data-tex="${esc(b.math)}">${esc(b.math)}</div>${b.caption ? `<figcaption>${md(b.caption)}</figcaption>` : ""}</figure>`;
    }
    if (b.flow) {
      return `<ol class="post-flow">${b.flow
        .map(
          (f) => `<li>${f.q ? `<span class="flow-q">${md(f.q)}</span><span class="flow-yes">yes →</span>` : ""}<span class="flow-a">${md(f.a)}</span></li>`
        )
        .join("")}</ol>`;
    }
    if (b.video) {
      const v = b.video;
      const watch = `https://www.youtube.com/watch?v=${esc(v.youtube)}`;
      return `
        <figure class="post-video">
          <div class="post-video-frame">
            ${
              // YouTube refuses embedded playback on file:// pages (Error 153), so show a linked thumbnail there
              location.protocol === "file:"
                ? `<a class="post-video-thumb" href="${watch}" target="_blank" rel="noopener" aria-label="Play on YouTube"><img src="https://i.ytimg.com/vi/${esc(v.youtube)}/hqdefault.jpg" alt="${esc(v.title || "")}"><span aria-hidden="true">▶</span></a>`
                : `<iframe src="https://www.youtube-nocookie.com/embed/${esc(v.youtube)}" title="${esc(v.title || "YouTube video")}" loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`
            }
          </div>
          <figcaption>${v.caption ? md(v.caption) + " " : ""}<a href="${watch}" target="_blank" rel="noopener">Watch on YouTube ↗</a></figcaption>
        </figure>`;
    }
    if (b.figure) return fig(b.figure);
    if (b.figures) return `<div class="post-figs cols-${Math.min(3, b.figures.length)}">${b.figures.map((f) => fig(f)).join("")}</div>`;
    if (b.table) {
      const t = b.table;
      // right-align only columns whose cells are all numbers
      const isNum = (v) => /^[\s\d.,%×→≈~#+\-–/]*\d[\s\d.,%×→≈~#+\-–/a-zA-Z]*$/.test(String(v).replace(/\*\*/g, "")) && /^[\s\d.,%×→≈~#+\-–]/.test(String(v).replace(/\*\*/g, ""));
      const numCol = t.head.map((_, c) => c > 0 && t.rows.every((r) => isNum(r[c])));
      const cls = (c) => (numCol[c] ? ' class="num"' : "");
      return `
        <figure class="post-table-wrap">
          <div class="post-table-scroll"><table class="post-table">
            <thead><tr>${t.head.map((h, c) => `<th${cls(c)}>${esc(h)}</th>`).join("")}</tr></thead>
            <tbody>${t.rows.map((r, i) => `<tr class="${i === t.highlight ? "is-best" : ""}">${r.map((v, c) => `<td${cls(c)}>${md(v)}</td>`).join("")}</tr>`).join("")}</tbody>
          </table></div>
          ${t.caption ? `<figcaption>${md(t.caption)}</figcaption>` : ""}
        </figure>`;
    }
    if (b.cards) {
      return `<div class="post-cards cols-${b.cards.length > 2 ? "many" : "two"}">${b.cards
        .map(
          (c) => `
          <article class="post-card glass-card ${c.chosen ? "is-chosen" : ""}">
            <header>
              <span class="post-card-badge">${esc(c.badge || "")}</span>
              <h3>${c.link ? `<a href="${esc(c.link)}" target="_blank" rel="noopener">${esc(c.title)}</a>` : esc(c.title)}</h3>
              ${c.chosen ? `<span class="badge badge-upcoming">Chosen</span>` : ""}
            </header>
            ${c.groups
              .map(
                (g) => `<div class="post-card-group"><h4>${esc(g.label)}</h4><ul>${g.items.map((i) => `<li>${md(i)}</li>`).join("")}</ul></div>`
              )
              .join("")}
          </article>`
        )
        .join("")}</div>`;
    }
    if (b.slides) {
      const s = b.slides;
      return `
        <div class="slide-viewer" tabindex="0" aria-label="Slide deck viewer. Use left and right arrow keys to navigate." style="--slide-aspect:${esc(s.aspect || "16 / 9")}">
          <div class="slide-stage">
            <img class="slide-main" src="${esc(s.images[0])}" alt="Slide 1">
            <button class="slide-nav prev" type="button" aria-label="Previous slide">‹</button>
            <button class="slide-nav next" type="button" aria-label="Next slide">›</button>
          </div>
          <div class="slide-bar">
            <span class="slide-count"><b>1</b> / ${s.images.length}</span>
            <div class="slide-progress"><i></i></div>
            <button class="slide-full" type="button">Full screen</button>
            ${s.pdf ? `<a class="slide-dl" href="${esc(s.pdf)}" download>PDF ↓</a>` : ""}
          </div>
          <div class="slide-thumbs">${s.images
            .map((src, i) => `<button type="button" data-i="${i}" aria-label="Go to slide ${i + 1}" class="${i === 0 ? "is-active" : ""}"><img src="${esc(src)}" alt="" loading="lazy"><span>${i + 1}</span></button>`)
            .join("")}</div>
        </div>`;
    }
    if (b.links) return `<div class="link-row post-links">${linkBtns(b.links)}</div>`;
    return "";
  };

  const bodyHTML = post.body.map(block).join("");
  const minutes = Math.max(1, Math.round(words.join(" ").split(/\s+/).length / 200));

  root.innerHTML = `
    <header class="post-header">
      <a class="post-back" href="index.html#projects">← All projects</a>
      <p class="section-label">${esc(post.kicker)}</p>
      <h1>${esc(post.title)}</h1>
      <p class="post-subtitle">${md(post.subtitle)}</p>
      <div class="post-meta">
        <span>Rhea Senthil Kumar</span><span>${esc(post.date)}</span><span>${minutes} min read</span>
      </div>
      <div class="tags">${post.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
      ${post.note ? `<p class="post-note">${md(post.note)}</p>` : ""}
    </header>

    ${
      post.cover
        ? `<div class="post-cover">${post.cover.image ? `<img src="${esc(post.cover.image)}" alt="">` : `<canvas data-viz="${esc(post.cover.viz)}" aria-hidden="true"></canvas>`}</div>`
        : ""
    }

    ${post.tldr ? `<div class="post-tldr"><span class="post-tldr-label">TL;DR</span>${post.tldr.map((s) => `<div><b class="gradient-text">${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join("")}</div>` : ""}

    <div class="post-layout">
      <aside class="post-toc" aria-label="On this page">
        <p>On this page</p>
        <ol>${toc.map((t) => `<li><a href="#${esc(t.id)}">${esc(t.label)}</a></li>`).join("")}</ol>
      </aside>
      <article class="post-body">${bodyHTML}</article>
    </div>

    <div class="post-end">
      <a class="secondary-btn" href="index.html#projects">← Back to all projects</a>
      <a class="primary-btn" href="index.html#contact">Get in touch</a>
    </div>`;

  // ---------------------------------------------------------------- math

  const typeset = () => {
    if (!window.katex) return;
    root.querySelectorAll(".math[data-tex]").forEach((el) => {
      try {
        window.katex.render(el.dataset.tex, el, { displayMode: el.classList.contains("math-block"), throwOnError: false });
        el.classList.add("is-typeset");
      } catch (e) {
        /* leave the raw TeX visible */
      }
    });
  };
  if (window.katex) typeset();
  else window.addEventListener("load", typeset);

  // ---------------------------------------------------------------- TOC highlight

  const tocLinks = [...root.querySelectorAll(".post-toc a")];
  const heads = tocLinks.map((a) => document.getElementById(a.getAttribute("href").slice(1)));
  const onScroll = () => {
    let cur = 0;
    heads.forEach((h, i) => {
      if (h && h.getBoundingClientRect().top < window.innerHeight * 0.3) cur = i;
    });
    tocLinks.forEach((a, i) => a.classList.toggle("is-active", i === cur));
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---------------------------------------------------------------- lightbox

  const lb = document.getElementById("lightbox");
  const lbImg = lb.querySelector("img");
  const lbCap = lb.querySelector(".lightbox-caption");
  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-zoom]");
    if (!btn) return;
    lbImg.src = btn.dataset.zoom;
    lbImg.alt = btn.dataset.caption;
    lbCap.textContent = btn.dataset.caption;
    lb.showModal ? lb.showModal() : lb.setAttribute("open", "");
  });
  const closeLb = () => (lb.close ? lb.close() : lb.removeAttribute("open"));
  lb.querySelector(".modal-close").addEventListener("click", closeLb);
  lb.addEventListener("click", (e) => e.target === lb && closeLb());

  // ---------------------------------------------------------------- slide viewer

  root.querySelectorAll(".slide-viewer").forEach((viewer) => {
    const images = [...viewer.querySelectorAll(".slide-thumbs img")].map((i) => i.getAttribute("src"));
    const main = viewer.querySelector(".slide-main");
    const count = viewer.querySelector(".slide-count b");
    const bar = viewer.querySelector(".slide-progress i");
    const thumbs = [...viewer.querySelectorAll(".slide-thumbs button")];
    let i = 0;
    const go = (n, scrollStrip = true) => {
      i = (n + images.length) % images.length;
      main.src = images[i];
      main.alt = `Slide ${i + 1}`;
      count.textContent = i + 1;
      bar.style.width = `${((i + 1) / images.length) * 100}%`;
      thumbs.forEach((t, k) => t.classList.toggle("is-active", k === i));
      if (scrollStrip) {
        const t = thumbs[i];
        const strip = t.parentElement;
        const offset = t.getBoundingClientRect().left - strip.getBoundingClientRect().left + strip.scrollLeft;
        strip.scrollTo({ left: offset - (strip.clientWidth - t.clientWidth) / 2, behavior: "smooth" });
      }
      // preload neighbours
      [i + 1, i - 1].forEach((k) => {
        const img = new Image();
        img.src = images[(k + images.length) % images.length];
      });
    };
    viewer.querySelector(".prev").addEventListener("click", () => go(i - 1));
    viewer.querySelector(".next").addEventListener("click", () => go(i + 1));
    thumbs.forEach((t) => t.addEventListener("click", () => go(+t.dataset.i)));
    viewer.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") go(i + 1);
      if (e.key === "ArrowLeft") go(i - 1);
    });
    viewer.querySelector(".slide-full").addEventListener("click", () => {
      const stage = viewer.querySelector(".slide-stage");
      if (document.fullscreenElement) document.exitFullscreen();
      else if (stage.requestFullscreen) stage.requestFullscreen();
    });
    // swipe on touch screens
    let x0 = null;
    main.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
    main.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
      x0 = null;
    });
    go(0, false);
  });

  // Reveal-on-scroll for big blocks (script.js observes .reveal)
  root.querySelectorAll(".post-fig, .post-figs, .post-cards, .post-table-wrap, .slide-viewer, .post-stats").forEach((el) => el.classList.add("reveal"));
})();
