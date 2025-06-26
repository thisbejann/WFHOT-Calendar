"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PendingRequestsTable, { PendingFiling } from "./pending-requests-table";
import AdminWfhCalendar from "./admin-wfh-calendar";

interface AdminDashboardProps {
  pendingFilings: PendingFiling[];
}

export default function AdminDashboard({ pendingFilings }: AdminDashboardProps) {
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
            <PendingRequestsTable initialPendingFilings={pendingFilings} />
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
  );
}
