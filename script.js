const menuToggle = document.querySelector(".menu-toggle");
const siteHeader = document.querySelector(".site-header");
const siteNav = document.querySelector(".site-nav");
const navLinks = [...document.querySelectorAll(".site-nav a")];
const revealItems = [...document.querySelectorAll(".reveal")];
const contactForm = document.querySelector(".contact-form");
const storyTriggers = [...document.querySelectorAll("[data-panel-trigger]")];
const stagePanels = [...document.querySelectorAll("[data-panel]")];
const storyCopies = [...document.querySelectorAll("[data-panel-copy]")];
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    siteNav.classList.toggle("is-open", !isExpanded);
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    if (siteNav?.classList.contains("is-open")) {
      siteNav.classList.remove("is-open");
      menuToggle?.setAttribute("aria-expanded", "false");
    }
  });
});

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

revealItems.forEach((item) => revealObserver.observe(item));

function updateHeaderState() {
  if (!siteHeader) return;

  if (window.scrollY > 60) {
    siteHeader.classList.add("scrolled");
    siteHeader.style.background = "rgba(255,255,255,0.65)";
    siteHeader.style.boxShadow = "0 4px 18px rgba(0,0,0,0.08)";
  } else {
    siteHeader.classList.remove("scrolled");
    siteHeader.style.background = "rgba(255,255,255,0.5)";
    siteHeader.style.boxShadow = "none";
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function updateStoryStage() {
  if (!storyTriggers.length) return;

  const viewportMid = window.innerHeight * 0.5;
  const speedFactor = 0.58;
  let activeTrigger = storyTriggers[0];
  let smallestDistance = Number.POSITIVE_INFINITY;

  storyTriggers.forEach((trigger) => {
    const rect = trigger.getBoundingClientRect();
    const triggerMid = rect.top + rect.height * 0.5;
    const distance = Math.abs(triggerMid - viewportMid);

    if (distance < smallestDistance) {
      smallestDistance = distance;
      activeTrigger = trigger;
    }

    const panelName = trigger.getAttribute("data-panel-trigger");
    const stagePanel = stagePanels.find((panel) => panel.getAttribute("data-panel") === panelName);
    const track = stagePanel?.querySelector(".stage-track");

    if (!track) return;

    const maxOffset = Math.max(0, track.scrollHeight - window.innerHeight);
    const progress = clamp((viewportMid - rect.top) / rect.height, 0, 1);
    const easedProgress = prefersReducedMotion
      ? progress
      : progress * progress * progress * (progress * (6 * progress - 15) + 10);
    track.style.transform = `translateY(-${maxOffset * easedProgress * speedFactor}px)`;
  });

  const activeName = activeTrigger.getAttribute("data-panel-trigger");

  stagePanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.getAttribute("data-panel") === activeName);
  });

  storyCopies.forEach((copy) => {
    copy.classList.toggle("is-active", copy.getAttribute("data-panel-copy") === activeName);
  });

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    link.classList.toggle(href === `#${activeName}` || (activeName === "contact" && href === "#contact"));
  });
}

updateStoryStage();
updateHeaderState();
window.addEventListener("scroll", updateStoryStage, { passive: true });
window.addEventListener("scroll", updateHeaderState, { passive: true });
window.addEventListener("resize", updateStoryStage);

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const button = contactForm.querySelector("button[type='submit']");

  if (button instanceof HTMLButtonElement) {
    button.textContent = "Inquiry Received";
    button.disabled = true;
  }
});
