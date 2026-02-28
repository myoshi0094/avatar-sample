import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAvatarSettings } from "./useAvatarSettings";
import type { AvatarConfig } from "@/types/avatar";

const mockConfig: AvatarConfig = {
  id: "avatar-001",
  name: "Default Avatar",
  position: { x: 0, y: 0, z: 0 },
  color: "#4F46E5",
  scale: 1.0,
  visible: true,
  rotationSpeed: 0.5,
};

describe("useAvatarSettings", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllTimers();
  });

  it("initialConfig あり: isLoading=false でその値を即座に返す", () => {
    const { result } = renderHook(() => useAvatarSettings(mockConfig));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.config).toEqual(mockConfig);
  });

  it("initialConfig なし: fetch 成功時に config が更新される", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockConfig), { status: 200 })
    );

    const { result } = renderHook(() => useAvatarSettings(null));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBe(false);
    expect(result.current.config).toEqual(mockConfig);
  });

  it("initialConfig なし: fetch 失敗時に isError=true になる", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("network error"));

    const { result } = renderHook(() => useAvatarSettings(null));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.config).toBeNull();
  });

  it("initialConfig なし: HTTP エラー (4xx/5xx) 時に isError=true になる", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("Not Found", { status: 404 })
    );

    const { result } = renderHook(() => useAvatarSettings(null));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBe(true);
  });
});
