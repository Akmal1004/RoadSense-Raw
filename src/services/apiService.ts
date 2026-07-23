import { Platform } from "react-native";
import { UserProfile, AuthCredentials, RegisterData, ResetPasswordData } from "../types/auth";

// Choose local server host based on platform (Web/iOS use localhost, Android emulator uses 10.0.2.2)
const API_BASE_URL = Platform.select({
  android: "http://10.0.2.2:5000/api",
  default: "http://localhost:5000/api"
});

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout for fast fallback

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {})
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Check backend server health
  async checkHealth(): Promise<boolean> {
    try {
      const data = await this.request<{ status: string }>("/health");
      return data.status === "ok";
    } catch {
      return false;
    }
  }

  // Auth Operations
  async register(data: RegisterData): Promise<{ user: UserProfile }> {
    return this.request<{ user: UserProfile }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  async login(credentials: AuthCredentials): Promise<{ user: UserProfile }> {
    return this.request<{ user: UserProfile }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials)
    });
  }

  async requestResetCode(email: string): Promise<{ code: string }> {
    return this.request<{ code: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  }

  async resetPassword(data: ResetPasswordData): Promise<{ message: string }> {
    return this.request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  // User Operations
  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<{ user: UserProfile }> {
    return this.request<{ user: UserProfile }>(`/user/profile/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  }

  async fetchTripStats(userId: string): Promise<any> {
    const data = await this.request<{ stats: any }>(`/stats/${userId}`);
    return data.stats;
  }

  // Trip History
  async saveTripHistory(userId: string, tripData: any): Promise<void> {
    await this.request("/trips/history", {
      method: "POST",
      body: JSON.stringify({ userId, ...tripData })
    });
  }

  async fetchTripHistory(userId: string): Promise<any[]> {
    const data = await this.request<{ trips: any[] }>(`/trips/history/${userId}`);
    return data.trips;
  }

  // Chat History
  async fetchChatHistory(userId: string): Promise<any[]> {
    const data = await this.request<{ messages: any[] }>(`/chat/history/${userId}`);
    return data.messages;
  }

  async saveChatMessage(userId: string, role: string, content: string, timestamp?: number): Promise<void> {
    await this.request("/chat/history", {
      method: "POST",
      body: JSON.stringify({ userId, role, content, timestamp })
    });
  }

  async clearChatHistory(userId: string): Promise<void> {
    await this.request(`/chat/history/${userId}`, {
      method: "DELETE"
    });
  }
}

export const apiService = new ApiService();
