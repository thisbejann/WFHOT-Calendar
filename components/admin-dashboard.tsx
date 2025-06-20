"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PendingRequestsTable from "./pending-requests-table";
import WfhCalendarView from "./wfh-calendar-view";

export default function AdminDashboard() {
  return (
    <Tabs defaultValue="pending-ot" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="pending-ot">Pending Overtime</TabsTrigger>
        <TabsTrigger value="wfh-calendar">WFH Calendar</TabsTrigger>
      </TabsList>
      <TabsContent value="pending-ot">
        <Card>
          <CardHeader>
            <CardTitle>Pending Overtime Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <PendingRequestsTable />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="wfh-calendar">
        <Card>
          <CardHeader>
            <CardTitle>Team Work-From-Home Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <WfhCalendarView />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
