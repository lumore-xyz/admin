import ServiceWorkerRegister from "@/app/components/service-worker/ServiceWorkerRegister";
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import React from "react";
import "./css/globals.css";
import Providers from "./providers";

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Lumore Admin",
  description: "Lumore admin dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#541388" />
      </head>
      <body className={`${dmSans.className}`}>
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ServiceWorkerRegister />
            {children}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
