import BaseApp from 'base_app';

const App = {

  requests: {
    search: function(query) {
      return {
        url: '/api/v2/search.json?query=' + query,
        type: 'GET'
      };
    }
  },

  events: {
    'app.created'                 : 'init',
    'ticket.subject.changed'      : 'onTicketSubjectChanged',
    'keydown .search-input'       : 'onSearchKeyPressed',
    'click .search'               : 'onSearchClicked',
    'click .related-ticket-link'  : 'onRelatedTicketLinkClicked'
  },

  init: function() {
    this.lastSearchedQuery = '';

    const client = this.zafClient;

    client.get('ticket.subject').then(data => {
      this.onTicketSubjectChanged(data['ticket.subject']);
    });
  },

  onRelatedTicketLinkClicked: function(e) {
    e.preventDefault();

    if (e.target.dataset && e.target.dataset.ticketId) {
      const client = this.zafClient;

      client.invoke('routeTo', 'ticket', e.target.dataset.ticketId);
    }
  },

  onTicketSubjectChanged: _.debounce(function(ticketSubject) {
    // don't search on empty subject lines
    if (ticketSubject) {
      const keywords = this.extractKeywords(ticketSubject);
      const query = keywords.join(" ");

      this.$('.search-input').val(query);
      this.searchTickets(query);
    } else {
      // initialise app with input placeholder text
      this.$('.search-input').attr('placeholder', this.I18n.t('search.keywords'));
    }
  }, 400),

  onSearchKeyPressed: function(e) {
    const query = this.$(e.target).val();

    if (e.which === 13 && !_.isEmpty(query)) {
      e.preventDefault();

      this.searchTickets(query);
    }
  },

  onSearchClicked: function(e) {
    e.preventDefault();

    const query = this.$('.search-input').val();

    if (!_.isEmpty(query)) {
      this.searchTickets(query);
    }
  },

  onSearchDone: function(query, resultsObj) {
    // only display our results if this is the most recently run search
    if (this.lastSearchedQuery === query) {
      const client = this.zafClient;
      let currentTicketId;

      client.get('ticket.id').then(data => {
        currentTicketId = data['ticket.id'];

        // take only the top 10 related tickets
        let tickets = resultsObj.results.slice(0,10);

        // remove current ticket from results
        if (currentTicketId) {
          tickets = _.reject(tickets, function(ticket) {
            return ticket.id === currentTicketId;
          });
        }

        // trim the returned result string and append ellipses
        _.each(tickets, function(ticket) {
          ticket.description = ticket.description.substr(0,300).concat("…");
        });

        client.context().then(data => {
          const host = data.host;
          const subdomain = data.account.subdomain;
          const base_url = 'http://' + subdomain + '.' + host + '.com';

          this.switchTo('results', {
            tickets: tickets,
            tooltip_enabled: !this.setting('disable_tooltip'),
            base_url: base_url
          });
        });
      });
    }
  },

  onSearchFailed: function() {
    this.showError();
  },

  searchTickets: function(query) {
    this.switchTo('searching');

    // parameters to search tickets that have been solved
    const filteredQuery = `${query} type:ticket status>pending`;

    // globally store the most recent search
    this.lastSearchedQuery = filteredQuery;

    this.ajax('search', filteredQuery).then(
      this.onSearchDone.bind(this, filteredQuery),
      this.onSearchFailed
    );
  },

  extractKeywords: function(text) {
    // strip punctuation and extra spaces
    text = text.toLowerCase().replace(/[\.,-\/#!$?%\^&\*;:{}=\-_`~()]/g,"").replace(/\s{2,}/g," ");

    // split by spaces
    const words = text.split(" ");
    const exclusions = this.I18n.t('stopwords.exclusions').split(",");
    const keywords = _.difference(words, exclusions);

    return keywords;
  },

  showError: function(title, msg) {
    this.switchTo('error', {
      title: title || this.I18n.t('global.error.title'),
      message: msg || this.I18n.t('global.error.message')
    });
  }
}

export default BaseApp.extend(App);
