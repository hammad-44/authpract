import axios, { AxiosInstance, AxiosError } from "axios";
import { getAccessToken, setTokens, clearTokens } from "@/utils/auth";

const API_BASE_URL = "/api/payments";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
}

export interface ChargeRequest {
  amount: number;
  nonce: string;
  descriptor?: string;
}

export interface ChargeResponse {
  status: "success" | "error";
  transaction_id?: string;
  message: string;
}

export interface Transaction {
  id: number;
  transaction_id: string;
  amount: number;
  status: "authorized" | "captured" | "failed";
  created_at: string;
}

export interface TransactionsResponse {
  results: Transaction[];
}

export interface SubscriptionRequest {
  name: string;
  amount: number;
  interval_length: number;
  interval_unit: "days" | "months";
  nonce: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  interval_length: number;
  interval_unit: "days" | "months";
  status: string;
  created_at: string;
}

export interface SubscriptionsResponse {
  results: Subscription[];
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  image: string;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  amount: string;
  interval_length: number;
  interval_unit: "days" | "months";
  features: string[];
}

export interface ProductsResponse {
  results: Product[];
}

export interface PlansResponse {
  results: SubscriptionPlan[];
}

class PaymentsAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor: Add JWT token to headers
    this.client.interceptors.request.use((config) => {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor: Handle token errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          clearTokens();
          // window.location.href = "/login"; // Temporarily disabled for debugging
        }
        return Promise.reject(error);
      },
    );
  }

  // Authentication
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>(
      "/token/",
      credentials,
    );
    if (response.data.access && response.data.refresh) {
      setTokens(response.data.access, response.data.refresh);
    }
    return response.data;
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await this.client.post<RegisterResponse>(
      "/register/",
      data,
    );
    return response.data;
  }

  // Payments
  async charge(data: ChargeRequest): Promise<ChargeResponse> {
    const response = await this.client.post<ChargeResponse>("/charge/", data);
    return response.data;
  }

  async getTransactions(): Promise<Transaction[]> {
    const response = await this.client.get<Transaction[]>("/transactions/");
    return response.data;
  }

  async getProducts(): Promise<Product[]> {
    const response = await this.client.get<Product[]>("/products/");
    return response.data; // ViewSet returns list directly or paginated. Assuming simple list for now or DRF default
  }

  // Subscriptions
  async createSubscription(data: SubscriptionRequest): Promise<Subscription> {
    const response = await this.client.post<Subscription>(
      "/subscriptions/",
      data,
    );
    return response.data;
  }

  async getSubscriptions(): Promise<Subscription[]> {
    const response = await this.client.get<Subscription[]>("/subscriptions/");
    return response.data;
  }

  async getPlans(): Promise<SubscriptionPlan[]> {
    const response = await this.client.get<SubscriptionPlan[]>("/plans/");
    return response.data;
  }

  async cancelSubscription(id: string): Promise<void> {
    await this.client.delete(`/subscriptions/${id}/`);
  }
}

export const paymentsAPI = new PaymentsAPI();
