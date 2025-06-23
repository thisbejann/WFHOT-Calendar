import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from "@supabase/supabase-js";
import WfhScheduleForm from "./wfh-schedule-form";
import OvertimeFilingForm from "./overtime-filing-form";
import { createClient } from "@/lib/supabase/server";
import { startOfMonth, endOfMonth, format } from "date-fns";
import WfhCalendarView from "./wfh-calendar-view";

export type OvertimeDetailsMap = Record<string, { startTime: string; endTime: string }>;

export default async function UserDashboard({ user }: { user: User }) {
  const supabase = await createClient();
  const today = new Date();

  // Fetch WFH schedule
  const { data: wfhData } = await supabase
    .from("wfh_schedules")
    .select("days_of_week")
    .eq("user_id", user.id)
    .single();

  const wfhDaysOfWeek = wfhData?.days_of_week || [];

  // Fetch overtime filings
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const { data: overtimeData } = await supabase
    .from("overtime_filings")
    .select("start_time, end_time")
    .eq("user_id", user.id)
    .eq("status", "approved") // Only show approved OT
    .gte("start_time", monthStart.toISOString())
    .lte("start_time", monthEnd.toISOString());

  let overtimeDays: Date[] = [];
  let overtimeDetails: OvertimeDetailsMap = {};
  if (overtimeData) {
    overtimeDetails = overtimeData.reduce(
      (acc: OvertimeDetailsMap, filing: { start_time: string; end_time: string }) => {
        const filingDate = new Date(filing.start_time);
        const dateKey = format(filingDate, "yyyy-MM-dd");
        acc[dateKey] = {
          startTime: format(filingDate, "p"),
          endTime: format(new Date(filing.end_time), "p"),
        };
        return acc;
      },
      {}
    );

    overtimeDays = overtimeData.map(
      (filing: { start_time: string }) => new Date(filing.start_time)
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>My Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <WfhCalendarView
            user={user}
            initialDate={today}
            wfhDaysOfWeek={wfhDaysOfWeek}
            overtimeDays={overtimeDays}
            overtimeDetails={overtimeDetails}
          />
        </CardContent>
      </Card>
      <div className="space-y-4">
        <WfhScheduleForm user={user} />
        <OvertimeFilingForm user={user} />
      </div>
    </div>
  );
}
