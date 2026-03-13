/**
 * 중앙페이 JS로딩
 */
$(document).ready(function() {
	fn_joongAngPayList();
});

var url = location.pathname;

/**
 * 중앙페이 조회
 */
function fn_joongAngPayList(){

	$.ajax({
        url: "/megaEv/on/oe/oez/PayEasyPay/joongAngPayList.do",
        type: "POST",
        contentType: "application/json;charset=UTF-8",
        dataType: "json",
        data: null,
        success: function (data, textStatus, jqXHR) {

        	var joongAngPayStat = data.joongAngPay.joongAngPayStat;
        	var joongAngPayList = data.joongAngPay.joongAngPayList;
        	var listHtml = '';
        	$('#joongAngPayList').empty();

        	// 비 로그인
        	if(data.joongAngPay == ""){
        		// 중앙페이 미 가입자
        		$('#btnMng').hide();
        		$('#joongAngPayList').addClass('none');
        		$('#joongAngPayList').attr('onclick', 'AppHandler.Common.alert("로그인 후 사용가능합니다.")');

    			// 등록된 카드가 없지만. 이전 결제수단이 중앙페이 였다면.
    			if($('#payTxt').text() == "JoongAng PAY"){
                    $('div[data-type="credit"]').addClass("act");
                    $('#payTxt').text("신용/체크카드");
                    $('#selectPayMean').attr('placeholder', '카드를 선택하세요!');
                    $('#lastPayMethod').val('credit');
                    $('#rdo_card_select_g_span').addClass("display-none");
                    $('#rdo_card_select_n_span').addClass("display-none");
    			}
    			return;
        	}

        	if(joongAngPayStat == "Y"){

        		// 중앙페이 가입자
        		// 중앙페이 결제수단 존재
        		if(joongAngPayList != null){
        			$('#btnMng').show();
        			$('#btnMng').attr('onclick','fn_joongAngPayMng();');
        			$.each(joongAngPayList, function(i, param){
        				var act = "";
        				var mTyCd = param.payMethodTypeCode;
        				var mDtCd = param.payMethodDetailCode;
        				var vrNo = param.easypayVirtualNo;
        				if(i == 0){
        					act = " act";
        				}
        				var cardCss = mTyCd+"_"+mDtCd;

        				// maskingNo 앞 6자리가 532750면 토스카드로 판단
        				if(param.maskingNo.substring(0,6) == "532750"){
        					cardCss = "11_099"
        					param.displayName = "토스";
        				}

        				listHtml += '<div class="card c'+cardCss+''+ act+'" onclick="fn_joongAngPayClick(this);" mTyCd="'+mTyCd+'" mDtCd="'+mDtCd+'" vrNo="'+vrNo+'">';
        				listHtml += '	<dl>';
        				if(mTyCd == '11'){
        					listHtml += '    	<dd class="name">'+param.displayName+'카드</dd>';
        					listHtml += '    	<dd class="numb">'+param.maskingNo.cardFormat()+'</dd>';
        				}else{
        					listHtml += '    	<dd class="name">'+param.displayName+'</dd>';
        					listHtml += '    	<dd class="numb">'+param.maskingNo+'</dd>';
        				}
        				listHtml += '	</dl>';
        				listHtml += '</div>';
        			});
        			listHtml += '<div class="card none" onclick="fn_joongAngPayLink(\'PREG\');">카드 추가하기</div>';
        			$('#joongAngPayList').removeClass('none');
        			$('#joongAngPayList').attr('onclick','');
        			$('#joongAngPayList').append(listHtml);

        			// 이전 결제수단이 중앙페이 였다면.
        			if($('#payTxt').text() == "JoongAng PAY"){
        				fn_joongAngPayClick($(".card ")[0]);
        			}

        		}else{
        			// 중앙페이 가입되었지만 수단이 미 등록
        			$('#btnMng').hide();
        			$('#joongAngPayList').addClass('none');
        			$('#joongAngPayList').attr('onclick','fn_joongAngPayLink(\'PREG\');');

        			// 등록된 카드가 없지만. 이전 결제수단이 중앙페이 였다면.
        			if($('#payTxt').text() == "JoongAng PAY"){
        				$('.joongPay').removeClass('act');
        				$('.joongPay').addClass('none');
        				$('#terms').addClass('display-none');
                        $('div[data-type="credit"]').addClass("act");
                        $('#payTxt').text("신용/체크카드");
                        $('#selectPayMean').attr('placeholder', '카드를 선택하세요!');
                        $('#lastPayMethod').val('credit');
                        $('#rdo_card_select_g_span').addClass("display-none");
                        $('#rdo_card_select_n_span').addClass("display-none");
        			}
        		}
        	}else{
        		// 중앙페이 미 가입자
        		$('#btnMng').hide();
        		$('#joongAngPayList').addClass('none');
        		$('#joongAngPayList').attr('onclick','fn_kiccJoinAgree();');

    			// 등록된 카드가 없지만. 이전 결제수단이 중앙페이 였다면.
    			if($('#payTxt').text() == "JoongAng PAY"){
                    $('div[data-type="credit"]').addClass("act");
                    $('#payTxt').text("신용/체크카드");
                    $('#selectPayMean').attr('placeholder', '카드를 선택하세요!');
                    $('#lastPayMethod').val('credit');
                    $('#rdo_card_select_g_span').addClass("display-none");
                    $('#rdo_card_select_n_span').addClass("display-none");
    			}
        	}

        },
        error: function(xhr,status,error){
        	var err = JSON.parse(xhr.responseText);
        	//err.statCd 에 따라서 이전화면으로 리턴 가능토록
        	errBookingChk(err.msg);
        }
	});
}

