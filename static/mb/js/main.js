var topBannerSwiper;
var mainMovieList;
let mainPayBannerSwiper;
var channelCd = "MOBILEWEB";

$(document).ready(function() {
	// 스크롤 방지
	$("body").attr("style","overflow-x:hidden;");

    if(isApp()) {
        channelCd = osType();
    }

    fn_moreContent();
    fn_getMKTTopBannerAd();
    fn_getMovieAd();
    fn_adMovie();
    gfn_getBannerAd("mainMiddle");

    var initswiper = setTimeout(function() {
    	fn_swiperInit();
        clearTimeout(initswiper);
    }, 200);

    //메인배너 터치 막기
    $(".layer-dimmed").on("click", function(e) {
        if(!$(".layer-dimmed").hasClass("display-none")) {
            return false;
        }
    });
});

//로그인 여부 체크
function fn_loginAt() {
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
				result = false;
			}
			else {
				result = true;
			}
		},
		error: function(xhr, status, error) {
            var err = JSON.parse(xhr.responseText);
            AppHandler.Common.alert(err);
		}
	});

	return result;
}

//movie swiper init
function fn_swiperInit() {

	// 상단배너
	if( $('.topBanner').length > 0 ){

		$('.topBanner').append('<div class="swiper-pagination"></div>');

		topBannerSwiper = new Swiper('.topBanner', {
	    	loop: true,
	    	autoplay: {
	    		delay: 3000,
	    		disableOnInteraction: true,
	    	},
			pagination: {
		        el: ".swiper-pagination",
		        type: "custom",
		        renderCustom: function (swiper, current, total) {
			        return '<div class="pgCurrent">'+current+'</div>' + '<div class="pgTotal">'+total+'</div>';
			    }
			},
	    	ally : {
	    		enabled : true
	    	}
		});
	}

    // 메인 영화리스트
    if( $('#b_boxo_movie_wrap').length > 0 ){
    	mainMovieList = new Swiper('#b_boxo_movie_wrap', {
    		slidesPerView: 'auto',
    		freeMode: true,
    		spaceBetween: 12,
    		pagination: false ,
    		centeredSlides: false ,
    		disableTouchControl:true,
    		lazy:true,
    		navigation : false
    	});
    }

	// 메인배너
	if( $('.pop-slide').length > 0 ){
		var list_swiper = new Swiper('.pop-slide', {
			slidesPerView: 'auto',
			spaceBetween: 8,
		    pagination: {
		        el: '.btn_pg',
	            clickable : true,
		    },
			centeredSlides: false ,
			disableTouchControl:true,
			navigation : false,
			watchOverflow : true
		});
	}
}

//메인 more Content
var eventRecordCountPerPage = "10";
function fn_moreContent(dataset) {
    var obj = {
        url: '/on/oh/ohz/Main',
        data: {eventRecordCountPerPage : eventRecordCountPerPage, sellChnlCd : channelCd},
        success: fn_moreContentCallback
    };
    MegaboxUtil.Common.selectList(obj);
}
//undefined에러를 위한 함수
function fn_rtnOneLineReview() {

}

//관람평 작성하기
function fn_openRegOnelnEval(sMovieNo, sMovieNm) {

    var paramData = {
        onelnEvalDivCd : 'PREV',
        rpstMovieNo    : sMovieNo,
        prevPage       : 'WATCHED',
        movieNm        : gfn_scrtDecode(sMovieNm),
    };

    $('#surveyPopup_layer').addClass(noneClass);
    $('#surveyPopup_content').addClass(noneClass);
    AppDomain.Movie.oneLineReview(paramData);
}

function fn_dupDimlayer(bannerDate) {
    if (fn_getCookie("MAIN_POP_" + bannerDate) == null || fn_getCookie("MAIN_POP_" + bannerDate) == 'N') {
        $('#surveyPopup_layer').addClass(noneClass);
    }
}

