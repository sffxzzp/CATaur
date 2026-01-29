import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import LogoPng from "@/components/images/logo.png";

type LogoProps = {
  className?: string;
  showText?: boolean;
};

export function Logo({ className, showText = true }: LogoProps) {
  return (
    <Link
      href="/candidate"
      className={cn(
        "group inline-flex items-center gap-3 rounded-full transition-transform hover:scale-[1.01]",
        className,
      )}
    >
      {/* Logo image: responsive, no distortion */}
      <span className="relative inline-flex h-11 w-11 items-center justify-center overflow-hidden">
        <Image
          src={LogoPng}
          alt="Company logo"
          fill
          priority
          sizes="(max-width: 768px) 40px, 44px"
          className="object-contain"
        />
      </span>
      {showText && (
        <span className="leading-tight">
          <span className="block text-base font-semibold tracking-tight text-foreground">
            CATaur Talent
          </span>
          <span className="block text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground">
            Recruitment Suite
          </span>
        </span>
      )}
    </Link>
  );
}
