"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "./ui/label";
import { useState } from "react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-toastify";
import type { User } from "@supabase/supabase-js";

interface OneOffWfhFormProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  onSuccess: (newDate: Date) => void;
}

export default function OneOffWfhForm({
  user,
  isOpen,
  onClose,
  selectedDate,
  onSuccess,
}: OneOffWfhFormProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const handleSubmit = async () => {
    if (!selectedDate) return;
    setIsSubmitting(true);

    const formattedDate = format(selectedDate, "yyyy-MM-dd");

    // Check for existing approved overtime on this date
    const { count: overtimeCount, error: overtimeError } = await supabase
      .from("overtime_filings")
      .select("id", { count: "exact" })
      .eq("user_id", user.id)
      .eq("status", "approved")
      .gte("start_time", `${formattedDate}T00:00:00`)
      .lte("start_time", `${formattedDate}T23:59:59`);

    if (overtimeError) {
      toast.error("Failed to check for existing overtime. Please try again.");
      console.error("Error checking for overtime:", overtimeError);
      setIsSubmitting(false);
      return;
    }

    if (overtimeCount && overtimeCount > 0) {
      toast.error(
        "You have an approved overtime filing on this date. Cannot file for one-off WFH."
      );
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from("one_off_wfh_days").insert({
      user_id: user.id,
      date: formattedDate,
      reason: reason,
    });

    setIsSubmitting(false);

    if (error) {
      toast.error("Failed to file for one-off WFH. The date may already be filed.");
      console.error("Error inserting one-off WFH day:", error);
    } else {
      toast.success("One-off WFH day filed successfully!");
      onSuccess(selectedDate);
      onClose();
      setReason("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>File a One-Off Work-From-Home Day</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="font-semibold">Date: {selectedDate ? format(selectedDate, "PPP") : ""}</p>
          </div>
          <div className="grid w-full gap-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
              placeholder="Type your reason here."
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
