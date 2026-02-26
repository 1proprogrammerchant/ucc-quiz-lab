import { createRevealObserver, updateDailyFact, updateStats } from "./ui.js";
import {
  loadQuestions,
  getState,
  startQuiz,
  nextQuestion,
  selectAnswer,
  shuffleQuestions,
  setTrackFilter
} from "./quiz.js";
import { initBackgroundOrbs } from "./effects.js";
import { isUsingWasm } from "./wasm-scorer.js";

const startButton = document.getElementById("startQuiz");
const nextButton = document.getElementById("nextQuestion");
const skipButton = document.getElementById("skipQuestion");
const shuffleButton = document.getElementById("shuffleQuiz");
const trackButtons = document.querySelectorAll("[data-track]");
const themeToggle = document.getElementById("themeToggle");
const wasmBadge = document.getElementById("wasmBadge");
const ctaButton = document.getElementById("ctaButton");

const bootstrap = async () => {
  initBackgroundOrbs();
  createRevealObserver();
  updateDailyFact();

  // Load saved theme
  const savedTheme = localStorage.getItem("theme") || "";
  document.documentElement.dataset.theme = savedTheme;
  const themeNames = { "": "Dark 🌙", "light": "Light ☀️", "sunset": "Sunset 🌅" };
  themeToggle.textContent = themeNames[savedTheme] || "Light ☀️";

  await loadQuestions();
  startQuiz();
  updateStats(getState());

  // Update WASM badge
  setTimeout(() => {
    if (wasmBadge) {
      wasmBadge.textContent = isUsingWasm() ? "C++ WASM ⚡" : "JS Fallback";
      wasmBadge.title = isUsingWasm()
        ? "Scoring powered by WebAssembly (C++)"
        : "Scoring running in JavaScript fallback mode";
    }
  }, 100);
};

startButton.addEventListener("click", () => {
  startQuiz();
  updateStats(getState());
});

nextButton.addEventListener("click", () => {
  nextQuestion();
  updateStats(getState());
});

skipButton.addEventListener("click", () => {
  nextQuestion(true);
  updateStats(getState());
});

shuffleButton.addEventListener("click", () => {
  shuffleQuestions();
  startQuiz();
  updateStats(getState());
});

trackButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setTrackFilter(button.dataset.track);
    startQuiz();
    updateStats(getState());
  });
});

themeToggle.addEventListener("click", () => {
  const root = document.documentElement;
  const current = root.dataset.theme || "dark";
  
  let next = "light";
  if (current === "light") next = "sunset";
  else if (current === "sunset") next = "";
  
  root.dataset.theme = next;
  localStorage.setItem("theme", next);
  
  // Update button text
  const themeNames = { "": "Dark 🌙", "light": "Light ☀️", "sunset": "Sunset 🌅" };
  themeToggle.textContent = themeNames[next ? next : ""] === undefined ? "Light ☀️" : themeNames[next || ""];
});

if (ctaButton) {
  ctaButton.addEventListener("click", () => {
    startQuiz();
    updateStats(getState());
    document.getElementById("quiz").scrollIntoView({ behavior: "smooth" });
  });
}

window.addEventListener("load", bootstrap);
