/**
 * 결제 공통
 */
$(document).ready(function() {

    // 신용/신용카드, 간편결제, 중앙패밀리 버튼 선택
    $('#credit-display button, #easy-display button, #joongangFamily-display button, #etc-display button').click(function(){

        if(!$('body').hasClass('no-scroll')){
            $('body').addClass('no-scroll');
        }

        if($(this).hasClass('disab')){
            AppHandler.Common.alert($(this).attr('data-text')+'는 사용할 수 없습니다.')
            return ;
        }

        var $id = $(this).parent('div').attr('id');     // 아이디
        var selectVal = $(this).attr('data-val');
        var selectTxt = $(this).attr('data-text');
        var selectType = $(this).attr('data-type');

        $('#'+$id +' button').each(function(){
            if(selectVal != $(this).attr('data-val') && $(this).hasClass('act')){
                $(this).removeClass('act');
            } else if(selectVal == $(this).attr('data-val') && !$(this).hasClass('act')){
                $(this).addClass('act');
            }
        });


        // 결제수단 안내문구 처리
        var payDcMeanCd = $(this).attr('paydcmeancd');
        $('#paymentInfo ul').each(function(idx){
            if($(this).attr('content-paydcmeancd') == payDcMeanCd && $(this).hasClass('display-none') && $(this).text().length > 0){
                $(this).removeClass('display-none');
            } else {
                $(this).addClass('display-none');
            }
        });

        // 신용/신용카드
        if($id == 'creditCard'){

            $('#selectPayMean').attr('data-val', selectVal);
            $('#selectPayMean').val(selectTxt);

            // 신용카드 셀렉트 박스 보여주도록
            if($('#divSelectPayMean').hasClass('display-none')){
                $('#divSelectPayMean').removeClass('display-none');

                if($('input:checkbox[name=rdo_card_select]:checked').length == 0){
                    $('#rdo_card_select_g').prop('checked', true);
                }
            }

            if($('#cardContent').hasClass('display-none')){
                $('#cardContent').removeClass('display-none');
            }

            if($('#divRdoCardSelect').hasClass('display-none')){
                $('#divRdoCardSelect').removeClass('display-none');
            }

            if($('#selectPayMean').hasClass('display-none')){
                $('#selectPayMean').removeClass('display-none')
            }

            $('#lastPayMethod').val('credit');

            // 신용카드 선택시 라디오버튼 기능
            if($('div.card-payment-type').length > 0){
                fn_creditCardRadio(selectVal, fn_getMenuCd());
            }

            fn_closePop('credit-display');

        } else {
             // 간편결제의 경우
             if($id == 'easyPay'){

                 if($('#cardContent').hasClass('display-none')){
                     $('#cardContent').removeClass('display-none');
                 }
                 // 신용카드 셀렉트 박스 보여주도록
                 if($('#divSelectPayMean').hasClass('display-none')){
                     $('#divSelectPayMean').removeClass('display-none');
                 }
                 if($('#selectPayMean').hasClass('display-none')){
                     $('#selectPayMean').removeClass('display-none')
                 }
                 if($('#paymentInfo').hasClass('display-none')){
                     $('#paymentInfo').removeClass('display-none')
                 }

                 if($('div.card-payment-type').length > 0){
                     if(!$('div.card-payment-type').hasClass('display-none')){
                         $('div.card-payment-type').addClass('display-none');
                     }
                 }

                 // 선택한 간편결제수단 셀렉트박스 처리
                 $('#selectPayMean').attr('data-val', selectVal);
                 $('#selectPayMean').val(selectTxt);

                 $('#lastPayMethod').val(selectVal);
                 fn_closePop('easy-display');
             } else if($id == 'etcPay') {
                 if($('#cardContent').hasClass('display-none')){
                     $('#cardContent').removeClass('display-none');
                 }
                 // 신용카드 셀렉트 박스 보여주도록
                 if($('#divSelectPayMean').hasClass('display-none')){
                     $('#divSelectPayMean').removeClass('display-none');
                 }
                 if($('#selectPayMean').hasClass('display-none')){
                     $('#selectPayMean').removeClass('display-none')
                 }
                 if($('#paymentInfo').hasClass('display-none')){
                     $('#paymentInfo').removeClass('display-none')
                 }

                 if($('div.card-payment-type').length > 0){
                     if(!$('div.card-payment-type').hasClass('display-none')){
                         $('div.card-payment-type').addClass('display-none');
                     }
                 }

                 // 선택한 계좌이체 셀렉트박스 처리
                 $('#selectPayMean').attr('data-val', selectVal);
                 $('#selectPayMean').val(selectTxt);

                 $('#lastPayMethod').val(selectVal);
                 fn_closePop('etc-display');
             } else {
                 fn_closePop('joongangFamily-display');
             }

             if(fn_getMenuCd() != 'store') {
                 fn_openPayPopup($(this));
             }
        }
    });
});