//메인 more Content Callback
function fn_moreContentCallback(result) {
    var movieFeedHtml = new StringBuffer();
    var greetingAndPreviewHtml = new StringBuffer();
    var eventHtml = new StringBuffer();
    var specialHtml = new StringBuffer();
    var bannerHtml = new StringBuffer();
    var megaBannerHtml = new StringBuffer();
    var focusPrdtHtml = new StringBuffer();
    let surveyPopupHtml = new StringBuffer();

    var stageGreeting = result.stageGreetingList;  // 무대인사
    var previewList = result.previewList;
    var eventList = result.eventList;   // 이벤트 리스트
    var eventDivCd = result.eventDivCd;     // 이벤트 카테고리
    var movieFeedList = result.movieFeedList;  //무비피드
    var bannerList = result.bannerList;
    var mobileBanner = result.mobileBanner;
    var focusPrdt = result.focusPrdt;  // 주목상품
    const payBannerInfo = result.payBannerInfo;  // 배너
    const surveyPopupMap = result.surveyPopupMap; //설문조사 정보
    const movieReviewPopupMap = result.movieReviewPopupMap; //관람평 정보
    const movieReviewSuccess = result.movieReviewSuccess; //관람평 호출 성공 여부
    const admisCompltSuccess = result.admisCompltSuccess; //관람완료 팝업 호출 성공 여부
    const admisCompltPopup = result.admisCompltPopup; //관람완료 팝업 정보

    // 지금 주목해야 할 상품 시작
    if(focusPrdt.length > 0){
    	focusPrdtHtml.append('      <div class="titleAreaBox">');
    	focusPrdtHtml.append('         	<h4 class="title">지금 주목해야 할 상품</h4>');
    	//focusPrdtHtml.append('          <a href="javaScript:AppHandler.Common.newGoStore();" class="arrowLink">더보기</a>');
    	focusPrdtHtml.append('      </div>');
    	focusPrdtHtml.append('      </div>');
    	focusPrdtHtml.append('      <div class="fs_Swiper customSwiper">');
    	focusPrdtHtml.append('      	<div class="swiper-wrapper">');
        for(var i=0; i<focusPrdt.length; i++) {
        	var temp = focusPrdt[i];
        	var imgPath = m_imgSvrUrl + temp.imgPath;
        	if(temp.cttsObjNo == "INPRDT"){
        		focusPrdtHtml.append('			<a href="javascript:gfn_bannerLink(\''+ temp.fetchObjUrl + '\');" class="item swiper-slide on">');
        		focusPrdtHtml.append('				<img class="lozad" data-src="' + imgPath.posterFormat('_280') + '" alt="상품" onerror="moNoImg(this)"/>');
        		if(temp.fetchObjNo == 'DLVR'){
        			focusPrdtHtml.append('				<span class="delivery">배송</span>');
        		}
        		if(temp.bannerHtmlUseAt == 'Y' && temp.bannerHtmlCn != null){
        			focusPrdtHtml.append('				<p class="text">'+ temp.bannerHtmlCn + '</p>');
        		}else{
        			focusPrdtHtml.append('				<p class="text">'+ temp.prdtNm + '</p>');
        		}
        		focusPrdtHtml.append('			</a>');
        	}else{
        		focusPrdtHtml.append('			<a href="javascript:gfn_bannerLink(\''+ temp.bannerLinkUrl + '\');" class="item swiper-slide on">');
        		focusPrdtHtml.append('				<img class="lozad" data-src="' + imgPath + '" alt="상품" onerror="moNoImg(this)"/>');
        		if(temp.fetchObjNo == 'DLVR'){
        			focusPrdtHtml.append('				<span class="delivery">배송</span>');
        		}
        		focusPrdtHtml.append('				<p class="text">'+ temp.frontRplWordsCn + '</p>');
        		focusPrdtHtml.append('			</a>');
        	}
        }
    	focusPrdtHtml.append('      	</div>');
    	focusPrdtHtml.append('      </div>');
    }

    $("#focusStore_div").append(focusPrdtHtml.toString());

    if( $('.fs_Swiper').length > 0 ){
	    new Swiper('.fs_Swiper', {
			slidesPerView: 'auto',
			freeMode: true,
			spaceBetween: 12,
			slidesOffsetBefore:18,
			slidesOffsetAfter:18,
			pagination: false ,
			centeredSlides: false ,
			disableTouchControl:true,
			lazy:true,
			navigation : false
	    });
    }
    // 지금 주목해야 할 상품 끝

    // 무비피드 시작
    if (movieFeedList.length > 0) {
    	var onClass =  [0].movieFeedRcmmAt == 'Y' ? 'on' : '';

        movieFeedHtml.append('      <div class="titleAreaBox">');
        movieFeedHtml.append('         	<h4 class="title">알고보면 더 재밌는 무비피드</h4>');
        movieFeedHtml.append('          <a href="javascript:AppDomain.MovieFeed.list();" class="arrowLink">더보기</a>');
        movieFeedHtml.append('      </div>');
        movieFeedHtml.append('      <div id="feedMain" class="top" data-no="' + movieFeedList[0].movieFeedNo + '" data-title="' + movieFeedList[0].movieFeedTitle + '">');
        movieFeedHtml.append('			<img class="lozad" data-src="' + m_imgSvrUrl + movieFeedList[0].mainImgPathNm + '" onerror="moNoImg(this)" alt="무비피드이미지" />');
        //movieFeedHtml.append('			<img class="lozad" data-src="https://img.megabox.co.kr/SharedImg/movieFeed/2024/09/05/MSZpFhYAO62Sp25Ttx8rhGpUS06KlZmZ.jpg" onerror="moNoImg(this)" alt="무비피드이미지" />');
        movieFeedHtml.append('      	<div class="like ' + onClass + '" data-no="' + movieFeedList[0].movieFeedNo + '">' + movieFeedList[0].rcmmCnt + '</div>');
        movieFeedHtml.append('      </div>');

        if (movieFeedList.length > 1) {
        	movieFeedHtml.append('		<div class="mf_list">');
        	for(var i=1; i < movieFeedList.length; i++){
        		var temp = movieFeedList[i];
        		movieFeedHtml.append('			<div class="item" data-no="' + temp.movieFeedNo + '" data-title="' + temp.movieFeedTitle + '">');
        		movieFeedHtml.append('				<img class="lozad" data-src="' + m_imgSvrUrl + temp.thumImgPathNm + '" alt="무비피드이미지" onerror="moNoImg(this)" />');
        		//movieFeedHtml.append('				<img  class="lozad" data-src="https://img.megabox.co.kr/SharedImg/movieFeed/2024/08/14/GdI9d9z96CeUJ8evYMBPdTKowOgcYhbx.jpg" alt="무비피드이미지" onerror="moNoImg(this)" />');
        		movieFeedHtml.append('				<dl>');
        		movieFeedHtml.append('					<dt>' + temp.movieFeedTitle + '</dt>');
        		movieFeedHtml.append('					<dd>' + temp.movieFeedMainTxt + '</dd>');
        		movieFeedHtml.append('				</dl>');
        		movieFeedHtml.append('			</div>');
        		if(i == 2) break;
        	}
        	movieFeedHtml.append('		</div>');
        }

        // 무비피드 영역 클릭 시 이벤트 처리
        $(document).on('click', '#feedMain, .mf_list .item', function () {
            if(isApp()) {
                clickedMovieFeed = this;
                var data = {
                    callback: 'fn_mvMovieFeedDetailAppCurrentVersionCallback'
                };
                AppHandler.Common.appCurrentVersion(data);
            } else {
                var movieFeedNo = $(this).data('no');
                var movieFeedTitle = $(this).data('title');
                AppDomain.MovieFeed.detail(movieFeedNo);
            }
        });

        // 무비피드 좋아요 토글 시 이벤트 처리
        $(document).on('click', '#feedMain .like', function (e) {
            var movieFeed = this;

            loginChk()
                .then(function () {
                    $.ajaxMegaBox({
                        url: "/movieFeed/updateMovieFeedRcmm.rest",
                        data: JSON.stringify({
                            movieFeedNo: $(movieFeed).data('no')
                        }),
                        success: function (data) {
                            var movieFeedRcmmAt = data.result.movieFeedRcmmAt;
                            if (movieFeedRcmmAt == 'Y') {
                                $(movieFeed).addClass('on');
                            } else {
                                $(movieFeed).removeClass('on');
                            }

                            var rcmmCnt = data.result.rcmmCnt;
                            $(movieFeed).find('span').html(rcmmCnt);
                        },
                        error: function (xhr, status, error) {
                            var err = JSON.parse(xhr.responseText);
                            AppHandler.Common.alert(err);
                        },
                    });
                })
                .catch(function (error) {
                    AppHandler.Common.alert(error.message);
                });

            e.stopPropagation();
        });
    }

    $("#movieFeed_div").append(movieFeedHtml.toString());
    // 무비피드 끝

    //무대인사,시사 시작
    if(stageGreeting.length > 0 || previewList.length > 0) {
        greetingAndPreviewHtml.append('<div class="titleAreaBox">');
        greetingAndPreviewHtml.append('     <h4 class="title">특별한 만남, 무대인사 ∙ 시사</h4>');
        greetingAndPreviewHtml.append('     <a href="javascript:AppHandler.Common.newGoEvent(\'CED04\')" class="arrowLink">더보기</a>');
        greetingAndPreviewHtml.append('</div>');

        greetingAndPreviewHtml.append('<div class="mp_Swiper customSwiper">');
        greetingAndPreviewHtml.append('		<div class="swiper-wrapper">');

        // 무대인사
        for(var i=0; i<stageGreeting.length; i++) {
        	var item = stageGreeting[i];
        	var posterPath = m_imgSvrUrl + nvl(item.pcFilePathNm);
        	greetingAndPreviewHtml.append('		<a class="item swiper-slide" href="javascript:fn_goEventLink(\'' + item.eventNo + '\', \'' + item.shareAt + '\', \'' + item.netfunnelAt + '\')">');
        	greetingAndPreviewHtml.append('			<img class="lozad" data-src="' + posterPath + '" alt="이미지" onerror="moNoImg(this)" />');
        	greetingAndPreviewHtml.append('			<p class="title">' + item.eventTitle + '</p>');
        	greetingAndPreviewHtml.append('			<p class="text">' + item.eventStartDt + ' ~ ' + item.eventEndDt + '</p>');
        	greetingAndPreviewHtml.append('		</a>');
        }

        // 시사
        for(var i=0; i<previewList.length; i++) {
        	var item = previewList[i];
        	var posterPath = m_imgSvrUrl + nvl(item.pcFilePathNm);
        	greetingAndPreviewHtml.append('		<a class="item swiper-slide" href="javascript:fn_goEventLink(\'' + item.eventNo + '\', \'' + item.shareAt + '\', \'' + item.netfunnelAt + '\')">');
        	greetingAndPreviewHtml.append('			<img class="lozad" data-src="' + posterPath + '" alt="이미지" onerror="moNoImg(this)" />');
        	greetingAndPreviewHtml.append('			<p class="title">' + item.eventTitle + '</p>');
        	greetingAndPreviewHtml.append('			<p class="text">' + item.eventStartDt + ' ~ ' + item.eventEndDt + '</p>');
        	greetingAndPreviewHtml.append('		</a>');
        }

        greetingAndPreviewHtml.append('		</div>');
        greetingAndPreviewHtml.append('</div>');

    }

    $("#greeting_div").append(greetingAndPreviewHtml.toString());

    if( $('.mp_Swiper').length > 0 ){
	    new Swiper('.mp_Swiper', {
			slidesPerView: 'auto',
			freeMode: true,
			spaceBetween: 12,
			slidesOffsetBefore:18,
			slidesOffsetAfter:18,
			pagination: false ,
			centeredSlides: false ,
			disableTouchControl:true,
			lazy:true,
			navigation : false
	    });
    }
    //무대인사,시사 끝

    //이벤트 시작
    if(eventList.length > 0) {

        eventHtml.append('<div class="titleAreaBox">');
        eventHtml.append('      <h4 class="title">진행 중인 이벤트</h4>');
        eventHtml.append('      <a href="javascript:AppHandler.Common.newGoEvent()" class="arrowLink">더보기</a>');
        eventHtml.append('</div>');

        eventHtml.append('<div class="movieCategory">');
        eventHtml.append('		<div class="categoryList" id="eventTab">');
        for(var i = 0; i < eventDivCd.length; i++ ){
            //극장탭 비노출
            if(eventDivCd[i].cdId == 'CED02') continue;
        	if(i == 0){
        		eventHtml.append('	<a id="'+ eventDivCd[i].cdId +'" href="javascript:fn_selectEvent(\'' + eventDivCd[i].cdId + '\');" class="item on">' + eventDivCd[i].cdNm + '</a>');
        	}else{
        		eventHtml.append('	<a id="'+ eventDivCd[i].cdId +'" href="javascript:fn_selectEvent(\'' + eventDivCd[i].cdId + '\');" class="item">' + eventDivCd[i].cdNm + '</a>');
        	}
        }
        eventHtml.append('		</div>');
        eventHtml.append('</div>');

        // tab 별로 미리 영역을 그려논다... SWIP 동작오류로인해..
        for(var i = 0; i < eventDivCd.length; i++ ){
            //극장탭 비노출
            if(eventDivCd[i].cdId == 'CED02') continue;
    		if(i == 0){
    			eventHtml.append('<div class="me_Swiper customSwiper" id="eventList_' + eventDivCd[i].cdId + '">');
    			fn_selectEvent(eventDivCd[0].cdId);
    			eventHtml.append('</div>');
    		}else{
    			eventHtml.append('<div class="me_Swiper customSwiper display-none" id="eventList_' + eventDivCd[i].cdId + '">');
    			eventHtml.append('</div>');
    		}
        }

    }

    $("#movieEvent_div").append(eventHtml.toString());

	if( $('.me_Swiper').length > 0 ){
	    var me_Swiper = new Swiper('.me_Swiper', {
			slidesPerView: 'auto',
			freeMode: true,
			spaceBetween: 12,
			slidesOffsetBefore:18,
			slidesOffsetAfter:18,
			pagination: false ,
			centeredSlides: false ,
			disableTouchControl:true,
			lazy:true,
			navigation : false
	    });
	}
	//이벤트 끝

    //특별관 시작
    specialHtml.append('<div class="titleAreaBox">');
    specialHtml.append('	<h4 class="title">메가박스의 모든 특별관</h4>');
    specialHtml.append('	<a href="javascript:AppDomain.Theater.specialList();" class="arrowLink">더보기</a>');
    specialHtml.append('</div>');
    specialHtml.append('<div class="sts_swiperPagination"></div>');
    specialHtml.append('<div class="swiper-container specialTheaterSwiper">');
    specialHtml.append('	<div class="swiper-wrapper">');
    var spcCd = [];
    $.each(result.specialCdList, function(i, param) {
        switch(param.cdId) {
        case 'DBC' :
        	param.desc = '<p>완벽한 영화 관람을 완성하는 <br>하이엔드 시네마</p>'
        	param.css = 'https://img.megabox.co.kr/static/mb/images/2024renewal/theater/bg_dolby_cinema.png';
        	break;
		case 'DVA' :
			param.desc = '<p>돌비 시네마의 선명한 영상과 압도적인 사운드,<br>리클라이너를 더한 프리미엄 클래스</p>'
			param.css = 'https://img.megabox.co.kr/static/mb/images/2024renewal/theater/bg_dolby_vision.png';
			break;
        case 'MX'  :
        	param.desc = '<p>차원이 다른 공간감과 디테일한 사운드</p>'
        	param.css = 'https://img.megabox.co.kr/static/mb/images/2024renewal/theater/bg_mega_dolby_atmos.png';
        	break;
        case 'MX4D' :
        	param.desc = '<p>다이내믹 이펙트가 선사하는<br>새로운 영화 체험</p>'
        	param.css = 'https://img.megabox.co.kr/static/mb/images/2024renewal/theater/bg_mega_mx4d.png';
        	break;
		case 'LUMINEON' :
			param.desc = '<p>무한대의 명암비, 완벽한 컬러 재현력</p>';
			param.css = 'https://img.megabox.co.kr/static/mb/images/2024renewal/theater/bg_led.png';
			break;
        case 'TBP' :
        	param.desc = '<p>오직 나와 소중한 사람들을 위한 <br>프라이빗한 극장 경험</p>'
            param.css = 'https://img.megabox.co.kr/static/mb/images/2024renewal/theater/bg_boutique_private.png';
            break;
        case 'TBS' :
        	param.desc = '<p>웰컴 패키지가 더해진 <br>럭셔리한 공간 경험</p>'
        	param.css = 'https://img.megabox.co.kr/static/mb/images/2024renewal/theater/bg_boutique_suite.png';
        	break;
        case 'TBQ' :
        	param.desc = '<p>섬세하게 디자인된 감각적인<br>극장 경험</p>'
        	param.css = 'https://img.megabox.co.kr/static/mb/images/2024renewal/theater/bg_boutique.png';
        	break;
		case 'RCL' :
			param.desc = '<p>맞춤형 리클라이닝 시스템이 구현하는<br>극강의 편안함</p>';
			param.css = 'https://img.megabox.co.kr/static/mb/images/2024renewal/theater/bg_recliner.png';
			break;
        case 'CFT' :
        	param.desc = '<p>컴포트 체어로 누리는 <br>더 안락한 영화 경험</p>'
            param.css = 'https://img.megabox.co.kr/static/mb/images/2024renewal/theater/bg_comfort.png';
            break;
        }
        spcCd.push(param.cdId);
        specialHtml.append('<div class="swiper-slide" onclick="AppDomain.Theater.specialDetail(\'' +  param.cdId+ '\');">');
        specialHtml.append('	<div class="titleBox">');
        specialHtml.append('		<h4>'+param.cdNm+'</h4>');
        specialHtml.append(param.desc);
        specialHtml.append('	</div>');
        if(result.spcPrdtList.length > 0){
        	$.each(result.spcPrdtList, function(j, item) {
        		if(param.cdId == item.spcCdId){
	        		specialHtml.append('	<div class="item" onclick="fn_storeDtlPage(\'' +  item.prdtClCd + '\', \'' +  item.prdtNo + '\');">');
	        		specialHtml.append('		<div class="img"><img src="'+(m_imgSvrUrl+item.imgPathNm).posterFormat('_280')+'"></div>');
	        		specialHtml.append('		<div class="title">'+item.prdtNm+'</div>');
	        		specialHtml.append('		<ul class="numberArea">');
	        		if(item.prdtExpoAmt != item.prdtNormAmt){
	        			specialHtml.append('			<li class="n1">'+Math.floor(100-(item.prdtExpoAmt*100/item.prdtNormAmt))+'%</li>');
	        			specialHtml.append('			<li class="n2">'+item.prdtExpoAmt.format()+'원</li>');
	        			specialHtml.append('			<li class="n3">'+item.prdtNormAmt.format()+'원</li>');
	        		}else{
	        			specialHtml.append('			<li class="n2">'+item.prdtExpoAmt.format()+'원</li>');
	        		}
	        		specialHtml.append('		</ul>');
	        		specialHtml.append('	</div>');
        		}
        	});
        }
        specialHtml.append('	<div class="bgImg"><img src="" class="lozad" data-src="'+param.css+'" onerror="moNoImg(this)"></div>');
        specialHtml.append('</div>');

    });

    specialHtml.append('	</div>');
    specialHtml.append('</div>');

    //특별관 innerHtml
    $("#specialTheater_div").append(specialHtml.toString());

    var specialTheaterSwiper = new Swiper('.specialTheaterSwiper', {
    	spaceBetween: 18,
		slidesOffsetBefore:18,
		slidesOffsetAfter:18,
		slidesPerView: 'auto',
		  pagination: {
	        el: ".sts_swiperPagination",
	        clickable: true,
	        renderBullet: function (index, className) {
	          return '<span class="' + className  + '"><em class="'+spcCd[index]+'"></em></span>';
	        },
      	},
    });

    //모바일하단배너 CCS연결
    if(payBannerInfo.banner.length > 0) {
        const payBannerImgSrc = m_imgSvrUrl+payBannerInfo.banner[0].imgFilePathNm;

        megaBannerHtml.append('<div class="adType2_Swiper">');
        megaBannerHtml.append('		<div class="swiper-wrapper">');

        for (let i=0; i<payBannerInfo.banner.length; i++) {
            let payBannerImgSrcTemp = m_imgSvrUrl+payBannerInfo.banner[i].imgFilePathNm;
            if(isApp()){
                megaBannerHtml.append('<a href="javaScript:AppHandler.Common.link({domain:\''+payBannerInfo.banner[i].bannerLinkUrl+'\'})" class="item swiper-slide">');
            }else{
                megaBannerHtml.append('<a href="'+payBannerInfo.banner[i].bannerLinkUrl+'" target="'+payBannerInfo.banner[i].bannerLinkDivCd+'" title="'+payBannerInfo.banner[i].bannerLinkCn+'" class="item swiper-slide">');
            }
            megaBannerHtml.append('         <img src="'+payBannerImgSrcTemp+'" alt="'+payBannerInfo.banner[i].bannerRplWordsCn+'"/>');
            //megaBannerHtml.append('         <img src="https://img.megabox.co.kr/SharedImg/cpBanner/2024/09/02/i6QV3l8X5OyGOYDhIz5WZzAXwwDGP4ZG.png" alt="'+payBannerInfo.banner[i].bannerRplWordsCn+'"/>');
            megaBannerHtml.append('</a>');
        }
        megaBannerHtml.append('		</div>');
        if(payBannerInfo.banner.length > 1){
        	megaBannerHtml.append('		<div class="swiper-pagination"></div>');
        }
        megaBannerHtml.append('</div>');

        $("#megaBanner_div").append(megaBannerHtml.toString());
    	// 광고스와이프
        mainPayBannerSwiper = new Swiper('.adType2_Swiper', {
        	loop: true,
        	autoplay: {
        		delay: 3000,
        		disableOnInteraction: true,
        	},
        	pagination: {
        		el: '.swiper-pagination',
        		clickable: true,
        	},
        	ally : {
        		enabled : true
        	}
        });
    }

    //전면배너
    if(!isApp()) {

        if (bannerList.length > 0) {

			//배너명 설정(다시 보지않기 설정후 신규적용시는 떠야함. 배너별 유일하게 구분)
        	var bannerDate = bannerList[0].fstRegDt;

			//다시보지 않기 설정시 팝업 뜨지 않음
			if (fn_getCookie("MAIN_POP_" + bannerDate) == null || fn_getCookie("MAIN_POP_" + bannerDate) == 'N') {
				bannerHtml.append('<div class="layer-dimmed" id="banner_layer"></div>');
				bannerHtml.append('<div class="ad-popup2 z-index-10099" id="banner_content">');
				bannerHtml.append('<button type="button" class="btn-close-main-notice" onclick="fn_bannerClose(\'' +  bannerDate + '\')">닫기</button>');
				bannerHtml.append('<div class="layer-cont">');

				// 모바일 띠배너
				if (mobileBanner != null) {
					bannerHtml.append('<div style="padding:0 20px;">');

					var mobileImagePath = m_imgSvrUrl + mobileBanner.imgFilePathNm;
					var mobileLinkUrl = "javascript:void(0)";
					var mobileLinkTarget = "_self";

					if(mobileBanner.bannerLinkUrl) {
						mobileLinkUrl = mobileBanner.bannerLinkUrl;
						mobileLinkTarget = mobileBanner.bannerLinkDivCd;
					}

					bannerHtml.append('<a href="' + mobileLinkUrl + '" target="' + mobileLinkTarget + '"><img src="' + mobileImagePath + '" style="width:100%;border-radius: 14px;" class="mb10" alt="' + mobileBanner.bannerRplWordsCn + '" onerror="moNoImg(this);this.style.height=\'100px\'"></a>');
					bannerHtml.append('</div>');
				}

				bannerHtml.append('<div class="pop-slide">');
				bannerHtml.append('<div class="swiper-wrapper">');

				for(var i=0; i<bannerList.length; i++) {
					var banner = bannerList[i];
					var imagePath = banner.imgFilePathNm;

					if (!imagePath) {
						imagePath = m_imgSvrUrl + "/static/mb/images/common/bg/bg-noimage.png";
					} else {
						imagePath = m_imgSvrUrl + imagePath;
					}

					var bannerLinkUrl = "javascript:void(0)";

					if(banner.bannerLinkUrl) {
						bannerLinkUrl = banner.bannerLinkUrl;
					}

					bannerHtml.append('<div class="item swiper-slide">');
					bannerHtml.append('<a href="' + bannerLinkUrl + '"><img src="' + imagePath + '" alt="' + banner.bannerRplWordsCn + '" onerror="moNoImg(this)"></a>');
					bannerHtml.append('</div>');
				}

				bannerHtml.append('</div>');
				bannerHtml.append('</div>');
				bannerHtml.append('<div class="btn_pg"></div>');
				bannerHtml.append('</div>');

				bannerHtml.append('<div class="btn-group col-2">');
	            bannerHtml.append('<input type="checkbox" id="no_see" class="bg-chk">');
	            bannerHtml.append('<label for="no_see">하루동안 보지 않기</label>');
	            bannerHtml.append('</div>');
	            bannerHtml.append('</div>');

				$(".mainSection").append(bannerHtml.toString());
				fn_preventScroll();
			}
        }
    }

    if(!isApp()) {
        if(surveyPopupMap!== undefined) {
            const surveyPopupSuccess = surveyPopupMap.success;

            if (surveyPopupSuccess && movieReviewPopupMap !== undefined) {
                let sMovieNo = "";
                let sMovieNm = "";
                //영화 데이터 저장
                if(movieReviewSuccess) {
                    let movieReviewUrl = movieReviewPopupMap[0].notiLinkUrl.split("?").reverse()[0];
                    sMovieNo = movieReviewUrl.split("=")[1].split("&")[0];
                    sMovieNm = movieReviewUrl.split("=")[2].split("&")[0];
                }
                if (surveyPopupSuccess && movieReviewSuccess) {
                    //관람평과 설문조사 모두 존재하는 경우
                    const surveyNo = surveyPopupMap.surveyNo;
                    //설문 및 실관람평 읽음 처리
                    fn_movieReviewReadAt();
                    fn_surveyReadAt(surveyNo);

                    surveyPopupHtml.append('<div class="layer-dimmed" id="surveyPopup_layer"></div>');
                    surveyPopupHtml.append('<div class="ad-popup3 z-index-10009" id="surveyPopup_content">');
                    surveyPopupHtml.append('<button type="button" class="btn-close-survey-popup" onclick="fn_surveyAndMovieReivewPopupClose(\'' +  surveyNo + '\')"><i class="iconset ico-survey-popup-close"></i></button>');
                    surveyPopupHtml.append('<div class="layer-cont">');
                    surveyPopupHtml.append('<div class="survey-txt">관람후기 작성 및 설문조사를 참여해주세요!</div>');
                    surveyPopupHtml.append('<div class="survey-txt"> 포인트를 지급해드립니다.</div>');
                    surveyPopupHtml.append('<div class="btn_survey">');
                    surveyPopupHtml.append('<button type="button" class="btn-movie-review-write" onclick="fn_openRegOnelnEval(\'' + sMovieNo + '\', \'' + sMovieNm + '\')"><span>관람후기 작성</span></button>');
                    surveyPopupHtml.append('<a href="' + surveyPopupMap.surveyUrl + '">');
                    surveyPopupHtml.append('<button type="button" class="btn-survey-write"><span>설문조사 작성</span></button>');
                    surveyPopupHtml.append('</a>');
                    surveyPopupHtml.append('</div>');
                    surveyPopupHtml.append('</div>');
                    surveyPopupHtml.append('</div>');

                    $(".mainSection").append(surveyPopupHtml.toString());
                    fn_preventScroll();
                    if(bannerList.length > 0) {
                        var bannerDate = bannerList[0].fstRegDt;
                        fn_dupDimlayer(bannerDate);
                    }
                }
            } else if(!surveyPopupSuccess && movieReviewPopupMap !== undefined) {
                if(admisCompltSuccess && admisCompltPopup !== undefined) {
                    fn_movieReviewReadAt();
                    surveyPopupHtml.append('<div class="layer-dimmed" id="surveyPopup_layer"></div>');
                    surveyPopupHtml.append('    <div class="ad-popup3 z-index-10009 spoqahansansneo-normal" id="surveyPopup_content">');
                    surveyPopupHtml.append('        <button type="button" class="btn-close-survey-popup" onclick="fn_surveyAndMovieReivewPopupClose()"><i class="iconset ico-survey-popup-close"></i></button>');
                    surveyPopupHtml.append('        <div class="layer-cont">');
                    surveyPopupHtml.append('            <div class="survey-txt" style="padding: 0 20px 0 20px; white-space: pre-wrap;">'+admisCompltPopup.notiCn+'</div>');
                    surveyPopupHtml.append('            <div class="btn_survey">');
                    surveyPopupHtml.append('                <a href="'+admisCompltPopup.notiLinkUrl+'">');
                    surveyPopupHtml.append('                    <button type="button" class="btn-survey-alone skyblue">'+admisCompltPopup.notiBtnNm+'</button>');
                    surveyPopupHtml.append('                </a>');
                    surveyPopupHtml.append('            </div>');
                    surveyPopupHtml.append('        </div>');
                    surveyPopupHtml.append('    </div>');
                    surveyPopupHtml.append('</div>');
                    $(".mainSection").append(surveyPopupHtml.toString());
                    fn_preventScroll();
                    if(bannerList.length > 0) {
                        var bannerDate = bannerList[0].fstRegDt;
                        fn_dupDimlayer(bannerDate);
                    }
                } else if(!admisCompltSuccess && movieReviewSuccess) {
                    //관람평만 존재하는 경우
                    let movieReviewUrl = movieReviewPopupMap[0].notiLinkUrl.split("?").reverse()[0];
                    let sMovieNo = movieReviewUrl.split("=")[1].split("&")[0];
                    let sMovieNm = movieReviewUrl.split("=")[2].split("&")[0];
                    //실관람평 읽음 처리
                    fn_movieReviewReadAt();
                    surveyPopupHtml.append('<div class="layer-dimmed" id="surveyPopup_layer"></div>');
                    surveyPopupHtml.append('    <div class="ad-popup3 z-index-10009 spoqahansansneo-normal" id="surveyPopup_content">');
                    surveyPopupHtml.append('        <button type="button" class="btn-close-survey-popup" onclick="fn_surveyAndMovieReivewPopupClose()"><i class="iconset ico-survey-popup-close"></i></button>');
                    surveyPopupHtml.append('        <div class="layer-cont">');
                    surveyPopupHtml.append('            <div class="survey-txt" style="padding: 0 20px 0 20px;">'+ movieReviewPopupMap[0].notiCn+'</div>');
                    surveyPopupHtml.append('            <div class="btn_survey">');
                    surveyPopupHtml.append('                <a href="javascript:void(0);">');
                    surveyPopupHtml.append('                    <button type="button" class="btn-survey-alone skyblue" onclick="fn_openRegOnelnEval(\'' + sMovieNo + '\', \'' + sMovieNm + '\')">관람평 작성하기</button>');
                    surveyPopupHtml.append('                </a>');
                    surveyPopupHtml.append('            </div>');
                    surveyPopupHtml.append('        </div>');
                    surveyPopupHtml.append('    </div>');
                    surveyPopupHtml.append('</div>');
                    $(".mainSection").append(surveyPopupHtml.toString());
                    fn_preventScroll();
                    if(bannerList.length > 0) {
                        var bannerDate = bannerList[0].fstRegDt;
                        fn_dupDimlayer(bannerDate);
                    }
                }
            } else if (surveyPopupSuccess && movieReviewPopupMap === undefined ) {
                //설문조사만 존재하는 경우
                const surveyNo = surveyPopupMap.surveyNo;
                //설문 읽음 처리
                fn_surveyReadAt(surveyNo);
                surveyPopupHtml.append('<div class="layer-dimmed" id="surveyPopup_layer"></div>');
                surveyPopupHtml.append('<div class="ad-popup3 z-index-10009" id="surveyPopup_content">');
                surveyPopupHtml.append('<button type="button" class="btn-close-survey-popup" onclick="fn_surveyAndMovieReivewPopupClose()"><i class="iconset ico-survey-popup-close"></i></button>');
                surveyPopupHtml.append('<div class="layer-cont">');
                surveyPopupHtml.append('<div class="survey-txt">메가박스와 함께 즐거운 관람 되셨나요?</div>');
                surveyPopupHtml.append('<div class="survey-paragraph">');
                surveyPopupHtml.append('<div class="survey-txt">고객만족도 설문조사에 참여하시면</div>');
                surveyPopupHtml.append('<div class="survey-txt">즉시 사용 가능한 포인트를 지급해드려요.</div>');
                surveyPopupHtml.append('</div>');
                surveyPopupHtml.append('<div class="btn_survey">');
                surveyPopupHtml.append('<a href="' + surveyPopupMap.surveyUrl + '">');
                surveyPopupHtml.append('<button type="button" class="btn-survey-alone skyblue">참여하기</button>');
                surveyPopupHtml.append('</a>');
                surveyPopupHtml.append('</div>');
                surveyPopupHtml.append('</div>');
                surveyPopupHtml.append('</div>');

                $(".mainSection").append(surveyPopupHtml.toString());
                fn_preventScroll();
                if(bannerList.length > 0) {
                    var bannerDate = bannerList[0].fstRegDt;
                    fn_dupDimlayer(bannerDate);
                }
            }
        }
    }
    //이미지 지연로딩
    gfn_lozadStart("lozad");
}

