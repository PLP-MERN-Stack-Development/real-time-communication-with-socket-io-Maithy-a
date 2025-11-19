import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authAPI = {
    register: (username, email, password) =>
        apiClient.post('/auth/auth/register', { username, email, password }),

    login: (email, password) =>
        apiClient.post('/auth/auth/login', { email, password }),

    logout: () =>
        apiClient.post('/auth/auth/logout'),

    getMe: () =>
        apiClient.get('/auth/auth/me')
};

export const userAPI = {
    getAll: () =>
        apiClient.get('/api/users/all'),

    getUser: (id) =>
        apiClient.get(`/api/users/${id}`),

    updateUser: (id, data) =>
        apiClient.put(`/api/users/${id}`, data)
};

export const roomAPI = {
    create: (name, type, description) =>
        apiClient.post('/api/rooms', { name, type, description }),

    getAll: () =>
        apiClient.get('/api/rooms'),

    getRoom: (id) =>
        apiClient.get(`/api/rooms/${id}`),

    join: (id) =>
        apiClient.post(`/api/rooms/join/${id}/join`),

    leave: (id) =>
        apiClient.post(`/api/rooms/${id}/leave`),

    getMessages: (id, page = 1, limit = 50) =>
        apiClient.get(`/api/rooms/${id}/messages`, { params: { page, limit } })
};

export const messageAPI = {
    create: (text, receiverId, roomId, file) =>
        apiClient.post('/api/messages', { text, receiverId, roomId, file }),

    search: (query, roomId) =>
        apiClient.get('/api/messages/search', { params: { query, roomId } }),

    markRead: (id) =>
        apiClient.put(`/api/messages/${id}/read`),

    addReaction: (id, emoji) =>
        apiClient.post(`/api/messages/${id}/reaction`, { emoji }),

    getPrivate: (userId, page = 1, limit = 50) =>
        apiClient.get(`/api/messages/private/${userId}`, { params: { page, limit } })
};

export const fileAPI = {
    upload: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post('/api/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};

export default apiClient;