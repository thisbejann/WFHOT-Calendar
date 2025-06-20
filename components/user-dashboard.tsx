"use client";

import React, { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from "@supabase/supabase-js";
import WfhScheduleForm from "./wfh-schedule-form";
import OvertimeFilingForm from "./overtime-filing-form";
import { createClient } from "@/lib/supabase/client";
import { eachDayOfInterval, startOfMonth, endOfMonth, getDay, format } from "date-fns";

export type OvertimeDetailsMap = Record<string, { startTime: string; endTime: string }>;

export default function UserDashboard({ user }: { user: User }) {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [wfhDays, setWfhDays] = useState<Date[]>([]);
  const [overtimeDays, setOvertimeDays] = useState<Date[]>([]);
  const [overtimeDetails, setOvertimeDetails] = useState<OvertimeDetailsMap>({});
  const supabase = createClient();

  useEffect(() => {
    async function fetchScheduleData() {
      const monthStart = startOfMonth(date || new Date());
      const monthEnd = endOfMonth(date || new Date());

      // Fetch WFH schedule
      const { data: wfhData } = await supabase
        .from("wfh_schedules")
        .select("days_of_week")
        .eq("user_id", user.id)
        .single();

      if (wfhData && wfhData.days_of_week) {
        const scheduledDays = wfhData.days_of_week;
        const allDaysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
        const filteredWfhDays = allDaysInMonth.filter((day) => scheduledDays.includes(getDay(day)));
        setWfhDays(filteredWfhDays);
      }

      // Fetch overtime filings
      const { data: overtimeData } = await supabase
        .from("overtime_filings")
        .select("start_time, end_time")
        .eq("user_id", user.id)
        .eq("status", "approved") // Only show approved OT
        .gte("start_time", monthStart.toISOString())
        .lte("start_time", monthEnd.toISOString());

      if (overtimeData) {
        const otMap = overtimeData.reduce((acc: OvertimeDetailsMap, filing) => {
          const filingDate = new Date(filing.start_time);
          const dateKey = format(filingDate, "yyyy-MM-dd");
          acc[dateKey] = {
            startTime: format(filingDate, "p"),
            endTime: format(new Date(filing.end_time), "p"),
          };
          return acc;
        }, {});
        setOvertimeDetails(otMap);

        const otDates = overtimeData.map((filing) => new Date(filing.start_time));
        setOvertimeDays(otDates);
      }
    }

    fetchScheduleData();
  }, [date, supabase, user.id]);

  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>My Calendar</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center pt-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            onMonthChange={(newMonth) => setDate(newMonth)}
            className="rounded-md"
            modifiers={{
              wfh: wfhDays,
              overtime: overtimeDays,
            }}
            modifiersStyles={{
              wfh: {
                color: "#1e88e5", // A nice blue
                backgroundColor: "#e3f2fd",
              },
              overtime: {
                color: "#43a047", // A nice green
                backgroundColor: "#e8f5e9",
              },
            }}
            overtimeDetails={overtimeDetails}
          />
          <div className="flex items-center space-x-4 p-4">
            <div className="flex items-center space-x-2">
              <div
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: "#e3f2fd", border: "1px solid #1e88e5" }}
              />
              <span className="text-sm text-muted-foreground">WFH Day</span>
            </div>
            <div className="flex items-center space-x-2">
              <div
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: "#e8f5e9", border: "1px solid #43a047" }}
              />
              <span className="text-sm text-muted-foreground">Overtime</span>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-4">
        <WfhScheduleForm user={user} />
        <OvertimeFilingForm user={user} />
      </div>
    </div>
  );
}
