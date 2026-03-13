const tabType = {
    branch : 'BRANCH',  //탭 지역별
    special: 'SPECIAL'  // 탭 특별관
}

const viewStep = {
    step1: 'STEP1', // 극장선택
    step2: 'STEP2', // 극장별예매
    step3: 'STEP3',// 영화별예매
    // step4: 'STEP4'// 영화선택
};

let nowTab = tabType.branch;
let choiceCount = 0; // 지점 선택 카운트
let maxChoiceCount = 5; // 지점 최대 선택 수
let choiceBranchInfo = {}; // 선택된 지점 정보
let initX = 0;
let initY = 0;
let touching = false;
let favorList = [] //선호극장
let goMovie
let channelCd = "MOBILEWEB";
let isJumping = 'N';
let menuId = '';
let isBack = 'N';
let theabAutoSelectedList = [];
let locationForm = {brchLat  : '', brchLon : '', deviceInfo : ''};
let theaterType = undefined;

/**
 * 극장 선택 팝업 화면 로딩
 */
$(document).ready(function() {
    getViewTheaterSelectPopup();

    if(isApp()) {
        channelCd = osType();
    }

    if(isJumping == 'Y') {
        fn_setJumping();
    } else if(isBack == 'Y') {
        fn_goback();
    } else {
        if(theabAutoSelectedList.length > 0 && !theaterType) {
            fn_choiceComplete();
        } else {
            fn_getBranchChoiceInfo();
        }
    }

    $("#byPassBtn").on('click', function() {
        fn_locAccessPopupOnOff('off');
    });

    const sweepDownTapEl = document.getElementById("sweepDownTap");

    sweepDownTapEl.addEventListener('touchstart', (e) => handleTouchStart(e));
    sweepDownTapEl.addEventListener('touchmove', (e) => handleTouchMove(e));
    sweepDownTapEl.addEventListener('touchend', (e) => handleTouchEnd(e));
});

/**
 * 터치 시작 이벤트
 * @param event
 */
function handleTouchStart(event) {
    const touch = event.touches[0];
    initX = touch.clientX;
    initY = touch.clientY;
}

/**
 * 터치중 이벤트
 */
function handleTouchMove() {
    const touch = event.touches[0];
    const currentX = touch.clientX;
    const currentY = touch.clientY;

    //좌표계산
    const deltaX = currentX - initX;
    const deltaY = currentY - initY;

    if(Math.abs(deltaX) < Math.abs(deltaY)) {
        if(deltaY > 0) {
            //아래로 쓸어내림
            touching = true;
        }
    }
}

/**
 * 터치 종료 이벤트
 * @param event
 */
function handleTouchEnd(event) {
    if(touching) {
        fn_brchPopupOnOff('theaterChoiceWrap', 'off');
    } else {
        touching = false;
    }
}

/**
 * 예매메인 to 스케줄 목록
 */
// function fn_setJumping() {
//     if('${fn:length(branch)}' > 0) {
//         choiceCount = '${fn:length(branch)}';
//         <c:forEach items="${branch}" var="rowData" varStatus="status">
//             choiceBranchInfo['${rowData.brchNo}'] = { brchNo: '${rowData.brchNo}', brchNm: '${rowData.brchNm}', brchFormAt: '${rowData.brchFormAt}', brchBokdUnableAt: '${rowData.brchBokdUnableAt}', sort: '${status.index+1}' };
//         </c:forEach>
//
//         fn_restore();
//
//     } else {
//         fn_getBranchChoiceInfo();
//     }
// }

function fn_restore() {
    var choiceHtml = '';
    var tempBrchNo = '';

    //var temp = Object.values(choiceBranchInfo);
    var temp = objectValues(choiceBranchInfo);
    temp.sort(function(a, b) {
        return a["sort"] - b["sort"];
    });

    $.each(temp, function (i, item) {
        if(i == 0) { // 선택한 지점 추가
            choiceBranch = item.brchNo;
        }
        tempBrchNo += (tempBrchNo != '' ? '_' : '') + item.brchNo;
        choiceHtml += '<div divCd="CHOICE" brchNo="' + item.brchNo + '" brchFormAt="' + item.brchFormAt + '" brchBokdUnableAt="' + item.brchBokdUnableAt + '" class="item' + (i == 0 ? ' on' : '') + '" onclick="fn_branchOnClick(this, searchType.branch, \'' + item.brchNo + '\', \'\');">' + item.brchNm + '</div>';
    });

    $('#mixTheaterList').html(choiceHtml);
    fn_brchChangeView(viewStep.step2);
    fn_getSchduleList(searchType.branch, choiceBranch, '${params.playDe}');
}

/**
 * 상단탭 선택
 * @param {string} 구분자
 */
function fn_tabOnClick(flag) {
    nowTab = flag;

    //fn_initChoiceInfo(); // 선택 극장 초기화

    $('#listBtn').find('a').each(function(e) {
        $(this).removeClass('act');
    });

    $('#tab_' + flag.toLowerCase()).addClass('act');

    var branchTheatherListObject = $('#branchTheatherList');
    var specialTheatherListObject = $('#specialTheatherList');

    if (flag == tabType.branch) {
        if($('#branchTheatherList nav div').find('a[class=act]').length == 0) {
            fn_setDefaultBrch();
        }
        branchTheatherListObject.removeClass(noneClass);
        specialTheatherListObject.addClass(noneClass);
    } else {
        if($('specialTheatherList nav div').find('a[class=act]').length == 0) {
            fn_branchChoiceSpecial($('#specialTheatherList nav div a').eq(0).attr('area-cd'));
        }
        branchTheatherListObject.addClass(noneClass);
        specialTheatherListObject.removeClass(noneClass);
    }
}

/**
 * 선택 정보 초기화
 */
function fn_initChoiceInfo() {
    choiceCount = 0;
    choiceBranchInfo = {};
    $("#choiceBtn").removeClass("bc01");
    $("#choiceBtn").addClass("disb");
    $('#choiceBtn').prop('disabled', true);
    $("#choiceBtn").text("선택 완료");
}

/**
 * 지점 선택
 * @param {string} 지점코드
 */
function fn_branchChoice(flag) {
    const displayClass = ' display-none';
    const actClass = ' act';
    const idPrefix = 'branch_';

    $('#branchTheatherList nav div a').removeClass(actClass);
    $('#branch_area_'+flag).addClass(actClass);

    $('#branchTheatherList .city-cont').addClass(displayClass);
    $('#' + idPrefix + flag).removeClass(displayClass);
}

function fn_branchChoiceSpecial(flag) {
    const displayClass = ' display-none';
    const actClass = ' act';
    const idPrefix = 'special_branch_';

    $('#specialTheatherList nav div a').removeClass(actClass);
    $('#special_branch_area_'+flag).addClass(actClass);

    $('#specialTheatherList .city-cont').addClass(displayClass);
    $('#' + idPrefix + flag).removeClass(displayClass);
}

/**
 * 극장 선택
 * @param {string} 지점코드
 * @param {string} 지점명
 * @param {string} 지점편성여부 (Y:편성/N:미편성)
 * @param {string} 지점예매불가능여부 (Y:불가능/N:가능)
 */
