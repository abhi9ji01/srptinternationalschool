// Reusable loading skeletons. Server-component safe (no hooks, no "use client").
//
// 5 content skeletons — drop into any page's content area or a loading.js:
//   <PageSkeleton />   generic page (header + stat cards + block)
//   <TableSkeleton />  data tables (toolbar + header + rows)
//   <CardSkeleton />   dashboards (stat cards + chart grid)
//   <FormSkeleton />   forms / create dialogs (label + input grid)
//   <ListSkeleton />   feeds / lists (avatar + two lines per row)
//
// Wrap any of them in <SkeletonShell> to mirror AppShell chrome (sidebar +
// navbar) so route-level loading.js doesn't flash a sidebar-less layout.
//   export default () => <SkeletonShell><PageSkeleton /></SkeletonShell>;
//
// <AuthSkeleton /> is standalone (centered card) for unauthenticated pages.

import { Skeleton } from "@/components/ui/skeleton";

/* ---------------- shell chrome (mirrors components/shared/AppShell) ---------------- */

function SidebarSkeleton() {
  return (
    <aside className="hidden md:flex flex-col border-r bg-card w-64 h-screen sticky top-0">
      <div className="flex items-center gap-2 h-16 px-4 border-b shrink-0">
        <Skeleton className="h-8 w-8 rounded" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <nav className="flex-1 py-2 px-2 space-y-1">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2">
            <Skeleton className="h-4 w-4 rounded shrink-0" />
            <Skeleton className="h-4 flex-1 max-w-[140px]" />
          </div>
        ))}
      </nav>
    </aside>
  );
}

function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <Skeleton className="h-6 w-40" />
      <div className="ml-auto flex items-center gap-2">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="hidden sm:block h-4 w-20" />
      </div>
    </header>
  );
}

export function SkeletonShell({ children }) {
  return (
    <div className="flex min-h-screen">
      <SidebarSkeleton />
      <div className="flex-1 flex flex-col min-w-0">
        <NavbarSkeleton />
        <main className="flex-1 p-4 md:p-6 bg-muted/30">{children}</main>
      </div>
    </div>
  );
}

/* ---------------- content skeletons ---------------- */

function StatCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-20" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="rounded-lg border bg-card p-6 space-y-3">
        <Skeleton className="h-5 w-40" />
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-48 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 8, cols = 5 }) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between gap-2 p-4 border-b">
        <Skeleton className="h-9 w-full max-w-xs" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => <Skeleton key={i} className="h-4 flex-1" />)}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4">
            {Array.from({ length: cols }).map((_, c) => <Skeleton key={c} className="h-8 flex-1" />)}
          </div>
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton({ fields = 6 }) {
  return (
    <div className="rounded-lg border bg-card p-6 max-w-2xl space-y-6">
      <Skeleton className="h-6 w-40" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

export function ListSkeleton({ items = 6 }) {
  return (
    <div className="rounded-lg border bg-card divide-y">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

/* ---------------- standalone (no shell) ---------------- */

export function AuthSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 space-y-6">
        <div className="space-y-2 text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-6 w-40 mx-auto" />
          <Skeleton className="h-4 w-56 mx-auto" />
        </div>
        <div className="space-y-4">
          <div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-10 w-full" /></div>
          <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
