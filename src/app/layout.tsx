import type { Metadata } from "next";
import { Noto_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
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
      className={`${notoSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-brand-700 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>
        <Header />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <footer className="border-t-2 border-brand-800 bg-brand-900 px-4 py-5 text-center text-xs text-brand-100">
          <p className="font-semibold text-white">
            ClaimReady is an independent hackathon prototype — not an EPFO product.
          </p>
          <p className="mt-1">
            Not affiliated with or endorsed by EPFO or the Government of India. All data on this
            site is synthetic. See{" "}
            <a href="/mocked" className="underline hover:text-white">
              what&apos;s real, what&apos;s mocked
            </a>
            .
          </p>
        </footer>
      </body>
    </html>
  );
}
