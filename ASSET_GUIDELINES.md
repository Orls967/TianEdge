# 3D Asset & Modeling Guidelines — TIANEDGE

**Document ID:** `TIANEDGE-ASSET-001`  
**Product Name:** TIANEDGE — Semiconductor & Microprocessor Exploration Platform  
**Primary Format:** glTF 2.0 / Binary `.glb` + Hybrid Procedural Three.js Geometry  

---

## 1. Purpose and Engineering Honesty Policy

This document defines the 3D asset architecture, modeling fidelity boundaries, mesh naming conventions, PBR material rules, optimization budgets, fallback strategy, and provenance/licensing requirements for **TIANEDGE**.

**Mandatory Honesty Boundary (`C-09`, `C-11`):**
- Physical CPU package parts (`pkg-ihs`, `pkg-substrate`, etc.) are **conceptual engineering reconstructions**, not proprietary manufacturer CAD replicas.
- Group E digital logic assets (`logic-transistors`, `logic-gates`, etc.) are **enlarged conceptual educational models**, never literal nanometer-scale physical geometry.
- Group B/C/D architectural die/core sub-blocks are **structured functional geometry** communicating microarchitectural hierarchy cleanly.

---

## 2. Asset Architecture & 4-Tier Asset Strategy

| Asset Tier | Covered Components | Authoring Approach | File / Module Location |
|---|---|---|---|
| **Tier 1 — Physical Package GLB** | `pkg-ihs`, `pkg-silicon-die`, `pkg-substrate`, `pkg-solder-bumps`, `pkg-electrical-contacts` | Procedurally generated `.glb` (`cpu_package_v1.glb`, from `apps/web/scripts/generate_models.py`) with chamfered IHS, substrate with MLCCs, and the 16 × 16 C4 bump / 26 × 26 LGA land arrays merged into one mesh per component (one draw call each, and they follow exploded-view offsets). | `apps/web/public/models/cpu_package_v1.glb` |
| **Tier 2 — Die & Core Architectural Scene** | Group B (`die-*`), Group C (`core-*`), Group D (`mem-*`), `comm-memory-interface` | Modular clean `.glb` (`cpu_die_core_v1.glb`) or precision procedural extruded `BoxGeometry`/`RoundedBox` hierarchy with engraved floorplan micro-normal textures for zero aliasing and exact runtime highlight control. | `apps/web/public/models/cpu_die_core_v1.glb` + procedural sub-assemblies |
| **Tier 3 — Enlarged Conceptual Logic Models** | Group E (`logic-transistors`, `logic-gates`, `logic-flip-flops`, `logic-multiplexers`, `logic-adders`, `logic-combinational`, `logic-sequential`) | Dedicated lightweight `.glb` (`logic_foundation_v1.glb`) or crisp procedural educational assemblies loaded lazily when isolated/selected. | `apps/web/public/models/logic_foundation_v1.glb` |
| **Tier 4 — Signal & Bus Overlays** | `comm-internal-buses`, `comm-data-paths`, `comm-control-signals`, `comm-clock-distribution`, `comm-interconnect-network` | Procedural Three.js `TubeGeometry` / `Line2` splines and instanced pulse spheres anchored directly to component world anchor coordinates. | `apps/web/src/scene/ProceduralSubassemblies.tsx`, `apps/web/src/scene/dataPaths.ts` |

---

## 3. Canonical Mesh Naming & Metadata Mapping Contract

Every selectable mesh inside `.glb` files or procedural scene groups **must** obey this exact naming pattern so the TypeScript loader automatically binds meshes to `DATA_MODEL.md` metadata:

```text
tianedge__<componentId>__<submeshRole>
```

### Valid Examples

- `tianedge__pkg-ihs__lid`
- `tianedge__pkg-substrate__pcb_core`
- `tianedge__pkg-substrate__smd_caps`
- `tianedge__die-cpu-cores__core_0`
- `tianedge__core-alu__datapath_body`
- `tianedge__mem-l3-cache__sram_bank_array`
- `tianedge__logic-transistors__finfet_gate`

### Loader Binding Rules

1. On scene mount, the asset registry parser splits mesh `name` on `__`, extracts `<componentId>`, validates it against the canonical 36-component dictionary, and registers the `THREE.Object3D` handle into `SceneComponentRegistry`.
2. Any mesh lacking a valid `tianedge__<componentId>__*` prefix is treated as non-interactive structural scenery (or flagged as a test failure during automated GLB validation).
3. Multiple submeshes sharing the same `<componentId>` (e.g., `core_0`..`core_3` for `die-cpu-cores`, or instanced contacts) highlight and inspect cohesively as one logical component unit.

---

## 4. Material & PBR Surface Guidelines

To achieve the **Semiconductor Engineering Laboratory + Digital Technology Museum** aesthetic with minimal draw calls, share materials across components using a constrained PBR palette:

