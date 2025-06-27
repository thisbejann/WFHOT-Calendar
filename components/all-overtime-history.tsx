"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "./ui/badge";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import Link from "next/link";

export type OvertimeHistory = {
  id: number;
  user_id: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  full_name: string | null;
  status: "approved" | "declined" | "pending";
  reviewer_full_name: string | null;
};

type SortKey = "start_time" | "status";

interface AllOvertimeHistoryProps {
  overtimeHistory: OvertimeHistory[];
}

export default function AllOvertimeHistory({ overtimeHistory }: AllOvertimeHistoryProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("start_time");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const getStatusVariant = (status: "approved" | "declined" | "pending") => {
    switch (status) {
      case "approved":
        return "default";
      case "declined":
        return "destructive";
      case "pending":
        return "secondary";
    }
  };

  const sortedHistory = [...overtimeHistory].sort((a, b) => {
    const aValue = a[sortKey];
    const bValue = b[sortKey];

    if (aValue < bValue) {
      return sortDirection === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortDirection === "asc" ? 1 : -1;
    }
    return 0;
  });

  const filteredHistory = sortedHistory.filter((filing) =>
    filing.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  return (
    <div className="border rounded-lg w-full">
      <div className="p-4">
        <Input
          placeholder="Search by employee name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="relative w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("start_time")}>
                  Date
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("status")}>
                  Status
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Reviewed By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredHistory.length > 0 ? (
              filteredHistory.map((filing) => (
                <TableRow key={filing.id}>
                  <TableCell>
                    <Link href={`/admin/profile/${filing.user_id}`} className="hover:underline">
                      {filing.full_name || "N/A"}
                    </Link>
                  </TableCell>
                  <TableCell>{format(new Date(filing.start_time), "PPP")}</TableCell>
                  <TableCell>{format(new Date(filing.start_time), "p")}</TableCell>
                  <TableCell>{format(new Date(filing.end_time), "p")}</TableCell>
                  <TableCell>{filing.reason}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(filing.status)}>{filing.status}</Badge>
                  </TableCell>
                  <TableCell>{filing.reviewer_full_name || "N/A"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No overtime history found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
