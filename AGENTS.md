# AGENTS.md

## Code Style & Development Guidelines

This document describes the **coding style**, **project structure**, and **development approach** for this project.  
The goal is to deliver a **simple, elegant, and high-quality WebGL/Three.js experience** — not an unnecessarily large or over-engineered codebase.

---

## 🎯 Philosophy

- **Simplicity over complexity** — Avoid writing “big” code for the sake of size. Every line should serve a purpose.
- **Elegance over flashiness** — Focus on clean visuals, smooth interactions, and consistent performance.
- **Quality over quantity** — A small number of well-crafted features is more valuable than many poorly implemented ones.
- **Understandability** — Write code that another developer can easily follow and extend.
- **Maintainability** — Ensure clear structure, reusable components, and minimal technical debt.

---

## 📂 Project Structure

- **`src/`** — All source files.
  - **`core/`** — Scene setup, renderer, camera, controls.
  - **`models/`** — Model loading and optimization logic.
  - **`shaders/`** — Custom shaders (minimal, only if needed).
  - **`components/`** — Reusable UI or scene components.
  - **`utils/`** — Helper functions (math, loaders, etc.).
- **`public/`** — Static assets (optimized models, textures, HDRIs).
- **`README.md`** — Project overview, decisions, and setup instructions.
- **`.nvmrc`** — Node.js version used for the project.

---

## 🖋 Code Style

### General

- Use **vanilla Three.js** for WebGL — no heavy abstractions unless justified.
- Keep files small and focused (prefer <200 lines where possible).
- Prefer **clear naming** over clever but cryptic shortcuts.
- Avoid hardcoding magic numbers — define constants with descriptive names.
- Indent with **2 spaces**, no tabs.
- Semicolons required.

### Comments

- Only write **meaningful comments** that clarify logic, **not** restating the code.
- Use `//` for short explanations above tricky logic.
- Remove leftover commented-out code unless it’s intentionally left for documentation.

Example:

```
// Fade light intensity when object is clicked
gsap.to(light, { intensity: 0.2, duration: 1 });
```

### Variables & Functions

- Use `const` where possible, `let` if value changes.
- Function names: `camelCase`.
- Class names: `PascalCase`.
- Avoid excessive abstraction — only extract functions/classes if reused or logically separated.

### Imports

- Group imports by type: external libraries first, then internal modules, then styles/assets.
- Avoid unused imports.

---

## 🖼 Assets

### Models

- Optimize before importing:
  - Compress textures (`tinypng`, `squoosh.app`).
  - Reduce texture resolution where possible.
  - Remove unused geometry/materials.
- Document optimization decisions in the README.
- Keep model file sizes **as small as possible without sacrificing quality**.

### Textures

- Prefer jpg for photographic textures, PNG/WebP for alpha transparency.
- Keep texture resolution reasonable (≤ 2K unless absolutely necessary).
- Compress before committing.

---

## ✨ Features & Interactions

### Required

- **One or more glTF models** (optimized and documented).
- **Scene lighting** using HDRI or well-placed lights.
- **At least one user interaction** (click, drag, scroll, hover).
- **One ShaderMaterial** with simple custom logic (no overly complex GLSL).
- Correct handling of **color space**, **tone mapping**, **device pixel ratio**, and **resize events**.

### Optional (For Bonus Points)

- Post-processing effects (only if relevant to the scene).
- Camera movement beyond default OrbitControls (parallax, smooth transitions).
- Performance tuning for smooth 60fps experience on mobile devices.

---

## ⚡ Performance Guidelines

- Optimize **load time**: preload assets, lazy load non-critical elements.
- Keep **GPU usage in mind**: limit draw calls, avoid huge textures.
- Test on both desktop and mobile for performance and responsiveness.
- Use framerate monitoring (`stats.js` or equivalent) during development.

---

## 📄 Documentation

- **README.md** must:
  - Explain the idea and purpose of the project.
  - Document optimization choices.
  - List any known issues or compromises.
  - Include installation and run instructions.
- Keep a separate **technical README** for internal implementation details (optional).

---

## 🛑 Anti-Patterns to Avoid

- Overusing ChatGPT-generated code without personal modifications.
- Copy-pasting Three.js examples without adapting them.
- Adding random effects just to fill space.
- Overly complicated shaders with little visible benefit.
- Bloated dependencies for trivial functionality.

---

## ✅ Summary Checklist

Before final delivery, ensure:

- [ ] Models & textures optimized.
- [ ] One meaningful interaction implemented.
- [ ] Scene lighting is intentional and documented.
- [ ] ShaderMaterial has actual custom logic.
- [ ] README files are complete.
- [ ] `.nvmrc` is present and correct.
- [ ] Code is clean, readable, and maintainable.
- [ ] Runs smoothly on desktop and mobile.

---

If something is unclear or a decision is blocking progress, **ask before implementing**.  
Our goal is to **stay lean, polished, and purposeful**.