| Material ID | Target Surface | Base Color / Hex | Metalness | Roughness | Notes |
|---|---|---|---|---|---|
| `mat_ihs_nickel` | `pkg-ihs` | `#94A3B8` (Brushed Nickel-Silver) | `0.88` | `0.28` | Subtle anisotropic brushed normal map; crisp specular bevel catch. |
| `mat_substrate_abf` | `pkg-substrate` | `#0F294A` (Deep Blue-Teal Organic Laminate) | `0.12` | `0.62` | Matte solder-mask finish with subtle copper trace normal/emissive detail. |
| `mat_gold_contact` | `pkg-electrical-contacts`, gold pins | `#FBBF24` (Warm Gold) | `0.95` | `0.22` | Used on instanced LGA pads and substrate bond fingers. |
| `mat_solder_sac` | `pkg-solder-bumps` | `#CBD5E1` (Tin-Silver-Copper) | `0.85` | `0.30` | Instanced array beneath die. |
| `mat_silicon_die` | `pkg-silicon-die` | `#111827` (Dark Polished Silicon) | `0.65` | `0.14` | Subtle thin-film iridescence/clearcoat (`0.4`) reflecting cool studio environment. |
| `mat_arch_block` | `die-*`, `core-*`, `mem-*` | `#1E293B` / `#172554` | `0.35` | `0.38` | Highlightable via per-instance/cloned emissive accent (`#00E5FF` on hover/select, `#FBBF24` on control active). |
| `mat_signal_cyan` | `comm-data-paths`, active pulses | `#22D3EE` (Emissive Cyan) | `0.0` | `0.2` | Additive/emissive intensity `1.4–2.2` (restrained glow, no heavy bloom washout). |
| `mat_signal_gold` | `comm-control-signals` | `#F59E0B` (Emissive Gold) | `0.0` | `0.25` | Clearly differentiates control assertions from data payloads. |

---

## 5. Geometry, Texture & Performance Optimization Budgets

| Metric | Hard Target Budget | Enforcement Method |
|---|---|---|
| **Active Triangle Count** (`Full Assembly` / `Internal Architecture`) | `<= 150,000` triangles | Merge repeated arrays (C4 bumps, LGA lands, SRAM cells) into one mesh per component node. Verified by Playwright: `/anatomy` renders ~20 k triangles in 23 draw calls. |
| **Draw Calls** (Standard Exploration View) | `<= 120` draw calls | Merge static non-selectable sub-meshes per component; share PBR materials. |
| **GLB Binary Payload Size** | `<= 4 MB` initial (`cpu_package_v1.glb` + `cpu_die_core_v1.glb`); `<= 3 MB` lazy (`logic_foundation_v1.glb`) | Currently ~1.4 MB uncompressed (~0.2 MB gzip-transferred by GitHub Pages); Draco / `meshopt` via `gltf-transform` remains the path if assets grow. |
| **Texture Resolution** | `<= 1024 × 1024 px` (normals/roughness/AO) | Pack Roughness/Metalness/AO into single ORM channel texture; prefer procedural shaders for silicon floorplan grids. |
| **Memory Footprint** | `<= 180 MB` WebGL GPU + JS Heap combined for 3D layer | Dispose unmounted conceptual Tier 3 geometries/textures cleanly when leaving isolated mode. |
| **Section Cut Compatibility** | Watertight / manifold closed meshes or `THREE.DoubleSide` stencil cap | `pkg-ihs` and `pkg-substrate` must support `gl.localClippingEnabled = true` without ugly hollow artifacts. |

---

## 6. Asset Hierarchy & Coordinate System

- **Units:** `1 Three.js unit = 10 cm` scaled conceptual display space (normalized so the full CPU Package fits comfortably within a `4.0 × 0.8 × 4.0` bounding box centered at world origin `[0, 0, 0]`, `+Y` up).
- **Exploded View Offsets (`+Y` Vertical Stack):**
  - `pkg-ihs`: `+1.40` units
  - `pkg-silicon-die` (+ Group B/C/D internal die stack): `+0.55` units
  - `pkg-solder-bumps`: `+0.18` units
  - `pkg-substrate`: `0.00` units (anchor plane)
  - `pkg-electrical-contacts`: `-0.22` units
- **Camera Framing Presets:** Each of the 36 components defines a `cameraPreset: { position: [x, y, z], target: [x, y, z] }` in `DATA_MODEL.md` / static metadata so `Guided Camera Focus` centers every selection predictably.

---

## 7. Fallback Assets, Provenance & Licensing

### 7.1 Procedural Fallback Strategy

If an external `.glb` fails network loading or is stripped in a lightweight test environment, the Three.js scene factory **must** automatically synthesize clean labeled procedural geometry (`BoxGeometry`, `CylinderGeometry`, `TubeGeometry`, `InstancedMesh`) matching the exact `tianedge__<componentId>__fallback` naming contract. Users never experience a blank black screen.

### 7.2 Asset Provenance & Licensing Manifest

Every binary `.glb`, texture, HDRI environment map, or icon shipped in `apps/web/public/` must be logged in `apps/web/public/models/ASSET_MANIFEST.json`:

```json
{
  "assets": [
    {
      "assetId": "cpu_package_v1",
      "path": "/models/cpu_package_v1.glb",
      "author": "TIANEDGE Project Authors",
      "source": "Procedural geometry generated by apps/web/scripts/generate_models.py (no external meshes)",
      "cadAccuracyClaim": "conceptual_educational_reconstruction",
      "triangleCount": 18211,
      "compressedWith": "none (served gzip-compressed by the host)"
    }
  ]
}
```

- **Allowed Licenses:** `CC0-1.0`, `MIT`, `Apache-2.0`, or `CC-BY-4.0` (with mandatory attribution rendered in `Technical Library -> Asset Attributions`).
- **Forbidden Assets:** Proprietary vendor CAD leaks, unlicensed commercial stock meshes, or assets with non-commercial (`NC`) restrictions if project distribution permits general open deployment.
