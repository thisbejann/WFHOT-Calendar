"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PendingRequestsTable, { PendingFiling } from "./pending-requests-table";
import AdminWfhCalendar from "./admin-wfh-calendar";
import AllOvertimeHistory, { OvertimeHistory } from "./all-overtime-history";
import { useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAdminData } from "@/lib/context/admin-data-context";

interface AdminDashboardProps {
  pendingFilings: PendingFiling[];
  overtimeHistory: OvertimeHistory[];
}

export default function AdminDashboard({ pendingFilings, overtimeHistory }: AdminDashboardProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const initialTab = searchParams.get("tab");
  const validTabs = ["pending-ot", "overtime-history", "wfh-calendar"];
  const [activeTab, setActiveTab] = useState(
    initialTab && validTabs.includes(initialTab) ? initialTab : "pending-ot"
  );
  const { wfhSchedules, oneOffWfhDays, isLoading: isCalendarLoading } = useAdminData();

  useEffect(() => {
    const newUrl = `${pathname}?tab=${activeTab}`;
    window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, "", newUrl);
  }, [activeTab, pathname]);

  return (
    <div className="relative">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
        <div className="mt-4">
          {activeTab === "pending-ot" && (
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
          )}
          {activeTab === "overtime-history" && (
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
          )}
          {activeTab === "wfh-calendar" && (
            <TabsContent value="wfh-calendar">
              <Card>
                <CardHeader>
                  <CardTitle>Team Work-From-Home Calendar</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  {isCalendarLoading ? (
                    <Loader2 className="animate-spin h-8 w-8 text-primary my-8" />
                  ) : (
                    <AdminWfhCalendar wfhSchedules={wfhSchedules} oneOffWfhDays={oneOffWfhDays} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}
