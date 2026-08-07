/* ==========================================================================
   ELYSIUM — Ambient Particle System
   Lightweight canvas particle field: floating magical dust that reacts
   gently to mouse movement. Runs on requestAnimationFrame, throttled to
   a sane particle count, and disabled entirely under prefers-reduced-motion.
   ========================================================================== */

(function () {
  "use strict";

  function ElysiumParticles(canvas, options) {
    if (!canvas) return null;

    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      canvas.style.display = "none";
      return null;
    }

    var ctx = canvas.getContext("2d");
    var opts = Object.assign({
      count: window.innerWidth < 720 ? 45 : 90,
      colors: ["#c9a86a", "#e8cd8a", "#8fb3d9"],
      minRadius: 0.6,
      maxRadius: 2.1,
      speed: 0.18,
      mouseInfluence: 34
    }, options || {});

    var particles = [];
    var width = 0, height = 0;
    var mouse = { x: -9999, y: -9999 };
    var rafId = null;
    var running = true;

    function resize() {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeParticle() {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        r: opts.minRadius + Math.random() * (opts.maxRadius - opts.minRadius),
        vx: (Math.random() - 0.5) * opts.speed,
        vy: -Math.random() * opts.speed - 0.03,
        alpha: Math.random() * 0.6 + 0.15,
        alphaDir: Math.random() > 0.5 ? 1 : -1,
        color: opts.colors[Math.floor(Math.random() * opts.colors.length)],
        drift: Math.random() * Math.PI * 2
      };
    }

    function init() {
      resize();
      particles = [];
      for (var i = 0; i < opts.count; i++) particles.push(makeParticle());
    }

    function step() {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];

        p.drift += 0.004;
        p.x += p.vx + Math.sin(p.drift) * 0.06;
        p.y += p.vy;

        // Gentle attraction/repulsion near the pointer
        var dx = p.x - mouse.x;
        var dy = p.y - mouse.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < opts.mouseInfluence * 3 && dist > 0.01) {
          var force = (opts.mouseInfluence * 3 - dist) / (opts.mouseInfluence * 3);
          p.x += (dx / dist) * force * 0.6;
          p.y += (dy / dist) * force * 0.6;
        }

        p.alpha += 0.0025 * p.alphaDir;
        if (p.alpha > 0.75 || p.alpha < 0.1) p.alphaDir *= -1;

        if (p.y < -10) { p.y = height + 10; p.x = Math.random() * width; }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.r * 3;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(step);
    }

    window.addEventListener("resize", function () {
      resize();
    });

    window.addEventListener("mousemove", function (e) {
      var rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    window.addEventListener("mouseleave", function () {
      mouse.x = -9999;
      mouse.y = -9999;
    });

    // Pause the animation loop when the hero is off-screen to save cycles
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          running = entry.isIntersecting;
          if (running && !rafId) rafId = requestAnimationFrame(step);
          if (!running && rafId) { cancelAnimationFrame(rafId); rafId = null; }
        });
      }, { threshold: 0.05 });
      io.observe(canvas);
    }

    init();
    rafId = requestAnimationFrame(step);

    return {
      destroy: function () {
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
      }
    };
  }

  window.ElysiumParticles = ElysiumParticles;
})();
