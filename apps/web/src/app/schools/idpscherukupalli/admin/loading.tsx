import { SkeletonPage } from "@/components/ui/Skeleton";

export default function Loading() {
  return <SkeletonPage stats={4} rows={8} columns={5} />;
}
