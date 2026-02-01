import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Container Shell - Docker Swarm Terminal",
  description: "Docker container management terminal web UI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Script src="/env.js" strategy="beforeInteractive" />
        <ThemeProvider>
          <Providers>
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
