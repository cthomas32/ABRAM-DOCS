import Image from "next/image";

/**
 * Small ABRAM brand mark for use wherever a product icon is needed.
 * Brand rule: never use generic AI icons (e.g. Sparkles); use this mark.
 */
export default function AbramMark({
  size = 14,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/favicon.png"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={`inline-block rounded-[3px] select-none ${className}`}
    />
  );
}
