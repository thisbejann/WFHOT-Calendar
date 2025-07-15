"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from "@supabase/supabase-js";
import WfhScheduleForm from "./wfh-schedule-form";
import OvertimeFilingForm from "./overtime-filing-form";
import { createClient } from "@/lib/supabase/client";
import {
  startOfMonth,
  endOfMonth,
  format,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import WfhCalendarView from "./wfh-calendar-view";
import { toast } from "react-toastify";

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

export default function UserDashboard({ user }: { user: User }) {
  const supabase = createClient();
  const [wfhDaysOfWeek, setWfhDaysOfWeek] = useState<number[]>([]);
  const [overtimeDays, setOvertimeDays] = useState<Date[]>([]);
  const [overtimeDetails, setOvertimeDetails] = useState<OvertimeDetailsMap>({});
  const [oneOffWfhDays, setOneOffWfhDays] = useState<Date[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchOvertimeData = useCallback(
    async (dateForMonth: Date) => {
      const monthStart = startOfWeek(startOfMonth(dateForMonth), { weekStartsOn: 0 });
      const monthEnd = endOfWeek(endOfMonth(dateForMonth), { weekStartsOn: 0 });
      const { data: overtimeData, error } = await supabase
        .from("overtime_filings")
        .select("id, start_time, end_time, status")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .gte("start_time", monthStart.toISOString())
        .lte("start_time", monthEnd.toISOString())
        .order("start_time", { ascending: true });

      if (error) {
        toast.error("Failed to fetch overtime data.");
        return;
      }

      const newOvertimeDays: Date[] = [];
      const newOvertimeDetails: OvertimeDetailsMap = {};
      if (overtimeData) {
        overtimeData.forEach((filing) => {
          const startDate = new Date(filing.start_time);
          const endDate = new Date(filing.end_time);
          const days = eachDayOfInterval({ start: startDate, end: endDate });

          days.forEach((day, index) => {
            const dateKey = format(day, "yyyy-MM-dd");
            if (!newOvertimeDetails[dateKey]) {
              newOvertimeDetails[dateKey] = [];
            }

            let type: "start" | "end" | "middle" | "single" = "middle";
            if (days.length === 1) {
              type = "single";
            } else if (index === 0) {
              type = "start";
            } else if (index === days.length - 1) {
              type = "end";
            }

            newOvertimeDetails[dateKey].push({
              id: filing.id,
              startTime: format(startDate, "p"),
              endTime: format(endDate, "p"),
              fullStartTime: filing.start_time,
              fullEndTime: filing.end_time,
              type,
              status: filing.status,
            });
          });

          newOvertimeDays.push(...days);
        });
      }
      setOvertimeDays(newOvertimeDays);
      setOvertimeDetails(newOvertimeDetails);
    },
    [supabase, user.id]
  );

  const fetchOneOffWfhDays = useCallback(
    async (dateForMonth: Date) => {
      const monthStart = startOfWeek(startOfMonth(dateForMonth), { weekStartsOn: 0 });
      const monthEnd = endOfWeek(endOfMonth(dateForMonth), { weekStartsOn: 0 });

      const { data, error } = await supabase
        .from("one_off_wfh_days")
        .select("date")
        .eq("user_id", user.id)
        .gte("date", format(monthStart, "yyyy-MM-dd"))
        .lte("date", format(monthEnd, "yyyy-MM-dd"));

      if (error) {
        toast.error("Could not fetch one-off WFH days.");
        return;
      }
      const newOneOffDays = data.map((d) => new Date(d.date + "T00:00:00"));
      setOneOffWfhDays(newOneOffDays);
    },
    [supabase, user.id]
  );

  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
    fetchOvertimeData(month);
    fetchOneOffWfhDays(month);
  };

  const handleDataRefresh = () => {
    fetchOvertimeData(currentMonth);
    fetchOneOffWfhDays(currentMonth);
  };

  useEffect(() => {
    async function fetchWfhSchedule() {
      const { data: wfhData } = await supabase
        .from("wfh_schedules")
        .select("days_of_week")
        .eq("user_id", user.id)
        .single();
      setWfhDaysOfWeek(wfhData?.days_of_week || []);
    }

    fetchWfhSchedule();
    fetchOvertimeData(currentMonth);
    fetchOneOffWfhDays(currentMonth);
  }, [user.id, supabase, currentMonth, fetchOvertimeData, fetchOneOffWfhDays]);

  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>My Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <WfhCalendarView
            user={user}
            month={currentMonth}
            onMonthChange={handleMonthChange}
            wfhDaysOfWeek={wfhDaysOfWeek}
            overtimeDays={overtimeDays}
            overtimeDetails={overtimeDetails}
            oneOffWfhDays={oneOffWfhDays}
            onDataChange={handleDataRefresh}
          />
        </CardContent>
      </Card>
      <div className="space-y-4">
        <WfhScheduleForm user={user} />
        <OvertimeFilingForm user={user} onFinished={handleDataRefresh} />
      </div>
    </div>
  );
}
