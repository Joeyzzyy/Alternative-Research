import React, { useState, useEffect } from 'react';
import apiClient from '../../../lib/api/index.js';

const LoginModal = ({ 
  showLoginModal, 
  setShowLoginModal, 
  isLoginForm, 
  setIsLoginForm, 
  isForgotPassword, 
  setIsForgotPassword,
  onLoginSuccess,
  showNotification,
  handleGoogleLogin,
  googleLoading,
  onRegisterSuccess
}) => {
  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  
  // Register form state
  const [registerForm, setRegisterForm] = useState({
    email: '',
    code: '',
    password: '',
    confirmPassword: ''
  });
  
  // Reset password form state
  const [resetForm, setResetForm] = useState({
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Other states
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [cooldownTimer, setCooldownTimer] = useState(null);
  const [showPasswords, setShowPasswords] = useState({
    newPassword: false,
    confirmPassword: false
  });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  // 新增：注册表单密码可见性状态
  const [showRegisterPasswords, setShowRegisterPasswords] = useState({
    password: false,
    confirmPassword: false
  });

  // Clean up timer
  useEffect(() => {
    return () => {
      if (cooldownTimer) {
        clearInterval(cooldownTimer);
      }
    };
  }, [cooldownTimer]);

  // 在组件顶部添加一个调试日志，查看组件是否被多次渲染
  useEffect(() => {
    console.log('LoginModal rendered, showLoginModal:', showLoginModal);
  }, [showLoginModal]);

  // Handle login form input change
  const handleLoginInputChange = (e) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle register form input change
  const handleRegisterInputChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle reset password form input change
  const handleResetInputChange = (e) => {
    const { name, value } = e.target;
    setResetForm(prev => ({ ...prev, [name]: value }));
  };

  // Send verification code
  const sendCode = async (type) => {
    const email = type === 'reset' ? resetForm.email : registerForm.email;
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      showNotification('Please enter a valid email address', 'error');
      return;
    }
    
    try {
      setLoading(true);
      const response = await apiClient.sendEmailCode(email, type === 'reset' ? 'forgot_password' : 'register');
      
      // Handle email already exists case
      if (response && response.code === 1001) {
        showNotification('Email already exists. Please use a different email address.', 'error');
        return;
      }
      
      // Start cooldown
      setCooldown(60);
      const timer = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setCooldownTimer(timer);
      
      showNotification('Verification code sent to your email', 'success');
    } catch (error) {
      console.error("Failed to send verification code:", error);
      if (error.response && error.response.data && error.response.data.message) {
        showNotification(error.response.data.message, 'error');
      } else {
        showNotification('Failed to send verification code. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle login submit
  const handleLogin = async () => {
    try {
      setLoading(true);
      const response = await apiClient.login(loginForm.email, loginForm.password);
      
      // Check if response contains error code despite 200 status
      if (response && response.code === 1047) {
        showNotification('Password is incorrect. Please try again.', 'error');
        return;
      }
      
      if (response && response.accessToken) {
        onLoginSuccess({
          accessToken: response.accessToken,
          email: response.data.email,
          customerId: response.data.customerId
        });
      }
    } catch (error) {
      console.error("Login failed:", error);
      // Handle error response
      if (error.response && error.response.data) {
        const { code, message } = error.response.data;
        if (code === 1047) {
          showNotification('Password is incorrect. Please try again.', 'error');
        } else {
          showNotification(message || 'Login failed. Please check your credentials.', 'error');
        }
      } else {
        showNotification('Login failed. Please check your credentials.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle register submit
  const handleRegister = async () => {
    if (registerForm.password !== registerForm.confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }
    
    try {
      setLoading(true);
      const response = await apiClient.register({
        email: registerForm.email,
        password: registerForm.password,
        code: registerForm.code
      });
      
      // Modified logic: Only treat as error if code is not 200
      if (response && response.code && response.code !== 200) {
        showNotification(response.message || 'Registration failed. Please try again.', 'error');
        return;
      }
      
      // Registration successful
      showNotification('Registration successful!', 'success');
      
      // Automatically login after successful registration
      try {
        const loginResponse = await apiClient.login(registerForm.email, registerForm.password);
        
        if (loginResponse && loginResponse.accessToken) {
          // If onRegisterSuccess callback provided, use it
          if (onRegisterSuccess) {
            onRegisterSuccess({
              accessToken: loginResponse.accessToken,
              email: loginResponse.data.email,
              customerId: loginResponse.data.customerId
            });
          } 
          // Otherwise use onLoginSuccess if available
          else if (onLoginSuccess) {
            onLoginSuccess({
              accessToken: loginResponse.accessToken,
              email: loginResponse.data.email,
              customerId: loginResponse.data.customerId
            });
          }
          
          // Close login modal
          setShowLoginModal(false);
        } else {
          // If auto-login fails but registration succeeded, redirect to login form
          setIsLoginForm(true);
          showNotification('Registration successful. Please log in with your credentials.', 'success');
        }
      } catch (loginError) {
        console.error("Auto-login after registration failed:", loginError);
        // If auto-login fails but registration succeeded, redirect to login form
        setIsLoginForm(true);
        showNotification('Registration successful. Please log in with your credentials.', 'success');
      }
    } catch (error) {
      console.error("Registration failed:", error);
      if (error.response && error.response.data) {
        showNotification(error.response.data.message || 'Registration failed. Please try again.', 'error');
      } else {
        showNotification('Registration failed. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle reset password
  const handleResetPassword = async () => {
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }
    
    try {
      setLoading(true);
      const response = await apiClient.resetPassword({
        email: resetForm.email,
        code: resetForm.code,
        newPassword: resetForm.newPassword,
        confirmPassword: resetForm.confirmPassword
      });
      
      // Handle password mismatch error
      if (response && response.code === 1041) {
        showNotification(response.message || 'Passwords do not match. Please re-enter your password.', 'error');
        return;
      }
      
      showNotification('Password reset successful. Please login with your new password.', 'success');
      setIsForgotPassword(false);
      setIsLoginForm(true);
    } catch (error) {
      console.error("Password reset failed:", error);
      if (error.response && error.response.data && error.response.data.message) {
        showNotification(error.response.data.message, 'error');
      } else {
        showNotification('Password reset failed. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle between login and register forms
  const toggleForm = () => {
    setIsLoginForm(!isLoginForm);
    setIsForgotPassword(false);
  };
  
  // Show forgot password form
  const showForgotPassword = () => {
    setIsForgotPassword(true);
    setIsLoginForm(false);
  };
  
  // Back to login form
  const backToLogin = () => {
    setIsForgotPassword(false);
    setIsLoginForm(true);
  };

  // 确保模态框只渲染一次的防御性代码
  if (!showLoginModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm modal-overlay" 
         key="login-modal-overlay">
      <div className="w-full max-w-md p-8 mx-auto bg-gray-900 rounded-xl shadow-2xl modal-content border border-indigo-500/30 text-white">
        <div className="flex justify-between mb-6">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
            {isForgotPassword ? 'Reset Password' : (isLoginForm ? 'Sign In' : 'Create Account')}
          </h2>
          <button 
            onClick={() => setShowLoginModal(false)}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Login Form */}
        {isLoginForm && !isForgotPassword && (
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-300">Email</label>
              <input
                type="email"
                name="email"
                value={loginForm.email}
                onChange={handleLoginInputChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="mb-6 relative">
              <label className="block mb-2 text-sm font-medium text-gray-300">Password</label>
              <input
                type={showLoginPassword ? "text" : "password"}
                name="password"
                value={loginForm.password}
                onChange={handleLoginInputChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white pr-10"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300"
                style={{ top: '2.1rem' }}
              >
                {showLoginPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
            </div>
            <div className="flex justify-end mb-6">
              <button
                type="button"
                onClick={showForgotPassword}
                className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-md hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:scale-[1.02]"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : 'Sign In'}
            </button>

            {/* Google login button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full mt-4 px-4 py-2 text-sm font-medium text-white bg-slate-800/50 backdrop-blur-sm rounded-lg hover:bg-slate-700/60 transition-all duration-300 border border-slate-700/50 hover:border-purple-500/30 flex items-center justify-center"
            >
              {googleLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign in with Google
                </>
              )}
            </button>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={toggleForm}
                  className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Register now
                </button>
              </p>
            </div>
          </form>
        )}
        
        {/* Register Form */}
        {!isLoginForm && !isForgotPassword && (
          <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-300">Email</label>
              <div className="flex">
                <input
                  type="email"
                  name="email"
                  value={registerForm.email}
                  onChange={handleRegisterInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                  placeholder="Enter your email"
                  required
                />
                <button
                  type="button"
                  onClick={() => sendCode('register')}
                  disabled={cooldown > 0}
                  className="px-4 py-2 text-white bg-indigo-600 border border-indigo-600 rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                >
                  {cooldown > 0 ? `${cooldown}s` : 'Send'}
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-300">Verification Code</label>
              <input
                type="text"
                name="code"
                value={registerForm.code}
                onChange={handleRegisterInputChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                placeholder="Enter verification code"
                required
              />
            </div>
            <div className="mb-4 relative">
              <label className="block mb-2 text-sm font-medium text-gray-300">Password</label>
              <input
                type={showRegisterPasswords.password ? "text" : "password"}
                name="password"
                value={registerForm.password}
                onChange={handleRegisterInputChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white pr-10"
                placeholder="Create a password"
                required
              />
              <button
                type="button"
                onClick={() => setShowRegisterPasswords(prev => ({...prev, password: !prev.password}))}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300"
                style={{ top: '2.1rem' }}
              >
                {showRegisterPasswords.password ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
            </div>
            <div className="mb-6 relative">
              <label className="block mb-2 text-sm font-medium text-gray-300">Confirm Password</label>
              <input
                type={showRegisterPasswords.confirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={registerForm.confirmPassword}
                onChange={handleRegisterInputChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white pr-10"
                placeholder="Confirm your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowRegisterPasswords(prev => ({...prev, confirmPassword: !prev.confirmPassword}))}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300"
                style={{ top: '2.1rem' }}
              >
                {showRegisterPasswords.confirmPassword ? (
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-md hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:scale-[1.02]"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : 'Register'}
            </button>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={toggleForm}
                  className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Sign in
                </button>
              </p>
            </div>
          </form>
        )}
        
        {/* Forgot Password Form */}
        {isForgotPassword && (
          <form onSubmit={(e) => { e.preventDefault(); handleResetPassword(); }}>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-300">Email</label>
              <div className="flex">
                <input
                  type="email"
                  name="email"
                  value={resetForm.email}
                  onChange={handleResetInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                  placeholder="Enter your email"
                  required
                />
                <button
                  type="button"
                  onClick={() => sendCode('reset')}
                  disabled={cooldown > 0}
                  className="px-4 py-2 text-white bg-indigo-600 border border-indigo-600 rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                >
                  {cooldown > 0 ? `${cooldown}s` : 'Send'}
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-300">Verification Code</label>
              <input
                type="text"
                name="code"
                value={resetForm.code}
                onChange={handleResetInputChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                placeholder="Enter verification code"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-300">New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.newPassword ? "text" : "password"}
                  name="newPassword"
                  value={resetForm.newPassword}
                  onChange={handleResetInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white pr-10"
                  placeholder="Create a new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({...prev, newPassword: !prev.newPassword}))}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300"
                >
                  {showPasswords.newPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-gray-300">Confirm Password</label>
              <div className="relative">
                <input
                  type={showPasswords.confirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={resetForm.confirmPassword}
                  onChange={handleResetInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white pr-10"
                  placeholder="Confirm your new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({...prev, confirmPassword: !prev.confirmPassword}))}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300"
                >
                  {showPasswords.confirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-md hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:scale-[1.02]"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : 'Reset Password'}
            </button>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                <button
                  type="button"
                  onClick={backToLogin}
                  className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Back to login
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// 使用 React.memo 包装组件，防止不必要的重新渲染
export default React.memo(LoginModal);