/**
 * 중앙페이 카드 선택
 */
function fn_joongAngPayClick(data) {

	if($('.joongPay').hasClass('disab')){
		return;
	}
	// 중앙페이 백그라운드 색상 변경
	if($('.joongPay').hasClass('none')){
		$('.joongPay').removeClass('none');
	}

	if(url.indexOf('privatebooking') > -1) {
		$('.joongPay').addClass('actp');
		$('#payDcMeanSelect button').removeClass('on');
		$('#creditContent').addClass('display-none');
		$('#cmbndContent').addClass('display-none');
		$('#terms').removeClass('display-none');
	}else{
		$('.joongPay').addClass('act');
		$('div.pays').removeClass('act');
		$('#divSelectPayMean').addClass('display-none');
		$('#divRdoCardSelect').addClass('display-none');
		$('#paymentInfo').addClass('display-none');
		$('#terms').removeClass('display-none');
		$('#terms').show();
	}

	// 선택된 카드만 act
	$('.card').removeClass('act');

	if(typeof data != 'undefined'){
		data.className += ' act';
		$('#JAPayMethodTypeCode').val(data.attributes.mtycd.value);
		$('#JAPayMethodDetailCode').val(data.attributes.mdtcd.value);
		$('#JAEasypayVirtualNo').val(data.attributes.vrNo.value);
	}

	$('#payTxt').text("JoongAng PAY");

	$('#lastPayMethod').val("joongangpay");
	fn_savePaymentSelect();
}

