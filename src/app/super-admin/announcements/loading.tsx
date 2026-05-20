import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
 return (
 <div className="space-y-8 animate-in fade-in duration-500 font-jost pb-10">
 
 {/* Header */}
 <div className="flex flex-col gap-4">
 <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
 <div>
 <Skeleton className="h-10 w-48 mb-2 rounded-lg" />
 <Skeleton className="h-4 w-96 rounded-md" />
 </div>
 <Skeleton className="h-10 w-48 rounded-lg" />
 </div>
 </div>

 {/* Controls */}
 <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-[16px] border border-gray-100 shadow-sm">
 <Skeleton className="h-10 w-full md:w-96 rounded-lg" />
 <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
 <Skeleton className="h-10 w-20 rounded-lg" />
 <Skeleton className="h-10 w-20 rounded-lg" />
 <Skeleton className="h-10 w-20 rounded-lg" />
 <Skeleton className="h-10 w-20 rounded-lg" />
 </div>
 </div>

 {/* List */}
 <div className="grid gap-4">
 {[1, 2, 3, 4].map((i) => (
 <div key={i} className="bg-white p-4 rounded-[16px] border border-gray-100 shadow-sm">
 <div className="flex items-start gap-4">
 <Skeleton className="h-14 w-14 rounded-[16px]" />
 <div className="flex-1 space-y-3">
 <div className="flex justify-between">
 <div className="flex gap-3">
 <Skeleton className="h-5 w-16 rounded-md" />
 <Skeleton className="h-4 w-20 rounded-md" />
 </div>
 <Skeleton className="h-8 w-20 rounded-lg" />
 </div>
 <Skeleton className="h-6 w-3/4 rounded-md" />
 <Skeleton className="h-4 w-full rounded-md" />
 <Skeleton className="h-4 w-2/3 rounded-md" />
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 );
}
