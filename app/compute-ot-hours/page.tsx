import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OvertimeSummary from "@/components/overtime-summary";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ComputeOtHoursPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col w-full min-h-screen">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-muted/40">
        <div className="mb-4">
          <Link
            href="/"
            className="flex items-center text-sm text-muted-foreground hover:underline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Compute Overtime Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <OvertimeSummary user={user} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
