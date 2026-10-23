const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");

function setMenuOpen(open) {
  if (!menuToggle || !navMenu) return;
  navMenu.classList.toggle("open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
}

menuToggle?.addEventListener("click", () => setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true"));
navMenu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenuOpen(false)));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuToggle?.getAttribute("aria-expanded") === "true") {
    setMenuOpen(false);
    menuToggle.focus();
  }
});

document.querySelectorAll("#year").forEach((year) => year.textContent = new Date().getFullYear());

document.querySelectorAll(".back-top").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  });
});

// Local slides use the supplied worship photos. The first slide keeps the original dark overlay.
const slides = [...document.querySelectorAll(".hero-slide")];
if (slides.length) {
  const title = document.getElementById("hero-title");
  const description = document.querySelector(".hero-intro");
  const counter = document.getElementById("slideCurrent");
  const dots = [...document.querySelectorAll(".slide-dot")];
  const slider = document.querySelector(".hero-slider");
  let activeIndex = 0;
  let timer;
  let typingRun = 0;

  async function typeHeroTitle(markup) {
    const thisRun = ++typingRun;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      title.innerHTML = markup;
      return;
    }
    const template = document.createElement("template");
    template.innerHTML = markup;
    title.replaceChildren(template.content.cloneNode(true));
    const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push({ node: walker.currentNode, text: walker.currentNode.textContent });
    textNodes.forEach(({ node }) => { node.textContent = ""; });
    for (const { node, text } of textNodes) {
      for (const character of [...text]) {
        if (thisRun !== typingRun) return;
        node.textContent += character;
        await new Promise((resolve) => window.setTimeout(resolve, 34));
      }
    }
  }

  slides.forEach((slide) => {
    const image = slide.querySelector(".hero-image");
    image.style.backgroundImage = `url("${slide.dataset.image}")`;
    if (slide.dataset.position) image.style.backgroundPosition = slide.dataset.position;
    image.setAttribute("role", "img");
    image.setAttribute("aria-label", slide.dataset.alt || "The Zioners performing live");
  });

  function showSlide(index) {
    activeIndex = (index + slides.length) % slides.length;
    slider.classList.add("is-transitioning");
    window.setTimeout(() => {
      const current = slides[activeIndex];
      typeHeroTitle(current.dataset.title);
      description.textContent = current.dataset.description;
      slider.classList.remove("is-transitioning");
    }, 180);
    slides.forEach((slide, i) => {
      const active = i === activeIndex;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });
    counter.textContent = String(activeIndex + 1).padStart(2, "0");
    dots.forEach((dot, i) => {
      dot.classList.toggle("is-active", i === activeIndex);
      dot.setAttribute("aria-pressed", String(i === activeIndex));
    });
  }

  function stopTimer() {
    window.clearInterval(timer);
    timer = null;
  }
  function startTimer() {
    stopTimer();
    // Rotation remains enabled for reduced-motion users; CSS removes the transitions for them.
    timer = window.setInterval(() => showSlide(activeIndex + 1), 7000);
  }

  document.querySelector(".slide-prev")?.addEventListener("click", () => { showSlide(activeIndex - 1); startTimer(); });
  document.querySelector(".slide-next")?.addEventListener("click", () => { showSlide(activeIndex + 1); startTimer(); });
  dots.forEach((dot, i) => dot.addEventListener("click", () => { showSlide(i); startTimer(); }));
  // Keep the carousel moving while visible; manual controls simply restart the interval.
  document.addEventListener("visibilitychange", () => document.hidden ? stopTimer() : startTimer());
  typeHeroTitle(slides[0].dataset.title);
  startTimer();
}

// Interior page heroes share the supplied photography and rotate automatically.
document.querySelectorAll("[data-hero-slides]").forEach((hero) => {
  const imageBox = hero.querySelector(".inner-hero-image");
  const images = hero.dataset.heroSlides.split("|").map((image) => image.trim()).filter(Boolean);
  if (!imageBox || images.length < 2) return;
  const frames = [document.createElement("div"), document.createElement("div")];
  frames.forEach((frame) => {
    frame.className = "inner-hero-frame";
    frame.setAttribute("aria-hidden", "true");
    imageBox.append(frame);
  });
  let current = 0;
  let front = 0;
  let heroTimer;
  frames[0].style.backgroundImage = `url("${images[0]}")`;
  frames[0].classList.add("is-active");
  frames[1].style.backgroundImage = `url("${images[1]}")`;
  function advanceHero() {
    current = (current + 1) % images.length;
    front = 1 - front;
    frames[front].style.backgroundImage = `url("${images[current]}")`;
    frames[front].classList.add("is-active");
    frames[1 - front].classList.remove("is-active");
  }
  function stopHero() { window.clearInterval(heroTimer); }
  function startHero() {
    stopHero();
    if (!document.hidden) heroTimer = window.setInterval(advanceHero, 6800);
  }
  document.addEventListener("visibilitychange", () => document.hidden ? stopHero() : startHero());
  startHero();
});

