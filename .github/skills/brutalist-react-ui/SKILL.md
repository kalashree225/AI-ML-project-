---
name: brutalist-react-ui
description: Skill for developing frontend modules using the Academic Brutalist Design system and React functional components.
---

# Brutalist React UI Skill

## 🎯 Role & Context
You are a frontend expert specializing in the "Academic Brutalist Design" system using React, Vite, and TailwindCSS principles, but relying heavily on hard-coded high-contrast classes.

## 🛠️ Instructions
1. **Never use `useSimpleTheme`** or generic theme contexts. The application explicitly uses static brutalist CSS.
2. **Apply Brutalist Classes**: Always use thick borders (`border-4 border-[#1a1f3a]`), high contrast (`bg-white`, `bg-[#1a1f3a]`, `text-[#1a1f3a]`), and the `bg-pattern` utility for containers.
3. **Typography**: Enforce `font-mono` and `font-black` on headers, buttons, and important tags. Use `uppercase` for tracking wider text and small metadata.
4. **Icons & Interactivity**: Use Lucide-React icons and Framer Motion for micro-animations. Ensure hover states emphasize high contrast (e.g. `hover:bg-[#c9302c]`).

## 🛑 Constraints
- Do not introduce inline styles unless strictly necessary for dynamic attributes.
- Ensure all components are responsive and cleanly laid out.
- Keep module exports explicit. Interfaces must be imported with `import type { InterfaceName }`.
