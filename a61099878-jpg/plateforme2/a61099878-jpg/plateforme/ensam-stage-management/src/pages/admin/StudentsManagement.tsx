import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type Student } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Upload, 
  Download, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export function StudentsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const [newStudent, setNewStudent] = useState({
    nom: '',
    email: '',
    telephone: '',
    filiere: '',
    annee: 1,
    codeApogee: '',
    cne: '',
    cin: '',
    dateNaissance: ''
  });

  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['admin', 'students'],
    queryFn: () => api.getStudents(),
  });

  const addStudentMutation = useMutation({
    mutationFn: (student: Omit<Student, 'id' | 'isRegistered' | 'createdAt'>) => api.addStudent(student),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      setIsAddDialogOpen(false);
      setNewStudent({
        nom: '',
        email: '',
        telephone: '',
        filiere: '',
        annee: 1,
        codeApogee: '',
        cne: '',
        cin: '',
        dateNaissance: ''
      });
      toast.success('Étudiant ajouté avec succès');
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de l\'ajout');
    }
  });

  const updateStudentMutation = useMutation({
    mutationFn: ({ id, ...student }: Partial<Student> & { id: number }) => 
      api.updateStudent(id, student),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      setIsEditDialogOpen(false);
      setSelectedStudent(null);
      toast.success('Étudiant modifié avec succès');
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la modification');
    }
  });

  const deleteStudentMutation = useMutation({
    mutationFn: (id: number) => api.deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      toast.success('Étudiant supprimé avec succès');
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  });

  const importStudentsMutation = useMutation({
    mutationFn: (file: File) => api.importStudents(file),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      setImportResult(result.result);
      toast.success(`Import terminé: ${result.result.importedRows} étudiants importés`);
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de l\'import');
    }
  });

  const students = studentsData?.students || [];

  const filteredStudents = students.filter((student: Student) => 
    student.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.filiere.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.codeApogee.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddStudent = () => {
    addStudentMutation.mutate(newStudent);
  };

  const handleEditStudent = () => {
    if (selectedStudent) {
      updateStudentMutation.mutate(selectedStudent);
    }
  };

  const handleDeleteStudent = (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet étudiant ?')) {
      deleteStudentMutation.mutate(id);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importStudentsMutation.mutate(file);
    }
  };

  const handleExport = async () => {
    try {
      const csvContent = await api.exportStudents();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `etudiants_ensam_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Export réussi');
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    }
  };

  const stats = {
    total: students.length,
    registered: students.filter((s: Student) => s.isRegistered).length,
    unregistered: students.filter((s: Student) => !s.isRegistered).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Étudiants</h1>
          <p className="text-gray-600">Gérer la base de données des étudiants</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un étudiant
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Ajouter un Étudiant</DialogTitle>
                <DialogDescription>
                  Saisissez les informations de l'étudiant
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom complet</Label>
                  <Input
                    id="nom"
                    value={newStudent.nom}
                    onChange={(e) => setNewStudent({ ...newStudent, nom: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    value={newStudent.telephone}
                    onChange={(e) => setNewStudent({ ...newStudent, telephone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filiere">Filière</Label>
                  <Select
                    value={newStudent.filiere}
                    onValueChange={(value) => setNewStudent({ ...newStudent, filiere: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une filière" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Génie Mécanique">Génie Mécanique</SelectItem>
                      <SelectItem value="Génie Électrique">Génie Électrique</SelectItem>
                      <SelectItem value="Génie Civil">Génie Civil</SelectItem>
                      <SelectItem value="Génie Industriel">Génie Industriel</SelectItem>
                      <SelectItem value="Génie Informatique">Génie Informatique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annee">Année</Label>
                  <Select
                    value={newStudent.annee.toString()}
                    onValueChange={(value) => setNewStudent({ ...newStudent, annee: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1ère année</SelectItem>
                      <SelectItem value="2">2ème année</SelectItem>
                      <SelectItem value="3">3ème année</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codeApogee">Code Apogée</Label>
                  <Input
                    id="codeApogee"
                    value={newStudent.codeApogee}
                    onChange={(e) => setNewStudent({ ...newStudent, codeApogee: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cne">CNE</Label>
                  <Input
                    id="cne"
                    value={newStudent.cne}
                    onChange={(e) => setNewStudent({ ...newStudent, cne: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cin">CIN</Label>
                  <Input
                    id="cin"
                    value={newStudent.cin}
                    onChange={(e) => setNewStudent({ ...newStudent, cin: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="dateNaissance">Date de naissance</Label>
                  <Input
                    id="dateNaissance"
                    type="date"
                    value={newStudent.dateNaissance}
                    onChange={(e) => setNewStudent({ ...newStudent, dateNaissance: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleAddStudent} disabled={addStudentMutation.isPending}>
                  {addStudentMutation.isPending ? 'Ajout...' : 'Ajouter'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        accept=".csv,.xlsx,.xls"
        className="hidden"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Étudiants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comptes Créés</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.registered}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non Inscrits</CardTitle>
            <XCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.unregistered}</div>
          </CardContent>
        </Card>
      </div>

      {/* Import Result */}
      {importResult && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Résultat de l'import:</strong><br />
            • {importResult.importedRows}/{importResult.totalRows} étudiants importés<br />
            {importResult.duplicates.length > 0 && (
              <>• {importResult.duplicates.length} doublons ignorés<br /></>
            )}
            {importResult.errors.length > 0 && (
              <>• {importResult.errors.length} erreurs<br /></>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher par nom, email, filière ou code Apogée..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Étudiants ({filteredStudents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Filière</TableHead>
                  <TableHead>Année</TableHead>
                  <TableHead>Code Apogée</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student: Student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.nom}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.filiere}</TableCell>
                    <TableCell>{student.annee}ème année</TableCell>
                    <TableCell>{student.codeApogee}</TableCell>
                    <TableCell>
                      <Badge variant={student.isRegistered ? "default" : "secondary"}>
                        {student.isRegistered ? 'Inscrit' : 'Non inscrit'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedStudent(student);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteStudent(student.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Student Dialog */}
      {selectedStudent && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Modifier l'Étudiant</DialogTitle>
              <DialogDescription>
                Modifiez les informations de l'étudiant
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nom">Nom complet</Label>
                <Input
                  id="edit-nom"
                  value={selectedStudent.nom}
                  onChange={(e) => setSelectedStudent({ ...selectedStudent, nom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={selectedStudent.email}
                  onChange={(e) => setSelectedStudent({ ...selectedStudent, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-telephone">Téléphone</Label>
                <Input
                  id="edit-telephone"
                  value={selectedStudent.telephone || ''}
                  onChange={(e) => setSelectedStudent({ ...selectedStudent, telephone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-filiere">Filière</Label>
                <Select
                  value={selectedStudent.filiere}
                  onValueChange={(value) => setSelectedStudent({ ...selectedStudent, filiere: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Génie Mécanique">Génie Mécanique</SelectItem>
                    <SelectItem value="Génie Électrique">Génie Électrique</SelectItem>
                    <SelectItem value="Génie Civil">Génie Civil</SelectItem>
                    <SelectItem value="Génie Industriel">Génie Industriel</SelectItem>
                    <SelectItem value="Génie Informatique">Génie Informatique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-annee">Année</Label>
                <Select
                  value={selectedStudent.annee.toString()}
                  onValueChange={(value) => setSelectedStudent({ ...selectedStudent, annee: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1ère année</SelectItem>
                    <SelectItem value="2">2ème année</SelectItem>
                    <SelectItem value="3">3ème année</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-codeApogee">Code Apogée</Label>
                <Input
                  id="edit-codeApogee"
                  value={selectedStudent.codeApogee}
                  onChange={(e) => setSelectedStudent({ ...selectedStudent, codeApogee: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleEditStudent} disabled={updateStudentMutation.isPending}>
                {updateStudentMutation.isPending ? 'Modification...' : 'Modifier'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}