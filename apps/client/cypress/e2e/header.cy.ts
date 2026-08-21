describe('Header', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/auth/check', { statusCode: 401, body: {} }).as('authCheck');
    cy.visit('/');
  });

  it('отображает логотип NTLSTL', () => {
    cy.get('header').contains('NTLSTL').should('be.visible');
  });

  it('логотип ведёт на главную страницу', () => {
    cy.visit('/oauth');
    cy.get('header').contains('NTLSTL').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });

  it('отображает кнопку переключения темы', () => {
    cy.get('header').find('button[aria-label*="тему"]').should('be.visible');
  });

  it('переключает тему', () => {
    cy.get('header').find('button[aria-label*="тему"]').click();
    cy.get('html').should('have.attr', 'data-theme');
  });

  it('неавторизованный пользователь видит кнопку Login', () => {
    cy.wait('@authCheck');
    cy.get('.header-menu').contains('Login').should('be.visible');
  });
});
