from rest_framework import serializers
from .models import Transaction, Subscription, SubscriptionPayment, Product, SubscriptionPlan

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ('transaction_id', 'status', 'response_code', 'response_text', 'user')

class CreatePaymentSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    nonce = serializers.CharField(max_length=500, help_text="Accept.js Opaque Data Value")
    descriptor = serializers.CharField(max_length=255, required=False)

class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = '__all__'
        read_only_fields = ('subscription_id', 'status', 'user')

class CreateSubscriptionSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    interval_length = serializers.IntegerField(min_value=1)
    interval_unit = serializers.ChoiceField(choices=[('months', 'Months'), ('days', 'Days')])
    nonce = serializers.CharField(max_length=500, help_text="Accept.js Opaque Data Value (required for new profile)")
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=50)
    last_name = serializers.CharField(max_length=50)

class UpdateSubscriptionSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'
