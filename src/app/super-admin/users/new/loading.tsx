import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
 return (
 <div className="space-y-8 p-4">
 <div className="space-y-2">
 <Skeleton className="h-7 w-56" />
 <Skeleton className="h-4 w-80" />
 </div>
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 <div className="lg:col-span-2 space-y-6">
 <div className="bg-white rounded-lg border border-gray-100 p-4 space-y-3">
 <Skeleton className="h-5 w-40" />
 <Skeleton className="h-10 w-full" />
 <Skeleton className="h-10 w-full" />
 <Skeleton className="h-10 w-full" />
 <Skeleton className="h-10 w-full" />
 </div>
 <div className="bg-white rounded-lg border border-gray-100 p-4 space-y-3">
 <Skeleton className="h-5 w-40" />
 <Skeleton className="h-10 w-full" />
 <Skeleton className="h-10 w-full" />
 </div>
 </div>
 <div className="space-y-6">
 <div className="bg-white rounded-lg border border-gray-100 p-4 space-y-3">
 <Skeleton className="h-5 w-28" />
 <Skeleton className="h-10 w-full" />
 <Skeleton className="h-10 w-full" />
 </div>
 <div className="bg-[#004D40] rounded-lg p-4 space-y-3">
 <Skeleton className="h-4 w-40 bg-emerald-300/40" />
 <Skeleton className="h-4 w-56 bg-emerald-300/40" />
 <Skeleton className="h-4 w-32 bg-emerald-300/40" />
 </div>
 </div>
 </div>
 </div>
 );
}

