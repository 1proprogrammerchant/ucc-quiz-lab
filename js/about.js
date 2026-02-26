const themeToggle = document.getElementById("themeToggle");

// Load saved theme
const savedTheme = localStorage.getItem("theme") || "";
document.documentElement.dataset.theme = savedTheme;
const themeNames = { "": "Dark 🌙", "light": "Light ☀️", "sunset": "Sunset 🌅" };
themeToggle.textContent = themeNames[savedTheme] || "Light ☀️";

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const root = document.documentElement;
    const current = root.dataset.theme || "dark";
    
    let next = "light";
    if (current === "light") next = "sunset";
    else if (current === "sunset") next = "";
    
    root.dataset.theme = next;
    localStorage.setItem("theme", next);
    
    // Update button text
    const themeNamesLocal = { "": "Dark 🌙", "light": "Light ☀️", "sunset": "Sunset 🌅" };
    themeToggle.textContent = themeNamesLocal[next || ""] || "Light ☀️";
  });
}

// Reveal animations
const items = document.querySelectorAll("[data-animate]");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || "0";
        entry.target.style.transitionDelay = `${delay}ms`;
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

items.forEach((item) => observer.observe(item));