function fn_theaterChoice(brchNo, brchNm, brchFormAt, brchBokdUnableAt, tag) {
    if(controlAction.isExec()) return; controlAction.on();
    //전체 특별관 찾기
    const specialBranchCd = ['DBC', 'MX4D', 'MX', 'TBQ', 'CFT'];
    let spcTheabKindCd = brchNo.split('_')[1] == undefined ? 'ALL' : brchNo.split('_')[1];
    let realBrchNo = brchNo.split('_')[0];
    let realBrchNm = brchNm.split('(')[0];
    // 선택 목록과 동일 건 체크 후 카운트
    if(choiceCount == 0 || choiceBranchInfo[realBrchNo] == undefined) {//동일 brchNo는 처리해야한다.
        if(maxChoiceCount == choiceCount) {
            AppHandler.Common.alert('<spring:message code="msg.ch.ohb.maxBrchCnt"/>');
            controlAction.off();
            return;
        }

        //지점 예매불가 체크
        $.ajax({
            url: "/on/oh/ohb/SimpleBooking/selectBrchBokdUnablePopup.do",
            type: "POST",
            contentType: "application/json;charset=UTF-8",
            dataType: "json",
            data: JSON.stringify({ brchNo : brchNo.split('_')[0], sellChnlCd : channelCd}),
            success: function (data, textStatus, jqXHR) {
                if(data.brchBokdUnablePopup && data.brchBokdUnablePopup.bokdAbleAt == 'N') {
                    let message = data.brchBokdUnablePopup.popupKorMsg; //한글 (data.brchBokdUnablePopup.popupEngMsg 영문)
                    if(message) {
                        AppHandler.Common.alert(message);
                    } else {
                        AppHandler.Common.alert("극장 점검 중 입니다.\n잠시후 다시 이용해 주세요.");
                    }
                } else {
                    choiceCount++;
                    $('#choiceBtn').prop('disabled', false);
                    $("#choiceBtn").addClass("bc01");
                    $("#choiceBtn").removeClass("disb");
                    $('#maxChoiceText').addClass('display-none');
                    $("#choiceBtn").text("선택 완료 ("+choiceCount+"/5)");

                    var sortIndex = 1;
                    if(Object.keys(choiceBranchInfo).length > 0) {
                        sortIndex = Object.keys(choiceBranchInfo).length + 1;
                    }

                    let choiceBranchSpcArr = [];
                    choiceBranchSpcArr.push(spcTheabKindCd);
                    $('#branch_sub_'+brchNo).addClass('act');
                    let tag = 'all';
                    //저장되는값은 brchFormAt Y, brchBokdUnableAt N일때만이다
                    choiceBranchInfo[realBrchNo] = { brchNo: realBrchNo, brchNm: realBrchNm, brchFormAt: brchFormAt, brchBokdUnableAt: brchBokdUnableAt, sort: sortIndex, spcKindCd: choiceBranchSpcArr};
                    let innerHtml = '<div id="choiceTheater_' + realBrchNo + '" class="sel">' + realBrchNm + '<i class="icon2 btn_close_w16" onclick="fn_deleteChoiceTheater(\'' + realBrchNo + '\', \'' + tag + '\');"></i></div>';

                    $('#choiceTheaterList').append(innerHtml);

                    // if(theaterSwiper) {
                    // 	theaterSwiper.update();
                    // }

                    if(choiceCount == 1) {
                        $('#choiceTheaterWrap').removeClass('display-none');
                    }
                }
                controlAction.off();
            },
            error: function(xhr,status,error){
                controlAction.off();
                AppHandler.Common.alert("극장 점검 중 입니다.\n잠시후 다시 이용해 주세요.");
            }
        });

    } else if(choiceBranchInfo[realBrchNo] != undefined && !(choiceBranchInfo[realBrchNo].spcKindCd.indexOf(spcTheabKindCd) > -1)){//중복된것 들어왔을때 특별관 또는 지역별 극장 중복
        let choiceBranchSpcArr = [];
        choiceBranchSpcArr = choiceBranchInfo[realBrchNo].spcKindCd;
        let sortIndex = choiceBranchInfo[realBrchNo].sort;
        $('#branch_sub_'+brchNo).addClass('act');//일반관 선택 체크
        choiceBranchSpcArr.push(spcTheabKindCd);//일반관넣어주기
        //저장되는값은 brchFormAt Y, brchBokdUnableAt N일때만이다
        choiceBranchInfo[realBrchNo] = { brchNo: realBrchNo, brchNm: realBrchNm, brchFormAt: brchFormAt, brchBokdUnableAt: brchBokdUnableAt, sort: sortIndex, spcKindCd: choiceBranchSpcArr};

        // $('#branch_sub_'+brchNo).addClass('act');
        controlAction.off();
    } else {//다시선택한경우
        fn_deleteChoiceTheater(brchNo);
        controlAction.off();
    }
}

/**
 * 선택 극장 삭제
 * @param {string} 지점코드
 * @param {string} 태그 all, spcTheabKindCd (DBC, MX, MX4D, TBQ, CFT)
 */
function fn_deleteChoiceTheater(brchNo, tag) {
    choiceCount--;

    let realBrchNo = brchNo.split('_')[0];
    let deleteTheabKindCd = brchNo.split('_')[1] == undefined ? 'ALL' : brchNo.split('_')[1];
    let theabKindCdArr = choiceBranchInfo[realBrchNo].spcKindCd;

    if(tag != undefined && tag == 'all' && deleteTheabKindCd == 'ALL') {//전체삭제
        if(theabKindCdArr.length > 0) {
            if(theabKindCdArr.length == 1) {
                if(theabKindCdArr[0] == 'ALL') {
                    $('#branch_sub_'+realBrchNo).removeClass('act');
                } else {
                    let sumBrchNo = realBrchNo +  '_' + theabKindCdArr[0];
                    $('#branch_sub_'+sumBrchNo).removeClass('act');
                }
            } else {
                for(let i=0; i<theabKindCdArr.length > 0; i++) {
                    if(theabKindCdArr[i] == 'ALL') {
                        $('#branch_sub_'+realBrchNo).removeClass('act');
                    } else {
                        let sumBrchNo = realBrchNo +  '_' + theabKindCdArr[i];
                        $('#branch_sub_'+sumBrchNo).removeClass('act');
                    }
                }
            }
        }

        $('#choiceTheater_' + realBrchNo).remove();
        delete choiceBranchInfo[realBrchNo];
    } else {
        if(theabKindCdArr.length >= 2) {//특별관 선택된것 2개이상일때
            for(let i=0; i<theabKindCdArr.length > 0; i++) {
                if(theabKindCdArr[i] == deleteTheabKindCd) {
                    let sumBrchNo =  deleteTheabKindCd == 'ALL' ? realBrchNo : realBrchNo + '_' + theabKindCdArr[i];
                    $('#branch_sub_'+sumBrchNo).removeClass('act');
                }
            }
            theabKindCdArr = theabKindCdArr.filter(item => item !== deleteTheabKindCd);
            choiceCount++; //개수를 초기화해주지않는다.
            choiceBranchInfo[realBrchNo].spcKindCd = theabKindCdArr;
            //특별관 1개라도 빼면 all이 풀리는것이다.
        } else if(theabKindCdArr.length == 1){//특별관 선택된것 1개일때
            let sumBrchNo = deleteTheabKindCd == 'ALL' ? realBrchNo : realBrchNo + '_' + theabKindCdArr[0];
            $('#branch_sub_'+sumBrchNo).removeClass('act');
            $('#choiceTheater_' + realBrchNo).remove();
            delete choiceBranchInfo[realBrchNo];
        }
    }

    if(choiceCount == 0) {
        //$('#choiceTheaterWrap').addClass('display-none');
        $('#choiceBtn').attr('disabled', true);
        $("#choiceBtn").removeClass("bc01");
        $("#choiceBtn").addClass("disb");
        $('#maxChoiceText').removeClass('display-none');
        $("#choiceBtn").text("선택 완료");
    }
}

/**
 * 선택 버튼 컨트롤
 * @param {string} 지점코드
 */
