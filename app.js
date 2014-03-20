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
      'keydown #search-input'     : 'handleKeydown',
      'click .search-icon'        : 'handleClick',
      'requiredProperties.ready'  : 'handleRequiredProperties',
      'search.done'               : 'handleResults',
      'ticket.subject.changed'    : 'handleSubjecChanged'
    },

    init: function(data){
      if(!data.firstLoad){
        return;
      }

      this.requiredProperties = [
        'ticket.subject'
      ];

      this.allRequiredPropertiesExist();
    },

    searchTickets: function(keywords){
      this.switchTo('searching');

      // parameters to search tickets that have been solved
      var params = keywords + " type:ticket status>pending";

      this.ajax('search', params);
    },

    handleKeydown: function(e) {
      var query = this.$(e.target).val();

      if (e.which === 13) {
        if (query.length > 2) this.searchTickets(query);
        return false;
      }
    },

    handleClick: function() {
      var query = this.$(".search-wrapper").find("#search-input").val();

      if (query.length > 2) this.searchTickets(query);
    },

    handleRequiredProperties: function() {
      var keywords = this.extractKeywords(this.ticket().subject()).join(" ");

      this.$('#search-input').val(keywords);

      this.searchTickets(keywords);
    },

    handleResults: function(data) {
      var ticketId = this.ticket().id();

      if (ticketId) {
        // remove current ticket from results
        this.relatedTickets.results = _.reject(data.results, function(result) {
          return result.id === ticketId;
        });
      } else {
        this.relatedTickets.results = data.results;
      }

      if (this.relatedTickets.results.length > 10) {
        this.relatedTickets.results = this.relatedTickets.results.slice(0,10);
      }

      _.each(this.relatedTickets.results, function(result) {
        result.description = result.description.substr(0,300).concat("...");
      });

      this.switchTo('results', {
        data: this.relatedTickets,
        tooltip_enabled: !this.setting('disable_tooltip')
      });
    },

    handleSubjecChanged: _.debounce(function() {
      this.handleRequiredProperties();
    }, 400),

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

    safeGetPath: function(propertyPath) {
      return _.inject( propertyPath.split('.'), function(context, segment) {
        if (context == null) { return context; }
        var obj = context[segment];
        if ( _.isFunction(obj) ) { obj = obj.call(context); }
        return obj;
      }, this);
    },

    validateRequiredProperty: function(propertyPath) {
      var value = this.safeGetPath(propertyPath);
      return value != null && value !== '' && value !== 'no';
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
