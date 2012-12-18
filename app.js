(function() {

  return {

    currAttempt: 0,

    MAX_ATTEMPTS: 20,

    relatedTickets: {},

    defaultState: 'loading',

    resources: {

    },

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
      'requiredProperties.ready'  : 'searchTickets',

      'search.done': function(data) {
        var ticketId = this.ticket().id();

        // remove current ticket from results
        this.relatedTickets.results = _.reject(data.results, function(result) {
          return result.id === ticketId;
        });

        this.switchTo('profile', this.relatedTickets);
      }
    },

    requiredProperties : [
      'ticket.id',
      'ticket.description',
      'ticket.tags'
    ],

    init: function(data){
      if(!data.firstLoad){
        return;
      }

      this.allRequiredPropertiesExist();
    },

    searchTickets: function(){
      this.switchTo('searching');

      var keywords = this.extractKeywords(this.ticket().description());
      var tags = this.ticket().tags();

      var descriptionQuery = 'description:';

      _.each(keywords, function(element) {
        descriptionQuery += element + ' ';
      });

      var tagsQuery = 'tags:';

      _.each(tags, function(element) {
        tagsQuery += element + ' ';
      });

      // parameters to search tickets that have been solved
      var params = "type:ticket status>pending " + descriptionQuery + tagsQuery;

      this.ajax('search', params);
    },

    extractKeywords: function(text) {
      // strip punctuation and extra spaces
      text = text.toLowerCase().replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(/\s{2,}/g," ");

      // split by spaces
      var words = text.split(" ");

      // remove common words
      var exclusions = ['the','be','to','of','and','a','in','that','have','i','it','for','not','on','with','he','as','you','do','at','this','but','his','by','from','they','we','say','her','she','or','an','are','is','were','was'];
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