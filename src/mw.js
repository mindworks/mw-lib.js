/*jslint forin: true, nomen: true, plusplus: true, regexp: true, unparam: true, sloppy: true, todo: true, indent: 2, maxlen: 120 */
/*global window */

/**
 * @class mw-lib name space.
 * @author Joerg Basedow <jbasedow@mindworks.de>
 */
var MW = {};

/**
 * @class Static class for utility methods.
 * @author Joerg Basedow <jbasedow@mindworks.de>
 */
MW.Util = {
  /**
   * Generate a random string of length "length" containing only numbers. If no
   * "length" given, default length of 9 is assumed.
   *
   * @param {Integer} length
   * @return {String}
   */
  generateRandomNumberString : function(length) {
    length = length || 9;
    return String(Math.random()).substring(2, 2 + length);
  },

  /**
   * Gets the first key for an element from an object if contained, false
   * otherwise.
   *
   * @param {Object.<String, mixed>} anObject
   * @param {mixed} anElement
   * @return {(String|false)}
   */
  getKeyForElementFromObject : function(anObject, anElement) {
    var foundKey = false,
      aKey;

    for (aKey in anObject) {
      if (anObject[aKey] === anElement) {
        foundKey = aKey;
        break;
      }
    }
    return foundKey;
  },

  /**
   * Remove all Linebreaks (\n, \r\n, \r) from the given string.
   *
   * @param {String} string
   * @return {String}
   */
  removeLineBreaks : function(string) {
    return string.replace(/(\r|\n)/g, '');
  },

  /**
   * Recursively merge properties of two objects
   *
   * @param {Object} obj1
   * @param {Object} obj2
   * @return {Object}
   */
  mergeRecursive : function(obj1, obj2) {
    var p;

    for (p in obj2) {
      // Property in destination object set; update its value.
      if (obj2[p].constructor === Object) {
        if (!obj1[p]) {
          obj1[p] = {};
        }
        obj1[p] = this.mergeRecursive(obj1[p], obj2[p]);
      } else {
        obj1[p] = obj2[p];
      }
    }

    return obj1;
  }
};
/**
 * Checks if given argument is an array. Aliases native method if available.
 *
 * @param {Object.<String, mixed>} anObject
 * @return {Array}
 */
MW.Util.isArray = Array.isArray || function(obj) {
  return Object.prototype.toString.call(obj) === '[object Array]';
};
/**
 * Gets all keys from an object. Aliases native method if available.
 *
 * @param {Object.<String, mixed>} anObject
 * @return {Array}
 */
MW.Util.getKeysFromObject = Object.keys || function(anObject) {
  var keys = [],
    aKey;

  for (aKey in anObject) {
    if (anObject.hasOwnProperty(aKey)) {
      keys.push(aKey);
    }
  }
  return keys;
};

/**
 * @class Convenience class to merge placeholders into a template string.
 * @author Joerg Basedow <jbasedow@mindworks.de>
 * @constructor
 * @param {String} template
 */
MW.Template = function(template) {
  this._template = template || '';
};
MW.Template.prototype = {
  /**
   * Merge placeholders into the template string.
   *
   * @param {Object.<String, String>} placeholders
   * @return {String}
   */
  render : function(placeholders) {
    placeholders = placeholders || {};
    return this._template.replace(
      /#\{([^{}]*)\}/gi,
      function(completeMatch, placeholderName) {
        return MW.Template.cleanPlaceholder(placeholders[placeholderName]);
      }
    );
  }
};
/**
 * Check if a placeholder is a string or a number.
 *
 * @param {mixed} placeholder
 * @return {Boolean}
 */
MW.Template.isValidPlaceholder = function(placeholder) {
  return ['string', 'number'].indexOf(typeof placeholder) !== -1;
};
/**
 * Make a placeholder an empty string, if it is not a string or a number.
 *
 * @param {mixed} placeholder
 * @return {String}
 */
MW.Template.cleanPlaceholder = function(placeholder) {
  if (!MW.Template.isValidPlaceholder(placeholder)) {
    placeholder = '';
  }
  return String(placeholder);
};

/**
 * @class Service container to manage object dependencies.
 * @author Joerg Basedow <jbasedow@mindworks.de>
 * @constructor
 */
