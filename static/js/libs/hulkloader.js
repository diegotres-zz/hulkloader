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
	
	
	/**
	 * Load Application Config
	 */
	this.loadApplicationConfig = function(){
		var xhr = _self.getXHRObject();
		xhr.onreadystatechange = function() { 
			if ( xhr.readyState == 4 && 200 == xhr.status ) {
				var jsonString = _self.getSecuredJSON(xhr.responseText, true);
				var jsonObject = eval('(' + jsonString + ')');
				var variables = jsonObject.global_variables;
				// If have global_variables at root of json, try to substitute other strings
				jsonString = variables?_self.substituteStringVariables(jsonString,variables):jsonString;
				// Evaluate json
				jsonObject = eval('(' + jsonString + ')');
				// Garbage Collector is my friend
				jsonString = variables = null;
				// Before Load dependencies, try to set the current section
				_self.setCurrentSection();
				// Try to load dependencies
				_self.loadDependencies(jsonObject);
			}else{
				return false;
			}
		};
		xhr.open('GET', _self.getApplicationConfigURL(), true);
		xhr.send();
	};
	
	
	/**
	 * Load Application Dependencies
	 */
	this.loadDependencies = function(data){
		try{ 
			console.log(data);
			console.log('current section: ' + _self.current_section);
		}catch(e){}
		
	};
	
	
	/**
	 * Set current section based on html tag attribute
	 * 
	 * ex: <html id="home" lang="en-us" dir="ltr">
	 * ex: <html id="downloads" lang="en-us" dir="ltr">
	 */
	this.setCurrentSection = function(){
		_self.current_section = _self.current_section || document.getElementsByTagName('html')[0].getAttribute('id') || 'home';
	};
	
	
	/**
	 * Get Application Config URL
	 * @return json_url
	 */
	this.getApplicationConfigURL = function(){
		var scripts = document.getElementsByTagName('script');
		var loader_script = scripts[scripts.length-1];
		var script_search = loader_script.src.split('?')[1] || null;
		if(script_search){
			_self.application_config_url = (!script_search.match(/\//)) ? location.href.match(/^.*\//g)[0] + script_search : script_search;
		}
		return _self.application_config_url;
	};
	
	
	/**
	 * Substitute String Variables
	 */
	this.substituteStringVariables = function(string, object){
		return string.replace(/\\?\$\{([^{}]+)\}/g, function(match, name){
			if (match.charAt(0) == '\\') return match.slice(1);
			return (object[name] != undefined) ? object[name] : '';
		});
	};
	
	
	/**
	 * Get an XMLHttpRequest
	 * @return XMLHttpRequest Object
	 */
	this.getXHRObject = function(){
		var xhrObj = false; 
		try {
			xhrObj = new XMLHttpRequest();
		} 
		catch(e){
			var progid = ['MSXML2.XMLHTTP.5.0', 'MSXML2.XMLHTTP.4.0', 'MSXML2.XMLHTTP.3.0', 'MSXML2.XMLHTTP', 'Microsoft.XMLHTTP'];
			for ( var i=0; i < progid.length; ++i ) { 
				try {
					xhrObj = new ActiveXObject(progid[i]); 
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
	};
	
	
	/**
	 * Secure JSON
	 * @return string secured
	 */
	this.getSecuredJSON = function(string, secure){
		if (typeof string != 'string' || !string.length) return null;
		if (secure && !(/^[,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]*$/).test(string.replace(/\\./g, '@').replace(/"[^"\\\n\r]*"/g, ''))) return null;
		//return eval('(' + string + ')');
		return string;
	};

};




var hulkloader = new HulkLoader();
hulkloader.loadApplicationConfig();








