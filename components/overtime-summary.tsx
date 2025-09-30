"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  format,
  getDay,
  differenceInHours,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
} from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "react-toastify";
import type { User } from "@supabase/supabase-js";

interface OvertimeSummaryProps {
  user: User;
}

export default function OvertimeSummary({ user }: OvertimeSummaryProps) {
  const supabase = createClient();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [regularDayOthours, setRegularDayOtHours] = useState(0);
  const [restDayOtHours, setRestDayOtHours] = useState(0);

  const calculateOvertimeHours = useCallback(async () => {
    if (!startDate || !endDate) {
      toast.info("Please select both a start and end date.");
      setRegularDayOtHours(0);
      setRestDayOtHours(0);
      return;
    }

    setLoading(true);
    setRegularDayOtHours(0);
    setRestDayOtHours(0);

    // Fetch all overtime filings within the date range
    const { data: overtimeData, error: otError } = await supabase
      .from("overtime_filings")
      .select("id, user_id, start_time, end_time")
      .eq("user_id", user.id)
      .gte("start_time", startOfDay(startDate).toISOString())
      .lte("end_time", endOfDay(endDate).toISOString());

    if (otError) {
      toast.error("Error fetching overtime data.");
      console.error("Error fetching overtime:", otError);
      setLoading(false);
      return;
    }

    // Fetch all WFH schedules for all users to determine workdays
    const { data: wfhSchedulesData, error: wfhError } = await supabase
      .from("wfh_schedules")
      .select("user_id, days_of_week")
      .eq("user_id", user.id);

    if (wfhError) {
      toast.error("Error fetching WFH schedules.");
      console.error("Error fetching WFH schedules:", wfhError);
      setLoading(false);
      return;
    }

    const wfhSchedulesMap = new Map<string, number[]>();
    wfhSchedulesData?.forEach((schedule) => {
      wfhSchedulesMap.set(schedule.user_id, schedule.days_of_week);
    });

    let totalRegular = 0;
    let totalRest = 0;

    overtimeData?.forEach((filing) => {
      const otStartTime = new Date(filing.start_time);
      const otEndTime = new Date(filing.end_time);
      const wfhDays = wfhSchedulesMap.get(filing.user_id) || [];

      const daysInOvertime = eachDayOfInterval({ start: otStartTime, end: otEndTime });

      daysInOvertime.forEach((day) => {
        const currentDayStart = startOfDay(day);
        const currentDayEnd = endOfDay(day);

        // Calculate overlap with the filing for this specific day
        const segmentStart = otStartTime > currentDayStart ? otStartTime : currentDayStart;
        const segmentEnd = otEndTime < currentDayEnd ? otEndTime : currentDayEnd;

        if (segmentStart < segmentEnd) {
          const hours = differenceInHours(segmentEnd, segmentStart);
          const dayOfWeek = getDay(day); // 0 for Sunday, 1 for Monday, etc.

          const isWorkday = wfhDays.includes(dayOfWeek) || (dayOfWeek >= 1 && dayOfWeek <= 5); // Monday to Friday
          const isRestDay = !isWorkday;

          if (isRestDay) {
            totalRest += hours;
          } else {
            totalRegular += hours;
          }
        }
      });
    });

    setRegularDayOtHours(totalRegular);
    setRestDayOtHours(totalRest);
    setLoading(false);
  }, [startDate, endDate, supabase, user.id]);

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : <span>Pick a start date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : <span>Pick an end date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
            </PopoverContent>
          </Popover>
          <Button onClick={calculateOvertimeHours} disabled={loading || !startDate || !endDate}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Calculate Overtime
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Regular Day OTs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{regularDayOthours} hours</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Rest Day OTs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{restDayOtHours} hours</p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