function fn_specialChoice(flag) {
    $('#choiceBtn').prop('disabled', false);
    $("#choiceBtn").addClass("bc01");
    $("#choiceBtn").removeClass("disb");
    $("#choiceBtn").text("선택 완료");
}

/**
 * 선택 완료
 */
function fn_choiceComplete() {
    // 하단 function BrchByPlayTimeLlL.jsp 참조
    // if(flag == 'brch') {
        fn_setMixTheaterList(); // 극장별 예매 상단 극장 목록 추가
    // }
    // else if(flag == 'movie') {
    //     fn_setChoiceMovieNm(choiceMovieInfo.movieNm, choiceMovieInfo.admisClassCd);
    //     fn_setChoiceTheaterList(); // 극장별 예매 상단 극장 목록 추가
    //     fn_getSchduleList(searchType.viewStep3, '', '', choiceMovieInfo.movieNo);
    //     fn_theareClear();
    // }

    if(isJumping != 'Y') { // 극장별 예매로 바로 이동이 아닐시 첫번째 극장 선택
        $('#mixTheaterList').find('div').eq(0).click();
    }

    if(isJumping != 'Y') { // 앱인 경우 헤더 셋팅
        fn_setHeader(viewStep.step2);
    }

    if(menuId == 'M-RE-TH-02') { // 최초 극장별예매로(step2) 로 접근 했을시 화면 전환
        fn_brchChangeView(viewStep.step2);
    }

    //fn_theareClear();
}

//극장 선택 화면 초기화
function fn_theareClear() {
    $('#branchTheatherList').html('');
    $('#myTheaterCount').text('');
    $('#specialTheatherList').html('');
}

/**
 * 전체초기화
 * @param {string} 구분자 : [STEP1:극장 선택] [STEP2:극장별 예매]
 * @param {string} 구분자 : [movie:극장별예매에서 호출] [brch:극장별 예매에서 호출]
 */
function fn_brchInitAll(flag) {
    if(flag == viewStep.step1) { // 극장 선택
        choiceCount = 0;
        choiceBranchInfo = {};
        $('#choiceTheaterList').html('');
        $('#choiceBtn').prop('disabled', true);
        $("#choiceBtn").removeClass("bc01");
        $("#choiceBtn").addClass("disb");
        $("#choiceBtn").text("선택 완료");
        $('#maxChoiceText').removeClass('display-none');
        $(".cinemaSelectArea nav div a").removeClass("act");
        $(".cinemaContent div.city-cont").addClass("display-none");
        fn_tabOnClick(tabType.branch);
    }else if(flag == viewStep.step2) { // 극장별 예매
        choiceBranch = ''; // 선택 지점
        choicePlayDate = {
            playDe: '', // 선택 일자 YYYYMMDD
            dowKorNm: '' // 선택 요일
        };

        nowScrollTop = 0; // 스크롤 위치
        nowAutoChangeStatus = ''; // 현재 자동 변경 상태
    }

    // if(movieOrBrch != undefined && movieOrBrch == 'movie') {
    //     $("#choiceBtn").attr("href", "javascript:fn_choiceComplete('movie')");
    // } else if(movieOrBrch == 'brch') {
    //     $("#choiceBtn").attr("href", "javascript:fn_choiceComplete('brch')");
    // }
}