MW.ServiceContainer = function() {
  this._services = {};
  this._cache = {};
};
MW.ServiceContainer.prototype = {
  /**
   * Add a service factory to the container.
   *
   * @param {String} serviceName
   * @param {Function} factory
   */
  set : function(serviceName, factory) {
    this._services[serviceName] = factory;
  },
  /**
   * Add a service factory to the container.
   *
   * @todo allow non singleton
   *
   * @param {String} serviceName
   * @return {Mixed} Service with all its dependencies
   */
  get : function(serviceName) {
    if (!this._cache[serviceName]) {
      this._cache[serviceName] = this._services[serviceName](this);
    }
    return this._cache[serviceName];
  }
};

/**
 * @class Event dispatcher decoupling the event handlers from the objects where
 *   an event is triggered.
 * @author Joerg Basedow <jbasedow@mindworks.de>
 * @constructor
 */
MW.EventDispatcher = function() {
  this._eventHandlers = {};
};
MW.EventDispatcher.prototype = {
  /**
   * Register an event handler for an event name.
   *
   * @param {String} eventName
   * @param {Function} eventHandler
   * @param {String} executionTime Optional parameter to make given handler be
   *   executed first or last, when event is triggered.
   */
  on : function(eventName, eventHandler, executionTime) {
    if (!MW.Util.getKeyForElementFromObject(MW.EventDispatcher.ExecutionTimes, executionTime)) {
      executionTime = MW.EventDispatcher.ExecutionTimes.DEFAULT;
    }
    if (typeof eventHandler !== 'function') {
      throw {
        name : 'InvalidArgumentException',
        message : '"' + eventHandler + '" is not a valid event handler.'
      };
    }
    if (!this._eventHandlers[eventName]) {
      this._eventHandlers[eventName] = {};
    }
    if (!this._eventHandlers[eventName][executionTime]) {
      this._eventHandlers[eventName][executionTime] = [];
    }
    this._eventHandlers[eventName][executionTime].push(eventHandler);
  },
  /**
   * Remove the event handlers for an event name.
   *
   * @param {String} eventName
   */
  clear : function(eventName) {
    this._eventHandlers[eventName] = {};
  },
  /**
   * Trigger an event and notify the event handlers.
   *
   * @param {String} eventName
   * @param {mixed} context Object in whose context the event was thrown.
   * @param {mixed} info Additional event information
   */
  trigger : function(eventName, context, info) {
    var flatList,
      i,
      length;

    if (this._eventHandlers[eventName]) {
      flatList = this._eventHandlers[eventName][MW.EventDispatcher.ExecutionTimes.FIRST] || [];
      flatList = flatList.concat(this._eventHandlers[eventName][MW.EventDispatcher.ExecutionTimes.DEFAULT] || []);
      flatList = flatList.concat(this._eventHandlers[eventName][MW.EventDispatcher.ExecutionTimes.LAST] || []);
      for (i = 0, length = flatList.length; i < length; i++) {
        flatList[i](context, info);
      }
    }
  }
};
/**
 * Execution time constants
 *
 * @type {Object.<String, String>}
 * @const
 */
MW.EventDispatcher.ExecutionTimes = {
  FIRST : 'first',
  DEFAULT : 'default',
  LAST : 'last'
};

/**
 * @class Name space for loggers.
 * @author Joerg Basedow <jbasedow@mindworks.de>
 */
MW.Logger = {};
/**
 * Log levels
 *
 * @type {Object.<String, Integer>}
 * @const
 */
MW.Logger.Levels = {
  NOLOG     :  0,
  DEBUG     : 10,
  INFO      : 20,
  NOTICE    : 30,
  WARNING   : 40,
  ERROR     : 50,
  CRITICAL  : 60,
  ALERT     : 70,
  EMERGENCY : 80
};
/**
 * Checks if the given level is allowed.
 *
 * @param {Integer} level
 * @return {Boolean}
 */
MW.Logger.isValidLevel = function(level) {
  return Boolean(MW.Util.getKeyForElementFromObject(MW.Logger.Levels, level));
};
/**
 * Get log level for given string.
 *
 * @param {String} levelAsString
 * @return {Integer} the log level (one of MW.Logger.Levels), default: NOLOG
 *
 */
