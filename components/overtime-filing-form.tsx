"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { toast } from "react-toastify";
import { useEffect } from "react";
import type { User } from "@supabase/supabase-js";

export type OvertimeFiling = {
  id: number;
  start_time: string;
  end_time: string;
  reason: string;
};

const overtimeFormSchema = z
  .object({
    startDate: z.date({
      required_error: "A start date is required.",
    }),
    endDate: z.date({
      required_error: "An end date is required.",
    }),
    startTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format. Use HH:mm"),
    endTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format. Use HH:mm"),
    reason: z.string().min(10, {
      message: "Reason must be at least 10 characters.",
    }),
  })
  .refine(
    (data) => {
      const startDateTime = new Date(data.startDate);
      const [startHours, startMinutes] = data.startTime.split(":").map(Number);
      startDateTime.setHours(startHours, startMinutes);

      const endDateTime = new Date(data.endDate);
      const [endHours, endMinutes] = data.endTime.split(":").map(Number);
      endDateTime.setHours(endHours, endMinutes);

      return endDateTime > startDateTime;
    },
    {
      message: "End date and time must be after start date and time.",
      path: ["endDate"], // You can specify which field the error belongs to
    }
  );

type OvertimeFormValues = z.infer<typeof overtimeFormSchema>;

interface OvertimeFilingFormProps {
  user: User;
  filingToEdit?: OvertimeFiling | null;
  onFinished?: () => void;
}

export default function OvertimeFilingForm({
  user,
  filingToEdit,
  onFinished,
}: OvertimeFilingFormProps) {
  const supabase = createClient();
  const isEditMode = !!filingToEdit;

  const form = useForm<OvertimeFormValues>({
    resolver: zodResolver(overtimeFormSchema),
    defaultValues: {
      startTime: "",
      endTime: "",
      reason: "",
    },
  });

  useEffect(() => {
    if (isEditMode) {
      const startDate = new Date(filingToEdit.start_time);
      const endDate = new Date(filingToEdit.end_time);
      form.reset({
        startDate,
        endDate,
        startTime: format(startDate, "HH:mm"),
        endTime: format(endDate, "HH:mm"),
        reason: filingToEdit.reason,
      });
    }
  }, [filingToEdit, form, isEditMode]);

  async function onSubmit(values: OvertimeFormValues) {
    const { startDate, endDate, startTime, endTime, reason } = values;

    const startDateTime = new Date(startDate);
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    startDateTime.setHours(startHours, startMinutes, 0, 0);

    const endDateTime = new Date(endDate);
    const [endHours, endMinutes] = endTime.split(":").map(Number);
    endDateTime.setHours(endHours, endMinutes, 0, 0);

    // --- Validation for overlapping overtime ---
    let overlapQuery = supabase
      .from("overtime_filings")
      .select("id", { count: "exact" })
      .eq("user_id", user.id)
      .eq("status", "approved")
      .lt("start_time", endDateTime.toISOString()) // existing start < new end
      .gt("end_time", startDateTime.toISOString()); // existing end > new start

    if (isEditMode) {
      overlapQuery = overlapQuery.neq("id", filingToEdit.id);
    }

    const { error: overlapError, count } = await overlapQuery;

    if (overlapError) {
      toast.error("Could not validate overtime filing. Please try again.");
      console.error("Error checking for overlapping filings:", overlapError);
      return;
    }

    if (count && count > 0) {
      toast.error("This filing overlaps with an existing approved overtime.");
      return;
    }
    // --- End validation ---

    const filingData = {
      user_id: user.id,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      reason,
      status: "approved",
    };

    if (isEditMode) {
      // In edit mode, we delete the old filing and create a new one to update the record.
      const { error: deleteError } = await supabase
        .from("overtime_filings")
        .delete()
        .eq("id", filingToEdit.id);

      if (deleteError) {
        toast.error("Error updating overtime filing. Could not remove original.");
        console.error("Error deleting original filing:", deleteError);
        return;
      }
    }

    const { error: insertError } = await supabase.from("overtime_filings").insert(filingData);

    if (!insertError) {
      toast.success(
        `Overtime filing ${isEditMode ? "updated" : "submitted"} and approved successfully!`
      );
      form.reset();
      if (onFinished) {
        onFinished();
      }
    } else {
      toast.error("Error saving overtime filing.");
      console.error("Error saving overtime filing:", insertError);
    }
  }

  const formContent = (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("space-y-8", isEditMode && "pt-4")}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a start date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick an end date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason</FormLabel>
              <FormControl>
                <Input placeholder="Reason for overtime..." {...field} />
              </FormControl>
              <FormDescription>Please provide a brief reason for this overtime.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">{isEditMode ? "Update Filing" : "Submit Filing"}</Button>
      </form>
    </Form>
  );

  if (isEditMode) {
    return formContent;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>File Overtime</CardTitle>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}