function fn_storeDtlPage(prdtClCd, prdtNo){
	event.stopPropagation();
	AppDomain.Store.storeDtlPage(prdtClCd, prdtNo);
}

// 이벤트 Tab 조회 추가
function fn_selectEvent(cdId){

    var parameter = {
		eventDivCd: cdId
    };

	// data 조회
    $.ajax({
        url: "/on/oh/ohz/MainEvent",
        type: "POST",
        contentType: "application/json;charset=UTF-8",
        dataType: "json",
        data: JSON.stringify(parameter),
        async: true,
        success: function (data, textStatus, jqXHR) {
        	if (data.eventList.length > 0){
        		// 이벤트 그리기
        		fn_drawEvent(data, cdId);
        	}else{
        		AppHandler.Common.alert("해당하는 이벤트가 없습니다.");
        	}

        }
    });
}

// 이벤트 그리기
function fn_drawEvent(data, cdId){

	// eventTab on 제거
	$('#eventTab a').removeClass('on');
	// 클릭한 tab on 추가
	$('#eventTab a#' + cdId).addClass('on');

    // 선택한 내용만 보이게..
	$('.me_Swiper').addClass('display-none');
	$('#eventList_'+cdId).removeClass('display-none');

	// 이미 그려진 이벤트 안그리기
	if($('#eventList_' + cdId + ' a').length > 0){
		return;
	}

    var eventList = data.eventList;

    var eventHtml = new StringBuffer();

    eventHtml.append('<div class="swiper-wrapper">');
    for(var i=0;i<eventList.length;i++) {
        //$.each(eventList, function (i, item) {
        var imgPathNm = '';
        var item = eventList[i];

        if (item.moFilePathNm != null) {
            imgPathNm = item.moFilePathNm;
        }

        if (nvl(imgPathNm) == "") {
            imgPathNm = "/static/mb/images/common/bg/bg-noimage.png";
        }

    	eventHtml.append('	<a href="javascript:fn_goEventLink(\'' + item.eventNo + '\', \'' + item.shareAt + '\',\'' + item.netfunnelAt + '\');" class="item swiper-slide">');
    	eventHtml.append('			<img src="" class="lozad" data-src="' + m_imgSvrUrl + imgPathNm + '" alt="이벤트이미지" onerror="moNoImg(this)">');
    	eventHtml.append('	      <p class="text">' + item.eventStartDt + ' - ' + item.eventEndDt + '</p>');
    	eventHtml.append('	</a>');
    }
    eventHtml.append('</div>');

    $('#eventList_'+cdId).append(eventHtml.toString());

    //swiper
    var me_Swiper = new Swiper('#eventList_'+cdId, {
		slidesPerView: 'auto',
		freeMode: true,
		spaceBetween: 12,
		slidesOffsetBefore:18,
		slidesOffsetAfter:18,
		pagination: false ,
		centeredSlides: false ,
		disableTouchControl:true,
		lazy:true,
		navigation : false
    });

    gfn_lozadStart("lozad");

}