// Reveal content in alternating directions as it enters view. Hero sections stay static.
const revealSelector = [
  ".intro-label", ".intro-layout", ".experience-card", ".section-top", ".genre-note",
  ".quote-band > *", ".occasion-heading", ".occasion-list > a", ".booking > *",
  ".inner-split > *", ".service-feature .service-image", ".service-feature .service-copy",
  ".event-type > *", ".event-process > *", ".process-grid article", ".values-grid article",
  ".journal-story .journal-copy", ".gallery-item",
  ".event-archive-card", ".faq-section > div", ".contact-step-list article",
  ".contact-page-heading > *", ".contact-booking > *", ".leader-feature .leader-copy",
  ".band-people-grid article", ".image-story > *", ".identity-card > *", ".mini-cta > *"
].join(",");
const revealItems = [...document.querySelectorAll(revealSelector)].filter((item) => !item.closest(".hero, .inner-hero"));
if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  revealItems.forEach((item, index) => {
    const section = item.closest("section");
    let direction;
    if (item.matches(".journal-image, .service-image, .leader-photo, .image-story > img")) {
      direction = item.closest(".service-feature")?.classList.contains("service-reverse") ? "right" : "left";
    } else if (item.matches(".journal-copy, .service-copy, .leader-copy, .image-story > div")) {
      direction = item.closest(".service-feature")?.classList.contains("service-reverse") ? "left" : "right";
    } else {
      const localIndex = section ? [...section.querySelectorAll(revealSelector)].indexOf(item) : index;
      direction = localIndex % 4 === 0 ? "left" : localIndex % 4 === 1 ? "right" : localIndex % 4 === 2 ? "up" : "right";
    }
    item.classList.add("reveal-ready", `reveal-from-${direction}`);
    item.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 75}ms`);
  });
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.01, rootMargin: "0px 0px -2% 0px" });
  revealItems.forEach((item) => revealObserver.observe(item));
}

// Gallery filters and full-screen image viewer.
const galleryItems = [...document.querySelectorAll(".gallery-item")];
const lightbox = document.getElementById("lightbox");
if (galleryItems.length && lightbox) {
  let visibleGalleryItems = galleryItems;
  let galleryIndex = 0;
  const lightboxImage = lightbox.querySelector("img");
  const lightboxCaption = lightbox.querySelector("figcaption");
  function showGalleryImage(index) {
    galleryIndex = (index + visibleGalleryItems.length) % visibleGalleryItems.length;
    const selectedItem = visibleGalleryItems[galleryIndex];
    const image = selectedItem.querySelector("img");
    lightboxImage.src = image.src;
    lightboxImage.alt = image.alt;
    lightboxCaption.textContent = selectedItem.dataset.caption;
  }
  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lightbox-open");
  }
  galleryItems.forEach((item) => item.querySelector("button").addEventListener("click", () => {
    visibleGalleryItems = galleryItems.filter((galleryItem) => !galleryItem.hidden);
    showGalleryImage(visibleGalleryItems.indexOf(item));
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");
    lightbox.querySelector(".lightbox-close").focus();
  }));
  document.querySelectorAll(".gallery-filter").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll(".gallery-filter").forEach((filter) => {
      const active = filter === button;
      filter.classList.toggle("is-active", active);
      filter.setAttribute("aria-pressed", String(active));
    });
    galleryItems.forEach((item) => {
      item.hidden = button.dataset.filter !== "all" && !(item.dataset.categories || item.dataset.category || "").split(/\s+/).includes(button.dataset.filter);
    });
    visibleGalleryItems = galleryItems.filter((item) => !item.hidden);
  }));
  lightbox.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
  lightbox.querySelector(".lightbox-prev").addEventListener("click", () => showGalleryImage(galleryIndex - 1));
  lightbox.querySelector(".lightbox-next").addEventListener("click", () => showGalleryImage(galleryIndex + 1));
  lightbox.addEventListener("click", (event) => { if (event.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowRight") showGalleryImage(galleryIndex + 1);
    if (event.key === "ArrowLeft") showGalleryImage(galleryIndex - 1);
  });
}

document.querySelectorAll("#bookingForm").forEach((bookingForm) => {
  const formMessage = bookingForm.querySelector("#formMessage");
  bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!bookingForm.reportValidity()) return;
    const data = new FormData(bookingForm);
    const details = ["Booking enquiry for The Zioners", "", `Name: ${data.get("name")}`, `Email: ${data.get("email")}`, `Occasion: ${data.get("eventType")}`, `Date: ${data.get("date") || "Not set yet"}`, "", `More about it: ${data.get("message") || "No extra details yet."}`].join("\n");
    try {
      await navigator.clipboard.writeText(details);
      formMessage.textContent = "Your enquiry is ready and copied. Paste it into an email to send it to The Zioners.";
      formMessage.className = "form-note is-success";
    } catch {
      formMessage.textContent = "Your enquiry is ready. Copy these details from the form and email them to The Zioners.";
      formMessage.className = "form-note is-error";
    }
  });
});
