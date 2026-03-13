var appHeaders = {};
var arrLayer = {};
var noneClass = 'display-none';
var nTopBtnHigth = 150;

$(document).ready(function() {
    var path = location.pathname;

    // 스크롤 탑 버튼
    if (path.indexOf('/movie/boxoffice') == 0 			 ||   // 영화목록 (박스오피스)
        path.indexOf('/movie/comingsoon') == 0 		 ||  // 영화목록 (상영예정작)
        path.indexOf('/movie/curation') == 0 		 ||  // 영화목록 (큐레이션)
        path.indexOf('/movie/festival') == 0 		 ||  // 영화목록 (영화제)
        path.indexOf('/movie-detail') == 0 	 		 ||  // 영화상세
        path.indexOf('/moviepost/all') == 0 		 ||  // 무비프스트 목록
        path.indexOf('/moviepost/detail') == 0  	 ||  // 무비프스트 상세
        path.indexOf('/mypage/moviestory') == 0 	 ||  // 나의 무비스토리
        path.indexOf('/mypage/bookinglist') == 0	 || // 예매/구매 내역
        path.indexOf('/event') == 0 	  	 	 	 ||  // 이벤트 메인, 이벤트 상세, 당첨자발표 상세(나의응모내역)
        path.indexOf('/benefit/discount/guide') == 0 || //할인카드안내
        path == '/mypage/myevent'						//나의 이벤트응모내역 목록
    ) {

        if (path.indexOf('/event/detail') == 0) {
            $('#btnScrollTop').addClass('event-detail-top');
        }



        $(window).scroll(function() {
            if($(window).scrollTop() >= nTopBtnHigth) {
                $('#btnScrollTop').show();
            }
            else {
                $('#btnScrollTop').hide();
            }
        });
    }

    // 안드로이드 키보드 화면 커버 타입
    if (path.indexOf('/on/oh/ohh/PersonInfoMng/personMbJoinI.do') == 0 ||             // 본인인증
        path.indexOf('/on/oh/ohg/MbJoin/viewMbJoinProttrAgreePage.rest') == 0 ||  // 보호자동의
        path.indexOf('/member-check') == 0 ||                                     // 본인인증
        path.indexOf('/moviepost/detail') == 0 ||       // 무비포스트 상세
        path.indexOf('/moviepost/writePost') == 0 ||    // 무비포스트 작성/수정
        path.indexOf('/mypage/manage-myinfo') == 0 ||   // 내 정보 관리
        path.indexOf('/mypage/point-list') == 0 ||      // 멤버십 포인트 내역
        path.indexOf('/user-find') == 0 ||              // ID/PW찾기
        path.indexOf('/join') == 0 ||                   // 회원가입
        path.indexOf('/support/') == 0 ||           // 분실물문의
        path.indexOf('/store/gift') == 0 ||             // 스토어 선물하기
        path.indexOf('/customerQaCdList') == 0 ||        // 1:1문의
        path.indexOf('/on/oh/ohb/MobileTicket/internetPass') == 0 || // 전자출입명부
        path.indexOf('/non-member/nmbrinquiry') == 0 || //비회원 문의내역
        path.indexOf('/on/oh/ohz/PayRechg/GiftRechgPV.do') == 0 || //선불카드 충전
        path.indexOf('/giftCard/autorechg') == 0 || //선불카드 자동충전
        path.indexOf('/mypage/myGiftCard') == 0 ||// 나의 기프트카드
        path.indexOf('/store/payment') == 0 // 선불카드 구매
    ) {
        AppHandler.Common.keyboardCovered(false);
    }
});

//공통 광고링크
function commonAdClick() {
    var clickThrough = $("#pageBannerImage").data("clickthrough");
    var clickTracking = $("#pageBannerImage").data("clicktracking");

    if(clickTracking) {
        adSender(clickTracking);
    }
    if(clickThrough) {
        fn_goAdLink(clickThrough);
    }
}

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

    if(controlAction.isExec()) return; //중복클릭방지
    controlAction.on();

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
    controlAction.off();
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
    clNm = (!clNm) ? '.lozad' : '.'+clNm;
    lozad(clNm , {
        threshold: 0,
        load:function(el){
            el.src = el.dataset.src;
            el.onload = function(){
                try {
                    var classList = el.classList.toString();
                    if(classList.indexOf("ad-img") > 0) {
                        var impression_tracking = el.dataset.impression;
                        if(impression_tracking) {
                            impression_tracking = impression_tracking.replace("http://", "https://");
                            adSender(impression_tracking);
                        }
                    }
                } catch(e) {
                    console.log("ad sender failed");
                }
            };
        }
    }).observe();
}

