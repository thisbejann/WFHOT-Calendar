import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import UserProfile from "@/components/user-profile";
import AdminDashboard from "@/components/admin-dashboard";
import UserDashboard from "@/components/user-dashboard";
import { PendingFiling } from "@/components/pending-requests-table";

export default async function Page() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const isAdmin = user.user_metadata?.is_super_admin === true;

  let pendingFilings: PendingFiling[] = [];
  if (isAdmin) {
    const { data, error } = await supabase.rpc("get_pending_overtime_with_names");
    if (error) {
      console.error("Error fetching pending filings:", error);
    } else {
      pendingFilings = data;
    }
  }

  return (
    <div className="flex flex-col w-full min-h-screen">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
        <h1 className="text-xl font-bold">Vertiv Calendar</h1>
        <div className="ml-auto">
          <UserProfile user={user} />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-muted/40">
        {isAdmin ? (
          <AdminDashboard pendingFilings={pendingFilings} />
        ) : (
          <UserDashboard user={user} />
        )}
      </main>
    </div>
  );
}
