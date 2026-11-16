#!/usr/bin/env python3
"""
Generate watertight, low-poly binary glTF 2.0 (.glb) assets for TIANEDGE 3D viewer:
- cpu_package_v1.glb
- cpu_die_core_v1.glb
- logic_foundation_v1.glb
- ASSET_MANIFEST.json

Each mesh node strictly follows `tianedge__<componentId>__<submeshRole>` naming
and matches the canonical components in apps/web/public/data/components.json.
"""

from __future__ import annotations

import json
import math
import os
import struct
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
COMPONENTS_PATH = ROOT / "public" / "data" / "components.json"
OUT_DIR = ROOT / "public" / "models"


class MeshBuilder:
    def __init__(self) -> None:
        self.positions: list[tuple[float, float, float]] = []
        self.normals: list[tuple[float, float, float]] = []
        self.indices: list[int] = []

    def add_quad(
        self,
        p0: tuple[float, float, float],
        p1: tuple[float, float, float],
        p2: tuple[float, float, float],
        p3: tuple[float, float, float],
        normal: tuple[float, float, float],
    ) -> None:
        base = len(self.positions)
        self.positions.extend([p0, p1, p2, p3])
        self.normals.extend([normal, normal, normal, normal])
        self.indices.extend([base, base + 1, base + 2, base, base + 2, base + 3])

    def add_tri(
        self,
        p0: tuple[float, float, float],
        p1: tuple[float, float, float],
        p2: tuple[float, float, float],
        normal: tuple[float, float, float],
    ) -> None:
        base = len(self.positions)
        self.positions.extend([p0, p1, p2])
        self.normals.extend([normal, normal, normal])
        self.indices.extend([base, base + 1, base + 2])

    def add_box(
        self,
        cx: float,
        cy: float,
        cz: float,
        sx: float,
        sy: float,
        sz: float,
    ) -> None:
        hx, hy, hz = sx * 0.5, sy * 0.5, sz * 0.5
        x0, x1 = cx - hx, cx + hx
        y0, y1 = cy - hy, cy + hy
        z0, z1 = cz - hz, cz + hz

        # +Y top
        self.add_quad((x0, y1, z1), (x1, y1, z1), (x1, y1, z0), (x0, y1, z0), (0, 1, 0))
        # -Y bottom
        self.add_quad((x0, y0, z0), (x1, y0, z0), (x1, y0, z1), (x0, y0, z1), (0, -1, 0))
        # +Z front
        self.add_quad((x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1), (0, 0, 1))
        # -Z back
        self.add_quad((x1, y0, z0), (x0, y0, z0), (x0, y1, z0), (x1, y1, z0), (0, 0, -1))
        # +X right
        self.add_quad((x1, y0, z1), (x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (1, 0, 0))
        # -X left
        self.add_quad((x0, y0, z0), (x0, y0, z1), (x0, y1, z1), (x0, y1, z0), (-1, 0, 0))

    def add_octagonal_prism(
        self,
        cx: float,
        cy: float,
        cz: float,
        sx: float,
        sy: float,
        sz: float,
        chamfer: float,
    ) -> None:
        """Watertight chamfered slab / IHS lid."""
        hx, hy, hz = sx * 0.5, sy * 0.5, sz * 0.5
        c = min(chamfer, hx * 0.4, hz * 0.4)
        y0, y1 = cy - hy, cy + hy
        ring = [
            (cx - hx + c, cz + hz),
            (cx + hx - c, cz + hz),
            (cx + hx, cz + hz - c),
            (cx + hx, cz - hz + c),
            (cx + hx - c, cz - hz),
            (cx - hx + c, cz - hz),
            (cx - hx, cz - hz + c),
            (cx - hx, cz + hz - c),
        ]
        n_pts = len(ring)

        # Top cap triangle fan
        top_center = (cx, y1, cz)
        for i in range(n_pts):
            a = ring[i]
            b = ring[(i + 1) % n_pts]
            self.add_tri(top_center, (a[0], y1, a[1]), (b[0], y1, b[1]), (0, 1, 0))

        # Bottom cap triangle fan
        bot_center = (cx, y0, cz)
        for i in range(n_pts):
            a = ring[i]
            b = ring[(i + 1) % n_pts]
            self.add_tri(bot_center, (b[0], y0, b[1]), (a[0], y0, a[1]), (0, -1, 0))

        # Side walls
        for i in range(n_pts):
            ax, az = ring[i]
            bx, bz = ring[(i + 1) % n_pts]
            dx = bx - ax
            dz = bz - az
            nx, nz = dz, -dx
            length = math.hypot(nx, nz) or 1.0
            normal = (nx / length, 0.0, nz / length)
            self.add_quad(
                (ax, y0, az),
                (bx, y0, bz),
                (bx, y1, bz),
                (ax, y1, az),
                normal,
            )

    def add_cylinder(
        self,
        cx: float,
        cy: float,
        cz: float,
        radius: float,
        height: float,
        segments: int = 8,
    ) -> None:
        """Watertight vertical prism approximating a cylinder (solder bumps, fiducials, vias)."""
        y0, y1 = cy - height * 0.5, cy + height * 0.5
        ring = [
            (cx + radius * math.cos(2 * math.pi * i / segments), cz + radius * math.sin(2 * math.pi * i / segments))
            for i in range(segments)
        ]
        for i in range(segments):
            a = ring[i]
            b = ring[(i + 1) % segments]
            self.add_tri((cx, y1, cz), (b[0], y1, b[1]), (a[0], y1, a[1]), (0, 1, 0))
            self.add_tri((cx, y0, cz), (a[0], y0, a[1]), (b[0], y0, b[1]), (0, -1, 0))
            mid = 2 * math.pi * (i + 0.5) / segments
            self.add_quad(
                (b[0], y0, b[1]),
                (a[0], y0, a[1]),
                (a[0], y1, a[1]),
                (b[0], y1, b[1]),
                (math.cos(mid), 0.0, math.sin(mid)),
            )

    def add_frame(
        self,
        cx: float,
        cy: float,
        cz: float,
        sx: float,
        sy: float,
        sz: float,
        width: float,
    ) -> None:
        """Rectangular ring of four bars (seal rings, core outlines, interconnect rings)."""
        self.add_box(cx, cy, cz + (sz - width) * 0.5, sx, sy, width)
        self.add_box(cx, cy, cz - (sz - width) * 0.5, sx, sy, width)
        self.add_box(cx + (sx - width) * 0.5, cy, cz, width, sy, sz - 2 * width)
        self.add_box(cx - (sx - width) * 0.5, cy, cz, width, sy, sz - 2 * width)

    def add_grid(
        self,
        cx: float,
        cy: float,
        cz: float,
        sx: float,
        sz: float,
        nx: int,
        nz: int,
        height: float,
        gap: float,
    ) -> None:
        """nx * nz array of cells filling an sx * sz footprint (SRAM sub-arrays, ROM, PLA planes)."""
        cw = (sx - gap * (nx - 1)) / nx
        cd = (sz - gap * (nz - 1)) / nz
        for ix in range(nx):
            for iz in range(nz):
                x = cx - sx * 0.5 + cw * 0.5 + ix * (cw + gap)
                z = cz - sz * 0.5 + cd * 0.5 + iz * (cd + gap)
                self.add_box(x, cy, z, cw, height, cd)

    def triangle_count(self) -> int:
        return len(self.indices) // 3


def pack_glb(
    nodes_spec: list[tuple[str, MeshBuilder, int]],
    materials: list[dict[str, Any]],
) -> tuple[bytes, dict[str, Any]]:
    bin_chunks: list[bytes] = []
    buffer_views: list[dict[str, Any]] = []
    accessors: list[dict[str, Any]] = []
    meshes: list[dict[str, Any]] = []
    nodes: list[dict[str, Any]] = []

    byte_offset = 0
    total_tris = 0

    for node_name, builder, mat_idx in nodes_spec:
        if len(builder.positions) >= 65535:
            raise SystemExit(f"ERROR: {node_name} exceeds uint16 index range ({len(builder.positions)} vertices)")
        total_tris += builder.triangle_count()

        # Positions
        pos_bytes = bytearray()
        min_v = [float("inf"), float("inf"), float("inf")]
        max_v = [float("-inf"), float("-inf"), float("-inf")]
        for x, y, z in builder.positions:
            pos_bytes.extend(struct.pack("<fff", x, y, z))
            min_v[0] = min(min_v[0], x)
            min_v[1] = min(min_v[1], y)
            min_v[2] = min(min_v[2], z)
            max_v[0] = max(max_v[0], x)
            max_v[1] = max(max_v[1], y)
            max_v[2] = max(max_v[2], z)

        pos_bv_idx = len(buffer_views)
        buffer_views.append(
            {
                "buffer": 0,
                "byteOffset": byte_offset,
                "byteLength": len(pos_bytes),
                "target": 34962,
            }
        )
        bin_chunks.append(bytes(pos_bytes))
        byte_offset += len(pos_bytes)

        pos_acc_idx = len(accessors)
        accessors.append(
            {
                "bufferView": pos_bv_idx,
                "componentType": 5126,
                "count": len(builder.positions),
                "type": "VEC3",
                "min": min_v,
                "max": max_v,
            }
        )

        # Normals
        norm_bytes = bytearray()
        for nx, ny, nz in builder.normals:
            norm_bytes.extend(struct.pack("<fff", nx, ny, nz))

        norm_bv_idx = len(buffer_views)
        buffer_views.append(
            {
                "buffer": 0,
                "byteOffset": byte_offset,
                "byteLength": len(norm_bytes),
                "target": 34962,
            }
        )
        bin_chunks.append(bytes(norm_bytes))
        byte_offset += len(norm_bytes)

        norm_acc_idx = len(accessors)
        accessors.append(
            {
                "bufferView": norm_bv_idx,
                "componentType": 5126,
                "count": len(builder.normals),
                "type": "VEC3",
            }
        )

        # Indices (uint16)
        idx_bytes = bytearray()
        for idx in builder.indices:
            idx_bytes.extend(struct.pack("<H", idx))
        while len(idx_bytes) % 4 != 0:
            idx_bytes.extend(b"\x00")

        idx_bv_idx = len(buffer_views)
        buffer_views.append(
            {
                "buffer": 0,
                "byteOffset": byte_offset,
                "byteLength": len(builder.indices) * 2,
                "target": 34963,
            }
        )
        bin_chunks.append(bytes(idx_bytes))
        byte_offset += len(idx_bytes)

        idx_acc_idx = len(accessors)
        accessors.append(
            {
                "bufferView": idx_bv_idx,
                "componentType": 5123,
                "count": len(builder.indices),
                "type": "SCALAR",
            }
        )

        mesh_idx = len(meshes)
        meshes.append(
            {
                "name": node_name,
                "primitives": [
                    {
                        "attributes": {"POSITION": pos_acc_idx, "NORMAL": norm_acc_idx},
                        "indices": idx_acc_idx,
                        "material": mat_idx,
                    }
                ],
            }
        )

        nodes.append({"name": node_name, "mesh": mesh_idx})

    bin_blob = b"".join(bin_chunks)
    while len(bin_blob) % 4 != 0:
        bin_blob += b"\x00"

    gltf = {
        "asset": {"version": "2.0", "generator": "TIANEDGE Geometry Generator v2"},
        "scene": 0,
        "scenes": [{"name": "TIANEDGE_Scene", "nodes": list(range(len(nodes)))}],
        "nodes": nodes,
        "meshes": meshes,
        "materials": materials,
        "accessors": accessors,
        "bufferViews": buffer_views,
        "buffers": [{"byteLength": len(bin_blob)}],
    }

    json_bytes = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    while len(json_bytes) % 4 != 0:
        json_bytes += b" "

    total_length = 12 + 8 + len(json_bytes) + 8 + len(bin_blob)
    header = struct.pack("<III", 0x46546C67, 2, total_length)
    json_chunk = struct.pack("<II", len(json_bytes), 0x4E4F534A) + json_bytes
    bin_chunk = struct.pack("<II", len(bin_blob), 0x004E4942) + bin_blob
    glb = header + json_chunk + bin_chunk

    meta = {
        "nodeCount": len(nodes),
        "triangles": total_tris,
        "bytes": len(glb),
        "nodes": [n["name"] for n in nodes],
    }
    return glb, meta


def make_materials() -> list[dict[str, Any]]:
    return [
        # 0: Brushed Nickel IHS
        {
            "name": "NickelIHS",
            "pbrMetallicRoughness": {
                "baseColorFactor": [0.68, 0.72, 0.78, 1.0],
                "metallicFactor": 0.85,
                "roughnessFactor": 0.28,
            },
        },
        # 1: Polished Silicon Die
        {
            "name": "SiliconWafer",
            "pbrMetallicRoughness": {
                "baseColorFactor": [0.13, 0.16, 0.22, 1.0],
                "metallicFactor": 0.65,
                "roughnessFactor": 0.18,
            },
        },
        # 2: Package Emerald Substrate
        {
            "name": "PackageSubstrate",
            "pbrMetallicRoughness": {
                "baseColorFactor": [0.07, 0.24, 0.19, 1.0],
                "metallicFactor": 0.12,
                "roughnessFactor": 0.58,
            },
        },
        # 3: Copper / Gold Interconnect & Contacts
        {
            "name": "GoldCopper",
            "pbrMetallicRoughness": {
                "baseColorFactor": [0.92, 0.71, 0.22, 1.0],
                "metallicFactor": 0.90,
                "roughnessFactor": 0.25,
            },
        },
        # 4: Logic Teal / Cyan Active Block
        {
            "name": "LogicCyan",
            "pbrMetallicRoughness": {
                "baseColorFactor": [0.06, 0.68, 0.78, 1.0],
                "metallicFactor": 0.35,
                "roughnessFactor": 0.32,
            },
        },
        # 5: SRAM Navy / Indigo Block
        {
            "name": "SramIndigo",
            "pbrMetallicRoughness": {
                "baseColorFactor": [0.18, 0.30, 0.58, 1.0],
                "metallicFactor": 0.30,
                "roughnessFactor": 0.40,
            },
        },
        # 6: Slate Graphite Structural Block
        {
            "name": "SlateGraphite",
            "pbrMetallicRoughness": {
                "baseColorFactor": [0.24, 0.28, 0.36, 1.0],
                "metallicFactor": 0.42,
                "roughnessFactor": 0.42,
            },
        },
        # 7: MLCC ceramic capacitor body
        {
            "name": "CeramicMLCC",
            "pbrMetallicRoughness": {
                "baseColorFactor": [0.46, 0.36, 0.24, 1.0],
                "metallicFactor": 0.05,
                "roughnessFactor": 0.62,
            },
        },
        # 8: Laser marking / dark oxide
        {
            "name": "LaserMark",
            "pbrMetallicRoughness": {
                "baseColorFactor": [0.30, 0.33, 0.38, 1.0],
                "metallicFactor": 0.55,
                "roughnessFactor": 0.55,
            },
        },
        # 9: Amber logic (control / sequencing)
        {
            "name": "AmberLogic",
            "pbrMetallicRoughness": {
                "baseColorFactor": [0.85, 0.55, 0.12, 1.0],
                "metallicFactor": 0.30,
                "roughnessFactor": 0.35,
            },
        },
    ]


def build_package_glb(materials: list[dict[str, Any]]) -> tuple[bytes, dict[str, Any]]:
    specs: list[tuple[str, MeshBuilder, int]] = []

    # ---- pkg-ihs: nickel-plated copper lid -------------------------------------------------
    ihs = MeshBuilder()
    ihs.add_octagonal_prism(0.0, 0.31, 0.0, 2.75, 0.12, 2.75, 0.22)  # main plateau
    ihs.add_octagonal_prism(0.0, 0.23, 0.0, 3.02, 0.05, 3.02, 0.18)  # sealant skirt / flange
    ihs.add_octagonal_prism(0.0, 0.374, 0.0, 2.25, 0.008, 2.25, 0.16)  # machined top land
    # Flange "ears" at the four sides where the retention mechanism clamps.
    for sx, sz, w, d in ((0.0, 1.47, 0.9, 0.12), (0.0, -1.47, 0.9, 0.12), (1.47, 0.0, 0.12, 0.9), (-1.47, 0.0, 0.12, 0.9)):
        ihs.add_box(sx, 0.262, sz, w, 0.014, d)
    specs.append(("tianedge__pkg-ihs__lid", ihs, 0))

    marking = MeshBuilder()
    # Laser-etched product lines (generic, no vendor branding) and a 2D matrix code.
    for i, length in enumerate((1.2, 0.95, 0.7)):
        marking.add_box(-0.35 + (1.2 - length) * -0.5, 0.379, -0.55 + i * 0.13, length, 0.003, 0.06)
    marking.add_grid(0.72, 0.379, 0.62, 0.32, 0.32, 6, 6, 0.003, 0.012)
    specs.append(("tianedge__pkg-ihs__marking", marking, 8))

    pin1 = MeshBuilder()
    pin1.add_tri((-1.05, 0.38, -1.05), (-0.9, 0.38, -1.05), (-1.05, 0.38, -0.9), (0, 1, 0))
    pin1.add_tri((-1.05, 0.376, -1.05), (-1.05, 0.376, -0.9), (-0.9, 0.376, -1.05), (0, -1, 0))
    specs.append(("tianedge__pkg-ihs__pin1-mark", pin1, 3))

    # ---- pkg-silicon-die: flip-chip die with seal ring -------------------------------------
    die = MeshBuilder()
    die.add_box(0.0, 0.12, 0.0, 1.92, 0.06, 1.92)
    specs.append(("tianedge__pkg-silicon-die__slab", die, 1))

    seal = MeshBuilder()
    seal.add_frame(0.0, 0.151, 0.0, 1.9, 0.004, 1.9, 0.035)
    seal.add_frame(0.0, 0.151, 0.0, 1.8, 0.004, 1.8, 0.015)
    specs.append(("tianedge__pkg-silicon-die__seal-ring", seal, 3))

    # ---- pkg-substrate: organic build-up substrate ----------------------------------------
    sub = MeshBuilder()
    sub.add_octagonal_prism(0.0, 0.0, 0.0, 3.45, 0.11, 3.45, 0.06)
    # Underfill fillet around the die footprint.
    sub.add_frame(0.0, 0.07, 0.0, 2.04, 0.03, 2.04, 0.07)
    specs.append(("tianedge__pkg-substrate__board", sub, 2))

    caps = MeshBuilder()
    terminals = MeshBuilder()
    # MLCC decoupling capacitors in the strip between the IHS flange and substrate edge.
    for i in range(11):
        t = -1.25 + i * 0.25
        for x, z, along_x in ((t, 1.62, True), (t, -1.62, True), (1.62, t, False), (-1.62, t, False)):
            bx, bz = (0.08, 0.05) if along_x else (0.05, 0.08)
            caps.add_box(x, 0.075, z, bx, 0.04, bz)
            off = 0.05
            tx, tz = (off, 0.0) if along_x else (0.0, off)
            terminals.add_box(x - tx, 0.075, z - tz, 0.022 if along_x else 0.052, 0.042, 0.052 if along_x else 0.022)
            terminals.add_box(x + tx, 0.075, z + tz, 0.022 if along_x else 0.052, 0.042, 0.052 if along_x else 0.022)
    # Fiducials and pin-1 triangle on the substrate corners.
    for fx, fz in ((1.6, 1.6), (-1.6, 1.6), (1.6, -1.6)):
        terminals.add_cylinder(fx, 0.057, fz, 0.035, 0.006, 12)
    terminals.add_tri((-1.68, 0.058, -1.68), (-1.48, 0.058, -1.68), (-1.68, 0.058, -1.48), (0, 1, 0))
    specs.append(("tianedge__pkg-substrate__mlcc", caps, 7))
    specs.append(("tianedge__pkg-substrate__terminals", terminals, 3))

    # ---- pkg-solder-bumps: 16 x 16 C4 flip-chip bump array --------------------------------
    bumps = MeshBuilder()
    pitch = 0.11
    for gx in range(16):
        for gz in range(16):
            bumps.add_cylinder((gx - 7.5) * pitch, 0.072, (gz - 7.5) * pitch, 0.03, 0.034, 8)
    specs.append(("tianedge__pkg-solder-bumps__array", bumps, 3))

    # ---- pkg-electrical-contacts: LGA land grid (26 x 26 minus centre cavity) --------------
    lga = MeshBuilder()
    lpitch = 0.12
    for gx in range(26):
        for gz in range(26):
            if 9 <= gx <= 16 and 9 <= gz <= 16:
                continue  # central cavity holds the land-side capacitors
            lga.add_box((gx - 12.5) * lpitch, -0.061, (gz - 12.5) * lpitch, 0.078, 0.012, 0.078)
    specs.append(("tianedge__pkg-electrical-contacts__pads", lga, 3))

    lsc = MeshBuilder()
    for ix in range(4):
        for iz in range(3):
            lsc.add_box(-0.33 + ix * 0.22, -0.075, -0.25 + iz * 0.25, 0.12, 0.04, 0.07)
    specs.append(("tianedge__pkg-electrical-contacts__land-side-caps", lsc, 7))

    return pack_glb(specs, materials)


# Footprint of one core tile; cores 1..3 get a replica of core 0's block layout so the die
# reads as a 4-core floorplan even though only core 0 carries selectable sub-blocks.
CORE0_LAYOUT: list[tuple[float, float, float, float, float]] = [
    # dx, dz (offset from quadrant centre), sx, sz, height
    (-0.03, -0.03, 0.22, 0.18, 0.05),   # ALU
    (-0.10, 0.20, 0.22, 0.14, 0.06),    # control unit
    (0.15, 0.00, 0.16, 0.18, 0.04),     # registers
    (-0.17, -0.13, 0.16, 0.14, 0.05),   # decoder
    (0.20, 0.20, 0.18, 0.14, 0.05),     # LSU
    (-0.27, -0.21, 0.18, 0.16, 0.05),   # L1I
    (0.30, 0.20, 0.16, 0.16, 0.05),     # L1D
    (-0.31, 0.10, 0.16, 0.34, 0.035),   # L2
]


def build_die_core_glb(materials: list[dict[str, Any]]) -> tuple[bytes, dict[str, Any]]:
    specs: list[tuple[str, MeshBuilder, int]] = []
    quadrants = [(-0.45, -0.45), (0.45, -0.45), (-0.45, 0.45), (0.45, 0.45)]

    # ---- die-cpu-cores: four replicated core tiles ----------------------------------------
    cpu_cores = MeshBuilder()
    for qx, qz in quadrants:
        cpu_cores.add_box(qx, 0.155, qz, 0.72, 0.025, 0.62)
    specs.append(("tianedge__die-cpu-cores__tiles", cpu_cores, 6))

    core_outline = MeshBuilder()
    replicas = MeshBuilder()
    for qi, (qx, qz) in enumerate(quadrants):
        core_outline.add_frame(qx, 0.169, qz, 0.72, 0.004, 0.62, 0.012)
        if qi == 0:
            continue
        for dx, dz, sx, sz, h in CORE0_LAYOUT:
            replicas.add_box(qx + dx, 0.168 + h * 0.25, qz + dz, sx, h * 0.5, sz)
    specs.append(("tianedge__die-cpu-cores__outline", core_outline, 3))
    specs.append(("tianedge__die-cpu-cores__replica-blocks", replicas, 6))

    # ---- die-cache-regions: shared LLC banks split into SRAM sub-arrays --------------------
    cache_regions = MeshBuilder()
    cache_regions.add_box(0.0, 0.16, 0.25, 1.56, 0.02, 0.34)
    cache_regions.add_box(0.62, 0.16, -0.25, 0.36, 0.02, 0.56)
    cache_regions.add_grid(0.62, 0.172, -0.25, 0.32, 0.52, 3, 6, 0.006, 0.012)
    specs.append(("tianedge__die-cache-regions__banks", cache_regions, 5))

    # ---- die-execution-units: core-0 execution zone ----------------------------------------
    exec_zone = MeshBuilder()
    exec_zone.add_box(-0.45, 0.165, -0.45, 0.66, 0.012, 0.56)
    specs.append(("tianedge__die-execution-units__zone", exec_zone, 6))

    # ---- die-interconnect: ring bus with ring stops + mesh crossbar -----------------------
    interconnect = MeshBuilder()
    interconnect.add_box(0.0, 0.168, 0.0, 1.72, 0.012, 0.06)
    interconnect.add_box(0.0, 0.168, 0.0, 0.06, 0.012, 1.62)
    interconnect.add_frame(0.0, 0.17, 0.0, 1.78, 0.01, 1.66, 0.03)
    for x in (-0.86, 0.0, 0.86):
        for z in (-0.8, 0.0, 0.8):
            interconnect.add_box(x, 0.178, z, 0.07, 0.022, 0.07)  # ring stops / routers
    specs.append(("tianedge__die-interconnect__ring", interconnect, 3))

    # ---- die-memory-controller: IMC with four DDR channel PHY stripes ----------------------
    mc = MeshBuilder()
    mc.add_box(0.0, 0.16, 0.72, 1.32, 0.03, 0.20)
    for ch in range(4):
        mc.add_box(-0.495 + ch * 0.33, 0.18, 0.72, 0.28, 0.012, 0.14)
        mc.add_grid(-0.495 + ch * 0.33, 0.19, 0.76, 0.24, 0.05, 6, 1, 0.008, 0.012)
    specs.append(("tianedge__die-memory-controller__block", mc, 5))

    # ---- die-io-controller: SerDes / PCIe-style lanes --------------------------------------
    ioc = MeshBuilder()
    ioc.add_box(0.0, 0.16, -0.76, 1.24, 0.03, 0.16)
    for lane in range(16):
        ioc.add_box(-0.56 + lane * 0.0747, 0.18, -0.76, 0.045, 0.012, 0.12)
    specs.append(("tianedge__die-io-controller__block", ioc, 6))

    # ---- core-alu: 32-bit datapath drawn as 8 bit-slices + carry chain + flags -------------
    alu = MeshBuilder()
    alu.add_octagonal_prism(-0.48, 0.205, -0.48, 0.22, 0.03, 0.18, 0.03)
    for i in range(8):
        alu.add_box(-0.567 + i * 0.025, 0.235, -0.495, 0.018, 0.03, 0.11)  # bit slices
    alu.add_box(-0.48, 0.255, -0.495, 0.2, 0.01, 0.012)  # carry-lookahead chain
    alu.add_box(-0.48, 0.232, -0.415, 0.16, 0.025, 0.035)  # result mux
    specs.append(("tianedge__core-alu__unit", alu, 4))

    alu_flags = MeshBuilder()
    for i in range(4):  # Z N C V flag latches
        alu_flags.add_box(-0.54 + i * 0.04, 0.228, -0.555, 0.028, 0.022, 0.022)
    specs.append(("tianedge__core-alu__flags", alu_flags, 9))

    # ---- core-control-unit: sequencer + microcode ROM + state register --------------------
    cu = MeshBuilder()
    cu.add_box(-0.55, 0.205, -0.25, 0.22, 0.03, 0.14)
    cu.add_grid(-0.58, 0.228, -0.25, 0.13, 0.11, 4, 3, 0.016, 0.008)  # microcode ROM
    cu.add_box(-0.475, 0.24, -0.25, 0.05, 0.04, 0.1)  # state register / sequencer
    specs.append(("tianedge__core-control-unit__sequencer", cu, 9))

    # ---- core-registers: R0..R7, four nibble cells each -------------------------------------
    regs = MeshBuilder()
    regs.add_box(-0.30, 0.198, -0.45, 0.17, 0.016, 0.2)
    for r in range(8):
        for c in range(4):
            regs.add_box(-0.36 + c * 0.04, 0.215, -0.535 + r * 0.024, 0.034, 0.018, 0.018)
    specs.append(("tianedge__core-registers__bank", regs, 4))

    # ---- core-instruction-decoder: PLA with AND / OR planes --------------------------------
    dec = MeshBuilder()
    dec.add_box(-0.62, 0.2, -0.58, 0.16, 0.03, 0.14)
    dec.add_grid(-0.655, 0.222, -0.58, 0.07, 0.12, 4, 6, 0.014, 0.006)  # AND plane
    dec.add_grid(-0.575, 0.222, -0.58, 0.05, 0.12, 3, 6, 0.014, 0.006)  # OR plane
    specs.append(("tianedge__core-instruction-decoder__pla", dec, 5))

    # ---- core-execution-units: integer / FP / SIMD pipes -----------------------------------
    core_exec = MeshBuilder()
    core_exec.add_box(-0.46, 0.192, -0.42, 0.26, 0.012, 0.24)
    for lane in range(3):
        core_exec.add_box(-0.46, 0.2, -0.5 + lane * 0.08, 0.24, 0.006, 0.05)
    specs.append(("tianedge__core-execution-units__cluster", core_exec, 6))

    # ---- core-load-store-unit: AGU + load / store queues -----------------------------------
    lsu = MeshBuilder()
    lsu.add_box(-0.25, 0.2, -0.25, 0.18, 0.03, 0.14)
    lsu.add_box(-0.3, 0.235, -0.25, 0.06, 0.04, 0.1)  # AGU
    for e in range(6):
        lsu.add_box(-0.22 + (e % 2) * 0.05, 0.226, -0.3 + (e // 2) * 0.05, 0.04, 0.022, 0.035)
    specs.append(("tianedge__core-load-store-unit__agu", lsu, 4))

    # ---- memory hierarchy: SRAM macros with sense-amp strips --------------------------------
    def sram_macro(cx: float, cz: float, sx: float, sz: float, nx: int, nz: int, base_y: float) -> MeshBuilder:
        mb = MeshBuilder()
        mb.add_box(cx, base_y, cz, sx, 0.02, sz)
        mb.add_grid(cx, base_y + 0.018, cz - sz * 0.06, sx * 0.9, sz * 0.75, nx, nz, 0.016, 0.008)
        mb.add_box(cx, base_y + 0.016, cz + sz * 0.41, sx * 0.9, 0.012, sz * 0.1)  # sense amps
        return mb

    specs.append(("tianedge__mem-l1-icache__sram", sram_macro(-0.72, -0.66, 0.18, 0.16, 3, 3, 0.2), 5))
    specs.append(("tianedge__mem-l1-dcache__sram", sram_macro(-0.14, -0.25, 0.16, 0.16, 3, 3, 0.2), 5))
    specs.append(("tianedge__mem-l2-cache__sram", sram_macro(-0.76, -0.35, 0.16, 0.34, 2, 6, 0.185), 5))

    l3 = MeshBuilder()
    for s in range(4):
        sx = -0.54 + s * 0.36
        l3.add_box(sx, 0.175, 0.25, 0.31, 0.012, 0.26)
        l3.add_grid(sx, 0.188, 0.22, 0.29, 0.18, 3, 2, 0.016, 0.012)
        l3.add_box(sx, 0.186, 0.355, 0.12, 0.012, 0.03)  # slice controller / CBo
    specs.append(("tianedge__mem-l3-cache__slices", l3, 5))

    regfile = MeshBuilder()
    regfile.add_grid(-0.30, 0.232, -0.45, 0.14, 0.15, 4, 4, 0.008, 0.008)
    specs.append(("tianedge__mem-register-file__cells", regfile, 3))

    main_if = MeshBuilder()
    for p in range(-4, 5):
        main_if.add_box(p * 0.14, 0.152, 0.87, 0.08, 0.024, 0.10)
        main_if.add_cylinder(p * 0.14, 0.168, 0.87, 0.022, 0.012, 8)
    specs.append(("tianedge__mem-main-interface__phy", main_if, 3))

    comm_mem_if = MeshBuilder()
    comm_mem_if.add_box(0.0, 0.172, 0.45, 0.18, 0.016, 0.32)
    for lane in range(6):
        comm_mem_if.add_box(-0.06 + lane * 0.024, 0.183, 0.45, 0.012, 0.006, 0.3)
    specs.append(("tianedge__comm-memory-interface__bridge", comm_mem_if, 4))

    return pack_glb(specs, materials)


def build_logic_foundation_glb(materials: list[dict[str, Any]]) -> tuple[bytes, dict[str, Any]]:
    """Enlarged, not-to-scale didactic pods; each primitive gets a recognisable silhouette."""
    specs: list[tuple[str, MeshBuilder, int]] = []
    spacing = 0.48
    xs = [-spacing * 3 + i * spacing for i in range(7)]
    base_y = 0.18

    def pod_base(mb: MeshBuilder, bx: float) -> None:
        mb.add_box(bx, base_y, 0.0, 0.36, 0.03, 0.44)

    # logic-transistors: FinFET (substrate, 3 fins, wrap-around gate, source/drain, contacts)
    bx = xs[0]
    fet = MeshBuilder()
    pod_base(fet, bx)
    for f in range(3):
        fet.add_box(bx - 0.06 + f * 0.06, base_y + 0.05, 0.0, 0.022, 0.07, 0.36)
    specs.append(("tianedge__logic-transistors__mosfet", fet, 6))
    gate = MeshBuilder()
    gate.add_box(bx, base_y + 0.065, 0.0, 0.22, 0.11, 0.06)
    for sz in (-0.13, 0.13):
        gate.add_box(bx, base_y + 0.1, sz, 0.16, 0.025, 0.05)  # source / drain contacts
    gate.add_box(bx, base_y + 0.13, 0.0, 0.05, 0.03, 0.04)  # gate contact
    specs.append(("tianedge__logic-transistors__gate-stack", gate, 3))

    # logic-gates: AND / OR / XOR bodies with input and output pins
    bx = xs[1]
    gates = MeshBuilder()
    pod_base(gates, bx)
    for i, z in enumerate((-0.13, 0.0, 0.13)):
        gates.add_box(bx - 0.02, base_y + 0.05, z, 0.12, 0.07, 0.09)
        gates.add_cylinder(bx + 0.04, base_y + 0.05, z, 0.045, 0.07, 10)
        if i == 2:
            gates.add_box(bx - 0.095, base_y + 0.05, z, 0.012, 0.07, 0.09)  # XOR extra arc
        for dz in (-0.025, 0.025):
            gates.add_box(bx - 0.13, base_y + 0.04, z + dz, 0.06, 0.012, 0.012)
        gates.add_box(bx + 0.13, base_y + 0.04, z, 0.06, 0.012, 0.012)
    specs.append(("tianedge__logic-gates__nand_nor_xor", gates, 3))

    # logic-flip-flops: master / slave latches with clock input and feedback
    bx = xs[2]
    ff = MeshBuilder()
    pod_base(ff, bx)
    ff.add_box(bx - 0.07, base_y + 0.06, 0.0, 0.11, 0.09, 0.28)
    ff.add_box(bx + 0.07, base_y + 0.06, 0.0, 0.11, 0.09, 0.28)
    ff.add_box(bx, base_y + 0.115, 0.0, 0.2, 0.012, 0.03)  # master -> slave link
    ff.add_box(bx - 0.07, base_y + 0.03, -0.17, 0.03, 0.03, 0.06)  # clock pin
    ff.add_frame(bx + 0.07, base_y + 0.12, 0.0, 0.13, 0.01, 0.3, 0.012)  # feedback loop
    specs.append(("tianedge__logic-flip-flops__dff", ff, 5))

    # logic-multiplexers: stepped trapezoid with select line
    bx = xs[3]
    mux = MeshBuilder()
    pod_base(mux, bx)
    for step in range(5):
        mux.add_box(bx - 0.08 + step * 0.04, base_y + 0.06, 0.0, 0.042, 0.09, 0.34 - step * 0.05)
    for z in (-0.12, -0.04, 0.04, 0.12):
        mux.add_box(bx - 0.14, base_y + 0.05, z, 0.05, 0.012, 0.012)
    mux.add_box(bx + 0.15, base_y + 0.05, 0.0, 0.05, 0.012, 0.012)
    mux.add_box(bx, base_y + 0.03, 0.19, 0.012, 0.012, 0.06)  # select
    specs.append(("tianedge__logic-multiplexers__mux", mux, 4))

    # logic-adders: 4-bit ripple-carry chain of full-adder cells
    bx = xs[4]
    add = MeshBuilder()
    pod_base(add, bx)
    for i in range(4):
        z = -0.15 + i * 0.1
        add.add_box(bx, base_y + 0.05, z, 0.18, 0.07, 0.07)
        if i < 3:
            add.add_box(bx + 0.06, base_y + 0.1, z + 0.05, 0.02, 0.012, 0.04)  # carry link
    specs.append(("tianedge__logic-adders__full_adder", add, 3))

    # logic-combinational: PLA crosspoint matrix
    bx = xs[5]
    comb = MeshBuilder()
    pod_base(comb, bx)
    comb.add_box(bx, base_y + 0.03, 0.0, 0.3, 0.03, 0.38)
    for ix in range(5):
        comb.add_box(bx - 0.12 + ix * 0.06, base_y + 0.055, 0.0, 0.01, 0.01, 0.34)
    for iz in range(6):
        comb.add_box(bx, base_y + 0.06, -0.15 + iz * 0.06, 0.28, 0.01, 0.01)
    for ix in range(5):
        for iz in range(6):
            if (ix * 7 + iz * 3) % 3 == 0:
                comb.add_cylinder(bx - 0.12 + ix * 0.06, base_y + 0.07, -0.15 + iz * 0.06, 0.014, 0.02, 8)
    specs.append(("tianedge__logic-combinational__pla_matrix", comb, 6))

    # logic-sequential: state register + next-state logic + feedback loop
    bx = xs[6]
    seq = MeshBuilder()
    pod_base(seq, bx)
    seq.add_box(bx, base_y + 0.06, -0.09, 0.22, 0.09, 0.12)  # next-state logic
    seq.add_grid(bx, base_y + 0.06, 0.1, 0.22, 0.1, 4, 1, 0.09, 0.012)  # state register bits
    seq.add_frame(bx, base_y + 0.12, 0.0, 0.3, 0.012, 0.36, 0.014)  # feedback path
    specs.append(("tianedge__logic-sequential__fsm_stage", seq, 5))

    return pack_glb(specs, materials)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    materials = make_materials()

    assets = {
        "cpu_package_v1.glb": build_package_glb(materials),
        "cpu_die_core_v1.glb": build_die_core_glb(materials),
        "logic_foundation_v1.glb": build_logic_foundation_glb(materials),
    }

    manifest_files: dict[str, Any] = {}
    all_nodes: set[str] = set()
    total_tris = 0

    for filename, (glb_bytes, meta) in assets.items():
        (OUT_DIR / filename).write_bytes(glb_bytes)
        manifest_files[filename] = meta
        all_nodes.update(meta["nodes"])
        total_tris += meta["triangles"]
        print(f"Wrote {filename}: {meta['nodeCount']} nodes, {meta['triangles']} tris, {meta['bytes']} bytes")

    components = json.loads(COMPONENTS_PATH.read_text(encoding="utf-8"))
    missing: list[str] = []
    for comp in components:
        ref = comp["modelReference"]
        if ref["assetFile"] == "procedural":
            continue
        prefix = ref["meshPrefix"] + "__"
        if not any(node.startswith(prefix) for node in all_nodes):
            missing.append(comp["id"])

    if missing:
        raise SystemExit(f"ERROR: Missing GLB nodes for components: {missing}")

    provenance = [
        {
            "assetId": filename.removesuffix(".glb"),
            "path": f"/models/{filename}",
            "author": "TIANEDGE Project Authors",
            "source": "Procedural geometry generated by apps/web/scripts/generate_models.py (no external meshes)",
            "cadAccuracyClaim": "conceptual_educational_reconstruction",
            "triangleCount": meta["triangles"],
            "compressedWith": "none (served gzip-compressed by the host)",
        }
        for filename, meta in manifest_files.items()
    ]

    manifest = {
        "version": 2,
        "generatedBy": "apps/web/scripts/generate_models.py",
        "assets": provenance,
        "totalTrianglesInGlb": total_tris,
        "files": manifest_files,
        "componentAssetCoverage": len(components),
    }
    (OUT_DIR / "ASSET_MANIFEST.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Verified all {len(components)} canonical components mapped cleanly (GLB triangles: {total_tris}).")


if __name__ == "__main__":
    main()
