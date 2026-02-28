"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment } from "@react-three/drei";
import { Color, Mesh, MeshStandardMaterial, type Group } from "three";
import { useAvatarSettings } from "@/hooks/useAvatarSettings";
import type { AvatarConfig } from "@/types/avatar";
import { TalkButton } from "./TalkButton";

// Khronos Group 公式 glTF サンプルリポジトリ
const MODEL_URL =
  "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb";

useGLTF.preload(MODEL_URL);

// ---------------------------------------------------------------------------
// AvatarModel
// ---------------------------------------------------------------------------

type StdMeshCache = {
  mat: MeshStandardMaterial;
  baseEmissiveIntensity: number;
};

interface AvatarModelProps {
  color: string;
  rotationSpeed: number;
  scale: number;
  position: AvatarConfig["position"];
  isTalkingRef: React.RefObject<boolean>;
}

function AvatarModel({
  color,
  rotationSpeed,
  scale,
  position,
  isTalkingRef,
}: AvatarModelProps) {
  const group = useRef<Group>(null);
  const { scene } = useGLTF(MODEL_URL);
  const { invalidate } = useThree();

  const stdMeshesRef = useRef<StdMeshCache[]>([]);
  const morphMeshesRef = useRef<Mesh[]>([]);
  const wasTalkingRef = useRef(false);

  useEffect(() => {
    const threeColor = new Color(color);
    const stdMeshes: StdMeshCache[] = [];
    const morphMeshes: Mesh[] = [];

    scene.traverse((child) => {
      if (
        child instanceof Mesh &&
        child.material instanceof MeshStandardMaterial
      ) {
        child.material.emissive.copy(threeColor);
        child.material.emissiveIntensity = 0.3;
        child.material.needsUpdate = true;
        stdMeshes.push({ mat: child.material, baseEmissiveIntensity: 0.3 });
        if (child.morphTargetInfluences?.length) {
          morphMeshes.push(child);
        }
      }
    });

    stdMeshesRef.current = stdMeshes;
    morphMeshesRef.current = morphMeshes;
    // モデルロード完了後に確実にフレームを描画する
    invalidate();
  }, [color, scene, invalidate]);

  useEffect(() => {
    invalidate();
  }, [scale, position, invalidate]);

  useFrame((state, delta) => {
    let needsInvalidate = false;

    // rotationSpeed が undefined / NaN の場合 0 とみなす（Go サーバー未再起動対策）
    const speed = typeof rotationSpeed === "number" && Number.isFinite(rotationSpeed)
      ? rotationSpeed
      : 0;

    if (group.current && speed !== 0) {
      group.current.rotation.y += speed * delta;
      needsInvalidate = true;
    }

    const talking = isTalkingRef.current;
    if (talking) {
      const t = state.clock.elapsedTime;
      // 複数の sin を合成して自然なランダム感のある音量をシミュレーション
      // 本番 WebRTC では AnalyserNode.getByteFrequencyData() に差し替える
      const rawVolume =
        Math.sin(t * 8.0) * 0.5 +
        Math.sin(t * 13.7) * 0.3 +
        Math.sin(t * 5.3) * 0.2;
      const volume = Math.max(0, rawVolume);

      if (morphMeshesRef.current.length > 0) {
        // モーフターゲットが存在するアバター向け
        for (const mesh of morphMeshesRef.current) {
          if (mesh.morphTargetInfluences) {
            mesh.morphTargetInfluences[0] = volume;
          }
        }
      } else {
        // フォールバック（モーフターゲットなしモデル向け）:
        //  ① emissive intensity を大幅増加（0.3 → 最大 3.3）
        //  ② Y 軸スケールで「あご」を擬似的に表現
        for (const { mat, baseEmissiveIntensity } of stdMeshesRef.current) {
          mat.emissiveIntensity = baseEmissiveIntensity + volume * 3.0;
        }
        if (group.current) {
          group.current.scale.y = scale * (1 - volume * 0.12);
        }
      }
      wasTalkingRef.current = true;
      needsInvalidate = true;
    } else if (wasTalkingRef.current) {
      if (morphMeshesRef.current.length > 0) {
        for (const mesh of morphMeshesRef.current) {
          if (mesh.morphTargetInfluences) {
            mesh.morphTargetInfluences[0] = 0;
          }
        }
      } else {
        for (const { mat, baseEmissiveIntensity } of stdMeshesRef.current) {
          mat.emissiveIntensity = baseEmissiveIntensity;
        }
        if (group.current) {
          group.current.scale.y = scale; // スケールをリセット
        }
      }
      wasTalkingRef.current = false;
    }

    if (needsInvalidate) state.invalidate();
  });

  return (
    <group
      ref={group}
      position={[position.x, position.y, position.z]}
      scale={scale}
    >
      <primitive object={scene} castShadow={false} receiveShadow={false} />
    </group>
  );
}

