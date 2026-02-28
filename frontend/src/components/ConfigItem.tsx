export function ConfigItem({
  label,
  value,
  mono = false,
  children,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="text-gray-500">{label}:</span>
      {children ?? (
        <span className={mono ? "font-mono text-gray-200" : "text-gray-200"}>
          {value}
        </span>
      )}
    </div>
  );
}
