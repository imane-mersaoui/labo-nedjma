/* Labo Nedjma — interactions */
document.addEventListener("DOMContentLoaded", () => {

  /* ---------- Header : ombre au scroll ---------- */
  const header = document.querySelector("[data-header]");
  const onScroll = () => header && header.classList.toggle("is-scrolled", window.scrollY > 10);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mega menu "Nos marques" ---------- */
  document.querySelectorAll(".has-mega").forEach(item => {
    const btn = item.querySelector(".nav-link");
    let t;
    const open = () => { clearTimeout(t); item.classList.add("is-open"); btn.setAttribute("aria-expanded", "true"); };
    const close = () => { t = setTimeout(() => { item.classList.remove("is-open"); btn.setAttribute("aria-expanded", "false"); }, 120); };
    item.addEventListener("mouseenter", open);
    item.addEventListener("mouseleave", close);
    btn.addEventListener("click", () => item.classList.contains("is-open") ? close() : open());
    document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  });

  /* ---------- Recherche ---------- */
  const search = document.querySelector("[data-search]");
  document.querySelector("[data-search-open]")?.addEventListener("click", () => {
    search.classList.toggle("is-open");
    if (search.classList.contains("is-open")) search.querySelector("input").focus();
  });
  document.querySelector("[data-search-close]")?.addEventListener("click", () => search.classList.remove("is-open"));

  /* ---------- Menu mobile ---------- */
  const drawer = document.querySelector("[data-drawer]");
  const burger = document.querySelector("[data-burger]");
  const setDrawer = state => {
    if (!drawer) return;
    drawer.classList.toggle("is-open", state);
    drawer.setAttribute("aria-hidden", state ? "false" : "true");
    burger?.setAttribute("aria-expanded", state ? "true" : "false");
    document.body.style.overflow = state ? "hidden" : "";
  };
  burger?.addEventListener("click", () => setDrawer(true));
  document.querySelector("[data-drawer-close]")?.addEventListener("click", () => setDrawer(false));
  drawer?.addEventListener("click", e => { if (e.target === drawer) setDrawer(false); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") setDrawer(false); });

  /* ---------- Slider du hero ---------- */
  document.querySelectorAll("[data-slider]").forEach(hero => {
    const slides = hero.querySelectorAll(".hero-slide");
    const tabs = hero.querySelectorAll(".hero-tab");
    const cur = hero.querySelector(".hc-current");
    if (slides.length < 2) return;
    let current = 0;
    const pad = n => String(n + 1).padStart(2, "0");
    const go = i => {
      current = (i + slides.length) % slides.length;
      slides.forEach((s, k) => {
        s.classList.toggle("is-active", k === current);
        s.setAttribute("aria-hidden", k === current ? "false" : "true");
        const img = s.querySelector("img[loading='lazy']");
        if (k === current && img) img.loading = "eager";
      });
      tabs.forEach((t, k) => {
        t.classList.remove("is-active");
        if (k === current) { void t.offsetWidth; t.classList.add("is-active"); }
      });
      hero.dataset.theme = slides[current].dataset.theme || "light";
      if (cur) cur.textContent = pad(current);
    };
    // la barre de progression pilote l'autoplay
    tabs.forEach((t, k) => {
      t.addEventListener("click", () => go(k));
      t.querySelector(".ht-bar i")?.addEventListener("animationend", () => { if (k === current) go(current + 1); });
    });
    hero.addEventListener("mouseenter", () => hero.classList.add("is-paused"));
    hero.addEventListener("mouseleave", () => hero.classList.remove("is-paused"));
    hero.addEventListener("keydown", e => {
      if (e.key === "ArrowRight") go(current + 1);
      if (e.key === "ArrowLeft") go(current - 1);
    });
    let x0 = null;
    hero.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener("touchend", e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) go(current + (dx < 0 ? 1 : -1));
      x0 = null;
    });
    // précharge les images suivantes
    window.addEventListener("load", () => hero.querySelectorAll("img[loading='lazy']").forEach(img => img.loading = "eager"));
    go(0);
  });

  /* ---------- Apparition au scroll ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add("is-visible"));
  }

  /* ---------- Compteurs chiffres clés ---------- */
  const fmt = n => n.toLocaleString("fr-FR").replace(/ | /g, " ");
  const counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const co = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target, end = +el.dataset.count, suf = el.dataset.suffix || "";
        const t0 = performance.now(), dur = 1400;
        const step = t => {
          const p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
          el.textContent = fmt(Math.round(end * e)) + suf;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        co.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(c => co.observe(c));
  }

  /* ---------- Newsletter ---------- */
  document.querySelectorAll("form[data-news]").forEach(f => {
    f.addEventListener("submit", e => {
      e.preventDefault();
      const input = f.querySelector("input[type='email']");
      const ok = input && input.value.includes("@");
      f.innerHTML = ok
        ? "<p style='color:#fff;margin:0'>Merci ! Vous êtes inscrit(e) à nos nouveautés.</p>"
        : "<p style='color:#fff;margin:0'>Adresse e-mail invalide.</p>";
    });
  });
});

