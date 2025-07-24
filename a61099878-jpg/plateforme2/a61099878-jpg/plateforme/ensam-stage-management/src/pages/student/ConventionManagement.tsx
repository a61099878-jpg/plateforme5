import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  FileText, 
  Download, 
  Upload, 
  CheckCircle, 
  Clock, 
  XCircle,
  AlertCircle,
  Info,
  Plus,
  File,
  Image
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function ConventionManagement() {
  const [uploadingConventionId, setUploadingConventionId] = useState<number | null>(null);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: profileData } = useQuery({
    queryKey: ['student', 'profile'],
    queryFn: () => api.getProfile(),
  });

  const { data: conventionsData } = useQuery({
    queryKey: ['student', 'conventions'],
    queryFn: () => api.getStudentConventions(),
  });

  const generateConventionMutation = useMutation({
    mutationFn: () => api.generateConvention(),
    onSuccess: (htmlContent) => {
      // Open HTML content in new tab for printing/PDF conversion
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
        
        // Focus the new window
        newWindow.focus();
        
        queryClient.invalidateQueries({ queryKey: ['student', 'conventions'] });
        setIsGenerateDialogOpen(false);
        toast.success('Convention générée ! Utilisez le bouton "Imprimer / Sauver en PDF" dans le nouvel onglet.');
      } else {
        toast.error('Veuillez autoriser les pop-ups pour générer votre convention.');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la génération de la convention');
    }
  });

  const uploadConventionMutation = useMutation({
    mutationFn: ({ conventionId, file }: { conventionId: number; file: File }) => 
      api.uploadConvention(conventionId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'conventions'] });
      setUploadingConventionId(null);
      toast.success('Convention uploadée avec succès');
    },
    onError: (error) => {
      setUploadingConventionId(null);
      toast.error(error.message || 'Erreur lors de l\'upload');
    }
  });

  const student = profileData?.student;
  const conventions = conventionsData?.conventions || [];

  const getStageType = (annee: number) => {
    switch (annee) {
      case 1:
        return 'initiation';
      case 2:
        return 'fin_annee';
      case 3:
        return 'fin_etudes';
      default:
        return 'initiation';
    }
  };

  const getStageLabel = (annee: number) => {
    switch (annee) {
      case 1:
        return 'Stage d\'Initiation (1ère année)';
      case 2:
        return 'Stage de Fin d\'Année (2ème année)';
      case 3:
        return 'Stage de Fin d\'Études (3ème année)';
      default:
        return 'Stage';
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'en_attente':
        return {
          color: 'text-orange-600',
          bgColor: 'bg-orange-50 border-orange-200',
          icon: Clock,
          label: 'En attente',
          description: 'Convention générée, en attente de signature et soumission',
          canUpload: true,
          progress: 25
        };
      case 'envoye':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 border-blue-200',
          icon: Upload,
          label: 'Envoyée',
          description: 'Convention signée soumise, en attente de validation administrative',
          canUpload: false,
          progress: 75
        };
      case 'valide':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50 border-green-200',
          icon: CheckCircle,
          label: 'Validée',
          description: 'Convention approuvée par l\'administration',
          canUpload: false,
          progress: 100
        };
      case 'rejete':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50 border-red-200',
          icon: XCircle,
          label: 'Rejetée',
          description: 'Convention rejetée, voir les commentaires administratifs',
          canUpload: false,
          progress: 50
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 border-gray-200',
          icon: AlertCircle,
          label: status,
          description: '',
          canUpload: false,
          progress: 0
        };
    }
  };

  const handleGenerateConvention = () => {
    generateConventionMutation.mutate();
  };

  const handleFileUpload = (conventionId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error('Le fichier ne doit pas dépasser 10MB');
        return;
      }

      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Seuls les fichiers PDF et images (JPEG, PNG) sont acceptés');
        return;
      }

      setUploadingConventionId(conventionId);
      uploadConventionMutation.mutate({ conventionId, file });
    }
  };

  const canGenerateNewConvention = true; // Toujours permettre la génération de convention

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec bouton de génération toujours visible */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ma Convention de Stage</h1>
          <p className="text-gray-600">
            {getStageLabel(student.annee)} - {student.filiere}
          </p>
        </div>
        
        <div className="flex space-x-3">
          <Button 
            onClick={handleGenerateConvention}
            disabled={generateConventionMutation.isPending}
            size="lg"
            className="bg-primary hover:bg-primary/90"
          >
            {generateConventionMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Génération...
              </>
            ) : (
              <>
                <FileText className="h-5 w-5 mr-2" />
                Générer Convention (HTML → PDF)
              </>
            )}
          </Button>
          
          {canGenerateNewConvention && (
            <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Options avancées
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Générer votre Convention de Stage</DialogTitle>
                  <DialogDescription>
                    Une nouvelle convention sera générée selon vos informations et votre niveau d'études.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">
                      {getStageLabel(student.annee)}
                    </h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p><strong>Étudiant:</strong> {student.nom}</p>
                      <p><strong>Filière:</strong> {student.filiere}</p>
                      <p><strong>Année:</strong> {student.annee}ème année</p>
                      <p><strong>Email:</strong> {student.email}</p>
                    </div>
                  </div>
                  
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      La convention sera automatiquement personnalisée selon votre profil et type de stage.
                      Vous pourrez la télécharger immédiatement après génération.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button 
                      onClick={handleGenerateConvention} 
                      disabled={generateConventionMutation.isPending}
                    >
                      {generateConventionMutation.isPending ? 'Génération...' : 'Générer la convention'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Instructions en l'absence de convention */}
      {conventions.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="bg-blue-100 p-4 rounded-full inline-flex mb-4">
              <FileText className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Prêt à générer votre convention ?</h3>
            <p className="text-gray-600 mb-4">
              Utilisez le bouton **"Générer Convention"** ci-dessus pour créer votre convention personnalisée.
            </p>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                La convention sera adaptée automatiquement selon votre année d'études :
                <br />• 1ère année : Stage d'Initiation (4 semaines)
                <br />• 2ème année : Stage de Fin d'Année (8 semaines)
                <br />• 3ème année : Stage de Fin d'Études (12 semaines)
                <br /><br />
                ✅ <strong>Un nouvel onglet s'ouvre avec un bouton d'impression PDF !</strong>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Conventions List */}
      {conventions.map((convention, index) => {
        const statusInfo = getStatusInfo(convention.status);
        const StatusIcon = statusInfo.icon;
        
        return (
          <Card key={convention.id} className={`border ${statusInfo.bgColor}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                    <span>Convention #{convention.id}</span>
                    <Badge variant={convention.status === 'valide' ? 'default' : 'secondary'}>
                      {statusInfo.label}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {getStageLabel(student.annee)} • Générée le {convention.generatedAt && format(new Date(convention.generatedAt), 'dd MMMM yyyy', { locale: fr })}
                  </CardDescription>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-500 mb-2">Progression</div>
                  <div className="w-24">
                    <Progress value={statusInfo.progress} className="h-2" />
                    <div className="text-xs text-gray-500 mt-1">{statusInfo.progress}%</div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Status Description */}
              <div className="bg-white p-3 rounded border">
                <p className="text-sm">{statusInfo.description}</p>
              </div>

              {/* Timeline */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Convention générée</span>
                  <span className="text-gray-500">
                    {convention.generatedAt && format(new Date(convention.generatedAt), 'dd/MM/yyyy à HH:mm')}
                  </span>
                </div>
                
                {convention.submittedAt && (
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Convention soumise</span>
                    <span className="text-gray-500">
                      {format(new Date(convention.submittedAt), 'dd/MM/yyyy à HH:mm')}
                    </span>
                  </div>
                )}
                
                {convention.validatedAt && (
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Convention validée</span>
                    <span className="text-gray-500">
                      {format(new Date(convention.validatedAt), 'dd/MM/yyyy à HH:mm')}
                    </span>
                  </div>
                )}
                
                {convention.rejectedAt && (
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Convention rejetée</span>
                    <span className="text-gray-500">
                      {format(new Date(convention.rejectedAt), 'dd/MM/yyyy à HH:mm')}
                    </span>
                  </div>
                )}
              </div>

              {/* Admin Notes */}
              {convention.adminNotes && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Notes administratives:</strong><br />
                    {convention.adminNotes}
                  </AlertDescription>
                </Alert>
              )}

              {/* File Info */}
              {convention.fileName && (
                <div className="bg-white p-3 rounded border">
                  <div className="flex items-center space-x-2">
                    {convention.fileName.endsWith('.pdf') ? (
                      <File className="h-4 w-4 text-red-500" />
                    ) : (
                      <Image className="h-4 w-4 text-blue-500" />
                    )}
                    <span className="text-sm font-medium">Fichier uploadé:</span>
                    <span className="text-sm text-gray-600">{convention.fileName}</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {statusInfo.canUpload && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingConventionId === convention.id}
                    >
                      {uploadingConventionId === convention.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                          Upload en cours...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          {convention.fileName ? 'Remplacer le fichier' : 'Uploader la convention signée'}
                        </>
                      )}
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => handleFileUpload(convention.id, e)}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                    />
                  </>
                )}
                
                {convention.status === 'rejete' && (
                  <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Générer une nouvelle convention
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions pour votre Stage</CardTitle>
          <CardDescription>
            Suivez ces étapes pour valider votre convention de stage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Étapes à suivre:</h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 p-1.5 rounded-full mt-0.5">
                    <span className="text-primary font-bold text-xs">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Générer la convention</p>
                    <p className="text-xs text-gray-600">Utilisez le bouton "Générer" pour créer votre convention personnalisée</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 p-1.5 rounded-full mt-0.5">
                    <span className="text-primary font-bold text-xs">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Imprimer et signer</p>
                    <p className="text-xs text-gray-600">Imprimez la convention PDF et faites-la signer par l'organisme d'accueil</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 p-1.5 rounded-full mt-0.5">
                    <span className="text-primary font-bold text-xs">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Uploader la convention signée</p>
                    <p className="text-xs text-gray-600">Scannez ou photographiez la convention signée et uploadez-la</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 p-1.5 rounded-full mt-0.5">
                    <span className="text-primary font-bold text-xs">4</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Attendre la validation</p>
                    <p className="text-xs text-gray-600">L'administration valide votre convention sous 48h ouvrables</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Formats acceptés:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <File className="h-4 w-4 text-red-500" />
                  <span>PDF (recommandé)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Image className="h-4 w-4 text-blue-500" />
                  <span>Images: JPEG, PNG</span>
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  Taille maximale: 10MB par fichier
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="font-medium mb-2">Besoin d'aide?</h4>
                <p className="text-xs text-gray-600">
                  Contactez l'administration ENSAM pour toute question concernant votre convention de stage.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}