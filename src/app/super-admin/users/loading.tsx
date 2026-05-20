import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
 return (
 <div className="space-y-8 p-4">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="space-y-2">
 <Skeleton className="h-7 w-48" />
 <Skeleton className="h-4 w-64" />
 </div>
 <Skeleton className="h-10 w-32" />
 </div>

 <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
 <Skeleton className="h-10 w-full lg:w-96" />
 <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
 <Skeleton className="h-10 w-36" />
 <Skeleton className="h-10 w-40" />
 <Skeleton className="h-10 w-10" />
 </div>
 </div>

 <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
 <div className="border-b border-gray-100 px-6 py-3">
 <Skeleton className="h-4 w-32" />
 </div>
 <div className="divide-y divide-gray-100">
 {Array.from({ length: 5 }).map((_, i) => (
 <div key={i} className="px-4 py-2.5 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <Skeleton className="h-10 w-10 rounded-full" />
 <div className="space-y-2">
 <Skeleton className="h-4 w-40" />
 <Skeleton className="h-3 w-32" />
 </div>
 </div>
 <Skeleton className="h-4 w-24" />
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}

