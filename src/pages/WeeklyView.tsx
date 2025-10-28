import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { startOfWeek, endOfWeek, format, addWeeks, subWeeks } from "date-fns";

const WeeklyView = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()));
  const [weeklyTransactions, setWeeklyTransactions] = useState<any[]>([]);
  const [weeklyIncome, setWeeklyIncome] = useState(0);
  const [weeklyExpenses, setWeeklyExpenses] = useState(0);

  useEffect(() => {
    checkAuth();
  }, [currentWeekStart]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      
      await fetchWeeklyData();
    } catch (error: any) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const weekEnd = endOfWeek(currentWeekStart);
      const weekStartStr = format(currentWeekStart, 'yyyy-MM-dd');
      const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

      const { data: transactions, error } = await supabase
        .from("transactions")
        .select(`
          *,
          budget_categories(name, type),
          accounts!transactions_account_id_fkey(name)
        `)
        .eq("user_id", session.user.id)
        .gte("transaction_date", weekStartStr)
        .lte("transaction_date", weekEndStr)
        .order("transaction_date", { ascending: false });

      if (error) throw error;

      setWeeklyTransactions(transactions || []);

      const income = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const expenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      setWeeklyIncome(income);
      setWeeklyExpenses(expenses);

    } catch (error: any) {
      console.error("Error fetching weekly data:", error);
      toast.error("Failed to load weekly data");
    }
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date()));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const weekEnd = endOfWeek(currentWeekStart);
  const weeklyNet = weeklyIncome - weeklyExpenses;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Weekly Overview</h1>
            <p className="text-muted-foreground">
              {format(currentWeekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={goToCurrentWeek}>
              This Week
            </Button>
            <Button variant="outline" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button onClick={() => navigate("/transactions")} className="gap-2 ml-4">
              <Plus className="h-4 w-4" />
              Add Transaction
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                ${weeklyIncome.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                ${weeklyExpenses.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${weeklyNet >= 0 ? 'text-success' : 'text-destructive'}`}>
                {weeklyNet >= 0 ? '+' : ''}${weeklyNet.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Zero-based target: $0.00
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Weekly Transactions</CardTitle>
            <CardDescription>
              {weeklyTransactions.length} transaction{weeklyTransactions.length !== 1 ? 's' : ''} this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            {weeklyTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transactions for this week.
              </div>
            ) : (
              <div className="space-y-4">
                {weeklyTransactions.map((transaction) => (
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
                          {format(new Date(transaction.transaction_date), 'MMM d')} • {transaction.budget_categories?.name || 'Uncategorized'} • {transaction.accounts?.name}
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

export default WeeklyView;