function fn_preventScroll() {
    $(document.body).addClass("no-scroll");
}

function fn_preventScrollRelease() {
    $(document.body).removeClass("no-scroll");
}

//전면배너 닫기
var bannerDate = "";
function fn_bannerClose(bannerDate) {
    fn_preventScrollRelease();

    if ($(":checkbox[id='no_see']:checked").length > 0) {
        fn_setCookie("MAIN_POP_"+bannerDate, "Y", 1);
    }

    $("#banner_layer").remove();
    $("#banner_content").remove();
    $('#surveyPopup_layer').removeClass(noneClass);
}

//관람평 읽음 처리
function fn_movieReviewReadAt() {
    $.ajax({
        url: "/api/inapp/read",
        type: "POST",
        contentType: "application/json;charset=UTF-8",
        dataType: "json",
        async: true,
        success: function (data, textStatus, jqXHR) {
        },
        error: function (xhr, status, error) {
            const err = JSON.parse(xhr.responseText);
            AppHandler.Common.alert(err.msg);
        }
    });
}
//고객설문조사 읽음 처리
function fn_surveyReadAt(surveyNo) {
    const paramData = {
        surveyNo : surveyNo
    };

    if(surveyNo != null) {
            $.ajax({
                url: "/api/surveyRead",
                type: "POST",
                contentType: "application/json;charset=UTF-8",
                dataType: "json",
                data: JSON.stringify(paramData),
                async: true,
                success: function (data, textStatus, jqXHR) {
                },
                error: function (xhr, status, error) {
                    const err = JSON.parse(xhr.responseText);
                    AppHandler.Common.alert(err.msg);
                }
            });
        }
}
//고객설문 및 관람평 팝업 닫기
function fn_surveyAndMovieReivewPopupClose() {
    fn_preventScrollRelease();
    $("#surveyPopup_layer").remove();
    $("#surveyPopup_content").remove();
}

//쿠키설정
function fn_setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires + ";path=/";
}

//쿠키조회
function fn_getCookie(name) {
    var value = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    return value? value[2] : null;
}

//영화목록 이동
function fn_goMovieList() {
    var tabCd = 'boxoffice';
    if($("button[search-type=scheduled]").hasClass("on")) {
        tabCd = 'comingsoon';
    }
    /*
    else if($("button[search-type=curation]").hasClass("on")) {
            tabCd = 'curation';
    }
    */
    else if($("button[search-type=film]").hasClass("on")) {
        tabCd = 'film';
    }
    else if($("button[search-type=classic]").hasClass("on")) {
        tabCd = 'classic';
    }

    ////////////////////////////////////////////////////////////////////////////////////////
    ///// 영화 콘텐트 해시태그 클릭 처리 추가 (박태현) ////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////
    var cttsYn = false;
    var movieCttsTyCd;
    var movieCttsOrd;
    /*
    $("button[action-type=tab]").each(function() {
        if($(this).hasClass("on")) {
            movieCttsTyCd = $(this).attr("movie-ctts-ty");
            movieCttsOrd = $(this).attr("movie-ctts-ord");

            if(movieCttsTyCd != "" && movieCttsTyCd != null && movieCttsTyCd != "undefined"){
                cttsYn = true;
            }
        }
    });
    */
    if(cttsYn == true){
        AppDomain.Movie.list(tabCd, AppDomain.Flag.isRefresh, movieCttsTyCd, movieCttsOrd);
    }else{
        AppDomain.Movie.list(tabCd, AppDomain.Flag.isRefresh);
    }
    ////////////////////////////////////////////////////////////////////////////////////////

}

//영화상세정보 이동
function fn_goMoveDetail(rpstMovieNo, tabType, backWord) {
    if(rpstMovieNo == '') {
        return;
    }

    var params = {
        rpstMovieNo: rpstMovieNo,
        tabCd: tabType,
        backWord: backWord
    };
    AppDomain.Movie.backwordDetail(params);
}

//무대인사/시사회
function fn_goGreetingDetail(rpstMovieNo) {
    var params = {
        rpstMovieNo: rpstMovieNo,
        tabCd: ''
    };
    AppDomain.Movie.detail(params);
}

//바로예매
function fn_goBooking(movieNo, movieNm, admisClassCd, imgSvrUrl, flag , theaterType) {
    if(theaterType == undefined) {
        theaterType = '';
    }

    var params = {
        movieNo: movieNo,
        theaterType: theaterType,
        imageUrl: imgSvrUrl
    };
    AppDomain.Booking.quickBooking(params);
}

function fn_goQuickBooking(movieNo, theaterType) {
    if(theaterType == undefined) {
        theaterType = '';
    }

    var params = {
        movieNo: movieNo,
        theaterType: theaterType
    };
    AppDomain.Booking.quickBooking(params);
}


//메가박스 소식 상세정보 이동
function fn_goMegaNewsLink(url, title) {
    var params = {
        url: url,
        title: title
    };
    AppDomain.Event.openUrl(params);
}

//이벤트 상세정보 이동
function fn_goEventLink(eventNo, shareAt, netfunnelAt) {
    var params = {
        netfunnelAt: netfunnelAt,
        eventNo: eventNo,
        shareAt: shareAt
    };
    AppDomain.Event.detail(params);
}

//특별관 소개 상세
function fn_goSpecialDetail(kindCd, theaterNm) {
    AppDomain.Theater.specialDetail(kindCd);
}

