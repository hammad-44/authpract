# Backend Payment Implementation Guide (Server-to-Server / AIM)

This guide documents how to implement a direct **Server-to-Server** payment system using Django and Authorize.Net (also known as AIM - Advanced Integration Method).

> [!CAUTION]
> **PCI Compliance Warning**
> In this implementation, your server handles **raw credit card numbers**.
> *   You **destructively** increase your PCI compliance scope (SAQ D).
> *   You must ensure your server uses TLS 1.2+ (HTTPS).
> *   You must **never** log the card number or CVV.
> *   You should never store the card number or CVV in your database (except for the last 4 digits for display).

---

## 1. Architecture Overview

**Goal**: Process payments by sending credit card details directly from your server to Authorize.Net.

**Flow**:
1.  **Client**: Sends raw card details (Number, Expiry, CVV) to your Backend API.
2.  **Backend**: Receives the data (HTTPS encrypted).
3.  **Backend Service**: Constructs an XML/JSON request with the card data.
4.  **Authorize.Net**: Processes the transaction and returns a response.
5.  **Backend**: Discards the sensitive card data immediately after the request.

---

## 2. Service Layer Implementation

This is the core helper class (`services.py`) that communicates with Authorize.Net.

### Complete `services.py` Source Code

```python
from django.conf import settings
import requests
import json
import logging

logger = logging.getLogger(__name__)

class AuthorizeNetService:
    def __init__(self):
        self.api_login_id = settings.AUTHORIZENET_API_LOGIN_ID
        self.transaction_key = settings.AUTHORIZENET_TRANSACTION_KEY
        self.environment = settings.AUTHORIZENET_ENVIRONMENT
        
        if self.environment == 'production':
            self.api_url = "https://api2.authorize.net/xml/v1/request.api"
        else:
            self.api_url = "https://apitest.authorize.net/xml/v1/request.api"

    def _get_base_request(self):
        return {
            "merchantAuthentication": {
                "name": self.api_login_id,
                "transactionKey": self.transaction_key
            }
        }

    def _send_request(self, data):
        headers = {'Content-Type': 'application/json'}
        try:
            response = requests.post(self.api_url, data=json.dumps(data), headers=headers)
            response.raise_for_status()
            # The API returns a byte string with BOM sometimes, strip it
            content = response.text.lstrip('\ufeff')
            return json.loads(content)
        except Exception as e:
            logger.error(f"Authorize.Net API Error: {str(e)}")
            return None

    def create_transaction(self, amount, nonce, descriptor=None):
        req = {
            "createTransactionRequest": {
                **self._get_base_request(),
                "transactionRequest": {
                    "transactionType": "authCaptureTransaction",
                    "amount": str(amount),
                    "payment": {
                        "opaqueData": {
                            "dataDescriptor": "COMMON.ACCEPT.INAPP.PAYMENT",
                            "dataValue": nonce
                        }
                    },
                    "order": {
                        "description": descriptor or "Payment Transaction"
                    }
                }
            }
        }
        return self._send_request(req)

    def create_customer_profile(self, email, nonce=None, **kwargs):
        if 'merchant_customer_id' in kwargs:
             merchant_customer_id = kwargs['merchant_customer_id']
        else:
             # Fallback or generate random if not provided, ensuring max 20 chars
             import uuid
             merchant_customer_id = str(uuid.uuid4())[:20]

        profile = {
            "merchantCustomerId": merchant_customer_id,
            "email": email
        }

        if nonce:
            profile["paymentProfiles"] = {
                "customerType": "individual",
                "billTo": {
                    "firstName": kwargs.get('first_name', ''),
                    "lastName": kwargs.get('last_name', '')
                },
                "payment": {
                    "opaqueData": {
                        "dataDescriptor": "COMMON.ACCEPT.INAPP.PAYMENT",
                        "dataValue": nonce
                    }
                }
            }

        req = {
            "createCustomerProfileRequest": {
                **self._get_base_request(),
                "profile": profile,
                "validationMode": "testMode" if self.environment != 'production' else "liveMode"
            }
        }
        return self._send_request(req)

    def create_customer_payment_profile(self, customer_profile_id, nonce, **kwargs):
        req = {
            "createCustomerPaymentProfileRequest": {
                **self._get_base_request(),
                "customerProfileId": customer_profile_id,
                "paymentProfile": {
                    "billTo": {
                        "firstName": kwargs.get('first_name', ''),
                        "lastName": kwargs.get('last_name', '')
                    },
                    "payment": {
                        "opaqueData": {
                            "dataDescriptor": "COMMON.ACCEPT.INAPP.PAYMENT",
                            "dataValue": nonce
                        }
                    },
                    "defaultPaymentProfile": True
                },
                "validationMode": "testMode" if self.environment != 'production' else "liveMode"
            }
        }
        return self._send_request(req)

    def create_subscription(self, name, amount, interval_length, interval_unit, start_date, customer_profile_id, customer_payment_profile_id):
        req = {
            "ARBCreateSubscriptionRequest": {
                **self._get_base_request(),
                "subscription": {
                    "name": name,
                    "paymentSchedule": {
                        "interval": {
                            "length": str(interval_length),
                            "unit": interval_unit
                        },
                        "startDate": start_date,
                        "totalOccurrences": "9999"
                    },
                    "amount": str(amount),
                    "profile": {
                        "customerProfileId": customer_profile_id,
                        "customerPaymentProfileId": customer_payment_profile_id
                    }
                }
            }
        }
        return self._send_request(req)

    def cancel_subscription(self, subscription_id):
        req = {
            "ARBCancelSubscriptionRequest": {
                **self._get_base_request(),
                "subscriptionId": subscription_id
            }
        }
        return self._send_request(req)

    def get_subscription_status(self, subscription_id):
         req = {
            "ARBGetSubscriptionStatusRequest": {
                **self._get_base_request(),
                "subscriptionId": subscription_id
            }
        }
         return self._send_request(req)
```

---

## 3. API View Implementation (`views.py`)

Your Django Views will now receive raw data from the frontend.

```python
class PaymentView(APIView):
    def post(self, request):
        # 1. Extract Raw Data
        amount = request.data.get('amount')
        card_number = request.data.get('cardNumber')
        exp_date = request.data.get('expDate') # e.g. "2025-12"
        cvv = request.data.get('cvv')

        # 2. Call Service
        service = AuthorizeNetService()
        response = service.create_transaction(amount, card_number, exp_date, cvv)

        # 3. Handle Response
        if response and response['messages']['resultCode'] == "Ok":
            t_response = response['transactionResponse']
            if 'messages' in t_response:
                # Success - Save Transaction ID only!
                # DO NOT SAVE CARD NUMBER
                Transaction.objects.create(
                    user=request.user,
                    transaction_id=t_response['transId'],
                    amount=amount,
                    status='authorized'
                )
                return Response({"status": "success", "id": t_response['transId']})
        
        return Response({"status": "error", "message": "Payment failed"})
```

---

## 4. Helper: Sending the Request
All methods use this helper to send the JSON payload.

```python
    def _send_request(self, data):
        headers = {'Content-Type': 'application/json'}
        try:
            # 1. Send POST request
            response = requests.post(self.api_url, data=json.dumps(data), headers=headers)
            response.raise_for_status()
            
            # 2. Strip BOM (Byte Order Mark) if present
            content = response.text.lstrip('\ufeff')
            
            # 3. Parse JSON
            return json.loads(content)
        except Exception as e:
            # Log error but verify you aren't logging sensitive data in 'data'
            print(f"Authorize.Net API Error: {str(e)}")
            return None
```
