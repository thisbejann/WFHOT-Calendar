import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import AllOvertimeHistory, { OvertimeHistory } from "@/components/all-overtime-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// Define strong interfaces for our data types
interface UserDetailsData {
  full_name: string;
  email: string;
}

interface WfhScheduleData {
  days_of_week: number[];
}

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;

  // --- Run all data fetching in parallel ---
  const userDetailsQuery = supabase.rpc("get_user_details", { p_user_id: userId });
  const wfhScheduleQuery = supabase.rpc("get_user_wfh_schedule", { p_user_id: userId });
  const overtimeHistoryQuery = supabase.rpc("get_user_overtime_history", {
    p_user_id: userId,
  });

  const [userDetailsResult, wfhScheduleResult, overtimeHistoryResult] = await Promise.all([
    userDetailsQuery,
    wfhScheduleQuery,
    overtimeHistoryQuery,
  ]);

  // Destructure results and handle potential nulls from single()
  const { data: userDetails, error: userDetailsError } = userDetailsResult;
  const { data: wfhSchedule, error: wfhError } = wfhScheduleResult;
  const { data: overtimeHistory, error: overtimeError } = overtimeHistoryResult;

  // Log errors if any occurred
  if (userDetailsError || wfhError || overtimeError) {
    console.error(
      "Error fetching user profile data:",
      userDetailsError || wfhError || overtimeError
    );
  }

  // Find the first item if the results are arrays
  const firstUserDetails = Array.isArray(userDetails) ? userDetails[0] : userDetails;
  const firstWfhSchedule = Array.isArray(wfhSchedule) ? wfhSchedule[0] : wfhSchedule;

  // Return 404 if user details aren't found
  if (!firstUserDetails) {
    notFound();
  }

  // Cast to our defined types for TypeScript
  const typedUserDetails = firstUserDetails as unknown as UserDetailsData;
  const typedWfhSchedule = firstWfhSchedule as unknown as WfhScheduleData | null;

  // Day names for WFH display
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Format WFH days for display
  let wfhDays = "Not set";
  if (typedWfhSchedule && typedWfhSchedule.days_of_week) {
    wfhDays = typedWfhSchedule.days_of_week
      .sort()
      .map((dayIndex: number) => dayNames[dayIndex])
      .join(", ");
  }

  return (
    <div className="flex flex-col w-full min-h-screen">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-muted/40">
        <div className="mb-4">
          <Link
            href="/"
            className="flex items-center text-sm text-muted-foreground hover:underline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
        <div className="grid gap-4 md:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>{typedUserDetails.full_name || "User Profile"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>
                <strong>Email:</strong> {typedUserDetails.email}
              </p>
              <p>
                <strong>Permanent WFH Schedule:</strong> {wfhDays}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Overtime History</CardTitle>
            </CardHeader>
            <CardContent>
              <AllOvertimeHistory
                overtimeHistory={(overtimeHistory as OvertimeHistory[]) || []}
                isAdminView={false}
                selectedUserId={userId}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
