import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { paymentsAPI, Transaction, Subscription } from "@/api/payments";
import { toast } from "sonner";
import { CreditCard, TrendingUp, Calendar } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Stats {
  totalSpent: number;
  activeSubscriptions: number;
  transactions: Transaction[];
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalSpent: 0,
    activeSubscriptions: 0,
    transactions: [],
    subscriptions: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [transactions, subscriptions] = await Promise.all([
          paymentsAPI.getTransactions(),
          paymentsAPI.getSubscriptions(),
        ]);

        const totalSpent = transactions.reduce(
          (sum, t) => sum + parseFloat(t.amount.toString()),
          0,
        );

        const activeSubscriptions = subscriptions.filter(
          (s) => s.status === "active",
        ).length;

        setStats({
          totalSpent,
          activeSubscriptions,
          transactions: transactions.slice(0, 5),
          subscriptions,
          loading: false,
          error: null,
        });
      } catch (error) {
        toast.error("Failed to fetch dashboard data");
        setStats((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to load",
        }));
      }
    };

    fetchStats();
  }, []);

  if (stats.loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total Spent Widget */}
          <Card className="border-border bg-background">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">
                Total Spent
              </CardTitle>
              <CreditCard className="h-4 w-4 text-primary-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                ${stats.totalSpent.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all transactions
              </p>
            </CardContent>
          </Card>

          {/* Active Subscriptions Widget */}
          <Card className="border-border bg-background">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">
                Active Subscriptions
              </CardTitle>
              <Calendar className="h-4 w-4 text-primary-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {stats.activeSubscriptions}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Recurring plans
              </p>
            </CardContent>
          </Card>

          {/* Success Rate Widget */}
          <Card className="border-border bg-background">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">
                Success Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {stats.transactions.length > 0
                  ? Math.round(
                    (stats.transactions.filter((t) => t.status !== "failed")
                      .length /
                      stats.transactions.length) *
                    100,
                  )
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Transaction success
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="border-border bg-background">
          <CardHeader>
            <CardTitle className="text-foreground">
              Recent Transactions
            </CardTitle>
            <CardDescription>
              Your latest 5 payment transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Transaction ID
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.transactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm font-mono text-foreground">
                          {transaction.transaction_id.slice(0, 8)}...
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground font-medium">
                          $
                          {parseFloat(transaction.amount.toString()).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${transaction.status === "failed"
                              ? "bg-red-100 text-red-800"
                              : transaction.status === "authorized"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                              }`}
                          >
                            {transaction.status.charAt(0).toUpperCase() +
                              transaction.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No transactions yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
