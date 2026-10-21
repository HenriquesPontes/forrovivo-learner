import type { Metadata } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import { AuthLanguageProvider } from "@/components/AuthLanguage";
import { AUTH_LOCALE_COOKIE, authLocale } from "@/lib/auth-copy";
import "./globals.css";
import "./auth.css";
import "./learner.css";

const learnerDisplay = localFont({ src: "./fonts/Nunito-Variable.ttf", variable: "--font-learner-display", weight: "200 1000", display: "swap" });

const learnerSans = localFont({
  src: "./fonts/SourceSans3-Variable.ttf",
  variable: "--font-learner-sans",
  weight: "200 900",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://learn.forrovivo.com"),
  title: "ForroVivo Learner",
  description:
    "Learn Forro with guided lessons, a clear learning path, and progress saved to your account.",
  robots: { index: false, follow: false },
  icons: {
    icon: "/images/app/forro-icon.png",
    apple: "/images/app/forro-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = authLocale((await cookies()).get(AUTH_LOCALE_COOKIE)?.value);
  return (
    <html lang={locale === "pt" ? "pt-PT" : "en"} className={`${learnerSans.variable} ${learnerDisplay.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthLanguageProvider initialLocale={locale}>{children}</AuthLanguageProvider>
      </body>
    </html>
  );
}
