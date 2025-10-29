import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowDownIcon, ArrowUpIcon, TrendingUp, Wallet, Target, PieChart, Plus } from "lucide-react";
import { Link } from "react-router-dom";

interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsProgress: number;
  budgetedAmount: number;
  unallocatedFunds: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savingsProgress: 0,
    budgetedAmount: 0,
    unallocatedFunds: 0,
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
      
      // Fetch dashboard data
      await fetchDashboardData();
    } catch (error: any) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    // For now, using mock data - will be replaced with real queries
    const monthlyIncome = 5000.00;
    const budgetedAmount = 4500.00;
    setStats({
      totalBalance: 12450.00,
      monthlyIncome,
      monthlyExpenses: 3250.00,
      savingsProgress: 65,
      budgetedAmount,
      unallocatedFunds: monthlyIncome - budgetedAmount,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const netCashFlow = stats.monthlyIncome - stats.monthlyExpenses;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your financial overview.</p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalBalance.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all accounts</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
              <ArrowUpIcon className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">${stats.monthlyIncome.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
              <ArrowDownIcon className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">${stats.monthlyExpenses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Budgeted This Month</CardTitle>
              <PieChart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.budgetedAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {((stats.budgetedAmount / stats.monthlyIncome) * 100).toFixed(0)}% allocated
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Zero-Based Budget Alert */}
        {stats.unallocatedFunds > 0 && (
          <Card className="shadow-card mb-8 border-warning">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-warning/10 p-3">
                  <TrendingUp className="h-6 w-6 text-warning" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Unallocated Funds: ${stats.unallocatedFunds.toLocaleString()}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Zero-based budgeting means every dollar has a purpose. Assign these funds to categories to maximize your financial control.
                  </p>
                  <Link to="/budgets">
                    <Button size="sm" variant="outline">
                      Allocate Funds
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Quick Actions */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks to manage your finances</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/transactions">
                <Button className="w-full justify-start gap-2" variant="outline">
                  <Plus className="h-4 w-4" />
                  Add Transaction
                </Button>
              </Link>
              <Link to="/budgets">
                <Button className="w-full justify-start gap-2" variant="outline">
                  <PieChart className="h-4 w-4" />
                  Manage Budgets
                </Button>
              </Link>
              <Link to="/savings">
                <Button className="w-full justify-start gap-2" variant="outline">
                  <Target className="h-4 w-4" />
                  Track Savings Goals
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Savings Goals Preview */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Top Savings Goals</CardTitle>
              <CardDescription>Your most urgent financial targets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Emergency Fund</span>
                  <span className="text-sm text-muted-foreground">{stats.savingsProgress}%</span>
                </div>
                <Progress value={stats.savingsProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">$6,500 of $10,000</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Vacation Fund</span>
                  <span className="text-sm text-muted-foreground">40%</span>
                </div>
                <Progress value={40} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">$2,000 of $5,000</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">New Car</span>
                  <span className="text-sm text-muted-foreground">25%</span>
                </div>
                <Progress value={25} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">$5,000 of $20,000</p>
              </div>

              <Link to="/savings">
                <Button variant="ghost" className="w-full mt-2">
                  View All Goals
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Zero-Based Budget Overview */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Zero-Based Budget - November 2024</CardTitle>
            <CardDescription>Every dollar assigned a purpose • {((stats.budgetedAmount / stats.monthlyIncome) * 100).toFixed(0)}% of income allocated</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "Housing", spent: 1200, budget: 1500, color: "bg-primary" },
              { name: "Food & Dining", spent: 450, budget: 600, color: "bg-success" },
              { name: "Transportation", spent: 300, budget: 400, color: "bg-warning" },
              { name: "Entertainment", spent: 150, budget: 200, color: "bg-destructive" },
            ].map((category) => (
              <div key={category.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{category.name}</span>
                  <span className="text-sm text-muted-foreground">
                    ${category.spent} / ${category.budget}
                  </span>
                </div>
                <Progress 
                  value={(category.spent / category.budget) * 100} 
                  className="h-2"
                />
              </div>
            ))}
            
            <Link to="/budgets">
              <Button variant="outline" className="w-full mt-4">
                Manage All Categories
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
