describe('Доступность', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/auth/check', { statusCode: 401, body: {} }).as('authCheck');
  });

  it('хедер имеет landmark role=banner', () => {
    cy.visit('/');
    cy.get('header').should('exist');
  });

  it('сайдбар nav имеет aria-label', () => {
    cy.visit('/');
    cy.get('nav[aria-label="Фильтрация заметок"]').should('exist');
  });

  it('основная навигация имеет aria-label', () => {
    cy.visit('/');
    cy.get('nav[aria-label="Основная навигация"]').should('exist');
  });

  it('кнопка темы имеет aria-label', () => {
    cy.visit('/');
    cy.get('button[aria-label*="тему"]').should('exist');
  });

  it('страница /oauth имеет правильный title', () => {
    cy.visit('/oauth');
    cy.title().should('contain', 'Вход');
    cy.title().should('contain', 'NTLSTL');
  });

  it('главная страница имеет правильный title', () => {
    cy.visit('/');
    cy.title().should('contain', 'Заметки');
  });

  it('страница 404 имеет правильный title', () => {
    cy.visit('/nonexistent');
    cy.title().should('contain', '404');
  });
});
