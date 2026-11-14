'use client';

import "@/app/globals.css";
import { AuthContext } from "@/features/auth/context/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import React from "react";


export default function DashboardPage() {

  const authContext = useAuth();
  const router = useRouter();

  const useContext = React.useContext(AuthContext);
  const user = useContext?.user;
  const handlogout = async () => {
    console.log("Logging out...");
    try {

      await authContext.logout();
      console.log("Logout successful");
      router.push("/");
    }
    catch (error) {
      console.error("Logout failed", error);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Manager Dashboard</h1>
      <p>Welcome to the manager dashboard!</p>

      <button
        type="button"
        className="rounded bg-blue-500 px-50 py-1 0 text-black hover:bg-blue-600 text-3xl"
        onClick={handlogout}>Log Out</button>


    </div>
  );
}
