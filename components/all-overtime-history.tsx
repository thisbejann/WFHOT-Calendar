"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type OvertimeHistory = {
  id: number;
  user_id: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  full_name: string | null;
};

type SortKey = "start_time" | "end_time";

interface AllOvertimeHistoryProps {
  overtimeHistory: OvertimeHistory[];
  selectedUserId: string | null;
  isAdminView?: boolean;
}

export default function AllOvertimeHistory({
  overtimeHistory,
  selectedUserId,
  isAdminView = false,
}: AllOvertimeHistoryProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("start_time");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  const filteredHistory = sortedHistory.filter(
    (filing) =>
      filing.full_name?.toLowerCase().includes(search.toLowerCase()) &&
      (selectedUserId === null || filing.user_id === selectedUserId)
  );

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredHistory.slice(startIndex, endIndex);

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
      {isAdminView && (
        <div className="p-4">
          <Input
            placeholder="Search by employee name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}
      <div className="relative w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("start_time")}>
                  Start
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("end_time")}>
                  End
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length > 0 ? (
              currentItems.map((filing) => (
                <TableRow key={filing.id}>
                  <TableCell>
                    <Link href={`/admin/profile/${filing.user_id}`} className="hover:underline">
                      {filing.full_name || "N/A"}
                    </Link>
                  </TableCell>
                  <TableCell>{format(new Date(filing.start_time), "PP p")}</TableCell>
                  <TableCell>{format(new Date(filing.end_time), "PP p")}</TableCell>
                  <TableCell>{filing.reason}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No overtime history found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 p-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-8 w-[180px]">
                {itemsPerPage}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setItemsPerPage(10);
                  setCurrentPage(1);
                }}
              >
                10
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setItemsPerPage(15);
                  setCurrentPage(1);
                }}
              >
                15
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setItemsPerPage(20);
                  setCurrentPage(1);
                }}
              >
                20
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
