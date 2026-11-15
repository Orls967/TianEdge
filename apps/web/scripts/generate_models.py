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
        "asset": {"version": "2.0", "generator": "TIANEDGE Geometry Generator v1"},
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
    ]


def build_package_glb(materials: list[dict[str, Any]]) -> tuple[bytes, dict[str, Any]]:
    specs: list[tuple[str, MeshBuilder, int]] = []

    # pkg-ihs
    ihs = MeshBuilder()
    ihs.add_octagonal_prism(0.0, 0.31, 0.0, 2.75, 0.12, 2.75, 0.22)
    ihs.add_octagonal_prism(0.0, 0.23, 0.0, 3.02, 0.05, 3.02, 0.18)
    specs.append(("tianedge__pkg-ihs__lid", ihs, 0))

    # pkg-silicon-die
    die = MeshBuilder()
    die.add_box(0.0, 0.12, 0.0, 1.92, 0.06, 1.92)
    specs.append(("tianedge__pkg-silicon-die__slab", die, 1))

    # pkg-substrate
    sub = MeshBuilder()
    sub.add_box(0.0, 0.0, 0.0, 3.45, 0.11, 3.45)
    # 4 corner SMD decoupling bank frames
    for sx in (-1.35, 1.35):
        for sz in (-1.35, 1.35):
            sub.add_box(sx, 0.075, sz, 0.32, 0.04, 0.16)
    specs.append(("tianedge__pkg-substrate__board", sub, 2))

    # pkg-solder-bumps (carrier matrix base; instances rendered procedurally too)
    bumps = MeshBuilder()
    for gx in range(-3, 4):
        for gz in range(-3, 4):
            bumps.add_box(gx * 0.24, 0.065, gz * 0.24, 0.07, 0.035, 0.07)
    specs.append(("tianedge__pkg-solder-bumps__array", bumps, 3))

    # pkg-electrical-contacts (LGA bottom contact matrix + perimeter ring)
    lga = MeshBuilder()
    lga.add_box(0.0, -0.072, 0.0, 3.15, 0.025, 3.15)
    for edge in (-1.45, 1.45):
        lga.add_box(edge, -0.088, 0.0, 0.12, 0.015, 3.0)
        lga.add_box(0.0, -0.088, edge, 2.8, 0.015, 0.12)
    specs.append(("tianedge__pkg-electrical-contacts__pads", lga, 3))

    return pack_glb(specs, materials)


