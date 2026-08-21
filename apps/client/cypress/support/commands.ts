/* eslint-disable @typescript-eslint/no-namespace */
// Custom commands

Cypress.Commands.add('getBySel', (selector: string) => {
  return cy.get(`[data-testid="${selector}"]`);
});

declare namespace Cypress {
  interface Chainable {
    getBySel(selector: string): Chainable<JQuery<HTMLElement>>;
  }
}
