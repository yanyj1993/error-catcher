// add by yanyj 20180502 start
// catcher
(function (root, factory) {

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.

        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.catcher = factory();
    }
}(this, function () {
    var defaultConfig = {
        remote: 'http://localhost:',
        level: 'error'
    };

    // 上报
    var report = function (url, error) {

    };

    // 获取内网ip
    function getIPs(callback) {
        var ip_dups = {};

        //compatibility for firefox and chrome
        var RTCPeerConnection = window.RTCPeerConnection
            || window.mozRTCPeerConnection
            || window.webkitRTCPeerConnection;
        var useWebKit = !!window.webkitRTCPeerConnection;

        //bypass naive webrtc blocking using an iframe
        if (!RTCPeerConnection) {
            //NOTE: you need to have an iframe in the page right above the script tag
            //
            //<iframe id="iframe" sandbox="allow-same-origin" style="display: none"></iframe>
            //<script>...getIPs called in here...
            //
            var win = iframe.contentWindow;
            RTCPeerConnection = win.RTCPeerConnection
                || win.mozRTCPeerConnection
                || win.webkitRTCPeerConnection;
            useWebKit = !!win.webkitRTCPeerConnection;
        }

        //minimal requirements for data connection
        var mediaConstraints = {
            optional: [{RtpDataChannels: true}]
        };

        var servers = {iceServers: [{urls: "stun:stun.services.mozilla.com"}]};

        //construct a new RTCPeerConnection
        var pc = new RTCPeerConnection(servers, mediaConstraints);

        function handleCandidate(candidate) {
            //match just the IP address
            var ip_regex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/
            var ip_addr = ip_regex.exec(candidate)[1];

            //remove duplicates
            if (ip_dups[ip_addr] === undefined)
                callback(ip_addr);

            ip_dups[ip_addr] = true;
        }

        //listen for candidate events
        pc.onicecandidate = function (ice) {

            //skip non-candidate events
            if (ice.candidate)
                handleCandidate(ice.candidate.candidate);
        };

        //create a bogus data channel
        pc.createDataChannel("");

        //create an offer sdp
        pc.createOffer(function (result) {

            //trigger the stun server request
            pc.setLocalDescription(result, function () {
            }, function () {
            });

        }, function () {
        });

        //wait for a while to let everything done
        setTimeout(function () {
            //read candidate info from local description
            var lines = pc.localDescription.sdp.split('\n');

            lines.forEach(function (line) {
                if (line.indexOf('a=candidate:') === 0)
                    handleCandidate(line);
            });
        }, 1000);
    }

    var polyFillFetch = function () {
        (function (self) {
            'use strict';

            // if __disableNativeFetch is set to true, the it will always polyfill fetch
            // with Ajax.
            if (!self.__disableNativeFetch && self.fetch) {
                return
            }

            function normalizeName(name) {
                if (typeof name !== 'string') {
                    name = String(name)
                }
                if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
                    throw new TypeError('Invalid character in header field name')
                }
                return name.toLowerCase()
            }

            function normalizeValue(value) {
                if (typeof value !== 'string') {
                    value = String(value)
                }
                return value
            }

            function Headers(headers) {
                this.map = {}

                if (headers instanceof Headers) {
                    headers.forEach(function (value, name) {
                        this.append(name, value)
                    }, this)

                } else if (headers) {
                    Object.getOwnPropertyNames(headers).forEach(function (name) {
                        this.append(name, headers[name])
                    }, this)
                }
            }

            Headers.prototype.append = function (name, value) {
                name = normalizeName(name)
                value = normalizeValue(value)
                var list = this.map[name]
                if (!list) {
                    list = []
                    this.map[name] = list
                }
                list.push(value)
            }

            Headers.prototype['delete'] = function (name) {
                delete this.map[normalizeName(name)]
            }

            Headers.prototype.get = function (name) {
                var values = this.map[normalizeName(name)]
                return values ? values[0] : null
            }

            Headers.prototype.getAll = function (name) {
                return this.map[normalizeName(name)] || []
            }

            Headers.prototype.has = function (name) {
                return this.map.hasOwnProperty(normalizeName(name))
            }

            Headers.prototype.set = function (name, value) {
                this.map[normalizeName(name)] = [normalizeValue(value)]
            }

            Headers.prototype.forEach = function (callback, thisArg) {
                Object.getOwnPropertyNames(this.map).forEach(function (name) {
                    this.map[name].forEach(function (value) {
                        callback.call(thisArg, value, name, this)
                    }, this)
                }, this)
            }

            function consumed(body) {
                if (body.bodyUsed) {
                    return Promise.reject(new TypeError('Already read'))
                }
                body.bodyUsed = true
            }

            function fileReaderReady(reader) {
                return new Promise(function (resolve, reject) {
                    reader.onload = function () {
                        resolve(reader.result)
                    }
                    reader.onerror = function () {
                        reject(reader.error)
                    }
                })
            }

            function readBlobAsArrayBuffer(blob) {
                var reader = new FileReader()
                reader.readAsArrayBuffer(blob)
                return fileReaderReady(reader)
            }

            function readBlobAsText(blob, options) {
                var reader = new FileReader()
                var contentType = options.headers.map['content-type'] ? options.headers.map['content-type'].toString() : ''
                var regex = /charset\=[0-9a-zA-Z\-\_]*;?/
                var _charset = blob.type.match(regex) || contentType.match(regex)
                var args = [blob]

                if (_charset) {
                    args.push(_charset[0].replace(/^charset\=/, '').replace(/;$/, ''))
                }

                reader.readAsText.apply(reader, args)
                return fileReaderReady(reader)
            }

            var support = {
                blob: 'FileReader' in self && 'Blob' in self && (function () {
                    try {
                        new Blob();
                        return true
                    } catch (e) {
                        return false
                    }
                })(),
                formData: 'FormData' in self,
                arrayBuffer: 'ArrayBuffer' in self
            }

            function Body() {
                this.bodyUsed = false


                this._initBody = function (body, options) {
                    this._bodyInit = body
                    if (typeof body === 'string') {
                        this._bodyText = body
                    } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
                        this._bodyBlob = body
                        this._options = options
                    } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
                        this._bodyFormData = body
                    } else if (!body) {
                        this._bodyText = ''
                    } else if (support.arrayBuffer && ArrayBuffer.prototype.isPrototypeOf(body)) {
                        // Only support ArrayBuffers for POST method.
                        // Receiving ArrayBuffers happens via Blobs, instead.
                    } else {
                        throw new Error('unsupported BodyInit type')
                    }
                }

                if (support.blob) {
                    this.blob = function () {
                        var rejected = consumed(this)
                        if (rejected) {
                            return rejected
                        }

                        if (this._bodyBlob) {
                            return Promise.resolve(this._bodyBlob)
                        } else if (this._bodyFormData) {
                            throw new Error('could not read FormData body as blob')
                        } else {
                            return Promise.resolve(new Blob([this._bodyText]))
                        }
                    }

                    this.arrayBuffer = function () {
                        return this.blob().then(readBlobAsArrayBuffer)
                    }

                    this.text = function () {
                        var rejected = consumed(this)
                        if (rejected) {
                            return rejected
                        }

                        if (this._bodyBlob) {
                            return readBlobAsText(this._bodyBlob, this._options)
                        } else if (this._bodyFormData) {
                            throw new Error('could not read FormData body as text')
                        } else {
                            return Promise.resolve(this._bodyText)
                        }
                    }
                } else {
                    this.text = function () {
                        var rejected = consumed(this)
                        return rejected ? rejected : Promise.resolve(this._bodyText)
                    }
                }

                if (support.formData) {
                    this.formData = function () {
                        return this.text().then(decode)
                    }
                }

                this.json = function () {
                    return this.text().then(JSON.parse)
                }

                return this
            }

            // HTTP methods whose capitalization should be normalized
            var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

            function normalizeMethod(method) {
                var upcased = method.toUpperCase()
                return (methods.indexOf(upcased) > -1) ? upcased : method
            }

            function Request(input, options) {
                options = options || {}
                var body = options.body
                if (Request.prototype.isPrototypeOf(input)) {
                    if (input.bodyUsed) {
                        throw new TypeError('Already read')
                    }
                    this.url = input.url
                    this.credentials = input.credentials
                    if (!options.headers) {
                        this.headers = new Headers(input.headers)
                    }
                    this.method = input.method
                    this.mode = input.mode
                    if (!body) {
                        body = input._bodyInit
                        input.bodyUsed = true
                    }
                } else {
                    this.url = input
                }

                this.credentials = options.credentials || this.credentials || 'omit'
                if (options.headers || !this.headers) {
                    this.headers = new Headers(options.headers)
                }
                this.method = normalizeMethod(options.method || this.method || 'GET')
                this.mode = options.mode || this.mode || null
                this.referrer = null

                if ((this.method === 'GET' || this.method === 'HEAD') && body) {
                    throw new TypeError('Body not allowed for GET or HEAD requests')
                }
                this._initBody(body, options)
            }

            Request.prototype.clone = function () {
                return new Request(this)
            }

            function decode(body) {
                var form = new FormData()
                body.trim().split('&').forEach(function (bytes) {
                    if (bytes) {
                        var split = bytes.split('=')
                        var name = split.shift().replace(/\+/g, ' ')
                        var value = split.join('=').replace(/\+/g, ' ')
                        form.append(decodeURIComponent(name), decodeURIComponent(value))
                    }
                })
                return form
            }

            function headers(xhr) {
                var head = new Headers()
                var pairs = xhr.getAllResponseHeaders().trim().split('\n')
                pairs.forEach(function (header) {
                    var split = header.trim().split(':')
                    var key = split.shift().trim()
                    var value = split.join(':').trim()
                    head.append(key, value)
                })
                return head
            }

            Body.call(Request.prototype)

            function Response(bodyInit, options) {
                if (!options) {
                    options = {}
                }

                this._initBody(bodyInit, options)
                this.type = 'default'
                this.status = options.status
                this.ok = this.status >= 200 && this.status < 300
                this.statusText = options.statusText
                this.headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers)
                this.url = options.url || ''
            }

            Body.call(Response.prototype)

            Response.prototype.clone = function () {
                return new Response(this._bodyInit, {
                    status: this.status,
                    statusText: this.statusText,
                    headers: new Headers(this.headers),
                    url: this.url
                })
            }

            Response.error = function () {
                var response = new Response(null, {status: 0, statusText: ''})
                response.type = 'error'
                return response
            }

            var redirectStatuses = [301, 302, 303, 307, 308]

            Response.redirect = function (url, status) {
                if (redirectStatuses.indexOf(status) === -1) {
                    throw new RangeError('Invalid status code')
                }

                return new Response(null, {status: status, headers: {location: url}})
            }

            self.Headers = Headers;
            self.Request = Request;
            self.Response = Response;

            self.fetch = function (input, init) {
                return new Promise(function (resolve, reject) {
                    var request
                    if (Request.prototype.isPrototypeOf(input) && !init) {
                        request = input
                    } else {
                        request = new Request(input, init)
                    }

                    var xhr = new XMLHttpRequest()

                    function responseURL() {
                        if ('responseURL' in xhr) {
                            return xhr.responseURL
                        }

                        // Avoid security warnings on getResponseHeader when not allowed by CORS
                        if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
                            return xhr.getResponseHeader('X-Request-URL')
                        }

                        return;
                    }

                    var __onLoadHandled = false;

                    function onload() {
                        if (xhr.readyState !== 4) {
                            return
                        }
                        var status = (xhr.status === 1223) ? 204 : xhr.status
                        if (status < 100 || status > 599) {
                            if (__onLoadHandled) {
                                return;
                            } else {
                                __onLoadHandled = true;
                            }
                            reject(new TypeError('Network request failed'))
                            return
                        }
                        var options = {
                            status: status,
                            statusText: xhr.statusText,
                            headers: headers(xhr),
                            url: responseURL()
                        }
                        var body = 'response' in xhr ? xhr.response : xhr.responseText;

                        if (__onLoadHandled) {
                            return;
                        } else {
                            __onLoadHandled = true;
                        }
                        resolve(new Response(body, options))
                    }

                    xhr.onreadystatechange = onload;
                    xhr.onload = onload;
                    xhr.onerror = function () {
                        if (__onLoadHandled) {
                            return;
                        } else {
                            __onLoadHandled = true;
                        }
                        reject(new TypeError('Network request failed'))
                    }

                    xhr.open(request.method, request.url, true)

                    // `withCredentials` should be setted after calling `.open` in IE10
                    // http://stackoverflow.com/a/19667959/1219343
                    try {
                        if (request.credentials === 'include') {
                            if ('withCredentials' in xhr) {
                                xhr.withCredentials = true;
                            } else {
                                console && console.warn && console.warn('withCredentials is not supported, you can ignore this warning');
                            }
                        }
                    } catch (e) {
                        console && console.warn && console.warn('set withCredentials error:' + e);
                    }

                    if ('responseType' in xhr && support.blob) {
                        xhr.responseType = 'blob'
                    }

                    request.headers.forEach(function (value, name) {
                        xhr.setRequestHeader(name, value)
                    })

                    xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
                })
            }
            self.fetch.polyfill = true

            // Support CommonJS
            if (typeof module !== 'undefined' && module.exports) {
                module.exports = self.fetch;
            }
        })(typeof self !== 'undefined' ? self : this);
    };
    var polyFillFetchJsonp = function () {
        (function (global, factory) {
            if (typeof define === 'function' && define.amd) {
                define(['exports', 'module'], factory);
            } else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
                factory(exports, module);
            } else {
                var mod = {
                    exports: {}
                };
                factory(mod.exports, mod);
                global.fetchJsonp = mod.exports;
            }
        })(this, function (exports, module) {
            'use strict';

            var defaultOptions = {
                timeout: 5000,
                jsonpCallback: 'callback',
                jsonpCallbackFunction: null
            };

            function generateCallbackFunction() {
                return 'jsonp_' + Date.now() + '_' + Math.ceil(Math.random() * 100000);
            }

            function clearFunction(functionName) {
                // IE8 throws an exception when you try to delete a property on window
                // http://stackoverflow.com/a/1824228/751089
                try {
                    delete window[functionName];
                } catch (e) {
                    window[functionName] = undefined;
                }
            }

            function removeScript(scriptId) {
                var script = document.getElementById(scriptId);
                if (script) {
                    document.getElementsByTagName('head')[0].removeChild(script);
                }
            }

            function fetchJsonp(_url) {
                var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

                // to avoid param reassign
                var url = _url;
                var timeout = options.timeout || defaultOptions.timeout;
                var jsonpCallback = options.jsonpCallback || defaultOptions.jsonpCallback;

                var timeoutId = undefined;

                return new Promise(function (resolve, reject) {
                    var callbackFunction = options.jsonpCallbackFunction || generateCallbackFunction();
                    var scriptId = jsonpCallback + '_' + callbackFunction;

                    window[callbackFunction] = function (response) {
                        resolve({
                            ok: true,
                            // keep consistent with fetch API
                            json: function json() {
                                return Promise.resolve(response);
                            }
                        });

                        if (timeoutId) clearTimeout(timeoutId);

                        removeScript(scriptId);

                        clearFunction(callbackFunction);
                    };

                    // Check if the user set their own params, and if not add a ? to start a list of params
                    url += url.indexOf('?') === -1 ? '?' : '&';

                    var jsonpScript = document.createElement('script');
                    jsonpScript.setAttribute('src', '' + url + jsonpCallback + '=' + callbackFunction);
                    if (options.charset) {
                        jsonpScript.setAttribute('charset', options.charset);
                    }
                    jsonpScript.id = scriptId;
                    document.getElementsByTagName('head')[0].appendChild(jsonpScript);

                    timeoutId = setTimeout(function () {
                        reject(new Error('JSONP request to ' + _url + ' timed out'));

                        clearFunction(callbackFunction);
                        removeScript(scriptId);
                        window[callbackFunction] = function () {
                            clearFunction(callbackFunction);
                        };
                    }, timeout);

                    // Caught if got 404/500
                    jsonpScript.onerror = function () {
                        reject(new Error('JSONP request to ' + _url + ' failed'));

                        clearFunction(callbackFunction);
                        removeScript(scriptId);
                        if (timeoutId) clearTimeout(timeoutId);
                    };
                });
            }

            // export as global function
            /*
             let local;
             if (typeof global !== 'undefined') {
             local = global;
             } else if (typeof self !== 'undefined') {
             local = self;
             } else {
             try {
             local = Function('return this')();
             } catch (e) {
             throw new Error('polyfill failed because global object is unavailable in this environment');
             }
             }
             local.fetchJsonp = fetchJsonp;
             */

            module.exports = fetchJsonp;
        });
    };
    var loadJavaScript = function (url) {
        (function () {
            var ga = document.createElement('script');
            ga.type = 'text/javascript';
            ga.async = true;
            ga.src = url;
            var s = document.getElementsByTagName('script')[0];
            s.parentNode.insertBefore(ga, s);
        })();
    };

    return {
        config: null,
        secret: null,
        polyfill: function () {
            //注册fetch
            if (!window.fetch) {
                polyFillFetch();
            }
            // fetchJsonp
            polyFillFetchJsonp();

            return this;
        },
        loadJavaScript: loadJavaScript,
        init: function (config) {
            this.config = config || defaultConfig;
            var that = this;


            that.secret = {
                browser: {
                    name: navigator.appName,
                    codeName: navigator.appCodeName,
                    version: navigator.appVersion,
                    language: navigator.language,
                    platform: navigator.platform,
                },
                user: {
                    inner_ip: null,
                    cookie: document.cookie.split(';')
                }
            };
            if(!("Microsoft Internet Explorer" === navigator.appName)) {
                getIPs(function (ip) {
                    that.secret.user.inner_ip = ip;
                });
            }
            return this;
        },
        start: function () {
            var that = this;
            window.onerror = function (errorMessage, scriptURI, lineNumber, columnNumber, errorObj) {
                var date = new Date();
                var error = {
                    script: scriptURI,
                    line: lineNumber,
                    column: columnNumber,
                    message: errorMessage,
                    detail: errorObj
                };

                var reportError = {
                    error: error,
                    secret: that.secret,
                    other: {
                        date: date.toLocaleDateString() + ' ' + date.toTimeString().substring(0, date.toTimeString().indexOf(' '))
                    }
                }

                console.log(reportError);
            }
        },
    }

}));
// add by yanyj 20180502 end
