"use client";

import React from "react";
import { Calendar } from "@/components/ui/calendar";
import { OvertimeDetailsMap } from "./user-dashboard";
import { createClient } from "@/lib/supabase/client";
import { format, getDay } from "date-fns";
import type { User } from "@supabase/supabase-js";
import OvertimeDetailsDialog from "./overtime-details-dialog";
import { OvertimeDetail } from "./user-dashboard";
import { DayClickEventHandler } from "react-day-picker";
import { toast } from "react-toastify";
import OvertimeFilingForm, { OvertimeFiling } from "./overtime-filing-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import OneOffWfhForm from "./one-off-wfh-form";

interface WfhCalendarViewProps {
  user: User;
  month: Date;
  onMonthChange: (date: Date) => void;
  wfhDaysOfWeek: number[];
  overtimeDays: Date[];
  overtimeDetails: OvertimeDetailsMap;
  oneOffWfhDays: Date[];
  onDataChange: () => void;
}

export default function WfhCalendarView({
  user,
  month,
  onMonthChange,
  wfhDaysOfWeek,
  overtimeDays,
  overtimeDetails,
  oneOffWfhDays,
  onDataChange,
}: WfhCalendarViewProps) {
  const [selectedDayDetails, setSelectedDayDetails] = React.useState<OvertimeDetail[]>([]);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isOneOffWfhDialogOpen, setIsOneOffWfhDialogOpen] = React.useState(false);
  const [filingToEdit, setFilingToEdit] = React.useState<OvertimeFiling | null>(null);
  const supabase = createClient();

  const handleFileOneOffWfh = (date: Date) => {
    setIsDetailsDialogOpen(false); // Close overtime details dialog
    setSelectedDate(date); // Ensure the date is set for the OneOffWfhForm
    setIsOneOffWfhDialogOpen(true); // Open one-off WFH dialog
  };

  const handleDayClick: DayClickEventHandler = (day, modifiers) => {
    const dateKey = format(day, "yyyy-MM-dd");
    const details = overtimeDetails[dateKey] || [];

    if (details.length > 0) {
      setSelectedDayDetails(details);
      setSelectedDate(day);
      setIsDetailsDialogOpen(true);
      return;
    }

    // Only check for WFH weekend filing after checking for existing OT
    const dayOfWeek = getDay(day);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (isWeekend) {
      toast.info("Cannot file for WFH on a weekend.");
      return;
    }

    if (modifiers.wfh || modifiers.oneOffWfh) {
      return;
    }

    setSelectedDate(day);
    setIsOneOffWfhDialogOpen(true);
  };

  const handleStartEdit = async (id: number) => {
    const { data, error } = await supabase
      .from("overtime_filings")
      .select("id, start_time, end_time, reason")
      .eq("id", id)
      .single();

    if (error || !data) {
      toast.error("Failed to fetch overtime details.");
      console.error(
        "Error fetching overtime:",
        error || "No data returned for the specified filing."
      );
      return;
    }

    setFilingToEdit(data);
    setIsDetailsDialogOpen(false);
    setIsEditDialogOpen(true);
  };

  const handleDeleteFiling = async (id: number) => {
    const { error } = await supabase.from("overtime_filings").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete overtime filing.");
      console.error("Error deleting overtime:", error);
    } else {
      toast.success("Overtime filing deleted successfully.");
      onDataChange();
      setIsDetailsDialogOpen(false);
    }
  };

  const overtimeOnWfhDays = overtimeDays.filter((otDate) => wfhDaysOfWeek.includes(getDay(otDate)));

  const overtimeOnlyDays = overtimeDays.filter((otDate) => !wfhDaysOfWeek.includes(getDay(otDate)));

  const oneOffWfhAndOvertimeDays = overtimeDays.filter((otDate) =>
    oneOffWfhDays.some((wfhDate) => format(wfhDate, "yyyy-MM-dd") === format(otDate, "yyyy-MM-dd"))
  );

  return (
    <div className="flex flex-col items-center">
      <Calendar
        month={month}
        onMonthChange={onMonthChange}
        onDayClick={handleDayClick}
        modifiers={{
          wfh: { dayOfWeek: wfhDaysOfWeek },
          oneOffWfh: oneOffWfhDays,
          overtime: overtimeOnlyDays,
          wfhAndOvertime: overtimeOnWfhDays,
          oneOffWfhAndOvertime: oneOffWfhAndOvertimeDays,
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
          oneOffWfhAndOvertime: {
            background: "linear-gradient(45deg, #f3e5f5 50%, #e8f5e9 50%)",
          },
        }}
        className="rounded-md border"
        overtimeDetails={overtimeDetails}
      />
      <div className="flex flex-wrap justify-center items-center space-x-4 p-4">
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
            style={{
              background: "linear-gradient(45deg, #f3e5f5 50%, #e8f5e9 50%)",
              border: "1px solid #ababab",
            }}
          />
          <span className="text-sm text-muted-foreground">One-off WFH & OT</span>
        </div>
      </div>
      <OvertimeDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        overtimeDetails={selectedDayDetails}
        day={selectedDate}
        onEdit={handleStartEdit}
        onDelete={handleDeleteFiling}
        onFileOneOffWfh={handleFileOneOffWfh}
      />
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
              onDataChange();
            }}
          />
        </DialogContent>
      </Dialog>
      <OneOffWfhForm
        user={user}
        isOpen={isOneOffWfhDialogOpen}
        onClose={() => setIsOneOffWfhDialogOpen(false)}
        selectedDate={selectedDate}
        onSuccess={() => {
          setIsOneOffWfhDialogOpen(false);
          onDataChange();
        }}
      />
    </div>
  );
}
