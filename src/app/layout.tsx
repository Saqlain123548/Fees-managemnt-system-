import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "Agaicode Technoliges Fees Management",
  description: "Agaicode technoliges fees management and payment reminder system",
  manifest: "/manifest.json",
  icons: {
    icon: "/Agaicode3.png",
    shortcut: "/Agaicode3.png",
    apple: "/Agaicode3.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}

