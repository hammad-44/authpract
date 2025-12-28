import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { paymentsAPI, Transaction, Subscription } from "@/api/payments";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trash2, Calendar } from "lucide-react";

interface HistoryState {
  transactions: Transaction[];
  subscriptions: Subscription[];
  loading: boolean;
  cancellingId: string | null;
}

export default function History() {
  const [state, setState] = useState<HistoryState>({
    transactions: [],
    subscriptions: [],
    loading: true,
    cancellingId: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [transactions, subscriptions] = await Promise.all([
          paymentsAPI.getTransactions(),
          paymentsAPI.getSubscriptions(),
        ]);

        setState((prev) => ({
          ...prev,
          transactions,
          subscriptions,
          loading: false,
        }));
      } catch (error) {
        toast.error("Failed to fetch history");
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchData();
  }, []);

  const handleCancelSubscription = async (id: string) => {
    setState((prev) => ({ ...prev, cancellingId: id }));

    try {
      await paymentsAPI.cancelSubscription(id);
      toast.success("Subscription cancelled");
      setState((prev) => ({
        ...prev,
        subscriptions: prev.subscriptions.filter((s) => s.id !== id),
        cancellingId: null,
      }));
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to cancel subscription",
      );
      setState((prev) => ({ ...prev, cancellingId: null }));
    }
  };

  if (state.loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading history...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Payment History
          </h1>
          <p className="text-muted-foreground">
            View and manage your transactions and subscriptions
          </p>
        </div>

        {/* Transactions Section */}
        <Card className="border-border bg-background">
          <CardHeader>
            <CardTitle className="text-foreground">
              Transaction History
            </CardTitle>
            <CardDescription>
              All your one-time payment transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {state.transactions && state.transactions.length > 0 ? (
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
                    {state.transactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm font-mono text-foreground">
                          {transaction.transaction_id}
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
                          {new Date(transaction.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No transactions found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscriptions Section */}
        <Card className="border-border bg-background">
          <CardHeader>
            <CardTitle className="text-foreground">
              Active Subscriptions
            </CardTitle>
            <CardDescription>
              Manage your recurring subscription plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            {state.subscriptions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {state.subscriptions.map((subscription) => (
                  <div
                    key={subscription.id}
                    className="p-4 border border-border rounded-lg hover:border-primary-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {subscription.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          ID: {subscription.id}
                        </p>
                      </div>
                      <Calendar className="w-5 h-5 text-primary-600" />
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Amount
                        </span>
                        <span className="font-semibold text-foreground">
                          $
                          {parseFloat(subscription.amount.toString()).toFixed(
                            2,
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Billing
                        </span>
                        <span className="text-sm text-foreground">
                          Every {subscription.interval_length}{" "}
                          {subscription.interval_unit}
                          {subscription.interval_length > 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Status
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {subscription.status.charAt(0).toUpperCase() +
                            subscription.status.slice(1)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>Created</span>
                        <span>
                          {new Date(
                            subscription.created_at,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleCancelSubscription(subscription.id)}
                      disabled={state.cancellingId === subscription.id}
                      variant="destructive"
                      size="sm"
                      className="w-full"
                    >
                      {state.cancellingId === subscription.id ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Cancel Subscription
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No active subscriptions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
