import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "../components/Toast";

export const metadata: Metadata = {
  title: "ResolvePay — Real-Time AI Dispute Resolution Engine",
  description: "Enterprise PayPal Dispute Defense and Chargeback Automation powered by Gemini AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
