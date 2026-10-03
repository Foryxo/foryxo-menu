import Image from "next/image";
import { cn } from "@/lib/utils";
import { publicPath } from "@/lib/public-path";

export function BrandMark({ size = 40, className, priority = false }: { size?: number; className?: string; priority?: boolean }) {
  return <Image src={publicPath("/logo.png")} width={size} height={size} sizes={`${size}px`} alt="" aria-hidden="true" loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} className={cn("shrink-0 object-contain", className)} />;
}