/* ===== Pages internes ===== */
document.addEventListener("DOMContentLoaded", () => {

  /* Filtres produits (avec ?brand= / ?cat= dans l'URL) */
  const grid = document.querySelector("[data-products]");
  if (grid) {
    const cards = [...grid.querySelectorAll(".p-card")];
    const count = document.querySelector("[data-count-result]");
    const empty = document.querySelector(".empty-state");
    const state = { brand: "all", cat: "all" };
    const params = new URLSearchParams(location.search);
    if (params.get("brand")) state.brand = params.get("brand");
    if (params.get("cat")) state.cat = params.get("cat");
    const apply = () => {
      let n = 0;
      cards.forEach(c => {
        const ok = (state.brand === "all" || c.dataset.brand === state.brand) &&
                   (state.cat === "all" || c.dataset.cat.split(" ").includes(state.cat));
        c.classList.toggle("is-hidden", !ok); if (ok) n++;
      });
      document.querySelectorAll("[data-filter]").forEach(ch => {
        ch.classList.toggle("is-active", state[ch.dataset.filter] === ch.dataset.value);
      });
      if (count) count.textContent = n + (n > 1 ? " produits" : " produit");
      if (empty) empty.style.display = n ? "none" : "block";
    };
    document.querySelectorAll("[data-filter]").forEach(ch => ch.addEventListener("click", () => {
      state[ch.dataset.filter] = ch.dataset.value; apply();
      const p = new URLSearchParams();
      if (state.brand !== "all") p.set("brand", state.brand);
      if (state.cat !== "all") p.set("cat", state.cat);
      history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : ""));
    }));
    apply();
  }

  /* Onglets (contact) — ouvre l'onglet pro si #b2b */
  document.querySelectorAll("[data-tabs]").forEach(group => {
    const tabs = group.querySelectorAll(".tab");
    const panes = group.querySelectorAll(".pane");
    const open = id => {
      tabs.forEach(t => t.classList.toggle("is-active", t.dataset.tab === id));
      panes.forEach(p => p.classList.toggle("is-active", p.dataset.pane === id));
    };
    tabs.forEach(t => t.addEventListener("click", () => open(t.dataset.tab)));
    if (location.hash === "#b2b") open("pro");
  });

  /* Formulaires (démo, pas d'envoi réel) */
  document.querySelectorAll("form[data-demo]").forEach(f => {
    f.addEventListener("submit", e => {
      e.preventDefault();
      f.innerHTML = "<div class='form-ok'><strong>Merci, votre message a bien été envoyé.</strong><p style='margin:6px 0 0'>Notre équipe vous répondra sous 48 h ouvrées.</p></div>";
    });
  });
});

/* ===== Frise histoire ===== */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-story]").forEach(story => {
    const track = story.querySelector("[data-story-track]");
    const cards = [...track.children];
    const bar = story.querySelector("[data-story-bar]");
    const cur = story.querySelector("[data-story-cur]");
    const step = () => cards[0].getBoundingClientRect().width + 22;
    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      const p = max > 0 ? track.scrollLeft / max : 1;
      if (bar) bar.style.width = Math.max(8, p * 100) + "%";
      const i = Math.min(cards.length - 1, Math.round(track.scrollLeft / step()));
      if (cur) cur.textContent = String(i + 1).padStart(2, "0");
    };
    story.querySelector("[data-story-prev]")?.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
    story.querySelector("[data-story-next]")?.addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));
    track.addEventListener("scroll", update, { passive: true });
    track.addEventListener("keydown", e => {
      if (e.key === "ArrowRight") track.scrollBy({ left: step() });
      if (e.key === "ArrowLeft") track.scrollBy({ left: -step() });
    });
    // glisser à la souris
    let down = false, x0 = 0, s0 = 0;
    track.addEventListener("mousedown", e => { down = true; x0 = e.pageX; s0 = track.scrollLeft; track.classList.add("is-drag"); });
    window.addEventListener("mouseup", () => { if (!down) return; down = false; track.classList.remove("is-drag"); });
    window.addEventListener("mousemove", e => { if (down) track.scrollLeft = s0 - (e.pageX - x0); });
    update();
  });
});