function gfn_lozadStartWithCallback(clNm, callback) {
    clNm = (!clNm) ? '.lozad' : '.' + clNm;
    lozad(clNm, {
        threshold: 0,
        load: function (el) {
            el.src = el.dataset.src;
            el.onload = function () {
                try {
                    var classList = el.classList.toString();
                    if (classList.indexOf("ad-img") > 0) {
                        var impression_tracking = el.dataset.impression;
                        if (impression_tracking) {
                            impression_tracking = impression_tracking.replace("http://", "https://");
                            adSender(impression_tracking);
                        }
                    }
                } catch (e) {
                    console.log("ad sender failed");
                }

                try {
                    callback();
                } catch (e) {
                    console.log("callback function call failed")
                }
            };
        }
    }).observe();
}

//click_tracking or impression_tracking url
function adSender(trackUrl) {
    trackUrl = trackUrl.replace("http://", "https://");
    $.ajax({
        type: "get"
        , url: trackUrl
        , data: null
        , dataType: "json"
        , success: function(value) {
            //console.log('adSender success value');
        }
        , error: function(err) {
            //console.log('adSender error');
        }
    });
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
            .replace(/&#35;/gi,"#")
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
 * 상영 등급 CSS Class 조회
 * @param {string} 상영 등급 코드
 * @param {string} 구분자 [medium:기본 사이즈 보다 한단계 큼]
 * @return {string} 상영 등급 CSS Class
 */
function gfn_getNewPlayClassCssClass(playClassCd, flag) {
// admisClassCd (상영 등급 코드) => [AD01:전체관람가], [AD02:12세이상관람가], [AD03:15세이상관람가], [AD04:청소년관람불가]
// class => [AD01:ico-pg-all], [AD02:ico-pg-12], [AD03:ico-pg-15], [AD04:ico-pg-20]

	var returnValue = '';

	var divFlag = (flag != undefined && flag != '' ? flag + '-' : '');

	if(playClassCd == 'AD01') {
		returnValue = 'i_all_w20';
	}else if(playClassCd == 'AD02') {
		returnValue = 'i_12_w20';
	}else if(playClassCd == 'AD03') {
		returnValue = 'i_15_w20';
	}else if(playClassCd == 'AD04') {
		returnValue = 'i_19_w20';
	}else {
		returnValue = 'i_no_w20';
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
	if(Number(str) > 0){
		return new String(str).replace(/(\d)(?=(?:\d{3})+(?!\d))/g, '$1,');
	}else{
		return 0;
	}
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
            $rnb.removeClass('display-none');
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
    $(this).val($(this).val().replace(/[^ㄱ-힣a-zA-Z-\u318D\u119E\u11A2\u2022\u2025a\u00B7\uFE55]/gi, ''));
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

String.prototype.toNumber = function(){
    return this.replace(/[^0-9]/gi, '');
};
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
    $(this).val(formatNum);
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
function moNoImg(obj,page){
    obj.src="https://img.megabox.co.kr/static/mb/images/common/bg/bg-noimage.png";
    if(page == 'mBanner'){
    	obj.style="height:150px;";
    }
}

/**
 * 기프트 카드이미지 없을경우 대체 이미지로 교체
 * @param obj img태그 element
 * @returns
 */
function giftCardNoImg(obj){
	obj.src="https://img.megabox.co.kr/static/mb/images/giftCard/@sampleCard.png";
}

/* 사용가능극장
@param
cmbndKindNo : 통합권번호
el : 페이지 로딩할 태그 id
cmbndNo : 통합권 번호 (판매등록 사용지점 조회용)
*/
function gfn_useBrchList(cmbndKindNo, el, cmbndNo){
    var paramData = {
        cmbndKindNo : cmbndKindNo,
        cancelElement : el,
        cmbndNo : cmbndNo
    };
    if(!isApp()){
        $.ajax({
            url: '/on/oh/ohd/StoreDtl/selectStoreMobileBrchList.do',
            type: "POST",
            async: false,
            contentType: "application/json;charset=UTF-8",
            data: JSON.stringify(paramData),
            success: function (data, status, xhr) {
                $("#"+el).html(data);
                $("#"+el).css("top","0px").removeClass("display-none").addClass("fade");
            },
            error: function(xhr, status, error){
                var oData = { message: error };
                AppHandler.Common.alert(oData);
            },
            complete: function(){
                $("body").addClass("no-scroll");
                theaterSelect();
            }
        });
    }else{
        AppDomain.Store.storeUseItemBrch(cmbndKindNo, cmbndNo);
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
            APP_DEVICE_ID: XSSCheck(app_header_form.APP_DEVICE_ID.value,0),
            APP_DEVICE_TYPE: XSSCheck(app_header_form.APP_DEVICE_TYPE.value,0),
            APP_DEVICE_BRAND: XSSCheck(app_header_form.APP_DEVICE_BRAND.value,0),
            APP_DEVICE_MODEL: XSSCheck(app_header_form.APP_DEVICE_MODEL.value,0),
            APP_VERSION: XSSCheck(app_header_form.APP_VERSION.value,0),
            APP_OS_VERSION: XSSCheck(app_header_form.APP_OS_VERSION.value,0),
            APP_PUSH_TOKEN: XSSCheck(app_header_form.APP_PUSH_TOKEN.value,0),
            APP_AUTO_LOGIN: XSSCheck(app_header_form.APP_AUTO_LOGIN.value,0),
            ACCESS_TYPE: XSSCheck(app_header_form.ACCESS_TYPE.value,0)
        };
    }
    else {
        return {};
    }
}

// XSS 필터
function XSSCheck(str, level) {

	if (level == undefined || level == 0) {

		str = str.replace(/\<|\>|\"|\'|\%|\;|\(|\)|\&|\+|\-/g,"");

	} else if (level != undefined && level == 1) {

		str = str.replace(/\</g, "&lt;");
		str = str.replace(/\>/g, "&gt;");

	}

	return str;
}


//이전 화면 메인, 로그인 체크 후 메인으로 이동. 아니면, history back
function gfn_BackByReferre(idx) {
    if(document.referrer) {
        var lastSplit = document.referrer.lastIndexOf("/");
        if(document.referrer.indexOf("main") > -1
            || document.referrer.indexOf("login") > -1
            || document.referrer.indexOf("login") > -1
            || document.referrer.indexOf("privatebooking") > -1
            || document.referrer.indexOf("booking") > -1
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
        } else if(document.referrer.indexOf("discount") > -1) {
            AppHandler.Common.goMain();
        } else{
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
    var array = new Uint16Array(1);
    window.crypto.getRandomValues(array);
    return array[0].toString();
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

    var $this   = $('#'+id);
    var $topBtn = $this.find('.top-btn');

    $this.find("header").removeClass("no-fix");
    $('body').css({'pointer-events': 'visible'});

    if ($topBtn.length > 0) {
        $this.on('scroll', function(){
            if ($(this).scrollTop() >= nTopBtnHigth) {
                $topBtn.removeClass('display-none');
            } else {
                $topBtn.addClass('display-none');
            }
        });
    }
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
            $("body").removeClass("no-scroll");
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

        if (!isApp() && type !== "cont") {
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

        if (info.openerAction != "" && (type == "end" || type === "cont")) {
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

    // 중복클릭해제
    controlAction.off();
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
        layerTopBtnAt        : 'N',
        openerId             : '',
        openerAction         : '',
        openerOption         : null,
        closeHeaderData      : '',
        closeMsgType         : '',
        closeMsg             : '',
        openerMetaTag        : saveCurrentMeta(),
        topZeroAt            : 'N'
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

                if (option.openerOption != null && option.openerOption.changeFunNmAt == 'Y') {
                    option.openerAction = option.openerAction.replace('fn_', ' fn_'+option.openerId+'_');
                }

                if (option.isMakeId) {
                    if(option.topZeroAt == 'Y') {
                        $div = $('<div class="display-none container store-popup" style="top: 0px;">');
                    } else {
                        $div = $('<div class="display-none container store-popup">');
                    }
                    if (isApp()) {
                        addCss = 'pt0';
                    }
                    if (option.layerGrayAt == 'Y') {
                        $div.addClass('gray');
                    }
                    $div.addClass(addCss);
                    $div.attr({'id' : option.makeId, 'z-index' : gfn_maxZindex()});
                    $div.css({'z-index' : gfn_maxZindex()})
                    $div.append(arrHeader).append(data);
                    $('body').append($div);
                } else {
                    $div = $('#'+option.makeId);
                    $div.html(data);
                    $div.find('.btn-close').attr('onclick', 'gfn_selLayerCls(\'last\');');
                    if (option.bodyScrollLockAt == 'Y') {
                        $('body').css({'pointer-events': 'visible'});
                    }
                    if ($div.find('.layer-dimmed').length != 0) {
                        $div.parents('.container:first').addClass('pt0');
                    }
                }

                // 탑버튼 노출 변경 - 스크롤 이벤트는 애니메이션 종료후 설정됨
                if (option.layerTopBtnAt == 'Y') {
                    var $topBtn = $('<div class="top-btn display-none">');
                    $topBtn.attr('z-index', gfn_maxZindex()).html('<a href="javascript:void(0);"><i class="iconset ico-top-arrow"></i></a>');
                    $div.append($topBtn);

                    // 탑버튼 이벤트
                    $topBtn.click(function() {
                        $div.scrollTop(0);
                    });
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
        contentsWrap.find('.ico-p-close, button.gray, div.btnClose').off().click(function(e){
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

        var case1 = /^[0-9a-zA-Z]+$/; // 숫자+영문
        var case2 = /^[0-9\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]+$/; // 숫자+특수
        var case3 = /^[a-zA-Z\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]+$/; // 영문+특수
        var case4 = /^[0-9a-zA-Z\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]+$/; // 숫자+영문+특수

        if (case1.test(pwd) || case2.test(pwd) || case3.test(pwd) || case4.test(pwd)) {
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

    if (event == 8) {
        $this.val('').focus();
        lengChk = true;
    };

    $button.attr("disabled", lengChk);

    return charMask;
}

function gfn_waitProcess($this, second){
    $this.attr("disabled", true);
    setTimeout(function(){
        $this.attr("disabled", false);
    }, second * 1000);
}

//카드넘버 마스킹 처리
var cardNumber = function() {
	var target = "";	// init once in watcher
	var masked = '';
	var unmaskcardnumber = '';
	var maskcardnumber = "";

	function doMasking (){
		// 유효값 확인 (숫자, 마스킹, 공백)
		var _val_valid = $(target).val().replace(/[^0-9^•^\s]/g,'').replace(/\s/gi,'').substr(0);

		// previous 1234 1234 •••• 1234 masked 1234 now 12341234•3•1234
		// 위와 같이 마스킹 된 앞부분 또는 중간을 삭제하면 오류가 발생, 뒤로 변경되면 OK
		// console.log('previous', maskcardnumber, 'masked', masked, 'now', _val_valid);

		// 값 unmask
		var mask_len = _val_valid.replace(/[^•]/g,'').length;
		masked = masked.substr(0,mask_len);
		_val_valid = _val_valid.replace(/(•)+/,masked).replace(/[•]/g,'')

		// 값 mask
		var nums = [_val_valid.substr(0,8),_val_valid.substr(8,4),_val_valid.substr(12)];
		if(nums[1].length>0){
			// SAVE masked value
			masked = nums[1];
		}
		unmaskcardnumber = nums.join("");

		// 화면 출력값 설정
		$(target).val(function (index, value) {
			var n0 = [nums[0], masked.split('').map(function(x){return x?'•':''}).join(""), nums[2]].join("");
			maskcardnumber = [n0.substr(0,4),n0.substr(4,4),n0.substr(8,4),n0.substr(12)].join(" ").trim();
			return maskcardnumber;
		});
	}

	// 입력 받은 값을 보여준다
	this.show = function(){
		var n0 = unmaskcardnumber;
		$(target).val([n0.substr(0,4),n0.substr(4,4),n0.substr(8,4),n0.substr(12)].join(" ").trim());
	}

	// 입력 받은 값을 감춘다
	this.hide = function(){
		var n0 = unmaskcardnumber;
		$(target).val([n0.substr(0,4),n0.substr(4,4),n0.substr(8,4).split('').map(function(x){return x?'•':''}).join(""),n0.substr(12)].join(" ").trim());
	}

	// 입력받은 숫자 반환
	this.getUnmaskNumber = function() {
		return unmaskcardnumber;
	};

	// 입력받은 숫자 설정
	this.setUnmaskNumber = function(_unmaskcardnumber) {
		unmaskcardnumber = _unmaskcardnumber;
	};

	// 이벤트 감시 등록
	this.watcher = function (_target) {

		// 대상 설정
		target = _target;

		// 붙여 넣기
		$(target).on('paste', function (event) {
			// 마스킹을 수행한다
			//doMasking();
            if($(target).val() == ''){
                setTimeout(function(){
                    doMasking();
                }, 100);
            } else {
                // 마스킹을 수행한다
                doMasking();
            }
		});

		// 숫자키만 허용하기
		$(target).on('keypress', function(event){
			if(event.keyCode>=48 && event.keyCode<=57){
				return true;
			}
			return false;
		});

		// keyup : 키를 눌렀다가 띄는 순간 이벤트가 trigger 됨에 유의
		$(target).on('keyup', function(event){
			// 입력값 초기화 - 8 : backspace / 127 : f16 (기존에 있어서 유지)
			if (event.keyCode === 8 || event.keyCode === 127) {
				masked = "";
				unmaskcardnumber = "";
				$(target).val('');
			}
			// 마스킹을 수행
			doMasking();
		});
	};
    this.doMasking = function(_target) {
        let target = _target;
        doMasking();
    };
};

//cvc넘버 마스킹 처리
var cvcNumber = function() {
    var target = "";	// init once in watcher
    var masked = '';
    var unmaskcardnumber = '';
    var maskcardnumber = "";

    //cvc masking
    function doMasking (){
        // 유효값 확인 (숫자, 마스킹, 공백)
        var _val_valid = $(target).val().replace(/[^0-9^•^\s]/g,'').replace(/\s/gi,'').substr(0);

        // previous 1234 1234 •••• 1234 masked 1234 now 12341234•3•1234
        // 위와 같이 마스킹 된 앞부분 또는 중간을 삭제하면 오류가 발생, 뒤로 변경되면 OK
        // console.log('previous', maskcardnumber, 'masked', masked, 'now', _val_valid);

        // 값 unmask
        var mask_len = _val_valid.replace(/[^•]/g,'').length;
        masked = masked.substr(0,mask_len);
        _val_valid = _val_valid.replace(/(•)+/,masked).replace(/[•]/g,'')

        // 값 mask
        var nums = [_val_valid.substr(0,4),_val_valid.substr(4,3)];
        if(nums[1].length>0){
            // SAVE masked value
            masked = nums[1];
        }
        unmaskcardnumber = nums.join("");

        // 화면 출력값 설정
        $(target).val(function (index, value) {
            var n0 = [nums[0], masked.split('').map(function(x){return x?'•':''}).join("")].join("");
            maskcardnumber = [n0.substr(0,4),n0.substr(4,3)].join(" ").trim();
            return maskcardnumber;
        });
    }

    // 입력 받은 값을 보여준다
    this.show = function(){
        var n0 = unmaskcardnumber;
        $(target).val([n0.substr(0,4),n0.substr(4,4),n0.substr(8,4),n0.substr(12)].join(" ").trim());
    }

    // 입력 받은 값을 감춘다
    this.hide = function(){
        var n0 = unmaskcardnumber;
        $(target).val([n0.substr(0,4),n0.substr(4,4),n0.substr(8,4).split('').map(function(x){return x?'•':''}).join(""),n0.substr(12)].join(" ").trim());
    }

    // 입력받은 숫자 반환
    this.getUnmaskNumber = function() {
        return unmaskcardnumber;
    };

    // 입력받은 숫자 설정
    this.setUnmaskNumber = function(_unmaskcardnumber) {
        unmaskcardnumber = _unmaskcardnumber;
    };

    // 이벤트 감시 등록
    this.watcher = function (_target) {

        // 대상 설정
        target = _target;

        // 붙여 넣기
        $(target).on('paste', function (event) {
            // 마스킹을 수행한다
            //doMasking();
            if($(target).val() == ''){
                setTimeout(function(){
                    doMasking();
                }, 100);
            } else {
                // 마스킹을 수행한다
                doMasking();
            }
        });

        // 숫자키만 허용하기
        $(target).on('keypress', function(event){
            if(event.keyCode>=48 && event.keyCode<=57){
                return true;
            }
            return false;
        });

        // keyup : 키를 눌렀다가 띄는 순간 이벤트가 trigger 됨에 유의
        $(target).on('keyup', function(event){
            // 입력값 초기화 - 8 : backspace / 127 : f16 (기존에 있어서 유지)
            if (event.keyCode === 8 || event.keyCode === 127) {
                masked = "";
                unmaskcardnumber = "";
                $(target).val('');
            }
            // 마스킹을 수행
            doMasking();
        });
    };
    this.doMasking = function(_target) {
        let target = _target;
        doMasking();
    };
};

function fn_goAdLink(url) {
    if(url) {
        if (isApp()) {
            AppHandler.Common.link({ domain: url });
        }
        else {
            if(url.indexOf("megabox.co.kr") > -1) {
                location.href = url;
            } else {
                window.open(url, '_blank', '');
            }
        }
    }
}


//공통배너광고
function gfn_getBannerAd(bannerType) {
    var header = { "typ": "JWT", "alg": "HS256" };
    var data;
    if(isApp()){
    	data = { "device": {"devicetype": 1},  "imp": [{"native": {"ext" : {"slots" : 1}}}], "app": {"name": "megabox"}, "id": "" };
    }else{
    	data = { "device": {"devicetype": 1},  "imp": [{"native": {"ext" : {"slots" : 1}}}], "site": {"name": "megabox"}, "id": "" };
    }

    var secret = "";

    if(bannerType) {
        if(bannerType == "MOVIE_DETAIL") {
            if(osTypeWithWeb() == "IOS" && isApp()) {
                secret = "rTHIoqP1QjOatTwwlPAx0A";
            } else if(osTypeWithWeb() == "ANDROID" && isApp()) {
                secret = "eZFWjkkQSMy0CAQdvjofHQ";
            } else {
                secret = "lbywajjgRO-uYQ1-11g2AA";
            }
        } else if(bannerType == "LOGIN") {
            if(osTypeWithWeb() == "IOS" && isApp()) {
                secret = "YfOmg7h4T22V3YRz1DsaOw";
            } else if(osTypeWithWeb() == "ANDROID" && isApp()) {
                secret = "KUv_msTJSz6eFuVXIXOwkA";
            } else {
                secret = "x2Rn2BvpSGW4R-eR9RHCKQ";
            }
        } else if(bannerType == "BOKD") { // 삭제?
            if(osTypeWithWeb() == "IOS" && isApp()) {
                secret = "G-eNX6P7RvOlj_5ucKsmWQ";
            } else if(osTypeWithWeb() == "ANDROID" && isApp()) {
                secret = "I40KnJi2TZSfSlWVj1y0qQ";
            } else {
                secret = "QDpQH5hnQkWb5HHpwZuOtw";
            }
        }else if(bannerType == "mainMiddle"){  // 메인중단
            if(osTypeWithWeb() == "IOS" && isApp()) {
                secret = "elvOz6-lTlizbdDX_eBB5w";
            } else if(osTypeWithWeb() == "ANDROID" && isApp()) {
                secret = "LkaCfuQVQ7maZTDNrSvo7A";
            } else {
                secret = "O7MEj49YRn6tc5zvUruZ4g";
            }
        }else if(bannerType == "favor"){  // 선호극장
	    	if(osTypeWithWeb() == "IOS" && isApp()) {
	    		secret = "dqcGjvqvQhGd_xu1a1fisg";
	    	} else if(osTypeWithWeb() == "ANDROID" && isApp()) {
	    		secret = "3NBFQugRT3ap00m1i_nIbQ";
	    	} else {
	    		secret = "nCg_yoahS46d23rA6OtTag";
	    	}
        }
    }
    //공통배너
    else {
        if(osTypeWithWeb() == "IOS" && isApp()) {
            secret = "S9f7prbgTIeuPIpf3vD3zQ";
        } else if(osTypeWithWeb() == "ANDROID" && isApp()) {
            secret = "3tjlzrk2SWyfLDI2yJ1Vtw";
        } else {
            secret = "GL6s0IfFQr-KOgnY5nulDg";
        }
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
        	if(result) {
                var imgFile = result.image_file;
                var alt = result.alternative_text;
                var clickThrough = result.click_through;        //배너클릭주소
                var clickTracking = result.click_tracking       //클릭 트래킹
                var impression = result.impression_tracking;    //노출 트래킹
                var width = '100%';
                var height = '100%';
                var bgColor = result.bgcolor;

                if(!imgFile) {
                    imgFile = "https://img.megabox.co.kr/static/mb/images/common/bg/bg-noimage.png";
                }

                var bannerHtml = "<img id='pageBannerImage' onclick='commonAdClick()' style='width:"+width+";height:"+height+";' class='lozad ad-img' data-src='"+imgFile+"' src='' alt='"+alt+"' data-clickThrough='"+clickThrough+"' data-impression='"+impression+"' data-clickTracking='"+clickTracking+"' />";

                $("#pageBanner").css("background-color", bgColor);
                $("#pageBanner").css("width", "auto");
                $("#pageBanner").html(bannerHtml);
                $("#pageBanner").removeClass("display-none");

                gfn_lozadStart("lozad");
            } else {
                $("#pageBanner").addClass("display-none");
            }
        }
        , error: function(err) {
            $("#pageBanner").addClass("display-none");
            console.log('fn_getBannerAd error : ' + err.status);
        }
    });
}

function gfn_findLoad(domain) {
    AppHandler.Common.link({ domain: domain });
}

//confirm용 중복클릭해제
function gfn_controlActionOff() {
    controlAction.off();
}

//선물하기 호출
function gfn_callMbshipPointGift() {

    if (!sessionAllow({sessionAt:true})) return;

    $.ajax({
        url        : '/on/oh/ohh/MyMbship/selectGiftAblePoint.do',
        type       : 'POST',
        contentType: 'application/json;charset=UTF-8',
        dataType   : 'json',
        success    : function (data, textStatus, jqXHR) {
            AppDomain.MyMegabox.mbshipPointGift();
        },
        error: function(xhr,status,error){
            var err = JSON.parse(xhr.responseText);
            AppHandler.Common.alert(err.msg);
        },
        complete: function() {
            controlAction.off();
        }
    });
}

function gfn_useCponBrchList(cponNo, el){
    var paramData = {cponNo : cponNo, cancelElement : el}

    if(!isApp()){
        $.ajax({
            url: '/on/oh/ohh/MyDcCpCpon/infoDcCponoBrchList.do',
            type: "POST",
            async: false,
            contentType: "application/json;charset=UTF-8",
            data: JSON.stringify(paramData),
            success: function (data, status, xhr) {
                $("#"+el).html(data);
                $("#"+el).css("top","0px").removeClass("display-none").addClass("fade");
            },
            error: function(xhr, status, error){
                var oData = { message: error };
                AppHandler.Common.alert(oData);
            },
            complete: function(){
                $("body").addClass("no-scroll");
                theaterSelect();
            }
        });
    }else{
        AppDomain.Store.useCponBrchList(paramData);
    }
}

function objectValues(object) {
    var values = [];
    for(var property in object) {
        values.push(object[property]);
    }
    return values;
};
function gfn_bannerLink(url){

	if(url == undefined){
		return;
	}

	if(isApp()){
		if(url.indexOf('isWebLink') != -1){
			location.href = url;
		}else{
			window.open(url);
		}
	}else{
		if(url.indexOf('isWebLink') != -1){
			window.open(url);
		}else{
			location.href = url;
		}
	}
}
function gfn_appCheck() {
	location.href = "https://m.megabox.co.kr/re/AppOnly/main";
};

function gfn_goStore(){
    var storeUrl = "";
    if(osType() == "ANDROID") {
        location.href = "intent://megaboxapp/#Intent;package=com.megabox.mop;scheme=https;end";
        storeUrl = "market://details?id=com.megabox.mop";
    } else if(osType() == "IOS") {
        location.href = "megaboxapp://main";
        storeUrl = "itms-apps://itunes.apple.com/app/id894443858?mt=8";
    }
    setTimeout( function() {
        location.href = storeUrl;
    }, 3000);
}

function gfn_videoPlay(url){
	if(url == undefined) return;
	event.preventDefault();
    var data = {videoFile : url, duration: 0};
    AppHandler.Common.videoPlay(data);
}

function setViewParamsCallback(data) {
    if(!data.value) {
        return;
    }

    var urlParamMap = JSON.parse(data.value);

    var $urlParamElements = $('[data-urlparam]');
    $urlParamElements.each(function () {
        var key = $(this).data('urlparam');
        if (key) {
            var value = urlParamMap[key] || '';
            if(value){ // 치환할 값이 있을 경우에만 적용한다.
                var tagName = $(this).prop('tagName').toLowerCase();
                if(tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
                    $(this).val(value);
                } else {
                    $(this).html(value);
                }
            }
        }
    });
}