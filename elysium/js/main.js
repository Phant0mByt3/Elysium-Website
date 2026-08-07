/* ==========================================================================
   ELYSIUM — Main Interaction Script
   Vanilla JS only. Organized by feature; each block is self-contained and
   guarded so missing elements never throw. Search for the numbered
   headers to jump to a feature.

   1. Utilities
   2. Cinematic loading sequence
   3. Navigation (scroll spy, mobile menu, smooth scroll, transition sweep)
   4. Custom cursor
   5. Hero particle field
   6. Letter-by-letter title reveal
   7. Scroll reveal (Intersection Observer)
   8. Class card stat bars
   9. Timeline (Lore)
   10. Interactive world map
   11. Gallery + lightbox
   12. Development progress bars + roadmap
   13. Typewriter text
   14. Back to top
   15. Ambient audio controls
   16. Easter eggs (logo clicks, Konami code, rune clicks, dev journal)
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

  /* ------------------------------------------------------------------ *
   * 2. Cinematic loading sequence
   * ------------------------------------------------------------------ */
  (function loadingSequence() {
    var screen = $("#loading-screen");
    var statusEl = $("#loading-status");
    var barFill = $("#loading-bar-fill");
    if (!screen) return;

    document.body.classList.add("no-scroll");

    var messages = [
      "Awakening the world of Elysium…",
      "Loading ancient memories…",
      "Preparing your journey…"
    ];
    var msgIndex = 0;
    var progress = 0;

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
      setTimeout(function () {
        screen.classList.add("is-hidden");
        document.body.classList.remove("no-scroll");
        screen.setAttribute("aria-hidden", "true");
        revealHeroOnLoad();
      }, 350);
    }

    // Absolute safety net: never trap the user behind the loading screen
    setTimeout(function () {
      if (!screen.classList.contains("is-hidden")) finishLoading();
    }, 4000);
  })();

  function revealHeroOnLoad() {
    var letters = $("#hero-title");
    if (letters) letters.classList.add("is-revealed");
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

    $all("a, button, .map-marker, .gallery-item").forEach(function (el) {
      el.addEventListener("mouseenter", function () { dot.classList.add("is-active"); });
      el.addEventListener("mouseleave", function () { dot.classList.remove("is-active"); });
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
   * 6. Letter-by-letter title reveal
   * ------------------------------------------------------------------ */
  (function letterReveal() {
    var target = $("#hero-title");
    if (!target) return;
    var text = target.textContent.trim();
    target.textContent = "";
    text.split("").forEach(function (ch, i) {
      var span = document.createElement("span");
      span.textContent = ch === " " ? "\u00A0" : ch;
      span.style.animationDelay = (i * 0.055) + "s";
      target.appendChild(span);
    });
  })();

  /* ------------------------------------------------------------------ *
   * 7. Scroll reveal (Intersection Observer)
   * ------------------------------------------------------------------ */
  (function scrollReveal() {
    var targets = $all(".reveal");
    if (!targets.length) return;

    if (!("IntersectionObserver" in window) || prefersReducedMotion) {
      targets.forEach(function (t) { t.classList.add("is-visible"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

    targets.forEach(function (t) { io.observe(t); });
  })();

  /* ------------------------------------------------------------------ *
   * 8. Class card stat bars
   * ------------------------------------------------------------------ */
  (function classStats() {
    var cards = $all(".class-card");
    if (!cards.length || !("IntersectionObserver" in window)) {
      cards.forEach(function (c) { c.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    cards.forEach(function (c) { io.observe(c); });
  })();

  /* ------------------------------------------------------------------ *
   * 9. Timeline (Lore)
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
   * 10. Interactive world map
   * ------------------------------------------------------------------ */
  (function worldMap() {
    var markers = $all(".map-marker");
    var modal = $("#map-modal");
    var modalTitle = $("#map-modal-title");
    var modalBody = $("#map-modal-body");
    var closeBtn = $("#map-modal-close");
    if (!markers.length || !modal) return;

    var regionInfo = {
      aurelia: {
        title: "Aurelia",
        body: "A prosperous land of kingdoms, forests, ancient ruins, and forgotten secrets. Recommended for characters level 1–30."
      },
      vethmoor: {
        title: "Vethmoor",
        body: "A harsh continent shaped by war, corruption, and ancient conflicts. Dangers here scale sharply — recommended for level 30–60 adventurers."
      },
      sylvaneth: {
        title: "Sylvaneth — Expansion Preview",
        body: "A mystical forest expansion built around ancient nature magic and the secrets kept by its oldest trees. Coming in a future update."
      },
      kharzul: {
        title: "Kharzul Wastes — Expansion Preview",
        body: "A dangerous desert region hiding a forgotten civilization beneath its dunes. Coming in a future update."
      },
      nightreach: {
        title: "Nightreach — Endgame Preview",
        body: "A dark endgame region shrouded in corruption from the Sundering. Reserved for Elysium's most seasoned heroes. Coming in a future update."
      }
    };

    function openModal(key) {
      var info = regionInfo[key];
      if (!info) return;
      modalTitle.textContent = info.title;
      modalBody.textContent = info.body;
      modal.classList.add("is-open");
    }
    function closeModal() { modal.classList.remove("is-open"); }

    markers.forEach(function (m) {
      m.addEventListener("click", function () { openModal(m.getAttribute("data-location")); });
      m.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(m.getAttribute("data-location")); }
      });
    });

    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });
  })();

  /* ------------------------------------------------------------------ *
   * 11. Gallery + lightbox
   * ------------------------------------------------------------------ */
  (function gallery() {
    var grid = $("#gallery-grid");
    var tabs = $all(".gallery-tab");
    var lightbox = $("#lightbox-modal");
    var lightboxTitle = $("#lightbox-title");
    var lightboxArt = $("#lightbox-art");
    var lightboxClose = $("#lightbox-close");
    if (!grid) return;

    // Placeholder gallery items — swap `art` for a real <img> once assets exist.
    var items = [
      { label: "Aurelia at Dawn", type: "screenshot", grad: ["#16273f", "#131217"] },
      { label: "The Forgotten King — Concept", type: "concept", grad: ["#7d2b2b", "#131217"] },
      { label: "Continental Map, Pre-Sundering", type: "map", grad: ["#0d1b2e", "#1c1a20"] },
      { label: "Ranger — Character Study", type: "character", grad: ["#26232b", "#16273f"] },
      { label: "Vethmoor Ridgeline", type: "environment", grad: ["#131217", "#7d2b2b"] },
      { label: "Sylvaneth Canopy — Concept", type: "concept", grad: ["#1c1a20", "#4c6a4a"] },
      { label: "Kharzul Ruins", type: "environment", grad: ["#131217", "#8a7038"] },
      { label: "The Void Herald — Concept", type: "concept", grad: ["#131217", "#6b4a9e"] }
    ];

    function svgFor(item) {
      return (
        '<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">' +
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="' + item.grad[0] + '"/><stop offset="1" stop-color="' + item.grad[1] + '"/>' +
        '</linearGradient></defs>' +
        '<rect width="400" height="300" fill="url(#g)"/>' +
        '<path d="M0 220 Q100 180 200 210 T400 190" stroke="#c9a86a" stroke-width="1" fill="none" opacity="0.35"/>' +
        '</svg>'
      );
    }

    items.forEach(function (item, i) {
      var el = document.createElement("div");
      el.className = "gallery-item reveal";
      el.style.setProperty("--i", i);
      el.setAttribute("data-type", item.type);
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "button");
      el.setAttribute("aria-label", "View " + item.label);
      el.innerHTML = svgFor(item) + '<span class="label">' + item.label + '</span>';
      grid.appendChild(el);

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

    // Re-run reveal observer for dynamically added items
    if ("IntersectionObserver" in window && !prefersReducedMotion) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
        });
      }, { threshold: 0.1 });
      $all(".gallery-item").forEach(function (t) { io.observe(t); });
    } else {
      $all(".gallery-item").forEach(function (t) { t.classList.add("is-visible"); });
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.classList.remove("is-active"); });
        tab.classList.add("is-active");
        var filter = tab.getAttribute("data-filter");
        $all(".gallery-item").forEach(function (el) {
          var show = filter === "all" || el.getAttribute("data-type") === filter;
          el.style.display = show ? "" : "none";
        });
      });
    });

    if (lightboxClose) lightboxClose.addEventListener("click", function () { lightbox.classList.remove("is-open"); });
    if (lightbox) {
      lightbox.addEventListener("click", function (e) { if (e.target === lightbox) lightbox.classList.remove("is-open"); });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lightbox) lightbox.classList.remove("is-open");
    });
  })();

  /* ------------------------------------------------------------------ *
   * 12. Development progress bars + roadmap
   * ------------------------------------------------------------------ */
  (function devProgress() {
    var bars = $all(".progress-fill");
    var roadmapFill = $("#roadmap-fill");
    var roadmapSection = $("#development");
    if (!roadmapSection) return;

    function trigger() {
      bars.forEach(function (bar) {
        var val = bar.getAttribute("data-progress") || "0";
        bar.style.width = val + "%";
      });
      if (roadmapFill) roadmapFill.style.width = "50%"; // two of four phases underway
    }

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { trigger(); io.disconnect(); }
        });
      }, { threshold: 0.3 });
      io.observe(roadmapSection);
    } else {
      trigger();
    }
  })();

  /* ------------------------------------------------------------------ *
   * 13. Typewriter text
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
   * 14. Back to top
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
   * 15. Ambient audio controls
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
   * 16. Easter eggs
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

    // Random rune clicks on stone dividers → hidden lore snippets
    var loreSnippets = [
      "Some say the Sundering was no accident at all.",
      "The Shadow Covenant was born from a broken promise.",
      "Not every ruin in Vethmoor predates the Sundering.",
      "Sylvaneth's oldest trees remember the Ancient Age.",
      "The Void Herald has been seen more than once."
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
