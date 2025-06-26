import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from "@supabase/supabase-js";
import WfhScheduleForm from "./wfh-schedule-form";
import OvertimeFilingForm from "./overtime-filing-form";
import { createClient } from "@/lib/supabase/server";
import { startOfMonth, endOfMonth, format, eachDayOfInterval } from "date-fns";
import WfhCalendarView from "./wfh-calendar-view";

export type OvertimeDetail = {
  id: number;
  startTime: string;
  endTime: string;
  fullStartTime: string;
  fullEndTime: string;
  type: "start" | "end" | "middle" | "single";
  status: "pending" | "approved" | "declined";
};

export type OvertimeDetailsMap = Record<string, OvertimeDetail[]>;

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
    .select("id, start_time, end_time, status")
    .eq("user_id", user.id)
    .in("status", ["approved", "pending"]) // Show approved and pending OT
    .gte("start_time", monthStart.toISOString())
    .lte("start_time", monthEnd.toISOString())
    .order("start_time", { ascending: true });

  const overtimeDays: Date[] = [];
  const overtimeDetails: OvertimeDetailsMap = {};
  if (overtimeData) {
    overtimeData.forEach((filing) => {
      const startDate = new Date(filing.start_time);
      const endDate = new Date(filing.end_time);
      const days = eachDayOfInterval({ start: startDate, end: endDate });

      days.forEach((day, index) => {
        const dateKey = format(day, "yyyy-MM-dd");
        if (!overtimeDetails[dateKey]) {
          overtimeDetails[dateKey] = [];
        }

        let type: "start" | "end" | "middle" | "single" = "middle";
        if (days.length === 1) {
          type = "single";
        } else if (index === 0) {
          type = "start";
        } else if (index === days.length - 1) {
          type = "end";
        }

        overtimeDetails[dateKey].push({
          id: filing.id,
          startTime: format(startDate, "p"),
          endTime: format(endDate, "p"),
          fullStartTime: filing.start_time,
          fullEndTime: filing.end_time,
          type,
          status: filing.status,
        });
      });

      overtimeDays.push(...days);
    });
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
