"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
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
import type { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const overtimeFormSchema = z.object({
  date: z.date({
    required_error: "A date is required.",
  }),
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format. Use HH:mm"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format. Use HH:mm"),
  reason: z.string().min(10, {
    message: "Reason must be at least 10 characters.",
  }),
});

type OvertimeFormValues = z.infer<typeof overtimeFormSchema>;

export default function OvertimeFilingForm({ user }: { user: User }) {
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<OvertimeFormValues>({
    resolver: zodResolver(overtimeFormSchema),
    defaultValues: {
      startTime: "",
      endTime: "",
      reason: "",
    },
  });

  async function onSubmit(values: OvertimeFormValues) {
    const { date, startTime, endTime, reason } = values;

    const startDateTime = new Date(date);
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    startDateTime.setHours(startHours, startMinutes, 0, 0);

    const endDateTime = new Date(date);
    const [endHours, endMinutes] = endTime.split(":").map(Number);
    endDateTime.setHours(endHours, endMinutes, 0, 0);

    const { error } = await supabase.from("overtime_filings").insert({
      user_id: user.id,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      reason,
    });

    if (!error) {
      // Potentially show a toast message for success
      form.reset();
      router.refresh();
    } else {
      // Potentially show a toast message for error
      console.error("Error saving overtime filing:", error);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>File Overtime</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
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

            <div className="flex gap-4">
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
                  <FormDescription>
                    Please provide a brief reason for this overtime.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit Filing</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
