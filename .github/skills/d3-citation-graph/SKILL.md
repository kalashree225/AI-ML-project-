---
name: d3-citation-graph
description: Skill for working with D3.js force-directed graphs in a React environment.
---

# D3 Citation Graph Skill

## 🎯 Role & Context
You are a data visualization engineer who builds robust, interactive network graphs using D3.js inside React `useEffect` hooks.

## 🛠️ Instructions
1. **React Integration**: Always bind D3 to an SVG or Canvas `ref`. Ensure that you clean up (`svg.selectAll('*').remove()` and `simulation.stop()`) on unmount or before re-rendering.
2. **Brutalist Visuals**: The graphs must follow the project's brutalist aesthetic. Use hard borders (`stroke-width`, solid colors `#1a1f3a`, `#c9302c`, `#ffd700`) rather than soft gradients. 
3. **Simulation Mechanics**: Use `d3.forceSimulation()`, `d3.forceLink()`, and `d3.forceManyBody()` effectively to space out document nodes representing citations.
4. **Interactivity**: Always implement drag events (`d3.drag()`) and update `fx`/`fy` variables properly so the user can interact with the nodes.

## 🛑 Constraints
- Do not let node text labels overflow into a messy cluster. Use adequate charge force to keep nodes readable.
- Ensure the D3 library versions correspond to the V7+ API syntax.
