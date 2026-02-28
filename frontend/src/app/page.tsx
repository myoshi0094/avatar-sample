// dynamic() を RSC 内で直接呼ぶと Next.js 16 + Turbopack でコンパイルエラーになるため
// "use client" なラッパーコンポーネント経由でインポートする
import AvatarSceneWrapper from "@/components/AvatarSceneWrapper";
import { ConfigItem } from "@/components/ConfigItem";
import type { AvatarConfig } from "@/types/avatar";

// ---------------------------------------------------------------------------
// Server Component: サーバーサイドでアバター設定をフェッチ
//
// Next.js 15 の fetch 拡張:
//   - cache: "no-store"  → リクエストごとに最新値を取得（SSR 相当）
//   - next: { revalidate: N } → N 秒ごとに再検証（ISR 相当）
//   - next: { tags: [...] } → revalidateTag() で任意タイミングで更新
//
// ここでは avatar-config が頻繁に変わる想定で "no-store" を使用。
// ---------------------------------------------------------------------------
async function fetchAvatarConfig(): Promise<AvatarConfig | null> {
  try {
    const res = await fetch("http://localhost:8080/api/avatar-config", {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json() as Promise<AvatarConfig>;
  } catch {
    return null;
  }
}

export default async function Home() {
  // RSC でフェッチ → Client Component の initialConfig に渡す
  // → useAvatarSettings がこの値で即座に初期化されるためローディング状態なし
  const initialConfig = await fetchAvatarConfig();

  return (
    <main className="h-screen flex flex-col bg-gray-950 text-white">
      {/* 3D シーン: relative を付けて AvatarScene の absolute inset-0 の基準点にする */}
      <div className="relative flex-1 min-h-0">
        <AvatarSceneWrapper initialConfig={initialConfig} />
      </div>

      {/* 設定パネル: 画面下部に固定 */}
      <div className="shrink-0 border-t border-gray-800 bg-gray-950/90 backdrop-blur px-6 py-4">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center gap-x-8 gap-y-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Avatar Config
          </span>

          {initialConfig === null ? (
            <p className="text-red-400 text-xs">
              Backend へ接続できませんでした —{" "}
              <code className="bg-gray-800 px-1 rounded">
                go run ./backend
              </code>{" "}
              を確認してください。
            </p>
          ) : (
            <>
              <ConfigItem label="ID" value={initialConfig.id} mono />
              <ConfigItem label="Color">
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-full border border-gray-600 inline-block"
                    style={{ backgroundColor: initialConfig.color }}
                  />
                  <span className="font-mono">{initialConfig.color}</span>
                </span>
              </ConfigItem>
              <ConfigItem
                label="Rotation"
                value={`${initialConfig.rotationSpeed} rad/s`}
                mono
              />
              <ConfigItem label="Scale" value={String(initialConfig.scale)} mono />
              <ConfigItem label="Visible">
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                    initialConfig.visible
                      ? "bg-emerald-900 text-emerald-300"
                      : "bg-red-900 text-red-300"
                  }`}
                >
                  {initialConfig.visible ? "true" : "false"}
                </span>
              </ConfigItem>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

