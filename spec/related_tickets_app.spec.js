import ZAFClient from 'zendesk_app_framework_sdk';
import I18n from 'i18n';
import RelatedTicketsApp from '../src/javascripts/related_tickets_app';

describe('RelatedTicketsApp', () => {
  let app;

  beforeEach(() => {
    const client = ZAFClient.init();
    const currentUserLocale = 'en-US';

    I18n.loadTranslations(currentUserLocale);
    app = new RelatedTicketsApp(client, { metadata: {}, context: {} });
  });

  describe('onSearchKeyPressed()', () => {
    beforeEach(() => {
      spyOn(app, 'searchTickets');
    });

    const keypressInSearchEl = (inputStr, keyCode) => {
      const searchInput = document.createElement('input');
      const e = {
        target: searchInput,
        which: keyCode,
        preventDefault: () => { return null; }
      };

      if (inputStr) { searchInput.value = inputStr }
      app.onSearchKeyPressed(e);
    }

    it('performs a search when the enter key is pressed with a valid query input string', () => {
      keypressInSearchEl('query string', 13);
      expect(app.searchTickets).toHaveBeenCalledWith('query string');
    });

    it('does not perform a search if a key other than enter is pressed', () => {
      keypressInSearchEl('query string', 9);
      expect(app.searchTickets).not.toHaveBeenCalled();
    });

    it('does not perform a search for an empty query string', () => {
      keypressInSearchEl('', 13);
      expect(app.searchTickets).not.toHaveBeenCalled();
    });
  });

  describe('onSearchFailed()', () => {
    beforeEach(() => {
      spyOn(app, 'showError');
    });

    it('should show an error', function() {
      app.onSearchFailed();
      expect(app.showError).toHaveBeenCalled();
    });
  });

  describe('searchTickets()', () => {
    beforeEach(() => {
      spyOn(app, 'switchTo');
      spyOn(app, 'ajax').and.returnValue({
        then: () => {}
      });
    });

    const query = 'There is a problem';

    it('should switch to the appropriate view', () => {
      app.searchTickets(query);
      expect(app.switchTo).toHaveBeenCalledWith('searching');
    });

    it('should attempt an ajax request with the correct filtering parameters', () => {
      app.searchTickets(query);
      expect(app.ajax).toHaveBeenCalledWith('search', `${query} type:ticket status>pending`);
    });
  });

  describe('extractKeywords()', () => {
    it('should return an array of keywords', () => {
      const text = 'Re-opened tickets after assignee has been deactivated';
      const expected = ['reopened', 'tickets', 'assignee', 'deactivated'];

      expect(app.extractKeywords(text)).toEqual(expected);
    });
  });

  describe('showError()', () => {
    beforeEach(() => {
      spyOn(app, 'switchTo');
    });

    it('should use the passed title and message parameters', () => {
      const errorSettings = {
        title: 'Error',
        msg: 'Something went wrong'
      };

      app.showError(errorSettings.title, errorSettings.msg);
      expect(app.switchTo).toHaveBeenCalledWith('error', {
        title: errorSettings.title,
        message: errorSettings.msg
      })
    });

    it('should default to the global error title and message', () => {
      app.showError();
      expect(app.switchTo).toHaveBeenCalledWith('error', {
        title: app.I18n.t('global.error.title'),
        message: app.I18n.t('global.error.message')
      })
    });
  });
});
