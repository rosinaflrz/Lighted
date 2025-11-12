export const authService = {
  login(email: string) {
    localStorage.setItem('loggedIn', 'true');
    localStorage.setItem('userEmail', email);
  },

  logout() {
    localStorage.removeItem('loggedIn');
  },

  isLoggedIn(): boolean {
    return localStorage.getItem('loggedIn') === 'true';
  },
};
