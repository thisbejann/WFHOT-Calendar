"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { format } from "date-fns";

type PendingFiling = {
  id: number;
  start_time: string;
  end_time: string;
  reason: string | null;
  full_name: string | null;
};

export default function PendingRequestsTable() {
  const [pendingFilings, setPendingFilings] = useState<PendingFiling[]>([]);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchPendingFilings() {
      const { data, error } = await supabase.rpc("get_pending_overtime_with_names");
      if (error) {
        console.error("Error fetching pending filings:", error);
        return;
      }
      if (data) {
        setPendingFilings(data);
      }
    }
    fetchPendingFilings();
  }, [supabase]);

  const handleUpdateRequest = async (id: number, status: "approved" | "declined") => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("overtime_filings")
      .update({
        status: status,
        reviewer_id: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (!error) {
      setPendingFilings(pendingFilings.filter((filing) => filing.id !== id));
      router.refresh();
    } else {
      console.error(`Error updating filing status:`, error);
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Start Time</TableHead>
          <TableHead>End Time</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pendingFilings.length > 0 ? (
          pendingFilings.map((filing) => (
            <TableRow key={filing.id}>
              <TableCell>{filing.full_name || "N/A"}</TableCell>
              <TableCell>{format(new Date(filing.start_time), "PPP")}</TableCell>
              <TableCell>{format(new Date(filing.start_time), "p")}</TableCell>
              <TableCell>{format(new Date(filing.end_time), "p")}</TableCell>
              <TableCell>{filing.reason}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateRequest(filing.id, "approved")}
                >
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleUpdateRequest(filing.id, "declined")}
                >
                  Decline
                </Button>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="text-center">
              No pending requests.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
