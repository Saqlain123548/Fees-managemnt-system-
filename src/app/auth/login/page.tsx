"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-cyan-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border border-gray-200">
        <CardHeader className="space-y-3 pb-7">
          <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
          <CardDescription className="text-center text-gray-600">
            Access your fees management dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="admin@example.com" className="h-10" />
          </div>

          {/* Password with Eye Icon */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
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

          <Button className="w-full h-10 text-base font-medium shadow-md hover:shadow-lg transition-shadow">
            Sign In
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center pt-3">
          <p className="text-sm text-gray-600">
            No account?{" "}
            <Link href="/auth/register" className="font-semibold text-indigo-600 hover:text-indigo-700 underline">
              Register here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}