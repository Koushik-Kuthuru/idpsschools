import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
 return (
 <div className="p-4 space-y-6">
 <div className="flex items-center justify-between">
 <Skeleton className="h-7 w-48" />
 <div className="flex gap-2">
 <Skeleton className="h-9 w-28" />
 <Skeleton className="h-9 w-9" />
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 <Skeleton className="h-28 w-full" />
 <Skeleton className="h-28 w-full" />
 <Skeleton className="h-28 w-full" />
 <Skeleton className="h-28 w-full" />
 </div>

 <div className="bg-white rounded-lg border border-gray-100 p-4">
 <div className="flex items-center justify-between mb-4">
 <Skeleton className="h-6 w-40" />
 <Skeleton className="h-9 w-28" />
 </div>
 <div className="space-y-3">
 <Skeleton className="h-10 w-full" />
 <Skeleton className="h-10 w-full" />
 <Skeleton className="h-10 w-full" />
 <Skeleton className="h-10 w-full" />
 </div>
 </div>
 </div>
 );
}

