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

// Load leaderboard data
const loadLeaderboard = () => {
  const scores = JSON.parse(localStorage.getItem("quizScores") || "[]");
  
  if (scores.length === 0) {
    return;
  }

  const totalQuizzes = scores.length;
  const avgScore = Math.round(
    scores.reduce((sum, s) => sum + s.percentage, 0) / scores.length
  );
  const bestScore = Math.max(...scores.map((s) => s.percentage));
  const longestStreak = Math.max(...scores.map((s) => s.streak));

  document.getElementById("totalQuizzes").textContent = totalQuizzes;
  document.getElementById("avgScore").textContent = `${avgScore}%`;
  document.getElementById("bestScore").textContent = `${bestScore}%`;
  document.getElementById("longestStreak").textContent = longestStreak;

  const recentContainer = document.getElementById("recentScores");
  const recent = scores.slice(-5).reverse();
  
  recentContainer.innerHTML = recent
    .map(
      (score) => `
    <div style="padding: 16px; background: var(--surface-alt); border-radius: var(--radius-md); border: 1px solid rgba(255, 255, 255, 0.08); margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <p style="font-weight: 600; margin-bottom: 4px;">${score.percentage}% - ${score.grade}</p>
          <p style="font-size: 0.85rem; color: var(--muted);">Streak: ${score.streak} • Score: ${score.finalScore}/200</p>
        </div>
        <p style="font-size: 0.9rem; color: var(--muted);">${score.date || "Today"}</p>
      </div>
    </div>
  `
    )
    .join("");
};

loadLeaderboard();
