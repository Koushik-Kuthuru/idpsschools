import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
 return (
 <div className="space-y-8 p-4">
 <div className="space-y-2">
 <Skeleton className="h-7 w-44" />
 <Skeleton className="h-4 w-72" />
 </div>
 <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
 <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
 <Skeleton className="h-10 w-64" />
 <Skeleton className="h-10 w-32" />
 </div>
 <div className="divide-y divide-gray-100">
 {Array.from({ length: 7 }).map((_, i) => (
 <div key={i} className="px-4 py-2.5 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <Skeleton className="h-10 w-10 rounded-full" />
 <div className="space-y-2">
 <Skeleton className="h-4 w-48" />
 <Skeleton className="h-3 w-32" />
 </div>
 </div>
 <Skeleton className="h-6 w-20" />
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}