MW.Logger.getLogLevelForString = function(levelAsString) {
  var levels = MW.Logger.Levels,
    lvl = levels.NOLOG,
    aLevelName;

  for (aLevelName in levels) {
    if (levelAsString.toUpperCase() === aLevelName) {
      lvl = levels[aLevelName];
    }
  }
  return lvl;
};
/**
 * Get log level for given string.
 *
 * @param {Integer} level
 * @return {String} Name of the log level
 *
 */
MW.Logger.getStringForLogLevel = function(level) {
  return MW.Util.getKeyForElementFromObject(MW.Logger.Levels, level);
};

/**
 * @class Abstract logging service class supporting messages with log levels.
 *        Only entries should be logged that have a .
 * @author Joerg Basedow <jbasedow@mindworks.de>
 * @constructor
 * @param {Integer} logLevel
 */
MW.Logger.Abstract = function(logLevel) {
  this._logLevel = MW.Logger.Levels.WARNING;

  this.setLogLevel(logLevel);
};
/**
 * Set current log level.
 *
 * @param {Integer} level One of MW.Logger.Levels
 */
MW.Logger.Abstract.prototype.setLogLevel = function(level) {
  if (MW.Logger.isValidLevel(level)) {
    this._logLevel = level;
  }
};
/**
 * Get current log level.
 *
 * @return {Integer} One of MW.Logger.Levels
 */
MW.Logger.Abstract.prototype.getLogLevel = function() {
  return this._logLevel;
};
/**
 * Get current log level name.
 *
 * @return {String} Name of the current log level.
 */
MW.Logger.Abstract.prototype.getLogLevelAsString = function() {
  return MW.Logger.getStringForLogLevel(this.getLogLevel());
};
/**
 * Check if the given level will result in a log entry.
 *
 * @return {Boolean}
 */
MW.Logger.Abstract.prototype.isCausingLogEntry = function(level) {
  return this._logLevel !== MW.Logger.Levels.NOLOG &&
    MW.Logger.isValidLevel(level) &&
    level >= this._logLevel;
};
/**
 * Logs given message, if given level is higher or equal than the log level
 * configured in the logger.
 *
 * @param {String} message
 * @param {Integer} level
 */
MW.Logger.Abstract.prototype.log = function(message, level) {};

/**
 * @class Logging service implementation that stores log entries in a member array.
 * @author Joerg Basedow <jbasedow@mindworks.de>
 * @constructor
 * @param {Integer} logLevel
 */
MW.Logger.Array = function(logLevel) {
  MW.Logger.Abstract.call(this, logLevel);
  this._logEntries = [];
};
MW.Logger.Array.prototype = new MW.Logger.Abstract();
/**
 * Creates log entry.
 *
 * @param {String} message
 * @param {Integer} level
 */
MW.Logger.Array.prototype.log = function(message, level) {
  if (this.isCausingLogEntry(level)) {
    this._logEntries.push(new MW.LogEntry(message, level));
  }
};
/**
 * Get log as String.
 *
 * @return {String}
 */
MW.Logger.Array.prototype.toString = function() {
  return this._stringify(this.getLogEntries());
};
/**
 * Get log entries which log level is at least as high as the configured log
 * level as Array.
 *
 * @return {Array.<String>} Array of log strings (Level: message).
 */
MW.Logger.Array.prototype.getLogEntries = function() {
  var log = [],
    i,
    length,
    anEntry;

  for (i = 0, length = this._logEntries.length; i < length; i++) {
    anEntry = this._logEntries[i];
    log.push(anEntry.toString());
  }
  return log;
};
/**
 * Convert array of log entries to single new line separated string.
 *
 * @private
 * @param {Array.<MW.LogEntry>} entries
 * @return {String}
 */
MW.Logger.Array.prototype._stringify = function(entries) {
  var logString = '',
    i,
    length;

  for (i = 0, length = entries.length; i < length; i++) {
    logString += entries[i].toString() + "\n";
  }
  return logString;
};

/**
 * @class Logging service implementation that stores log entries in a member array.
 * @author Joerg Basedow <jbasedow@mindworks.de>
 * @constructor
 * @param {Integer} logLevel
 */
