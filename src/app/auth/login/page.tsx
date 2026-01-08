"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4">
      
      <Card className="w-full max-w-md shadow-2xl rounded-xl border border-gray-700">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-gray-400 mt-2">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>

        <CardContent className="mt-4 space-y-4">
          <div className="flex flex-col space-y-3">
            <Input placeholder="Email" type="email" className="bg-gray-900 text-white border-gray-600 focus:border-indigo-500" />
            <Input placeholder="Password" type="password" className="bg-gray-900 text-white border-gray-600 focus:border-indigo-500" />
          </div>

          <Button className="w-full bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200 mt-2">
            Sign In
          </Button>

          <div className="text-center mt-3">
            <a href="#" className="text-sm text-gray-400 hover:text-white underline">
              Forgot password?
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
