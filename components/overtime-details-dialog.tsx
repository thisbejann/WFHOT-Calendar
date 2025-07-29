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
import type { OvertimeDetail } from "./user-dashboard";
import { getDay } from "date-fns";

interface OvertimeDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  overtimeDetails: OvertimeDetail[];
  day: Date | null;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
  onFileOneOffWfh: (date: Date) => void;
}

export default function OvertimeDetailsDialog({
  isOpen,
  onClose,
  overtimeDetails,
  onDelete,
  onEdit,
  day,
  onFileOneOffWfh,
}: OvertimeDetailsDialogProps) {
  const isWeekend = day ? getDay(day) === 0 || getDay(day) === 6 : false;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Overtime Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {overtimeDetails.map((detail) => (
            <div key={detail.id} className="p-4 border rounded-md">
              <p>
                <strong>From:</strong> {detail.startTime}
              </p>
              <p>
                <strong>To:</strong> {detail.endTime}
              </p>
              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onEdit(detail.id);
                  }}
                >
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => onDelete(detail.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          {day && !isWeekend && (
            <Button variant="secondary" onClick={() => onFileOneOffWfh(day)} className="mr-auto">
              File One-Off WFH
            </Button>
          )}
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
