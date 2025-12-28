import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { paymentsAPI, SubscriptionPlan } from "@/api/payments";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar, Loader, Check } from "lucide-react";

declare global {
  interface Window {
    Accept: any;
  }
}

export default function Pricing() {
  const [formData, setFormData] = useState({
    name: "Premium Monthly",
    amount: "29.99",
    interval_length: "1",
    interval_unit: "months" as "days" | "months",
    email: "",
    first_name: "",
    last_name: "",
  });

  const [loading, setLoading] = useState(false);
  const [acceptLoaded, setAcceptLoaded] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    const checkAccept = () => {
      if (window.Accept) {
        setAcceptLoaded(true);
      }
    };

    checkAccept();
    const timer = setTimeout(checkAccept, 500);

    const fetchPlans = async () => {
      try {
        const data = await paymentsAPI.getPlans();
        setPlans(data);
      } catch (error) {
        toast.error("Failed to load plans");
      } finally {
        setLoadingPlans(false);
      }
    }
    fetchPlans();

    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptLoaded) {
      toast.error("Payment system not loaded. Please refresh the page.");
      return;
    }

    setLoading(true);

    const authData = {
      clientKey: import.meta.env.VITE_AUTHORIZENET_CLIENT_KEY,
      apiLoginID: import.meta.env.VITE_AUTHORIZENET_LOGIN_ID,
    };

    const cardData = {
      cardNumber: (document.getElementById('cardNumber') as HTMLInputElement).value,
      month: (document.getElementById('expMonth') as HTMLInputElement).value,
      year: (document.getElementById('expYear') as HTMLInputElement).value,
      cardCode: (document.getElementById('cardCode') as HTMLInputElement).value,
    };

    const secureData = {
      authData: authData,
      cardData: cardData,
    };

    window.Accept.dispatchData(secureData, async (response: any) => {
      if (response.messages.resultCode === "Error") {
        toast.error(response.messages.message[0].text);
        setLoading(false);
        return;
      }

      try {
        const nonce = response.opaqueData.dataValue;

        await paymentsAPI.createSubscription({
          name: formData.name,
          amount: parseFloat(formData.amount),
          interval_length: parseInt(formData.interval_length),
          interval_unit: formData.interval_unit,
          nonce: nonce,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
        });

        toast.success("Subscription created successfully!");
        setFormData({
          name: "Premium Monthly",
          amount: "29.99",
          interval_length: "1",
          interval_unit: "months",
          email: "",
          first_name: "",
          last_name: "",
        });

        // Clear inputs
        (document.getElementById('cardNumber') as HTMLInputElement).value = '';
        (document.getElementById('expMonth') as HTMLInputElement).value = '';
        (document.getElementById('expYear') as HTMLInputElement).value = '';
        (document.getElementById('cardCode') as HTMLInputElement).value = '';

      } catch (error: any) {
        toast.error(
          error.response?.data?.message || "Subscription creation failed",
        );
      } finally {
        setLoading(false);
      }
    });
  };

  const selectPlan = (plan: SubscriptionPlan) => {
    setFormData({
      ...formData,
      name: plan.name,
      amount: plan.amount,
      interval_length: plan.interval_length.toString(),
      interval_unit: plan.interval_unit,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.info(`Selected Plan: ${plan.name}`);
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-muted-foreground text-lg">
            Choose the perfect plan for your needs. No hidden fees.
          </p>
        </div>

        {/* Dynamic Plan Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loadingPlans ? (
            <div className="col-span-4 flex justify-center py-12">
              <Loader className="animate-spin h-8 w-8 text-indigo-500" />
            </div>
          ) : (
            plans.map((plan) => (
              <Card key={plan.id} className="flex flex-col border-slate-200 hover:border-primary-500 hover:shadow-2xl transition-all relative overflow-hidden group bg-white">
                {plan.name.toLowerCase().includes('enterprise') && (
                  <div className="absolute top-0 right-0 bg-primary-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg z-10 shadow-sm">MOST POPULAR</div>
                )}
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold text-slate-900">{plan.name}</CardTitle>
                  <div className="mt-4 flex items-baseline text-slate-900">
                    <span className="text-4xl font-extrabold tracking-tight">${plan.amount}</span>
                    <span className="ml-1 text-sm font-medium text-slate-500">/{plan.interval_unit === 'months' ? 'mo' : 'day'}</span>
                  </div>
                  <CardDescription className="mt-2 text-slate-600 line-clamp-2 min-h-[3rem]">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between pt-0">
                  <div className="border-t border-slate-50 pt-6 mb-8">
                    <ul className="space-y-3">
                      {plan.features && Array.isArray(plan.features) && plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <div className="flex-shrink-0 mt-1">
                            <Check className="h-4 w-4 text-emerald-500 font-bold" />
                          </div>
                          <p className="ml-3 text-sm text-slate-700 leading-snug">{feature}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button
                    className="w-full bg-slate-900 text-white hover:bg-slate-800 h-11 font-semibold transition-all duration-200"
                    onClick={() => selectPlan(plan)}
                  >
                    Select Plan
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="border-t border-gray-200 pt-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Subscription Form */}
            <div className="lg:col-span-2 lg:col-start-2">
              <Card className="border-slate-200 bg-white shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100 pb-8">
                  <CardTitle className="text-slate-900 text-2xl font-bold">Checkout Details</CardTitle>
                  <CardDescription className="text-slate-500 text-base">
                    Complete your subscription for <span className="text-slate-900 font-semibold">{formData.name}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="bg-primary-50 p-6 rounded-xl border border-primary-100 flex justify-between items-center transition-all">
                      <div>
                        <p className="font-bold text-primary-900 uppercase text-xs tracking-wider mb-1">Selected Plan</p>
                        <p className="text-lg font-bold text-slate-900">{formData.name}</p>
                        <p className="text-primary-700 font-medium">${formData.amount} / {formData.interval_unit}</p>
                      </div>
                      <Button variant="outline" size="sm" type="button" className="border-primary-200 text-primary-700 hover:bg-primary-100" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Change Plan</Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-700 font-semibold">Email Address</Label>
                        <Input id="email" type="email" placeholder="you@example.com" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} className="h-11 border-slate-200 focus:ring-primary-500" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="first_name" className="text-slate-700 font-semibold">First Name</Label>
                          <Input id="first_name" placeholder="John" value={formData.first_name} onChange={(e) => handleInputChange("first_name", e.target.value)} className="h-11 border-slate-200 focus:ring-primary-500" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="last_name" className="text-slate-700 font-semibold">Last Name</Label>
                          <Input id="last_name" placeholder="Doe" value={formData.last_name} onChange={(e) => handleInputChange("last_name", e.target.value)} className="h-11 border-slate-200 focus:ring-primary-500" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <h4 className="text-lg font-bold mb-6 text-slate-900 flex items-center gap-2">
                        <div className="h-6 w-1 bg-primary-600 rounded-full"></div>
                        Payment Information
                      </h4>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="cardNumber" className="text-slate-700 font-semibold">Card Number</Label>
                          <div className="relative">
                            <Input id="cardNumber" placeholder="0000 0000 0000 0000" maxLength={19} className="h-11 border-slate-200 pl-4 focus:ring-primary-500" />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                              <div className="h-6 w-10 bg-slate-100 rounded border border-slate-200"></div>
                              <div className="h-6 w-10 bg-slate-100 rounded border border-slate-200"></div>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="expMonth" className="text-slate-700 font-semibold">Expiry Month</Label>
                            <Input id="expMonth" placeholder="MM" maxLength={2} className="h-11 border-slate-200 focus:ring-primary-500" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="expYear" className="text-slate-700 font-semibold">Expiry Year</Label>
                            <Input id="expYear" placeholder="YY" maxLength={2} className="h-11 border-slate-200 focus:ring-primary-500" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cardCode" className="text-slate-700 font-semibold">CVV/CVC</Label>
                            <Input id="cardCode" placeholder="123" maxLength={4} className="h-11 border-slate-200 focus:ring-primary-500" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || !acceptLoaded}
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white h-14 text-lg font-bold shadow-xl shadow-primary-200 transition-all active:scale-[0.98]"
                    >
                      {loading ? (
                        <>
                          <Loader className="mr-3 h-6 w-6 animate-spin" />
                          Securing Order...
                        </>
                      ) : (
                        acceptLoaded ? "Complete Subscription" : "Loading Payment System..."
                      )}
                    </Button>
                    <p className="text-center text-slate-400 text-xs mt-4">
                      Your payment information is encrypted and processed securely via Authorize.Net
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
