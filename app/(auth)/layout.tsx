import Link from "next/link";
import { getT } from "@/lib/i18n/server";

// Auth screens share a centered card with the brand mark on top.
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = await getT();
  return (
    <div className="mx-auto w-full max-w-md py-6 sm:py-10">
      <Link href="/" className="mb-5 flex items-center justify-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-base font-extrabold text-white">
          B
        </span>
        <span className="text-lg font-extrabold tracking-tight text-ink">
          {t.common.siteName}
        </span>
      </Link>
      <div className="card px-5 py-2 shadow-(--shadow-card) sm:px-8">{children}</div>
    </div>
  );
}
