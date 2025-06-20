"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleIcon } from "@/components/icons/google";

export default function LoginPage() {
  const handleLogin = async () => {
    const supabase = createClient();
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="flex items-center justify-center py-12">
        <Card className="mx-auto w-full max-w-lg">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl">Login</CardTitle>
            <CardDescription>Sign in to the Vertiv Dev Team Calendar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <Button onClick={handleLogin} variant="outline" className="w-full">
                <GoogleIcon className="mr-2 h-4 w-4" />
                Login with Google
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="hidden bg-muted lg:block">
        <div className="flex h-full flex-col items-center justify-center p-8 text-center">
          <h1 className="text-4xl font-bold">Vertiv Dev Team Calendar</h1>
          <p className="mt-4 text-muted-foreground">
            Manage your WFH and Overtime schedules with ease.
          </p>
        </div>
      </div>
    </div>
  );
}