var g_agree16 = 'N';
var brchDefClick = '10';
function fn_getBranchChoice(paramData){

    var	data = {
        menuId : 'M-RE-TH-01',
        sellChnlCd : channelCd
    }
    $.extend(paramData,data);

    $.ajax({
        url: "/on/oh/ohb/SimpleBooking/selectBokdList.do",
        type: "POST",
        contentType: "application/json;charset=UTF-8",
        dataType: "json",
        data: JSON.stringify(paramData),
        success: function (data, textStatus, jqXHR) {
            var favorMaxLength = 5;
            var favorBrchListLength = 0;
            var brchDistanceMaxLength = 3;
            var brchDistanceListLength = 0;
            let recentBrchListLength = 0;
            let recentBrchListMaxLength = 3;
            var myTheaterCount = 0;
            var branchListHtml = '';
            let branchDistAgreeAt = false;

            // 선호 지점
            if(data.favorBrchList != undefined) {
                favorBrchListLength = data.favorBrchList.length > favorMaxLength ? favorMaxLength : data.favorBrchList.length;
            }

            //최근이용한극장
            if(data.recentBrchList != undefined) {
                recentBrchListLength = data.recentBrchList.length > recentBrchListMaxLength ? recentBrchListMaxLength : data.recentBrchList.length;
            }

            // 가까운 지점 - 삭제 20230414 윤효K
            if(data.brchDistanceList != undefined) {
                brchDistanceListLength = data.brchDistanceList.length > brchDistanceMaxLength ? brchDistanceMaxLength : data.brchDistanceList.length;
            }

            //km동의 했는지 확인 App여부 && 개인정보 위치동의확인
            if(data.agree16 == "Y") {//모바일웹도된다? isApp()
                branchDistAgreeAt = true;
            }


            //지역별
            branchListHtml += '		<nav class="leftNav">';
            branchListHtml += '			<div class="inSk">';
            branchListHtml += '				<a id="branch_area_my" href="javascript:fn_branchChoice(\'my\')" class="area">';
            branchListHtml += '					<span>나의극장</span> <div id="myTheaterCount" class="numb">0</div>';
            branchListHtml += '				</a>';

            if(data.branchList != undefined) {
                var areaCd = '';
                for(var i=0; i < data.branchList.length; i++) {
                    var rowData = data.branchList[i];
                    let newTag = '';

                    if(areaCd != rowData.areaCd) {
                        //지점 극장 이벤트가 있으면, 지역 표시 구분
                        var tempArr = $.grep(data.branchList, function( a ) {
                            var tempAreaCd = rowData.areaCd;
                            return a.areaCd == tempAreaCd;
                        });
                        for(var d = 0; d < tempArr.length; d++) {
                            var temp = tempArr[d];
                            if (temp.brchOnlineExpoAt == 'Y') {
                                newTag = 'imp';
                                break;
                            }
                        }

                        branchListHtml += '<a id="branch_area_'+rowData.areaCd+'" href="javascript:fn_branchChoice(\'' + rowData.areaCd + '\')" class="area">';
                        branchListHtml += '		<span class="'+newTag+'">'+rowData.areaCdNm+'</span><div class="numb">' + rowData.formBrchCnt + '</div>';
                        branchListHtml += '</a>';
                    }

                    areaCd = rowData.areaCd;
                }
            }
            branchListHtml += '			</div>';
            branchListHtml += '		</nav>';

            //지점
            branchListHtml += '<div class="cinemaContent">';

            if(data.branchList != undefined) {
                var areaCd = '';

                //나의극장
                branchListHtml += '<div id="branch_my" class="city-cont display-none">';
                branchListHtml += '<div class="title">선호 극장</div>';
                //선호극장
                if(favorBrchListLength > 0) {
                    for(var i=0; i < favorBrchListLength; i++) {
                        var rowData = data.favorBrchList[i];
                        //선호극장 리스트 저장
                        favorList.push(rowData.brchNo);
                        var formAt = rowData.formAt;
                        let disabled = formAt == 'N' ? 'disabled' : '';
                        // branchListHtml += '<li id="branch_sub_my_'+rowData.brchNo+'">';
                        branchListHtml += '<article class="item" id="branch_sub_my_'+rowData.brchNo+'">';
                        let actClass = favorList.indexOf(rowData.brchNo) > -1 ? ' act' : '';
                        branchListHtml += '		<div class="icon2 i_star20'+actClass+'" onclick="fn_favorBranchOnClick(this, \'' + rowData.brchNo +'\')"></div>';
                        //리뉴얼, 신규, 오픈예정, 이벤트
                        let impText = fn_getOnlineBrchStatusCdNm(rowData.brchOnlineExpoStatCd, rowData.brchOnlineExpoAt ,rowData.spcExistsAt, 'all');
                        let impHtml = impText == '' ? '' : '<em class="imp">'+impText+'</em>';
                        if(formAt == 'N') {
                            branchListHtml += '		<div class="name disabled"><span>'+rowData.brchNm+'</span>'+impHtml+'</div>';
                        } else {
                            branchListHtml += '		<div class="name" onclick="fn_theaterChoice(\'' + rowData.brchNo + '\', \'' + rowData.brchNm + '\', \'' + rowData.formAt + '\', \'' + rowData.brchBokdUnableAt + '\', \'my\');"><span>'+rowData.brchNm+'</span>'+impHtml+'</div>';
                            myTheaterCount++;
                        }
                        //km확인
                        if(branchDistAgreeAt && rowData.brchDist != '' && rowData.brchDist != undefined && rowData.brchDist != null) {
                            branchListHtml += '	<div class="km">'+rowData.brchDist+'km</div>';
                        }
                        branchListHtml += '</article>';

                        // if(formAt == 'N') {
                        // 	branchListHtml += '	<a href="javascript:void(0)" class="disabled"><div class="shortened"><i class="iconset ico-star-on"></i>' + rowData.brchNm + '</div><span class="distance2"></span></a>';
                        // } else {
                        // 	branchListHtml += '	<a href="javascript:fn_theaterChoice(\'' + rowData.brchNo + '\', \'' + rowData.brchNm + '\', \'' + rowData.formAt + '\', \'' + rowData.brchBokdUnableAt + '\', \'my\');"><div class="shortened"><i class="iconset ico-star-on"></i>' + rowData.brchNm + '</div><span class="distance2"></span></a>';
                        // 	myTheaterCount++;
                        // }
                    }
                } else {
                    branchListHtml += '<article class="none">';
                    branchListHtml += '	<p>설정된 선호 극장이 없습니다.<br>최근 이용한 극장을<br>선호 극장에 추가해보세요!</p>';
                    branchListHtml += '</article>';

                }

                //최근 이용한 극장
                if(recentBrchListLength > 0) {
                    branchListHtml += '<div class="title">최근 이용한 극장</div>';
                    for(let j = 0;  j < recentBrchListLength; j++) {
                        let rowData = data.recentBrchList[j];
                        let brchBokdUnableAt = rowData.brchBokdUnableAt;
                        let formAt = rowData.formAt;
                        //리뉴얼, 신규, 오픈예정, 이벤트
                        let impText = fn_getOnlineBrchStatusCdNm(rowData.brchOnlineExpoStatCd, rowData.brchOnlineExpoAt, rowData.spcExistsAt, 'all');
                        let impHtml = impText == '' ? '' : '<em class="imp">'+impText+'</em>';

                        if(brchBokdUnableAt == 'Y') {
                            brchBokdUnableAt = 'N';
                        } else {
                            brchBokdUnableAt = 'Y'
                        }

                        branchListHtml += '<article class="item">';
                        let actClass = favorList.indexOf(rowData.brchNo) > -1 ? ' act' : '';
                        branchListHtml += '		<div class="icon2 i_star20'+actClass+'" onclick="fn_favorBranchOnClick(this, \'' + rowData.brchNo +'\')"></div>';
                        if(formAt == 'N') {
                            branchListHtml += '		<div class="name disabled"><span>'+rowData.brchNm+'</span>'+impHtml+'</div>';
                        } else {
                            branchListHtml += '		<div class="name" onclick="fn_theaterChoice(\'' + rowData.brchNo + '\', \'' + rowData.brchNm + '\', \'' + rowData.brchFormAt + '\', \'' + rowData.brchBokdUnableAt + '\', \'my\')"><span>'+rowData.brchNm+'</span>'+impHtml+'</div>';
                        }
                        //km확인
                        if(branchDistAgreeAt && rowData.brchDist != '' && rowData.brchDist != undefined && rowData.brchDist != null) {
                            branchListHtml += '	<div class="km">'+rowData.brchDist+'km</div>';
                        }
                        branchListHtml += '</article>';
                    }
                }

                //가장 가까운 극장
                branchListHtml += '<div class="title">가까운 극장</div>';
                if(brchDistanceListLength > 0) {
                    for(var k=0; k < brchDistanceListLength; k++) {
                        var rowData = data.brchDistanceList[k];
                        var brchBokdUnableAt = rowData.brchBokdUnableAt;
                        var formAt = rowData.formAt;
                        //리뉴얼, 신규, 오픈예정, 이벤트
                        let impText = fn_getOnlineBrchStatusCdNm(rowData.brchOnlineExpoStatCd, rowData.brchOnlineExpoAt, rowData.spcExistsAt, 'all');
                        let impHtml = impText == '' ? '' : '<em class="imp">'+impText+'</em>';
                        if(brchBokdUnableAt == 'Y') {
                            brchBokdUnableAt = 'N';
                        } else {
                            brchBokdUnableAt = 'Y'
                        }
                        branchListHtml += '<article class="item">';
                        let actClass = favorList.indexOf(rowData.brchNo) > -1 ? ' act' : '';
                        branchListHtml += '		<div class="icon2 i_star20'+actClass+'" onclick="fn_favorBranchOnClick(this, \'' + rowData.brchNo +'\')"></div>';
                        if(formAt == 'N') {
                            branchListHtml += '	<div class="name disabled"><span>'+rowData.brchNm+'</span>'+impHtml+'</div>';
                        } else {
                            branchListHtml += '		<div class="name" onclick="fn_theaterChoice(\'' + rowData.brchNo + '\', \'' + rowData.brchNm + '\', \'' + rowData.formAt + '\', \'' + brchBokdUnableAt + '\', \'my\')"><span>'+rowData.brchNm+'</span>'+impHtml+'</div>';
                            // branchListHtml += '	<a href="javascript:fn_theaterChoice(\'' + rowData.brchNo + '\', \'' + rowData.brchNm + '\', \'' + rowData.formAt + '\', \'' + brchBokdUnableAt + '\');"><div class="shortened"><i class="iconset ico-place"></i>' + rowData.brchNm + '</div><span class="distance2">' + rowData.brchDist + 'km</span></a>';
                        }
                        //km확인
                        if(branchDistAgreeAt && rowData.brchDist != '' && rowData.brchDist != undefined && rowData.brchDist != null) {
                            branchListHtml += '	<div class="km">'+rowData.brchDist+'km</div>';
                        }
                        branchListHtml += '</article>';
                    }
                } else {
                    branchListHtml += '<article class="none">';
                    branchListHtml += '	<p>';
                    branchListHtml += '		<p>가까운 극장을 안내해드릴게요.</p>';
                    branchListHtml += '	</p>';
                    // if(data.agree16 == 'N' && isApp()) {
                    // 	// javascript:fn_validLoginAt(\'L\');
                    // 	branchListHtml += '	<a href="javascript:fn_locAccessPopupOnOff(\'on\');" class="btnH30">위치권한 설정하기</a>';
                    // 	g_agree16 = 'N';
                    // } else {
                    // 	g_agree16 = 'Y';
                    // }
                    branchListHtml += '	<a href="javascript:fn_locAccessPopupOnOff(\'on\');" class="btnH30">위치권한 설정하기</a>';
                    branchListHtml += '</article>';
                    if(data.agree16 == 'N' && isApp()) {
                        // javascript:fn_validLoginAt(\'L\');
                        g_agree16 = 'N';
                    } else {
                        g_agree16 = 'Y';
                    }
                }

                // if(favorBrchListLength == 0) {
                // 	branchListHtml += '<li class="setting-place">';
                // 	branchListHtml += '	<p class="text">';
                // 	branchListHtml += '		선호극장이 없습니다.<br />자주 가는 선호 극장을 추가해보세요.';
                // 	branchListHtml += '	</p>';
                // 	branchListHtml += '	<a href="javascript:fn_validLoginAt(\'F\');" class="btn-set-place">선호 극장 설정</a>';
                // 	branchListHtml += '</li>';
                // }

                branchListHtml += '</div>';

                //일반지점
                for(var i=0; i < data.branchList.length; i++) {
                    var rowData = data.branchList[i];
                    var brchFormAt = rowData.brchFormAt; // 선택한 영화가 상영중인 극장
                    //리뉴얼, 신규, 오픈예정, 이벤트
                    let impText = fn_getOnlineBrchStatusCdNm(rowData.brchOnlineExpoStatCd, rowData.brchOnlineExpoAt, rowData.spcExistsAt, 'all');
                    let impHtml = impText == '' ? '' : '<em class="imp">'+impText+'</em>';
                    if(areaCd != rowData.areaCd) {
                        branchListHtml += '<div id="branch_'+rowData.areaCd+'" class="city-cont display-none">';
                    }

                    // var brchOnlineExpoStatCdNm = '';
                    // if(rowData.brchOnlineExpoAt == 'Y') {
                    // 	brchOnlineExpoStatCdNm = '<span class="new2">'+rowData.brchOnlineExpoStatCdNm+'</span>';
                    // }

                    var brchNm = !rowData.brchNm ? "" : rowData.brchNm;
                    branchListHtml += '<article class="item" id="branch_sub_'+rowData.brchNo+'">';
                    if(favorList.indexOf(rowData.brchNo) > -1) {
                        branchListHtml += '		<div class="icon2 i_star20 act"></div>';
                    }
                    if(brchFormAt == 'Y') {
                        branchListHtml += '		<div class="name" onclick="fn_theaterChoice(\'' + rowData.brchNo + '\', \'' + rowData.brchNm + '\', \'' + rowData.brchFormAt + '\', \'' + rowData.brchBokdUnableAt + '\');"><span>'+ brchNm +'</span>'+ impHtml +'</div>';
                        // branchListHtml += '	<li id="branch_sub_'+rowData.brchNo+'"><a href="javascript:fn_theaterChoice(\'' + rowData.brchNo + '\', \'' + rowData.brchNm + '\', \'' + rowData.brchFormAt + '\', \'' + rowData.brchBokdUnableAt + '\');"><div class="shortened">' + brchNm + brchOnlineExpoStatCdNm + '</div></a></li>';
                        branchListHtml += ''
                    } else {
                        if(rowData.brchBokdUnableAt == 'Y') {
                            // branchListHtml += '	<li><a style="color: #999" href="javascript:fn_theaterChoice(\'' + rowData.brchNo + '\', \'' + rowData.brchNm + '\', \'' + rowData.brchFormAt + '\', \'' + rowData.brchBokdUnableAt + '\')" ><div class="shortened">' + brchNm + brchOnlineExpoStatCdNm + '</div></a></li>';
                            branchListHtml += '	<div style="color: #999" class="name" onclick="fn_theaterChoice(\'' + rowData.brchNo + '\', \'' + rowData.brchNm + '\', \'' + rowData.brchFormAt + '\', \'' + rowData.brchBokdUnableAt + '\')"><span>'+ brchNm +'</span>'+ impHtml +'</div>';
                        } else {
                            // branchListHtml += '	<li><a class="disabled" href="javascript:void(0)"><div class="shortened">' + brchNm + brchOnlineExpoStatCdNm + '</div></a></li>';
                            branchListHtml += '	<div class="name disabled"><span>'+ brchNm +'</span>'+ impHtml +'</div>';
                        }
                    }
                    branchListHtml += '</article>';
                    areaCd = rowData.areaCd;

                    if(data.branchList.length == (i+1) || rowData.areaCd != data.branchList[i+1].areaCd) {
                        branchListHtml += '</div>';
                    }
                }
            }
            branchListHtml += '</div>';
            $('#branchTheatherList').html(branchListHtml);
            $('#myTheaterCount').text(myTheaterCount);

            // 특별관
            var specialListHtml = '<nav class="leftNav">';
            specialListHtml += '		<div class="inSk">';

            if(data.specialList != undefined) {
                var areaCd = '';
                for(let s=0; s < data.specialList.length; s++) {
                    let rowData = data.specialList[s];

                    if(areaCd != rowData.areaCd) {
                        //지점 극장 이벤트가 있으면, 지역 표시 구분
                        // var tempArr = $.grep(data.branchList, function( a ) {
                        // 	var tempAreaCd = rowData.areaCd;
                        // 	return a.areaCd == tempAreaCd;
                        // });

                        // for(var d = 0; d < tempArr.length; d++) {
                        // 	var temp = tempArr[d];
                        // 	if (temp.brchOnlineExpoAt == 'Y') {
                        // 		newTag = '<em class="new2"> ' + rowData.areaCdNm + ' </em>';
                        // 		break;
                        // 	}
                        // }
                        //신규오픈 특별관 newTag추가
                        let impHtml = '';
                        const specialTheabNewTagList = data.specialTheabNewTagList;
                        if(specialTheabNewTagList.length > 0) {
                            if(rowData.areaCd == 'MX') {
                                let areaCdChk = specialTheabNewTagList.find(item => item.newTheabKindCd == rowData.areaCd);
                                let mx4dChk = specialTheabNewTagList.find(item => item == 'MX4D');
                                if(areaCdChk != undefined && mx4dChk == undefined) {
                                    impHtml += 'imp';
                                }
                            } else {
                                let areaCdChk = specialTheabNewTagList.find(item => item.newTheabKindCd == rowData.areaCd);
                                if(areaCdChk != undefined) {
                                    impHtml += 'imp';
                                }
                            }
                        }

                        //by MEGA줄바꿈 처리
                        if(rowData.areaCdNm.indexOf('by MEGA') > -1) {
                            rowData.areaCdNm = rowData.areaCdNm.replace(" by ", " </br> by ");
                        }

                        // if (rowData.areaCd == 'MX4D') {
                        // 	newTag = '<em class="new2"> ' + rowData.areaCdNm + ' </em>';
                        // }
                        specialListHtml += '<a href="javascript:fn_branchChoiceSpecial(\'' + rowData.areaCd + '\');" id="special_branch_area_'+rowData.areaCd+'" area-cd="'+rowData.areaCd+'">';
                        specialListHtml += '<span class="'+impHtml+'">' + rowData.areaCdNm + '</span>'
                        specialListHtml += '<div class="numb">' + rowData.formBrchCnt + '</div>'
                        specialListHtml += '</a>';

                        // specialListHtml += '<li id="special_branch_area_'+rowData.areaCd+'" area-cd="'+rowData.areaCd+'">';
                        // specialListHtml += '<a href="javascript:fn_branchChoiceSpecial(\'' + rowData.areaCd + '\')" class="area">' + newTag + ' <span class="num">' + rowData.formBrchCnt + '</span></a>';
                        // specialListHtml += '</li>';
                    }

                    areaCd = rowData.areaCd;
                }
            }

            specialListHtml += '		</div>';
            specialListHtml += '</nav>';

            specialListHtml += '<div class="cinemaContent special">';

            if(data.specialList != undefined) {
                var areaCd = '';

                for(var i=0; i < data.specialList.length; i++) {
                    var rowData = data.specialList[i];
                    var brchFormAt = rowData.brchFormAt; // 선택한 영화가 상영중인 극장

                    if(areaCd != rowData.areaCd) {
                        specialListHtml += '<div id="special_branch_'+rowData.areaCd+'" class="city-cont display-none">';
                        if(rowData.areaCd == 'DBC') {
                            specialListHtml += '<div class="imgBox"><img src="https://img.megabox.co.kr/static/mb/images/2024renewal/theater/dbc_thumb.png" alt="DOLBY CINEMA" /></div>';
                        } else if(rowData.areaCd == 'MX4D') {
                            specialListHtml += '<div class="imgBox"><img src="https://img.megabox.co.kr/static/mb/images/2024renewal/theater/mx4d_thumb.png" alt="MEGA | MX4D" /></div>';
                        } else if(rowData.areaCd == 'MX') {
                            specialListHtml += '<div class="imgBox"><img src="https://img.megabox.co.kr/static/mb/images/2024renewal/theater/mx_thumb.png" alt="DOLBY ATMOS" /></div>';
                        } else if(rowData.areaCd == 'CFT') {
                            specialListHtml += '<div class="imgBox"><img src="https://img.megabox.co.kr/static/mb/images/2024renewal/theater/cft_thumb.png" alt="COMFORT by MEGA" /></div>';
                        } else if(rowData.areaCd == 'TBQ') {
                            specialListHtml += '<div class="imgBox"><img src="https://img.megabox.co.kr/static/mb/images/2024renewal/theater/tbq_thumb.png" alt="BOUTIQUE by MEGA" /></div>';
                        }
                    }

                    // var brchOnlineExpoStatCdNm = '';
                    // if(rowData.brchOnlineExpoAt == 'Y') {
                    // 	brchOnlineExpoStatCdNm = '<span class="new2">'+rowData.brchOnlineExpoStatCdNm+'</span>';
                    // }

                    //리뉴얼, 신규, 오픈예정, 이벤트
                    let impText = fn_getOnlineBrchStatusCdNm(rowData.brchOnlineExpoStatCd, rowData.brchOnlineExpoAt, rowData.spcExistsAt, 'spc');
                    let impHtml = impText == '' ? '' : '<em class="imp">'+impText+'</em>';
                    let brchNm = !rowData.brchNm ? "" : rowData.brchNm;
                    specialListHtml += '<article class="item" id="branch_sub_'+rowData.brchNo + '_' + rowData.areaCd+'">';
                    if(favorList.indexOf(rowData.brchNo) > -1) {
                        specialListHtml += '		<div class="icon2 i_star20 act"></div>';
                    }
                    if(brchFormAt == 'Y') {
                        // specialListHtml += '	<li id="branch_sub_'+rowData.brchNo + '_' + rowData.areaCd+'"><a href="javascript:fn_theaterChoice(\'' + rowData.brchNo + '_' + rowData.areaCd + '\', \'' + rowData.brchNm + '(' + rowData.areaCdNm + ')\', \'' + rowData.brchFormAt + '\', \'' + rowData.brchBokdUnableAt + '\')"><div class="shortened">' + brchNm + brchOnlineExpoStatCdNm +'</div></a></li>';
                        specialListHtml += '	<div class="name" onclick="fn_theaterChoice(\'' + rowData.brchNo + '_' + rowData.areaCd + '\', \'' + rowData.brchNm + '(' + rowData.areaCdNm + ')\', \'' + rowData.brchFormAt + '\', \'' + rowData.brchBokdUnableAt + '\')"><span>'+brchNm+'</span>'+impHtml+'</div>';
                    } else {
                        if(rowData.brchBokdUnableAt == 'Y') {
                            // specialListHtml += '	<li><a style="color: #999" href="javascript:fn_theaterChoice(\'' + rowData.brchNo + '_' + rowData.areaCd + '\', \'' + rowData.brchNm + '(' + rowData.areaCdNm + ')\', \'' + rowData.brchFormAt + '\', \'' + rowData.brchBokdUnableAt + '\')"><div class="shortened">' + brchNm + brchOnlineExpoStatCdNm +'</div></a></li>';
                            specialListHtml += '	<div class="name" style="color: #999" onclick="fn_theaterChoice(\'' + rowData.brchNo + '_' + rowData.areaCd + '\', \'' + rowData.brchNm + '(' + rowData.areaCdNm + ')\', \'' + rowData.brchFormAt + '\', \'' + rowData.brchBokdUnableAt + '\')"><span>'+brchNm+'</span>'+impHtml+'</div>';
                        } else {
                            // specialListHtml += '	<li><a class="disabled" href="javascript:void(0)"><div class="shortened">' + brchNm + brchOnlineExpoStatCdNm + '</div></a></li>';
                            specialListHtml += '	<div class="name disabled"><span>'+brchNm+'</span>'+impHtml+'</div>';
                        }
                    }
                    specialListHtml += '</article>';
                    areaCd = rowData.areaCd;

                    if(data.specialList.length == (i+1) || rowData.areaCd != data.specialList[i+1].areaCd) {
                        specialListHtml += '</div>';
                    }
                }
            }
            specialListHtml += '</div>';
            $('#specialTheatherList').html(specialListHtml);

            //기본클릭
            fn_setDefaultBrch();

            //메시지
            if($('#choiceTheaterList span').length == 0) {
                $('#maxChoiceText').removeClass('display-none');
            }

            //mx링크로 들어온 경우
            if(theaterType == 'mx') {
                fn_tabOnClick(tabType.special);
                theaterType = '';
            }

            //front.js
            theaterSelect();
        },
        error: function(xhr,status,error){
            var err = JSON.parse(xhr.responseText);
            AppHandler.Common.alert('<spring:message code="error.common.error"/>');
        }
    });
}
/**
 * 초기 데이터 조회
 */
