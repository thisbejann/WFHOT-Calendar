"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { toast } from "react-toastify";

const daysOfWeek = [
  { id: 1, label: "Monday" },
  { id: 2, label: "Tuesday" },
  { id: 3, label: "Wednesday" },
  { id: 4, label: "Thursday" },
  { id: 5, label: "Friday" },
];

const wfhFormSchema = z.object({
  days: z.array(z.number()).refine((value) => value.length >= 0, {
    message: "Please select at least one day.",
  }),
});

type WfhFormValues = z.infer<typeof wfhFormSchema>;

export default function WfhScheduleForm({ user }: { user: User }) {
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<WfhFormValues>({
    resolver: zodResolver(wfhFormSchema),
    defaultValues: {
      days: [],
    },
  });

  useEffect(() => {
    const fetchWfhSchedule = async () => {
      const { data } = await supabase
        .from("wfh_schedules")
        .select("days_of_week")
        .eq("user_id", user.id)
        .single();

      if (data && data.days_of_week) {
        form.reset({ days: data.days_of_week });
      }
    };

    fetchWfhSchedule();
  }, [supabase, user.id, form]);

  async function onSubmit(values: WfhFormValues) {
    const { error } = await supabase.from("wfh_schedules").upsert(
      {
        user_id: user.id,
        days_of_week: values.days,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (!error) {
      toast.success("WFH schedule saved successfully!");
      router.refresh();
    } else {
      toast.error("Error saving WFH schedule.");
      console.error("Error saving WFH schedule:", error);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set WFH Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="days"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Work-From-Home Days</FormLabel>
                    <FormDescription>
                      Select the days you will permanently work from home.
                    </FormDescription>
                  </div>
                  {daysOfWeek.map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name="days"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={item.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, item.id])
                                    : field.onChange(
                                        field.value?.filter((value) => value !== item.id)
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">{item.label}</FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Save Schedule</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
