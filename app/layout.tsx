import type { Metadata, Viewport } from "next";

// Explicit viewport keeps in-app browsers (KakaoTalk, Instagram) from
// applying their own scaling; viewport-fit covers notched screens.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};
import { Suspense } from "react";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GlobalBanners } from "@/components/layout/GlobalBanners";
import { InAppGuard } from "@/components/layout/InAppGuard";
import { PullToRefresh } from "@/components/layout/PullToRefresh";
import { Toaster } from "@/components/ui/Toaster";
import { NavigationFeedback } from "@/components/layout/NavigationFeedback";
import { RouteChrome } from "@/components/layout/RouteChrome";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import {
  getPublicSettings,
  settingBool,
  settingNumber,
  settingString,
} from "@/lib/data/settings";
import { SETTING_KEYS } from "@/lib/constants";
import { AppSplash } from "@/components/pwa/AppSplash";
import { AppLockGate } from "@/components/security/AppLockGate";
import { SecurityNudge } from "@/components/security/SecurityNudge";
import { AutoHideChrome } from "@/components/layout/AutoHideChrome";

// Hangul renders in Noto Sans KR; Latin renders in Pretendard via the
// unicode-ranged @font-face in globals.css.
const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: "variable",
});

export async function generateMetadata(): Promise<Metadata> {
  const [settings, { locale }] = await Promise.all([
    getPublicSettings(),
    getT(),
  ]);
  const title = settingString(settings, SETTING_KEYS.SITE_TITLE, "B2BB2G");
  const description = settingString(settings, SETTING_KEYS.SITE_DESCRIPTION);
  const ogImage = settingString(settings, SETTING_KEYS.SITE_OG_IMAGE);
  // Search-engine ownership proofs are admin settings (PRD 12.2: Google +
  // Naver Search Advisor).
  const googleVerify = settingString(
    settings,
    SETTING_KEYS.GOOGLE_SITE_VERIFICATION,
  );
  const naverVerify = settingString(
    settings,
    SETTING_KEYS.NAVER_SITE_VERIFICATION,
  );
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    ),
    title: { default: title, template: `%s | ${title}` },
    description,
    applicationName: title,
    openGraph: {
      type: "website",
      siteName: title,
      title,
      description,
      locale: locale === "ko" ? "ko_KR" : "en_US",
      alternateLocale: [locale === "ko" ? "en_US" : "ko_KR"],
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    ...(googleVerify || naverVerify
      ? {
          verification: {
            ...(googleVerify ? { google: googleVerify } : {}),
            ...(naverVerify
              ? { other: { "naver-site-verification": naverVerify } }
              : {}),
          },
        }
      : {}),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [{ t, locale }, settings, session] = await Promise.all([
    getT(),
    getPublicSettings(),
    getSession(),
  ]);

  return (
    <html lang={locale} className={`${notoSansKr.variable} h-full antialiased`}>
      <body className="min-h-screen-safe flex flex-col">
        <AppSplash />
        <AutoHideChrome />
        <AppLockGate
          labels={{
            title: t.security.lockTitle,
            subtitle: t.security.lockSubtitle,
            biometricCta: t.security.lockUnlockBiometric,
            biometricHint: t.security.lockBiometricHint,
            or: t.security.lockOr,
            pinSectionLabel: t.security.lockPinSectionLabel,
            pinPlaceholder: t.security.lockPinPlaceholder,
            confirm: t.common.confirm,
            wrongPin: t.security.lockWrongPin,
            attemptsLeft: t.security.lockAttemptsLeft,
            forgotPin: t.security.lockForgotPin,
            forgotPinHint: t.security.lockForgotPinHint,
            resetConfirm: t.security.lockResetConfirm,
          }}
        />
        {session.userId ? (
          <SecurityNudge
            labels={{
              title: t.security.nudgeTitle,
              body: t.security.nudgeBody,
              bodyPin: t.security.nudgeBodyPin,
              setup: t.security.nudgeSetup,
              later: t.security.nudgeLater,
              never: t.security.nudgeNever,
            }}
          />
        ) : null}
        <a href="#main-content" className="skip-link">
          {t.common.skipToContent}
        </a>
        <Suspense>
          <NavigationFeedback />
        </Suspense>
        <PullToRefresh />
        <RouteChrome hideOnAdmin hideOnHome>
          <Header />
        </RouteChrome>
        <main id="main-content" tabIndex={-1} className="w-full flex-1">
          {children}
        </main>
        <RouteChrome hideOnAdmin hideOnMember>
          <Footer />
        </RouteChrome>
        <Suspense>
          <Toaster messages={t.toast} />
        </Suspense>
        <InAppGuard
          enabled={settingBool(
            settings,
            SETTING_KEYS.INAPP_REDIRECT_ENABLED,
            true,
          )}
          paths={settingString(settings, SETTING_KEYS.INAPP_REDIRECT_PATHS)
            .split(",")
            .map((path) => path.trim())
            .filter((path) => path.startsWith("/"))}
          title={t.inapp.title}
          body={t.inapp.body}
          openLabel={t.inapp.open}
        />
        <RouteChrome hideOnAdmin>
          <GlobalBanners
            cookie={t.cookie}
            pwa={t.pwa}
            signedIn={Boolean(session.userId)}
            push={{
              title: t.notifications.pushTitle,
              body: t.notifications.pushBody,
              enable: t.notifications.pushEnable,
              later: t.notifications.pushLater,
            }}
            cookieMessage={settingString(
              settings,
              locale === "ko"
                ? SETTING_KEYS.COOKIE_BANNER_TEXT_KO
                : SETTING_KEYS.COOKIE_BANNER_TEXT_EN,
              t.cookie.message,
            )}
            pwaEnabled={settingBool(
              settings,
              SETTING_KEYS.PWA_BANNER_ENABLED,
              true,
            )}
            redisplayDays={settingNumber(
              settings,
              SETTING_KEYS.PWA_BANNER_REDISPLAY_DAYS,
              14,
            )}
          />
        </RouteChrome>
      </body>
    </html>
  );
}