function fn_getBranchChoiceInfo() {
    if(isApp() && g_agree16 == 'Y') {
        AppHandler.Common.location({callback: 'fn_nativeLocation'});
    } else {
        fn_getBranchChoice({brchLat: '', brchLon: '', deviceInfo: ''});
    }
}

//Native Location
function fn_nativeLocation(data) {

    // var locationParam = {};
    if(data != undefined && parseInt(data.success) == 1) {
        locationForm.brchLat = data.latitude;
        locationForm.brchLon = data.longitude;
        if (data.deviceInfo != undefined){
            locationForm.deviceInfo = data.deviceInfo;
        }
        // locationParam = $("#locationForm").serializeObject();
        fn_getBranchChoice(locationForm);
    } else {
        fn_getBranchChoice({brchLat: '', brchLon: '', deviceInfo: ''});
    }
}

/**
 * 화면 전환 [극장선택<->극장별예매]
 * @param {string} 화면 구분자 [STEP1:극장선택] [STEP2:극장별예매]
 */
function fn_brchChangeView(flag) {
    var theaterChoiceWrap = $('#theaterChoiceWrap');
    var theaterReserveWrap = $('#theaterReserveWrap');

    if(flag == viewStep.step1) {
        theaterChoiceWrap.removeClass(noneClass);
        // theaterReserveWrap.addClass(noneClass);
    }else if(flag == viewStep.step2) {
        theaterChoiceWrap.addClass(noneClass);
        // theaterReserveWrap.removeClass(noneClass);
    }

    fn_setHeader(flag);
}

