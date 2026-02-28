"use client";

import { useState, useEffect } from "react";
import type { AvatarConfig } from "@/types/avatar";

// クライアントサイドのフェッチ先（相対 URL で Next.js API Route を呼ぶ）
const BACKEND_URL = "/api";

/**
 * /api/avatar-config をフェッチし、設定を返すクライアントフック。
 *
 * Next.js 15 での推奨パターン:
 *   1. RSC (Server Component) が初回データをサーバーサイドでフェッチ
 *   2. `initialConfig` として Client Component に渡す → 初回ロード状態なし
 *   3. このフックがポーリングで最新値を定期更新
 *
 * @param initialConfig RSC からの初期値。null のときはマウント後に即フェッチ。
 */
export function useAvatarSettings(initialConfig: AvatarConfig | null = null) {
  const [config, setConfig] = useState<AvatarConfig | null>(initialConfig);
  const [isLoading, setIsLoading] = useState(initialConfig === null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchConfig() {
      try {
        // Next.js 15: fetch は Server Component 専用の拡張キャッシュを持つが、
        // クライアントサイドでは標準 Fetch API として動作する。
        // cache: "no-store" でブラウザキャッシュをバイパスし常に最新値を取得。
        const res = await fetch(`${BACKEND_URL}/api/avatar-config`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: AvatarConfig = await res.json();
        if (!cancelled) {
          setConfig(data);
          setIsError(false);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setIsError(true);
          setIsLoading(false);
        }
      }
    }

    // initialConfig が null の場合（RSC を経由せずクライアント単独使用時）は即フェッチ
    if (initialConfig === null) {
      fetchConfig();
    }

    // 30 秒ごとにポーリングして最新値を反映
    const intervalId = setInterval(fetchConfig, 30_000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
    // initialConfig は初期値として一度だけ参照するため deps に含めない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { config, isLoading, isError };
}
