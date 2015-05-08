(function () {

    var IframeWatcher = function () {
        var self = this;
        this.linkId       = '<%= iframeUid %>';
        this.scaffoldLite = '<%= scaffoldLite %>';
        this.initIstatsIfRequiredThen(function () {
            self.createIframe();
        });
        this.updateSizeWhenWindowResizes();
    };

    IframeWatcher.prototype = {

        updateSizeWhenWindowResizes: function () {
            var self = this;
            this.onEvent(window, 'resize', function () {
                self.setDimensions();
            });
        },

        onEvent: function (domElement, eventName, callback, useCapture) {
            if (useCapture === undefined) {
                useCapture = false;
            }

            if (domElement.addEventListener) {
                domElement.addEventListener(eventName, callback, useCapture);
            } else {
                domElement.attachEvent('on' + eventName, callback);
            }
        },
        
        data: {},
        
        updateFrequency: 32,

        createIframe: function () {

            var noSVGH2El = document.getElementById('10822NoSVG');
            noSVGH2El.style.display = 'none';

            var linkId        = this.linkId,
                href          = '<%= path %>/<%= vocab_dir %>/index.html?v=<%= version %>',
                iframeWatcher = this,
                hostId        = this.getWindowLocationOrigin(),
                route         = this.getQueryStringValue('route'),
                qsRouteHash   = (route) ? '#' + route : null,
                urlParams     = qsRouteHash || window.location.hash || '',
                hostUrl       = encodeURIComponent(window.location.href.replace(urlParams, '')),
                onBBC         = this.onBbcDomain(),
                viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
                container     = document.getElementById('<%= iframeUid %>-container');
            
            this.staticHeight = 600;
            this.addLoadingSpinner(container, linkId);
            this.container = container;
            this.uid = this.getPath(href);

            this.elm = document.createElement('iframe');
            this.elm.className = 'responsive-iframe';
            this.elm.style.width = '100%';
            this.elm.scrolling = 'no';
            this.elm.allowfullscreen = true;
            this.elm.frameBorder = '0';

            this.decideHowToTalkToIframe(href);

            this.elm.src = href + '&hostid=' + hostId.split('//')[1] + '&hostUrl=' + hostUrl + '&iframeUID=' + linkId + '&parentWidth=' + viewportWidth + '&onbbcdomain=' + onBBC + urlParams;

            container.appendChild(this.elm);

            this.lastRecordedHeight = this.elm.height;
            this.iframeInstructionsRan = false;

            this.handleIframeLoad(function startIframing() {
                iframeWatcher.getAnyInstructionsFromIframe();
                iframeWatcher.setDimensions();
            });
        },

        addLoadingSpinner: function (container, iframeUID) {
            var spinnerHolder = document.createElement('div');
            spinnerHolder.id  = iframeUID + '--bbc-news-visual-journalism-loading-spinner';
            spinnerHolder.className = 'bbc-news-visual-journalism-loading-spinner';
            container.appendChild(spinnerHolder);
        },

        handleIframeLoad: function (startIframing) {
            // IMPORTANT: Had to make this an onload because the 
            // polyfilling and jquery on one page causes issues
            this.onEvent(window, 'load', function () {
                startIframing();
            }, true);

            if (this.elm.onload) {
                this.elm.onload = startIframing;
            }
            // Bug in IE7 means onload doesn't fire when an iframe 
            // loads, but the event will fire if you attach it correctly
            else if ('attachEvent' in this.elm) {
                this.elm.attachEvent('onload', startIframing);
            }
        },

        decideHowToTalkToIframe: function (href) {
            if (window.postMessage) { // if window.postMessage is supported, then support for JSON is assumed
                var uidForPostMessage = this.getPath(href);
                this.uidForPostMessage = this.getPath(href);
                this.setupPostMessage(uidForPostMessage);
            }
            else {
                this.data.height = this.staticHeight;
                this.elm.scrolling = 'yes';
            }
        },

        onBbcDomain: function () {
            return window.location.host.search('bbc.co') > -1;
        },

        setupPostMessage: function (uid) {
            var iframeWatcher = this;
            this.onEvent(window, 'message', function (e) {
                iframeWatcher.postMessageCallback(e.data);
            });
        },

        postMessageCallback: function (data) {
            if (this.postBackMessageForThisIframe(data)) {
                this.processCommunicationFromIframe(
                    this.getObjectNotationFromDataString(data)
                );
                this.processIStatsInstructions(this.data);
                this.processAppInitInstuctions(this.data);
            }
        },

        postBackMessageForThisIframe: function (data) {
            return data && (data.split('::')[0] === this.uidForPostMessage);
        },

        getObjectNotationFromDataString: function (data) {
            return JSON.parse(data.split('::')[1]);
        },

        processCommunicationFromIframe: function (data) {
            this.data = data;
            this.setDimensions();
            this.getAnyInstructionsFromIframe();
        },

        hostIsNewsApp: function (token) {
            return (token.indexOf('bbc_news_app') > -1);
        },

        getIframeContentHeight: function () {
            if (this.data.height) {
                this.lastRecordedHeight = this.data.height;
            }
            return this.lastRecordedHeight;
        },

        setDimensions: function () {
            this.elm.width  = this.elm.parentNode.clientWidth;
            this.elm.height = this.getIframeContentHeight();
        },

        getAnyInstructionsFromIframe: function () {
            if (
                this.data.hostPageCallback &&
                (!this.iframeInstructionsRan)
            ) {
                /* jshint evil:true */
                (new Function(this.data.hostPageCallback)());
                this.iframeInstructionsRan = true;
            }
        },

        getPath: function (url) {
            var urlMinusProtocol = url.replace('http://', '');
            return urlMinusProtocol.substring(urlMinusProtocol.indexOf('/')).split('?')[0];
        },

        getWindowLocationOrigin: function () {
            if (window.location.origin) {
                return window.location.origin;
            }
            else {
                return window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
            }
        },

        removeAppWebViewLinksFromHostPage: function () {
            this.removeElementFromHostPage('a', 'href', window.location.pathname);
        },

        removeFallbackImageFromHostPage: function () {
            var imageName = this.getQueryStringValue('fallback');
            if (imageName) {
                this.removeElementFromHostPage('img', 'src', imageName);
            }
        },

        getQueryStringValue: function (name) {
            var queryString = '<!--#echo var="QUERY_STRING" -->',
                regex       = new RegExp('(?:[\\?&]|&amp;)?' + name + '=([^&#]*)'),
                results     = regex.exec(queryString);
            return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
        },

        removeElementFromHostPage: function (tagName, attrName, attrValue) {
            var element;
            if (typeof document.querySelector !== 'undefined') {
                element = document.querySelector(tagName + '[' + attrName + '*="' + attrValue + '"]');
                if (element) {
                    element.parentNode.removeChild(element);
                }
            } else {
                // Support for older browsers
                element = document.getElementsByTagName(tagName);
                for (var idx = 0; idx < element.length; ++idx) {
                    if (element[idx][attrName].indexOf(attrValue) >= 0) {
                        element[idx].parentNode.removeChild(element[idx]);
                    }
                }
            }
        },

        // ###########################################
        // #### ALL ISTATS FUNCTIONALITY IS BELOW ####
        // ###########################################

        initIstatsIfRequiredThen: function (initIframe) {
            var self = this;
            if (this.scaffoldLite === 'false' && this.onBbcDomain()) {
                require(['istats-1'], function (istats) {
                    self.istats = istats;
                    initIframe();
                });
            } else {
                // mock iStats behaviour
                self.istats = {
                    log: function () {}
                };
                initIframe();
            }
        },

        istatsQueue: [],

        processAppInitInstuctions: function (data) {
            if (data.appInited && this.mapInitInterval) {
                clearInterval(this.mapInitInterval);
            }
        },
        
        processIStatsInstructions: function (data) {
            if (this.istatsInTheData(data)) {
                this.addToIstatsQueue(data);
                this.emptyQueue(this.istatsQueue);
            }
        },
        
        istatsInTheData: function (data) {
            return data.istats && data.istats.actionType;
        },

        addToIstatsQueue: function (data) {
            this.istatsQueue.push({
                'actionType': data.istats.actionType,
                'actionName': data.istats.actionName,
                'viewLabel':  data.istats.viewLabel
            });
        },
        
        istatsQueueLocked: false,

        emptyQueue: function (queue) {
            var istatCall;
            if (this.istats && queue) {
                this.istatsQueueLocked = true;
                for (var i = 0, len = queue.length; i < len; i++) {
                    istatCall = queue.pop();
                    this.istats.log(istatCall.actionType, istatCall.actionName, {'view': istatCall.viewLabel});
                }
                this.istatsQueueLocked = false;
            }
        }
    };

    function cutsTheMustard() {
        
        var modernDevice =
            'querySelector' in document &&
            'localStorage' in window &&
            'addEventListener' in window &&
            !!document.createElementNS &&
            !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect;

        return modernDevice;
    }

    if (cutsTheMustard()) {
        var iframe = new IframeWatcher();
    }

})();
