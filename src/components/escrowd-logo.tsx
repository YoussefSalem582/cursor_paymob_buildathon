import Image from "next/image";
import { LOGO_MARK, LOGO_MARK_DARK } from "@/lib/app-meta";

// The mark is transparent, so the ink needs to flip with the theme. `hidden`
// keeps the unused variant out of the accessibility tree as well as the layout,
// so `alt` can sit on both without being announced twice.
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
  const base = className ? `${className} ` : "";
  return (
    <>
      <Image
        src={LOGO_MARK}
        alt={alt}
        width={size}
        height={size}
        className={`${base}dark:hidden`}
        priority={priority}
      />
      <Image
        src={LOGO_MARK_DARK}
        alt={alt}
        width={size}
        height={size}
        className={`${base}hidden dark:block`}
        priority={priority}
      />
    </>
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
        className="object-contain dark:hidden"
        sizes="(min-width: 1024px) 50vw, 100vw"
        priority={priority}
      />
      <Image
        src={LOGO_MARK_DARK}
        alt={alt}
        fill
        className="hidden object-contain dark:block"
        sizes="(min-width: 1024px) 50vw, 100vw"
        priority={priority}
      />
    </div>
  );
}
