define([
    'lib/news_special/bootstrap',
    'backbone'
], function (news, Backbone) {
    return Backbone.View.extend({
        className: 'map-controls',
        initialize: function () {
            this.template = _.template($('#map_controls_template').html(), {});
            this.iStatsSent = [];
        },
        render: function () {
            this.$el.html(this.template);
            this.addListeners();
            return this.$el;
        },
        addListeners: function () {
            this.$el.find('.map-controls--reset').on('click', this.resetClicked.bind(null, this));
            this.$el.find('.map-controls-pan__left').on('click', this.panClicked.bind(null, this, 'left'));
            this.$el.find('.map-controls-pan__up').on('click', this.panClicked.bind(null, this, 'up'));
            this.$el.find('.map-controls-pan__right').on('click', this.panClicked.bind(null, this, 'right'));
            this.$el.find('.map-controls-pan__down').on('click', this.panClicked.bind(null, this, 'down'));
            this.$el.find('.map-controls--zoom-in').on('click', this.zoomClicked.bind(null, this, 'in'));
            this.$el.find('.map-controls--zoom-out').on('click', this.zoomClicked.bind(null, this, 'out'));
        },
        resetClicked: function (controls) {
            news.pubsub.emit('map:reset');
            controls.sendStats('reset');
        },
        panClicked: function (controls, direction) {
            news.pubsub.emit('map:pan', direction);
            controls.sendStats('arrow');
        },
        zoomClicked: function (controls, direction) {
            news.pubsub.emit('map:zoomClicked', direction);
            controls.sendStats('zoom-' + direction);
        },
        sendStats: function (type) {
            if (_.indexOf(this.iStatsSent, type) === -1) {
                this.iStatsSent.push(type);
                news.pubsub.emit('istats', [type, 'election-map']);
            }
        }
    });
});