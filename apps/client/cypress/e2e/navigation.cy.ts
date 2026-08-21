describe('Навигация', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/auth/check', { statusCode: 401, body: {} }).as('authCheck');
  });

  it('главная страница загружается', () => {
    cy.visit('/');
    cy.get('header').should('be.visible');
    cy.get('footer').should('be.visible');
  });

  it('страница /oauth отображает форму входа', () => {
    cy.visit('/oauth');
    cy.contains('Войдите, чтобы продолжить').should('be.visible');
    cy.get('a[aria-label="Войти с Яндекс ID"]').should('be.visible');
  });

  it('страница /oauth содержит кнопку назад', () => {
    cy.visit('/oauth');
    cy.get('button[aria-label="Назад"]').should('be.visible');
  });

  it('кнопка назад на /oauth возвращает на предыдущую страницу', () => {
    cy.visit('/');
    cy.visit('/oauth');
    cy.get('button[aria-label="Назад"]').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });

  it('несуществующий маршрут показывает 404', () => {
    cy.visit('/this-page-does-not-exist');
    cy.contains('404').should('be.visible');
    cy.contains('Страница не найдена').should('be.visible');
  });

  it('кнопка "Вернуться на главную" на 404 ведёт на /', () => {
    cy.visit('/this-page-does-not-exist');
    cy.contains('Вернуться на главную').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });
});
