import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { StudentsManagement } from '@/pages/admin/StudentsManagement';
import { ConventionsManagement } from '@/pages/admin/ConventionsManagement';
import { StudentDashboard } from '@/pages/student/StudentDashboard';
import { ConventionManagement } from '@/pages/student/ConventionManagement';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user && <Header />}
      
      <main className={user ? "p-4 md:p-6 lg:p-8" : ""}>
        <div className={user ? "max-w-7xl mx-auto" : ""}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected admin routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/students" element={
              <ProtectedRoute role="admin">
                <StudentsManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/conventions" element={
              <ProtectedRoute role="admin">
                <ConventionsManagement />
              </ProtectedRoute>
            } />
            
            {/* Protected student routes */}
            <Route path="/student/dashboard" element={
              <ProtectedRoute role="student">
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/student/convention" element={
              <ProtectedRoute role="student">
                <ConventionManagement />
              </ProtectedRoute>
            } />
            
            {/* Default redirects */}
            <Route path="/" element={
              user ? (
                <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />
              ) : (
                <Navigate to="/login" replace />
              )
            } />
            
            {/* Unauthorized page */}
            <Route path="/unauthorized" element={
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-red-600 mb-4">Accès non autorisé</h1>
                  <p className="text-gray-600">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
                </div>
              </div>
            } />
            
            {/* 404 page */}
            <Route path="*" element={
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Page non trouvée</h1>
                  <p className="text-gray-600">La page que vous recherchez n'existe pas.</p>
                </div>
              </div>
            } />
          </Routes>
        </div>
      </main>
      
      <Toaster position="top-right" />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}
