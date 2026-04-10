const menuToggle = document.querySelector(".menu-toggle");
const siteHeader = document.querySelector(".site-header");
const siteNav = document.querySelector(".site-nav");
const navLinks = [...document.querySelectorAll(".site-nav a")];
const externalActionLinks = [...document.querySelectorAll("[data-external-link='true']")];
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
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href");
    const targetId = href?.replace("#", "");
    const target = targetId ? document.getElementById(targetId) : null;

    if (target && target.classList.contains("story-trigger")) {
      event.preventDefault();

      const headerOffset = siteHeader?.offsetHeight ?? 0;
      const triggerProgressMap = {
        home: 0,
        about: 0.3,
        services: 0.72,
        "why-us": 0.64,
        clients: 0.38,
        team: 0.68,
        contact: 0.62,
      };
      const triggerProgress = triggerProgressMap[targetId] ?? 0.72;
      const targetY =
        target.getBoundingClientRect().top +
        window.scrollY +
        target.offsetHeight * triggerProgress -
        headerOffset;

      window.scrollTo({
        top: targetY,
        behavior: "smooth",
      });
    }

    if (siteNav?.classList.contains("is-open")) {
      siteNav.classList.remove("is-open");
      menuToggle?.setAttribute("aria-expanded", "false");
    }
  });
});

externalActionLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href");
    if (!href) return;

    event.preventDefault();
    link.classList.add("is-pressed");
    window.setTimeout(() => {
      window.location.href = href;
    }, 110);
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

function updateCopyLines(activeName, progress) {
  const thresholdMap = {
    about: [0.04, 0.1, 0.16, 0.22],
  };
  const thresholds = thresholdMap[activeName] ?? [0.1, 0.24, 0.38, 0.52, 0.66, 0.8];
  const span = activeName === "about" ? 0.14 : 0.2;

  storyCopies.forEach((copy) => {
    const isActive = copy.getAttribute("data-panel-copy") === activeName;
    const children = [...copy.children];

    children.forEach((child, index) => {
      if (!isActive) {
        child.style.opacity = "0";
        child.style.transform = "translateY(20px)";
        return;
      }

      const start = thresholds[index] ?? thresholds[thresholds.length - 1];
      const localProgress = prefersReducedMotion ? 1 : clamp((progress - start) / span, 0, 1);

      child.style.opacity = String(localProgress);
      child.style.transform = `translateY(${20 - localProgress * 20}px)`;
    });
  });
}

function updateStoryStage() {
  if (!storyTriggers.length) return;

  const viewportMid = window.innerHeight * 0.5;
  const speedFactor = 0.58;
  let activeTrigger = storyTriggers[0];
  let smallestDistance = Number.POSITIVE_INFINITY;
  let activeProgress = 0;

  storyTriggers.forEach((trigger) => {
    const rect = trigger.getBoundingClientRect();
    const triggerMid = rect.top + rect.height * 0.5;
    const distance = Math.abs(triggerMid - viewportMid);

    if (distance < smallestDistance) {
      smallestDistance = distance;
      activeTrigger = trigger;
      activeProgress = clamp((viewportMid - rect.top) / rect.height, 0, 1);
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
    const imageProgress =
      panelName === "about" ? clamp((progress - 0.34) / 0.66, 0, 1) : easedProgress;
    track.style.transform = `translateY(-${maxOffset * imageProgress * speedFactor}px)`;
    track.style.setProperty("--image-zoom", `${1 + easedProgress * 0.08}`);
  });

  const activeName = activeTrigger.getAttribute("data-panel-trigger");

  stagePanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.getAttribute("data-panel") === activeName);
  });

  storyCopies.forEach((copy) => {
    copy.classList.toggle("is-active", copy.getAttribute("data-panel-copy") === activeName);
  });

  updateCopyLines(activeName, activeProgress);

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
