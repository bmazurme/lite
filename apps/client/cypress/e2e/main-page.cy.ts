describe('Главная страница', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/auth/check', { statusCode: 401, body: {} }).as('authCheck');
    cy.intercept('GET', '**/notes/pages/*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 1,
            title: 'First Note',
            preview: 'Preview of first note',
            content: 'Content',
            type: { id: 1, name: 'Article' },
          },
          {
            id: 2,
            title: 'Second Note',
            preview: 'Preview of second note',
            content: 'Content',
            type: { id: 2, name: 'Tutorial' },
          },
        ],
        total: 2,
      },
    }).as('getNotes');
  });

  it('отображает список заметок', () => {
    cy.visit('/');
    cy.wait('@getNotes');
    cy.contains('First Note').should('be.visible');
    cy.contains('Second Note').should('be.visible');
  });

  it('клик на заметку переходит на страницу заметки', () => {
    cy.visit('/');
    cy.wait('@getNotes');
    cy.get('[role="link"][aria-label*="First Note"]').click();
    cy.url().should('include', '/note/1');
  });

  it('заметки имеют атрибут role=link', () => {
    cy.visit('/');
    cy.wait('@getNotes');
    cy.get('[role="link"][aria-label*="Открыть заметку"]').should('have.length.gte', 1);
  });

  it('сайдбар отображается', () => {
    cy.visit('/');
    cy.get('nav[aria-label="Фильтрация заметок"]').should('be.visible');
  });
});
