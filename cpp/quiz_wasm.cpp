#include <emscripten/emscripten.h>
#include <cmath>

extern "C" {

// Calculate percentage score
EMSCRIPTEN_KEEPALIVE
int calculate_percentage(int correct, int total) {
  if (total <= 0) {
    return 0;
  }
  return (correct * 100) / total;
}

// Calculate streak bonus multiplier
EMSCRIPTEN_KEEPALIVE
double calculate_streak_bonus(int streak) {
  if (streak <= 0) {
    return 1.0;
  }
  // Bonus increases with streak: 1.0 + (streak * 0.05), capped at 2.0
  double bonus = 1.0 + (streak * 0.05);
  return bonus > 2.0 ? 2.0 : bonus;
}

// Calculate final score with streak bonus
EMSCRIPTEN_KEEPALIVE
int calculate_final_score(int correct, int total, int streak) {
  if (total <= 0) {
    return 0;
  }
  int base_score = (correct * 100) / total;
  double bonus = calculate_streak_bonus(streak);
  int final_score = static_cast<int>(base_score * bonus);
  return final_score > 200 ? 200 : final_score; // Cap at 200%
}

// Determine grade based on percentage
EMSCRIPTEN_KEEPALIVE
char get_grade(int percentage) {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

// Calculate accuracy rank (0-5 stars)
EMSCRIPTEN_KEEPALIVE
int calculate_stars(int percentage) {
  if (percentage >= 95) return 5;
  if (percentage >= 85) return 4;
  if (percentage >= 70) return 3;
  if (percentage >= 50) return 2;
  if (percentage >= 30) return 1;
  return 0;
}

}
