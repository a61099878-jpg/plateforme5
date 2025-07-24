import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Info, X } from 'lucide-react';

interface SecurityBannerProps {
  onDismiss?: () => void;
}

export function SecurityBanner({ onDismiss }: SecurityBannerProps) {
  const { logout } = useAuth();
  const [isVisible, setIsVisible] = React.useState(true);

  // Check if user should see security banner
  React.useEffect(() => {
    const dismissed = localStorage.getItem('security_banner_dismissed');
    const dismissedDate = localStorage.getItem('security_banner_dismissed_date');
    
    // Show banner again after 7 days
    if (dismissed && dismissedDate) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedDate)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed > 7) {
        localStorage.removeItem('security_banner_dismissed');
        localStorage.removeItem('security_banner_dismissed_date');
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('security_banner_dismissed', 'true');
    localStorage.setItem('security_banner_dismissed_date', Date.now().toString());
    setIsVisible(false);
    onDismiss?.();
  };

  const handleSecureLogout = () => {
    logout(true);
  };

  if (!isVisible) return null;

  return (
    <Alert className="border-blue-200 bg-blue-50 text-blue-800 mb-4">
      <Info className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <strong>🔒 Sécurité renforcée :</strong> Pour une sécurité maximale, utilisez la "Déconnexion Sécurisée" qui vous déconnectera automatiquement au prochain redémarrage de l'application.
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSecureLogout}
            className="text-blue-600 border-blue-300 hover:bg-blue-100"
          >
            <Shield className="h-3 w-3 mr-1" />
            Activer
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="text-blue-600 hover:bg-blue-100"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}