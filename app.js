(function() {

  return {

    currAttempt: 0,

    MAX_ATTEMPTS: 20,

    relatedTickets: {},

    defaultState: 'loading',

    requests: {
      search: function(params) {
        return {
          url: '/api/v2/search.json?query=' + params,
          type: 'GET'
        };
      }
    },

    events: {
      'app.activated'             : 'init',
      'keydown #search-input'     : 'handleSearch',
      'requiredProperties.ready'  : 'handleRequiredProperties',
      'search.done'               : 'handleResults'
    },

    requiredProperties : [
      'ticket.id',
      'ticket.subject'
    ],

    init: function(data){
      if(!data.firstLoad){
        return;
      }

      this.allRequiredPropertiesExist();
    },

    searchTickets: function(keywords){
      this.switchTo('searching');

      // parameters to search tickets that have been solved
      var params = keywords + " type:ticket status>pending";

      this.ajax('search', params);
    },

    handleSearch: function(e) {
      var query = this.$(e.target).val();

      if (e.which === 13) {
        if (query.length > 2) this.searchTickets(this.$(e.target).val());
        return false;
      }
    },

    handleRequiredProperties: function() {
      var keywords = this.extractKeywords(this.ticket().subject()).join(" ");

      this.$('#search-input').val(keywords);

      this.searchTickets(keywords);
    },

    handleResults: function(data) {
      var ticketId = this.ticket().id();

      // remove current ticket from results
      this.relatedTickets.results = _.reject(data.results, function(result) {
        return result.id === ticketId;
      });

      if (this.relatedTickets.results.length > 10) {
        this.relatedTickets.results = this.relatedTickets.results.slice(0,10);
      }

      this.switchTo('results', this.relatedTickets);
    },

    extractKeywords: function(text) {
      // strip punctuation and extra spaces
      text = text.toLowerCase().replace(/[\.,-\/#!$?%\^&\*;:{}=\-_`~()]/g,"").replace(/\s{2,}/g," ");

      // split by spaces
      var words = text.split(" ");

      var exclusions = this.I18n.t('stopwords.exclusions').split(",");

      var keywords = _.difference(words, exclusions);

      return keywords;
    },

    allRequiredPropertiesExist: function() {
      if (this.requiredProperties.length > 0) {
        var valid = this.validateRequiredProperty(this.requiredProperties[0]);

        // prop is valid, remove from array
        if (valid) {
          this.requiredProperties.shift();
        }

        if (this.requiredProperties.length > 0 && this.currAttempt < this.MAX_ATTEMPTS) {
          if (!valid) {
            ++this.currAttempt;
          }

          _.delay(_.bind(this.allRequiredPropertiesExist, this), 100);
          return;
        }
      }

      if (this.currAttempt < this.MAX_ATTEMPTS) {
        this.trigger('requiredProperties.ready');
      } else {
        this.showError(null, this.I18n.t('global.error.data'));
      }
    },

    validateRequiredProperty: function(property) {
      var parts = property.split('.');
      var part = '', obj = this;

      while (parts.length) {
        part = parts.shift();
        try {
          obj = obj[part]();
        } catch (e) {
          return false;
        }
        // check if property is invalid
        if (parts.length > 0 && !_.isObject(obj)) {
          return false;
        }
        // check if value returned from property is invalid
        if (parts.length === 0 && (_.isNull(obj) || _.isUndefined(obj) || obj === '' || obj === 'no')) {
          return false;
        }
      }

      return true;
    },

    showError: function(title, msg) {
      this.switchTo('error', {
        title: title || this.I18n.t('global.error.title'),
        message: msg || this.I18n.t('global.error.message')
      });
    },

    handleFail: function() {
      // Show fail message
      this.showError();
    }

  };

}());