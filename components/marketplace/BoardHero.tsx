export function BoardHero({ eyebrow, type, title, count, countLabel, description }: { eyebrow: string; type: string; title: string; count: number; countLabel: string; description: string }) {
  return (
    <section className="relative overflow-hidden rounded-[1.5rem] bg-ink px-5 py-7 text-white sm:px-8 sm:py-10">
      <span className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-primary/30 blur-3xl" aria-hidden="true" />
      <div className="relative max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#79b4ff]">{eyebrow} · {type}</p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
          <span className="mb-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/65">{count} {countLabel}</span>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60">{description}</p>
      </div>
    </section>
  );
}
