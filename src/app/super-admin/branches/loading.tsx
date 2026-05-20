import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
 return (
 <div className="space-y-8 p-4">
 <div className="flex items-center justify-between">
 <Skeleton className="h-7 w-48" />
 <div className="flex gap-2">
 <Skeleton className="h-10 w-32" />
 <Skeleton className="h-10 w-10" />
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 <Skeleton className="h-24 w-full" />
 <Skeleton className="h-24 w-full" />
 <Skeleton className="h-24 w-full" />
 <Skeleton className="h-24 w-full" />
 </div>

 <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
 <div className="px-4 py-2.5 border-b border-gray-100">
 <Skeleton className="h-10 w-full" />
 </div>
 <div className="divide-y divide-gray-100">
 {Array.from({ length: 6 }).map((_, i) => (
 <div key={i} className="px-4 py-2.5 flex items-center justify-between">
 <Skeleton className="h-4 w-64" />
 <Skeleton className="h-4 w-32" />
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}

