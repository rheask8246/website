// script.js
// Renders every section from content.js, then wires up the visuals:
//   • Hero:      Three.js spacetime sheet rippling from a binary black-hole inspiral
//   • Research:  live conditional-flow-matching animation (noise → GW population)
//   • Projects:  a small generative canvas per project (attention maps, piano rolls, orbits…)
//   • Talks:     rotating dotted globe with arcs to every venue
//   • Global:    starfield, scroll progress, timeline fill, reveals, tilt, glow, cursor

(() => {
  "use strict";

  const S = window.SITE;
  if (!S) {
    console.error("content.js did not load — window.SITE is missing.");
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const PH = !!S.showPlaceholders;
  const IS_POST = document.body.dataset.page === "post";

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fmtMonth = (ym) => {
    const [y, m] = String(ym).split("-").map(Number);
    return m ? `${MONTHS[m - 1]} ${y}` : String(y);
  };
  const now = new Date();
  const nowYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const isUpcoming = (ym) => ym > nowYM;

  function linkChips(links = [], where = "") {
    return links
      .map((l) => {
        if (l.url) {
          return `<a class="chip-link" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} <span aria-hidden="true">↗</span></a>`;
        }
        if (!PH) return "";
        return `<span class="chip-link is-empty" title="Placeholder: add a URL for “${esc(l.label)}” in content.js → ${esc(where)}">+ ${esc(l.label)}</span>`;
      })
      .join("");
  }

  function slot(label, where) {
    if (!PH) return "";
    return `<div class="slot"><span class="slot-icon">+</span><span class="slot-label">${esc(label)}</span><code>content.js → ${esc(where)}</code></div>`;
  }

  function mediaHTML(src, alt, label, where) {
    if (!src) return slot(label, where);
    return `<img src="${esc(src)}" alt="${esc(alt || "")}" loading="lazy" decoding="async" data-slot-label="${esc(label)}" data-slot-where="${esc(where)}">`;
  }

  // Broken image → swap for a placeholder slot (or hide it)
  function guardImages(root = document) {
    $$("img[data-slot-label]", root).forEach((img) => {
      const swap = () => {
        const html = slot(img.dataset.slotLabel, img.dataset.slotWhere);
        if (html) img.outerHTML = html;
        else img.remove();
      };
      if (img.complete && img.naturalWidth === 0) swap();
      else img.addEventListener("error", swap, { once: true });
    });
  }

  // URL slug for a project page: its write-up name, or one made from the title
  const projectSlug = (p) =>
    p.post ||
    p.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const tagsHTML = (arr = []) => arr.map((t) => `<span class="tag">${esc(t)}</span>`).join("");
  const bulletsHTML = (arr = []) => `<ul class="exp-bullets">${arr.map((b) => `<li>${md(b)}</li>`).join("")}</ul>`;

  // Colors for canvases
  const CY = [91, 188, 255];
  const VI = [167, 139, 250];
  const AM = [255, 184, 107];
  const GR = [74, 222, 128];
  const PK = [240, 171, 252];
  const WH = [240, 245, 255];
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const mixC = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const MONO = "10px 'JetBrains Mono', ui-monospace, monospace";

  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }
  const hash = (x) => {
    const s = Math.sin(x * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  function gauss(r) {
    const u = Math.max(1e-9, r());
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
  }
  function rrect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---------------------------------------------------------------------------
  // Render: hero
  // ---------------------------------------------------------------------------

  const P = S.profile;

  function renderHero() {
    $('[data-field="eyebrow"]').textContent = P.eyebrow;
    $('[data-field="summary"]').textContent = P.summary;

    // Split name into animated characters
    let ci = 0;
    $('[data-field="name"]').innerHTML = P.name
      .split(" ")
      .map(
        (word) =>
          `<span class="word">${[...word]
            .map((ch) => `<span class="char" style="animation-delay:${250 + ci++ * 38}ms">${esc(ch)}</span>`)
            .join("")}</span>`
      )
      .join(" ");
    $('[data-field="name"]').setAttribute("aria-label", P.name);

    const stats = (P.stats || []).map((s) => {
      const value = s.count ? (S[s.count] || []).length : s.value;
      return { ...s, value };
    });
    $(".hero-stats").innerHTML = stats
      .map(
        (s) =>
          `<div><dt data-count="${s.value}" data-decimals="${s.decimals || 0}" data-suffix="${esc(s.suffix || "")}">${s.value}${esc(s.suffix || "")}</dt><dd>${esc(s.label)}</dd></div>`
      )
      .join("");

    const cvBtn = $("[data-cv]");
    if (P.cv) {
      cvBtn.href = P.cv;
      cvBtn.setAttribute("download", "");
    } else if (PH) {
      cvBtn.classList.add("chip-link", "is-empty");
      cvBtn.classList.remove("secondary-btn");
      cvBtn.title = "Placeholder: add your CV path in content.js → profile.cv";
      cvBtn.textContent = "+ CV (PDF)";
    } else {
      cvBtn.remove();
    }

    // Staggered entrance for the rest of the hero
    [".hero-eyebrow", ".hero-rotator", ".hero-description", ".hero-buttons", ".hero-stats"].forEach((sel, i) => {
      const el = $(sel);
      el.classList.add("hero-fade");
      el.style.animationDelay = `${i === 0 ? 100 : 700 + i * 140}ms`;
    });
  }

  function startRotator() {
    const el = $(".rotator-text");
    const roles = P.roles || [];
    if (!el || !roles.length) return;
    if (reduceMotion) {
      el.textContent = roles[0];
      return;
    }
    let r = 0;
    let i = 0;
    let deleting = false;
    const tick = () => {
      const word = roles[r];
      i += deleting ? -1 : 1;
      el.textContent = word.slice(0, i);
      let delay = deleting ? 22 : 48;
      if (!deleting && i === word.length) {
        deleting = true;
        delay = 1900;
      } else if (deleting && i === 0) {
        deleting = false;
        r = (r + 1) % roles.length;
        delay = 350;
      }
      setTimeout(tick, delay);
    };
    setTimeout(tick, 1400);
  }

  function animateCounters() {
    $$(".hero-stats dt").forEach((dt, k) => {
      const target = parseFloat(dt.dataset.count);
      const dec = +dt.dataset.decimals;
      const suf = dt.dataset.suffix;
      if (reduceMotion || isNaN(target)) return;
      const start = performance.now() + 1100 + k * 120;
      const dur = 1600;
      const step = (now) => {
        const p = clamp((now - start) / dur, 0, 1);
        const v = target * (1 - Math.pow(1 - p, 4));
        dt.textContent = v.toFixed(dec) + suf;
        if (p < 1) requestAnimationFrame(step);
      };
      dt.textContent = (0).toFixed(dec) + suf;
      requestAnimationFrame(step);
    });
  }

  // ---------------------------------------------------------------------------
  // Render: about, education
  // ---------------------------------------------------------------------------

  function renderAbout() {
    const wrap = $(".portrait-wrap");
    const img = $('[data-field="portrait"]');
    if (P.portrait) {
      img.src = P.portrait;
      img.addEventListener("error", () => img.replaceWith(htmlToEl(slot("Portrait photo", "profile.portrait") || "<span></span>")));
    } else {
      img.replaceWith(htmlToEl(slot("Portrait photo", "profile.portrait") || "<span></span>"));
    }
    wrap.classList.add("has-portrait");
    $('[data-field="location"]').textContent = P.location;

    $("#about-bio").innerHTML = (P.bio || []).map((p) => `<p>${md(p)}</p>`).join("");

    const n = P.now || { items: [] };
    $("#now").innerHTML = `
      <h3><span class="live-dot"></span>Now</h3>
      <span class="updated">updated ${esc(n.updated || "")}</span>
      <ul>${n.items.map((i) => `<li>${md(i)}</li>`).join("")}</ul>`;
  }

  function renderEducation() {
    $("#education-grid").innerHTML = S.education
      .map(
        (e, i) => `
      <article class="edu-card glass-card reveal" style="transition-delay:${i * 90}ms">
        <div class="edu-media">
          ${mediaHTML(e.image, e.school, "Campus photo", `education[${i}].image`)}
          <span class="edu-gpa"><small>GPA</small>${esc(e.gpa)}</span>
        </div>
        <div class="edu-body">
          <span class="edu-dates">${esc(e.dates)}</span>
          <h3>${esc(e.school)}</h3>
          <p class="edu-degree">${esc(e.degree)}</p>
          ${e.focus ? `<p class="edu-focus">${esc(e.focus)}</p>` : ""}
          <h4>Relevant coursework</h4>
          <div class="tags">${tagsHTML(e.coursework)}</div>
          ${e.links && e.links.length ? `<div class="link-row">${linkChips(e.links, `education[${i}].links`)}</div>` : ""}
        </div>
      </article>`
      )
      .join("");
  }

  function htmlToEl(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  // ---------------------------------------------------------------------------
  // Render: spotlight, experience, projects
  // ---------------------------------------------------------------------------

  function renderSpotlight() {
    const s = S.spotlight;
    $("#spotlight-text").innerHTML = `
      <p class="spotlight-kicker">${esc(s.kicker)}</p>
      <h3>${esc(s.title)}</h3>
      <p>${md(s.blurb)}</p>
      <div class="spot-stats">${s.stats.map((st) => `<div class="spot-stat"><b class="gradient-text">${esc(st.value)}</b><span>${esc(st.label)}</span></div>`).join("")}</div>
      <div class="link-row">${linkChips(s.links, "spotlight.links")}</div>`;
  }

  function renderExperience() {
    const list = $("#experience-list");
    S.experience.forEach((e, i) => {
      list.insertAdjacentHTML(
        "beforeend",
        `
      <article class="exp-item glass-card reveal">
        <span class="exp-node" aria-hidden="true"></span>
        <div class="exp-media">
          ${mediaHTML(e.image, e.imageAlt, "Photo for this role", `experience[${i}].image`)}
          <span class="exp-dates-badge">${esc(e.dates)}</span>
        </div>
        <div class="exp-body">
          <p class="exp-org">${esc(e.org)}</p>
          <h3>${esc(e.group)}</h3>
          <p class="exp-role">${esc(e.role)}</p>
          <p class="exp-meta">${esc(e.mentors)}${e.location ? " · " + esc(e.location) : ""}</p>
          ${bulletsHTML(e.bullets)}
          <div class="exp-foot">
            <div class="tags">${tagsHTML(e.tags)}</div>
            <div class="link-row">${linkChips(e.links, `experience[${i}].links`)}</div>
          </div>
        </div>
      </article>`
      );
    });
  }

  function renderProjects() {
    const grid = $("#project-grid");
    const cats = {};
    S.projects.forEach((p) => p.categories.forEach((c) => (cats[c] = (cats[c] || 0) + 1)));

    $("#project-filters").innerHTML =
      `<button class="filter-btn is-active" data-filter="*" role="tab" aria-selected="true">All<span class="count">${S.projects.length}</span></button>` +
      Object.entries(cats)
        .map(([c, n]) => `<button class="filter-btn" data-filter="${esc(c)}" role="tab" aria-selected="false">${esc(c)}<span class="count">${n}</span></button>`)
        .join("");

    // Without placeholders, a project with no write-up is a plain card instead of a link to a "coming soon" page
    grid.innerHTML = S.projects
      .map((p, i) => {
        const linked = p.post || PH;
        const tag = linked ? "a" : "article";
        return `
      <${tag} ${linked ? `href="post.html?p=${esc(projectSlug(p))}" ` : ""}class="project-card glass-card reveal${linked ? " has-post" : ""}${p.post ? "" : " is-wip"}"
        ${linked ? `aria-label="${p.post ? "Read the write-up" : "Write-up coming soon"}: ${esc(p.title)}" ` : ""}data-index="${i}" data-cats="${esc(p.categories.join("|"))}"
        style="transition-delay:${(i % 3) * 80}ms">
        <div class="project-viz">
          ${p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy">` : `<canvas data-viz="${esc(p.viz)}" aria-hidden="true"></canvas>`}
          <span class="project-metric">${esc(p.metric)}</span>
        </div>
        <div class="project-body">
          <span class="project-date">${esc(p.date)}${p.post ? ' · <b class="post-flag">Write-up</b>' : PH ? ' · <b class="post-flag is-wip">WIP · coming soon</b>' : ""}</span>
          <h3>${esc(p.title)}</h3>
          <p>${md(p.summary)}</p>
          <div class="tags">${tagsHTML(p.stack)}</div>
          ${linked ? `<span class="project-more">${p.post ? "Read the full write-up" : "Write-up coming soon"} <i>→</i></span>` : ""}
        </div>
      </${tag}>`;
      })
      .join("");

    $$("#project-filters .filter-btn").forEach((btn) =>
      btn.addEventListener("click", () => {
        $$("#project-filters .filter-btn").forEach((b) => {
          b.classList.toggle("is-active", b === btn);
          b.setAttribute("aria-selected", b === btn);
        });
        const f = btn.dataset.filter;
        $$(".project-card", grid).forEach((card) => {
          const show = f === "*" || card.dataset.cats.split("|").includes(f);
          card.classList.toggle("is-hidden", !show);
          if (show) card.classList.add("is-in");
        });
      })
    );
  }

  // ---------------------------------------------------------------------------
  // Render: talks, leadership, honors, skills, media, hobbies, contact
  // ---------------------------------------------------------------------------

  let globeInst = null;

  function renderTalks() {
    const pubs = S.publications.map((p, i) => ({ ...p, i })).sort((a, b) => (a.date < b.date ? 1 : -1));
    const isTalk = (p) => p.type === "Talk" || p.type === "Presentation";
    const filters = [
      ["*", "All", pubs.length],
      ["talk", "Talks", pubs.filter(isTalk).length],
      ["poster", "Posters", pubs.filter((p) => p.type === "Poster").length],
      ["upcoming", "Upcoming", pubs.filter((p) => isUpcoming(p.date)).length]
    ].filter((f) => f[2] > 0);

    $("#talk-filters").innerHTML = filters
      .map(([k, l, n], j) => `<button class="filter-btn ${j === 0 ? "is-active" : ""}" data-filter="${k}" role="tab" aria-selected="${j === 0}">${l}<span class="count">${n}</span></button>`)
      .join("");

    let lastYear = null;
    const html = [];
    pubs.forEach((p) => {
      const year = p.date.slice(0, 4);
      if (year !== lastYear) {
        html.push(`<li class="talk-year" data-year="${year}" aria-hidden="true">${year}</li>`);
        lastYear = year;
      }
      const kinds = [isTalk(p) ? "talk" : "poster"];
      if (isUpcoming(p.date)) kinds.push("upcoming");
      const authors = esc(p.authors).replace(/R\.\s?S\.\s?Kumar/g, '<span class="me">$&</span>');
      html.push(`
        <li class="talk-item glass-card reveal" data-kinds="${kinds.join(" ")}" data-year="${year}" data-location="${esc(p.location)}">
          <div class="talk-top">
            <span class="badge badge-${p.type.toLowerCase()}">${esc(p.type)}</span>
            ${isUpcoming(p.date) ? `<span class="badge badge-upcoming">Upcoming</span>` : p.status ? `<span class="badge badge-presentation">${esc(p.status)}</span>` : ""}
            <span>${fmtMonth(p.date)} · ${esc(p.location)}</span>
          </div>
          <h3>${esc(p.title)}</h3>
          <p class="talk-venue">${esc(p.venue)}</p>
          <p class="talk-authors">${authors}</p>
          ${p.links && p.links.length ? `<div class="link-row">${linkChips(p.links, `publications[${p.i}].links`)}</div>` : ""}
        </li>`);
    });
    $("#talk-list").innerHTML = html.join("");

    $$("#talk-filters .filter-btn").forEach((btn) =>
      btn.addEventListener("click", () => {
        $$("#talk-filters .filter-btn").forEach((b) => {
          b.classList.toggle("is-active", b === btn);
          b.setAttribute("aria-selected", b === btn);
        });
        const f = btn.dataset.filter;
        const visibleYears = new Set();
        $$(".talk-item").forEach((li) => {
          const show = f === "*" || li.dataset.kinds.split(" ").includes(f);
          li.classList.toggle("is-hidden", !show);
          if (show) {
            li.classList.add("is-in");
            visibleYears.add(li.dataset.year);
          }
        });
        $$(".talk-year").forEach((y) => y.classList.toggle("is-hidden", !visibleYears.has(y.dataset.year)));
      })
    );

    $$(".talk-item").forEach((li) => {
      li.addEventListener("mouseenter", () => globeInst && globeInst.api.focus(li.dataset.location));
      li.addEventListener("mouseleave", () => globeInst && globeInst.api.focus(null));
    });
  }

  function renderLeadership() {
    $("#leadership-grid").innerHTML = S.leadership
      .map(
        (l, i) => `
      <article class="lead-card glass-card reveal" style="transition-delay:${(i % 2) * 90}ms">
        ${l.image || l.viz || PH ? `<div class="lead-media">
          ${l.image ? mediaHTML(l.image, l.imageAlt, "Program photo", `leadership[${i}].image`) : l.viz ? `<canvas data-viz="${esc(l.viz)}" aria-hidden="true"></canvas>` : slot("Add a program photo", `leadership[${i}].image`)}
        </div>` : ""}
        <div class="lead-body">
          <span class="lead-org">${esc(l.org)}</span>
          <h3>${esc(l.program)}</h3>
          <p class="lead-role">${esc(l.role)} <span>· ${esc(l.dates)}</span></p>
          ${bulletsHTML(l.bullets)}
          <div class="link-row">${linkChips(l.links, `leadership[${i}].links`)}</div>
        </div>
      </article>`
      )
      .join("");
  }

  function renderHonors() {
    $("#honors-grid").innerHTML = S.honors
      .map(
        (h, i) => `
      <article class="honor-card glass-card reveal" style="transition-delay:${i * 70}ms">
        <span class="honor-year">${esc(h.year)}</span>
        <div><h3>${esc(h.title)}</h3>${h.date ? `<span class="honor-date">${esc(h.date)}</span>` : ""}</div>
      </article>`
      )
      .join("");
    $("#membership-list").innerHTML = S.memberships.map((m) => `<li>${esc(m.name)}<span>${esc(m.years)}</span></li>`).join("");
  }

  function renderSkills() {
    $("#skills-grid").innerHTML = S.skills
      .map(
        (g, i) => `
      <div class="skill-group glass-card reveal" style="transition-delay:${(i % 2) * 90}ms">
        <h3>${esc(g.group)}<span>${g.items.length}</span></h3>
        <div class="tags">${tagsHTML(g.items)}</div>
      </div>`
      )
      .join("");

    const all = S.skills.flatMap((g) => g.items);
    const half = Math.ceil(all.length / 2);
    const row = (items) => {
      const spans = items.map((s) => `<span>${esc(s)}</span>`).join("");
      return spans + spans; // duplicated for a seamless loop
    };
    $("#marquee-a").innerHTML = row(all.slice(0, half));
    $("#marquee-b").innerHTML = row(all.slice(half));
  }

  function renderMedia() {
    const typeLabel = { image: "Photo", video: "Video", pdf: "PDF", link: "Link" };
    $("#gallery-grid").innerHTML = S.gallery
      .map((g, i) => {
        let inner;
        const where = `gallery[${i}].src`;
        if (!g.src) inner = slot(`Add ${typeLabel[g.type] ? typeLabel[g.type].toLowerCase() : "media"}`, where);
        else if (g.type === "video") inner = `<iframe src="${esc(g.src)}" title="${esc(g.caption)}" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
        else if (g.type === "pdf" || g.type === "link") inner = `<a class="pdf-link" href="${esc(g.src)}" target="_blank" rel="noopener">Open ${typeLabel[g.type]} ↗</a>`;
        else inner = mediaHTML(g.src, g.caption, "Add photo", where);
        if (!inner) return "";
        return `
          <figure class="gallery-item glass-card reveal" style="transition-delay:${(i % 3) * 80}ms">
            <div class="gallery-media">${inner}</div>
            <figcaption>${esc(g.caption)}<span>${typeLabel[g.type] || ""}</span></figcaption>
          </figure>`;
      })
      .join("");
    if (!$("#gallery-grid").children.length) {
      $("#gallery-grid").remove();
      $("#elsewhere-subhead").remove();
    }

    $("#elsewhere-grid").innerHTML = S.elsewhere
      .map((e, i) => {
        if (e.url) {
          return `<a class="elsewhere-card glass-card reveal" href="${esc(e.url)}" target="_blank" rel="noopener">
            <span><b>${esc(e.label)}</b><small>${esc(e.note)}</small></span><span class="arrow">↗</span></a>`;
        }
        if (!PH) return "";
        return `<div class="elsewhere-card glass-card reveal is-empty" title="Placeholder: add a URL in content.js → elsewhere[${i}].url">
            <span><b>${esc(e.label)}</b><small>${esc(e.note)} · add link</small></span><span class="arrow">+</span></div>`;
      })
      .join("");
  }

  function renderHobbies() {
    $("#hobbies-grid").innerHTML = S.hobbies
      .map(
        (h, i) => `
      <article class="hobby-card glass-card reveal" style="transition-delay:${i * 90}ms">
        ${h.image || PH ? `<div class="hobby-media">${mediaHTML(h.image, h.title, `Add a ${h.title.toLowerCase()} photo`, `hobbies[${i}].image`)}</div>` : ""}
        <div class="hobby-body"><h3>${esc(h.title)}</h3><p>${esc(h.text)}</p></div>
      </article>`
      )
      .join("");
  }

  function renderContact() {
    const links = [
      `<a class="primary-btn" href="mailto:${esc(P.email)}">✉ ${esc(P.email)}</a>`,
      `<button class="secondary-btn copy-email" type="button">Copy email<span class="toast">Copied!</span></button>`,
      `<a class="secondary-btn" href="${esc(P.linkedin)}" target="_blank" rel="noopener">LinkedIn ↗</a>`,
      `<a class="secondary-btn" href="${esc(P.github)}" target="_blank" rel="noopener">GitHub ↗</a>`
    ];
    if (P.scholar) links.push(`<a class="secondary-btn" href="${esc(P.scholar)}" target="_blank" rel="noopener">Google Scholar ↗</a>`);
    else if (PH) links.push(`<span class="chip-link is-empty" title="Placeholder: content.js → profile.scholar">+ Google Scholar</span>`);
    if (P.cv) links.push(`<a class="secondary-btn" href="${esc(P.cv)}" download>Download CV</a>`);
    $("#contact-links").innerHTML = links.join("");

    const copyBtn = $(".copy-email");
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(P.email);
      } catch (e) {
        /* clipboard blocked (e.g. file://) — the mailto link still works */
      }
      copyBtn.classList.add("copied");
      setTimeout(() => copyBtn.classList.remove("copied"), 1400);
    });

    $("#year").textContent = new Date().getFullYear();
    $("#credits-list").innerHTML = S.credits
      .map((c) => `<li>${esc(c.what)} — ${esc(c.who)} · ${esc(c.license)} · <a href="${esc(c.url)}" target="_blank" rel="noopener">source</a></li>`)
      .join("");
  }

  function renderEditHint() {
    if (!PH) return;
    try {
      if (sessionStorage.getItem("hideEditHint")) return;
    } catch (e) {
      /* storage unavailable */
    }
    const bar = htmlToEl(
      `<div class="edit-hint" role="note"><span>Dashed boxes are placeholders. Fill them in <code>content.js</code>, or set <code>showPlaceholders: false</code> to hide them.</span><button type="button">Got it</button></div>`
    );
    document.body.appendChild(bar);
    $("button", bar).addEventListener("click", () => {
      bar.remove();
      try {
        sessionStorage.setItem("hideEditHint", "1");
      } catch (e) {
        /* ignore */
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Canvas visualization engine — one RAF loop, only draws what's on screen
  // ---------------------------------------------------------------------------

  const vizList = [];
  const vizIO = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        const v = vizList.find((x) => x.canvas === e.target);
        if (!v) return;
        v.visible = e.isIntersecting;
      }),
    { rootMargin: "120px" }
  );

  function sizeViz(v) {
    const r = v.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(r.height));
    if (w !== v.w || h !== v.h) {
      v.canvas.width = w * dpr;
      v.canvas.height = h * dpr;
      v.w = w;
      v.h = h;
      v.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      v.drawnOnce = false;
    }
  }

  function mountViz(canvas, type, opts = {}) {
    const factory = VIZ[type];
    if (!factory) return null;
    const v = { canvas, ctx: canvas.getContext("2d"), w: 0, h: 0, visible: false, opts, api: {}, last: 0 };
    v.draw = factory(v);
    vizList.push(v);
    vizIO.observe(canvas);
    return v;
  }
  function unmountViz(v) {
    vizIO.unobserve(v.canvas);
    const i = vizList.indexOf(v);
    if (i >= 0) vizList.splice(i, 1);
  }

  function vizLoop(ms) {
    const t = ms / 1000;
    for (const v of vizList) {
      if (!v.visible) continue;
      sizeViz(v);
      if (v.w < 4 || v.h < 4) continue;
      if (reduceMotion) {
        // Draw a single still frame (redrawn only after resize or interaction)
        if (!v.drawnOnce) {
          v.draw(v.ctx, v.w, v.h, v.staticT ?? 3.2, 0);
          v.drawnOnce = true;
        }
        continue;
      }
      const dt = v.last ? Math.min(0.05, t - v.last) : 0.016;
      v.last = t;
      v.draw(v.ctx, v.w, v.h, t, dt);
    }
    requestAnimationFrame(vizLoop);
  }

  // ---------------------------------------------------------------------------
  // The visualizations
  // ---------------------------------------------------------------------------

  const VIZ = {
    // Causal self-attention heatmap with a sweeping query row (LLM project)
    attention() {
      const n = 12;
      return (ctx, w, h, t) => {
        ctx.clearRect(0, 0, w, h);
        const size = Math.min(w * 0.62, h - 34);
        const cell = size / n;
        const ox = (w - size) / 2 + 10;
        const oy = (h - size) / 2 + 6;
        const active = Math.floor(t * 1.4) % n;
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            const x = ox + j * cell;
            const y = oy + i * cell;
            if (j > i) {
              ctx.fillStyle = "rgba(255,255,255,0.06)";
              ctx.fillRect(x + cell / 2 - 1, y + cell / 2 - 1, 2, 2);
              continue;
            }
            const wave = 0.5 + 0.5 * Math.sin(t * 1.1 + i * 0.7 - j * 1.3);
            let a = 0.07 + 0.55 * wave * Math.exp(-(i - j) * 0.3);
            if (j === 0) a += 0.22;
            if (i === j) a += 0.35;
            if (i === active) a = a * 1.5 + 0.12;
            ctx.fillStyle = rgba(mixC(CY, VI, j / (n - 1)), Math.min(1, a));
            rrect(ctx, x + 1.5, y + 1.5, cell - 3, cell - 3, 3);
            ctx.fill();
          }
        }
        ctx.strokeStyle = "rgba(255,255,255,0.75)";
        ctx.lineWidth = 1.2;
        rrect(ctx, ox + 0.5, oy + active * cell + 0.5, (active + 1) * cell - 1, cell - 1, 4);
        ctx.stroke();

        ctx.font = MONO;
        ctx.fillStyle = "rgba(225,233,255,0.45)";
        ctx.fillText("keys →", ox, oy - 7);
        ctx.save();
        ctx.translate(ox - 8, oy);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = "right";
        ctx.fillText("queries →", 0, 0);
        ctx.restore();

        // RoPE: rotating query/key vectors on the right
        const rx = ox + size + (w - (ox + size)) / 2;
        const ry = oy + size / 2;
        const rr = Math.min(28, (w - ox - size) / 3);
        if (rr > 10) {
          ctx.strokeStyle = "rgba(255,255,255,0.12)";
          ctx.beginPath();
          ctx.arc(rx, ry, rr, 0, Math.PI * 2);
          ctx.stroke();
          [[CY, 0.9], [VI, 0.9 + 0.35 * (active % 4)]].forEach(([c, sp], k) => {
            const ang = t * sp + k * 1.2 + active * 0.4;
            ctx.strokeStyle = rgba(c, 0.9);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx + Math.cos(ang) * rr, ry + Math.sin(ang) * rr);
            ctx.stroke();
          });
          ctx.fillStyle = "rgba(225,233,255,0.45)";
          ctx.textAlign = "center";
          ctx.fillText("RoPE", rx, ry + rr + 16);
          ctx.textAlign = "left";
        }
      };
    },

    // Piano roll: audio smear on the right is transcribed into crisp MIDI on the left
    spectrogram() {
      const scale = [0, 2, 4, 7, 9];
      const beat = 0.2;
      return (ctx, w, h, t) => {
        ctx.clearRect(0, 0, w, h);
        const top = 22;
        const bottom = h - 30;
        const rows = 22;
        const rh = (bottom - top) / rows;
        const pxs = Math.max(60, w / 6);
        const playX = w * 0.6;
        const tMin = t - playX / pxs;
        const tMax = t + (w - playX) / pxs;

        for (let r = 0; r <= rows; r += 1) {
          ctx.fillStyle = r % 5 === 0 ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)";
          ctx.fillRect(0, bottom - r * rh, w, 1);
        }

        const b0 = Math.floor(tMin / beat) - 4;
        const b1 = Math.ceil(tMax / beat);
        for (let b = b0; b <= b1; b++) {
          if (hash(b) > 0.58) continue;
          const voices = hash(b + 0.71) < 0.3 ? 2 : 1;
          for (let v = 0; v < voices; v++) {
            const deg = Math.floor(hash(b + 0.37 + v) * 10);
            const pitch = scale[deg % 5] + 7 * Math.floor(deg / 5) + v * 4;
            const len = beat * (1 + Math.floor(hash(b + 0.13) * 3));
            const ts = b * beat;
            const x0 = playX + (ts - t) * pxs;
            const x1 = playX + (ts + len - t) * pxs;
            const y = bottom - (pitch + 1) * rh;
            const col = mixC(VI, CY, pitch / rows);
            if (x1 > playX) {
              // unheard audio: blurry harmonics
              const xa = Math.max(x0, playX);
              [0, 7, 12].forEach((hm, k) => {
                const yy = y - hm * rh;
                if (yy < top - rh) return;
                ctx.fillStyle = rgba(col, 0.16 / (k + 1));
                ctx.fillRect(xa, yy - rh * 0.4, x1 - xa, rh * 1.8);
              });
            }
            if (x0 < playX) {
              const xb = Math.min(x1, playX);
              const crossing = x1 > playX;
              ctx.fillStyle = rgba(col, crossing ? 1 : 0.85);
              if (crossing) {
                ctx.shadowColor = rgba(col, 0.9);
                ctx.shadowBlur = 12;
              }
              rrect(ctx, x0 + 1, y + 1, Math.max(2, xb - x0 - 2), rh - 2, 2.5);
              ctx.fill();
              ctx.shadowBlur = 0;
            }
          }
        }

        // playhead
        const g = ctx.createLinearGradient(playX - 30, 0, playX, 0);
        g.addColorStop(0, "rgba(91,188,255,0)");
        g.addColorStop(1, "rgba(91,188,255,0.18)");
        ctx.fillStyle = g;
        ctx.fillRect(playX - 30, top - 8, 30, bottom - top + 8);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fillRect(playX, top - 8, 1.5, bottom - top + 8);

        // waveform strip
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const tt = tMin + x / pxs;
          const env = 0.35 + 0.65 * hash(Math.floor(tt / beat));
          const y = h - 13 + Math.sin(x * 0.55 + t * 9) * Math.sin(x * 0.13) * 7 * env;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "rgba(91,188,255,0.45)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = MONO;
        ctx.fillStyle = "rgba(225,233,255,0.5)";
        ctx.fillText("MIDI ←", 10, 14);
        ctx.textAlign = "right";
        ctx.fillText("← audio", w - 10, 14);
        ctx.textAlign = "left";
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillText("Conformer", playX + 6, top + 4);
      };
    },

    // Four memory systems as clusters; an agent retrieves from one at a time
    memory() {
      const r = rng(7);
      const groups = [
        { name: "semantic", c: CY },
        { name: "episodic", c: VI },
        { name: "procedural", c: AM },
        { name: "working", c: GR }
      ];
      const nodes = [];
      groups.forEach((g, gi) => {
        for (let k = 0; k < 7; k++) nodes.push({ g: gi, a: r() * Math.PI * 2, d: 0.25 + r() * 0.75, ph: r() * 6, sp: 0.2 + r() * 0.4 });
      });
      const edges = [];
      nodes.forEach((n, i) => {
        const same = nodes.map((m, j) => j).filter((j) => j !== i && nodes[j].g === n.g);
        for (let k = 0; k < 2; k++) edges.push([i, same[Math.floor(r() * same.length)]]);
      });
      for (let k = 0; k < 6; k++) edges.push([Math.floor(r() * nodes.length), Math.floor(r() * nodes.length)]);

      return (ctx, w, h, t) => {
        ctx.clearRect(0, 0, w, h);
        const cx = w / 2;
        const cy = h / 2;
        const R = Math.min(w * 0.36, h * 0.38);
        const cr = R * 0.38;
        const pos = nodes.map((n) => {
          const ga = groups.length ? (n.g / groups.length) * Math.PI * 2 + Math.PI / 4 : 0;
          const gx = cx + Math.cos(ga) * R * 1.05;
          const gy = cy + Math.sin(ga) * R * 0.78;
          const a = n.a + t * n.sp * 0.3;
          return [gx + Math.cos(a) * cr * n.d, gy + Math.sin(a) * cr * n.d * 0.8];
        });

        ctx.lineWidth = 1;
        edges.forEach(([a, b], k) => {
          ctx.strokeStyle = nodes[a].g === nodes[b].g ? rgba(groups[nodes[a].g].c, 0.18) : "rgba(255,255,255,0.06)";
          ctx.beginPath();
          ctx.moveTo(pos[a][0], pos[a][1]);
          ctx.lineTo(pos[b][0], pos[b][1]);
          ctx.stroke();
          // pulses
          const f = (t * 0.6 + hash(k) * 3) % 1.6;
          if (f < 1) {
            ctx.fillStyle = rgba(groups[nodes[a].g].c, 0.9 * Math.sin(f * Math.PI));
            ctx.beginPath();
            ctx.arc(lerp(pos[a][0], pos[b][0], f), lerp(pos[a][1], pos[b][1], f), 1.8, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // agent retrieval
        const cyc = t / 1.8;
        const gi = Math.floor(cyc) % groups.length;
        const pr = cyc % 1;
        nodes.forEach((n, i) => {
          if (n.g !== gi) return;
          const p = pos[i];
          const reach = clamp(pr * 2.2 - hash(i) * 0.6, 0, 1);
          ctx.strokeStyle = rgba(groups[gi].c, 0.5 * Math.sin(pr * Math.PI));
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(lerp(cx, p[0], reach), lerp(cy, p[1], reach));
          ctx.stroke();
        });
        nodes.forEach((n, i) => {
          const lit = n.g === gi ? 0.5 * Math.sin(pr * Math.PI) : 0;
          ctx.fillStyle = rgba(groups[n.g].c, 0.55 + lit);
          ctx.beginPath();
          ctx.arc(pos[i][0], pos[i][1], 2.6 + lit * 3, 0, Math.PI * 2);
          ctx.fill();
        });

        // agent
        const pulse = 1 + 0.15 * Math.sin(t * 4);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18 * pulse);
        g.addColorStop(0, "rgba(255,255,255,0.95)");
        g.addColorStop(0.35, rgba(groups[gi].c, 0.5));
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, 18 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = MONO;
        let lx = 10;
        groups.forEach((gr, k) => {
          ctx.fillStyle = rgba(gr.c, k === gi ? 1 : 0.45);
          ctx.fillText(gr.name, lx, 16);
          lx += ctx.measureText(gr.name).width + 12;
        });
        ctx.fillStyle = "rgba(225,233,255,0.5)";
        ctx.fillText("LLM agent", cx - 24, cy - 22);
      };
    },

    // Catan board: each dice roll produces resources, routed to keep players equal
    catan() {
      const r = rng(21);
      const res = [
        { n: "wood", c: [62, 150, 98] },
        { n: "brick", c: [196, 104, 70] },
        { n: "sheep", c: [150, 205, 118] },
        { n: "wheat", c: [232, 194, 96] },
        { n: "ore", c: [138, 148, 180] }
      ];
      const bag = [0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4];
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      const nums = [5, 2, 6, 3, 8, 10, 9, 12, 11, 4, 8, 10, 9, 4, 5, 6, 3, 11];
      const hexes = [];
      let k = 0;
      for (let q = -2; q <= 2; q++) {
        for (let s = Math.max(-2, -q - 2); s <= Math.min(2, -q + 2); s++) {
          if (q === 0 && s === 0) hexes.push({ q, s, desert: true });
          else {
            hexes.push({ q, s, res: bag[k], num: nums[k] });
            k++;
          }
        }
      }
      const players = [CY, VI, AM];
      const roll = (n) => {
        let d = 2 + Math.floor(hash(n * 1.37) * 6) + Math.floor(hash(n * 2.71 + 5) * 6);
        if (d === 7) d = 8;
        return d;
      };

      return (ctx, w, h, t) => {
        ctx.clearRect(0, 0, w, h);
        const s = Math.min((w * 0.6) / (5 * 1.732), (h * 0.84) / 8);
        const bx = w * 0.38;
        const by = h / 2;
        const period = 1.5;
        const n = Math.floor(t / period);
        const ph = (t % period) / period;
        const cur = roll(n);

        const center = (hx) => [bx + s * 1.732 * (hx.q + hx.s / 2), by + s * 1.5 * hx.s];
        hexes.forEach((hx) => {
          const [x, y] = center(hx);
          const hot = !hx.desert && hx.num === cur;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = Math.PI / 6 + (i * Math.PI) / 3;
            const px = x + Math.cos(a) * s * 0.94;
            const py = y + Math.sin(a) * s * 0.94;
            i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
          }
          ctx.closePath();
          const c = hx.desert ? [150, 132, 100] : res[hx.res].c;
          ctx.fillStyle = rgba(c, hot ? 0.55 + 0.4 * (1 - ph) : 0.2);
          ctx.fill();
          ctx.strokeStyle = rgba(c, hot ? 0.95 : 0.4);
          ctx.lineWidth = hot ? 1.6 : 1;
          ctx.stroke();
          if (!hx.desert && s > 12) {
            ctx.fillStyle = hot ? "#fff" : "rgba(255,255,255,0.55)";
            ctx.font = `${Math.round(s * 0.42)}px 'Space Grotesk', sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(hx.num, x, y);
          }
        });
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";

        // players
        const px = w * 0.8;
        const ppos = players.map((c, i) => [px, h * (0.25 + i * 0.25)]);
        // Each roll's yield goes to the poorest player, so totals converge (cycle restarts every 30 rolls)
        const totals = [8, 11, 14];
        for (let m = 0; m < n % 30; m++) totals[totals.indexOf(Math.min(...totals))] += 1;
        const maxT = Math.max(...totals);

        // resources flying to the player with the fewest (fair allocation)
        const poorest = totals.indexOf(Math.min(...totals));
        hexes.forEach((hx, hi) => {
          if (hx.desert || hx.num !== cur) return;
          const [x, y] = center(hx);
          const target = ppos[(poorest + hi) % 3];
          const e = easeInOut(clamp(ph * 1.4, 0, 1));
          ctx.fillStyle = rgba(res[hx.res].c, 1 - ph * 0.6);
          ctx.beginPath();
          ctx.arc(lerp(x, target[0], e), lerp(y, target[1], e) - Math.sin(e * Math.PI) * 18, 3.2, 0, Math.PI * 2);
          ctx.fill();
        });

        ppos.forEach(([x, y], i) => {
          ctx.fillStyle = rgba(players[i], 0.95);
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
          const bw = (w - x - 18) * (totals[i] / maxT);
          ctx.fillStyle = rgba(players[i], 0.35);
          rrect(ctx, x + 10, y - 3, Math.max(4, bw), 6, 3);
          ctx.fill();
        });

        ctx.font = MONO;
        ctx.fillStyle = "rgba(225,233,255,0.55)";
        ctx.fillText(`roll ${cur}`, 10, 16);
        const mean = totals.reduce((a, b) => a + b) / 3;
        let gsum = 0;
        totals.forEach((a) => totals.forEach((b) => (gsum += Math.abs(a - b))));
        ctx.textAlign = "right";
        ctx.fillText(`illustrative · Gini ${(gsum / (2 * 9 * mean)).toFixed(3)}`, w - 10, 16);
        ctx.textAlign = "left";
      };
    },

    // Rotating 3-D embedding space; a user retrieves its top-5 nearest items
    embedding() {
      const r = rng(11);
      const pal = [CY, VI, AM, GR, PK, WH];
      const centers = pal.map(() => {
        const u = r() * 2 - 1;
        const th = r() * Math.PI * 2;
        const s = Math.sqrt(1 - u * u);
        return [s * Math.cos(th) * 0.75, u * 0.75, s * Math.sin(th) * 0.75];
      });
      const pts = [];
      for (let i = 0; i < 200; i++) {
        const c = i % centers.length;
        const C0 = centers[c];
        pts.push({ p: [C0[0] + gauss(r) * 0.17, C0[1] + gauss(r) * 0.17, C0[2] + gauss(r) * 0.17], c });
      }
      let q = -1;
      let nn = [];
      return (ctx, w, h, t) => {
        ctx.clearRect(0, 0, w, h);
        const qi = Math.floor(t / 3);
        if (qi !== q) {
          q = qi;
          const user = pts[Math.floor(hash(qi + 0.5) * pts.length)];
          nn = pts
            .map((p, i) => [i, (p.p[0] - user.p[0]) ** 2 + (p.p[1] - user.p[1]) ** 2 + (p.p[2] - user.p[2]) ** 2])
            .sort((a, b) => a[1] - b[1])
            .slice(0, 6)
            .map((x) => x[0]);
        }
        const a = t * 0.25;
        const tilt = 0.35;
        const S0 = Math.min(w, h) * 0.42;
        const proj = (p) => {
          const x = p[0] * Math.cos(a) + p[2] * Math.sin(a);
          let z = -p[0] * Math.sin(a) + p[2] * Math.cos(a);
          const y = p[1] * Math.cos(tilt) - z * Math.sin(tilt);
          z = p[1] * Math.sin(tilt) + z * Math.cos(tilt);
          const f = 2.6 / (2.6 + z);
          return [w / 2 + x * S0 * f, h / 2 + y * S0 * f, z, f];
        };
        const P2 = pts.map((p) => proj(p.p));
        const order = P2.map((_, i) => i).sort((i, j) => P2[j][2] - P2[i][2]);
        const ph = (t % 3) / 3;
        const user = nn[0];

        // links to top-K
        nn.slice(1).forEach((i, k) => {
          const reveal = clamp(ph * 4 - k * 0.35, 0, 1);
          if (reveal <= 0) return;
          const A = P2[user];
          const B = P2[i];
          ctx.strokeStyle = `rgba(255,255,255,${0.55 * reveal})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(A[0], A[1]);
          ctx.lineTo(lerp(A[0], B[0], reveal), lerp(A[1], B[1], reveal));
          ctx.stroke();
        });

        order.forEach((i) => {
          const [x, y, z, f] = P2[i];
          const isNN = nn.indexOf(i) > 0;
          const alpha = 0.25 + 0.5 * (1 - (z + 1) / 2);
          ctx.fillStyle = rgba(pal[pts[i].c], isNN ? 1 : alpha);
          ctx.beginPath();
          ctx.arc(x, y, (isNN ? 3.4 : 2) * f, 0, Math.PI * 2);
          ctx.fill();
        });

        const U = P2[user];
        const g = ctx.createRadialGradient(U[0], U[1], 0, U[0], U[1], 16);
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(U[0], U[1], 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = MONO;
        ctx.fillStyle = "rgba(225,233,255,0.55)";
        ctx.fillText(`user #${(hash(qi) * 310000) | 0} → top-5`, 10, 16);
      };
    },

    // Ground sensors on a rotating Earth hand off tracks of orbiting targets
    orbits() {
      const r = rng(5);
      const sats = Array.from({ length: 8 }, () => ({
        a: 1.45 + r() * 1.1,
        inc: 0.15 + r() * 0.6,
        tilt: (r() - 0.5) * 1.2,
        sp: (0.25 + r() * 0.35) * (r() < 0.5 ? 1 : -1),
        ph: r() * Math.PI * 2
      }));
      const sensors = [0, 1.6, 3.1, 4.6].map((a) => ({ a, tgt: -1 }));
      return (ctx, w, h, t) => {
        ctx.clearRect(0, 0, w, h);
        const cx = w / 2;
        const cy = h / 2 + 4;
        const E = Math.min(w, h) * 0.2;
        const satPos = sats.map((s) => {
          const th = s.ph + t * s.sp;
          const x0 = s.a * Math.cos(th);
          const y0 = s.a * Math.sin(th) * Math.sin(s.inc);
          const z = s.a * Math.sin(th) * Math.cos(s.inc);
          const x = x0 * Math.cos(s.tilt) - y0 * Math.sin(s.tilt);
          const y = x0 * Math.sin(s.tilt) + y0 * Math.cos(s.tilt);
          const hidden = z < 0 && x * x + y * y < 1;
          return { x: cx + x * E, y: cy + y * E, z, hidden };
        });

        // orbit paths
        sats.forEach((s) => {
          ctx.beginPath();
          for (let k = 0; k <= 64; k++) {
            const th = (k / 64) * Math.PI * 2;
            const x0 = s.a * Math.cos(th);
            const y0 = s.a * Math.sin(th) * Math.sin(s.inc);
            const x = x0 * Math.cos(s.tilt) - y0 * Math.sin(s.tilt);
            const y = x0 * Math.sin(s.tilt) + y0 * Math.cos(s.tilt);
            k ? ctx.lineTo(cx + x * E, cy + y * E) : ctx.moveTo(cx + x * E, cy + y * E);
          }
          ctx.strokeStyle = "rgba(255,255,255,0.05)";
          ctx.lineWidth = 1;
          ctx.stroke();
        });

        const drawSat = (p, i, tracked) => {
          if (p.hidden) return;
          ctx.fillStyle = tracked ? rgba(CY, 1) : "rgba(255,255,255,0.55)";
          ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
          if (tracked) {
            ctx.strokeStyle = rgba(CY, 0.6);
            ctx.strokeRect(p.x - 5, p.y - 5, 10, 10);
          } else {
            const pr = (t * 0.8 + i * 0.3) % 1;
            ctx.strokeStyle = rgba(AM, 0.5 * (1 - pr));
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3 + pr * 10, 0, Math.PI * 2);
            ctx.stroke();
          }
        };

        // sensor positions + greedy, sticky assignment
        const sp = sensors.map((s) => {
          const a = s.a + t * 0.12;
          return { x: cx + Math.cos(a) * E, y: cy + Math.sin(a) * E, nx: Math.cos(a), ny: Math.sin(a) };
        });
        const valid = (si, ti) => {
          const p = satPos[ti];
          if (p.hidden || p.z < -0.2) return false;
          return (p.x - sp[si].x) * sp[si].nx + (p.y - sp[si].y) * sp[si].ny > 0;
        };
        const taken = new Set();
        sensors.forEach((s, si) => {
          if (s.tgt >= 0 && valid(si, s.tgt) && !taken.has(s.tgt)) taken.add(s.tgt);
          else s.tgt = -1;
        });
        sensors.forEach((s, si) => {
          if (s.tgt >= 0) return;
          let best = -1;
          let bd = 1e9;
          satPos.forEach((p, ti) => {
            if (taken.has(ti) || !valid(si, ti)) return;
            const d = (p.x - sp[si].x) ** 2 + (p.y - sp[si].y) ** 2;
            if (d < bd) {
              bd = d;
              best = ti;
            }
          });
          s.tgt = best;
          if (best >= 0) taken.add(best);
        });

        // satellites behind first
        satPos.forEach((p, i) => p.z < 0 && drawSat(p, i, taken.has(i)));

        // Earth
        const eg = ctx.createRadialGradient(cx - E * 0.35, cy - E * 0.35, E * 0.1, cx, cy, E);
        eg.addColorStop(0, "#2b5d9c");
        eg.addColorStop(0.7, "#11284d");
        eg.addColorStop(1, "#081430");
        ctx.fillStyle = eg;
        ctx.beginPath();
        ctx.arc(cx, cy, E, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = "rgba(140,190,255,0.14)";
        for (let k = -2; k <= 2; k++) {
          ctx.beginPath();
          ctx.ellipse(cx, cy + k * E * 0.38, E * Math.sqrt(1 - (k * 0.38) ** 2), E * 0.08, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        for (let k = 0; k < 4; k++) {
          const off = ((t * 0.12 + k / 4) % 1) * 2 - 1;
          ctx.beginPath();
          ctx.ellipse(cx, cy, Math.abs(off) * E, E, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
        ctx.strokeStyle = "rgba(91,188,255,0.4)";
        ctx.beginPath();
        ctx.arc(cx, cy, E + 2, 0, Math.PI * 2);
        ctx.stroke();

        // GNN edges between sensors
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = "rgba(167,139,250,0.35)";
        sp.forEach((a, i) => {
          const b = sp[(i + 1) % sp.length];
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        });
        ctx.setLineDash([]);

        // beams
        sensors.forEach((s, si) => {
          const a = sp[si];
          if (s.tgt >= 0) {
            const p = satPos[s.tgt];
            const g = ctx.createLinearGradient(a.x, a.y, p.x, p.y);
            g.addColorStop(0, "rgba(91,188,255,0.55)");
            g.addColorStop(1, "rgba(91,188,255,0.05)");
            const dx = p.x - a.x;
            const dy = p.y - a.y;
            const L = Math.hypot(dx, dy) || 1;
            const ox = (-dy / L) * 6;
            const oy = (dx / L) * 6;
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(p.x + ox, p.y + oy);
            ctx.lineTo(p.x - ox, p.y - oy);
            ctx.closePath();
            ctx.fill();
          }
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(a.x, a.y, 3, 0, Math.PI * 2);
          ctx.fill();
        });

        satPos.forEach((p, i) => p.z >= 0 && drawSat(p, i, taken.has(i)));

        ctx.font = MONO;
        ctx.fillStyle = "rgba(225,233,255,0.55)";
        ctx.fillText(`PPO + GAT · tracking ${taken.size}/${sats.length}`, 10, 16);
      };
    },

    // Tiny real-time ray tracer whose noise "converges" like a path tracer
    raytrace() {
      const off = document.createElement("canvas");
      const octx = off.getContext("2d");
      let W = 0;
      let H = 0;
      let img = null;
      const spheres = [
        { c: [-0.8, -0.2, 3.5], r: 0.55, col: [0.3, 0.62, 1.0], refl: 0.2 },
        { c: [0.62, -0.32, 3.0], r: 0.43, col: [0.72, 0.58, 1.0], refl: 0.6 },
        { c: [0.0, -0.6, 2.35], r: 0.15, col: [1.0, 0.72, 0.42], emit: true }
      ];
      const PY = -0.75;
      let hitT = 0;
      let hitO = -1;
      function intersect(ox, oy, oz, dx, dy, dz) {
        hitT = 1e9;
        hitO = -1;
        for (let k = 0; k < spheres.length; k++) {
          const s = spheres[k];
          const lx = ox - s.c[0];
          const ly = oy - s.c[1];
          const lz = oz - s.c[2];
          const b = lx * dx + ly * dy + lz * dz;
          const c = lx * lx + ly * ly + lz * lz - s.r * s.r;
          const disc = b * b - c;
          if (disc > 0) {
            const tt = -b - Math.sqrt(disc);
            if (tt > 1e-3 && tt < hitT) {
              hitT = tt;
              hitO = k;
            }
          }
        }
        if (dy < 0) {
          const tt = (PY - oy) / dy;
          if (tt > 1e-3 && tt < hitT) {
            hitT = tt;
            hitO = -2;
          }
        }
      }
      function trace(ox, oy, oz, dx, dy, dz, L, depth, out) {
        intersect(ox, oy, oz, dx, dy, dz);
        if (hitO === -1) {
          const k = clamp(dy * 0.5 + 0.5, 0, 1);
          out[0] = 0.02 + 0.03 * k;
          out[1] = 0.04 + 0.06 * k;
          out[2] = 0.09 + 0.14 * k;
          return;
        }
        const T = hitT;
        const obj = hitO;
        const px = ox + dx * T;
        const py = oy + dy * T;
        const pz = oz + dz * T;
        let nx = 0;
        let ny = 1;
        let nz = 0;
        let br;
        let bg;
        let bb;
        let refl = 0;
        if (obj === -2) {
          const chk = (Math.floor(px * 2) + Math.floor(pz * 2)) & 1;
          const v = chk ? 0.2 : 0.08;
          br = v * 0.7;
          bg = v * 0.85;
          bb = v;
          refl = 0.12;
        } else {
          const s = spheres[obj];
          if (s.emit) {
            out[0] = 1.4;
            out[1] = 1.0;
            out[2] = 0.6;
            return;
          }
          nx = (px - s.c[0]) / s.r;
          ny = (py - s.c[1]) / s.r;
          nz = (pz - s.c[2]) / s.r;
          [br, bg, bb] = s.col;
          refl = s.refl;
        }
        let lx = L[0] - px;
        let ly = L[1] - py;
        let lz = L[2] - pz;
        const ld = Math.hypot(lx, ly, lz);
        lx /= ld;
        ly /= ld;
        lz /= ld;
        let diff = Math.max(0, nx * lx + ny * ly + nz * lz);
        intersect(px + nx * 1e-3, py + ny * 1e-3, pz + nz * 1e-3, lx, ly, lz);
        if (hitO >= 0 && hitT < ld) diff *= 0.15;
        let hx = lx - dx;
        let hy = ly - dy;
        let hz = lz - dz;
        const hl = Math.hypot(hx, hy, hz);
        hx /= hl;
        hy /= hl;
        hz /= hl;
        const spec = diff > 0 ? Math.pow(Math.max(0, nx * hx + ny * hy + nz * hz), 60) : 0;
        const em = spheres[2].c;
        const ed2 = (px - em[0]) ** 2 + (py - em[1]) ** 2 + (pz - em[2]) ** 2;
        const glow = 0.35 / (1 + 14 * ed2);
        out[0] = br * (0.06 + diff * 0.95) + spec * 0.9 + glow * 1.0;
        out[1] = bg * (0.06 + diff * 0.95) + spec * 0.9 + glow * 0.7;
        out[2] = bb * (0.06 + diff * 0.95) + spec * 0.9 + glow * 0.4;
        if (refl > 0 && depth < 1) {
          const dn = dx * nx + dy * ny + dz * nz;
          const tmp = [0, 0, 0];
          trace(px + nx * 1e-3, py + ny * 1e-3, pz + nz * 1e-3, dx - 2 * dn * nx, dy - 2 * dn * ny, dz - 2 * dn * nz, L, depth + 1, tmp);
          out[0] = lerp(out[0], tmp[0], refl);
          out[1] = lerp(out[1], tmp[1], refl);
          out[2] = lerp(out[2], tmp[2], refl);
        }
      }
      const col = [0, 0, 0];
      return (ctx, w, h, t) => {
        const tw = 176;
        const th = Math.max(40, Math.round((tw * h) / w));
        if (tw !== W || th !== H) {
          W = tw;
          H = th;
          off.width = W;
          off.height = H;
          img = octx.createImageData(W, H);
        }
        const L = [2.2 * Math.cos(t * 0.5), 1.6, 2.8 + 1.8 * Math.sin(t * 0.5)];
        const cyc = (t % 5) / 5;
        const noise = 0.55 * Math.pow(1 - cyc, 3);
        const d = img.data;
        const aspect = W / H;
        let p = 0;
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            let dx = (x / W - 0.5) * aspect * 1.1;
            let dy = (0.5 - y / H) * 1.1 + 0.02;
            let dz = 1;
            const dl = Math.hypot(dx, dy, dz);
            dx /= dl;
            dy /= dl;
            dz /= dl;
            trace(0, 0.05, 0, dx, dy, dz, L, 0, col);
            const nz = noise ? (Math.random() - 0.5) * noise : 0;
            d[p++] = clamp(Math.sqrt(Math.max(0, col[0] + nz)) * 255, 0, 255);
            d[p++] = clamp(Math.sqrt(Math.max(0, col[1] + nz)) * 255, 0, 255);
            d[p++] = clamp(Math.sqrt(Math.max(0, col[2] + nz)) * 255, 0, 255);
            d[p++] = 255;
          }
        }
        octx.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(off, 0, 0, w, h);
        ctx.font = MONO;
        ctx.fillStyle = "rgba(225,233,255,0.7)";
        ctx.fillText(`${2 ** Math.floor(cyc * 11)} spp`, 10, 16);
      };
    },

    // Signals flowing through a neural network (Forge AI)
    network() {
      const layers = [4, 6, 6, 6, 3];
      const names = ["tokens", "attention", "MLP", "attention", "logits"];
      const r = rng(3);
      const weights = layers.slice(0, -1).map((n, l) => Array.from({ length: n * layers[l + 1] }, () => r()));
      return (ctx, w, h, t) => {
        ctx.clearRect(0, 0, w, h);
        const padX = 36;
        const padY = 26;
        const pos = layers.map((n, l) =>
          Array.from({ length: n }, (_, i) => [padX + (l * (w - 2 * padX)) / (layers.length - 1), padY + ((i + 0.5) * (h - 2 * padY - 12)) / n])
        );
        const head = ((t * 0.7) % (layers.length + 0.8)) - 0.4;
        layers.slice(0, -1).forEach((n, l) => {
          pos[l].forEach((a, i) =>
            pos[l + 1].forEach((b, j) => {
              const wgt = weights[l][i * layers[l + 1] + j];
              ctx.strokeStyle = rgba(mixC(CY, VI, l / (layers.length - 1)), 0.04 + wgt * 0.08);
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(a[0], a[1]);
              ctx.lineTo(b[0], b[1]);
              ctx.stroke();
              const f = head - l;
              if (f > 0 && f < 1 && wgt > 0.55) {
                ctx.fillStyle = rgba(mixC(CY, PK, wgt), 0.9);
                ctx.beginPath();
                ctx.arc(lerp(a[0], b[0], f), lerp(a[1], b[1], f), 1.7, 0, Math.PI * 2);
                ctx.fill();
              }
            })
          );
        });
        pos.forEach((col, l) => {
          const act = Math.exp(-((head - l) ** 2) * 6);
          col.forEach(([x, y], i) => {
            const c = mixC(CY, VI, l / (layers.length - 1));
            ctx.fillStyle = rgba(c, 0.35 + 0.65 * act * (0.5 + 0.5 * hash(i + l * 9)));
            ctx.beginPath();
            ctx.arc(x, y, 4 + act * 2, 0, Math.PI * 2);
            ctx.fill();
          });
          ctx.font = MONO;
          ctx.fillStyle = `rgba(225,233,255,${0.35 + act * 0.5})`;
          ctx.textAlign = "center";
          ctx.fillText(names[l], col[0][0], h - 10);
        });
        ctx.textAlign = "left";
      };
    },

    // Conditional flow matching: Gaussian noise → multi-modal compact-binary population
    flow(v) {
      const N = window.innerWidth < 600 ? 480 : 760;
      const comps = [
        { name: "BBH", w: 0.5, m: [0.38, 0.12], c: CY },
        { name: "NSBH", w: 0.25, m: [0.42, -0.62], c: VI },
        { name: "BNS", w: 0.25, m: [-0.6, -0.66], c: AM }
      ];
      let r = rng(99);
      let parts = [];

      function sampleTarget() {
        const u = r();
        if (u < comps[0].w) {
          // BBH: elongated band along the diagonal, below m2 = m1
          const a = gauss(r) * 0.3;
          const b = gauss(r) * 0.09;
          let x = comps[0].m[0] + a * 0.707 - b * 0.707;
          let y = comps[0].m[1] + a * 0.707 + b * 0.707;
          if (y > x) [x, y] = [y, x];
          return [x, y, 0];
        }
        if (u < comps[0].w + comps[1].w) return [comps[1].m[0] + gauss(r) * 0.17, comps[1].m[1] + gauss(r) * 0.07, 1];
        return [comps[2].m[0] + gauss(r) * 0.06, comps[2].m[1] + gauss(r) * 0.06, 2];
      }
      function resample(seed) {
        r = rng(seed);
        const src = Array.from({ length: N }, () => [gauss(r) * 0.42, gauss(r) * 0.42]);
        const tgt = Array.from({ length: N }, sampleTarget);
        // cheap sliced-OT coupling: sort both along a projection, pair by rank → straighter, less-crossing paths
        const proj = (p) => p[0] * 0.8 + p[1] * 0.6;
        src.sort((a, b) => proj(a) - proj(b));
        tgt.sort((a, b) => proj(a) - proj(b));
        parts = src.map((s, i) => ({ x0: s[0], y0: s[1], x1: tgt[i][0], y1: tgt[i][1], c: tgt[i][2] }));
      }
      resample(99);

      const slider = $("#flow-slider");
      const readout = $("#flow-t");
      const play = $(".flow-play");
      let paused = false;
      let manualT = 0;
      let clock = 0;
      let cycle = 0;
      const CYCLE = 8;
      slider.addEventListener("input", () => {
        paused = true;
        manualT = +slider.value;
        v.drawnOnce = false;
        play.textContent = "▶";
        play.setAttribute("aria-label", "Play animation");
      });
      play.addEventListener("click", () => {
        paused = !paused;
        play.textContent = paused ? "▶" : "❚❚";
        play.setAttribute("aria-label", paused ? "Play animation" : "Pause animation");
        if (!paused) clock = manualT * 4 + 0.8;
      });

      const G = 13;
      const field = new Float32Array(G * G * 3);
      v.staticT = 0;

      return (ctx, w, h, t, dt) => {
        let tt;
        let fade = 1;
        if (reduceMotion && !paused) {
          tt = 1;
        } else if (paused) {
          tt = manualT;
        } else {
          clock += dt;
          if (clock > CYCLE) {
            clock -= CYCLE;
            cycle++;
            resample(99 + cycle);
          }
          if (clock < 0.8) tt = 0;
          else if (clock < 4.8) tt = easeInOut((clock - 0.8) / 4);
          else tt = 1;
          if (clock > CYCLE - 0.8) fade = (CYCLE - clock) / 0.8;
          if (clock < 0.4) fade = clock / 0.4;
          slider.value = tt;
        }
        readout.textContent = tt.toFixed(2);

        ctx.clearRect(0, 0, w, h);
        const pad = 30;
        const X = (x) => pad + ((x + 1.25) / 2.5) * (w - pad * 1.5);
        const Y = (y) => h - pad - ((y + 1.25) / 2.5) * (h - pad * 1.5);

        // axes + diagonal
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 1;
        for (let k = -1; k <= 1; k += 0.5) {
          ctx.beginPath();
          ctx.moveTo(X(k), Y(-1.25));
          ctx.lineTo(X(k), Y(1.25));
          ctx.moveTo(X(-1.25), Y(k));
          ctx.lineTo(X(1.25), Y(k));
          ctx.stroke();
        }
        ctx.setLineDash([4, 5]);
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.beginPath();
        ctx.moveTo(X(-1.2), Y(-1.2));
        ctx.lineTo(X(1.2), Y(1.2));
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = MONO;
        ctx.fillStyle = "rgba(225,233,255,0.45)";
        ctx.fillText("log m₁ →", w - 78, h - 10);
        ctx.save();
        ctx.translate(14, pad + 52);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText("log m₂ →", -40, 0);
        ctx.restore();
        ctx.fillText("m₂ = m₁", X(0.82) - 52, Y(0.95));

        // marginal velocity field: average (x1 - x0) of particles in each cell at time t
        field.fill(0);
        const cellOf = (x, y) => {
          const i = Math.floor(((x + 1.25) / 2.5) * G);
          const j = Math.floor(((y + 1.25) / 2.5) * G);
          return i >= 0 && j >= 0 && i < G && j < G ? (j * G + i) * 3 : -1;
        };
        const pos = new Float32Array(parts.length * 2);
        parts.forEach((p, k) => {
          const x = lerp(p.x0, p.x1, tt);
          const y = lerp(p.y0, p.y1, tt);
          pos[k * 2] = x;
          pos[k * 2 + 1] = y;
          const c = cellOf(x, y);
          if (c >= 0) {
            field[c] += p.x1 - p.x0;
            field[c + 1] += p.y1 - p.y0;
            field[c + 2] += 1;
          }
        });
        const arrowA = (tt < 0.97 ? 0.55 : 0.55 * (1 - (tt - 0.97) / 0.03)) * fade;
        if (arrowA > 0.01) {
          for (let j = 0; j < G; j++) {
            for (let i = 0; i < G; i++) {
              const c = (j * G + i) * 3;
              if (field[c + 2] < 2) continue;
              const vx = field[c] / field[c + 2];
              const vy = field[c + 1] / field[c + 2];
              const mag = Math.hypot(vx, vy);
              const cx = -1.25 + ((i + 0.5) / G) * 2.5;
              const cy = -1.25 + ((j + 0.5) / G) * 2.5;
              const len = Math.min(0.13, mag * 0.16);
              const ex = cx + (vx / (mag || 1)) * len;
              const ey = cy + (vy / (mag || 1)) * len;
              ctx.strokeStyle = rgba(mixC(CY, PK, clamp(mag / 1.4, 0, 1)), arrowA);
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.moveTo(X(cx), Y(cy));
              ctx.lineTo(X(ex), Y(ey));
              const ang = Math.atan2(Y(ey) - Y(cy), X(ex) - X(cx));
              ctx.lineTo(X(ex) - Math.cos(ang - 0.5) * 4, Y(ey) - Math.sin(ang - 0.5) * 4);
              ctx.moveTo(X(ex), Y(ey));
              ctx.lineTo(X(ex) - Math.cos(ang + 0.5) * 4, Y(ey) - Math.sin(ang + 0.5) * 4);
              ctx.stroke();
            }
          }
        }

        // trails
        if (tt > 0.01) {
          ctx.lineWidth = 0.6;
          parts.forEach((p, k) => {
            if (k % 3) return;
            ctx.strokeStyle = rgba(comps[p.c].c, 0.07 * fade);
            ctx.beginPath();
            ctx.moveTo(X(p.x0), Y(p.y0));
            ctx.lineTo(X(pos[k * 2]), Y(pos[k * 2 + 1]));
            ctx.stroke();
          });
        }

        // particles
        parts.forEach((p, k) => {
          ctx.fillStyle = rgba(mixC(WH, comps[p.c].c, tt), (0.55 + 0.4 * tt) * fade);
          ctx.fillRect(X(pos[k * 2]) - 1.1, Y(pos[k * 2 + 1]) - 1.1, 2.2, 2.2);
        });

        // population labels
        const la = clamp((tt - 0.8) / 0.2, 0, 1) * fade;
        if (la > 0) {
          ctx.font = "600 12px 'Space Grotesk', sans-serif";
          comps.forEach((c) => {
            ctx.fillStyle = rgba(c.c, la);
            const off = c.name === "BBH" ? [-0.42, 0.42] : c.name === "NSBH" ? [0.12, -0.22] : [-0.1, 0.2];
            ctx.fillText(c.name, X(c.m[0] + off[0]), Y(c.m[1] + off[1]));
          });
        }
      };
    },

    // Rotating dotted globe with arcs from San Diego to every venue
    globe(v) {
      const D = Math.PI / 180;
      const HOME = { name: "San Diego", lat: 32.72, lon: -117.16 };
      const map = new Map();
      v.opts.pubs.forEach((p) => {
        if (!p.coords) return;
        if (!map.has(p.location)) map.set(p.location, { name: p.location, lat: p.coords[0], lon: p.coords[1], n: 0 });
        map.get(p.location).n++;
      });
      const pins = [...map.values()];
      const dots = [];
      const ND = 1400;
      for (let i = 0; i < ND; i++) {
        const y = 1 - (2 * (i + 0.5)) / ND;
        dots.push([Math.asin(y), (i * 2.399963) % (Math.PI * 2)]);
      }
      let lon0 = -95 * D;
      let lat0 = 22 * D;
      let tgtLon = null;
      let tgtLat = 22 * D;
      let focus = null;
      let dragging = false;
      let lastX = 0;
      let lastY = 0;

      const canvas = v.canvas;
      canvas.addEventListener("pointerdown", (e) => {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        canvas.setPointerCapture(e.pointerId);
      });
      canvas.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        lon0 -= (e.clientX - lastX) * 0.008;
        lat0 = clamp(lat0 + (e.clientY - lastY) * 0.006, -60 * D, 70 * D);
        lastX = e.clientX;
        lastY = e.clientY;
        tgtLon = null;
      });
      const end = () => (dragging = false);
      canvas.addEventListener("pointerup", end);
      canvas.addEventListener("pointercancel", end);

      v.api.focus = (name) => {
        focus = pins.find((p) => p.name === name) || null;
        v.drawnOnce = false;
        if (reduceMotion && focus) {
          lon0 = focus.lon * D;
          lat0 = clamp(focus.lat * D * 0.7, -45 * D, 55 * D);
        }
        if (focus) {
          tgtLon = focus.lon * D;
          tgtLat = clamp(focus.lat * D * 0.7, -45 * D, 55 * D);
        } else {
          tgtLon = null;
        }
      };

      const vec = (lat, lon) => [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)];
      const toLL = (p) => [Math.asin(clamp(p[2], -1, 1)), Math.atan2(p[1], p[0])];
      const project = (lat, lon) => {
        const cl = Math.cos(lat);
        const dl = lon - lon0;
        const x = cl * Math.sin(dl);
        const y = Math.cos(lat0) * Math.sin(lat) - Math.sin(lat0) * cl * Math.cos(dl);
        const z = Math.sin(lat0) * Math.sin(lat) + Math.cos(lat0) * cl * Math.cos(dl);
        return [x, -y, z];
      };
      const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

      return (ctx, w, h, t, dt) => {
        if (!dragging) {
          if (tgtLon !== null) {
            lon0 += wrap(tgtLon - lon0) * 0.07;
            lat0 += (tgtLat - lat0) * 0.07;
          } else if (!reduceMotion) {
            lon0 += dt * 0.12;
          }
        }
        ctx.clearRect(0, 0, w, h);
        const R = Math.min(w, h) * 0.4;
        const cx = w / 2;
        const cy = h / 2;

        const atm = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R * 1.3);
        atm.addColorStop(0, "rgba(91,188,255,0.22)");
        atm.addColorStop(1, "rgba(91,188,255,0)");
        ctx.fillStyle = atm;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 1.3, 0, Math.PI * 2);
        ctx.fill();
        const body = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
        body.addColorStop(0, "#10244a");
        body.addColorStop(1, "#050b1c");
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.fill();

        dots.forEach(([la, lo]) => {
          const [x, y, z] = project(la, lo);
          if (z <= 0) return;
          ctx.fillStyle = `rgba(150,200,255,${0.08 + 0.32 * z})`;
          ctx.fillRect(cx + x * R - 0.8, cy + y * R - 0.8, 1.6, 1.6);
        });

        // graticule
        ctx.lineWidth = 0.6;
        ctx.strokeStyle = "rgba(91,188,255,0.12)";
        const line = (pts) => {
          let open = false;
          ctx.beginPath();
          pts.forEach(([la, lo]) => {
            const [x, y, z] = project(la, lo);
            if (z > 0) {
              open ? ctx.lineTo(cx + x * R, cy + y * R) : ctx.moveTo(cx + x * R, cy + y * R);
              open = true;
            } else open = false;
          });
          ctx.stroke();
        };
        for (let la = -60; la <= 60; la += 30) line(Array.from({ length: 73 }, (_, k) => [la * D, (k * 5 - 180) * D]));
        for (let lo = -180; lo < 180; lo += 30) line(Array.from({ length: 37 }, (_, k) => [(k * 5 - 90) * D, lo * D]));

        // arcs
        const H0 = vec(HOME.lat * D, HOME.lon * D);
        pins.forEach((p) => {
          if (p.name.startsWith("San Diego")) return;
          const B = vec(p.lat * D, p.lon * D);
          const om = Math.acos(clamp(H0[0] * B[0] + H0[1] * B[1] + H0[2] * B[2], -1, 1));
          if (om < 1e-3) return;
          const isF = focus === p;
          ctx.setLineDash([3, 5]);
          ctx.lineDashOffset = -t * 18;
          ctx.strokeStyle = isF ? rgba(AM, 0.95) : rgba(CY, 0.5);
          ctx.lineWidth = isF ? 1.8 : 1;
          ctx.beginPath();
          let open = false;
          for (let k = 0; k <= 48; k++) {
            const s = k / 48;
            const a = Math.sin((1 - s) * om) / Math.sin(om);
            const b = Math.sin(s * om) / Math.sin(om);
            const pv = [a * H0[0] + b * B[0], a * H0[1] + b * B[1], a * H0[2] + b * B[2]];
            const [la, lo] = toLL(pv);
            const lift = 1 + 0.22 * Math.sin(Math.PI * s) * Math.min(1, om / 1.2);
            const [x, y, z] = project(la, lo);
            const X = cx + x * R * lift;
            const Y = cy + y * R * lift;
            const vis = z > 0 || Math.hypot(x * lift, y * lift) > 1;
            if (vis) {
              open ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
              open = true;
            } else open = false;
          }
          ctx.stroke();
          ctx.setLineDash([]);
        });

        // pins
        ctx.font = MONO;
        const labeled = [];
        [{ ...HOME, n: 0, home: true }, ...pins].forEach((p) => {
          const [x, y, z] = project(p.lat * D, p.lon * D);
          if (z <= 0) return;
          const X = cx + x * R;
          const Y = cy + y * R;
          const isF = focus === p || (focus && focus.name === p.name);
          const c = p.home ? WH : isF ? AM : CY;
          const rad = p.home ? 3.5 : 2.5 + p.n * 0.8;
          const pr = (t * 0.8 + p.lat) % 1;
          ctx.strokeStyle = rgba(c, (1 - pr) * 0.6);
          ctx.beginPath();
          ctx.arc(X, Y, rad + pr * 10, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = rgba(c, 1);
          ctx.beginPath();
          ctx.arc(X, Y, rad, 0, Math.PI * 2);
          ctx.fill();
          const crowded = labeled.some(([lx, ly]) => Math.abs(lx - X) < 70 && Math.abs(ly - Y) < 13);
          if (p.home || isF || (z > 0.35 && !crowded)) {
            labeled.push([X, Y]);
            ctx.fillStyle = isF ? "rgba(255,255,255,0.95)" : `rgba(225,233,255,${0.25 + z * 0.4})`;
            ctx.fillText(p.home ? "San Diego · home" : p.name + (p.n > 1 ? ` ×${p.n}` : ""), X + rad + 5, Y + 3);
          }
        });
      };
    }
  };

  // ---------------------------------------------------------------------------
  // Hero: Three.js spacetime sheet
  // ---------------------------------------------------------------------------

  function initSpacetime() {
    const canvas = $("#spacetime");
    const hero = $(".hero");
    const stateEl = $(".hero-state");
    if (!canvas) return;
    const T = window.THREE;
    if (!T) {
      canvas.classList.add("is-fallback");
      return;
    }
    let renderer;
    try {
      renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch (e) {
      canvas.classList.add("is-fallback");
      return;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(46, 1, 0.1, 200);
    const group = new T.Group();
    scene.add(group);

    const small = window.innerWidth < 760;
    const SIZE = 38;
    const HALF = SIZE / 2;
    const N = small ? 130 : 200;

    const pos = new Float32Array(N * N * 3);
    let k = 0;
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        pos[k++] = (j / (N - 1) - 0.5) * SIZE;
        pos[k++] = 0;
        pos[k++] = (i / (N - 1) - 0.5) * SIZE;
      }
    }
    const pGeo = new T.BufferGeometry();
    pGeo.setAttribute("position", new T.BufferAttribute(pos, 3));

    const STEP = Math.max(4, Math.round(N / 26));
    const lp = [];
    for (let i = 0; i < N; i += STEP) {
      const a = (i / (N - 1) - 0.5) * SIZE;
      for (let j = 0; j < N - 1; j++) {
        const b0 = (j / (N - 1) - 0.5) * SIZE;
        const b1 = ((j + 1) / (N - 1) - 0.5) * SIZE;
        lp.push(b0, 0, a, b1, 0, a); // along x
        lp.push(a, 0, b0, a, 0, b1); // along z
      }
    }
    const lGeo = new T.BufferGeometry();
    lGeo.setAttribute("position", new T.Float32BufferAttribute(lp, 3));

    const uniforms = {
      uPhase: { value: 0 },
      uSep: { value: 2.4 },
      uAmp: { value: 0.16 },
      uK: { value: 0.8 },
      uMass: { value: 0.55 },
      uRing: { value: -1 },
      uRingAmp: { value: 0 },
      uMouse: { value: new T.Vector2(999, 999) },
      uMouseStr: { value: 0 },
      uHalf: { value: HALF },
      uSize: { value: 2.4 * dpr },
      uLine: { value: 0 }
    };

    const vertexShader = `
      uniform float uPhase, uSep, uAmp, uK, uMass, uRing, uRingAmp, uHalf, uSize, uMouseStr;
      uniform vec2 uMouse;
      varying float vH;
      varying float vFade;
      varying float vGlow;
      void main() {
        vec3 p = position;
        vec2 q = p.xz;
        vec2 b = vec2(cos(uPhase), sin(uPhase)) * uSep;
        float d1 = length(q - b);
        float d2 = length(q + b);
        float well = -uMass * (1.0 / sqrt(d1 * d1 + 0.35) + 1.0 / sqrt(d2 * d2 + 0.35));
        float r = length(q);
        float ang = atan(q.y, q.x);
        float env = smoothstep(0.4, 2.4, r) / sqrt(r + 1.0);
        float wave = uAmp * env * cos(2.0 * ang - 2.0 * uPhase + uK * r) * 2.2;
        float ring = 0.0;
        if (uRing >= 0.0) {
          float dd = r - uRing * 3.4;
          ring = uRingAmp * exp(-dd * dd * 0.5) * sin(dd * 2.6) * 2.4 / sqrt(r + 1.0);
        }
        vec2 dm = q - uMouse;
        float dent = -1.2 * uMouseStr * exp(-dot(dm, dm) * 0.4);
        p.y = well + wave + ring + dent;
        vH = wave + ring + dent * 0.25;
        vGlow = clamp(-well * 0.6, 0.0, 1.5);
        vFade = 1.0 - smoothstep(uHalf * 0.4, uHalf * 0.97, r);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uSize * (9.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`;
    const fragmentShader = `
      uniform float uLine;
      varying float vH;
      varying float vFade;
      varying float vGlow;
      void main() {
        float a = 1.0;
        if (uLine < 0.5) {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          a = 1.0 - smoothstep(0.08, 0.5, d);
        }
        vec3 base = vec3(0.22, 0.5, 1.0);
        vec3 crest = vec3(0.85, 0.97, 1.0);
        vec3 trough = vec3(0.64, 0.45, 1.0);
        float h = clamp(vH * 1.6, -1.0, 1.0);
        vec3 col = h > 0.0 ? mix(base, crest, h) : mix(base, trough, -h);
        col += vec3(0.45, 0.3, 1.0) * vGlow * 0.3;
        float alpha = a * vFade * (uLine > 0.5 ? 0.2 + abs(h) * 0.35 : 0.6 + abs(h) * 0.5);
        gl_FragColor = vec4(col, alpha);
      }`;

    const common = { vertexShader, fragmentShader, transparent: true, depthWrite: false, blending: T.AdditiveBlending };
    const pMat = new T.ShaderMaterial({ uniforms, ...common });
    const lMat = new T.ShaderMaterial({ uniforms: { ...uniforms, uLine: { value: 1 } }, ...common });
    group.add(new T.LineSegments(lGeo, lMat));
    group.add(new T.Points(pGeo, pMat));

    // Black holes: dark core + photon-ring glow sprite
    const tc = document.createElement("canvas");
    tc.width = tc.height = 128;
    const g = tc.getContext("2d");
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, "rgba(0,0,0,1)");
    grd.addColorStop(0.27, "rgba(0,0,0,1)");
    grd.addColorStop(0.33, "rgba(220,240,255,1)");
    grd.addColorStop(0.45, "rgba(120,190,255,0.55)");
    grd.addColorStop(1, "rgba(91,188,255,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    const tex = new T.CanvasTexture(tc);
    const mkBH = () => {
      const s = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
      s.renderOrder = 5;
      group.add(s);
      return s;
    };
    const bh1 = mkBH();
    const bh2 = mkBH();

    const SEP0 = 2.4;
    const sim = { state: "inspiral", phase: 0, sep: SEP0, ringT: 0, rewT: 0 };
    const setState = (s) => {
      if (stateEl && stateEl.textContent !== s) stateEl.textContent = s;
    };

    function step(dt) {
      const U = uniforms;
      if (sim.state === "inspiral") {
        const ratio = SEP0 / sim.sep;
        const omega = Math.min(11, 0.85 * Math.pow(ratio, 1.5));
        sim.phase += omega * dt;
        sim.sep -= dt * 0.04 * Math.pow(ratio, 3);
        U.uAmp.value = Math.min(0.55, 0.16 * Math.pow(ratio, 0.9));
        U.uK.value = 0.55 + omega * 0.22;
        setState(ratio > 3 ? "chirp" : "inspiral");
        if (sim.sep < 0.32) {
          sim.state = "ringdown";
          sim.ringT = 0;
        }
      } else if (sim.state === "ringdown") {
        sim.ringT += dt;
        sim.sep = Math.max(0, sim.sep - dt * 2);
        sim.phase += 11 * dt;
        U.uAmp.value *= Math.exp(-dt * 2);
        U.uRing.value = sim.ringT;
        U.uRingAmp.value = 0.9 * Math.exp(-sim.ringT * 0.3);
        setState(sim.ringT < 0.6 ? "merger" : "ringdown");
        if (sim.ringT > 7) {
          sim.state = "rewind";
          sim.rewT = 0;
        }
      } else {
        sim.rewT += dt;
        const f = easeInOut(Math.min(1, sim.rewT / 2.5));
        sim.sep = SEP0 * f;
        sim.phase += 0.85 * dt;
        U.uAmp.value = 0.16 * f;
        U.uK.value = 0.55 + 0.85 * 0.22;
        U.uRingAmp.value *= Math.exp(-dt * 2);
        setState("new binary forming");
        if (f >= 1) {
          sim.state = "inspiral";
          U.uRing.value = -1;
        }
      }
      U.uPhase.value = sim.phase;
      U.uSep.value = sim.sep;

      const m = U.uMass.value;
      const depth = -m * (1 / Math.sqrt(0.35) + 1 / Math.sqrt(4 * sim.sep * sim.sep + 0.35));
      const bx = Math.cos(sim.phase) * sim.sep;
      const bz = Math.sin(sim.phase) * sim.sep;
      const merged = sim.sep < 0.33;
      const sc = merged ? 1.5 : 1.05;
      bh1.position.set(bx, depth + 0.15, bz);
      bh2.position.set(-bx, depth + 0.15, -bz);
      bh1.scale.set(sc, sc, sc);
      bh2.scale.set(sc, sc, sc);
      bh2.visible = !merged;
    }

    // Layout
    let offsetX = 0;
    const resize = () => {
      const w = hero.clientWidth;
      const h = hero.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      offsetX = w > 900 ? 4.6 : w > 600 ? 2.5 : 0;
      group.position.x = offsetX;
    };
    resize();
    window.addEventListener("resize", resize);

    // Mouse → dent in spacetime + camera parallax
    const ray = new T.Raycaster();
    const plane = new T.Plane(new T.Vector3(0, 1, 0), 0.6);
    const ndc = new T.Vector2();
    const hit = new T.Vector3();
    let mx = 0;
    let my = 0;
    let hovering = false;
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width) * 2 - 1;
      my = -((e.clientY - r.top) / r.height) * 2 + 1;
      hovering = true;
    });
    hero.addEventListener("pointerleave", () => (hovering = false));

    let running = true;
    new IntersectionObserver(([e]) => (running = e.isIntersecting)).observe(hero);

    let last = performance.now();
    let camX = 0;
    let camY = 0;
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (running) {
        step(dt);
        camX = lerp(camX, mx * 1.2, 0.04);
        camY = lerp(camY, my * 0.6, 0.04);
        camera.position.set(camX, 6.6 - camY, 13);
        camera.lookAt(offsetX * 0.35, -1.2, 0);
        group.rotation.y = Math.sin(now * 0.00004) * 0.25;
        group.updateMatrixWorld();

        if (hovering && finePointer) {
          ndc.set(mx, my);
          ray.setFromCamera(ndc, camera);
          if (ray.ray.intersectPlane(plane, hit)) {
            group.worldToLocal(hit);
            uniforms.uMouse.value.set(hit.x, hit.z);
          }
        }
        uniforms.uMouseStr.value = lerp(uniforms.uMouseStr.value, hovering && finePointer ? 1 : 0, 0.06);
        renderer.render(scene, camera);
      }
      requestAnimationFrame(frame);
    };

    if (reduceMotion) {
      sim.sep = 1.5;
      sim.phase = 0.6;
      step(0);
      camera.position.set(0, 6.6, 13);
      camera.lookAt(offsetX * 0.35, -1.2, 0);
      renderer.render(scene, camera);
      window.addEventListener("resize", () => renderer.render(scene, camera));
    } else {
      requestAnimationFrame(frame);
    }
  }

  // ---------------------------------------------------------------------------
  // Background starfield (subtle; parallax on scroll)
  // ---------------------------------------------------------------------------

  function initStarfield() {
    const canvas = $("#starfield");
    const ctx = canvas.getContext("2d");
    let w = 0;
    let h = 0;
    let stars = [];
    let shooting = null;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round((w * h) / 6500);
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: 0.2 + Math.random() * 0.8,
        r: 0.3 + Math.random() * 1.1,
        ph: Math.random() * 6.28,
        sp: 0.5 + Math.random() * 1.5
      }));
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (ms) => {
      const t = ms / 1000;
      const sy = window.scrollY;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const y = (((s.y - sy * s.z * 0.12) % h) + h) % h;
        const tw = reduceMotion ? 0.7 : 0.55 + 0.45 * Math.sin(t * s.sp + s.ph);
        ctx.globalAlpha = tw * (0.25 + s.z * 0.6);
        ctx.fillStyle = s.z > 0.85 ? "#cfe6ff" : "#ffffff";
        ctx.beginPath();
        ctx.arc(s.x, y, s.r * s.z + 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (!reduceMotion) {
        if (!shooting && Math.random() < 0.003) {
          shooting = { x: Math.random() * w * 0.7, y: Math.random() * h * 0.4, vx: 9 + Math.random() * 5, vy: 3 + Math.random() * 2, life: 1 };
        }
        if (shooting) {
          const s = shooting;
          const g = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 10, s.y - s.vy * 10);
          g.addColorStop(0, `rgba(255,255,255,${0.8 * s.life})`);
          g.addColorStop(1, "rgba(255,255,255,0)");
          ctx.strokeStyle = g;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x - s.vx * 10, s.y - s.vy * 10);
          ctx.stroke();
          s.x += s.vx;
          s.y += s.vy;
          s.life -= 0.02;
          if (s.life <= 0) shooting = null;
        }
        requestAnimationFrame(draw);
      }
    };
    requestAnimationFrame(draw);
    if (reduceMotion) window.addEventListener("scroll", () => requestAnimationFrame(draw), { passive: true });
  }

  // ---------------------------------------------------------------------------
  // Interactions
  // ---------------------------------------------------------------------------

  function scramble(el) {
    const final = el.textContent;
    const pool = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>·";
    let f = 0;
    const total = 16;
    const id = setInterval(() => {
      f++;
      el.textContent = [...final]
        .map((c, i) => (c === " " || i < (f / total) * final.length ? c : pool[(Math.random() * pool.length) | 0]))
        .join("");
      if (f >= total) {
        clearInterval(id);
        el.textContent = final;
      }
    }, 32);
  }

  function initReveals() {
    $$(".section-header").forEach((el) => el.classList.add("reveal"));
    if (reduceMotion || !("IntersectionObserver" in window)) {
      $$(".reveal").forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          const lab = e.target.classList.contains("section-header") && $(".section-label", e.target);
          if (lab) scramble(lab);
          io.unobserve(e.target);
        }),
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    $$(".reveal").forEach((el) => io.observe(el));
  }

  function initScroll() {
    const bar = $(".scroll-progress");
    const nav = $(".navbar");
    const tl = $("#experience-list");
    const items = tl ? $$(".exp-item", tl) : [];
    const links = $$(".nav-links a[href^='#']");
    const sections = links.map((a) => $(a.getAttribute("href"))).filter(Boolean);
    let ticking = false;

    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const H = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${H > 0 ? y / H : 0})`;
      nav.classList.toggle("is-scrolled", y > 40);

      const mark = window.innerHeight * 0.6;
      if (tl) {
        const r = tl.getBoundingClientRect();
        tl.style.setProperty("--progress", clamp((mark - r.top) / r.height, 0, 1).toFixed(4));
        items.forEach((it) => it.classList.toggle("is-lit", it.getBoundingClientRect().top + 40 < mark));
      }

      let current = null;
      sections.forEach((s) => {
        if (s.getBoundingClientRect().top < window.innerHeight * 0.35) current = s.id;
      });
      links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${current}`));
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    window.addEventListener("resize", update);
    update();
  }

  function initNav() {
    const btn = $(".nav-toggle");
    const links = $(".nav-links");
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", open);
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      links.classList.toggle("is-open", open);
    });
    $$("a", links).forEach((a) =>
      a.addEventListener("click", () => {
        btn.setAttribute("aria-expanded", "false");
        links.classList.remove("is-open");
      })
    );
  }

  function initPointerFX() {
    if (!finePointer || reduceMotion) return;

    // Cursor glow on cards
    document.addEventListener(
      "pointermove",
      (e) => {
        const card = e.target.closest && e.target.closest(".glass-card");
        if (!card) return;
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      },
      { passive: true }
    );
    $$(".glass-card").forEach((c) => c.classList.add("glow-track"));

    // 3-D tilt on project cards
    $$(".project-card").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${-y * 6}deg) rotateY(${x * 8}deg) translateY(-4px)`;
      });
      card.addEventListener("pointerleave", () => (card.style.transform = ""));
    });

    // Magnetic buttons
    $$(".primary-btn, .secondary-btn").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.12}px, ${(e.clientY - r.top - r.height / 2) * 0.18}px)`;
      });
      b.addEventListener("pointerleave", () => (b.style.transform = ""));
    });

    // Lagged cursor dot
    const dot = $(".cursor-dot");
    let tx = innerWidth / 2;
    let ty = innerHeight / 2;
    let cx = tx;
    let cy = ty;
    let shown = false;
    document.addEventListener("pointermove", (e) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!shown) {
        shown = true;
        cx = tx;
        cy = ty;
        dot.classList.add("is-visible");
      }
    });
    document.addEventListener("mouseleave", () => {
      shown = false;
      dot.classList.remove("is-visible");
    });
    const hoverSel = "a, button, .project-card, .chip-link, .filter-btn, input, #globe-canvas";
    document.addEventListener("mouseover", (e) => e.target.closest && e.target.closest(hoverSel) && dot.classList.add("is-hovering"));
    document.addEventListener("mouseout", (e) => e.target.closest && e.target.closest(hoverSel) && dot.classList.remove("is-hovering"));
    const loop = () => {
      cx = lerp(cx, tx, 0.18);
      cy = lerp(cy, ty, 0.18);
      dot.style.transform = `translate(${cx}px, ${cy}px)${dot.classList.contains("is-hovering") ? " scale(2.4)" : ""}`;
      requestAnimationFrame(loop);
    };
    dot.style.left = "0px";
    dot.style.top = "0px";
    loop();
  }

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------

  if (!IS_POST) {
    renderHero();
    renderAbout();
    renderEducation();
    renderSpotlight();
    renderExperience();
    renderProjects();
    renderTalks();
    renderLeadership();
    renderHonors();
    renderSkills();
    renderMedia();
    renderHobbies();
    renderContact();
    renderEditHint();
    guardImages();
    startRotator();
    animateCounters();
  }

  initReveals();
  initScroll();
  initNav();
  initPointerFX();
  initStarfield();

  $$("canvas[data-viz]").forEach((c) => mountViz(c, c.dataset.viz));
  if (!IS_POST) {
    initSpacetime();
    mountViz($("#flow-canvas"), "flow");
    globeInst = mountViz($("#globe-canvas"), "globe", { pubs: S.publications });
  }
  requestAnimationFrame(vizLoop);
})();
