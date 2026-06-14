import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function EmployeeCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 space-y-0">
        <Skeleton className="h-12 w-12 rounded-full shrink-0" />
        <div className="space-y-2 w-full">
          <Skeleton className="h-5 w-[150px]" />
          <Skeleton className="h-4 w-[100px]" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-[60px] rounded-full" />
          <Skeleton className="h-5 w-[80px] rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </CardContent>
    </Card>
  );
}
