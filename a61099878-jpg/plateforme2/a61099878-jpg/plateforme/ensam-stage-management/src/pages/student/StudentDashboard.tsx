import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SecurityBanner } from '@/components/SecurityBanner';
import { 
  User, 
  FileText, 
  Download, 
  Upload, 
  CheckCircle, 
  Clock, 
  XCircle,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  Award,
  AlertCircle,
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function StudentDashboard() {
  const { user } = useAuth();

  const { data: profileData } = useQuery({
    queryKey: ['student', 'profile'],
    queryFn: () => api.getProfile(),
  });

  const { data: conventionsData } = useQuery({
    queryKey: ['student', 'conventions'],
    queryFn: () => api.getStudentConventions(),
  });

  const student = profileData?.student;
  const conventions = conventionsData?.conventions || [];
  const latestConvention = conventions[0];

  const getStageType = (annee: number) => {
    switch (annee) {
      case 1:
        return { type: 'initiation', label: 'Stage d\'Initiation' };
      case 2:
        return { type: 'fin_annee', label: 'Stage de Fin d\'Année' };
      case 3:
        return { type: 'fin_etudes', label: 'Stage de Fin d\'Études' };
      default:
        return { type: 'initiation', label: 'Stage' };
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'en_attente':
        return {
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          icon: Clock,
          label: 'En attente',
          description: 'Convention générée, en attente de signature et soumission'
        };
      case 'envoye':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          icon: Upload,
          label: 'Envoyée',
          description: 'Convention signée soumise, en attente de validation administrative'
        };
      case 'valide':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          icon: CheckCircle,
          label: 'Validée',
          description: 'Convention approuvée par l\'administration'
        };
      case 'rejete':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          icon: XCircle,
          label: 'Rejetée',
          description: 'Convention rejetée, voir les commentaires administratifs'
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          icon: AlertCircle,
          label: status,
          description: ''
        };
    }
  };

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stageInfo = getStageType(student.annee);

  return (
    <div className="space-y-6">
      {/* Security Banner */}
      <SecurityBanner />
      
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Bonjour, {student.nom}
            </h1>
            <p className="text-gray-600">
              Bienvenue sur votre espace de gestion des stages ENSAM
            </p>
          </div>
        </div>
      </div>

      {/* Student Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GraduationCap className="h-5 w-5" />
              <span>Profil Étudiant</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Nom complet</p>
                  <p className="text-sm text-gray-600">{student.nom}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-gray-600">{student.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Téléphone</p>
                  <p className="text-sm text-gray-600">{student.telephone || 'Non renseigné'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Award className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Filière</p>
                  <p className="text-sm text-gray-600">{student.filiere}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Année d'études</p>
                  <p className="text-sm text-gray-600">{student.annee}ème année</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FileText className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Code Apogée</p>
                  <p className="text-sm text-gray-600">{student.codeApogee}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stage Info */}
        <Card>
          <CardHeader>
            <CardTitle>Stage Requis</CardTitle>
            <CardDescription>
              Selon votre niveau d'études
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="bg-primary/10 p-4 rounded-full inline-flex mb-3">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">{stageInfo.label}</h3>
              <p className="text-sm text-gray-600 mt-2">
                {student.annee === 1 && 'Découverte du monde professionnel (4-6 semaines)'}
                {student.annee === 2 && 'Approfondissement technique (6-8 semaines)'}
                {student.annee === 3 && 'Projet d\'ingénieur complet (4-6 mois)'}
              </p>
            </div>
            <div className="pt-4 border-t">
              <div className="space-y-2">
                <Link to="/student/convention">
                  <Button className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Gérer ma convention
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    // Navigation directe vers la page convention et déclenchement de la génération
                    window.location.href = '/student/convention';
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Générer Convention
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Convention Status */}
      {latestConvention ? (
        <Card>
          <CardHeader>
            <CardTitle>Statut de votre Convention</CardTitle>
            <CardDescription>
              Dernière convention générée le {latestConvention.generatedAt && format(new Date(latestConvention.generatedAt), 'dd MMMM yyyy', { locale: fr })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const statusInfo = getStatusInfo(latestConvention.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <div className={`${statusInfo.bgColor} p-4 rounded-lg`}>
                  <div className="flex items-center space-x-3 mb-3">
                    <StatusIcon className={`h-6 w-6 ${statusInfo.color}`} />
                    <div>
                      <h3 className={`font-semibold ${statusInfo.color}`}>
                        {statusInfo.label}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {statusInfo.description}
                      </p>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-2 ml-9">
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Convention générée</span>
                      <span className="text-gray-500">
                        {latestConvention.generatedAt && format(new Date(latestConvention.generatedAt), 'dd/MM/yyyy')}
                      </span>
                    </div>
                    
                    {latestConvention.submittedAt && (
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Convention soumise</span>
                        <span className="text-gray-500">
                          {format(new Date(latestConvention.submittedAt), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    )}
                    
                    {latestConvention.validatedAt && (
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Convention validée</span>
                        <span className="text-gray-500">
                          {format(new Date(latestConvention.validatedAt), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    )}
                    
                    {latestConvention.rejectedAt && (
                      <div className="flex items-center space-x-2 text-sm">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>Convention rejetée</span>
                        <span className="text-gray-500">
                          {format(new Date(latestConvention.rejectedAt), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Admin Notes */}
                  {latestConvention.adminNotes && (
                    <div className="mt-4 p-3 bg-white rounded border">
                      <p className="text-sm font-medium mb-1">Notes administratives:</p>
                      <p className="text-sm text-gray-600">{latestConvention.adminNotes}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2 mt-4">
                    <Link to="/student/convention">
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Voir les détails
                      </Button>
                    </Link>
                    
                    {latestConvention.status === 'rejete' && (
                      <Link to="/student/convention">
                        <Button size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          Générer une nouvelle convention
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      ) : (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Vous n'avez pas encore généré de convention de stage. 
            <Link to="/student/convention" className="font-medium text-primary hover:underline ml-1">
              Cliquez ici pour commencer
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
          <CardDescription>
            Étapes pour valider votre stage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <span className="text-primary font-bold text-sm">1</span>
              </div>
              <div>
                <h4 className="font-medium">Générer votre convention</h4>
                <p className="text-sm text-gray-600">
                  Utilisez le système pour générer automatiquement votre convention de stage personnalisée.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <span className="text-primary font-bold text-sm">2</span>
              </div>
              <div>
                <h4 className="font-medium">Signer la convention</h4>
                <p className="text-sm text-gray-600">
                  Imprimez, signez et faites signer votre convention par l'organisme d'accueil.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <span className="text-primary font-bold text-sm">3</span>
              </div>
              <div>
                <h4 className="font-medium">Soumettre la convention signée</h4>
                <p className="text-sm text-gray-600">
                  Uploadez votre convention signée (PDF ou image) via la plateforme.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <span className="text-primary font-bold text-sm">4</span>
              </div>
              <div>
                <h4 className="font-medium">Validation administrative</h4>
                <p className="text-sm text-gray-600">
                  L'administration valide votre convention et vous pouvez commencer votre stage.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}