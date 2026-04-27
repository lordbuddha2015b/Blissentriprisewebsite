const menuToggle = document.querySelector(".menu-toggle");
const siteHeader = document.querySelector(".site-header");
const siteNav = document.querySelector(".site-nav");
const navLinks = [...document.querySelectorAll(".site-nav a")];
const revealItems = [...document.querySelectorAll(".reveal")];
const contactForm = document.querySelector(".contact-form");
const storyTriggers = [...document.querySelectorAll("[data-panel-trigger]")];
const stagePanels = [...document.querySelectorAll("[data-panel]")];
const storyCopies = [...document.querySelectorAll("[data-panel-copy]")];
const storyStageCopy = document.querySelector(".story-stage-copy");
const clientsPanelTrack = document.querySelector('[data-panel="clients"] .stage-track');
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const mobileClientsImageSrc = "images/client image.png";
const originalClientsMarkup = clientsPanelTrack?.innerHTML ?? "";

let currentDeviceType = null;
let desktopEffectsAttached = false;

function detectDeviceType() {
  // Treat narrow touch-first screens as mobile so we can swap to stacked content.
  const isNarrowViewport = window.matchMedia("(max-width: 768px)").matches;
  const hasTouchCapability =
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches ||
    "ontouchstart" in window;

  return isNarrowViewport || (hasTouchCapability && window.innerWidth <= 768)
    ? "mobile"
    : "desktop";
}

function setDeviceModeClass(deviceType) {
  document.body.classList.toggle("mobile-mode", deviceType === "mobile");
  document.body.classList.toggle("desktop-mode", deviceType === "desktop");
}

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

function resetCopyChildren(copy) {
  [...copy.children].forEach((child) => {
    child.style.opacity = "";
    child.style.transform = "";
  });
}

function moveCopiesIntoPanels() {
  storyCopies.forEach((copy) => {
    const panelName = copy.getAttribute("data-panel-copy");
    const targetPanel = stagePanels.find((panel) => panel.getAttribute("data-panel") === panelName);

    if (!targetPanel || copy.parentElement === targetPanel) return;

    targetPanel.appendChild(copy);
  });
}

function restoreCopiesToDesktopContainer() {
  if (!storyStageCopy) return;

  storyCopies.forEach((copy) => {
    if (copy.parentElement !== storyStageCopy) {
      storyStageCopy.appendChild(copy);
    }
  });
}

function resetStageForMobile() {
  stagePanels.forEach((panel) => {
    panel.classList.add("is-active");
  });

  storyCopies.forEach((copy) => {
    copy.classList.add("is-active");
    resetCopyChildren(copy);
  });

  stagePanels.forEach((panel) => {
    const track = panel.querySelector(".stage-track");
    if (!track) return;

    track.style.transform = "none";
    track.style.setProperty("--image-zoom", "1");
  });
}

function applyMobileClientImage() {
  if (!clientsPanelTrack) return;

  clientsPanelTrack.innerHTML = `<img src="${mobileClientsImageSrc}" alt="Bliss Enterprises client partners" />`;
}

function restoreDesktopClientImages() {
  if (!clientsPanelTrack || !originalClientsMarkup) return;

  clientsPanelTrack.innerHTML = originalClientsMarkup;
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
  if (currentDeviceType !== "desktop" || !storyTriggers.length) return;

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
    link.classList.toggle(
      href === `#${activeName}` || (activeName === "contact" && href === "#contact")
    );
  });
}

function attachDesktopEffects() {
  if (desktopEffectsAttached) return;

  window.addEventListener("scroll", updateStoryStage, { passive: true });
  window.addEventListener("resize", updateStoryStage);
  desktopEffectsAttached = true;
}

function detachDesktopEffects() {
  if (!desktopEffectsAttached) return;

  window.removeEventListener("scroll", updateStoryStage);
  window.removeEventListener("resize", updateStoryStage);
  desktopEffectsAttached = false;
}

function applyDeviceMode() {
  // Switch layouts live when the viewport crosses between mobile and desktop rules.
  const nextDeviceType = detectDeviceType();

  if (nextDeviceType === currentDeviceType) {
    if (nextDeviceType === "mobile") {
      resetStageForMobile();
    } else {
      updateStoryStage();
    }
    return;
  }

  currentDeviceType = nextDeviceType;
  setDeviceModeClass(currentDeviceType);

  if (currentDeviceType === "mobile") {
    detachDesktopEffects();
    applyMobileClientImage();
    moveCopiesIntoPanels();
    resetStageForMobile();
  } else {
    restoreDesktopClientImages();
    restoreCopiesToDesktopContainer();
    attachDesktopEffects();
    updateStoryStage();
  }
}

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

    if (targetId && currentDeviceType === "mobile") {
      const mobilePanel = stagePanels.find((panel) => panel.getAttribute("data-panel") === targetId);

      if (mobilePanel) {
        event.preventDefault();
        mobilePanel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else if (target && target.classList.contains("story-trigger")) {
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

window.addEventListener("scroll", updateHeaderState, { passive: true });
window.addEventListener("resize", applyDeviceMode);

updateHeaderState();
applyDeviceMode();

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const button = contactForm.querySelector("button[type='submit']");

  if (button instanceof HTMLButtonElement) {
    button.textContent = "Inquiry Received";
    button.disabled = true;
  }
});
