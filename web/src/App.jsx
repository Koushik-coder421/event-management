import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EventDetails from './pages/EventDetails';
import AllEventsPage from './pages/AllEventsPage';
import ClubAdminDashboard from './pages/ClubAdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-cyan-500/30 selection:text-cyan-400">
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/event/:id" element={<EventDetails />} />
            <Route path="/all-events" element={<AllEventsPage />} />
            <Route
              path="/club-dashboard"
              element={
                <PrivateRoute>
                  <ClubAdminDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin-dashboard"
              element={
                <PrivateRoute>
                  <SuperAdminDashboard />
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
