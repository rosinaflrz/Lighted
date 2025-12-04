describe('Prueba E2E - Autenticación de Usuario', () => {
  
  beforeEach(() => {
    cy.visit('http://localhost:5173/login') 
  })

  it('Debe mostrar error con credenciales incorrectas', () => {

    cy.get('input[type="email"]').type('usuario_falso@test.com')
    
    cy.get('input[type="password"]').type('123456')
    
    cy.get('button[type="submit"]').click()

    cy.url().should('include', '/login')
  })

  it('Debe iniciar sesión correctamente con credenciales válidas', () => {
    cy.get('input[type="email"]').type('rosina@lighted.com')
    cy.get('input[type="password"]').type('passwordSeguro123')
    cy.get('button[type="submit"]').click()
    cy.url().should('not.include', '/login') 
  })

})