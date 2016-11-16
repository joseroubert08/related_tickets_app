import BaseApp from 'base_app';

const App = {

  requests: {
    search: function(params) {
      return {
        url: '/api/v2/search.json?query=' + params,
        type: 'GET'
      };
    }
  },

  events: {
    'app.created'             : 'onTicketSubjectChanged',
    'ticket.subject.changed'  : 'onTicketSubjectChanged',
    'keydown #search-input'   : 'onSearchKeyPressed',
    'click .search'           : 'onSearchClicked',
    'search.done'             : 'onSearchDone',
    'search.fail'             : 'onSearchFailed'
  },

  onTicketSubjectChanged: _.debounce(function() {
    const client = this.zafClient;
    client.get('ticket.subject').then((ticketSubjectObj) => {
      const ticketSubject = ticketSubjectObj['ticket.subject'];
      // don't search on empty subject lines
      if (ticketSubject) {
        const keywords = this.extractKeywords(ticketSubject);
        this.$('.search-input').val(keywords);
        this.searchTickets(keywords);
      }
    });
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

  onSearchDone: function(resultsObj) {
    const client = this.zafClient;
    client.get('ticket.id').then((ticketIdObj) => {
      const currentTicketId = ticketIdObj['ticket.id'];

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
        ticket.description = ticket.description.substr(0,300).concat("...");
      });

      this.switchTo('results', {
        tickets: tickets,
        tooltip_enabled: !this.setting('disable_tooltip')
      });
    });
  },

  onSearchFailed: function() {
    this.showError();
  },

  searchTickets: function(keywords){
    this.switchTo('searching');

    // parameters to search tickets that have been solved
    const params = keywords + " type:ticket status>pending";

    this.ajax('search', params);
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
