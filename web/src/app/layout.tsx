import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "../components/Toast";
import { LanguageProvider } from "../context/LanguageContext";

export const metadata: Metadata = {
  title: "ResolvePay — Real-Time AI Dispute Resolution Engine",
  description: "Enterprise PayPal Dispute Defense and Chargeback Automation powered by Gemini AI",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ResolvePay",
  },
};

export const viewport: Viewport = {
  themeColor: "#101010",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Capture PWA Install Prompt early before React Hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('beforeinstallprompt', function(e) {
                e.preventDefault();
                window.__resolvepay_install_prompt = e;
                window.dispatchEvent(new CustomEvent('resolvepay:installable'));
              });
            `,
          }}
        />

        {/* Avoid Theme Flash before First Paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('resolvepay_theme');
                  if (theme === 'light') {
                    document.documentElement.classList.add('light');
                  } else {
                    document.documentElement.classList.remove('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen selection:bg-[var(--accent-primary)]/20 selection:text-[var(--accent-primary)]" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
        <ToastProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
