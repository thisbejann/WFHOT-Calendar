"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminWfhCalendar from "./admin-wfh-calendar";
import AllOvertimeHistory, { OvertimeHistory } from "./all-overtime-history";
import { useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAdminData } from "@/lib/context/admin-data-context";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface AdminDashboardProps {
  overtimeHistory: OvertimeHistory[];
}

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
}

export default function AdminDashboard({ overtimeHistory }: AdminDashboardProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const initialTab = searchParams.get("tab");
  const validTabs = ["overtime-history", "wfh-calendar"];
  const [activeTab, setActiveTab] = useState(
    initialTab && validTabs.includes(initialTab) ? initialTab : "overtime-history"
  );
  const { wfhSchedules, oneOffWfhDays, isLoading: isCalendarLoading } = useAdminData();
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const newUrl = `${pathname}?tab=${activeTab}`;
    window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, "", newUrl);
  }, [activeTab, pathname]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, avatar_url");
      if (error) {
        console.error("Error fetching users:", error);
      } else if (data) {
        console.log("Fetched user profiles:", data);
        setAllUsers(data);
      }
    };

    fetchUsers();
  }, [supabase]);

  return (
    <div className="flex h-full w-full">
      {/* Left Sidebar for User Profiles (Dropdown) */}
      <div className="w-64 border-r bg-gray-50 dark:bg-gray-900 p-4 flex flex-col gap-4">
        <h3 className="text-lg font-semibold mb-2">Filter by User</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <Avatar className="h-8 w-8 text-black border-2 border-transparent mr-2">
                {selectedUserId === null ? (
                  <AvatarFallback className="bg-gray-300 dark:bg-gray-600 text-xs">
                    ALL
                  </AvatarFallback>
                ) : (
                  <>
                    <AvatarImage
                      src={
                        allUsers.find((user) => user.id === selectedUserId)?.avatar_url || undefined
                      }
                      alt={allUsers.find((user) => user.id === selectedUserId)?.full_name || "User"}
                    />
                    <AvatarFallback className="text-xs">
                      {allUsers
                        .find((user) => user.id === selectedUserId)
                        ?.full_name?.charAt(0)
                        .toUpperCase() || "?"}
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
              <span className="flex-1 truncate overflow-hidden whitespace-nowrap">
                {selectedUserId === null
                  ? "All Users"
                  : allUsers.find((user) => user.id === selectedUserId)?.full_name || "Select User"}
              </span>
              <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem
              onClick={() => setSelectedUserId(null)}
              className="cursor-pointer flex items-center"
            >
              <Avatar className="h-8 w-8 text-black border-2 border-transparent mr-2">
                <AvatarFallback className="bg-gray-300 dark:bg-gray-600 text-xs">
                  ALL
                </AvatarFallback>
              </Avatar>
              <span className="truncate overflow-hidden whitespace-nowrap">All Users</span>
            </DropdownMenuItem>
            {allUsers.map((user) => (
              <DropdownMenuItem
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className="cursor-pointer flex items-center"
              >
                <Avatar className="h-8 w-8 text-black border-2 border-transparent mr-2">
                  <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || "User"} />
                  <AvatarFallback className="text-xs">
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate overflow-hidden whitespace-nowrap">{user.full_name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overtime-history" className="cursor-pointer">
              Overtime History
            </TabsTrigger>
            <TabsTrigger value="wfh-calendar" className="cursor-pointer">
              WFH Calendar
            </TabsTrigger>
          </TabsList>
          <div className="mt-4">
            {activeTab === "overtime-history" && (
              <TabsContent value="overtime-history">
                <Card>
                  <CardHeader>
                    <CardTitle>Overtime History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AllOvertimeHistory
                      overtimeHistory={overtimeHistory}
                      selectedUserId={selectedUserId}
                      isAdminView={true}
                    />
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
    </div>
  );
}
