import Image from "next/image";

type IdpsLogoProps = {
  className?: string;
  priority?: boolean;
  size?: number;
  alt?: string;
};

/** Optimized IDPS logo for LCP-critical surfaces. */
export function IdpsLogo({
  className,
  priority = false,
  size = 40,
  alt = "IDPS Logo",
}: IdpsLogoProps) {
  return (
    <Image
      src="/idps-logo.png"
      alt={alt}
      width={size}
      height={size}
      className={className ?? "h-full w-full object-contain"}
      style={{ width: "auto", height: "auto" }}
      priority={priority}
      sizes={`${size}px`}
    />
  );
}
