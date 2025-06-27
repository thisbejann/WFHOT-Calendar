"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Calendar } from "@/components/ui/calendar";
import { OvertimeDetailsMap } from "./user-dashboard";
import { createClient } from "@/lib/supabase/client";
import { startOfMonth, endOfMonth, format, getDay, eachDayOfInterval, isSameDay } from "date-fns";
import type { User } from "@supabase/supabase-js";
import OvertimeDetailsDialog from "./overtime-details-dialog";
import { OvertimeDetail } from "./user-dashboard";
import { DayClickEventHandler } from "react-day-picker";
import { toast } from "react-toastify";
import OvertimeFilingForm, { OvertimeFiling } from "./overtime-filing-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useRouter } from "next/navigation";
import OneOffWfhForm from "./one-off-wfh-form";

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
  const [oneOffWfhDays, setOneOffWfhDays] = useState<Date[]>([]);
  const supabase = createClient();
  const [fetchedMonths, setFetchedMonths] = useState<string[]>([format(initialDate, "yyyy-MM")]);
  const [selectedDayDetails, setSelectedDayDetails] = useState<OvertimeDetail[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isOneOffWfhDialogOpen, setIsOneOffWfhDialogOpen] = useState(false);
  const [filingToEdit, setFilingToEdit] = useState<OvertimeFiling | null>(null);
  const router = useRouter();

  const fetchOneOffWfhDays = useCallback(
    async (dateForMonth: Date) => {
      const monthStart = startOfMonth(dateForMonth);
      const monthEnd = endOfMonth(dateForMonth);

      const { data, error } = await supabase
        .from("one_off_wfh_days")
        .select("date")
        .eq("user_id", user.id)
        .gte("date", format(monthStart, "yyyy-MM-dd"))
        .lte("date", format(monthEnd, "yyyy-MM-dd"));

      if (error) {
        toast.error("Could not fetch one-off WFH days.");
        console.error("Error fetching one-off WFH days:", error);
        return;
      }

      const newOneOffDays = data.map(
        (d) => new Date(d.date + "T00:00:00") // Ensure local timezone
      );

      setOneOffWfhDays((prevDays) => {
        const otherMonthDays = prevDays.filter((d) => {
          const dayDate = new Date(d);
          return !(dayDate >= monthStart && dayDate <= monthEnd);
        });
        const allDays = [...otherMonthDays, ...newOneOffDays];
        return [...new Map(allDays.map((d) => [d.getTime(), d])).values()];
      });
    },
    [supabase, user.id]
  );

  const fetchOvertimeForMonth = useCallback(
    async (dateForMonth: Date) => {
      const monthStart = startOfMonth(dateForMonth);
      const monthEnd = endOfMonth(dateForMonth);

      const { data: overtimeData, error } = await supabase
        .from("overtime_filings")
        .select("id, start_time, end_time, reason, status")
        .eq("user_id", user.id)
        .in("status", ["approved", "pending"])
        .gte("start_time", monthStart.toISOString())
        .lte("start_time", monthEnd.toISOString())
        .order("start_time", { ascending: true });

      if (error) {
        toast.error("Could not fetch overtime data.");
        console.error("Error fetching overtime data:", error);
        return;
      }

      const newOtDetails: OvertimeDetailsMap = {};
      const newOtDays: Date[] = [];

      overtimeData.forEach((filing) => {
        const startDate = new Date(filing.start_time);
        const endDate = new Date(filing.end_time);
        const days = eachDayOfInterval({ start: startDate, end: endDate });

        days.forEach((day, index) => {
          const dateKey = format(day, "yyyy-MM-dd");
          if (!newOtDetails[dateKey]) {
            newOtDetails[dateKey] = [];
          }
          let type: "start" | "end" | "middle" | "single" = "middle";
          if (days.length === 1) {
            type = "single";
          } else if (index === 0) {
            type = "start";
          } else if (index === days.length - 1) {
            type = "end";
          }
          newOtDetails[dateKey].push({
            id: filing.id,
            startTime: format(startDate, "p"),
            endTime: format(endDate, "p"),
            fullStartTime: filing.start_time,
            fullEndTime: filing.end_time,
            type,
            status: filing.status,
          });
        });
        newOtDays.push(...days);
      });

      setCurrentOvertimeDetails((prevDetails) => {
        const updatedDetails = { ...prevDetails };
        // Clear out old details for the fetched month
        Object.keys(updatedDetails).forEach((dateKey) => {
          const keyDate = new Date(dateKey);
          if (keyDate >= monthStart && keyDate <= monthEnd) {
            delete updatedDetails[dateKey];
          }
        });
        // Merge in new details
        return { ...updatedDetails, ...newOtDetails };
      });

      setCurrentOvertimeDays((prevDays) => {
        // Filter out old days from the fetched month
        const otherMonthDays = prevDays.filter((d) => {
          const dayDate = new Date(d);
          return !(dayDate >= monthStart && dayDate <= monthEnd);
        });
        const allDays = [...otherMonthDays, ...newOtDays];
        // Return unique days
        return [...new Map(allDays.map((d) => [d.getTime(), d])).values()];
      });
    },
    [supabase, user.id]
  );

  const handleDayClick: DayClickEventHandler = (day, modifiers) => {
    const dayOfWeek = getDay(day);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend) {
      toast.info("Cannot file for WFH on a weekend.");
      return;
    }

    const dateKey = format(day, "yyyy-MM-dd");
    const details = currentOvertimeDetails[dateKey] || [];

    if (details.length > 0) {
      setSelectedDayDetails(details);
      setSelectedDate(day);
      setIsDetailsDialogOpen(true);
      return;
    }

    if (modifiers.wfh || modifiers.oneOffWfh) {
      // It's a WFH day, do nothing.
      return;
    }

    // It's a normal work day, open the one-off WFH dialog.
    setSelectedDate(day);
    setIsOneOffWfhDialogOpen(true);
  };

  const handleStartEdit = async (id: number) => {
    const { data, error } = await supabase
      .from("overtime_filings")
      .select("id, start_time, end_time, reason")
      .eq("id", id);

    if (error || !data || data.length !== 1) {
      toast.error("Failed to fetch overtime details.");
      console.error(
        "Error fetching overtime:",
        error || "No data returned for the specified filing."
      );
      return;
    }

    setFilingToEdit(data[0]);
    setIsDetailsDialogOpen(false); // Close details dialog
    setIsEditDialogOpen(true); // Open edit dialog
  };

  const handleDeleteFiling = async (id: number) => {
    const { error } = await supabase.from("overtime_filings").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete overtime filing.");
      console.error("Error deleting overtime:", error);
    } else {
      toast.success("Overtime filing deleted successfully.");

      // Optimistically update the state
      const newOvertimeDetails = { ...currentOvertimeDetails };
      const daysToDeleteFromOvertimeDays: string[] = [];

      for (const day in newOvertimeDetails) {
        const initialLength = newOvertimeDetails[day].length;
        newOvertimeDetails[day] = newOvertimeDetails[day].filter((detail) => detail.id !== id);
        if (newOvertimeDetails[day].length === 0 && initialLength > 0) {
          daysToDeleteFromOvertimeDays.push(day);
          delete newOvertimeDetails[day];
        }
      }

      if (daysToDeleteFromOvertimeDays.length > 0) {
        const datesToDelete = daysToDeleteFromOvertimeDays.map((dayStr) => {
          const dayAsDate = new Date(dayStr);
          // Adjust for timezone differences when comparing dates
          return new Date(dayAsDate.valueOf() + dayAsDate.getTimezoneOffset() * 60 * 1000);
        });

        setCurrentOvertimeDays(
          currentOvertimeDays.filter((d) => !datesToDelete.some((delDate) => isSameDay(d, delDate)))
        );
      }

      setCurrentOvertimeDetails(newOvertimeDetails);
      setIsDetailsDialogOpen(false);
    }
  };

  useEffect(() => {
    fetchOneOffWfhDays(initialDate);
  }, [fetchOneOffWfhDays, initialDate]);

  useEffect(() => {
    setCurrentOvertimeDays(overtimeDays);
    setCurrentOvertimeDetails(overtimeDetails);
  }, [overtimeDays, overtimeDetails]);

  useEffect(() => {
    async function fetchScheduleData() {
      if (!date) return;

      const monthKey = format(date, "yyyy-MM");
      if (fetchedMonths.includes(monthKey)) {
        return;
      }

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
      await fetchOvertimeForMonth(date);
      await fetchOneOffWfhDays(date);

      setFetchedMonths((prev) => [...prev, monthKey]);
    }

    fetchScheduleData();
  }, [date, supabase, user.id, fetchedMonths, fetchOvertimeForMonth, fetchOneOffWfhDays]);

  // Calculate the different day categories for styling
  const overtimeOnWfhDays = currentOvertimeDays.filter((otDate) =>
    currentWfhDaysOfWeek.includes(getDay(otDate))
  );
  const overtimeOnlyDays = currentOvertimeDays.filter(
    (otDate) => !currentWfhDaysOfWeek.includes(getDay(otDate))
  );

  // First, find all unique IDs of filings that have at least one pending day.
  const pendingFilingIds = new Set<number>();
  Object.values(currentOvertimeDetails)
    .flat()
    .forEach((detail) => {
      if (detail.status === "pending") {
        pendingFilingIds.add(detail.id);
      }
    });

  // Now, find all days that contain a filing with one of those pending IDs.
  const pendingOvertimeDays: Date[] = [];
  Object.entries(currentOvertimeDetails).forEach(([dateKey, details]) => {
    const isDayPending = details.some((detail) => pendingFilingIds.has(detail.id));
    if (isDayPending) {
      // Reconstruct date from key. It's in UTC, so add timezone offset to get local day.
      const date = new Date(dateKey);
      pendingOvertimeDays.push(new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000));
    }
  });

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
          oneOffWfh: oneOffWfhDays,
          overtime: overtimeOnlyDays.filter(
            (d) => !pendingOvertimeDays.some((p) => isSameDay(p, d))
          ),
          wfhAndOvertime: overtimeOnWfhDays.filter(
            (d) => !pendingOvertimeDays.some((p) => isSameDay(p, d))
          ),
          pending: pendingOvertimeDays,
        }}
        modifiersStyles={{
          wfh: {
            color: "#1e88e5",
            backgroundColor: "#e3f2fd",
          },
          oneOffWfh: {
            color: "#8e44ad",
            backgroundColor: "#f3e5f5",
          },
          overtime: {
            color: "#43a047",
            backgroundColor: "#e8f5e9",
          },
          wfhAndOvertime: {
            background: "linear-gradient(45deg, #e3f2fd 50%, #e8f5e9 50%)",
          },
          pending: {
            color: "#f59e0b",
            backgroundColor: "#fef3c7",
          },
        }}
        overtimeDetails={currentOvertimeDetails}
        onDayClick={handleDayClick}
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
            style={{ backgroundColor: "#f3e5f5", border: "1px solid #8e44ad" }}
          />
          <span className="text-sm text-muted-foreground">One-off WFH</span>
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
        <div className="flex items-center space-x-2">
          <div
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: "#fef3c7", border: "1px solid #f59e0b" }}
          />
          <span className="text-sm text-muted-foreground">Pending OT</span>
        </div>
      </div>
      <OvertimeDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        overtimeDetails={selectedDayDetails}
        day={selectedDate}
        onDelete={handleDeleteFiling}
        onEdit={handleStartEdit}
      />
      {filingToEdit && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Overtime Filing</DialogTitle>
            </DialogHeader>
            <OvertimeFilingForm
              user={user}
              filingToEdit={filingToEdit}
              onFinished={() => {
                setIsEditDialogOpen(false);
                setFilingToEdit(null);
                if (date) {
                  fetchOvertimeForMonth(date);
                }
                router.refresh();
              }}
            />
          </DialogContent>
        </Dialog>
      )}
      <OneOffWfhForm
        user={user}
        isOpen={isOneOffWfhDialogOpen}
        onClose={() => setIsOneOffWfhDialogOpen(false)}
        selectedDate={selectedDate}
        onSuccess={(newDate) => {
          setOneOffWfhDays((prev) => [...prev, newDate]);
        }}
      />
    </div>
  );
}
