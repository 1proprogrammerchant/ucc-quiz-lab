# UCC Quiz Lab

Playful, animated quiz site for the University of Commonwealth Caribbean.

Built by **Jerome Henry** (GitHub: [1proprogrammerchant](https://github.com/1proprogrammerchant))

## Features

- **40 questions** across 2 tracks: Campus Life & CS Basics
- **C++ WebAssembly scoring engine** (with JS fallback)
- **Advanced scoring**: Percentage, letter grades, star ratings, streak bonuses
- **Smooth animations**: Fade-in reveals, floating orbs, theme switcher
- **Live stats**: Real-time streak, accuracy, and bonus multipliers
- **Quiz controls**: Shuffle, track filters, skip questions

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6 modules)
- **Scoring Engine**: C++ compiled to WebAssembly via Emscripten
- **Dev Server**: Python 3 HTTP server
- **Container**: Docker + nginx

## Run locally

### Option 1: Python

```bash
python3 python/dev_server.py
```

Visit http://localhost:8000

### Option 2: Docker

```bash
docker build -t ucc-quiz .
docker run --rm -p 8080:80 ucc-quiz
```

Visit http://localhost:8080

## Structure

```
project-ucc/
├── index.html              # Main page
├── css/                    # Stylesheets (variables, layout, components, animations)
├── js/                     # JavaScript modules
│   ├── app.js             # Main entry point
│   ├── quiz.js            # Quiz state & logic
│   ├── ui.js              # DOM rendering
│   ├── wasm-scorer.js     # WebAssembly loader with JS fallback
│   └── effects.js         # Visual effects
├── data/
│   └── questions.json     # Quiz questions (40 total)
├── cpp/                   # C++ WebAssembly scorer
│   ├── quiz_wasm.cpp      # Scoring functions
│   └── README.md          # Build instructions
├── python/
│   └── dev_server.py      # Simple HTTP server
├── assets/
│   └── orb.svg            # Graphics
├── Dockerfile             # Container config
└── README.md
```

## C++ WASM Scoring

The quiz uses C++ compiled to WebAssembly for high-performance score calculations:

- `calculate_percentage(correct, total)` - Base percentage
- `calculate_streak_bonus(streak)` - Multiplier from streak
- `calculate_final_score(correct, total, streak)` - Bonus-adjusted score
- `get_grade(percentage)` - Letter grade (A-F)
- `calculate_stars(percentage)` - Star rating (0-5)

To compile the WASM module, see [cpp/README.md](cpp/README.md).

The app automatically falls back to JavaScript if WASM isn't available.

## Customization

- **Add questions**: Edit `data/questions.json`
- **Change theme**: Update CSS variables in `css/variables.css`
- **New tracks**: Add track filter in `quiz.js` and HTML

## Deployment

### GitHub Pages (Free)

```bash
# Push to GitHub
git add .
git commit -m "Deploy UCC Quiz Lab"
git push origin main

# Enable Pages in repo settings → Deploy from main branch
# Live at: https://1proprogrammerchant.github.io/project-ucc/
```

### Netlify (Drag & Drop)

1. Go to [netlify.com](https://netlify.com)
2. Drag your `project-ucc` folder
3. Instant deployment at `https://ucc-quiz-lab.netlify.app`

### Vercel (CLI)

```bash
npm install -g vercel
vercel
```

## License

**MIT License** - See [LICENSE](LICENSE) for details.

Copyright (c) 2026 Jerome Henry (1proprogrammerchant)

Created for educational purposes at the University of Commonwealth Caribbean.