function LoadingFallback() {
  return (
    <mesh>
      {/* より視認しやすいサイズ・色に変更 */}
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#6366f1" wireframe />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// AvatarScene
// ---------------------------------------------------------------------------
export interface AvatarSceneProps {
  initialConfig?: AvatarConfig | null;
}

export default function AvatarScene({ initialConfig }: AvatarSceneProps) {
  const { config, isLoading, isError } = useAvatarSettings(initialConfig ?? null);
  const [isTalking, setIsTalking] = useState(false);
  const isTalkingRef = useRef(false);
  const invalidateRef = useRef<(() => void) | null>(null);

  const toggleTalking = useCallback(() => {
    const next = !isTalkingRef.current;
    isTalkingRef.current = next;
    setIsTalking(next);
    invalidateRef.current?.();
  }, []);

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
        <p className="text-gray-400 text-sm animate-pulse">Loading avatar…</p>
      </div>
    );
  }

  if (isError || config === null) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
        <p className="text-red-400 text-sm">アバター設定を取得できませんでした。</p>
      </div>
    );
  }

  return (
    /*
     * Bug fix 1 — Canvas 高さ問題:
     * "relative w-full h-full" は親に定義済み height がないと h-full が 0 になる。
     * "absolute inset-0" に変更することで、page.tsx 側の "relative flex-1 min-h-0" div を
     * 直接埋め尽くし、継承チェーンに依存しない確実な高さを得る。
     */
    <div className="absolute inset-0">
      <Canvas
        frameloop="demand"
        shadows={false}
        camera={{ position: [0, 0, 3], fov: 45 }}
        gl={{ antialias: true, powerPreference: "low-power" }}
        style={{ width: "100%", height: "100%" }}
        /*
         * Bug fix 2 — frameloop="demand" の初回フレーム問題:
         * 旧: InvalidateBridge (useEffect) → 非同期のため初回フレームが保証されなかった
         * 新: onCreated → Canvas 生成と同期的に invalidate 関数を取得し即座に初回フレームを発行
         */
        onCreated={(state) => {
          invalidateRef.current = state.invalidate;
          state.invalidate(); // 初回フレームを確実に描画
        }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow={false} />

        {/*
         * Bug fix 3 — Suspense の分離:
         * 旧: AvatarModel と Environment を同一 Suspense → HDR ロードが終わるまでモデルが出ない
         * 新: Suspense を分離 → モデルだけ先に表示し、HDR は後からオーバーレイ
         */}
        <Suspense fallback={<LoadingFallback />}>
          {config.visible && (
            <AvatarModel
              color={config.color}
              rotationSpeed={config.rotationSpeed}
              scale={config.scale}
              position={config.position}
              isTalkingRef={isTalkingRef}
            />
          )}
        </Suspense>

        {/* Environment は別 Suspense: null フォールバックで静かに待つ */}
        <Suspense fallback={null}>
          <Environment preset="city" resolution={64} />
        </Suspense>

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={1}
          maxDistance={10}
        />
      </Canvas>

      {/* ① 話し中 DOM バッジ: React state が更新されているか一目でわかる確認用 */}
      {isTalking && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-600/90 text-white text-xs font-semibold pointer-events-none select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          話し中
        </div>
      )}

      {/* ② Canvas 発光オーバーレイ: 話しているときに中央から広がる indigo グロー */}
      {isTalking && (
        <div
          className="absolute inset-0 pointer-events-none animate-pulse"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(99,102,241,0.18) 0%, transparent 65%)",
          }}
        />
      )}

      <TalkButton isTalking={isTalking} onClick={toggleTalking} />
    </div>
  );
}
