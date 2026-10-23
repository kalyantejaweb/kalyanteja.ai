/* ============================================================
   KALYANTEJA — Main JavaScript
   ============================================================ */

(() => {
  "use strict";

  /* ---------- Sticky Navbar ---------- */
  const header = document.querySelector(".site-header");
  const headerBar = document.querySelector(".header-bar");
  const navCollapse = document.getElementById("mainNav");
  const onScroll = () => {
    if (!header) return;
    /* Floating pill only strengthens shadow — never becomes a full-width bar */
    header.classList.toggle("scrolled", window.scrollY > 24);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Pill softens corners when mobile menu opens */
  if (navCollapse && headerBar) {
    navCollapse.addEventListener("show.bs.collapse", () => headerBar.classList.add("is-open"));
    navCollapse.addEventListener("hide.bs.collapse", () => headerBar.classList.remove("is-open"));
  }

  /* ---------- Active Nav Link ---------- */
  const pathSegment = location.pathname.split("/").pop() || "";
  const currentPage = pathSegment.replace(/\.html$/i, "").toLowerCase() || "index";
  const pagesUnderDropdown = ["about", "gallery", "careers", "blog", "faq"];

  document.querySelectorAll(".navbar-nav .nav-link, .navbar-nav .dropdown-item").forEach((link) => {
    link.classList.remove("active");
    link.removeAttribute("aria-current");
    const raw = (link.getAttribute("href") || "").split("#")[0];
    const href = raw.split("/").pop().replace(/\.html$/i, "").toLowerCase() || (raw === "/" ? "index" : "");
    if (!href || href === "#") return;
    if (href === currentPage || (currentPage === "index" && (href === "index" || href === ""))) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });

  /* Highlight parent dropdown when a child page is active */
  if (pagesUnderDropdown.includes(currentPage)) {
    const pagesToggle = document.querySelector("#pagesDropdown");
    if (pagesToggle) pagesToggle.classList.add("active");
  }

  /* ---------- Smooth Scroll ---------- */
  document.querySelectorAll('a[href*="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const raw = anchor.getAttribute("href");
      if (!raw || raw === "#") return;
      const hashIndex = raw.indexOf("#");
      if (hashIndex === -1) return;
      const pathPart = raw.slice(0, hashIndex);
      const id = raw.slice(hashIndex);
      const currentFile = location.pathname.split("/").pop() || "index.html";
      const isSamePage =
        !pathPart ||
        pathPart === currentFile ||
        (pathPart === "index.html" && (currentFile === "index.html" || currentFile === ""));
      if (!isSamePage) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      const collapse = document.querySelector(".navbar-collapse.show");
      if (collapse && window.bootstrap) {
        bootstrap.Collapse.getInstance(collapse)?.hide();
      }
    });
  });

  /* ---------- Back to Top ---------- */
  const backBtn = document.querySelector(".back-to-top");
  if (backBtn) {
    window.addEventListener(
      "scroll",
      () => {
        backBtn.classList.toggle("visible", window.scrollY > 500);
      },
      { passive: true }
    );
    backBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- Button Ripple ---------- */
  document.querySelectorAll(".btn").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });

  /* ---------- Animated Counters ---------- */
  const animateCounter = (el) => {
    const target = parseFloat(el.dataset.count) || 0;
    const suffix = el.dataset.suffix || "";
    const duration = 2000;
    const start = performance.now();
    const isFloat = String(el.dataset.count).includes(".");

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      el.textContent = (isFloat ? value.toFixed(0) : Math.floor(value)) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = (isFloat ? target : Math.floor(target)) + suffix;
    };
    requestAnimationFrame(tick);
  };

  const counterObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll("[data-count]").forEach(animateCounter);
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.35 }
  );

  document.querySelectorAll(".stats-bar, .hero-stats, .counter-group").forEach((group) => {
    counterObserver.observe(group);
  });

  /* ---------- Portfolio Filters ---------- */
  const filterBtns = document.querySelectorAll(".filter-btn");
  const portfolioCards = document.querySelectorAll(".portfolio-card");

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.dataset.filter || "all";

      portfolioCards.forEach((card) => {
        const cat = card.dataset.category || "";
        const show = filter === "all" || cat.includes(filter);
        card.style.display = show ? "" : "none";
        if (show && typeof gsap !== "undefined") {
          gsap.fromTo(card, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
        }
      });
    });
  });

  /* ---------- Contact Form Validation ---------- */
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      let valid = true;

      contactForm.querySelectorAll("[required]").forEach((field) => {
        const value = field.value.trim();
        let fieldValid = value.length > 0;

        if (field.type === "email" && value) {
          fieldValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        }
        if (field.type === "tel" && value) {
          fieldValid = /^[+]?[\d\s\-()]{7,}$/.test(value);
        }

        field.classList.toggle("is-invalid", !fieldValid);
        field.classList.toggle("is-valid", fieldValid);
        if (!fieldValid) valid = false;
      });

      if (!valid) return;

      const btn = contactForm.querySelector('[type="submit"]');
      const original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

      setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
        btn.classList.add("btn-success");
        contactForm.reset();
        contactForm.querySelectorAll(".is-valid").forEach((f) => f.classList.remove("is-valid"));

        setTimeout(() => {
          btn.disabled = false;
          btn.innerHTML = original;
          btn.classList.remove("btn-success");
        }, 2800);
      }, 1200);
    });

    contactForm.querySelectorAll("input, textarea, select").forEach((field) => {
      field.addEventListener("input", () => {
        field.classList.remove("is-invalid");
      });
    });
  }

  /* ---------- Newsletter ---------- */
  const newsForm = document.getElementById("newsletterForm");
  if (newsForm) {
    newsForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = newsForm.querySelector('input[type="email"]');
      if (!input?.value.trim()) return;
      const btn = newsForm.querySelector("button");
      const original = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i>';
      input.value = "";
      setTimeout(() => {
        btn.innerHTML = original;
      }, 2000);
    });
  }

  /* ---------- Testimonials Swiper ---------- */
  if (typeof Swiper !== "undefined" && document.querySelector(".testimonials-swiper")) {
    new Swiper(".testimonials-swiper", {
      slidesPerView: 1,
      spaceBetween: 24,
      loop: true,
      autoplay: { delay: 4500, disableOnInteraction: false },
      pagination: { el: ".swiper-pagination", clickable: true },
      breakpoints: {
        768: { slidesPerView: 2 },
        1100: { slidesPerView: 3 },
      },
    });
  }

  /* ---------- Technologies — smooth continuous glide (no remount) ---------- */
  const techViewport = document.getElementById("techViewport");
  const techTrack = document.getElementById("techTrack");
  if (techViewport && techTrack) {
    const techs = [
      { icon: "fab fa-html5", name: "HTML5" },
      { icon: "fab fa-css3-alt", name: "CSS3" },
      { icon: "fab fa-bootstrap", name: "Bootstrap" },
      { icon: "fab fa-js", name: "JavaScript" },
      { icon: "fab fa-js", name: "TypeScript" },
      { icon: "fab fa-angular", name: "Angular" },
      { icon: "fab fa-react", name: "React" },
      { icon: "fab fa-vuejs", name: "Vue" },
      { icon: "fab fa-react", name: "Next.js" },
      { icon: "fab fa-node-js", name: "Node.js" },
      { icon: "fas fa-server", name: "Express" },
      { icon: "fab fa-microsoft", name: ".NET" },
      { icon: "fab fa-java", name: "Java" },
      { icon: "fas fa-leaf", name: "Spring Boot" },
      { icon: "fab fa-php", name: "PHP" },
      { icon: "fab fa-laravel", name: "Laravel" },
      { icon: "fab fa-python", name: "Python" },
      { icon: "fas fa-code", name: "Django" },
      { icon: "fas fa-mobile", name: "Flutter" },
      { icon: "fab fa-react", name: "React Native" },
      { icon: "fab fa-aws", name: "AWS" },
      { icon: "fab fa-microsoft", name: "Azure" },
      { icon: "fab fa-google", name: "Google Cloud" },
      { icon: "fab fa-docker", name: "Docker" },
      { icon: "fas fa-dharmachakra", name: "Kubernetes" },
      { icon: "fas fa-cube", name: "Terraform" },
      { icon: "fab fa-jenkins", name: "Jenkins" },
      { icon: "fab fa-github", name: "GitHub" },
      { icon: "fab fa-gitlab", name: "GitLab" },
      { icon: "fas fa-database", name: "MySQL" },
      { icon: "fas fa-leaf", name: "MongoDB" },
      { icon: "fas fa-database", name: "PostgreSQL" },
      { icon: "fas fa-bolt", name: "Redis" },
      { icon: "fas fa-database", name: "Oracle" },
    ];

    const focusEl = document.getElementById("techFocusName");
    const dotsEl = document.getElementById("techDots");

    const buildCards = (list) =>
      list
        .map(
          (t) =>
            `<article class="tech-card-glide" data-name="${t.name}"><i class="${t.icon}"></i><span>${t.name}</span></article>`
        )
        .join("");

    techTrack.innerHTML = buildCards(techs) + buildCards(techs);
    const cards = [...techTrack.querySelectorAll(".tech-card-glide")];

    if (dotsEl) {
      const dotCount = Math.min(8, techs.length);
      dotsEl.innerHTML = Array.from({ length: dotCount }, () => "<span></span>").join("");
    }

    let step = 164;
    let cardW = 148;
    let loopWidth = techs.length * step;
    let offset = 0;
    let paused = false;
    let animating = false;
    let lastFocus = "";
    let lastTs = 0;
    const SPEED = 32; /* px / second — steady glide */

    const measure = () => {
      const first = cards[0];
      if (!first) return;
      const gap = parseFloat(getComputedStyle(techTrack).gap) || 16;
      cardW = first.offsetWidth || 148;
      step = cardW + gap;
      loopWidth = techs.length * step;
    };

    const normalize = () => {
      if (loopWidth <= 0) return;
      while (offset <= -loopWidth) offset += loopWidth;
      while (offset > 0) offset -= loopWidth;
    };

    const setFocus = (name) => {
      if (!focusEl || !name || name === lastFocus) return;
      lastFocus = name;
      focusEl.classList.add("is-swapping");
      window.setTimeout(() => {
        focusEl.textContent = name;
        focusEl.classList.remove("is-swapping");
      }, 160);
    };

    const updateDepth = () => {
      const mid = techViewport.clientWidth / 2;
      let closest = null;
      let closestDist = Infinity;

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const cardMid = offset + i * step + cardW / 2;
        const dist = cardMid - mid;
        const abs = Math.abs(dist);
        const t = Math.min(abs / (step * 2.4), 1);
        const scale = 1.08 - t * 0.18;
        const opacity = 1 - t * 0.48;
        const rotateY = (dist / step) * -8;
        const lift = (1 - t) * -5;

        card.style.transform = `translate3d(0, ${lift}px, 0) rotateY(${rotateY}deg) scale(${scale})`;
        card.style.opacity = String(Math.max(0.35, opacity));

        const isCenter = abs < step * 0.4;
        if (card.classList.contains("is-center") !== isCenter) {
          card.classList.toggle("is-center", isCenter);
        }

        if (abs < closestDist) {
          closestDist = abs;
          closest = card;
        }
      }

      if (closest) {
        const name = closest.dataset.name || "";
        setFocus(name);
        if (dotsEl) {
          const idx = techs.findIndex((t) => t.name === name);
          const dotCount = dotsEl.children.length || 1;
          const active = ((idx % dotCount) + dotCount) % dotCount;
          [...dotsEl.children].forEach((d, i) => d.classList.toggle("is-on", i === active));
        }
      }
    };

    const render = () => {
      techTrack.style.transform = `translate3d(${offset}px, 0, 0)`;
      updateDepth();
    };

    const settleStart = () => {
      measure();
      const viewW = techViewport.clientWidth || 900;
      offset = viewW / 2 - cardW / 2 - step * 2;
      normalize();
      render();
    };

    const tick = (ts) => {
      if (!lastTs) lastTs = ts;
      const dt = Math.min((ts - lastTs) / 1000, 0.048);
      lastTs = ts;

      if (!paused && !animating) {
        offset -= SPEED * dt;
        normalize();
        render();
      } else if (!animating) {
        updateDepth();
      }
      requestAnimationFrame(tick);
    };

    const glideBy = (dir) => {
      if (animating) return;
      animating = true;
      paused = true;
      measure();
      const start = offset;
      const target = offset - dir * step;
      const dur = 700;
      const t0 = performance.now();
      const ease = (x) => 1 - Math.pow(1 - x, 3);

      const run = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        offset = start + (target - start) * ease(p);
        render();
        if (p < 1) {
          requestAnimationFrame(run);
        } else {
          normalize();
          render();
          animating = false;
          paused = false;
          lastTs = 0;
        }
      };
      requestAnimationFrame(run);
    };

    document.getElementById("techNext")?.addEventListener("click", () => glideBy(1));
    document.getElementById("techPrev")?.addEventListener("click", () => glideBy(-1));

    techViewport.addEventListener("mouseenter", () => {
      paused = true;
    });
    techViewport.addEventListener("mouseleave", () => {
      if (!animating) {
        paused = false;
        lastTs = 0;
      }
    });

    window.addEventListener("resize", settleStart);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      settleStart();
      paused = true;
    } else {
      settleStart();
      requestAnimationFrame(tick);
    }
  }

  /* ---------- Lazy Images Fallback ---------- */
  if ("loading" in HTMLImageElement.prototype === false) {
    document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
      if (img.dataset.src) img.src = img.dataset.src;
    });
  }

  /* ---------- Process flow active pulse (matches reference video) ---------- */
  const processCards = document.querySelectorAll(".process-card");
  if (processCards.length) {
    let activeIndex = 0;
    const setActive = (index) => {
      processCards.forEach((card, i) => card.classList.toggle("is-active", i === index));
    };
    setActive(0);

    processCards.forEach((card, i) => {
      card.addEventListener("mouseenter", () => {
        activeIndex = i;
        setActive(i);
      });
      card.addEventListener("focus", () => {
        activeIndex = i;
        setActive(i);
      });
    });

    setInterval(() => {
      if (document.querySelector(".process-flow:hover")) return;
      activeIndex = (activeIndex + 1) % processCards.length;
      setActive(activeIndex);
    }, 2200);
  }
  /* ---------- Hero client brands (from assets/images/brands via brands-data.js) ---------- */
  const renderHeroBrands = () => {
    const track = document.getElementById("heroBrandTrack");
    if (!track) return;

    const brands = Array.isArray(window.KALYANTEJA_BRANDS) ? window.KALYANTEJA_BRANDS : [];
    if (!brands.length) {
      track.innerHTML = "";
      return;
    }

    const escapeHtml = (str) =>
      String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const chipHtml = (brand, duplicate) => {
      const name = escapeHtml(brand.name);
      const href = escapeHtml(brand.url || "#");
      const hidden = duplicate ? ' aria-hidden="true" tabindex="-1"' : "";
      const alt = duplicate ? "" : name;
      const rel = href.startsWith("http") ? ' rel="noopener noreferrer" target="_blank"' : "";

      if (brand.textOnly) {
        return `<a class="brand-chip brand-chip--text" href="${href}"${rel}${hidden}><span>${name}</span></a>`;
      }

      const src = `assets/images/brands/${escapeHtml(brand.file)}`;
      return `<a class="brand-chip" href="${href}"${rel}${hidden}><img src="${src}" alt="${alt}" width="120" height="40" loading="lazy"></a>`;
    };

    track.innerHTML =
      brands.map((b) => chipHtml(b, false)).join("") +
      brands.map((b) => chipHtml(b, true)).join("");
  };

  renderHeroBrands();

  document.querySelectorAll(".current-year").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Homepage: Justdial certificate welcome popup (once per visitor) ---------- */
  const jdWelcome = document.getElementById("jdWelcomeModal");
  const JD_WELCOME_KEY = "kalyanteja_jd_welcome_seen";

  if (jdWelcome && document.body.classList.contains("page-home")) {
    const openJdWelcome = () => {
      jdWelcome.hidden = false;
      jdWelcome.setAttribute("aria-hidden", "false");
      document.body.classList.add("jd-welcome-open");
      requestAnimationFrame(() => jdWelcome.classList.add("is-open"));
      const closeBtn = jdWelcome.querySelector(".jd-welcome__close");
      closeBtn?.focus();
    };

    const closeJdWelcome = () => {
      jdWelcome.classList.remove("is-open");
      jdWelcome.setAttribute("aria-hidden", "true");
      document.body.classList.remove("jd-welcome-open");
      try {
        localStorage.setItem(JD_WELCOME_KEY, "1");
      } catch (_) {
        /* ignore */
      }
      window.setTimeout(() => {
        jdWelcome.hidden = true;
      }, 350);
    };

    jdWelcome.querySelectorAll("[data-jd-close]").forEach((el) => {
      el.addEventListener("click", closeJdWelcome);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && jdWelcome.classList.contains("is-open")) {
        closeJdWelcome();
      }
    });

    let show = true;
    try {
      show = !localStorage.getItem(JD_WELCOME_KEY);
    } catch (_) {
      show = true;
    }

    if (show) {
      window.setTimeout(openJdWelcome, 450);
    }
  }

  /* ---------- Close mobile nav on link click ---------- */
  document.querySelectorAll(".navbar-nav .nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      const collapse = document.querySelector(".navbar-collapse.show");
      if (collapse && window.bootstrap) {
        bootstrap.Collapse.getInstance(collapse)?.hide();
      }
    });
  });
})();
