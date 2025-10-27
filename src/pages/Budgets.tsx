import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit, TrendingUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BudgetCategory {
  id: number;
  name: string;
  budgeted: number;
  spent: number;
  color: string;
}

const Budgets = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Mock budget data
  const budgetCategories: BudgetCategory[] = [
    { id: 1, name: "Housing", budgeted: 1500, spent: 1200, color: "bg-primary" },
    { id: 2, name: "Food & Dining", budgeted: 600, spent: 450, color: "bg-success" },
    { id: 3, name: "Transportation", budgeted: 400, spent: 300, color: "bg-warning" },
    { id: 4, name: "Entertainment", budgeted: 200, spent: 150, color: "bg-destructive" },
    { id: 5, name: "Utilities", budgeted: 300, spent: 280, color: "bg-accent" },
    { id: 6, name: "Healthcare", budgeted: 250, spent: 100, color: "bg-muted" },
    { id: 7, name: "Shopping", budgeted: 400, spent: 520, color: "bg-primary-light" },
    { id: 8, name: "Savings", budgeted: 1000, spent: 1000, color: "bg-success-light" },
  ];

  const totalBudgeted = budgetCategories.reduce((sum, cat) => sum + cat.budgeted, 0);
  const totalSpent = budgetCategories.reduce((sum, cat) => sum + cat.spent, 0);

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
    } catch (error: any) {
      toast.error("Failed to load budgets");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (spent: number, budgeted: number) => {
    const percentage = (spent / budgeted) * 100;
    if (percentage >= 100) return "text-destructive";
    if (percentage >= 80) return "text-warning";
    return "text-success";
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
            <h1 className="text-4xl font-bold mb-2">Monthly Budget</h1>
            <p className="text-muted-foreground">Zero-based budgeting: Allocate every dollar to reach $0.00 unallocated</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Budget Category</DialogTitle>
                <DialogDescription>
                  Set up a new budget category with monthly limits.
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category-name">Category Name</Label>
                  <Input id="category-name" placeholder="e.g., Groceries" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="monthly-budget">Monthly Budget</Label>
                  <Input id="monthly-budget" type="number" step="0.01" placeholder="0.00" />
                </div>
                
                <Button type="submit" className="w-full">
                  Create Category
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Card */}
        <Card className="shadow-card mb-8 bg-gradient-primary">
          <CardHeader>
            <CardTitle className="text-primary-foreground">
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} - Zero-Based Budget
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Target: $0.00 unallocated (Every dollar has a purpose)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-primary-foreground/80 mb-1">Income</p>
                <p className="text-3xl font-bold text-primary-foreground">
                  ${totalBudgeted.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-primary-foreground/80 mb-1">Allocated</p>
                <p className="text-3xl font-bold text-primary-foreground">
                  ${totalBudgeted.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-primary-foreground/80 mb-1">Spent</p>
                <p className="text-3xl font-bold text-primary-foreground">
                  ${totalSpent.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-primary-foreground/80 mb-1">Unallocated</p>
                <p className={`text-3xl font-bold ${
                  0 === 0 ? 'text-success-foreground' : 'text-warning-foreground'
                }`}>
                  $0.00
                </p>
                <p className="text-xs text-primary-foreground/60 mt-1">
                  {0 === 0 ? '✓ Target reached!' : 'Allocate remaining income'}
                </p>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-primary-foreground/80">Budget Usage</span>
                <span className="text-sm font-semibold text-primary-foreground">
                  {Math.round((totalSpent / totalBudgeted) * 100)}%
                </span>
              </div>
              <Progress 
                value={(totalSpent / totalBudgeted) * 100} 
                className="h-3 bg-primary-foreground/20"
              />
            </div>
          </CardContent>
        </Card>

        {/* Category Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgetCategories.map((category) => {
            const percentage = (category.spent / category.budgeted) * 100;
            const remaining = category.budgeted - category.spent;
            
            return (
              <Card key={category.id} className="shadow-card hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <p className="text-2xl font-bold ${getStatusColor(category.spent, category.budgeted)}">
                          ${category.spent.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          of ${category.budgeted.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${getStatusColor(category.spent, category.budgeted)}`}>
                          {Math.round(percentage)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${Math.abs(remaining).toLocaleString()} {remaining >= 0 ? 'left' : 'over'}
                        </p>
                      </div>
                    </div>
                    
                    <Progress value={Math.min(percentage, 100)} className="h-2" />
                    
                    {percentage >= 100 && (
                      <div className="flex items-center gap-2 text-sm text-destructive">
                        <TrendingUp className="h-4 w-4" />
                        <span>Over budget!</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Budgets;
