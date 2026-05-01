import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme, ThemeToggle } from "../context/ThemeContext";

// SVG Icons for How It Works section
const ConnectIcon = () => (
  <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const MonitorIcon = () => (
  <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const OptimizeIcon = () => (
  <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const LandingPage = () => {
  const [isAuthenticated] = useState(() => !!localStorage.getItem("token"));
  const [scrolled, setScrolled] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const howItWorks = [
    { step: "01", title: "Connect", desc: "Link your sensors or start with our simulated digital twin for instant insights.", Icon: ConnectIcon },
    { step: "02", title: "Monitor", desc: "Watch your fields come alive with real-time NDVI, health scores, and yield predictions.", Icon: MonitorIcon },
    { step: "03", title: "Optimize", desc: "Act on AI recommendations to maximize yields and prevent crop losses.", Icon: OptimizeIcon }
  ];

  return (
    <div className={`min-h-screen overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900'
    }`}>
      {/* Premium Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? isDark 
            ? 'bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5' 
            : 'bg-white/90 backdrop-blur-xl border-b border-gray-200/50'
          : ''
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 via-green-500 to-green-600 flex items-center justify-center shadow-lg group-hover:shadow-green-500/30 transition-all duration-300">
                  <span className="text-white font-black text-xl">S</span>
                </div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 blur-xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
              </div>
              <div className="flex flex-col">
                <span className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>SAMS</span>
                <span className="text-[10px] text-gray-500 tracking-widest uppercase">Agriculture AI</span>
              </div>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-10">
              <a href="#features" className={`text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>Features</a>
              <a href="#how-it-works" className={`text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>How it Works</a>
              <a href="#tech" className={`text-sm transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>Technology</a>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link 
                to={isAuthenticated ? "/analytics" : "/login"}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold px-6 py-3 rounded-full transition-all duration-300 group-hover:scale-105">
                  {isAuthenticated ? "Open Dashboard" : "Get Started"}
                </div>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] animate-pulse ${isDark ? 'bg-green-500/20' : 'bg-green-500/10'}`}></div>
          <div className={`absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[100px] animate-pulse delay-1000 ${isDark ? 'bg-emerald-500/15' : 'bg-emerald-500/10'}`}></div>
          <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[150px] ${isDark ? 'bg-green-600/10' : 'bg-green-600/5'}`}></div>
          
          {/* Grid Pattern */}
          <div className={`absolute inset-0 ${isDark ? 'opacity-[0.02]' : 'opacity-[0.03]'}`} 
            style={{
              backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'} 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }}>
          </div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 animate-fade-in-down ${
            isDark ? 'border border-green-500/30 bg-green-500/10' : 'border border-green-200 bg-green-50'
          }`}>
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className={`text-sm font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>AI-Powered Digital Twin Technology</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-[0.9] tracking-tight animate-fade-in-up">
            <span className={`block ${isDark ? 'text-white' : 'text-gray-900'}`}>Smart Farming</span>
            <span className="block mt-2 bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 bg-clip-text text-transparent">
              Reimagined
            </span>
          </h1>

          {/* Subtitle */}
          <p className={`text-xl md:text-2xl max-w-3xl mx-auto mb-12 leading-relaxed animate-fade-in-up delay-200 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Monitor your fields in real-time with AI-driven insights. 
            Predict diseases, optimize yields, and transform your agricultural operations.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up delay-300">
            <Link 
              to={isAuthenticated ? "/analytics" : "/login"}
              className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full font-semibold text-lg overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 transition-all duration-300 group-hover:scale-105"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-green-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative text-white">
                {isAuthenticated ? "Go to Dashboard" : "Start Free Trial"}
              </span>
              <svg className="relative w-5 h-5 text-white group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            
            <a 
              href="#features"
              className={`inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-lg border transition-all duration-300 ${
                isDark 
                  ? 'text-gray-300 border-gray-700 hover:border-gray-500 hover:bg-white/5' 
                  : 'text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              <span>Learn More</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </a>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-20 relative animate-fade-in-up delay-500">
            <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-[#0a0a0a]' : 'from-white'} via-transparent to-transparent z-10 pointer-events-none`}></div>
            <div className={`relative rounded-3xl border p-3 shadow-2xl ${
              isDark ? 'bg-gradient-to-br from-gray-900 to-gray-950 border-white/10' : 'bg-gradient-to-br from-gray-100 to-white border-gray-200'
            }`}>
              <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
                <div className={`flex items-center gap-2 px-4 py-3 border-b ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-xs text-gray-500">sams-dashboard.app</span>
                  </div>
                </div>
                <div className="p-8 min-h-[300px] flex items-center justify-center">
                  <div className="grid grid-cols-4 gap-4 w-full max-w-2xl">
                    {[
                      { label: "Fields", value: "5", color: "from-green-500 to-green-600" },
                      { label: "NDVI", value: "0.72", color: "from-emerald-500 to-green-600" },
                      { label: "Health", value: "94%", color: "from-green-400 to-emerald-500" },
                      { label: "Yield", value: "+12%", color: "from-yellow-500 to-orange-500" }
                    ].map((stat, i) => (
                      <div key={i} className={`rounded-2xl p-4 border text-center ${
                        isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'
                      }`}>
                        <div className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                          {stat.value}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce-subtle">
          <div className={`w-6 h-10 rounded-full border-2 flex items-start justify-center p-2 ${
            isDark ? 'border-gray-600' : 'border-gray-400'
          }`}>
            <div className={`w-1.5 h-3 rounded-full animate-pulse ${isDark ? 'bg-gray-500' : 'bg-gray-400'}`}></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium mb-6 ${
              isDark ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-green-50 border border-green-100 text-green-700'
            }`}>
              Powerful Features
            </span>
            <h2 className={`text-4xl md:text-6xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Everything you need to
              <span className="block mt-2 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                grow smarter
              </span>
            </h2>
            <p className={`text-xl max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Harness the power of AI and real-time monitoring to optimize every aspect of your farm.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 - Large */}
            <div className={`lg:col-span-2 group relative rounded-3xl p-8 border overflow-hidden card-hover ${
              isDark ? 'bg-gradient-to-br from-gray-900 to-gray-950 border-white/5' : 'bg-gradient-to-br from-gray-50 to-white border-gray-200'
            }`}>
              <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl transition-all duration-500 ${
                isDark ? 'bg-green-500/10 group-hover:bg-green-500/20' : 'bg-green-500/5 group-hover:bg-green-500/10'
              }`}></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-6 shadow-lg shadow-green-500/20">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                </div>
                <h3 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Digital Twin Technology</h3>
                <p className={`leading-relaxed max-w-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Create a real-time virtual replica of your entire farm. Monitor every plant, track growth patterns, and simulate future scenarios with precision.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className={`group relative rounded-3xl p-8 border overflow-hidden card-hover ${
              isDark ? 'bg-gradient-to-br from-gray-900 to-gray-950 border-white/5' : 'bg-gradient-to-br from-gray-50 to-white border-gray-200'
            }`}>
              <div className={`absolute top-0 right-0 w-60 h-60 rounded-full blur-3xl transition-all duration-500 ${
                isDark ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' : 'bg-emerald-500/5 group-hover:bg-emerald-500/10'
              }`}></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>AI Crop Advisor</h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Get ML-powered recommendations for optimal crop selection based on soil and weather conditions.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className={`group relative rounded-3xl p-8 border overflow-hidden card-hover ${
              isDark ? 'bg-gradient-to-br from-gray-900 to-gray-950 border-white/5' : 'bg-gradient-to-br from-gray-50 to-white border-gray-200'
            }`}>
              <div className={`absolute top-0 right-0 w-60 h-60 rounded-full blur-3xl transition-all duration-500 ${
                isDark ? 'bg-red-500/10 group-hover:bg-red-500/20' : 'bg-red-500/5 group-hover:bg-red-500/10'
              }`}></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center mb-6 shadow-lg shadow-red-500/20">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Disease Detection</h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Early warning system powered by deep learning to identify crop diseases before they spread.
                </p>
              </div>
            </div>

            {/* Feature 4 - Large */}
            <div className={`lg:col-span-2 group relative rounded-3xl p-8 border overflow-hidden card-hover ${
              isDark ? 'bg-gradient-to-br from-gray-900 to-gray-950 border-white/5' : 'bg-gradient-to-br from-gray-50 to-white border-gray-200'
            }`}>
              <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl transition-all duration-500 ${
                isDark ? 'bg-yellow-500/10 group-hover:bg-yellow-500/20' : 'bg-yellow-500/5 group-hover:bg-yellow-500/10'
              }`}></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center mb-6 shadow-lg shadow-yellow-500/20">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Real-Time Alerts</h3>
                <p className={`leading-relaxed max-w-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Instant notifications via SSE when critical conditions are detected. Temperature drops, moisture issues, or pest invasions - you'll know immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className={`py-32 relative ${isDark ? 'bg-gradient-to-b from-transparent via-green-950/20 to-transparent' : 'bg-gradient-to-b from-transparent via-green-50/50 to-transparent'}`}>
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium mb-6 ${
              isDark ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-green-50 border border-green-100 text-green-700'
            }`}>
              Simple Process
            </span>
            <h2 className={`text-4xl md:text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>How it works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((item, i) => (
              <div key={i} className="relative group">
                <div className={`absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                  isDark ? 'bg-gradient-to-b from-green-500/20 to-transparent' : 'bg-gradient-to-b from-green-200/50 to-transparent'
                }`}></div>
                <div className={`relative backdrop-blur rounded-3xl p-8 border text-center h-full ${
                  isDark ? 'bg-gray-900/50 border-white/5' : 'bg-white/80 border-gray-200'
                }`}>
                  <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center ${
                    isDark ? 'bg-green-500/10' : 'bg-green-50'
                  }`}>
                    <item.Icon />
                  </div>
                  <div className={`text-sm font-mono mb-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>Step {item.step}</div>
                  <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-green-500 to-emerald-500"></div>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.1)_25%,rgba(0,0,0,0.1)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.1)_75%)] bg-[length:4px_4px]"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "500+", label: "Hectares Monitored" },
              { value: "30%", label: "Water Saved" },
              { value: "25%", label: "Yield Increase" },
              { value: "99.9%", label: "Uptime" }
            ].map((stat, i) => (
              <div key={i} className="group">
                <div className="text-4xl md:text-5xl font-black text-white mb-2 group-hover:scale-110 transition-transform">
                  {stat.value}
                </div>
                <div className="text-white/80 text-sm font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section id="tech" className="py-32">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 text-center">
          <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium mb-6 ${
            isDark ? 'bg-gray-800 border border-gray-700 text-gray-300' : 'bg-gray-100 border border-gray-200 text-gray-700'
          }`}>
            Built with Modern Tech
          </span>
          <h2 className={`text-4xl md:text-5xl font-bold mb-16 ${isDark ? 'text-white' : 'text-gray-900'}`}>Technology Stack</h2>
          
          <div className="grid grid-cols-3 md:grid-cols-6 gap-8">
            {[
              { name: "React", color: "from-cyan-400 to-blue-500" },
              { name: "Spring", color: "from-green-400 to-green-600" },
              { name: "Python", color: "from-yellow-400 to-yellow-600" },
              { name: "TensorFlow", color: "from-orange-400 to-red-500" },
              { name: ".NET", color: "from-purple-400 to-purple-600" },
              { name: "PostgreSQL", color: "from-blue-400 to-blue-600" }
            ].map((tech, i) => (
              <div key={i} className="group relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${tech.color} rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500`}></div>
                <div className={`relative border rounded-2xl p-6 flex flex-col items-center justify-center aspect-square group-hover:scale-105 transition-all duration-300 ${
                  isDark ? 'bg-gray-900 border-white/10 group-hover:border-white/20' : 'bg-white border-gray-200 group-hover:border-gray-300'
                }`}>
                  <span className={`text-lg font-bold bg-gradient-to-r ${tech.color} bg-clip-text text-transparent`}>
                    {tech.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[150px] ${
            isDark ? 'bg-green-600/20' : 'bg-green-500/10'
          }`}></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className={`text-4xl md:text-6xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Ready to transform
            <span className="block mt-2 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              your farm?
            </span>
          </h2>
          <p className={`text-xl mb-10 max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Join the future of precision agriculture. Start monitoring your fields with AI-powered insights today.
          </p>
          
          <Link 
            to={isAuthenticated ? "/analytics" : "/login"}
            className="group inline-flex items-center gap-3 px-10 py-5 rounded-full font-semibold text-xl bg-gradient-to-r from-green-500 to-green-600 text-white shadow-xl shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105 transition-all duration-300"
          >
            <span>{isAuthenticated ? "Open Dashboard" : "Get Started Free"}</span>
            <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t py-12 ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <span className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>SAMS</span>
            </div>
            <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              © 2025 Smart Agriculture Monitoring System. Built for farmers.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
