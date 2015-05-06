define([
    'lib/news_special/bootstrap',
    'backbone',
    'views/map',
    'views/controls',
    'views/panel',
    'views/tooltip'
], function (news, Backbone, MapView, ControlsView, PanelView, TooltipView) {
    return Backbone.View.extend({
        className: 'map-wrapper',
        initialize: function (options) {
            this.container = options.container;
            this.mapModel = options.mapModel;
        },
        render: function () {
            if (this.mapModel.get('interactive')) {
                this.$el.append(
                    this.getMap(),
                    this.getControls(),
                    this.getPanel(),
                    this.getTooltip()
                );
            } else {
                this.$el.append(this.getMap());
            }
            return this.$el;
        },
        getMap: function () {
            return new MapView({mapModel: this.mapModel}).render();
        },
        getControls: function () {
            return new ControlsView().render();
        },
        getPanel: function () {
            return new PanelView({mapModel: this.mapModel}).render();
        },
        getTooltip: function () {
            return new TooltipView({mapModel: this.mapModel}).render();
        }
    });
});