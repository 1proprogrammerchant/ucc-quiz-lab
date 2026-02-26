# UCC Quiz Lab - Features & Updates

## Latest Updates

### Enhanced Scoring System (C++ WebAssembly)

- ✅ **40 quiz questions** (20 campus life, 20 CS basics)
- ✅ **C++ WebAssembly scorer** with automatic JS fallback
- ✅ **Advanced metrics**: 
  - Base percentage score
  - Letter grades (A-F)
  - Star ratings (0-5)
  - Streak bonus multiplier (up to 2.0x)
  - Final bonus score (capped at 200%)
- ✅ **Visual indicators**: 
  - C++ WASM badge in hero section
  - Star display on correct answers
  - Real-time grade updates
  - Comprehensive final results

### Quiz Experience

- **Track System**: Filter by Campus Life or CS Basics
- **Shuffle Mode**: Randomize question order
- **Live Streak**: Track consecutive correct answers
- **Skip Option**: Move past difficult questions
- **Progress Bar**: Visual completion indicator
- **Animated UI**: Smooth reveals and transitions

### Design & Styling

- **Dual Themes**: Default dark + Sunset purple theme
- **Animated Orbs**: Floating gradient backgrounds
- **Responsive**: Works on desktop, tablet, mobile
- **Accessible**: ARIA labels, keyboard navigation
- **Custom Fonts**: Fraunces display + Space Grotesk body

### Technical Stack

| Component | Technology |
|-----------|-----------|
| Frontend | HTML5, CSS3, JavaScript ES6+ |
| Scoring | C++ → WebAssembly (Emscripten) |
| Dev Server | Python 3 HTTP server |
| Container | Docker + nginx alpine |
| Build | No bundler (native ES modules) |

### Performance

- **Fast Loading**: No build step, direct ES6 imports
- **WASM Speed**: Native C++ performance for calculations
- **Lazy Loading**: Questions fetched on demand
- **Minimal Bundle**: ~20KB total JS (unminified)

### Future Ideas

- [ ] Leaderboard with local storage
- [ ] Timed quiz mode
- [ ] Question difficulty levels
- [ ] More tracks (Math, Science, History)
- [ ] Multiplayer mode
- [ ] Custom quiz creator
- [ ] Export results as PDF
- [ ] Sound effects & music

---

**Created by Jerome Henry**  
GitHub: [@1proprogrammerchant](https://github.com/1proprogrammerchant)  
For: University of Commonwealth Caribbean
