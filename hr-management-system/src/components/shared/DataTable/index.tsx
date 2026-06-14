import type { ReactNode } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

interface DataTableProps {
  columns: ReactNode;
  children: ReactNode;
  toolbar?: ReactNode;
  pagination?: ReactNode;
  emptyState?: ReactNode;
  loadingSkeleton?: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
}

export function DataTable({ 
  columns, 
  children, 
  toolbar, 
  pagination, 
  emptyState, 
  loadingSkeleton, 
  isLoading, 
  isEmpty 
}: DataTableProps) {
  return (
    <div className="flex flex-col gap-4">
      {toolbar && <div className="flex items-center justify-between">{toolbar}</div>}
      
      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {columns}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && loadingSkeleton ? (
              loadingSkeleton
            ) : isEmpty && emptyState ? (
              <TableRow>
                <TableCell colSpan={100} className="h-24 text-center">
                  {emptyState}
                </TableCell>
              </TableRow>
            ) : (
              children
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && <div className="flex items-center justify-end">{pagination}</div>}
    </div>
  );
}
