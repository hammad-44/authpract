from django.contrib import admin
from .models import Product,Subscription,SubscriptionPayment,SubscriptionPlan, CustomerProfile,Transaction
# Register your models here.
admin.site.register(Product)
admin.site.register(Subscription)
admin.site.register(SubscriptionPayment)
admin.site.register(SubscriptionPlan)
admin.site.register(CustomerProfile)
admin.site.register(Transaction)