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
    $(document).on('click', '.h-burger, .ico-burger, .btn_menu_bl30', function(e){
        e.preventDefault();
        $('body').addClass('no-scroll');
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
            $('#rnb').addClass('display-none');
        }
    });
    $(document).on('click', '#newRnbClose', function(e){
    	e.preventDefault();

    	if(MegaboxUtil.Common.isApp()){
    		AppHandler.Common.sideMenuClose();
    	}else{
    		$('body').removeClass('no-scroll');
    		$('#rnb').addClass('display-none');
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
    $(document).on('click', '.movieDetail .movieInfo .textArea a', function(){
        $(this).closest('.movieDetail .movieInfo .textArea a').toggleClass('on');

        if( $(this).closest('.movieDetail .movieInfo .textArea a').hasClass('on') ) {
            $(this).text('더보기');
        } else {
            $(this).text('닫기');
        }

        if( $('.movieDetail .movieInfo .textArea').length > 0 ) {
            $('.movieDetail .movieInfo .textArea .intext').toggleClass('on');
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
            } else {
                $(document).find('.movie-detail-tab').removeClass('fixed');
            }
        });
    }

    // 이벤트 메인 앵커 고정
    if( $('.btn-scroll-wrap').length > 0 ) {
        $(window).on('scroll', function() {

        	mov_top = $('.btn-scroll-wrap').offset().top;

    		if ($(window).scrollTop() > mov_top ) {
            	if(isApp()){
            		$(document).find('.btn-scroll-wrap').addClass('fixedApp');
            	}else{
            		$(document).find('.btn-scroll-wrap').addClass('fixed');
            	}
    		} else {
            	if(isApp()){
            		$(document).find('.btn-scroll-wrap').removeClass('fixedApp');
            	}else{
            		$(document).find('.btn-scroll-wrap').removeClass('fixed');
            	}
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
//    var tatheight = $('.mvticket .top-alert-text').height();
    var pscreenH1 = (screen.height - 330) + 'px';
//    var pscreenH1 = (screen.height - (250+tatheight)) + 'px';

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

/* 에러남 삭제합니다. */
//$(document).on("click", ".ico-alarm", function() {
//    AppDomain.Setting.notiBox();
//});


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
    lazyOff : function(millisecond) {
       var lazyOffTimeout = setTimeout(function(){
           controlAction.off();
           clearTimeout(lazyOffTimeout);
       }, millisecond);
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

