import localFont from "next/font/local";
import { AuthScreen } from "@/components/AuthScreen";

const authFont = localFont({ src: "../app/fonts/Nunito-Variable.ttf", variable: "--font-auth", weight: "200 1000", display: "swap" });

export function AuthShell() {
  return <AuthScreen className={authFont.variable} />;
}
