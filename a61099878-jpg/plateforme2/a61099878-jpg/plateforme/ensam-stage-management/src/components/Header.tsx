import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings, GraduationCap, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">ENSAM Stages</h1>
              <p className="text-sm text-gray-500">Gestion des Stages</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-6">
            {user?.role === 'admin' && (
              <>
                <Link 
                  to="/admin/dashboard" 
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  Tableau de bord
                </Link>
                <Link 
                  to="/admin/students" 
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  Étudiants
                </Link>
                <Link 
                  to="/admin/conventions" 
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  Conventions
                </Link>
              </>
            )}
            {user?.role === 'student' && (
              <>
                <Link 
                  to="/student/dashboard" 
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  Tableau de bord
                </Link>
                <Link 
                  to="/student/convention" 
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  Ma Convention
                </Link>
              </>
            )}
          </nav>

          {/* User menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span className="hidden sm:inline">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  <p className="text-xs text-primary font-medium capitalize">{user.role}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Paramètres
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => logout(true)} 
                  className="text-orange-600"
                  title="Force la déconnexion au prochain redémarrage de l'application"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Déconnexion Sécurisée
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logout(false)} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion Normale
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}