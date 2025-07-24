import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Convention } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Upload,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function ConventionsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedConvention, setSelectedConvention] = useState<Convention | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({ status: '', notes: '' });
  const queryClient = useQueryClient();

  const { data: conventionsData, isLoading } = useQuery({
    queryKey: ['admin', 'conventions'],
    queryFn: () => api.getConventions(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: string; notes?: string }) => 
      api.updateConventionStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'conventions'] });
      setIsStatusDialogOpen(false);
      setSelectedConvention(null);
      setStatusUpdate({ status: '', notes: '' });
      toast.success('Statut mis à jour avec succès');
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    }
  });

  const conventions = conventionsData?.conventions || [];

  const filteredConventions = conventions.filter((convention: Convention) => {
    const matchesSearch = 
      convention.student?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      convention.student?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      convention.typeStage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      convention.student?.filiere.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || convention.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleDownloadConvention = async (conventionId: number, fileName?: string) => {
    try {
      const blob = await api.downloadConvention(conventionId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || `convention_${conventionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Téléchargement réussi');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleUpdateStatus = () => {
    if (selectedConvention) {
      updateStatusMutation.mutate({
        id: selectedConvention.id,
        status: statusUpdate.status,
        notes: statusUpdate.notes
      });
    }
  };

  const openStatusDialog = (convention: Convention) => {
    setSelectedConvention(convention);
    setStatusUpdate({ 
      status: convention.status, 
      notes: convention.adminNotes || '' 
    });
    setIsStatusDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'en_attente':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'envoye':
        return <Badge variant="secondary"><Upload className="h-3 w-3 mr-1" />Envoyée</Badge>;
      case 'valide':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Validée</Badge>;
      case 'rejete':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejetée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeStageLabel = (typeStage: string) => {
    switch (typeStage) {
      case 'initiation':
        return 'Stage d\'initiation (1ère année)';
      case 'fin_annee':
        return 'Stage de fin d\'année (2ème année)';
      case 'fin_etudes':
        return 'Stage de fin d\'études (3ème année)';
      default:
        return typeStage;
    }
  };

  const stats = {
    total: conventions.length,
    pending: conventions.filter((c: Convention) => c.status === 'en_attente').length,
    submitted: conventions.filter((c: Convention) => c.status === 'envoye').length,
    validated: conventions.filter((c: Convention) => c.status === 'valide').length,
    rejected: conventions.filter((c: Convention) => c.status === 'rejete').length,
  };

  const conventionsByStatus = {
    all: conventions,
    en_attente: conventions.filter((c: Convention) => c.status === 'en_attente'),
    envoye: conventions.filter((c: Convention) => c.status === 'envoye'),
    valide: conventions.filter((c: Convention) => c.status === 'valide'),
    rejete: conventions.filter((c: Convention) => c.status === 'rejete'),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Conventions</h1>
        <p className="text-gray-600">Visualiser et valider les conventions de stage</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Envoyées</CardTitle>
            <Upload className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validées</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.validated}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejetées</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 flex-1">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par nom, email, filière..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="en_attente">En attente</SelectItem>
            <SelectItem value="envoye">Envoyées</SelectItem>
            <SelectItem value="valide">Validées</SelectItem>
            <SelectItem value="rejete">Rejetées</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conventions by Status Tabs */}
      <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
        <TabsList>
          <TabsTrigger value="all">Toutes ({stats.total})</TabsTrigger>
          <TabsTrigger value="en_attente">En attente ({stats.pending})</TabsTrigger>
          <TabsTrigger value="envoye">Envoyées ({stats.submitted})</TabsTrigger>
          <TabsTrigger value="valide">Validées ({stats.validated})</TabsTrigger>
          <TabsTrigger value="rejete">Rejetées ({stats.rejected})</TabsTrigger>
        </TabsList>

        {Object.entries(conventionsByStatus).map(([status, convs]) => (
          <TabsContent key={status} value={status}>
            <Card>
              <CardHeader>
                <CardTitle>
                  Conventions {status === 'all' ? '' : `- ${status.replace('_', ' ')}`} ({(convs as Convention[]).length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Chargement...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Étudiant</TableHead>
                        <TableHead>Type de Stage</TableHead>
                        <TableHead>Filière</TableHead>
                        <TableHead>Date de génération</TableHead>
                        <TableHead>Date de soumission</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredConventions
                        .filter((c: Convention) => status === 'all' || c.status === status)
                        .map((convention: Convention) => (
                        <TableRow key={convention.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{convention.student?.nom}</div>
                              <div className="text-sm text-gray-500">{convention.student?.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{getTypeStageLabel(convention.typeStage)}</TableCell>
                          <TableCell>{convention.student?.filiere}</TableCell>
                          <TableCell>
                            {convention.generatedAt && format(new Date(convention.generatedAt), 'dd/MM/yyyy', { locale: fr })}
                          </TableCell>
                          <TableCell>
                            {convention.submittedAt ? format(new Date(convention.submittedAt), 'dd/MM/yyyy', { locale: fr }) : '-'}
                          </TableCell>
                          <TableCell>{getStatusBadge(convention.status)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => openStatusDialog(convention)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {convention.filePath && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleDownloadConvention(convention.id, convention.fileName)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Gérer la Convention</DialogTitle>
            <DialogDescription>
              Étudiant: {selectedConvention?.student?.nom}
            </DialogDescription>
          </DialogHeader>
          
          {selectedConvention && (
            <div className="space-y-4">
              {/* Convention Details */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Type de stage:</span>
                    <p>{getTypeStageLabel(selectedConvention.typeStage)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Filière:</span>
                    <p>{selectedConvention.student?.filiere}</p>
                  </div>
                  <div>
                    <span className="font-medium">Année:</span>
                    <p>{selectedConvention.student?.annee}ème année</p>
                  </div>
                  <div>
                    <span className="font-medium">Statut actuel:</span>
                    <p>{getStatusBadge(selectedConvention.status)}</p>
                  </div>
                </div>
              </div>

              {/* Status Update */}
              <div className="space-y-2">
                <Label htmlFor="status">Nouveau Statut</Label>
                <Select
                  value={statusUpdate.status}
                  onValueChange={(value) => setStatusUpdate({ ...statusUpdate, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en_attente">En attente</SelectItem>
                    <SelectItem value="envoye">Envoyée</SelectItem>
                    <SelectItem value="valide">Validée</SelectItem>
                    <SelectItem value="rejete">Rejetée</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes administratives</Label>
                <Textarea
                  id="notes"
                  placeholder="Commentaires sur la validation/rejet..."
                  value={statusUpdate.notes}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, notes: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Download Section */}
              {selectedConvention.filePath && (
                <div className="space-y-2">
                  <Label>Convention signée</Label>
                  <Button 
                    variant="outline" 
                    onClick={() => handleDownloadConvention(selectedConvention.id, selectedConvention.fileName)}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger la convention signée
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleUpdateStatus} 
              disabled={updateStatusMutation.isPending || !statusUpdate.status}
            >
              {updateStatusMutation.isPending ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}