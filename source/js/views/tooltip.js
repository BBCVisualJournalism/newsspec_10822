define([
    'lib/news_special/bootstrap',
    'backbone',
    'd3'
], function (news, Backbone, d3) {
    return Backbone.View.extend({
        className: 'map-tooltip',
        initialize: function (options) {
            this.mapModel = options.mapModel;
            this.dataFeed = this.mapModel.get('dataFeed');
            this.partyColours = this.mapModel.get('partyColours');
            this.template = _.template($('#tooltip_template').html(), {});
            this.isResultsMode = this.mapModel.get('isResultsMode');

            this.visible = false;
            this.constText = '';

            this.constituencyNames = options.mapModel.get('constituencyNames');

            news.pubsub.on('tooltip:show', this.show.bind(this));
            news.pubsub.on('tooltip:hide', this.hide.bind(this));

            $(window).on('resize', _.debounce(this.setMapDimensions.bind(this), 50));
        },
        setMapDimensions: function () {
            var mapEl = $('.main-map--svg');
            this.mapWidth = mapEl.width();
            this.mapHeight = mapEl.height();
            this.$el.css('maxWidth', this.mapWidth / 2);

        },
        render: function () {
            this.$el.html(this.template);
            this.constituencyNameEl = this.$el.find('.tooltip--constituency-name');
            this.statusEl = this.$el.find('.tooltip-status');
            this.partyColorEl = this.statusEl.find('.party-colour');
            this.constStatusEl = this.statusEl.find('.status-text');
            _.defer(this.setMapDimensions.bind(this));
            return this.$el;
        },
        show: function (data) {
            var constituencyName = this.constituencyNames.get(data.properties.constituency_gssid),
            constData = this.dataFeed.get(data.properties.constituency_gssid);
            if (constituencyName) {
                var tooltipText = constituencyName;
                if (constData && constData.turnoutPercent) {
                    tooltipText += ' (' + constData.turnoutPercent + '%)';
                }
                    
                if (this.constText !== tooltipText) {
                    this.elWidth = this.$el.width();
                    this.elHeight = this.$el.height();
                    this.constituencyNameEl.text(tooltipText);
                    this.constText = tooltipText;
                }

                var mouseLeft = d3.event.pageX - news.$('.map-wrapper').offset().left,
                    mouseTop = d3.event.pageY - news.$('.map-wrapper').offset().top,
                    left = (mouseLeft < (this.mapWidth / 2)) ? mouseLeft + 20 : mouseLeft - this.elWidth - 40,
                    top = (mouseTop < (this.mapHeight / 2)) ? mouseTop + 30 : mouseTop - this.elHeight - 30;

                this.$el.css({'left' : left + 'px', 'top' : top + 'px'});

                if (!this.visible) {
                    this.$el.show();
                    this.visible = true;
                }
            }
        },
        hide: function () {
            if (this.visible) {
                this.visible = false;
                this.$el.hide();
            }
        }
    });
});
