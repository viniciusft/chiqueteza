import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chiqueteza",
  description: "Seu assistente pessoal de beleza — Virtual Try-On e organização da rotina",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Chiqueteza",
  },
};

export const viewport: Viewport = {
  themeColor: "#1B5E5A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