/**
 * 인원/좌석 선택 화면에서 back 했을 경우 넘어온 parameter 정보로 이전 정보로 다시 setting
 */
function fn_goback() {
    if($("#mixTheaterList div").length == 0) {
        gfn_BackByReferre();
    } else {
        fn_theaterClose(viewStep.step2);
        fn_theareClear();
    }
}

function fn_validLoginAt(linkType) {
    //로그인여부 체크
    $.ajax({
        url : "/on/oh/ohg/MbLogin/selectLoginSession.do",
        type: "POST",
        contentType: "application/json;charset=UTF-8",
        success: function(result){
            var loginAt = result.resultMap.result;
            var nonMbLogin = "N";

            if(result.resultMap.nonMbLogin) {
                nonMbLogin = result.resultMap.nonMbLogin;
            }

            if(loginAt  == "N" || nonMbLogin == "Y"){
                AppHandler.Common.alert("로그인 후 이용가능한 서비스입니다");
            } else {
                if(linkType == "L") {
                    if(isApp()) {
                        if(g_agree16 == 'N') {
                            gfn_miniLayer('locAccessPopup');
                        } else {
                            let data = {
                                callback : 'fn_gpsChk'
                            }
                            AppHandler.Common.isGpsEnable(data);
                        }
                    } else {
                        AppHandler.Common.alert("APP에서 이용 가능합니다.");
                    }
                } else if(linkType == "F") {
                    fn_favorTheater();
                }
            }
        }
    });
}

