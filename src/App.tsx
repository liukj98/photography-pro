import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ToastContainer } from './components/ui/Toast';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Explore } from './pages/Explore';
import { Profile } from './pages/Profile';
import { Upload } from './pages/Upload';
import { Manage } from './pages/Manage';
import { Stats } from './pages/Stats';
import { Settings } from './pages/Settings';
import { Favorites } from './pages/Favorites';
import { PhotoDetail } from './pages/PhotoDetail';
import { NotFound } from './pages/NotFound';
import { useAuthStore } from './stores/authStore';
import './index.css';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public Layout with Header and Footer
function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

// Auth Layout without Header and Footer
function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}

function App() {
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <PublicLayout>
              <Home />
            </PublicLayout>
          }
        />
        <Route
          path="/explore"
          element={
            <PublicLayout>
              <Explore />
            </PublicLayout>
          }
        />
        <Route
          path="/u/:username"
          element={
            <PublicLayout>
              <Profile />
            </PublicLayout>
          }
        />
        <Route
          path="/photo/:id"
          element={
            <PublicLayout>
              <PhotoDetail />
            </PublicLayout>
          }
        />

        {/* Auth Routes */}
        <Route
          path="/login"
          element={
            <AuthLayout>
              <Login />
            </AuthLayout>
          }
        />
        <Route
          path="/register"
          element={
            <AuthLayout>
              <Register />
            </AuthLayout>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <PublicLayout>
                <Upload />
              </PublicLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/manage"
          element={
            <ProtectedRoute>
              <PublicLayout>
                <Manage />
              </PublicLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/stats"
          element={
            <ProtectedRoute>
              <PublicLayout>
                <Stats />
              </PublicLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <PublicLayout>
                <Settings />
              </PublicLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <PublicLayout>
                <Favorites />
              </PublicLayout>
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route
          path="*"
          element={
            <PublicLayout>
              <NotFound />
            </PublicLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
