import { SkeletonShell, CardSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <SkeletonShell>
      <CardSkeleton />
    </SkeletonShell>
  );
}