function fn_moveLocation() {
    AppDomain.Layer.setting("/setting", "layerview", "fn_locationLayerClose");
}

function fn_locationLayerClose() {
    var locationYn = fn_getToggleOnOff($("#locationServiceBtn"));

    if(locationYn == "N") {
        brchDefClick = 'my';
        AppHandler.Common.location({callback: 'fn_nativeLocation'});
    }

    fn_layerClose();
}

function fn_favorTheater() {
    AppDomain.Setting.favorTheater();
}

function fn_layerClose() {
    fn_setHeader(viewStep.step1);
    $("#theaterChoiceWrap").removeClass("display-none");
    $('#layerview').html('');
}

/**
 * 극장 선택 페이지 진입 시 기본 탭 설정
 *
 * @author AJ
 */
/**
 * 극장 선택 페이지 진입 시 기본 탭 설정
 *
 * @author AJ
 */
function fn_setDefaultBrch() {
    if($('#branch_my article[id^="branch_sub_my"]').length != 0) { // 선호극장이 하나 이상 존재할 경우 '나의극장' 탭 선택
        brchDefClick = 'my'
    } else { // 선호극장이 존재하지 않을 경우 '서울' 탭 선택
        brchDefClick = '10'
    }
    fn_branchChoice(brchDefClick);
}

/**
 *
 * @param popupId 팝업 전체 레이어 id
 * @param flag on팝업 오픈 //off 팝업 닫기
 */
function fn_brchPopupOnOff(popupId, flag) {
    const popupEl = $("#"+popupId);

    if(flag == 'on') {
        if(popupEl.hasClass("display-none")) {
            popupEl.removeClass("display-none");
        }
    }

    if(flag == 'off') {
        if(popupId == 'theaterChoiceWrap') {
            if($("#mixTheaterList div").length == 0) {
                AppHandler.Common.alert("최소 1개 극장을 선택해야합니다.");
                return;
            }
        }

        if (!popupEl.hasClass("display-none")) {
            popupEl.addClass("display-none");
        }
    }
}

/**
 * 온라인 지점 상태명 변환
 * @param statusCd
 */
function fn_getOnlineBrchStatusCdNm(statusCd, branchOnlineExpoAt,spcExistsAt, areaFlag) {
    if(branchOnlineExpoAt == 'Y') {
        if(statusCd == 'OES01') {
            return '신규';
        } else if(statusCd == 'OES02') {
            return '리뉴얼';
        } else if(statusCd == 'OES03') {
            return '예정';
        } else if(statusCd == 'OES04'){
            return '이벤트';
        }
    }

    if(areaFlag == 'all' && spcExistsAt == 'Y') {
        return '특별관';
    }

    return '';
}

/**
 * 위치권한 설정하기 팝업 ON/OFF
 * @param flag
 */
function fn_locAccessPopupOnOff(flag) {
    /**
     * 1.메가박스앱 내부 위치설정동의 AGREE16 동의확인 N-> 약관동의 팝업 노출
     * 2.AOS경우 GPS ON확인 및 위치서비스 설정 확인 IOS인경우 위치서비스설정 허용 확인
     * 3.GPS, 위치서비스 설정 동의 -> 가까운지점 노출
     * 4.GPS, 위치서비스 동의 이후 뒤로가기시 미조회
     */
    if(flag == 'on') {
        fn_validLoginAt('L');
    }

    if(flag == 'off') {
        gfn_miniLayer('locAccessPopup', {closeAt : 'Y'});
    }
}

/**
 * 극장선택 팝업 새로고침
 */
function fn_BrchPopupRefresh() {
    //선택한극장 있을때
    // if(choiceCount > 0) {
    if(isApp()) {
        fn_brchInitAll(viewStep.step1);
        //이것 호출하면 가까운 극장 지점 데이터 전부 초기화된다.
        let data = {
            callback : 'isRefreshChk'
        };
        AppHandler.Common.isGpsEnable(data);
    } else {
        fn_brchInitAll(viewStep.step1);
        fn_getBranchChoiceInfo();
    }
    // } else {
    //선택한 극장 없을때
    // fn_showToastPop("극장을 선택해주세요.", 3000);
    // }
}

/**
 * 극장 선택 토스트 메시지
 * @param msg
 * @param duration
 */
function fn_showToastPop(msg, duration) {
    $("#toastPop").empty();
    $('#toastPop').append(msg);
    $('#toastPop').removeClass('toTop');
    setTimeout(function () {
        $('#toastPop').addClass('toTop');
    }, duration)
}

/**
 * gps 및 위치 접근 허용 판단
 * @param data
 */
function fn_gpsChk(data) {
    if (data.gps && data.permission) {
        fn_getBranchChoiceInfo();
    } else if(data.gps && !data.permission) {
        let data = {
            permission: 'location',
            callback: 'fn_permissionChk'
        }
        AppHandler.Common.checkPermission(data);
    } else if(!data.gps) {
        if(osType() == 'IOS') {
            let data = {
                message: '위치정보 서비스 사용 동의 후 이용가능합니다.\n설정 > 개인정보 보호 및 보안 > 위치서비스에서 권한을 허용해주세요.'
            }
            AppHandler.Common.alert(data);
        } else {
            AppHandler.Common.gpsOn();
        }
    } else {
        AppHandler.Common.alert("GPS 체크 테스트");
        return;
    }
}

/**
 * 위치 정보 동의 허용 체크
 * @param data
 */
function fn_permissionChk(data) {
    if(data.success == 1) {
        //성공
        fn_getBranchChoiceInfo()
    } else {
        //실패 위치정보 허용실패
        return;
    }
}

/**
 * 메가박스 앱 내부 위치섧정 정보 동의
 */
function fn_locationAgreeClick() {
    if(isApp() && g_agree16 == 'Y') {
        gfn_miniLayer('locAccessPopup', {closeAt: 'Y'});
        const data = {
            callback: 'fn_gpsChk'
        }
        AppHandler.Common.isGpsEnable(data);
    } else {
        if(!isApp()) {
            AppHandler.Common.alert('APP에서 이용 가능합니다.');
        } else if(g_agree16 == 'N') {
            //위치서비스 동의 처리
            const paramData = {
                policAgreeDivCd: 'AGREE16',
                policAgreeAt: 'Y'
            }
            $.ajax({
                url : "/on/oh/ohz/MySetting/updateMbPushAgree.do",
                type: "POST",
                contentType: "application/json;charset=UTF-8",
                dataType: "json",
                data : JSON.stringify(paramData),
                success: function(data, textStatus, jqXHR){
                    if(data.result != undefined) {
                        var result = data.result;
                        if(result.statCd == '1') {
                            // 메가박스 위치동의 후 앱 동의로...
                            g_agree16 = 'Y';
                            fn_locAccessPopupOnOff('off');
                            const data = {
                                callback: 'fn_gpsChk'
                            }
                            AppHandler.Common.isGpsEnable(data);
                        }
                        else {
                            AppHandler.Common.alert('<spring:message code="error.common.error"/>');
                        }
                    }
                    else {
                        AppHandler.Common.alert('<spring:message code="error.common.error"/>');
                    }
                }
            });
        }
    }
}

