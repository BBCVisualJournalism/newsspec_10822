define([
    'lib/news_special/bootstrap',
    'backbone',
    'd3'
], function (news, Backbone, d3) {
    return Backbone.View.extend({
        initialize: function (options) {
            this.mapModel = options.mapModel;
            this.partyColours = this.mapModel.get('partyColours');
            this.setElement($('.map-key'));

            this.updateKeyColours('TURNOUT');
        },
        
        updateKeyColours: function (party) {
            var partyPercentBars = this.$('.map-key-party-percentages li'),
                partyColours = this.partyColours.get(party);

            partyPercentBars.each(function (index) {
                $(this).css('backgroundColor', partyColours[index]);
            });

            this.$el.show();
        }
    });
});