function fn_openJAPayPop(popSrc, arg){

    if(isApp()) {
    	var text;
    	var backAction = 'fn_kiccBackAction';
    	if(arg == 'PNEW'){
    		text = '중앙페이 가입';
    	} else if(arg == 'PREG'){
    		text = '중앙페이 등록';
    	} else if(arg == 'PPAS'){
    		text = '비밀번호 변경';
    	} else{
    		text = '결제하기';
    	}

    	if(url.indexOf('mobile-order') > -1 || url.indexOf('store') > -1){
    		backAction = 'initObjPop';
    	}

        var param = {
            header: {
                type: 'default',
                bgColor: 'ffffff',
                txtColor: '000000',
                backAction: backAction
            },
            title: {
                type: 'text',
                text: text
            },
            btnLeft: {
                type: 'back',
                txtColor: '000000'
            }
        };
        AppHandler.Common.setHeader(param);
    }

	var popupWidth = 440;
    var popupHeight = 900;
    var popupX = (window.screen.width / 2) - (popupWidth / 2);
    var popupY = (window.screen.height / 2) - (popupHeight / 2);

    objPopup = window.open(popSrc,'japay_pop','width=' + popupWidth +', height=' + popupHeight + ',left=' + popupX + ',top=' + popupY+', directories=no');

    // 빈 화면 처럼 보여주기

    $('#payMainWrap').addClass("display-none");
    $('#boutiqPrivateWarp').addClass("display-none");

    if(!isApp()){
        AppHandler.Common.startLoadingBar();
        popInterval = setInterval(function(){
            if(typeof(objPopup) === 'undefined' || (objPopup && objPopup.closed)){	//typeof : 선언하지 않았거나 초기화하지 않았으면 undefined

            	// 오픈한 페이지에 따른 분기
                if(url.indexOf('store') > -1) {
                	initObjPop();
            	} else if(url.indexOf('privatebooking') > -1){
            		initObjPop();
            	} else if(url.indexOf('booking') > -1){
            		fn_initObjPop();
            	}

                if(arg != "PAY"){
            		fn_joongAngPayList();
                }
            }
        }, 500);
    }else{

	}
}

function fn_closePay(resultData){
	// 오픈한 페이지에 따른 분기
	fn_joongAngPayList();
	if(url.indexOf('store') > -1) {
    	initObjPop();
	} else if(url.indexOf('privatebooking') > -1){
		initObjPop();
	} else if(url.indexOf('booking') > -1){
		fn_initObjPop();
	} else if(url.indexOf('mobile-order') > -1){
		initObjPop();
	}else{
		return;
	}
	if(resultData.resCd != '0000' && resultData.Msg != ''){
		AppHandler.Common.alert(resultData.Msg);
	}
}

/**
 * 중앙페이 가입 및 카드 등록 호출
 */
function fn_joongAngPayLink(arg){
	if($('.joongPay').hasClass('disab')){
		return;
	}
	var url;
	if(arg == "PNEW"){
		if(!$('#kiccAgree').prop('checked')){
			AppHandler.Common.alert("중앙페이 사용을 위해 개인정보 제 3자 제공 동의를 체크해주세요.");
			return;
		}
		// 최초 가입시 동의 받은 팝업을 지워주고 창을 오픈
		fn_closeKiccJoinAgree();
		url = "/megaEv/on/oe/oez/PayEasyPay/userCertReg.do?popup=window&arg="+arg;
	}else if(arg == "PREG"){
		url = "/megaEv/on/oe/oez/PayEasyPay/mngManagement.do?popup=window&arg="+arg;
	}else{
		url = "/megaEv/on/oe/oez/PayEasyPay/passwordModification.do?popup=window&arg="+arg;
	}

	fn_openJAPayPop(url, arg);
}

/**
 * 중앙페이 거래인증 등록
 */
