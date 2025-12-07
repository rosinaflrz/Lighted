describe('Seguridad y Navegación', () => {

  it('Debe proteger la ruta /dashboard (Redirigir si no hay sesión)', () => {
    cy.visit('http://localhost:5173/dashboard')
    cy.url().should('include', '/signin')
    cy.contains('Bienvenido').should('not.exist')
  })

  it('Flujo completo: Login -> Dashboard -> Logout', () => {
    cy.visit('http://localhost:5173/signin')
    // Login (Paso 1)
    cy.get('input[type="email"]').type('rosina@lighted.com')
    cy.contains('button', 'Continue').click()
    // Login (Paso 2)
    cy.get('input[type="password"]').should('be.visible').type('passwordSeguro123')
    cy.contains('button', 'Sign in').click()
    cy.url().should('include', '/dashboard-landing')
    cy.get('button[aria-label="log out"]').should('be.visible').click()
    cy.url().should('include', '/signin')
  })

})