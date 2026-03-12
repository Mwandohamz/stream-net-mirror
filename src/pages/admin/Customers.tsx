import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Search } from "lucide-react";

const Customers = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from("payments")
      .select("*")
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    // Deduplicate by email, keep latest payment
    const seen = new Map<string, any>();
    (data || []).forEach((p: any) => {
      if (!seen.has(p.email)) {
        seen.set(p.email, { ...p, paymentCount: 1 });
      } else {
        seen.get(p.email).paymentCount++;
      }
    });
    setCustomers(Array.from(seen.values()));
    setLoading(false);
  };

  const filtered = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
  );

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
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Payments</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Loading...</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No customers found</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.email}</TableCell>
                      <TableCell className="text-muted-foreground">{c.phone}</TableCell>
                      <TableCell className="capitalize text-muted-foreground">{c.provider}</TableCell>
                      <TableCell className="text-foreground">{c.paymentCount}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(c.created_at).toLocaleDateString()}
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

export default Customers;
