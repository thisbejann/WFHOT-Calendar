"use client";

import React, { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { OvertimeDetailsMap } from "./user-dashboard";
import { createClient } from "@/lib/supabase/client";
import { startOfMonth, endOfMonth, format, getDay } from "date-fns";
import type { User } from "@supabase/supabase-js";

interface WfhCalendarViewProps {
  user: User;
  initialDate: Date;
  wfhDaysOfWeek: number[];
  overtimeDays: Date[];
  overtimeDetails: OvertimeDetailsMap;
}

export default function WfhCalendarView({
  user,
  initialDate,
  wfhDaysOfWeek,
  overtimeDays,
  overtimeDetails,
}: WfhCalendarViewProps) {
  const [date, setDate] = useState<Date | undefined>(initialDate);
  const [currentWfhDaysOfWeek, setCurrentWfhDaysOfWeek] = useState(wfhDaysOfWeek);
  const [currentOvertimeDays, setCurrentOvertimeDays] = useState(overtimeDays);
  const [currentOvertimeDetails, setCurrentOvertimeDetails] = useState(overtimeDetails);
  const supabase = createClient();

  useEffect(() => {
    async function fetchScheduleData() {
      if (!date) return;

      // Fetch WFH schedule
      const { data: wfhData } = await supabase
        .from("wfh_schedules")
        .select("days_of_week")
        .eq("user_id", user.id)
        .single();

      if (wfhData && wfhData.days_of_week) {
        setCurrentWfhDaysOfWeek(wfhData.days_of_week);
      } else {
        setCurrentWfhDaysOfWeek([]);
      }

      // Fetch overtime filings for the new month
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const { data: overtimeData } = await supabase
        .from("overtime_filings")
        .select("start_time, end_time")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .gte("start_time", monthStart.toISOString())
        .lte("start_time", monthEnd.toISOString());

      if (overtimeData) {
        const otMap = overtimeData.reduce(
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
        setCurrentOvertimeDetails(otMap);

        const otDates = overtimeData.map(
          (filing: { start_time: string }) => new Date(filing.start_time)
        );
        setCurrentOvertimeDays(otDates);
      } else {
        setCurrentOvertimeDays([]);
        setCurrentOvertimeDetails({});
      }
    }

    fetchScheduleData();
  }, [date, supabase, user.id]);

  // Calculate the different day categories for styling
  const overtimeOnWfhDays = currentOvertimeDays.filter((otDate) =>
    currentWfhDaysOfWeek.includes(getDay(otDate))
  );
  const overtimeOnlyDays = currentOvertimeDays.filter(
    (otDate) => !currentWfhDaysOfWeek.includes(getDay(otDate))
  );

  return (
    <div className="flex flex-col items-center pt-4">
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        onMonthChange={(newMonth) => setDate(newMonth)}
        className="rounded-md"
        modifiers={{
          wfh: { dayOfWeek: currentWfhDaysOfWeek },
          overtime: overtimeOnlyDays,
          wfhAndOvertime: overtimeOnWfhDays,
        }}
        modifiersStyles={{
          wfh: {
            color: "#1e88e5",
            backgroundColor: "#e3f2fd",
          },
          overtime: {
            color: "#43a047",
            backgroundColor: "#e8f5e9",
          },
          wfhAndOvertime: {
            background: "linear-gradient(45deg, #e3f2fd 50%, #e8f5e9 50%)",
          },
        }}
        overtimeDetails={currentOvertimeDetails}
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
        <div className="flex items-center space-x-2">
          <div
            className="h-4 w-4 rounded-full"
            style={{
              background: "linear-gradient(45deg, #e3f2fd 50%, #e8f5e9 50%)",
              border: "1px solid #ababab",
            }}
          />
          <span className="text-sm text-muted-foreground">WFH & OT</span>
        </div>
      </div>
    </div>
  );
}
