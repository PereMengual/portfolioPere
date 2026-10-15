/* ==========================================================================
   Portfolio de Pere Mengual Roca: interacciones
   Sin dependencias externas.
   ========================================================================== */
(function () {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp01 = (x) => (x > 0 ? (x < 1 ? x : 1) : 0); // también convierte NaN en 0
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------------------------------------------------------------
     Avisos breves (copiar email y teléfono)
     --------------------------------------------------------------- */
  const toastEl = $(".toast");
  let toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2600);
  }

  /* ---------------------------------------------------------------
     Tema claro / oscuro
     Sin elección guardada, sigue al sistema. El botón guarda la elección.
     --------------------------------------------------------------- */
  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const isDark = () => (root.dataset.theme ? root.dataset.theme === "dark" : darkQuery.matches);

  function paintThemeButtons() {
    const dark = isDark();
    $$("[data-theme-toggle]").forEach((btn) => {
      const icon = $(".bi", btn);
      if (icon) icon.className = dark ? "bi bi-sun" : "bi bi-moon-stars";
      const label = $(".theme-label", btn);
      if (label) label.textContent = dark ? "Tema claro" : "Tema oscuro";
      else btn.setAttribute("aria-label", dark ? "Cambiar a tema claro" : "Cambiar a tema oscuro");
    });
    const bg = getComputedStyle(root).getPropertyValue("--bg").trim();
    if (bg) $$('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", bg));
  }

  function themeChanged() {
    paintThemeButtons();
    document.dispatchEvent(new CustomEvent("themechange"));
  }

  $$("[data-theme-toggle]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const next = isDark() ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try {
        localStorage.setItem("pmr-tema", next);
      } catch (e) {
        /* sin almacenamiento: el tema dura hasta recargar */
      }
      themeChanged();
    })
  );
  darkQuery.addEventListener("change", () => {
    if (!root.dataset.theme) themeChanged();
  });
  paintThemeButtons();

  /* ---------------------------------------------------------------
     Menú lateral en móvil y tablet
     --------------------------------------------------------------- */
  const side = $("#side");
  const menuBtn = $(".menu-toggle");
  const scrim = $(".scrim");
  const desktop = window.matchMedia("(min-width: 1200px)");

  function setMenu(open) {
    if (!side || !menuBtn) return;
    side.classList.toggle("open", open);
    if (scrim) scrim.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    const icon = $(".bi", menuBtn);
    if (icon) icon.className = open ? "bi bi-x-lg" : "bi bi-list";
  }

  if (menuBtn) menuBtn.addEventListener("click", () => setMenu(!side.classList.contains("open")));
  if (scrim) scrim.addEventListener("click", () => setMenu(false));
  $$(".side a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && side && side.classList.contains("open")) {
      setMenu(false);
      menuBtn.focus();
    }
  });
  desktop.addEventListener("change", (e) => {
    if (e.matches) setMenu(false);
  });

  /* ---------------------------------------------------------------
     Sección activa en el menú y botón de volver arriba
     --------------------------------------------------------------- */
  const navLinks = $$(".side-nav a[href^='#']");
  const sections = navLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  const toTop = $(".to-top");

  function onScroll() {
    const probe = window.scrollY + window.innerHeight * 0.38;
    let current = sections[0];
    sections.forEach((s) => {
      if (s.offsetTop <= probe) current = s;
    });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      current = sections[sections.length - 1];
    }
    navLinks.forEach((a) => {
      const on = current && a.getAttribute("href") === "#" + current.id;
      a.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
    if (toTop) toTop.classList.toggle("show", window.scrollY > 600);
  }

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
    },
    { passive: true }
  );
  window.addEventListener("load", onScroll);
  onScroll();

  /* ---------------------------------------------------------------
     Línea de roles de la portada
     Los textos están en data-roles y sus iconos en data-icons, separados por "|"
     --------------------------------------------------------------- */
  const typed = $(".typed");
  if (typed && !reduceMotion) {
    const roles = (typed.dataset.roles || "").split("|").map((r) => r.trim()).filter(Boolean);
    const icons = (typed.dataset.icons || "").split("|").map((r) => r.trim());
    const iconEl = $(".role-ic .bi");
    const setIcon = (i) => {
      if (iconEl && icons[i]) iconEl.className = "bi bi-" + icons[i];
    };
    if (roles.length > 1) {
      let index = 0;
      let chars = roles[0].length;
      let deleting = true;
      const step = () => {
        const role = roles[index];
        if (deleting) {
          chars -= 1;
          typed.textContent = role.slice(0, Math.max(chars, 0));
          if (chars <= 0) {
            deleting = false;
            index = (index + 1) % roles.length;
            setIcon(index);
            setTimeout(step, 380);
            return;
          }
          setTimeout(step, 26);
        } else {
          const next = roles[index];
          chars += 1;
          typed.textContent = next.slice(0, chars);
          if (chars >= next.length) {
            deleting = true;
            setTimeout(step, 2600);
            return;
          }
          setTimeout(step, 55);
        }
      };
      setTimeout(step, 3000);
    }
  }

  /* ---------------------------------------------------------------
     Habilidades con nivel (opcional): <li data-nivel="8">Unity</li>
     --------------------------------------------------------------- */
  $$(".tools").forEach((list) => {
    const items = $$("li", list);
    if (!items.some((li) => li.dataset.nivel)) return;
    list.classList.add("has-levels");
    items.forEach((li) => {
      const raw = parseInt(li.dataset.nivel, 10);
      if (!raw) {
        li.classList.add("no-level");
        return;
      }
      const lvl = Math.max(1, Math.min(10, raw));
      const name = li.textContent.trim();
      let segs = "";
      for (let k = 0; k < 10; k++) segs += '<i class="' + (k < lvl ? "on" : "") + '"></i>';
      li.innerHTML =
        '<span class="lvl-row"><span>' + name + '</span><span class="lvl-val">' + lvl + "/10</span></span>" +
        '<span class="lvl" role="img" aria-label="' + name + ": nivel " + lvl + ' de 10">' + segs + "</span>";
      li.dataset.tool = name;
    });
  });

  /* ---------------------------------------------------------------
     Cifras de "Sobre mí": se calculan a partir del contenido
     --------------------------------------------------------------- */
  const toolNames = $$(".tools li").map((li) => (li.dataset.tool || li.textContent).trim().toLowerCase());
  const totals = {
    proyectos: $$(".grid .card").length,
    premios: $$("[data-award]").length,
    titulaciones: $$("[data-degree]").length,
    herramientas: new Set(toolNames).size,
  };
  const counters = $$("[data-count]");
  counters.forEach((el) => {
    const v = totals[el.dataset.count];
    if (typeof v === "number") el.textContent = v;
  });

  if (!reduceMotion && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          io.unobserve(entry.target);
          const el = entry.target;
          const end = totals[el.dataset.count];
          const t0 = performance.now();
          const frame = (now) => {
            const p = Math.min((now - t0) / 900, 1);
            el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(frame);
          };
          requestAnimationFrame(frame);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => {
      if (el.getBoundingClientRect().top > window.innerHeight) io.observe(el);
    });
  }

  /* ---------------------------------------------------------------
     Filtros de proyectos (con recuento automático)
     --------------------------------------------------------------- */
  const filterButtons = $$(".chip-btn[data-filter]");
  const cards = $$(".grid .card");
  const inFilter = (card, filter) => filter === "*" || (card.dataset.category || "").split(/\s+/).includes(filter);

  filterButtons.forEach((btn) => {
    const n = $(".n", btn);
    if (n) n.textContent = cards.filter((c) => inFilter(c, btn.dataset.filter)).length;
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      cards.forEach((card) => {
        card.hidden = !inFilter(card, btn.dataset.filter);
      });
    });
  });

  /* ---------------------------------------------------------------
     Visor de imágenes de los proyectos
     --------------------------------------------------------------- */
  const lb = $(".lb");
  if (lb && typeof lb.showModal === "function") {
    const img = $(".lb-img", lb);
    const prev = $(".lb-prev", lb);
    const next = $(".lb-next", lb);
    const count = $(".lb-count", lb);
    let images = [];
    let idx = 0;
    let title = "";

    const draw = () => {
      img.src = images[idx];
      img.alt = title + ", imagen " + (idx + 1) + " de " + images.length;
      count.textContent = idx + 1 + " / " + images.length;
      prev.hidden = next.hidden = count.hidden = images.length < 2;
    };
    const step = (d) => {
      idx = (idx + d + images.length) % images.length;
      draw();
    };

    $$("[data-open-lb]").forEach((trigger) =>
      trigger.addEventListener("click", () => {
        const card = trigger.closest(".card");
        if (!card) return;
        images = (card.dataset.images || "").split(",").map((s) => s.trim()).filter(Boolean);
        if (!images.length) return;
        idx = 0;
        title = $("h3", card).textContent.trim();
        $(".lb-title", lb).textContent = title;
        $(".lb-meta", lb).innerHTML = $(".meta", card).innerHTML;
        $(".lb-desc", lb).textContent = $(".card-desc", card).textContent.trim();
        const tags = $(".tags", card);
        $(".lb-tags", lb).innerHTML = tags ? tags.innerHTML : "";
        draw();
        lb.showModal();
      })
    );
    prev.addEventListener("click", () => step(-1));
    next.addEventListener("click", () => step(1));
    $(".lb-close", lb).addEventListener("click", () => lb.close());
    lb.addEventListener("click", (e) => {
      if (e.target === lb) lb.close();
    });
    lb.addEventListener("keydown", (e) => {
      if (images.length < 2) return;
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });
  } else {
    // Navegadores sin <dialog>: abre la imagen en otra pestaña
    $$("[data-open-lb]").forEach((trigger) =>
      trigger.addEventListener("click", () => {
        const card = trigger.closest(".card");
        const first = card && (card.dataset.images || "").split(",")[0];
        if (first) window.open(first.trim(), "_blank", "noopener");
      })
    );
  }

  /* ---------------------------------------------------------------
     Copiar email y teléfono
     --------------------------------------------------------------- */
  $$("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const text = btn.dataset.copy;
      const ok = () => toast(btn.dataset.copyLabel || "Copiado");
      const fail = () => toast("No se ha podido copiar: " + text);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(ok, fail);
      } else {
        fail();
      }
    });
  });

  /* ---------------------------------------------------------------
     Edad y año actuales
     --------------------------------------------------------------- */
  $$("[data-birth]").forEach((el) => {
    const birth = new Date(el.dataset.birth + "T00:00:00");
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const passed =
      now.getMonth() > birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
    if (!passed) age -= 1;
    el.textContent = age + " años";
  });
  $$("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  /* ---------------------------------------------------------------
     Portada: agentes autónomos
     Cada agente sigue las tres reglas de los "boids" de Craig Reynolds
     (separarse de los vecinos, alinearse con ellos y acercarse al grupo),
     una técnica clásica de IA para videojuegos. Además esquivan el texto
     de la portada como si fueran obstáculos. Las líneas unen a los agentes
     que se ven entre sí. Con el cursor encima, los cercanos lo persiguen;
     un clic los dispersa.
     --------------------------------------------------------------- */
  initHeroAgents();

  function initHeroAgents() {
    const hero = $(".hero");
    const canvas = hero && $(".hero-agents", hero);
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    const simText = $(".sim-text", hero);
    const hint = $(".hero-hint", hero);
    if (reduceMotion && hint) hint.hidden = true;

    const SEP = 27; // distancia mínima entre agentes
    const VIEW = 72; // hasta dónde ve cada agente
    const LINK = 92; // distancia máxima para dibujar una línea
    const CHASE = 230; // distancia a la que notan el cursor
    const BUCKETS = 6; // tonos entre cian y violeta

    let W = 0;
    let H = 0;
    let wide = true;
    let area = { x0: 0, y0: 0, x1: 0, y1: 0 };
    let agents = [];
    const colors = { tones: [], link: "#7b3fe4" };
    let running = false;
    let visible = true;
    let lastT = 0;
    let scatter = { until: 0, x: 0, y: 0 };
    let mode = "";
    let obstacles = [];
    let roleWidth = 0;
    const pointer = { x: 0, y: 0, on: false };
    const copy = $(".hero-copy", hero);

    function rng(seed) {
      let a = seed >>> 0;
      return function () {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    const toRgb = (hex) => {
      const h = hex.replace("#", "");
      const n = parseInt(h.length === 3 ? h.replace(/(.)/g, "$1$1") : h, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };

    function readColors() {
      const cs = getComputedStyle(root);
      const a = toRgb(cs.getPropertyValue("--wave-a").trim() || "#13e7fe");
      const b = toRgb(cs.getPropertyValue("--wave-b").trim() || "#a553f7");
      colors.tones = [];
      for (let i = 0; i < BUCKETS; i++) {
        const t = i / (BUCKETS - 1);
        colors.tones.push(
          "rgb(" + Math.round(lerp(a[0], b[0], t)) + "," + Math.round(lerp(a[1], b[1], t)) + "," + Math.round(lerp(a[2], b[2], t)) + ")"
        );
      }
      colors.link = cs.getPropertyValue("--violet").trim() || "#7b3fe4";
    }

    function setArea() {
      wide = W >= 880;
      // En pantallas anchas viven a la derecha del texto; en estrechas, en la franja inferior
      area = wide ? { x0: W * 0.4, y0: 20, x1: W, y1: H - 64 } : { x0: 0, y0: H - 226, x1: W, y1: H - 54 };
    }

    // Cajas que ocupa el texto de la portada, para que los agentes lo rodeen
    function measureObstacles() {
      obstacles = [];
      if (!wide || !copy) return;
      const base = hero.getBoundingClientRect();
      const range = document.createRange();
      Array.from(copy.children).forEach((el) => {
        range.selectNodeContents(el);
        const r = range.getBoundingClientRect();
        if (!r.width) return;
        let right = r.right;
        if (el.classList.contains("role-line")) {
          // El rol se reescribe solo: se guarda la anchura del más largo visto
          roleWidth = Math.max(roleWidth, r.width);
          right = r.left + roleWidth;
        }
        obstacles.push({ x0: r.left - base.left - 18, y0: r.top - base.top - 14, x1: right - base.left + 22, y1: r.bottom - base.top + 14 });
      });
    }

    function avoid(a) {
      let fx = 0;
      let fy = 0;
      for (const o of obstacles) {
        const nx = Math.max(o.x0, Math.min(a.x, o.x1));
        const ny = Math.max(o.y0, Math.min(a.y, o.y1));
        const dx = a.x - nx;
        const dy = a.y - ny;
        const d = Math.hypot(dx, dy);
        if (d === 0) {
          fx += 900; // dentro de la caja: hacia la derecha, donde hay sitio
        } else if (d < 48) {
          const k = 520 * (1 - d / 48);
          fx += (dx / d) * k;
          fy += (dy / d) * k;
        }
      }
      return [fx, fy];
    }

    function step(dt, now, rand) {
      const maxS = wide ? 54 : 42;
      const minS = maxS * 0.45;
      const scattering = now < scatter.until;
      for (let i = 0; i < agents.length; i++) {
        const a = agents[i];
        let n = 0;
        let ax = 0;
        let ay = 0;
        let cx = 0;
        let cy = 0;
        let sx = 0;
        let sy = 0;
        for (let j = 0; j < agents.length; j++) {
          if (i === j) continue;
          const b = agents[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > VIEW * VIEW) continue;
          n++;
          ax += b.vx;
          ay += b.vy;
          cx += b.x;
          cy += b.y;
          if (d2 < SEP * SEP && d2 > 0.01) {
            sx -= (dx / d2) * SEP;
            sy -= (dy / d2) * SEP;
          }
        }
        let fx = sx * 34;
        let fy = sy * 34;
        if (n) {
          fx += (ax / n - a.vx) * 0.6 + (cx / n - a.x) * 0.35;
          fy += (ay / n - a.vy) * 0.6 + (cy / n - a.y) * 0.35;
        }
        fx += (rand() - 0.5) * 36;
        fy += (rand() - 0.5) * 36;

        let speedCap = maxS;
        if (pointer.on && !scattering && pointer.x > area.x0) {
          const dx = pointer.x - a.x;
          const dy = pointer.y - a.y;
          const d = Math.hypot(dx, dy);
          if (d < CHASE && d > 0.01) {
            const want = maxS * 1.5 * Math.min(1, d / 70);
            fx += ((dx / d) * want - a.vx) * 1.6;
            fy += ((dy / d) * want - a.vy) * 1.6;
            speedCap = maxS * 1.5;
          }
        }
        if (scattering) {
          const dx = a.x - scatter.x;
          const dy = a.y - scatter.y;
          const d = Math.hypot(dx, dy);
          if (d < 260 && d > 0.01) {
            fx += (dx / d) * 420 * (1 - d / 260);
            fy += (dy / d) * 420 * (1 - d / 260);
            speedCap = maxS * 2.6;
          }
        }
        if (obstacles.length) {
          const push = avoid(a);
          fx += push[0];
          fy += push[1];
        }
        // Se mantienen dentro de su zona (en escritorio también en horizontal)
        if (a.y < area.y0 + 24) fy += (area.y0 + 24 - a.y) * 4;
        if (a.y > area.y1 - 24) fy -= (a.y - (area.y1 - 24)) * 4;
        if (wide) {
          if (a.x < area.x0 + 40) fx += (area.x0 + 40 - a.x) * 5;
          if (a.x > area.x1 - 30) fx -= (a.x - (area.x1 - 30)) * 5;
        }

        a.vx += fx * dt;
        a.vy += fy * dt;
        const s = Math.hypot(a.vx, a.vy) || 1;
        const clamped = Math.max(minS, Math.min(speedCap, s));
        a.vx = (a.vx / s) * clamped;
        a.vy = (a.vy / s) * clamped;
      }
      for (const a of agents) {
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        if (wide) a.x = Math.max(area.x0, Math.min(area.x1, a.x));
        else if (a.x < area.x0 - 12) a.x = area.x1 + 12;
        else if (a.x > area.x1 + 12) a.x = area.x0 - 12;
        a.y = Math.max(area.y0, Math.min(area.y1, a.y));
      }
    }

    function populate() {
      const r = rng(2026);
      const px = (area.x1 - area.x0) * (area.y1 - area.y0);
      const n = Math.max(16, Math.min(wide ? 140 : 44, Math.round(px / (wide ? 4200 : 5200))));
      agents = [];
      for (let i = 0; i < n; i++) {
        const ang = r() * Math.PI * 2;
        agents.push({
          x: area.x0 + r() * (area.x1 - area.x0),
          y: area.y0 + r() * (area.y1 - area.y0),
          vx: Math.cos(ang) * 30,
          vy: Math.sin(ang) * 30,
          tone: Math.floor(r() * BUCKETS),
          size: 2.6 + r() * 2,
        });
      }
      // Unos segundos de simulación previa para que ya aparezcan en grupos
      const warm = rng(7);
      for (let k = 0; k < 160; k++) step(1 / 30, 0, warm);
    }

    function draw(now) {
      if (!W) return;
      ctx.clearRect(0, 0, W, H);

      // Líneas entre agentes que se ven (cuatro niveles de opacidad)
      const levels = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
      for (let i = 0; i < agents.length; i++) {
        const a = agents[i];
        for (let j = i + 1; j < agents.length; j++) {
          const b = agents[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > LINK * LINK) continue;
          const k = Math.min(3, Math.floor((Math.sqrt(d2) / LINK) * 4));
          levels[k].moveTo(a.x, a.y);
          levels[k].lineTo(b.x, b.y);
        }
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = colors.link;
      [0.5, 0.36, 0.22, 0.1].forEach((alpha, k) => {
        ctx.globalAlpha = alpha;
        ctx.stroke(levels[k]);
      });

      // Cursor: objetivo y líneas hacia los agentes que lo persiguen
      if (pointer.on && now >= scatter.until && pointer.x > area.x0) {
        const chase = new Path2D();
        for (const a of agents) {
          if (Math.hypot(pointer.x - a.x, pointer.y - a.y) < CHASE * 0.6) {
            chase.moveTo(pointer.x, pointer.y);
            chase.lineTo(a.x, a.y);
          }
        }
        ctx.globalAlpha = 0.16;
        ctx.stroke(chase);
        ctx.globalAlpha = 0.7;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 16, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Agentes: cápsulas orientadas según su dirección
      ctx.lineCap = "round";
      ctx.lineWidth = 7;
      for (let tone = 0; tone < BUCKETS; tone++) {
        const path = new Path2D();
        let any = false;
        for (const a of agents) {
          if (a.tone !== tone) continue;
          const s = Math.hypot(a.vx, a.vy) || 1;
          const len = a.size * 2;
          path.moveTo(a.x - (a.vx / s) * len, a.y - (a.vy / s) * len);
          path.lineTo(a.x, a.y);
          any = true;
        }
        if (!any) continue;
        ctx.strokeStyle = colors.tones[tone];
        ctx.stroke(path);
      }

      const chasing = pointer.on && pointer.x > area.x0;
      const nextMode = now < scatter.until ? "dispersándose" : chasing ? "siguiendo el cursor" : "explorando en grupo";
      if (simText && nextMode !== mode) {
        mode = nextMode;
        simText.textContent = "Agentes autónomos: " + mode;
      }
    }

    function loop(now) {
      if (!running) return;
      requestAnimationFrame(loop);
      if (now - lastT < 30) return;
      const dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 1 / 30;
      lastT = now;
      step(dt, now, Math.random);
      draw(now);
    }

    function setRunning() {
      const should = !reduceMotion && visible && !document.hidden;
      if (should && !running) {
        running = true;
        lastT = 0;
        requestAnimationFrame(loop);
      }
      if (!should) running = false;
    }

    function resize() {
      const r = hero.getBoundingClientRect();
      if (!r.width) return;
      const changed = Math.abs(r.width - W) > 40 || r.width >= 880 !== wide || !agents.length;
      W = r.width;
      H = r.height;
      const d = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * d);
      canvas.height = Math.round(H * d);
      ctx.setTransform(d, 0, 0, d, 0, 0);
      setArea();
      measureObstacles();
      if (changed) populate();
      else agents.forEach((a) => (a.y = Math.max(area.y0, Math.min(area.y1, a.y))));
      draw(performance.now());
    }

    if (!reduceMotion) {
      canvas.addEventListener("pointermove", (e) => {
        const r = canvas.getBoundingClientRect();
        pointer.x = e.clientX - r.left;
        pointer.y = e.clientY - r.top;
        pointer.on = true;
      });
      canvas.addEventListener("pointerleave", () => {
        pointer.on = false;
      });
      canvas.addEventListener("pointerdown", (e) => {
        const r = canvas.getBoundingClientRect();
        scatter = { until: performance.now() + 700, x: e.clientX - r.left, y: e.clientY - r.top };
      });
    }

    readColors();
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(hero);
    else window.addEventListener("resize", resize);
    resize();
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        setRunning();
      }).observe(hero);
    }
    document.addEventListener("visibilitychange", setRunning);
    document.addEventListener("themechange", () => {
      readColors();
      draw(performance.now());
    });
    // Cuando cargan las tipografías el texto cambia de tamaño: se vuelven a medir las cajas
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureObstacles);
    setRunning();
  }

  /* ---------------------------------------------------------------
     Demo de Dynamic Time Warping (proyecto destacado)

     1. Se inventa una "palabra" como una sucesión de sonidos, cada uno con
        8 coeficientes parecidos a los MFCC.
     2. La grabación de referencia y la orden del jugador pronuncian esa
        palabra con duraciones distintas, silencios y algo de ruido.
     3. Se calcula la distancia entre cada par de instantes (la matriz),
        y DTW encuentra el camino de menor coste acumulado.
     --------------------------------------------------------------- */
  initDTW();

  function initDTW() {
    const fig = $(".dtw");
    const canvas = fig && $(".dtw-canvas", fig);
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    const button = $(".dtw-btn", fig);

    const N = 26; // instantes de la referencia (filas)
    const M = 34; // instantes de la orden del jugador (columnas)
    const K = 8; // coeficientes por instante
    const STRIP = K * 0.5;
    const GAP = 0.5;
    const UNITS_W = STRIP + GAP + M;
    const BG = [6, 11, 22]; // igual que --screen

    // Rampa de la marca: noche, índigo, violeta, cian y casi blanco
    const RAMP = ["#060b16", "#1b2360", "#4b2fb0", "#a553f7", "#5b9cf7", "#13e7fe", "#dffbff"].map((hex) => {
      const n = parseInt(hex.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    });
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    function ramp(t) {
      const x = clamp01(t) * (RAMP.length - 1);
      const i = Math.min(Math.floor(x), RAMP.length - 2);
      const f = x - i;
      const a = RAMP[i];
      const b = RAMP[i + 1];
      return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)];
    }

    function rgbOver(c, alpha) {
      return (
        "rgb(" +
        Math.round(lerp(BG[0], c[0], alpha)) + "," +
        Math.round(lerp(BG[1], c[1], alpha)) + "," +
        Math.round(lerp(BG[2], c[2], alpha)) + ")"
      );
    }

    function rng(seed) {
      let a = seed >>> 0;
      return function () {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    const SILENCE = Array.from({ length: K }, (_, k) => 0.05 + 0.03 * (k % 3));

    function makeWord(r) {
      const means = [];
      const durs = [];
      for (let s = 0; s < 6; s++) {
        means.push(Array.from({ length: K }, () => 0.2 + 0.8 * r()));
        durs.push(0.55 + r() * 0.9);
      }
      return { means: means, durs: durs };
    }

    function pronounce(word, frames, opts, r) {
      const S = word.durs.length;
      const d = word.durs.map((x, s) => x * (opts.stretch ? opts.stretch[s] : 1));
      const total = d.reduce((a, b) => a + b, 0);
      const span = 1 - opts.lead - opts.tail;
      const edges = [opts.lead];
      for (let s = 0; s < S; s++) edges.push(edges[s] + (d[s] / total) * span);

      const raw = [];
      for (let f = 0; f < frames; f++) {
        const t = (f + 0.5) / frames;
        let v = SILENCE;
        if (t >= edges[0] && t < edges[S]) {
          let s = 0;
          while (s < S - 1 && t >= edges[s + 1]) s++;
          v = word.means[s];
        }
        const row = [];
        for (let k = 0; k < K; k++) {
          row.push(v[k] * opts.gain + 0.035 * Math.sin(t * 9 + k * 1.7) + (r() - 0.5) * opts.noise);
        }
        raw.push(row);
      }
      return raw.map((row, f) => {
        const a = raw[Math.max(0, f - 1)];
        const b = raw[Math.min(frames - 1, f + 1)];
        return row.map((x, k) => clamp01(0.25 * a[k] + 0.5 * x + 0.25 * b[k]));
      });
    }

    function align(ref, cmd) {
      const cost = new Float32Array(N * M);
      let max = 0;
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < M; j++) {
          let sum = 0;
          for (let k = 0; k < K; k++) {
            const diff = ref[i][k] - cmd[j][k];
            sum += diff * diff;
          }
          const c = Math.sqrt(sum / K);
          cost[i * M + j] = c;
          if (c > max) max = c;
        }
      }
      const acc = new Float32Array(N * M);
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < M; j++) {
          const c = cost[i * M + j];
          if (i === 0 && j === 0) acc[0] = c;
          else if (i === 0) acc[j] = c + acc[j - 1];
          else if (j === 0) acc[i * M] = c + acc[(i - 1) * M];
          else acc[i * M + j] = c + Math.min(acc[(i - 1) * M + j], acc[i * M + j - 1], acc[(i - 1) * M + j - 1]);
        }
      }
      const path = [[N - 1, M - 1]];
      let i = N - 1;
      let j = M - 1;
      while (i > 0 || j > 0) {
        if (i === 0) j--;
        else if (j === 0) i--;
        else {
          const diag = acc[(i - 1) * M + j - 1];
          const up = acc[(i - 1) * M + j];
          const left = acc[i * M + j - 1];
          if (diag <= up && diag <= left) {
            i--;
            j--;
          } else if (up < left) i--;
          else j--;
        }
        path.push([i, j]);
      }
      path.reverse();
      const sim = new Float32Array(N * M);
      for (let n = 0; n < N * M; n++) sim[n] = Math.pow(clamp01(1 - cost[n] / max), 2.4);
      return { sim: sim, path: path };
    }

    const seedR = rng(20260415);
    const word = makeWord(seedR);
    const ref = pronounce(word, N, { lead: 0.06, tail: 0.06, gain: 1, noise: 0.03 }, seedR);

    function makeState(seed) {
      const r = rng(seed);
      const cmd = pronounce(
        word,
        M,
        {
          lead: 0.02 + r() * 0.16,
          tail: 0.02 + r() * 0.14,
          stretch: word.durs.map(() => 0.5 + r() * 1.2),
          gain: 0.92 + r() * 0.12,
          noise: 0.07,
        },
        r
      );
      const result = align(ref, cmd);
      return { cmd: cmd, sim: result.sim, path: result.path };
    }

    let current = makeState(7);
    let previous = null;
    let anim = null;
    let hover = null;
    let size = { w: 0, h: 0, u: 0 };
    let introDone = false;

    // Devuelve true si el tamaño ha cambiado (cambiar canvas.width borra el dibujo)
    function resize() {
      const w = canvas.clientWidth;
      if (!w) return false;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const u = w / UNITS_W;
      const h = u * (N + GAP + STRIP);
      const pw = Math.round(w * dpr);
      const ph = Math.round(h * dpr);
      if (pw === canvas.width && ph === canvas.height && size.w === w) return false;
      canvas.width = pw;
      canvas.height = ph;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      size = { w: w, h: h, u: u };
      return true;
    }

    function draw(state) {
      const u = size.u;
      if (!u) return;
      const gp = Math.max(1, u * 0.09);
      const x0 = (STRIP + GAP) * u;
      const yStrip = (N + GAP) * u;
      const half = u * 0.5;

      ctx.clearRect(0, 0, size.w, size.h);
      const reveal = (d) => (state.intro ? clamp01((state.cellsT - d * 0.6) / 0.4) : 1);
      const mixT = state.intro ? 1 : ease(clamp01(state.cellsT));

      for (let i = 0; i < N; i++) {
        const f = reveal((i / (N - 1)) * 0.5);
        const y = (N - 1 - i) * u;
        for (let k = 0; k < K; k++) {
          ctx.fillStyle = rgbOver(ramp(ref[i][k]), 0.95 * f);
          ctx.fillRect(k * half + gp / 2, y + gp / 2, half - gp, u - gp);
        }
      }

      for (let j = 0; j < M; j++) {
        const f = reveal((j / (M - 1)) * 0.5);
        const x = x0 + j * u;
        for (let k = 0; k < K; k++) {
          const v = previous && !state.intro ? lerp(previous.cmd[j][k], current.cmd[j][k], mixT) : current.cmd[j][k];
          ctx.fillStyle = rgbOver(ramp(v), 0.95 * f);
          ctx.fillRect(x + gp / 2, yStrip + k * half + gp / 2, u - gp, half - gp);
        }
      }

      for (let i = 0; i < N; i++) {
        const y = (N - 1 - i) * u;
        for (let j = 0; j < M; j++) {
          const n = i * M + j;
          const s = previous && !state.intro ? lerp(previous.sim[n], current.sim[n], mixT) : current.sim[n];
          const f = reveal((i / (N - 1) + j / (M - 1)) / 2);
          ctx.fillStyle = rgbOver(ramp(0.12 + 0.88 * s), (0.3 + 0.7 * s) * f);
          ctx.fillRect(x0 + j * u + gp / 2, y + gp / 2, u - gp, u - gp);
        }
      }

      const center = (p) => [x0 + p[1] * u + u / 2, (N - 1 - p[0]) * u + u / 2];

      if (previous && state.oldAlpha > 0) {
        drawPath(previous.path, previous.path.length - 1, state.oldAlpha, center, u, false);
      }

      let cursor = null;
      if (state.pathT > 0) {
        const q = ease(clamp01(state.pathT)) * (current.path.length - 1);
        drawPath(current.path, q, 1, center, u, state.pathT < 1);
        if (state.pathT < 1) cursor = current.path[Math.round(q)];
      }
      if (!cursor && hover) cursor = hover;
      if (cursor) drawCursor(cursor, center, u, x0, yStrip);
    }

    function drawPath(path, q, alpha, center, u, withHead) {
      const whole = Math.floor(q);
      const frac = q - whole;
      const pts = [];
      for (let n = 0; n <= whole; n++) pts.push(center(path[n]));
      if (frac > 0 && whole + 1 < path.length) {
        const a = center(path[whole]);
        const b = center(path[whole + 1]);
        pts.push([lerp(a[0], b[0], frac), lerp(a[1], b[1], frac)]);
      }
      if (!pts.length) return;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = Math.max(2, u * 0.2);
      ctx.shadowColor = "rgba(19, 231, 254, 0.6)";
      ctx.shadowBlur = u * 0.7;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let n = 1; n < pts.length; n++) ctx.lineTo(pts[n][0], pts[n][1]);
      ctx.stroke();
      ctx.shadowBlur = 0;
      const dot = (p, r) => {
        ctx.beginPath();
        ctx.arc(p[0], p[1], r, 0, Math.PI * 2);
        ctx.fill();
      };
      ctx.fillStyle = "#ffffff";
      dot(pts[0], Math.max(2.5, u * 0.2));
      const last = pts[pts.length - 1];
      if (withHead) {
        ctx.fillStyle = "#13e7fe";
        dot(last, Math.max(4, u * 0.34));
      } else {
        dot(last, Math.max(2.5, u * 0.2));
      }
      ctx.restore();
    }

    function drawCursor(p, center, u, x0, yStrip) {
      const c = center(p);
      const y = (N - 1 - p[0]) * u;
      const x = x0 + p[1] * u;
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(STRIP * u, c[1]);
      ctx.lineTo(c[0], c[1]);
      ctx.moveTo(c[0], c[1]);
      ctx.lineTo(c[0], yStrip);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0.75, y + 0.75, STRIP * u - 1.5, u - 1.5);
      ctx.strokeRect(x + 0.75, yStrip + 0.75, u - 1.5, STRIP * u - 1.5);
      ctx.strokeRect(x + 0.75, y + 0.75, u - 1.5, u - 1.5);
      ctx.restore();
    }

    const drawStatic = () => draw({ intro: false, cellsT: 1, pathT: 1, oldAlpha: 0 });

    function play(kind) {
      if (reduceMotion) {
        previous = null;
        drawStatic();
        return;
      }
      const t0 = performance.now();
      const intro = kind === "intro";
      anim = { t0: t0 };
      const step = (now) => {
        if (!anim || anim.t0 !== t0) return;
        const t = now - t0;
        const state = intro
          ? { intro: true, cellsT: t / 900, pathT: (t - 650) / 1300, oldAlpha: 0 }
          : { intro: false, cellsT: t / 520, pathT: (t - 380) / 1050, oldAlpha: 1 - t / 200 };
        draw(state);
        if (state.pathT < 1) requestAnimationFrame(step);
        else {
          anim = null;
          previous = null;
          drawStatic();
        }
      };
      requestAnimationFrame(step);
    }

    resize();
    // La animación de entrada empieza cuando la demo aparece en pantalla
    if (reduceMotion || !("IntersectionObserver" in window)) {
      introDone = true;
      drawStatic();
    } else {
      draw({ intro: true, cellsT: 0, pathT: 0, oldAlpha: 0 });
      const io = new IntersectionObserver(
        (entries) => {
          if (!entries[0].isIntersecting || introDone) return;
          introDone = true;
          io.disconnect();
          play("intro");
        },
        { threshold: 0.35 }
      );
      io.observe(canvas);
    }

    const onResize = () => {
      if (resize() && !anim) {
        if (introDone) drawStatic();
        else draw({ intro: true, cellsT: 0, pathT: 0, oldAlpha: 0 });
      }
    };
    if ("ResizeObserver" in window) new ResizeObserver(onResize).observe(canvas);
    else window.addEventListener("resize", onResize);

    if (button) {
      button.addEventListener("click", () => {
        introDone = true;
        previous = current;
        current = makeState(Math.floor(Math.random() * 1e9));
        hover = null;
        play("swap");
      });
    }

    function cellAt(e) {
      const rect = canvas.getBoundingClientRect();
      const u = rect.width / UNITS_W;
      const j = Math.floor((e.clientX - rect.left - (STRIP + GAP) * u) / u);
      const i = N - 1 - Math.floor((e.clientY - rect.top) / u);
      return i >= 0 && i < N && j >= 0 && j < M ? [i, j] : null;
    }

    const onPointer = (e) => {
      if (!introDone) return;
      const cell = cellAt(e);
      const changed = !cell || !hover ? cell !== hover : cell[0] !== hover[0] || cell[1] !== hover[1];
      hover = cell;
      if (changed && !anim) drawStatic();
    };
    canvas.addEventListener("pointermove", onPointer);
    canvas.addEventListener("pointerdown", onPointer);
    canvas.addEventListener("pointerleave", () => {
      hover = null;
      if (!anim && introDone) drawStatic();
    });
  }
})();
