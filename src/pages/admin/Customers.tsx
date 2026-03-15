import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 100;
const SUCCESS_PAYMENT_STATUSES = ["completed", "success", "succeeded", "COMPLETED", "SUCCESS", "SUCCEEDED"];

const Customers = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    void fetchCustomers();
  }, [page]);

  useEffect(() => {
    setPage(0);
  }, [search]);

  const fetchCustomers = async () => {
    setLoading(true);

    try {
      await supabase.functions.invoke("assign-admin-role");

      const [countResult, dataResult] = await Promise.all([
        supabase
          .from("payments")
          .select("id", { count: "exact", head: true })
          .in("status", SUCCESS_PAYMENT_STATUSES),
        supabase
          .from("payments")
          .select("*")
          .in("status", SUCCESS_PAYMENT_STATUSES)
          .order("created_at", { ascending: false })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1),
      ]);

      if (countResult.error || dataResult.error) {
        console.error("Customers query error:", countResult.error || dataResult.error);
      }

      const seen = new Map<string, any>();
      (dataResult.data || []).forEach((p: any) => {
        if (!seen.has(p.email)) {
          seen.set(p.email, { ...p, paymentCount: 1 });
        } else {
          seen.get(p.email).paymentCount++;
        }
      });

      setTotalCount(countResult.count || 0);
      setCustomers(Array.from(seen.values()));
    } catch (err) {
      console.error("Customers fetch error:", err);
      setCustomers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
  );

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const showingStart = page * PAGE_SIZE + 1;
  const showingEnd = Math.min((page + 1) * PAGE_SIZE, totalCount);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h1 className="netflix-title text-3xl text-foreground">CUSTOMERS</h1>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
                  <TableHead>Provider</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Promo Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Payments</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">Loading...</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">No customers found</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.email}</TableCell>
                      <TableCell className="text-muted-foreground">{c.phone}</TableCell>
                      <TableCell className="capitalize text-muted-foreground">{c.provider}</TableCell>
                      <TableCell className="text-muted-foreground">{c.country || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{c.currency || "ZMW"}</TableCell>
                      <TableCell className="text-muted-foreground">{c.promo_code || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{c.discount_applied ? `${c.discount_applied}%` : "—"}</TableCell>
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
            <p>Showing {showingStart}–{showingEnd} of {totalCount} records</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="border-border text-foreground gap-1">
                <ChevronLeft size={14} /> Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="border-border text-foreground gap-1">
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
