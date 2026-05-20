import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
 return (
 <main className="min-h-screen flex items-center justify-center p-6">
 <div className="w-full max-w-lg space-y-4">
 <Skeleton className="h-8 w-52 mx-auto" />
 <Skeleton className="h-4 w-72 mx-auto" />
 <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-3">
 <Skeleton className="h-11 w-full" />
 <Skeleton className="h-11 w-full" />
 <Skeleton className="h-11 w-full" />
 <Skeleton className="h-11 w-full" />
 <Skeleton className="h-10 w-full" />
 </div>
 </div>
 </main>
 );
}

