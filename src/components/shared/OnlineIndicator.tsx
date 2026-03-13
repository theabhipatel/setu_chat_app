import { cn } from "@/lib/utils";

interface OnlineIndicatorProps {
  isOnline: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function OnlineIndicator({
  isOnline,
  className,
  size = "md",
}: OnlineIndicatorProps) {
  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  };

  return (
    <span
      className={cn(
        "rounded-full border-2 border-background",
        sizeClasses[size],
        isOnline ? "bg-success" : "bg-gray-400",
        isOnline && "animate-pulse-dot",
        className
      )}
    />
  );
}
