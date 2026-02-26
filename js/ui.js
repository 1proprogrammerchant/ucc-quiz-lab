import { selectAnswer } from "./quiz.js";

const optionsContainer = document.getElementById("options");
const questionTitle = document.getElementById("questionTitle");
const questionIndex = document.getElementById("questionIndex");
const questionTotal = document.getElementById("questionTotal");
const progressFill = document.getElementById("progressFill");
const quizResult = document.getElementById("quizResult");
const streakCount = document.getElementById("streakCount");
const accuracy = document.getElementById("accuracy");
const dailyFact = document.getElementById("dailyFact");

const facts = [
  "Campus life: show up, say hi, make the first move.",
  "CS basics: practice beats cramming every time.",
  "Quick win: start assignments early, sleep better.",
  "Team up: small study groups keep you accountable."
];

export const updateDailyFact = () => {
  const random = facts[Math.floor(Math.random() * facts.length)];
  if (dailyFact) {
    dailyFact.textContent = random;
  }
};

export const renderQuestion = (question, index, total) => {
  if (!question) {
    questionTitle.textContent = "No questions available.";
    optionsContainer.innerHTML = "";
    return;
  }

  questionTitle.textContent = question.question;
  questionIndex.textContent = index + 1;
  questionTotal.textContent = total;
  quizResult.textContent = "";
  optionsContainer.innerHTML = "";

  question.choices.forEach((choice, choiceIndex) => {
    const button = document.createElement("button");
    button.className = "option-btn";
    button.type = "button";
    button.textContent = choice;
    button.addEventListener("click", () => handleChoice(button, choiceIndex));
    optionsContainer.appendChild(button);
  });
};

const handleChoice = (button, choiceIndex) => {
  if (button.classList.contains("locked")) {
    return;
  }

  const buttons = optionsContainer.querySelectorAll(".option-btn");
  buttons.forEach((btn) => btn.classList.add("locked"));

  const result = selectAnswer(choiceIndex);
  buttons.forEach((btn, idx) => {
    if (idx === result.answer) {
      btn.classList.add("correct");
    } else if (idx === choiceIndex && !result.isCorrect) {
      btn.classList.add("wrong");
    }
  });

  const stars = "⭐".repeat(result.stars);
  const statusMsg = result.isCorrect
    ? `Correct! ${stars} Grade: ${result.grade} | Streak: ${result.streak}`
    : "Not quite. You can still bounce back.";

  quizResult.textContent = statusMsg;

  streakCount.textContent = result.streak;
  updateStats(result);
};

export const updateProgress = (index, total) => {
  const percentage = total ? ((index + 1) / total) * 100 : 0;
  progressFill.style.width = `${percentage}%`;
};

export const renderResult = (correct, total, streak) => {
  questionTitle.textContent = "Quiz complete.";
  optionsContainer.innerHTML = "";
  
  // Import scorer to get final calculations
  import("./wasm-scorer.js").then(({ calculatePercentage, calculateFinalScore, getGrade, calculateStars }) => {
    const percentage = calculatePercentage(correct, total);
    const finalScore = calculateFinalScore(correct, total, streak);
    const grade = getGrade(percentage);
    const stars = calculateStars(percentage);
    const starDisplay = "⭐".repeat(stars);
    
    // Save score to localStorage
    const scores = JSON.parse(localStorage.getItem("quizScores") || "[]");
    scores.push({
      percentage,
      grade,
      stars,
      streak,
      finalScore,
      date: new Date().toLocaleDateString()
    });
    localStorage.setItem("quizScores", JSON.stringify(scores));
    
    quizResult.innerHTML = `
      <div style="line-height: 1.8;">
        <strong>Final Score: ${correct}/${total}</strong> (${percentage}%)<br>
        ${starDisplay} Grade: ${grade}<br>
        Streak Bonus Score: ${finalScore}/200<br>
        Final Streak: ${streak}
      </div>
    `;
  });
};

export const updateStats = (state) => {
  if (!state.total) {
    accuracy.textContent = "--";
    return;
  }
  const percent = state.percentage || Math.round((state.correct / state.total) * 100);
  accuracy.textContent = `${percent}%`;
};

export const createRevealObserver = () => {
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
};
