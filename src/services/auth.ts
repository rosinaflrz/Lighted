const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const authService = {
  login(email: string, token?: string, userId?: number) {
    localStorage.setItem('loggedIn', 'true');
    localStorage.setItem('userEmail', email);

    if (token) {
      localStorage.setItem('authToken', token);
    }
    if (userId !== undefined) {
      localStorage.setItem('userId', String(userId));
    }
  },

  // Limpia sesión
  logout() {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
  },

  // si está logeado
  isLoggedIn(): boolean {
    return localStorage.getItem('loggedIn') === 'true';
  },

  // Token jwt para llamar al api
  getToken(): string | null {
    return localStorage.getItem('authToken');
  },

  // mail usuario
  getUserEmail(): string | null {
    return localStorage.getItem('userEmail');
  },

  // ID del usuario actual
  getUserId(): number | null {
    const raw = localStorage.getItem('userId');
    return raw ? Number(raw) : null;
  },

  // Login normal
  async loginWithCredentials(email: string, pass: string) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.message || 'Login failed');
    }
    const data = await res.json();
    this.login(data.user.email, data.token, data.user.id);
  },

  // Registro
  async register(email: string, pass: string) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    });
    if (!res.ok) throw new Error('Register failed');
    const data = await res.json();
    this.login(data.user.email, data.token, data.user.id);
  },

  // Cambiar contraseña
  async changePassword(currentPass: string, newPass: string) {
    const token = this.getToken();
    const res = await fetch(`${API_BASE_URL}/auth/password`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }),
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.message || 'Error updating password');
    }
    return true;
  },

  // Eliminar cuenta
  async deleteAccountPermanent() {
    const token = this.getToken();
    const res = await fetch(`${API_BASE_URL}/auth/account`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error('Error deleting account');
    this.logout();
  },

  async loginWithGoogle(credential: string) {
    const res = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Google login failed');
    }
    
    const data = await res.json();
    this.login(data.user.email, data.token, data.user.id);
  }
};