MW.Logger.Console = function(logLevel) {
  MW.Logger.Abstract.call(this, logLevel);
};
MW.Logger.Console.prototype = new MW.Logger.Abstract();
/**
 * Logs Entry to console if applicable.
 *
 * @param {String} message
 * @param {Integer} level
 */
MW.Logger.Console.prototype.log = function(message, level) {
  if (!MW.Logger.isValidLevel(level)) {
    level = MW.Logger.Levels.INFO;
  }
  if (this.isCausingLogEntry(level) && window.console && typeof window.console.log === 'function') {
    window.console.log('MW.Logger.Console: ' + MW.Logger.getStringForLogLevel(level) + ': ' + message);
  }
};

/**
 * @class Composite logging service aggregating multiple loggers.
 * @author Joerg Basedow <jbasedow@mindworks.de>
 * @constructor
 * @param {Integer} logLevel
 */
MW.Logger.Composite = function(logLevel) {
  MW.Logger.Abstract.call(this, logLevel);
  this._loggers = [];
};
MW.Logger.Composite.prototype = new MW.Logger.Abstract();
/**
 * Add a logging service.
 *
 * @param {MW.Logger.Abstract} logger
 */
MW.Logger.Composite.prototype.addLogger = function(logger) {
  if (typeof logger.log === 'function') {
    this._loggers.push(logger);
  }
};
/**
 * Propagates log call to added loggers.
 *
 * @param {String} message
 * @param {Integer} level
 */
MW.Logger.Composite.prototype.log = function(message, level) {
  var i,
    length;

  for (i = 0, length = this._loggers.length; i < length; i++) {
    this._loggers[i].log(message, level);
  }
};

/**
 * @class Container for log entry data (log message and log level).
 * @author Joerg Basedow <jbasedow@mindworks.de>
 * @constructor
 * @param {String} message
 * @param {Integer} level
 */
MW.LogEntry = function(message, level) {
  this._message = MW.Util.removeLineBreaks(message);
  if (!MW.Logger.isValidLevel(level)) {
    level = MW.Logger.Levels.INFO;
  }
  this._level = level;
};
MW.LogEntry.prototype = {
  /**
   * Get string representation of Log Entry
   *
   * @param {Integer} level
   * @return {String}
   */
  toString : function() {
    return MW.Logger.getStringForLogLevel(this._level) + ': ' + this._message;
  },
  /**
   * Get log level of entry.
   *
   * @return {Integer}
   */
  getLevel : function() {
    return this._level;
  }
};

/**
 * @class Wrapper for window object (window.location, window.document.cookie etc.).
 * @author Joerg Basedow <jbasedow@mindworks.de>
 * @constructor
 * @param {Object.<String, Object>} window
 */
