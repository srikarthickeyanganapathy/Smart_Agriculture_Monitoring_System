import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAlerts } from '../context/AlertsContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAlerts();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate('/analytics');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!credentials.email || !credentials.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        username: credentials.email, 
        password: credentials.password
      });

      const { token } = response.data;
      
      login(token); // Update context state
      localStorage.setItem('user', credentials.email);

      navigate('/analytics');

    } catch (err) {
      console.error("Login failed:", err);
      if (err.response && err.response.status === 401) {
        setError('Invalid email or password.');
      } else {
        setError('Server error. Is the Java backend running?');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4">
      <div className="bg-white border border-gray-200 rounded-3xl p-12 w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-500">
            Sign in to access your analytics dashboard
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-600 text-sm flex items-center gap-3 animate-pulse">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Email Input */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Email Address / Username
            </label>
            <input
              type="text" // Changed to text to allow simple usernames if needed
              name="email"
              value={credentials.email}
              onChange={handleChange}
              placeholder="admin"
              className="border border-gray-300 rounded-xl px-4 py-3.5 text-base 
                       focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                       transition-all duration-200"
            />
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="border border-gray-300 rounded-xl px-4 py-3.5 text-base 
                       focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                       transition-all duration-200"
            />
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-green-600 rounded"
              />
              <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                Remember me
              </label>
            </div>
            <a href="#" className="text-sm font-medium text-green-600 hover:text-green-700 transition-colors">
              Forgot password?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white py-4 rounded-full font-semibold text-base
                       hover:bg-green-700 hover:scale-[1.02] active:scale-95 transition-all duration-300 
                       disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl
                       mt-2 flex justify-center items-center"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Authenticating...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer / Request Access */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">Don't have an account?</span>
          </div>
        </div>

        {/* Contact Admin Button (Since manual registration only) */}
        <a 
          href="mailto:admin@sams-project.com?subject=Request Access to SAMS" 
          className="block text-center py-3.5 border-2 border-gray-300 rounded-full font-semibold text-gray-700 hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-all duration-300"
        >
          Request Access from Admin
        </a>
      </div>
    </div>
  );
};

export default Login;