define([
    'lib/news_special/bootstrap',
    'backbone',
    'd3'
], function (news, Backbone, d3) {
    return Backbone.View.extend({
        initialize: function (options) {
            this.setElement($('.party-selection'));
            this.mapModel = options.mapModel;
            this.selectInput = this.$('.party-selection--input');
            this.mapModel.set('selectedParty', this.selectInput.val());
        },

        events: {
            'change .party-selection--input': 'partyChanged'
        },

        partyChanged: function () {
            var selectedParty = this.selectInput.val();
            this.mapModel.set('selectedParty', selectedParty);
            news.pubsub.emit('partySelection:changed', selectedParty);
        }
    });
});
