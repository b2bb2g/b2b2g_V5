import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GlobalBanners } from "@/components/layout/GlobalBanners";
import { getT } from "@/lib/i18n/server";
import {
  getPublicSettings,
  settingBool,
  settingNumber,
  settingString,
} from "@/lib/data/settings";
import { SETTING_KEYS } from "@/lib/constants";

// Hangul renders in Noto Sans KR; Latin renders in Pretendard via the
// unicode-ranged @font-face in globals.css.
const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: "variable",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings();
  const title = settingString(settings, SETTING_KEYS.SITE_TITLE, "B2B2G Trade");
  const description = settingString(settings, SETTING_KEYS.SITE_DESCRIPTION);
  const ogImage = settingString(settings, SETTING_KEYS.SITE_OG_IMAGE);
  return {
    title: { default: title, template: `%s | ${title}` },
    description,
    openGraph: {
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [{ t, locale }, settings] = await Promise.all([
    getT(),
    getPublicSettings(),
  ]);
  return (
    <html lang={locale} className={`${notoSansKr.variable} h-full antialiased`}>
      <body className="min-h-screen-safe flex flex-col">
        <Header />
        <main className="w-full flex-1">{children}</main>
        <Footer />
        <GlobalBanners
          cookie={t.cookie}
          pwa={t.pwa}
          pwaEnabled={settingBool(settings, SETTING_KEYS.PWA_BANNER_ENABLED, true)}
          redisplayDays={settingNumber(
            settings,
            SETTING_KEYS.PWA_BANNER_REDISPLAY_DAYS,
            14
          )}
        />
      </body>
    </html>
  );
}
