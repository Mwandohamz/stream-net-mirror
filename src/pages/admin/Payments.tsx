import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Download } from "lucide-react";

const Payments = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    const { data } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });
    setPayments(data || []);
    setLoading(false);
  };

  const filtered = payments.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search) ||
      p.transaction_id?.includes(search)
  );

  const exportCSV = () => {
    const headers = ["Name", "Email", "Phone", "Provider", "Amount", "Status", "Transaction ID", "Date"];
    const rows = filtered.map((p) => [
      p.name, p.email, p.phone, p.provider, p.amount, p.status, p.transaction_id,
      new Date(p.created_at).toLocaleString(),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

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
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">Loading...</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">No payments found</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground">{p.email}</TableCell>
                      <TableCell className="text-muted-foreground">{p.phone}</TableCell>
                      <TableCell className="capitalize text-muted-foreground">{p.provider}</TableCell>
                      <TableCell className="text-foreground font-medium">ZMW {p.amount}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.status === "completed"
                            ? "bg-green-500/20 text-green-500"
                            : p.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-500"
                            : "bg-destructive/20 text-destructive"
                        }`}>
                          {p.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(p.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Payments;
