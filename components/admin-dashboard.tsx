"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PendingRequestsTable, { PendingFiling } from "./pending-requests-table";
import AdminWfhCalendar from "./admin-wfh-calendar";
import AllOvertimeHistory, { OvertimeHistory } from "./all-overtime-history";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";

interface AdminDashboardProps {
  pendingFilings: PendingFiling[];
  overtimeHistory: OvertimeHistory[];
}

export default function AdminDashboard({ pendingFilings, overtimeHistory }: AdminDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const tab = searchParams.get("tab");

  const validTabs = ["pending-ot", "overtime-history", "wfh-calendar"];
  const activeTab = tab && validTabs.includes(tab) ? tab : "pending-ot";

  const handleTabChange = (value: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", value);
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="relative">
      {isPending && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex justify-center pt-20 z-10">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
      )}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending-ot" className="cursor-pointer">
            Pending Overtime
          </TabsTrigger>
          <TabsTrigger value="overtime-history" className="cursor-pointer">
            Overtime History
          </TabsTrigger>
          <TabsTrigger value="wfh-calendar" className="cursor-pointer">
            WFH Calendar
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pending-ot">
          <Card>
            <CardHeader>
              <CardTitle>Pending Overtime Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <PendingRequestsTable initialPendingFilings={pendingFilings} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="overtime-history">
          <Card>
            <CardHeader>
              <CardTitle>Overtime History</CardTitle>
            </CardHeader>
            <CardContent>
              <AllOvertimeHistory overtimeHistory={overtimeHistory} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="wfh-calendar">
          <Card>
            <CardHeader>
              <CardTitle>Team Work-From-Home Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminWfhCalendar />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