//영화기본필터
var boforeFilterType = "";
var tabType = "1";
function fn_movieFilter(filterType, typeCd) {
    if($("#b_"+filterType+"_movie").children().length > 0) {
        fn_movieFilterActiveOn(filterType);
        fn_movieFileterViewChange(filterType);
        return;
    }

    if(controlAction.isExec()) return; controlAction.on();

    var parameter = {
        currentPage: "1",
        recordCountPerPage: "15",
        filterType: filterType,
    };

    if(filterType == "scheduled") {
        parameter.pageType = "rfilmDe";
        parameter.ibxMovieNmSearch = "";
        parameter.onairYn = "MSC02";
        parameter.specialType = "";
        tabType = "2";
    } else if(filterType == "boxo") {
        parameter.pageType = "ticketing";
        parameter.ibxMovieNmSearch = "";
        parameter.onairYn = "N";
        parameter.specialType = "";
        tabType = "1";
    } else if(filterType == "curation") {

    }
        //////////////////////////////////////////////////////////
        ////// 필름/클래식소사이어티 추가 (박태현) /////////////////
    //////////////////////////////////////////////////////////
    else if(filterType == "film") {
        parameter.pageType = "ticketing";
        parameter.ibxMovieNmSearch = "";
        parameter.onairYn = "";
        parameter.specialType = "film";
        tabType = "3";
    }

    else if(filterType == "classic") {
        parameter.pageType = "ticketing";
        parameter.ibxMovieNmSearch = "";
        parameter.onairYn = "";
        parameter.specialType = "classic";
        tabType = "4";
    }
    //////////////////////////////////////////////////////////

    else if(filterType == "singleScreening") {
        parameter.pageType = "ticketing";
        parameter.ibxMovieNmSearch = "";
        parameter.onairYn = "N";
        parameter.specialType = "";
        parameter.singPlayAt = "Y";
        tabType = "1";
    } else if(typeCd) {
        parameter.pageType = "ticketing";
        parameter.ibxMovieNmSearch = "";
        parameter.onairYn = "N";
        parameter.specialType = "";
        parameter.cttsOrd = filterType;
        parameter.cttsTyCd = typeCd;
        tabType = "1";
    }

    $("a[action-type=tab]").each(function() {
        if($(this).hasClass("on")) {
            boforeFilterType = $(this).attr("search-type");
            return false;
        }
    });

    fn_movieFilterActiveOn(filterType);

    $.ajax({
        url: "/on/oh/oha/Movie/selectMovieList.do",
        type: "POST",
        contentType: "application/json;charset=UTF-8",
        dataType: "json",
        data: JSON.stringify(parameter),
        success: function (data, textStatus, jqXHR) {
        	var movieFilterBannerList = data.movieFilterBannerList
        	// 각영역에 맞는 배너가 있다면 넣어준다.
        	if (movieFilterBannerList != undefined){
        		if(movieFilterBannerList.length > 0){
        			for(var i=0; i<movieFilterBannerList.length; i++ ){
        				var temp = movieFilterBannerList[i];
        				if(temp.setArtiCttsOrd != 'boxo'){
        					if(temp.movieCttsTyCd == typeCd && temp.setArtiCttsOrd == filterType){
        						if(temp.boxoCateAccountDivCd == 'ACC01'){
        							data.bannerA = temp;
        						}
        						if(temp.boxoCateAccountDivCd == 'ACC02'){
        							data.bannerB = temp;
        						}
        					}
        				}
        			}
        		}
        	}
            fn_movieFilterCallback(data);
            controlAction.off();
        },
        error: function(xhr,status,error){
            fn_movieFilterMessage();
            controlAction.off();
        }
    });
}

//무비필터 콜백
function fn_movieFilterCallback(result) {

    var movieList = result.movieList;
    var movieHtml = new StringBuffer();
    var bannerA = result.bannerA;
    var bannerB = result.bannerB;
    if(movieList.length > 0) {
        $.each(movieList, function(i, item) {

        	var imagePath;

            if(item.imgPathNm == '' || item.imgPathNm == 'null' || item.imgPathNm == null) {
                imagePath = m_imgSvrUrl + "/static/mb/images/common/bg/bg-noimage.png";
            }

            if(nvl(item.imgPathNm).split(".")[1] == "gif"){
            	imagePath = m_imgSvrUrl + nvl(item.imgPathNm);
            }else{
            	imagePath = m_imgSvrUrl + nvl(item.imgPathNm).posterFormat('_600');
            }

            if(i == 0){
            	if(bannerA != undefined){
            		movieHtml.append('<div class="item swiper-slide">');
            		movieHtml.append('	<div class="topArea">');
            		movieHtml.append('		<a href="javascript:gfn_bannerLink(\''+bannerA.bannerLinkUrl+'\');" class="posterBox imgArea">');
            		movieHtml.append('			<div class="img"><img class="lozad" data-src="'+m_imgSvrUrl+bannerA.bannerFilePathNm+'" src="" alt="배너" onerror="moNoImg(this)"/></div>');
            		movieHtml.append('		</a>');
            		movieHtml.append('	</div>');
            		movieHtml.append('	<div class="botArea">');
            		if(bannerA.bannerBtnTxt != null){
            			movieHtml.append('		<button class="btn2" onclick="gfn_bannerLink(\''+bannerA.bannerLinkUrl+'\')">'+bannerA.bannerBtnTxt+'</button>');
            		}
            		if(bannerA.bannerMainTxt != null){
            			movieHtml.append('		<div class="title">'+gfn_scrtDecode(bannerA.bannerMainTxt)+'</div>');
            		}
            		if(bannerA.bannerSubTxt != null){
            			movieHtml.append('		<div class="text">'+gfn_scrtDecode(bannerA.bannerSubTxt)+'</div>');
            		}
            		movieHtml.append('	</div>');
            		movieHtml.append('</div>');
            	}
            	if(bannerB != undefined){
            		movieHtml.append('<div class="item swiper-slide">');
            		movieHtml.append('	<div class="topArea">');
            		movieHtml.append('		<a href="javascript:gfn_bannerLink(\''+bannerB.bannerLinkUrl+'\');" class="posterBox imgArea">');
            		movieHtml.append('			<div class="img"><img class="lozad" data-src="'+m_imgSvrUrl+bannerB.bannerFilePathNm+'" src="" alt="배너" onerror="moNoImg(this)"/></div>');
            		movieHtml.append('		</a>');
            		movieHtml.append('	</div>');
            		movieHtml.append('	<div class="botArea">');
            		if(bannerB.bannerBtnTxt != null){
            			movieHtml.append('		<button class="btn2" onclick="gfn_bannerLink(\''+bannerB.bannerLinkUrl+'\')">'+bannerB.bannerBtnTxt+'</button>');
            		}
            		if(bannerB.bannerMainTxt != null){
            			movieHtml.append('		<div class="title">'+gfn_scrtDecode(bannerB.bannerMainTxt)+'</div>');
            		}
            		if(bannerB.bannerSubTxt != null){
            			movieHtml.append('		<div class="text">'+gfn_scrtDecode(bannerB.bannerSubTxt)+'</div>');
            		}
            		movieHtml.append('	</div>');
            		movieHtml.append('</div>');
            	}
            }

            movieHtml.append('<div class="item swiper-slide">');
            movieHtml.append('	<div class="topArea">');
            movieHtml.append('		<a href="javascript:fn_goMoveDetail(\''+item.rpstMovieNo+'\')" class="posterBox imgArea">');
            movieHtml.append('			<div class="img"><img class="lozad" data-src="'+imagePath+'" alt="'+item.movieNm+'" onerror="moNoImg(this)"/></div>');
            if(result.filterType) {
                if(result.filterType == 'boxo') {
		            movieHtml.append('			<div class="top">');
		            movieHtml.append('				<span class="numb"><img src="https://img.megabox.co.kr/static/mb/images/2024renewal/main/chartnum_"'+item.rowNum+'".png" alt="'+item.rowNum+'"/></span>');
		            movieHtml.append('				<span class="rate">'+item.boxoBokdRt+'%</span>');
		            movieHtml.append('			</div>');
                }else{
                	movieHtml.append('			<div class="top">');
                	movieHtml.append('				<span class="rate">예매율 '+item.boxoBokdRt+'%</span>');
                	movieHtml.append('			</div>');
                }
            }
            movieHtml.append('			<ul class="movieType">');

            if(item.dolbyTheabIncAt == 'Y' || item.atmosTheabIncAt == 'Y' || item.mx4dTheabIncAt == 'Y') {
                movieHtml.append('			<ul class="lit">');
                if (item.mx4dTheabIncAt == 'Y') {
                    movieHtml.append('			<li><img src="https://img.megabox.co.kr/static/mb/images/main/type_megamx4d.png"/></li>');
                }
                if (item.dolbyTheabIncAt == 'Y') {
                    movieHtml.append('			<li><img src="https://img.megabox.co.kr/static/mb/images/main/type_dolbycinema.png"/></li>');
                }
                if (item.atmosTheabIncAt == 'Y') {
                    movieHtml.append('			<li><img src="https://img.megabox.co.kr/static/mb/images/main/type_dolbyatmos.png"/></li>');
                }
                movieHtml.append('			</ul>');
            }

            movieHtml.append('			</ul>');

            if (item.megaOnlyAt == 'Y' || item.singlPlayAt == 'Y') {
                movieHtml.append('		<div class="megaOnly">MEGA ONLY</div>');
            }

            var admisClass = "icon2 " + gfn_getNewPlayClassCssClass(item.admisClassCd, '');

            movieHtml.append('			<div class="filmRate">');
            movieHtml.append('				<i class="'+admisClass+'">' + item.admisClassNm + '</i>');
            movieHtml.append('			</div>');
            movieHtml.append('		</a>');
            movieHtml.append('	</div>');

            var bookingType = "";
            var comingSoon = "";
            var bookingText = "";
            var releaseTitle = "개봉예정";
            var release = "미정";
            var releaseMonth = "미정";
            var s_intrstCnt = "0";   //보고싶어
            if (item.intrstCnt > 999) {
                s_intrstCnt = Math.floor((item.intrstCnt/1000) * 10)/10  + 'k';
            } else {
                s_intrstCnt = item.intrstCnt;
            }

            //개봉월
            if(item.rfilmDe != null && item.rfilmDe.length == 10) {
                var rfilmDe = item.rfilmDe.replace(/[^0-9]/g,"");
                var now = new Date();
                var then;
                var gap = 0;

                if(rfilmDe.length == 8) {
                    var year = rfilmDe.substr(0,4);
                    var month = rfilmDe.substr(4,2);
                    var day = rfilmDe.substr(6,2);
                    then = new Date(year, (month-1), day);
                    gap = then.getTime() - now.getTime();
                    gap = Math.ceil(gap / (60*1000*60*24));
                }

                if(gap > 0) {
                    releaseTitle = "개봉일";
                    releaseMonth = "D-"+gap; //개봉 D-day
                } else {
                    releaseTitle = "개봉월";
                    if(rfilmDe.substr(4,2).substr(0,1) == '0') {
                        releaseMonth = rfilmDe.substr(5,1) + "월";
                    } else {
                        releaseMonth = rfilmDe.substr(4,2) + "월";
                    }
                }
            } else {
                if(item.rfilmYm != null && item.rfilmYm.length == 7) {
                    var rfilmYm = item.rfilmYm.replace(/[^0-9]/g,"");
                    releaseTitle = "개봉월";
                    if(rfilmYm.substr(4,2).substr(0,1) == '0') {
                        releaseMonth = rfilmYm.substr(5,1) + "월";
                    } else {
                        releaseMonth = rfilmYm.substr(4,2) + "월";
                    }
                } else {
                    releaseMonth = '미정';
                }
            }

            if (item.movieStatCd == 'MSC01' && item.bokdAbleYn == 'Y') {
                bookingType = "booking";
                bookingText = "바로예매";
            } else if (item.movieStatCd == 'MSC02' && item.bokdAbleYn == 'Y' && item.rfilmDeReal != null) {
                bookingType = "booking";
                bookingText = "바로예매";
            } else if (item.movieStatCd == 'MSC02' && item.bokdAbleYn == 'N' && item.rfilmDeReal != null) {
                bookingType = "impossible";
                comingSoon = "coming-soon";
                bookingText = "개봉예정";
                release = releaseMonth;
            } else if (item.movieStatCd == 'MSC02' && item.bokdAbleYn == 'N' && item.rfilmDeReal == null && item.rfilmYm != null) {
                bookingType = "impossible";
                comingSoon = "coming-soon";
                bookingText = "개봉예정";
                release = releaseMonth;
            } else if (item.movieStatCd == 'MSC03') {
                bookingType = "endof";
                comingSoon = "coming-soon";
                bookingText = "상영종료";
            } else {
                bookingType = "scheduled";
                comingSoon = "coming-soon";
                bookingText = "상영예정";
                release = releaseMonth;
            }

            if(result.filterType == "stageGreeting") {
                comingSoon = "";
                bookingText = "일정보기";
            }

            var totalSpoint = 0;
            if(item.admisNSpoint) {
                totalSpoint = item.admisNSpoint;
            }

            // 상영예정작 TAB >> 디데이/ 보고싶어
            // 그외 TAB >> 개봉전 : 예매율, 디데이/ 개봉 후 : 예매율, 평점
            var boxoBokdRt = item.boxoBokdRt;
            var boxoBokdPer = "%";
            var admisYSpoint = item.admisYSpoint;
            if(!boxoBokdRt) {
            	boxoBokdRt = "0";
            	boxoBokdPer = "%";
            }
            if(!admisYSpoint) {
            	admisYSpoint = "0";
            }

            movieHtml.append('	<div class="botArea">');
            if(result.filterType == "stageGreeting") {
            	movieHtml.append('	<button onclick="fn_movieDetailWithStageGreeting(\''+item.rpstMovieNo+'\')" class="btn2">'+bookingText+'</button>');
            } else {
            	if(bookingType == "impossible" || bookingType == "endof" || bookingType == "scheduled" || bookingType == "booking-scheduled") {
            		movieHtml.append('	<button class="btn2">'+bookingText+'</button>');
            	} else {
            		movieHtml.append('	<button onclick="fn_goQuickBooking(\''+item.rpstMovieNo+'\')" class="btn2">'+bookingText+'</button>');
            	}
            }
            movieHtml.append('		<div class="title">'+item.movieNm+'</div>');
            movieHtml.append('		<div class="info">');
            var boxoCnt = item.boxoKofTotAdncCnt;

            if(boxoCnt > 10000){
            	boxoCnt = (boxoCnt / 10000).toFixed(1);
            	movieHtml.append('			<span class="total">누적관객수 '+boxoCnt+'만</span>');
            }else{
            	movieHtml.append('			<span class="total">누적관객수 '+boxoCnt+'</span>');
            }

            if(item.dday >= 0){
    			movieHtml.append('		<span class="totalRa te"><i class="icon2 i_star_p12">평점</i>'+admisYSpoint+'</span>');
    		}else{
    			movieHtml.append('		<span class="totalRa te">D'+item.dday+'</span>');
    		}
            movieHtml.append('		</div>');
            movieHtml.append('	</div>');
            movieHtml.append('</div>');
        });

        movieHtml.append('<div class="item more">');
        movieHtml.append('	<a href="javascript:fn_goMovieList()" class="moreBtn">더보기</a>');
        movieHtml.append('</div>');

        $("#b_"+result.filterType+"_movie").css("width", (movieList.length * 162 + 200) + "px");
        $("#b_"+result.filterType+"_movie").html(movieHtml.toString());
        fn_movieFileterViewChange(result.filterType);

        $("button[action-type=tab]").each(function() {
            if($(this).hasClass("on")) {
                if($(this).attr("search-type") == "boxo") {
                    fn_getMovieAd();
                }
                return false;
            }
        });

        gfn_lozadStart("lozad");
    } else {
        fn_movieFilterMessage();
    }
}

