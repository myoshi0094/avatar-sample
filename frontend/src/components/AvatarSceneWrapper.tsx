"use client";

/**
 * AvatarSceneWrapper
 *
 * RSC から dynamic() を直接呼ぶと Next.js 16 + Turbopack で
 * "Ecmascript file had an error" が発生するため、
 * "use client" なラッパー内で dynamic import を行う。
 *
 * ssr: false により WebGL (Canvas) が SSR で実行されるのを防ぐ。
 */
import dynamic from "next/dynamic";
import type { AvatarSceneProps } from "./AvatarScene";

const AvatarScene = dynamic(() => import("./AvatarScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      <p className="text-gray-400 text-sm animate-pulse">Loading scene…</p>
    </div>
  ),
});

export default function AvatarSceneWrapper(props: AvatarSceneProps) {
  return <AvatarScene {...props} />;
}
