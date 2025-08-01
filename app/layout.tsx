import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import ToastProvider from "@/components/toast-provider";

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Vertiv Team Calendar",
  description: "A team calendar for WFH and Overtime schedules.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased`}>
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
