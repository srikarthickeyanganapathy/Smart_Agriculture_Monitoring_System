import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem("token"));
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-900">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">
                SAMS
              </span>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors">Features</a>
              <a href="#tech" className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors">Technology</a>
              <Link 
                to={isAuthenticated ? "/analytics" : "/login"} 
                className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition-all hover:shadow-lg hover:scale-105"
              >
                {isAuthenticated ? "Enter Dashboard" : "Sign In"}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-green-500/10 rounded-[100%] blur-3xl opacity-50" />
          <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-blue-500/10 rounded-[100%] blur-3xl opacity-30" />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-100 text-green-700 text-xs font-semibold uppercase tracking-wide mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Next Generation Agriculture
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-6 leading-tight">
            Farming Intelligence <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
              Reimagined
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg text-gray-600 mb-10 leading-relaxed">
            Harness the power of AI and Data Analytics to monitor your crops in real-time. 
            Maximize yields, minimize waste, and secure the future of farming with SAMS.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to={isAuthenticated ? "/analytics" : "/login"} 
              className="w-full sm:w-auto px-8 py-4 bg-green-600 text-white font-bold rounded-full hover:bg-green-700 transition-all hover:shadow-xl hover:shadow-green-500/30 hover:scale-105 flex items-center justify-center gap-2"
            >
              {isAuthenticated ? "Go to my Dashboard" : "Get Started"}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <a 
              href="#features" 
              className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 font-bold rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              Learn More
            </a>
          </div>

          {/* Hero Image / Dashboard Preview */}
          <div className="mt-20 relative mx-auto max-w-5xl">
            <div className="rounded-2xl border border-gray-200 shadow-2xl bg-white p-2 md:p-4 overflow-hidden backdrop-blur-sm bg-white/50">
               {/* Abstract representation of dashboard since we can't screenshot easily here, or placeholder */}
               <div className="aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p className="text-gray-400 font-medium">Interactive Field Analytics Dashboard</p>
                  </div>
               </div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -right-12 top-1/3 p-4 bg-white rounded-2xl shadow-xl border border-gray-100 animate-float hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Status</p>
                  <p className="text-sm font-bold text-gray-900">Optimal Growth</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to grow</h2>
            <p className="text-gray-600">Comprehensive tools for the modern farmer, powered by advanced technology.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Digital Twin",
                desc: "Virtual representation of your fields with real-time updates and historical tracking.",
                icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
                color: "blue"
              },
              {
                title: "AI Analysis",
                desc: "Machine learning models predict crop health, yield, and potential disease risks.",
                icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
                color: "green"
              },
              {
                title: "Real-time Alerts",
                desc: "Instant notifications for critical soil conditions requiring your attention.",
                icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
                color: "red"
              }
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:shadow-xl transition-all duration-300 group">
                <div className={`w-14 h-14 rounded-2xl bg-${feature.color}-100 text-${feature.color}-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gray-900 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-500 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">How SAMS Works</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              From sensor data to actionable insights, our seamless workflow empowers your decision-making.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-green-500/20 via-green-500 to-green-500/20 z-0" />

            {[
              {
                step: "01",
                title: "Data Collection",
                desc: "IoT sensors continuously monitor soil moisture, temperature, and nutrient levels.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                  </svg>
                )
              },
              {
                step: "02",
                title: "AI Analysis",
                desc: "Advanced algorithms process data to predict crop health and potential risks.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                )
              },
              {
                step: "03",
                title: "Actionable Insights",
                desc: "Receive real-time alerts and recommendations to optimize your farming strategy.",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )
              }
            ].map((item, i) => (
              <div key={i} className="relative z-10 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-8 rounded-3xl text-center group hover:bg-gray-800 transition-all duration-300 hover:-translate-y-2">
                <div className="w-16 h-16 mx-auto bg-gray-900 rounded-2xl border border-green-500/30 flex items-center justify-center text-green-500 mb-6 shadow-lg shadow-green-500/10 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <div className="text-green-500 font-mono text-sm font-bold mb-3">STEP {item.step}</div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-20 bg-green-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {[
              { value: "500+", label: "Hectares Monitored" },
              { value: "24/7", label: "Real-time Tracking" },
              { value: "30%", label: "Water Saved" },
              { value: "15%", label: "Yield Increase" }
            ].map((stat, i) => (
              <div key={i} className="p-4">
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-green-200 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section id="tech" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Powered by Modern Tech</h2>
            <p className="text-gray-600">Built with the latest reliable technologies for maximum performance.</p>
          </div>

          <div className="flex flex-wrap justify-center gap-8 md:gap-12 opacity-80 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Tech Logos (Text representation for simplicity) */}
            {["React", "Spring Boot", "Python", "TensorFlow", "PostgreSQL", "Tailwind CSS"].map((tech) => (
              <div key={tech} className="bg-white px-8 py-4 rounded-xl border border-gray-200 font-bold text-gray-400 text-xl shadow-sm hover:text-green-600 hover:border-green-200 hover:shadow-md transition-all cursor-default">
                {tech}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-gray-900 font-bold">SAMS</span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-500 text-sm">© 2025 All rights reserved</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">Privacy</a>
            <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">Terms</a>
            <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
