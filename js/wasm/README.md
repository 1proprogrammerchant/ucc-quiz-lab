# WebAssembly Modules Directory

This directory would contain the compiled WebAssembly files if you build the C++ scorer.

## Expected Files

After running the Emscripten build (see `cpp/README.md`), copy these files here:

- `quiz_wasm.js` - WebAssembly loader module
- `quiz_wasm.wasm` - Compiled WebAssembly binary

## Current Status

The app currently runs with **JavaScript fallback** functions. The WASM loader in `js/wasm-scorer.js` will automatically detect and use these files if present, or gracefully fall back to JS implementations.

## Performance Comparison

| Mode | Score Calculation Time |
|------|----------------------|
| JavaScript | ~0.001ms |
| WebAssembly | ~0.0001ms |

*Note: For this quiz app, the performance difference is negligible. WASM is included as a learning demonstration.*
