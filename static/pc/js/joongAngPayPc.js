/**
 * 중앙페이 JS로딩
 */
var url = location.pathname;

$(document).ready(function() {
	if(url.indexOf('privatebooking') > -1) {
		fn_privateJoongAngPayList();

		// 셀렉트 이벤트
		$("#joongAngPay").on("change", function() {
			$('#JAPayMethodTypeCode').val($(this).find("option:selected").attr('mTyCd'));
			$('#JAPayMethodDetailCode').val($(this).find("option:selected").attr('mDtCd'));
			$('#JAEasypayVirtualNo').val($(this).find("option:selected").attr('vrNo'));
			$('#lastPayMethod').val("joongangpay");
		});

	}else if(url.indexOf('booking') > -1 || url.indexOf('completeSeat') > -1){
		fn_joongAngPayList();
	}else{
		//fn_joongAngPayList();
	}

});

/**
 * 중앙페이 조회(private)
 */
function fn_privateJoongAngPayList(){
	$.ajax({
        url: "/on/oh/ohz/PayEasyPay/joongAngPayList.do",
        type: "POST",
        contentType: "application/json;charset=UTF-8",
        dataType: "json",
        data: null,
        success: function (data, textStatus, jqXHR) {

        	var joongAngPay = data.joongAngPay;
        	var listHtml = '';

        	$('#joongAngPayDiv').hide();
        	$('#joongAngPayDivNo').hide();

        	// 로그인
        	if(joongAngPay != ""){
        		var joongAngPayStat = data.joongAngPay.joongAngPayStat;
        		var joongAngPayList = data.joongAngPay.joongAngPayList;

        		// 로그인
        		$('#btnMng').show();
        		$('#btnMng').attr('onclick','fn_joongAngPayMng();');

        		if(joongAngPayStat == "Y"){
        			// 중앙페이 결제수단 존재
        			if(joongAngPayList != null){
        				$('#joongAngPayDiv').show();
        				$('#joongAngPay').empty();
        				$.each(joongAngPayList, function(i, param){
        					var mTyCd = param.payMethodTypeCode;
        					var mDtCd = param.payMethodDetailCode;
        					var vrNo = param.easypayVirtualNo;

            				// maskingNo 앞 6자리가 532750면 토스카드로 판단
            				if(param.maskingNo.substring(0,6) == "532750"){
            					param.displayName = "토스";
            				}

        					if(mTyCd == '11'){
        						listHtml += '<option value="joongangpay" mTyCd="'+mTyCd+'" mDtCd="'+mDtCd+'" vrNo="'+vrNo+'">'+param.displayName+'카드('+param.maskingNo.cardFormat()+')</option>';
        					}else{
        						listHtml += '<option value="joongangpay" mTyCd="'+mTyCd+'" mDtCd="'+mDtCd+'" vrNo="'+vrNo+'">'+param.displayName+'('+param.maskingNo+')</option>';
        					}
        				});
        				$('#joongAngPay').append(listHtml);
        				// 자동세팅
        				$('#joongAngPay').change();
        				$('#terms').removeClass('display-none');
        			}else{
        				// 중앙페이 가입되었지만 수단이 미 등록
            			$('#joongAngPayDiv').hide();
            			$('#joongAngPayDivNo').attr('onclick','fn_joongAngPayLink(\'PREG\');');
            			$('#joongAngPayDivNo').show();
        			}
        		}else{
        			// 중앙페이 미 가입자
        			$('#joongAngPayDiv').hide();
        			$('#joongAngPayDivNo').attr('onclick','fn_kiccJoinAgree();');
        			$('#joongAngPayDivNo').show();
        		}
        	}else{
    			// 비 로그인
    			$('#btnMng').show();
    			$('#btnMng').attr('onclick','gfn_alertMsgBox("로그인 후 이용 가능합니다.");');
    			$('#joongAngPay').hide();
    			$('#joongAngPayDivNo').attr('onclick','gfn_alertMsgBox("로그인 후 등록 가능합니다.");');
    			$('#joongAngPayDivNo').show();
        	}
        },
        error: function(xhr,status,error){
        	var err = JSON.parse(xhr.responseText);
        	errBookingChk(err.msg);
        }
	});
}

