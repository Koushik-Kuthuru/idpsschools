import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
 return (
 <div className="space-y-8 p-4">
 <div className="space-y-2">
 <Skeleton className="h-7 w-44" />
 <Skeleton className="h-4 w-72" />
 </div>
 <div className="border-b border-gray-200">
 <div className="flex space-x-2">
 <Skeleton className="h-10 w-40" />
 <Skeleton className="h-10 w-40" />
 <Skeleton className="h-10 w-40" />
 </div>
 </div>
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 <div className="lg:col-span-2 space-y-6">
 <div className="bg-white p-4 rounded-lg border border-gray-100 space-y-3">
 <Skeleton className="h-5 w-40" />
 <Skeleton className="h-10 w-full" />
 <Skeleton className="h-10 w-full" />
 <Skeleton className="h-10 w-full" />
 </div>
 <div className="bg-white p-4 rounded-lg border border-gray-100 space-y-3">
 <Skeleton className="h-5 w-40" />
 <Skeleton className="h-10 w-full" />
 <Skeleton className="h-10 w-full" />
 </div>
 </div>
 <div className="space-y-6">
 <div className="bg-white p-4 rounded-lg border border-gray-100 space-y-3">
 <Skeleton className="h-5 w-28" />
 <Skeleton className="h-10 w-full" />
 <Skeleton className="h-10 w-full" />
 </div>
 </div>
 </div>
 </div>
 );
}

