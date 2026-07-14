import Image from "next/image";

interface ProjectMediaProps {
  readonly src: string;
  readonly alt: string;
  readonly sizes: string;
  readonly className?: string;
  readonly foregroundClassName?: string;
}

/**
 * A full-building presentation for mixed portrait and landscape source art.
 * The duplicated image resolves to the same optimized URL, so the soft ambient
 * layer adds depth without a second source download.
 */
export function ProjectMedia({
  src,
  alt,
  sizes,
  className = "",
  foregroundClassName = "",
}: ProjectMediaProps) {
  return (
    <span
      className={`relative isolate block overflow-hidden bg-ink ${className}`}
    >
      <Image
        src={src}
        alt=""
        aria-hidden
        fill
        sizes={sizes}
        quality={90}
        className="pointer-events-none scale-110 object-cover opacity-45 blur-2xl saturate-125 transition-transform duration-1000 ease-out group-hover:scale-125 motion-reduce:transition-none"
      />
      <span
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_15%,rgba(11,13,15,.22)_62%,rgba(11,13,15,.68)_100%)]"
      />
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        quality={90}
        className={`object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,.35)] transition-transform duration-700 ease-out group-hover:scale-[1.015] motion-reduce:transition-none ${foregroundClassName}`}
      />
      <span
        aria-hidden
        className="absolute inset-0 ring-1 ring-cream/10 ring-inset"
      />
    </span>
  );
}
