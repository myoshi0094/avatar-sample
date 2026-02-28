"use client";

export function TalkButton({
  isTalking,
  onClick,
}: {
  isTalking: boolean;
  onClick: () => void;
}) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
      <button
        type="button"
        onClick={onClick}
        className={[
          "flex items-center gap-2 px-6 py-3 rounded-full",
          "text-sm font-semibold text-white shadow-lg select-none",
          "transition-all duration-200 outline-none",
          "focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2",
          isTalking
            ? "bg-red-500 hover:bg-red-600 ring-2 ring-red-400 ring-offset-2 ring-offset-gray-950"
            : "bg-indigo-600 hover:bg-indigo-700",
        ].join(" ")}
        aria-pressed={isTalking}
        aria-label={isTalking ? "話すアニメーションを停止" : "話すアニメーションを開始"}
      >
        <span
          className={
            isTalking
              ? "w-2.5 h-2.5 rounded-sm bg-white inline-block"
              : [
                  "w-0 h-0 inline-block",
                  "border-y-[5px] border-y-transparent",
                  "border-l-[9px] border-l-white",
                ].join(" ")
          }
          aria-hidden
        />
        {isTalking ? "停止" : "話す"}
      </button>
    </div>
  );
}
