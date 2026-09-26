import Image from "next/image";

// The official 4STAR mark. The wordmark "4STAR" is part of the artwork, so the
// lockup only adds the industry line beside it.
export default function Logo({ onDark = false, className = "" }) {
    return (
        <span className={`flex items-center gap-3 ${className}`}>
            <Image
                src="/images/logo-4star.png"
                alt="4STAR"
                width={412}
                height={271}
                priority
                className="h-10 w-auto"
            />

            <span
                className={`hidden text-[0.5625rem] uppercase leading-[1.5] tracking-[0.18em] sm:block ${
                    onDark ? "text-white/70" : "text-ink-muted"
                }`}
            >
                Mattress &amp; PU Foam
                <br />
                Industry
            </span>
        </span>
    );
}
