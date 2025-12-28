from rest_framework import viewsets, status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from .models import Transaction, Subscription, CustomerProfile, SubscriptionPayment, Product, SubscriptionPlan
from .serializers import (
    TransactionSerializer, CreatePaymentSerializer, 
    SubscriptionSerializer, CreateSubscriptionSerializer,
    ProductSerializer, SubscriptionPlanSerializer
)
from .services import AuthorizeNetService
from decimal import Decimal
import uuid
import datetime

User = get_user_model()

class PaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CreatePaymentSerializer(data=request.data)
        if serializer.is_valid():
            amount = serializer.validated_data['amount']
            nonce = serializer.validated_data['nonce']
            descriptor = serializer.validated_data.get('descriptor')

            service = AuthorizeNetService()
            response = service.create_transaction(amount, nonce, descriptor)

            if response and 'messages' in response:
                if response['messages']['resultCode'] == "Ok":
                    t_response = response.get('transactionResponse', {})
                    if t_response and 'messages' in t_response:
                        # Success
                        Transaction.objects.create(
                            user=request.user,
                            transaction_id=t_response.get('transId'),
                            amount=amount,
                            status='authorized',
                            response_code=t_response.get('responseCode'),
                            response_text=t_response['messages'][0].get('description')
                        )
                        return Response({
                            "status": "success",
                            "transaction_id": t_response.get('transId'),
                            "message": t_response['messages'][0].get('description')
                        }, status=status.HTTP_201_CREATED)
                    else:
                        # Failed to get transaction response
                        error_text = "Unknown error"
                        if t_response and 'errors' in t_response:
                             error_text = t_response['errors'][0].get('errorText')
                            
                        Transaction.objects.create(
                             user=request.user,
                             transaction_id="FAILED",
                             amount=amount,
                             status='failed',
                             response_text=error_text
                        )
                        return Response({"status": "error", "message": error_text}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    # Transaction Failed or Error
                    error_text = response['messages']['message'][0]['text']
                    return Response({"status": "error", "message": error_text}, status=status.HTTP_400_BAD_REQUEST)
            
            return Response({"status": "error", "message": "No response from gateway"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TransactionSerializer

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-created_at')

class SubscriptionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SubscriptionSerializer

    def get_queryset(self):
        return Subscription.objects.filter(user=self.request.user)

    def create(self, request):
        serializer = CreateSubscriptionSerializer(data=request.data)
        if serializer.is_valid():
            service = AuthorizeNetService()
            user = request.user
            
            # 1. Get or Create Customer Profile
            profile, created = CustomerProfile.objects.get_or_create(user=user)
            
            customer_payment_profile_id = None
            if created or not profile.authorize_net_profile_id:
                # Create new profile on Auth.Net
                response = service.create_customer_profile(
                    email=serializer.validated_data['email'],
                    nonce=serializer.validated_data['nonce'],
                    first_name=serializer.validated_data['first_name'],
                    last_name=serializer.validated_data['last_name']
                )
                
                if response and response['messages']['resultCode'] == "Ok":
                    profile.authorize_net_profile_id = response['customerProfileId']
                    profile.save()
                    if 'customerPaymentProfileIdList' in response:
                        customer_payment_profile_id = response['customerPaymentProfileIdList'][0]
                else:
                     details = "Unknown Error"
                     if response:
                         details = response['messages']['message'][0]['text']
                     return Response({"error": "Failed to create customer profile", "details": details}, status=400)
            else:
                # User exists. Create a new payment profile for this subscription.
                pp_response = service.create_customer_payment_profile(
                    customer_profile_id=profile.authorize_net_profile_id,
                    nonce=serializer.validated_data['nonce'],
                    first_name=serializer.validated_data['first_name'],
                    last_name=serializer.validated_data['last_name']
                )

                if pp_response and pp_response['messages']['resultCode'] == "Ok":
                     if 'customerPaymentProfileId' in pp_response:
                        customer_payment_profile_id = pp_response['customerPaymentProfileId']
                     # Sometimes it returns a validation error but still creates it or similar edge cases, 
                     # but here we rely on success.
                else:
                     details = "Unknown Error"
                     if pp_response:
                         details = pp_response['messages']['message'][0]['text']
                     # Verify if duplicate error (E00039) - then we might need to look up existing profiles, 
                     # but for now we assume a new card nonce means we want to add it.
                     return Response({"error": "Failed to create payment profile", "details": details}, status=400)


            # 2. Create Subscription
            # Ensure we have a payment profile ID. If we just created the user w/ payment, we have it.
            # If we didn't, we need to handle that.
            if not customer_payment_profile_id:
                 return Response({"error": "Payment profile logic not fully covered for existing users in this demo step"}, status=400)

            sub_response = service.create_subscription(
                name=serializer.validated_data['name'],
                amount=serializer.validated_data['amount'],
                interval_length=serializer.validated_data['interval_length'],
                interval_unit=serializer.validated_data['interval_unit'],
                start_date=datetime.date.today().isoformat(),
                customer_profile_id=profile.authorize_net_profile_id,
                customer_payment_profile_id=customer_payment_profile_id
            )

            if sub_response and sub_response['messages']['resultCode'] == "Ok":
                subscription = Subscription.objects.create(
                    user=user,
                    subscription_id=sub_response['subscriptionId'],
                    name=serializer.validated_data['name'],
                    amount=serializer.validated_data['amount'],
                    interval_length=serializer.validated_data['interval_length'],
                    interval_unit=serializer.validated_data['interval_unit'],
                    start_date=datetime.date.today(),
                    status='active'
                )
                return Response(SubscriptionSerializer(subscription).data, status=status.HTTP_201_CREATED)
            else:
                 details = "Unknown Error"
                 if sub_response:
                     details = sub_response['messages']['message'][0]['text']
                 return Response({"error": "Failed to create subscription", "details": details}, status=400)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        subscription = self.get_object()
        service = AuthorizeNetService()
        response = service.cancel_subscription(subscription.subscription_id)
        
        if response and response['messages']['resultCode'] == "Ok":
            subscription.status = 'canceled'
            subscription.save()
            return Response({"status": "Subscription canceled"})
        else:
             details = "Unknown Error"
             if response:
                 details = response['messages']['message'][0]['text']
             return Response({"error": "Failed to cancel", "details": details}, status=400)


# Simple Registration View
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email')
    
    if not username or not password:
        return Response({"error": "Username and password required"}, status=400)
    
    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already taken"}, status=400)
        
    user = User.objects.create_user(username=username, email=email, password=password)
    return Response({"message": "User created successfully"}, status=201)

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny] # Allow viewing products without login
    serializer_class = ProductSerializer
    queryset = Product.objects.all()

class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny] # Allow viewing plans without login
    serializer_class = SubscriptionPlanSerializer
    queryset = SubscriptionPlan.objects.all()
