from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentView, TransactionViewSet, SubscriptionViewSet, register, ProductViewSet, SubscriptionPlanViewSet
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

router = DefaultRouter()
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'subscriptions', SubscriptionViewSet, basename='subscription')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'plans', SubscriptionPlanViewSet, basename='plan')

urlpatterns = [
    path('', include(router.urls)),
    path('charge/', PaymentView.as_view(), name='payment-charge'),
    path('register/', register, name='register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
