import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
 return (
 <main className="min-h-screen w-full flex font-jost bg-white overflow-hidden">
 {/* Left Side Skeleton */}
 <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 bg-[#144835] p-12 flex-col justify-between">
 <div className="space-y-4">
 <Skeleton className="h-12 w-48 bg-white/10" />
 <div className="space-y-2 mt-8">
 <Skeleton className="h-16 w-3/4 bg-white/10" />
 <Skeleton className="h-16 w-1/2 bg-white/10" />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-6">
 <Skeleton className="h-24 w-full bg-white/10 rounded-2xl" />
 <Skeleton className="h-24 w-full bg-white/10 rounded-2xl" />
 </div>
 </div>

 {/* Right Side Skeleton */}
 <div className="w-full lg:w-1/2 xl:w-5/12 flex items-center justify-center p-12">
 <div className="w-full max-w-[420px] space-y-8">
 <div className="space-y-2">
 <Skeleton className="h-10 w-48" />
 <Skeleton className="h-5 w-64" />
 </div>
 <div className="space-y-6">
 <div className="space-y-2">
 <Skeleton className="h-5 w-32" />
 <Skeleton className="h-12 w-full rounded-xl" />
 </div>
 <div className="space-y-2">
 <Skeleton className="h-5 w-32" />
 <Skeleton className="h-12 w-full rounded-xl" />
 </div>
 <div className="flex justify-between">
 <Skeleton className="h-5 w-24" />
 <Skeleton className="h-5 w-32" />
 </div>
 <Skeleton className="h-14 w-full rounded-xl" />
 </div>
 </div>
 </div>
 </main>
 );
}
