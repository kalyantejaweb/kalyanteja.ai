/* ============================================================
   KALYANTEJA — Google reviews for the existing testimonials slider
   Loads after the static cards. Leaves those cards in place unless
   /api/google-reviews returns real Google review data.
   ============================================================ */

(() => {
  "use strict";

  function safePhotoUrl(value) {
    try {
      const url = new URL(value);
      if (url.protocol !== "https:") return "";
      const host = url.hostname.toLowerCase();
      if (!host.endsWith(".googleusercontent.com") && !host.endsWith(".ggpht.com")) return "";
      return url.href;
    } catch (err) {
      return "";
    }
  }

  function avatarSrc(name) {
    const letter = (name || "G").trim().charAt(0).toUpperCase();
    const safe = /^[A-Z0-9]$/.test(letter) ? letter : "G";
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52">' +
      '<rect width="52" height="52" fill="#152238"/>' +
      '<text x="26" y="33" text-anchor="middle" fill="#F8FAFC" font-family="Arial,sans-serif" font-size="22">' +
      safe +
      "</text></svg>";
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }

  function buildSlide(review) {
    if (!review || typeof review.id !== "string" || !review.id.trim() || review.id.length > 300 || /[\s<>"'&]/.test(review.id)) return null;
    if (typeof review.text !== "string" || !review.text.trim()) return null;

    const slide = document.createElement("div");
    slide.className = "swiper-slide";
    slide.dataset.reviewId = review.id;

    const card = document.createElement("div");
    card.className = "testimonial-card";

    const rating = Number(review.rating);
    if (Number.isInteger(rating) && rating >= 1 && rating <= 5) {
      const stars = document.createElement("div");
      stars.className = "testimonial-stars";
      stars.setAttribute("aria-label", rating + " star rating");
      for (let index = 1; index <= 5; index += 1) {
        const icon = document.createElement("i");
        icon.className = index <= rating ? "fas fa-star" : "far fa-star";
        icon.setAttribute("aria-hidden", "true");
        stars.appendChild(icon);
      }
      card.appendChild(stars);
    }

    const text = document.createElement("p");
    text.className = "testimonial-text";
    text.textContent = "\u201C" + review.text.trim() + "\u201D";

    const author = document.createElement("div");
    author.className = "testimonial-author";

    const name = typeof review.author === "string" && review.author.trim() ? review.author.trim() : "Google reviewer";
    const photo = safePhotoUrl(review.photoUrl);

    const img = document.createElement("img");
    img.alt = "";
    img.loading = "lazy";
    img.width = 52;
    img.height = 52;
    img.src = photo || avatarSrc(name);
    if (photo) {
      img.referrerPolicy = "no-referrer";
      img.addEventListener(
        "error",
        () => {
          img.src = avatarSrc(name);
        },
        { once: true }
      );
    }

    const meta = document.createElement("div");
    const strong = document.createElement("strong");
    strong.textContent = name;
    const span = document.createElement("span");
    span.textContent = "Google review";
    meta.appendChild(strong);
    meta.appendChild(span);
    author.appendChild(img);
    author.appendChild(meta);

    card.appendChild(text);
    card.appendChild(author);
    slide.appendChild(card);
    return slide;
  }

  function renderReviews(reviews) {
    const root = document.querySelector("#testimonials .testimonials-swiper");
    const wrapper = root && root.querySelector(".swiper-wrapper");
    if (!root || !wrapper || typeof window.initTestimonialsSwiper !== "function") return false;

    const seen = new Set();
    const slides = [];
    (Array.isArray(reviews) ? reviews : []).forEach((review) => {
      if (!review || seen.has(review.id)) return;
      const slide = buildSlide(review);
      if (!slide) return;
      seen.add(review.id);
      slides.push(slide);
    });
    if (!slides.length) return false;

    if (window.testimonialsSwiper && typeof window.testimonialsSwiper.destroy === "function") {
      try {
        window.testimonialsSwiper.destroy(true, true);
      } catch (err) {
        return false;
      }
      window.testimonialsSwiper = null;
    }

    wrapper.replaceChildren();
    slides.forEach((slide) => wrapper.appendChild(slide));
    window.initTestimonialsSwiper();
    root.dataset.reviews = "google";
    return true;
  }

  async function loadGoogleReviews() {
    const root = document.querySelector("#testimonials .testimonials-swiper");
    if (!root || root.dataset.reviews === "google") return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch("/api/google-reviews", {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      if (!response.ok) return;
      const data = await response.json();
      if (!data || data.ok !== true || data.source !== "google" || !Array.isArray(data.reviews)) return;
      renderReviews(data.reviews);
    } catch (err) {
      /* Static testimonial cards stay in place. */
    } finally {
      clearTimeout(timer);
    }
  }

  window.loadGoogleReviews = loadGoogleReviews;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadGoogleReviews);
  } else {
    loadGoogleReviews();
  }
})();
