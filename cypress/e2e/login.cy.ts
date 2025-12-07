describe('Prueba E2E - Autenticación de Usuario', () => {
  
  beforeEach(() => {
    cy.visit('http://localhost:5173/signin') 
  })

  it('Debe mostrar error con credenciales incorrectas', () => {
    cy.get('input[type="email"]').type('usuario_falso@test.com')
    cy.contains('button', 'Continue').click()
    cy.get('input[type="password"]').should('be.visible').type('12345699')
    cy.contains('button', 'Sign in').click()
    cy.url().should('include', '/signin')
    cy.contains('Invalid').should('be.visible')
  })

  it('Debe iniciar sesión correctamente con credenciales válidas', () => {
    cy.get('input[type="email"]').type('rosina@lighted.com')
    cy.contains('button', 'Continue').click()
    cy.get('input[type="password"]').should('be.visible').type('passwordSeguro123')
    cy.contains('button', 'Sign in').click()
    cy.url().should('not.include', '/signin') 
  })

})