var objPopup;
var popInterval;

// kicc 결제창 인증
function fn_openKiccPop(popSrc){

    if(isApp()) {
        var param = {
            header: {
                type: 'default',
                bgColor: 'ffffff',
                txtColor: '000000',
                backAction: 'fn_kiccBackAction'
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

    var popupWidth = 440;
    var popupHeight = 900;
    var popupX = (window.screen.width / 2) - (popupWidth / 2);
    var popupY = (window.screen.height / 2) - (popupHeight / 2);

    objPopup = window.open('','popupForm','width=' + popupWidth +', height=' + popupHeight + ',left=' + popupX + ',top=' + popupY +', directories=no');
    var popupForm = document.popupForm;
    var url = popSrc;

    popupForm.action = url;
    popupForm.method = 'post';
    popupForm.target = 'popupForm';
    popupForm.submit();

}

// 뒤로가기 액션
function fn_kiccBackAction(){
    var param = {};
    unloadExecYn = "Y";

    if($('#payMainWrap').length > 0){   // 예매
        $('#payMainWrap').removeClass("display-none");

        param = {
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

        var lastPayMethod = $('#lastPayMethod').val();
        cancelMbxSellCpInfo(lastPayMethod);

        fn_btnEvent('error');

    } else if($('#boutiqPrivateWarp').length > 0){
        $('#boutiqPrivateWarp').removeClass("display-none");

        param = {
            header: {
                type: 'default',
                bgColor : '020715',
                txtColor : 'ffffff'
            },
            title: {
                type: 'text',
                text: '더 부티크 프라이빗',
            },
            btnLeft: {
                type: 'back',
                txtColor: 'ffffff'
            }
        };
    }

    if(isApp()) {
        AppHandler.Common.setHeader(param);
    }
}

function fn_closeKiccPopup(){
    if(objPopup) {
        objPopup.close();
    }
}

//팝업호출 이전상태로 초기화
function fn_initObjPop(){
    if(!isApp()){
        AppHandler.Common.stopLoadingBar();
    } else {
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

    $('#payMainWrap').removeClass("display-none");
    if($('#lastPayMethod').val() != ''){
    	cancelMbxSellCpInfo($('#lastPayMethod').val());
    }
    fn_btnEvent('error');
    fn_popIntervalClear();
}

function fn_popIntervalClear(){
    if(!isApp()){
        clearInterval(popInterval);
    }
}

// 신용카드 및 간편결제 인풋박스 선택시
function fn_layerPayPopup(menuCd){

    if(menuCd == 'bokd'){

        $('#paySelect div').each(function (){
            if($(this).hasClass('pays act')){

                if($(this).attr('data-type') == 'credit' || $(this).attr('data-type') == 'easy' || $(this).attr('data-type') == 'etc'){
                    $(this).trigger('click');
                    return false;
                }
            }

        });
    } else if (menuCd == 'morder') {

        $('#paySelect div').each(function (){
            if($(this).hasClass('pays act')){

                if($(this).attr('data-type') == 'credit' || $(this).attr('data-type') == 'easy' || $(this).attr('data-type') == 'etc'){
                    $(this).trigger('click');
                    return false;
                }
            }

        });
    } else if (menuCd == 'store') {

        $('#paySelect div').each(function (){
            if($(this).hasClass('pays act') || $(this).hasClass('pays oneBtn act')){

                if($(this).attr('data-type') == 'credit' || $(this).attr('data-type') == 'easy'){
                    $(this).trigger('click');
                    return false;
                }
            }

        });
    }
}


// 신용카드 선택시 라디오버튼 기능
function fn_creditCardRadio(selVal, menuCd){
    var isNotUseSpecial = selVal.indexOf("B")==0?true:false;	// B로 시작하는 카드는 즉시할인 영역을 보여주지 않는다.
    var favorCardDiv;

    if(selVal.indexOf("B")==0){
        // BC카드 계열 (우체국카드-B0, 토스  카드-B1, SC제일은행 비씨카드-B2, IBK기업은행 카드-B3)
        selVal = "01";
    } else if(selVal.indexOf("S")==0){
        // 삼성카드 계열 (SC제일은행 삼성카드-S0) %>
        selVal = "03";
    }

    if(selVal == '00'){
    $('#rdo_card_select_g_span').addClass("display-none");
        $('#rdo_card_select_n_span').addClass("display-none");
    } else {
        $('#rdo_card_select_g_span').removeClass("display-none");
        $('#rdo_card_select_n_span').removeClass("display-none");
    }

    /*if(selVal != '02' && !$('#rdo_card_select_s_span').hasClass('display-none')){
        $('#rdo_card_select_s_span').addClass("display-none");
    }*/

    //비씨, 신한, 삼성, 하나 선택시 %>
    if (selVal == "01" || selVal == "02"  || selVal == "03" ||  selVal == "27" || selVal == "23") {
        var selText = "";

        if (selVal == "01" || selVal == "23" || selVal == "02") {
            selText = "즉시할인"; //즉시할인
        } else if (selVal == "03") {
            selText = "포인트사용"; //포인트사용
        } else if (selVal == "27") {
            selText = "하나머니"; //하나머니
        }

        if (selVal == "01" || selVal == "03" || selVal == "23" || selVal == "27"){
            $('#rdo_card_select_s_span').removeClass("display-none");
        }

        // edu plan 신한카드 선할인
        if (selVal == "02" && chkShinhanPre){
            $('#rdo_card_select_e_span').removeClass("display-none");
        }

        if(selVal == "02" && chkShinhan){
            $('#rdo_card_select_m_span').removeClass("display-none");
        }

        if(selVal == "02" && !$('#rdo_card_select_s_span').hasClass('display-none')){
            $('#rdo_card_select_s_span').addClass("display-none");
        }

        if(selVal != "02" && !$('#rdo_card_select_e_span').hasClass('display-none')){
            $('#rdo_card_select_e_span').addClass("display-none");
        }

        if(selVal != "02" && !$('#rdo_card_select_m_span').hasClass('display-none')){
            $('#rdo_card_select_m_span').addClass("display-none");
        }

        $('#lab_sepecial_card').text(selText);

        // 신한 조조 가능일때만 보이도록
        if(selVal == "02" && !chkShinhan){
            favorCardDiv = "01";
        }

        if(menuCd != ''){
            $("#card_select").trigger("change");
        }

        $(':radio[name="rdo_card_select"][value="'+favorCardDiv+'"]').prop('checked', true);

        if(selVal == '01' || selVal == '23'){
            $('#rdo_card_select_s_span').removeClass("display-none");
            $('#lab_sepecial_card').text('즉시할인');
        }

        // BC카드 이외 B로 시작하는 카드는 즉시할인을 감추도록 한다
        if(isNotUseSpecial){
            $('#lab_sepecial_card').text('');
            $('#rdo_card_select_s_span').addClass("display-none");
        }

        // 스케쥴에 결제수단 제어기능있는 경우 선할인 불가(신한 선할인 추가)
        if($('#payPolicCtrl').val() == 'Y' && (selVal == '01' || selVal == '23')){
            if(!$('#rdo_card_select_s_span').hasClass('display-none')){
                $('#rdo_card_select_s_span').addClass("display-none");
            }
            if(!$('#rdo_card_select_m_span').hasClass('display-none')){
                $('#rdo_card_select_m_span').addClass("display-none");
            }
            if(!$('#rdo_card_select_e_span').hasClass('display-none')){
                $('#rdo_card_select_e_span').addClass("display-none");
            }
        } else {

            if(selVal == '02' && chkShinhan){
                $('#rdo_card_select_m_span').removeClass("display-none");
            }

            if(selVal == '02' && chkShinhanPre){
                $('#rdo_card_select_e_span').removeClass("display-none");
            }

            // $('#rdo_card_select_s_span').removeClass("display-none");
            // $('#lab_sepecial_card').text(selText);
        }



    } else {
        // 그 외 카드는 3번째 항목을 보여주지 않는다
        $('#lab_sepecial_card').text('');
        $('#rdo_card_select_s_span').addClass("display-none");


        if (!$('#rdo_card_select_m_span').hasClass("display-none")) {
            $('#rdo_card_select_m_span').addClass("display-none");
        }

        if (!$('#rdo_card_select_e_span').hasClass("display-none")) {
            $('#rdo_card_select_e_span').addClass("display-none");
        }

    }

    //국민, 신한, 삼성, 롯데, 농협, 현대, 씨티, 우리, 하나, 카카오뱅크 선택시 %>
    if ( selVal == '07' || selVal == '02' || selVal == '03' || selVal == '05' || selVal == '12'
        || selVal == '04' ||selVal == '13' ||selVal == '14' || selVal == '27' || selVal == '90'){
        $('#label_pay').text('앱카드'); //앱카드
    } else { //비씨, 우체국, MG새마을금고, 기업은행, KDB산업은행, 제주, 수협, 전북, 광주, 신협, 케이뱅크 선택시 %>
        $('#label_pay').text('ISP'); //ISP
    }

    // BC카드 이외 B로 시작하는 카드는 즉시할인을 감추도록 한다
    if(isNotUseSpecial || (selVal == "01" || selVal == "02" || selVal == "23") && cardControl){
        //$('#lab_sepecial_card').text('');
        $('#rdo_card_select_s_span').addClass("display-none");

        if(!$('#rdo_card_select_m_span').hasClass("display-none")){
            $('#rdo_card_select_m_span').addClass("display-none");
        }
    }

    // 항목 변경 시 첫번째 항목 선택처리
    $(':radio[name="rdo_card_select"]:input[value="01"]').prop('checked', true);

    // 선택된 결제수단 값
    $('#paySelect div.pays').each(function(){
        if($(this).hasClass('act')){
            payButtonType = $(this).attr('data-type');

            if(menuCd != ''){
                $(this).trigger('click');
            }
        }
    });

    // 예매에서 2번 호출되서 주석처리
    if(menuCd == 'morder') {
        savePaymentSelect();
    } /*else if(menuCd == 'bokd') {
        fn_savePaymentSelect();
    }*/
}

function fn_savePaymentSelect() {
    if(nonMb == 'Y') {
        // 신한 조조
        if($("#card_select option:selected").val() == '02' && $(':radio[name="rdo_card_select"]:checked').val() == '03'){
            if($('#ShinhanContent').hasClass("display-none")) {
                $('#ShinhanContent').removeClass("display-none");
            }
        } else {
            if(!$('#ShinhanContent').hasClass("display-none")) {
                $('#ShinhanContent').addClass("display-none");
            }
        }

        return;
    }

    if ($("#prepareFavorYn").val() == "Y") {  //최초 세팅시는 제외
        //메가박스만 대상
        var use_payment = $("#lastPayMethod").val();

        var favorPayMeanCd;
        var favorCardcmCd;
        var favorCardDiv;

        favorPayMeanCd = use_payment;
        if (use_payment == 'credit') {
            var selectCard  = $("#selectPayMean").attr('data-val');			// 선택한 카드 코드
            var selSpCard   = $(':radio[name="rdo_card_select"]:checked').val(); // IPS or 일반결재 여부

            favorCardcmCd = selectCard;
            favorCardDiv  = selSpCard;
        }

        switch (favorPayMeanCd){ // 결제 수단 - 신용/체크, 휴대폰, 카카오페이, 페이코 %>
            case "mobile" :
                favorPayMeanCd = "FPM02";
                break;
            case "kakaopay" :
                favorPayMeanCd = "FPM03";
                break;
            // case "payco" :
            //     favorPayMeanCd = "FPM04";
            //     break;
            case "credit" :
                favorPayMeanCd = "FPM01";
                break;
            case "naverpay" :
                favorPayMeanCd = "FPM05";
                break;
            case "settlebank" :
                favorPayMeanCd = "FPM07";
                break;
            case "tosspay" :
                favorPayMeanCd = "FPM08";
                break;
            case "kbpay" :
                favorPayMeanCd = "FPM09";
                break;
            case "joongangpay" :
                favorPayMeanCd = "FPM10";
                break;
            default :
                favorPayMeanCd = "";
        }

        var paramData  = {favorPayMeanCd:favorPayMeanCd, favorCardcmCd:favorCardcmCd, favorCardDiv:favorCardDiv};

        $.ajax({
            url: "/megaEv/on/oe/oez/PayBooking/saveFavorPayMean.do",
            type: "POST",
            contentType: "application/json;charset=UTF-8",
            dataType: "json",
            async : false,  //선점 완료 후 나가기
            data: JSON.stringify(paramData),
            success: function (data, textStatus, jqXHR) {
                if (!msgBookingLoginChk(data)) {
                    return;
                }
            },
            error: function(xhr,status,error){
                var err = JSON.parse(xhr.responseText);
                errBookingChk(err.msg);
            }
        });
    }
}

function fn_closePop(id, chk){

    if(!$('#banner_layer').hasClass('display-none')){
        $('#banner_layer').addClass('display-none');
    }
    if(!$('#'+id).hasClass('display-none')){
        $('#'+id).addClass('display-none');

        if(chk){
            var $id = id.split('-')[0];
            if($id == 'credit'){
                $('#selectPayMean').attr('placeholder', '카드를 선택해주세요!');
            } else if ($id == 'easy'){
                $('#selectPayMean').attr('placeholder', '간편결제 수단을 선택해주세요!');
            } else if ($id == 'etc'){
                $('#selectPayMean').attr('placeholder', '기타결제 수단을 선택해주세요!');
            }

            if($('#selectPayMean').hasClass('display-none')){
                $('#selectPayMean').removeClass('display-none');
            }
            if($('#divSelectPayMean').hasClass('display-none')){
                $('#divSelectPayMean').removeClass('display-none');
            }
            if(!$('#divRdoCardSelect').hasClass('display-none')){
                $('#divRdoCardSelect').addClass('display-none');
            }
            $('#selectPayMean').attr('data-val', '');
            $('#selectPayMean').val('');
            $('#lastPayMethod').val('');
        }
    }

    if($('body').hasClass('no-scroll')) {
        $('body').removeClass('no-scroll');
    }
    if(fn_getMenuCd() != 'store') {
        fn_savePaymentSelect();
    }
}