function fn_movieDetailWithStageGreeting(rpstMovieNo) {
    if(rpstMovieNo == '') {
        return;
    }

    var params = {
        rpstMovieNo: rpstMovieNo,
        tabCd : 'cc'
    };
    AppDomain.Movie.backwordDetailWithStageGreeting(params);
}

function fn_movieFilterActiveOn(filterType) {
    $("a[action-type=tab]").removeClass("on");
    $("a[search-type="+filterType+"]").addClass("on");
}

function fn_movieFileterViewChange(filterType) {
    $("section[data-type=movie-list]").addClass("display-none");
    $("#b_"+filterType+"_movie_wrap").removeClass("display-none");

    if( $("#b_"+filterType+"_movie_wrap").length > 0 ){
        var mainFilterMovieList = new Swiper('#b_'+filterType+'_movie_wrap', {
    		slidesPerView: 'auto',
    		freeMode: true,
    		spaceBetween: 12,
    		pagination: false ,
    		centeredSlides: false ,
    		disableTouchControl:true,
    		lazy:true,
    		navigation : false
    	});
    }
}

function fn_movieFilterMessage() {
    var currTab = "";
    $("a[action-type=tab]").each(function() {
        if($(this).hasClass("on")) {
            currTab = $(this).attr("search-type");
            return false;
        }
    });
    fn_movieFilterRollback();
    if(currTab == "singleScreening") {
        AppHandler.Common.alert("진행중인 단독상영이 없습니다.");
    } else if(currTab == "stageGreeting") {
        AppHandler.Common.alert("진행중인 무대인사가 없습니다.");
    } else {
        if(currTab == "") {
            AppHandler.Common.alert("조회 된 데이터가 없습니다.");
        } else {
            var title = $("a[search-type="+currTab+"]").text().replace("#", "");
            AppHandler.Common.alert("["+title+"] 조회 된 데이터가 없습니다.");
        }
    }
}

function fn_movieFilterRollback() {
    if(boforeFilterType != "") {
        $("a[action-type=tab]").removeClass("on");
        $("a[search-type="+boforeFilterType+"]").addClass("on");
        boforeFilterType = "";
    }
}

//포토카드
//mbNo 수정 필요 - session 관리정책 결정 후 적용
//로그인 되어 있지 않으면 리턴
function fn_photoCard() {
    if(isApp()) {
        AppHandler.Common.photoCard();
    } else {
    	gfn_goStore();
//        if(osTypeWithWeb() == "MOBILEWEB") {
//            AppHandler.Common.alert("포토카드 서비스는 모바일앱에서만 이용가능합니다.");
//        } else {
//            AppHandler.Common.confirm({
//                title     : '포토카드',
//                message   : '포토카드 서비스는 모바일앱에서만 이용가능합니다. \n메가박스 모바일앱으로 이동하시겠습니까?',
//                okFunc    : fn_goStore
//            });
//        }
    }
}
function fn_openMymenu(){
	if(fn_loginAt()){
		AppHandler.Common.goMy();
	}else{
		loginChk();
	}
}
/**
 * 영화 광고 구좌 조회(3,6,9)
 */
function fn_getMovieAd() {
    var header = { "typ": "JWT", "alg": "HS256" };
    var data;
    if(isApp()){
        data = { "device": {"devicetype": 1},  "imp": [{"native": {"ext" : {"slots" : 3}}}], "app": {"name": "megabox"}, "id": "" };
    }else{
        data = { "device": {"devicetype": 1},  "imp": [{"native": {"ext" : {"slots" : 3}}}], "site": {"name": "megabox"}, "id": "" };
    }
    var secret = "";

    // IOS
    if(osTypeWithWeb() == "IOS" && isApp()) {
        secret = "X1CMW-sNS1yMo4s5W_u16Q";
    }
    // AOS
    else if(osTypeWithWeb() == "ANDROID" && isApp()) {
        secret = "W66z4F1VRD-Ct6OR-TuENQ";
    }
    // Web
    else {
        secret = "dbpzsouvRZWXG0qKlZE4qQ";
    }

    var stringifiedHeader = CryptoJS.enc.Utf8.parse(JSON.stringify(header));
    var encodedHeader = base64url(stringifiedHeader);
    var stringifiedData = CryptoJS.enc.Utf8.parse(JSON.stringify(data));
    var encodedData = base64url(stringifiedData);
    var signature = encodedHeader + "." + encodedData;
    signature = CryptoJS.HmacSHA256(signature, secret);
    signature = base64url(signature);
    var pram = encodedHeader+"."+encodedData+"."+signature;
    var adUrl = "https://cast.imp.joins.com/bid/"+secret+"/"+pram; //상용

    $.ajax({
        type: "get"
        , url: adUrl
        , data: ""
        , async : false
        , success: function(result) {
        	fn_movieAdAppend(result);
        }
        , error: function(err) {
            console.log('fn_getMovieAd error : ' + err.status);
        }
    });
}

/**
 * 상단 마케팅 제휴 배너
 */
function fn_getMKTTopBannerAd() {
	var header = { "typ": "JWT", "alg": "HS256" };
	var data;
	if(isApp()){
		data = { "device": {"devicetype": 1},  "imp": [{"native": {"ext" : {"slots" : 1}}}], "app": {"name": "megabox"}, "id": "" };
	}else{
		data = { "device": {"devicetype": 1},  "imp": [{"native": {"ext" : {"slots" : 1}}}], "site": {"name": "megabox"}, "id": "" };
	}
	var secret = "";

	// IOS
	if(osTypeWithWeb() == "IOS" && isApp()) {
		secret = "qspDbOWlR1avI0ArObmAPA"; //qspDbOWlR1avI0ArObmAPA
	}
	// AOS
	else if(osTypeWithWeb() == "ANDROID" && isApp()) {
		secret = "4ITPBmGpSgugGvrBw7rsZw"; //4ITPBmGpSgugGvrBw7rsZw
	}
	// Web
	else {
		secret = "ZZSgbEC3TM2WxWt_R4SKAQ";  //ZZSgbEC3TM2WxWt_R4SKAQ
	}

	var stringifiedHeader = CryptoJS.enc.Utf8.parse(JSON.stringify(header));
	var encodedHeader = base64url(stringifiedHeader);
	var stringifiedData = CryptoJS.enc.Utf8.parse(JSON.stringify(data));
	var encodedData = base64url(stringifiedData);
	var signature = encodedHeader + "." + encodedData;
	signature = CryptoJS.HmacSHA256(signature, secret);
	signature = base64url(signature);
	var pram = encodedHeader+"."+encodedData+"."+signature;
	var adUrl = "https://cast.imp.joins.com/bid/"+secret+"/"+pram; //상용

    $.ajax({
        type: "get"
        , url: adUrl
        , data: ""
        , async : false
        , success: function(result) {
	        var adList = result;
	        if(adList) {
	        	if(adList.error == "none ad") return;
                var adHtml = new StringBuffer();
                var title = "";
                var description = "";

                if(adList.title) {
                    title = adList.title;
                }

                if(adList.description) {
                    description = adList.description;
                }

                adHtml.append('<a href="javascript:fn_adImpressionTrackingClick(\''+adList.click_tracking+'\',\''+adList.click_through+'\');" class="item swiper-slide ad">');
                if(adList.video_file != undefined && adList.video_file != ""){
                	var videoParam   = {};
                	videoParam.imageFile = adList.image_file;
                	videoParam.videoFile = adList.video_file;
                	videoParam.duration = adList.video_meta.duration;
                	videoParam.viewingClass = adList.video_meta.viewing_class;
                	videoParam.startTracking = adList.video_meta.start_tracking;
                	videoParam.completeTracking = adList.video_meta.complete_tracking;
                	adHtml.append('<div class="play" onclick="fn_topBannerAdPlay(this)"; data-value='+JSON.stringify(videoParam)+'>예고편 확인</div>');
                }
                adHtml.append('		<img class="topbannerad" src="" data-src="'+adList.image_file+'" alt="'+adList.title+'" data-impression="'+adList.impression_tracking+'"/>');
                adHtml.append('</a>');

                // 기존배너에 렘덤으로 삽입하여 노출.
                var idx = Math.floor(Math.random() * $(".topBanner .swiper-wrapper").children("a").length);
                $(".topBanner .swiper-wrapper > a:nth-child(" + (idx) + ")").after(adHtml.toString());
	        }
        }
        , error: function(err) {
            console.log('fn_getBannerAd error : ' + err.status);
        }
		, complete: function() {
	        // 2,4,6 광고 배너 고정
	        fn_getTopBannerAd();
		}
    });
}

