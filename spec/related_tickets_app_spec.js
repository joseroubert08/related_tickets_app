import ZAFClient from 'zendesk_app_framework_sdk';
import RelatedTicketsApp from '../../src/javascripts/related_tickets_app';

describe('RelatedTicketsApp', () => {
  const app;

  beforeEach(() => {
    const client = ZAFClient.init();
    app = new RelatedTicketsApp(client, { metadata: {}, context: {} });
  });

  describe('onSearchKeyPressed()', () => {
    beforeEach(() => {
      spyOn(app, 'searchTickets');
    });

    afterEach(() => {
      app.searchTickets.calls.reset();
    });

    it('performs a search when the enter key is pressed with a valid query input string', () => {
      const e = {
        target:
        which: 13
      }
      app.onSearchKeyPressed(e);
      expect(app.searchTickets).toHaveBeenCalledWith('query')
    });

    it('does not perform a search for an empty query string', () => {
      const e = {
        target:
        which: 13
      }
      app.onSearchKeyPressed(e);
      expect(app.searchTickets).not.toHaveBeenCalled();
    });
  })

  /*describe('#renderMain', () => {
    beforeEach(() => {
      spyOn(app, 'switchTo');
    });

    it('switches to the main template', () => {
      var data = { user: 'Mikkel' };
      app.renderMain(data);
      expect(app.switchTo).toHaveBeenCalledWith('main', data.user);
    });
  });*/
});
