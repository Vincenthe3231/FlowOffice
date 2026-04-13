import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { CustomizerContextProvider } from "@/app/context/CustomizerContext";
import { QueryProvider } from "@/components/providers/query-provider";
import { QueryErrorBoundary } from "@/components/providers/query-error-boundary";
import { StoreHydrationProvider } from "@/components/providers/store-hydration-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "FlowOffice",
  description: "FlowOffice - HR Management System",
};

const enableServiceWorker =
  process.env.NEXT_PUBLIC_ENABLE_SERVICE_WORKER === "true";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${plusJakarta.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        {!enableServiceWorker && (
          <Script id="flowoffice-unregister-stale-sw" strategy="beforeInteractive">
            {`(function () {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.getRegistrations().then(function (regs) {
    if (!regs.length) return;
    return Promise.all(regs.map(function (r) { return r.unregister(); })).then(function () {
      window.location.reload();
    });
  });
})();`}
          </Script>
        )}
        <QueryProvider>
          <QueryErrorBoundary>
            <StoreHydrationProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <CustomizerContextProvider>
                  {children}
                </CustomizerContextProvider>
              </ThemeProvider>
            </StoreHydrationProvider>
          </QueryErrorBoundary>
        </QueryProvider>
      </body>
    </html>
  );
}
