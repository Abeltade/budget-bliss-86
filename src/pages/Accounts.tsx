import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Accounts = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "checking",
    balance: "",
    currency: "USD",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      
      await fetchAccounts();
    } catch (error: any) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error: any) {
      console.error("Error fetching accounts:", error);
      toast.error("Failed to load accounts");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error("Please enter an account name");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("accounts")
        .insert([{
          user_id: session.user.id,
          name: formData.name,
          type: formData.type as "checking" | "savings" | "credit_card" | "cash" | "investment" | "other",
          balance: parseFloat(formData.balance) || 0,
          currency: formData.currency,
        }]);

      if (error) throw error;

      toast.success("Account created successfully!");
      setDialogOpen(false);
      setFormData({
        name: "",
        type: "checking",
        balance: "",
        currency: "USD",
      });
      fetchAccounts();
    } catch (error: any) {
      toast.error("Failed to create account");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Accounts</h1>
            <p className="text-muted-foreground">Manage your financial accounts</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Account</DialogTitle>
                <DialogDescription>
                  Create a new account to track your finances.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Account Name *</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g., Main Checking, Savings" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Account Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="investment">Investment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="balance">Initial Balance</Label>
                  <Input 
                    id="balance" 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button type="submit" className="w-full">
                  Create Account
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Your Accounts</CardTitle>
            <CardDescription>
              View and manage all your financial accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  No accounts yet. Create your first account to get started!
                </p>
                <Button onClick={() => setDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Your First Account
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell className="capitalize">{account.type}</TableCell>
                      <TableCell>{account.currency}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {account.currency} {parseFloat(account.balance).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Accounts;
