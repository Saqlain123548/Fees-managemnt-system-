"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Lock, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase/browser";

// Get admin credentials from environment variables
// Support multiple admin accounts with different passwords
// Format: NEXT_PUBLIC_ADMIN_EMAILS=email1,email2
// Format: NEXT_PUBLIC_ADMIN_PASSWORDS=password1,password2
function getAdminCredentials(): { emails: string[]; passwords: string[] } {
  const emailsEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";
  const passwordsEnv = process.env.NEXT_PUBLIC_ADMIN_PASSWORDS || "";
  
  const emails = emailsEnv.split(",").map(e => e.trim()).filter(Boolean);
  const passwords = passwordsEnv.split(",").map(p => p.trim()).filter(Boolean);
  
  // Fallback to single email/password if new format not used
  if (emails.length === 0) {
    const singleEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";
    const singlePassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "";
    if (singleEmail && singlePassword) {
      return { emails: [singleEmail], passwords: [singlePassword] };
    }
  }
  
  return { emails, passwords };
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get credentials from environment variables
  const { emails: adminEmails, passwords: adminPasswords } = getAdminCredentials();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  // Check for existing session
  useEffect(() => {
    const checkSession = async () => {
      // Check for admin session cookie first
      const hasAdminCookie = document.cookie.includes('admin_session=');
      
      if (hasAdminCookie) {
        // Already logged in as admin, redirect to dashboard or intended page
        const redirectTo = searchParams.get("redirect") || "/dashboard";
        router.push(redirectTo);
        return;
      }

      // Also check Supabase session for regular users
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const redirectTo = searchParams.get("redirect") || "/dashboard";
        router.push(redirectTo);
        return;
      }

      // Check if admin credentials are configured
      if (adminEmails.length > 0 && adminPasswords.length > 0 && adminEmails.length === adminPasswords.length) {
        setIsConfigured(true);
        setLoading(false); // Show manual login form
      } else {
        setIsConfigured(false);
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleLogin = async (emailValue?: string, passwordValue?: string) => {
    setError(null);
    setLoading(true);

    const loginEmail = emailValue || email;
    const loginPassword = passwordValue || password;

    console.log("Debug - Admin credentials loaded:");
    console.log("Emails:", adminEmails);
    console.log("Passwords:", adminPasswords);
    console.log("User input - Email:", loginEmail, "Password:", loginPassword);

    if (!loginEmail || !loginPassword) {
      setError("Please enter both email and password.");
      setLoading(false);
      return;
    }

    // Check if the entered credentials match any admin account
    const emailIndex = adminEmails.indexOf(loginEmail);
    console.log("Email index found:", emailIndex);
    console.log("Password at index:", adminPasswords[emailIndex]);

    if (emailIndex === -1 || adminPasswords[emailIndex] !== loginPassword) {
      console.log("Authentication failed - credentials don't match");
      setError("Invalid admin credentials. Access denied.");
      setLoading(false);
      return;
    }

    console.log("Authentication successful - creating admin session via API");

    // Use custom admin session API instead of Supabase Auth
    try {
      const response = await fetch("/api/auth/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      console.log("Admin session created successfully");

      // Redirect to dashboard or intended page after successful login
      const redirectTo = searchParams.get("redirect") || "/dashboard";
      router.push(redirectTo);
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during login");
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-cyan-50 p-4">
        <Card className="w-full max-w-md shadow-2xl border border-gray-200">
          <CardHeader className="space-y-3 pb-7 text-center">
            <div className="mx-auto bg-indigo-100 p-3 rounded-full w-16 h-16 flex items-center justify-center">
              <Shield className="h-8 w-8 text-indigo-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Admin Sign In</CardTitle>
            <CardDescription className="text-center text-gray-600">
              Fees Management System
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if admin credentials are configured
  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-cyan-50 p-4">
        <Card className="w-full max-w-md shadow-2xl border border-gray-200">
          <CardHeader className="space-y-3 pb-7 text-center">
            <div className="mx-auto bg-red-100 p-3 rounded-full w-16 h-16 flex items-center justify-center">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-600">Configuration Required</CardTitle>
            <CardDescription className="text-gray-600">
              Admin credentials are not configured
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 font-medium">Please add the following environment variables:</p>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1 list-disc list-inside">
                <li>NEXT_PUBLIC_ADMIN_EMAILS=email1,email2</li>
                <li>NEXT_PUBLIC_ADMIN_PASSWORDS=password1,password2</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show login form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-cyan-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border border-gray-200">
        <CardHeader className="space-y-3 pb-7">
          <div className="mx-auto bg-indigo-100 p-3 rounded-full w-16 h-16 flex items-center justify-center">
            <Shield className="h-8 w-8 text-indigo-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Admin Sign In</CardTitle>
          <CardDescription className="text-center text-gray-600">
            Fees Management System
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            onClick={() => handleLogin()}
            disabled={loading}
            className="w-full h-10 text-base font-medium shadow-md hover:shadow-lg transition-shadow bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-cyan-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border border-gray-200">
        <CardHeader className="space-y-3 pb-7 text-center">
          <div className="mx-auto bg-indigo-100 p-3 rounded-full w-16 h-16 flex items-center justify-center">
            <Shield className="h-8 w-8 text-indigo-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Admin Sign In</CardTitle>
          <CardDescription className="text-center text-gray-600">
            Fees Management System
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginContent />
    </Suspense>
  );
}

