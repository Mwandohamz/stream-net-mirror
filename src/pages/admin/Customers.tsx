import { useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Search, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useAdminQuery, useAdminRefresh, fetchAdminMetrics } from "@/hooks/useAdminQuery";
import { formatCurrencyAmount, formatUsd } from "@/lib/currency";

const PAGE_SIZE = 100;
const QUERY_KEY = ["admin", "customers"];

const Customers = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const refresh = useAdminRefresh();

  const { data, isLoading, isFetching } = useAdminQuery<{ customers: any[] }>(
    QUERY_KEY,
    () => fetchAdminMetrics("customers")
  );

  const customers = data?.customers ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q)
    );
  }, [customers, search]);

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="netflix-title text-3xl text-foreground">CUSTOMERS</h1>
          <Button variant="outline" size="sm" className="gap-2 border-border text-foreground" onClick={() => refresh(QUERY_KEY)}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9 bg-secondary border-border text-foreground"
          />
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Total paid</TableHead>
                  <TableHead>USD equiv.</TableHead>
                  <TableHead>Promo code</TableHead>
                  <TableHead>Payments</TableHead>
                  <TableHead>Last payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">Loading...</TableCell>
                  </TableRow>
                ) : pageRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">No customers found</TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.email}</TableCell>
                      <TableCell className="text-muted-foreground">{c.phone}</TableCell>
                      <TableCell className="text-muted-foreground">{c.country || "—"}</TableCell>
                      <TableCell className="text-foreground font-medium">
                        {formatCurrencyAmount(Number(c.totalPaid ?? 0), c.currency || "ZMW")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatUsd(Number(c.totalPaidUsd ?? 0))}</TableCell>
                      <TableCell className="text-muted-foreground">{c.promo_code || "—"}</TableCell>
                      <TableCell className="text-foreground">{c.paymentCount}</TableCell>
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(c.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {totalCount > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount} customers</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="border-border text-foreground gap-1">
                <ChevronLeft size={14} /> Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)} className="border-border text-foreground gap-1">
                Next <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Customers;
