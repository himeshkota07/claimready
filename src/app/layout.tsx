import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClaimReady — Know before you file",
  description:
    "A pre-flight check for EPFO PF claims. Find out what will get your claim rejected before you submit it, not 20 days after.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-500">
          ClaimReady is an independent hackathon prototype. Not affiliated with or endorsed by
          EPFO or the Government of India. All data on this site is synthetic. See{" "}
          <a href="/mocked" className="underline">
            what&apos;s real, what&apos;s mocked
          </a>
          .
        </footer>
      </body>
    </html>
  );
}
