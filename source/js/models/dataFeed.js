define([
    'backbone',
    'lib/news_special/bootstrap',
    'data/mapData'
], function (Backbone, news, MapData) {
    return Backbone.Model.extend({
        defaults: MapData
    });
});