def build_die_core_glb(materials: list[dict[str, Any]]) -> tuple[bytes, dict[str, Any]]:
    specs: list[tuple[str, MeshBuilder, int]] = []

    # Silicon die regional zones (Layer 2)
    # 4 core quadrant base tiles
    quadrants = [(-0.45, -0.45), (0.45, -0.45), (-0.45, 0.45), (0.45, 0.45)]
    cpu_cores = MeshBuilder()
    for qx, qz in quadrants:
        cpu_cores.add_box(qx, 0.155, qz, 0.72, 0.025, 0.62)
    specs.append(("tianedge__die-cpu-cores__tiles", cpu_cores, 6))

    cache_regions = MeshBuilder()
    cache_regions.add_box(0.0, 0.16, 0.25, 1.56, 0.028, 0.34)
    cache_regions.add_box(0.62, 0.16, -0.25, 0.36, 0.028, 0.56)
    specs.append(("tianedge__die-cache-regions__banks", cache_regions, 5))

    exec_zone = MeshBuilder()
    exec_zone.add_box(-0.45, 0.165, -0.45, 0.66, 0.022, 0.56)
    specs.append(("tianedge__die-execution-units__zone", exec_zone, 6))

    interconnect = MeshBuilder()
    interconnect.add_box(0.0, 0.168, 0.0, 1.72, 0.016, 0.08)
    interconnect.add_box(0.0, 0.168, 0.0, 0.08, 0.016, 1.62)
    specs.append(("tianedge__die-interconnect__ring", interconnect, 3))

    mc = MeshBuilder()
    mc.add_box(0.0, 0.165, 0.72, 1.32, 0.045, 0.20)
    specs.append(("tianedge__die-memory-controller__block", mc, 5))

    ioc = MeshBuilder()
    ioc.add_box(0.0, 0.165, -0.76, 1.24, 0.042, 0.16)
    specs.append(("tianedge__die-io-controller__block", ioc, 6))

    # Processing Core blocks in primary Core 0 zone (Layer 3)
    alu = MeshBuilder()
    alu.add_octagonal_prism(-0.48, 0.22, -0.48, 0.22, 0.075, 0.18, 0.045)
    alu.add_box(-0.48, 0.25, -0.48, 0.14, 0.025, 0.08)
    specs.append(("tianedge__core-alu__unit", alu, 4))

    cu = MeshBuilder()
    cu.add_box(-0.55, 0.23, -0.25, 0.22, 0.08, 0.14)
    specs.append(("tianedge__core-control-unit__sequencer", cu, 3))

    regs = MeshBuilder()
    for i in range(4):
        regs.add_box(-0.30, 0.215, -0.52 + i * 0.045, 0.16, 0.055, 0.032)
    specs.append(("tianedge__core-registers__bank", regs, 4))

    dec = MeshBuilder()
    dec.add_box(-0.62, 0.215, -0.58, 0.16, 0.06, 0.14)
    specs.append(("tianedge__core-instruction-decoder__pla", dec, 5))

    core_exec = MeshBuilder()
    core_exec.add_box(-0.46, 0.205, -0.42, 0.26, 0.035, 0.24)
    specs.append(("tianedge__core-execution-units__cluster", core_exec, 6))

    lsu = MeshBuilder()
    lsu.add_box(-0.25, 0.215, -0.25, 0.18, 0.06, 0.14)
    specs.append(("tianedge__core-load-store-unit__agu", lsu, 4))

    # Memory Hierarchy blocks (Layer 4)
    l1i = MeshBuilder()
    l1i.add_box(-0.72, 0.215, -0.66, 0.18, 0.055, 0.16)
    specs.append(("tianedge__mem-l1-icache__sram", l1i, 5))

    l1d = MeshBuilder()
    l1d.add_box(-0.14, 0.215, -0.25, 0.16, 0.055, 0.16)
    specs.append(("tianedge__mem-l1-dcache__sram", l1d, 5))

    l2 = MeshBuilder()
    l2.add_box(-0.76, 0.195, -0.35, 0.16, 0.045, 0.34)
    specs.append(("tianedge__mem-l2-cache__sram", l2, 5))

    l3 = MeshBuilder()
    for s in range(4):
        l3.add_box(-0.54 + s * 0.36, 0.18, 0.25, 0.31, 0.038, 0.26)
    specs.append(("tianedge__mem-l3-cache__slices", l3, 5))

    regfile = MeshBuilder()
    regfile.add_box(-0.30, 0.23, -0.45, 0.15, 0.025, 0.16)
    specs.append(("tianedge__mem-register-file__cells", regfile, 3))

    main_if = MeshBuilder()
    for p in range(-4, 5):
        main_if.add_box(p * 0.14, 0.155, 0.87, 0.08, 0.032, 0.10)
    specs.append(("tianedge__mem-main-interface__phy", main_if, 3))

    comm_mem_if = MeshBuilder()
    comm_mem_if.add_box(0.0, 0.175, 0.45, 0.18, 0.028, 0.32)
    specs.append(("tianedge__comm-memory-interface__bridge", comm_mem_if, 4))

    return pack_glb(specs, materials)


def build_logic_foundation_glb(materials: list[dict[str, Any]]) -> tuple[bytes, dict[str, Any]]:
    specs: list[tuple[str, MeshBuilder, int]] = []
    spacing = 0.48
    start_x = -spacing * 3

    ids_and_roles = [
        ("logic-transistors", "mosfet", 4),
        ("logic-gates", "nand_nor_xor", 3),
        ("logic-flip-flops", "dff", 5),
        ("logic-multiplexers", "mux", 4),
        ("logic-adders", "full_adder", 3),
        ("logic-combinational", "pla_matrix", 6),
        ("logic-sequential", "fsm_stage", 5),
    ]

    for idx, (comp_id, role, mat_idx) in enumerate(ids_and_roles):
        bx = start_x + idx * spacing
        mb = MeshBuilder()
        # Base educational pod block + gate silhouette pins
        mb.add_box(bx, 0.22, 0.0, 0.32, 0.10, 0.42)
        mb.add_box(bx, 0.30, 0.0, 0.16, 0.06, 0.20)
        # Input / output terminals
        mb.add_box(bx - 0.18, 0.22, -0.10, 0.08, 0.03, 0.04)
        mb.add_box(bx - 0.18, 0.22, 0.10, 0.08, 0.03, 0.04)
        mb.add_box(bx + 0.18, 0.22, 0.0, 0.08, 0.03, 0.05)
        specs.append((f"tianedge__{comp_id}__{role}", mb, mat_idx))

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

    manifest = {
        "version": 1,
        "generatedBy": "apps/web/scripts/generate_models.py",
        "totalTrianglesInGlb": total_tris,
        "files": manifest_files,
        "componentAssetCoverage": len(components),
    }
    (OUT_DIR / "ASSET_MANIFEST.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Verified all {len(components)} canonical components mapped cleanly (GLB triangles: {total_tris}).")


if __name__ == "__main__":
    main()
