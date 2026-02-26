import { renderQuestion, renderResult, updateProgress } from "./ui.js";
import {
  calculatePercentage,
  calculateFinalScore,
  getGrade,
  calculateStars
} from "./wasm-scorer.js";

let questions = [];
let filtered = [];
let index = 0;
let correct = 0;
let streak = 0;
let filter = "all";

export const loadQuestions = async () => {
  const response = await fetch("data/questions.json");
  const data = await response.json();
  questions = data.questions || [];
  filtered = [...questions];
};

const applyFilter = () => {
  filtered =
    filter === "all" ? [...questions] : questions.filter((q) => q.track === filter);
  if (filtered.length === 0) {
    filtered = [...questions];
  }
};

export const startQuiz = () => {
  applyFilter();
  index = 0;
  correct = 0;
  renderQuestion(filtered[index], index, filtered.length);
  updateProgress(index, filtered.length);
};

export const nextQuestion = (skipped = false) => {
  if (!skipped && index === filtered.length - 1) {
    renderResult(correct, filtered.length, streak);
    return;
  }

  index += 1;
  if (index >= filtered.length) {
    renderResult(correct, filtered.length, streak);
    return;
  }

  renderQuestion(filtered[index], index, filtered.length);
  updateProgress(index, filtered.length);
};

export const selectAnswer = (choiceIndex) => {
  const question = filtered[index];
  const isCorrect = choiceIndex === question.answer;
  if (isCorrect) {
    correct += 1;
    streak += 1;
  } else {
    streak = 0;
  }

  const percentage = calculatePercentage(correct, filtered.length);
  const finalScore = calculateFinalScore(correct, filtered.length, streak);
  const grade = getGrade(percentage);
  const stars = calculateStars(percentage);

  return {
    isCorrect,
    answer: question.answer,
    streak,
    correct,
    percentage,
    finalScore,
    grade,
    stars
  };
};

export const shuffleQuestions = () => {
  for (let i = questions.length - 1; i > 0; i -= 1) {
    const swap = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[swap]] = [questions[swap], questions[i]];
  }
};

export const setTrackFilter = (track) => {
  filter = track || "all";
};

export const getState = () => {
  const percentage = calculatePercentage(correct, filtered.length);
  const finalScore = calculateFinalScore(correct, filtered.length, streak);
  const grade = getGrade(percentage);
  const stars = calculateStars(percentage);

  return {
    index,
    correct,
    total: filtered.length,
    streak,
    percentage,
    finalScore,
    grade,
    stars
  };
};
