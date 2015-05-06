define([
    'backbone',
    'data/partyColours.json'
], function (Backbone, partyColours) {
    return Backbone.Model.extend({
        defaults: partyColours,
        getPartyColourFromPercentage: function (partyCode, percentage) {
            var colours = this.get(partyCode),
                colourIndex = 5;
            
            if (percentage < 5) {
                colourIndex = 0;
            } else if (percentage < 20) {
                colourIndex = 1;
            } else if (percentage < 30) {
                colourIndex = 2;
            } else if (percentage < 40) {
                colourIndex = 3;
            } else if (percentage < 50) {
                colourIndex = 4;
            }
            
            return colours[colourIndex];
        }
    });
});
