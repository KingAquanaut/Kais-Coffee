import type { Metadata, Viewport } from "next";
import { Playfair_Display, Lato, Dancing_Script } from "next/font/google";
import { Providers } from "./providers";
import InstallPrompt from "@/components/ui/InstallPrompt";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const lato = Lato({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  display: "swap",
});

const script = Dancing_Script({
  variable: "--font-script",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Kai's Coffee", template: "%s | Kai's Coffee" },
  description: "Artisan coffee · Earn reward points · Redeem a free coffee",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Kai's Coffee" },
  icons: { icon: "/icons/icon-192x192.png", apple: "/icons/icon-192x192.png" },
};

export const viewport: Viewport = {
  themeColor: "#d6e8f5",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${playfair.variable} ${lato.variable} ${script.variable}`}>
      <body>
        {/* Watercolor canvas — fixed div instead of background-attachment:fixed
            so the compositing layer is dedicated and never repaints on scroll */}
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: -1,
            backgroundColor: "#f5f9fc",
            backgroundImage: "url('/watercolor-bg.svg')",
            backgroundSize: "cover",
            backgroundPosition: "center top",
          }}
        />
        <Providers>{children}</Providers>
        <InstallPrompt />
      </body>
    </html>
  );
}
