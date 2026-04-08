const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const navLinks = [...document.querySelectorAll(".site-nav a")];
const sections = [...document.querySelectorAll("main section[id]")];
const revealItems = [...document.querySelectorAll(".reveal")];
const storyLayouts = [...document.querySelectorAll("[data-story]")];
const contactForm = document.querySelector(".contact-form");

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

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute("id");

        navLinks.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
        });
      }
    });
  },
  {
    threshold: 0.45,
    rootMargin: "-15% 0px -35% 0px",
  }
);

sections.forEach((section) => sectionObserver.observe(section));

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

storyLayouts.forEach((layout) => {
  const storyName = layout.getAttribute("data-story");
  const steps = [...layout.querySelectorAll(`[data-story-step="${storyName}"]`)];
  const visuals = [...layout.querySelectorAll(".story-visual")];

  const activateStoryStep = (step) => {
    const target = step.getAttribute("data-media-target");

    steps.forEach((item) => item.classList.toggle("is-active", item === step));
    visuals.forEach((visual) => {
      visual.classList.toggle("is-active", visual.getAttribute("data-media") === target);
    });
  };

  if (steps[0]) {
    activateStoryStep(steps[0]);
  }

  const storyObserver = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visibleEntries[0]) {
        activateStoryStep(visibleEntries[0].target);
      }
    },
    {
      threshold: [0.35, 0.55, 0.75],
      rootMargin: "-18% 0px -18% 0px",
    }
  );

  steps.forEach((step) => storyObserver.observe(step));
});

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const button = contactForm.querySelector("button[type='submit']");

  if (button instanceof HTMLButtonElement) {
    button.textContent = "Inquiry Received";
    button.disabled = true;
  }
});
