// API utility functions for backend communication

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
  pagination?: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Role selection
export async function selectRole(clerkId: string, role: 'USER' | 'DRIVER', city: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/select-role`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clerkId, role, city }),
  });
  return response.json() as Promise<ApiResponse<{ user: any; token: string }>>;
}

// Get user profile by clerkId (no auth required - used during role selection)
// Returns user data and JWT token if user has a role
export async function getUserByClerkId(clerkId: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/profile?clerkId=${clerkId}`);
  return response.json() as Promise<ApiResponse<{
    user: {
      id: string;
      clerkId: string;
      email: string;
      firstName?: string;
      lastName?: string;
      username?: string;
      profileImageUrl?: string;
      role: 'USER' | 'DRIVER' | 'ADMIN' | null;
      city?: string | null;
    };
    token: string | null;
  }>>;
}

// Driver endpoints
export async function createDriverProfile(token: string, data: any) {
  const response = await fetch(`${API_BASE_URL}/api/drivers/profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return response.json() as Promise<ApiResponse>;
}

export async function getMyDriverProfile(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/drivers/profile/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json() as Promise<ApiResponse>;
}

export async function updateAvailability(token: string, availability: boolean) {
  const response = await fetch(`${API_BASE_URL}/api/drivers/availability`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ availability }),
  });
  return response.json() as Promise<ApiResponse>;
}

export async function getDriversByCity(
  token: string, 
  city: string, 
  options?: {
    page?: number;
    limit?: number;
    minSalary?: number;
    maxSalary?: number;
    minExperience?: number;
    maxExperience?: number;
  }
) {
  const params = new URLSearchParams();
  if (options?.page) params.append('page', String(options.page));
  if (options?.limit) params.append('limit', String(options.limit));
  if (options?.minSalary) params.append('minSalary', String(options.minSalary));
  if (options?.maxSalary) params.append('maxSalary', String(options.maxSalary));
  if (options?.minExperience) params.append('minExperience', String(options.minExperience));
  if (options?.maxExperience) params.append('maxExperience', String(options.maxExperience));

  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/drivers/city/${encodeURIComponent(city)}${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json() as Promise<ApiResponse>;
}

// Admin endpoints
export async function getAllDrivers(token: string, filters?: { verified?: boolean; city?: string }) {
  const params = new URLSearchParams();
  if (filters?.verified !== undefined) params.append('verified', String(filters.verified));
  if (filters?.city) params.append('city', filters.city);
  
  const response = await fetch(`${API_BASE_URL}/api/drivers/all?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json() as Promise<ApiResponse>;
}

export async function verifyDriver(token: string, driverId: string) {
  const response = await fetch(`${API_BASE_URL}/api/drivers/${driverId}/verify`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json() as Promise<ApiResponse>;
}

export async function getPendingDrivers(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/drivers/pending`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json() as Promise<ApiResponse>;
}

export async function getVerifiedDrivers(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/drivers/verified`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json() as Promise<ApiResponse>;
}

export async function bulkVerifyDrivers(token: string, driverIds: string[]) {
  const response = await fetch(`${API_BASE_URL}/api/drivers/bulk-verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ driverIds }),
  });
  return response.json() as Promise<ApiResponse>;
}

// Booking endpoints
export async function createBooking(token: string, data: {
  driverId: string;
  pickupLocation?: string;
  dropLocation?: string;
  scheduledDate?: string;
  notes?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return response.json() as Promise<ApiResponse>;
}

export async function getUserBookings(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/bookings/my-bookings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json() as Promise<ApiResponse>;
}

export async function getDriverBookings(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/bookings/driver-requests`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json() as Promise<ApiResponse>;
}

export async function respondToBooking(token: string, bookingId: string, status: 'ACCEPTED' | 'REJECTED', driverResponse?: string) {
  const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/respond`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status, driverResponse }),
  });
  return response.json() as Promise<ApiResponse>;
}

export async function cancelBooking(token: string, bookingId: string) {
  const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/cancel`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json() as Promise<ApiResponse>;
}

export async function getDriverFullInfo(token: string, driverId: string) {
  const response = await fetch(`${API_BASE_URL}/api/bookings/driver/${driverId}/full-info`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json() as Promise<ApiResponse>;
}

// ============================================
// ADMIN ANALYTICS APIs
// ============================================

export async function getDashboardOverview(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/overview`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json() as Promise<ApiResponse>;
}

export async function getBookingAnalytics(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/admin/analytics/bookings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json() as Promise<ApiResponse>;
}

export async function getUserAnalytics(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/admin/analytics/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json() as Promise<ApiResponse>;
}

export async function getDriverAnalytics(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/admin/analytics/drivers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json() as Promise<ApiResponse>;
}

export async function getAllBookings(token: string, params?: {
  page?: number;
  limit?: number;
  status?: string;
  driverId?: string;
  userId?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.status) queryParams.append('status', params.status);
  if (params?.driverId) queryParams.append('driverId', params.driverId);
  if (params?.userId) queryParams.append('userId', params.userId);

  const response = await fetch(`${API_BASE_URL}/api/admin/bookings?${queryParams}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json() as Promise<ApiResponse>;
}

export async function getDriverBookingHistory(token: string, driverId: string) {
  const response = await fetch(`${API_BASE_URL}/api/admin/bookings/driver/${driverId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json() as Promise<ApiResponse>;
}

export async function getUserBookingHistory(token: string, userId: string) {
  const response = await fetch(`${API_BASE_URL}/api/admin/bookings/user/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json() as Promise<ApiResponse>;
}
