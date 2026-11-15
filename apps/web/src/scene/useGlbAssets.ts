import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';

export type GlbAssetName = 'cpu_package_v1.glb' | 'cpu_die_core_v1.glb' | 'logic_foundation_v1.glb';

export interface LoadedGlbEntry {
  meshes: Record<string, THREE.Mesh>;
  fallback: boolean;
  error: string | null;
}

const cache = new Map<string, Promise<LoadedGlbEntry>>();

function resolveModelUrl(filename: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}models/${filename}`;
}

export function loadGlbAsset(filename: GlbAssetName): Promise<LoadedGlbEntry> {
  const existing = cache.get(filename);
  if (existing) return existing;

  const promise = new Promise<LoadedGlbEntry>((resolve) => {
    const loader = new GLTFLoader();
    const url = resolveModelUrl(filename);
    loader.load(
      url,
      (gltf) => {
        const meshes: Record<string, THREE.Mesh> = {};
        gltf.scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh && obj.name.startsWith('tianedge__')) {
            meshes[obj.name] = obj;
          }
        });
        resolve({ meshes, fallback: false, error: null });
      },
      undefined,
      (err) => {
        const msg = err instanceof Error ? err.message : `Failed to load ${filename}`;
        console.warn(`[TIANEDGE 3D] Using procedural fallback for ${filename}:`, msg);
        resolve({ meshes: {}, fallback: true, error: msg });
      },
    );
  });

  cache.set(filename, promise);
  return promise;
}

export function useGlbAssets(): {
  assets: Partial<Record<GlbAssetName, LoadedGlbEntry>>;
  fallbackCount: number;
  loading: boolean;
} {
  const [assets, setAssets] = useState<Partial<Record<GlbAssetName, LoadedGlbEntry>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const names: GlbAssetName[] = [
      'cpu_package_v1.glb',
      'cpu_die_core_v1.glb',
      'logic_foundation_v1.glb',
    ];
    Promise.all(names.map((n) => loadGlbAsset(n))).then((results) => {
      if (!active) return;
      const next: Partial<Record<GlbAssetName, LoadedGlbEntry>> = {};
      names.forEach((n, idx) => {
        next[n] = results[idx];
      });
      setAssets(next);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const fallbackCount = Object.values(assets).filter((entry) => entry?.fallback).length;
  return { assets, fallbackCount, loading };
}
