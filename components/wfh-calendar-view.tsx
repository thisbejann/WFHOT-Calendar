"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { eachDayOfInterval, endOfMonth, format, getDay, startOfMonth } from "date-fns";

type WfhSchedule = {
  full_name: string | null;
  days_of_week: number[];
};

type WfhDaysMap = {
  [key: string]: string[]; // Map date string to array of employee names
};

export default function WfhCalendarView() {
  const [wfhSchedules, setWfhSchedules] = useState<WfhSchedule[]>([]);
  const [wfhDaysMap, setWfhDaysMap] = useState<WfhDaysMap>({});
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
    fetchWfhSchedules();
  }, [supabase]);

  useEffect(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const allDaysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const newWfhDaysMap: WfhDaysMap = {};
    allDaysInMonth.forEach((day) => {
      const dayOfWeek = getDay(day);
      const employeesOnWfh = wfhSchedules
        .filter((schedule) => schedule.days_of_week.includes(dayOfWeek))
        .map((schedule) => schedule.full_name || "Unknown");

      if (employeesOnWfh.length > 0) {
        newWfhDaysMap[format(day, "yyyy-MM-dd")] = employeesOnWfh;
      }
    });
    setWfhDaysMap(newWfhDaysMap);
  }, [wfhSchedules, currentMonth]);

  const handleDayClick = (day: Date) => {
    const dateKey = format(day, "yyyy-MM-dd");
    const employees = wfhDaysMap[dateKey];
    if (employees && employees.length > 0) {
      setSelectedDate(day);
      setSelectedDayWfh(employees);
      setIsDialogOpen(true);
    }
  };

  const wfhDaysModifier = Object.keys(wfhDaysMap).map((dateStr) => new Date(dateStr + "T12:00:00"));

  return (
    <>
      <div className="flex justify-center">
        <Calendar
          modifiers={{ wfh: wfhDaysModifier }}
          modifiersStyles={{ wfh: { color: "#1e88e5", backgroundColor: "#e3f2fd" } }}
          onDayClick={handleDayClick}
          onMonthChange={setCurrentMonth}
          className="rounded-md border"
        />
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
