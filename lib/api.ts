const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api';

// ── Types ──────────────────────────────────────────────────
export interface Room {
    catalog_id: string;
    room_id: string;
    room_name: string;
    capacity: number;
    location: string;
    amenities: string;
    status: string;
    floor_no: number;
    room_number: string;
    availability: string;
    image_url?: string;
    image_urls?: string[];
}

export interface Booking {
    booking_id: string;
    catalog_id: string;
    room_id: string;
    uid: string;
    start_date: string;
    end_date: string;
    start_time: string;
    end_time: string;
    purpose: string;
    status: string;
    selected_slots?: string;
    selected_dates?: string;
    room_name?: string;
    location?: string;
    floor_no?: number;
    user_name?: string;
    email?: string;
}

export interface User {
    uid: string;
    name: string;
    email: string;
    dept: string;
    phone_no: string;
    userrole_id: string;
}

export interface Cancellation {
    cancel_id: string;
    booking_id: string;
    uid: string;
    cancel_reason: string;
    cancel_date: string;
    cancel_fromdate?: string;
    cancel_todate?: string;
    cancel_fromtime?: string;
    cancel_totime?: string;
    cancelled_by_uid: string;
    cancelled_by_name?: string;
    user_name?: string;
    room_name?: string;
}

export interface Notification {
    _id: string;
    uid: string;
    title: string;
    message: string;
    type: 'booking' | 'system' | 'reminder';
    isRead: boolean;
    booking_id?: string;
    createdAt: string;
}

// ── Helpers ────────────────────────────────────────────────
export const getAdminToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('admin_token');
};

export const getAdminUser = (): User | null => {
    if (typeof window === 'undefined') return null;
    const u = localStorage.getItem('admin_user');
    return u ? JSON.parse(u) : null;
};

const authHeaders = (): HeadersInit => ({
    'Content-Type': 'application/json',
    ...(getAdminToken() ? { Authorization: `Bearer ${getAdminToken()}` } : {}),
});

// ── Auth ───────────────────────────────────────────────────
export const loginAdmin = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    }).catch(err => {
        console.error('Fetch error:', err);
        throw new Error('Could not connect to backend server. Please ensure the backend is running at http://127.0.0.1:5000');
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Login failed');
    }
    const data = await res.json();
    localStorage.setItem('admin_token', data.token);
    localStorage.setItem('admin_user', JSON.stringify(data.user));
    return data;
};

export const logoutAdmin = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
};

// ── Rooms ──────────────────────────────────────────────────
export const fetchRooms = async (): Promise<Room[]> => {
    const res = await fetch(`${API_URL}/rooms`);
    if (!res.ok) throw new Error('Failed to fetch rooms');
    return res.json();
};

export const createRoom = async (data: Partial<Room>): Promise<{ message: string }> => {
    const res = await fetch(`${API_URL}/rooms`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create room');
    }
    return res.json();
};

export const deleteRoom = async (catalog_id: string, room_id: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_URL}/rooms/${catalog_id}/${room_id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete room');
    }
    return res.json();
};

export const uploadRoomImages = async (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    const res = await fetch(`${API_URL}/rooms/upload-images`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to upload images');
    }
    return res.json();
};

export const updateRoom = async (catalog_id: string, room_id: string, data: Partial<Room>): Promise<{ message: string }> => {
    const res = await fetch(`${API_URL}/rooms/${catalog_id}/${room_id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update room');
    }
    return res.json();
};

// ── Bookings ───────────────────────────────────────────────
export const fetchAllBookings = async (): Promise<Booking[]> => {
    const res = await fetch(`${API_URL}/bookings`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch bookings');
    return res.json();
};

export const updateBookingStatus = async (
    booking_id: string,
    status: 'confirmed' | 'rejected'
): Promise<{ message: string }> => {
    const res = await fetch(`${API_URL}/bookings/${booking_id}/status`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status }),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update booking status');
    }
    return res.json();
};

export const deleteBooking = async (booking_id: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_URL}/bookings/${booking_id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete booking');
    }
    return res.json();
};

export const cancelBooking = async (
    booking_id: string,
    uid: string,
    reason: string = 'Admin cancelled booking',
    options?: {
        partial?: boolean;
        slots?: { from: string; to: string }[];
        dates?: string[];
        cancel_fromtime?: string;
        cancel_totime?: string;
    }
): Promise<{ message: string }> => {
    const cancel_date = new Date().toISOString().slice(0, 10);
    const res = await fetch(`${API_URL}/cancellations`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
            booking_id,
            cancelled_by_uid: uid,
            cancel_date,
            cancel_reason: reason,
            partial: options?.partial || false,
            slots: options?.slots || [],
            dates: options?.dates || [],
            cancel_fromtime: options?.cancel_fromtime || null,
            cancel_totime: options?.cancel_totime || null,
        }),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to cancel booking');
    }
    return res.json();
};

// ── Users ──────────────────────────────────────────────────
export const fetchAllUsers = async (): Promise<User[]> => {
    const res = await fetch(`${API_URL}/users`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
};

// ── Cancellations ──────────────────────────────────────────
export const fetchCancellations = async (): Promise<Cancellation[]> => {
    const res = await fetch(`${API_URL}/cancellations`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch cancellations');
    return res.json();
};

// ── Notifications ──────────────────────────────────────────
export const fetchNotifications = async (): Promise<Notification[]> => {
    const res = await fetch(`${API_URL}/notifications`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
};

export const markNotificationAsRead = async (id: string): Promise<Notification> => {
    const res = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to mark notification as read');
    return res.json();
};

export const markAllNotificationsAsRead = async (): Promise<{ message: string }> => {
    const res = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to mark all notifications as read');
    return res.json();
};
