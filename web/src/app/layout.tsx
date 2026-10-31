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
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#F4F7FB] text-[#172033] selection:bg-[#087E8B]/15 selection:text-[#087E8B]">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
