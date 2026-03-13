(function(window, document) {
'use strict';


// Exits early if all IntersectionObserver and IntersectionObserverEntry
// features are natively supported.
if ('IntersectionObserver' in window &&
    'IntersectionObserverEntry' in window &&
    'intersectionRatio' in window.IntersectionObserverEntry.prototype) {

  // Minimal polyfill for Edge 15's lack of `isIntersecting`
  // See: https://github.com/w3c/IntersectionObserver/issues/211
  if (!('isIntersecting' in window.IntersectionObserverEntry.prototype)) {
    Object.defineProperty(window.IntersectionObserverEntry.prototype,
      'isIntersecting', {
      get: function () {
        return this.intersectionRatio > 0;
      }
    });
  }
  return;
}


/**
 * An IntersectionObserver registry. This registry exists to hold a strong
 * reference to IntersectionObserver instances currently observing a target
 * element. Without this registry, instances without another reference may be
 * garbage collected.
 */
var registry = [];


/**
 * Creates the global IntersectionObserverEntry constructor.
 * https://w3c.github.io/IntersectionObserver/#intersection-observer-entry
 * @param {Object} entry A dictionary of instance properties.
 * @constructor
 */
function IntersectionObserverEntry(entry) {
  this.time = entry.time;
  this.target = entry.target;
  this.rootBounds = entry.rootBounds;
  this.boundingClientRect = entry.boundingClientRect;
  this.intersectionRect = entry.intersectionRect || getEmptyRect();
  this.isIntersecting = !!entry.intersectionRect;

  // Calculates the intersection ratio.
  var targetRect = this.boundingClientRect;
  var targetArea = targetRect.width * targetRect.height;
  var intersectionRect = this.intersectionRect;
  var intersectionArea = intersectionRect.width * intersectionRect.height;

  // Sets intersection ratio.
  if (targetArea) {
    // Round the intersection ratio to avoid floating point math issues:
    // https://github.com/w3c/IntersectionObserver/issues/324
    this.intersectionRatio = Number((intersectionArea / targetArea).toFixed(4));
  } else {
    // If area is zero and is intersecting, sets to 1, otherwise to 0
    this.intersectionRatio = this.isIntersecting ? 1 : 0;
  }
}


/**
 * Creates the global IntersectionObserver constructor.
 * https://w3c.github.io/IntersectionObserver/#intersection-observer-interface
 * @param {Function} callback The function to be invoked after intersection
 *     changes have queued. The function is not invoked if the queue has
 *     been emptied by calling the `takeRecords` method.
 * @param {Object=} opt_options Optional configuration options.
 * @constructor
 */
function IntersectionObserver(callback, opt_options) {

  var options = {} ;

  if(options) {
    options = opt_options ;
  }

  if (typeof callback != 'function') {
    throw new Error('callback must be a function');
  }

  if (options.root && options.root.nodeType != 1) {
    throw new Error('root must be an Element');
  }

  // Binds and throttles `this._checkForIntersections`.
  this._checkForIntersections = throttle(
      this._checkForIntersections.bind(this), this.THROTTLE_TIMEOUT);

  // Private properties.
  this._callback = callback;
  this._observationTargets = [];
  this._queuedEntries = [];
  this._rootMarginValues = this._parseRootMargin(options.rootMargin);

  // Public properties.
  this.thresholds = this._initThresholds(options.threshold);
  this.root = options.root || null;
  this.rootMargin = this._rootMarginValues.map(function(margin) {
    return margin.value + margin.unit;
  }).join(' ');
}


/**
 * The minimum interval within which the document will be checked for
 * intersection changes.
 */
IntersectionObserver.prototype.THROTTLE_TIMEOUT = 100;


/**
 * The frequency in which the polyfill polls for intersection changes.
 * this can be updated on a per instance basis and must be set prior to
 * calling `observe` on the first target.
 */
IntersectionObserver.prototype.POLL_INTERVAL = null;

/**
 * Use a mutation observer on the root element
 * to detect intersection changes.
 */
IntersectionObserver.prototype.USE_MUTATION_OBSERVER = true;


/**
 * Starts observing a target element for intersection changes based on
 * the thresholds values.
 * @param {Element} target The DOM element to observe.
 */
IntersectionObserver.prototype.observe = function(target) {
  var isTargetAlreadyObserved = this._observationTargets.some(function(item) {
    return item.element == target;
  });

  if (isTargetAlreadyObserved) {
    return;
  }

  if (!(target && target.nodeType == 1)) {
    throw new Error('target must be an Element');
  }

  this._registerInstance();
  this._observationTargets.push({element: target, entry: null});
  this._monitorIntersections();
  this._checkForIntersections();
};


/**
 * Stops observing a target element for intersection changes.
 * @param {Element} target The DOM element to observe.
 */
IntersectionObserver.prototype.unobserve = function(target) {
  this._observationTargets =
      this._observationTargets.filter(function(item) {

    return item.element != target;
  });
  if (!this._observationTargets.length) {
    this._unmonitorIntersections();
    this._unregisterInstance();
  }
};


/**
 * Stops observing all target elements for intersection changes.
 */
IntersectionObserver.prototype.disconnect = function() {
  this._observationTargets = [];
  this._unmonitorIntersections();
  this._unregisterInstance();
};


/**
 * Returns any queue entries that have not yet been reported to the
 * callback and clears the queue. This can be used in conjunction with the
 * callback to obtain the absolute most up-to-date intersection information.
 * @return {Array} The currently queued entries.
 */
IntersectionObserver.prototype.takeRecords = function() {
  var records = this._queuedEntries.slice();
  this._queuedEntries = [];
  return records;
};


/**
 * Accepts the threshold value from the user configuration object and
 * returns a sorted array of unique threshold values. If a value is not
 * between 0 and 1 and error is thrown.
 * @private
 * @param {Array|number=} opt_threshold An optional threshold value or
 *     a list of threshold values, defaulting to [0].
 * @return {Array} A sorted list of unique and valid threshold values.
 */
IntersectionObserver.prototype._initThresholds = function(opt_threshold) {
  var threshold = opt_threshold || [0];
  if (!Array.isArray(threshold)) threshold = [threshold];

  return threshold.sort().filter(function(t, i, a) {
    if (typeof t != 'number' || isNaN(t) || t < 0 || t > 1) {
      throw new Error('threshold must be a number between 0 and 1 inclusively');
    }
    return t !== a[i - 1];
  });
};


/**
 * Accepts the rootMargin value from the user configuration object
 * and returns an array of the four margin values as an object containing
 * the value and unit properties. If any of the values are not properly
 * formatted or use a unit other than px or %, and error is thrown.
 * @private
 * @param {string=} opt_rootMargin An optional rootMargin value,
 *     defaulting to '0px'.
 * @return {Array<Object>} An array of margin objects with the keys
 *     value and unit.
 */
IntersectionObserver.prototype._parseRootMargin = function(opt_rootMargin) {
  var marginString = opt_rootMargin || '0px';
  var margins = marginString.split(/\s+/).map(function(margin) {
    var parts = /^(-?\d*\.?\d+)(px|%)$/.exec(margin);
    if (!parts) {
      throw new Error('rootMargin must be specified in pixels or percent');
    }
    return {value: parseFloat(parts[1]), unit: parts[2]};
  });

  // Handles shorthand.
  margins[1] = margins[1] || margins[0];
  margins[2] = margins[2] || margins[0];
  margins[3] = margins[3] || margins[1];

  return margins;
};


/**
 * Starts polling for intersection changes if the polling is not already
 * happening, and if the page's visibility state is visible.
 * @private
 */
IntersectionObserver.prototype._monitorIntersections = function() {
  if (!this._monitoringIntersections) {
    this._monitoringIntersections = true;

    // If a poll interval is set, use polling instead of listening to
    // resize and scroll events or DOM mutations.
    if (this.POLL_INTERVAL) {
      this._monitoringInterval = setInterval(
          this._checkForIntersections, this.POLL_INTERVAL);
    }
    else {
      addEvent(window, 'resize', this._checkForIntersections, true);
      addEvent(document, 'scroll', this._checkForIntersections, true);

      if (this.USE_MUTATION_OBSERVER && 'MutationObserver' in window) {
        this._domObserver = new MutationObserver(this._checkForIntersections);
        this._domObserver.observe(document, {
          attributes: true,
          childList: true,
          characterData: true,
          subtree: true
        });
      }
    }
  }
};


/**
 * Stops polling for intersection changes.
 * @private
 */
IntersectionObserver.prototype._unmonitorIntersections = function() {
  if (this._monitoringIntersections) {
    this._monitoringIntersections = false;

    clearInterval(this._monitoringInterval);
    this._monitoringInterval = null;

    removeEvent(window, 'resize', this._checkForIntersections, true);
    removeEvent(document, 'scroll', this._checkForIntersections, true);

    if (this._domObserver) {
      this._domObserver.disconnect();
      this._domObserver = null;
    }
  }
};


/**
 * Scans each observation target for intersection changes and adds them
 * to the internal entries queue. If new entries are found, it
 * schedules the callback to be invoked.
 * @private
 */
IntersectionObserver.prototype._checkForIntersections = function() {
  var rootIsInDom = this._rootIsInDom();
  var rootRect = rootIsInDom ? this._getRootRect() : getEmptyRect();

  this._observationTargets.forEach(function(item) {
    var target = item.element;
    var targetRect = getBoundingClientRect(target);
    var rootContainsTarget = this._rootContainsTarget(target);
    var oldEntry = item.entry;
    var intersectionRect = rootIsInDom && rootContainsTarget &&
        this._computeTargetAndRootIntersection(target, rootRect);

    var newEntry = item.entry = new IntersectionObserverEntry({
      time: now(),
      target: target,
      boundingClientRect: targetRect,
      rootBounds: rootRect,
      intersectionRect: intersectionRect
    });

    if (!oldEntry) {
      this._queuedEntries.push(newEntry);
    } else if (rootIsInDom && rootContainsTarget) {
      // If the new entry intersection ratio has crossed any of the
      // thresholds, add a new entry.
      if (this._hasCrossedThreshold(oldEntry, newEntry)) {
        this._queuedEntries.push(newEntry);
      }
    } else {
      // If the root is not in the DOM or target is not contained within
      // root but the previous entry for this target had an intersection,
      // add a new record indicating removal.
      if (oldEntry && oldEntry.isIntersecting) {
        this._queuedEntries.push(newEntry);
      }
    }
  }, this);

  if (this._queuedEntries.length) {
    this._callback(this.takeRecords(), this);
  }
};


/**
 * Accepts a target and root rect computes the intersection between then
 * following the algorithm in the spec.
 * TODO(philipwalton): at this time clip-path is not considered.
 * https://w3c.github.io/IntersectionObserver/#calculate-intersection-rect-algo
 * @param {Element} target The target DOM element
 * @param {Object} rootRect The bounding rect of the root after being
 *     expanded by the rootMargin value.
 * @return {?Object} The final intersection rect object or undefined if no
 *     intersection is found.
 * @private
 */
IntersectionObserver.prototype._computeTargetAndRootIntersection =
    function(target, rootRect) {

  // If the element isn't displayed, an intersection can't happen.
  if (window.getComputedStyle(target).display == 'none') return;

  var targetRect = getBoundingClientRect(target);
  var intersectionRect = targetRect;
  var parent = getParentNode(target);
  var atRoot = false;

  while (!atRoot) {
    var parentRect = null;
    var parentComputedStyle = parent.nodeType == 1 ?
        window.getComputedStyle(parent) : {};

    // If the parent isn't displayed, an intersection can't happen.
    if (parentComputedStyle.display == 'none') return;

    if (parent == this.root || parent == document) {
      atRoot = true;
      parentRect = rootRect;
    } else {
      // If the element has a non-visible overflow, and it's not the <body>
      // or <html> element, update the intersection rect.
      // Note: <body> and <html> cannot be clipped to a rect that's not also
      // the document rect, so no need to compute a new intersection.
      if (parent != document.body &&
          parent != document.documentElement &&
          parentComputedStyle.overflow != 'visible') {
        parentRect = getBoundingClientRect(parent);
      }
    }

    // If either of the above conditionals set a new parentRect,
    // calculate new intersection data.
    if (parentRect) {
      intersectionRect = computeRectIntersection(parentRect, intersectionRect);

      if (!intersectionRect) break;
    }
    parent = getParentNode(parent);
  }
  return intersectionRect;
};


/**
 * Returns the root rect after being expanded by the rootMargin value.
 * @return {Object} The expanded root rect.
 * @private
 */
IntersectionObserver.prototype._getRootRect = function() {
  var rootRect;
  if (this.root) {
    rootRect = getBoundingClientRect(this.root);
  } else {
    // Use <html>/<body> instead of window since scroll bars affect size.
    var html = document.documentElement;
    var body = document.body;
    rootRect = {
      top: 0,
      left: 0,
      right: html.clientWidth || body.clientWidth,
      width: html.clientWidth || body.clientWidth,
      bottom: html.clientHeight || body.clientHeight,
      height: html.clientHeight || body.clientHeight
    };
  }
  return this._expandRectByRootMargin(rootRect);
};


/**
 * Accepts a rect and expands it by the rootMargin value.
 * @param {Object} rect The rect object to expand.
 * @return {Object} The expanded rect.
 * @private
 */
IntersectionObserver.prototype._expandRectByRootMargin = function(rect) {
  var margins = this._rootMarginValues.map(function(margin, i) {
    return margin.unit == 'px' ? margin.value :
        margin.value * (i % 2 ? rect.width : rect.height) / 100;
  });
  var newRect = {
    top: rect.top - margins[0],
    right: rect.right + margins[1],
    bottom: rect.bottom + margins[2],
    left: rect.left - margins[3]
  };
  newRect.width = newRect.right - newRect.left;
  newRect.height = newRect.bottom - newRect.top;

  return newRect;
};


/**
 * Accepts an old and new entry and returns true if at least one of the
 * threshold values has been crossed.
 * @param {?IntersectionObserverEntry} oldEntry The previous entry for a
 *    particular target element or null if no previous entry exists.
 * @param {IntersectionObserverEntry} newEntry The current entry for a
 *    particular target element.
 * @return {boolean} Returns true if a any threshold has been crossed.
 * @private
 */
IntersectionObserver.prototype._hasCrossedThreshold =
    function(oldEntry, newEntry) {

  // To make comparing easier, an entry that has a ratio of 0
  // but does not actually intersect is given a value of -1
  var oldRatio = oldEntry && oldEntry.isIntersecting ?
      oldEntry.intersectionRatio || 0 : -1;
  var newRatio = newEntry.isIntersecting ?
      newEntry.intersectionRatio || 0 : -1;

  // Ignore unchanged ratios
  if (oldRatio === newRatio) return;

  for (var i = 0; i < this.thresholds.length; i++) {
    var threshold = this.thresholds[i];

    // Return true if an entry matches a threshold or if the new ratio
    // and the old ratio are on the opposite sides of a threshold.
    if (threshold == oldRatio || threshold == newRatio ||
        threshold < oldRatio !== threshold < newRatio) {
      return true;
    }
  }
};


/**
 * Returns whether or not the root element is an element and is in the DOM.
 * @return {boolean} True if the root element is an element and is in the DOM.
 * @private
 */
IntersectionObserver.prototype._rootIsInDom = function() {
  return !this.root || containsDeep(document, this.root);
};


/**
 * Returns whether or not the target element is a child of root.
 * @param {Element} target The target element to check.
 * @return {boolean} True if the target element is a child of root.
 * @private
 */
IntersectionObserver.prototype._rootContainsTarget = function(target) {
  return containsDeep(this.root || document, target);
};


/**
 * Adds the instance to the global IntersectionObserver registry if it isn't
 * already present.
 * @private
 */
IntersectionObserver.prototype._registerInstance = function() {
  if (registry.indexOf(this) < 0) {
    registry.push(this);
  }
};


/**
 * Removes the instance from the global IntersectionObserver registry.
 * @private
 */
IntersectionObserver.prototype._unregisterInstance = function() {
  var index = registry.indexOf(this);
  if (index != -1) registry.splice(index, 1);
};


/**
 * Returns the result of the performance.now() method or null in browsers
 * that don't support the API.
 * @return {number} The elapsed time since the page was requested.
 */
function now() {
  return window.performance && performance.now && performance.now();
}


/**
 * Throttles a function and delays its execution, so it's only called at most
 * once within a given time period.
 * @param {Function} fn The function to throttle.
 * @param {number} timeout The amount of time that must pass before the
 *     function can be called again.
 * @return {Function} The throttled function.
 */
function throttle(fn, timeout) {
  var timer = null;
  return function () {
    if (!timer) {
      timer = setTimeout(function() {
        fn();
        timer = null;
      }, timeout);
    }
  };
}


/**
 * Adds an event handler to a DOM node ensuring cross-browser compatibility.
 * @param {Node} node The DOM node to add the event handler to.
 * @param {string} event The event name.
 * @param {Function} fn The event handler to add.
 * @param {boolean} opt_useCapture Optionally adds the even to the capture
 *     phase. Note: this only works in modern browsers.
 */
function addEvent(node, event, fn, opt_useCapture) {
  if (typeof node.addEventListener == 'function') {
    node.addEventListener(event, fn, opt_useCapture || false);
  }
  else if (typeof node.attachEvent == 'function') {
    node.attachEvent('on' + event, fn);
  }
}


/**
 * Removes a previously added event handler from a DOM node.
 * @param {Node} node The DOM node to remove the event handler from.
 * @param {string} event The event name.
 * @param {Function} fn The event handler to remove.
 * @param {boolean} opt_useCapture If the event handler was added with this
 *     flag set to true, it should be set to true here in order to remove it.
 */
function removeEvent(node, event, fn, opt_useCapture) {
  if (typeof node.removeEventListener == 'function') {
    node.removeEventListener(event, fn, opt_useCapture || false);
  }
  else if (typeof node.detatchEvent == 'function') {
    node.detatchEvent('on' + event, fn);
  }
}


/**
 * Returns the intersection between two rect objects.
 * @param {Object} rect1 The first rect.
 * @param {Object} rect2 The second rect.
 * @return {?Object} The intersection rect or undefined if no intersection
 *     is found.
 */
function computeRectIntersection(rect1, rect2) {
  var top = Math.max(rect1.top, rect2.top);
  var bottom = Math.min(rect1.bottom, rect2.bottom);
  var left = Math.max(rect1.left, rect2.left);
  var right = Math.min(rect1.right, rect2.right);
  var width = right - left;
  var height = bottom - top;

  return (width >= 0 && height >= 0) && {
    top: top,
    bottom: bottom,
    left: left,
    right: right,
    width: width,
    height: height
  };
}


/**
 * Shims the native getBoundingClientRect for compatibility with older IE.
 * @param {Element} el The element whose bounding rect to get.
 * @return {Object} The (possibly shimmed) rect of the element.
 */
function getBoundingClientRect(el) {
  var rect;

  try {
    rect = el.getBoundingClientRect();
  } catch (err) {
    // Ignore Windows 7 IE11 "Unspecified error"
    // https://github.com/w3c/IntersectionObserver/pull/205
  }

  if (!rect) return getEmptyRect();

  // Older IE
  if (!(rect.width && rect.height)) {
    rect = {
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.right - rect.left,
      height: rect.bottom - rect.top
    };
  }
  return rect;
}


/**
 * Returns an empty rect object. An empty rect is returned when an element
 * is not in the DOM.
 * @return {Object} The empty rect.
 */
function getEmptyRect() {
  return {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0
  };
}

/**
 * Checks to see if a parent element contains a child element (including inside
 * shadow DOM).
 * @param {Node} parent The parent element.
 * @param {Node} child The child element.
 * @return {boolean} True if the parent node contains the child node.
 */
function containsDeep(parent, child) {
  var node = child;
  while (node) {
    if (node == parent) return true;

    node = getParentNode(node);
  }
  return false;
}


/**
 * Gets the parent node of an element or its host element if the parent node
 * is a shadow root.
 * @param {Node} node The node whose parent to get.
 * @return {Node|null} The parent node or null if no parent exists.
 */
function getParentNode(node) {
  var parent = node.parentNode;

  if (parent && parent.nodeType == 11 && parent.host) {
    // If the parent is a shadow root, return the host element.
    return parent.host;
  }

  if (parent && parent.assignedSlot) {
    // If the parent is distributed in a <slot>, return the parent of a slot.
    return parent.assignedSlot.parentNode;
  }

  return parent;
}


// Exposes the constructors globally.
window.IntersectionObserver = IntersectionObserver;
window.IntersectionObserverEntry = IntersectionObserverEntry;

}(window, document));
!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):t.lozad=e()}(this,function(){"use strict";var g=Object.assign||function(t){for(var e=1;e<arguments.length;e++){var r=arguments[e];for(var o in r)Object.prototype.hasOwnProperty.call(r,o)&&(t[o]=r[o])}return t},n="undefined"!=typeof document&&document.documentMode,l={rootMargin:"0px",threshold:0,load:function(t){if("picture"===t.nodeName.toLowerCase()){var e=document.createElement("img");n&&t.getAttribute("data-iesrc")&&(e.src=t.getAttribute("data-iesrc")),t.getAttribute("data-alt")&&(e.alt=t.getAttribute("data-alt")),t.appendChild(e)}if("video"===t.nodeName.toLowerCase()&&!t.getAttribute("data-src")&&t.children){for(var r=t.children,o=void 0,a=0;a<=r.length-1;a++)(o=r[a].getAttribute("data-src"))&&(r[a].src=o);t.load()}t.getAttribute("data-src")&&(t.src=t.getAttribute("data-src")),t.getAttribute("data-srcset")&&t.setAttribute("srcset",t.getAttribute("data-srcset")),t.getAttribute("data-background-image")&&(t.style.backgroundImage="url('"+t.getAttribute("data-background-image")+"')"),t.getAttribute("data-toggle-class")&&t.classList.toggle(t.getAttribute("data-toggle-class"))},loaded:function(){}};
/**
   * Detect IE browser
   * @const {boolean}
   * @private
   */function f(t){t.setAttribute("data-loaded",!0)}var b=function(t){return"true"===t.getAttribute("data-loaded")};return function(){var r,o,a=0<arguments.length&&void 0!==arguments[0]?arguments[0]:".lozad",t=1<arguments.length&&void 0!==arguments[1]?arguments[1]:{},e=g({},l,t),n=e.root,i=e.rootMargin,d=e.threshold,c=e.load,u=e.loaded,s=void 0;return window.IntersectionObserver&&(s=new IntersectionObserver((r=c,o=u,function(t,e){t.forEach(function(t){(0<t.intersectionRatio||t.isIntersecting)&&(e.unobserve(t.target),b(t.target)||(r(t.target),f(t.target),o(t.target)))})}),{root:n,rootMargin:i,threshold:d})),{observe:function(){for(var t=function(t){var e=1<arguments.length&&void 0!==arguments[1]?arguments[1]:document;return t instanceof Element?[t]:t instanceof NodeList?t:e.querySelectorAll(t)}(a,n),e=0;e<t.length;e++)b(t[e])||(s?s.observe(t[e]):(c(t[e]),f(t[e]),u(t[e])))},triggerLoad:function(t){b(t)||(c(t),f(t),u(t))},observer:s}}});

var StringBuffer = function() {
    this.buffer = new Array();
};

StringBuffer.prototype.append = function(str) {
    this.buffer[this.buffer.length] = str;
};

StringBuffer.prototype.toString = function() {
    return this.buffer.join("");
}
/*!
 * Generated using the Bootstrap Customizer (https://getbootstrap.com/docs/3.4/customize/)
 */

/*!
 * Bootstrap v3.4.1 (https://getbootstrap.com/)
 * Copyright 2011-2019 Twitter, Inc.
 * Licensed under the MIT license
 */

if (typeof jQuery === 'undefined') {
  throw new Error('Bootstrap\'s JavaScript requires jQuery')
}
+function ($) {
  'use strict';
  var version = $.fn.jquery.split(' ')[0].split('.')
  if ((version[0] < 2 && version[1] < 9) || (version[0] == 1 && version[1] == 9 && version[2] < 1) || (version[0] > 3)) {
    throw new Error('Bootstrap\'s JavaScript requires jQuery version 1.9.1 or higher, but lower than version 4')
  }
}(jQuery);

/* ========================================================================
 * Bootstrap: dropdown.js v3.4.1
 * https://getbootstrap.com/docs/3.4/javascript/#dropdowns
 * ========================================================================
 * Copyright 2011-2019 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // DROPDOWN CLASS DEFINITION
  // =========================

  var backdrop = '.dropdown-backdrop'
  var toggle   = '[data-toggle="dropdown"]'
  var Dropdown = function (element) {
    $(element).on('click.bs.dropdown', this.toggle)
  }

  Dropdown.VERSION = '3.4.1'

  function getParent($this) {
    var selector = $this.attr('data-target')

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && /#[A-Za-z]/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, '') // strip for ie7
    }

    var $parent = selector !== '#' ? $(document).find(selector) : null

    return $parent && $parent.length ? $parent : $this.parent()
  }

  function clearMenus(e) {
    if (e && e.which === 3) return
    $(backdrop).remove()
    $(toggle).each(function () {
      var $this         = $(this)
      var $parent       = getParent($this)
      var relatedTarget = { relatedTarget: this }

      if (!$parent.hasClass('open')) return

      if (e && e.type == 'click' && /input|textarea/i.test(e.target.tagName) && $.contains($parent[0], e.target)) return

      $parent.trigger(e = $.Event('hide.bs.dropdown', relatedTarget))

      if (e.isDefaultPrevented()) return

      $this.attr('aria-expanded', 'false')
      $parent.removeClass('open').trigger($.Event('hidden.bs.dropdown', relatedTarget))
    })
  }

  Dropdown.prototype.toggle = function (e) {
    var $this = $(this)

    if ($this.is('.disabled, :disabled')) return

    var $parent  = getParent($this)
    var isActive = $parent.hasClass('open')

    clearMenus()

    if (!isActive) {
      if ('ontouchstart' in document.documentElement && !$parent.closest('.navbar-nav').length) {
        // if mobile we use a backdrop because click events don't delegate
        $(document.createElement('div'))
          .addClass('dropdown-backdrop')
          .insertAfter($(this))
          .on('click', clearMenus)
      }

      var relatedTarget = { relatedTarget: this }
      $parent.trigger(e = $.Event('show.bs.dropdown', relatedTarget))

      if (e.isDefaultPrevented()) return

      $this
        .trigger('focus')
        .attr('aria-expanded', 'true')

      $parent
        .toggleClass('open')
        .trigger($.Event('shown.bs.dropdown', relatedTarget))
    }

    return false
  }

  Dropdown.prototype.keydown = function (e) {
    if (!/(38|40|27|32)/.test(e.which) || /input|textarea/i.test(e.target.tagName)) return

    var $this = $(this)

    e.preventDefault()
    e.stopPropagation()

    if ($this.is('.disabled, :disabled')) return

    var $parent  = getParent($this)
    var isActive = $parent.hasClass('open')

    if (!isActive && e.which != 27 || isActive && e.which == 27) {
      if (e.which == 27) $parent.find(toggle).trigger('focus')
      return $this.trigger('click')
    }

    var desc = ' li:not(.disabled):visible a'
    var $items = $parent.find('.dropdown-menu' + desc)

    if (!$items.length) return

    var index = $items.index(e.target)

    if (e.which == 38 && index > 0)                 index--         // up
    if (e.which == 40 && index < $items.length - 1) index++         // down
    if (!~index)                                    index = 0

    $items.eq(index).trigger('focus')
  }


  // DROPDOWN PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this)
      var data  = $this.data('bs.dropdown')

      if (!data) $this.data('bs.dropdown', (data = new Dropdown(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  var old = $.fn.dropdown

  $.fn.dropdown             = Plugin
  $.fn.dropdown.Constructor = Dropdown


  // DROPDOWN NO CONFLICT
  // ====================

  $.fn.dropdown.noConflict = function () {
    $.fn.dropdown = old
    return this
  }


  // APPLY TO STANDARD DROPDOWN ELEMENTS
  // ===================================

  $(document)
    .on('click.bs.dropdown.data-api', clearMenus)
    .on('click.bs.dropdown.data-api', '.dropdown form', function (e) { e.stopPropagation() })
    .on('click.bs.dropdown.data-api', toggle, Dropdown.prototype.toggle)
    .on('keydown.bs.dropdown.data-api', toggle, Dropdown.prototype.keydown)
    .on('keydown.bs.dropdown.data-api', '.dropdown-menu', Dropdown.prototype.keydown)

}(jQuery);

/*!
 * Bootstrap-select v1.13.9 (https://developer.snapappointments.com/bootstrap-select)
 *
 * Copyright 2012-2019 SnapAppointments, LLC
 * Licensed under MIT (https://github.com/snapappointments/bootstrap-select/blob/master/LICENSE)
 */

(function (root, factory) {
  if (root === undefined && window !== undefined) root = window;
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module unless amdModuleId is set
    define(["jquery"], function (a0) {
      return (factory(a0));
    });
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require("jquery"));
  } else {
    factory(root["jQuery"]);
  }
}(this, function (jQuery) {

(function ($) {
  'use strict';

  var DISALLOWED_ATTRIBUTES = ['sanitize', 'whiteList', 'sanitizeFn'];

  var uriAttrs = [
    'background',
    'cite',
    'href',
    'itemtype',
    'longdesc',
    'poster',
    'src',
    'xlink:href'
  ];

  var ARIA_ATTRIBUTE_PATTERN = /^aria-[\w-]*$/i;

  var DefaultWhitelist = {
    // Global attributes allowed on any supplied element below.
    '*': ['class', 'dir', 'id', 'lang', 'role', 'tabindex', 'style', ARIA_ATTRIBUTE_PATTERN],
    a: ['target', 'href', 'title', 'rel'],
    area: [],
    b: [],
    br: [],
    col: [],
    code: [],
    div: [],
    em: [],
    hr: [],
    h1: [],
    h2: [],
    h3: [],
    h4: [],
    h5: [],
    h6: [],
    i: [],
    img: ['src', 'alt', 'title', 'width', 'height'],
    li: [],
    ol: [],
    p: [],
    pre: [],
    s: [],
    small: [],
    span: [],
    sub: [],
    sup: [],
    strong: [],
    u: [],
    ul: []
  }

  /**
   * A pattern that recognizes a commonly useful subset of URLs that are safe.
   *
   * Shoutout to Angular 7 https://github.com/angular/angular/blob/7.2.4/packages/core/src/sanitization/url_sanitizer.ts
   */
  var SAFE_URL_PATTERN = /^(?:(?:https?|mailto|ftp|tel|file):|[^&:/?#]*(?:[/?#]|$))/gi;

  /**
   * A pattern that matches safe data URLs. Only matches image, video and audio types.
   *
   * Shoutout to Angular 7 https://github.com/angular/angular/blob/7.2.4/packages/core/src/sanitization/url_sanitizer.ts
   */
  var DATA_URL_PATTERN = /^data:(?:image\/(?:bmp|gif|jpeg|jpg|png|tiff|webp)|video\/(?:mpeg|mp4|ogg|webm)|audio\/(?:mp3|oga|ogg|opus));base64,[a-z0-9+/]+=*$/i;

  function allowedAttribute (attr, allowedAttributeList) {
    var attrName = attr.nodeName.toLowerCase()

    if ($.inArray(attrName, allowedAttributeList) !== -1) {
      if ($.inArray(attrName, uriAttrs) !== -1) {
        return Boolean(attr.nodeValue.match(SAFE_URL_PATTERN) || attr.nodeValue.match(DATA_URL_PATTERN))
      }

      return true
    }

    var regExp = $(allowedAttributeList).filter(function (index, value) {
      return value instanceof RegExp
    })

    // Check if a regular expression validates the attribute.
    for (var i = 0, l = regExp.length; i < l; i++) {
      if (attrName.match(regExp[i])) {
        return true
      }
    }

    return false
  }

  function sanitizeHtml (unsafeElements, whiteList, sanitizeFn) {
    if (sanitizeFn && typeof sanitizeFn === 'function') {
      return sanitizeFn(unsafeElements);
    }

    var whitelistKeys = Object.keys(whiteList);

    for (var i = 0, len = unsafeElements.length; i < len; i++) {
      var elements = unsafeElements[i].querySelectorAll('*');

      for (var j = 0, len2 = elements.length; j < len2; j++) {
        var el = elements[j];
        var elName = el.nodeName.toLowerCase();

        if (whitelistKeys.indexOf(elName) === -1) {
          el.parentNode.removeChild(el);

          continue;
        }

        var attributeList = [].slice.call(el.attributes);
        var whitelistedAttributes = [].concat(whiteList['*'] || [], whiteList[elName] || []);

        for (var k = 0, len3 = attributeList.length; k < len3; k++) {
          var attr = attributeList[k];

          if (!allowedAttribute(attr, whitelistedAttributes)) {
            el.removeAttribute(attr.nodeName);
          }
        }
      }
    }
  }

  // Polyfill for browsers with no classList support
  // Remove in v2
  if (!('classList' in document.createElement('_'))) {
    (function (view) {
      if (!('Element' in view)) return;

      var classListProp = 'classList',
          protoProp = 'prototype',
          elemCtrProto = view.Element[protoProp],
          objCtr = Object,
          classListGetter = function () {
            var $elem = $(this);

            return {
              add: function (classes) {
                classes = Array.prototype.slice.call(arguments).join(' ');
                return $elem.addClass(classes);
              },
              remove: function (classes) {
                classes = Array.prototype.slice.call(arguments).join(' ');
                return $elem.removeClass(classes);
              },
              toggle: function (classes, force) {
                return $elem.toggleClass(classes, force);
              },
              contains: function (classes) {
                return $elem.hasClass(classes);
              }
            }
          };

      if (objCtr.defineProperty) {
        var classListPropDesc = {
          get: classListGetter,
          enumerable: true,
          configurable: true
        };
        try {
          objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
        } catch (ex) { // IE 8 doesn't support enumerable:true
          // adding undefined to fight this issue https://github.com/eligrey/classList.js/issues/36
          // modernie IE8-MSW7 machine has IE8 8.0.6001.18702 and is affected
          if (ex.number === undefined || ex.number === -0x7FF5EC54) {
            classListPropDesc.enumerable = false;
            objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
          }
        }
      } else if (objCtr[protoProp].__defineGetter__) {
        elemCtrProto.__defineGetter__(classListProp, classListGetter);
      }
    }(window));
  }

  var testElement = document.createElement('_');

  testElement.classList.add('c1', 'c2');

  if (!testElement.classList.contains('c2')) {
    var _add = DOMTokenList.prototype.add,
        _remove = DOMTokenList.prototype.remove;

    DOMTokenList.prototype.add = function () {
      Array.prototype.forEach.call(arguments, _add.bind(this));
    }

    DOMTokenList.prototype.remove = function () {
      Array.prototype.forEach.call(arguments, _remove.bind(this));
    }
  }

  testElement.classList.toggle('c3', false);

  // Polyfill for IE 10 and Firefox <24, where classList.toggle does not
  // support the second argument.
  if (testElement.classList.contains('c3')) {
    var _toggle = DOMTokenList.prototype.toggle;

    DOMTokenList.prototype.toggle = function (token, force) {
      if (1 in arguments && !this.contains(token) === !force) {
        return force;
      } else {
        return _toggle.call(this, token);
      }
    };
  }

  testElement = null;

  // shallow array comparison
  function isEqual (array1, array2) {
    return array1.length === array2.length && array1.every(function (element, index) {
      return element === array2[index];
    });
  };

  // <editor-fold desc="Shims">
  if (!String.prototype.startsWith) {
    (function () {
      'use strict'; // needed to support `apply`/`call` with `undefined`/`null`
      var defineProperty = (function () {
        // IE 8 only supports `Object.defineProperty` on DOM elements
        try {
          var object = {};
          var $defineProperty = Object.defineProperty;
          var result = $defineProperty(object, object, object) && $defineProperty;
        } catch (error) {
        }
        return result;
      }());
      var toString = {}.toString;
      var startsWith = function (search) {
        if (this == null) {
          throw new TypeError();
        }
        var string = String(this);
        if (search && toString.call(search) == '[object RegExp]') {
          throw new TypeError();
        }
        var stringLength = string.length;
        var searchString = String(search);
        var searchLength = searchString.length;
        var position = arguments.length > 1 ? arguments[1] : undefined;
        // `ToInteger`
        var pos = position ? Number(position) : 0;
        if (pos != pos) { // better `isNaN`
          pos = 0;
        }
        var start = Math.min(Math.max(pos, 0), stringLength);
        // Avoid the `indexOf` call if no match is possible
        if (searchLength + start > stringLength) {
          return false;
        }
        var index = -1;
        while (++index < searchLength) {
          if (string.charCodeAt(start + index) != searchString.charCodeAt(index)) {
            return false;
          }
        }
        return true;
      };
      if (defineProperty) {
        defineProperty(String.prototype, 'startsWith', {
          'value': startsWith,
          'configurable': true,
          'writable': true
        });
      } else {
        String.prototype.startsWith = startsWith;
      }
    }());
  }

  if (!Object.keys) {
    Object.keys = function (
      o, // object
      k, // key
      r  // result array
    ) {
      // initialize object and result
      r = [];
      // iterate over object keys
      for (k in o) {
        // fill result array with non-prototypical keys
        r.hasOwnProperty.call(o, k) && r.push(k);
      }
      // return result
      return r;
    };
  }

  if (HTMLSelectElement && !HTMLSelectElement.prototype.hasOwnProperty('selectedOptions')) {
    Object.defineProperty(HTMLSelectElement.prototype, 'selectedOptions', {
      get: function () {
        return this.querySelectorAll(':checked');
      }
    });
  }

  // much faster than $.val()
  function getSelectValues (select) {
    var result = [];
    var options = select.selectedOptions;
    var opt;

    if (select.multiple) {
      for (var i = 0, len = options.length; i < len; i++) {
        opt = options[i];

        result.push(opt.value || opt.text);
      }
    } else {
      result = select.value;
    }

    return result;
  }

  // set data-selected on select element if the value has been programmatically selected
  // prior to initialization of bootstrap-select
  // * consider removing or replacing an alternative method *
  var valHooks = {
    useDefault: false,
    _set: $.valHooks.select.set
  };

  $.valHooks.select.set = function (elem, value) {
    if (value && !valHooks.useDefault) $(elem).data('selected', true);

    return valHooks._set.apply(this, arguments);
  };

  var changedArguments = null;

  var EventIsSupported = (function () {
    try {
      new Event('change');
      return true;
    } catch (e) {
      return false;
    }
  })();

  $.fn.triggerNative = function (eventName) {
    var el = this[0],
        event;

    if (el.dispatchEvent) { // for modern browsers & IE9+
      if (EventIsSupported) {
        // For modern browsers
        event = new Event(eventName, {
          bubbles: true
        });
      } else {
        // For IE since it doesn't support Event constructor
        event = document.createEvent('Event');
        event.initEvent(eventName, true, false);
      }

      el.dispatchEvent(event);
    } else if (el.fireEvent) { // for IE8
      event = document.createEventObject();
      event.eventType = eventName;
      el.fireEvent('on' + eventName, event);
    } else {
      // fall back to jQuery.trigger
      this.trigger(eventName);
    }
  };
  // </editor-fold>

  function stringSearch (li, searchString, method, normalize) {
    var stringTypes = [
          'display',
          'subtext',
          'tokens'
        ],
        searchSuccess = false;

    for (var i = 0; i < stringTypes.length; i++) {
      var stringType = stringTypes[i],
          string = li[stringType];

      if (string) {
        string = string.toString();

        // Strip HTML tags. This isn't perfect, but it's much faster than any other method
        if (stringType === 'display') {
          string = string.replace(/<[^>]+>/g, '');
        }

        if (normalize) string = normalizeToBase(string);
        string = string.toUpperCase();

        if (method === 'contains') {
          searchSuccess = string.indexOf(searchString) >= 0;
        } else {
          searchSuccess = string.startsWith(searchString);
        }

        if (searchSuccess) break;
      }
    }

    return searchSuccess;
  }

  function toInteger (value) {
    return parseInt(value, 10) || 0;
  }

  // Borrowed from Lodash (_.deburr)
  /** Used to map Latin Unicode letters to basic Latin letters. */
  var deburredLetters = {
    // Latin-1 Supplement block.
    '\xc0': 'A',  '\xc1': 'A', '\xc2': 'A', '\xc3': 'A', '\xc4': 'A', '\xc5': 'A',
    '\xe0': 'a',  '\xe1': 'a', '\xe2': 'a', '\xe3': 'a', '\xe4': 'a', '\xe5': 'a',
    '\xc7': 'C',  '\xe7': 'c',
    '\xd0': 'D',  '\xf0': 'd',
    '\xc8': 'E',  '\xc9': 'E', '\xca': 'E', '\xcb': 'E',
    '\xe8': 'e',  '\xe9': 'e', '\xea': 'e', '\xeb': 'e',
    '\xcc': 'I',  '\xcd': 'I', '\xce': 'I', '\xcf': 'I',
    '\xec': 'i',  '\xed': 'i', '\xee': 'i', '\xef': 'i',
    '\xd1': 'N',  '\xf1': 'n',
    '\xd2': 'O',  '\xd3': 'O', '\xd4': 'O', '\xd5': 'O', '\xd6': 'O', '\xd8': 'O',
    '\xf2': 'o',  '\xf3': 'o', '\xf4': 'o', '\xf5': 'o', '\xf6': 'o', '\xf8': 'o',
    '\xd9': 'U',  '\xda': 'U', '\xdb': 'U', '\xdc': 'U',
    '\xf9': 'u',  '\xfa': 'u', '\xfb': 'u', '\xfc': 'u',
    '\xdd': 'Y',  '\xfd': 'y', '\xff': 'y',
    '\xc6': 'Ae', '\xe6': 'ae',
    '\xde': 'Th', '\xfe': 'th',
    '\xdf': 'ss',
    // Latin Extended-A block.
    '\u0100': 'A',  '\u0102': 'A', '\u0104': 'A',
    '\u0101': 'a',  '\u0103': 'a', '\u0105': 'a',
    '\u0106': 'C',  '\u0108': 'C', '\u010a': 'C', '\u010c': 'C',
    '\u0107': 'c',  '\u0109': 'c', '\u010b': 'c', '\u010d': 'c',
    '\u010e': 'D',  '\u0110': 'D', '\u010f': 'd', '\u0111': 'd',
    '\u0112': 'E',  '\u0114': 'E', '\u0116': 'E', '\u0118': 'E', '\u011a': 'E',
    '\u0113': 'e',  '\u0115': 'e', '\u0117': 'e', '\u0119': 'e', '\u011b': 'e',
    '\u011c': 'G',  '\u011e': 'G', '\u0120': 'G', '\u0122': 'G',
    '\u011d': 'g',  '\u011f': 'g', '\u0121': 'g', '\u0123': 'g',
    '\u0124': 'H',  '\u0126': 'H', '\u0125': 'h', '\u0127': 'h',
    '\u0128': 'I',  '\u012a': 'I', '\u012c': 'I', '\u012e': 'I', '\u0130': 'I',
    '\u0129': 'i',  '\u012b': 'i', '\u012d': 'i', '\u012f': 'i', '\u0131': 'i',
    '\u0134': 'J',  '\u0135': 'j',
    '\u0136': 'K',  '\u0137': 'k', '\u0138': 'k',
    '\u0139': 'L',  '\u013b': 'L', '\u013d': 'L', '\u013f': 'L', '\u0141': 'L',
    '\u013a': 'l',  '\u013c': 'l', '\u013e': 'l', '\u0140': 'l', '\u0142': 'l',
    '\u0143': 'N',  '\u0145': 'N', '\u0147': 'N', '\u014a': 'N',
    '\u0144': 'n',  '\u0146': 'n', '\u0148': 'n', '\u014b': 'n',
    '\u014c': 'O',  '\u014e': 'O', '\u0150': 'O',
    '\u014d': 'o',  '\u014f': 'o', '\u0151': 'o',
    '\u0154': 'R',  '\u0156': 'R', '\u0158': 'R',
    '\u0155': 'r',  '\u0157': 'r', '\u0159': 'r',
    '\u015a': 'S',  '\u015c': 'S', '\u015e': 'S', '\u0160': 'S',
    '\u015b': 's',  '\u015d': 's', '\u015f': 's', '\u0161': 's',
    '\u0162': 'T',  '\u0164': 'T', '\u0166': 'T',
    '\u0163': 't',  '\u0165': 't', '\u0167': 't',
    '\u0168': 'U',  '\u016a': 'U', '\u016c': 'U', '\u016e': 'U', '\u0170': 'U', '\u0172': 'U',
    '\u0169': 'u',  '\u016b': 'u', '\u016d': 'u', '\u016f': 'u', '\u0171': 'u', '\u0173': 'u',
    '\u0174': 'W',  '\u0175': 'w',
    '\u0176': 'Y',  '\u0177': 'y', '\u0178': 'Y',
    '\u0179': 'Z',  '\u017b': 'Z', '\u017d': 'Z',
    '\u017a': 'z',  '\u017c': 'z', '\u017e': 'z',
    '\u0132': 'IJ', '\u0133': 'ij',
    '\u0152': 'Oe', '\u0153': 'oe',
    '\u0149': "'n", '\u017f': 's'
  };

  /** Used to match Latin Unicode letters (excluding mathematical operators). */
  var reLatin = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g;

  /** Used to compose unicode character classes. */
  var rsComboMarksRange = '\\u0300-\\u036f',
      reComboHalfMarksRange = '\\ufe20-\\ufe2f',
      rsComboSymbolsRange = '\\u20d0-\\u20ff',
      rsComboMarksExtendedRange = '\\u1ab0-\\u1aff',
      rsComboMarksSupplementRange = '\\u1dc0-\\u1dff',
      rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange + rsComboMarksExtendedRange + rsComboMarksSupplementRange;

  /** Used to compose unicode capture groups. */
  var rsCombo = '[' + rsComboRange + ']';

  /**
   * Used to match [combining diacritical marks](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks) and
   * [combining diacritical marks for symbols](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks_for_Symbols).
   */
  var reComboMark = RegExp(rsCombo, 'g');

  function deburrLetter (key) {
    return deburredLetters[key];
  };

  function normalizeToBase (string) {
    string = string.toString();
    return string && string.replace(reLatin, deburrLetter).replace(reComboMark, '');
  }

  // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function (map) {
    var escaper = function (match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped.
    var source = '(?:' + Object.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function (string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };

  var htmlEscape = createEscaper(escapeMap);

  /**
   * ------------------------------------------------------------------------
   * Constants
   * ------------------------------------------------------------------------
   */

  var keyCodeMap = {
    32: ' ',
    48: '0',
    49: '1',
    50: '2',
    51: '3',
    52: '4',
    53: '5',
    54: '6',
    55: '7',
    56: '8',
    57: '9',
    59: ';',
    65: 'A',
    66: 'B',
    67: 'C',
    68: 'D',
    69: 'E',
    70: 'F',
    71: 'G',
    72: 'H',
    73: 'I',
    74: 'J',
    75: 'K',
    76: 'L',
    77: 'M',
    78: 'N',
    79: 'O',
    80: 'P',
    81: 'Q',
    82: 'R',
    83: 'S',
    84: 'T',
    85: 'U',
    86: 'V',
    87: 'W',
    88: 'X',
    89: 'Y',
    90: 'Z',
    96: '0',
    97: '1',
    98: '2',
    99: '3',
    100: '4',
    101: '5',
    102: '6',
    103: '7',
    104: '8',
    105: '9'
  };

  var keyCodes = {
    ESCAPE: 27, // KeyboardEvent.which value for Escape (Esc) key
    ENTER: 13, // KeyboardEvent.which value for Enter key
    SPACE: 32, // KeyboardEvent.which value for space key
    TAB: 9, // KeyboardEvent.which value for tab key
    ARROW_UP: 38, // KeyboardEvent.which value for up arrow key
    ARROW_DOWN: 40 // KeyboardEvent.which value for down arrow key
  }

  var version = {
    success: false,
    major: '3'
  };

  try {
    version.full = ($.fn.dropdown.Constructor.VERSION || '').split(' ')[0].split('.');
    version.major = version.full[0];
    version.success = true;
  } catch (err) {
    // do nothing
  }

  var selectId = 0;

  var EVENT_KEY = '.bs.select';

  var classNames = {
    DISABLED: 'disabled',
    DIVIDER: 'divider',
    SHOW: 'open',
    DROPUP: 'dropup',
    MENU: 'dropdown-menu',
    MENURIGHT: 'dropdown-menu-right',
    MENULEFT: 'dropdown-menu-left',
    // to-do: replace with more advanced template/customization options
    BUTTONCLASS: 'btn-default',
    POPOVERHEADER: 'popover-title',
    ICONBASE: 'glyphicon',
    TICKICON: 'glyphicon-ok'
  }

  var Selector = {
    MENU: '.' + classNames.MENU
  }

  var elementTemplates = {
    span: document.createElement('span'),
    i: document.createElement('i'),
    subtext: document.createElement('small'),
    a: document.createElement('a'),
    li: document.createElement('li'),
    whitespace: document.createTextNode('\u00A0'),
    fragment: document.createDocumentFragment()
  }

  elementTemplates.a.setAttribute('role', 'option');
  elementTemplates.subtext.className = 'text-muted';

  elementTemplates.text = elementTemplates.span.cloneNode(false);
  elementTemplates.text.className = 'text';

  elementTemplates.checkMark = elementTemplates.span.cloneNode(false);

  var REGEXP_ARROW = new RegExp(keyCodes.ARROW_UP + '|' + keyCodes.ARROW_DOWN);
  var REGEXP_TAB_OR_ESCAPE = new RegExp('^' + keyCodes.TAB + '$|' + keyCodes.ESCAPE);

  var generateOption = {
    li: function (content, classes, optgroup) {
      var li = elementTemplates.li.cloneNode(false);

      if (content) {
        if (content.nodeType === 1 || content.nodeType === 11) {
          li.appendChild(content);
        } else {
          li.innerHTML = content;
        }
      }

      if (typeof classes !== 'undefined' && classes !== '') li.className = classes;
      if (typeof optgroup !== 'undefined' && optgroup !== null) li.classList.add('optgroup-' + optgroup);

      return li;
    },

    a: function (text, classes, inline) {
      var a = elementTemplates.a.cloneNode(true);

      if (text) {
        if (text.nodeType === 11) {
          a.appendChild(text);
        } else {
          a.insertAdjacentHTML('beforeend', text);
        }
      }

      if (typeof classes !== 'undefined' && classes !== '') a.className = classes;
      if (version.major === '4') a.classList.add('dropdown-item');
      if (inline) a.setAttribute('style', inline);

      return a;
    },

    text: function (options, useFragment) {
      var textElement = elementTemplates.text.cloneNode(false),
          subtextElement,
          iconElement;

      if (options.content) {
        textElement.innerHTML = options.content;
      } else {
        textElement.textContent = options.text;

        if (options.icon) {
          var whitespace = elementTemplates.whitespace.cloneNode(false);

          // need to use <i> for icons in the button to prevent a breaking change
          // note: switch to span in next major release
          iconElement = (useFragment === true ? elementTemplates.i : elementTemplates.span).cloneNode(false);
          iconElement.className = options.iconBase + ' ' + options.icon;

          elementTemplates.fragment.appendChild(iconElement);
          elementTemplates.fragment.appendChild(whitespace);
        }

        if (options.subtext) {
          subtextElement = elementTemplates.subtext.cloneNode(false);
          subtextElement.textContent = options.subtext;
          textElement.appendChild(subtextElement);
        }
      }

      if (useFragment === true) {
        while (textElement.childNodes.length > 0) {
          elementTemplates.fragment.appendChild(textElement.childNodes[0]);
        }
      } else {
        elementTemplates.fragment.appendChild(textElement);
      }

      return elementTemplates.fragment;
    },

    label: function (options) {
      var textElement = elementTemplates.text.cloneNode(false),
          subtextElement,
          iconElement;

      textElement.innerHTML = options.label;

      if (options.icon) {
        var whitespace = elementTemplates.whitespace.cloneNode(false);

        iconElement = elementTemplates.span.cloneNode(false);
        iconElement.className = options.iconBase + ' ' + options.icon;

        elementTemplates.fragment.appendChild(iconElement);
        elementTemplates.fragment.appendChild(whitespace);
      }

      if (options.subtext) {
        subtextElement = elementTemplates.subtext.cloneNode(false);
        subtextElement.textContent = options.subtext;
        textElement.appendChild(subtextElement);
      }

      elementTemplates.fragment.appendChild(textElement);

      return elementTemplates.fragment;
    }
  }

  var Selectpicker = function (element, options) {
    var that = this;

    // bootstrap-select has been initialized - revert valHooks.select.set back to its original function
    if (!valHooks.useDefault) {
      $.valHooks.select.set = valHooks._set;
      valHooks.useDefault = true;
    }

    this.$element = $(element);
    this.$newElement = null;
    this.$button = null;
    this.$menu = null;
    this.options = options;
    this.selectpicker = {
      main: {},
      current: {}, // current changes if a search is in progress
      search: {},
      view: {},
      keydown: {
        keyHistory: '',
        resetKeyHistory: {
          start: function () {
            return setTimeout(function () {
              that.selectpicker.keydown.keyHistory = '';
            }, 800);
          }
        }
      }
    };
    // If we have no title yet, try to pull it from the html title attribute (jQuery doesnt' pick it up as it's not a
    // data-attribute)
    if (this.options.title === null) {
      this.options.title = this.$element.attr('title');
    }

    // Format window padding
    var winPad = this.options.windowPadding;
    if (typeof winPad === 'number') {
      this.options.windowPadding = [winPad, winPad, winPad, winPad];
    }

    // Expose public methods
    this.val = Selectpicker.prototype.val;
    this.render = Selectpicker.prototype.render;
    this.refresh = Selectpicker.prototype.refresh;
    this.setStyle = Selectpicker.prototype.setStyle;
    this.selectAll = Selectpicker.prototype.selectAll;
    this.deselectAll = Selectpicker.prototype.deselectAll;
    this.destroy = Selectpicker.prototype.destroy;
    this.remove = Selectpicker.prototype.remove;
    this.show = Selectpicker.prototype.show;
    this.hide = Selectpicker.prototype.hide;

    this.init();
  };

  Selectpicker.VERSION = '1.13.9';

  // part of this is duplicated in i18n/defaults-en_US.js. Make sure to update both.
  Selectpicker.DEFAULTS = {
    noneSelectedText: 'Nothing selected',
    noneResultsText: 'No results matched {0}',
    countSelectedText: function (numSelected, numTotal) {
      return (numSelected == 1) ? '{0} item selected' : '{0} items selected';
    },
    maxOptionsText: function (numAll, numGroup) {
      return [
        (numAll == 1) ? 'Limit reached ({n} item max)' : 'Limit reached ({n} items max)',
        (numGroup == 1) ? 'Group limit reached ({n} item max)' : 'Group limit reached ({n} items max)'
      ];
    },
    selectAllText: 'Select All',
    deselectAllText: 'Deselect All',
    doneButton: false,
    doneButtonText: 'Close',
    multipleSeparator: ', ',
    styleBase: 'btn',
    style: classNames.BUTTONCLASS,
    size: 'auto',
    title: null,
    selectedTextFormat: 'values',
    width: false,
    container: false,
    hideDisabled: false,
    showSubtext: false,
    showIcon: true,
    showContent: true,
    dropupAuto: true,
    header: false,
    liveSearch: false,
    liveSearchPlaceholder: null,
    liveSearchNormalize: false,
    liveSearchStyle: 'contains',
    actionsBox: false,
    iconBase: classNames.ICONBASE,
    tickIcon: classNames.TICKICON,
    showTick: false,
    template: {
      caret: '<span class="caret"></span>'
    },
    maxOptions: false,
    mobile: false,
    selectOnTab: false,
    dropdownAlignRight: false,
    windowPadding: 0,
    virtualScroll: 600,
    display: false,
    sanitize: true,
    sanitizeFn: null,
    whiteList: DefaultWhitelist
  };

  Selectpicker.prototype = {

    constructor: Selectpicker,

    init: function () {
      var that = this,
          id = this.$element.attr('id');

      this.selectId = selectId++;

      this.$element[0].classList.add('bs-select-hidden');

      this.multiple = this.$element.prop('multiple');
      this.autofocus = this.$element.prop('autofocus');
      this.options.showTick = this.$element[0].classList.contains('show-tick');

      this.$newElement = this.createDropdown();
      this.$element
        .after(this.$newElement)
        .prependTo(this.$newElement);

      this.$button = this.$newElement.children('button');
      this.$menu = this.$newElement.children(Selector.MENU);
      this.$menuInner = this.$menu.children('.inner');
      this.$searchbox = this.$menu.find('input');

      this.$element[0].classList.remove('bs-select-hidden');

      if (this.options.dropdownAlignRight === true) this.$menu[0].classList.add(classNames.MENURIGHT);

      if (typeof id !== 'undefined') {
        this.$button.attr('data-id', id);
      }

      this.checkDisabled();
      this.clickListener();
      if (this.options.liveSearch) this.liveSearchListener();
      this.setStyle();
      this.render();
      this.setWidth();
      if (this.options.container) {
        this.selectPosition();
      } else {
        this.$element.on('hide' + EVENT_KEY, function () {
          if (that.isVirtual()) {
            // empty menu on close
            var menuInner = that.$menuInner[0],
                emptyMenu = menuInner.firstChild.cloneNode(false);

            // replace the existing UL with an empty one - this is faster than $.empty() or innerHTML = ''
            menuInner.replaceChild(emptyMenu, menuInner.firstChild);
            menuInner.scrollTop = 0;
          }
        });
      }
      this.$menu.data('this', this);
      this.$newElement.data('this', this);
      if (this.options.mobile) this.mobile();

      this.$newElement.on({
        'hide.bs.dropdown': function (e) {
          that.$menuInner.attr('aria-expanded', false);
          that.$element.trigger('hide' + EVENT_KEY, e);
        },
        'hidden.bs.dropdown': function (e) {
          that.$element.trigger('hidden' + EVENT_KEY, e);
        },
        'show.bs.dropdown': function (e) {
          that.$menuInner.attr('aria-expanded', true);
          that.$element.trigger('show' + EVENT_KEY, e);
        },
        'shown.bs.dropdown': function (e) {
          that.$element.trigger('shown' + EVENT_KEY, e);
        }
      });

      if (that.$element[0].hasAttribute('required')) {
        this.$element.on('invalid' + EVENT_KEY, function () {
          that.$button[0].classList.add('bs-invalid');

          that.$element
            .on('shown' + EVENT_KEY + '.invalid', function () {
              that.$element
                .val(that.$element.val()) // set the value to hide the validation message in Chrome when menu is opened
                .off('shown' + EVENT_KEY + '.invalid');
            })
            .on('rendered' + EVENT_KEY, function () {
              // if select is no longer invalid, remove the bs-invalid class
              if (this.validity.valid) that.$button[0].classList.remove('bs-invalid');
              that.$element.off('rendered' + EVENT_KEY);
            });

          that.$button.on('blur' + EVENT_KEY, function () {
            that.$element.trigger('focus').trigger('blur');
            that.$button.off('blur' + EVENT_KEY);
          });
        });
      }

      setTimeout(function () {
        that.createLi();
        that.$element.trigger('loaded' + EVENT_KEY);
      });
    },

    createDropdown: function () {
      // Options
      // If we are multiple or showTick option is set, then add the show-tick class
      var showTick = (this.multiple || this.options.showTick) ? ' show-tick' : '',
          inputGroup = '',
          autofocus = this.autofocus ? ' autofocus' : '';

      if (version.major < 4 && this.$element.parent().hasClass('input-group')) {
        inputGroup = ' input-group-btn';
      }

      // Elements
      var drop,
          header = '',
          searchbox = '',
          actionsbox = '',
          donebutton = '';

      if (this.options.header) {
        header =
          '<div class="' + classNames.POPOVERHEADER + '">' +
            '<button type="button" class="close" aria-hidden="true">&times;</button>' +
              this.options.header +
          '</div>';
      }

      if (this.options.liveSearch) {
        searchbox =
          '<div class="bs-searchbox">' +
            '<input type="text" class="form-control" autocomplete="off"' +
              (
                this.options.liveSearchPlaceholder === null ? ''
                :
                ' placeholder="' + htmlEscape(this.options.liveSearchPlaceholder) + '"'
              ) +
              ' role="textbox" aria-label="Search">' +
          '</div>';
      }

      if (this.multiple && this.options.actionsBox) {
        actionsbox =
          '<div class="bs-actionsbox">' +
            '<div class="btn-group btn-group-sm btn-block">' +
              '<button type="button" class="actions-btn bs-select-all btn ' + classNames.BUTTONCLASS + '">' +
                this.options.selectAllText +
              '</button>' +
              '<button type="button" class="actions-btn bs-deselect-all btn ' + classNames.BUTTONCLASS + '">' +
                this.options.deselectAllText +
              '</button>' +
            '</div>' +
          '</div>';
      }

      if (this.multiple && this.options.doneButton) {
        donebutton =
          '<div class="bs-donebutton">' +
            '<div class="btn-group btn-block">' +
              '<button type="button" class="btn btn-sm ' + classNames.BUTTONCLASS + '">' +
                this.options.doneButtonText +
              '</button>' +
            '</div>' +
          '</div>';
      }

      drop =
        '<div class="dropdown bootstrap-select' + showTick + inputGroup + '">' +
          '<button type="button" class="' + this.options.styleBase + ' dropdown-toggle" ' + (this.options.display === 'static' ? 'data-display="static"' : '') + 'data-toggle="dropdown"' + autofocus + ' role="button">' +
            '<div class="filter-option">' +
              '<div class="filter-option-inner">' +
                '<div class="filter-option-inner-inner"></div>' +
              '</div> ' +
            '</div>' +
            (
              version.major === '4' ? ''
              :
              '<span class="bs-caret">' +
                this.options.template.caret +
              '</span>'
            ) +
          '</button>' +
          '<div class="' + classNames.MENU + ' ' + (version.major === '4' ? '' : classNames.SHOW) + '" role="combobox">' +
            header +
            searchbox +
            actionsbox +
            '<div class="inner ' + classNames.SHOW + '" role="listbox" aria-expanded="false" tabindex="-1">' +
                '<ul class="' + classNames.MENU + ' inner ' + (version.major === '4' ? classNames.SHOW : '') + '">' +
                '</ul>' +
            '</div>' +
            donebutton +
          '</div>' +
        '</div>';

      return $(drop);
    },

    setPositionData: function () {
      this.selectpicker.view.canHighlight = [];

      for (var i = 0; i < this.selectpicker.current.data.length; i++) {
        var li = this.selectpicker.current.data[i],
            canHighlight = true;

        if (li.type === 'divider') {
          canHighlight = false;
          li.height = this.sizeInfo.dividerHeight;
        } else if (li.type === 'optgroup-label') {
          canHighlight = false;
          li.height = this.sizeInfo.dropdownHeaderHeight;
        } else {
          li.height = this.sizeInfo.liHeight;
        }

        if (li.disabled) canHighlight = false;

        this.selectpicker.view.canHighlight.push(canHighlight);

        li.position = (i === 0 ? 0 : this.selectpicker.current.data[i - 1].position) + li.height;
      }
    },

    isVirtual: function () {
      return (this.options.virtualScroll !== false) && (this.selectpicker.main.elements.length >= this.options.virtualScroll) || this.options.virtualScroll === true;
    },

    createView: function (isSearching, scrollTop) {
      scrollTop = scrollTop || 0;

      var that = this;

      this.selectpicker.current = isSearching ? this.selectpicker.search : this.selectpicker.main;

      var active = [];
      var selected;
      var prevActive;

      this.setPositionData();

      scroll(scrollTop, true);

      this.$menuInner.off('scroll.createView').on('scroll.createView', function (e, updateValue) {
        if (!that.noScroll) scroll(this.scrollTop, updateValue);
        that.noScroll = false;
      });

      function scroll (scrollTop, init) {
        var size = that.selectpicker.current.elements.length,
            chunks = [],
            chunkSize,
            chunkCount,
            firstChunk,
            lastChunk,
            currentChunk,
            prevPositions,
            positionIsDifferent,
            previousElements,
            menuIsDifferent = true,
            isVirtual = that.isVirtual();

        that.selectpicker.view.scrollTop = scrollTop;

        if (isVirtual === true) {
          // if an option that is encountered that is wider than the current menu width, update the menu width accordingly
          if (that.sizeInfo.hasScrollBar && that.$menu[0].offsetWidth > that.sizeInfo.totalMenuWidth) {
            that.sizeInfo.menuWidth = that.$menu[0].offsetWidth;
            that.sizeInfo.totalMenuWidth = that.sizeInfo.menuWidth + that.sizeInfo.scrollBarWidth;
            that.$menu.css('min-width', that.sizeInfo.menuWidth);
          }
        }

        chunkSize = Math.ceil(that.sizeInfo.menuInnerHeight / that.sizeInfo.liHeight * 1.5); // number of options in a chunk
        chunkCount = Math.round(size / chunkSize) || 1; // number of chunks

        for (var i = 0; i < chunkCount; i++) {
          var endOfChunk = (i + 1) * chunkSize;

          if (i === chunkCount - 1) {
            endOfChunk = size;
          }

          chunks[i] = [
            (i) * chunkSize + (!i ? 0 : 1),
            endOfChunk
          ];

          if (!size) break;

          if (currentChunk === undefined && scrollTop <= that.selectpicker.current.data[endOfChunk - 1].position - that.sizeInfo.menuInnerHeight) {
            currentChunk = i;
          }
        }

        if (currentChunk === undefined) currentChunk = 0;

        prevPositions = [that.selectpicker.view.position0, that.selectpicker.view.position1];

        // always display previous, current, and next chunks
        firstChunk = Math.max(0, currentChunk - 1);
        lastChunk = Math.min(chunkCount - 1, currentChunk + 1);

        that.selectpicker.view.position0 = isVirtual === false ? 0 : (Math.max(0, chunks[firstChunk][0]) || 0);
        that.selectpicker.view.position1 = isVirtual === false ? size : (Math.min(size, chunks[lastChunk][1]) || 0);

        positionIsDifferent = prevPositions[0] !== that.selectpicker.view.position0 || prevPositions[1] !== that.selectpicker.view.position1;

        if (that.activeIndex !== undefined) {
          prevActive = that.selectpicker.main.elements[that.prevActiveIndex];
          active = that.selectpicker.main.elements[that.activeIndex];
          selected = that.selectpicker.main.elements[that.selectedIndex];

          if (init) {
            if (that.activeIndex !== that.selectedIndex && active && active.length) {
              active.classList.remove('active');
              if (active.firstChild) active.firstChild.classList.remove('active');
            }
            that.activeIndex = undefined;
          }

          if (that.activeIndex && that.activeIndex !== that.selectedIndex && selected && selected.length) {
            selected.classList.remove('active');
            if (selected.firstChild) selected.firstChild.classList.remove('active');
          }
        }

        if (that.prevActiveIndex !== undefined && that.prevActiveIndex !== that.activeIndex && that.prevActiveIndex !== that.selectedIndex && prevActive && prevActive.length) {
          prevActive.classList.remove('active');
          if (prevActive.firstChild) prevActive.firstChild.classList.remove('active');
        }

        if (init || positionIsDifferent) {
          previousElements = that.selectpicker.view.visibleElements ? that.selectpicker.view.visibleElements.slice() : [];

          if (isVirtual === false) {
            that.selectpicker.view.visibleElements = that.selectpicker.current.elements;
          } else {
            that.selectpicker.view.visibleElements = that.selectpicker.current.elements.slice(that.selectpicker.view.position0, that.selectpicker.view.position1);
          }

          that.setOptionStatus();

          // if searching, check to make sure the list has actually been updated before updating DOM
          // this prevents unnecessary repaints
          if (isSearching || (isVirtual === false && init)) menuIsDifferent = !isEqual(previousElements, that.selectpicker.view.visibleElements);

          // if virtual scroll is disabled and not searching,
          // menu should never need to be updated more than once
          if ((init || isVirtual === true) && menuIsDifferent) {
            var menuInner = that.$menuInner[0],
                menuFragment = document.createDocumentFragment(),
                emptyMenu = menuInner.firstChild.cloneNode(false),
                marginTop,
                marginBottom,
                elements = that.selectpicker.view.visibleElements,
                toSanitize = [];

            // replace the existing UL with an empty one - this is faster than $.empty()
            menuInner.replaceChild(emptyMenu, menuInner.firstChild);

            for (var i = 0, visibleElementsLen = elements.length; i < visibleElementsLen; i++) {
              var element = elements[i],
                  elText,
                  elementData;

              if (that.options.sanitize) {
                elText = element.lastChild;

                if (elText) {
                  elementData = that.selectpicker.current.data[i + that.selectpicker.view.position0];

                  if (elementData && elementData.content && !elementData.sanitized) {
                    toSanitize.push(elText);
                    elementData.sanitized = true;
                  }
                }
              }

              menuFragment.appendChild(element);
            }

            if (that.options.sanitize && toSanitize.length) {
              sanitizeHtml(toSanitize, that.options.whiteList, that.options.sanitizeFn);
            }

            if (isVirtual === true) {
              marginTop = (that.selectpicker.view.position0 === 0 ? 0 : that.selectpicker.current.data[that.selectpicker.view.position0 - 1].position);
              marginBottom = (that.selectpicker.view.position1 > size - 1 ? 0 : that.selectpicker.current.data[size - 1].position - that.selectpicker.current.data[that.selectpicker.view.position1 - 1].position);

              menuInner.firstChild.style.marginTop = marginTop + 'px';
              menuInner.firstChild.style.marginBottom = marginBottom + 'px';
            }

            menuInner.firstChild.appendChild(menuFragment);
          }
        }

        that.prevActiveIndex = that.activeIndex;

        if (!that.options.liveSearch) {
          that.$menuInner.trigger('focus');
        } else if (isSearching && init) {
          var index = 0,
              newActive;

          if (!that.selectpicker.view.canHighlight[index]) {
            index = 1 + that.selectpicker.view.canHighlight.slice(1).indexOf(true);
          }

          newActive = that.selectpicker.view.visibleElements[index];

          if (that.selectpicker.view.currentActive) {
            that.selectpicker.view.currentActive.classList.remove('active');
            if (that.selectpicker.view.currentActive.firstChild) that.selectpicker.view.currentActive.firstChild.classList.remove('active');
          }

          if (newActive) {
            newActive.classList.add('active');
            if (newActive.firstChild) newActive.firstChild.classList.add('active');
          }

          that.activeIndex = (that.selectpicker.current.data[index] || {}).index;
        }
      }

      $(window)
        .off('resize' + EVENT_KEY + '.' + this.selectId + '.createView')
        .on('resize' + EVENT_KEY + '.' + this.selectId + '.createView', function () {
          var isActive = that.$newElement.hasClass(classNames.SHOW);

          if (isActive) scroll(that.$menuInner[0].scrollTop);
        });
    },

    setPlaceholder: function () {
      var updateIndex = false;

      if (this.options.title && !this.multiple) {
        if (!this.selectpicker.view.titleOption) this.selectpicker.view.titleOption = document.createElement('option');

        // this option doesn't create a new <li> element, but does add a new option at the start,
        // so startIndex should increase to prevent having to check every option for the bs-title-option class
        updateIndex = true;

        var element = this.$element[0],
            isSelected = false,
            titleNotAppended = !this.selectpicker.view.titleOption.parentNode;

        if (titleNotAppended) {
          // Use native JS to prepend option (faster)
          this.selectpicker.view.titleOption.className = 'bs-title-option';
          this.selectpicker.view.titleOption.value = '';

          // Check if selected or data-selected attribute is already set on an option. If not, select the titleOption option.
          // the selected item may have been changed by user or programmatically before the bootstrap select plugin runs,
          // if so, the select will have the data-selected attribute
          var $opt = $(element.options[element.selectedIndex]);
          isSelected = $opt.attr('selected') === undefined && this.$element.data('selected') === undefined;
        }

        if (titleNotAppended || this.selectpicker.view.titleOption.index !== 0) {
          element.insertBefore(this.selectpicker.view.titleOption, element.firstChild);
        }

        // Set selected *after* appending to select,
        // otherwise the option doesn't get selected in IE
        // set using selectedIndex, as setting the selected attr to true here doesn't work in IE11
        if (isSelected) element.selectedIndex = 0;
      }

      return updateIndex;
    },

    createLi: function () {
      var that = this,
          iconBase = this.options.iconBase,
          optionSelector = ':not([hidden]):not([data-hidden="true"])',
          mainElements = [],
          mainData = [],
          widestOptionLength = 0,
          optID = 0,
          startIndex = this.setPlaceholder() ? 1 : 0; // append the titleOption if necessary and skip the first option in the loop

      if (this.options.hideDisabled) optionSelector += ':not(:disabled)';

      if ((that.options.showTick || that.multiple) && !elementTemplates.checkMark.parentNode) {
        elementTemplates.checkMark.className = iconBase + ' ' + that.options.tickIcon + ' check-mark';
        elementTemplates.a.appendChild(elementTemplates.checkMark);
      }

      var selectOptions = this.$element[0].querySelectorAll('select > *' + optionSelector);

      function addDivider (config) {
        var previousData = mainData[mainData.length - 1];

        // ensure optgroup doesn't create back-to-back dividers
        if (
          previousData &&
          previousData.type === 'divider' &&
          (previousData.optID || config.optID)
        ) {
          return;
        }

        config = config || {};
        config.type = 'divider';

        mainElements.push(
          generateOption.li(
            false,
            classNames.DIVIDER,
            (config.optID ? config.optID + 'div' : undefined)
          )
        );

        mainData.push(config);
      }

      function addOption (option, config) {
        config = config || {};

        config.divider = option.getAttribute('data-divider') === 'true';

        if (config.divider) {
          addDivider({
            optID: config.optID
          });
        } else {
          var liIndex = mainData.length,
              cssText = option.style.cssText,
              inlineStyle = cssText ? htmlEscape(cssText) : '',
              optionClass = (option.className || '') + (config.optgroupClass || '');

          if (config.optID) optionClass = 'opt ' + optionClass;

          config.text = option.textContent;

          config.content = option.getAttribute('data-content');
          config.tokens = option.getAttribute('data-tokens');
          config.subtext = option.getAttribute('data-subtext');
          config.icon = option.getAttribute('data-icon');
          config.iconBase = iconBase;

          var textElement = generateOption.text(config);

          mainElements.push(
            generateOption.li(
              generateOption.a(
                textElement,
                optionClass,
                inlineStyle
              ),
              '',
              config.optID
            )
          );

          option.liIndex = liIndex;

          config.display = config.content || config.text;
          config.type = 'option';
          config.index = liIndex;
          config.option = option;
          config.disabled = config.disabled || option.disabled;

          mainData.push(config);

          var combinedLength = 0;

          // count the number of characters in the option - not perfect, but should work in most cases
          if (config.display) combinedLength += config.display.length;
          if (config.subtext) combinedLength += config.subtext.length;
          // if there is an icon, ensure this option's width is checked
          if (config.icon) combinedLength += 1;

          if (combinedLength > widestOptionLength) {
            widestOptionLength = combinedLength;

            // guess which option is the widest
            // use this when calculating menu width
            // not perfect, but it's fast, and the width will be updating accordingly when scrolling
            that.selectpicker.view.widestOption = mainElements[mainElements.length - 1];
          }
        }
      }

      function addOptgroup (index, selectOptions) {
        var optgroup = selectOptions[index],
            previous = selectOptions[index - 1],
            next = selectOptions[index + 1],
            options = optgroup.querySelectorAll('option' + optionSelector);

        if (!options.length) return;

        var config = {
              label: htmlEscape(optgroup.label),
              subtext: optgroup.getAttribute('data-subtext'),
              icon: optgroup.getAttribute('data-icon'),
              iconBase: iconBase
            },
            optgroupClass = ' ' + (optgroup.className || ''),
            headerIndex,
            lastIndex;

        optID++;

        if (previous) {
          addDivider({ optID: optID });
        }

        var labelElement = generateOption.label(config);

        mainElements.push(
          generateOption.li(labelElement, 'dropdown-header' + optgroupClass, optID)
        );

        mainData.push({
          display: config.label,
          subtext: config.subtext,
          type: 'optgroup-label',
          optID: optID
        });

        for (var j = 0, len = options.length; j < len; j++) {
          var option = options[j];

          if (j === 0) {
            headerIndex = mainData.length - 1;
            lastIndex = headerIndex + len;
          }

          addOption(option, {
            headerIndex: headerIndex,
            lastIndex: lastIndex,
            optID: optID,
            optgroupClass: optgroupClass,
            disabled: optgroup.disabled
          });
        }

        if (next) {
          addDivider({ optID: optID });
        }
      }

      for (var len = selectOptions.length; startIndex < len; startIndex++) {
        var item = selectOptions[startIndex];

        if (item.tagName !== 'OPTGROUP') {
          addOption(item, {});
        } else {
          addOptgroup(startIndex, selectOptions);
        }
      }

      this.selectpicker.main.elements = mainElements;
      this.selectpicker.main.data = mainData;

      this.selectpicker.current = this.selectpicker.main;
    },

    findLis: function () {
      return this.$menuInner.find('.inner > li');
    },

    render: function () {
      // ensure titleOption is appended and selected (if necessary) before getting selectedOptions
      this.setPlaceholder();

      var that = this,
          selectedOptions = this.$element[0].selectedOptions,
          selectedCount = selectedOptions.length,
          button = this.$button[0],
          buttonInner = button.querySelector('.filter-option-inner-inner'),
          multipleSeparator = document.createTextNode(this.options.multipleSeparator),
          titleFragment = elementTemplates.fragment.cloneNode(false),
          showCount,
          countMax,
          hasContent = false;

      this.togglePlaceholder();

      this.tabIndex();

      if (this.options.selectedTextFormat === 'static') {
        titleFragment = generateOption.text({ text: this.options.title }, true);
      } else {
        showCount = this.multiple && this.options.selectedTextFormat.indexOf('count') !== -1 && selectedCount > 1;

        // determine if the number of selected options will be shown (showCount === true)
        if (showCount) {
          countMax = this.options.selectedTextFormat.split('>');
          showCount = (countMax.length > 1 && selectedCount > countMax[1]) || (countMax.length === 1 && selectedCount >= 2);
        }

        // only loop through all selected options if the count won't be shown
        if (showCount === false) {
          for (var selectedIndex = 0; selectedIndex < selectedCount; selectedIndex++) {
            if (selectedIndex < 50) {
              var option = selectedOptions[selectedIndex],
                  titleOptions = {},
                  thisData = {
                    content: option.getAttribute('data-content'),
                    subtext: option.getAttribute('data-subtext'),
                    icon: option.getAttribute('data-icon')
                  };

              if (this.multiple && selectedIndex > 0) {
                titleFragment.appendChild(multipleSeparator.cloneNode(false));
              }

              if (option.title) {
                titleOptions.text = option.title;
              } else if (thisData.content && that.options.showContent) {
                titleOptions.content = thisData.content.toString();
                hasContent = true;
              } else {
                if (that.options.showIcon) {
                  titleOptions.icon = thisData.icon;
                  titleOptions.iconBase = this.options.iconBase;
                }
                if (that.options.showSubtext && !that.multiple && thisData.subtext) titleOptions.subtext = ' ' + thisData.subtext;
                titleOptions.text = option.textContent.trim();
              }

              titleFragment.appendChild(generateOption.text(titleOptions, true));
            } else {
              break;
            }
          }

          // add ellipsis
          if (selectedCount > 49) {
            titleFragment.appendChild(document.createTextNode('...'));
          }
        } else {
          var optionSelector = ':not([hidden]):not([data-hidden="true"]):not([data-divider="true"])';
          if (this.options.hideDisabled) optionSelector += ':not(:disabled)';

          // If this is a multiselect, and selectedTextFormat is count, then show 1 of 2 selected, etc.
          var totalCount = this.$element[0].querySelectorAll('select > option' + optionSelector + ', optgroup' + optionSelector + ' option' + optionSelector).length,
              tr8nText = (typeof this.options.countSelectedText === 'function') ? this.options.countSelectedText(selectedCount, totalCount) : this.options.countSelectedText;

          titleFragment = generateOption.text({
            text: tr8nText.replace('{0}', selectedCount.toString()).replace('{1}', totalCount.toString())
          }, true);
        }
      }

      if (this.options.title == undefined) {
        // use .attr to ensure undefined is returned if title attribute is not set
        this.options.title = this.$element.attr('title');
      }

      // If the select doesn't have a title, then use the default, or if nothing is set at all, use noneSelectedText
      if (!titleFragment.childNodes.length) {
        titleFragment = generateOption.text({
          text: typeof this.options.title !== 'undefined' ? this.options.title : this.options.noneSelectedText
        }, true);
      }

      // strip all HTML tags and trim the result, then unescape any escaped tags
      button.title = titleFragment.textContent.replace(/<[^>]*>?/g, '').trim();

      if (this.options.sanitize && hasContent) {
        sanitizeHtml([titleFragment], that.options.whiteList, that.options.sanitizeFn);
      }

      buttonInner.innerHTML = '';
      buttonInner.appendChild(titleFragment);

      if (version.major < 4 && this.$newElement[0].classList.contains('bs3-has-addon')) {
        var filterExpand = button.querySelector('.filter-expand'),
            clone = buttonInner.cloneNode(true);

        clone.className = 'filter-expand';

        if (filterExpand) {
          button.replaceChild(clone, filterExpand);
        } else {
          button.appendChild(clone);
        }
      }

      this.$element.trigger('rendered' + EVENT_KEY);
    },

    /**
     * @param [style]
     * @param [status]
     */
    setStyle: function (newStyle, status) {
      var button = this.$button[0],
          newElement = this.$newElement[0],
          style = this.options.style.trim(),
          buttonClass;

      if (this.$element.attr('class')) {
        this.$newElement.addClass(this.$element.attr('class').replace(/selectpicker|mobile-device|bs-select-hidden|validate\[.*\]/gi, ''));
      }

      if (version.major < 4) {
        newElement.classList.add('bs3');

        if (newElement.parentNode.classList.contains('input-group') &&
            (newElement.previousElementSibling || newElement.nextElementSibling) &&
            (newElement.previousElementSibling || newElement.nextElementSibling).classList.contains('input-group-addon')
        ) {
          newElement.classList.add('bs3-has-addon');
        }
      }

      if (newStyle) {
        buttonClass = newStyle.trim();
      } else {
        buttonClass = style;
      }

      if (status == 'add') {
        if (buttonClass) button.classList.add.apply(button.classList, buttonClass.split(' '));
      } else if (status == 'remove') {
        if (buttonClass) button.classList.remove.apply(button.classList, buttonClass.split(' '));
      } else {
        if (style) button.classList.remove.apply(button.classList, style.split(' '));
        if (buttonClass) button.classList.add.apply(button.classList, buttonClass.split(' '));
      }
    },

    liHeight: function (refresh) {
      if (!refresh && (this.options.size === false || this.sizeInfo)) return;

      if (!this.sizeInfo) this.sizeInfo = {};

      var newElement = document.createElement('div'),
          menu = document.createElement('div'),
          menuInner = document.createElement('div'),
          menuInnerInner = document.createElement('ul'),
          divider = document.createElement('li'),
          dropdownHeader = document.createElement('li'),
          li = document.createElement('li'),
          a = document.createElement('a'),
          text = document.createElement('span'),
          header = this.options.header && this.$menu.find('.' + classNames.POPOVERHEADER).length > 0 ? this.$menu.find('.' + classNames.POPOVERHEADER)[0].cloneNode(true) : null,
          search = this.options.liveSearch ? document.createElement('div') : null,
          actions = this.options.actionsBox && this.multiple && this.$menu.find('.bs-actionsbox').length > 0 ? this.$menu.find('.bs-actionsbox')[0].cloneNode(true) : null,
          doneButton = this.options.doneButton && this.multiple && this.$menu.find('.bs-donebutton').length > 0 ? this.$menu.find('.bs-donebutton')[0].cloneNode(true) : null,
          firstOption = this.$element.find('option')[0];

      this.sizeInfo.selectWidth = this.$newElement[0].offsetWidth;

      text.className = 'text';
      a.className = 'dropdown-item ' + (firstOption ? firstOption.className : '');
      newElement.className = this.$menu[0].parentNode.className + ' ' + classNames.SHOW;
      newElement.style.width = this.sizeInfo.selectWidth + 'px';
      if (this.options.width === 'auto') menu.style.minWidth = 0;
      menu.className = classNames.MENU + ' ' + classNames.SHOW;
      menuInner.className = 'inner ' + classNames.SHOW;
      menuInnerInner.className = classNames.MENU + ' inner ' + (version.major === '4' ? classNames.SHOW : '');
      divider.className = classNames.DIVIDER;
      dropdownHeader.className = 'dropdown-header';

      text.appendChild(document.createTextNode('\u200b'));
      a.appendChild(text);
      li.appendChild(a);
      dropdownHeader.appendChild(text.cloneNode(true));

      if (this.selectpicker.view.widestOption) {
        menuInnerInner.appendChild(this.selectpicker.view.widestOption.cloneNode(true));
      }

      menuInnerInner.appendChild(li);
      menuInnerInner.appendChild(divider);
      menuInnerInner.appendChild(dropdownHeader);
      if (header) menu.appendChild(header);
      if (search) {
        var input = document.createElement('input');
        search.className = 'bs-searchbox';
        input.className = 'form-control';
        search.appendChild(input);
        menu.appendChild(search);
      }
      if (actions) menu.appendChild(actions);
      menuInner.appendChild(menuInnerInner);
      menu.appendChild(menuInner);
      if (doneButton) menu.appendChild(doneButton);
      newElement.appendChild(menu);

      document.body.appendChild(newElement);

      var liHeight = li.offsetHeight,
          dropdownHeaderHeight = dropdownHeader ? dropdownHeader.offsetHeight : 0,
          headerHeight = header ? header.offsetHeight : 0,
          searchHeight = search ? search.offsetHeight : 0,
          actionsHeight = actions ? actions.offsetHeight : 0,
          doneButtonHeight = doneButton ? doneButton.offsetHeight : 0,
          dividerHeight = $(divider).outerHeight(true),
          // fall back to jQuery if getComputedStyle is not supported
          menuStyle = window.getComputedStyle ? window.getComputedStyle(menu) : false,
          menuWidth = menu.offsetWidth,
          $menu = menuStyle ? null : $(menu),
          menuPadding = {
            vert: toInteger(menuStyle ? menuStyle.paddingTop : $menu.css('paddingTop')) +
                  toInteger(menuStyle ? menuStyle.paddingBottom : $menu.css('paddingBottom')) +
                  toInteger(menuStyle ? menuStyle.borderTopWidth : $menu.css('borderTopWidth')) +
                  toInteger(menuStyle ? menuStyle.borderBottomWidth : $menu.css('borderBottomWidth')),
            horiz: toInteger(menuStyle ? menuStyle.paddingLeft : $menu.css('paddingLeft')) +
                  toInteger(menuStyle ? menuStyle.paddingRight : $menu.css('paddingRight')) +
                  toInteger(menuStyle ? menuStyle.borderLeftWidth : $menu.css('borderLeftWidth')) +
                  toInteger(menuStyle ? menuStyle.borderRightWidth : $menu.css('borderRightWidth'))
          },
          menuExtras = {
            vert: menuPadding.vert +
                  toInteger(menuStyle ? menuStyle.marginTop : $menu.css('marginTop')) +
                  toInteger(menuStyle ? menuStyle.marginBottom : $menu.css('marginBottom')) + 2,
            horiz: menuPadding.horiz +
                  toInteger(menuStyle ? menuStyle.marginLeft : $menu.css('marginLeft')) +
                  toInteger(menuStyle ? menuStyle.marginRight : $menu.css('marginRight')) + 2
          },
          scrollBarWidth;

      menuInner.style.overflowY = 'scroll';

      scrollBarWidth = menu.offsetWidth - menuWidth;

      document.body.removeChild(newElement);

      this.sizeInfo.liHeight = liHeight;
      this.sizeInfo.dropdownHeaderHeight = dropdownHeaderHeight;
      this.sizeInfo.headerHeight = headerHeight;
      this.sizeInfo.searchHeight = searchHeight;
      this.sizeInfo.actionsHeight = actionsHeight;
      this.sizeInfo.doneButtonHeight = doneButtonHeight;
      this.sizeInfo.dividerHeight = dividerHeight;
      this.sizeInfo.menuPadding = menuPadding;
      this.sizeInfo.menuExtras = menuExtras;
      this.sizeInfo.menuWidth = menuWidth;
      this.sizeInfo.totalMenuWidth = this.sizeInfo.menuWidth;
      this.sizeInfo.scrollBarWidth = scrollBarWidth;
      this.sizeInfo.selectHeight = this.$newElement[0].offsetHeight;

      this.setPositionData();
    },

    getSelectPosition: function () {
      var that = this,
          $window = $(window),
          pos = that.$newElement.offset(),
          $container = $(that.options.container),
          containerPos;

      if (that.options.container && $container.length && !$container.is('body')) {
        containerPos = $container.offset();
        containerPos.top += parseInt($container.css('borderTopWidth'));
        containerPos.left += parseInt($container.css('borderLeftWidth'));
      } else {
        containerPos = { top: 0, left: 0 };
      }

      var winPad = that.options.windowPadding;

      this.sizeInfo.selectOffsetTop = pos.top - containerPos.top - $window.scrollTop();
      this.sizeInfo.selectOffsetBot = $window.height() - this.sizeInfo.selectOffsetTop - this.sizeInfo.selectHeight - containerPos.top - winPad[2];
      this.sizeInfo.selectOffsetLeft = pos.left - containerPos.left - $window.scrollLeft();
      this.sizeInfo.selectOffsetRight = $window.width() - this.sizeInfo.selectOffsetLeft - this.sizeInfo.selectWidth - containerPos.left - winPad[1];
      this.sizeInfo.selectOffsetTop -= winPad[0];
      this.sizeInfo.selectOffsetLeft -= winPad[3];
    },

    setMenuSize: function (isAuto) {
      this.getSelectPosition();

      var selectWidth = this.sizeInfo.selectWidth,
          liHeight = this.sizeInfo.liHeight,
          headerHeight = this.sizeInfo.headerHeight,
          searchHeight = this.sizeInfo.searchHeight,
          actionsHeight = this.sizeInfo.actionsHeight,
          doneButtonHeight = this.sizeInfo.doneButtonHeight,
          divHeight = this.sizeInfo.dividerHeight,
          menuPadding = this.sizeInfo.menuPadding,
          menuInnerHeight,
          menuHeight,
          divLength = 0,
          minHeight,
          _minHeight,
          maxHeight,
          menuInnerMinHeight,
          estimate;

      if (this.options.dropupAuto) {
        // Get the estimated height of the menu without scrollbars.
        // This is useful for smaller menus, where there might be plenty of room
        // below the button without setting dropup, but we can't know
        // the exact height of the menu until createView is called later
        estimate = liHeight * this.selectpicker.current.elements.length + menuPadding.vert;
        this.$newElement.toggleClass(classNames.DROPUP, this.sizeInfo.selectOffsetTop - this.sizeInfo.selectOffsetBot > this.sizeInfo.menuExtras.vert && estimate + this.sizeInfo.menuExtras.vert + 50 > this.sizeInfo.selectOffsetBot);
      }

      if (this.options.size === 'auto') {
        _minHeight = this.selectpicker.current.elements.length > 3 ? this.sizeInfo.liHeight * 3 + this.sizeInfo.menuExtras.vert - 2 : 0;
        menuHeight = this.sizeInfo.selectOffsetBot - this.sizeInfo.menuExtras.vert;
        minHeight = _minHeight + headerHeight + searchHeight + actionsHeight + doneButtonHeight;
        menuInnerMinHeight = Math.max(_minHeight - menuPadding.vert, 0);

        if (this.$newElement.hasClass(classNames.DROPUP)) {
          menuHeight = this.sizeInfo.selectOffsetTop - this.sizeInfo.menuExtras.vert;
        }

        maxHeight = menuHeight;
        menuInnerHeight = menuHeight - headerHeight - searchHeight - actionsHeight - doneButtonHeight - menuPadding.vert;
      } else if (this.options.size && this.options.size != 'auto' && this.selectpicker.current.elements.length > this.options.size) {
        for (var i = 0; i < this.options.size; i++) {
          if (this.selectpicker.current.data[i].type === 'divider') divLength++;
        }

        menuHeight = liHeight * this.options.size + divLength * divHeight + menuPadding.vert;
        menuInnerHeight = menuHeight - menuPadding.vert;
        maxHeight = menuHeight + headerHeight + searchHeight + actionsHeight + doneButtonHeight;
        minHeight = menuInnerMinHeight = '';
      }

      if (this.options.dropdownAlignRight === 'auto') {
        this.$menu.toggleClass(classNames.MENURIGHT, this.sizeInfo.selectOffsetLeft > this.sizeInfo.selectOffsetRight && this.sizeInfo.selectOffsetRight < (this.sizeInfo.totalMenuWidth - selectWidth));
      }

      this.$menu.css({
        'max-height': maxHeight + 'px',
        'overflow': 'hidden',
        'min-height': minHeight + 'px'
      });

      this.$menuInner.css({
        'max-height': menuInnerHeight + 'px',
        'overflow-y': 'auto',
        'min-height': menuInnerMinHeight + 'px'
      });

      // ensure menuInnerHeight is always a positive number to prevent issues calculating chunkSize in createView
      this.sizeInfo.menuInnerHeight = Math.max(menuInnerHeight, 1);

      if (this.selectpicker.current.data.length && this.selectpicker.current.data[this.selectpicker.current.data.length - 1].position > this.sizeInfo.menuInnerHeight) {
        this.sizeInfo.hasScrollBar = true;
        this.sizeInfo.totalMenuWidth = this.sizeInfo.menuWidth + this.sizeInfo.scrollBarWidth;

        this.$menu.css('min-width', this.sizeInfo.totalMenuWidth);
      }

      if (this.dropdown && this.dropdown._popper) this.dropdown._popper.update();
    },

    setSize: function (refresh) {
      this.liHeight(refresh);

      if (this.options.header) this.$menu.css('padding-top', 0);
      if (this.options.size === false) return;

      var that = this,
          $window = $(window),
          selectedIndex,
          offset = 0;

      this.setMenuSize();

      if (this.options.liveSearch) {
        this.$searchbox
          .off('input.setMenuSize propertychange.setMenuSize')
          .on('input.setMenuSize propertychange.setMenuSize', function () {
            return that.setMenuSize();
          });
      }

      if (this.options.size === 'auto') {
        $window
          .off('resize' + EVENT_KEY + '.' + this.selectId + '.setMenuSize' + ' scroll' + EVENT_KEY + '.' + this.selectId + '.setMenuSize')
          .on('resize' + EVENT_KEY + '.' + this.selectId + '.setMenuSize' + ' scroll' + EVENT_KEY + '.' + this.selectId + '.setMenuSize', function () {
            return that.setMenuSize();
          });
      } else if (this.options.size && this.options.size != 'auto' && this.selectpicker.current.elements.length > this.options.size) {
        $window.off('resize' + EVENT_KEY + '.' + this.selectId + '.setMenuSize' + ' scroll' + EVENT_KEY + '.' + this.selectId + '.setMenuSize');
      }

      if (refresh) {
        offset = this.$menuInner[0].scrollTop;
      } else if (!that.multiple) {
        var element = that.$element[0];
        selectedIndex = (element.options[element.selectedIndex] || {}).liIndex;

        if (typeof selectedIndex === 'number' && that.options.size !== false) {
          offset = that.sizeInfo.liHeight * selectedIndex;
          offset = offset - (that.sizeInfo.menuInnerHeight / 2) + (that.sizeInfo.liHeight / 2);
        }
      }

      that.createView(false, offset);
    },

    setWidth: function () {
      var that = this;

      if (this.options.width === 'auto') {
        requestAnimationFrame(function () {
          that.$menu.css('min-width', '0');

          that.$element.on('loaded' + EVENT_KEY, function () {
            that.liHeight();
            that.setMenuSize();

            // Get correct width if element is hidden
            var $selectClone = that.$newElement.clone().appendTo('body'),
                btnWidth = $selectClone.css('width', 'auto').children('button').outerWidth();

            $selectClone.remove();

            // Set width to whatever's larger, button title or longest option
            that.sizeInfo.selectWidth = Math.max(that.sizeInfo.totalMenuWidth, btnWidth);
            that.$newElement.css('width', that.sizeInfo.selectWidth + 'px');
          });
        });
      } else if (this.options.width === 'fit') {
        // Remove inline min-width so width can be changed from 'auto'
        this.$menu.css('min-width', '');
        this.$newElement.css('width', '').addClass('fit-width');
      } else if (this.options.width) {
        // Remove inline min-width so width can be changed from 'auto'
        this.$menu.css('min-width', '');
        this.$newElement.css('width', this.options.width);
      } else {
        // Remove inline min-width/width so width can be changed
        this.$menu.css('min-width', '');
        this.$newElement.css('width', '');
      }
      // Remove fit-width class if width is changed programmatically
      if (this.$newElement.hasClass('fit-width') && this.options.width !== 'fit') {
        this.$newElement[0].classList.remove('fit-width');
      }
    },

    selectPosition: function () {
      this.$bsContainer = $('<div class="bs-container" />');

      var that = this,
          $container = $(this.options.container),
          pos,
          containerPos,
          actualHeight,
          getPlacement = function ($element) {
            var containerPosition = {},
                // fall back to dropdown's default display setting if display is not manually set
                display = that.options.display || (
                  // Bootstrap 3 doesn't have $.fn.dropdown.Constructor.Default
                  $.fn.dropdown.Constructor.Default ? $.fn.dropdown.Constructor.Default.display
                  : false
                );

            that.$bsContainer.addClass($element.attr('class').replace(/form-control|fit-width/gi, '')).toggleClass(classNames.DROPUP, $element.hasClass(classNames.DROPUP));
            pos = $element.offset();

            if (!$container.is('body')) {
              containerPos = $container.offset();
              containerPos.top += parseInt($container.css('borderTopWidth')) - $container.scrollTop();
              containerPos.left += parseInt($container.css('borderLeftWidth')) - $container.scrollLeft();
            } else {
              containerPos = { top: 0, left: 0 };
            }

            actualHeight = $element.hasClass(classNames.DROPUP) ? 0 : $element[0].offsetHeight;

            // Bootstrap 4+ uses Popper for menu positioning
            if (version.major < 4 || display === 'static') {
              containerPosition.top = pos.top - containerPos.top + actualHeight;
              containerPosition.left = pos.left - containerPos.left;
            }

            containerPosition.width = $element[0].offsetWidth;

            that.$bsContainer.css(containerPosition);
          };

      this.$button.on('click.bs.dropdown.data-api', function () {
        if (that.isDisabled()) {
          return;
        }

        getPlacement(that.$newElement);

        that.$bsContainer
          .appendTo(that.options.container)
          .toggleClass(classNames.SHOW, !that.$button.hasClass(classNames.SHOW))
          .append(that.$menu);
      });

      $(window)
        .off('resize' + EVENT_KEY + '.' + this.selectId + ' scroll' + EVENT_KEY + '.' + this.selectId)
        .on('resize' + EVENT_KEY + '.' + this.selectId + ' scroll' + EVENT_KEY + '.' + this.selectId, function () {
          var isActive = that.$newElement.hasClass(classNames.SHOW);

          if (isActive) getPlacement(that.$newElement);
        });

      this.$element.on('hide' + EVENT_KEY, function () {
        that.$menu.data('height', that.$menu.height());
        that.$bsContainer.detach();
      });
    },

    setOptionStatus: function () {
      var that = this;

      that.noScroll = false;

      if (that.selectpicker.view.visibleElements && that.selectpicker.view.visibleElements.length) {
        for (var i = 0; i < that.selectpicker.view.visibleElements.length; i++) {
          var liData = that.selectpicker.current.data[i + that.selectpicker.view.position0],
              option = liData.option;

          if (option) {
            that.setDisabled(
              liData.index,
              liData.disabled
            );

            that.setSelected(
              liData.index,
              option.selected
            );
          }
        }
      }
    },

    /**
     * @param {number} index - the index of the option that is being changed
     * @param {boolean} selected - true if the option is being selected, false if being deselected
     */
    setSelected: function (index, selected) {
      var li = this.selectpicker.main.elements[index],
          liData = this.selectpicker.main.data[index],
          activeIndexIsSet = this.activeIndex !== undefined,
          thisIsActive = this.activeIndex === index,
          prevActive,
          a,
          // if current option is already active
          // OR
          // if the current option is being selected, it's NOT multiple, and
          // activeIndex is undefined:
          //  - when the menu is first being opened, OR
          //  - after a search has been performed, OR
          //  - when retainActive is false when selecting a new option (i.e. index of the newly selected option is not the same as the current activeIndex)
          keepActive = thisIsActive || (selected && !this.multiple && !activeIndexIsSet);

      liData.selected = selected;

      a = li.firstChild;

      if (selected) {
        this.selectedIndex = index;
      }

      li.classList.toggle('selected', selected);
      li.classList.toggle('active', keepActive);

      if (keepActive) {
        this.selectpicker.view.currentActive = li;
        this.activeIndex = index;
      }

      if (a) {
        a.classList.toggle('selected', selected);
        a.classList.toggle('active', keepActive);
        a.setAttribute('aria-selected', selected);
      }

      if (!keepActive) {
        if (!activeIndexIsSet && selected && this.prevActiveIndex !== undefined) {
          prevActive = this.selectpicker.main.elements[this.prevActiveIndex];

          prevActive.classList.remove('active');
          if (prevActive.firstChild) {
            prevActive.firstChild.classList.remove('active');
          }
        }
      }
    },

    /**
     * @param {number} index - the index of the option that is being disabled
     * @param {boolean} disabled - true if the option is being disabled, false if being enabled
     */
    setDisabled: function (index, disabled) {
      var li = this.selectpicker.main.elements[index],
          a;

      this.selectpicker.main.data[index].disabled = disabled;

      a = li.firstChild;

      li.classList.toggle(classNames.DISABLED, disabled);

      if (a) {
        if (version.major === '4') a.classList.toggle(classNames.DISABLED, disabled);

        a.setAttribute('aria-disabled', disabled);

        if (disabled) {
          a.setAttribute('tabindex', -1);
        } else {
          a.setAttribute('tabindex', 0);
        }
      }
    },

    isDisabled: function () {
      return this.$element[0].disabled;
    },

    checkDisabled: function () {
      var that = this;

      if (this.isDisabled()) {
        this.$newElement[0].classList.add(classNames.DISABLED);
        this.$button.addClass(classNames.DISABLED).attr('tabindex', -1).attr('aria-disabled', true);
      } else {
        if (this.$button[0].classList.contains(classNames.DISABLED)) {
          this.$newElement[0].classList.remove(classNames.DISABLED);
          this.$button.removeClass(classNames.DISABLED).attr('aria-disabled', false);
        }

        if (this.$button.attr('tabindex') == -1 && !this.$element.data('tabindex')) {
          this.$button.removeAttr('tabindex');
        }
      }

      this.$button.on('click', function () {
        return !that.isDisabled();
      });
    },

    togglePlaceholder: function () {
      // much faster than calling $.val()
      var element = this.$element[0],
          selectedIndex = element.selectedIndex,
          nothingSelected = selectedIndex === -1;

      if (!nothingSelected && !element.options[selectedIndex].value) nothingSelected = true;

      this.$button.toggleClass('bs-placeholder', nothingSelected);
    },

    tabIndex: function () {
      if (this.$element.data('tabindex') !== this.$element.attr('tabindex') &&
        (this.$element.attr('tabindex') !== -98 && this.$element.attr('tabindex') !== '-98')) {
        this.$element.data('tabindex', this.$element.attr('tabindex'));
        this.$button.attr('tabindex', this.$element.data('tabindex'));
      }

      this.$element.attr('tabindex', -98);
    },

    clickListener: function () {
      var that = this,
          $document = $(document);

      $document.data('spaceSelect', false);

      this.$button.on('keyup', function (e) {
        if (/(32)/.test(e.keyCode.toString(10)) && $document.data('spaceSelect')) {
          e.preventDefault();
          $document.data('spaceSelect', false);
        }
      });

      this.$newElement.on('show.bs.dropdown', function () {
        if (version.major > 3 && !that.dropdown) {
          that.dropdown = that.$button.data('bs.dropdown');
          that.dropdown._menu = that.$menu[0];
        }
      });

      this.$button.on('click.bs.dropdown.data-api', function () {
        if (!that.$newElement.hasClass(classNames.SHOW)) {
          that.setSize();
        }
      });

      function setFocus () {
        if (that.options.liveSearch) {
          that.$searchbox.trigger('focus');
        } else {
          that.$menuInner.trigger('focus');
        }
      }

      function checkPopperExists () {
        if (that.dropdown && that.dropdown._popper && that.dropdown._popper.state.isCreated) {
          setFocus();
        } else {
          requestAnimationFrame(checkPopperExists);
        }
      }

      this.$element.on('shown' + EVENT_KEY, function () {
        if (that.$menuInner[0].scrollTop !== that.selectpicker.view.scrollTop) {
          that.$menuInner[0].scrollTop = that.selectpicker.view.scrollTop;
        }

        if (version.major > 3) {
          requestAnimationFrame(checkPopperExists);
        } else {
          setFocus();
        }
      });

      this.$menuInner.on('click', 'li a', function (e, retainActive) {
        var $this = $(this),
            position0 = that.isVirtual() ? that.selectpicker.view.position0 : 0,
            clickedData = that.selectpicker.current.data[$this.parent().index() + position0],
            clickedIndex = clickedData.index,
            prevValue = getSelectValues(that.$element[0]),
            prevIndex = that.$element.prop('selectedIndex'),
            triggerChange = true;

        // Don't close on multi choice menu
        if (that.multiple && that.options.maxOptions !== 1) {
          e.stopPropagation();
        }

        e.preventDefault();

        // Don't run if the select is disabled
        if (!that.isDisabled() && !$this.parent().hasClass(classNames.DISABLED)) {
          var $options = that.$element.find('option'),
              option = clickedData.option,
              $option = $(option),
              state = option.selected,
              $optgroup = $option.parent('optgroup'),
              $optgroupOptions = $optgroup.find('option'),
              maxOptions = that.options.maxOptions,
              maxOptionsGrp = $optgroup.data('maxOptions') || false;

          if (clickedIndex === that.activeIndex) retainActive = true;

          if (!retainActive) {
            that.prevActiveIndex = that.activeIndex;
            that.activeIndex = undefined;
          }

          if (!that.multiple) { // Deselect all others if not multi select box
            $options.prop('selected', false);
            option.selected = true;
            that.setSelected(clickedIndex, true);
          } else { // Toggle the one we have chosen if we are multi select.
            option.selected = !state;

            that.setSelected(clickedIndex, !state);
            $this.trigger('blur');

            if (maxOptions !== false || maxOptionsGrp !== false) {
              var maxReached = maxOptions < $options.filter(':selected').length,
                  maxReachedGrp = maxOptionsGrp < $optgroup.find('option:selected').length;

              if ((maxOptions && maxReached) || (maxOptionsGrp && maxReachedGrp)) {
                if (maxOptions && maxOptions == 1) {
                  $options.prop('selected', false);
                  $option.prop('selected', true);

                  for (var i = 0; i < $options.length; i++) {
                    that.setSelected(i, false);
                  }

                  that.setSelected(clickedIndex, true);
                } else if (maxOptionsGrp && maxOptionsGrp == 1) {
                  $optgroup.find('option:selected').prop('selected', false);
                  $option.prop('selected', true);

                  for (var i = 0; i < $optgroupOptions.length; i++) {
                    var option = $optgroupOptions[i];
                    that.setSelected($options.index(option), false);
                  }

                  that.setSelected(clickedIndex, true);
                } else {
                  var maxOptionsText = typeof that.options.maxOptionsText === 'string' ? [that.options.maxOptionsText, that.options.maxOptionsText] : that.options.maxOptionsText,
                      maxOptionsArr = typeof maxOptionsText === 'function' ? maxOptionsText(maxOptions, maxOptionsGrp) : maxOptionsText,
                      maxTxt = maxOptionsArr[0].replace('{n}', maxOptions),
                      maxTxtGrp = maxOptionsArr[1].replace('{n}', maxOptionsGrp),
                      $notify = $('<div class="notify"></div>');
                  // If {var} is set in array, replace it
                  /** @deprecated */
                  if (maxOptionsArr[2]) {
                    maxTxt = maxTxt.replace('{var}', maxOptionsArr[2][maxOptions > 1 ? 0 : 1]);
                    maxTxtGrp = maxTxtGrp.replace('{var}', maxOptionsArr[2][maxOptionsGrp > 1 ? 0 : 1]);
                  }

                  $option.prop('selected', false);

                  that.$menu.append($notify);

                  if (maxOptions && maxReached) {
                    $notify.append($('<div>' + maxTxt + '</div>'));
                    triggerChange = false;
                    that.$element.trigger('maxReached' + EVENT_KEY);
                  }

                  if (maxOptionsGrp && maxReachedGrp) {
                    $notify.append($('<div>' + maxTxtGrp + '</div>'));
                    triggerChange = false;
                    that.$element.trigger('maxReachedGrp' + EVENT_KEY);
                  }

                  setTimeout(function () {
                    that.setSelected(clickedIndex, false);
                  }, 10);

                  $notify.delay(750).fadeOut(300, function () {
                    $(this).remove();
                  });
                }
              }
            }
          }

          if (!that.multiple || (that.multiple && that.options.maxOptions === 1)) {
            that.$button.trigger('focus');
          } else if (that.options.liveSearch) {
            that.$searchbox.trigger('focus');
          }

          // Trigger select 'change'
          if (triggerChange) {
            if ((prevValue != getSelectValues(that.$element[0]) && that.multiple) || (prevIndex != that.$element.prop('selectedIndex') && !that.multiple)) {
              // $option.prop('selected') is current option state (selected/unselected). prevValue is the value of the select prior to being changed.
              changedArguments = [option.index, $option.prop('selected'), prevValue];
              that.$element
                .triggerNative('change');
            }
          }
        }
      });

      this.$menu.on('click', 'li.' + classNames.DISABLED + ' a, .' + classNames.POPOVERHEADER + ', .' + classNames.POPOVERHEADER + ' :not(.close)', function (e) {
        if (e.currentTarget == this) {
          e.preventDefault();
          e.stopPropagation();
          if (that.options.liveSearch && !$(e.target).hasClass('close')) {
            that.$searchbox.trigger('focus');
          } else {
            that.$button.trigger('focus');
          }
        }
      });

      this.$menuInner.on('click', '.divider, .dropdown-header', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (that.options.liveSearch) {
          that.$searchbox.trigger('focus');
        } else {
          that.$button.trigger('focus');
        }
      });

      this.$menu.on('click', '.' + classNames.POPOVERHEADER + ' .close', function () {
        that.$button.trigger('click');
      });

      this.$searchbox.on('click', function (e) {
        e.stopPropagation();
      });

      this.$menu.on('click', '.actions-btn', function (e) {
        if (that.options.liveSearch) {
          that.$searchbox.trigger('focus');
        } else {
          that.$button.trigger('focus');
        }

        e.preventDefault();
        e.stopPropagation();

        if ($(this).hasClass('bs-select-all')) {
          that.selectAll();
        } else {
          that.deselectAll();
        }
      });

      this.$element
        .on('change' + EVENT_KEY, function () {
          that.render();
          that.$element.trigger('changed' + EVENT_KEY, changedArguments);
          changedArguments = null;
        })
        .on('focus' + EVENT_KEY, function () {
          if (!that.options.mobile) that.$button.trigger('focus');
        });
    },

    liveSearchListener: function () {
      var that = this,
          noResults = document.createElement('li');

      this.$button.on('click.bs.dropdown.data-api', function () {
        if (!!that.$searchbox.val()) {
          that.$searchbox.val('');
        }
      });

      this.$searchbox.on('click.bs.dropdown.data-api focus.bs.dropdown.data-api touchend.bs.dropdown.data-api', function (e) {
        e.stopPropagation();
      });

      this.$searchbox.on('input propertychange', function () {
        var searchValue = that.$searchbox.val();

        that.selectpicker.search.elements = [];
        that.selectpicker.search.data = [];

        if (searchValue) {
          var i,
              searchMatch = [],
              q = searchValue.toUpperCase(),
              cache = {},
              cacheArr = [],
              searchStyle = that._searchStyle(),
              normalizeSearch = that.options.liveSearchNormalize;

          if (normalizeSearch) q = normalizeToBase(q);

          that._$lisSelected = that.$menuInner.find('.selected');

          for (var i = 0; i < that.selectpicker.main.data.length; i++) {
            var li = that.selectpicker.main.data[i];

            if (!cache[i]) {
              cache[i] = stringSearch(li, q, searchStyle, normalizeSearch);
            }

            if (cache[i] && li.headerIndex !== undefined && cacheArr.indexOf(li.headerIndex) === -1) {
              if (li.headerIndex > 0) {
                cache[li.headerIndex - 1] = true;
                cacheArr.push(li.headerIndex - 1);
              }

              cache[li.headerIndex] = true;
              cacheArr.push(li.headerIndex);

              cache[li.lastIndex + 1] = true;
            }

            if (cache[i] && li.type !== 'optgroup-label') cacheArr.push(i);
          }

          for (var i = 0, cacheLen = cacheArr.length; i < cacheLen; i++) {
            var index = cacheArr[i],
                prevIndex = cacheArr[i - 1],
                li = that.selectpicker.main.data[index],
                liPrev = that.selectpicker.main.data[prevIndex];

            if (li.type !== 'divider' || (li.type === 'divider' && liPrev && liPrev.type !== 'divider' && cacheLen - 1 !== i)) {
              that.selectpicker.search.data.push(li);
              searchMatch.push(that.selectpicker.main.elements[index]);
            }
          }

          that.activeIndex = undefined;
          that.noScroll = true;
          that.$menuInner.scrollTop(0);
          that.selectpicker.search.elements = searchMatch;
          that.createView(true);

          if (!searchMatch.length) {
            noResults.className = 'no-results';
            noResults.innerHTML = that.options.noneResultsText.replace('{0}', '"' + htmlEscape(searchValue) + '"');
            that.$menuInner[0].firstChild.appendChild(noResults);
          }
        } else {
          that.$menuInner.scrollTop(0);
          that.createView(false);
        }
      });
    },

    _searchStyle: function () {
      return this.options.liveSearchStyle || 'contains';
    },

    val: function (value) {
      if (typeof value !== 'undefined') {
        var prevValue = getSelectValues(this.$element[0]);

        changedArguments = [null, null, prevValue];

        this.$element
          .val(value)
          .trigger('changed' + EVENT_KEY, changedArguments);

        this.render();

        changedArguments = null;

        return this.$element;
      } else {
        return this.$element.val();
      }
    },

    changeAll: function (status) {
      if (!this.multiple) return;
      if (typeof status === 'undefined') status = true;

      var element = this.$element[0],
          previousSelected = 0,
          currentSelected = 0,
          prevValue = getSelectValues(element);

      element.classList.add('bs-select-hidden');

      for (var i = 0, len = this.selectpicker.current.elements.length; i < len; i++) {
        var liData = this.selectpicker.current.data[i],
            option = liData.option;

        if (option && !liData.disabled && liData.type !== 'divider') {
          if (liData.selected) previousSelected++;
          option.selected = status;
          if (status) currentSelected++;
        }
      }

      element.classList.remove('bs-select-hidden');

      if (previousSelected === currentSelected) return;

      this.setOptionStatus();

      this.togglePlaceholder();

      changedArguments = [null, null, prevValue];

      this.$element
        .triggerNative('change');
    },

    selectAll: function () {
      return this.changeAll(true);
    },

    deselectAll: function () {
      return this.changeAll(false);
    },

    toggle: function (e) {
      e = e || window.event;

      if (e) e.stopPropagation();

      this.$button.trigger('click.bs.dropdown.data-api');
    },

    keydown: function (e) {
      var $this = $(this),
          isToggle = $this.hasClass('dropdown-toggle'),
          $parent = isToggle ? $this.closest('.dropdown') : $this.closest(Selector.MENU),
          that = $parent.data('this'),
          $items = that.findLis(),
          index,
          isActive,
          liActive,
          activeLi,
          offset,
          updateScroll = false,
          downOnTab = e.which === keyCodes.TAB && !isToggle && !that.options.selectOnTab,
          isArrowKey = REGEXP_ARROW.test(e.which) || downOnTab,
          scrollTop = that.$menuInner[0].scrollTop,
          isVirtual = that.isVirtual(),
          position0 = isVirtual === true ? that.selectpicker.view.position0 : 0;

      isActive = that.$newElement.hasClass(classNames.SHOW);

      if (
        !isActive &&
        (
          isArrowKey ||
          (e.which >= 48 && e.which <= 57) ||
          (e.which >= 96 && e.which <= 105) ||
          (e.which >= 65 && e.which <= 90)
        )
      ) {
        that.$button.trigger('click.bs.dropdown.data-api');

        if (that.options.liveSearch) {
          that.$searchbox.trigger('focus');
          return;
        }
      }

      if (e.which === keyCodes.ESCAPE && isActive) {
        e.preventDefault();
        that.$button.trigger('click.bs.dropdown.data-api').trigger('focus');
      }

      if (isArrowKey) { // if up or down
        if (!$items.length) return;

        // $items.index/.filter is too slow with a large list and no virtual scroll
        index = isVirtual === true ? $items.index($items.filter('.active')) : that.activeIndex;

        if (index === undefined) index = -1;

        if (index !== -1) {
          liActive = that.selectpicker.current.elements[index + position0];
          liActive.classList.remove('active');
          if (liActive.firstChild) liActive.firstChild.classList.remove('active');
        }

        if (e.which === keyCodes.ARROW_UP) { // up
          if (index !== -1) index--;
          if (index + position0 < 0) index += $items.length;

          if (!that.selectpicker.view.canHighlight[index + position0]) {
            index = that.selectpicker.view.canHighlight.slice(0, index + position0).lastIndexOf(true) - position0;
            if (index === -1) index = $items.length - 1;
          }
        } else if (e.which === keyCodes.ARROW_DOWN || downOnTab) { // down
          index++;
          if (index + position0 >= that.selectpicker.view.canHighlight.length) index = 0;

          if (!that.selectpicker.view.canHighlight[index + position0]) {
            index = index + 1 + that.selectpicker.view.canHighlight.slice(index + position0 + 1).indexOf(true);
          }
        }

        e.preventDefault();

        var liActiveIndex = position0 + index;

        if (e.which === keyCodes.ARROW_UP) { // up
          // scroll to bottom and highlight last option
          if (position0 === 0 && index === $items.length - 1) {
            that.$menuInner[0].scrollTop = that.$menuInner[0].scrollHeight;

            liActiveIndex = that.selectpicker.current.elements.length - 1;
          } else {
            activeLi = that.selectpicker.current.data[liActiveIndex];
            offset = activeLi.position - activeLi.height;

            updateScroll = offset < scrollTop;
          }
        } else if (e.which === keyCodes.ARROW_DOWN || downOnTab) { // down
          // scroll to top and highlight first option
          if (index === 0) {
            that.$menuInner[0].scrollTop = 0;

            liActiveIndex = 0;
          } else {
            activeLi = that.selectpicker.current.data[liActiveIndex];
            offset = activeLi.position - that.sizeInfo.menuInnerHeight;

            updateScroll = offset > scrollTop;
          }
        }

        liActive = that.selectpicker.current.elements[liActiveIndex];

        if (liActive) {
          liActive.classList.add('active');
          if (liActive.firstChild) liActive.firstChild.classList.add('active');
        }

        that.activeIndex = that.selectpicker.current.data[liActiveIndex].index;

        that.selectpicker.view.currentActive = liActive;

        if (updateScroll) that.$menuInner[0].scrollTop = offset;

        if (that.options.liveSearch) {
          that.$searchbox.trigger('focus');
        } else {
          $this.trigger('focus');
        }
      } else if (
        (!$this.is('input') && !REGEXP_TAB_OR_ESCAPE.test(e.which)) ||
        (e.which === keyCodes.SPACE && that.selectpicker.keydown.keyHistory)
      ) {
        var searchMatch,
            matches = [],
            keyHistory;

        e.preventDefault();

        that.selectpicker.keydown.keyHistory += keyCodeMap[e.which];

        if (that.selectpicker.keydown.resetKeyHistory.cancel) clearTimeout(that.selectpicker.keydown.resetKeyHistory.cancel);
        that.selectpicker.keydown.resetKeyHistory.cancel = that.selectpicker.keydown.resetKeyHistory.start();

        keyHistory = that.selectpicker.keydown.keyHistory;

        // if all letters are the same, set keyHistory to just the first character when searching
        if (/^(.)\1+$/.test(keyHistory)) {
          keyHistory = keyHistory.charAt(0);
        }

        // find matches
        for (var i = 0; i < that.selectpicker.current.data.length; i++) {
          var li = that.selectpicker.current.data[i],
              hasMatch;

          hasMatch = stringSearch(li, keyHistory, 'startsWith', true);

          if (hasMatch && that.selectpicker.view.canHighlight[i]) {
            matches.push(li.index);
          }
        }

        if (matches.length) {
          var matchIndex = 0;

          $items.removeClass('active').find('a').removeClass('active');

          // either only one key has been pressed or they are all the same key
          if (keyHistory.length === 1) {
            matchIndex = matches.indexOf(that.activeIndex);

            if (matchIndex === -1 || matchIndex === matches.length - 1) {
              matchIndex = 0;
            } else {
              matchIndex++;
            }
          }

          searchMatch = matches[matchIndex];

          activeLi = that.selectpicker.main.data[searchMatch];

          if (scrollTop - activeLi.position > 0) {
            offset = activeLi.position - activeLi.height;
            updateScroll = true;
          } else {
            offset = activeLi.position - that.sizeInfo.menuInnerHeight;
            // if the option is already visible at the current scroll position, just keep it the same
            updateScroll = activeLi.position > scrollTop + that.sizeInfo.menuInnerHeight;
          }

          liActive = that.selectpicker.main.elements[searchMatch];
          liActive.classList.add('active');
          if (liActive.firstChild) liActive.firstChild.classList.add('active');
          that.activeIndex = matches[matchIndex];

          liActive.firstChild.focus();

          if (updateScroll) that.$menuInner[0].scrollTop = offset;

          $this.trigger('focus');
        }
      }

      // Select focused option if "Enter", "Spacebar" or "Tab" (when selectOnTab is true) are pressed inside the menu.
      if (
        isActive &&
        (
          (e.which === keyCodes.SPACE && !that.selectpicker.keydown.keyHistory) ||
          e.which === keyCodes.ENTER ||
          (e.which === keyCodes.TAB && that.options.selectOnTab)
        )
      ) {
        if (e.which !== keyCodes.SPACE) e.preventDefault();

        if (!that.options.liveSearch || e.which !== keyCodes.SPACE) {
          that.$menuInner.find('.active a').trigger('click', true); // retain active class
          $this.trigger('focus');

          if (!that.options.liveSearch) {
            // Prevent screen from scrolling if the user hits the spacebar
            e.preventDefault();
            // Fixes spacebar selection of dropdown items in FF & IE
            $(document).data('spaceSelect', true);
          }
        }
      }
    },

    mobile: function () {
      this.$element[0].classList.add('mobile-device');
    },

    refresh: function () {
      // update options if data attributes have been changed
      var config = $.extend({}, this.options, this.$element.data());
      this.options = config;

      this.checkDisabled();
      this.setStyle();
      this.render();
      this.createLi();
      this.setWidth();

      this.setSize(true);

      this.$element.trigger('refreshed' + EVENT_KEY);
    },

    hide: function () {
      this.$newElement.hide();
    },

    show: function () {
      this.$newElement.show();
    },

    remove: function () {
      this.$newElement.remove();
      this.$element.remove();
    },

    destroy: function () {
      this.$newElement.before(this.$element).remove();

      if (this.$bsContainer) {
        this.$bsContainer.remove();
      } else {
        this.$menu.remove();
      }

      this.$element
        .off(EVENT_KEY)
        .removeData('selectpicker')
        .removeClass('bs-select-hidden selectpicker');

      $(window).off(EVENT_KEY + '.' + this.selectId);
    }
  };

  // SELECTPICKER PLUGIN DEFINITION
  // ==============================
  function Plugin (option) {
    // get the args of the outer function..
    var args = arguments;
    // The arguments of the function are explicitly re-defined from the argument list, because the shift causes them
    // to get lost/corrupted in android 2.3 and IE9 #715 #775
    var _option = option;

    [].shift.apply(args);

    // if the version was not set successfully
    if (!version.success) {
      // try to retreive it again
      try {
        version.full = ($.fn.dropdown.Constructor.VERSION || '').split(' ')[0].split('.');
      } catch (err) {
        // fall back to use BootstrapVersion if set
        if (Selectpicker.BootstrapVersion) {
          version.full = Selectpicker.BootstrapVersion.split(' ')[0].split('.');
        } else {
          version.full = [version.major, '0', '0'];

          console.warn(
            'There was an issue retrieving Bootstrap\'s version. ' +
            'Ensure Bootstrap is being loaded before bootstrap-select and there is no namespace collision. ' +
            'If loading Bootstrap asynchronously, the version may need to be manually specified via $.fn.selectpicker.Constructor.BootstrapVersion.',
            err
          );
        }
      }

      version.major = version.full[0];
      version.success = true;
    }

    if (version.major === '4') {
      // some defaults need to be changed if using Bootstrap 4
      // check to see if they have already been manually changed before forcing them to update
      var toUpdate = [];

      if (Selectpicker.DEFAULTS.style === classNames.BUTTONCLASS) toUpdate.push({ name: 'style', className: 'BUTTONCLASS' });
      if (Selectpicker.DEFAULTS.iconBase === classNames.ICONBASE) toUpdate.push({ name: 'iconBase', className: 'ICONBASE' });
      if (Selectpicker.DEFAULTS.tickIcon === classNames.TICKICON) toUpdate.push({ name: 'tickIcon', className: 'TICKICON' });

      classNames.DIVIDER = 'dropdown-divider';
      classNames.SHOW = 'show';
      classNames.BUTTONCLASS = 'btn-light';
      classNames.POPOVERHEADER = 'popover-header';
      classNames.ICONBASE = '';
      classNames.TICKICON = 'bs-ok-default';

      for (var i = 0; i < toUpdate.length; i++) {
        var option = toUpdate[i];
        Selectpicker.DEFAULTS[option.name] = classNames[option.className];
      }
    }

    var value;
    var chain = this.each(function () {
      var $this = $(this);
      if ($this.is('select')) {
        var data = $this.data('selectpicker'),
            options = typeof _option == 'object' && _option;

        if (!data) {
          var dataAttributes = $this.data();

          for (var dataAttr in dataAttributes) {
            if (dataAttributes.hasOwnProperty(dataAttr) && $.inArray(dataAttr, DISALLOWED_ATTRIBUTES) !== -1) {
              delete dataAttributes[dataAttr];
            }
          }

          var config = $.extend({}, Selectpicker.DEFAULTS, $.fn.selectpicker.defaults || {}, dataAttributes, options);
          config.template = $.extend({}, Selectpicker.DEFAULTS.template, ($.fn.selectpicker.defaults ? $.fn.selectpicker.defaults.template : {}), dataAttributes.template, options.template);
          $this.data('selectpicker', (data = new Selectpicker(this, config)));
        } else if (options) {
          for (var i in options) {
            if (options.hasOwnProperty(i)) {
              data.options[i] = options[i];
            }
          }
        }

        if (typeof _option == 'string') {
          if (data[_option] instanceof Function) {
            value = data[_option].apply(data, args);
          } else {
            value = data.options[_option];
          }
        }
      }
    });

    if (typeof value !== 'undefined') {
      // noinspection JSUnusedAssignment
      return value;
    } else {
      return chain;
    }
  }

  var old = $.fn.selectpicker;
  $.fn.selectpicker = Plugin;
  $.fn.selectpicker.Constructor = Selectpicker;

  // SELECTPICKER NO CONFLICT
  // ========================
  $.fn.selectpicker.noConflict = function () {
    $.fn.selectpicker = old;
    return this;
  };

  $(document)
    .off('keydown.bs.dropdown.data-api')
    .on('keydown' + EVENT_KEY, '.bootstrap-select [data-toggle="dropdown"], .bootstrap-select [role="listbox"], .bootstrap-select .bs-searchbox input', Selectpicker.prototype.keydown)
    .on('focusin.modal', '.bootstrap-select [data-toggle="dropdown"], .bootstrap-select [role="listbox"], .bootstrap-select .bs-searchbox input', function (e) {
      e.stopPropagation();
    });

  // SELECTPICKER DATA-API
  // =====================
  $(window).on('load' + EVENT_KEY + '.data-api', function () {
    $('.selectpicker').each(function () {
      var $selectpicker = $(this);
      Plugin.call($selectpicker, $selectpicker.data());
    })
  });
})(jQuery);


}));

var dS = dS || {};
dS = (function(){
	'use strict';
	var ajxSettings = {
			async:			true,
			beforeSend:		null,
			cache:			false,
			callback:		null,
			complete:		null,
			contentType:	'application/x-www-form-urlencoded;charset=UTF-8',
			data:			null,
			dataType:		'json',
			error:			function(e) {
								console.error('웹서버에서',String(e.status),'에러가 발생했습니다.');
							},
			headers:		{
								'cache-control': 'no-cache',
								'pragma': 'no-cache'
							},
			global:			true,
			method:			'post',
			processData:	true,
			success:		function(e) {},
			timeout:		60000,
			url:			null,
			isStrPr:		false
		}
		, xhrsetting = {

		}
		, resize = {
			timeout: null
		};
	return {
		append: {
			js: function(opts) {

			}
		},
		ajx: function(opts) {
			if (typeof opts !== 'object') {
				ajxSettings.isStrPr = true; //opts가 string 타입일 경우 설정
				opts = dS.util.parse(opts);
			};
			$.extend(ajxSettings, opts);

			(opts.async === false) ? ajxSettings.async = true : ajxSettings.async = true;
			(opts.global === false) ? ajxSettings.global = false : ajxSettings.global = true;
			(typeof opts.contentType === 'undefined') ? ajxSettings.contentType = 'application/x-www-form-urlencoded;charset=UTF-8' : ajxSettings.contentType = opts.contentType;

			if (!opts.callback) {
				ajxSettings.callback = opts.callback
			};
			return $.ajax(ajxSettings);
		},
		/*
		* dS.xhr({url:'/html/test/external.html', async:true, callback:test, method:'get', params:undefined});
		*/
		xhr: function(opts) {
			for (var k in opts) xhrsetting[k] = opts[k];

			var xhrReq		= new XMLHttpRequest()
				, xhrParam	= (xhrsetting.params !== undefined || xhrsetting.params !== null)
								? JSON.parse(xhrsetting.params) : undefined;

			xhrReq.onload	= xhrsetting.callback;
			xhrReq.onerror	= function(response) {
				console.log(response);
			};

			xhrReq.open(xhrsetting.method, xhrsetting.url, xhrsetting.async);
			if (xhrsetting.method === 'post') xhrReq.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
			xhrReq.onreadystatechange = function() {
				//console.log(xhrReq.readyState);
			};
			xhrReq.send(xhrParam);
		},
		browser: {
			getW: function() {
				return document.documentElement.clientWidth;//$(window).width();
			},
			getH: function() {
				return document.documentElement.clientHeight;//$(window).height();
			},
			getST: function() {
				return document.documentElement.scrollTop;//$(window).scrollTop();
			},
			getSL: function() {
				return document.documentElement.scrollLeft;//$(window).scrollLeft();
			},
			getPath: function() {
				return window.location.pathname;
			},
			getAgt: function() {
				return window.navigator.userAgent.toLowerCase();
			},
			getAndVer: function() {
				return this.getAgt().match(/android\s([0-9\.]*)/)[1];
			},
			inNative: function() {
				return window.navigator.standalone;
			},
			inApple: function() {
				return /iphone|ipod|ipad/.test(this.getAgt());
			},
			brwIsIE9: function() {
				var a = this.getAgt().split(';'),
					r = undefined;

				a.forEach(function(e, i) {
					if(e.toLowerCase().indexOf('msie') !== -1) {
						r = (e.indexOf('9.0') !== -1) ? true : false;
					};
				});
				return r;
			},
			brwIsChrome: function() {
				return /chrome/.test(this.getAgt());
			},
			brwIsSafari: function() {
				return /safari/.test(this.getAgt());
			},
			brwIsSamsung: function() {
				return /samsungbrowser/.test(this.getAgt());
			},
			resizeEnd: function(opts) {
				var callback	= (typeof opts.callback === 'function') ? opts.callback : null,
				 	time		= (typeof opts.time === 'number') ? opts.time : 1000;

				if (resize.timeout !== null) {
					clearTimeout(resize.timeout);
					resize.timeout = null;
				};
				resize.timeout = setTimeout(callback, time);
			},
			scroll: function(opts) {
				var sTop	= dS.browser.getST(),
					sLeft	= dS.browser.getSL();

				console.log(sTop, sLeft);
			}
		},
		dom: {
			// dS.dom.addclass({target:d, class:'magic'});
			addclass: function(opts) {
				var t	= opts.target
					, c	= opts.class
					, g = (t.className !== undefined) ? '' : ' ';

				t.className += g + opts.class;
			},
			// dS.dom.removeclass({target:d, class:'magic'});
			removeclass: function(opts) {
				var t	= opts.target
					, c = opts.class
					, o = t.className
					, a = []
					, n = undefined;

				a = o.split(' ');
				n = a.filter(function(el, i) {
						if (el !== c) return true;
					}).join(' ');

				t.className = n;
			},
			getOFS_l: function(tgt) {
				return tgt.offset().left;
			},
			getOFS_t: function(tgt) {
				return tgt.offset().top;
			}
		},
		css: {
			get: function(opts) {
				var t = opts.target,
					p = opts.property.split(','),
					i = 0,
					o = new Object();
				for (; i < p.length; i++) o[p[i].trim()] = getComputedStyle(t)[p[i].trim()];
				return o;
			},
			set: function(opts) {
				var a = new Array(),
					t = opts.target,
					c = undefined,
					p = opts.property;
				//console.log(p);
				(!t.isNodeList()) ? a.push(t) : a = t;
				c = a;
				for (var i = 0; i < c.length; i++) {
					for (var k in p) c[i].style[k] = p[k];
				};
			}
		},
		events: {
			add: function(opts) {
				var a = new Array(),
					t = opts.target,
					e = opts.events.split(' '),
					f = opts.function,
					p = (opts.params !== undefined) ? opts.params : undefined,
					s = t instanceof Element;

				// nodelist와 HTMLCollection는 array로 변환안함
				(s) ? a.push(t) : (t instanceof NodeList || t instanceof HTMLCollection) ? a = t : a.push(t);

				e.forEach(function(v, k) {
					for (var i = 0; i < a.length; i++) {
						a[i].addEventListener(v, (p !== undefined) ? f.bind(this, p) : f, false);
					};
				});
			}
		},
		util: {
			date: {
				days: ['일', '월', '화', '수', '목', '금', '토'],
				get: function(opts) {
					var a = new Date(opts.target.getFullYear(), opts.target.getMonth(), opts.target.getDate() ),
						b = a.getDate(),
						c = a.getMonth(),
						d = a.getFullYear(),
						e = a.getDay();
				},
				// 오늘 날짜
				today: function(opts) {
					return new Date().getFullYear() + opts + dS.util.number.addZero(new Date().getMonth() + 1) + opts + dS.util.number.addZero(new Date().getDate());
				}
			},
			number: {
				addZero: function(opts) {
					var str = opts + '';
					if (str.length < 2) {
						return '0' + str;
					} else {
						return str;
					};
				}
			}
		}
	}
}());

String.prototype.getMatrix = function(v) {
	return this.replace(/[^0-9\-.,]/g, '').split(',')[v];
};

Element.prototype.isNodeList = function() {
	return false;
};
NodeList.prototype.isNodeList = HTMLCollection.prototype.isNodeList = function() {
	return true;
};
Window.prototype.isNodeList = function() {
	return false;
};

var mbALert = mbALert || {};
mbALert =(function() {
    return {

    }
}());

/**
 *  모바일 레이어팝업 공통
 *  예) mbLayer.init({target:''});
    mbLayer.toggle({
        id:'',
        confirm: '확인',
        cancel: '취소',
        callback:{
            confirm: function() { console.log('normal layer confirm') },
            cancel:	function() { console.log('normal layer cancel') }
        },
        param:{
            confirm: 'normal',
            cancel:	{a:'aa'}
        },
        width: 300,
        minHeight:200,
        type:'' //: single or ''
    });
    mbLayer.validates
**/
var mbLayer = mbLayer || {};
mbLayer = (function() {
    'use strict';
    var setting     = new Object()
        , target   = new Object()
        , self      = undefined
        , dom       = undefined;
    return {
        dom:
        {
            frame:	'<section class="layer-popup" style="display:none;position:fixed;top:0;width:calc(100% - 20px);margin:0 10px 0 10px;' +
                    'padding-top:60px;background:#fff;z-index:106;">'+
                          '<div class="wrap">'+
                              '<header class="layer-header" style="position:absolute;top:0;left:0;width:100%;height:60px;'+
                                  'background:#513397;"><h3 class="tit" style="color:#fff;line-height:58px;padding: 0 0 0 30px;"></h3>'+
                              '</header>'+
                              '<div class="layer-con" style="overflow-y:auto;background-color:#fff;padding:30px;"></div>'+
                              '<button type="button" class="btn-layer-close" style="width:21px;height:20px;margin:0;padding:0;border:0;'+
                                'display:block;position:absolute;top:20px;right:30px;text-indent:-9999px;'+
                                'background:url(/static/pc/images/common/btn/btn-layer-close.png) no-repeat center;">레이어 닫기</button>'+
                          '</div>'+
                      '</section>'
            , dim:  '<div class="alertStyle" style="display:none;position:fixed;top:0px;left:0px;background:#000;opacity:0.7;'+
                        'width:100%;height:100%;z-index:105;">닫기</div>'
            , cont: ''
        }
        , init: function()
        {
            self = this;
            dom = self.dom;

            self.setUI();
        }
        , setUI: function()
        {
            dom.body = document.querySelector('body');
            dom.body.insertAdjacentHTML('beforeEnd', dom.frame);
            dom.body.insertAdjacentHTML('beforeEnd', dom.dim);

            // temp starts --
            dom.body.querySelector('header').insertAdjacentHTML('beforeEnd',
                '<a href="#film_join" class="btn-layer-open" w-data="320" h-data="670" data-callback="testCall"' +
                ' data-param="{a:"b"}" style="background:#fff;">가입하기</a>');
            // -- temp ends

            target.ly   = document.querySelector('.layer-popup');
            target.cnt  = target.ly.querySelector('.layer-con');

            self.addEvents();
        }
        , addEvents: function()
        {
            dS.events.add({ target:document, events:'click', function:self.toggle });
        }
        , toggle: function()
        {
            var e = window.event || arguments[0]
                , t = e.target;

            // 초기화
            target.cnt.innerHTML = '';

            // a 태그 클릭 호출
            if (e.type === 'click')
            {
                e.preventDefault();

                if (t.className.indexOf('btn-layer-open') !== -1)
                {
                    setting.tid = t.getAttribute('href').split('#')[1];
                };
            };

            // 수동 호출
            if (e.type === '' || e.type === undefined)
            {
                target.ly.setAttribute('id', setting.tid);
                console.log('manual');
            };
        }
    }
}());

/**
 * 모바일 스와이핑 오브젝트
 * swipe-list2 클래스에 자동 적용
 * 예) mbThSwiper.init({ target:'swipe-list', callback:callbackfunc });
 **/
var mbThSwiper = mbThSwiper || {};
mbThSwiper = (function() {
    'use strict';
    var setting = new Object(),
        targets = new Array(),
        self    = undefined,
        dom     = undefined;
    return {
        dom: {
            root: 'body'
        },
        init: function(opts) {
            self    = this;
            dom     = self.dom;

            var priority = document.getElementsByClassName(opts.target); // 스와이핑 영역 공통 클래스

            if (typeof opts !== 'undefined') for (var k in opts) setting[k] = opts[k];
            if (priority.length > 0) self.setUI();
        },
        setUI: function() {
            var swObj = document.getElementsByClassName(setting.target),
                iniNm = 0,
                iniln = swObj.length,
                emDiv = document.createElement('div'),
                scWth = dS.browser.getW();

            swObj[0].style.cssText  = 'overflow:hidden;';
            emDiv.className         = 'div-vertical';

            setting.id              = 0;
            setting.oid             = 0;
            setting.nums            = new Object();
            setting.nums.min        = Math.round(scWth * 0.55);
            setting.nums.max        = Math.round(scWth * 0.6);
            setting.nums.ded        = 1;
            setting.nums.mgnh       = 10; // 포스터 상단 여백
            setting.nums.mgns       = 15; // 포스터 좌우 여백
            setting.onani           = false;
            // 화면상 스와이핑 오브젝트들 Array에 저장
            for (;iniNm < iniln; iniNm++) targets.push({ me:swObj[iniNm] });

            targets.forEach(function(v, k) {
                var t = v.me.getElementsByClassName('item'), // 개별 포스터
                    a = 0,
                    b = t.length;

                setting.len = b;
                v.me.appendChild(emDiv);

                for (; b > a; b--) {
                    t[b - 1].className = 'item';
                    dS.css.set({ target:t[0], property:{ 'margin-left':Math.round(scWth * 0.2) + 'px' } });
                    dS.css.set({ target:t[b - 1], property:{ width:setting.nums.min + 'px', 'transition':'width .3s ease-out 0s' } });
                    dS.css.set({ target:t[setting.len - 1], property:{ 'margin-right':Math.round(scWth * 0.2) + 'px' } });
                    emDiv.insertBefore(t[b-1], emDiv.firstChild);
                };
                dS.css.set({ target:t[0], property:{ 'width':setting.nums.max + 'px' } }); // 첫번째 이미지에 최대 사이즈 설정
                setting.nums.hgt = t[0].offsetHeight + setting.nums.mgnh;
                dS.css.set({
                    target:emDiv,
                    property:{
                        'display':'table-cell', 'position':'relative', 'vertical-align':'bottom',
                        height:Math.round(setting.nums.hgt) + 'px', left:-setting.nums.min * setting.id - ((setting.id) * setting.nums.mgns) + 'px'
                    }
                });
                v.p = v.me.offsetLeft;
            });

            self.addEvents();
        },
        addEvents: function() {
            targets.forEach(function(v, k) {
                dS.events.add({ target:v.me.children[k], events:'touchstart touchmove touchend', function:self.events.startSwipe, params:k });
                dS.events.add({ target:v.me.children[k], events:'transitionend oTransitionEnd webkitTransitionEnd', function:self.events.endSwipe, params:k });
            });
        },
        events: {
            endSwipe: function(e) {
                var a = arguments,
                    i = a[0],
                    m = targets[i].me.children[0],
                    c = a[1].target.getAttribute('class');

                if (c === 'div-vertical') {
                    targets[i].p        = m.offsetLeft;
                    setting.nums.ded    = 1;

                    if (setting.oid !== setting.id) {
                        setting.oid  = setting.id;
                        setting.callback(setting.id);
                    };

                    setting.onani = false;
                };
            },
            startSwipe: function() {
                var a = arguments,
                    i = a[0],
                    e = window.event,
                    t = e.type,
                    m = targets[i].me.children[0],
                    w = dS.browser.getW(),
                    tgt = targets[i].me.children[0],
                    chr = tgt.children,
                    rto = 0.3,
                    etm = 0.5;

                e.preventDefault();

                if (setting.onani) return false;

                switch (t) {
                    case 'touchstart':
                        targets[i].s = e.touches[0].clientX;
                    break;
                    case 'touchmove':
                        // 최대사이즈에서 최소사이즈로 감소
                        (setting.nums.ded < setting.nums.max - setting.nums.min)
                        ? setting.nums.ded *= 1.07
                        : setting.nums.ded = setting.nums.max - setting.nums.min;

                        targets[i].m = e.touches[0].clientX - targets[i].s;
                        // 현재 활성화된 포스터 사이즈 감소
                        dS.css.set({ target:chr[setting.id], property:{ width: setting.nums.max - setting.nums.ded + 'px', 'transition':'none' } });
                        // 터치가 움직이는 만큼 포스터리스트 이동
                        dS.css.set({ target:m, property:{ left: targets[i].p + targets[i].m * rto + 'px', 'transition':'none' } });
                    break;
                    case 'touchend':
                        var dir = (targets[i].m > 0) ? +1 : -1;
                        // 스와이핑 거리가 불충분하거나 좌/우 끝에서 더 이상 이동 불가능 할 경우 처리
                        if (Math.abs(targets[i].m) < setting.nums.max || tgt.offsetLeft > 0 || tgt.offsetLeft < -tgt.offsetWidth + w) {
                            etm = 0.3;
                        } else {
                            // 좌우 방향 확인하여 id 증감
                            etm = 0.5;
                            (dir === 1) ? setting.id-- : setting.id++;
                        };

                        // 스와이핑 완료 후 애니메이션 처리
                        dS.css.set({
                            target:targets[i].me.children[0],
                            property:{
                                left            : -setting.nums.min * setting.id - ((setting.id) * setting.nums.mgns) + 'px',
                                'transition'    : 'left '+ etm +'s ease-out 0s'
                            }
                        });

                        // 해당 아이디만 최대사이즈로 증가
                        for (var z = 0; z < setting.len; z++) {
                            (z === setting.id)
                            ? dS.css.set({ target:chr[z], property:{ width:setting.nums.max + 'px', 'transition':'width .2s ease-out 0s' } })
                            : dS.css.set({ target:chr[z], property:{ width:setting.nums.min + 'px', 'transition':'width .2s ease-out 0s' } });
                        };

                        setting.onani = true;
                    break;
                }
            }
        }
    }
}());

$(function() {
    mbThSwiper.init({ target:'swipe-list2', callback:callbacktest }); // 모바일 영화 스와이핑

    //faq event
    if(!isApp()) {
        $(document).on('click', '.faq-list ul li > a', function(){
            if( $(this).parent('li').hasClass('on') ) {
                $(this).parent('li').removeClass('on');
                $(this).next('.cont').stop().slideUp(300);
                $(this).find('.iconset').removeClass('ico-updown-on');
                $(this).find('.iconset').addClass('ico-updown-off');
            }
            else {
                $(this).parent('li').addClass('on');
                $(this).next('.cont').stop().slideDown(300);
                $(this).find('.iconset').addClass('ico-updown-on');
                $(this).find('.iconset').removeClass('ico-updown-off');
            }
        });
    }

    // 극장 선택
    $(document).on('click', '.theather-select-box li a.area', function(e){
        e.preventDefault();
        $(this).closest('.theather-select-box').find('.theater').removeClass('active');
        $(this).parent().find('.theater').addClass('active');
        $(this).closest('.theather-select-box').find('a.area').removeClass('active');
        $(this).addClass('active');
    });

    // 토글 버튼
    $(document).on('click', 'button.btn-toggle', function(e){
        e.preventDefault();
        $(this).find('.iconset').toggleClass('on');
    });

    // 카드 혜택 선택
    $(document).on('click', '.alliance-list .item .alliance-info', function(){

        if( $(this).parent().hasClass('on') ){
            $(this).parent().removeClass('on');
        }
        else {
        $(this).closest('.alliance-list').find('.item').removeClass('on');
        $(this).parent().addClass('on');
        }
    });

    //rnb open
    $(document).on('click', '.h-burger, .ico-burger', function(e){
        e.preventDefault();
        $('body').addClass('no-scroll');
        $('#rnb').addClass('on');
        $('.rnb-dimd').hide();
        $('.rnb-dimd').fadeIn();
        /* mobileLayout에 글로벌 펑션호출 */
        gfn_rnbOp($('#rnb'));
    });
    /*close*/
    $(document).on('click', '.rnb-close, .rnb-dimd', function(e){
        e.preventDefault();

        if(MegaboxUtil.Common.isApp()){
            AppHandler.Common.sideMenuClose();
        }else{
            $('body').removeClass('no-scroll');
            $('#rnb').removeClass('on');
        }
    });

    // full size layer
    $(document).on('click', '.btn-layer-open', function(e){
        e.preventDefault();

        $('body').addClass('no-scroll');
        $('.full-layer').removeClass('on');
        $($(this).attr('href')).addClass('on');
    });

    $(document).on('click', '.btn-layer-close', function(){
        close_fullLayer();
    });

    close_fullLayer = function closeFullLayer(){
        $('body').removeClass('no-scroll');
        $('.full-layer').removeClass('on');
        //$(this).closest('.full-layer').removeClass('on');
    }


    /* 폰트 사이즈 */
    var _fsCount = 0;
    $('.aaa *').each(function(){
        $(this).data({
            'orgSize' : $(this).css('font-size'),
            'fsHasFlag' : 'y'
        });
    });

    var fn_textZoom = function(flag){
        if (flag == 'big')
        {
            if (_fsCount <= 3) _fsCount++;
        }else if (flag == 'small'){
            if (_fsCount >= 1) _fsCount--;
        }


        //baseClass = $('.'+flag).closest('#header').hasClass('consumer') || $('.'+flag).closest('body').is('#main_layout') ? '.container' : '#contents';
        baseClass = '.aaa';

        $(baseClass + ' *:data(fsHasFlag)').each(function(){
            var defaultSize = $(this).data('orgSize'),
                stringSplit = defaultSize.replace('px','');
            defaultSize = Number(stringSplit)+_fsCount;

            if (flag == 'reset'){
                $(this).css('font-size', $(this).data('orgSize'));
                _fsCount = 0;
            }else {
                $(this).css('font-size',parseInt(defaultSize)+'px');
            }
        });
    };


    $(document).on('click', '.font-control button', function(e){
        e.preventDefault();

        _param = $(this).attr('class');

        fn_textZoom(_param);
    });

    // 공통 - 극장 선택
    $(document).on('click', '.theather-select-list .district-list a', function(e){
        //e.preventDefault();
        try {
            $(this).closest('.district-list').find('li').removeClass('on');
            $(this).parent().addClass('on');

            $(this).closest('.theather-select-list').find('.city-cont').removeClass('on');
            $("#"+$(this).data('no')).addClass('on');
        } catch (e) {}
    });

    // 마이메가박스 - VIP쿠폰 탭
    $(document).on('click', '.tab-vip-wrap .tab-vip a', function(e){
        e.preventDefault();
        $(this).closest('.tab-vip').find('li').removeClass('on');
        $(this).parent().addClass('on');

        $(this).closest('.tab-vip-wrap').find('.tab-vip-cont').removeClass('on');
        $($(this).attr('href')).addClass('on');
    });

    // 마이메가박스 - VIP쿠폰 탭2

    $(document).on('click', '.benefit-point-wrap .type-fix-btn .list-btn a', function(e){
        e.preventDefault();
        try {
            $(this).closest('.list-btn').find('a').removeClass('on');
            $(this).addClass('on');

            $(this).closest('.benefit-point-wrap').find('.tab-cont').removeClass('on');
            $($(this).attr('href')).addClass('on');
        } catch (e) {}
    });


    // 예매 - 자주쓰는 할인수단 탭
    /*
    $(document).on('click', '.payment-layer-tab .type-fix-btn .list-btn a', function(e){
        e.preventDefault();
        $(this).closest('.list-btn').find('a').removeClass('on');
        $(this).addClass('on');

        $(this).closest('.payment-layer-tab').find('.tab-cont').removeClass('on');
        $($(this).attr('href')).addClass('on');
    });
    */

    //영화상세 - 줄거리
    $(document).on('click', '.btn-movie-story-more .btn-more', function(){
        $(this).closest('.btn-more').toggleClass('on');

        if( $(this).closest('.btn-more').hasClass('on') ) {
            $(this).find('span').text('더보기');
        }
        else {
            $(this).find('span').text('닫기');
        }

        if( $('.movie-summary').length > 0 ) {
            $(this).closest('.movie-summary').toggleClass('on');
        }
    });

    /* swiper */
/*
    if( $('.list-scroll-swiper').length > 0 ){
        var list_swiper = new Swiper('.list-scroll-swiper', {
            slidesPerView: 'auto',
            freeMode: true,
            spaceBetween: 0,
            pagination: false ,
            centeredSlides: false ,
            navigation : false
        });
    }*/

    // 영화 메인 header bg
    if( $('.container').length > 0 ) {
        $(window).on('scroll', function() {
            tab_top = $('.container').offset().top;

            if ($(window).scrollTop() > tab_top) {
                $('.hd-bg-chg').addClass('bg-on');
            } else {
                $('.hd-bg-chg').removeClass('bg-on');
            }
        });
    }

    // 영화 상세 앵커 고정
    if( $('.movie-detail-tab').length > 0 ) {
        $(window).on('scroll', function() {
            mov_top = $('.movie-detail-tab').offset().top;

            if ($(window).scrollTop() > mov_top - 44 ) {
                $(document).find('.movie-detail-tab').addClass('fixed');
        console.log('mov_top');
            } else {
                $(document).find('.movie-detail-tab').removeClass('fixed');
            }
        });
    }

    // 이벤트 메인 앵커 고정
    if( $('.btn-scroll-wrap').length > 0 ) {
        $(window).on('scroll', function() {
            mov_top = $('.btn-scroll-wrap').offset().top;

            if ($(window).scrollTop() > mov_top - 46 ) {
                $(document).find('.btn-scroll-wrap').addClass('fixed');
            } else {
                $(document).find('.btn-scroll-wrap').removeClass('fixed');
            }
        });
    }

    // 스토어 메인 앵커 고정
    if( $('.cscenter-wrap .list-btn button').length > 3 ) {
                $('.cscenter-wrap .list-btn').addClass('odd');
    }


    // 스토어 메인 앵커 고정
    if( $('.movie-detail-tab').length > 0 ) {
        $(window).on('scroll', function() {
            mov_top = $('.movie-detail-tab').offset().top;

            if ($(window).scrollTop() > mov_top - 46 ) {
                $(document).find('.movie-detail-tab').addClass('fixed');
            } else {
                $(document).find('.movie-detail-tab').removeClass('fixed');
            }
        });
    }

    // 혜택 앵커 고정
    if( $('.benefit-fixed').length > 0 ) {
        $(window).on('scroll', function() {
            mov_top = $('.benefit-fixed .btn-scroll-wrap').offset().top;

            if ($(window).scrollTop() > mov_top - 44 ) {
                var fixClass = 'fixed';
                if ($('.container').css('padding-top') == '0px') fixClass = 'fix-app';
                $(document).find('.benefit-fixed .btn-scroll-wrap').addClass(fixClass);
            } else {
                $(document).find('.benefit-fixed .btn-scroll-wrap').removeClass('fixed fix-app');
            }
        });
    }
});

$(document).ready(function() {

    //스토어상품 이미지 height 값 통일
    var postImgList3 = $('.combo-item-list .item:first-child .img img').height() + 'px';

    $('.combo-item-list .item .img img').css({height:postImgList3});

    $(window).resize(function(){
        $('.combo-item-list .item .img img').removeAttr('style');
        var postImgList2 = $('.combo-item-list .item:first-child .img img').height() + 'px';
        $('.combo-item-list .item .img img').css({height:postImgList2});
    });

    //좌석미리보기팝업
    var pscreenH1 = (screen.height - 330) + 'px';

    $('.mvticket .layer-cont').css({maxHeight:pscreenH1});


    // 영화 선택 화면 자동 높이계산
    var screenH1 = (window.innerHeight - 232) + 'px'; // combo-top-text , 탭 , 푸터버튼 3개다 존재할경우
    var screenH2 = (window.innerHeight - 159) + 'px';	// combo-top-text , 탭 2개만 존재할경우
    var screenH3 = (window.innerHeight - 188)+ 'px'; // combo-top-text , 푸터버튼 2개만 존재할경우
    var screenH4 = (window.innerHeight - 133) + 'px'; // combo-top-text  만 존재할경우
    var screenH5 = (window.innerHeight - 154) + 'px'; // 탭, 하단푸터 2개만 존재할경우
    var screenH6 = (window.innerHeight - 99) + 'px'; // 탭 만 존재할경우

    $('.city-list .city-cont').css({height:screenH1});
    $('.district-list').css({height:screenH1});
    $('.district-list ul').css({height:screenH1});
    $('.theather-select-list').css({height:screenH1});

    $('.no-btn .city-list .city-cont').css({height:screenH2});
    $('.no-btn .district-list').css({height:screenH2});
    $('.no-btn .district-list ul').css({height:screenH2});
    $('.no-btn.theather-select-list').css({height:screenH2});

    $('.no-tab .city-list .city-cont').css({height:screenH3});
    $('.no-tab .district-list').css({height:screenH3});
    $('.no-tab .district-list ul').css({height:screenH3});
    $('.no-tab.theather-select-list').css({height:screenH3});

    $('.no-tabBtn .city-list .city-cont').css({height:screenH4});
    $('.no-tabBtn .district-list').css({height:screenH4});
    $('.no-tabBtn .district-list ul').css({height:screenH4});
    $('.no-tabBtn.theather-select-list').css({height:screenH4});

    $('.no-txt .city-list .city-cont').css({height:screenH5});
    $('.no-txt .district-list').css({height:screenH5});
    $('.no-txt .district-list ul').css({height:screenH5});
    $('.no-txt.theather-select-list').css({height:screenH5});

    $('.no-txtBtn .city-list .city-cont').css({height:screenH6});
    $('.no-txtBtn .district-list').css({height:screenH6});
    $('.no-txtBtn .district-list ul').css({height:screenH6});
    $('.no-txtBtn.theather-select-list').css({height:screenH6});

    //$('.theather-select-list').closest('body').css('position','fixed');

    // textarea 높이 자동 조절
    $(document).on( 'input, keyup', '.txt-write-area textarea' , function () {
        $(this).css('height', 'auto' );
        $(this).height( this.scrollHeight - 10 );
    });


    // 패딩값 주기
    if( $('.btn-bottom').length > 0 ) {
        $('body').find('.container').addClass('pb55');
    }

    // 한줄평/기대평 별점 주기
    $('.star-grade-wrap span').click(function(){
      $('.star-grade-wrap span').removeClass('on');
      $(this).addClass('on').prevAll('span').addClass('on');
      return false;
    });


    //faq event
    if(isApp()) {
        var screenH1 = (window.innerHeight - 177) + 'px'; // combo-top-text , 탭 , 푸터버튼 3개다 존재할경우
        var screenH2 = (window.innerHeight - 104) + 'px';	// combo-top-text , 탭 2개만 존재할경우
        var screenH3 = (window.innerHeight - 133)+ 'px'; // combo-top-text , 푸터버튼 2개만 존재할경우
        var screenH4 = (window.innerHeight - 77) + 'px'; // combo-top-text  만 존재할경우
        var screenH5 = (window.innerHeight - 99) + 'px'; // 탭, 하단푸터 2개만 존재할경우
        var screenH6 = (window.innerHeight - 44) + 'px'; // 탭 만 존재할경우

        $('.city-list .city-cont').css({height:screenH1});
        $('.district-list').css({height:screenH1});
        $('.district-list ul').css({height:screenH1});
        $('.theather-select-list').css({height:screenH1});

        $('.no-btn .city-list .city-cont').css({height:screenH2});
        $('.no-btn .district-list').css({height:screenH2});
        $('.no-btn .district-list ul').css({height:screenH2});
        $('.no-btn.theather-select-list').css({height:screenH2});

        $('.no-tab .city-list .city-cont').css({height:screenH3});
        $('.no-tab .district-list').css({height:screenH3});
        $('.no-tab .district-list ul').css({height:screenH3});
        $('.no-tab.theather-select-list').css({height:screenH3});

        $('.no-tabBtn .city-list .city-cont').css({height:screenH4});
        $('.no-tabBtn .district-list').css({height:screenH4});
        $('.no-tabBtn .district-list ul').css({height:screenH4});
        $('.no-tabBtn.theather-select-list').css({height:screenH4});

        $('.no-txt .city-list .city-cont').css({height:screenH5});
        $('.no-txt .district-list').css({height:screenH5});
        $('.no-txt .district-list ul').css({height:screenH5});
        $('.no-txt.theather-select-list').css({height:screenH5});

        $('.no-txtBtn .city-list .city-cont').css({height:screenH6});
        $('.no-txtBtn .district-list').css({height:screenH6});
        $('.no-txtBtn .district-list ul').css({height:screenH6});
        $('.no-txtBtn.theather-select-list').css({height:screenH6});
    }
});



function theaterSelect() {
    var headerMinus = 0;

    if(isApp()) {
        headerMinus = 55;
    }
    var screenH1 = (window.innerHeight - 232 + headerMinus) + 'px';
    var screenH2 = (window.innerHeight - 159 + headerMinus) + 'px';
    var screenH3 = (window.innerHeight - 188 + headerMinus) + 'px';
    var screenH4 = (window.innerHeight - 133 + headerMinus) + 'px';
    var screenH5 = (window.innerHeight - 154 + headerMinus) + 'px';
    var screenH6 = (window.innerHeight - 99 + headerMinus) + 'px';

    $('.city-list .city-cont').css({height:screenH1});
    $('.district-list ul').css({height:screenH1});

    $('.no-btn .city-list .city-cont').css({height:screenH2});
    $('.no-btn .district-list ul').css({height:screenH2});

    $('.no-tab .city-list .city-cont').css({height:screenH3});
    $('.no-tab .district-list ul').css({height:screenH3});

    $('.no-tabBtn .city-list .city-cont').css({height:screenH4});
    $('.no-tabBtn .district-list u	l').css({height:screenH4});

    $('.no-txt .city-list .city-cont').css({height:screenH5});
    $('.no-txt .district-list ul').css({height:screenH5});

    $('.no-txtBtn .city-list .city-cont').css({height:screenH6});
    $('.no-txtBtn .district-list ul').css({height:screenH6});
}

function callbacktest(val) {
    console.log('callback:', val);
    fn_movieMainListChg(val);
}

$(document).on("click", ".ico-alarm", function() {
    AppDomain.Setting.notiBox();
});


/*
 * 액션 컨트롤
 *  중복 실행 방지문 : if(controlAction.isExec()) return;
 *  실행문 : controlAction.on();
 *  종료문 : controlAction.off();
 *  타임셋 : controlAction.setDelay(1); // 파라미터는 초단위
 */
var controlAction = {
    status : false,
    dataLoad : false,
    delayTime : null,
    isExec : function() {
        return this.status;
    },
    on : function() {
        this.status = true;
    },
    off : function() {
        if(this.delayTime) clearTimeout(this.delayTime);
        this.status = false;
    },
    setDelay : function(sec) {
        var that = this;
        sec = sec || 1;
        that.status = true;
        that.delayTime = setTimeout(function(){
            that.status = false;
            clearTimeout(that.delayTime);
        }, (sec*1000));
    },
    isLoading : function() {
        return this.dataLoad;
    },
    onLoad : function() {
        this.dataLoad = true;
    },
    offLoad : function() {
        this.dataLoad = false;
    }
};


//BOB 옮겨감


/* 이벤트 */
var Event = function() {
	// 이벤트상세
	// AppHeader.Event.detail
    this.detail = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '이벤트 상세'
            },
            btnLeft: {
                type: 'back'
            },
            btnRight: {
                type: 'sub',
                image: 'ico-share',
                callback: 'fn_snsShare'
            }
    };

    // 참여 이벤트 (나의 이벤트 응모내역)
    // AppHeader.Event.myEvent
    this.myEvent = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '나의 응모내역'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 이벤트 당첨자발표 상세
    // AppHeader.Event.winnerDetail
    this.winnerDetail = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '당첨자 발표'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 투표결과(이벤트상세)
    // AppHeader.Event.detailResult
    this.detailResult = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '이벤트 상세'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 배너오픈 등
    // AppHeader.Event.openUrl
    this.openUrl = function(title) {
    	var data = {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: title || '소식'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup'
        };
    	return data;
    };
};

/* 예매 */
var Booking = function() {
	// 예매상세
	// AppHeader.Booking.detail
	this.detail = function(closeAction) {
		if (!closeAction) closeAction = 'fn_ticketClose';
		var data = {
		        header: {
		            type: 'default',
		            bgColor: '201D3E',
		            txtColor: 'ffffff',
		            closeAction : closeAction
		        },
		        title: {
		            type: 'text',
		            text: '예매상세'
		        },
		        btnRight: {
		            type: 'close',
		            txtColor: 'ffffff'
		        },
		        animation: 'popup'
	    };
		return data;
	};

    // 영화별 예매
    // AppHeader.Booking.movie
	this.movie = function(closeAction) {
		if (!closeAction) closeAction = 'fn_goback';
		var data = {
		        header: {
		            type: 'default',
		            bgColor: '160F2B',
		            txtColor: 'ffffff',
		            closeAction: closeAction
		        },
		        title: {
		            type: 'text',
		            text: '영화별 예매'
		        },
		        btnLeft: {
		            type: 'back',
		            txtColor: 'ffffff'
		        },
		        btnRight: {
		            type: 'sub',
		            image: 'ico-list-block-w',
		            callback: 'fn_changeMovie'
		        }
	    };
		return data;
	};

    // 극장별 예매
    // AppHeader.Booking.theater
    this.theater = {
	        header: {
	            type: 'default',
	            bgColor: '160F2B',
	            txtColor: 'ffffff'
	        },
	        title: {
	            type: 'text',
	            text: '극장별 예매'
	        },
	        btnLeft: {
	            type: 'back',
	            txtColor: 'ffffff'
	        }
    };

    // 대관예매
	// AppHeader.Booking.privateBooking
	this.privateBooking = {
	        header: {
	            type: 'default'
	        },
	        title: {
	            type: 'text',
	            text: '더 부티크 프라이빗'
	        },
	        btnLeft: {
	            type: 'back'
	        }
    };

    // 모바일티켓
    // AppHeader.Booking.mobileTicket
	this.mobileTicket = function(closeAction) {
		if (!closeAction) closeAction = 'fn_ticketClose';
		var data = {
		        header: {
		            type: 'default',
		            overlay: 'clear',
		            bgColor: 'opacity',
		            txtColor: 'ffffff',
		            closeAction : closeAction
		        },
		        title: {
		            type: 'text',
		            text: '모바일 티켓'
		        },
		        btnRight: {
		            type: 'close'
		        },
		        animation: 'popup'
	    };
		return data;
	}

    // 좌석도
    // AppHeader.Booking.seat
    this.seat = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '좌석선택'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 결제하기
    // AppHeader.Booking.pay
    this.pay = {
            header: {
                type: 'default',
                bgColor: '201D3E',
                txtColor: 'ffffff',
                closeAction: 'fn_goSeat'
            },
            title: {
                type: 'text',
                text: '결제하기'
            },
            btnLeft: {
                type: 'back',
                txtColor: 'ffffff'
            }
    };

    // 영화예매(영화선택)
    // AppHeader.Booking.movieReserve
    this.movieReserve = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '영화 선택'
            },
            btnLeft: {
                type: 'sub',
                image: 'ico-list-line',
                callback: 'fn_changeViewType'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 극장예매(극장선택)
    // AppHeader.Booking.theaterReserve
    this.theaterReserve = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '극장 선택'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 식음료 신청
    // AppHeader.Booking.foodRequest
    this.foodRequest = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '식음료 신청'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 예매완료
    // AppHeader.Booking.finish
    this.finish = {
            header: {
                type: 'default',
                bgColor: '201D3E',
                txtColor: 'ffffff'
            },
            title: {
                type: 'text',
                text: '예매상세'
            },
            btnRight: {
                type: 'close',
                txtColor: 'ffffff'
            },
            animation: 'popup'
    };

    // 티켓나누기
    // AppHeader.Booking.shareTicket
    this.shareTicket = {
            header: {
                type: 'default',
                closeAction : 'fn_ticketDtl'
            },
            title: {
                type: 'text',
                text: '티켓나누기'
            },
            btnRight: {
                type: 'close'
            },
            animation : 'popup'
    };

    // 비회원 예매 내역
    // AppHeader.Booking.nonMember
    this.nonMember = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '비회원 예매 내역'
            },
            btnLeft: {
                type: 'back'
            },
            btnRight: {
                type: 'menu'
            }
    };
};

/* 영화 */
var Movie = function() {
    // 영화상세
	// AppHeader.Movie.detail
    this.detail = {
	        header: {
	            type: 'button',
	            overlay: 'clear',
	            bgColor: 'opacity',
	            txtColor: 'ffffff'
	        },
	        title: {
	            type: 'none'
	        },
	        btnLeft: {
	            type: 'back'
	        },
	        btnRight: {
	            type: 'sub',
	            image: 'ico-share-w',
	            callback: 'fn_shareBox'
	        }
    };

    // 한줄평
    // AppHeader.Movie.oneLineWrite
    this.oneLineWrite = function(onelnEvalDivCd) {
    	var title = onelnEvalDivCd == "PREV" ? "실관람평 작성" : "기대평 작성";
    	var data = {
    	        header: {
    	            type: 'default',
    	            closeAction: 'gfn_selLayerCls'
    	        },
    	        title: {
    	            type: 'text',
    	            text: title
    	        },
    	        btnRight: {
    	            type: 'close'
    	        },
    	        animation: 'popup'
        };
    };

    // 무비포스트
    // AppHeader.Movie.moviePost
    this.moviePost = {
	        header: {
	            type: 'default'
	        },
	        title: {
	            type: 'text',
	            text: '무비포스트'
	        },
	        btnLeft: {
	            type: 'back'
	        },
	        btnRight: {
	            type: 'menu'
	        },
	        btnRightSub: {
	            type: 'sub',
	            image: 'ico-pencil',
	            callback: 'fn_writeMoviePost'
	        }
    };

    // 무비포스트 상세
    // AppHeader.Movie.postDetail
    this.postDetail = {
	        header: {
	            type: 'default'
	        },
	        title: {
	            type: 'text',
	            text: '무비포스트 상세'
	        },
	        btnRight: {
	            type: 'close'
	        }
    };

    // 무비포스트 작성
    // AppHeader.Movie.postWrite
    this.postWrite = {
	        domain: '/moviepost/writePost',
	        header: {
	            type: 'default'
	        },
	        title: {
	            type: 'text',
	            text: '무비포스트 작성'
	        },
	        btnRight: {
	            type: 'close'
	        },
	        animation: 'popup'
    };

    // 큐레이션
    // AppHeader.Movie.curation
    this.curation = {
	        header: {
	            type: 'default'
	        },
	        title: {
	            type: 'text',
	            text: '큐레이션'
	        },
	        btnLeft: {
	            type: 'back'
	        }
    };

    // 영화목록
    // AppHeader.Movie.list
    this.list = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '영화'
            },
            btnLeft: {
                type: 'back'
            },
            btnRight: {
                type: 'menu'
            },
            btnRightSub: {
                type: 'sub',
                image: 'ico-search',
                callback: 'fn_movieSearch'
            }
    };

    // 영화상세 스틸컷
    // AppHeader.Movie.stillcutPhotoView
    this.stillcutPhotoView = function(movieName) {
    	var data = {
    			header: {
    				type: 'default',
    				bgColor: '0b0b0b',
    				txtColor: 'ffffff'
    			},
    			title: {
    				type: 'text',
    				text: movieName
    			},
    			btnRight: {
    				type: 'close',
    				txtColor : 'ffffff'
    			},
    			animation: 'popup'
        };
    };

    // 영화검색
    // AppHeader.Movie.search
    this.search = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '영화검색'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 영화관
    // AppHeader.Movie.theater
    this.theater = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '영화관'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 무비포스트 영화 선택
    // AppHeader.Movie.postRegister
    this.postRegister = {
            header: {
                type: 'default',
                closeAction: 'gfn_selLayerCls'
            },
            title: {
                type: 'text',
                text: '무비포스트 영화 선택'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };
};

/* 멤버십 */
var Membership = function() {
	// 스페셜멤버십 가입
	// AppHeader.Membership.filmJoin
    this.filmJoin = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '스페셜멤버십 가입'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 스페셜멤버십 가입
    // AppHeader.Membership.classicJoin
    this.classicJoin = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '스페셜멤버십 가입'
            },
            btnLeft: {
                type: 'back'
            }
    };
};

/* 메가핫딜 */
var Hotdeal = function () {
	// 메가핫딜 목록
	// AppHeader.Hotdeal.list
    this.list = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '메가핫딜'
            },
            btnLeft: {
                type: 'back'
            },
            btnRight: {
                type: 'menu'
            },
            btnRightSub: {
                type: 'sub',
                image: 'ico-info',
                callback: 'fn_openDtailPop'
            }
    };

    // 메가핫딜 상세
    // AppHeader.Hotdeal.detail
    this.detail = function(movieNm) {
    	var data = {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: movieNm
                },
                btnLeft: {
                    type: 'back'
                },
                btnRight: {
                    type: 'sub',
                    image: 'ico-share',
                    callback: 'fn_shareBox'
                }
        };
    	return data
    };

    // 임시예매권
    // AppHeader.Hotdeal.tempTicket
    this.tempTicket = {
	        header: {
	            type: 'default'
	        },
	        title: {
	            type: 'text',
	            text: '임시예매권'
	        },
	        btnLeft: {
	            type: 'back'
	        }
    };

    // 메가핫딜 안내
    // AppHeader.Hotdeal.guide
    this.guide = {
            header: {
                type: 'default',
                bgColor: 'f5f4f4'
            },
            title: {
                type: 'text',
                text: ''
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };
};

/* 극장 */
var Theater = function() {
	// 대관예매
	// AppHeader.Theater.privateBooking
	this.privateBooking = {
	        header: {
	            type: 'default'
	        },
	        title: {
	            type: 'text',
	            text: '더 부티크 프라이빗'
	        },
	        btnLeft: {
	            type: 'back'
	        }
    };

    // 극장목록
	// AppHeader.Theater.list
    this.list = {
	        header: {
	            type: 'default'
	        },
	        title: {
	            type: 'text',
	            text: '극장선택'
	        },
	        btnLeft: {
	            type: 'back'
	        }
    };

    // 극장상세
    // AppHeader.Theater.detail
    this.detail = {
	        header: {
	            type: 'default'
	        },
	        title: {
	            type: 'text',
	            text: '극장상세'
	        },
	        btnLeft: {
	            type: 'back'
	        }
    };

    // 특별관
    // AppHeader.Theater.specialDetail
    this.specialDetail = function(kindCd) {
    	var data = {
    	        header: {
    	            type: 'default'
    	        },
    	        title: {
    	            type: 'picker',
    	            text: '특별관',
    	            action: {
    	                type: 'click',
    	                callback: 'fn_specialLayerOpn'
    	            }
    	        },
    	        btnLeft: {
    	            type: 'back'
    	        }
        };

    	if(kindCd == 'TBQ') {
            data.title.text = 'THE BOUTIQUE';
        }
        else if(kindCd == 'MX') {
            data.title.text = 'MX';
        }
        else if(kindCd == 'CFT') {
            data.title.text = 'COMFORT';
        }
        else if(kindCd == 'MKB') {
            data.title.text = 'MEGA KIDS';
        }
        else if(kindCd == 'TFC') {
            data.title.text = 'THE FIRST CLUB';
        }
        else if(kindCd == 'BCY') {
            data.title.text = 'BALCONY M';
        }

    	return data;
    };

    // 관람료(지역코드, 극장코드)
    // AppHeader.Theater.admissionFeeArea
    this.admissionFeeArea = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '관람료'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 관람료
    // AppHeader.Theater.admissionFee
    this.admissionFee = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '관람료'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 관람료
    // AppHeader.Theater.specialAdmissionFee
    this.specialAdmissionFee = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '관람료'
            },
            btnLeft: {
                type: 'back'
            }
    };
};

/* 나의메가박스 */
var MyMegabox = function() {
	// 예매/구매 내역
	// AppHeader.MyMegabox.bookinglist
	this.bookinglist = {
        	header: {
	            type: 'default'
	        },
	        title: {
	            type: 'text',
	            text: '예매/구매 내역'
	        },
	        btnLeft: {
	            type: 'back'
	        }
    };

	// 무비스토리
	// AppHeader.MyMegabox.movieStory
	this.movieStory = {
		    header: {
		        type: 'default'
		    },
		    title: {
		        type: 'text',
		        text: '나의 무비스토리'
		    },
		    btnLeft: {
		        type: 'back'
		    },
		    btnRight: {
		        type: 'menu'
		    }
    };

	// 쿠폰목록
	// AppHeader.MyMegabox.coupon
    this.coupon = {
	        header: {
	            type: 'default'
	        },
	        title: {
	            type: 'text',
	            text: '쿠폰'
	        },
	        btnLeft: {
	            type: 'back'
	        },
	        btnRight: {
	            type: 'menu'
	        },
	        btnRightSub: {
	            type: 'sub',
	            image: 'ico-info',
	            callback: 'fn_cponLayerOpn'
	        }
    };

    // 영화관람권
    // AppHeader.MyMegabox.movieCoupon
    this.movieCoupon = {
	        header: {
	            type: 'default'
	        },
	        title: {
	            type: 'text',
	            text: '영화관람권'
	        },
	        btnLeft: {
	            type: 'back'
	        },
	        btnRight: {
	            type: 'menu'
	        },
	        btnRightSub: {
	            type: 'sub',
	            image: 'ico-info',
	            callback: 'fn_mvtckInfoOpn'
	        }
    };

    // 스토어교환권
    // AppHeader.MyMegabox.storeCoupon
    this.storeCoupon = {
	        header: {
	            type: 'default'
	        },
	        title: {
	            type: 'text',
	            text: '스토어교환권'
	        },
	        btnLeft: {
	            type: 'back'
	        },
	        btnRight: {
	            type: 'menu'
	        },
	        btnRightSub: {
	            type: 'sub',
	            image: 'ico-info',
	            callback: 'fn_mvtckInfoOpn'
	        }
    };

    // 멤버십 등급이력
    // AppHeader.MyMegabox.mbshipClassHist
    this.mbshipClassHist = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '멤버십 등급 이력'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 멤버십 포인트 내역
    // AppHeader.MyMegabox.pointList
    this.pointList = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '멤버십포인트'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 포인트 선물하기
    // AppHeader.MyMegabox.mbshipPointGift
    this.mbshipPointGift = {
             header: {
                 type: 'default'
             },
             title: {
                 type: 'text',
                 text: '포인트 선물하기'
             },
             btnLeft: {
                 type: 'back'
             }
    };

    // 포인트 비밀번호 설정
    // AppHeader.MyMegabox.mbshipPointChage
    this.mbshipPointChage = {
             header: {
                 type: 'default'
             },
             title: {
                 type: 'text',
                 text: '포인트 비밀번호 설정'
             },
             btnLeft: {
                 type: 'back'
             }
    };

    // 메가박스 쿠폰등록 페이지
    // AppHeader.MyMegabox.mageboxCouponReg
    this.mageboxCouponReg = {
            header: {
                type: 'default',
                closeAction : 'fn_closeEvent'
            },
            title: {
                type: 'text',
                text: ''
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 기프트카드 리스트
    // AppHeader.MyMegabox.giftCardList
    this.giftCardList = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '나의 기프트카드'
            },
            btnLeft: {
                type: 'back'
            },
            btnRight: {
                type: 'menu'
            }
    };

    // 비회원 예매/구매내역
    // AppHeader.MyMegabox.paymentNonHist
    this.paymentNonHist = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '예매/구매 내역'
            },
            btnLeft: {
                type: 'back'
            },
            btnRight: {
                type: 'menu'
            }
    };

    // 영화관람권/ 스토어 교환권 상세
    // AppHeader.MyMegabox.mvtckDetail
    this.mvtckDetail = function(title) {
    	var data = {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: title + ' 상세'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup'
        };
    	return data;
    };


    // 예매/구매내역 상세 헤더
    // AppHeader.MyMegabox.headerPaymentHistDetail
    this.headerPaymentHistDetail = function(title) {
    	var data = {
    			header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: title + ' 상세'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup'
        };
    	return data;
    };

    // 환불 수수료 결제
    // AppHeader.MyMegabox.paymentFdkDetail
    this.paymentFdkDetail = {
            header: {
                type: 'default',
                bgColor: '000000',
                txtColor: 'ffffff',
                closeAction : 'gfn_selLayerClsMsg'
            },
            title: {
                type: 'text',
                text: '결제취소'
            },
            btnRight: {
                type: 'close',
                txtColor: 'ffffff'
            },
            animaation: 'popup'
    };

    // 나만의 메가박스
    // AppHeader.MyMegabox.myOwnMegabox
    this.myOwnMegabox = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '나의 메가박스'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 선호 영화관 설정
    // AppHeader.MyMegabox.favorBrchListConf
    this.favorBrchListConf = {
    		header: {
    			type: 'default'
    		},
    		title: {
    			type: 'text',
    			text: '선호 영화관 설정'
    		},
    		btnRight: {
    			type: 'close'
    		},
    		animation: 'popup'
    };

    // 본 영화 등록
    // AppHeader.MyMegabox.watchedMovieReg
    this.watchedMovieReg = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '본 영화 등록'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 내 정보 관리
    // AppHeader.MyMegabox.myInfoMng
    this.myInfoMng = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '내 정보 관리'
            },
            btnLeft: {
                type: 'back'
            },
            btnRight: {
                type: 'menu'
            }
    };

    // 문의내역
    // AppHeader.MyMegabox.qnaList
    this.qnaList = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '나의 문의내역'
            },
            btnLeft: {
                type: 'back'
            },
            btnRight: {
                type: 'menu'
            }
    };

    // 문의내역 상세
    // AppHeader.MyMegabox.qnaDetail
    this.qnaDetail = function(title) {
    	var data = {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: title +' 상세'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup'
        };
    	return data;
    };

    // 이벤트 응모내역
    // AppHeader.MyMegabox.eventEntryHist
    this.eventEntryHist = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '나의 응모내역'
            },
            btnLeft: {
                type: 'back'
            },
            btnRight: {
                type: 'menu'
            }
    };

    // 스페셜 멤버십 가입
    // AppHeader.MyMegabox.specialMembership
    this.specialMembership = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '스페셜 멤버십'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // VIP 쿠폰북 안내
    // AppHeader.MyMegabox.vipCouponBookGuide
    this.vipCouponBookGuide = {
            header: {
                type: 'default',
                overlay: 'clear',
                bgColor: '160F2B',
                txtColor: 'ffffff'
            },
            title: {
                type: 'text',
                text: 'VIP 쿠폰북'
            },
            btnRight: {
                type: 'close',
                txtColor: 'ffffff'
            },
            animation: 'popup'
    };

    // VIP 쿠폰북 선택
    // AppHeader.MyMegabox.vipCouponBook
    this.vipCouponBook = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: 'VIP 쿠폰북'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // VIP 쿠폰북 최종 선택
    // AppHeader.MyMegabox.vipCouponBookFinal
    this.vipCouponBookFinal = function(thisYear) {
    	var data = {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: thisYear +' VIP 쿠폰북 선택'
                },
                btnLeft: {
                    type: 'back'
                }
        };
    	return data;
    };

    // 나의 문의내역
    // AppHeader.MyMegabox.myinquiry
    this.myinquiry = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '나의 문의내역'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 주문내역/멤버쉽카드
    // AppHeader.MyMegabox.myTicketMember
    this.myTicketMember = {
            header: {
                type: 'default',
                overlay: 'clear',
                bgColor: 'opacity',
                txtColor: 'ffffff'
            },
            title: {
                type: 'logo'
            },
            btnLeft: {
                type: 'sub',
                image: 'ico-barcode-w',
                callback: 'ticket',
                params: 'membership',
                txtColor: 'ffffff'
            },
            btnRight: {
                type: 'close',
                txtColor: 'ffffff'
            },
            animation: 'popup'
    };

    // 자주쓰는 할인수단
    // AppHeader.MyMegabox.favorUsePayDcMean
    this.favorUsePayDcMean = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '자주쓰는 할인수단'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 마케팅 정보 수신동의
    // AppHeader.MyMegabox.marketingAgree
    this.marketingAgree = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '마케팅 정보 수신동의'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 비밀번호 변경
    // AppHeader.MyMegabox.changePassword
    this.changePassword = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '비밀번호 변경'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 회원정보관리
    // AppHeader.MyMegabox.myInfo
    this.myInfo = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '회원정보 관리'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 쿠폰상세
    // AppHeader.MyMegabox.dcCouponDetail
    this.dcCouponDetail = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '쿠폰상세'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 모바일티켓
    // AppHeader.MyMegabox.mobileTicket
    this.mobileTicket = {
	        header: {
	            type: 'default',
	            overlay: 'clear',
	            bgColor: 'opacity',
	            txtColor: 'ffffff',
	            closeAction : 'fn_ticketClose'
	        },
	        title: {
	            type: 'text',
	            text: '모바일 티켓'
	        },
	        btnRight: {
	            type: 'close'
	        },
	        animation: 'popup'
    };
};

/* 혜택 */
var Benefit = function() {
	// VIP LOUNGE
	// AppHeader.Benefit.viplounge
	this.viplounge = {
	        header: {
	            type: 'default',
	            overlay: 'clear',
	            bgColor: 'opacity',
	            txtColor: 'ffffff'
	        },
	        title: {
	            type: 'text',
	            text: ''
	        },
	        btnLeft: {
	            type: 'back',
	            txtColor: 'ffffff'
	        }
    };

	// 멤버십 안내
	// AppHeader.Benefit.mbshipGuide
	this.mbshipGuide = {
	        header: {
	            type: 'default'
	        },
	        title: {
	            type: 'text',
	            text: '메가박스 멤버십'
	        },
	        btnLeft: {
	            type: 'back'
	        }
    };

	// 제휴/할인
	// AppHeader.Benefit.discountGuide
	this.discountGuide = {
	        header: {
	            type: 'default'
	        },
	        title: {
	            type: 'text',
	            text: '제휴/할인'
	        },
	        btnLeft: {
	            type: 'back'
	        },
	        btnRight: {
	            type: 'menu'
	        },
	        btnRightSub: {
	            type: 'sub',
	            image: 'ico-search',
	            callback: 'AppHeader.Benefit.discountGuideSearch'
	        }
    };

    // 포인트 상세 안내
    // AppHeader.Benefit.pointDetailGuide
    this.pointDetailGuide = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '포인트 상세 안내'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 중앙멤버십 신청
    // AppHeader.Benefit.jggMbshipRequest
    this.jggMbshipRequest = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '중앙멤버십 신청하기'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // VIP 스템프 미션
    // AppHeader.Benefit.vipStampMission
    this.vipStampMission = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: 'VIP 스탬프 미션'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 제휴/할인 검색
    // AppHeader.Benefit.discountGuideSearch
    this.discountGuideSearch = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '제휴/할인 검색'
            },
            btnLeft: {
                type: 'back'
            },
            btnRight: {
                type: 'menu'
            }
    };
};

/* 멤버 */
var Member = function() {
    // 로그인
    // AppHeader.Member.login
    this.login = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '로그인'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 비회원로그인
    // AppHeader.Member.login
    this.loginNon = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '비회원 로그인'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 회원가입
    // AppHeader.Member.join
    this.join = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '회원가입'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // ID/PW찾기
    // AppHeader.Member.findIdPwd
    this.findIdPwd = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '아이디/비밀번호찾기'
            },
            btnLeft: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 회원 재인증
    // AppHeader.Member.findIdPwd
    this.memberCheck = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '회원 재인증'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 회원가입 - 회원정보입력
    // AppHeader.Member.infoRegister
    this.infoRegister = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '정보입력'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 회원가입완료
    // AppHeader.Member.signup
    this.signup = {
	        header: {
	            type: 'default'
	        },
	        title: {
	            type: 'text',
	            text: '회원가입 완료'
	        },
	        btnRight: {
	            type: 'close'
	        },
	        animation: 'popup'
    };
};

/* 극장 */
var Brch = function() {
    // 극장메인
	// AppHeader.Brch.brchMain
    this.brchMain = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '영화관'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };
};

/* 설정 */
var Setting = function() {
	// 알림함
	// AppHeader.Setting.notification
    this.notification = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '알림함'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 설정
    // AppHeader.Setting.main
    this.main = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '설정'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 선호극장설정
    // AppHeader.Setting.favorTheater
    this.favorTheater = {
	        header: {
	            type: 'default'
	        },
	        title: {
	            type: 'text',
	            text: '선호극장설정'
	        },
	        btnRight: {
	            type: 'close'
	        },
	        animation: 'popup'
    };
};

/* 고객센터 */
var Support = function() {
	// 고객센터
	// AppHeader.Support.main
    this.main = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '고객센터'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 이용약관
    // AppHeader.Support.terms
    this.terms = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '이용약관'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 개인정보 취급 방침
    // AppHeader.Support.privacy
    this.privacy = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '고객정보 취급 방침'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 공지사항
    // AppHeader.Support.notice
    this.notice = {
	        header: {
	            type: 'default'
	        },
	        title: {
	            type: 'text',
	            text: '공지사항'
	        },
	        btnLeft: {
	            type: 'back'
	        }
    };

    // 공지사항 상세
    // AppHeader.Support.noticeDetail
    this.noticeDetail = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '공지사항'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 자주묻는 질문
    // AppHeader.Support.faq
    this.faq = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '자주묻는 질문'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 문의내역 상세
    // AppHeader.Support.qnaDetail
    this.qnaDetail = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '문의내역 상세'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 1:1 문의
    // AppHeader.Support.inquiry
    this.inquiry = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '1:1 문의'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 분실물문의/접수
    // AppHeader.Support.lostForm
    this.lostForm = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '분실물문의/접수'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 분실물문의
    // AppHeader.Support.lose
    this.lose = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '분실물문의'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 단체관람 및 대관문의
    // AppHeader.Support.rent
    this.lent = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '단체관람 및 대관문의'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 앱개선문의
    // AppHeader.Support.app
    this.app = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '앱개선문의'
            },
            btnLeft: {
                type: 'back'
            }
    };
};

/* 스토어 */
var Store = function() {
	// 상세
	// AppHeader.Store.detail
	this.detail = {
	        header: {
	            type: 'default'
	        },
	        title: {
	            type: 'text',
	            text: '상품상세'
	        },
	        btnLeft : {
	            type: 'back'
	        }
    };

	// 사용가능 극장
	// AppHeader.Store.storeUseBrchHeader
    this.storeUseBrchHeader = {
	        header: {
	            type: 'default'
	        },
	        title: {
	            type: 'text',
	            text: '사용가능 극장'
	        },
	        btnRight: {
	            type: 'close'
	        },
	        animation: 'popup'
    };

    // 주문표
    // AppHeader.Store.comboOrder
    this.comboOrder = {
            header: {
                type: 'default',
                closeAction : 'fn_ticketClose'
            },
            title: {
                type: 'text',
                text: '주문내역'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 결제
    // AppHeader.Store.payment
    this.payment = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '결제하기'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 선물하기
    // AppHeader.Store.gift
    this.gift = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '선물하기'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 결제 완료
    // AppHeader.Store.payComplete
    this.payComplete = {
            header: {
                type: 'default',
                closeAction : 'AppHandler.Common.goStore'
            },
            title: {
                type: 'text',
                text: '구매완료'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };
};

/* 모바일오더 */
var MobileOrder = function() {
	// 모바일오더 안내
	// AppHeader.MobileOrder.guide
    this.guide = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '모바일오더'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 모바일오더 메뉴 목록
    // AppHeader.MobileOrder.list
    this.list = {
            header: {
                type: 'default',
                overlay: 'clear',
                bgColor: 'opacity',
                txtColor: '000000'
            },
            title: {
                type: 'text',
                text: "모바일오더"
            },
            btnLeft: {
                type: 'back',
                txtColor: '000000'
            },
            btnRight: {
                type: 'sub',
                image: 'ico-cart',
                txtColor: '000000',
                callback: 'fn_mvBasketPV'
            }
    };

    // 장바구니
    // AppHeader.MobileOrder.cart
    this.cart = {
    		header: {
                type: 'default',
                closeAction: 'fn_mvCmboMenu'  //fn_goCmboMenu
            },
            title: {
                type: "text",
                text: "장바구니"
            },
            btnLeft: {
                type: 'back'
            }
    };


    // 모바일오더 메뉴 -> 스토어교환권 레이어
    // AppHeader.MobileOrder.comboSearchVcCmbnd
    this.comboSearchVcCmbnd = {
    		header: {
    			type: 'default'
    		},
    		title: {
    			type: 'text',
    			text: '스토어 교환권'
    		},
    		btnRight: {
    			type: 'close'
    		},
    		animation: 'popup'
    };

    // 결제
    // AppHeader.MobileOrder.payment
    this.payment = {
    		header: {
    			type: 'default'
    		},
    		title: {
    			type: 'text',
    			text: '결제하기'
    		},
    		btnLeft: {
    			type: 'back'
    		}
    };

    // 상세
    // AppHeader.MobileOrder.detail
    this.detail = {
    		header: {
    			type: 'default'
    		},
    		title: {
    			type: 'text',
    			text: '상품상세'
    		},
    		btnLeft: {
    			type: 'back'
    		},
    		btnRight: {
    			type: 'sub',
    			image: 'ico-cart',
    			callback: 'fn_mvBasketPV'
    		}
    };
};

/**
 * 주소 별 해더 매핑
 * App 에서 호출
 */
var Mapping = function() {
	this.path = function(sPageUrl) {
		// 영화 상세
		if (sPageUrl.indexOf('/movie-detail') == 0) {
			return AppHeader.Movie.detail;
		}
		// 한줄평
		if (sPageUrl.indexOf('/movie/oneline-review') == 0) {
			var onelnEvalDivCd = '';
			var aUrl = sPageUrl.split('?');
			if (aUrl.length > 1) {
				var aParams = aUrl[1].split('&');
				for (var i=0; i<aParams.length; i++) {
					var aMap = aParams[i].split('=');
					if (aMap[0] == 'onelnEvalDivCd' && aMap.length > 0) {
						onelnEvalDivCd = aMap[1];
						break;
					}
				}
			}
			return AppHeader.Movie.oneLineWrite(onelnEvalDivCd);
		}
		// 무비포스트
		else if (sPageUrl.indexOf('/moviepost') == 0) {
			return AppHeader.Movie.moviePost;
		}
		// 무비포스트 상세
		else if (sPageUrl.indexOf('/moviepost/detail') == 0) {
			return AppHeader.Movie.postDetail;
		}
		// 큐레이션 - 소개
		else if (sPageUrl.indexOf('/curation/specialcontent') == 0) {
			return AppHeader.Movie.curation;
		}
		// 큐레이션 - 클래식
		else if (sPageUrl.indexOf('/curation/classicsociety') == 0) {
			return AppHeader.Movie.curation;
		}
		// 큐레이션 - 필름
		else if (sPageUrl.indexOf('/curation/filmsociety') == 0) {
			return AppHeader.Movie.curation;
		}
		//스토어 상세
		else if (sPageUrl.indexOf('/store/detail') == 0) {
			return AppHeader.Store.detail;
		}
		// 모바일오더 안내
		else if (sPageUrl.indexOf('/mobile-order/guide') == 0) {
			return AppHeader.MobileOrder.guide;
		}
		// 예매 - 영화별
		else if (sPageUrl.indexOf('/booking/movie') == 0) {
			return AppHeader.Booking.bookingMovie();
		}
		// 예매 - 극장별
		else if (sPageUrl.indexOf('/booking/theater') == 0) {
			return AppHeader.Booking.bookingTheater;
		}
		// 예매 - 대관
		else if (sPageUrl.indexOf('/booking/privatebooking') == 0) {
			return AppHeader.Booking.privateBooking;
		}
		// 모바일티켓
		// TODO: - 상영시간이 종료되었으면 예매내역으로
		else if (sPageUrl.indexOf('/mypage/mobileticket') == 0) {
			return AppHeader.MyMegabox.mobileTicket;
		}
		// 예매/구매내역
		// - 상영시간이 종료되지 않았으면 모바일티켓으로
		else if (sPageUrl.indexOf('/mypage/bookinglist') == 0) {
			var headerData = AppHeader.MyMegabox.bookinglist;

			var aUrl = sPageUrl.split('?');
			if (aUrl.length > 1) {
				var aQuery = aUrl[1].split('&');
				for (var i=0; i<aQuery.length; i++) {
					var aParams = aQuery[i].split('=');
					if (aParams.length > 1 && aParams[0] == 'tranNo') {
						$.ajax({
				            url: "/api/booking/validate",
				            type: "POST",
				            contentType: "application/json;charset=UTF-8",
				            async: false,
				            data: JSON.stringify({
				            	tranNo: aParams[1]
				            }),
				            success: function (data, textStatus, jqXHR) {
								if (data) {
									var bokdType = "";
									if(data.sellPrdtKindCd == "SPD53") {
										bokdType = "private";
									}

									// 모바일티켓
									headerData = AppHeader.MyMegabox.mobileTicket;
									headerData.domain = '/mypage/mobileticket?tranNo='+aParams[1]+'&bokdType='+bokdType;

									if (data.friendYn) {
										// 프렌즈 멤버쉽 결제 일 때
										if (data.friendYn == 'Y') {
											// 예매상세
											headerData = AppHeader.Booking.finish;
										}
									}
								}
				            },
				            error: function(xhr,status,error) {
				            	console.log('/api/booking/validate Error');
				            }
				        });

						return headerData;
					}
				}
			}

			return headerData;
		}
		// 이벤트 상세
		else if (sPageUrl.indexOf('/event/detail') == 0) {
			return AppHeader.Event.detail;
		}
		// 멤버쉽
		else if (sPageUrl.indexOf('/mypage/point-list') == 0) {
			return AppHeader.MyMegabox.pointList;
		}
		// 영화관람권
		else if (sPageUrl.indexOf('/mypage/movie-coupon') == 0) {
			return AppHeader.MyMegabox.movieCoupon;
		}
		// 스토어교환권
		else if (sPageUrl.indexOf('/mypage/store-coupon') == 0) {
			return AppHeader.MyMegabox.storeCoupon;
		}
		// 쿠폰
		else if (sPageUrl.indexOf('/mypage/discount-coupon') == 0) {
			return AppHeader.MyMegabox.coupon;
		}
		else if (sPageUrl.indexOf('/myMegabox/discount') == 0) {
			return AppHeader.MyMegabox.coupon;
		}
		else if (sPageUrl.indexOf('/myMegabox/cooperation') == 0) {
			return AppHeader.MyMegabox.coupon;
		}
		// 나의무비스토리
		else if (sPageUrl.indexOf('/mypage/moviestory') == 0) {
			return AppHeader.MyMegabox.movieStory;
		}
		// 극장목록
		else if (sPageUrl.indexOf('/theater/list') == 0) {
			return AppHeader.Theater.list;
		}
		// 극장상세
		else if (sPageUrl.indexOf('/theater') == 0) {
			return AppHeader.Theater.detail;
		}
		// 특별관
		else if (sPageUrl.indexOf('/specialtheater') == 0) {
			var kindCd = '';
			var aUrl = sPageUrl.split('?');
			if (aUrl.length > 1) {
				var aParams = aUrl[1].split('&');
				for (var i=0; i<aParams.length; i++) {
					var aMap = aParams[i].split('=');
					if (aMap[0] == 'kindCd' && aMap.length > 0) {
						kindCd = aMap[1];
						break;
					}
				}
			}
			return AppHeader.Theater.specialDetail(kindCd);
		}
		// 멤버쉽 안내
		else if (sPageUrl.indexOf('/benefit/membership') == 0) {
			return AppHeader.Benefit.mbshipGuide;
		}
		// VIP라운지
		else if (sPageUrl.indexOf('/benefit/viplounge') == 0) {
			return AppHeader.Benefit.viplounge;
		}
		// 제휴/할인
		else if (sPageUrl.indexOf('/benefit/discount/guide') == 0) {
			return AppHeader.Benefit.discountGuide;
		}
		// 공지사항
		else if (sPageUrl.indexOf('/support/notice') == 0) {
			return AppHeader.Support.notice;
		}
		// 알림함
		else if (sPageUrl.indexOf('/setting/notification') == 0) {
			return AppHeader.Setting.notification;
		}
		else {
			var data = {
					header: {
						type: 'default'
					},
					title: {
						type: 'logo'
					},
					btnLeft: {
						type: 'back'
					}
			};
			return data;
		}
	};
};

var AppHeader = new function() {
    this.Event = new Event();
    this.Booking = new Booking();
    this.Movie = new Movie();
    this.Membership = new Membership();
    this.Hotdeal = new Hotdeal();
    this.Theater = new Theater();
    this.MyMegabox = new MyMegabox();
    this.Benefit = new Benefit();
    this.Member = new Member();
    this.Setting = new Setting();
    this.Support = new Support();
    this.Store = new Store();
    this.MobileOrder = new MobileOrder();
    this.Mapping = new Mapping();
}
/**
 * 화면 컨트롤 플래그 값
 */
var Flag = function() {
    // 새로고침사용:O, 전체창닫기:X, 현재창닫기:X
    this.isRefresh = {
            refresh: true, isCloseAll: false, isClose: false
    };
    // 새로고침사용:O, 전체창닫기:O, 현재창닫기:X
    this.isRefreshCloseAll = {
            refresh: true, isCloseAll: true, isClose: false
    };
    // 새로고침사용:O, 전체창닫기:X, 현재창닫기:O
    this.isRefreshClose = {
            refresh: true, isCloseAll: false, isClose: true
    };
    // 새로고침사용:X, 전체창닫기:O, 현재창닫기:X
    this.isCloseAll = {
            refresh: false, isCloseAll: true, isClose: false
    };
    // 새로고침사용:X, 전체창닫기:X, 현재창닫기:O
    this.isClose = {
            refresh: false, isCloseAll: false, isClose: true
    };
    // 새로고침사용:X, 전체창닫기:X, 현재창닫기:X
    this.isDefault = {
            refresh: false, isCloseAll: false, isClose: false
    };
};

/* 이벤트 */
var Event = function() {
    /**
     * 이벤트상세
     * AppDomain.Event.detail
     * @param data
     * - flag
     * - netfunnelAt
     * - params
     *   eventNo
     */
    this.detail = function(data) {
        if (!data) return;
        if (!data.params) return;
        if (!data.params.eventNo) return;

        if (!data.flag) data.flag = AppDomain.Flag.isDefault;
        if (!data.netfunnelAt) data.netfunnelAt = 'N';

        var openData = AppHeader.Event.detail;
        openData.domain = '/event/detail?eventNo='+data.params.eventNo;
        openData.refresh = data.flag.refresh;
        openData.isCloseAll = data.flag.isCloseAll;
        openData.isClose = data.flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 참여 이벤트 (나의 이벤트 응모내역)
     * AppDomain.Event.myEvent
     * @param data
     * - flag
     */
    this.myEvent = function(data) {
        if (!data) data = { flag: AppDomain.Flag.isDefault };
        if (!data.flag) data.flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Event.myEvent;
        openData.domain = '/mypage/myevent';
        openData.refresh = data.flag.refresh;
        openData.isCloseAll = data.flag.isCloseAll;
        openData.isClose = data.flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 이벤트 당첨자발표 상세
     * AppDomain.Event.winnerDetail
     * @param data
     * - flag
     * - params
     *   eventNo
     */
    this.winnerDetail = function(data) {
        if (!data) return;
        if (!data.params) return;
        if (!data.params.eventNo) return;

        if (!data.flag) data.flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Event.winnerDetail;
        openData.domain = '/event/winner/detail';
        openData.params = data.params;
        openData.refresh = data.flag.refresh;
        openData.isCloseAll = data.flag.isCloseAll;
        openData.isClose = data.flag.isClose;

        if (isApp()) {
            AppHandler.Common.href(openData);
        } else {
            gfn_moCusLayer(openData);
        }
    }

    /**
     * 투표결과(이벤트상세)
     * AppDomain.Event.detailResult
     * @param data
     * - flag
     * - params
     *   eventNo
     */
    this.detailResult = function(data) {
        if (!data) return;
        if (!data.params) return;
        if (!data.params.eventNo) return;

        if (!data.flag) data.flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Event.detailResult;
        openData.domain = '/event/detail/result';
        openData.params = data.params;
        openData.refresh = data.flag.refresh;
        openData.isCloseAll = data.flag.isCloseAll;
        openData.isClose = data.flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 배너오픈
     * AppDomain.Event.openUrl
     * @param data
     * - flag
     * - url
     * - title
     */
    this.openUrl = function(data) {
        if (!data) return;
        if (!data.url) return;

        if (!data.flag) data.flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Event.openUrl(data.title);
        openData.domain = data.url;
        openData.refresh = data.flag.refresh;
        openData.isCloseAll = data.flag.isCloseAll;
        openData.isClose = data.flag.isClose;

        AppHandler.Common.link(openData);
    }
}

/* 예매 */
var Booking = function() {
	/**
	 * 좌석도
	 * AppDomain.Booking.seat
	 * @param data
	 * - flag
	 * - params
	 *   playSchdlNo
	 *   admisClassCd
	 *   hotDealEventNo
	 *   startPoint
	 */
    this.seat = function(data) {
    	if (!data) return;
    	if (!data.params) return;

        if (!data.flag) data.flag = AppDomain.Flag.isDefault;

        if (!data.params.hotDealEventNo) {
            data.params.hotDealEventNo = '';
        }

        if(!data.params.startPoint) {
            data.params.startPoint = "/main";
        }

        var openData = AppHeader.Booking.seat;
        openData.domain = '/booking/seat';
        openData.params = data.params;
        openData.refresh = data.flag.refresh;
        openData.isCloseAll = data.flag.isCloseAll;
        openData.isClose = data.flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 좌석도 (form type)
     * AppDomain.Booking.seatForm
     * @param form
     * @param flag
     */
    this.seatForm = function(form, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Booking.seat;
        openData.domain = '/booking/seat';
        openData.refresh = flag.refresh;
        openData.isCloseAll = flag.isCloseAll;
        openData.isClose = flag.isClose;

        AppHandler.Common.submit(form, openData);

    };

    /**
     * 좌석도 (form type)
     * AppDomain.Booking.seatFormToHref
     * @param formId
     * @param flag
     */
    this.seatFormToHref = function(formId, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Booking.seat;
        openData.domain = '/booking/seat';
        openData.params = $("#"+formId).serializeObject();
        openData.refresh = flag.refresh;
        openData.isCloseAll = flag.isCloseAll;
        openData.isClose = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 결제하기
     * AppDomain.Booking.pay
     * @param form
     * @param flag
     */
    this.pay = function (form, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/on/oh/ohz/PayBooking/completeSeat.do',
                header: {
                    type: 'default',
                    bgColor: '201D3E',
                    txtColor: 'ffffff',
                    backAction: 'fn_goSeat'
                },
                title: {
                    type: 'text',
                    text: '결제하기'
                },
                btnLeft: {
                    type: 'back',
                    txtColor: 'ffffff'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.submit(form, data);
    };
    /*this.pay = function (form, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Booking.pay('fn_goSeat');
        openData.domain = '/on/oh/ohz/PayBooking/completeSeat.do';
        openData.refresh = flag.refresh;
        openData.isCloseAll = flag.isCloseAll;
        openData.isClose = flag.isClose;

        AppHandler.Common.submit(form, openData);
    };*/

    // 영화예매(영화선택)
    this.movieReserve = function (flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/booking/movie',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '영화 선택'
                },
                btnLeft: {
                    type: 'sub',
                    image: 'ico-list-line',
                    callback: 'fn_changeViewType'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    // 극장예매(극장선택)
    this.theaterReserve = function (isCloseAll, brchNo, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var strBrchNo = '';
        if(brchNo) {
            strBrchNo = brchNo;
        }

        var data = {
                domain: '/booking/theater',
                params: {
                    brchNo: strBrchNo
                },
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '극장 선택'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);

    };

    /**
     * 바로예매 (영화 정보 존재시)
     * AppDomain.Booking.quickBooking
     * @param data
     * - flag
     * - params
     *   movieNo
     *   theaterType
     *   imageUrl
     */
    this.quickBooking = function(data) {
        if (!data) return;
        if (!data.params) return;
        if (!data.params.movieNo) return;
        if (AppDomain.Interfere.click()) { return; }

        if (!data.flag) data.flag = AppDomain.Flag.isDefault;
        if (!data.params.theaterType) data.params.theaterType = '';

        var openData = AppHeader.Booking.movie('fn_goback');
        openData.domain = '/booking/movie';
        openData.params = data.params;
        openData.refresh = data.flag.refresh;
        openData.isCloseAll = data.flag.isCloseAll;
        openData.isClose = data.flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 극장별 예매 (극장 정보 존재시)
     * AppDomain.Booking.theaterReserveSchedule
     * @param data
     * - flag
     * - params
     *   brchNo
     */
    this.theaterReserveSchedule = function (brchNo, flag) {
        if (!data) return;
        if (!data.params) return;
        if (!data.params.brchNo) return;

        if (!data.flag) data.flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Booking.theater;
        openData.domain = '/booking/theater';
        openData.params = params;
        openData.refresh = flag.refresh;
        openData.isCloseAll = flag.isCloseAll;
        openData.isClose = flag.isClose;

        AppHandler.Common.href(openData);
    };

    // 식음료 신청
    this.foodRequest = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/on/oh/ohc/Brch/foodInfoPage.do',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '식음료 신청'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    // 모바일 티켓
    /**
     * 모바일 티켓
     * AppDomain.Booking.mobileTicket
     * @param data
     * - flag
     * - params
     *   tranNo
     *   bokdType
     */
    this.mobileTicket = function(data) {
    	if (!data) return;
    	if (!data.params) return;
    	if (!data.params.tranNo) return;

        if (!data.flag) data.flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Booking.mobileTicket('fn_ticketClose');
        openData.domain = '/mypage/mobileticket';
        openData.params = {
                imageType: 'TYPE1',  // 이미지 사이즈 타입 : 숫자가 클수록 사이즈가 작음 (TYPE1 이 약 200Kb)
                tranNo: data.params.tranNo,
                bokdType: data.params.bokdType
        };
        openData.refresh = data.flag.refresh;
        openData.isCloseAll = data.flag.isCloseAll;
        openData.isClose = data.flag.isClose;

        if (isApp()) {
            AppHandler.Common.href(openData);
        } else {
        	openData.layerHeaderBlockAt = 'Y';
        	openData.changeFunNmAt = 'N';
            gfn_moCusLayer(openData);
        }
    };

    //예매완료
    this.finish = function (form, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/booking/payment-successcomplete',
                header: {
                    type: 'default',
                    bgColor: '201D3E',
                    txtColor: 'ffffff'
                },
                title: {
                    type: 'text',
                    text: '예매상세'
                },
                btnRight: {
                    type: 'close',
                    txtColor: 'ffffff'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.submit(form, data);
    };

    /**
     * 예매상세
     * AppDomain.Booking.detail
     * @param data
     * - flag
     * - params
     *   completeTransNo
     */
    this.detail = function(data) {
        if (!data) return;
        if (!data.params) return;
        if (!data.params.completeTransNo) return;

        if (!data.flag) data.flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Booking.detail('fn_ticketClose');
        openData.domain = '/booking/payment-successcomplete';
        openData.params = data.params;
        openData.refresh = flag.refresh;
        openData.isCloseAll = flag.isCloseAll;
        openData.isClose = flag.isClose;

        if (isApp()) {
            AppHandler.Common.href(openData);
        } else {
            openData.layerHeaderBlockAt = 'Y';
            gfn_moCusLayer(openData);
        }
    };

    //티켓
    this.ticket = function (form, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;
        var data = {
                domain: '/mypage/mobileticket',
//                domain: '/on/oh/ohb/MobileTicket/viewMobileTicketPage.do',
                header: {
                    type: 'default',
                    overlay: 'clear',
                    bgColor: 'opacity',
                    txtColor: 'ffffff',
                    closeAction : 'fn_ticketClose'
                },
                title: {
                    type: 'text',
                    text: '모바일 티켓'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.submit(form, data);
    };

    //티켓
    this.ticketHref = function (paramData, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
            domain: '/mypage/mobileticket',
            header: {
                type: 'default'
            },
            params : paramData,
            title: {
                type: 'text',
                text: '모바일 티켓'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup',
            refresh: flag.refresh,
            isCloseAll: flag.isCloseAll,
            isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    // 티켓나누기
    this.shareTicket = function(sellTranNo, seatUniqNo, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/on/oh/ohb/MobileTicket/viewMobileTicketSharePage.do',
                params: {
                    sellTranNo: sellTranNo,
                    seatUniqNo: seatUniqNo
                },
                header: {
                    type: 'default',
                    closeAction : 'fn_ticketDtl'
                },
                title: {
                    type: 'text',
                    text: '티켓나누기'
                },
//                btnLeft: {
//                    type: 'back'
//                },
                btnRight: {
                    type: 'close'
                },
//                btnRightSub: {
//                    type: 'sub',
//                    image: 'ico-info',
//                    callback: ''  // TODO: javascript function name
//                },
                animation : 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    this.nonMember = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/non-member',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '비회원 예매 내역'
                },
                btnLeft: {
                    type: 'back'
                },
                btnRight: {
                    type: 'menu'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    }
}

var Movie = function () {
    var that = this;

    this.Headers = {
        detail: {
            header: {
                type: 'button',
                overlay: 'clear',
                bgColor: 'opacity',
                txtColor: 'ffffff'
            },
            title: {
                type: 'none'
            },
            btnLeft: {
                type: 'back'
            },
            btnRight: {
                type: 'sub',
                image: 'ico-share-w',
                callback: 'fn_shareBox'
            }
        },
        oneLineWrite: {
             header: {
                 type: 'default',
                 closeAction: 'gfn_selLayerCls'
             },
             title: {
                 type: 'text'
             },
             btnRight: {
                 type: 'close'
             },
             animation: 'popup'
        },
        moviePost: {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '무비포스트'
            },
            btnLeft: {
                type: 'back'
            },
            btnRight: {
                type: 'menu'
            },
            btnRightSub: {
                type: 'sub',
                image: 'ico-pencil',
                callback: 'fn_checkLoginSession',
                params: 'fn_writeMoviePost'
            }
        },
        postDetail: {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '무비포스트 상세'
            },
            btnRight: {
                type: 'close'
            }
        },
        postWrite: {
            domain: '/moviepost/writePost',
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '무비포스트 작성'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
        },
        curationIntroduce: {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '스페셜 멤버십'
            },
            btnLeft: {
                type: 'back'
            }
        },
        curationClassicsociety: {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '스페셜 멤버십'//'클레식소사이어티'
            },
            btnLeft: {
                type: 'back'
            }
        },
        curationFilmsociety: {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '스페셜 멤버십'//'필름소사이어티'
            },
            btnLeft: {
                type: 'back'
            }
        },
        curationDisney: {
          header: {
            type: 'default'
          },
          title: {
            type: 'text',
            text: '스페셜 멤버십'//'필름소사이어티'
          },
          btnLeft: {
            type: 'back'
          }
        }
    };

    this.genre = function() {
        that.list('genre');
    };

    //영화목록
    this.list = function(tabName, flag) {
        flag = flag || AppDomain.Flag.isDefault;

        var data = {
                domain: '/movie/' + tabName || 'boxoffice',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '영화'
                },
                btnLeft: {
                    type: 'back'
                },
                btnRight: {
                    type: 'menu'
                },
                btnRightSub: {
                    type: 'sub',
                    image: 'ico-search',
                    callback: 'fn_movieSearch'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        }

        AppHandler.Common.href(data);
    };

    //영화상세
    /*AppDomain.Movie.backwordDetail(rpstMovieNo, tabCd, backword);*/
    this.backwordDetail = function (rpstMovieNo, tabCd, backword, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.detail;
        data.domain = '/movie-detail';
        data.params = {
                rpstMovieNo: rpstMovieNo,
                tabCd: tabCd
        };

        if(backword){
            data.params.back = backword;
        }else{
            data.params.back = "";
        }

        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    };

    this.detail = function (rpstMovieNo, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.detail;
        data.domain = '/movie-detail';
        data.params = {
                rpstMovieNo: rpstMovieNo,
        };

        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    };

    this.detailBackBranch = function (brchNo1, brchNo2, brchNo3, brchNo4, brchNo5, playDe, movieNo, startPoint, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.detail;
        data.domain = '/movie-detail';
        data.params = {
            brchNo: brchNo1,
            brchNo1: brchNo1,
            brchNo2: brchNo2,
            brchNo3: brchNo3,
            brchNo4: brchNo4,
            brchNo5: brchNo5,
            playDe: playDe,
            movieNo: movieNo,
            startPoint: startPoint,
            rpstMovieNo: movieNo
        };
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    };

    /*
     * 영화상세 스틸컷
     * AppDomain.Movie.stillcutPhotoView(paramData)
     * */
    this.stillcutPhotoView = function(paramData, flag){
        if (!flag) flag = AppDomain.Flag.isDefault;
        var data = {
              domain: "/on/oh/oha/Movie/stillcutPhotoV.do",
              params: paramData,
              header: {
                      type: 'default',
                    bgColor: '0b0b0b',
                    txtColor: 'ffffff'
              },
              title: {
                  type: 'text',
                  text: paramData.stillMovieName
              },
              btnRight: {
                  type: 'close',
                  txtColor : 'ffffff'
              },
              refresh: flag.refresh,
              isCloseAll: flag.isCloseAll,
              isClose: flag.isClose,
              animation: 'popup'
      }

      AppHandler.Common.href(data);
    }
    /*AppDomain.Movie.detailOneLine(rpstMovieNo, tabCd);*/
    this.detailOneLine = function (rpstMovieNo, tabCd, backword, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.detail;
        data.domain = '/movie-detail/comment';
        data.params = {
                rpstMovieNo: rpstMovieNo,
                tabCd: tabCd
        };

        if(backword){
            data.params.back = backword
        }

        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    };

    //영화검색
    this.search = function (flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/movie/search',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '영화검색'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    //영화관
    this.theater = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/theater/list',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '영화관'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    // 무비포스트
    this.moviePost = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.moviePost;
        data.domain = '/moviepost/all';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    };

    //무비포스트 디테일
    /*AppDomain.Movie.postDetail(moviePostNo);*/
    this.postDetail = function(moviePostNo, flag) {
        if(controlAction.isExec()) return;
        controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.postDetail;
        data.params = {moviePostNo : moviePostNo};
        data.domain = '/moviepost/detail';
        data.animation = 'popup';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        if (isApp()) {
            AppHandler.Common.href(data);
        } else {
            gfn_moCusLayer(data);
        }
    };

    // 큐레이션 소개
    this.curationIntroduce = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = that.Headers.curationIntroduce;
        data.domain = '/curation/specialcontent';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    };

    //클레식소사이어티
    this.curationClassicsociety = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.curationClassicsociety;
        data.domain = '/curation/classicsociety';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    };

    //필름소사이어티
    this.curationFilmsociety = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.curationFilmsociety;
        data.domain = '/curation/filmsociety';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    };

  /**
   * 큐레이션 - 디즈니시네마
   * AppDomain.Movie.curationDisney
   * @param flag
   */
  this.curationDisney = function(flag) {
    if(controlAction.isExec()) return;

    controlAction.on();

    if (!flag) flag = AppDomain.Flag.isDefault;

    var openData = AppHeader.Movie.curation;
    openData['domain'] = '/curation/disney';
    openData['refresh'] = flag.refresh;
    openData['isCloseAll'] = flag.isCloseAll;
    openData['isClose'] = flag.isClose;

    AppHandler.Common.href(openData);
  };

    //기대평쓰기
    this.oneLineReview = function (paramData, flag) {
        if(controlAction.isExec()) return;
        controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;
        var title = paramData.onelnEvalDivCd == "PREV" ? "실관람평 작성" : "기대평 작성";
        var data = this.Headers.oneLineWrite;
        var closeHeaderData = that.Headers.detail;
        if(paramData.myPage == 'Y') closeHeaderData = AppDomain.MyMegabox.Headers.movieStory;
        data.domain = '/movie/oneline-review';
        data.params = paramData;
        data.title.text = title;
        data.closeHeaderData = closeHeaderData;
        data.header.closeAction = 'gfn_selLayerClsMsg';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;
        data.closeMsgType = 'end';
        data.openerAction = 'fn_rtnOneLineReview';
        gfn_moCusLayer(data);
    };

    //무비포스트 작성
    this.posting = function(paramData, flag) {
        if(controlAction.isExec()) return;
        controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;
        var data = AppDomain.Movie.Headers.postWrite;
        data.params = {
            movieNm : paramData.movieNm
            , imgPathNm : paramData.imgPathNm
            , atchFileNo : paramData.atchFileNo
            , movieNo : paramData.movieNo || paramData.rpstMovieNo
            , rpstMovieNo: paramData.rpstMovieNo || paramData.movieNo
            , moviePostImgDivCd : paramData.moviePostImgDivCd
            , myPage : paramData.myPage
            , mergeType : 'I'
        };
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        if (isApp()) {
            AppHandler.Common.href(data);
        } else {
            gfn_moCusLayer(data);
        }
    };

    this.postModify = function(paramData, flag) {
        if(controlAction.isExec()) return;
        controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;
        var data = this.Headers.postWrite;
        data.params = {
                movieNo : paramData.movieNo,
                moviePostNo : paramData.moviePostNo,
                mergeType : 'U'
        };
        data.title.text = '무비포스트 수정';
        data.closeHeaderData = this.Headers.postDetail;
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        if (isApp()) {
            AppHandler.Common.href(data);
        } else {
            gfn_moCusLayer(data);
        }
    };

    this.postRegister = function(paramData, flag) {
        if(controlAction.isExec()) return;
        controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;
        paramData = paramData || {};
        var closeHeader = paramData.myPage == 'Y' ? AppDomain.MyMegabox.Headers.movieStory : that.Headers.moviePost;
        if(paramData.reselected == 'Y') {
            closeHeader = that.Headers.postWrite;
            paramData.reselected = '';
        }
        var data = {
                domain: '/moviepost/write',
                params: paramData,
                header: {
                    type: 'default',
                    closeAction: 'gfn_selLayerCls'
                },
                title: {
                    type: 'text',
                    text: '무비포스트 영화 선택'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                closeHeaderData: closeHeader,
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };
        gfn_moCusLayer(data);
    };
}

var Membership = function() {

    this.filmJoin = function (flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/curation/filmsociety/join',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '스페셜멤버십 가입'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    this.classicJoin = function (flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/curation/classicsociety/join',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '스페셜멤버십 가입'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    //멤버십안내
    this.information = function (flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
            domain: '/benefit/membership',
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '메가박스 멤버십'
            },
            btnLeft: {
                type: 'back'
            },
            refresh: flag.refresh,
            isCloseAll: flag.isCloseAll,
            isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };
}

var Hotdeal = function () {
    this.Headers = {
            list: {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '메가핫딜'
                },
                btnLeft: {
                    type: 'back'
                },
                btnRight: {
                    type: 'menu'
                },
                btnRightSub: {
                    type: 'sub',
                    image: 'ico-info',
                    callback: 'fn_openDtailPop'
                }
            }
    };

    // 메가핫딜 목록
    this.list = function (flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.list;
        data.domain = '/mega-hotdeal';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    };

    // 메가핫딜 상세
    this.detail= function (movieNm, eventNo, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/mega-hotdeal/detail',
                params: {
                    eventNo : eventNo
                },
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: movieNm
                },
                btnLeft: {
                    type: 'back'
                },
                btnRight: {
                    type: 'sub',
                    image: 'ico-share',
                    callback: 'fn_shareBox'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    // 임시예매권
    this.tempTicket = function(sTranNo, flag, eventNo) {
        var sEventNo = '';
        if (!flag) flag = AppDomain.Flag.isDefault;
        if (eventNo) sEventNo = eventNo;
        var data = {
                domain: '/on/om/oma/MagaHotdeal/MegaHotdealPayCompltPV.do',
                params: {
                    tranNo: sTranNo,
                    eventNo: sEventNo
                },
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '임시예매권'
                },
                btnLeft: {
                    type: 'back'
                },/*
                btnRight: {
                    type: 'menu'
                },
                btnRightSub: {
                    type: 'sub',
                    image: 'ico-info',
                    callback: ''  // TODO: javascript funtion name
                },*/
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    // 메가핫딜 안내
    this.guide = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/mega-hotdeal/guide',
                header: {
                    type: 'default',
                    bgColor: 'f5f4f4'
                },
                title: {
                    type: 'text',
                    text: ''
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    }

}

var Theater = function () {

    this.Headers = {
            privateBooking: {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '더 부티크 프라이빗'
                },
                btnLeft: {
                    type: 'back'
                }
            },
            list: {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '극장선택'
                },
                btnLeft: {
                    type: 'back'
                }
            },
            detail: {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '극장상세'
                },
                btnLeft: {
                    type: 'back'
                }
            },
            specialDetail: {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'picker',
                    text: '특별관',
                    action: {
                        type: 'click',
                        callback: 'fn_specialLayerOpn'
                    }
                },
                btnLeft: {
                    type: 'back'
                }
            }
    };

    // 극장목록
    this.list = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.list;
        data.domain = '/theater/list';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    };

    // 극장상세
    this.detail = function (brchNo, brchNm, areaCd, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.detail;
        data.domain = '/theater';
        data.params = {
                brchNo: brchNo,
                areaCd: areaCd
        };

        if (brchNm) {
            data.title.text = brchNm;
        }

        AppHandler.Common.href(data);
    };

    this.specialDetail = function (kindCd, theaterNm, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.specialDetail;
        data.domain = '/specialtheater';
        data.params = {
                kindCd: kindCd
        };

        if(kindCd == 'TBQ') {
            data.title.text = 'THE BOUTIQUE';
        }
        else if(kindCd == 'MX') {
            data.title.text = 'MX';
        }
        else if(kindCd == 'CFT') {
            data.title.text = 'COMFORT';
        }
        else if(kindCd == 'MKB') {
            data.title.text = 'MEGA KIDS';
        }
        else if(kindCd == 'TFC') {
            data.title.text = 'THE FIRST CLUB';
        }
        else if(kindCd == 'BCY') {
            data.title.text = 'BALCONY M';
        }

        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    };

    //관람료(지역코드, 극장코드)
    this.specialList = function(flag) {
      if (!flag) flag = AppDomain.Flag.isDefault;

      var data = {
        domain: '/special-theater/list',
        header: {
          type: 'default'
        },
        title: {
          type: 'text',
          text: '특별관'
        },
        btnLeft: {
          type: 'back'
        },
        refresh: flag.refresh,
        isCloseAll: flag.isCloseAll,
        isClose: flag.isClose
      };

      AppHandler.Common.href(data);
    }

    //대관예매
    this.boutiquePrivate = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.privateBooking;
        data.domain = '/booking/privatebooking';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    }

    //관람료(지역코드, 극장코드)
    this.admissionFeeArea = function(areaCd, brchNo, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/on/oh/ohc/Brch/AdmissionFeePage.do',
                params: {
                    areaCd: areaCd,
                    brchNo: brchNo
                },
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '관람료'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    }

    //관람료
    this.admissionFee = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/on/oh/ohc/Brch/AdmissionFeePage.do',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '관람료'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    }

    this.specialAdmissionFee = function(areaCd, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/on/oh/ohc/Brch/SpecialAdmissionFee.do',
                params: {
                    areaCd: areaCd
                },
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '관람료'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    }

};

var CustCenter = function() {

    //대관문의
    this.privateInquire = function (flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/support/rent',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '단체관람/대관문의'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    this.privateInquire = function (areaCd, brchNo, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/support/rent',
                params: {
                    areaCd: areaCd,
                    brchNo: brchNo
                },
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '단체관람/대관문의'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    this.customerLgRegPage = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/support/lost/form',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '분실물 문의'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        if (isApp()) {
            AppHandler.Common.href(data);
        } else {
            data.openerAction = 'fn_reCustomerLgRegPage'
            gfn_moCusLayer(data);
        }
    }

    // 문의내역 상세
    this.qnaDetail = function(option, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/support/lost/detail',
                params: option.paramData,
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: option.title +' 상세'
                },
                btnRight: {
                    type: 'close'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        if (isApp()) {
            AppHandler.Common.href(data);
        } else {
           gfn_moCusLayer(data);
        }
    };

    /*공지사항 디테일*/
    /*AppDomain.CustCenter.noticeDetail(form, flag)*/
    this.noticeDetail = function(form, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/support/notice/detail',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '공지사항'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        if (isApp()) {
            AppHandler.Common.submit(form, data);
        } else {
            data.params = $(form).serializeObject();
            gfn_moCusLayer(data);
        }
    }
};

// 나의 메가박스
var MyMegabox = function() {
    this.Headers = {
            mbshipPointHist: {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '멤버십포인트'
                },
                btnLeft: {
                    type: 'back'
                },
                btnRight: {
                    type: 'menu'
                }
//                ,
//                btnRightSub: {
//                    type: 'sub',
//                    image: 'ico-info',
//                    callback: 'fn_callbackSubInfoBtn'
//                }
            },
            paymentHist: {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '예매/구매 내역'
                },
                btnLeft: {
                    type: 'back'
                }
            },
            movieStory: {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '나의 무비스토리'
                },
                btnLeft: {
                    type: 'back'
                }
            },
            couponList: {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '쿠폰'
                },
                btnLeft: {
                    type: 'back'
                },
                btnRight: {
                    type: 'sub',
                    image: 'ico-info',
                    callback: 'fn_cponLayerOpn'
                }
            },
            movieCouponList: {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '영화관람권'
                },
                btnLeft: {
                    type: 'back'
                },
                btnRight: {
                    type: 'sub',
                    image: 'ico-info',
                    callback: 'fn_mvtckInfoOpn'
                }
            },
            storeCouponList: {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '스토어교환권'
                },
                btnLeft: {
                    type: 'back'
                },
                btnRight: {
                    type: 'sub',
                    image: 'ico-info',
                    callback: 'fn_mvtckInfoOpn'
                }
            },
            ticketBook: {
                header: {
                  type: 'default',
                  bgColor: 'F5F5F5'
                },
                title: {
                  type: 'text',
                  text: '티켓북'
                },
                btnLeft: {
                  type: 'back'
                },
                btnRight: {
                  type: 'sub',
                  image: 'ico-plus',
                  callback: 'AppDomain.MyMegabox.watchedMovieReg'
                },
            }
    };

    // 멤버십 등급이력
    this.mbshipClassHist = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/myMegabox/membership-history',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '멤버십 등급 이력'
                },
                btnRight: {
                    type: 'close'
                },
        };

        if (isApp()) {
            AppHandler.Common.href(data);
        } else {
            data.layerGrayAt = 'Y';
            gfn_moCusLayer(data);
        }
    };

    // 멤버십 포인트 내역
    this.mbshipPointHist = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/mypage/point-list',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '멤버십포인트'
                },
                btnLeft: {
                    type: 'back'
                },


                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    // 포인트 선물하기
    this.mbshipPointGift = function(flag) {
         if (!flag) flag = AppDomain.Flag.isDefault;

         var data = {
                 domain: '/mypage/point-gift',
                 header: {
                     type: 'default'
                 },
                 title: {
                     type: 'text',
                     text: '포인트 선물하기'
                 },
                 btnLeft: {
                     type: 'back'
                 },
                 refresh: flag.refresh,
                 isCloseAll: flag.isCloseAll,
                 isClose: flag.isClose
         };

         if (isApp()) {
             AppHandler.Common.href(data);
         } else {
             data.changeFunNmAt = 'N';
             data.openerAction  = 'fn_rtnMbshipPointGift'
             gfn_moCusLayer(data);
         }
    };

    // 포인트 비밀번호 설정
    this.mbshipPointChage = function(flag) {
         if (!flag) flag = AppDomain.Flag.isDefault;

         var data = {
                 domain: '/mypage/point-password',
                 header: {
                     type: 'default'
                 },
                 title: {
                     type: 'text',
                     text: '포인트 비밀번호 설정'
                 },
                 btnLeft: {
                     type: 'back'
                 },
                 refresh: flag.refresh,
                 isCloseAll: flag.isCloseAll,
                 isClose: flag.isClose
         };

         if (isApp()) {
             AppHandler.Common.href(data);
         } else {
             data.changeFunNmAt = 'N';
             gfn_moCusLayer(data);
         }
    };

    // 영화관람권, 스토어교환권 목록
    this.movieStoreCouponList = function(pDivCd, params, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.movieCouponList;
        data.domain = '/mypage/movie-coupon';

        if (pDivCd != 'MOVIE') {
            data = this.Headers.storeCouponList;
            data.domain = '/mypage/store-coupon';
        }

        data.params = {};

        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        if(params != undefined) {
            for(var key in params) {
                data.params[key] = params[key];
            }
        }

        AppHandler.Common.href(data);
    };

    // 메가박스 쿠폰목록
    /*AppDomain.MyMegabox.mageboxCouponList()*/
    this.mageboxCouponList = function(tab, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.couponList;
        data.domain = '/myMegabox/discount';
        data.params = {
                tab: tab
        };
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    };

    /*제휴 쿠폰*/
    /*AppDomain.MyMegabox.mageboxAlliedCouponList()*/
    this.mageboxAlliedCouponList = function(tab, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.couponList;
        data.domain = '/myMegabox/cooperation';
        data.params = {
                tab: tab
        };
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    };

    // 메가박스 쿠폰등록 페이지
    /*AppDomain.MyMegabox.mageboxCouponReg('STORE');*/
    this.mageboxCouponReg = function(cponType, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var title = "";
        switch(cponType){
            case "MOVIE" : title = "영화관람권 등록"	;	break;
            case "STORE" : title = "스토어 교환권 등록";	break;
            default 	 : title = "쿠폰 등록";		break;
        }
        var data = {
                domain: '/mypage/reg-coupon',
                params: {
                    cponType : cponType
                },
                header: {
                    type: 'default',
                    closeAction : 'fn_closeEvent'
                },
                title: {
                    type: 'text',
                    text: title
                },
                btnRight: {
                    type: 'close'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        if (isApp()) {
            AppHandler.Common.href(data);
        } else {
            data.layerGrayAt  = 'Y';
            data.openerAction = 'fn_rtnMageboxCouponReg';
            gfn_moCusLayer(data);
        }
    };

    // 기프트카드 리스트
    this.giftCardList = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/on/oh/ohh/MyGiftCard/GiftCardListL.do',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '나의 기프트카드'
                },
                btnLeft: {
                    type: 'back'
                },
                btnRight: {
                    type: 'menu'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

  //기프트카드 충전 완료 페이지
  this.giftRechgComplPage = function(form, params, flag) {
    if (!flag) flag = AppDomain.Flag.isDefault;

    var params = {
      domain: params.domain,
      params: params,
      header: {
        type: 'default',
        closeAction : 'AppHandler.Common.goMain'
      },
      title: {
        type: 'text',
        text: '충전완료'
      },
      btnRight: {
        type: 'close'
      },
      animation: 'popup',
      refresh: flag.refresh,
      isCloseAll: flag.isCloseAll,
      isClose: flag.isClose
    };

    AppHandler.Common.submit(form, params);
  };

    // 예매/구매내역
    /*AppDomain.MyMegabox.paymentHist(params)*/
    this.paymentHist = function(params, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.paymentHist;
        data.domain = '/mypage/bookinglist';
        data.params = {};
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        if(params != undefined) {
            for(var key in params) {
                data.params[key] = params[key];
            }
        }

        AppHandler.Common.href(data);
    };

    // 비회원 예매/구매내역
    this.paymentNonHist = function(params) {
        var data = {
                domain: '/non-member',
                params: {},
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '예매/구매 내역'
                },
                btnLeft: {
                    type: 'back'
                },
                btnRight: {
                    type: 'menu'
                }
        };

        if(params != undefined) {
            for(var key in params) {
                data.params[key] = params[key];
            }
        }

        AppHandler.Common.href(data);
    };

    // 영화관람권/ 스토어 교환권 상세
    this.mvtckDetail = function(option, params, flag){
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: option.url,
                params: params,
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: option.title + ' 상세'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        if (isApp()) {
            AppHandler.Common.href(data);
        } else {
            gfn_moCusLayer(data);
        }
    };

    // 예매/구매내역 상세 헤더
    this.headerPaymentHistDetail = function(params) {
        var data = {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: params.title + ' 상세'
                },
                btnRight: {
                    type: 'close'
                }
        };

        return data;
    };

    // 예매/구매내역 상세
    this.paymentHistDetail = function(params, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data        = this.headerPaymentHistDetail(params);
        data.domain     = '/on/oh/ohh/MyBokdPurc/MyBokdPayInfoPopup.do',
        data.params     = params;
        data.refresh    = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose    = flag.isClose;

        if (isApp()) {
            AppHandler.Common.href(data);
        } else {
            data.openerAction = 'fn_rtnPaymentHistDetail';
            gfn_moCusLayer(data);
        }
    };

    /*비회원 디테일*/
    this.paymentHistNonDetail = function(params, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data        = this.headerPaymentHistDetail(params);
        data.domain     = '/on/oh/ohh/NonMbBokd/BokdPayInfoPopup.do',
        data.params     = params;
        data.refresh    = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose    = flag.isClose;

        if (isApp()) {
            AppHandler.Common.href(data);
        } else {
            data.openerAction = 'fn_rtnPaymentHistDetail';
            gfn_moCusLayer(data);
        }
    };

    /* 환불 수수료 결제 */
    this.paymentFdkDetail = function(option, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/on/oh/ohh/MyBokdPurc/MyBokdPayFdkPopup.do',
                params: option.params,
                header: {
                    type: 'default',
                    bgColor: '000000',
                    txtColor: 'ffffff',
                    closeAction : 'gfn_selLayerClsMsg'
                },
                title: {
                    type: 'text',
                    text: '결제취소'
                },
                btnRight: {
                    type: 'close',
                    txtColor: 'ffffff'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        data.closeHeaderData    = option.headerData;
        data.closeMsgType       = 'confirm';
        data.closeMsg           = '진행중인 결제를 중단하시겠습니까?';
        data.openerAction       = 'fn_nextCancelBokd';
        data.layerHeaderBlockAt = 'Y';
        gfn_moCusLayer(data);
    };

    // 나만의 메가박스
    /*AppDomain.MyMegabox.myOwnMegabox();*/
    this.myOwnMegabox = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/mypage/manage-myinfo/mbFavorBrchRegM',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '나의 메가박스'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };


    /* 선호 영화관 설정
     * AppDomain.MyMegabox.favorBrchListConf();*/
    this.favorBrchListConf = function(flag){
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain			:	"/on/oh/ohh/PersonInfoMng/mbFavorBrchRegMa.do"
                , params		:	{
                    menuId: 'M-MY-PI-0501'
                    , mappingId : 	''
                }

                , title			:	{
                    type	:	"text"
                    , text	:	"선호극장 설정 변경"
                }
                , btnRight: {
                    type: 'close'
                }
        }
        AppHandler.Common.href(data);
    }

    // 본 영화 등록
    this.watchedMovieReg = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/moviestory/watchedMovie/registe',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '본 영화 등록'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };
        if(isApp()) {
            AppHandler.Common.href(data);
        } else {
            data.openerAction = 'fn_rtnWatchedMovieReg';
            gfn_moCusLayer(data);
        }
    };

    // 내 정보 관리
    this.myInfoMng = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/mypage/manage-myinfo',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '내 정보 관리'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    // 문의내역
    this.qnaList = function(inqLclCd, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/mypage/myinquiry',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '나의 문의내역'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        if (inqLclCd != undefined) {
            data.domain += '?inqLclCd=' + inqLclCd;
        }

        AppHandler.Common.href(data);
    };

    // 문의내역 상세
    this.qnaDetail = function(option, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/mypage/myinquiry/detail',
                params: option.paramData,
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: option.title +' 상세'
                },
                btnRight: {
                    type: 'close'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        if (isApp()) {
            AppHandler.Common.href(data);
        } else {
           gfn_moCusLayer(data);
        }
    };

    // 이벤트 응모내역
    this.eventEntryHist = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/mypage/myevent',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '나의 응모내역'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    // 무비스토리 (본영화/보고싶어/한줄평/무비포스트)
    this.movieStory = function(divCd, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        if(divCd != '') {
            var data = this.Headers.movieStory;
            data.domain = '/mypage/moviestory';
            data.params = {
                    divCd: divCd
            };
            data.refresh = flag.refresh;
            data.isCloseAll = flag.isCloseAll;
            data.isClose = flag.isClose;

            AppHandler.Common.href(data);
        }
    };

    // 스페셜 멤버십 가입
    this.specialMembership = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/mypage/special-membership',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '스페셜 멤버십'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    // VIP 쿠폰북 안내
    this.vipCouponBookGuide = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/vipcoupon/guide',
                header: {
                    type: 'default',
                    overlay: 'clear',
                    bgColor: '160F2B',
                    txtColor: 'ffffff'
                },
                title: {
                    type: 'text',
                    text: 'VIP 쿠폰북'
                },
                btnRight: {
                    type: 'close',
                    txtColor: 'ffffff'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    // VIP 쿠폰북 선택
    this.vipCouponBook = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/vipcoupon/getcoupons',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: 'VIP 쿠폰북'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    // VIP 쿠폰북 최종 선택
    this.vipCouponBookFinal = function(form, thisYear, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/vipcoupon/getcoupons/detail',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: thisYear +' VIP 쿠폰북 선택'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.submit(form, data);
    };

    /*나의 문의내역*/
    this.myinquiry = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/mypage/myinquiry',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '나의 문의내역'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    /**
     * 주문내역/멤버쉽카드
     * Web에서만 사용
     * App는 네이티브에서 직접 호출
     */
    this.myTicketMember = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/mypage/ticketlist',
                header: {
                    type: 'default',
                    overlay: 'clear',
                    bgColor: 'opacity',
                    txtColor: 'ffffff'
                },
                title: {
                    type: 'logo'
                },
                btnLeft: {
                    type: 'sub',
                    image: 'ico-barcode-w',
                    callback: 'ticket',
                    params: 'membership',
                    txtColor: 'ffffff'
                },
                btnRight: {
                    type: 'close',
                    txtColor: 'ffffff'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    // 자주쓰는 할인수단
    this.favorUsePayDcMean = function(form, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/mypage/manage-myinfo/favorUsePayDcMeanLb',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '자주쓰는 할인 카드'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };
        AppHandler.Common.href(data);
    }

    // 마케팅 정보 수신동의
    this.marketingAgree = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;
        var data = {
                domain: '/mypage/marketing-agree',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '마케팅 정보 수신동의'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };
        AppHandler.Common.href(data);
    }

    // 비밀번호 변경
    this.changePassword = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;
        var data = {
                domain: '/change-password',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '비밀번호 변경'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        }
        AppHandler.Common.href(data);
    }

    // 회원정보관리
    this.myInfo = function(flag) {
        if (!flag) flag = AppDomain.Flag.isRefresh;
        var data = {
                domain: '/mypage/manage-myinfo/personInfoMng',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '회원정보 관리'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };
        AppHandler.Common.href(data);
    }

    // 쿠폰상세
    this.dcCouponDetail = function(form, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;
        var data = {
                domain: '/on/oh/ohh/MyDcCpCpon/infoDcCpono.do',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '쿠폰상세'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        if ($(form).serializeObject().cponType == 'CPON_CP') {
            data.domain = '/on/oh/ohh/MyDcCpCpon/infoCpCpono.do';
        }

        if (isApp()) {
            AppHandler.Common.submit(form, data);
        } else {
            data.params = $(form).serializeObject();
            gfn_moCusLayer(data);
        }
    }
};

// 혜택
var Benefit = function() {
    this.Headers = {
            viplounge: {
                header: {
                    type: 'default',
                    overlay: 'clear',
                    bgColor: 'opacity',
                    txtColor: 'ffffff'
                },
                title: {
                    type: 'text',
                    text: ''
                },
                btnLeft: {
                    type: 'back',
                    txtColor: 'ffffff'
                }
            },
            mbshipGuide: {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '메가박스 멤버십'
                },
                btnLeft: {
                    type: 'back'
                }
            },
            discountGuide: {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '제휴/할인'
                },
                btnLeft: {
                    type: 'back'
                },
                btnRight: {
                    type: 'menu'
                },
                btnRightSub: {
                    type: 'sub',
                    image: 'ico-search',
                    callback: 'AppDomain.Benefit.discountGuideSearch'
                }
            }
    };

    // VIP 라운지
    this.viplounge = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;


        var data = {
                domain: '/benefit/viplounge',
                header: {
                     type: 'default',
                     overlay: 'clear',
                     bgColor: 'opacity',
                     txtColor: 'ffffff'
                },
                title: {
                    type: 'text',
                    text: ''
                },
                btnLeft: {
                    type: 'back',
                    txtColor: 'ffffff'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);

        /*
        var data = this.Headers.viplounge;
        data.domain = '/benefit/viplounge';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);*/
    };

    // 멤버십 안내
    this.mbshipGuide = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.mbshipGuide;
        data.domain = '/benefit/membership';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    };

    // 포인트 상세 안내
    this.pointDetailGuide = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/benefit/membership',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '포인트 상세 안내'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    // 중앙멤버십 신청
    this.jggMbshipRequest = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/benefit/viplounge/joongang',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '중앙멤버십 신청하기'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    // VIP 스템프 미션
    this.vipStampMission = function(thisYear, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/benefit/viplounge/stamp',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: 'VIP 스탬프 미션'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    // 제휴/할인
    this.discountGuide = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.discountGuide;
        data.domain = '/benefit/discount/guide';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    };

    // 제휴/할인 검색
    this.discountGuideSearch = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/benefit/discount/cardList',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '제휴/할인 검색'
                },
                btnLeft: {
                    type: 'back'
                },
                btnRight: {
                    type: 'menu'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

};

var Member = function() {
    /*AppDomain.Member.loginConfirm()*/
    this.loginConfirm = function() {
        var data = {
                message: '로그인 후 사용가능합니다.\n로그인 하시겠습니까?',
                okFunc: 'AppDomain.Member.login'
        };
        AppHandler.Common.confirm(data);
    };

    // 로그인
    /*AppDomain.Member.login();*/
    this.login = function(flag, complete, close) {
        if (!flag) flag = AppDomain.Flag.isClose;
        if (!complete) complete = '';   //로그인 후 실행 function name
        var data = {
                domain:	'/login',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '로그인'
                },
                btnRight: {
                    type: 'close'
                },
                params : {
                    complete : complete
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };
        if(close) data.params.close = close;

        AppHandler.Common.href(data);
    };

    // 비회원로그인
    this.loginNon = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain:	'/nonMember-login',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '비회원 로그인'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    // 회원가입
    this.join = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/join',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '회원가입'
                },
                btnLeft: {
                    type: 'back'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    //ID/PW찾기
    this.findIdPwd = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
            domain: '/user-find',
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '아이디/비밀번호찾기'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup',
            refresh: flag.refresh,
            isCloseAll: flag.isCloseAll,
            isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    //회원 재인증
    this.memberCheck = function(flag, certType) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
            domain: '/member-check',
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '회원 재인증'
            },
            btnRight: {
                type: 'close'
            },
            params: {
                certType : certType
            },
            animation: 'popup',
            refresh: flag.refresh,
            isCloseAll: flag.isCloseAll,
            isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    // 회원가입 - 회원정보입력
    this.infoRegister = function(flag, formname) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
            domain: '/sign-up',
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '정보입력'
            },
            btnLeft: {
                type: 'back'
            },
            refresh: flag.refresh,
            isCloseAll: flag.isCloseAll,
            isClose: flag.isClose
        };

        AppHandler.Common.submit(formname, data);
    };

    //회원가입완료
    this.signup = function(flag, form) {
        var data = {
            domain: '/on/oh/ohg/MbJoin/insertMbJoin.rest',
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '회원가입 완료'
            },
            btnRight: {
                type: 'close'
            },
            params: {},
            refresh: flag.refresh,
            isCloseAll: flag.isCloseAll,
            isClose: flag.isClose
        }
        AppHandler.Common.submit(form, data);
    }
};


/*극장*/
var Brch = function(){
    /*극장메인*/
    this.brchMain = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/theater/list',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '영화관'
                },
                btnRight: {
                    type: 'close'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    }
}
//언어변환
var Language = function() {

    this.setLangChg = function(locale, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var locale = '${locale}' == "en" ? "kr" : "en";;
        var imgSvrUrl = '${imgSvrUrl}';
        var data = {
                domain: '/booking',
                params: {
                    megaboxLanguage: locale
                },
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '영화 선택'
                },
                btnLeft: {
                    type: 'sub',
                    image: 'ico-list-block',
                    callback: 'fn_changeViewType'
                },
                btnRight: {
                    type: 'close'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    }
};

var CustCen = function() {
    /* 고객센터 */
    this.customerMainPage = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/support',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '고객센터'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    }

    /* 이용약관 */
    /*AppDomain.CustCen.customerPoPage()*/
    this.customerPoPage = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/support/terms',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '이용약관'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        if(isApp()){
            AppHandler.Common.href(data);
        }else{
            gfn_moCusLayer(data);
        }
    }

    /* 개인정보 취급방침 */
    /*AppDomain.CustCen.customerPpPage()*/
    this.customerPpPage = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;
        var data = {
                domain: '/support/privacy',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '고객정보 취급 방침'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        if(isApp()){
            AppHandler.Common.href(data);
        }else{
            gfn_moCusLayer(data);
        }
    }
};

// 설정
var Setting = function() {
    this.Headers = {
            notification: {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '알림함'
                },
                btnRight: {
                    type: 'close'
                }
            }
    };

    this.main = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/setting',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '설정'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    }

    // 알림함
    this.notification = function(flag) {
        if (fn_rlyLoginchk()) {
            if (!flag) flag = AppDomain.Flag.isDefault;

            var data = this.Headers.notification;
            data.domain = '/setting/notification';
            data.animation = 'popup';
            data.refresh = flag.refresh;
            data.isCloseAll = flag.isCloseAll;
            data.isClose = flag.isClose;

            AppHandler.Common.href(data);
        }
    }

    //선호극장설정
    this.favorTheater = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
            domain: '/on/oh/ohh/PersonInfoMng/mbFavorBrchRegMa.do',
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '선호극장 설정 변경'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup',
            refresh: flag.refresh,
            isCloseAll: flag.isCloseAll,
            isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    }
};

//고객센터
var Support = function() {

    this.Headers = {
            notice: {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '공지사항'
                },
                btnLeft: {
                    type: 'back'
                }
            }
    };

    // 자주묻는 질문
    this.faq = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/support/faq',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '자주묻는 질문'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    }

    // 공지사항
    this.notice = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.notice;
        data.domain = '/support/notice';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    }

    /*1:1 문의*/
    this.inquiry = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/support/inquiry',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '1:1 문의'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        if (isApp()) {
            AppHandler.Common.href(data);
        } else {
            data.openerAction = 'fn_reInquiry'
            gfn_moCusLayer(data);
        }
    }

    /*분실물문의*/
    this.lose = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/support/lost',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '분실물 문의'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    }

    /*단체관람 및 대관문의*/
    this.lent = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/support/rent',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '단체관람 및 대관문의'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        if (isApp()) {
            AppHandler.Common.href(data);
        } else {
            data.openerAction = 'fn_reLent'
            gfn_moCusLayer(data);
        }
    }

    this.app = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/support/app-inquiry',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '앱개선문의'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    }
};

var Store = function() {

    this.Headers = {
            storeDtlPage: {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '상품상세'
                },
//                btnRight: {
//                    type: 'close'

//                }
                btnLeft : {
                    type: 'back'
                }
            },

            storeUseBrchHeader : {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '사용가능 극장'
                },
                btnRight: {
                    type: 'close'
                }
            }
    };

    // 주문표
    this.comboOrder = function(data, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;
        var data = {
                domain: '/mobile-order/waiting',
                params: {
                    transNo: data.transNo,
                    brchNm : data.brchNm,
                    brchNo : data.brchNo,
                },
                header: {
                    type: 'default',
                    closeAction : 'fn_ticketClose'
                },
                title: {
                    type: 'text',
                    text: '주문내역'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        }

        if (isApp()) {
            AppHandler.Common.href(data);
        } else {
            gfn_moCusLayer(data);
        }
    };

    // 상품 디테일
    /*AppDomain.Store.storeDtlPage(prdtCd, cmbndKindNo);*/
    this.storeDtlPage = function(prdtCd, cmbndKindNo, flag) {  /* 제품번호, 제품코드 */
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.storeDtlPage;
        data.domain = '/store/detail';
        data.params = {};
        if(prdtCd) data.params.prdtCd = prdtCd;
        if(cmbndKindNo) data.params.cmbndKindNo = cmbndKindNo;
//        data.animation = 'popup',
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;
        AppHandler.Common.href(data);
    }

    /*AppDomain.Store.storeUseItemBrch(cmbndKindNo);*/
    this.storeUseItemBrch = function(cmbndKindNo, flag) {  /* 제품번호, 제품코드 */
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.storeUseBrchHeader;
        data.domain = '/on/oh/ohd/StoreDtl/selectStoreMobileBrchList.do';
        data.params = {
                cmbndKindNo: cmbndKindNo
        };
        data.header = {
            type: 'default'
        },
        data.title = {
            type: 'text',
            text: '사용가능 극장'
        },
        data.animation = 'popup',
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    }

    // 스토어 디테일 레이어 오픈
    this.storeDtlLayerPageOpn = function(elId, elCttsId, prdtNo){
        if (!flag) flag = AppDomain.Flag.isDefault;
        var duration = 200;
        var data = {
                domain: '/store/detail',
                params: {
                	prdtNo: prdtNo
                },
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '상품상세'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        if(isApp()){
            AppDomain.Store.storeDtlPage('', prdtNo);
//            AppHandler.Common.href(data);
        }else{
            $.ajax({
                url: "/on/oh/ohd/StoreDtl/selectStoreDtl.do",
                type: "POST",
                contentType: "application/json;charset=UTF-8",
                data: JSON.stringify({prdtNo: prdtNo}),
                success: function (data, status, xhr) {
                    AppHandler.Common.setHeader(data);
                    $("body").addClass("no-scroll");
                    $("#"+elCttsId).html(data);
                    $("#"+elId).css("z-index",gfn_maxZindex()).removeClass("display-none").css("top","0px").elSlideUp(duration);
                },
                error: function(xhr, status, error){
                    AppHandler.Common.alert('Screen loading error');
                }
            });
        }

    }

    this.payment = function(form, params, flag) {
    //결제 페이지
        if (!flag) flag = AppDomain.Flag.isDefault;

        var params = {
                domain: '/store/payment',
                params: params,
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '결제하기'
                },
//                btnRight: {
//                    type: 'close'
//                },
                btnLeft : {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };
        AppHandler.Common.submit(form, params);
    }

    this.present = function(form, params, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/store/gift',
                params: params,
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '선물하기'
                },
//                btnRight: {
//                    type: 'close'
//                },
                btnLeft: {
                    type: 'back'
                },
//                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

         AppHandler.Common.submit(form, data);
    }

    //결제 완료 페이지
    this.storePayComplPage = function(form, params, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var params = {
                domain: params.domain,
                params: params,
                header: {
                    type: 'default',
                    closeAction : 'AppHandler.Common.goStore'
                },
                title: {
                    type: 'text',
                    text: '구매완료'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.submit(form, params);
    }
}

var Layer = function() {

    this.login = function(viewUrl, layerRenderName, completeFunction, closeFunction, ticketingAt, displayNoneTagId) {
        if(!ticketingAt) {
            ticketingAt = 'Y';
        }

        var oData = {
            render : layerRenderName
            , complete: completeFunction
            , close: closeFunction
            , ticketingAt: ticketingAt
        };

        $.ajax({
            url: viewUrl,
            type: "POST",
            contentType: "application/json;charset=UTF-8",
            headers: gfn_appHeaders(),
            data: JSON.stringify(oData),
            success: function (data, status, xhr) {
                if(displayNoneTagId) {
                    $("#"+displayNoneTagId).addClass("display-none");
                } else {
                    $('#headerSub').addClass('display-none');
                    $('.container').addClass('display-none');
                }

                $('#'+layerRenderName).html(data);

                if(isApp()) {
                    var param = {
                            header: {
                                type: 'default',
                                closeAction: 'fn_layerClose',
                                backAction: 'fn_layerClose'
                            },
                            title: {
                                type: 'text',
                                text: '로그인'
                            },
                            btnRight: {
                                type: 'close'
                            }
                    };

                    AppHandler.Common.setHeader(param);

                    if(displayNoneTagId) {
                        $("#"+displayNoneTagId).addClass("display-none");
                    } else {
                        $('#headerSub').addClass('display-none');
                    }

                    $('#loginView').css("padding-top","0px");
                    $('body, html').animate({scrollTop:0}, 50);
                }
            },
            error: function(xhr, status, error){
                AppHandler.Common.alert('Screen loading error');
            }
        });
    };

    this.pwChange = function(viewUrl, layerRenderName, completeFunction, closeFunction) {
        var paramData = {
            render : layerRenderName
            , complete: completeFunction
            , close: closeFunction
        };

        $.ajax({
            url: viewUrl,
            type: "POST",
            contentType: "application/json;charset=UTF-8",
            data: JSON.stringify(paramData),
            success: function (data, status, xhr) {
                $('#headerSub').addClass('display-none');
                $('.container').addClass('display-none');
                $('#'+layerRenderName).html(data);

                if(isApp()) {
                    var param = {
                        header: {
                            type: 'default',
                            closeAction: 'fn_layerSubClose',
                            backAction: 'fn_layerSubClose'
                        },
                        title: {
                            type: 'text',
                            text: '비밀번호 변경'
                        },
                        btnRight: {
                            type: 'close'
                        }
                    };

                    AppHandler.Common.setHeader(param);
                    $('#headerSub').addClass('display-none');
                    $('.pwd-header').addClass('display-none');
                    $('#pwChangeView').css("padding-top","0px");
                }
            },
            error: function(xhr, status, error){
                AppHandler.Common.alert('Screen loading error');
            }
        });
    };

    this.marketAgree = function(viewUrl, layerRenderName, completeFunction, closeFunction) {
        var paramData = {
            render : layerRenderName
            , complete: completeFunction
            , close: closeFunction
        };

        $.ajax({
            url: viewUrl,
            type: "POST",
            contentType: "application/json;charset=UTF-8",
            data: JSON.stringify(paramData),
            success: function (data, status, xhr) {
                $('#headerSub').addClass('display-none');
                $('.container').addClass('display-none');
                $('#'+layerRenderName).html(data);

                if(isApp()) {
                    var param = {
                        header: {
                            type: 'default',
                            closeAction: 'fn_layerSubClose',
                            backAction: 'fn_layerSubClose'
                        },
                        title: {
                            type: 'text',
                            text: '마케팅 정보 수신동의'
                        },
                        btnRight: {
                            type: 'close'
                        }
                    };

                    AppHandler.Common.setHeader(param);
                    $('#headerSub').addClass('display-none');
                    $('.mkt-header').addClass('display-none');
                    $('#marketAgreeView').css("padding-top","0px");
                }
            },
            error: function(xhr, status, error){
                AppHandler.Common.alert('Screen loading error');
            }
        });
    };

    this.setting = function(viewUrl, layerRenderName, closeFunction) {
        var oData = {
            render : layerRenderName
            , close: closeFunction
        };

        $.ajax({
            url: viewUrl,
            type: "POST",
            contentType: "application/json;charset=UTF-8",
            headers: gfn_appHeaders(),
            data: JSON.stringify(oData),
            success: function (data, status, xhr) {
                if(isApp()) {
                    var param = {
                        header: {
                            type: 'default',
                            backAction: closeFunction
                        },
                        title: {
                            type: 'text',
                            text: '설정'
                        },
                        btnLeft: {
                            type: 'back'
                        }
                    };
                    AppHandler.Common.setHeader(param);

                    //$('#headerSub').addClass('display-none');
                    //$('#loginView').css("padding-top","0px");
                    //$('body, html').animate({scrollTop:0}, 50);
                }

                $("#theaterChoiceWrap").addClass("display-none");
                $('#'+layerRenderName).html(data);
            },
            error: function(xhr, status, error){
                AppHandler.Common.alert('Screen loading error');
            }
        });
    };

}

var MobileOrder = function() {
    this.Headers = {
            mobileOrderGuide: {
                header: {
                    type: 'default'
                },
                btnRight: {
                    type: 'close'
                },
                title: {
                    type: 'text',
                    text: '모바일오더'
                }
            }
    };

    /*AppDomain.MobileOrder.mobileOrderMenu(brchNo,brchNm);*/
    this.mobileOrderMenu = function(brchNo, brchNm, flag) {

        if (!flag) flag = AppDomain.Flag.isDefault;
        //        domain: '/on/oh/ohd/StorePreOrder/cmboMenuPL.do',
        var data = {
                domain: '/mobile-order/list',
                params: {
                    page: 'cmboMenuPL',
                    brchNo: brchNo,
                    brchNm: brchNm
                },
                header: {
                    type: 'default',
                    overlay: 'clear',
                    bgColor: 'opacity',
                    txtColor: '000000'
                },
                title: {
                    type: 'text',
                    text: "모바일오더"
                },
                btnLeft: {
                    type: 'back',
                    txtColor: '000000'
                },
                btnRight: {
                    type: 'sub',
                    image: 'ico-cart',
                    txtColor: '000000',
                    callback: 'fn_mvBasketPV'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };
        AppHandler.Common.href(data);
    }

    this.mobileOrderGuide = function(flag) {

//        var alertData = {message : '준비중인 서비스입니다.'};
//        AppHandler.Common.alert(alertData);
//
//        return;

        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.mobileOrderGuide;
        data.domain = '/mobile-order/guide';
        data.animation = 'popup';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    }

    /* 극장선택, 메뉴리스트
     * AppDomain.MobileOrder.mobileOrderPrdtBrch(form, data)*/
//    this.mobileOrderBrch = function(form, paramData, flag) {
//    	if (!flag) flag = AppDomain.Flag.isDefault;
//
//    }
    /* 극장선택, 메뉴리스트
     * AppDomain.MobileOrder.mobileOrderPrdtBrch(form, data)*/
    this.mobileOrderPrdtBrch = function(form, paramData, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

//        var data = paramData;
        if(paramData.params.menuId == "M-AM-PO-02"){
            var data = {
                    header: {
                        type: 'default'
                    },
                    btnRight : {
                        type: 'close'
                    }
            }
            $.extend(paramData, data);
        }else{
            var data = {
                    header: {
                        type: 'default'
                    },
                    btnLeft : {
                        type: 'back'
                    },
                    btnRight : {
                        type: 'sub',
                        image: 'ico-cart',
                        txtColor: '000000',
                        callback: 'fn_mvBasketPV'
                    }
            }
            $.extend(paramData, data);
        }

        paramData.animation = 'popup';
        paramData.refresh = flag.refresh;
        paramData.isCloseAll = flag.isCloseAll;
        paramData.isClose = flag.isClose;

        AppHandler.Common.submit(form, paramData);
    }

    /*AppDomain.MobileOrder.cmboMenuList(paramData)*/
    this.cmboMenuList = function(paramData, flag){
        var data = {
                domain:	"/mobile-order/list",
                params		:	{
                    menuId: 'M-AM-PO-03',
                    brchNo: paramData.brchNo,
                    brchNm: paramData.brchNm,
                    storeNo:paramData.storeNo,
                    mappingId: ''
                },
                header: {
                    type: 'default'
                },
                btnLeft : {
                    type: 'back'
                },
                title : {
                    text : '모바일오더'
                },
                btnRight : {
                    type: 'sub',
                    image: 'ico-cart',
                    badge: paramData.basketCnt,
                    txtColor: '000000',
                    callback: 'fn_mvBasketPV'
                }
        }

        data.animation = 'popup';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    }

    /*장바구니*/
    /* AppDomain.MobileOrder.cmboBasket(form, data)*/
    this.cmboBasket = function(form, paramData, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;
        var data = {
                domain			:	"/mobile-order/cart"
                , params		:	{
                    menuId: 'M-AM-PO-05'
                }
                , title			:	{
                    type	:	"text"
                    , text	:	"장바구니"
                }
                , btnLeft : {
                    txtColor: '000000'
                    , type: 'back'
                }, header : {
                    type : 'default',
                    backAction : 'fn_mvCmboMenu'
                }
        }
        data.animation = 'popup';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.submit(form, data);
    }


    /* 모바일오더 메뉴 -> 스토어교환권 레이어
     * AppDomain.MobileOrder.comboSearchVcCmbnd()*/
    this.comboSearchVcCmbnd = function(flag){
        if (!flag) flag = AppDomain.Flag.isDefault;
        var data = {
            domain			:	"/on/oh/ohd/StorePreOrder/searchVcCmbnd.do"
            , params		:	{

            }
            , btnRight : {
                type: 'close'
            }
            , title			:	{
                type	:	"text"
                , text	:	"스토어 교환권"
            }
        }
        data.animation = 'popup';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);

    }

    /* 장바구니
     * AppDomain.MobileOrder.cmboBasketPM(form, data)*/
    this.cmboBasketPM = function(form, paramData, flag){
        if (!flag) flag = AppDomain.Flag.isDefault;
        var data = {
                domain			:	"/mobile-order/cart"
                , params		:	{
                    menuId: 'M-AM-PO-05'
                    , mappingId: ''
                }
                , btnLeft : {
                    type: 'back'
                }
                , title			:	{
                    type	:	'text'
                    , text	:	'장바구니'
                }
                , header : {
                    type : 'default',
                    backAction : 'fn_goCmboMenu'
                }
        }

        $.extend(data, paramData);

        data.animation = 'popup';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.submit(form, data);
    }

    /*콤보메뉴 결제*/
    /* AppDomain.MobileOrder.comboPayment(form, paramData)*/
    this.comboPayment = function(form, paramData, flag){
        if (!flag) flag = AppDomain.Flag.isDefault;
        var data = {
            domain			:	"/mobile-order/payment"
            , params		:	{
                menuId: 'M-AM-PO-05'
                , mappingId: ''
            }
            , btnLeft : {
                type: 'back'
            }
            , title			:	{
                type	:	"text"
                , text	:	"결제하기"
            }
            , header : {
                type : 'default',
                backAction : 'fn_comboPrdtList'
            }
        }

        $.extend(data, paramData);

        data.animation = 'popup';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.submit(form, data);
    }
    /*콤보메뉴 디테일*/
    /* AppDomain.MobileOrder.comboPrdtListDtl(itemNo, brchNo, brchNm, itemId)*/
    this.comboPrdtListDtl = function(itemNo, brchNo, brchNm, itemId, flag){
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain			:	"/on/oh/ohd/StorePreOrder/cmboMenuDtlsPM.do"
                , params		:	{
                    itemNo : itemNo,
                    brchNo : brchNo,
                    brchNm : brchNm,
                    menuId: 'M-AM-PO-05'
                }
                , btnLeft : {
                    txtColor: '000000'
                    , type: 'back'
                }
                , btnRight : {
                    type: 'sub',
                    image: 'ico-cart',
                    txtColor: '000000',
                    callback: 'fn_mvBasketPV'
                }
                , title			:	{
                    type	:	"text"
                    , text	:	"상품상세"
                }
        }
        if(itemId != ''){
            data.params.itemId = itemId;
        }
        data.animation = 'popup';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    }
}

var _click = false;
var _clickcontrolTimer;
var Interfere = function() {
    this.click = function(delayTime) {
        /*if(!delayTime) { delayTime = 3000; }
        if(_click) {
            return true;
        } else {
            _click = true;
            _clickcontrolTimer = setTimeout(function () {
                _click = false;
                clearTimeout(_clickcontrolTimer);
            }, delayTime);
            return false;
        }*/
        return false;
    };

    this.clear = function() {
        _click = false;
        if(_clickcontrolTimer) {
            clearTimeout(_clickcontrolTimer);
        }
    };
};

$(window).on("beforeunload", function (e){
    if(_clickcontrolTimer) {
        try { clearTimeout(_clickcontrolTimer); } catch(e) {console.log("clearTimeout Exception");}
    }
});

var AppDomain = new function() {
    this.Flag = new Flag();
    //this.Headers = new Headers();
    this.Event = new Event();
    this.Booking = new Booking();
    this.Movie = new Movie();
    this.Membership = new Membership();
    this.Hotdeal = new Hotdeal();
    this.Theater = new Theater();
    this.CustCenter = new CustCenter();
    this.MyMegabox = new MyMegabox();
    this.Benefit = new Benefit();
    this.Member = new Member();
    this.Language = new Language();
    this.CustCen = new CustCen();
    this.Setting = new Setting();
    this.Support = new Support();
    this.Store = new Store();
    this.Layer = new Layer();
    this.MobileOrder = new MobileOrder();
    this.Interfere = new Interfere();
}
/**
 * 모바일 앱 체크
 * @returns Boolean - 앱:true, 웹:false
 */
var isApp = function() {
    var result = false;
    var filterData = 'MegaBox';

    if (navigator.userAgent.indexOf(filterData) > -1) {
        return result = true;
    }

    return result;
};

var isMypage = function() {
    var pathname = document.location.pathname;

    if (pathname.indexOf('/myMegabox') != -1) return true;
    if (pathname.indexOf('/mypage')    != -1) return true;
    if (pathname.indexOf('/ohh')       != -1) return true;

    return false;
}

/**
 * 모바일 OS 구분
 * @returns String - IOS, Android
 */
function osType() {
    var type = 'IOS';
    if (navigator.userAgent.indexOf('Android') > -1 || navigator.userAgent.indexOf('ANDROID') > -1) {
        type = 'ANDROID';
    }
    return type;
};

function osTypeWithWeb() {
    var type = 'MOBILEWEB';
    if (navigator.userAgent.toLocaleLowerCase().indexOf('android') > -1) {
        type = 'ANDROID';
    } else if(navigator.userAgent.toLocaleLowerCase().indexOf('iphone') > -1) {
        type = 'IOS';
    }
    return type;
}

var setCookie = function(name, value, expires, path, domain, secure) {
    var time = new Date();
    expires = expires ? time.setDate(time.getDate() + expires) : '';
    path = path ? '; path='+path : '';
    domain = domain ? '; domain=' + domain : '';
    secure = secure ? '; secure' : '';
    document.cookie=name+'='+escape(value)+(expires?'; expires='+time.toGMTString():'')+path+domain+secure;
}

/**
 * 파라메터 Null 체크
 * @param param: String
 * @returns Boolean: Null 일 때, true
 */
function isNull(param) {
    if (param == null || param == undefined || param == 'undefined' || param == '') {
        return true;
    }
    else {
        return false;
    }
}

/**
 * Native 인터페이스
 */
var Bridge = function() {

    /**
     * IOS, Android 구분별 Native Handler
     * @returns Object
     */
    var Handler = function() {
        var appHandler;
        if (osType() == 'IOS') {
            appHandler = window.webkit.messageHandlers.MegaBox;
        }
        else {
            appHandler = window.MegaBox;
        }
        return appHandler;
    };

    /**
     * 하단 탭 메뉴로 이동
     * @param item: String - 탭 구분 (movie, store, booking, event, my)
     * @return N/A
     */
    this.selectTabBar = function(item, params) {
        var object = {
                type: 'selectTabBar',  // Native 메소드 명 (IOS용)
                data: {
                    item: item,
                    params: params
                }
        };

        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().selectTabBar(JSON.stringify(object));
        }
    };

    /**
     * 새로운 화면 오픈
     * @param data: Object - 화면호출 시 필요한 정보
     * @return N/A
     */
    this.open = function(data) {
        var object = { type: 'open', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().open(JSON.stringify(object));
        }
    };

    /**
     * 현재 화면 닫기
     * @returns N/A
     */
    this.close = function() {
        var object = { type: 'close' };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().close();
        }
    };

    /**
     * 사이드 메뉴 닫기
     * @returns N/A
     */
    this.sideMenuClose = function() {
        var object = { type: 'sideMenuClose' };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().sideMenuClose();
        }
    };

    /**
     * Native Toast
     * @param message: String - 메시지 내용
     * @returns N/A
     */
    this.toast = function(message) {
        var object = {
                type: 'toast',
                data: {
                    message: message
                }
        };

        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().toast(JSON.stringify(object));
        }
    };

    /**
     * Native Alert
     * @param title  : String - 타이틀
     * @param message: String - 내용
     * @param okText : String - 확인 버튼 텍스트
     * @param okFunc : String - 확인 버튼 콜백 함수 (콜백이 없을 때, '' 값으로 세팅)
     * @param okData : Object - 확인 버튼 콜백 함수 파라메터
     * @returns okFunc(okData)
     */
    this.alert = function(title, message, okText, okFunc, okData) {
        var object = {
                type: 'alert',
                data: {
                    title: title,
                    message: message,
                    okText: okText,
                    okFunc: okFunc,
                    okData: okData
                }
        };

        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().alert(JSON.stringify(object));
        }
    };

    /**
     * Native Confirm
     * @param title     : String - 타이틀
     * @param message   : String - 내용
     * @param okText    : String - 확인 버튼 텍스트
     * @param okFunc    : String - 확인 버튼 콜백 함수 (콜백이 없을 때, '' 값으로 세팅)
     * @param okData    : Object - 확인 버튼 콜백 함수 파라메터
     * @param cancelText: String - 취소 버튼 텍스트
     * @param cancelFunc: String - 취소 버튼 콜백 함수 (콜백이 없을 때, '' 값으로 세팅)
     * @param cancelData: Object - 취소 버튼 콜백 함수 파라메터
     * @returns okFunc(okData) or cancelFunc(cancelData)
     */
    this.confirm = function(title, message, okText, okFunc, okData, cancelText, cancelFunc, cancelData) {
        var object = {
                type: 'confirm',
                data: {
                    title: title,
                    message: message,
                    okText: okText,
                    okFunc: okFunc,
                    okData: okData,
                    cancelText: cancelText,
                    cancelFunc: cancelFunc,
                    cancelData: cancelData
                }
        };

        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().confirm(JSON.stringify(object));
        }
    };

    /**
     * 권한 체크 후 설정 화면 호출
     * @param data 권한 체크 정보
     * @returns data.callback({ success: 1 })
     */
    this.checkPermission = function(data) {
        var object = { type: 'checkPermission', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().checkPermission(JSON.stringify(object));
        }
    };

    /**
     * 위치정보 가져오기
     * @param data 콜백 함수 정보
     * @returns data.callback({ success: 1, latitude: '123.456', longitude: '123.456' })
     */
    this.location = function(data) {
        var object = { type: 'location', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().location(JSON.stringify(object));
        }
    };

    /**
     * 카메라 화면 호출
     * @param data 콜백 함수 정보
     * @returns data.callback({ success: 1, image: 'base64 string' })
     */
    this.camera = function(data) {
        var object = { type: 'camera', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().camera(JSON.stringify(object));
        }
    };

    /**
     * 앨범 화면 호출
     * @param data 콜백 함수 정보
     * @returns data.callback({ success: 1, image: 'base64 string' })
     */
    this.photoLibrary = function(data) {
        var object = { type: 'photoLibrary', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().photoLibrary(JSON.stringify(object));
        }
    };

    /**
     * 연락처 선택 화면
     * @param data 콜백 함수 정보
     * @returns data.callback({ success: 1, phoneNumber: '01012341234', name: '홍길동' })
     */
    this.contactPicker = function(data) {
        var object = { type: 'contactPicker', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().contactPicker(JSON.stringify(object));
        }
    };

    /**
     * 해더 변경
     * @param data 해더 정보
     * @returns N/A
     */
    this.setHeader = function(data) {
        var object = { type: 'setHeader', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().setHeader(JSON.stringify(object));
        }
    };

    /**
     * 현재 설치된 앱 버젼 가져오기
     * @oaram data 앱 버젼 리턴받을 함수 정보
     * @returns data.callback({ os: 'IOS or Android', code: 9, version: '1.0.0' })
     */
    this.appCurrentVersion = function(data) {
        var object = { type: 'appCurrentVersion', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().appCurrentVersion(JSON.stringify(object));
        }
    };

    /**
     * 앱스토어 이동
     * @returns N/A
     */
    this.appStore = function() {
        var object = { type: 'appStore' };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().appStore(JSON.stringify(object));
        }
    };

    /**
     * 로그인 (로그인 정보 세팅)
     * @param data 로그인정보
     * @returns N/A
     */
    this.login = function(data) {
        var object = { type: 'login', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().login(JSON.stringify(object));
        }
    };

    /**
     * 로그아웃
     * @returns N/A
     */
    this.logout = function(data) {
        var object = { type: 'logout', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().logout();
        }
    };

    /**
     * 좌석도 화면 오픈
     */
    this.seat = function(data) {
        var object = { type: 'seat', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().seat(JSON.stringify(object));
        }
    };

    /**
     * 포토카드
     */
    this.photoCard = function() {
        var object = { type: 'photoCard' };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().photoCard(JSON.stringify(object));
        }
    };

    /**
     * 광고 동영상 플레이
     */
    this.adVideoPlay = function(data) {
        var object = { type: 'adVideoPlay', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().adVideoPlay(JSON.stringify(object));
        }
    };

    /**
     * 동영상 플레이
     */
    this.videoPlay = function(data) {
        var object = { type: 'videoPlay', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().videoPlay(JSON.stringify(object));
        }
    };

    /**
     * 티켓버튼 세팅
     */
    this.setTicketButton = function(data) {
        var object = { type: 'setTicketButton', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().setTicketButton(JSON.stringify(object));
        }
    };

    /**
     * 웹 브라우저 오픈
     * @param data: Object - 웹 URL
     * @return N/A
     */
    this.link = function(data) {
        var object = { type: 'link', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().link(JSON.stringify(object));
        }
    };

    /**
     * 바코드 스캐너
     * @param data: Object
     * @return N/A
     */
    this.barcodeScanner = function(data) {
        var object = { type: 'barcodeScanner', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().barcodeScanner(JSON.stringify(object));
        }
    };

    /**
     * 해더 버튼 세팅
     */
    this.setHeaderButton = function(data) {
        var object = { type: 'setHeaderButton', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().setHeaderButton(JSON.stringify(object));
        }
    };

    /**
     * 사용자 설정 세팅
     */
    this.settingAlive = function(data) {
        var object = { type: 'settingAlive', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().settingAlive(JSON.stringify(object));
        }
    };

    /**
     * 설정 값 가져오기
     */
    this.getSettingAlive = function(data) {
        var object = { type: 'getSettingAlive', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().getSettingAlive(JSON.stringify(object));
        }
    };

    /**
     * 이미지 다운로드
     */
    this.imageDownload = function(data) {
        var object = { type: 'imageDownload', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().imageDownload(JSON.stringify(object));
        }
    };

    /**
     * 간편로그인
     * @param data { type:'FACEBOOK', callback:'javascriptFunctionName' }
     * @returns N/A
     */
    this.simpleLogin = function(data) {
        var object = { type: 'simpleLogin', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().simpleLogin(JSON.stringify(object));
        }
    };

    /**
     * SNS 공유
     */
    this.share = function(data) {
        var object = { type: 'share', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().share(JSON.stringify(object));
        }
    };

    /**
     * 로딩바 show
     */
    this.startLoadingBar = function() {
        var object = { type: 'startLoadingBar' };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().startLoadingBar();
        }
    };

    /**
     * 로딩바 hide
     */
    this.stopLoadingBar = function() {
        var object = { type: 'stopLoadingBar' };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().stopLoadingBar();
        }
    };

    /**
     * 부모창 새로고침
     * @param targets ['opener','movie','store','booking','event','my','side']
     * @param isClose 현재창 닫기 여부
     * @param params 사용자정보
     */
    this.parentRefresh = function(targets, isClose, params) {
        var object = {
                type: 'parentRefresh',
                data: {
                    targets: targets,
                    isClose: isClose,
                    params: params
                }
        };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().parentRefresh(JSON.stringify(object));
        }
    };

    /**
     * Access Token 세팅
     */
    this.setAccessToken = function(accessToken) {
        var object = {
                type: 'setAccessToken',
                data: {
                    accessToken: accessToken
                }
        };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().setAccessToken(JSON.stringify(object));
        }
    };

    /**
     * 키보드 화면 덮어쓰기
     */
    this.keyboardCovered = function(isCovered) {
        var object = {
                type: 'keyboardCovered',
                data: {
                    isCovered: isCovered
                }
        };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().keyboardCovered(JSON.stringify(object));
        }
    };
};

/**
 * 앱, 웹 구분별 이벤트
 */
var Common = function() {

    this.Bridge = new Bridge();

    /**
     * toast
     * @param message: String
     * @returns N/A
     */
    this.toast = function(message) {
        // 모바일 앱 일 때
        if (isApp()) {
            this.Bridge.toast(message);
        }
        else {
            // TODO - 웹 Toast Message 구현
        }
    };

    /**
     * alert
     * @param data: Object
     * @returns N/A
     */
    this.alert = function(data) {

        // 파라메터 Object 일 때
        if (data instanceof Object) {
            var title = isNull(data.title) ? '' : data.title;
            var message = isNull(data.message) ? '' : data.message;
            var okText = isNull(data.okText) ? '확인' : data.okText;
            var okFunc = isNull(data.okFunc) ? '' : data.okFunc;
            var okData = isNull(data.okData) ? '' : data.okData;

            // 모바일 앱 일 때
            if (isApp()) {
                this.Bridge.alert(title, message, okText, okFunc, okData);
            }
            else {
                // 콜백 함수가 있을 때
                if (okFunc != '') {
                    alert(message);

                    // 콜백 함수 파라메터가 있을 때
                    if (okData != '') {
                        eval(okFunc)(okData);
                    }
                    else {
                        eval(okFunc)();
                    }
                }
                else {
                    alert(message);
                }
            }
        }
        // 파라메터 String 일 때
        else {
            // 모바일 앱 일 때
            if (isApp()) {
                this.Bridge.alert('', data, '확인', '', '');
            }
            else {
                alert(data);
            }
        }
    };

    /**
     * confirm
     * @param data: Object
     * @returns Boolean
     */
    this.confirm = function(data) {

        // 파라메터 Object 일 때
        if (data instanceof Object) {
            var title = isNull(data.title) ? '' : data.title;
            var message = isNull(data.message) ? '' : data.message;
            var okText = isNull(data.okText) ? '확인' : data.okText;
            var okFunc = isNull(data.okFunc) ? '' : data.okFunc;
            var okData = isNull(data.okData) ? '' : data.okData;
            var cancelText = isNull(data.cancelText) ? '취소' : data.cancelText;
            var cancelFunc = isNull(data.cancelFunc) ? '' : data.cancelFunc;
            var cancelData = isNull(data.cancelData) ? '' : data.cancelData;

            // 모바일 앱 일 때
            if (isApp()) {
                this.Bridge.confirm(title, message, okText, okFunc, okData, cancelText, cancelFunc, cancelData);

                // 모바일 앱은 Native에서 호출하기 때문에 항상 false
                // 버튼별 콜백 함수를 세팅해서 사용한다.
                return false;
            }
            else {
                if (confirm(message)) {
                    // 콜백 함수가 있을 때
                    if (okFunc != '') {
                        // 콜백 함수 파라메터가 있을 때
                        if (okData != '') {
                            eval(okFunc)(okData);
                        }
                        else {
                            eval(okFunc)();
                        }
                    }
                    else {
                        return true;
                    }
                } else {
                    // 콜백 함수가 있을 때
                    if (cancelFunc != '') {
                        // 콜백 함수 파라메터가 있을 때
                        if (cancelData != '') {
                            eval(cancelFunc)(cancelData);
                        }
                        else {
                            eval(cancelFunc)();
                        }
                    }
                    else {
                        return false;
                    }
                }
            }
        }
    };

    /**
     * form.submit()
     * @param form: Object - form 객체
     * @param data: Object - 화면호출 시 필요한 정보
     * @returns N/A
     */
    this.submit = function(form, data) {
        if (isNull(form) || isNull(data.domain)) return;

        // 모바일 앱 일 때
        if (isApp()) {
            if (isNull(data.params)) data.params = {};
            if (isNull(data.header)) data.header = {};
            if (isNull(data.header.type)) data.header.type = 'default';
            if (isNull(data.title)) data.title = {};
            if (isNull(data.title.type)) data.title.type = 'logo';

            form.find('input').each(function(i) {
                data.params[$(this).attr('name')] = encodeURIComponent($(this).val());
            });

            this.Bridge.open(data);
        }
        else {
            form.attr('action', data.domain);
            var attr = '?';
            if (!isNull(data.params)) {
                $.each(data.params, function(k, v) {

                    //넷퍼넬 키값 존재시 파라미터 셋팅
//                    if( $(form).find("#netfunnel_key").length > 0 ){
//                        attr = k + "=" + v;
//                    }else{
//                        if( form.find('[name="'+k+'"]').length == 0 ){
//                            form.append("<input type='hidden' name='"+k+"' value='" + v + "' />");
//                        }else {
//                            form.find('[name="'+k+'"]').val(v);
//                        }
//                    }
                    if(k != 'netfunnel_key') {
                        attr += k + "=" + v + "&";

                        if( $(form).find("#netfunnel_key").length == 0 ){
                            if( form.find('[name="'+k+'"]').length == 0 ){
                                form.append("<input type='hidden' name='"+k+"' value='" + v + "' />");
                            }else {
                                form.find('[name="'+k+'"]').val(v);
                            }
                        }
                    }
                });
            }

            /**
             * 넷퍼넬 키값 존재시
             *  키값을 제외하고 URL노출
             */
            if( $(form).find("#netfunnel_key").length > 0 ){
                if(attr == '?') attr = '';
                form.attr('action', data.domain + attr.substring(0, attr.length-1));
            }

            if (isNull(data.isClose)) data.isClose = false;
            if (data.isClose) {
                form.target = '_self';
            }
            form.submit();
        }
        controlAction.off();
    }

    /**
     * location.href
     * @param data: Object - 화면호출 시 필요한 정보
     */
    this.href = function(data) {
        if (isNull(data.domain)) return;

        // 모바일 앱 일 때
        if (isApp()) {
            if (isNull(data.params)) data.params = {};
            if (isNull(data.header)) data.header = { type: 'default' };
            if (isNull(data.title)) data.title = { type: 'logo' };

            $.each(data.params, function(key, value){
                var encodeValue = encodeURIComponent(value);
                data.params[key] = encodeValue;
            });

            this.Bridge.open(data);
        }
        else {
            var queryString = "";
            for(var key in data.params) {
                if(queryString != "") {
                    queryString += "&"
                }
                queryString += (key + "=" + data.params[key]);
            }

            if (isNull(data.isClose)) data.isClose = false;
            if (!data.isClose) {
                if(queryString != "") {
                    location.href = data.domain + "?" + queryString;
                } else {
                    location.href = data.domain;
                }
            }
            else {
                if(queryString != "") {
                    location.replace(data.domain + "?" + queryString);
                } else {
                    location.replace(data.domain);
                }
            }
        }
        controlAction.off();
    };

    /**
     * location.link - 웹 브라우저
     * @param data
     * - domain: 링크주소
     * - isClose: 현재창 닫기 여부
     * - isScheme: 스키마 체크 여부
     */
    this.link = function(data) {
        if (isNull(data.domain)) return;

        // 모바일 앱 일 때
        if (isApp()) {
            this.Bridge.link(data);
        }
        else {
            if (isNull(data.isClose)) data.isClose = false;
            if (!data.isClose) {
                location.href = data.domain;
            }
            else {
                location.replace(data.domain);
            }
        }
    };

    /**
     * 현재 화면 닫기
     * @returns N/A
     */
    this.close = function(step) {
        if(!step){
            step = -1;
        }
        // 모바일 앱 일 때
        if (isApp()) {
            this.Bridge.close();
        }
        else {
            if(document.referrer) {
                var lastSplit = document.referrer.lastIndexOf("/");
                if(document.referrer.indexOf("main") > -1
                    || lastSplit == document.referrer.length-1) {
                    this.goMain();
                } else if(document.referrer.indexOf("myMegabox") > - 1) {
                    this.goMy();
                } else if(document.referrer.indexOf("eventNo") > - 1){
                    location.replace(document.referrer);
                } else {
                    history.go(step);
                }
            } else {
                history.go(step);
            }
        }
    };

    /**
     * 사이드 메뉴 닫기
     * @returns N/A
     */
    this.sideMenuClose = function() {
        // 모바일 앱 일 때
        if (isApp()) {
            this.Bridge.sideMenuClose();
        }
        else {
            // TODO: 사이드 메뉴 닫기
        }
    };

    /**
     * 메인 화면으로 이동 (Native 영화 탭)
     * @returns N/A
     */
    this.goMain = function(isClose) {
        // 모바일 앱 일 때
        if (isApp()) {
            this.Bridge.selectTabBar('movie');
        }
        else {
            if (isClose) {
                location.replace('/main');
            }
            else {
                location.href = '/main';
            }
        }
    };

    /**
     * 스토어 화면으로 이동 (Native 스토어 탭)
     * @returns N/A
     */
    this.goStore = function() {
        // 모바일 앱 일 때
        if (isApp()) {
            this.Bridge.selectTabBar('store');
        }
        else {
            //location.replace('/store');
            location.href = '/store';
        }
    };

    /**
     * 예매 화면으로 이동 (Native 예매 탭)
     * @returns N/A
     */
    this.goBooking = function() {
        // 모바일 앱 일 때
        if (isApp()) {
            this.Bridge.selectTabBar('booking');
        }
        else {
            //location.replace('/booking');
            location.href = '/booking';
        }
    };

    /**
     * 이벤트 화면으로 이동 (Native 이벤트 탭)
     * @returns N/A
     */
    this.goEvent = function(tabDivCd) {
        // 모바일 앱 일 때
        if (isApp()) {
            var params = null;
            if (tabDivCd) {
                params = { tabDivCd: tabDivCd };
            }
            this.Bridge.selectTabBar('event', params);
        }
        else {
            if(tabDivCd) {
                //location.replace('/event?tabDivCd='+tabDivCd);
                location.href = '/event?tabDivCd='+tabDivCd;
            } else {
                //location.replace('/event');
                location.href = '/event';
            }
        }
    };

    /**
     * 마이 화면으로 이동 (Native 마이 탭)
     * @returns N/A
     */
    this.goMy = function() {
        // 모바일 앱 일 때
        if (isApp()) {
            this.Bridge.selectTabBar('my');
        }
        else {
            //location.replace('/myMegabox');
            location.href = '/myMegabox';
        }
    };

    /**
     * 권한 체크 후 설정 화면 호출
     * @param data 권한 체크 정보
     * @returns data.callback({success:1})
     */
    this.checkPermission = function(data) {
        if (isNull(data.permission) || isNull(data.callback)) return;

        // 모바일 앱 일 때
        if (isApp()) {
            this.Bridge.checkPermission(data);
        }
        else {
            // TODO: 모바일 웹
        }
    };

    this.goPc = function() {
        // 모바일 앱 일 때
        if (isApp()) {
            //this.Bridge.selectTabBar('movie');
        }
        else {

            var returnPath = "";

            if( location.pathname.indexOf("/event") > -1 ||
                location.pathname.indexOf("/store") > -1 ||
                location.pathname.indexOf("/movie") > -1
                    ){
                returnPath = location.pathname;
            }

            $.ajaxMegaBox({
                url      : "/getToken",
                async    : false,
                success  : function (data, textStatus, jqXHR) {
                },
                error    : function (data, textStatus, jqXHR) {
                },
                complete : function (data, textStatus, jqXHR) {
                    setCookie("FROM_MOBILE_WEB", "Y", 30, "", location.host.substr(location.host.indexOf(".")));
                    location.href = $(".PCVER").data("url") + "/sessionCpResponse?returnPath="+ returnPath + location.search + "&token="+ encodeURIComponent(data.responseJSON.token);
                }
            });
        }
    };

    /**
     * 위치정보 가져오기
     * @param data 콜백 함수 정보
     * @returns data.callback({success:1, latitude:'31.123', longitude:'128.123'})
     */
    this.location = function(data) {
        if (isNull(data.callback)) return;

        // 모바일 앱 일 때
        if (isApp()) {
            this.Bridge.location(data);
        }
        else {
            // TODO: 모바일 웹
        }
    };

    /**
     * 카메라 화면 호출
     * @param data 콜백 함수 정보
     * @returns data.callback({success:1, image:'base64 string'})
     */
    this.camera = function(data) {
        if (isNull(data.callback)) return;

        // 모바일 앱 일 때
        if (isApp()) {
            this.Bridge.camera(data);
        }
        else {
            // TODO: 모바일 웹
        }
    };

    /**
     * 앨범 화면 호출
     * @param data 콜백 함수 정보
     * @returns data.callback({success:1, image:'base64 string'})
     */
    this.photoLibrary = function(data) {
        if (isNull(data.callback)) return;

        // 모바일 앱 일 때
        if (isApp()) {
            this.Bridge.photoLibrary(data);
        }
        else {
            // TODO: 모바일 웹
        }
    };

    /**
     * 연락처 선택 화면 호출
     * @param data 콜백 함수 정보
     * @returns data.callback({success:1, phoneNumber:'01012341234', name:'홍길동'})
     */
    this.contactPicker = function(data) {
        if (isNull(data.callback)) return;

        // 모바일 앱 일 때
        if (isApp()) {
            this.Bridge.contactPicker(data);
        }
        else {
            // TODO: 모바일 웹
        }
    };

    /**
     * 해더 변경
     * @param data 해더 정보
     * @returns N/A
     */
    this.setHeader = function(data) {
        // 모바일 앱 일 때
        if (isApp()) {
            if (isNull(data.header) || isNull(data.header.type) || isNull(data.title.type)) return;
            this.Bridge.setHeader(data);
        }
        else {
            // TODO: 모바일 웹
        }
    };

    /**
     * 이메일 체크
     * @param data 해더 정보
     * @returns N/A
     */
    this.verifyEmail = function(email) {
        var emailVal = email;
        var regExp = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i;
        return emailVal.match(regExp) != null ? 'Y' : 'N'
    };

    /**
     * 현재 설치된 앱 버젼 가져오기
     * @oaram data 앱 버젼 리턴받을 함수 정보
     * @returns data.callback({ os: 'IOS or ANDROID', code: 9, version: '1.0.0' })
     */
    this.appCurrentVersion = function(data) {
        if (isApp()) {
            if (isNull(data.callback)) return;
            this.Bridge.appCurrentVersion(data);
        }
    };

    /**
     * 앱스토어, 플레이스토어 이동
     * @returns N/A
     */
    this.appStore = function() {
        if (isApp()) {
            this.Bridge.appStore();
        }
    };

    /**
     * 로그인 (로그인 정보 세팅)
     * @param data 로그인 정보
     * @returns N/A
     */
    this.login = function(data) {
        if (isNull(data)) return;
        if (isNull(data.autoLogin)) data.autoLogin = 'N';
        if (isNull(data.nonMbLogin)) data.nonMbLogin = 'N';
        if (data.autoLogin == 'Y' && data.nonMbLogin == 'N') {
            if (isNull(data.mbNo) || isNull(data.loginId)) return;
        }
        if (data.autoLogin == 'Y' && data.nonMbLogin == 'Y') {
            if (isNull(data.nonMbNm) || isNull(data.nonMbTelno) || isNull(data.nonMbByymmdd)) return;
        }

        if (isNull(data.action)) data.action = 'close';

        if (isApp()) {
            if (data.action != 'close' && data.action != 'main' && data.action != 'none' && data.action != 'refresh') {
                var script = data.action;
                data.action = 'none';
                this.Bridge.login(data);
                eval(script)({refresh: false, isCloseAll: false, isClose: true});
            }
            else {
                this.Bridge.login(data);
            }
        }
        else {
            if (data.action == 'main') {
                this.goMain();
            }
            else if (data.action == 'close') {
                this.close();
            }
            else if (data.action == 'refresh') {
                this.close();
            }
            else {
                if(data.action != 'none') {
                    eval(data.action)({refresh: false, isCloseAll: false, isClose: true});
                }
            }
        }
    };

    /**
     * 로그아웃
     * @returns N/A
     */
    this.logout = function() {
        if (isApp()) {
            $.ajax({
                url: '/api/session/clear',
                type: 'POST',
                contentType: 'application/json;charset=UTF-8',
                data: null,
                success: function (data, status, xhr) {
                    AppHandler.Common.logoutApp(data);
                },
                error: function(xhr, status, error) {
                    AppHandler.Common.logoutApp();
                }
            });

        }
        else {
            location.href = '/on/oh/ohg/MbLogin/mbLogout.do';
        }
    };

    this.logoutApp = function(data) {
        this.Bridge.logout(data);
    };

    /**
     * 좌석도 화면 오픈
     * @param data
     * @returns N/A
     */
    this.seat = function(data) {
        if (isNull(data.playSchdlNo) || isNull(data.admisClassCd)) return;

        if (isApp()) {
            this.Bridge.seat(data);
        }
        else {

        }
    };

    /**
     * 포토카드 오픈
     * @param data
     * @returns N/A
     */
    this.photoCard = function() {
        if (isApp()) {
            this.Bridge.photoCard();
        }
    };

    /**
     * 광고 동영상 플레이
     * @param data
     * @returns N/A
     */
    this.adVideoPlay = function(data) {
        if (isNull(data.videoFile)) return;
        if (isApp()) {
            this.Bridge.adVideoPlay(data);
        }
    };

    /**
     * 동영상 플레이
     * @param data
     * @returns N/A
     */
    this.videoPlay = function(data) {
        if (isNull(data.videoFile)) return;
        if (isApp()) {
            this.Bridge.videoPlay(data);
        }
        else {
            location.href = data.videoFile;
        }
    };

    /**
     * 티켓버튼 세팅
     * @param data
     * @returns N/A
     */
    this.setTicketButton = function(data) {
        if (isApp()) {
            this.Bridge.setTicketButton(data);
        }
    };

    /**
     * 바코드 스캐너
     * @param data: Object
     * @return N/A
     */
    this.barcodeScanner = function(data) {
        if (isApp()) {
            this.Bridge.barcodeScanner(data);
        }
    };

    /**
     * 해더 버튼 세팅
     * @param data
     * @returns N/A
     */
    this.setHeaderButton = function(data) {
        if (isApp()) {
            this.Bridge.setHeaderButton(data);
        }
    };

    this.snSshare = function(id, imgUrl, title, content) {
        var paramData = {
                id : id,
                imgUrl : imgUrl,
                title : title,
                content : content
        };
        $.ajax({
            url: "/sns/share",
            type: "POST",
            contentType: "application/json;charset=UTF-8",
            data: JSON.stringify(paramData),
            success: function (data, textStatus, jqXHR) {

                if ($("#"+id).length == 0) {
                    if ($('[id^=tmpLayer]').length != 0) {
                        $('.container:last').append('<div id="'+ id +'" class="display-none layer-popup-bt"></div>');
                    } else {
                        $('body').append('<div id="'+ id +'" class="display-none layer-popup-bt"></div>');
                    }
                }
                $("#"+id).html(data);
                gfn_miniLayer(id);
            },
            error: function(xhr,status,error){
                 var err = JSON.parse(xhr.responseText);
                 alert(xhr.status);
                 alert(err.message);
            }
        });
    };

    /**
     * 사용자 설정 세팅
     */
    this.settingAlive = function(data) {
        if (isApp()) {
            this.Bridge.settingAlive(data);
        }
    };

    /**
     * 설정 값 가져오기
     */
    this.getSettingAlive = function(data) {
        if (isApp()) {
            this.Bridge.getSettingAlive(data);
        }
    };

    /**
     * 이미지 다운로드
     * @param data { image:'image url', callback:'javascriptFunctionName' }
     * @returns { success:1 }
     */
    this.imageDownload = function(data) {
        if (isNull(data.image)) return;
        if (isApp()) {
            this.Bridge.imageDownload(data);
        }
    };

    /**
     * 간편로그인
     * @param type: 'FACEBOOK'
     * @param callback: 'javascriptFunctionName'
     * @param simpleLoginWithPopup: window
     * @returns window
     */
    this.simpleLogin = function(type, callback, simpleLoginWithPopup) {
        if (isApp()) {
            var data = {
                    type: type,
                    callback: callback
            };
            this.Bridge.simpleLogin(data);
            return null;
        }
        else {
            var url = '/on/oc/ocz/SimpleLogin/simpleLogin.do?lnkgTy=' + type;

            if(simpleLoginWithPopup) {
                simpleLoginWithPopup.close();
            }

            if(type != "FACEBOOK"){
                simpleLoginWithPopup = window.open(url, 'simpleLoginWithPopup', 'width=420, height=550');
            } else {
                simpleLoginWithPopup = window.open(url, 'simpleLoginWithPopup', 'width=650, height=600, scrollbars=yes');
            }

            return simpleLoginWithPopup;
        }
    };

    /**
     * SNS 공유
     */
    this.share = function(data) {
        if (isApp()) {
            this.Bridge.share(data);
        }
    };

    /**
     * 로딩바 show
     */
    this.startLoadingBar = function() {
        if (isApp()) {
            this.Bridge.startLoadingBar();
        }
        else {
            // TODO: Web Loading Bar
        }
    };

    /**
     * 로딩바 hide
     */
    this.stopLoadingBar = function() {
        if (isApp()) {
            this.Bridge.stopLoadingBar();
        }
        else {
            // TODO: Web Loading Bar
        }
    };

    /**
     * 부모창 새로고침
     * @param
     * data
     * - targets ['opener','movie','store','booking','event','my','side']
     * - isClose 현재창 닫기 여부
     * - step 뒤로가기 스텝 (isClose true 일 때, 웹에서만 사용)
     * - params 사용자 정보
     */
    this.parentRefresh = function(data) {
        if (!data) {
            data = { targets: ['opener'] };
        }
        if (!data.targets) {
            data.targets = ['opener'];
        }

        if (!data.isClose) {
            data.isClose = false;
        }

        if (isApp()) {
            this.Bridge.parentRefresh(data.targets, data.isClose, data.params);
        }
        else {
            if (data.isClose) {
                if (!data.step) data.step = -1;
                this.close(data.step);
            }
        }
    };

    /**
     * Access Token 세팅
     */
    this.setAccessToken = function(accessToken) {
        if (isApp()) {
            this.Bridge.setAccessToken(accessToken);
        }
    };

    /**
     * 키보드 화면 덮어쓰기
     * @param isCovered
     * - ture : 화면 위로 덮어쓰기
     * - false : 화면을 위로 밀기
     */
    this.keyboardCovered = function(isCovered) {
        if (isApp()) {
            this.Bridge.keyboardCovered(isCovered);
        }
    };
};

var AppHandler = new function() {
    this.Common = new Common();
}
jQuery.fn.serializeObject = function(){
	var obj = null; /* 리턴 오브젝트 */
	try{
		/*this = 해당폼*/
		/*폼 태그 벨류값이 있어야 하며, 폼 태그 네임이 form이여야함*/
		if(this[0].tagName && this[0].tagName.toUpperCase() == "FORM"){
			/*제이쿼리 시리얼라이즈어레이를 이용해서 키와 벨류 값을 나눠 row로 만듬*/
			var itemArr = this.serializeArray();

			if(itemArr){ /*값이 있다면*/
				obj = {}; /*리턴 오브젝트를 초기화 한 후*/
				$.each(itemArr, function(){ /*itemArr 로우 만큼*/
					obj[this.name] = this.value; /*오브젝트에 키 : 벨류 형식으로 저장한다.*/
				});
			}
		}
	}catch(e){
		alert(e.message);
	}finally{}
	return obj;
}

jQuery.fn.serializeObjectKV = function(){
	var obj = null; /* 리턴 오브젝트 */
	try{
		/*this = 해당폼*/
		/*폼 태그 벨류값이 있어야 하며, 폼 태그 네임이 form이여야함*/
		if(this[0].tagName && this[0].tagName.toUpperCase() == "FORM"){
			/*제이쿼리 시리얼라이즈어레이를 이용해서 키와 벨류 값을 나눠 row로 만듬*/
			var itemArr = this.serializeArray();

			if(itemArr){ /*값이 있다면*/
				obj = {}; /*리턴 오브젝트를 초기화 한 후*/
				$.each(itemArr, function(){ /*itemArr 로우 만큼*/
					obj[this.name] = this.value; /*오브젝트에 키 : 벨류 형식으로 저장한다.*/
					obj["key"] = this.name;
				});
			}
		}
	}catch(e){
		alert(e.message);
	}finally{}
	return obj;
}

jQuery.fn.serializeFormArray = function(){
	var formArray = Array();
	if(this[0].class){
		try{
			for(var i in this.length){
				formArray.push(this[i].serializeObject());
			}
		}catch(e){
			alert(e.message);
		}finally{}
	}
	return formArray;
}

var appHeaders = {};
var arrLayer = {};
var noneClass = 'display-none';

$(document).ready(function() {
    var path = location.pathname;
    if (path.indexOf('/movie/boxoffice') == 0 ||        // 영화목록 (박스오피스)
            path.indexOf('/movie/comingsoon') == 0 ||   // 영화목록 (상영예정작)
            path.indexOf('/movie/curation') == 0 ||     // 영화목록 (큐레이션)
            path.indexOf('/movie/festival') == 0 ||     // 영화목록 (영화제)
            path.indexOf('/movie-detail') == 0 ||       // 영화상세
            path.indexOf('/moviepost/all') == 0 ||      // 무비프스트 목록
            path.indexOf('/moviepost/detail') == 0 ||   // 무비프스트 상세
            path.indexOf('/mypage/moviestory') == 0 ||  // 나의 무비스토리
            path.indexOf('/mypage/bookinglist') == 0 || // 예매/구매 내역
            path.indexOf('/event/detail') == 0          // 이벤트 상세
            ) {

        if (path.indexOf('/event/detail') == 0) {
            $('#btnScrollTop').addClass('event-detail-top');
        }

        $(window).scroll(function() {
            if($(window).scrollTop() >= 150) {
                $('#btnScrollTop').show();
            }
            else {
                $('#btnScrollTop').hide();
            }
        });
    }

    //광고링크
    $("#pageBannerImage").on("click", function() {
        var clickThrough = $(this).attr("clickThrough");
        if(clickThrough != undefined && clickThrough != '') {
            fn_goAdLink(clickThrough);
        }
    });
});

function gfn_scrollTop() {
    $(window).scrollTop(0);
}

/*페이지 처음실행 후 로그인체크하고 해당 펑션 실행*/
function gfn_loginChkPostProcess(rtFn, data){
    var result = false;
    rtFn = !rtFn ? "AppHandler.Common.goMain" : rtFn;

    $.ajax({
        url: "/on/oh/ohg/MbLogin/selectLoginSession.do",
        type: "POST",
        async: false,
        contentType: "application/json;charset=UTF-8",
        success: function (data, status, xhr) {
            var loginAt   = data.resultMap.result;
            var nonMbLoginAt = data.resultMap.nonMbLogin;

            if (loginAt == 'Y' && nonMbLoginAt == 'N') {
            	result = true;
            }
            else {
            	alert('로그인이 필요한 서비스입니다.');
                eval(rtFn)(data);
            }
        },
        error: function(xhr, status, error) {
        	alert('로그인이 필요한 서비스입니다.');
            eval(rtFn)(data);
        }
    });

    return result;
    /*var chk = false;
    rtFn = !rtFn ? "AppHandler.Common.goMain" : rtFn;

    $.ajax({
        url    : "/on/oh/ohg/MbLogin/selectLoginSession.do",
        async  : false,
        success: function(result){
            if(result.resultMap.result == "Y" && result.resultMap.nonMbLogin == "N"){
                chk = true;
            }
        }
    });
    if(!chk){
        var mData = {
                message : '로그인이 필요한 서비스입니다.'
        },
        AppHandler.Common.alert(mData);
        eval(rtFn)(data);
    }else{
        return chk;
    }*/
}


function gfn_loginChk(){
    var chk = false;
    $.ajax({
        url    : "/on/oh/ohg/MbLogin/selectLoginSession.do",
        success: function(result){
            return chk = result.resultMap.result;
        }
    });
}

//로그인 여부 체크
function fn_rlyLoginchk() {
    var result = false;

    $.ajax({
        url: "/on/oh/ohg/MbLogin/selectLoginSession.do",
        type: "POST",
        async: false,
        contentType: "application/json;charset=UTF-8",
        success: function (data, status, xhr) {
            var loginAt   = data.resultMap.result;
            var nonMbLoginAt = data.resultMap.nonMbLogin;

            if (loginAt != 'Y' || nonMbLoginAt == 'Y') {
                confirmLogin();
            }
            else {
                result = true;
            }
        },
        error: function(xhr, status, error) {
            confirmLogin();
        }
    });

    return result;
}

function confirmLogin() {
    var data = {
            message: '로그인 후 이용 가능한 서비스입니다.\n로그인하시겠습니까?',
            title: '',
            okFunc: 'fn_loginPageOkCallback',
            okData: {
                domain : "/on/oh/ohg/MbLogin/viewMbLoginMainPage.rest",
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '로그인'
                },
                btnRight: {
                    type: 'close'
                }
            }
    };
    AppHandler.Common.confirm(data);
}

//링크 구분에 따라 url 이동을 한다.
function fn_goMoveLink(link_gbn, link_url) {
    alert("link_gbn : " + link_gbn + " , link_url : " + link_url + " 준비중 입니다");
    return;
}

//	이미지 공통 지연로드
//	param : clNm  클레스네임
function gfn_lozadStart(clNm){
    lozad('.lozad', {
        threshold: 0
    }).observe();
}

/* 특수 기호 HTML 코드 변환
추후 더 추가 할것
*/
function gfn_scrtDecode(text){
    if(text){
        text = text.replace(/&lt;/gi,"<")
        .replace(/&amp;&#35;40;/gi,"&#40;")
        .replace(/&amp;&#35;41;/gi,"&#41;")
        .replace(/&gt;/gi,">")
        .replace(/&#41;/gi,")")
        .replace(/&#40;/gi,"(")
        .replace(/&amp;/gi,"&")
        .replace(/&quot;/gi,'"')
        .replace(/&nbsp;/gi," ")
        .replaceAll("&#39;", "'").replaceAll("&#39;", "'");
    }else{
        text = '';
    }
    return text;
}

/**
* 법적연령 만 나이 구하기
* @param  {string} 생년월일
* @return {number} 나이
*/
function fn_calcAge(birth) {
    var date = new Date();
    var year = date.getFullYear();
    var month = (date.getMonth() + 1);
    var day = date.getDate();
    if (month < 10) month = '0' + month;
    if (day < 10) day = '0' + day;
    var monthDay = month + day;

    birth = birth.replace('-', '').replace('-', '');
    var birthdayy = birth.substr(0, 4);
    var birthdaymd = birth.substr(4, 4);

    var age = monthDay < birthdaymd ? year - birthdayy - 1 : year - birthdayy;

    return age;
}

/**
* Enter Key Check & function execution
* @param {function} function
*/
function fn_checkEnterKey(funcObj) {
    if(event.keyCode == 13) {
        eval(funcObj);
    }
}

/*
통화 콤마
@param String Ex) 1500000
@return 1,500,000
*/
function fn_wonUnitChng(num){
    var len, point, str;

    num = num.toString().indexOf(",") > 0 ? (num + "").replace(/[,]/gi, "") : (num + "");
    point = num.length % 3 ;
    len = num.length;
    str = num.substring(0, point);

    while (point < len) {
        if (str != ""){
            str += ",";
        }
        str += num.substring(point, point + 3);
        point += 3;
    }
    return str;
}
/*

*/
function gfn_setPageParams(pageIdx, pageCnt, searchData){
    var rtData = $.extend({
        lastIdx 	: 	Number(pageIdx) * Number(pageCnt),
        firstIdx 	: 	(Number(pageIdx) - 1) * Number(pageCnt),
        pageIdx		:	pageIdx,
        pageCnt		:	pageCnt
    },searchData); /* 리턴 데이터 */
    return rtData;
}

function gfn_maxZindex(){
    var zIndexSet = $("*").length;	/* 전체 태그 갯수 */
    var rtIndex = 0 ;				/* z-index 초기 값 0 */

    //전체 태그에서 z-index 값을 비교 해서 제일 큰 수의 z-index값을 구해온다.
    for(var i = 0 ; i < zIndexSet ; i++){
        if(isNaN($("*").eq(i).css("z-index")) != true){						/* auto를 제외 하기 위함  */
            //다음 엘리먼트 z-index 값과 비교 해서 큰 값을 집어 넣는다
            rtIndex = rtIndex < Number($("*").eq(i).css("z-index")) ? $("*").eq(i).css("z-index") : rtIndex;
        }
    }
    return Number(rtIndex) + 1;		/* 제일 큰 값 + 1 */
}

/**
* 상영 등급 CSS Class 조회
* @param {string} 상영 등급 코드
* @param {string} 구분자 [medium:기본 사이즈 보다 한단계 큼]
* @return {string} 상영 등급 CSS Class
*/
function gfn_getPlayClassCssClass(playClassCd, flag) {
// admisClassCd (상영 등급 코드) => [AD01:전체관람가], [AD02:12세이상관람가], [AD03:15세이상관람가], [AD04:청소년관람불가]
// class => [AD01:ico-pg-all], [AD02:ico-pg-12], [AD03:ico-pg-15], [AD04:ico-pg-20]

    var returnValue = '';

    var divFlag = (flag != undefined && flag != '' ? flag + '-' : '');

    if(playClassCd == 'AD01') {
        returnValue = 'ico-pg-' + divFlag + 'all';
    }else if(playClassCd == 'AD02') {
        returnValue = 'ico-pg-' + divFlag + '12';
    }else if(playClassCd == 'AD03') {
        returnValue = 'ico-pg-' + divFlag + '15';
    }else if(playClassCd == 'AD04') {
        if(fn_displayAfterPeriod(2024,5,1,'after')) {
          returnValue = 'ico-pg-' + divFlag + '19';
        } else {
          returnValue = 'ico-pg-' + divFlag + '20';
        }
    }else {
        returnValue = 'ico-pg-none';
    }

    return returnValue;
}

/**
 * 극장별, 영화별예매 상영스케줄리스트 조회 등급 CSS Class 조회
 * @param admisCd
 * @param size
 */
function gfn_getSchedListAdmisCdCss(admisCd, size) {
  let cssCd = ''
  if(admisCd == '' || admisCd == undefined || size == '' || size == undefined) return cssCd;

  if(admisCd === 'AD01') {//all
    cssCd = 'i_all_w' + size;
  } else if(admisCd === 'AD02') {//12
    cssCd = 'i_12_w' + size;
  } else if(admisCd === 'AD03') {//15
    cssCd = 'i_15_w' + size;
  } else if(admisCd === 'AD04') {//19
    cssCd = 'i_19_w' + size;
  } else {//미정
    cssCd = 'i_no_w' + size;
  }

  return cssCd;
}

/**
* 날짜 포멧
* @param strDate
* @returns {string}
*/
function gfn_dateFormat(strDate) {
    if(!strDate) return "";

    var formatNum = "";
    strDate = strDate.replace(/\s/gi,"");

    try {
    if(strDate.length == 8) {
    formatNum = strDate.replace(/(\d{4})(\d{2})(\d{2})/,'$1.$2.$3');
    }
    } catch (e) {
    console.log(e)
    }

    return formatNum;
}

/**
* 뒤로가기
* @param n
*/
function gfn_historyBack(n) {
    if(document.referrer) {
        var lastSplit = document.referrer.lastIndexOf("/");
        if(document.referrer.indexOf("main") > -1
            || lastSplit == document.referrer.length-1) {
            AppHandler.Common.goMain();
        } else {
            history.go(-1);
        }
    } else {
        history.go(-1);
    }

}

/* input 케릭터
*
* @param inputTxt 텍스트(Number)
* @param stPoint 시작점(Number)
* @param len 길이(Number)
* @param maskTxt 마스크텍스트
*
* @return Object {
*	inputTxt, outMaskTxt
* }
*/
function gfn_charMask(inputTxt, stPoint, endPoint, maskTxt){
    var strLen	=  inputTxt.length;
    var outMaskTxt	=	"";
    var rtData	=	{inputTxt : inputTxt};
    for(var i = 0 ; i < strLen ; i ++){
        if(i >= stPoint && i < endPoint){
            outMaskTxt += maskTxt;
        }else{
            outMaskTxt += inputTxt.substr(i,1);
        }
    }
    rtData.outMaskTxt = outMaskTxt;
    return rtData;
}

/* 마스크 케릭터 삽입
*
* @param inputTxt 텍스트(Number)
* @param stPoint 시작점(Number)
* @param len 길이(Number)
* @param maskTxt 마스크텍스트
*
* @return String
*/
function gfn_inputMaskChar(inputTxt, inputMaskChar, cur){
    var len, point, str;
    var regEx = new RegExp(inputMaskChar, "gi");
    var outMaskTxt	=	"";
    var rtData	=	{inputTxt : inputTxt.replace(regEx, "")};

    point = rtData.inputTxt.length % cur ;
    len = rtData.inputTxt.length;
    str = rtData.inputTxt.substring(0, point);

    while (point < len) {
        if (str != ""){
            str += inputMaskChar;
        }
        str += rtData.inputTxt.substring(point, point + cur);
        point += cur;
    }
    rtData.outMaskTxt	=	str;
    return rtData;
}

/**
* 콤마 추가
* @param {number} 숫자
* @return {string} 콤마 추가
*/
function gfn_setComma(str) {
    return new String(str).replace(/(\d)(?=(?:\d{3})+(?!\d))/g, '$1,');
}

/* rnb 호출시 실행 */
function gfn_rnbOp($rnb){
    var paramData = {};
    $.ajax({
        url: "/on/om/omh/mo/MyRnb/MyRnb.do",
        type: "POST",
        contentType: "application/json;charset=UTF-8",
        data: JSON.stringify(paramData),
        success: function (data, textStatus, jqXHR) {
            $rnb.empty();
            $rnb.append(data);
            $rnb.css("z-index", gfn_maxZindex());
            return;
        },
        error: function(xhr,status,error){
            var err = JSON.parse(xhr.responseText);
            AppHandler.Common.alert(xhr.status);
            //alert(err.message);
        }
    });
}

/**
* 해당태그에 타이머
* @param {limitTime} 시간(초)
* @param {tagId} 남은 시간 셋팅 태그
*/
var newtime;
function gfn_getTime(limitTime, tagId) {

    var minite = Math.floor(limitTime / 60);
    var second = Math.floor(limitTime % 60);
    var setTxt = minite + " : " + (second.toString().length == 1 ? "0" + second : second);
    $("#"+tagId).text(setTxt);

    if(limitTime == 0){
        $("#"+tagId).text("");
        return;
    }
    limitTime--;

    newtime = window.setTimeout("gfn_getTime("+ limitTime +",\""+ tagId.toString() +"\");", 1000);
}

function gfn_clearTime() {
    if (newtime != undefined) {
        window.clearTimeout(newtime);
    }
};

/*=====================================================*/
/*====================jQueryFunction===================*/
/*=====================================================*/

/* 넘버온리
$("#test").numberOnly("123fg2");
result :
$("#test").val("1232");
*/
jQuery.fn.numberOnly = function(str){
    this.val(str.replace(/[^0-9]/gi,""));
};

jQuery.fn.inputNameChk = function(){
    $(this).val($(this).val().replace(/[^ㄱ-힣a-zA-Z]/gi, ''));
};

jQuery.fn.inputPwdChk = function(){
    $(this).val($(this).val().replace(/[^a-zA-Z0-9\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi, ''));
};

jQuery.fn.numberCutOnly = function(length){
    length = length || $(this).attr("maxlength");
    var val = $(this).val().replace(/[^0-9]/gi,"");
    if (val.length > length){
        $(this).val(val.slice(0, length));
    } else {
    	$(this).val(val);
    }
};
$.fn.maxZindex = function(){
    this.css("z-index", gfn_maxZindex());
}
/* 전화 번호 타입 변경
$("#test").phoneFomatter("01072221666");
result :
$("#test").val("010-7222-1666");
*/
//     $("#tagId").phoneFomatter($("#tagId").val(), "")
jQuery.fn.phoneFomatter = function(type){

    var formatNum = '';
    var num = $(this).val().toString().replace(/-/gi, "");

    if(num.length == 11) {
        if(type == 0){/* 타입에 0이 들어오면 가운데 마스크 */
            /* (\d{3}) $1 으로  (\d{4}) $2 (\d{4}) $3*/
            formatNum = num.replace(/(\d{3})(\d{4})(\d{4})/, '$1-****-$3');
        }else{/* 010-0000-0000 */
            formatNum = num.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
        }
    }else if(num.length == 8){ /* 8글자가 들어왔을때  */
        /* 1621-0000 */
        formatNum = num.replace(/(\d{4})(\d{4})/, '$1-$2');
    }else{
        if(num.indexOf('02') == 0){
            if(type == 0){
                formatNum = num.replace(/(\d{2})(\d{4})(\d{4})/, '$1-****-$3');
            }else{
                formatNum = num.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
            }
        }else{
            if(type == 0){
                formatNum = num.replace(/(\d{3})(\d{3})(\d{4})/, '$1-***-$3');
            }else{
                formatNum = num.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
            }
        }
    }
    return formatNum;
}

function gfn_dday(inputDate){
    var year = inputDate.substr(0,4);
    var month = inputDate.substr(4,2);
    var day = inputDate.substr(6,2);
    inputDate = year + "-" + month + "-" + day

    var dday = 0;
    var now = new Date();
    var then = new Date(inputDate);
    var gap = now.getTime() - then.getTime();
    gap = Math.floor(gap / (1000 * 60 * 60 * 24));
    return gap;
}

function getFormatDate(date, ch){

    var year = date.getFullYear();                                 //yyyy
    var month = (1 + date.getMonth());                     //M
    month = month >= 10 ? month : '0' + month;     // month 두자리로 저장
    var day = date.getDate();                                        //d
    day = day >= 10 ? day : '0' + day;                            //day 두자리로 저장
    return  year + ch.toString() + month + ch.toString() + day;
}

/*
해당날짜의 요일을 가져온다.
@param ex) date : 2014.04.12
subfix : '요일'
*/
function gfn_getTodayLabel(date, subfix) {

    var week = new Array('일', '월', '화', '수', '목', '금', '토');
    var today = new Date(date).getDay();
    var todayLabel = week[today];

    return todayLabel + subfix;
}

/**
* 이미지 없을경우 대체 이미지로 교체
* @param obj img태그 element
* @returns
*/
function moNoImg(obj){
    obj.src="/static/mb/images/common/bg/bg-noimage.png";
}

/* 사용가능극장
@param
cmbndKindNo : 통합권번호
el : 페이지 로딩할 태그 id
*/
function gfn_useBrchList(cmbndKindNo, el){
    var paramData = {
        cmbndKindNo : cmbndKindNo,
        cancelElement : el
    };
    if(!isApp()){
        $.ajax({
            url: '/on/oh/ohd/StoreDtl/selectStoreMobileBrchList.do',
            type: "POST",
            contentType: "application/json;charset=UTF-8",
            data: JSON.stringify(paramData),
            success: function (data, status, xhr) {
                $("#"+el).html(data);
                $("#"+el).css("top","0px").removeClass("display-none").addClass("fade");
                $("body").addClass("no-scroll");
            },
            error: function(xhr, status, error){
                var oData = { message: error };
                AppHandler.Common.alert(oData);
            },
            complete: function(){
            	theaterSelect();
            }
        });
    }else{
        AppDomain.Store.storeUseItemBrch(cmbndKindNo);
    }
}

function gfn_autoHypenCponNo($this){
    var str = $this.val().replace(/[^0-9]/g, ''); /* 숫자만...테스트 끝나고 바꿀것 */
    // 	  	var str = $this.val().replace(/-/gi, '');
    var tmp = '';

    if(str.length < 4){
        tmp += str.substr(0, 4);
    }else if(str.length < 8){
        tmp += str.substr(0, 4);
        tmp += ' ';
        tmp += str.substr(4);
//        $this.val(tmp);
    }else if(str.length < 12){
        tmp += str.substr(0, 4);
        tmp += ' ';
        tmp += str.substr(4, 4);
        tmp += ' ';
        tmp += str.substr(8, 4);
//        $this.val(tmp);
    }else if(str.length <= 16){
        tmp += str.substr(0, 4);
        tmp += ' ';
        tmp += str.substr(4, 4);
        tmp += ' ';
        tmp += str.substr(8, 4);
        tmp += ' ';
        tmp += str.substr(12, 4);
//        $this.val(tmp);
    }else if(str.length <= 20){
        tmp += str.substr(0, 4);
        tmp += ' ';
        tmp += str.substr(4, 4);
        tmp += ' ';
        tmp += str.substr(8, 4);
        tmp += ' ';
        tmp += str.substr(12, 4);
        tmp += ' ';
        tmp += str.substr(16, 4);
//        $this.val(tmp);
    }
    return tmp;
}

function tmpMinusRemve(tmp){
    return tmp.substr(tmp.length - 1) == '-' ? tmp.substr(0 , tmp.length - 1) : tmp;
}
function gfn_autoHypenPhone($this){

    var str = $this.val().replace(/[^0-9]/g, '');
    var tmp = '';
    if( str.length < 4){
        $this.val(str);
    }else if(str.length < 7){
        tmp += str.substr(0, 3);
        tmp += ' ';
        tmp += str.substr(3);
        $this.val(tmp);
    }else if(str.length < 11){
        tmp += str.substr(0, 3);
        tmp += ' ';
        tmp += str.substr(3, 3);
        tmp += ' ';
        tmp += str.substr(6);
        $this.val(tmp);
    }else{
        tmp += str.substr(0, 3);
        tmp += ' ';
        tmp += str.substr(3, 4);
        tmp += ' ';
        tmp += str.substr(7);
        $this.val(tmp);
    }
}

function gfn_autoHypenPhone2($this){

    var str = $this.val().replace(/[^0-9]/g, '');
    var tmp = '';
    if( str.length < 4){
        $this.val(str);
    }else if(str.length < 7){
        tmp += str.substr(0, 3);
        tmp += ' ';
        tmp += str.substr(3);
        $this.val(tmp);
    }else if(str.length < 11){
        tmp += str.substr(0, 3);
        tmp += ' ';
        tmp += str.substr(3, 3);
        tmp += ' ';
        tmp += str.substr(6);
        $this.val(tmp);
    }else{
        tmp += str.substr(0, 3);
        tmp += ' ';
        tmp += str.substr(3, 4);
        tmp += ' ';
        tmp += str.substr(7);
        $this.val(tmp);
    }
}
/*날짜 형태 확인*/
function fn_validateDateYn(param, length) {
    try {
        var year  = 0;
        var month = 0;
        var day   = 0;

        param = param.replace(/-/g,'');

        // 자리수가 맞지않을때
        if( isNaN(param) || param.length < Number(length) || param.length > Number(length)) {
            return false;
        }

        if( param.length == 6){
            year  = Number(param.substring(0, 2));
            month = Number(param.substring(2, 4));
            day   = Number(param.substring(4, 6));
        }
        else if(param.length == 8){
            year  = Number(param.substring(0, 4));
            month = Number(param.substring(4, 6));
            day   = Number(param.substring(6, 8));

            var sysYear = Number(new Date().getFullYear());
            //년도입력이 현재 년도보다 클때.
            if(sysYear < year){
                return false;
            }
        }
        else {
            return false;
        }

        var dd = day / 0;

        if( month<1 || month>12 ) {
            return false;
        }

        var maxDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        var maxDay = maxDaysInMonth[month-1];

        // 윤년 체크
        if( month==2 && ( year%4==0 && year%100!=0 || year%400==0 ) ) {
            maxDay = 29;
        }

        if( day<=0 || day>maxDay ) {
            return false;
        }

        return true;

    } catch (err) {
        return false;
    }
}

function gfn_appHeaders() {
    if(isApp()) {
        return {
            APP_DEVICE_ID: app_header_form.APP_DEVICE_ID.value,
            APP_DEVICE_TYPE: app_header_form.APP_DEVICE_TYPE.value,
            APP_DEVICE_BRAND: app_header_form.APP_DEVICE_BRAND.value,
            APP_DEVICE_MODEL: app_header_form.APP_DEVICE_MODEL.value,
            APP_VERSION: app_header_form.APP_VERSION.value,
            APP_OS_VERSION: app_header_form.APP_OS_VERSION.value,
            APP_PUSH_TOKEN: app_header_form.APP_PUSH_TOKEN.value,
            APP_AUTO_LOGIN: app_header_form.APP_AUTO_LOGIN.value,
            ACCESS_TYPE: app_header_form.ACCESS_TYPE.value
        };
    }
    else {
        return {};
    }
}

//이전 화면 메인, 로그인 체크 후 메인으로 이동. 아니면, history back
function gfn_BackByReferre(idx) {
    if(document.referrer) {
        var lastSplit = document.referrer.lastIndexOf("/");
        if(document.referrer.indexOf("main") > -1
            || document.referrer.indexOf("login") > -1
            || document.referrer.indexOf("login") > -1
            || document.referrer.indexOf("privatebooking") > -1
            || lastSplit == document.referrer.length-1
        ) {
            AppHandler.Common.goMain();
        } else {
            if(isApp()) {
                AppHandler.Common.close();
            } else {
                history.go(-1);
            }
        }
    } else {
        if(isApp()) {
            AppHandler.Common.close();
        } else {
            history.go(-1);
        }
    }
}

/**
 * 이벤트상세화면에서 back버튼 클릭 시
 * 이전화면으로 이동
 *
 * @returns
 *
*/
function gfn_BackByEventDetail() {

    if(isApp()) {
        AppHandler.Common.close();
    } else {
        if(document.referrer.indexOf("login") > -1){
            AppHandler.Common.goEvent();
        }else{
            history.go(-1);
        }

    }
}


/* 난수 N자리 생성메소드
@param
    seed 	: 난수 사이에 랜덤 쉬프트 해서 들어갈 값 자리수는 상관없음
    length 	: 리턴될 난수 길이
*/
function makeItemId(seed, length){
    var rtText = "";
//    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
//    var len	= length ? length : 8;
//    var innerSeed = seed || 'STRYPER';

    var array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
//    console.log();
//    var make = {
//        shuffle: function(posible) {
//            var i, j, x;
//            var array = new Int8Array(10);
//            window.crypto.getRandomValues(array);
//
//            for (i = posible.length; i; i -= 1) {
//                j = Math.floor(array[i] * i);
//                x = posible[i - 1];
//                posible[i - 1] = posible[j];
//                posible[j] = x;
//            }
//            return posible;
//        },
//
//        shift: function(posible){
//            for(var i = 0 ; i < innerSeed.length ; i ++){
//                var frontText = "";
//                var backText = "";
//                var rndNo = Math.floor(Math.random() * possible.length);
//
//                frontText   = possible.substr(0, rndNo);
//                backText	= possible.substr(rndNo, possible.length);
//                possible	= frontText + seed.charAt(i) + backText;
//            }
//            return possible;
//        }
//    }
//
//    if(seed){
//        possible = make.shuffle(possible);
//        possible = make.shift(possible);
//    }
//
//    for(var i = 0 ; i < len ; i ++){
//        rtText += (possible.substr(Math.floor(Math.random() * possible.length), 1));
//    }

    return array.toString();
}

function gfn_today() {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1;
    var yyyy = today.getFullYear();
    if(dd<10) { dd ='0'+dd; }
    if(mm<10) { mm='0'+mm; }
    today = yyyy+''+mm+''+dd;
    return today;
}

function fn_getThisWeek() {
    var currentDay = new Date();
    var theYear = currentDay.getFullYear();
    var theMonth = currentDay.getMonth();
    var theDate  = currentDay.getDate();
    var theDayOfWeek = currentDay.getDay();

    var thisWeek = [];

    for(var i=0; i<7; i++) {
        var resultDay = new Date(theYear, theMonth, theDate + (i - theDayOfWeek));
        var yyyy = resultDay.getFullYear();
        var mm = Number(resultDay.getMonth()) + 1;
        var dd = resultDay.getDate();

        mm = String(mm).length === 1 ? '0' + mm : mm;
        dd = String(dd).length === 1 ? '0' + dd : dd;

        thisWeek[i] = yyyy + '' + mm + '' + dd;
    }

    return thisWeek;
}

/**
 * 가리기
 * @param postMaskResnCd : 가리기 사유 코드
 * @returns html : 모바일 공통 가리기
 */
function fn_maskContent(postMaskResnCd) {
    var html = '';
    var maskResnComment = '';
    switch(postMaskResnCd) {
        case 'SPOL' : maskResnComment = '영화 내용에 대한 스포일러가 포함되어 있어 내용을 표시하지 않습니다.'; break;
        case 'SLAN' : maskResnComment = '비방,욕설,선정적 내용이 포함되어 있어 내용을 표시하지 않습니다.'; break;
        case 'ADVT' : maskResnComment = '광고, 홍보성 내용이 포함되어 있어 내용을 표시하지 않습니다.'; break;
        case 'NOTA' : maskResnComment = '작성된 내용이 무의미한 문자의 나열로 구성되어 내용을 표시하지 않습니다.'; break;
        default : maskResnComment = '관리자가 내용의 표시를 차단했습니다.'; break;
    }
    html += '<div class="warning">';
    html += '    <div class="inner-text">';
    html += '        <i class="iconset ico-ping-triangle"></i>';
    html += '        <p>' + maskResnComment + '</p>';
    html += '    </div>';
    html += '</div>';
    return html;
}

//number type maxlngth check
function maxLengthCheck(object) {
    if (object.value.length > object.maxLength) {
        object.value = object.value.slice(0, object.maxLength);
    }
}

/**
 * 모바일웹용 레이어 열기 애니메이션 후 호출
 * @returns
 */
function gfn_moOpenLayer(id) {
    $('#'+id).find("header").removeClass("no-fix");
    $('body').css({'pointer-events': 'visible'});
}

/**
 * 모바일웹용 레이어 닫기 애니메이션 후 호출
 * @returns
 */
function gfn_moCloseLayer(id, type) {

    var info = arrLayer[id];

    if (type == 'mini') {
        $('#layerDim').remove();
        $("#"+id).addClass("display-none");

        // 검색조건 원복
        if (miniOption.closeSearchAt == 'Y') {
            $.each(miniOption.closeSearchBtn, function(i, obj){
                obj.click();
            });

            $.each(miniOption.closeSearchInp, function(i, data){
                data.obj.val(data.val);
            });
        }

        // 종료후 호출 function
        if (miniOption.closeAction != '') {
            try { eval(miniOption.closeAction)(); } catch(e) { console.log(e); };
        }

        if (Object.keys(arrLayer).length == 0) {
            $(document.body).removeClass('no-scroll');
        }

    } else {

        if (info != undefined) {
            if (info.layerRemoveAt == "Y") $("#"+id).remove();
            if (info.layerRemoveAt != "Y") $("#"+id).addClass("display-none");

            //메타태그 원복
            settingMeta(info.openerMetaTag);
            history.replaceState('','',info.openerMetaTag.metaTagUrl);

            delete arrLayer[id];
        }

        if (Object.keys(arrLayer).length == 0) {
            $("body").removeClass("no-scroll");
        }
    }
}

/**
 * 모바일웹용 메시지 처리후 레이어 팝업 닫기
 * @returns
 */
function gfn_selLayerClsMsg() {

    var info    = arrLayer[Object.keys(arrLayer).pop()];
    var options = {message : info.closeMsg, okFunc : 'gfn_selLayerCls'};

    if (info.closeMsgType == 'alert') {
        AppHandler.Common.confirm(options);
    } else if (info.closeMsgType == 'confirm') {
        AppHandler.Common.confirm(options);
    } else if (info.closeMsgType == 'end') {
        gfn_selLayerCls('last', 'end');
    }
}

/**
 * 모바일웹용 레이어 팝업 닫기
 * @returns
 */
function gfn_selLayerCls(el, type, openParam){

    el = el || 'last'

    var id = el;
    var arrFunc = ["gfn_selLayerCls", "gfn_selLayerClsMsg"];

    if ("last".indexOf(el) != -1) {
        id = Object.keys(arrLayer).pop();
    }

    var $obj = $("#"+id);
    var info = arrLayer[id];

    if (openParam == undefined) {
        openParam = {};
    }

    if (info != undefined) {

        $obj.find("header").addClass("no-fix");

        if (!isApp()) {
            if (nvl(info.header) != "") {
                if (nvl(info.header.closeAction) != "" && $.inArray(info.header.closeAction, arrFunc) == -1) {
                    eval(info.header.closeAction)();
                }
                if (nvl(info.header.backAction)  != "" && $.inArray(info.header.backAction, arrFunc) == -1) {
                    eval(info.header.backAction)();
                }
            }
        }

        if (isApp() && info.closeHeaderData != '') {
            AppHandler.Common.setHeader(info.closeHeaderData);
        }

        if (info.openerAction != "" && type == "end") {
            try {eval(info.openerAction)(openParam);} catch (e) { console.log(e); };
        }

        if (info.actionType == "slide"){
            $obj.elSlideRigth(400);
        } else if(info.actionType == "fade") {
            $obj.find(".btn-bottom").addClass(noneClass);
            if (isApp()) {
            	$obj.elFadeOut(0);
            } else {
            	$obj.elFadeOut(200);
            }
        } else {
            gfn_moCloseLayer(id);
            if ($obj.find('.layer-dimmed').length != 0) {
                $obj.parents('.container:first').removeClass('pt0');
            }
        }
    } else if (type == "mini") {
        $obj.elMiniSlideDown(300);
    } else {
        $obj.addClass("display-none");
        $("body").removeClass("no-scroll");
    }
}

/**
 * 모바일용 레이어 팝업
 * @returns
 */
function gfn_moCusLayer(option){

    var keyCnt = 7;
    var keyId  = 'aaaaaaa';
    var tempId = 'tmpLayer';

    option = $.extend({
        async                : false,
        type                 : 'POST',
        sessionAt            : 'N',
        isMakeId             : false,
        makeId               : tempId + makeItemId(keyId, keyCnt),
        changeFunNmAt        : 'Y',
        layerGrayAt          : 'N',
        layerScrollAt        : 'Y',
        bodyScrollLockAt     : 'Y',
        layerRemoveAt        : 'N',
        layerHeaderBlockAt   : 'N',
        openerId             : '',
        openerAction         : '',
        openerOption         : null,
        openerHeaderIdxMaxAt : 'N',
        closeHeaderData      : '',
        closeMsgType         : '',
        closeMsg             : '',
        openerMetaTag        : saveCurrentMeta()
    }, option);

    // 세션체크
    if (option.sessionAt == 'Y' || location.pathname.indexOf('/mypage') == 0 || location.pathname.indexOf('/myMegabox') == 0) {
        if (!sessionAllow({sessionAt:true})) return;
    }

    // 생성 아이디중 곁치는 아이디 생성시 재생성
    if (option.makeId.indexOf(tempId) != -1) {

        option.isMakeId      = true;
        option.layerRemoveAt = 'Y';

        do {
            if (arrLayer[option.makeId] == undefined) break;
            option.makeId = tempId + makeItemId(keyId, keyCnt);
        } while(true);
    }

    if (Object.keys(arrLayer).length != 0) {
        option.openerId     = Object.keys(arrLayer).pop();
        option.openerOption = arrLayer[option.openerId];
    }

    arrLayer[option.makeId] = option;

    var $div;
    var arrHeader = [];

    var fn_action = function() {

        var $div = $('#'+option.makeId);

        // 레이어 스크롤 활성여부
        if (option.layerScrollAt == 'Y') {
            $div.addClass('over-flow');
        }

        // 앱 헤더 세팅 - 이미지 속도로 인해 요기에 위치
        if (isApp()) {
            AppHandler.Common.setHeader(option);
        }

        if (option.actionType == 'slide'){
            $div.removeClass(noneClass).elSlideLeft(400);
        } else if(option.actionType == 'fade') {
            if (isApp()) {
                $div.removeClass(noneClass).elFadeIn(0);
            } else {
                $div.removeClass(noneClass).elFadeIn(200);
            }

        } else {
            $div.removeClass("display-none");
        }
    }

    // 바디 스크롤 잠금여부
    if (option.bodyScrollLockAt == 'Y'){
        $('body').addClass('no-scroll');
        $('body').css({'pointer-events': 'none'});
    }

    // 애니메이션 타입
    if (option.btnLeft != undefined && option.btnLeft.type == 'back') {
        option.actionType = 'slide';
    }

    if (option.btnRight != undefined && option.btnRight.type == 'close') {
        option.actionType = 'fade';
    }

    // 헤더
    if (nvl(option.header) != '' && nvl(option.header.overlay) == 'clear') {
        option.header.overlay = 'opacity';
    }

    if (nvl(option.closeHeaderData) != '' && nvl(option.closeHeaderData.header.overlay) == 'clear') {
        option.closeHeaderData.header.overlay = 'opacity';
    }

    if (isApp()) {

    } else if (option.isMakeId) {

        var iconNm = '';
        var btnFunc = "javaScript:gfn_selLayerCls(\'last\');";

        $div = $('<header class="headerSub no-fix">');
        $div.append($('<h1 class="tit">').html(option.title.text));

        if (option.layerHeaderBlockAt == 'Y') {
            iconNm = '-white';
        }
        if (option.layerHeaderBlockAt == 'Y') {
            $div.addClass('bg-on');
            $div.addClass('hd-bg-chg');
        }
        if (option.closeMsgType == 'end' || (option.closeMsgType != '' && option.closeMsg != '')) {
            btnFunc = "javaScript:gfn_selLayerClsMsg();";
        }

        if (option.actionType == 'slide') {
            $div.append('<a href="'+ btnFunc +'" class="h-back"><i class="iconset ico-back'+iconNm+'"></i></a>')
        }

        if (option.actionType == 'fade') {
            $div.append('<a href="'+ btnFunc +'" class="h-close"><i class="iconset ico-close'+iconNm+'"></i></a>')
        }

        arrHeader.push($div);
    }

    if (option.domain != undefined) {
        var $div;
        var addCss = 'pt55';
        var params = !option.params? {} : option.params;

        // 레이어 팝업 호출 여부
        params['layerAt'] = 'Y';

        $.ajax({
            url        : option.domain,
            type       : option.type,
            contentType: 'application/json;charset=UTF-8',
            dataType   : 'html',
            data       : JSON.stringify(params),
            success    : function (data, status, xhr) {

                // function명 겹치는거 방지
                if (option.changeFunNmAt == 'Y') {

                    data= data.replaceAll('gfn_', '#_#');
                    data= data.replaceAll('fn_', ' fn_'+option.makeId+'_');
                    data= data.replaceAll('#_#', 'gfn_');

                    if (nvl(option.header) != '') {

                        if (nvl(option.header.closeAction) != '' && option.header.closeAction.indexOf('gfn_') == -1) {
                            option.header.closeAction = option.header.closeAction.replace('fn_', ' fn_'+option.makeId+'_');
                        }

                        if (nvl(option.header.backAction) != '' && option.header.backAction.indexOf('gfn_') == -1) {
                            option.header.backAction = option.header.backAction.replace('fn_', ' fn_'+option.makeId+'_');
                        }
                    }
                }

                if (option.openerOption != null) {
                    option.openerAction = option.openerAction.replace('fn_', ' fn_'+option.openerId+'_');
                }

                if (option.isMakeId) {
                    $div = $('<div class="display-none container store-popup">');
                    if (isApp()) {
                        addCss = 'pt0';
                    }
                    if (option.layerGrayAt == 'Y') {
                        $div.addClass('gray');
                    }
                    $div.addClass(addCss);
                    $div.attr({'id' : option.makeId, 'z-index' : gfn_maxZindex()});
                    $div.append(arrHeader).append(data);
                    $('body').append($div);
                } else {
                    $div = $('#'+option.makeId);
                    $div.html(data);
                    $div.find('.btn-close').attr('onclick', 'gfn_selLayerCls(\'last\');');

                    if (option.openerHeaderIdxMaxAt == 'Y') {
                        if (!isApp()) {
                            if (option.openerId != '') {
                                $(".headerSub").maxZindex();
                            } else {
                                $(".header").maxZindex();
                            }
                        } else {
                            $div.maxZindex();
                        }
                    }
                    if (option.bodyScrollLockAt == 'Y') {
                        $('body').css({'pointer-events': 'visible'});
                    }
                    if ($div.find('.layer-dimmed').length != 0) {
                        $div.parents('.container:first').addClass('pt0');
                    }
                }

                // 이미지 처리
                fn_action();
            },
            error: function(xhr, status, error){
                AppHandler.Common.alert('Screen loading error');

                // 바디 스크롤 잠금여부
                if (option.bodyScrollLockAt == 'Y'){
                    $('body').removeClass('no-scroll');
                    $('body').css({'pointer-events': 'visible'});
                }
            }
        });
    } else {

        $('#'+option.makeId).prepend(arrHeader);

        // 이미지 처리
        fn_action();
    }
    controlAction.off();
}

/**
 * 미니 레이어 열고 닫기(ex. 검색조건)
 * @param   id    : 아이디
 * @param   param : 아직 개발 안함 있으면 조회후 열릴예정
 * @returns
 */
var miniOption = {};
function gfn_miniLayer(id, option) {

    var dimmWrap      = $('#layerDim');
    var contentsWrap  = $('#' + id);
    var noScrollClass = 'no-scroll';

    option = $.extend({
        closeAt : 'N'
    }, option);

    if (option.closeAt == 'N') {
        miniOption = $.extend({
            closeAction    : '',
            closeSearchAt  : 'Y',
            closeSearchBtn : [],
            closeSearchInp : []
        }, option);
    }

    if (dimmWrap.length != 0 || option.closeAt == 'Y') {
        miniOption.closeSearchAt = 'N';
        $('#layerDim').off().click();

    } else {
        contentsWrap.before('<div class="layer-dimmed" id="layerDim" onclick="javaScript:gfn_selLayerCls(\''+ id +'\',\'mini\')"></div>');

        /*
        contentsWrap.css({"padding-bottom" : "constant(safe-area-inset-bottom)",
                                             "padding-bottom" : "env(safe-area-inset-bottom)"});
        contentsWrap.find('.button-bot').css({"height" : "calc(constant(safe-area-inset-bottom) + 55px)",
                                              "height" : "calc(env(safe-area-inset-bottom) + 55px)"});
        */

        $(document.body).addClass(noScrollClass);
        contentsWrap.removeClass(noneClass);
        contentsWrap.elMiniSlideUp(300);

        $.each(contentsWrap.find('.set-btn-area button.on'), function(i, obj) {
            miniOption.closeSearchBtn.push($(obj));
        });

        $.each(contentsWrap.find('input'), function(i, obj) {
            miniOption.closeSearchInp.push({obj : $(obj), val : $(obj).val()});
        });

        // 닫기 버튼
        contentsWrap.find('.ico-p-close, button.gray').off().click(function(e){
            e.stopPropagation();
            $('#layerDim').off().click();
        });
    }
}

/**
 * 조회 조건을 설정해준다.
 * @returns
 */
function gfn_setSerchText($obj) {

    var arrText = [];

    if ($obj != undefined && $obj.length != 0) {

        $obj.find('button.on').each(function() { arrText.push($(this).text()) });

        $('div.container a.select-open').html(arrText.join(' / '));
    }
}

/**
 * 조회 날짜값을 확인한다
 * @returns
 */
function gfn_chkSearchDate(option) {

    option = $.extend({
        strId   : '',
        endId   : '',
        strObj  : '',
        endObj  : '',
        strVal  : '',
        endVal  : '',
        addTxt  : '',
        focusAt : 'N',
    }, option);

    if (option.strId != '' && option.endId != '') {
        option.strObj = $('#'+ option.strId);
        option.endObj = $('#'+ option.endId);
    }

    if (option.strObj != '' && option.endObj != '') {
        option.strVal = nvl(option.strObj.val());
        option.endVal = nvl(option.endObj.val());
    } else {
        option.focusAt = 'N';
    }

    option.strVal = option.strVal.replace(/[^0-9]/gi,'');
    option.endVal = option.endVal.replace(/[^0-9]/gi,'');

    if (option.strVal.length == 0) {
        AppHandler.Common.alert('시작일을 선택해 주세요.');
        if (option.focusAt == 'Y') {
            option.strObj.focus();
        }
        return false;

    } else if (option.strVal.length != 8) {
        AppHandler.Common.alert('시작일을 확인해 주세요.');
        if (option.focusAt == 'Y') {
            option.strObj.focus();
        }
        return false;
    }

    if (option.endVal.length == 0) {
        AppHandler.Common.alert('종료일을 선택해 주세요.');
        if (option.focusAt == 'Y') {
            option.endObj.focus();
        }
        return false;
    } else if (option.endVal.length != 8) {
        AppHandler.Common.alert('종료일을 확인해 주세요.');
        if (option.focusAt == 'Y') {
            option.endObj.focus();
        }
        return false;
    }

    if (option.strVal > option.endVal) {
        AppHandler.Common.alert('시작일이 종료일보다 이전이여야 합니다.');
        if (option.focusAt == 'Y') {
            option.strObj.focus();
        }
        return false;
    }

    return true;
}

/**
 * 비밀번호 형식 체크
 * @param {string} 비밀번호
 */
function gfn_checkPassword(pwd) {
    var returnValue = false;

    if(pwd.length >= 10 && pwd.length <= 16) { // 숫자, 영문, 특수 2중 2가지 조합 & 10자리 이상 16자리 이하
        var num = /^[0-9]+$/; // 숫자만
        var eng = /^[a-zA-Z]+$/; // 영문만
        var spc = /^[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]+$/gi; // 특수문자만

        var case1 = /^[0-9a-zA-Z]+$/; // 숫자+영문
        var case2 = /^[0-9\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]+$/; // 숫자+특수
        var case3 = /^[a-zA-Z\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]+$/; // 영문+특수

        if( (!num.test(pwd) && !eng.test(pwd) && !spc.test(pwd))
                && (case1.test(pwd) || case2.test(pwd) || case3.test(pwd)) ) {
            returnValue = true;
        }
    }

    return returnValue;
}

function gfn_cardNoInput($this, maxLength, event, $button, startLen, cur, maskChar){
    var $thisVal = $this.val().replace(/[^0-9]/g, '').substr(0, maxLength);
    $this.val($thisVal);

    var cponNo = gfn_autoHypenCponNo($this);
    var lengChk = $this.val().length >= 8  ? false : true;
    var charMask = gfn_charMask($thisVal, startLen, ( startLen + cur ), maskChar);

    $this.val(cponNo);

    if (event == 8) {$this.val('')};

    $button.attr("disabled", lengChk);

    return charMask;
}

function gfn_waitProcess($this, second){
    $this.attr("disabled", true);
    setTimeout(function(){
        $this.attr("disabled", false);
    }, second * 1000);
}

var cardNumber = function() {
    cardNumber.unmaskcardnumber = "";

    this.getUnmaskNumber = function() {
        try {
            return cardNumber.unmaskcardnumber.substring(0,16).replaceAll(/\D/g, '');
        } catch(e) {
            return "";
        }
    };

    this.clearUnmaskNumber = function() {
        cardNumber.unmaskcardnumber = "";
    };

    this.watcher = function (inputObject) {
        var regex = "";

        $(inputObject).on('paste', function (event) {
            $(this).val(function () {
                cardNumber.unmaskcardnumber = event.originalEvent.clipboardData.getData('text');
                var regex = /^(\d{4})(\d{4})(\d{4})(\d{4})$/;
                return cardNumber.unmaskcardnumber.replace(regex, '$1 $2 •••• $4');
            });
        });

        $(inputObject).on('keyup', function (event) {
            if (event.keyCode === 8 || event.keyCode === 127) {
                $(inputObject).val('');
            }

            $(this).val(function (index, value) {
                if (value.length >= 5 && value.length < 10) {
                    regex = /(\d{4})(\d+)/;
                    cardNumber.unmaskcardnumber = event.currentTarget.value;
                    cardNumber.unmaskcardnumber = cardNumber.unmaskcardnumber.replace(' ', '');
                    return value.replace(regex, '$1 $2');
                }

                if (value.length == 10) {
                    regex = /^(\d{4})\s(\d{4})(\d{1})/;
                    cardNumber.unmaskcardnumber = cardNumber.unmaskcardnumber + event.currentTarget.value[value.length - 1];
                    return value.replace(regex, '$1 $2 •');
                }

                if (value.length == 12) {
                    regex = /^(\d{4})\s(\d{4})\s.\d{1}/;
                    cardNumber.unmaskcardnumber = cardNumber.unmaskcardnumber + event.currentTarget.value[value.length - 1];
                    return value.replace(regex, '$1 $2 ••');
                }

                if (value.length == 13) {
                    regex = /^(\d{4})\s(\d{4})\s..\d{1}/;
                    cardNumber.unmaskcardnumber = cardNumber.unmaskcardnumber + event.currentTarget.value[value.length - 1];
                    return value.replace(regex, '$1 $2 •••');
                }

                if (value.length == 14) {
                    regex = /^(\d{4})\s(\d{4})\s...\d{1}/;
                    cardNumber.unmaskcardnumber = cardNumber.unmaskcardnumber + event.currentTarget.value[value.length - 1];
                    return value.replace(regex, '$1 $2 ••••');
                }

                if (value.length >= 15 && value.length < 20) {
                    regex = /^(\d{4})\s(\d{4})\s....(\d+)/;
                    cardNumber.unmaskcardnumber = cardNumber.unmaskcardnumber + event.currentTarget.value[value.length - 1];
                    return value.replace(regex, '$1 $2 •••• $3');
                }

                return value;
            });
        });
    }
};

function fn_goAdLink(url) {
    if(url) {
    	if (isApp()) {
    		AppHandler.Common.link({ domain: url });
    	}
    	else {
    		window.open(url, 'ADWIN', '');
    	}
    }
}

//사용자 콜백 끝나고 실행 됨.
$( document ).ajaxSuccess(function( event, xhr, settings ) {
    try { controlAction.off(); } catch (e) { console.log(e); }
});

//사용자 콜백 끝나고 실행 됨.
$( document ).ajaxError(function( event, jqxhr, settings, thrownError ) {
    try { controlAction.off(); } catch (e) { console.log(e); }
});

//더블클릭 방지 transaction
$.ajaxPreventDoubleClick = function ( options ) {
    var setting = $.extend({
        url           : ""
        ,type          : "POST"
        ,method        : "POST"
        ,contentType   : "application/json; charset=UTF-8"
        ,dataType      : "json"
        ,secure        : "N"
        ,data          : {}
        ,processData   : true
        ,async         : true
        ,cache         : true
        ,global        : true
        ,jsonp         : null
        ,jsonpCallback : null
        ,complete      : null
        ,success       : null
        ,error         : null
        ,errorMsgYn    : true
        ,sessionAt     : false
        ,commAt        : false
    },options);

    if(controlAction.isExec()) return; controlAction.on();
    $.ajax($.extend(setting, {}));
};
/*$("tagName").infiniteScroll("callback function", "function Data")*/
var infiniteTf = true;
$.getScript("/static/mb/js/JsBarcode.code128.min.js",function(){});

jQuery.fn.jsBarcode = function(code, barcdShowHide){
    var target = "#"+$(this).attr("id");
    JsBarcode(
            target,
            code, {
        width:2,
        height:50,
        displayValue:barcdShowHide,
        fontSize:15
    });
}

jQuery.fn.infiniteScroll = function(fnCall, data){
    $(window).scroll(function() {
        if(!controlAction.isLoading() && $(window).scrollTop() >= $(document).height() - $(window).height() - 1000) {
            controlAction.onLoad();
            eval(fnCall)(data);
        }

    });
}

jQuery.fn.elSlideUp = function(duration){
    var wHeight  = $(window).height();
    var elHeight = $(this).outerHeight();
    $(this).off().stop().css("top", wHeight).animate({top: "0px"}, duration, function() {
        gfn_moOpenLayer($(this).attr('id'));
    });
}
jQuery.fn.elMiniSlideUp = function(duration){
    var wHeight  = $(window).height();
    var elHeight = $(this).height();

    $(this).off().stop().css({"bottom" : "-" + elHeight + "px"}).animate({"bottom" : "0px"}, duration);
}

jQuery.fn.elMiniSlideDown = function(duration){
    var wHeight  = $(window).height();
    var elHeight = $(this).outerHeight();

    $(this).off().stop().animate({"bottom": "-" + elHeight + "px"}, duration, function() {
        gfn_moCloseLayer($(this).attr('id'), 'mini');
    });
}

jQuery.fn.elSlideLeft = function(duration){
    var wWidth = $(window).width();
    $(this).off().stop().css({"width": wWidth, left: "100%"}).animate({left:"0px"}, duration, function() {
        gfn_moOpenLayer($(this).attr('id'));
    });
}

jQuery.fn.elSlideDown = function(duration){
    var wHeight = $(window).height();
    $(this).off().stop().css("top", "0px").animate({top:wHeight+"px"}, duration, function(){
        gfn_moCloseLayer($(this).attr('id'));
    });
}

jQuery.fn.elSlideRigth = function(duration){
    var wWidth = $(window).width();
    $(this).off().stop().css({"width": wWidth, left: "0%"}).animate({left: wWidth +"px"}, duration, function(){
        gfn_moCloseLayer($(this).attr('id'));
    });
}

jQuery.fn.elFadeIn = function(duration){
    $(this).off().stop(true).css({'display': 'block', 'opacity': 0}).animate({opacity: 1}, duration, function(){
        gfn_moOpenLayer($(this).attr('id'));
    });
}

jQuery.fn.elFadeOut = function(duration){
    $(this).off().stop(true).animate({opacity: 0}, duration, function(){
        gfn_moCloseLayer($(this).attr('id'));
    });
}