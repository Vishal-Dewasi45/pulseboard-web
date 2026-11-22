export function Skeleton({ className = "" }) {
    return <div className={`animate-pulse rounded-md bg-slate-200/70 ${className}`} />;
  }
  
  export function ListSkeleton({ rows = 5 }) {
    return (
      <div className="card divide-y divide-slate-100">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }