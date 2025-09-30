import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import ToastProvider from "@/components/toast-provider";
import { createClient } from "@/lib/supabase/server";
import UserProfile from "@/components/user-profile";
import Link from "next/link";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Handle error case for getUser() explicitly
  if (user === null) {
    console.error("User is null after fetching in layout.");
  }

  const isAdmin = user?.user_metadata?.is_super_admin === true;

  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased`}>
        <ToastProvider />
        <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
          <h1 className="text-xl font-bold">Vertiv Calendar</h1>
          <nav className="flex items-center space-x-4 lg:space-x-6 ml-auto">
            {user && !isAdmin && (
              <Link
                href="/compute-ot-hours"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Compute OT Hours
              </Link>
            )}
            {user && <UserProfile user={user} />}
          </nav>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-muted/40">
          {children}
        </main>
      </body>
    </html>
  );
}