function fn_joongAngPayAuthReg(payMenuCd) {
	var methodName = $('#lastPayMethod').val();
	var transNo = $('#transNo').val();
	var payMethodTypeCode = $('#JAPayMethodTypeCode').val();
	var payMethodDetailCode = $('#JAPayMethodDetailCode').val();
	var easypayVirtualNo = $('#JAEasypayVirtualNo').val();
	var cashYn = 'N';

	if(easypayVirtualNo == ''){
		AppHandler.Common.alert('중앙페이로 결제하실 카드를 선택해주세요.');
		return;
	}

	// 각 화면에 따른 SET :  BOKD / MORDER / BOUTQ / STORE
	if(payMenuCd == "BOKD"){
		var useAmt = parseInt($("#pay_price").text().replaceAll(',', '').nvlNum(0));
		var url = "/megaEv/on/oe/oez/PayEasyPay/bokdPaymentAuthReg.do?popup=window&transNo="+transNo+"&payMethodTypeCode="+payMethodTypeCode+"&payMethodDetailCode="+payMethodDetailCode;
		url+="&payMenuCd="+payMenuCd+"&easypayVirtualNo="+easypayVirtualNo+"&methodName="+methodName+"&useAmt="+useAmt+"&amount="+useAmt+"&cashYn="+cashYn;
	} else if(payMenuCd == "MORDER") {
		var useAmt = $('#lastUseAmt').text().replaceAll(',', '').replaceAll('원', '').nvlNum(0);
		var url = "/megaEv/on/oe/oez/PayEasyPay/orderPaymentAuthReg.do?transNo="+transNo+"&payMethodTypeCode="+payMethodTypeCode+"&payMethodDetailCode="+payMethodDetailCode;
		url+="&payMenuCd="+payMenuCd+"&easypayVirtualNo="+easypayVirtualNo+"&methodName="+methodName+"&useAmt="+useAmt+"&amount="+useAmt+"&cashYn="+cashYn;
	} else if(payMenuCd == "BOUTQ") {
		var useAmt   = $('#price').text().replaceAll(',', '').nvlNum(0);
		var url = "/megaEv/on/oe/oez/PayEasyPay/boutqPaymentAuthReg.do?transNo="+transNo+"&payMethodTypeCode="+payMethodTypeCode+"&payMethodDetailCode="+payMethodDetailCode;
		url+="&payMenuCd="+payMenuCd+"&easypayVirtualNo="+easypayVirtualNo+"&methodName="+methodName+"&useAmt="+useAmt+"&amount="+useAmt+"&cashYn="+cashYn;
	} else if(payMenuCd == "STORE") {
		var useAmt = $("#lstPayAmtView").text().trim().replace(/[^0-9]/gi,"");
		var url = "/megaEv/on/oe/oez/PayEasyPay/storePaymentAuthReg.do?transNo="+transNo+"&payMethodTypeCode="+payMethodTypeCode+"&payMethodDetailCode="+payMethodDetailCode;
		url+="&payMenuCd="+payMenuCd+"&easypayVirtualNo="+easypayVirtualNo+"&methodName="+methodName+"&useAmt="+useAmt+"&amount="+useAmt+"&cashYn="+cashYn;
	} else{
		return;
	}

	fn_openJAPayPop(url, "PAY");
}

/**
 * 중앙페이 내부 관리 페이지 호출(팝업)
 */
function fn_joongAngPayMng(){
	if($('.joongPay').hasClass('disab')){
		return;
	}
	var param = {layerAt:'Y'};

    $.ajax({
        url: "/mypage/joongAngPayMng",
        type: "POST",
        data: JSON.stringify(param),
        contentType: "application/json;charset=UTF-8",
        success: function (data, status, xhr) {

        	if(isApp()) {
                var param = {
                    header: {
                        type: 'default',
                        closeAction: 'fn_mngClose'
                    },
                    title: {
                        type: 'text',
                        text: '중앙페이 결제수단 관리'
                    },
                    btnRight: {
                        type: 'close'
                    }
                };

                AppHandler.Common.setHeader(param);
                $("#headerSub").addClass('display-none');
                $("#jPayMngPopupWrap").css("padding-top","0px");
			}

        	// 오픈한 페이지에 따른 분기
            if(url.indexOf('store') > -1) {
            	$('#container').addClass(noneClass);
        	}else if(url.indexOf('privatebooking') > -1){
        		$('#boutiqPrivateWarp').addClass(noneClass);
        	}else{ // 예매/오더
        		$('#payMainWrap').addClass(noneClass);
        	}

            $('#jPayMngPopupWrap').html(data);
        },
        error: function(xhr,status,error){
        	var err = JSON.parse(xhr.responseText);
        	//err.statCd 에 따라서 이전화면으로 리턴 가능토록
        	errBookingChk(err.msg);
        }
	});
}