MW.Window = function(window) {
  window = window || {};
  this.setLocation(window.location);
  this._document = window.document || {};
  this._window = window || {};
};
MW.Window.prototype = {
  /**
   * Set location implementation (i.e. window.location). Copys of the sub
   * properties are stored to clone the original so we do not accidental tamper
   * with the original.
   *
   * @param {Object.<String, String>} location
   */
  setLocation : function(location) {
    location = location || {};
    this._location = {};
    this._location.path        = this._cleanString(location.pathname);
    this._location.queryString = this._cleanString(location.search);
    this._location.host        = this._cleanString(location.hostname);

    this._cachedSearchHash = null;
  },
  /**
   * Get the path of the page url.
   *
   * @return {String}
   */
  getPath : function() {
    return this._location.path;
  },
  /**
   * get the host of the page url.
   *
   * @return {String}
   */
  getHost : function() {
    return this._location.host;
  },
  /**
   * Split the query string to a hash containing name => value pairs.
   *
   * @private
   */
  _splitQueryString : function() {
    var i,
      length,
      queryString,
      parameters,
      pair;

    if (this._cachedSearchHash === null) {
      this._cachedSearchHash = {};
      if (MW.Window.isValidQuerySting(this._location.queryString)) {
        queryString = this._location.queryString.substring(1);
        parameters = queryString.split('&');
        for (i = 0, length = parameters.length; i < length; i++) {
          pair = parameters[i].split('=');
          this._cachedSearchHash[pair[0]] = pair[1];
        }
      }
    }
  },
  /**
   * Convert value to empty string, if no string given.
   *
   * @private
   * @param {mixed} value
   * @return {String}
   */
  _cleanString : function(value) {
    return typeof value === 'string' ? value : '';
  },
  /**
   * Get cookie with given name.
   *
   * @param {String} cookieName
   * @return {String} the cookie value
   */
  getCookie : function(cookieName) {
    var cookieValue = '',
      cookie,
      indexBegin,
      indexEnd;

    if (cookieName !== '') {
      cookie = String(this._document.cookie);
      indexBegin = cookie.indexOf(cookieName);
      if (indexBegin !== -1) {
        indexEnd = cookie.indexOf(';', indexBegin);
        if (indexEnd === -1) {
          indexEnd = cookie.length;
        }
        cookieValue = window.unescape(
          cookie.substring(indexBegin + cookieName.length + 1, indexEnd)
        );
      }
    }
    return cookieValue;
  },
  /**
   * Set given value for cookie with given name.
   *
   * @param {String} cookieName
   * @param {String} cookieValue
   */
  setCookie : function(cookieName, cookieValue) {
    this._document.cookie = cookieName + '=' + cookieValue;
  },
  /**
   * Delete cookie with given name.
   *
   * @param {String} cookieName
   */
  deleteCookie : function(cookieName) {
    this._document.cookie = cookieName + "=; expires= Thu, 01-Jan-1970 00:00:01 GMT;";
  },
  /**
   * Get the value corresponding the given "name" or undefined if parameter is
   * not set.
   *
   * @param {String} parameterName
   * @return {String} Query parameter.
   */
  getQueryParameter : function(parameterName) {
    this._splitQueryString();
    return this._cachedSearchHash[parameterName];
  },
  /**
   * Wrapper for document.write method.
   *
   * @param {String} content
   */
  documentWrite : function(content) {
    this._document.write(content);
  },
  /**
   * Simple dom element selector faking rudimentary jQuery like functionality
   * normalizing the result to alwys be an array/iterable.
   *
   * @param {String} selector
   * @return {Array.<DomElement>}
   */
  $ : function(selector) {
    if (typeof selector !== 'string') {
      return [];
    }
    if (selector[0] === '#') {
      return [this._document.getElementById(selector.slice(1))];
    }
    if (selector[0] === '.') {
      return this._document.getElementsByClassName(selector.slice(1));
    }
    return this._document.getElementsByTagName(selector);
  },
  /**
   * Wrapper to browser independently register a handler for the on DOM ready event.
   *
   * @param {Function} callback
   */
  onDomReady : function(callback) {
    // Make sure callback is only called once
    var eventHandled = false,
      eventHandler = function() {
        if (!eventHandled) {
          callback();
          eventHandled = true;
        }
      },
      DOMLoadTimer;

    // Internet Explorer
    /*@cc_on
    @if (@_win32 || @_win64)
      this._document.write('<script id="ieScriptLoad" defer src="//:"><\/script>');
      this._document.getElementById('ieScriptLoad').onreadystatechange = function() {
        if (this.readyState === 'complete') {
          eventHandler();
        }
      };
    @end @*/

    if (this._document.addEventListener) { // Mozilla, Chrome, Opera
      this._document.addEventListener('DOMContentLoaded', eventHandler, false);
    } else if (/KHTML|WebKit|iCab/i.test(this._window.navigator.userAgent)) { // Safari, iCab, Konqueror
      DOMLoadTimer = this._window.setInterval(function () {
        if (/loaded|complete/i.test(this._document.readyState)) {
          eventHandler();
          this._window.clearInterval(DOMLoadTimer);
        }
      }, 10);
    } else { // Other web browsers
      this._window.onload = eventHandler;
    }
  }
};
/**
 * Check if given query string has proper format (i.e. ?x=y&z=1).
 *
 * @param {String} A query string
 * @return {Boolean} true if query string matches pattern, false else
 */
MW.Window.isValidQuerySting = function(string) {
  return string.match(/^\?(\w+=[^&=]*)(&(\w+=[^&=]*))*$/);
};