/**
 * gpsOn 결과 callback함수?
 * @param data
 */
function gpsOnResult(data) {
    if(data.success == 1) {
        const data = {
            callback : 'fn_gpsChk'
        }

        if(isApp()) {
            AppHandler.Common.isGpsEnable(data);
        }
    }
}

function isRefreshChk(data) {
    if(isApp() && data.gps && data.permission) {
        fn_getBranchChoiceInfo();
    } else {
        fn_getBranchChoice({brchLat: '', brchLon: '', deviceInfo: ''});
    }
}

/**
 * 극장 선택 팝업 화면 조회
 */
function getViewTheaterSelectPopup() {
    //가장먼저 고민해야할것, choiceMovie이런 choiceBranch같은 전역변수를 함께사용할수있는지가 문제다.
    //원래 극장 선택을 호출하던 api호출하면된다.
    let specialTheabNewTagList = [];
    $.ajax({
        url: "/on/oh/ohb/BokdMain/viewBokdMainPage.do",
        type: "POST",
        contentType: "application/json;charset=UTF-8",
        success: function (data, textStatus, jqXHR) {
            theabAutoSelectedList = data.theabAutoSelectedList;
            specialTheabNewTagList = data.specialTheabNewTagList;
            g_agree16 = data.agree16;
            isJumping = data.isJumping;
            isBack = data.isBack;
            menuId = data.menuId;
            theaterType = data.params?.theaterType;
        },
        error: function(xhr, status, error) {
            let err = JSON.parse(xhr.responseText);
            AppHandler.Common.alert('<spring:message code="error.common.error"/>');
        }
    });
    let theaterSelectPopHtml = '';
    if(isApp()) {
    // theaterSelectPopHtml += '<div class="container" style="padding-top:0px;">';
    } else {
    // theaterSelectPopHtml += '<div class="container">';
    }
    theaterSelectPopHtml += '   <div class="layerpopup2" id="theaterSelectPopup">';
    theaterSelectPopHtml += '      <div class="dim" onclick="fn_brchPopupOnOff(\'theaterChoiceWrap\', \'off\');"></div>';
    theaterSelectPopHtml += '      <div class="layer cinemaSelect">';
    theaterSelectPopHtml += '          <a href="javascript:fn_BrchPopupRefresh();" class="refresh"><span class="icon2 btn_refresh_bl24">새로고침</span></a>';
    theaterSelectPopHtml += '          <div class="hd" id="sweepDownTap">';
    theaterSelectPopHtml += '              <div class="tit">극장 선택</div>';
    theaterSelectPopHtml += '          </div>';
    theaterSelectPopHtml += '          <div class="bd">';
    theaterSelectPopHtml += '              <div class="selectView" id="choiceTheaterWrap">';
    if(theabAutoSelectedList != undefined && theabAutoSelectedList.length > 0) {
        theaterSelectPopHtml += '                  <p id="maxChoiceText" class="txt display-none">최대 5개까지 극장 선택 할 수 있습니다.</p>';
    } else {
        theaterSelectPopHtml += '                  <p id="maxChoiceText" class="txt">최대 5개까지 극장 선택 할 수 있습니다.</p>';
    }
    theaterSelectPopHtml += '                  <div class="" id="choiceTheaterList"></div>';
    theaterSelectPopHtml += '              </div>';
    theaterSelectPopHtml += '              <div class="cinemaTab" id="listBtn">';
    theaterSelectPopHtml += '                  <a href="javascript:fn_tabOnClick(tabType.branch)" class="act" id="tab_branch"><span>지역별</span></a>';
    if(specialTheabNewTagList != undefined && specialTheabNewTagList.length > 0) {
        theaterSelectPopHtml += '                  <a href="javascript:fn_tabOnClick(tabType.special)" id="tab_special"><span class="imp">특별관</span></a>';
    } else {
        theaterSelectPopHtml += '                  <a href="javascript:fn_tabOnClick(tabType.special)" id="tab_special"><span class="">특별관</span></a>';
    }
    theaterSelectPopHtml += '              </div>';
    theaterSelectPopHtml += '              <div class="cinemaSelectArea" id="branchTheatherList"></div>';
    theaterSelectPopHtml += '              <div class="cinemaSelectArea display-none" id="specialTheatherList"></div>'
    theaterSelectPopHtml += '          </div>'
    theaterSelectPopHtml += '          <div class="btn2Area pd818 sol">'
    theaterSelectPopHtml += '              <a href="javascript:fn_choiceComplete();" class="btn2 h56 ra10 disb" id="choiceBtn" disabled>선택 완료</a>'
    theaterSelectPopHtml += '          </div>'
    theaterSelectPopHtml += '      </div>'
    theaterSelectPopHtml += '      <div class="layer btPop deep2" style="display:none;">'
    theaterSelectPopHtml += '          <div class="hd">'
    theaterSelectPopHtml += '              <div class="tit">위치서비스 설정</div>'
    theaterSelectPopHtml += '          </div>'
    theaterSelectPopHtml += '          <div class="bd">'
    theaterSelectPopHtml += '              <div class="solText">현재 위치에서 가장 가까운 영화관으로 안내 해드릴게요.<br>가까운 극장은 위치서비스 사용 동의 후 이용가능합니다.</div>'
    theaterSelectPopHtml += '          </div>'
    theaterSelectPopHtml += '          <div class="btn2Area pd818 sol">'
    theaterSelectPopHtml += '              <a href="#" class="btn2 h56 ra10 bc01">선택 완료</a>'
    theaterSelectPopHtml += '          </div>'
    theaterSelectPopHtml += '          <a href="#" class="btnNextday">나중에 할게요</a>'
    theaterSelectPopHtml += '      </div>'
    theaterSelectPopHtml += '   </div>'
    theaterSelectPopHtml += '   <div class="fixToolTip toTop" id="toastPop"></div>'
    theaterSelectPopHtml += '   <div class="layer-dimmed display-none"></div>'
    theaterSelectPopHtml += '   <div class="layer-popup-bt type2 display-none" id="locAccessPopup">'
    theaterSelectPopHtml += '       <div class="layer-cont n3">'
    theaterSelectPopHtml += '           <div class="mTitle">위치권한설정</div>'
    theaterSelectPopHtml += '           <div class="sText">현재위치에서 가장 가까운 극장으로 안내 해드릴게요.<br>가까운 극장은 위치서비스 사용 동의후 이용가능합니다.</div>'
    theaterSelectPopHtml += '           <div class="btn-group ty2"> <!--ty2 클래스 추가-->'
    theaterSelectPopHtml += '               <button type="button" class="button-bot ty2 purple" id="alertAgreeBtn" onclick="fn_locationAgreeClick()">동의</button>'
    theaterSelectPopHtml += '               <button class="btnTxt btnPass" id="byPassBtn">나중에할게요</button>'
    theaterSelectPopHtml += '           </div>'
    theaterSelectPopHtml += '       </div>'
    theaterSelectPopHtml += '   </div>'
    theaterSelectPopHtml += '   </div>'
    theaterSelectPopHtml += '</div>';

    $("#theaterChoiceWrap").html(theaterSelectPopHtml)
}