/*
 * common methods
 * version: 0.1
 * since: 2018-06-20
 * last update: 2019-01-23
 */

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
