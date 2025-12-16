import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

// API base URL
const API_BASE_URL = "http://127.0.0.1:8000";

function App() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // React Hook Form declarations
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    reset: resetLogin,
    watch: watchLogin
  } = useForm();

  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    formState: { errors: signupErrors },
    reset: resetSignup,
    watch: watchSignup
  } = useForm();

  const {
    register: registerChat,
    handleSubmit: handleChatSubmit,
    reset: resetChat,
    watch: watchChat,
    setValue: setChatValue
  } = useForm();

  const query = watchChat("query") || "";

  const [chatHistory, setChatHistory] = useState([
    { id: 1, title: "Python Code Help", date: "2024-01-15" },
    { id: 2, title: "React Components", date: "2024-01-14" },
    { id: 3, title: "API Integration", date: "2024-01-13" },
  ]);
  const [currentChatId, setCurrentChatId] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const savedUser = localStorage.getItem('aiVerseUser');
    const savedToken = localStorage.getItem('aiVerseToken');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
  }, []);

  // Function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('aiVerseToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  // Copy to clipboard function
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log("Code copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [query]);

  // Signup function with API integration
  const onSignupSubmit = async (data) => {
    try {
      setAuthError("");
      setAuthSuccess("");
      
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.email.split('@')[0], // Using email prefix as username
          email: data.email,
          full_name: data.name,
          password: data.password
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Signup failed');
      }

      // Save token and user data
      localStorage.setItem('aiVerseToken', result.access_token);
      localStorage.setItem('aiVerseUser', JSON.stringify(result.user));
      
      setUser(result.user);
      setIsLoggedIn(true);
      setShowSignup(false);
      resetSignup();
      setAuthSuccess("Account created successfully!");
      
    } catch (error) {
      setAuthError(error.message);
      console.error('Signup error:', error);
    }
  };

  // Login function with API integration
  const onLoginSubmit = async (data) => {
    try {
      setAuthError("");
      setAuthSuccess("");
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.email.split('@')[0], // Using email prefix as username
          password: data.password
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Login failed');
      }

      // Save token and user data
      localStorage.setItem('aiVerseToken', result.access_token);
      localStorage.setItem('aiVerseUser', JSON.stringify(result.user));
      
      setUser(result.user);
      setIsLoggedIn(true);
      setShowLogin(false);
      resetLogin();
      setAuthSuccess("Login successful!");
      
    } catch (error) {
      setAuthError(error.message);
      console.error('Login error:', error);
    }
  };

  // Logout function
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setMessages([]);
    localStorage.removeItem('aiVerseUser');
    localStorage.removeItem('aiVerseToken');
  };

  // New chat function
  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    resetChat();
  };

  // Chat submission with React Hook Form
  const onChatSubmit = async (data) => {
    if (!data.query.trim() || loading) return;

    const userMessage = { text: data.query, sender: "user", id: Date.now() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    
    // If this is a new chat, add to history
    if (!currentChatId && messages.length === 0) {
      const newChat = {
        id: Date.now(),
        title: data.query.length > 30 ? data.query.substring(0, 30) + "..." : data.query,
        date: new Date().toISOString().split('T')[0]
      };
      setChatHistory(prev => [newChat, ...prev]);
      setCurrentChatId(newChat.id);
    }

    resetChat();
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/chat?query=${encodeURIComponent(data.query)}`,
        {
          headers: getAuthHeaders()
        }
      );

      // Check for unauthorized
      if (response.status === 401) {
        throw new Error('Unauthorized - Please login again');
      }

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body.getReader();
      let botMessage = "";
      let messageId = Date.now() + 1;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder("utf-8").decode(value);
        botMessage += chunk;

        setMessages([
          ...newMessages,
          { 
            text: botMessage,
            sender: "bot", 
            id: messageId,
            isStreaming: true
          },
        ]);
      }

      // Final update to mark streaming as complete
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isStreaming: false }
          : msg
      ));
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([
        ...newMessages,
        { 
          text: error.message === 'Unauthorized - Please login again' 
            ? "Session expired. Please login again." 
            : "Sorry, I encountered an error. Please try again.", 
          sender: "bot", 
          id: Date.now(),
          isError: true
        },
      ]);
    }

    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChatSubmit(onChatSubmit)();
    }
  };

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Login/Signup Modal Component with React Hook Form
  const AuthModal = () => {
    if (!showLogin && !showSignup) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white rounded-xl w-full max-w-md relative shadow-elegant">
          {/* Close Button - Top Right */}
          <button
            onClick={() => {
              setShowLogin(false);
              setShowSignup(false);
              resetLogin();
              resetSignup();
              setAuthError("");
              setAuthSuccess("");
            }}
            className="absolute -top-3 -right-3 w-8 h-8 bg-gray-800 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-all duration-200 shadow-lg z-10"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <img
                  src="/fourbrickLogo.png"
                  alt="AI Verse Logo"
                  className="h-12 rounded-lg"
                />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {showLogin ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-gray-600 mt-2 text-sm">
                {showLogin ? "Sign in to continue to AI Verse" : "Sign up to get started with AI Verse"}
              </p>
            </div>

            {/* Auth Messages */}
            {authError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {authError}
              </div>
            )}
            {authSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                {authSuccess}
              </div>
            )}

            {/* Form */}
            {showLogin ? (
              <form onSubmit={handleLoginSubmit(onLoginSubmit)}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    {...registerLogin("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address"
                      }
                    })}
                    className="input-professional w-full p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                  {loginErrors.email && (
                    <p className="text-red-500 text-sm mt-1">{loginErrors.email.message}</p>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    {...registerLogin("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters"
                      }
                    })}
                    className="input-professional w-full p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your password"
                  />
                  {loginErrors.password && (
                    <p className="text-red-500 text-sm mt-1">{loginErrors.password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn-professional w-full text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-200 mb-4"
                  disabled={loading}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignupSubmit(onSignupSubmit)}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    {...registerSignup("name", {
                      required: "Full name is required",
                      minLength: {
                        value: 2,
                        message: "Name must be at least 2 characters"
                      }
                    })}
                    className="input-professional w-full p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                  {signupErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{signupErrors.name.message}</p>
                  )}
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    {...registerSignup("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address"
                      }
                    })}
                    className="input-professional w-full p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                  {signupErrors.email && (
                    <p className="text-red-500 text-sm mt-1">{signupErrors.email.message}</p>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    {...registerSignup("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters"
                      }
                    })}
                    className="input-professional w-full p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your password"
                  />
                  {signupErrors.password && (
                    <p className="text-red-500 text-sm mt-1">{signupErrors.password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn-professional w-full text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-200 mb-4"
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </form>
            )}

            {/* Switch between Login and Signup */}
            <div className="text-center">
              <p className="text-gray-600 text-sm">
                {showLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => {
                    setShowLogin(!showLogin);
                    setShowSignup(!showSignup);
                    resetLogin();
                    resetSignup();
                    setAuthError("");
                    setAuthSuccess("");
                  }}
                  className="text-blue-600 font-medium hover:text-blue-700 transition-colors duration-200"
                >
                  {showLogin ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // If not logged in, show landing page
  if (!isLoggedIn) {
    return (
      <div className=" max-w-full  bg-gradient-subtle">
        {/* Navigation */}
        <nav className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <img
                  src="/fourbrickLogo.png"
                  alt="AI Verse Logo"
                  className="h-8 rounded-lg mr-3"
                />
                <span className="text-xl font-bold text-gray-900">AI Verse</span>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowLogin(true)}
                  className="text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setShowSignup(true)}
                  className="btn-professional text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-200"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="  mx-auto px-4 sm:px-6 lg:px-8 pt-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              The AI Assistant That
              <span className="text-gradient"> Understands You</span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              AI Verse helps you write code, create content, solve problems, and bring your ideas to life with advanced artificial intelligence.
            </p>
            
            <div className="flex justify-center space-x-4 mb-20">
              <button
                onClick={() => setShowSignup(true)}
                className="btn-professional text-white px-8 py-4 rounded-xl font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                Start Chatting for Free
              </button>
              <button 
                onClick={() => setShowLogin(true)}
                className="border border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-medium hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md"
              >
                View Demo
              </button>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-white p-8 rounded-xl shadow-professional border border-gray-100 card-hover">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Code Generation</h3>
                <p className="text-gray-600 leading-relaxed">Write and debug code in multiple programming languages with AI assistance.</p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-professional border border-gray-100 card-hover">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Content Writing</h3>
                <p className="text-gray-600 leading-relaxed">Create articles, emails, documents, and creative content effortlessly.</p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-professional border border-gray-100 card-hover">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Problem Solving</h3>
                <p className="text-gray-600 leading-relaxed">Get detailed explanations and solutions for complex problems.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Auth Modal */}
        <AuthModal />

        {/* Apply professional styles */}
        <style jsx>{`
          @keyframes message-in {
            from {
              opacity: 0;
              transform: translateY(8px) scale(0.98);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          
          @keyframes fade-in {
            from { 
              opacity: 0;
              transform: translateY(10px);
            }
            to { 
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes slide-in {
            from {
              transform: translateX(-20px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          .animate-message-in {
            animation: message-in 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          }
          
          .animate-fade-in {
            animation: fade-in 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          }
          
          .animate-slide-in {
            animation: slide-in 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          }

          /* Professional Scrollbar Styling */
          .scrollbar-thin::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          
          .scrollbar-thin::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.02);
            border-radius: 3px;
          }
          
          .scrollbar-thin::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.15);
            border-radius: 3px;
            transition: all 0.2s ease-in-out;
          }
          
          .scrollbar-thin::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 0, 0, 0.25);
          }

          /* Glass morphism effect for sidebar */
          .glass-sidebar {
            
            backdrop-filter: blur(10px);
            border-right: 1px solid rgba(255, 255, 255, 0.1);
          }

          /* Professional shadow system */
          .shadow-professional {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
                        0 2px 4px -1px rgba(0, 0, 0, 0.06),
                        0 0 0 1px rgba(0, 0, 0, 0.02);
          }

          .shadow-elegant {
            box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 
                        0 4px 6px -2px rgba(0, 0, 0, 0.05);
          }

          /* Smooth focus states */
          .focus-smooth:focus {
            outline: none;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
            transition: all 0.2s ease-in-out;
          }

          /* Professional gradient backgrounds */
          .gradient-professional {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          .gradient-subtle {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          }

          /* Enhanced button states */
          .btn-professional {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .btn-professional:hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 25px -3px rgba(79, 70, 229, 0.3);
          }

          .btn-professional:active {
            transform: translateY(0);
          }

          /* Text selection styling */
          ::selection {
            background: rgba(79, 70, 229, 0.2);
            color: inherit;
          }

          ::-moz-selection {
            background: rgba(79, 70, 229, 0.2);
            color: inherit;
          }

          /* Loading animation refinement */
          @keyframes pulse-subtle {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.7;
            }
          }

          .animate-pulse-subtle {
            animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }

          /* Border radius consistency */
          .radius-professional {
            border-radius: 12px;
          }

          .radius-elegant {
            border-radius: 16px;
          }

          /* Typography enhancements */
          .text-gradient {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          /* Input field enhancements */
          .input-professional {
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(209, 213, 219, 0.8);
            transition: all 0.2s ease-in-out;
          }

          .input-professional:focus {
            background: rgba(255, 255, 255, 1);
            border-color: rgba(79, 70, 229, 0.5);
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
          }

          /* Card hover effects */
          .card-hover {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .card-hover:hover {
            transform: translateY(-2px);
            box-shadow: 0 20px 40px -4px rgba(0, 0, 0, 0.1);
          }

          /* Smooth transitions for all interactive elements */
          * {
            transition-property: color, background-color, border-color, transform, box-shadow;
            transition-duration: 0.2s;
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          }
        `}</style>
      </div>
    );
  }

  // Main App (when logged in)
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div 
        className={`glass-sidebar bg-gray-900 text-white transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-0"
        } overflow-hidden flex flex-col`}
      >
        {/* New Chat Button */}
        <div className="p-4 border-b border-gray-700">
          <button
            onClick={startNewChat}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm bg-gray-800 hover:bg-gray-700 
                     rounded-lg border border-gray-600 transition-all duration-200 hover:scale-105"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New chat
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chatHistory.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setCurrentChatId(chat.id)}
              className={`w-full text-left p-3 rounded-lg text-sm transition-all duration-200 hover:bg-gray-800 ${
                currentChatId === chat.id ? "bg-gray-700" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-gray-200">{chat.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(chat.date)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* User Profile with Logout */}
        <div className="p-3 border-t border-gray-700">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors duration-200">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-white">
                {user?.full_name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.full_name || user?.name || 'User'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.role || 'Free Plan'}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="text-gray-400 hover:text-white transition-colors duration-200 p-1 rounded-lg hover:bg-gray-700"
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src="/fourbrickLogo.png"
                  alt="Logo"
                  className="h-8 rounded-lg"
                />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">AI Verse</h1>
                <p className="text-sm text-gray-600">Welcome, {user?.full_name || user?.name || 'User'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse-subtle' : 'bg-green-500'}`}></div>
            <span className="text-sm text-gray-600">{loading ? 'Processing' : 'Online'}</span>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 px-24 overflow-hidden relative bg-gradient-subtle">
          <div 
            className="h-full pb-28 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
            style={{ scrollBehavior: 'smooth' }}
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-fade-in">
                <div className="w-30 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <img
                    src="/fourbrickLogo.png"
                    alt="AI Verse Logo"
                    className="h-10 rounded-lg"
                  />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">Welcome to AI Verse</h3>
                <p className="text-gray-600 max-w-md text-lg leading-relaxed">How can I help you today? Ask me anything and I'll provide detailed, helpful responses.</p>
                <div className="grid grid-cols-2 gap-4 mt-8 max-w-lg">
                  <div className="p-4 bg-white rounded-xl shadow-professional border border-gray-100 text-left card-hover">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    <p className="font-medium text-gray-900">Code Generation</p>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">Write and debug code in multiple languages</p>
                  </div>
                  <div className="p-4 bg-white rounded-xl shadow-professional border border-gray-100 text-left card-hover">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="font-medium text-gray-900">Content Writing</p>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">Create articles, emails, and documents</p>
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-message-in`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className={`max-w-[85%] rounded-xl p-4 ${
                    msg.sender === "user"
                      ? "bg-gray-900 text-white shadow-elegant"
                      : `text-gray-900 bg-white shadow-professional border border-gray-100 ${
                          msg.isError ? "border-red-200 bg-red-50" : ""
                        }`
                  }`}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : '';
                        const codeText = String(children).replace(/\n$/, '');
                        
                        if (!inline && language) {
                          return (
                            <div className="relative my-2 rounded-lg overflow-hidden border border-gray-200">
                              {/* Code Header with Language and Copy Button */}
                              <div className="flex justify-between items-center px-4 py-2 bg-gray-800 text-white text-sm">
                                <span className="font-mono text-xs uppercase">{language}</span>
                                <button
                                  onClick={() => copyToClipboard(codeText)}
                                  className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-all duration-200"
                                  title="Copy code"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                  Copy
                                </button>
                              </div>
                              
                              {/* Code Content */}
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={language}
                                PreTag="div"
                                customStyle={{
                                  background: "oklch(21% 0.034 264.665)",
                                  borderRadius: "0 0 8px 8px",
                                  padding: "16px",
                                  margin: 0,
                                  fontSize: "14px"
                                }}
                                {...props}
                              >
                                {codeText}
                              </SyntaxHighlighter>
                            </div>
                          );
                        } else if (!inline) {
                          // For code blocks without language specification
                          return (
                            <div className="relative my-2 rounded-lg overflow-hidden border border-gray-200">
                              <div className="flex justify-between items-center px-4 py-2 bg-gray-800 text-white text-sm">
                                <span className="font-mono text-xs">Code</span>
                                <button
                                  onClick={() => copyToClipboard(codeText)}
                                  className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-all duration-200"
                                  title="Copy code"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                  Copy
                                </button>
                              </div>
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language="text"
                                PreTag="div"
                                customStyle={{
                                  background: "oklch(21% 0.034 264.665)",
                                  borderRadius: "0 0 8px 8px",
                                  padding: "16px",
                                  margin: 0,
                                  fontSize: "14px"
                                }}
                                {...props}
                              >
                                {codeText}
                              </SyntaxHighlighter>
                            </div>
                          );
                        }
                        
                        // For inline code
                        return (
                          <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono border border-gray-200" {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            
            {loading && messages.length > 0 && (
              <div className="flex justify-start animate-fade-in">
                <div className="max-w-[85%] rounded-xl p-4 bg-white shadow-professional border border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <span className="text-gray-600 text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
           <div className="p-6 absolute bottom-0 left-[15%] right-[15%]">
          <form onSubmit={handleChatSubmit(onChatSubmit)}>
            <div className="flex items-end gap-3 max-w-4xl mx-auto">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  {...registerChat("query")}
                  placeholder="Type your message..."
                  onKeyPress={handleKeyPress}
                  className="input-professional w-full p-4 pr-12 rounded-xl 
                           focus:outline-none focus:ring-2 focus:ring-blue-500
                           resize-none transition-all duration-200 text-gray-900 placeholder-gray-500
                           scrollbar-thin"
                  rows={1}
                  disabled={loading}
                />
                <div className="absolute right-3 bottom-5 flex gap-1">
                  <button 
                    type="button"
                    onClick={() => resetChat()}
                    className="p-1.5 text-gray-500 hover:text-gray-700 transition-all duration-200 rounded-lg hover:bg-gray-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="btn-professional px-8 py-4 mb-1.5 text-white 
                         transition-all duration-200 rounded-xl font-medium 
                         shadow-professional hover:shadow-elegant
                         transform hover:scale-105 disabled:scale-100 disabled:bg-gray-400
                         flex items-center gap-2 min-w-[100px] justify-center"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Typing</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>Send</span>
                  </>
                )}
              </button>
            </div>
            <div className="text-center mt-3">
              <p className="text-xs text-gray-500">
                AI Verse can make mistakes. Consider checking important information.
              </p>
            </div>
          </form>
        </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal />

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes message-in {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes fade-in {
          from { 
            opacity: 0;
            transform: translateY(10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in {
          from {
            transform: translateX(-20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-message-in {
          animation: message-in 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        
        .animate-fade-in {
          animation: fade-in 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        /* Professional Scrollbar Styling */
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.02);
          border-radius: 3px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.15);
          border-radius: 3px;
          transition: all 0.2s ease-in-out;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.25);
        }

        /* Glass morphism effect for sidebar */
        .glass-sidebar {
          
          backdrop-filter: blur(10px);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Professional shadow system */
        .shadow-professional {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
                      0 2px 4px -1px rgba(0, 0, 0, 0.06),
                      0 0 0 1px rgba(0, 0, 0, 0.02);
        }

        .shadow-elegant {
          box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 
                      0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }

        /* Smooth focus states */
        .focus-smooth:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
          transition: all 0.2s ease-in-out;
        }

        /* Professional gradient backgrounds */
        .gradient-professional {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .gradient-subtle {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }

        /* Enhanced button states */
        .btn-professional {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-professional:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 25px -3px rgba(79, 70, 229, 0.3);
        }

        .btn-professional:active {
          transform: translateY(0);
        }

        /* Text selection styling */
        ::selection {
          background: rgba(79, 70, 229, 0.2);
          color: inherit;
        }

        ::-moz-selection {
          background: rgba(79, 70, 229, 0.2);
          color: inherit;
        }

        /* Loading animation refinement */
        @keyframes pulse-subtle {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        .animate-pulse-subtle {
          animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        /* Border radius consistency */
        .radius-professional {
          border-radius: 12px;
        }

        .radius-elegant {
          border-radius: 16px;
        }

        /* Typography enhancements */
        .text-gradient {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Input field enhancements */
        .input-professional {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(209, 213, 219, 0.8);
          transition: all 0.2s ease-in-out;
        }

        .input-professional:focus {
          background: rgba(255, 255, 255, 1);
          border-color: rgba(79, 70, 229, 0.5);
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        /* Card hover effects */
        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 40px -4px rgba(0, 0, 0, 0.1);
        }

        /* Smooth transitions for all interactive elements */
        * {
          transition-property: color, background-color, border-color, transform, box-shadow;
          transition-duration: 0.2s;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
}

export default App;