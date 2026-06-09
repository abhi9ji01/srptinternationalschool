import { SkeletonShell, PageSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <SkeletonShell>
      <PageSkeleton />
    </SkeletonShell>
  );
}
