define([
    'backbone',
    'data/partyColours.json'
], function (Backbone, partyColours) {
    return Backbone.Model.extend({
        defaults: partyColours,
        getColoursFromPercent: function (percentage) {
            var colours = this.get('TURNOUT'),
                colourIndex = 5;

            if (percentage < 40) {
                colourIndex = 0;
            } else if (percentage < 50) {
                colourIndex = 1;
            } else if (percentage < 60) {
                colourIndex = 2;
            } else if (percentage < 70) {
                colourIndex = 3;
            } else if (percentage < 80) {
                colourIndex = 4;
            }
            
            return colours[colourIndex];
        }
    });
});
