define([
    'lib/news_special/bootstrap',
    'lib/news_special/iframemanager__frame',
    'lib/vendors/d3/topojson',
    'backbone',
    'models/map',
    'views/mapWrapper',
    'views/mapKey',
    'data/uk.topojson',
    'data/constituencyNamesEnglish.json.js',
    'models/constituencyNames'
], function (news, iframeManager, Topojson, Backbone, MapModel, MapWrapper, MapKey, mapTopoJson, constituencyNames, ConstituencyNamesModel) {
    /* Values passed from parent on load. (Query string) */
    var parentWidth = iframeManager.getValueFromQueryString('parentWidth');
        
    var mapConfig = {
        'translate': [365, 2377],
        'mapScale': 1993,
        'bounds': [[-300, -400], [775, 575]],
        'pulloutShetland': true,
        'locator': true,
        'tooltip': true,
        'interactive': (parentWidth > 700)
    };

    var Router = Backbone.Router.extend({
        routes: {
            'nation/:nation': 'nation',
            'constituency/:gssid': 'constituency',
            '*default': 'ukMap'
        },

        ukMap: function () {
            this.loadMap(mapConfig);
        },
        nation: function (nation) {
            var nationInfo;
            if (nation === 'england') {
                nationInfo = {
                    'scale': 1.55,
                    'center': [277, 207],
                    'pulloutShetland': false
                };
            } else if (nation === 'northernIreland') {
                nationInfo = {
                    'scale': 4.48,
                    'center': [130, 92],
                    'pulloutShetland': false
                };
            } else if (nation === 'scotland') {
                nationInfo = {
                    'scale': 1.2,
                    'center': [237, -87],
                    'pulloutShetland': false
                };
            } else if (nation === 'wales') {
                nationInfo = {
                    'scale': 4,
                    'center': [235, 225],
                    'pulloutShetland': false
                };
            }

            this.loadMap(_.extend(mapConfig, nationInfo));
        },
        constituency: function (constituency) {
            var constituencyInfo = {
                'gssid': constituency
            };

            this.loadMap(_.extend(mapConfig, constituencyInfo));
        },

        loadMap: function (config) {
            var features = Topojson.feature(mapTopoJson, mapTopoJson.objects['boundaries']).features;
            config.features = features;

            this.addMapWrapper(config);
        },
        addMapWrapper: function (config) {
            var container = news.$('.main'),
                mapContainer = container.find('#map'),
                mapModel = new MapModel(config);

            container.show();

            new MapKey({mapModel: mapModel});
            mapModel.set('constituencyNames', new ConstituencyNamesModel(constituencyNames));
            
            function renderMap() {
                var mapWrapper = new MapWrapper({mapModel: mapModel});
                news.sendMessageToremoveLoadingImage();
                mapContainer.append(mapWrapper.render());
            }
            renderMap();
        }
    });

    var initialize = _.once(function () {
        new Router();
        Backbone.history.start();
        news.pubsub.emit('app:inititalised');
    });

    initialize();
});
