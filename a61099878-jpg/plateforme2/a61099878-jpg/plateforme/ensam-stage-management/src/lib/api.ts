const API_BASE = '/api';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'student';
}

export interface Student {
  id: number;
  email: string;
  nom: string;
  telephone?: string;
  filiere: string;
  annee: number;
  codeApogee: string;
  cne: string;
  cin: string;
  dateNaissance: string;
  isRegistered: boolean;
  createdAt?: string;
}

export interface Convention {
  id: number;
  studentId: number;
  typeStage: string;
  filePath?: string;
  fileName?: string;
  status: 'en_attente' | 'envoye' | 'valide' | 'rejete';
  generatedAt?: string;
  submittedAt?: string;
  validatedAt?: string;
  rejectedAt?: string;
  adminNotes?: string;
  student?: Student;
}

class APIClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      ...options.headers as Record<string, string>,
    };

    // Only set Content-Type if not FormData
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erreur réseau' }));
      throw new Error(error.error || 'Erreur serveur');
    }

    // Handle non-JSON responses (like PDF downloads)
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      return response;
    }

    return response.json();
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
    // Add timestamp for token validation
    localStorage.setItem('auth_token_timestamp', Date.now().toString());
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_token_timestamp');
    // Clear any user-related data from localStorage
    localStorage.removeItem('user_data');
    localStorage.removeItem('cached_profile');
  }

  // Auth endpoints
  async login(email: string, password: string, role: 'admin' | 'student') {
    // Clear any existing token/data before new login
    this.clearToken();
    
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
    
    if (response.token) {
      this.setToken(response.token);
      // Cache user data securely
      localStorage.setItem('user_data', JSON.stringify(response.user));
    }
    
    return response;
  }

  async register(email: string, password: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async verifyToken() {
    return this.request('/auth/verify', {
      method: 'POST',
    });
  }

  // Admin endpoints
  async getStudents() {
    return this.request('/admin/students');
  }

  async addStudent(student: Omit<Student, 'id' | 'isRegistered' | 'createdAt'>) {
    return this.request('/admin/students', {
      method: 'POST',
      body: JSON.stringify(student),
    });
  }

  async updateStudent(id: number, student: Partial<Student>) {
    return this.request(`/admin/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(student),
    });
  }

  async deleteStudent(id: number) {
    return this.request(`/admin/students/${id}`, {
      method: 'DELETE',
    });
  }

  async importStudents(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request('/admin/import', {
      method: 'POST',
      body: formData,
    });
  }

  async exportStudents() {
    const response = await this.request('/admin/export');
    return response.text();
  }

  async getConventions() {
    return this.request('/admin/conventions');
  }

  async updateConventionStatus(id: number, status: string, notes?: string) {
    return this.request(`/admin/conventions/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
  }

  async downloadConvention(id: number) {
    const response = await this.request(`/admin/convention/${id}/download`);
    
    // Handle the response as a blob since it's a file download
    if (response instanceof Response) {
      return response.blob();
    }
    
    return response;
  }

  // Student endpoints
  async getProfile() {
    return this.request('/student/profile');
  }

  async generateConvention() {
    const response = await this.request('/student/convention/generate');
    return response.text();
  }

  async getStudentConventions() {
    return this.request('/student/conventions');
  }

  async uploadConvention(conventionId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request(`/student/convention/${conventionId}/upload`, {
      method: 'POST',
      body: formData,
    });
  }
}

export const api = new APIClient();