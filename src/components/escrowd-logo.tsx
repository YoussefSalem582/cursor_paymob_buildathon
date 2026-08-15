import Image from "next/image";
import { LOGO_MARK } from "@/lib/app-meta";

export function EscrowdLogo({
  size = 56,
  className,
  priority = false,
  alt = "",
}: {
  size?: number;
  className?: string;
  priority?: boolean;
  alt?: string;
}) {
  return (
    <Image
      src={LOGO_MARK}
      alt={alt}
      width={size}
      height={size}
      className={className}
      priority={priority}
    />
  );
}

export function EscrowdLogoFrame({
  className,
  alt = "",
  priority = false,
}: {
  className?: string;
  alt?: string;
  priority?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden bg-paper ${className ?? ""}`}>
      <Image
        src={LOGO_MARK}
        alt={alt}
        fill
        className="object-contain"
        sizes="(min-width: 1024px) 50vw, 100vw"
        priority={priority}
      />
    </div>
  );
}
