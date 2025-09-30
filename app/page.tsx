import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/admin-dashboard";
import UserDashboard from "@/components/user-dashboard";
import { OvertimeHistory } from "@/components/all-overtime-history";
import { AdminDataProvider } from "@/lib/context/admin-data-context";

export default async function Page() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const isAdmin = user.user_metadata?.is_super_admin === true;

  let overtimeHistory: OvertimeHistory[] = [];

  if (isAdmin) {
    const { data: historyData, error: historyError } = await supabase.rpc(
      "get_all_overtime_with_names"
    );
    if (historyError) {
      console.error("Error fetching overtime history:", historyError);
    } else if (historyData) {
      overtimeHistory = historyData;
    }
  }

  return (
    <div className="flex flex-col w-full min-h-screen">
      {isAdmin ? (
        <AdminDataProvider>
          <AdminDashboard overtimeHistory={overtimeHistory} />
        </AdminDataProvider>
      ) : (
        <UserDashboard user={user} />
      )}
    </div>
  );
}
