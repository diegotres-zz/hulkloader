var HulkLoader = function(){
    
    var _self = this;
    
    /**
     * Default localization
     * You can change passing by parameter of script tag
     * 
     * ex: <script type="text/javascript" src="loader.js?/config.json"></script>
     */
    this.application_config_url = 'static/_config/application.json';
    
    /**
     * Don't set hard code here!
     */
    this.current_section = undefined;
    this.config          = {};
    this.stylesheets     = [];
    this.javascripts     = [];
    this.imgs            = [];
    
    
    
    this.addHandler = function(elem, type, func) {
        if ( elem.addEventListener ) {
            elem.addEventListener(type, func, false);
        }
        else if ( elem.attachEvent ) {
            elem.attachEvent("on" + type, func);
        }
    };
    
    
    /**
     * ========================================================================================================
     * Stylesheets
     * ========================================================================================================
     */
    this.css =
    {
        load: function(url, media) {
            var stylesheet      = document.createElement('link');
            stylesheet.rel      = 'stylesheet';
            stylesheet.type     = 'text/css';
            stylesheet.href     = url;
            stylesheet.media    = media || 'all';
            document.getElementsByTagName('head')[0].appendChild(stylesheet);
        }
    };
    
    /**
     * ========================================================================================================
     * JSON
     * ========================================================================================================
     */
    this.json =
    {
        load: function(url) {
            var xhr = _self.utils.getXHRObject();
            xhr.onreadystatechange = function() { 
                if ( xhr.readyState == 4 && 200 == xhr.status ) {
                    var jsonString = _self.json.getCleanedJSONString(xhr.responseText, true);
                    var jsonObject = eval('(' + jsonString + ')');
                    return jsonObject;
                }else{
                    return false;
                }
            };
            xhr.open('GET', url, true);
            xhr.send();
        },
        
        getCleanedJSONString: function(string, secure) {
            if (typeof string != 'string' || !string.length) return null;
            if (secure && !(/^[,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]*$/).test(string.replace(/\\./g, '@').replace(/"[^"\\\n\r]*"/g, ''))) return null;
            return string;
        }
    };

    /**
     * ========================================================================================================
     * Images
     * ========================================================================================================
     */
    this.img =
    {
        load: function() {
            console.log('img')
        }
    };
    
    /**
     * ========================================================================================================
     * Javascripts
     * ========================================================================================================
     */
    this.js = 
    {
        loadScript: function(url, onload) {
            _self.js.loadScriptDomElement(url, onload);
        },

        loadScripts: function(aUrls, onload) {
            // see if any of the scripts are on a different domain
            var nUrls = aUrls.length;
            var bDifferent = false;
            for ( var i = 0; i < nUrls; i++ ) {
                if ( _self.js.differentDomain(aUrls[i]) ) {
                    bDifferent = true;
                    break;
                }
            }

            // pick the best loading function
            var loadFunc = _self.js.loadScriptXhrInjection;
            if ( bDifferent ) {
                if ( -1 != navigator.userAgent.indexOf('Firefox') || 
                     -1 != navigator.userAgent.indexOf('Opera') ) {
                    loadFunc = _self.js.loadScriptDomElement;
                }
                else {
                    loadFunc = _self.js.loadScriptDocWrite;
                }
            }

            // load the scripts
            for ( var i = 0; i < nUrls; i++ ) {
                loadFunc(aUrls[i], ( i+1 == nUrls ? onload : null ), true);
            }
        },

        differentDomain: function(url) {
            if ( 0 === url.indexOf('http://') || 0 === url.indexOf('https://') ) {
                var mainDomain = document.location.protocol + 
                    "://" + document.location.host + "/";
                return ( 0 !== url.indexOf(mainDomain) );
            }

            return false;
        },

        loadScriptDomElement: function(url, onload) {
            var domscript = document.createElement('script');
            domscript.src = url;
            if ( onload ) {
                domscript.onloadDone = false;
                domscript.onload = function() { 
                    if ( !domscript.onloadDone ) {
                        domscript.onloadDone = true; 
                        onload(); 
                    }
                };
                domscript.onreadystatechange = function() {
                    if ( ( "loaded" === domscript.readyState || "complete" === domscript.readyState ) && !domscript.onloadDone ) {
                        domscript.onloadDone = true;
                        domscript.onload();
                    }
                }
            }
            document.getElementsByTagName('head')[0].appendChild(domscript);
        },

        loadScriptDocWrite: function(url, onload) {
            document.write('<scr' + 'ipt src="' + url + 
                           '" type="text/javascript"></scr' + 'ipt>');
            if ( onload ) {
                // we can't tie it to the script's onload, so use window
                // thus, it doesn't fire as early as it might have
                _self.addHandler(window, "load", onload);
            }
        },

        queuedScripts: new Array(),

        loadScriptXhrInjection: function(url, onload, bOrder) {
            var iQueue = _self.js.queuedScripts.length;
            if ( bOrder ) {
                var qScript = { response: null, onload: onload, done: false };
                _self.js.queuedScripts[iQueue] = qScript;
            }

            var xhrObj = _self.utils.getXHRObject();
            xhrObj.onreadystatechange = function() { 
                if ( xhrObj.readyState == 4 ) {
                    if ( bOrder ) {
                        _self.js.queuedScripts[iQueue].response = xhrObj.responseText;
                        _self.js.injectScripts();
                    }
                    else {
                        var se = document.createElement('script');
                        document.getElementsByTagName('head')[0].appendChild(se);
                        se.text = xhrObj.responseText;
                        if ( onload ) {
                            onload();
                        }
                    }
                }
            };
            xhrObj.open('GET', url, true);
            xhrObj.send('');
        },

        injectScripts: function() {
            var len = _self.js.queuedScripts.length;
            for ( var i = 0; i < len; i++ ) {
                var qScript = _self.js.queuedScripts[i];
                if ( ! qScript.done ) {
                    if ( ! qScript.response ) {
                        // STOP! need to wait for this response
                        break;
                    }
                    else {
                        var se = document.createElement('script');
                        document.getElementsByTagName('head')[0].appendChild(se);
                        se.text = qScript.response;
                        if ( qScript.onload ) {
                            qScript.onload();
                            //eval(qScript.onload+'()');
                        }
                        qScript.done = true;
                    }
                }
            }
        }
    };
    
    /**
     * ========================================================================================================
     * Application
     * ========================================================================================================
     */
    this.app = 
    {
        load: function(config_url){
            var xhr = _self.utils.getXHRObject();
            xhr.onreadystatechange = function() { 
                if ( xhr.readyState == 4 && 200 == xhr.status ) {
                    var jsonString = _self.json.getCleanedJSONString(xhr.responseText, true);
                    var jsonObject = eval('(' + jsonString + ')');
                    var variables = jsonObject.global_variables;
                    // If have global_variables at root of json, try to substitute other strings
                    jsonString = variables?_self.utils.substituteStringVariables(jsonString,variables):jsonString;
                    // Evaluate json
                    jsonObject = eval('(' + jsonString + ')');
                    // config
                    _self.config = jsonObject.config;
                    // Before Load dependencies, try to set the current section
                    _self.app.setCurrentSection();
                    // prepare dependencies to load later
                    _self.app.prepareDependencies(jsonObject);
                    // prepare dependencies to load later
                    _self.app.loadDependencies();
                }else{
                    return false;
                }
            };
            xhr.open('GET', _self.app.getApplicationConfigURL(), true);
            xhr.send();
        },
        
        getApplicationConfigURL: function(config_url) {
            if(config_url){
                _self.application_config_url = (!config_url.match(/\//)) ? location.href.match(/^.*\//g)[0] + config_url : config_url;
            }else{
                var scripts = document.getElementsByTagName('script');
                var loader_script = scripts[scripts.length-1];
                var script_search = loader_script.src.split('?')[1] || null;
                if(script_search){
                    _self.application_config_url = (!script_search.match(/\//)) ? location.href.match(/^.*\//g)[0] + script_search : script_search;
                }
            }
            
            return _self.application_config_url;
        },
        
        setCurrentSection: function() {
            _self.current_section = _self.current_section || document.getElementsByTagName('html')[0].getAttribute('id') || 'home';
        },
        
        prepareDependencies: function(data) {
            // global dependencies
            var gd = data.global_dependencies;
            // section dependencies
            var sd = (data.sections && data.sections[_self.current_section]) ? data.sections[_self.current_section].dependencies : null;

            // js
            if(gd&&gd.javascripts){for(var i=0,len=gd.javascripts.length;i<len;i++){_self.javascripts.push(_self.app.getBetterJsURL(gd.javascripts[i]));}}
            if(sd&&sd.javascripts){for(var i=0,len=sd.javascripts.length;i<len;i++){_self.javascripts.push(_self.app.getBetterJsURL(sd.javascripts[i]));}}      

            // css
            if(gd&&gd.stylesheets){for(var i=0,len=gd.stylesheets.length;i<len;i++){_self.stylesheets.push(gd.stylesheets[i]);}}
            if(sd&&sd.stylesheets){for(var i=0,len=sd.stylesheets.length;i<len;i++){_self.stylesheets.push(sd.stylesheets[i]);}}        
        },
        
        getBetterJsURL: function(obj) {
            var config = _self.config;
            var cdn = config.javascripts_use_cdn;
            var min = config.javascripts_use_minified_file;

            if(cdn) {
                if(min) {
                    if(obj.cdn_minified){ return obj.cdn_minified }
                    if(obj.local_minified){ return obj.local_minified }
                    if(obj.cdn_source){ return obj.cdn_source }
                    if(obj.local_source){ return obj.local_source }
                } else {
                    if(obj.cdn_source){ return obj.cdn_source }
                    if(obj.local_source){ return obj.local_source }
                    if(obj.cdn_minified){ return obj.cdn_minified }
                    if(obj.local_minified){ return obj.local_minified }
                }
            } else {
                if(min) {
                    if(obj.local_minified){ return obj.local_minified }
                    if(obj.local_source){ return obj.local_source }
                    if(obj.cdn_minified){ return obj.cdn_minified }
                    if(obj.cdn_source){ return obj.cdn_source }
                } else {
                    if(obj.local_source){ return obj.local_source }
                    if(obj.local_minified){ return obj.local_minified }
                    if(obj.cdn_source){ return obj.cdn_source }
                    if(obj.cdn_minified){ return obj.cdn_minified }
                }
            }
            return null;
        },
        
        loadDependencies: function() {
            // CSS
            var appCSS = _self.stylesheets;
            if(appCSS) {
                for(var i=0, len=appCSS.length; i<len; i++){
                    _self.css.load(appCSS[i]);
                }
            }

            // JS
            var appJS = _self.javascripts;
            if(appJS) {
                //_self.js.loadScripts( appJS, 'init' );
                _self.js.loadScripts( appJS );
            }

        }
    };
    
    /**
     * ========================================================================================================
     * Utils
     * ========================================================================================================
     */
    this.utils =
    {
        getXHRObject: function() {
            var xhrObj = false;
            try {
                xhrObj = new XMLHttpRequest();
            }
            catch(e){
                var aTypes = ["Msxml2.XMLHTTP.6.0", 
                              "Msxml2.XMLHTTP.3.0", 
                              "Msxml2.XMLHTTP", 
                              "Microsoft.XMLHTTP"];
                var len = aTypes.length;
                for ( var i=0; i < len; i++ ) {
                    try {
                        xhrObj = new ActiveXObject(aTypes[i]);
                    }
                    catch(e) {
                        continue;
                    }
                    break;
                }
            }
            finally {
                return xhrObj;
            }
        },
        
        substituteStringVariables: function(string, object) {
            return string.replace(/\\?\$\{([^{}]+)\}/g, function(match, name){
                if (match.charAt(0) == '\\') return match.slice(1);
                return (object[name] != undefined) ? object[name] : '';
            });
        }
    };
    
};


var hulkloader = new HulkLoader();
hulkloader.app.load();








