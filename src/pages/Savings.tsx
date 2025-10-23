import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Target, Calendar, TrendingUp } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SavingsGoal {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  priority: "low" | "medium" | "high";
  description: string;
}

const Savings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Mock savings goals
  const savingsGoals: SavingsGoal[] = [
    {
      id: 1,
      name: "Emergency Fund",
      targetAmount: 10000,
      currentAmount: 6500,
      targetDate: "2025-06-30",
      priority: "high",
      description: "6 months of expenses"
    },
    {
      id: 2,
      name: "Vacation to Europe",
      targetAmount: 5000,
      currentAmount: 2000,
      targetDate: "2025-08-15",
      priority: "medium",
      description: "Summer vacation"
    },
    {
      id: 3,
      name: "New Car Down Payment",
      targetAmount: 20000,
      currentAmount: 5000,
      targetDate: "2026-01-01",
      priority: "high",
      description: "20% down payment"
    },
    {
      id: 4,
      name: "Home Renovation",
      targetAmount: 15000,
      currentAmount: 3500,
      targetDate: "2025-12-31",
      priority: "medium",
      description: "Kitchen remodel"
    },
  ];

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
      toast.error("Failed to load savings goals");
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyContribution = (goal: SavingsGoal) => {
    const remaining = goal.targetAmount - goal.currentAmount;
    const today = new Date();
    const target = new Date(goal.targetDate);
    const monthsRemaining = Math.max(1, Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    return (remaining / monthsRemaining).toFixed(2);
  };

  const getDaysRemaining = (targetDate: string) => {
    const today = new Date();
    const target = new Date(targetDate);
    const days = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-destructive text-destructive-foreground";
      case "medium": return "bg-warning text-warning-foreground";
      case "low": return "bg-success text-success-foreground";
      default: return "bg-muted text-muted-foreground";
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
            <h1 className="text-4xl font-bold mb-2">Savings Goals</h1>
            <p className="text-muted-foreground">Track your progress towards financial targets</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Savings Goal</DialogTitle>
                <DialogDescription>
                  Set a new financial target to work towards.
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="goal-name">Goal Name</Label>
                  <Input id="goal-name" placeholder="e.g., Emergency Fund" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="target-amount">Target Amount</Label>
                  <Input id="target-amount" type="number" step="0.01" placeholder="0.00" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="current-amount">Current Amount</Label>
                  <Input id="current-amount" type="number" step="0.01" placeholder="0.00" defaultValue="0" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="target-date">Target Date</Label>
                  <Input id="target-date" type="date" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input id="description" placeholder="Brief description" />
                </div>
                
                <Button type="submit" className="w-full">
                  Create Goal
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Card */}
        <Card className="shadow-card mb-8 bg-gradient-success">
          <CardHeader>
            <CardTitle className="text-success-foreground">Savings Overview</CardTitle>
            <CardDescription className="text-success-foreground/80">
              Your total savings progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-success-foreground/80 mb-1">Total Saved</p>
                <p className="text-3xl font-bold text-success-foreground">
                  ${savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-success-foreground/80 mb-1">Total Target</p>
                <p className="text-3xl font-bold text-success-foreground">
                  ${savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-success-foreground/80 mb-1">Active Goals</p>
                <p className="text-3xl font-bold text-success-foreground">
                  {savingsGoals.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goals Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {savingsGoals.map((goal) => {
            const percentage = (goal.currentAmount / goal.targetAmount) * 100;
            const remaining = goal.targetAmount - goal.currentAmount;
            const monthlyNeeded = calculateMonthlyContribution(goal);
            const daysLeft = getDaysRemaining(goal.targetDate);
            
            return (
              <Card key={goal.id} className="shadow-card hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        {goal.name}
                      </CardTitle>
                      <CardDescription className="mt-1">{goal.description}</CardDescription>
                    </div>
                    <Badge className={getPriorityColor(goal.priority)}>
                      {goal.priority.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">{Math.round(percentage)}%</span>
                    </div>
                    <Progress value={percentage} className="h-3" />
                    <div className="flex justify-between text-sm">
                      <span className="text-success font-semibold">
                        ${goal.currentAmount.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">
                        / ${goal.targetAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Calendar className="h-4 w-4" />
                        <span>Days Left</span>
                      </div>
                      <p className="text-2xl font-bold">{daysLeft}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <TrendingUp className="h-4 w-4" />
                        <span>Monthly Need</span>
                      </div>
                      <p className="text-2xl font-bold">${monthlyNeeded}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">
                      Remaining: <span className="font-semibold text-foreground">${remaining.toLocaleString()}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Target Date: {new Date(goal.targetDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>

                  <Button variant="outline" className="w-full">
                    Add Contribution
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Savings;
