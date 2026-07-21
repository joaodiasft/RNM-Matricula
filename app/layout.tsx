import type { Metadata, Viewport } from "next";
import { Montserrat, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ClientGuards } from "@/components/ClientGuards";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
  weight: ["600", "700", "800"],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Matrícula Online · Redação Nota Mil",
    template: "%s · Redação Nota Mil",
  },
  description:
    "Sistema de matrícula online — Redação, Exatas e Matemática. Redação Nota Mil.",
  applicationName: "Matrícula RNM",
  icons: {
    icon: "/logo-rnm.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${montserrat.variable} ${plusJakarta.variable} antialiased`}>
        <ClientGuards />
        {children}
      </body>
    </html>
  );
}
