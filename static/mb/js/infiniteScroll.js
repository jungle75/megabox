/**
 *
 * @description : 스크롤 페이징
 *
 * @modification : 2019. 5. 7. 최초생성
 *
 * @author 김진규
 * @Date 2019. 5. 7.
 * @version 1.0
 * @see
 *  == 개정이력(Modification Information) ==
 *
 *   수정일                 수정자                  수정내용
 *  -------    --------    ---------------------------
 *
 * Copyright (C) by MegaBox All right reserved.
 * (C) by MEGABOX All right reserved.
*/
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