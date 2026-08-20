import axios from "axios";

const client = axios.create({
  baseURL: "/api/v1",
  withCredentials: true, // Crucial for HTTP-Only cookies (accessToken and refreshToken)
});

// Response interceptor to handle authentication or server errors globally
client.interceptors.response.use(
  (response) => response.data, // Automatically strip the outer axios response wrapper
  (error) => {
    // If the backend returns an unauthorized error, we clean up local session states
    if (error.response?.status === 401) {
      // Clear local storage and trigger a page refresh to force redirect to login
      localStorage.removeItem("isLoggedIn");
      // Optional: window.location.href = "/login";
    }
    
    // Extract error message from backend structure if present
    const backendMessage = error.response?.data?.message || "Something went wrong";
    const status = error.response?.status || 500;
    
    return Promise.reject({
      status,
      message: backendMessage,
      data: error.response?.data?.data || null,
      errors: error.response?.data?.errors || []
    });
  }
);

export default client;
