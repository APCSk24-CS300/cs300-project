'use client';


import { useRouter } from "next/navigation";


 function LandingPage() {
    const router = useRouter();

    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Landing Page</h1>
        
        <button
          className="rounded bg-blue-500 px-50 py-1 0 text-white hover:bg-blue-600 text-3xl"
          onClick={() => router.push("/login")}>Login</button>
      </div>
    );
  }

export default LandingPage;