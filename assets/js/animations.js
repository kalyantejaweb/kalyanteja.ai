/* ============================================================
   KALYANTEJA — GSAP & AOS Animations
   ============================================================ */

(() => {
  "use strict";

  /* ---------- AOS Init ---------- */
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 800,
      easing: "ease-out-cubic",
      once: true,
      offset: 80,
      disable: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Industries: blur text + JS pill drop (mtouch-style) ---------- */
  const splitBlurText = () => {
    document.querySelectorAll("[data-blur-text]").forEach((el) => {
      if (el.dataset.blurReady) return;
      const text = el.textContent || "";
      el.textContent = "";
      el.style.display = "inline-block";
      let delay = 0;
      text.split(/(\s+)/).forEach((chunk) => {
        if (/^\s+$/.test(chunk)) {
          el.appendChild(document.createTextNode(chunk));
          return;
        }
        const word = document.createElement("span");
        word.style.display = "inline-block";
        word.style.whiteSpace = "nowrap";
        [...chunk].forEach((ch) => {
          const span = document.createElement("span");
          span.className = "blur-text-char";
          span.style.animationDelay = `${delay}s`;
          span.textContent = ch;
          word.appendChild(span);
          delay += 0.07; /* slower letter reveal */
        });
        el.appendChild(word);
      });
      el.dataset.blurReady = "1";
    });
  };

  if (!reduceMotion) splitBlurText();

  const wrap = document.getElementById("indPillsWrap");
  const pills = wrap ? [...wrap.querySelectorAll("[data-ind-pill]")] : [];
  const indSection = document.getElementById("industries");

  if (wrap && pills.length) {
    const isMobile = () => window.matchMedia("(max-width: 768px)").matches;
    const targets = new Map();
    let settled = false;
    let animating = false;
    let hasPlayed = false;

    const placeRow = (rowPills, y, gap, wrapW) => {
      const widths = rowPills.map((p) => p.offsetWidth);
      const total = widths.reduce((a, b) => a + b, 0) + gap * Math.max(rowPills.length - 1, 0);
      let x = Math.max(0, (wrapW - total) / 2);
      rowPills.forEach((p, i) => {
        targets.set(p, { x, y });
        x += widths[i] + gap;
      });
    };

    const computeTargets = () => {
      if (isMobile() || reduceMotion) {
        pills.forEach((p) => {
          p.style.transform = "";
          p.style.opacity = "1";
        });
        return false;
      }

      const gap = 14;
      const wrapW = wrap.clientWidth;
      const H = wrap.clientHeight || 320;
      const pillH = pills[0].offsetHeight || 46;
      const tops = pills.filter((p) => p.dataset.slot === "top");
      const bases = pills.filter((p) => p.dataset.slot === "base");
      if (!tops.length || !bases.length) return false;

      /* Split base pills into up to 2 centered rows */
      const mid = Math.ceil(bases.length / 2);
      const baseRow1 = bases.slice(0, mid);
      const baseRow2 = bases.slice(mid);
      const rowGap = pillH + 12;
      const bottomY = Math.max(H - pillH - 10, H * 0.78);
      const midY = bottomY - (baseRow2.length ? rowGap : 0);
      const topY = Math.round(H * (131 / 320));

      if (baseRow2.length) placeRow(baseRow2, bottomY, gap, wrapW);
      placeRow(baseRow1, midY, gap, wrapW);

      /* Top pills centered above the upper base row */
      placeRow(tops, Math.min(topY, midY - rowGap), gap + 28, wrapW);
      return true;
    };

    const applyTargets = () => {
      pills.forEach((p) => {
        const t = targets.get(p);
        if (!t) return;
        p.style.transform = `translate(${t.x}px, ${t.y}px)`;
        p.style.opacity = "1";
      });
    };

    const playBlurText = () => {
      document
        .querySelectorAll("#industries .blur-text-char")
        .forEach((ch) => ch.classList.add("in-view"));
    };

    const dropIn = () => {
      if (hasPlayed || settled || animating) return;
      hasPlayed = true;
      playBlurText();

      if (!computeTargets()) {
        settled = true;
        return;
      }

      animating = true;
      const midX = wrap.clientWidth / 2;

      pills.forEach((p, i) => {
        const startX = midX - p.offsetWidth / 2 + (i - pills.length / 2) * 28;
        const startY = 24 + (i % 4) * 8;
        p.style.transition = "none";
        p.style.opacity = "0";
        p.style.transform = `translate(${startX}px, ${startY}px) rotate(${(i % 5) - 2}deg)`;
      });

      requestAnimationFrame(() => {
        pills.forEach((p, i) => {
          const t = targets.get(p);
          const delay = 0.35 + i * 0.1;
          p.style.transition = `transform 1.65s cubic-bezier(0.22, 1.15, 0.36, 1) ${delay}s, opacity 0.7s ease ${delay}s`;
          p.style.opacity = "1";
          p.style.transform = `translate(${t.x}px, ${t.y}px) rotate(0deg)`;
        });

        window.setTimeout(() => {
          pills.forEach((p) => {
            p.style.transition = "transform 0.45s cubic-bezier(0.34, 1.4, 0.64, 1), filter 0.3s ease";
          });
          settled = true;
          animating = false;
        }, 3500);
      });
    };

    if (indSection) {
      const sectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting || hasPlayed) return;
            dropIn();
            sectionObserver.disconnect();
          });
        },
        {
          threshold: 0.35,
          rootMargin: "0px 0px -10% 0px",
        }
      );
      sectionObserver.observe(indSection);
    }

    pills.forEach((p) => {
      p.addEventListener("mouseenter", () => {
        if (!settled || isMobile() || reduceMotion) return;
        const t = targets.get(p);
        if (!t) return;
        p.style.zIndex = "8";
        p.style.transform = `translate(${t.x}px, ${t.y - 14}px)`;
      });
      p.addEventListener("mouseleave", () => {
        if (!settled || isMobile() || reduceMotion) return;
        const t = targets.get(p);
        if (!t) return;
        p.style.zIndex = p.classList.contains("ind-pill--top") ? "5" : "2";
        p.style.transform = `translate(${t.x}px, ${t.y}px)`;
      });
    });

    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (!settled) return;
        if (computeTargets()) applyTargets();
      }, 120);
    });
  }

  if (reduceMotion || typeof gsap === "undefined") return;

  /* ---------- Register ScrollTrigger ---------- */
  if (typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ---------- Hero Entrance ---------- */
  const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });

  if (document.querySelector(".hero-content")) {
    heroTl
      .from(".hero-content .eyebrow", { y: 30, opacity: 0, duration: 0.7 })
      .from(".hero-title", { y: 40, opacity: 0, duration: 0.8 }, "-=0.4")
      .from(".hero-subtitle", { y: 30, opacity: 0, duration: 0.7 }, "-=0.45")
      .from(".btn-group-hero .btn", { y: 20, opacity: 0, duration: 0.5, stagger: 0.12 }, "-=0.35");
  }

  if (document.querySelector(".hero-visual")) {
    gsap.from(".hero-dashboard", {
      scale: 0.92,
      opacity: 0,
      duration: 1,
      delay: 0.3,
      ease: "power3.out",
    });
    gsap.from(".hero-float-card, .tech-badge", {
      scale: 0,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      delay: 0.7,
      ease: "back.out(1.6)",
    });
  }

  /* ---------- Page Hero ---------- */
  if (document.querySelector(".page-hero h1")) {
    gsap.from(".page-hero h1, .page-hero p, .breadcrumb-nav", {
      y: 30,
      opacity: 0,
      duration: 0.7,
      stagger: 0.12,
      ease: "power3.out",
    });
  }

  /* ---------- Mouse Parallax (Hero) ---------- */
  const hero = document.querySelector(".hero");
  if (hero && window.innerWidth > 991) {
    const layers = hero.querySelectorAll("[data-parallax]");
    hero.addEventListener("mousemove", (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      layers.forEach((layer) => {
        const depth = parseFloat(layer.dataset.parallax) || 10;
        gsap.to(layer, {
          x: x * depth,
          y: y * depth,
          duration: 0.6,
          ease: "power2.out",
          overwrite: "auto",
        });
      });
    });
  }

  /* ---------- Particles ---------- */
  const particleHost = document.querySelector(".hero-particles");
  if (particleHost) {
    const count = window.innerWidth < 768 ? 18 : 36;
    for (let i = 0; i < count; i++) {
      const dot = document.createElement("span");
      dot.className = "particle";
      const size = 2 + Math.random() * 4;
      Object.assign(dot.style, {
        width: `${size}px`,
        height: `${size}px`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        background: i % 3 === 0 ? "#00D4FF" : i % 3 === 1 ? "#0A5BFF" : "#F472B6",
        animationDelay: `${Math.random() * 6}s`,
        animationDuration: `${6 + Math.random() * 6}s`,
      });
      particleHost.appendChild(dot);
    }
  }

  /* ---------- Typing Effect ---------- */
  const typingEl = document.querySelector("[data-typing]");
  if (typingEl) {
    const phrases = JSON.parse(typingEl.dataset.typing || "[]");
    if (phrases.length) {
      let phraseIndex = 0;
      let charIndex = 0;
      let deleting = false;

      const type = () => {
        const current = phrases[phraseIndex];
        if (!deleting) {
          typingEl.textContent = current.slice(0, ++charIndex);
          if (charIndex === current.length) {
            deleting = true;
            setTimeout(type, 1800);
            return;
          }
        } else {
          typingEl.textContent = current.slice(0, --charIndex);
          if (charIndex === 0) {
            deleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
          }
        }
        setTimeout(type, deleting ? 40 : 70);
      };
      typingEl.classList.add("typing-cursor");
      type();
    }
  }

  /* ---------- Scroll Reveals for Cards ---------- */
  if (typeof ScrollTrigger !== "undefined") {
    gsap.utils.toArray(".premium-card, .why-card, .process-step").forEach((card, i) => {
      /* Skip elements already handled by AOS to avoid opacity:0 conflicts */
      if (card.hasAttribute("data-aos") || card.closest("[data-aos]")) return;

      gsap.fromTo(
        card,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          delay: (i % 4) * 0.08,
          ease: "power2.out",
          immediateRender: false,
          clearProps: "opacity,transform",
          scrollTrigger: {
            trigger: card,
            start: "top 90%",
            toggleActions: "play none none none",
            once: true,
          },
        }
      );
    });

    /* tech-item carousel handled by Swiper — skip GSAP opacity locks */

    /*
     * Section titles use AOS (data-aos) — do NOT run GSAP opacity:0 on them.
     * Dual animation left headings stuck invisible via inline opacity: 0.
     */
  }

  /* Ensure any leftover GSAP/AOS opacity locks are cleared */
  document.querySelectorAll(".section-header, .section-header *").forEach((el) => {
    if (el.style && el.style.opacity === "0") {
      el.style.opacity = "";
      el.style.transform = "";
    }
  });

  /* Force trust logos strip visible (was stuck at opacity:0) */
  document.querySelectorAll(".hero-delivered, .hero-delivered *").forEach((el) => {
    el.style.opacity = "1";
    el.style.visibility = "visible";
  });
  const delivered = document.querySelector(".hero-delivered");
  if (delivered) delivered.style.transform = "none";

  /* ---------- Floating Elements Continuous ---------- */
  document.querySelectorAll(".blob").forEach((blob, i) => {
    gsap.to(blob, {
      x: (i % 2 === 0 ? 40 : -30),
      y: (i % 2 === 0 ? -25 : 35),
      duration: 8 + i * 2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  });

  /* ---------- Magical Hover for Service Icons ---------- */
  document.querySelectorAll(".premium-card").forEach((card) => {
    card.addEventListener("mouseenter", () => {
      const icon = card.querySelector(".card-icon");
      if (icon) {
        gsap.to(icon, { rotation: 8, scale: 1.1, duration: 0.35, ease: "power2.out" });
      }
    });
    card.addEventListener("mouseleave", () => {
      const icon = card.querySelector(".card-icon");
      if (icon) {
        gsap.to(icon, { rotation: 0, scale: 1, duration: 0.35, ease: "power2.out" });
      }
    });
  });
})();
