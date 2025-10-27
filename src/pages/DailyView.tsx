import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { format } from "date-fns";

const DailyView = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [todayTransactions, setTodayTransactions] = useState<any[]>([]);
  const [dailyIncome, setDailyIncome] = useState(0);
  const [dailyExpenses, setDailyExpenses] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);

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
      
      await fetchDailyData();
    } catch (error: any) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const today = new Date().toISOString().split("T")[0];

      // Fetch today's transactions
      const { data: transactions, error: transError } = await supabase
        .from("transactions")
        .select(`
          *,
          budget_categories(name, type),
          accounts(name)
        `)
        .eq("user_id", session.user.id)
        .eq("transaction_date", today)
        .order("created_at", { ascending: false });

      if (transError) throw transError;

      setTodayTransactions(transactions || []);

      // Calculate daily totals
      const income = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const expenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      setDailyIncome(income);
      setDailyExpenses(expenses);
      setAvailableBalance(income - expenses);

    } catch (error: any) {
      console.error("Error fetching daily data:", error);
      toast.error("Failed to load daily data");
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
            <h1 className="text-4xl font-bold mb-2">Today's Overview</h1>
            <p className="text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          </div>
          
          <Button onClick={() => navigate("/transactions")} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Transaction
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                ${dailyIncome.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                ${dailyExpenses.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${availableBalance >= 0 ? 'text-success' : 'text-destructive'}`}>
                ${availableBalance.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {availableBalance >= 0 ? 'On track' : 'Over budget'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Today's Transactions</CardTitle>
            <CardDescription>
              {todayTransactions.length} transaction{todayTransactions.length !== 1 ? 's' : ''} today
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todayTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transactions recorded today. Start by adding your first transaction!
              </div>
            ) : (
              <div className="space-y-4">
                {todayTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'income' ? 'bg-success/10' : 'bg-destructive/10'
                      }`}>
                        {transaction.type === 'income' ? (
                          <TrendingUp className="h-4 w-4 text-success" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.budget_categories?.name || 'Uncategorized'} • {transaction.accounts?.name}
                        </p>
                      </div>
                    </div>
                    <div className={`text-lg font-semibold ${
                      transaction.type === 'income' ? 'text-success' : 'text-destructive'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}${Number(transaction.amount).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DailyView;
