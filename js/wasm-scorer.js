/**
 * WebAssembly-powered quiz scorer
 * Falls back to JavaScript if WASM is unavailable
 */

let wasmModule = null;
let useWasm = false;

// Fallback JavaScript implementations
const jsFallback = {
  calculate_percentage: (correct, total) => {
    if (total <= 0) return 0;
    return Math.floor((correct * 100) / total);
  },

  calculate_streak_bonus: (streak) => {
    if (streak <= 0) return 1.0;
    const bonus = 1.0 + streak * 0.05;
    return bonus > 2.0 ? 2.0 : bonus;
  },

  calculate_final_score: (correct, total, streak) => {
    if (total <= 0) return 0;
    const baseScore = Math.floor((correct * 100) / total);
    const bonus = jsFallback.calculate_streak_bonus(streak);
    const finalScore = Math.floor(baseScore * bonus);
    return finalScore > 200 ? 200 : finalScore;
  },

  get_grade: (percentage) => {
    if (percentage >= 90) return "A";
    if (percentage >= 80) return "B";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    return "F";
  },

  calculate_stars: (percentage) => {
    if (percentage >= 95) return 5;
    if (percentage >= 85) return 4;
    if (percentage >= 70) return 3;
    if (percentage >= 50) return 2;
    if (percentage >= 30) return 1;
    return 0;
  }
};

// Try to load WASM module
const initWasm = async () => {
  try {
    // Attempt to load the compiled WASM module
    // For now, this will fail gracefully and use JS fallback
    const wasmPath = "js/wasm/quiz_wasm.js";
    const module = await import(wasmPath);
    wasmModule = await module.default();
    useWasm = true;
    console.log("✓ Quiz scorer running with WebAssembly (C++)");
  } catch (error) {
    useWasm = false;
    console.log("✓ Quiz scorer running with JavaScript fallback");
  }
};

// Public API
export const calculatePercentage = (correct, total) => {
  if (useWasm && wasmModule) {
    return wasmModule._calculate_percentage(correct, total);
  }
  return jsFallback.calculate_percentage(correct, total);
};

export const calculateStreakBonus = (streak) => {
  if (useWasm && wasmModule) {
    return wasmModule._calculate_streak_bonus(streak);
  }
  return jsFallback.calculate_streak_bonus(streak);
};

export const calculateFinalScore = (correct, total, streak) => {
  if (useWasm && wasmModule) {
    return wasmModule._calculate_final_score(correct, total, streak);
  }
  return jsFallback.calculate_final_score(correct, total, streak);
};

export const getGrade = (percentage) => {
  if (useWasm && wasmModule) {
    const gradeCode = wasmModule._get_grade(percentage);
    return String.fromCharCode(gradeCode);
  }
  return jsFallback.get_grade(percentage);
};

export const calculateStars = (percentage) => {
  if (useWasm && wasmModule) {
    return wasmModule._calculate_stars(percentage);
  }
  return jsFallback.calculate_stars(percentage);
};

export const isUsingWasm = () => useWasm;

// Initialize on import
initWasm();
