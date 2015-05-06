define([
    'lib/news_special/bootstrap',
    'backbone',
    'd3',
    'views/locator'
], function (news, Backbone, d3, LocatorView) {
    return Backbone.View.extend({
        className: 'main-map--container',
        initialize: function (options) {
            this.mapModel = options.mapModel;
            this.isInteractive = this.mapModel.get('interactive');
            this.isTouchDevice = this.isTouchDevice();
            this.isResultsMode = this.mapModel.get('isResultsMode');
            this.dataFeed = this.mapModel.get('dataFeed');
            this.partyColours = this.mapModel.get('partyColours');
            this.features = this.mapModel.get('features');
            this.width = this.mapModel.get('width');
            this.height = this.mapModel.get('height');
            this.iStatsSent = [];
            
            this.d3El = d3.select(this.el);

            this.initMap();

            if (this.isInteractive) {
                /* LISTENERS */
                news.pubsub.on('map:toggleShetland', this.toggleShetland.bind(this));
                news.pubsub.on('map:reset', this.reset.bind(this));
                news.pubsub.on('map:pan', this.pan.bind(this));
                news.pubsub.on('map:zoomClicked', this.zoomClicked.bind(this));
            }
            news.pubsub.on('partySelection:changed', this.partyChange.bind(this));
        },
        initMap: function () {

            this.initScale = this.mapModel.get('maxScaleOut');
            this.bounds = this.mapModel.get('bounds');
            this.tooltipEnabled = this.mapModel.get('tooltip');

            this.projection = d3.geo.mercator()
                .scale(this.mapModel.get('mapScale'))
                .translate(this.mapModel.get('translate'));

            this.path = d3.geo.path()
                .projection(this.projection);

            if (this.isInteractive) {
                this.zoom = d3.behavior.zoom()
                    .scaleExtent([this.mapModel.get('maxScaleOut'), this.mapModel.get('maxScaleIn')])
                  .on('zoom', this.zoomHandler.bind(this));
            } else {
                this.$el.addClass('non-interactive');
            }

            this.svg = d3.select(this.el)
                .append('svg')
                .attr('class', 'main-map--svg')
                .attr('preserveAspectRatio', 'xMinYMin meet')
                .attr('viewBox', '0 0 ' + this.width + ' ' + this.height);
                
            this.group = this.svg.append('g');

        },
        render: function () {
            var _this = this;
            this.group
                .selectAll('path')
                .data(this.features)
                .enter().append('path')
                .attr('class', function (d) {
                    return (d.properties.constituency_gssid) ? 'constituency-path constituency-path__' + ((_this.isResultsMode) ? 'results' : 'campaign') : 'outline-path';
                })
                .attr('data-gssid', this.getDataGssIdFrom)
                .style('fill', function (d) {
                    var constituencyData = _this.dataFeed.get(d.properties.constituency_gssid);
                    if (constituencyData) {
                        if (constituencyData.turnoutPercent) {
                            return _this.partyColours.getColoursFromPercent(constituencyData.turnoutPercent) || '#FFF';
                        }
                        return '#FFF';
                    }
                    return '#EDEDED';
                })
                .attr('d', this.path)
                .on('mousemove', (!this.isTouchDevice) ? this.mouseOverPath.bind(null, this) : null)
                .on('mouseout', (!this.isTouchDevice) ? this.mouseOutPath.bind(null, this) : null)
                .on('click', (this.isInteractive) ? _.debounce(this.handleConstituencyClick.bind(this), 350, true) : null);

            if (this.isInteractive) {
                this.svg
                    .call(this.zoom)
                    .call(this.zoom.event)
                    .on('dblclick.zoom', null)
                    .on('dblTap.zoom', null);
            }

            if (this.mapModel.get('pulloutShetland') === true) {
                this.pulloutShetland();
            }

            this.loadLocator();
            this.positionMap();
            return this.$el;
        },
        setTranslationAndScale: function (translation, scale, animated, callback) {
            var group = (animated) ? this.group.transition().duration(1000) : this.group;
            group.attr('transform', 'translate(' + translation[0] + ',' + translation[1] + ') scale(' + scale + ')');
            if (animated) {
                group.each('end', callback);
            }

            if (this.isInteractive) {
                this.zoom.translate([translation[0], translation[1]]).scale(scale);
            }
            this.scale = scale;
            this.translation = translation;

            this.emitZoomBoundingBox(animated);
        },
        getTranslationFromCentroid: function (centroid, scale) {
            return [((this.width / 2) - (centroid[0] * scale)), ((this.height / 2) - (centroid[1] * scale))];
        },
        positionMap: function () {
            var gssid = this.mapModel.get('gssid'),
                centroid = this.mapModel.get('center'),
                scale = this.mapModel.get('scale'),
                feature;

            var translation;

            if (gssid && (feature = this.getFeatureFromGssid(gssid))) {
                // Center to GSSID.
                var tAndS = this.getTranslationAndScaleFromFeature(feature);
                translation = tAndS.translation;
                scale = tAndS.scale;
                this.currentSelectedConstituency = feature.properties.constituency_gssid;
                this.setSelectedConstituency(gssid);
                this.toggleShetland((scale <= this.initScale));
            } else if (centroid && scale) {
                //Center to nation
                translation = this.getTranslationFromCentroid(centroid, scale);
            }

            if (translation && scale) {
                var boundedValues = this.applyScaleBounds(translation, scale, scale);
                translation = boundedValues.translation;
                scale = boundedValues.scale;
                this.setTranslationAndScale(translation, scale);
            }
        },
        getFeatureFromGssid: function (gssid) {
            var returnFeature = null;
            for (var prop in this.features) {
                if (this.features.hasOwnProperty(prop)) {
                    var feature = this.features[prop];
                    if (feature.properties.constituency_gssid === gssid) {
                        returnFeature = feature;
                        break;
                    }
                }
            }
            return returnFeature;
        },
        getTranslationAndScaleFromFeature: function (feature) {
            var centroid = this.path.centroid(feature),
                bounds = this.path.bounds(feature);

            var xDiff =  bounds[1][0] - bounds[0][0],
                yDiff =  bounds[1][1] - bounds[0][1];

            var scale = (xDiff > yDiff) ? (this.width * 0.6 / xDiff) : (this.height * 0.6 / yDiff);

            return {
                scale: scale,
                translation: this.getTranslationFromCentroid(centroid, scale)
            };

        },
        zoomHandler: function () {
            this.isPanningOrZoom = true;
            var scale = d3.event.scale,
                translation = this.applyTranslationBounds(d3.event.translate, scale);
            
            this.setTranslationAndScale(translation, scale);
            
            if (scale <= this.initScale) {
                this.toggleShetland(true);
            } else {
                this.toggleShetland(false);
            }

            var _this = this;
            clearTimeout(this.panningTimeout);
            this.panningTimeout = setTimeout(function () {
                _this.isPanningOrZoom = false;
            }.bind(this), 250);

            if (this.zoomInit) {
                this.sendStats('scroll');
            } else {
                this.zoomInit = true;
            }
        },
        handleConstituencyClick: function (d, node) {
            if (!this.isPanningOrZoom && d.properties.constituency_gssid) {

                // If already zoomed into what user clicked, zoom out.
                if (!this.currentSelectedConstituency || this.currentSelectedConstituency !== d.properties.constituency_gssid) {
                    var scale, translation,
                        tAndS = this.getTranslationAndScaleFromFeature(d),
                        boundedValues;

                    scale = tAndS.scale;
                    translation = tAndS.translation;
                    this.currentSelectedConstituency = d.properties.constituency_gssid;
                    this.toggleShetland(false);
                    news.pubsub.emit('panel:show', d.properties.constituency_gssid);

                    boundedValues = this.applyScaleBounds(translation, scale, scale);
                    translation = boundedValues.translation;
                    scale = boundedValues.scale;
                    this.sendStats('click');

                    news.pubsub.emit('tooltip:hide');
                    this.setTranslationAndScale(translation, scale, true);
                    this.setSelectedConstituency(d.properties.constituency_gssid);
                }
            }
        },
        setSelectedConstituency: function (gssid) {
            this.resetSelectedConstituency();
            var selectedPath = $(this.group[0]).find('[data-gssid="' + gssid + '"]'),
                path = selectedPath[0],
                parentElm = path.parentNode,
                modeClass = 'constituency-path__selected--campaign';

            if (this.isResultsMode) {
                var constData = this.dataFeed.get(gssid),
                    hasResults = (constData && constData.winningPartyCode) ? 'has-results' : 'no-result';
                modeClass = 'constituency-path__selected--results constituency-path__selected--results__' + hasResults;
            }
            
            selectedPath.attr('class', 'constituency-path constituency-path__' + ((this.isResultsMode) ? 'results' : 'campaign') + ' constituency-path__selected ' + modeClass);

            parentElm.removeChild(path);
            parentElm.appendChild(path);
        },
        resetSelectedConstituency: function () {
            this.$el.find('.constituency-path__selected').attr('class', 'constituency-path constituency-path__' + ((this.isResultsMode) ? 'results' : 'campaign'));
        },
        getDataGssIdFrom: function (feature) {
            return feature.properties.constituency_gssid ? feature.properties.constituency_gssid : 'outline';
        },
        loadLocator: function () {
            if (this.mapModel.get('locator') === true) {
                var locatorView = new LocatorView({mapModel: this.mapModel});
                this.$el.append(locatorView.render());
            }
        },
        pulloutShetland: function () {
            var shetlandGssid = 'S14000051',
                shetlandsPath = this.group.select('[data-gssid="' + shetlandGssid + '"]'),
                width = (this.width / 5) + 5,
                height = width * 1.875,
                _this = this;

            this.shetlandPullout = this.svg.append('svg')
                .attr({
                    'class': 'shetland--pullout',
                    'x': (this.width - width - 7),
                    'y': 7,
                    'width': width,
                    'height': height,
                    'viewBox': '0 0 ' + width + ' ' + height
                });

            this.shetlandPullout.append('rect')
                .attr({
                    'class': 'shetland-pullout--box',
                    'x': 2,
                    'y': 2,
                    'width': width - 4,
                    'height': height - 4
                });

            this.shetlandGroup = this.shetlandPullout.append('g');

            this.shetlandGroup.append('path')
                .attr('class', 'constituency-path constituency-path__' + ((this.isResultsMode) ? 'results' : 'campaign'))
                .attr('data-gssid', shetlandGssid)
                .attr('d', shetlandsPath.attr('d'))
                .style('fill', function () {
                    var constituencyData = _this.dataFeed.get(shetlandGssid);
                    if (constituencyData) {
                        if (constituencyData && constituencyData.turnoutPercent) {
                            return _this.partyColours.getColoursFromPercent(constituencyData.turnoutPercent) || '#FFF';
                        }
                        return '#FFF';
                    }
                    return '#EDEDED';

                });
                

            this.shetlandPullout.on('click', function () {
                shetlandsPath.on('click').call(shetlandsPath.node(), shetlandsPath.datum());
            });

            this.shetlandGroup.attr('transform', 'translate(-210, 300)scale(0.9)');

            this.shetlandPullout
                .on('mousemove', (!this.isTouchDevice) ? this.mouseOverPath.bind(null, this, shetlandsPath.datum()) : null)
                .on('mouseout', (!this.isTouchDevice) ? this.mouseOutPath.bind(null, this) : null);
        },
        toggleShetland: function (show) {
            if (this.shetlandPullout && this.shetlandShown !== show) {
                /* Stops us hitting the DOM, if it's already the current value */
                this.shetlandShown = show;

                var _this = this;
                var opacityValue = show ? 1 : 0;
                this.shetlandPullout.attr('display', 'block');
                this.shetlandPullout.transition()
                    .duration(500)
                    .attr('opacity', opacityValue)
                    .each('end', function () {
                        var displayValue = show ? 'block' : 'none';
                        _this.shetlandPullout.attr('display', displayValue);
                    });
            }
        },
        emitZoomBoundingBox: function (animate) {
            var zoomBox = {
                left: -(this.translation[0] / this.scale),
                top: -(this.translation[1] / this.scale),
                right: (this.width - this.translation[0]) / this.scale,
                bottom: (this.height - this.translation[1]) / this.scale
            };
            news.pubsub.emit('map:zoom-box', [zoomBox, this.scale, animate]);
        },
        /* Ensures a translation doesn't take the map out of the specified bounds */
        applyTranslationBounds: function (translation, scale) {
            translation[0] = Math.min(-this.bounds[0][0] * scale, Math.max(-this.bounds[1][0] * scale + this.width, translation[0]));
            translation[1] = Math.min(-this.bounds[0][1] * scale, Math.max(-this.bounds[1][1] * scale + this.height, translation[1]));
            return translation;
        },
        applyScaleBounds: function (translation, scale, previousScale) {
            var maxScaleOut = this.mapModel.get('maxScaleOut'),
                maxScaleIn = this.mapModel.get('maxScaleIn'),
                center = [this.width / 2, this.height / 2],
                scaleFactor = scale / previousScale;

            if (scale < maxScaleOut || scale > maxScaleIn) {
                scale = (scale < maxScaleOut) ? maxScaleOut : maxScaleIn;
                scaleFactor = scale / previousScale;
            }

            translation[0] = (translation[0] - center[0]) * scaleFactor + center[0];
            translation[1] = (translation[1] - center[1]) * scaleFactor + center[1];

            return {
                translation: translation,
                scale: scale
            };
        },
        applyScaleAndTranslationBounds: function (translation, scale, previousScale) {
            var scaleBounded = this.applyScaleBounds(scale, translation, this.scale),
                boundedTanslation = this.applyTranslationBounds(scaleBounded.translation, scaleBounded.scale);

            return {
                translation: boundedTanslation,
                scale: scaleBounded.scale
            };
        },
        reset: function () {
            var gssid = this.mapModel.get('gssid'),
                scale, translation;

            if (gssid) {
                var feature = this.getFeatureFromGssid(gssid),
                    tAndS = this.getTranslationAndScaleFromFeature(feature);

                translation = tAndS.translation;
                scale = tAndS.scale;
                this.currentSelectedConstituency = feature.properties.constituency_gssid;
                this.setSelectedConstituency(gssid);
                var boundedValues = this.applyScaleBounds(translation, scale, scale);
                translation = boundedValues.translation;
                scale = boundedValues.scale;
            } else {
                var  centroid = this.mapModel.get('center');
                scale = this.mapModel.get('scale');
                translation = this.getTranslationFromCentroid(centroid, scale);
                this.currentSelectedConstituency = null;
                this.resetSelectedConstituency();
            }

            this.setTranslationAndScale(translation, scale, true);
            news.pubsub.emit('panel:hide');
        },
        pan: function (direction) {
            var translation = this.translation;
            switch (direction) {
            case 'left':
                translation[0] += this.width / 3;
                break;
            case 'right':
                translation[0] -= this.width / 3;
                break;
            case 'up':
                translation[1] += this.height / 3;
                break;
            case 'down':
                translation[1] -= this.height / 3;
                break;
            }
            this.setTranslationAndScale(this.applyTranslationBounds(translation, this.scale), this.scale, true);
        },
        zoomClicked: function (direction) {
            var translation = this.translation,
                scaleFactor;

            switch (direction) {
            case 'in':
                scaleFactor = 2.2;
                break;
            case 'out':
                scaleFactor = 1 / 2.2;
                break;
            }
           
            var scale = this.scale * scaleFactor,
                boundedValues = this.applyScaleAndTranslationBounds(scale, translation, this.scale);

            this.setTranslationAndScale(boundedValues.translation, boundedValues.scale, true);

            if (scale > this.initScale) {
                this.toggleShetland(false);
            }
        },
        mouseOverPath: function (map, d) {
            if (map.tooltipEnabled === true && (map.isInteractive) && d.properties.constituency_gssid) {
                if (map.currentSelectedConstituency !== d.properties.constituency_gssid) {
                    news.pubsub.emit('tooltip:show', [d]);
                } else {
                    news.pubsub.emit('tooltip:hide');
                }
            }
        },
        mouseOutPath: function (map) {
            if (map.tooltipEnabled === true && (map.isInteractive)) {
                news.pubsub.emit('tooltip:hide');
            }
        },
        isTouchDevice: function () {
            return (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch);
        },
        sendStats: function (type) {
            if (_.indexOf(this.iStatsSent, type) === -1) {
                this.iStatsSent.push(type);
                news.pubsub.emit('istats', [type, 'election-map']);
            }
        },
        partyChange: function (newParty) {
            var _this = this,
                constituencyPaths = this.$('.constituency-path[data-gssid]');

            constituencyPaths.each(function () {
                var constPath = $(this);
                constPath.css('fill', function () {
                    var constituencyData = _this.dataFeed.get(constPath.data('gssid'));
                    if (constituencyData) {
                        if (constituencyData && constituencyData.turnoutPercent) {
                            return _this.partyColours.getColoursFromPercent(constituencyData.turnoutPercent) || '#FFF';
                        }
                        return '#FFF';
                        
                    }
                    return '#EDEDED';

                });
            });
            
            _this.reset();
        }

    });
});