/**
 * 중앙페이 조회
 */
function fn_joongAngPayList(){

	$.ajax({
        url: "/on/oh/ohz/PayEasyPay/joongAngPayList.do",
        type: "POST",
        contentType: "application/json;charset=UTF-8",
        dataType: "json",
        data: null,
        success: function (data, textStatus, jqXHR) {

        	var joongAngPayStat = data.joongAngPay.joongAngPayStat;
        	var joongAngPayList = data.joongAngPay.joongAngPayList;
        	var listHtml = '';
        	$('#joongAngPayList').empty();

        	if($('#joongAngPayList').hasClass('nullAdd')){
        		$('#joongAngPayList').removeClass();
        		$('#joongAngPayList').addClass('cardBox swiper-container');
        	}

        	if(joongAngPayStat == "Y"){

        		// 중앙페이 결제수단 존재
        		if(joongAngPayList != null){

        			$('#btnMng').show();
        			$('#btnMng').attr('onclick','fn_joongAngPayMng();');

        			listHtml += '<div class="swiper-wrapper">';
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

        				listHtml += '<div class="swiper-slide card c'+cardCss+''+ act+'" onclick="fn_joongAngPayClick(this);" mTyCd="'+mTyCd+'" mDtCd="'+mDtCd+'" vrNo="'+vrNo+'">';
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
        			listHtml += '<div class="swiper-slide card none" onclick="fn_joongAngPayLink(\'PREG\');">카드 추가하기</div>';
        			listHtml += '</div>';
        			$('#joongAngPayList').removeClass('none');
        			$('#joongAngPayList').attr('onclick','');
        			$('#joongAngPayList').append(listHtml);

        			var cardBox = new Swiper("#joongAngPayList", {
        				slidesPerView: 'auto',
        				centeredSlides: false,
        				spaceBetween: 20,
        				freeMode: true
        			});

        		}else{
        			// 중앙페이 가입되었지만 수단이 미 등록
        			$('#btnMng').hide();
        			$('#joongAngPayList').removeClass();
        			$('#joongAngPayList').addClass('nullAdd');
        			$('#joongAngPayList').html('자주사용하는 카드 등록하고<br> 더욱 빠르게 결제하세요!');
        			$('#joongAngPayList').attr('onclick','fn_joongAngPayLink(\'PREG\');');
        		}
        	}else{
        		// 중앙페이 미 가입자
        		$('#btnMng').hide();
    			$('#joongAngPayList').removeClass();
    			$('#joongAngPayList').addClass('nullAdd');
    			$('#joongAngPayList').html('자주사용하는 카드 등록하고<br> 더욱 빠르게 결제하세요!');
        		$('#joongAngPayList').attr('onclick','fn_kiccJoinAgree();');
        	}
        },
        error: function(xhr,status,error){
        	var err = JSON.parse(xhr.responseText);
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
		$('#selectPayMean').addClass('display-none');
	}else{
		$('.joongPay').addClass('act');
		$('div.pays').removeClass('act');
	}

	// 선택된 카드만 act
	$('.card').removeClass('act');

	if(typeof data != 'undefined'){
		data.className += ' act';
		$('#JAPayMethodTypeCode').val(data.attributes.mtycd.value);
		$('#JAPayMethodDetailCode').val(data.attributes.mdtcd.value);
		$('#JAEasypayVirtualNo').val(data.attributes.vrNo.value);
	}

	$('#credit-display').addClass('display-none');
	$('#easy-display').addClass('display-none');
	$('#paymentInfo ul').each(function(){
		$(this).addClass('display-none');
	});

	$('#terms').show();

	if(url.indexOf('store') > -1) {
		$("#lastPayMeanExpoNm").text("JoongAng PAY");
	}else{
		$('.receipt .cont .ltrtBox').eq(2).find('.last .rt').text("JoongAng PAY");
		parent.calcFrameHeight($('#bokdMPayBooking', parent.document), $('#framePayBooking', parent.document));
	}

	$('#lastPayMethod').val("joongangpay");
	savePaymentSelect();
}

function fn_openJAPayPop(popSrc, arg){

	var popupWidth = 440;
    var popupHeight = 900;
    var popupX = (window.screen.width / 2) - (popupWidth / 2);
    var popupY = (window.screen.height / 2) - (popupHeight / 2);

    objPopup = window.open(popSrc,'japay_pop','width=' + popupWidth +', height=' + popupHeight + ',left=' + popupX + ',top=' + popupY+', directories=no');

    // 빈 화면 처럼 보여주기
    wrapWindowByMask();

	//주기적으로 팝업존재여부를 확인해서 close이면 모달제거 및 초기화
	popInterval = setInterval(function(){
		if(typeof(objPopup) === 'undefined' || (objPopup && objPopup.closed)){	//typeof : 선언하지 않았거나 초기화하지 않았으면 undefined
			// 오픈한 페이지에 따른 분기
            if(url.indexOf('store') > -1) {
            	initObjPop();
        	} else if(url.indexOf('privatebooking') > -1){
        		clearInterval(popInterval);
        	} else if(url.indexOf('booking') > -1 || url.indexOf('completeSeat') > -1){
        		initObjPop();
        	}

            if(arg != "PAY"){
            	if(url.indexOf('privatebooking') > -1) {
            		fn_privateJoongAngPayList();
            	}else{
            		fn_joongAngPayList();
            	}
            }
		}
	}, 500);
}

function fn_closePay(resultData){
	// 오픈한 페이지에 따른 분기
    if(url.indexOf('store') > -1) {
    	initObjPop();
    	fn_joongAngPayList();
	} else if(url.indexOf('privatebooking') > -1){
		clearInterval(popInterval);
		fn_privateJoongAngPayList();
	} else if(url.indexOf('booking') > -1 || url.indexOf('completeSeat') > -1){
		initObjPop();
		fn_joongAngPayList();
	} else{
		return;
	}
    if(resultData.resCd != '0000' && resultData.Msg != ''){
		gfn_alertMsgBox(resultData.Msg);
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
			gfn_alertMsgBox("중앙페이 사용을 위해 개인정보 제 3자 제공 동의를 체크해주세요.");
			return;
		}
		// 최초 가입시 동의 받은 팝업을 지워주고 창을 오픈
		fn_closeKiccJoinAgree();
		url = "/on/oh/ohz/PayEasyPay/userCertReg.do?arg="+arg;
	}else if(arg == "PREG"){
		url = "/on/oh/ohz/PayEasyPay/mngManagement.do?arg="+arg;
	}else{
		url = "/on/oh/ohz/PayEasyPay/passwordModification.do?arg="+arg;
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

	if(easypayVirtualNo == ""){
		gfn_alertMsgBox("중앙페이로 결제하려면 카드 또는 계좌등록이 필요합니다.");
		return;
	}

	// 각 화면에 따른 SET :  BOKD / MORDER / BOUTQ / STORE
	if(payMenuCd == "BOKD"){
		var useAmt = parseInt($('.receipt .row.total span').text().replaceAll(',', ''));
		var url = "/on/oh/ohz/PayEasyPay/bokdPaymentAuthReg.do?transNo="+transNo+"&payMethodTypeCode="+payMethodTypeCode+"&payMethodDetailCode="+payMethodDetailCode;
		url+="&payMenuCd="+payMenuCd+"&easypayVirtualNo="+easypayVirtualNo+"&methodName="+methodName+"&useAmt="+useAmt+"&amount="+useAmt+"&cashYn="+cashYn;
	} else if(payMenuCd == "BOUTQ") {
		var useAmt   = $('.total').find('em').text().replaceAll(',', '').nvlNum(0);
		var url = "/on/oh/ohz/PayEasyPay/boutqPaymentAuthReg.do?transNo="+transNo+"&payMethodTypeCode="+payMethodTypeCode+"&payMethodDetailCode="+payMethodDetailCode;
		url+="&payMenuCd="+payMenuCd+"&easypayVirtualNo="+easypayVirtualNo+"&methodName="+methodName+"&useAmt="+useAmt+"&amount="+useAmt+"&cashYn="+cashYn;
	} else if(payMenuCd == "STORE") {
		var useAmt =$("#lstPayAmtView").text().replaceAll(',', '');
		var url = "/on/oh/ohz/PayEasyPay/storePaymentAuthReg.do?transNo="+transNo+"&payMethodTypeCode="+payMethodTypeCode+"&payMethodDetailCode="+payMethodDetailCode;
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
	// 페이지 오픈전 조회
	fn_joongAngPayMngList();
	// 오픈한 페이지에 따른 분기
	if(url.indexOf('privatebooking') > -1){
		$('#div_href a').attr('href', '#layer_joongAngPayMng').attr('id', 'open_layer_joongAngPayMng');
		$("#open_layer_joongAngPayMng").trigger("click");
	}else{ // 예매/스토어
		$('#layer_joongAngPayMng .wrap').css('width', '600');
		$modal('layer_joongAngPayMng');
	}
}

//최초가입 시 동의 팝업
function fn_kiccJoinAgree(){

	// 삭제 후 다시 그린다.
	$('#kiccAgreeDisplay').remove();
	var domHtml = '';

	domHtml += '<section id="kiccAgreeDisplay" class="modal-layer">';
	domHtml += '	<div class="wrap">';
	domHtml += '		<header class="layer-header">';
	domHtml += '			<h3 class="tit">중앙페이 제 3자 제공 동의</h3>';
	domHtml += '		</header>';
	domHtml += '		<div class="layer-con">';
	domHtml += '			<div class="chkIn all">';
	domHtml += '		    	<div class="chkTy01">';
	domHtml += '		        	<input type="checkbox" id="kiccAgree"><label for="kiccAgree" style="padding-left:8px">개인정보 제3자 제공 동의 [필수]</label>';
	domHtml += '		      	</div>';
	domHtml += '		    </div>';
	domHtml += '			<ul class="chkList" style="padding-top:15px;">';
	domHtml += '				<li>1. 제공받는 자 : 한국정보통신 주식회사</li>';
	domHtml += '			    <li>2. 제공목적 : 중앙페이 통한 결제 처리 및 운영</li>';
	domHtml += '			    <li>3. 제공하는 개인정보 항목 : CI, 메가박스 회원번호</li>';
	domHtml += '			    <li>4. 제공받는 자의 보유 및 이용기간 : 개인정보 이용목적 달성 시까지 보존합니다. 단, 관계 법령의 규정에 의하여 일정 기간 보존이 필요한 경우에는 해당 기간만큼 보관 후 삭제합니다.</li>';
	domHtml += '			    <li>※개인정보 제 3자 제공에 동의를 거부하실 권리가 있습니다. 다만, 동의 거부 시 중앙페이 서비스를 이용하실 수 없습니다.</li>';
	domHtml += '			</ul>';
	domHtml += '			<div class="btn-group-fixed">';
	domHtml += '				<button type="button" class="btn-modal-close" id="btn_close_modal_kiccAgreeDisplay"></button>';
	domHtml += '				<button type="button" class="button small close-layer">취소</button>';
	domHtml += '				<button type="button" class="button small purple" onclick="fn_joongAngPayLink(\'PNEW\')">확인</button>';
	domHtml += '			</div>';
	domHtml += '		</div>';
	domHtml += '	</div">';
	domHtml += '</section">';
	$('#layer_joongAngPayMng').after(domHtml);

	$('#kiccAgreeDisplay .wrap').css('width', '600');
	$modal('kiccAgreeDisplay');
	$('#kiccAgreeDisplay .wrap').css('top', '40%');

}
// 동의 팝업 닫기
function fn_closeKiccJoinAgree(){
	$("#btn_close_modal_kiccAgreeDisplay").trigger("click");
}