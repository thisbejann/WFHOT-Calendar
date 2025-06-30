"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { type WfhSchedule, type OneOffWfhDay } from "@/components/admin-wfh-calendar";

interface AdminDataContextProps {
  wfhSchedules: WfhSchedule[] | null;
  oneOffWfhDays: OneOffWfhDay[] | null;
  isLoading: boolean;
}

const AdminDataContext = createContext<AdminDataContextProps | undefined>(undefined);

export const AdminDataProvider = ({ children }: { children: ReactNode }) => {
  const [wfhSchedules, setWfhSchedules] = useState<WfhSchedule[] | null>(null);
  const [oneOffWfhDays, setOneOffWfhDays] = useState<OneOffWfhDay[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchWfhData() {
      try {
        const [schedulesResult, oneOffResult] = await Promise.all([
          supabase.rpc("get_wfh_schedules_with_names"),
          supabase.rpc("get_all_one_off_wfh_days"),
        ]);

        if (schedulesResult.error) throw schedulesResult.error;
        if (oneOffResult.error) throw oneOffResult.error;

        setWfhSchedules(schedulesResult.data);
        setOneOffWfhDays(oneOffResult.data);
      } catch (error) {
        console.error("Error fetching WFH data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchWfhData();
  }, [supabase]);

  return (
    <AdminDataContext.Provider value={{ wfhSchedules, oneOffWfhDays, isLoading }}>
      {children}
    </AdminDataContext.Provider>
  );
};

export const useAdminData = () => {
  const context = useContext(AdminDataContext);
  if (context === undefined) {
    throw new Error("useAdminData must be used within an AdminDataProvider");
  }
  return context;
};
