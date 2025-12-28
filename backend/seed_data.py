from payments.models import Product, SubscriptionPlan

# Clear existing data to avoid duplicates (optional, strictly for dev)
Product.objects.all().delete()
SubscriptionPlan.objects.all().delete()

# --- Seed Products ---
products = [
    {
        "name": "Developer Starter Kit",
        "description": "Essential tools for starting your dev journey. Includes IDE config and basic assets.",
        "price": 9.99,
        "image": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80"
    },
    {
        "name": "Pro API Access License",
        "description": "Commercial license for using our API in production environments.",
        "price": 49.99,
        "image": "https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&w=800&q=80"
    },
    {
        "name": "Enterprise Dashboard Theme",
        "description": "Premium dark-mode enabled dashboard template with 50+ components.",
        "price": 99.99,
        "image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
    },
    {
        "name": "Consultation Session",
        "description": "1-hour video consultation with a senior solutions architect.",
        "price": 199.99,
        "image": "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80"
    }
]

for p_data in products:
    Product.objects.create(**p_data)
    print(f"Created Product: {p_data['name']}")

# --- Seed Subscription Plans ---
plans = [
    {
        "name": "Basic",
        "description": "Perfect for freelancers and hobbyists.",
        "amount": 9.99,
        "interval_length": 1,
        "interval_unit": "months",
        "features": ["1 User", "Basic Analytics", "Community Support", "5 Projects"]
    },
    {
        "name": "Pro",
        "description": "For growing teams and businesses.",
        "amount": 29.99,
        "interval_length": 1,
        "interval_unit": "months",
        "features": ["5 Users", "Advanced Analytics", "Priority Support", "Unlimited Projects", "API Access"]
    },
    {
        "name": "Enterprise",
        "description": "Full-scale solution for large organizations.",
        "amount": 99.99,
        "interval_length": 1,
        "interval_unit": "months",
        "features": ["Unlimited Users", "Custom Reporting", "24/7 Dedicated Support", "SLA", "On-premise Deployment"]
    },
    {
        "name": "Annual Saver",
        "description": "Get 2 months free with annual billing.",
        "amount": 299.99,
        "interval_length": 12,
        "interval_unit": "months",
        "features": ["All Pro Features", "Annual Billing", "Discounted Rate"]
    }
]

for plan_data in plans:
    SubscriptionPlan.objects.create(**plan_data)
    print(f"Created Plan: {plan_data['name']}")

print("Seeding Complete!")