/* ===== Animations modernes (style Webflow) ===== */
document.addEventListener("DOMContentLoaded", () => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Barre de progression de lecture */
  const bar = document.createElement("div"); bar.className = "scroll-progress"; document.body.appendChild(bar);
  const setBar = () => { const h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`; };
  addEventListener("scroll", setBar, { passive: true }); setBar();
  if (reduce) return;

  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { threshold: .15, rootMargin: "0px 0px -60px 0px" });

  /* Titres découpés en mots */
  document.querySelectorAll(".section-head h2, .page-hero h1, .brand-hero h1, .split-copy h2, .story h2, .export h2, .quality-copy h2, .about-copy h2, .cta-b2b h2").forEach(h => {
    let i = 0;
    const wrap = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span"); w.className = "w";
            const inner = document.createElement("span"); inner.textContent = part; inner.style.setProperty("--i", i++);
            w.appendChild(inner); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains("w")) {
          const w = document.createElement("span"); w.className = "w";
          const inner = document.createElement("span"); inner.style.setProperty("--i", i++);
          n.replaceWith(w); inner.appendChild(n); w.appendChild(inner);
        }
      });
    };
    wrap(h); h.classList.add("splitw"); io.observe(h);
  });

  /* Images : rideau */
  const imgs = [...document.querySelectorAll(".split-media, .br-media, .univ, .post-img, .gallery img, .quality-media > img, .about-collage img, .bc-media, .st-media, .cat")];
  imgs.forEach(el => el.classList.add("img-reveal"));
  /* (un élément entièrement masqué par clip-path n'est pas vu par IntersectionObserver : on teste sa position) */
  const checkImgs = () => imgs.forEach(el => {
    if (el.classList.contains("is-in")) return;
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight * .9 && r.bottom > 0 && r.left < innerWidth && r.right > 0) el.classList.add("is-in", "is-visible");
  });
  addEventListener("scroll", checkImgs, { passive: true }); addEventListener("resize", checkImgs);
  document.querySelectorAll("[data-story-track]").forEach(t => t.addEventListener("scroll", checkImgs, { passive: true }));
  checkImgs(); setTimeout(checkImgs, 400);

  /* Décalage progressif des cartes d'une même grille */
  document.querySelectorAll(".cards-3, .cards-4, .brand-grid, .mini-brands, .univers, .product-grid, .mag-grid, .cat-grid, .figures, .jobs").forEach(g => {
    [...g.children].forEach((c, k) => { c.style.transitionDelay = (k % 6) * 80 + "ms"; });
  });

  /* Parallax léger sur les images d'en-tête et visuels */
  const px = [...document.querySelectorAll(".page-hero-bg, .split-media img, .quality-media > img")];
  px.forEach(el => el.setAttribute("data-parallax", ""));
  const onPx = () => {
    px.forEach(el => {
      const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      const amt = el.classList.contains("page-hero-bg") ? -60 : -30;
      el.style.transform = `translate3d(0, ${(p * amt).toFixed(1)}px, 0)${el.classList.contains("page-hero-bg") ? "" : " scale(1.06)"}`;
    });
  };
  addEventListener("scroll", () => requestAnimationFrame(onPx), { passive: true }); onPx();

  /* Inclinaison 3D des cartes au survol */
  if (matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".brand-card, .st-card, .post, .p-card, .v-card").forEach(c => {
      c.classList.add("tilt");
      c.addEventListener("mousemove", e => {
        const r = c.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        c.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
      });
      c.addEventListener("mouseleave", () => { c.style.transform = ""; });
    });

    /* Boutons magnétiques */
    document.querySelectorAll(".btn, .story-btn").forEach(b => {
      b.addEventListener("mousemove", e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px, ${(e.clientY - r.top - r.height / 2) * .25}px)`; });
      b.addEventListener("mouseleave", () => { b.style.transform = ""; });
    });

    /* Curseur personnalisé */
    const cur = document.createElement("div"); cur.className = "cursor"; document.body.appendChild(cur);
    let tx = 0, ty = 0, cx = 0, cy = 0;
    addEventListener("mousemove", e => { tx = e.clientX; ty = e.clientY; cur.classList.add("is-on"); });
    document.addEventListener("mouseleave", () => cur.classList.remove("is-on"));
    const loop = () => { cx += (tx - cx) * .18; cy += (ty - cy) * .18; cur.style.transform = `translate(${cx}px, ${cy}px)`; requestAnimationFrame(loop); };
    loop();
    document.querySelectorAll("a, button, .chip, summary, [data-story-track]").forEach(el => {
      el.addEventListener("mouseenter", () => cur.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => cur.classList.remove("is-hover"));
    });
  }
});

/* Tiret droit dans les titres serif (le tiret de Cormorant est penché) */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("h1, h2, h3, h4, .hero-title").forEach(h => {
    const walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
    const nodes = []; while (walker.nextNode()) if (walker.currentNode.textContent.includes("-")) nodes.push(walker.currentNode);
    nodes.forEach(n => {
      const frag = document.createDocumentFragment();
      n.textContent.split(/(-)/).forEach(part => {
        if (part === "-") { const s = document.createElement("span"); s.className = "hy"; s.textContent = "-"; frag.appendChild(s); }
        else if (part) frag.appendChild(document.createTextNode(part));
      });
      n.replaceWith(frag);
    });
  });
});
