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
import { Plus, ArrowUpIcon, ArrowDownIcon, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Transactions = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [savingsGoals, setSavingsGoals] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    type: "expense",
    amount: "",
    description: "",
    category_id: undefined as string | undefined,
    account_id: undefined as string | undefined,
    destination_account_id: undefined as string | undefined,
    savings_goal_id: undefined as string | undefined,
    transaction_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchTransactions();
    }
  }, [loading, startDate, endDate]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      
      await Promise.all([
        fetchTransactions(),
        fetchAccounts(),
        fetchCategories(),
        fetchSavingsGoals(),
      ]);
    } catch (error: any) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      let query = supabase
        .from("transactions")
        .select(`
          *,
          budget_categories(name),
          accounts!transactions_account_id_fkey(name)
        `)
        .eq("user_id", session.user.id)
        .order("transaction_date", { ascending: false });

      if (startDate) {
        query = query.gte("transaction_date", startDate);
      }
      if (endDate) {
        query = query.lte("transaction_date", endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      setTransactions(data || []);
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", session.user.id);

      if (error) throw error;
      setAccounts(data || []);
    } catch (error: any) {
      console.error("Error fetching accounts:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("budget_categories")
        .select("*")
        .eq("user_id", session.user.id)
        .order("type", { ascending: false })
        .order("name", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSavingsGoals = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("savings_goals")
        .select("*")
        .eq("user_id", session.user.id);

      if (error) throw error;
      setSavingsGoals(data || []);
    } catch (error: any) {
      console.error("Error fetching savings goals:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.account_id) {
      toast.error("Please select an account");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Insert transaction
      const transactionData: any = {
        user_id: session.user.id,
        type: formData.type as "income" | "expense" | "transfer",
        amount: parseFloat(formData.amount),
        description: formData.description,
        category_id: formData.category_id || null,
        account_id: formData.account_id,
        transaction_date: formData.transaction_date,
      };

      // Add destination account if transfer
      if (formData.type === "transfer" && formData.destination_account_id) {
        transactionData.destination_account_id = formData.destination_account_id;
      }

      const { data: transactionResult, error: transError } = await supabase
        .from("transactions")
        .insert(transactionData)
        .select()
        .single();

      if (transError) throw transError;

      // If linked to savings goal, create contribution
      if (formData.savings_goal_id && transactionResult) {
        const { error: contribError } = await supabase
          .from("goal_contributions")
          .insert({
            user_id: session.user.id,
            goal_id: formData.savings_goal_id,
            transaction_id: transactionResult.id,
            amount: parseFloat(formData.amount),
            contribution_date: formData.transaction_date,
            notes: `Contribution via ${formData.description}`,
          });

        if (contribError) throw contribError;

        // Update goal's current amount
        const { data: goalData } = await supabase
          .from("savings_goals")
          .select("current_amount")
          .eq("id", formData.savings_goal_id)
          .single();

        if (goalData) {
          const newAmount = Number(goalData.current_amount) + parseFloat(formData.amount);
          await supabase
            .from("savings_goals")
            .update({ current_amount: newAmount })
            .eq("id", formData.savings_goal_id);
        }
      }

      toast.success("Transaction added successfully!");
      setDialogOpen(false);
      setFormData({
        type: "expense",
        amount: "",
        description: "",
        category_id: undefined,
        account_id: undefined,
        destination_account_id: undefined,
        savings_goal_id: undefined,
        transaction_date: new Date().toISOString().split("T")[0],
      });
      fetchTransactions();
    } catch (error: any) {
      toast.error("Failed to add transaction");
      console.error(error);
    }
  };

  const filteredTransactions = transactions.filter((t) =>
    t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.budget_categories?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <h1 className="text-4xl font-bold mb-2">Transactions</h1>
            <p className="text-muted-foreground">Track all your income and expenses</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="gap-2"
                onClick={(e) => {
                  if (accounts.length === 0) {
                    e.preventDefault();
                    toast.error("Please create an account first before adding transactions");
                  }
                }}
              >
                <Plus className="h-4 w-4" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Transaction</DialogTitle>
                <DialogDescription>
                  Enter the details of your transaction below.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input 
                    id="amount" 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input 
                    id="description" 
                    placeholder="e.g., Monthly rent" 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category_id || undefined} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter(cat => formData.type === 'transfer' || cat.type === formData.type)
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="account">{formData.type === 'transfer' ? 'From Account' : 'Account'} *</Label>
                  <Select value={formData.account_id || undefined} onValueChange={(value) => setFormData({ ...formData, account_id: value })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.type === 'transfer' && (
                  <div className="space-y-2">
                    <Label htmlFor="destination">To Account</Label>
                    <Select value={formData.destination_account_id || undefined} onValueChange={(value) => setFormData({ ...formData, destination_account_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.filter(acc => acc.id !== formData.account_id).map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="savings_goal">Link to Savings Goal (Optional)</Label>
                  <Select value={formData.savings_goal_id || undefined} onValueChange={(value) => setFormData({ ...formData, savings_goal_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      {savingsGoals.map((goal) => (
                        <SelectItem key={goal.id} value={goal.id}>
                          {goal.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    value={formData.transaction_date}
                    onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full">
                  Add Transaction
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2">
                <div className="flex items-center gap-2 flex-1">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-40"
                    placeholder="Start date"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-40"
                    placeholder="End date"
                  />
                </div>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No transactions found. Add your first transaction to get started!
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {new Date(transaction.transaction_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {transaction.type === "income" ? (
                            <ArrowUpIcon className="h-4 w-4 text-success" />
                          ) : (
                            <ArrowDownIcon className="h-4 w-4 text-destructive" />
                          )}
                          {transaction.description}
                        </div>
                      </TableCell>
                      <TableCell>{transaction.budget_categories?.name || "Uncategorized"}</TableCell>
                      <TableCell>{transaction.accounts?.name || "Unknown"}</TableCell>
                      <TableCell className={`text-right font-semibold ${
                        transaction.type === "income" ? "text-success" : "text-destructive"
                      }`}>
                        {transaction.type === "income" ? "+" : "-"}${Math.abs(transaction.amount).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Transactions;
