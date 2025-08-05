import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AllOvertimeHistory, { OvertimeHistory } from "@/components/all-overtime-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import UserProfile from "@/components/user-profile";

// Define strong interfaces for our data types
interface UserDetailsData {
  full_name: string;
  email: string;
}

interface WfhScheduleData {
  days_of_week: number[];
}

export default async function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  // Correctly await the params object before using it
  const { userId } = await params;

  const supabase = await createClient();

  // --- Run all data fetching in parallel ---
  const userDetailsQuery = supabase.rpc("get_user_details", { p_user_id: userId });
  const wfhScheduleQuery = supabase.rpc("get_user_wfh_schedule", { p_user_id: userId });
  const overtimeHistoryQuery = supabase.rpc("get_user_overtime_history", {
    p_user_id: userId,
  });
  const userQuery = supabase.auth.getUser();

  const [userDetailsResult, wfhScheduleResult, overtimeHistoryResult, userResult] =
    await Promise.all([userDetailsQuery, wfhScheduleQuery, overtimeHistoryQuery, userQuery]);

  const { data: userDetails, error: userDetailsError } = userDetailsResult;
  const { data: wfhSchedule, error: wfhError } = wfhScheduleResult;
  const { data: overtimeHistory, error: overtimeError } = overtimeHistoryResult;
  const {
    data: { user },
    error: userError,
  } = userResult;

  // Log errors if any occurred
  if (userDetailsError || wfhError || overtimeError || userError) {
    console.error(
      "Error fetching user profile data:",
      userDetailsError || wfhError || overtimeError || userError
    );
  }

  // Find the first item if the results are arrays
  const firstUserDetails = Array.isArray(userDetails) ? userDetails[0] : userDetails;
  const firstWfhSchedule = Array.isArray(wfhSchedule) ? wfhSchedule[0] : wfhSchedule;

  // Return 404 if user details aren't found
  if (!user || !firstUserDetails) {
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
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
        <h1 className="text-xl font-bold">Vertiv Calendar</h1>
        <div className="ml-auto">
          <UserProfile user={user} />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-muted/40">
        <div className="mb-4">
          <Link
            href="/?tab=overtime-history"
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
                isAdminView={true}
                selectedUserId={userId}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
