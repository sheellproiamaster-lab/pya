import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pya",
  description: "Inteligência operacional brasileira",
  manifest: "/manifest.json",
  themeColor: "#F97314",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Pya" },
  icons: { icon: "/pya001.png", apple: "/pya001.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#F97314" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/pya001.png" />
        <script dangerouslySetInnerHTML={{__html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js');
            });
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}