// 최초가입 시 동의 팝업
function fn_kiccJoinAgree(){

	// 오픈한 페이지에 따른 분기
    if(url.indexOf('store') > -1) {
    	$('#container').addClass(noneClass);
	}else if(url.indexOf('privatebooking') > -1){
		$('#boutiqPrivateWarp').addClass(noneClass);
	}else{ // 예매/오더
		$('#payMainWrap').addClass(noneClass);
	}

	// 삭제 후 다시 그린다.
	$('#kiccAgreeDisplay').remove();
	var domHtml = '';
	if(isApp()){
		domHtml += '<div class="container spoqahansansneo-normal" id="kiccAgreeDisplay" style="padding-top:0;">';
        var param = {
			header: {
				type: 'default',
				backAction: 'fn_closeKiccJoinAgree',
                bgColor: 'ffffff',
                txtColor: '000000'
			},
			title: {
				type: 'text',
				text: '중앙페이 제 3자 제공 동의'
			},
			btnLeft: {
                type: 'back',
                txtColor: '000000'
            }
        };
        AppHandler.Common.setHeader(param);
	}else{
		domHtml += '<div class="container spoqahansansneo-normal" id="kiccAgreeDisplay">';
		domHtml += '	<header id="headerSub">';
		domHtml += '		<a href="javaScript:fn_closeKiccJoinAgree()" class="h-back"><i class="iconset ico-back"></i></a>';
		domHtml += '		<h1 class="tit">중앙페이 제 3자 제공 동의</h1>';
		domHtml += '	</header>';
	}
	domHtml += '		<div class="innerWrap">';
	domHtml += '			<div class="chkIn all">';
	domHtml += '		    	<div class="chkTy01">';
	domHtml += '		        	<input type="checkbox" id="kiccAgree"><label for="kiccAgree" style="font-size:16px;">개인정보 제3자 제공 동의 [필수]</label>';
	domHtml += '		      	</div>';
	domHtml += '		    </div>';
	domHtml += '			<ul class="chkListA">';
	domHtml += '				<li>1. 제공받는 자 : 한국정보통신 주식회사</li>';
	domHtml += '			    <li>2. 제공목적 : 중앙페이 통한 결제 처리 및 운영</li>';
	domHtml += '			    <li>3. 제공하는 개인정보 항목 : CI, 메가박스 회원번호</li>';
	domHtml += '			    <li>4. 제공받는 자의 보유 및 이용기간 : 개인정보 이용목적 달성 시까지 보존합니다. 단, 관계 법령의 규정에 의하여 일정 기간 보존이 필요한 경우에는 해당 기간만큼 보관 후 삭제합니다.</li>';
	domHtml += '			    <li>※개인정보 제 3자 제공에 동의를 거부하실 권리가 있습니다. 다만, 동의 거부 시 중앙페이 서비스를 이용하실 수 없습니다.</li>';
	domHtml += '			</ul>';
	domHtml += '			<div class="btn-bottom payBtn">';
	domHtml += '				<button type="button" class="buttonBot" onclick="fn_closeKiccJoinAgree();">취소</button>';
	domHtml += '				<button type="button" class="buttonBot" onclick="fn_joongAngPayLink(\'PNEW\')">확인</button>';
	domHtml += '			</div>';
	domHtml += '		</div>';
	domHtml += '	</div">';
	domHtml += '</div">';
	$('#jPayMngPopupWrap').after(domHtml);
	$('#kiccAgreeDisplay').removeClass('display-none');
}

// 동의 팝업 닫기
function fn_closeKiccJoinAgree(){
	if(isApp()){
        var param = {
            header: {
                type: 'default',
                bgColor: 'ffffff',
                txtColor: '000000',
                backAction: 'fn_goSeat'
            },
            title: {
                type: 'text',
                text: '결제하기'
            },
            btnLeft: {
                type: 'back',
                txtColor: '000000'
            }
        };
        AppHandler.Common.setHeader(param);
	}
	// 오픈한 페이지에 따른 분기
    if(url.indexOf('store') > -1) {
    	$('#container').removeClass(noneClass);
	}else if(url.indexOf('privatebooking') > -1){
		$('#boutiqPrivateWarp').removeClass(noneClass);
	}else{ // 예매/오더
		$('#payMainWrap').removeClass(noneClass);
	}
    $('#kiccAgreeDisplay').remove();
}
