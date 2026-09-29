import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import "./globals.css";

const learnerSans = Source_Sans_3({
  variable: "--font-learner-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://learn.forrovivo.com"),
  title: "ForroVivo Learner",
  description:
    "Signed-in ForroVivo learner portal: Academy course map and lesson quizzes from the attested learning path, plus account access.",
  robots: { index: false, follow: false },
  icons: {
    icon: "/images/app/forro-icon.png",
    apple: "/images/app/forro-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${learnerSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
