import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Link } from "react-router-dom";
import Analytics from "./pages/Analytics";
import FieldView from "./pages/FieldView";
import Login from "./pages/Login";
import LandingPage from "./pages/LandingPage"; // Import Landing Page
import ProtectedRoute from './components/ProtectedRoute';
import CropRecommendation from "./pages/CropRecommendation";
import DiseasePrediction from "./pages/DiseasePrediction";
import { AlertsProvider, useAlerts } from "./context/AlertsContext";
import CropHistory from "./pages/CropHistory";
import DiseaseHistory from "./pages/DiseaseHistory";

// Header Component - Updated Navigation
const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAlerts();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { path: "/analytics", label: "Field Analytics" },
    { path: "/recommendations/crop", label: "Crop Advisor" },
    { path: "/recommendations/disease", label: "Disease Risk" },
  ];

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link to="/analytics" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-lg font-semibold text-gray-800 tracking-tight">SAMS</span>
          </Link>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'text-green-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
            >
              Sign Out
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded-full cursor-pointer transition-all">
              <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                U
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// Content wrapper
const ContentWrapper = ({ children }) => (
  <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8">{children}</div>
);

// Layout wrapper
const AppLayout = ({ children }) => {
  const location = useLocation();
  // Hide layout header/footer for Login and Landing Page
  const isPublicPage = location.pathname === '/login' || location.pathname === '/';

  if (isPublicPage) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="min-h-[calc(100vh-56px)]">
        <ContentWrapper>{children}</ContentWrapper>
      </main>
      <footer className="border-t border-gray-200/50 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <p>© 2025 Smart Agriculture Monitoring System</p>
            <div className="flex gap-6">
              <span className="text-green-600 font-medium">Digital Twin Active</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AlertsProvider>
        <AppLayout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/field/:id"
              element={
                <ProtectedRoute>
                  <FieldView />
                </ProtectedRoute>
              }
            />
            {/* Separate Routes for Recommendations */}
            <Route
              path="/recommendations/crop"
              element={
                <ProtectedRoute>
                  <CropRecommendation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recommendations/crop/history"
              element={
                <ProtectedRoute>
                  <CropHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recommendations/disease"
              element={
                <ProtectedRoute>
                  <DiseasePrediction />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recommendations/disease/history"
              element={
                <ProtectedRoute>
                  <DiseaseHistory />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AppLayout>
      </AlertsProvider>
    </BrowserRouter>
  );
}

export default App;