/**
 * 상단 배너 광고 구좌 조회(2,4,6)
 */
function fn_getTopBannerAd() {
	var header = { "typ": "JWT", "alg": "HS256" };
	var data;
	if(isApp()){
		data = { "device": {"devicetype": 1},  "imp": [{"native": {"ext" : {"slots" : 3}}}], "app": {"name": "megabox"}, "id": "" };
	}else{
		data = { "device": {"devicetype": 1},  "imp": [{"native": {"ext" : {"slots" : 3}}}], "site": {"name": "megabox"}, "id": "" };
	}
	var secret = "";

	// IOS
	if(osTypeWithWeb() == "IOS" && isApp()) {
		secret = "7StfiIrRRD2HwPVvbWEWJQ"; //7StfiIrRRD2HwPVvbWEWJQ
	}
	// AOS
	else if(osTypeWithWeb() == "ANDROID" && isApp()) {
		secret = "JMLebTklRhSR_zLL2afutg"; //JMLebTklRhSR_zLL2afutg
	}
	// Web
	else {
		secret = "9IPsSZpmRya8c9INTOjrng";  //9IPsSZpmRya8c9INTOjrng
	}

	var stringifiedHeader = CryptoJS.enc.Utf8.parse(JSON.stringify(header));
	var encodedHeader = base64url(stringifiedHeader);
	var stringifiedData = CryptoJS.enc.Utf8.parse(JSON.stringify(data));
	var encodedData = base64url(stringifiedData);
	var signature = encodedHeader + "." + encodedData;
	signature = CryptoJS.HmacSHA256(signature, secret);
	signature = base64url(signature);
	var pram = encodedHeader+"."+encodedData+"."+signature;
	var adUrl = "https://cast.imp.joins.com/bid/"+secret+"/"+pram; //상용

    $.ajax({
        type: "get"
        , url: adUrl
        , data: ""
        , async : false
        , success: function(result) {
        	if(result.error == "none ad"){
        		topBannerADwatcher();
        		return;
        	}else{
        		fn_topBannerAdAppend(result);
        	}
        }
        , error: function(err) {
            console.log('fn_getBannerAd error : ' + err.status);
        }
    });
}

function fn_topBannerAdAppend(result) {
	var adList = result;
    if(adList && adList.length > 0) {
        var idx = 0;
        $.each(adList, function(i, item) {
            var adHtml = new StringBuffer();
            var bannerCount = $(".topBanner .swiper-wrapper").children("a").length - 2;
            var title = "";
            var description = "";

            if(item.title) {
                title = item.title;
            }

            if(item.description) {
                description = item.description;
            }

            adHtml.append('<a href="javascript:fn_adImpressionTrackingClick(\''+item.click_tracking+'\',\''+item.click_through+'\');" class="item swiper-slide ad">');
            if(item.video_file != undefined && item.video_file != ""){
            	var videoParam   = {};
            	videoParam.imageFile = item.image_file;
            	videoParam.videoFile = item.video_file;
            	videoParam.duration = item.video_meta.duration;
            	videoParam.viewingClass = item.video_meta.viewing_class;
            	videoParam.startTracking = item.video_meta.start_tracking;
            	videoParam.completeTracking = item.video_meta.complete_tracking;
            	adHtml.append('<div class="play" onclick="fn_topBannerAdPlay(this)"; data-value='+JSON.stringify(videoParam)+'>예고편 확인</div>');
            }
            adHtml.append('		<img class="topbannerad" src="" data-src="'+item.image_file+'" alt="'+item.title+'" data-impression="'+item.impression_tracking+'"/>');
            adHtml.append('</a>');

            if(idx == 0) { idx = 1; }
            else { idx = idx + 2; }

            if(bannerCount < idx) {
                idx = $(".topBanner .swiper-wrapper").children("a").length - 2;
            }

            if($(".topBanner .swiper-wrapper").children("a").length == 1) {
            	 $(".topBanner .swiper-wrapper").prepend(adHtml.toString());
            } else {
                $(".topBanner .swiper-wrapper > a:nth-child(" + (idx) + ")").after(adHtml.toString());
            }

        });

        topBannerADwatcher();
    }
}

//상단배너 광고 노출 트래킹 observer
function topBannerADwatcher() {
    //threshold: 0.6 -> 이미지가 60% 노출 될때 노출 트래킹 전송
    var threshold = 0.6;
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
        	//image 즉시 load
        	if(!entry.target.dataset.loaded) {
        		entry.target.src = entry.target.dataset.src;
        		entry.target.dataset.loaded = true;
        	}
            // 관찰 대상이 viewport 안에 들어온 경우
            if (entry.intersectionRatio > threshold) {
                //send ad
                try {
                    var impression_tracking = entry.target.dataset.impression;
                    if(impression_tracking) {
                        impression_tracking = impression_tracking.replace("http://", "https://");
                        adSender(impression_tracking);  //mobilelayout.js에 있음
                    }
                } catch(e) {
                    console.log("ad sender failed");
                }
            }
        });
    }, {threshold: threshold});
    var bannerElList = document.querySelectorAll('.topbannerad');
    bannerElList.forEach(function (el) {
        io.observe(el);
    });
}

//상단배너 영상 있는경우 AD play
function fn_topBannerAdPlay(param) {
	event.preventDefault();
	var vidoeParam = JSON.parse(param.dataset.value);
	if(isApp()) {
        var data = {
            videoFile: vidoeParam.videoFile
            , duration: vidoeParam.duration
            , viewingClass: vidoeParam.viewingClass
            , startTracking: vidoeParam.startTracking
            , completeTracking: vidoeParam.completeTracking
        };
        AppHandler.Common.adVideoPlay(data);
    } else {
        if(vidoeParam.videoFile == '') return;

        fn_initPlayer(vidoeParam.imageFile, vidoeParam.videoFile, "topBanner-ad", vidoeParam.completeTracking);
        var ti = setTimeout(function() {
            playStart();
            fn_ad_impression_tracking(vidoeParam.startTracking);
            clearTimeout(ti);
        }, 1000);
    }
}

/**
 * 광고 선택
 * @param {string} Tracking URL
 * @param {string} Move URL
 */
function fn_adImpressionTrackingClick(clickTracking, clickThrough){
    adSender(clickTracking);    //AD 클릭 전송
    var data = {
        domain: clickThrough
    };
    AppHandler.Common.link(data);
}

function fn_movieAdAppend(result) {
    var adList = result;
    if(adList && adList.length > 0) {
        var idx = 0;
        $.each(adList, function(i, item) {
            var adHtml = new StringBuffer();
            var movieCount = $("#b_boxo_movie").children("div").length - 1;
            var title = "";
            var description = "";

            if(item.title) {
                title = item.title;
            }

            if(item.description) {
                description = item.description;
            }
            adHtml.append('<div class="item swiper-slide ad">');
            adHtml.append('		<div class="topArea">');
            adHtml.append('			<a href="javascript:fn_adImpressionTrackingClick(\''+item.click_tracking+'\',\''+item.click_through+'\');" class="posterBox imgArea">');
            adHtml.append('				<div class="img"><img class="boxoad" id="adxthree_'+(i)+'" src="" data-src="'+item.image_file+'" alt="'+item.title+'" onerror="moNoImg(this)" data-impression="'+item.impression_tracking+'"></div>');
            adHtml.append('			</a>');
            adHtml.append('		</div>');
            adHtml.append('		<div class="botArea">');
            adHtml.append('			<div class="title">'+title+'</div>');
            adHtml.append('			<div class="text">'+description+'</div>');
            adHtml.append('		</div>');
            adHtml.append('</div>');

            if(idx == 0) { idx = 3; }
            else { idx = idx + 2; }

            if(movieCount < idx) {
                idx = $("#b_boxo_movie").children("div").length - 1;
            }

            //영화가 목록이 없는 경우
            if($("#b_boxo_movie").children("div").length == 1) {
                $("#b_boxo_movie").prepend(adHtml.toString());
            } else {
                $("#b_boxo_movie > div:nth-child(" + (idx) + ")").after(adHtml.toString());
            }
        });

        //전체 길이계산 삭제
        // $("#boxo_movie").css("width", $("#boxo_movie").width() + (adList.length * 162) + 156);
        boxoADwatcher();
    }
}

//박스오피스 광고 노출 트래킹 observer
function boxoADwatcher() {
    //threshold: 0.6 -> 이미지가 60% 노출 될때 노출 트래킹 전송
    var threshold = 0.6;
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            // 관찰 대상이 viewport 안에 들어온 경우
            if (entry.intersectionRatio > threshold) {
                //image load
                if(!entry.target.dataset.loaded) {
                    entry.target.src = entry.target.dataset.src;
                    entry.target.dataset.loaded = true;
                }

                //send ad
                try {
                    var impression_tracking = entry.target.dataset.impression;
                    if(impression_tracking) {
                        impression_tracking = impression_tracking.replace("http://", "https://");
                        adSender(impression_tracking);  //mobilelayout.js에 있음
                    }
                } catch(e) {
                    console.log("ad sender failed");
                }
            }
        });
    }, {threshold: threshold});
    var boxElList = document.querySelectorAll('.boxoad');
    boxElList.forEach(function (el) {
        io.observe(el);
    });
}

//핫클립 노출 트래킹 observer
function hotClipADwatcher() {
	//threshold: 0.6 -> 이미지가 60% 노출 될때 노출 트래킹 전송
	var threshold = 0.6;
	var io = new IntersectionObserver(function (entries) {
		entries.forEach(function (entry) {
			// 관찰 대상이 viewport 안에 들어온 경우
			if (entry.intersectionRatio > threshold) {
				//image load
				if(!entry.target.dataset.loaded) {
					entry.target.src = entry.target.dataset.src;
					entry.target.dataset.loaded = true;
				}

				//send ad
				try {
					var impression_tracking = entry.target.dataset.impression;
					if(impression_tracking) {
						impression_tracking = impression_tracking.replace("http://", "https://");
						adSender(impression_tracking);  //mobilelayout.js에 있음
					}
				} catch(e) {
					console.log("ad sender failed");
				}
			}
		});
	}, {threshold: threshold});
	var hotClipElList = document.querySelectorAll('.hotClip');
	hotClipElList.forEach(function (el) {
		io.observe(el);
	});
}

