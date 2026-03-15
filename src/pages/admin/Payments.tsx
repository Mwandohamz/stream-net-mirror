import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 100;

const Payments = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    void fetchPayments();
  }, [page]);

  useEffect(() => {
    setPage(0);
  }, [search]);

  const fetchPayments = async () => {
    setLoading(true);

    try {
      await supabase.functions.invoke("assign-admin-role");

      const [countResult, dataResult] = await Promise.all([
        supabase.from("payments").select("id", { count: "exact", head: true }),
        supabase
          .from("payments")
          .select("*")
          .order("created_at", { ascending: false })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1),
      ]);

      if (countResult.error || dataResult.error) {
        console.error("Payments query error:", countResult.error || dataResult.error);
      }

      setTotalCount(countResult.count || 0);
      setPayments(dataResult.data || []);
    } catch (err) {
      console.error("Payments fetch error:", err);
      setPayments([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const filtered = payments.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search) ||
      p.transaction_id?.includes(search)
  );

  const exportCSV = async () => {
    const { data: allData } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });
    const all = allData || [];

    const headers = ["Name", "Email", "Phone", "Provider", "Amount", "Currency", "Status", "Promo Code", "Discount", "Transaction ID", "Date"];
    const rows = all.map((p: any) => [
      p.name,
      p.email,
      p.phone,
      p.provider,
      p.amount,
      p.currency || "ZMW",
      p.status,
      p.promo_code || "",
      p.discount_applied || 0,
      p.transaction_id,
      new Date(p.created_at).toLocaleString(),
    ]);
    const csv = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const showingStart = page * PAGE_SIZE + 1;
  const showingEnd = Math.min((page + 1) * PAGE_SIZE, totalCount);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="netflix-title text-3xl text-foreground">PAYMENTS</h1>
          <Button variant="outline" size="sm" className="gap-2 border-border text-foreground" onClick={exportCSV}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone..."
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
                  <TableHead>Amount</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Promo Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">Loading...</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">No payments found</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => {
                    const normalizedStatus = String(p.status || "").toLowerCase();
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                        <TableCell className="text-muted-foreground">{p.email}</TableCell>
                        <TableCell className="text-muted-foreground">{p.phone}</TableCell>
                        <TableCell className="capitalize text-muted-foreground">{p.provider}</TableCell>
                        <TableCell className="text-foreground font-medium">{p.amount}</TableCell>
                        <TableCell className="text-muted-foreground">{p.currency || "ZMW"}</TableCell>
                        <TableCell className="text-muted-foreground">{p.promo_code || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{p.discount_applied ? `${p.discount_applied}%` : "—"}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              normalizedStatus === "completed" || normalizedStatus === "success" || normalizedStatus === "succeeded"
                                ? "bg-primary/20 text-primary"
                                : normalizedStatus === "pending"
                                  ? "bg-muted text-muted-foreground"
                                  : "bg-destructive/20 text-destructive"
                            }`}
                          >
                            {p.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                          {new Date(p.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })
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

export default Payments;
