/* ==========================================================================
   ELYSIUM — Main Interaction Script
   Vanilla JS only. Organized by feature; each block is self-contained and
   guarded so missing elements never throw. Search for the numbered
   headers to jump to a feature.

   1. Utilities
   2. Cinematic loading sequence + hero title reveal
   3. Navigation (scroll spy, mobile menu, smooth scroll, transition sweep)
   4. Custom cursor
   5. Hero particle field
   6. Scroll reveal (Intersection Observer)
   7. World: continents, expansion territories & interactive map (data/continents.json)
   8. Classes (data/classes.json)
   9. Factions (data/factions.json)
   10. Features + world bosses (data/features.json)
   11. Professions (data/professions.json)
   12. Expansion roadmap (data/expansions.json)
   13. Timeline (Lore)
   14. Gallery + lightbox (data/gallery.json)
   15. Development stages + roadmap, combined (data/dev-stages.json)
   16. Typewriter text
   17. Back to top
   18. Ambient audio controls
   19. Easter eggs (logo clicks, Konami code, TheMonoMind signature easter egg, rune clicks, dev journal)
   ========================================================================== */

(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isFinePointer = window.matchMedia("(pointer: fine)").matches;

  /* ------------------------------------------------------------------ *
   * 1. Utilities
   * ------------------------------------------------------------------ */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function escapeHtml(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Shared JSON fetch helper used by every data-driven section below.
  function fetchJSON(url) {
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error("Request failed: " + res.status);
      return res.json();
    });
  }

  // Shared error state for a data-driven container, so a failed fetch never
  // leaves a section silently blank with no explanation.
  function showFetchError(container, err) {
    if (!container) return;
    container.innerHTML = "";
    var note = document.createElement("p");
    note.className = "data-error-note";
    note.textContent =
      "Couldn't load this section's data (" + err.message + "). Serve this page over http(s) " +
      "— a local server or GitHub Pages — rather than opening it as a local file.";
    container.appendChild(note);
  }

  // Shared reveal-on-scroll observer (assigned in section 6), reused by every
  // section below that injects markup after an async fetch resolves.
  var revealIO = null;
  function observeReveal(el) {
    if (!el) return;
    if (revealIO) { revealIO.observe(el); }
    else { el.classList.add("is-visible"); }
  }

  /* ------------------------------------------------------------------ *
   * 2. Cinematic loading sequence + hero title reveal
   * ------------------------------------------------------------------ */
  (function loadingSequence() {
    var screen = $("#loading-screen");
    var statusEl = $("#loading-status");
    var barFill = $("#loading-bar-fill");
    if (!screen) { revealHeroTitle(); return; }

    document.body.classList.add("no-scroll");

    var messages = [
      "Awakening the world of Elysium…",
      "Loading ancient memories…",
      "Preparing your journey…"
    ];
    var msgIndex = 0;
    var progress = 0;
    var done = false;

    var msgTimer = setInterval(function () {
      msgIndex = (msgIndex + 1) % messages.length;
      if (statusEl) statusEl.textContent = messages[msgIndex];
    }, 900);

    var progressTimer = setInterval(function () {
      progress += Math.random() * 18 + 6;
      progress = clamp(progress, 0, 100);
      if (barFill) barFill.style.width = progress + "%";
      if (progress >= 100) {
        clearInterval(progressTimer);
        clearInterval(msgTimer);
        finishLoading();
      }
    }, 260);

    function finishLoading() {
      if (done) return;
      done = true;
      clearInterval(progressTimer);
      clearInterval(msgTimer);
      setTimeout(function () {
        screen.classList.add("is-hidden");
        document.body.classList.remove("no-scroll");
        screen.setAttribute("aria-hidden", "true");
        // The hero title only starts its letter-by-letter reveal once the
        // loading screen has actually finished fading, so the animation is
        // something the player can see rather than something that already
        // finished behind an opaque overlay.
        revealHeroTitle();
      }, 350);
    }

    // Absolute safety net: never trap the user behind the loading screen,
    // and never leave the hero title unrevealed if something above throws.
    setTimeout(function () {
      if (!done) finishLoading();
    }, 4000);
  })();

  // Splits the hero title into per-letter <span> elements and triggers the
  // CSS letter-rise animation. Guarded so it only ever runs once. If this
  // never runs at all (script blocked, JS disabled), the title still shows:
  // it stays as plain gradient-filled text, since `.letters span { opacity:0 }`
  // in style.css only matches spans that this function creates.
  var heroRevealed = false;
  function revealHeroTitle() {
    if (heroRevealed) return;
    var target = $("#hero-title");
    if (!target) return;
    heroRevealed = true;

    var text = target.textContent.trim();
    target.textContent = "";

    text.split("").forEach(function (ch, i) {
      var span = document.createElement("span");
      span.textContent = ch === " " ? "\u00A0" : ch;
      span.style.animationDelay = (i * 0.055) + "s";
      target.appendChild(span);
    });

    requestAnimationFrame(function () {
      target.classList.add("is-revealed");
    });
  }

  /* ------------------------------------------------------------------ *
   * 3. Navigation
   * ------------------------------------------------------------------ */
  (function nav() {
    var header = $("#site-nav");
    var toggle = $("#nav-toggle");
    var links = $("#nav-links");
    var navAnchors = $all("[data-nav]");
    var sweep = $("#transition-sweep");
    var sections = $all("section[id]");

    if (header) {
      window.addEventListener("scroll", function () {
        header.classList.toggle("is-scrolled", window.scrollY > 40);
      }, { passive: true });
    }

    if (toggle && links) {
      toggle.addEventListener("click", function () {
        var isOpen = links.classList.toggle("is-mobile-open");
        toggle.classList.toggle("is-open", isOpen);
        toggle.setAttribute("aria-expanded", String(isOpen));
      });
    }

    navAnchors.forEach(function (a) {
      a.addEventListener("click", function () {
        if (links && links.classList.contains("is-mobile-open")) {
          links.classList.remove("is-mobile-open");
          if (toggle) { toggle.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); }
        }
        if (sweep && !prefersReducedMotion) {
          sweep.classList.remove("is-active");
          void sweep.offsetWidth; // restart animation
          sweep.classList.add("is-active");
        }
      });
    });

    // Scroll-spy: highlight the nav link for the section in view
    if ("IntersectionObserver" in window && sections.length) {
      var navLinkMap = {};
      $all(".nav-links a[data-nav]").forEach(function (a) {
        navLinkMap[a.getAttribute("href").replace("#", "")] = a;
      });

      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.id;
          Object.keys(navLinkMap).forEach(function (key) {
            navLinkMap[key].classList.toggle("is-active", key === id);
          });
        });
      }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

      sections.forEach(function (s) { spy.observe(s); });
    }
  })();

  /* ------------------------------------------------------------------ *
   * 4. Custom cursor
   * ------------------------------------------------------------------ */
  (function cursor() {
    if (!isFinePointer || prefersReducedMotion) return;
    var glow = $("#cursor-glow");
    var dot = $("#cursor-dot");
    if (!glow || !dot) return;

    document.body.classList.add("has-fine-pointer");

    var gx = -400, gy = -400, dx = -400, dy = -400;
    window.addEventListener("mousemove", function (e) {
      dx = e.clientX; dy = e.clientY;
      gx = e.clientX; gy = e.clientY;
    });

    // Delegated so cursor highlight still works on elements injected later
    // by the data-driven sections below.
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest && e.target.closest("a, button, .map-marker, .gallery-item")) {
        dot.classList.add("is-active");
      }
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest && e.target.closest("a, button, .map-marker, .gallery-item")) {
        dot.classList.remove("is-active");
      }
    });

    function raf() {
      dot.style.left = dx + "px";
      dot.style.top = dy + "px";
      glow.style.left = gx + "px";
      glow.style.top = gy + "px";
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  })();

  /* ------------------------------------------------------------------ *
   * 5. Hero particle field
   * ------------------------------------------------------------------ */
  (function heroParticles() {
    var canvas = $("#hero-canvas");
    if (canvas && window.ElysiumParticles) {
      window.ElysiumParticles(canvas);
    }
  })();

  /* ------------------------------------------------------------------ *
   * 6. Scroll reveal (Intersection Observer)
   * ------------------------------------------------------------------ */
  (function scrollReveal() {
    if (!("IntersectionObserver" in window) || prefersReducedMotion) {
      revealIO = null;
    } else {
      revealIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealIO.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    }

    $all(".reveal").forEach(function (t) { observeReveal(t); });
  })();

  /* ------------------------------------------------------------------ *
   * 7. World: continents, expansion territories & interactive map
   *    (data/continents.json)
   * ------------------------------------------------------------------ */
  (function worldContinents() {
    var continentGrid = $("#continent-grid");
    var territoryGrid = $("#expansion-territory-grid");
    var markersGroup = $("#map-markers");
    var modal = $("#map-modal");
    var modalTitle = $("#map-modal-title");
    var modalBody = $("#map-modal-body");
    var closeBtn = $("#map-modal-close");
    if (!continentGrid && !territoryGrid && !markersGroup) return;

    function continentArt(c, gradId) {
      var extra = c.danger === "high"
        ? '<path d="M20 90 L120 210 L200 70 L300 220 L380 100" stroke="#b34a3a" stroke-width="1" fill="none" opacity="0.55"/>'
        : '<path d="M40 200 Q100 120 160 160 T280 140 T380 190" stroke="#c9a86a" stroke-width="1" fill="none" opacity="0.5"/>' +
          '<circle cx="120" cy="150" r="2" fill="#e8cd8a"/><circle cx="220" cy="120" r="2" fill="#e8cd8a"/><circle cx="300" cy="170" r="2" fill="#e8cd8a"/>';
      return (
        '<svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">' +
        '<rect width="400" height="260" fill="url(#' + gradId + ')"/>' +
        '<defs><linearGradient id="' + gradId + '" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="' + c.gradient[0] + '"/><stop offset="1" stop-color="' + c.gradient[1] + '"/>' +
        '</linearGradient></defs>' + extra + '</svg>'
      );
    }

    function renderContinents(list) {
      if (!continentGrid) return;
      continentGrid.innerHTML = "";
      list.forEach(function (c, i) {
        var card = document.createElement("div");
        card.className = "panel continent-card reveal" + (c.danger === "high" ? " is-danger" : "");
        card.style.setProperty("--i", i);
        card.innerHTML =
          '<div class="art">' + continentArt(c, "grad-" + c.id) + '</div>' +
          '<div class="body">' +
          '<span class="tag">' + escapeHtml(c.tag) + '</span>' +
          '<h3>' + escapeHtml(c.name) + '</h3>' +
          '<p>' + escapeHtml(c.description) + '</p>' +
          '<div class="continent-meta">' +
          '<span class="tag">' + escapeHtml(c.levelRange) + '</span>' +
          '<span class="tag">' + escapeHtml(c.climate) + '</span>' +
          '</div></div>';
        continentGrid.appendChild(card);
        observeReveal(card);
      });
    }

    function renderTerritoryStrip(list) {
      if (!territoryGrid) return;
      territoryGrid.innerHTML = "";
      list.forEach(function (t) {
        var card = document.createElement("div");
        card.className = "panel mini-card";
        card.innerHTML =
          '<span class="dot"></span><div><strong>' + escapeHtml(t.name) + '</strong>' +
          '<span>' + escapeHtml(t.shortDescription) + '</span></div>';
        territoryGrid.appendChild(card);
      });
    }

    function renderMarkers(launch, territories) {
      if (!markersGroup) return;
      markersGroup.innerHTML = "";

      function addMarker(id, name, x, y, extraClass, ariaSuffix) {
        var ns = "http://www.w3.org/2000/svg";
        var g = document.createElementNS(ns, "g");
        g.setAttribute("class", "map-marker" + (extraClass ? " " + extraClass : ""));
        g.setAttribute("data-location", id);
        g.setAttribute("tabindex", "0");
        g.setAttribute("role", "button");
        g.setAttribute("aria-label", name + " — " + ariaSuffix);

        var pulse = document.createElementNS(ns, "circle");
        pulse.setAttribute("class", "pulse"); pulse.setAttribute("cx", x); pulse.setAttribute("cy", y); pulse.setAttribute("r", "6");
        var core = document.createElementNS(ns, "circle");
        core.setAttribute("class", "core"); core.setAttribute("cx", x); core.setAttribute("cy", y); core.setAttribute("r", "5");
        var text = document.createElementNS(ns, "text");
        text.setAttribute("x", x + 12); text.setAttribute("y", y + 4);
        text.textContent = name.toUpperCase();

        g.appendChild(pulse); g.appendChild(core); g.appendChild(text);
        markersGroup.appendChild(g);
      }

      launch.forEach(function (c) {
        addMarker(c.id, c.name, c.map.x, c.map.y, c.danger === "high" ? "is-danger" : "", c.danger === "high" ? "view dangers and lore" : "view description");
      });
      territories.forEach(function (t) {
        addMarker(t.id, t.name, t.map.x, t.map.y, "is-future", "expansion preview");
      });
    }

    function wireMap(regionInfo) {
      if (!markersGroup || !modal) return;

      function openModal(key) {
        var info = regionInfo[key];
        if (!info) return;
        modalTitle.textContent = info.title;
        modalBody.textContent = info.body;
        modal.classList.add("is-open");
      }
      function closeModal() { modal.classList.remove("is-open"); }

      $all(".map-marker", markersGroup).forEach(function (m) {
        m.addEventListener("click", function () { openModal(m.getAttribute("data-location")); });
        m.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(m.getAttribute("data-location")); }
        });
      });

      if (closeBtn) closeBtn.addEventListener("click", closeModal);
      modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });
    }

    fetchJSON("data/continents.json")
      .then(function (data) {
        var launch = data.launch || [];
        var territories = data.expansionTerritories || [];

        renderContinents(launch);
        renderTerritoryStrip(territories);
        renderMarkers(launch, territories);

        var regionInfo = {};
        launch.forEach(function (c) { regionInfo[c.id] = { title: c.name, body: c.modalBody }; });
        territories.forEach(function (t) { regionInfo[t.id] = { title: t.modalTitle, body: t.modalBody }; });
        wireMap(regionInfo);
      })
      .catch(function (err) {
        showFetchError(continentGrid, err);
        showFetchError(territoryGrid, err);
      });
  })();

  /* ------------------------------------------------------------------ *
   * 8. Classes (data/classes.json)
   * ------------------------------------------------------------------ */
  (function classes() {
    var grid = $("#class-grid");
    if (!grid) return;

    function statRow(label, val) {
      return (
        '<div class="stat-row"><span>' + label + '</span>' +
        '<div class="stat-track"><div class="stat-fill" style="--val:' + val + '%"></div></div>' +
        '<span class="stat-num">' + val + '</span></div>'
      );
    }

    fetchJSON("data/classes.json")
      .then(function (data) {
        grid.innerHTML = "";
        (data.classes || []).forEach(function (c, i) {
          var card = document.createElement("article");
          card.className = "panel class-card reveal";
          card.style.setProperty("--i", i);
          card.innerHTML =
            '<svg class="icon" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.4"><path d="' + c.icon + '"/></svg>' +
            '<span class="role">' + escapeHtml(c.role) + '</span>' +
            '<h3>' + escapeHtml(c.name) + '</h3>' +
            '<span class="sub">' + escapeHtml(c.archetype) + ' &middot; Patron: ' + escapeHtml(c.patron) + '</span>' +
            '<p class="desc">' + escapeHtml(c.description) + '</p>' +
            statRow("Power", c.stats.power) + statRow("Defense", c.stats.defense) +
            statRow("Magic", c.stats.magic) + statRow("Difficulty", c.stats.difficulty);
          grid.appendChild(card);
          observeReveal(card);
        });

        // Stat bars animate in once each card scrolls into view
        var cards = $all(".class-card", grid);
        if ("IntersectionObserver" in window && cards.length) {
          var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
            });
          }, { threshold: 0.3 });
          cards.forEach(function (c) { io.observe(c); });
        } else {
          cards.forEach(function (c) { c.classList.add("is-visible"); });
        }
      })
      .catch(function (err) { showFetchError(grid, err); });
  })();

  /* ------------------------------------------------------------------ *
   * 9. Factions (data/factions.json)
   * ------------------------------------------------------------------ */
  (function factions() {
    var majorGrid = $("#faction-major-grid");
    var joinableGrid = $("#faction-joinable-grid");
    var repNote = $("#reputation-note");
    var allianceNote = $("#alliance-note");
    var repScale = $("#rep-scale");
    if (!majorGrid && !joinableGrid) return;

    function card(f, i, compact) {
      var el = document.createElement("div");
      el.className = "panel faction-card reveal" + (compact ? " faction-card--compact" : "");
      el.style.setProperty("--i", i);
      el.innerHTML =
        '<h3>' + escapeHtml(f.name) + '</h3>' +
        '<span class="sub">' + escapeHtml(f.sub) + '</span>' +
        '<p>' + escapeHtml(f.description) + '</p>';
      return el;
    }

    fetchJSON("data/factions.json")
      .then(function (data) {
        if (majorGrid) {
          majorGrid.innerHTML = "";
          (data.major || []).forEach(function (f, i) {
            var el = card(f, i, false);
            majorGrid.appendChild(el);
            observeReveal(el);
          });
        }
        if (joinableGrid) {
          joinableGrid.innerHTML = "";
          (data.joinable || []).forEach(function (f, i) {
            var el = card(f, i, true);
            joinableGrid.appendChild(el);
            observeReveal(el);
          });
        }
        if (repNote && data.reputationNote) repNote.textContent = data.reputationNote;
        if (allianceNote && data.allianceNote) allianceNote.textContent = data.allianceNote;
        if (repScale && data.reputationScale) {
          repScale.innerHTML = "";
          data.reputationScale.forEach(function (label) {
            var span = document.createElement("span");
            span.className = label.toLowerCase();
            repScale.appendChild(span);
          });
        }
      })
      .catch(function (err) { showFetchError(majorGrid, err); showFetchError(joinableGrid, err); });
  })();

  /* ------------------------------------------------------------------ *
   * 10. Features + world bosses (data/features.json)
   * ------------------------------------------------------------------ */
  (function features() {
    var featureGrid = $("#feature-grid");
    var bossGrid = $("#boss-grid");
    if (!featureGrid && !bossGrid) return;

    fetchJSON("data/features.json")
      .then(function (data) {
        if (featureGrid) {
          featureGrid.innerHTML = "";
          (data.features || []).forEach(function (f, i) {
            var el = document.createElement("div");
            el.className = "panel feature-card reveal";
            el.style.setProperty("--i", i);
            el.innerHTML =
              '<span class="num">' + escapeHtml(f.num) + '</span>' +
              '<h3>' + escapeHtml(f.name) + '</h3><p>' + escapeHtml(f.description) + '</p>';
            featureGrid.appendChild(el);
            observeReveal(el);
          });
        }
        if (bossGrid) {
          bossGrid.innerHTML = "";
          (data.worldBosses || []).forEach(function (b) {
            var el = document.createElement("div");
            el.className = "panel boss-card reveal" + (b.variant === "void" ? " is-void" : "");
            el.innerHTML =
              '<div class="boss-eyes"><span></span><span></span></div>' +
              '<span class="warning">&#9888; ' + escapeHtml(b.warning) + '</span>' +
              '<h3>' + escapeHtml(b.name) + '</h3><p>' + escapeHtml(b.description) + '</p>';
            bossGrid.appendChild(el);
            observeReveal(el);
          });
        }
      })
      .catch(function (err) { showFetchError(featureGrid, err); showFetchError(bossGrid, err); });
  })();

  /* ------------------------------------------------------------------ *
   * 11. Professions (data/professions.json)
   * ------------------------------------------------------------------ */
  (function professions() {
    var list = $("#profession-list");
    if (!list) return;

    fetchJSON("data/professions.json")
      .then(function (data) {
        list.innerHTML = "";
        (data.professions || []).forEach(function (p) {
          var row = document.createElement("div");
          row.className = "profession-row";
          row.innerHTML =
            '<svg class="icon" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.4"><path d="' + p.icon + '"/></svg>' +
            '<div><h3>' + escapeHtml(p.name) + '</h3><p>' + escapeHtml(p.description) + '</p></div>';
          list.appendChild(row);
        });
      })
      .catch(function (err) { showFetchError(list, err); });
  })();

  /* ------------------------------------------------------------------ *
   * 12. Expansion roadmap (data/expansions.json)
   * ------------------------------------------------------------------ */
  (function expansions() {
    var grid = $("#expansion-grid");
    if (!grid) return;

    fetchJSON("data/expansions.json")
      .then(function (data) {
        grid.innerHTML = "";
        (data.expansions || []).forEach(function (e, i) {
          var card = document.createElement("div");
          card.className = "panel expansion-card reveal";
          card.style.setProperty("--i", i);
          card.innerHTML =
            '<div class="head" data-index="' + escapeHtml(e.index) + '">' +
            '<span class="badge-soon">' + escapeHtml(e.status) + '</span>' +
            '<h3>' + escapeHtml(e.name) + '</h3></div>' +
            '<p class="theme">' + escapeHtml(e.theme) + '</p>';
          grid.appendChild(card);
          observeReveal(card);
        });
      })
      .catch(function (err) { showFetchError(grid, err); });
  })();

  /* ------------------------------------------------------------------ *
   * 13. Timeline (Lore)
   * ------------------------------------------------------------------ */
  (function timeline() {
    var wrap = $("#timeline");
    var fill = $("#timeline-fill");
    var events = $all("[data-timeline]");
    if (!wrap || !events.length) return;

    // Reveal each era as it enters view
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) entry.target.classList.add("is-active");
        });
      }, { threshold: 0.4 });
      events.forEach(function (ev) { io.observe(ev); });
    } else {
      events.forEach(function (ev) { ev.classList.add("is-active"); });
    }

    // Fill the vertical line proportionally to scroll progress through the timeline
    function updateFill() {
      var rect = wrap.getBoundingClientRect();
      var vh = window.innerHeight;
      var total = rect.height;
      var visible = clamp(vh * 0.75 - rect.top, 0, total);
      var pct = total > 0 ? (visible / total) * 100 : 0;
      if (fill) fill.style.height = clamp(pct, 0, 100) + "%";
    }
    window.addEventListener("scroll", updateFill, { passive: true });
    window.addEventListener("resize", updateFill);
    updateFill();
  })();

  /* ------------------------------------------------------------------ *
   * 14. Gallery + lightbox (data/gallery.json)
   * ------------------------------------------------------------------ */
  (function gallery() {
    var grid = $("#gallery-grid");
    var tabs = $all(".gallery-tab");
    var lightbox = $("#lightbox-modal");
    var lightboxTitle = $("#lightbox-title");
    var lightboxArt = $("#lightbox-art");
    var lightboxClose = $("#lightbox-close");
    if (!grid) return;

    function svgFor(item) {
      return (
        '<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">' +
        '<defs><linearGradient id="g-' + item.id + '" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="' + item.gradient[0] + '"/><stop offset="1" stop-color="' + item.gradient[1] + '"/>' +
        '</linearGradient></defs>' +
        '<rect width="400" height="300" fill="url(#g-' + item.id + ')"/>' +
        '<path d="M0 220 Q100 180 200 210 T400 190" stroke="#c9a86a" stroke-width="1" fill="none" opacity="0.35"/>' +
        '</svg>'
      );
    }

    fetchJSON("data/gallery.json")
      .then(function (data) {
        var items = data.items || [];
        grid.innerHTML = "";

        items.forEach(function (item, i) {
          var el = document.createElement("div");
          el.className = "gallery-item reveal";
          el.style.setProperty("--i", i);
          el.setAttribute("data-type", item.type);
          el.setAttribute("tabindex", "0");
          el.setAttribute("role", "button");
          el.setAttribute("aria-label", "View " + item.label);
          el.innerHTML = svgFor(item) + '<span class="label">' + escapeHtml(item.label) + '</span>';
          grid.appendChild(el);
          observeReveal(el);

          function openLightbox() {
            if (!lightbox) return;
            lightboxTitle.textContent = item.label;
            lightboxArt.innerHTML = svgFor(item);
            lightbox.classList.add("is-open");
          }
          el.addEventListener("click", openLightbox);
          el.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLightbox(); }
          });
        });

        tabs.forEach(function (tab) {
          tab.addEventListener("click", function () {
            tabs.forEach(function (t) { t.classList.remove("is-active"); });
            tab.classList.add("is-active");
            var filter = tab.getAttribute("data-filter");
            $all(".gallery-item", grid).forEach(function (el) {
              var show = filter === "all" || el.getAttribute("data-type") === filter;
              el.style.display = show ? "" : "none";
            });
          });
        });
      })
      .catch(function (err) { showFetchError(grid, err); });

    if (lightboxClose) lightboxClose.addEventListener("click", function () { lightbox.classList.remove("is-open"); });
    if (lightbox) {
      lightbox.addEventListener("click", function (e) { if (e.target === lightbox) lightbox.classList.remove("is-open"); });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lightbox) lightbox.classList.remove("is-open");
    });
  })();

  /* ------------------------------------------------------------------ *
   * 15. Development stages + roadmap, combined (data/dev-stages.json)
   *
   *     The detailed per-workstream checklist ("Stages") and the four-phase
   *     timeline ("Roadmap") used to be three separate, overlapping progress
   *     indicators (plus a now-removed "Development Status" summary block).
   *     They're now one panel: the roadmap's fill line is driven by the same
   *     overall completion percentage computed from the stage data, instead
   *     of a hand-set number.
   * ------------------------------------------------------------------ */
  (function devStages() {
    var root = $("#dev-stages");
    if (!root) return;

    var listEl = $("#stage-list");
    var pctEl = $("#dev-stages-pct");
    var countEl = $("#dev-stages-count");
    var tooltipEl = $("#docs-tooltip");
    var roadmapFill = $("#roadmap-fill");
    var caretSvg =
      '<svg class="stage-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"></polyline></svg>';

    function stats(items) {
      var done = items.filter(function (it) { return it.done === true; }).length;
      return { done: done, total: items.length };
    }

    function animateNumber(el, from, to, suffix, duration) {
      var start = null;
      function step(ts) {
        if (!start) start = ts;
        var t = clamp((ts - start) / duration, 0, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(from + (to - from) * eased) + suffix;
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    function showTooltip(e, stageLabel, item) {
      tooltipEl.innerHTML =
        '<span class="t-cat">' + stageLabel + '</span>' +
        item.title +
        '<span class="t-status ' + (item.done ? "is-done" : "is-pending") + '">' +
        (item.done ? "\u2713 Done" : "\u25CB Queued") +
        '</span>';
      tooltipEl.classList.add("is-visible");
      positionTooltip(e);
    }
    function positionTooltip(e) {
      if (!e || typeof e.clientX !== "number") return;
      var pad = 14;
      var x = e.clientX + pad;
      var y = e.clientY + pad;
      var maxX = window.innerWidth - 240;
      if (x > maxX) x = e.clientX - 234;
      tooltipEl.style.left = x + "px";
      tooltipEl.style.top = y + "px";
    }
    function hideTooltip() { tooltipEl.classList.remove("is-visible"); }

    function buildSegments(container, stageLabel, items) {
      items.forEach(function (item, i) {
        var seg = document.createElement("button");
        seg.type = "button";
        seg.className = "doc-segment" + (item.done ? " is-filled" : "");
        seg.setAttribute("data-done", item.done ? "true" : "false");
        seg.setAttribute("aria-label", stageLabel + ": " + item.title + " — " + (item.done ? "done" : "queued"));
        seg.style.transitionDelay = Math.min(i * 4, 400) + "ms";

        seg.addEventListener("mouseenter", function (e) { showTooltip(e, stageLabel, item); });
        seg.addEventListener("mousemove", positionTooltip);
        seg.addEventListener("mouseleave", hideTooltip);
        seg.addEventListener("focus", function (e) { showTooltip(e, stageLabel, item); });
        seg.addEventListener("blur", hideTooltip);

        container.appendChild(seg);
      });
    }

    function buildStageCard(stage, index) {
      var s = stats(stage.items);
      var pct = s.total ? Math.round((s.done / s.total) * 100) : 0;

      var card = document.createElement("div");
      card.className = "stage-card";

      var header = document.createElement("button");
      header.type = "button";
      header.className = "stage-card-header";
      header.setAttribute("aria-expanded", "false");
      header.innerHTML =
        '<span class="stage-index">' + String(index + 1).padStart(2, "0") + '</span>' +
        '<span class="stage-title-wrap">' +
          '<span class="stage-title">' + stage.label + '</span>' +
          '<span class="stage-blurb">' + stage.blurb + '</span>' +
        '</span>' +
        '<span class="stage-meter">' +
          '<span class="stage-track"><span class="stage-fill" data-target="' + pct + '"></span></span>' +
          '<span class="stage-pct">' + pct + '%</span>' +
          '<span class="stage-count">' + s.done + '/' + s.total + '</span>' +
        '</span>' +
        caretSvg;

      var body = document.createElement("div");
      body.className = "stage-body";
      var segWrap = document.createElement("div");
      segWrap.className = "stage-segments";
      body.appendChild(segWrap);

      var built = false;
      var revealed = false;

      header.addEventListener("click", function () {
        var isOpen = card.classList.toggle("is-open");
        header.setAttribute("aria-expanded", isOpen ? "true" : "false");

        if (!built) {
          buildSegments(segWrap, stage.label, stage.items);
          built = true;
        }
        if (isOpen) {
          body.style.maxHeight = body.scrollHeight + "px";
          if (!revealed) {
            requestAnimationFrame(function () {
              $all(".doc-segment", segWrap).forEach(function (seg) { seg.classList.add("is-visible"); });
            });
            revealed = true;
          }
        } else {
          body.style.maxHeight = "0px";
        }
      });

      card.appendChild(header);
      card.appendChild(body);
      listEl.appendChild(card);

      // animate the inline stage bar once it scrolls into view
      var fillEl = $(".stage-fill", header);
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              fillEl.style.width = pct + "%";
              io.disconnect();
            }
          });
        }, { threshold: 0.3 });
        io.observe(card);
      } else {
        fillEl.style.width = pct + "%";
      }
    }

    fetchJSON("data/dev-stages.json")
      .then(function (data) {
        data.stages.forEach(buildStageCard);

        var allItems = data.stages.reduce(function (acc, s) { return acc.concat(s.items); }, []);
        var overall = stats(allItems);
        var pct = overall.total ? Math.round((overall.done / overall.total) * 100) : 0;
        countEl.textContent = overall.done + " / " + overall.total + " pieces";

        if ("IntersectionObserver" in window) {
          var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                animateNumber(pctEl, 0, pct, "%", 900);
                if (roadmapFill) roadmapFill.style.width = pct + "%";
                io.disconnect();
              }
            });
          }, { threshold: 0.2 });
          io.observe(root);
        } else {
          pctEl.textContent = pct + "%";
          if (roadmapFill) roadmapFill.style.width = pct + "%";
        }
      })
      .catch(function (err) {
        listEl.innerHTML = "";
        countEl.textContent = "Manifest unavailable";
        pctEl.textContent = "—";
        var note = document.createElement("p");
        note.className = "data-error-note";
        note.textContent = "Couldn't load data/dev-stages.json (" + err.message + "). Serve this page over http(s) — a local server or GitHub Pages — rather than opening it as a local file.";
        listEl.appendChild(note);
      });
  })();

  /* ------------------------------------------------------------------ *
   * 16. Typewriter text
   * ------------------------------------------------------------------ */
  (function typewriter() {
    var els = $all("[data-typewriter]");
    if (!els.length || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-typing");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ------------------------------------------------------------------ *
   * 17. Back to top
   * ------------------------------------------------------------------ */
  (function backToTop() {
    var btn = $("#back-to-top");
    if (!btn) return;
    window.addEventListener("scroll", function () {
      btn.classList.toggle("is-visible", window.scrollY > window.innerHeight);
    }, { passive: true });
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  })();

  /* ------------------------------------------------------------------ *
   * 18. Ambient audio controls
   * ------------------------------------------------------------------ */
  (function audio() {
    var toggle = $("#audio-toggle");
    var slider = $("#volume-slider");
    var iconOn = $("#audio-icon-on");
    var iconOff = $("#audio-icon-off");
    var track = $("#ambient-audio");
    if (!toggle || !track) return;

    var playing = false;

    function setIcon() {
      if (iconOn) iconOn.style.display = playing ? "block" : "none";
      if (iconOff) iconOff.style.display = playing ? "none" : "block";
      toggle.setAttribute("aria-pressed", String(playing));
    }

    toggle.addEventListener("click", function () {
      // No real track is bundled by default (see index.html comment) —
      // this still flips the UI state so the control is ready for a real
      // audio file to be dropped into assets/audio/.
      if (track.querySelector("source")) {
        if (playing) { track.pause(); } else { track.play().catch(function () {}); }
      }
      playing = !playing;
      setIcon();
    });

    if (slider) {
      slider.addEventListener("input", function () {
        track.volume = clamp(Number(slider.value) / 100, 0, 1);
      });
      track.volume = clamp(Number(slider.value) / 100, 0, 1);
    }
  })();

  /* ------------------------------------------------------------------ *
   * 19. Easter eggs
   * ------------------------------------------------------------------ */
  (function easterEggs() {
    var toast = $("#secret-toast");
    var toastTimer = null;

    function showToast(message, duration) {
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add("is-visible");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toast.classList.remove("is-visible"); }, duration || 4200);
    }

    // Click the Elysium logo 5 times → unlock a secret message
    var logo = $("#logo-click-target");
    if (logo) {
      var logoClicks = 0;
      var logoClickTimer = null;
      logo.addEventListener("click", function (e) {
        logoClicks++;
        clearTimeout(logoClickTimer);
        logoClickTimer = setTimeout(function () { logoClicks = 0; }, 1200);
        if (logoClicks >= 5) {
          e.preventDefault();
          logoClicks = 0;
          showToast("The old magic recognizes you, traveler.");
        }
      });
    }

    // Konami code → special animation
    var konamiSeq = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    var konamiPos = 0;
    document.addEventListener("keydown", function (e) {
      var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === konamiSeq[konamiPos]) {
        konamiPos++;
        if (konamiPos === konamiSeq.length) {
          konamiPos = 0;
          if (!prefersReducedMotion) {
            document.body.classList.add("konami-active");
            setTimeout(function () { document.body.classList.remove("konami-active"); }, 1500);
          }
          showToast("A hidden rite awakens across Elysium…");
        }
      } else {
        konamiPos = key === konamiSeq[0] ? 1 : 0;
      }
    });
    // TheMonoMind signature easter egg
    var elysiumSeq = ["e", "l", "y", "s", "i", "u", "m"];
    var elysiumPos = 0;
    document.addEventListener("keydown", function (e) {
      var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === elysiumSeq[elysiumPos]) {
        elysiumPos++;
        if (elysiumPos === elysiumSeq.length) {
          elysiumPos = 0;
          if (!prefersReducedMotion) {
            document.body.classList.add("elysium-active");
            setTimeout(function () { document.body.classList.remove("elysium-active"); }, 1500);
          }
          showToast("Made by TheMonoMind")
        }
      } else {
        elysiumPos = key === elysiumSeq[0] ? 1 : 0;
      }
    });

    // Random rune clicks on stone dividers → hidden lore snippets
    var loreSnippets = [
      // The Sundering
      "Some say the Sundering was no accident at all.",
      "The Sundering began before the first bell of dawn.",
      "Kaelgorath did not destroy Elysium alone.",
      "The gods knew the Sundering was coming.",
      "The oldest records of the Sundering have been deliberately erased.",

      // Factions
      "The Duskward Pact was born from a broken promise.",
      "The first leaders of the Dawnbound Concord once fought beside the Pact.",
      "Solmere was not the first capital of the Dawnbound.",
      "Some Pact soldiers still carry symbols of the Concord.",
      "The Pact's founding oath has never been translated correctly.",

      // Vethmoor
      "Not every ruin in Vethmoor predates the Sundering.",
      "Something beneath Vethmoor still answers when its name is spoken.",
      "The ruins of Vethmoor were once connected by roads that no longer exist.",
      "Travelers who enter the northern ruins sometimes return speaking an unknown language.",
      "There are maps of Vethmoor that show places no living cartographer has found.",

      // Sylvaneth
      "Sylvaneth's oldest trees remember the Ancient Age.",
      "The oldest trees refuse to grow where blood has been spilled.",
      "Some Sylvaneth roots reach far deeper than the oldest known ruins.",
      "The druids stopped counting the rings of the First Tree centuries ago.",
      "The forest remembers people who have been forgotten by history.",

      // Gods
      "The gods did not always agree on what Elysium should become.",
      "Solthar's light cannot reach every corner of the world.",
      "Nyxara knows a name that the other gods have forgotten.",
      "Terravox sleeps beneath something no mortal has seen.",
      "Maelithir's storms have followed the same path since before the Sundering.",

      // Void Herald
      "The Void Herald has been seen more than once.",
      "The first account of the Void Herald predates the Sundering.",
      "Witnesses describe the Void Herald differently, yet all remember the same voice.",
      "The Void Herald does not appear in any surviving records of the Ancient Age.",
      "Some believe the Void Herald is not a person at all.",

      // Ancient Age
      "The Ancient Age ended long before the first kingdoms were founded.",
      "There are ruins older than the gods' oldest temples.",
      "The Ancient Age was not as peaceful as the songs suggest.",
      "Someone went to great lengths to erase the history of the Ancient Age.",
      "The oldest surviving inscription contains a warning, not a name.",

      // Cryptic
      "Do not trust the statues that face east.",
      "Seven lights. One shadow.",
      "The eighth was never meant to be remembered.",
      "When the moon disappears, listen for the bells.",
      "The stone remembers what the living forget.",
      "Some doors were buried for a reason.",
      "The ruins are not empty.",
      "You have been here before.",
      "Something is watching from beneath the world.",
      "The story you were told is incomplete."
    ];
    $all(".stone-edge").forEach(function (edge) {
      edge.style.pointerEvents = "auto";
      edge.style.cursor = "pointer";
      edge.addEventListener("click", function () {
        var pick = loreSnippets[Math.floor(Math.random() * loreSnippets.length)];
        showToast(pick, 3600);
      });
    });

    // Hidden developer mode: click the "Development" eyebrow label 3 times
    var devSection = $("#development");
    if (devSection) {
      var eyebrow = devSection.querySelector(".eyebrow");
      var journal = $("#dev-journal");
      if (eyebrow && journal) {
        var devClicks = 0;
        eyebrow.style.cursor = "pointer";
        eyebrow.addEventListener("click", function () {
          devClicks++;
          if (devClicks >= 3) {
            devClicks = 0;
            journal.classList.toggle("is-open");
            if (journal.classList.contains("is-open")) {
              journal.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
            }
          }
        });
      }
    }

    // Fake game launcher button — playful "coming soon" interaction
    var launcher = $("#dev-launcher-btn");
    if (launcher) {
      launcher.addEventListener("click", function () {
        showToast("Elysium is still being forged. Check back soon.", 3200);
      });
    }
  })();

})();
