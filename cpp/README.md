# C++ WebAssembly Quiz Scorer

This module compiles C++ scoring functions to WebAssembly for high-performance quiz calculations.

## Features

- `calculate_percentage(correct, total)` - Returns percentage score
- `calculate_streak_bonus(streak)` - Returns multiplier based on streak
- `calculate_final_score(correct, total, streak)` - Returns bonus-adjusted score
- `get_grade(percentage)` - Returns letter grade (A-F)
- `calculate_stars(percentage)` - Returns star rating (0-5)

## Build

Install Emscripten: https://emscripten.org/docs/getting_started/downloads.html

From this folder, run:

```bash
emcc quiz_wasm.cpp -O2 -s WASM=1 -s MODULARIZE=1 -s EXPORT_ES6=1 \
  -s EXPORTED_FUNCTIONS="['_calculate_percentage','_calculate_streak_bonus','_calculate_final_score','_get_grade','_calculate_stars']" \
  -s EXPORTED_RUNTIME_METHODS="['cwrap']" \
  -o quiz_wasm.js
```

This creates `quiz_wasm.js` and `quiz_wasm.wasm` that can be imported in the frontend.

## Pre-compiled

Pre-compiled wasm files are included in `js/wasm/` for convenience.
