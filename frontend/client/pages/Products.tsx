import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { paymentsAPI, Product } from "@/api/payments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { CreditCard, Loader, ShoppingBag } from "lucide-react";

declare global {
  interface Window {
    Accept: any;
  }
}

export default function Products() {
  const [amount, setAmount] = useState<string>("99.99");
  const [descriptor, setDescriptor] = useState<string>("Test Payment");
  const [loading, setLoading] = useState(false);
  const [acceptLoaded, setAcceptLoaded] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    // Check if Accept.js is loaded
    const checkAccept = () => {
      if (window.Accept) {
        setAcceptLoaded(true);
      }
    };
    checkAccept();
    const timer = setTimeout(checkAccept, 500);

    // Fetch Products
    const fetchProducts = async () => {
      try {
        const data = await paymentsAPI.getProducts();
        setProducts(data);
      } catch (error) {
        toast.error("Failed to load products");
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();

    return () => clearTimeout(timer);
  }, []);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptLoaded) {
      toast.error("Payment system not loaded. Please refresh the page.");
      return;
    }

    if (!window.Accept) {
      toast.error("Accept.js not available");
      return;
    }

    setLoading(true);

    const authData = {
      clientKey: import.meta.env.VITE_AUTHORIZENET_CLIENT_KEY,
      apiLoginID: import.meta.env.VITE_AUTHORIZENET_LOGIN_ID,
    };

    const cardData = {
      cardNumber: (document.getElementById('cardNumber') as HTMLInputElement).value.replace(/\s+/g, '').replace(/-/g, ''),
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

        const apiResponse = await paymentsAPI.charge({
          amount: parseFloat(amount),
          nonce: nonce,
          descriptor,
        });

        if (apiResponse.status === "success") {
          toast.success(`Payment successful! Transaction ID: ${apiResponse.transaction_id}`);
          setAmount("99.99");
          setDescriptor("Test Payment");
          // Clear form fields
          (document.getElementById('cardNumber') as HTMLInputElement).value = '';
          (document.getElementById('expMonth') as HTMLInputElement).value = '';
          (document.getElementById('expYear') as HTMLInputElement).value = '';
          (document.getElementById('cardCode') as HTMLInputElement).value = '';
        } else {
          toast.error(apiResponse.message || "Payment failed");
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Payment processing failed");
      } finally {
        setLoading(false);
      }
    });
  };

  const selectProduct = (product: Product) => {
    setAmount(product.price);
    setDescriptor(`Purchase: ${product.name}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.info(`Selected: ${product.name}`);
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Make a Payment
          </h1>
          <p className="text-muted-foreground">
            Select a product below or enter a custom amount.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-1 lg:border-r border-border lg:pr-6 order-2 lg:order-1 lg:sticky lg:top-8 h-fit">
            <Card className="border-border bg-background shadow-lg">
              <CardHeader>
                <CardTitle className="text-foreground">Checkout</CardTitle>
                <CardDescription>Securely process your payment</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePayment} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-foreground">Amount (USD)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        className="pl-8"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber" className="text-foreground">Card Number</Label>
                    <Input id="cardNumber" placeholder="0000 0000 0000 0000" maxLength={19} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expMonth" className="text-foreground">Month</Label>
                      <Input id="expMonth" placeholder="MM" maxLength={2} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expYear" className="text-foreground">Year</Label>
                      <Input id="expYear" placeholder="YY" maxLength={2} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardCode" className="text-foreground">CVV</Label>
                      <Input id="cardCode" placeholder="123" maxLength={4} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descriptor" className="text-foreground">Description</Label>
                    <Input
                      id="descriptor"
                      value={descriptor}
                      onChange={(e) => setDescriptor(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={loading || !acceptLoaded} className="w-full bg-indigo-600 hover:bg-indigo-700">
                    {loading ? <Loader className="animate-spin mr-2 h-4 w-4" /> : <CreditCard className="mr-2 h-4 w-4" />}
                    Pay Now
                  </Button>
                </form>
              </CardContent>
            </Card>
            {/* Mobile/Tablet View duplicate form skipped for brevity, assumed responsive layout handles stack */}
          </div>

          {/* Product Grid */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <h2 className="text-xl font-semibold mb-4 text-foreground flex items-center">
              <ShoppingBag className="mr-2 h-5 w-5 text-indigo-500" />
              Available Products
            </h2>

            {loadingProducts ? (
              <div className="flex justify-center p-12">
                <Loader className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="cursor-pointer hover:shadow-lg hover:border-indigo-500 transition-all group" onClick={() => selectProduct(product)}>
                    <div className="aspect-video w-full overflow-hidden rounded-t-xl bg-gray-100 relative">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                      )}
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-sm font-bold text-indigo-600 shadow-sm">
                        ${product.price}
                      </div>
                    </div>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                      <Button variant="outline" className="w-full mt-4 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-200">
                        Select
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Fallback Manual Form for Mobile (if needed) or simple layout adjustments */}
          </div>



        </div>
      </div>
    </Layout>
  );
}
