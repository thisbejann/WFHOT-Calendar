"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  startOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";

type WfhSchedule = {
  full_name: string | null;
  days_of_week: number[];
};

type OneOffWfhDay = {
  full_name: string | null;
  date: string; // "yyyy-MM-dd"
};

type WfhDaysMap = {
  [key: string]: string[]; // Map date string to array of employee names
};

export default function AdminWfhCalendar() {
  const [wfhSchedules, setWfhSchedules] = useState<WfhSchedule[]>([]);
  const [oneOffWfhDays, setOneOffWfhDays] = useState<OneOffWfhDay[]>([]);
  const [wfhDaysMap, setWfhDaysMap] = useState<WfhDaysMap>({});
  const [oneOffWfhDaysMap, setOneOffWfhDaysMap] = useState<WfhDaysMap>({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDayWfh, setSelectedDayWfh] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchWfhSchedules() {
      const { data, error } = await supabase.rpc("get_wfh_schedules_with_names");
      if (error) {
        console.error("Error fetching WFH schedules:", error);
        return;
      }
      if (data) {
        setWfhSchedules(data);
      }
    }

    async function fetchOneOffWfhDays() {
      const { data, error } = await supabase.rpc("get_all_one_off_wfh_days");
      if (error) {
        console.error("Error fetching one-off WFH days:", error);
        return;
      }
      if (data) {
        setOneOffWfhDays(data);
      }
    }

    fetchWfhSchedules();
    fetchOneOffWfhDays();
  }, [supabase]);

  useEffect(() => {
    // Process regular WFH schedules
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const firstDayOfFirstWeek = startOfWeek(monthStart);
    const lastDayOfLastWeek = endOfWeek(monthEnd);

    const allDaysInGrid = eachDayOfInterval({
      start: firstDayOfFirstWeek,
      end: lastDayOfLastWeek,
    });

    const newWfhDaysMap: WfhDaysMap = {};
    allDaysInGrid.forEach((day) => {
      const dayOfWeek = getDay(day);
      const employeesOnWfh = wfhSchedules
        .filter((schedule) => schedule.days_of_week.includes(dayOfWeek))
        .map((schedule) => schedule.full_name || "Unknown");

      if (employeesOnWfh.length > 0) {
        newWfhDaysMap[format(day, "yyyy-MM-dd")] = employeesOnWfh;
      }
    });
    setWfhDaysMap(newWfhDaysMap);

    // Process one-off WFH days
    const newOneOffWfhDaysMap: WfhDaysMap = {};
    oneOffWfhDays.forEach((oneOff) => {
      const dateKey = oneOff.date;
      if (!newOneOffWfhDaysMap[dateKey]) {
        newOneOffWfhDaysMap[dateKey] = [];
      }
      newOneOffWfhDaysMap[dateKey].push(oneOff.full_name || "Unknown");
    });
    setOneOffWfhDaysMap(newOneOffWfhDaysMap);
  }, [wfhSchedules, oneOffWfhDays, currentMonth]);

  const handleDayClick = (day: Date) => {
    const dateKey = format(day, "yyyy-MM-dd");
    const regularEmployees = wfhDaysMap[dateKey] || [];
    const oneOffEmployees = oneOffWfhDaysMap[dateKey] || [];
    const allEmployees = [...new Set([...regularEmployees, ...oneOffEmployees])];

    if (allEmployees.length > 0) {
      setSelectedDate(day);
      setSelectedDayWfh(allEmployees);
      setIsDialogOpen(true);
    }
  };

  const { wfhDaysModifier, oneOffWfhDaysModifier, mixedDaysModifier } = useMemo(() => {
    const regularWfh = Object.keys(wfhDaysMap).map((d) => new Date(d + "T12:00:00"));
    const oneOffWfh = Object.keys(oneOffWfhDaysMap).map((d) => new Date(d + "T12:00:00"));

    const wfhDaysSet = new Set(regularWfh.map((d) => d.getTime()));
    const oneOffDaysSet = new Set(oneOffWfh.map((d) => d.getTime()));

    const wfhOnly = regularWfh.filter((d) => !oneOffDaysSet.has(d.getTime()));
    const oneOffOnly = oneOffWfh.filter((d) => !wfhDaysSet.has(d.getTime()));
    const mixed = regularWfh.filter((d) => oneOffDaysSet.has(d.getTime()));

    return {
      wfhDaysModifier: wfhOnly,
      oneOffWfhDaysModifier: oneOffOnly,
      mixedDaysModifier: mixed,
    };
  }, [wfhDaysMap, oneOffWfhDaysMap]);

  return (
    <>
      <div className="flex flex-col items-center pt-4">
        <Calendar
          modifiers={{
            wfh: wfhDaysModifier,
            oneOffWfh: oneOffWfhDaysModifier,
            mixed: mixedDaysModifier,
          }}
          modifiersStyles={{
            wfh: { color: "#1e88e5", backgroundColor: "#e3f2fd" },
            oneOffWfh: { color: "#8e44ad", backgroundColor: "#f3e5f5" },
            mixed: {
              background: "linear-gradient(45deg, #e3f2fd 50%, #f3e5f5 50%)",
            },
          }}
          onDayClick={handleDayClick}
          onMonthChange={setCurrentMonth}
          className="rounded-md border"
        />
        <div className="flex items-center space-x-4 p-4">
          <div className="flex items-center space-x-2">
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: "#e3f2fd", border: "1px solid #1e88e5" }}
            />
            <span className="text-sm text-muted-foreground">Scheduled WFH</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: "#f3e5f5", border: "1px solid #8e44ad" }}
            />
            <span className="text-sm text-muted-foreground">One-off WFH</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="h-4 w-4 rounded-full"
              style={{
                background: "linear-gradient(45deg, #e3f2fd 50%, #f3e5f5 50%)",
              }}
            />
            <span className="text-sm text-muted-foreground">Mixed</span>
          </div>
        </div>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>WFH on {selectedDate ? format(selectedDate, "PPP") : ""}</DialogTitle>
          </DialogHeader>
          <ul className="list-disc pl-5">
            {selectedDayWfh.map((name, index) => (
              <li key={index} className="text-sm">
                {name}
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
