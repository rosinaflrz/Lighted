describe('Seguridad y Navegación', () => {

  it('Debe proteger la ruta /dashboard (Redirigir si no hay sesión)', () => {
    cy.visit('http://localhost:5173/dashboard')

    cy.url().should('include', '/login')

    cy.contains('Bienvenido').should('not.exist')
  })

  it('Flujo completo: Login -> Dashboard -> Logout', () => {
    cy.visit('http://localhost:5173/login')
    cy.get('input[type="email"]').type('rosina@lighted.com')
    cy.get('input[type="password"]').type('passwordSeguro123')
    cy.get('button[type="submit"]').click()
    
    cy.url().should('include', '/dashboard')

    cy.contains(/Cerrar|Salir|Logout|Log out/i).should('be.visible').click()

    cy.url().should('include', '/login')
    
  })

})