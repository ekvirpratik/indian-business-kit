import { useState } from "react";
import { PageContainer } from "@/components/shared/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable } from "@/components/shared/DataTable";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { DataTableSkeleton } from "@/components/skeletons/DataTableSkeleton";
import { EmployeeCardSkeleton } from "@/components/skeletons/EmployeeCardSkeleton";
import { FormSkeleton } from "@/components/skeletons/FormSkeleton";
import { ApiErrorState } from "@/components/feedback/ApiErrorState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import { Users } from "lucide-react";
import { toast } from "@/lib/toast";
import { JwtClaimsInspector } from "@/features/dev/components/JwtClaimsInspector";

export default function DesignSystemPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);

  const handleSimulateDelete = () => {
    setDialogLoading(true);
    setTimeout(() => {
      setDialogLoading(false);
      setDialogOpen(false);
      toast.success("Employee deleted successfully");
    }, 2000);
  };

  return (
    <PageContainer>
      <PageHeader 
        title="Internal QA Dashboard" 
        description="Comprehensive testing for typography, components, animations, and error states."
        actions={<Button onClick={() => toast.success("Tests loaded")}>Run Tests</Button>}
      />

      <div className="grid gap-12">
        {/* Live Clerk ↔ Supabase JWT Claims Verification */}
        <section className="space-y-4">
          <JwtClaimsInspector />
        </section>
        {/* Typography */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Typography</h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Heading 1</h1>
              <h2 className="text-3xl font-semibold tracking-tight first:mt-0">Heading 2</h2>
              <h3 className="text-2xl font-semibold tracking-tight">Heading 3</h3>
              <h4 className="text-xl font-semibold tracking-tight">Heading 4</h4>
              <p className="leading-7 [&:not(:first-child)]:mt-6">
                Paragraph. The quick brown fox jumps over the lazy dog. We use Inter for
                excellent legibility at small sizes and crisp rendering on high-DPI screens.
              </p>
              <p className="text-sm text-muted-foreground">Small text for captions and hints.</p>
            </CardContent>
          </Card>
        </section>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Buttons */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Buttons</h2>
            <Card>
              <CardContent className="flex flex-wrap gap-4 p-6">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button disabled>Disabled</Button>
              </CardContent>
            </Card>
          </section>

          {/* Inputs */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Inputs</h2>
            <Card>
              <CardContent className="flex flex-col gap-4 p-6">
                <Input placeholder="Employee Name" />
                <Input placeholder="Email Address" type="email" />
                <Input placeholder="Disabled Input" disabled />
              </CardContent>
            </Card>
          </section>

          {/* Badges */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Status Badges</h2>
            <Card>
              <CardContent className="flex flex-wrap gap-4 p-6">
                <StatusBadge status="ACTIVE" />
                <StatusBadge status="INVITED" />
                <StatusBadge status="PENDING" />
                <StatusBadge status="PRESENT" />
                <StatusBadge status="ABSENT" />
                <StatusBadge status="APPROVED" />
                <StatusBadge status="REJECTED" />
              </CardContent>
            </Card>
          </section>

          {/* Toasts */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Toasts</h2>
            <Card>
              <CardContent className="flex flex-wrap gap-4 p-6">
                <Button variant="outline" onClick={() => toast.success("Employee saved!", "Rahul Sharma has been added to Sales.")}>Success Toast</Button>
                <Button variant="outline" onClick={() => toast.error("Unable to connect", "Please check your internet connection.")}>Error Toast</Button>
                <Button variant="outline" onClick={() => toast.warning("Session expiring", "You will be logged out in 5 minutes.")}>Warning Toast</Button>
                <Button variant="outline" onClick={() => toast.info("Update available", "Refresh to get the latest version.")}>Info Toast</Button>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Dialogs */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Dialogs</h2>
          <Card>
            <CardContent className="p-6">
              <Button onClick={() => setDialogOpen(true)}>Open Destructive Dialog</Button>
              <ConfirmActionDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                title="Delete Employee"
                description="Are you sure you want to delete this employee? All their data will be permanently removed. This action cannot be undone."
                confirmText="Delete"
                onConfirm={handleSimulateDelete}
                loading={dialogLoading}
              />
            </CardContent>
          </Card>
        </section>

        {/* Error States */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Error States</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <ApiErrorState onRetry={() => toast.info("Retrying fetch...")} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <EmptyState
                  icon={Users}
                  title="No employees found"
                  description="Start building your team by adding your first employee."
                  action={<Button>+ Add Employee</Button>}
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Skeletons */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Skeletons</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Employee Card Skeleton</h3>
              <EmployeeCardSkeleton />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Form Skeleton</h3>
              <Card>
                <CardContent className="p-6">
                  <FormSkeleton fields={3} />
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="space-y-2 mt-8">
            <h3 className="text-sm font-medium text-muted-foreground">Dashboard Skeleton</h3>
            <div className="border rounded-lg p-6 bg-muted/20">
              <DashboardSkeleton />
            </div>
          </div>
        </section>

        {/* Tables */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Data Table</h2>
          <DataTable
            columns={
              <>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </>
            }
          >
            <TableRow>
              <TableCell className="font-medium">Rahul Sharma</TableCell>
              <TableCell>Sales</TableCell>
              <TableCell><StatusBadge status="ACTIVE" /></TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm">Edit</Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Priya Patel</TableCell>
              <TableCell>Engineering</TableCell>
              <TableCell><StatusBadge status="INVITED" /></TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm">Edit</Button>
              </TableCell>
            </TableRow>
          </DataTable>
          
          <div className="mt-8 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Data Table Skeleton</h3>
            <DataTableSkeleton rows={3} columns={4} />
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
