import axios from 'axios'

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API functions for posts
export const postsApi = {
  // Get paginated feed
  getFeed: (page = 1, limit = 10, search = '') => {
    const params = new URLSearchParams()
    if (page) params.append('page', page)
    if (limit) params.append('limit', limit)
    if (search) params.append('search', search)
    
    return api.get(`/posts?${params.toString()}`)
  },

  // Get single post
  getPost: (id) => api.get(`/posts/${id}`),

  // Create new post
  createPost: (formData) => api.post('/posts', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),

  // Update post
  updatePost: (id, data) => api.put(`/posts/${id}`, data),

  // Delete post
  deletePost: (id) => api.delete(`/posts/${id}`),

  // Toggle like
  toggleLike: (id) => api.post(`/posts/${id}/like`),

  // Add comment
  addComment: (id, content) => api.post(`/posts/${id}/comments`, { content }),

  // Delete comment
  deleteComment: (postId, commentId) => 
    api.delete(`/posts/${postId}/comments/${commentId}`),

  // Get user posts
  getUserPosts: (userId, page = 1, limit = 10) => {
    const params = new URLSearchParams()
    if (page) params.append('page', page)
    if (limit) params.append('limit', limit)
    
    return api.get(`/posts/user/${userId}?${params.toString()}`)
  },
}

// API functions for auth
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
} 