//핫클립 AD
function fn_adMovie() {
    var header ={"typ": "JWT","alg": "HS256"}
    var data;

    if(isApp()){
        data = {
            "device": {"devicetype": 1},
            "imp": [{"native": {"ext" : {"slots" : 1}}}],
            "app": {"name": "megabox"},
            "id": ""
        };
    }else{
        data = {
            "device": {"devicetype": 1},
            "imp": [{"native": {"ext" : {"slots" : 1}}}],
            "site": {"name": "megabox"},
            "id": ""
        };
    }

    var secret = "";

    // IOS
    if(isApp() && osTypeWithWeb() == "IOS") {
        secret = "wRUnG164RCy76yc0bHvyeA";
    }
    // AOS
    else if(isApp() && osTypeWithWeb() == "ANDROID") {
        secret = "_ry_e66sTQyu5xCC_m8sTA";
    }
    // WEB
    else {
        secret = "WP62T-r7QdCnBzSGDStrLw";
    }

    var stringifiedHeader = CryptoJS.enc.Utf8.parse(JSON.stringify(header));
    var encodedHeader = base64url(stringifiedHeader);
    var stringifiedData = CryptoJS.enc.Utf8.parse(JSON.stringify(data));
    var encodedData = base64url(stringifiedData);
    var signature = encodedHeader + "." + encodedData;
    signature = CryptoJS.HmacSHA256(signature, secret);
    signature = base64url(signature);

    var pram = encodedHeader+"."+encodedData+"."+signature;
    var url = "https://cast.imp.joins.com/bid/"+secret+"/"+pram;

    $.ajax({
        type: "get"
        , url: url
        , data: ""
        , success: function(value) {
            try {
                if (value.error == "none ad") {
                    $(".top-clip").addClass("display-none");
                    return;
                } else {
                    $(".top-clip").removeClass("display-none");
                }

                //player init
                if(!isApp()) {
                    $("#video_file").val(value.video_file);
                    $("#video_image").val(value.image_file);
                }

                var movieUrl = value.click_through;
                var movieCode = '';
                if(movieUrl) {
                    var movieUrlArray = movieUrl.split("=");
                    if(movieUrlArray.length >= 2) {
                        movieCode = movieUrlArray[1];
                    }
                }

                var hotClipHtml = new StringBuffer();

                hotClipHtml.append('<div class="item swiper-slide ad col3">');
                hotClipHtml.append('		<div class="topArea" onclick="fn_hotClipAdPlay();">');
                hotClipHtml.append('			<a href="javascript:fn_hotclipTracking(\''+movieCode+'\');" class="posterBox imgArea">');
                hotClipHtml.append('				<div class="playBtn">재생</div>');
                hotClipHtml.append('				<div class="img">');
                if(value.image_file){
                	hotClipHtml.append('			<img class="lozad hotClip" data-clickTracking="' + value.click_tracking + '" src="' + value.image_file + '" data-impression="' + value.impression_tracking + '" onerror="moNoImg(this)" data-loaded="true">');
                }else{
                	hotClipHtml.append('			<img class="lozad" src="' + m_imgSvrUrl + '/static/mb/images/common/bg/bg-noimage.png" onerror="moNoImg(this)">');
                }
                hotClipHtml.append('				</div>');
                hotClipHtml.append('			</a>');
                hotClipHtml.append('		</div>');
                hotClipHtml.append('		<div class="botArea">');
                hotClipHtml.append('			<button class="btn2" onclick="fn_goQuickBooking(\''+movieCode+'\');">바로예매</button>');
                hotClipHtml.append('			<div class="title">'+ value.title +'</div>');
                hotClipHtml.append('			<div class="text">'+ value.description +'</div>');
                hotClipHtml.append('		</div>');
                hotClipHtml.append('</div>');

                $("#b_boxo_movie > div:nth-child(2)").after(hotClipHtml.toString());

                $("#start_tracking").val(value.video_meta.start_tracking.replace('http://', 'https://'));
                $("#complete_tracking").val(value.video_meta.complete_tracking.replace('http://', 'https://'));
                $("#click_through").val(value.click_through);
                $("#click_tracking").val(value.click_tracking);
                $("#impression_tracking").val(value.impression_tracking);
                $("#video_file").val(value.video_file);
                $("#duration").val(value.video_meta.duration);
                $("#viewing_class").val(value.video_meta.viewing_class);

                gfn_lozadStart('lozad');
                hotClipADwatcher();
            } catch(e) {
                console.log(e);
            }
        }
        , error: function(err) {
            console.log('fn_adMovie error : ' + err.status);
        }
    });
}

//핫클립 AD play
function fn_hotClipAdPlay() {
    if(isApp()) {
        var data = {
            videoFile: $("#video_file").val()
            , duration: $("#duration").val()
            , viewingClass: $("#viewing_class").val()
            , startTracking: $("#start_tracking").val()
            , completeTracking: $("#complete_tracking").val()
        };
        AppHandler.Common.adVideoPlay(data);
    } else {
        if($("#video_file").val() == '') return;

        fn_initPlayer($("#video_image").val(), $("#video_file").val(), "hotclip-ad");
        var ti = setTimeout(function() {
            playStart();
            fn_ad_impression_tracking($("#start_tracking").val());
            clearTimeout(ti);
        }, 1000);
    }
}

function fn_hotclipTracking(rpstMovieNo) {
    var click_tracking = $(".hotClip").data("clicktracking");
    adSender(click_tracking);
}

//핫클립 play (AD Hotclip 아님)
//메인 핫클립은 서버에서 mvod로 치환되어 내려옴.
function fn_hotclipPlay(imgUrl, videoUrl) {
    if (isApp()) {
        videoUrl = String(videoUrl).replace("mvod", "m.mvod");
    }

    var data = {
        videoFile: videoUrl
        , duration: 0
    };
    AppHandler.Common.videoPlay(data);
}

function playStart() {
    $("#videoDiv").removeClass("display-none");

    if(osType() == "IOS") {
        $("#videoContent").jPlayer("play", 0);
    } else {
        $("#videoContent").jPlayer("fullScreen", 0);
        $("#videoContent").jPlayer("play", 0);
    }

    //메인화면 display-none
    $(".container").addClass("display-none");
    $("#headerSub").addClass("display-none");
    $("#footer").addClass("display-none");
    $(".bnb-main").addClass("display-none");
}

//video close
function fn_videoClose() {
    if(osType() == "IOS") {
        $("#videoContent").jPlayer("stop", 0);
    } else {
        $("#videoContent").jPlayer("restoreScreen", 0);
        $("#videoContent").jPlayer("stop", 0);
    }

    $("#videoDiv").addClass("display-none");

    $(".container").removeClass("display-none");
    $("#headerSub").removeClass("display-none");
    $("#footer").removeClass("display-none");
    $(".bnb-main").removeClass("display-none");
}

function fn_ad_time_pad(n, width) {
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}

var resize_status_full_screen = false;
function fn_initPlayer(image_file, video_file, kind ,completeTracking) {
    $jplayer = $("#videoContent");

    $jplayer.jPlayer({
        ready: function () {
            $(this).jPlayer("setMedia", {
                title: "megabox",
                m4v: video_file,
                poster: image_file
            });
        }
        , swfPath: "/static/mb/js/jplayer"
        , supplied: "m4v"
        , useStateClassSkin: true
        , smoothPlayBar: true
        , size: {width:"100%",height:"100%"}
        , fullSize:{width:"100%",height:"100%",cssClass:"jp-video-full"}
        , timeupdate: function(event) {
            if($jplayer.data().jPlayer.status.paused){
                console.log('paused');
            } else {
                var seconds = event.jPlayer.status.currentTime;
                var min = parseInt((seconds%3600)/60);
                var sec = seconds%60;
                $("#ad_move_data12").html(fn_ad_time_pad(min,2)+":"+fn_ad_time_pad(Math.round(sec),2));
            }
        }
        ,loadeddata: function(event){
            var seconds = event.jPlayer.status.duration;
            var min = parseInt((seconds%3600)/60);
            var sec = seconds%60;
            $("#ad_move_data21").html(fn_ad_time_pad(min,2)+":"+fn_ad_time_pad(Math.round(sec),2));

            var html = '<div class="gnb3" id="videoContentTop" onclick="fn_videoClose();">';
            html += '<div class="ad_top_icon">닫기</div>';
            html += '</div>';
            html += '<div class="ad_move_popup_footer" id="videoContentFooter">';
            //html += '<div class="ad_m_time1" id="ad_move_data11">00:00</div>';
            html += '<div class="ad_m_time2 display-none" id="ad_move_data12"></div>';
            html += '<div class="ad_bl_block">';
            html += '<h2 class="ad_movie_name" id="ad_title1"></h2>';
            html += '<p class="ad_bt_text" id="ad_description1"></p>';
            html += '</div>';
            html += '</div>';
            $jplayer.append(html);
        }
        , pause: function(){
            fn_videoClose();
            $("#videoContent").jPlayer("restoreScreen", 0);
            $("#videoContent").jPlayer("stop", 0);
            if(kind == 'topBanner-ad'){
            	fn_ad_impression_tracking(completeTracking);
            }else{
            	fn_ad_impression_tracking($("#complete_tracking").val());
            }
        }
        , ended: function(){
            fn_videoClose();
            $("#videoContent").jPlayer("restoreScreen", 0);
            $("#videoContent").jPlayer("stop", 0);

        }, resize: function(){
            if(resize_status_full_screen){
                resize_status_full_screen = false;
            } else {
                resize_status_full_screen = true;
            }

            if(!resize_status_full_screen){
                fn_videoClose();
                $("#videoContent").jPlayer("restoreScreen", 0);
                $("#videoContent").jPlayer("stop", 0);
            }
        }
    });
}

//광고 트레킹 보내기
function fn_ad_impression_tracking(url){
    $.ajax({
        type: "get"
        , url: url
        , data: null
        , dataType: "json"
        , success: function(value) {
            console.log('fn_ad_impression_tracking success value > ' + value);
        }
        , error: function(err) {
            console.log('fn_ad_impression_tracking error : ' + err.status);
        }
    });
}

//이벤트 탭 클릭
function goNaviEvent(data) {
	if (isApp()){
		var version = parseInt(data.version.replace(/\./gi, ""));
		AppHandler.Common.goEvent('', version);
	}else{
		AppHandler.Common.goEvent('', '');
	}

}

// 앱버전 체크
function fn_appVersion() {
	if (isApp()){
		var data = {
				callback: "goNaviEvent"
		};
		AppHandler.Common.appCurrentVersion(data);
	}else{
		goNaviEvent();
	}
}

//본영화등록
function fn_goMovieStory() {
    if(controlAction.isExec()) return; controlAction.on();

    $.ajax({
        url    : "/on/oh/ohg/MbLogin/selectLoginSession.do",
        type: "POST",
        contentType: "application/json;charset=UTF-8",
        success: function(result){
            var loginAt = result.resultMap.result;
            var nonMbLogin = result.resultMap.nonMbLogin;

            //var
            if(loginAt  == "N" || nonMbLogin == "Y"){
                var dataObj = {
                    message: '로그인이 필요한 서비스 입니다.\n로그인 하시겠습니까?',
                    okText: '확인',
                    okFunc: 'AppDomain.Member.login("","AppDomain.MyMegabox.watchedMovieReg")',
                    cancelText: '취소',
                    cancelFunc: '',
                    cancelData: ''
                };
                AppHandler.Common.confirm(dataObj);
                controlAction.off();
            } else {
                controlAction.off();
                AppDomain.MyMegabox.watchedMovieReg();
            }
        }
    });
}

function fn_callbackLoginConfirm() {
    AppDomain.Member.login(AppDomain.Flag.isDefault);
}

var clickedMovieFeed = undefined; // 앱 콜백함수로 데이터를 전달하기 위한 전역 변수
function fn_mvMovieFeedDetailAppCurrentVersionCallback(data) {
    var movieFeedNo = $(clickedMovieFeed).data('no');
    var movieFeedTitle = $(clickedMovieFeed).data('title');

    var version = parseInt(data.version.replace(/\./gi, ""));
    if (version >= 411) {
        AppDomain.MovieFeed.detail(movieFeedNo);
    } else {
        AppDomain.MovieFeed.detailForOldVersion(movieFeedNo);
    }
}

// 로그인 여부 확인
var loginChk = _.throttle(function () {
    return new Promise(function (resolve, reject) {
        $.ajaxMegaBox({
            url: "/on/oh/ohg/MbLogin/selectLoginSession.do",
            success: function (result) {
                var loginAt = result.resultMap.result;
                var nonMbLogin = result.resultMap.nonMbLogin;

                if (loginAt != "Y" || nonMbLogin == "Y") {
                    var dataObj = {
                        message: '로그인이 필요한 서비스 입니다.\n로그인 하시겠습니까?',
                        okText: '확인',
                        okFunc: 'fn_callbackLoginConfirm',
                        cancelText: '취소'
                    };
                    AppHandler.Common.confirm(dataObj);
                } else {
                    resolve();
                }
            },
            error: function (xhr, status, error) {
                reject(error);
            }
        });
    });
}, 1000);