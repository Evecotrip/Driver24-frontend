// Simple state management for JWT token and user data

export interface UserData {
  id: string;
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  profileImageUrl?: string;
  role: 'USER' | 'DRIVER' | 'ADMIN' | null;
  city: string | null;
}

class Store {
  private token: string | null = null;
  private userData: UserData | null = null;

  // Initialize from localStorage
  init() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('jwt_token');
      const userDataStr = localStorage.getItem('user_data');
      if (userDataStr) {
        this.userData = JSON.parse(userDataStr);
      }
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('jwt_token', token);
    }
  }

  getToken(): string | null {
    return this.token;
  }

  setUserData(data: UserData) {
    this.userData = data;
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_data', JSON.stringify(data));
    }
  }

  getUserData(): UserData | null {
    return this.userData;
  }

  clear() {
    this.token = null;
    this.userData = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_data');
    }
  }
}

export const store = new Store();
