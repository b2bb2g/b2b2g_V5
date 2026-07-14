import Image from "next/image";

export function BoardHero({
  eyebrow,
  type,
  title,
  count,
  countLabel,
  description,
  image,
}: {
  eyebrow: string;
  type: string;
  title: string;
  count: number;
  countLabel: string;
  description: string;
  image?: string;
}) {
  return (
    <section className="relative min-h-72 overflow-hidden rounded-[2rem] bg-[#101923] px-6 py-9 text-white shadow-[0_24px_70px_rgba(16,25,35,.18)] sm:flex sm:items-end sm:px-10 sm:py-12">
      {image && (
        <Image
          src={image}
          alt=""
          fill
          priority
          sizes="(max-width:1280px) 100vw, 1280px"
          className="object-cover object-center"
        />
      )}
      {image && (
        <span
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,17,24,.97)_0%,rgba(10,17,24,.80)_45%,rgba(10,17,24,.22)_100%)]"
          aria-hidden="true"
        />
      )}
      <span
        className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-primary/35 blur-3xl"
        aria-hidden="true"
      />
      <span
        className="absolute bottom-0 right-10 h-32 w-32 rounded-t-full border-[28px] border-white/5"
        aria-hidden="true"
      />
      <div className="relative max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#79b4ff]">
          {eyebrow} · {type}
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <h1 className="text-[2rem] leading-[1.08] font-extrabold tracking-[-.04em] sm:text-[2.75rem] lg:text-5xl">
            {title}
          </h1>
          <span className="mb-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/65">
            {count} {countLabel}
          </span>
        </div>
        <p className="mt-4 max-w-xl text-sm leading-7 text-white/65">
          {description}
        </p>
      </div>
    </section>
  );
}
