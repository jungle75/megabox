var mycardNumber = new cardNumber();
var friendsChgInfo = new Object();

var megaBoxFriends = {
    popupCd: '205004',
    list: [],

    /**
     * 초기 Set
     */
    fn_init: function() {
        this.fn_addEvent();
    },
    /**
     * 이벤트 추가
     */
    fn_addEvent: function() {
        mycardNumber.watcher('#friendsCardNum');

        mycardNumber.setUnmaskNumber("");

        $('#megaboxFriendsSearchBtn').on('click', function() {
            megaBoxFriends.fn_getList();
        });

        $('#friendsCardNum').val('');
        $('#jggEmpNo').val('');

        // 즐겨찾기  부모창 정보를 기준으로 즐찾 이미지 표시 후, 클릭 이벤트 등록 처리 %>
        var hasStar = $("li[payDcMeanCd='"+megaBoxFriends.popupCd+"']").find('span').hasClass("act");
        if(hasStar){
            $("#favorApplyBtn").addClass("on");
        }
        $("#favorApplyBtn").on('click', function() {
            fn_favorApply(megaBoxFriends.popupCd);
        });

        $('#friends_selDcCard').on('change',function(){
            // if(typeof $('#friends_selDcCard option:selected').attr('data') != 'undefined'){
                var cardNos = $('#friends_selDcCard option:selected').attr('data').split('-');
                $("#friends_cardNo3").val('');
                if(cardNos.length == 3){
                    $("#friends_cardNo4").hide();
                    $("#friends_cardNo1").val(cardNos[0]);
                    $("#friends_cardNo2").val(cardNos[1]);
                } else {
                    $("#friends_cardNo4").show();
                    $("#friends_cardNo1").val(cardNos[0]);
                    $("#friends_cardNo2").val(cardNos[1]);
                    $("#friends_cardNo4").val(cardNos[3]);
                }
            // }
        });

        // 임직원 선택여부
        $('#jggEmpAt').on('change', function(){
            if($(this).val() == 'Y'){
                $('#friends_selfEnterCardNo').addClass('display-none');
                $('#friends_jggEmpNo').removeClass('display-none');
            } else {
                $('#friends_jggEmpNo').addClass('display-none');
                $('#friends_selfEnterCardNo').removeClass('display-none');
            }
        });
    },
    /**
     * 조회
     */
    fn_getList: function() {

        // 임직원 선택여부
        var jggEmpAt = 'N';
        var cardNo = mycardNumber.getUnmaskNumber();

        //자주쓰는 할인 카드
        if($("#friends_favoCardTab").hasClass("on")) {
            if($("#friends_cardNo3").val() == "") {
                AppHandler.Common.alert('입력하신 카드번호가 맞는 지 확인해주세요.');
                $("#friends_cardNo3").focus();
                return;
            } else {
                cardNo = $("#friends_cardNo1").val() + $("#friends_cardNo2").val() + $("#friends_cardNo3").val() + $("#friends_cardNo4").val();
            }
        } else {
            jggEmpAt = $('#jggEmpAt option:selected').val();
            if( jggEmpAt == 'Y'){
                cardNo = $('#jggEmpNo').val();

                if (cardNo == '') {
                    AppHandler.Common.alert('임직원 사원번호를 입력해주세요.');
                    $("#jggEmpNo").focus();
                    return;
                }

            }
        }

        if (cardNo == '') {
            AppHandler.Common.alert('카드 번호를 입력하세요.');
            $("#friendsCardNum").focus();
            return;
        }

        megaBoxFriends.setInitFriends();

        var paramData = {
            transNo: $('#transNo').val(),
            cardNo: cardNo,
            jggEmpAt: jggEmpAt
        };

        $.ajax({
            url: "/on/oh/ohz/PayCombo/searchFriendsMemShip.do",
            type: "POST",
            contentType: "application/json;charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(paramData),
            success: function (data, textStatus, jqXHR) {

                if(data.statCd == '0'){
                    if(data.friendsInfo.useAbleAt == 'Y'){
                        var selecBox = data.friendsInfo.selecboxMap;
                        $('#selFriends01').html('<option value="0">'+ selecBox.diplayNm + '</option>');
                        friendsChgInfo.mmnyDcPolicNo = selecBox.mmnyDcPolicNo;
                        friendsChgInfo.frnsCardKindCd = selecBox.frnsCardKindCd;
                    }
                } else {
                    AppHandler.Common.alert(data.msg);
                }
            },
            error: function(xhr,status,error){
                var err = JSON.parse(xhr.responseText);
                AppHandler.Common.alert(err.msg);
            }
        });
    },
    /**
     * 적용
     */
    fn_apply: function() {

        var transNo    = $('#transNo').val();
        var cardNo     = mycardNumber.getUnmaskNumber();
        var personCnt  = $('#selFriends01 option:selected').val();
        var mmnyDcPolicNo = friendsChgInfo.mmnyDcPolicNo;
        var jggEmpAt   = 'N'

        //자주쓰는 할인 카드
        if($("#friends_favoCardTab").hasClass("on")) {
            if($("#friends_cardNo3").val() == "") {
                AppHandler.Common.alert('입력하신 카드번호가 맞는 지 확인해주세요.');
                $("#friends_cardNo3").focus();
                return;
            } else {
                cardNo = $("#friends_cardNo1").val() + $("#friends_cardNo2").val() + $("#friends_cardNo3").val() + $("#friends_cardNo4").val();
            }
        } else {
            jggEmpAt = $('#jggEmpAt option:selected').val();
            if(jggEmpAt == 'Y'){
                cardNo = $('#jggEmpNo').val();
            }
        }

        if (cardNo == '') {
            AppHandler.Common.alert('카드 번호를 입력하세요.');
            $("#friendsCardNum").focus();
            return;
        }

        if(cardNo.length != 12 && cardNo.length != 16 && jggEmpAt == 'N') {
            AppHandler.Common.alert('카드번호는 12자리 또는 16자리로 입력해 주세요.');
            $("#friendsCardNum").focus();
            return;
        }

        var paramData = { cardNo:cardNo,transNo:transNo, mmnyDcPolicNo:mmnyDcPolicNo, jggEmpAt:jggEmpAt };

        if(controlAction.isExec()) return; controlAction.on();

        $.ajax({
            url        : '/on/oh/ohz/PayCombo/applyFriendsMemShip.do',
            type       : 'POST',
            contentType: 'application/json;charset=UTF-8',
            dataType   : 'json',
            data       : JSON.stringify(paramData),
            success    : function (data, textStatus, jqXHR) {
                controlAction.off();

                if(data.statCd == '0'){
                    var useAmt = 0;
                    $.each(data.returnMap.policyList, function(i, item){
                        if(item.methodName == 'friends_coner'){
                            useAmt = item.applyAmt;
                        }
                    });

                    data.returnMap.payDcMeanCd = '205004';
                    data.returnMap.useAmt = useAmt;
                    fn_paymentAmtSet(data.returnMap);

                    fn_closePayPopup();
                }

            },
            error: function(xhr,status,error){
                controlAction.off();
                var err = JSON.parse(xhr.responseText);
                AppHandler.Common.alert(err.msg);
            }
        });
    },
    fn_tabSwitch : function(tabId, tabCheck) {

        //같은 탭 클릭
        if(!tabCheck) tabCheck = 'Y';
        if(tabCheck == 'Y' && $("#"+tabId+"Tab").hasClass("on")) {
            return;
        }

        $("a[data-type=tab]").removeClass("on");
        $("#"+tabId+"Tab").addClass("on");

        // 초기화
        megaBoxFriends.setInitFriends();

        //직접입력
        if(tabId == 'friends_selfEnter') {
            $("#friends_selfEnterCardNo").removeClass("display-none");

            $("#jggEmpAt").removeClass("display-none");
            if($("#friends_jggEmpNo").hasClass("display-none")){
                $("#friends_jggEmpNo").removeClass("display-none");
            }

            $("#friends_selfEnterFavoNoResult").addClass("display-none");
            $('#friends_selfRe').show();
            $("#friends_selfEnterFavoCardNo").addClass("display-none");
            $("#friendsCardNum").focus();

            if($('#jggEmpAt option:selected').val() == 'Y'){
                $('#friends_jggEmpNo').removeClass("display-none");
                $('#friends_selfEnterCardNo').addClass("display-none");
            } else {
                $('#friends_jggEmpNo').addClass("display-none");
                $('#friends_selfEnterCardNo').removeClass("display-none");
            }

            //$("#btnConfirm").removeClass("display-none");
        }
        //자주쓰는 할인 카드
        else if(tabId == 'friends_favoCard') {
            $("#friends_selfEnterCardNo").addClass("display-none");
            $("#jggEmpAt").addClass("display-none");
            if(!$("#friends_jggEmpNo").hasClass("display-none")){
                $("#friends_jggEmpNo").addClass("display-none");
            }

            if($('#friends_selDcCard')[0].length > 0) {
                $("#friends_selfEnterFavoNoResult").addClass("display-none");
                $('#friends_selfRe').show();
                $("#friends_selfEnterFavoCardNo").removeClass("display-none");
                $("#friends_cardNo3").focus();
                // $("#btnConfirm").removeClass("display-none");
            } else {
                $("#friends_selfEnterFavoNoResult").removeClass("display-none");
                $('#friends_selfRe').hide();
                $("#friends_selfEnterFavoCardNo").addClass("display-none");
                // $("#btnConfirm").addClass("display-none");
            }
        }

    },
    fn_favoCardList : function(autoReresh) {
        var paramData = { forwordView : 'false' };
        $.ajax({
            url: "/on/oh/ohh/PersonInfoMng/selectFavorUsePayDcMeanLa.do",
            type: "POST",
            contentType: "application/json;charset=UTF-8",
            data: JSON.stringify(paramData),
            success: function (data, textStatus, jqXHR) {

                //할인 카드 미동의
                if(data.policAgreeAt == "N") {
                    $("#friends_agreeText").text("서비스 이용동의 설정이 필요합니다.");
                    $("#friends_agreeButton").text("이용동의하기");
                    $("#friends_agreeButton").attr("button-type", "agree");
                }
                //할인 카드 동의
                else {
                    if (data.mbFavorPayMean.length > 0) {

                        // 기본으로 직접입력탭을 활성화
                        if(!$('#friends_selfEnterTab').hasClass('on')){
                            $('#friends_selfEnterTab').addClass('on');
                        }

                        $.each(data.mbFavorPayMean, function (i, item) {
                            if (item.payDcMeanCd == 'MCDM11' || item.payDcMeanCd == 'MCDM12') {
                                $('#friends_selDcCard').html('<option value="'+item.payDcMeanCd+'" data="'+item.cardNoFmt+'">'+item.payDcMeanNm+'</option>');

                                $("#friends_selDcCard").trigger("change");

                                if (autoReresh) {
                                    megaBoxFriends.fn_tabSwitch('friends_favoCard', 'N');
                                }
                            }
                        });

                    } else {
                        $("#friends_agreeText").text("등록된 할인카드가 없습니다.");
                        $("#friends_agreeButton").text("지금 등록하기");
                        $("#friends_agreeButton").attr("button-type", "register");
                    }
                }
            },
            error: function(xhr,status,error){
                var err = JSON.parse(xhr.responseText);
                AppHandler.Common.alert(err.message);
            }
        });
    },
    fn_favorCard: function() {
        if($("#friends_agreeButton").attr("button-type") == "register") {
            fn_favorCardRegister('205003');
        } else {
            fn_favorAgree('205003');
        }
    },
    setInitFriends : function () {
        $('#selFriends01').html('<option value="0">선택</option>');
    },
    fn_favorViewChange : function (autoReresh) {
        if(isApp()) {
            var param = {
                header: {
                    type: 'close',
                    closeAction: 'fn_closePayPopup',
                    backAction: 'fn_closePayPopup'
                },
                title: {
                    type: 'text',
                    text: '${BookingPay_msg17}'
                },
                btnRight: {
                    type: 'close'
                }
            };

            AppHandler.Common.setHeader(param);
        }

        $('#megaboxFriendsWrap').removeClass("display-none");
        $('#layerview').html('');
        megaBoxFriends.fn_favoCardList(autoReresh);
    }
};

function fn_favorCardRegister(payDcMeanCd) {
    var oData = {
        payDcMeanCd : 'PAYMI'
    };
    if(payDcMeanCd != '205003'){
        oData = {
            payDcMeanCd : 'MCDM13'
        };
    }

    if(controlAction.isExec()) return; controlAction.on();

    $.ajax({
        url: "/on/oh/ohz/PayCombo/card/dc/resigter",
        type: "POST",
        contentType: "application/json;charset=UTF-8",
        data: JSON.stringify(oData),
        success: function (data, status, xhr) {

            // megaBoxFriends.fn_init();
            // megaBoxFriends.fn_favoCardList(true);

            //fn_layerCls(payDcMeanCd);

            $('#layerview').html(data);

            $('#layerview').removeClass('display-none');

            // fn_setHeaderChng(payDcMeanCd);
            var cttsPaddingTop = isApp() ? "0px" : "55px";
            $(".store-popup").css({"top":"0px", "padding-top":cttsPaddingTop});
            $(".layer-dimmed, #layerview").fadeIn(200);

            if(!$('#layer205003').hasClass('display-none')){
                //$('#layer205003').addClass("display-none");
            } /*else if(){

                }*/
            //$('#layer205003').addClass("display-none");
            // $('div.layer-dimmed').css("display", "none");


            // if(isApp()) {


            var param = {
                header: {
                    type: 'default',
                    closeAction: 'favorUsePayDc.fn_close',
                    backAction: 'favorUsePayDc.fn_close'
                },
                title: {
                    type: 'text',
                    text: '할인카드 등록'
                },
                btnRight: {
                    type: 'close'
                }
            };
            AppHandler.Common.setHeader(param);
            $("#favorUsePayDc .bd-no").addClass('display-none');
            $("#favorView").css("padding-top", "0px");

            controlAction.lazyOff(500);
        },
        error: function(xhr, status, error){
            controlAction.off();
            var err = JSON.parse(xhr.responseText);
            AppHandler.Common.alert(err);
        }
    });
}
//구아너스카드 시작
var mycardNumberOld = new cardNumber();
var annusChgInfoOld = new Object();

var megaBoxAnnusOld = {
    popupCd: '103002',
    list: [],

    /**
     * 초기 Set
     */
    fn_init: function() {
        this.fn_addEvent();
    },
    /**
     * 이벤트 추가
     */
    fn_addEvent: function() {
        mycardNumberOld.watcher('#annusCardNumOld');

        mycardNumberOld.setUnmaskNumber("");

        $('#annusCardNumOld').val('');
        $('#selAnnusOld').html('<option value="0">선택</option>');
        $('#annusUseAbleAmtOld').text('0');


        $('#megaboxAnnusSearchBtnOld').on('click', function() {
            megaBoxAnnusOld.fn_getList();
        });

        // 즐겨찾기  부모창 정보를 기준으로 즐찾 이미지 표시 후, 클릭 이벤트 등록 처리
        var hasStar = $("li[payDcMeanCd='"+megaBoxAnnusOld.popupCd+"']").find('span').hasClass("act");
        if(hasStar){
            $("#favorApplyBtn").addClass("on");
        }
        $("#favorApplyBtn").on('click', function() {
            fn_favorApply(megaBoxAnnusOld.popupCd);
        });
    },
    /**
     * 조회
     */
    fn_getList: function() {
        var cardNo =  mycardNumberOld.getUnmaskNumber();

        //자주쓰는 할인 카드
        if($("#annus_favoCardTabOld").hasClass("on")) {
            if($("#annus_cardNo3Old").val() == "") {
                AppHandler.Common.alert('입력하신 카드번호가 맞는 지 확인해주세요.');
                $("#annus_cardNo3Old").focus();
                return;
            } else {
                cardNo = $("#annus_cardNo1Old").val() + $("#annus_cardNo2Old").val() + $("#annus_cardNo3Old").val() + $("#annus_cardNo4Old").val();
            }
        }

        if (cardNo == "" || cardNo.length < 10) {
            AppHandler.Common.alert('카드 번호를 입력하세요.');
            $("#annusCardNumOld").focus();
            return;
        }

        var paramData = { transNo: $('#transNo').val(), cardNo: cardNo };

        megaBoxAnnusOld.setInit();

        $.ajax({
            url: "/on/oh/ohz/PayCombo/searchAnnus.do",
            type: "POST",
            contentType: "application/json;charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(paramData),
            success: function (data, textStatus, jqXHR) {

                if(data.statCd == '0'){
                    annusChgInfoOld = data.annusInfo;
                    megaBoxAnnusOld.setAnnusChg(annusChgInfoOld);
                }

            },
            error: function(xhr,status,error){
                var err = JSON.parse(xhr.responseText);
                AppHandler.Common.alert(err.msg);
            }
        });
    },
    setAnnusChg: function(cponInfo) {
        var payAnnusAmt = cponInfo.payAnnusAmt;
        var annusText =  '<option value="'+payAnnusAmt+'" selected="selected">결제금액'+' (-'+String(payAnnusAmt).maskNumber()+')</option>';

        $('#annusUseAbleAmtOld').text(String(cponInfo.useAbleAmt).maskNumber());
        $('#selAnnusOld').html(annusText);
    },
    /**
     * 적용
     */
    fn_apply: function() {
        var transNo    = $('#transNo').val();
        var cardNo     = mycardNumberOld.getUnmaskNumber();
        var useAmt   = $('#selAnnusOld option:selected').val();

        //자주쓰는 할인 카드
        if($("#annus_favoCardTabOld").hasClass("on")) {
            if($("#annus_cardNo3Old").val() == "") {
                AppHandler.Common.alert('입력하신 카드번호가 맞는 지 확인해주세요.');
                $("#annus_cardNo3Old").focus();
                return;
            } else {
                cardNo = $("#annus_cardNo1Old").val() + $("#annus_cardNo2Old").val() + $("#annus_cardNo3Old").val() + $("#annus_cardNo4Old").val();
            }
        }

        if (cardNo == "" || cardNo.length < 10) {
            AppHandler.Common.alert('카드 번호를 입력하세요.');
            $("#annusCardNumOld").focus();
            return;
        }

        var paramData  = {transNo:transNo, cardNo:cardNo, useAmt:useAmt};
        if(controlAction.isExec()) return; controlAction.on();

        $.ajax({
            url        : '/on/oh/ohz/PayCombo/applyAnnus.do',
            type       : 'POST',
            contentType: 'application/json;charset=UTF-8',
            dataType   : 'json',
            data       : JSON.stringify(paramData),
            success    : function (data, textStatus, jqXHR) {
                controlAction.off();
                if(data.statCd == '0'){
                    // annusChgInfo = data.annusInfo;
                    // megaBoxAnnus.setAnnusChg(annusChgInfo);

                    /*var useAmt = 0;
                    $.each(data.returnMap.payExecList, function(i, item){
                        if(item.payDcMeanCd == '103002'){
                            useAmt = item.applyAmt;
                        }
                    });*/

                    data.returnMap.payDcMeanCd = '103002';
                    data.returnMap.useAmt = useAmt;
                    fn_paymentAmtSet(data.returnMap);

                    //$("#num_friends").text('-'+gfn_setComma(data.returnMap.useAmt));
                    fn_layerCls();
                }

                //할인내역 갱신
                //setMovieDcInfo(data.policyList);

                // 할인팝업닫기
                //fn_closePayPopup();
            },
            error: function(xhr,status,error){
                controlAction.off();
                var err = JSON.parse(xhr.responseText);
                AppHandler.Common.alert(err.msg);
            }
        });
    },
    fn_tabSwitch : function(tabId, tabCheck) {
        //같은 탭 클릭
        if(!tabCheck) tabCheck = 'Y';
        if(tabCheck == 'Y' && $("#"+tabId+"TabOld").hasClass("on")) {
            return;
        }

        $("a[data-type=tab]").removeClass("on");
        $("#"+tabId+"TabOld").addClass("on");

        //초기화
        megaBoxAnnusOld.setInit();

        //직접입력
        if(tabId == 'annus_selfEnter') {
            $("#annus_selfEnterCardNoOld").removeClass("display-none");
            $("#annus_selfEnterFavoNoResultOld").addClass("display-none");
            $('#annus_selfReOld').show();
            $("#annus_selfEnterFavoCardNoOld").addClass("display-none");
            $("#annusCardNumOld").focus();

            // $("#btnConfirm").removeClass("display-none");
        }
        //자주쓰는 할인 카드
        else if(tabId == 'annus_favoCard') {
            $("#annus_selfEnterCardNoOld").addClass("display-none");

            if($("#annus_cardNo1Old").val() == '') {
                $("#annus_selfEnterFavoNoResultOld").removeClass("display-none");
                $('#annus_selfReOld').hide();
                $("#annus_selfEnterFavoCardNoOld").addClass("display-none");
                // $("#btnConfirm").addClass("display-none");
            } else {
                $("#annus_selfEnterFavoNoResultOld").addClass("display-none");
                $('#annus_selfReOld').show();
                $("#annus_selfEnterFavoCardNoOld").removeClass("display-none");
                $("#annus_cardNo3Old").focus();
                // $("#btnConfirm").removeClass("display-none");
            }
        }

    },
    fn_favoCardList : function(autoReresh) {
        var paramData = { forwordView : 'false' };
        $.ajax({
            url: "/on/oh/ohh/PersonInfoMng/selectFavorUsePayDcMeanLa.do",
            type: "POST",
            contentType: "application/json;charset=UTF-8",
            data: JSON.stringify(paramData),
            success: function (data, textStatus, jqXHR) {

                //할인 카드 미동의
                if(data.policAgreeAt == "N" || data.policAgreeAt == "") {
                    $("#annus_agreeTextOld").text("서비스 이용동의 설정이 필요합니다.");
                    $("#annus_agreeButtonOld").text("이용동의하기");
                    $("#annus_agreeButtonOld").attr("button-type", "agree");
                }
                //할인 카드 동의
                else {
                    if (data.mbFavorPayMean.length > 0) {

                        // 기본으로 직접입력탭을 활성화
                        if(!$('#annus_selfEnterTabOld').hasClass('on')){
                            $('#annus_selfEnterTabOld').addClass('on');
                        }

                        $.each(data.mbFavorPayMean, function (i, item) {
                            if (item.payDcMeanCd == 'MCDM13') {
                                var cardNos = item.cardNoFmt.split('-');
                                $("#annus_cardNo1Old").val(cardNos[0]);
                                $("#annus_cardNo2Old").val(cardNos[1]);
                                $("#annus_cardNo4Old").val(cardNos[3]);

                                if (autoReresh) {
                                    megaBoxAnnusOld.fn_tabSwitch('annus_favoCard', 'N');
                                }

                                return false;
                            }
                        });
                    } else {
                        $("#annus_agreeTextOld").text("등록된 할인카드가 없습니다.");
                        $("#annus_agreeButtonOld").text("지금 등록하기");
                        $("#annus_agreeButtonOld").attr("button-type", "register");
                    }
                }
            },
            error: function(xhr,status,error){
                var err = JSON.parse(xhr.responseText);
                AppHandler.Common.alert(err.message);
            }
        });
    },
    fn_favorCard: function() {
        if($("#annus_agreeButtonOld").attr("button-type") == "register") {
            megaBoxAnnusOld.fn_favorCardRegister('103002');
        } else {
            fn_favorAgreeOld('103002');
        }
    },
    fn_favorCardRegister: function() {
        var oData = {
            payDcMeanCd : 'MCDM13'
        };

        if(controlAction.isExec()) return; controlAction.on();

        $.ajax({
            url: "/card/dc/resigter",
            type: "POST",
            type: "POST",
            contentType: "application/json;charset=UTF-8",
            data: JSON.stringify(oData),
            success: function (data, status, xhr) {
                $('#megaboxAnnusWrap').addClass("display-none");
                $('#layerview').html(data);
                $('#layerview').removeClass("display-none");

                if(isApp()) {
                    var param = {
                        header: {
                            type: 'default',
                            closeAction: 'favorUsePayDc.fn_close',
                            backAction: 'favorUsePayDc.fn_close'
                        },
                        title: {
                            type: 'text',
                            text: '할인카드 등록'
                        },
                        btnRight: {
                            type: 'close'
                        }
                    };
                    AppHandler.Common.setHeader(param);
                    $("#favorUsePayDc .bd-no").addClass('display-none');
                    $("#favorView").css("padding-top", "0px");
                }

                controlAction.lazyOff(500);
            },
            error: function(xhr, status, error){
                controlAction.off();
                var err = JSON.parse(xhr.responseText);
                AppHandler.Common.alert(err);
            }
        });
    },
    setInit : function () {

        $('#selAnnusOld > option').remove();
        $('#selAnnusOld').html('<option value="0">선택</option>');
        $('#annusUseAbleAmtOld').text('0');
    },

};

function fn_favorAgreeOld(id){
    $.ajax({
        url: "/mypage/favorCardAgree",
        type: "POST",
        contentType: "application/json;charset=UTF-8",
        success: function (data, status, xhr) {
            $('#layerview').removeClass('display-none')
            // $('#'+id).addClass("display-none");
            $('#layerview').html(data);

            var param = {
                header: {
                    type: 'default',
                    closeAction: 'favorCardAgree.fn_close',
                    backAction: 'favorCardAgree.fn_close'
                },
                title: {
                    type: 'text',
                    text: '서비스 이용동의 설정'
                },
                btnRight: {
                    type: 'close'
                }
            };
            AppHandler.Common.setHeader(param);
            $("#favorCardAgreeView .bd-no").addClass('display-none');
            $("#favorAgreeView").removeClass("container");
        },
        error: function(xhr, status, error){
            var err = JSON.parse(xhr.responseText);
            AppHandler.Common.alert("화면 로딩중 오류가 발생했습니다.잠시 후 다시 시도 해 주세요.");
        }
    });
}

//신아너스카드 시작
var mycardNumber = new cardNumber();
const mycvcNumber = new cvcNumber();
var annusChgInfo = new Object();
let existsAnnusGiftCard =  false;
let existsCardNo = '';
let existsCvvCd = '';

var megaBoxAnnus = {
    popupCd: '103003',
    list: [],

    /**
     * 초기 Set
     */
    fn_init: function() {
        this.fn_addEvent();
        this.initAnnusGiftCard();
    },
    /**
     * 아너스카드 기명 존재여부 값전달
     */
    fn_existsAnnusChk: function(existsChkAt, cardNo, cvcNo) {
        existsAnnusGiftCard = existsChkAt;
        existsCardNo = cardNo;
        existsCvvCd = cvcNo;
    },
    /**
     * 이벤트 추가
     */
    fn_addEvent: function() {
        mycardNumber.watcher('#annusCardNum');
        mycvcNumber.watcher('#annusCvcNumSelf');

        //모두사용 초기화
        $('#annusGiftUseCashAllExists').prop('checked', false);
        $('#annusGiftUseCashAll').prop('checked', false);
        //잔액 입력 초기화
        $('#annusGiftUseCash').val('');
        $('#annusGiftUseCashExists').val('');

        $('#megaboxAnnusSearchBtn').on('click', function() {
            megaBoxAnnus.fn_getList();
        });

        // 즐겨찾기  부모창 정보를 기준으로 즐찾 이미지 표시 후, 클릭 이벤트 등록 처리
        var hasStar = $("li[payDcMeanCd='"+megaBoxAnnus.popupCd+"']").find('span').hasClass("act");
        if(hasStar){
            $("#favorApplyBtn").addClass("on");
        }
        $("#favorApplyBtn").on('click', function() {
            fn_favorApply(megaBoxAnnus.popupCd);
        });
    },
    /**
     * 조회
     */
    fn_getList: function() {
        var cardNo =  mycardNumber.getUnmaskNumber();
        let cvvCd = mycvcNumber.getUnmaskNumber();

        //자주쓰는 할인 카드
        if($("#annus_favoCardTab").hasClass("on")) {
            if($("#annus_cardNo3").val() == "") {
                AppHandler.Common.alert('입력하신 카드번호가 맞는 지 확인해주세요.');
                $("#annus_cardNo3").focus();
                return;
            } else if($("#annusCvcNumFavo").val() == "") {
                AppHandler.Common.alert('입력하신 카드번호가 맞는 지 확인해주세요.');
                $("#annusCvcNumFavo").focus();
                return;
            } else {
                cardNo = $("#annus_cardNo1").val() + $("#annus_cardNo2").val() + $("#annus_cardNo3").val() + $("#annus_cardNo4").val();
            }
        } else { //직접입력
            if(cardNo == "" || cardNo.length < 16) {
                AppHandler.Common.alert('카드 번호를 입력하세요.');
                $("#annusCardNum").focus();
                return;
            } else if (cvvCd == "" || cvvCd.length < 7) {
                AppHandler.Common.alert('카드 번호를 입력하세요.');
                $("#annusCvcNumSelf").focus();
                return;
            }
        }

        var paramData = { transNo: $('#transNo').val(), cardNo: cardNo, cvvCd: cvvCd };

        megaBoxAnnus.setInit();

        $.ajax({
            url: "/on/oh/ohz/PayCombo/searchAnnusGiftCard.do",
            type: "POST",
            contentType: "application/json;charset=UTF-8",
            dataType: "json",
            data: JSON.stringify(paramData),
            success: function (data, textStatus, jqXHR) {

                if(data.statCd == '0'){
                    annusChgInfo = data.annusInfo;
                    megaBoxAnnus.setAnnusChg(annusChgInfo);
                }

            },
            error: function(xhr,status,error){
                var err = JSON.parse(xhr.responseText);
                AppHandler.Common.alert(err.msg);
            }
        });
    },
    setAnnusChg: function(cponInfo) {
        $('#annusGiftUseAbleCash').text(String(cponInfo.useAbleAmt).maskNumber());
    },
    /**
     * 기명 아너스카드 존재시 잔여 금액 셋팅
     */
    setAnnusExistsChg: function(cponInfo) {
        $("#annusGiftUseAbleCashExists").text(String(cponInfo.useAbleAmt).maskNumber());

        if($("#annus_favoCardTab").hasClass("on")) {
            $("#inputBoxNoExists").removeClass("display-none");
            $("#inputBoxExists").addClass("display-none");
        } else {
            $("#inputBoxNoExists").addClass("display-none");
            $("#inputBoxExists").removeClass("display-none");
        }
    },
    /**
     * 적용
     */
    fn_apply: function() {
        var transNo    = $('#transNo').val();
        var cardNo     = mycardNumber.getUnmaskNumber();
        let cvvCd      = mycvcNumber.getUnmaskNumber();
        let useCash = 0, useAbleAmt = 0;
        const remainAmt = megaBoxAnnus.get_money_num($("#last_pay_price").text()); //총 결제금액
        // var useAmt   = $('#selAnnus option:selected').val();

        //자주쓰는 할인 카드
        if($("#annus_favoCardTab").hasClass("on")) {
            if($("#annus_cardNo3").val() == "") {
                AppHandler.Common.alert('입력하신 카드번호가 맞는 지 확인해주세요.');
                $("#annus_cardNo3").focus();
                return;
            } else if($('#annusCvcNumFavo').val() == "") {
                AppHandler.Common.alert('카드 번호를 입력하세요.');
                $("#annusCvcNumFavo").focus();
                return;
            } else {
                cardNo = $("#annus_cardNo1").val() + $("#annus_cardNo2").val() + $("#annus_cardNo3").val() + $("#annus_cardNo4").val();
                cvvCd = $("#annusCvcNumFavo").val();
            }
            //기명여부 상관없음
            useCash = megaBoxAnnus.get_money_num($("#annusGiftUseCash").val()); //사용 금액
            useAbleAmt = megaBoxAnnus.get_money_num($("#annusGiftUseAbleCash").text()); //보유 금액
        } else {
            if (cardNo == "" || cardNo.length < 16) {
                AppHandler.Common.alert('카드 번호를 입력하세요.');
                $("#annusCardNum").focus();
                return;
            } else if(cvvCd == "" || cvvCd.length < 7) {
                AppHandler.Common.alert('<spring:message code="msg.pay.input.cardNo"/>');
                $("#annusCvcNumSelf").focus();
                return;
            }

            if(existsAnnusGiftCard) { //기명
                useCash = megaBoxAnnus.get_money_num($("#annusGiftUseCashExists").val()); //사용 금액
                useAbleAmt = megaBoxAnnus.get_money_num($("#annusGiftUseAbleCashExists").text());//보유 금액
            } else { //무기명
                useCash = megaBoxAnnus.get_money_num($("#annusGiftUseCash").val()); //사용 금액
                useAbleAmt = megaBoxAnnus.get_money_num($("#annusGiftUseAbleCash").text()); //보유 금액
            }
        }

        //사용할 금액 체크
        if (useCash == 0) {
            AppHandler.Common.alert('사용할 금액을 입력 바랍니다.');
            return;
        }

        //보유 금액 체크
        if (useAbleAmt == 0) {
            AppHandler.Common.alert("사용가능 금액이 없습니다.");
            return;
        }

        //사용금액 체크 - 사용금액이 보유금액을 초과했습니다.
        if (useAbleAmt < useCash) {
            AppHandler.Common.alert("사용금액이 보유금액을 초과했습니다.");
            return;
        }

        //사용금액 체크 - 사용금액이 결제 금액보다 큽니다.
        if (useCash > remainAmt) {
            AppHandler.Common.alert("사용금액이 결제금액보다 큽니다.");
            return;
        }

        var paramData  = {transNo:transNo, cardNo:cardNo, cvvCd:cvvCd, useAmt:useCash};
        if(controlAction.isExec()) return; controlAction.on();

        $.ajax({
            url        : '/on/oh/ohz/PayCombo/applyAnnusGiftCard.do',
            type       : 'POST',
            contentType: 'application/json;charset=UTF-8',
            dataType   : 'json',
            data       : JSON.stringify(paramData),
            success    : function (data, textStatus, jqXHR) {
                controlAction.off();
                if(data.statCd == '0'){
                    // annusChgInfo = data.annusInfo;
                    // megaBoxAnnus.setAnnusChg(annusChgInfo);

                    /*var useAmt = 0;
                    $.each(data.returnMap.payExecList, function(i, item){
                        if(item.payDcMeanCd == '103002'){
                            useAmt = item.applyAmt;
                        }
                    });*/

                    data.returnMap.payDcMeanCd = '103003';
                    data.returnMap.useAmt = useAmt;
                    fn_paymentAmtSet(data.returnMap);

                    //$("#num_friends").text('-'+gfn_setComma(data.returnMap.useAmt));
                    fn_closePayPopup();
                }

                //할인내역 갱신
                //setMovieDcInfo(data.policyList);

                // 할인팝업닫기
                //fn_closePayPopup();
            },
            error: function(xhr,status,error){
                controlAction.off();
                var err = JSON.parse(xhr.responseText);
                AppHandler.Common.alert(err.msg);
            }
        });
    },
    fn_tabSwitch : function(tabId, tabCheck) {
        //같은 탭 클릭
        if(!tabCheck) tabCheck = 'Y';
        if(tabCheck == 'Y' && $("#"+tabId+"Tab").hasClass("on")) {
            return;
        }

        $("a[data-type=tab]").removeClass("on");
        $("#"+tabId+"Tab").addClass("on");

        //초기화
        megaBoxAnnus.setInit();
        //기명아너스카드 초기화
        megaBoxAnnus.initAnnusGiftCard();

        //직접입력
        if(tabId == 'annus_selfEnter') {
            if(existsAnnusGiftCard) {
                $("#inputBoxExists").removeClass("display-none");
                $("#inputBoxNoExists").addClass("display-none");
                $("#annus_selfEnterCardNo").addClass("display-none");
                $("#selfEnterCvcNo").addClass("display-none");
                $("#annus_selfExistsEnterCardNo").removeClass("display-none");
                $("#selfExistsCvcNo").removeClass("display-none");

                //조회버튼 비활성화
                $("#megaboxAnnusSearchBtn").addClass("disabled");
                $("#megaboxAnnusSearchBtn").attr("disabled", true);
            } else {
                $("#inputBoxExists").addClass("display-none");
                $("#inputBoxNoExists").removeClass("display-none");
                $("#annus_selfEnterCardNo").removeClass("display-none");
                $("#selfEnterCvcNo").removeClass("display-none");
                $("#annus_selfExistsEnterCardNo").addClass("display-none");
                $("#selfExistsCvcNo").addClass("display-none");
                $("#annusCardNum").focus();

                //조회버튼 활성화
                $("#megaboxAnnusSearchBtn").removeClass("disabled");
                $("#megaboxAnnusSearchBtn").attr("disabled", false);
            }

            $("#annus_selfEnterFavoNoResult").addClass("display-none");
            $('#annus_selfRe').show();
            $("#annus_selfEnterFavoCardNo").addClass("display-none");
            $("#selfEnterFavoCvcNo").addClass("display-none");

            // $("#btnConfirm").removeClass("display-none");
        }
        //자주쓰는 할인 카드
        else if(tabId == 'annus_favoCard') {
            $("#annus_selfEnterCardNo").addClass("display-none");
            $("#selfEnterCvcNo").addClass("display-none");
            $("#annus_selfExistsEnterCardNo").addClass("display-none");
            $("#selfExistsCvcNo").addClass("display-none");
            $("#inputBoxExists").addClass("display-none");
            $("#inputBoxNoExists").removeClass("display-none");

            if($("#annus_cardNo1").val() == '') {
                $("#annus_selfEnterFavoNoResult").removeClass("display-none");
                $('#annus_selfRe').hide();
                $("#annus_selfEnterFavoCardNo").addClass("display-none");
                $("#selfEnterFavoCvcNo").addClass("display-none");
                // $("#btnConfirm").addClass("display-none");
            } else {
                $("#annus_selfEnterFavoNoResult").addClass("display-none");
                $('#annus_selfRe').show();
                $("#annus_selfEnterFavoCardNo").removeClass("display-none");
                $("#selfEnterFavoCvcNo").removeClass("display-none");
                $("#annus_cardNo3").focus();
                // $("#btnConfirm").removeClass("display-none");
            }

            //조회버튼 활성화
            $("#megaboxAnnusSearchBtn").removeClass("disabled");
            $("#megaboxAnnusSearchBtn").attr("disabled", false);
        }

    },
    fn_favoCardList : function(autoReresh) {
        var paramData = { forwordView : 'false' };
        $.ajax({
            url: "/on/oh/ohh/PersonInfoMng/selectFavorUsePayDcMeanLa.do",
            type: "POST",
            contentType: "application/json;charset=UTF-8",
            data: JSON.stringify(paramData),
            success: function (data, textStatus, jqXHR) {

                //할인 카드 미동의
                if(data.policAgreeAt == "N" || data.policAgreeAt == "") {
                    $("#annus_agreeText").text("서비스 이용동의 설정이 필요합니다.");
                    $("#annus_agreeButton").text("이용동의하기");
                    $("#annus_agreeButton").attr("button-type", "agree");
                }
                //할인 카드 동의
                else {
                    if (data.mbFavorPayMean.length > 0) {

                        // 기본으로 직접입력탭을 활성화
                        if(!$('#annus_selfEnterTab').hasClass('on')){
                            $('#annus_selfEnterTab').addClass('on');
                        }

                        $.each(data.mbFavorPayMean, function (i, item) {
                            if (item.payDcMeanCd == 'MCDM16') {
                                var cardNos = item.cardNoFmt.split('-');
                                $("#annus_cardNo1").val(cardNos[0]);
                                $("#annus_cardNo2").val(cardNos[1]);
                                $("#annus_cardNo4").val(cardNos[3]);

                                if (autoReresh) {
                                    megaBoxAnnus.fn_tabSwitch('annus_favoCard', 'N');
                                }

                                return false;
                            }
                        });
                    } else {
                        $("#annus_agreeText").text("등록된 할인카드가 없습니다.");
                        $("#annus_agreeButton").text("지금 등록하기");
                        $("#annus_agreeButton").attr("button-type", "register");
                    }
                }
            },
            error: function(xhr,status,error){
                var err = JSON.parse(xhr.responseText);
                AppHandler.Common.alert(err.message);
            }
        });
    },
    fn_favorCard: function() {
        if($("#annus_agreeButton").attr("button-type") == "register") {
            megaBoxAnnus.fn_favorCardRegister('103003');
        } else {
            fn_favorAgree('103003');
        }
    },
    fn_favorCardRegister: function() {
        var oData = {
            payDcMeanCd : 'MCDM16'//신아너스카드
        };

        if(controlAction.isExec()) return; controlAction.on();

        $.ajax({
            url: "/card/dc/resigter",
            type: "POST",
            contentType: "application/json;charset=UTF-8",
            data: JSON.stringify(oData),
            success: function (data, status, xhr) {
                $('#megaboxAnnusWrap').addClass("display-none");
                $('#layerview').html(data);
                $('#layerview').removeClass("display-none");
                //스타일에 display-none있으면 제거
                if($('#layerview').css("display") == 'none') {
                    $('#layerview').show();
                }

                if(isApp()) {
                    var param = {
                        header: {
                            type: 'default',
                            closeAction: 'favorUsePayDc.fn_close',
                            backAction: 'favorUsePayDc.fn_close'
                        },
                        title: {
                            type: 'text',
                            text: '할인카드 등록'
                        },
                        btnRight: {
                            type: 'close'
                        }
                    };
                    AppHandler.Common.setHeader(param);
                    $("#favorUsePayDc .bd-no").addClass('display-none');
                    $("#favorView").css("padding-top", "0px");
                }

                controlAction.lazyOff(500);
            },
            error: function(xhr, status, error){
                controlAction.off();
                var err = JSON.parse(xhr.responseText);
                AppHandler.Common.alert(err);
            }
        });
    },
    setInit : function () {
        $('#annusGiftUseAbleCash').text('0');
        //모두사용 초기화
        $('#annusGiftUseCashAllExists').prop('checked', false);
        $('#annusGiftUseCashAll').prop('checked', false);
        //잔액 입력 초기화
        $('#annusGiftUseCash').val('');
        $('#annusGiftUseCashExists').val('');
    },
    /**
     * 기명 아너스카드 존재시 input값 초기화
     */
    initAnnusGiftCard : function () {
        if(existsAnnusGiftCard) {
            mycardNumber.watcher('#annusCardNumExists');
            mycvcNumber.watcher('#annusCvcNumExists');
            const cardNo = existsCardNo, cvvCd = existsCvvCd;
            const paramData = {
                transNo : $('#transNo').val(),
                cardNo : cardNo,
                cvvCd : cvvCd
            };

            //카드번호 + cvc 자동호출
            $("#annusCardNumExists").val(cardNo);
            $("#annusCvcNumExists").val(cvvCd);

            //조회버튼 비활성화
            $("#megaboxAnnusSearchBtn").addClass("disabled");
            $("#megaboxAnnusSearchBtn").attr("disabled", true);

            //기존 카드번호 + cvc 컴포넌트 가리기
            $("#annus_selfEnterCardNo").addClass("display-none");
            $("#selfEnterCvcNo").addClass("display-none");

            //존재하는 카드번호 + cvc 컴포넌트 노출
            $("#annus_selfExistsEnterCardNo").removeClass("display-none");
            $("#selfExistsCvcNo").removeClass("display-none");

            //cardNo, cvcNo마스킹처리
            mycardNumber.doMasking('#annusCardNumExists');
            mycvcNumber.doMasking('#annusCvcNumExists');

            $.ajax({
                url: "/on/oh/ohz/PayCombo/selectExistAnnusGiftCard.do",
                type: "POST",
                data: JSON.stringify(paramData),
                contentType: "application/json;charset=UTF-8",
                success: function (data, status, xhr) {
                    megaBoxAnnus.setAnnusExistsChg(data.annusInfo);
                },
                error: function(xhr, status, error){
                    var err = JSON.parse(xhr.responseText);
                    AppHandler.Common.alert(err);
                },
            });
        }
    },
    /**
     * 무기명시 모두사용 체크박스 이벤트
     */
    enableAll : function () {
        const useAbleAmt = megaBoxAnnus.get_money_num($("#annusGiftUseAbleCash").text()); // 보유 금액
        const remainAmt = megaBoxAnnus.get_money_num($("#last_pay_price").text());	// 최종결제금액, 최대 사용 가능 금액
        const isChecked = $("#annusGiftUseCashAll").prop("checked");

        if(!isChecked){
            $("#annusGiftUseCash").val('');
            return;
        }

        // 최소 0 이상의 포인트를 사용해야 됨
        if (useAbleAmt == 0) {
            AppHandler.Common.alert('사용가능 금액이 없습니다.');
            return;
        }

        // 최종 결제 예정 금액을 초과 할 수 없음
        let maxAmt = (useAbleAmt > remainAmt) ? remainAmt : useAbleAmt;
        $("#annusGiftUseCash").val(megaBoxAnnus.get_money_str(maxAmt));
    },
    /**
     * 기명시 모두사용 체크박스 이벤트
     */
    enableAllExists : function () {
        const useAbleAmt = megaBoxAnnus.get_money_num($("#annusGiftUseAbleCashExists").text()); // 보유 금액
        const remainAmt = megaBoxAnnus.get_money_num($("#last_pay_price").text()); // 최종결제금액, 최대 사용 가능 금액
        const isChecked = $("#annusGiftUseCashAllExists").prop("checked");

        if(!isChecked){
            $("#annusGiftUseCashExists").val('');
            return;
        }

        // 최소 0 이상의 포인트를 사용해야 됨
        if (useAbleAmt == 0) {
            AppHandler.Common.alert('사용가능 금액이 없습니다.');
            return;
        }

        // 최종 결제 예정 금액을 초과 할 수 없음
        let maxAmt = (useAbleAmt>remainAmt) ? remainAmt : useAbleAmt;
        $("#annusGiftUseCashExists").val(megaBoxAnnus.get_money_str(maxAmt));
    },
    get_money_num : function (source) {
        var _money = parseInt(String(source).replace(/[^0-9]/g,''));
        if(isNaN(_money)){
            return 0;
        }
        return _money;
    },
    get_money_str : function (source) {
        var _money = parseInt(String(source).replace(/[^0-9]/g,''));
        if(isNaN(_money)){
            _money = 0;
        }
        return String(_money).maskNumber();
    }
};

function fn_favorAgree(id){
    $.ajax({
        url: "/mypage/favorCardAgree",
        type: "POST",
        contentType: "application/json;charset=UTF-8",
        success: function (data, status, xhr) {
            $('#layerview').removeClass('display-none')
            // $('#'+id).addClass("display-none");
            $('#layerview').html(data);

            var param = {
                header: {
                    type: 'default',
                    closeAction: 'favorCardAgree.fn_close',
                    backAction: 'favorCardAgree.fn_close'
                },
                title: {
                    type: 'text',
                    text: '서비스 이용동의 설정'
                },
                btnRight: {
                    type: 'close'
                }
            };
            AppHandler.Common.setHeader(param);
            $("#favorCardAgreeView .bd-no").addClass('display-none');
            $("#favorAgreeView").removeClass("container");
        },
        error: function(xhr, status, error){
            var err = JSON.parse(xhr.responseText);
            AppHandler.Common.alert("화면 로딩중 오류가 발생했습니다.잠시 후 다시 시도 해 주세요.");
        }
    });
}

function fn_favorViewChange(autoReresh, payDcMeanCd) {
    var text = '스타카드/프렌즈';
    if(payDcMeanCd == '103003' || payDcMeanCd == '103002'){
        text = '메가박스 아너스카드';
    }

    var img_star_prefix = "https://img.megabox.co.kr//static/mb/images/common/ico/";
    var img_star_on = img_star_prefix + "schedule_star_on.png";
    var img_star_off = img_star_prefix + "schedule_star_off.png";
    var has_star = $("a[payDcMeanCd='"+payDcMeanCd+"']").parent().hasClass("star");

    var param = {
        header: {
            type: 'default',
            closeAction: 'fn_layerCls'
        },
        title: {
            type: 'text',
            text: text
        },
        btnRight: {
            type: 'close'
        },
        btnLeft: {
            type: 'sub',
            image: has_star?img_star_on:img_star_off,
            callback: "fn_favorApply",
            params: payDcMeanCd
        }
    };

    AppHandler.Common.setHeader(param);
    // $('#megaboxAnnusWrap').removeClass("display-none");
    $('#layerview').addClass('display-none');
    $('#layerview').html('');

    if(payDcMeanCd == '103003'){
        megaBoxAnnus.fn_favoCardList(autoReresh);
    } else if (payDcMeanCd == '103002') {
        megaBoxAnnusOld.fn_favoCardList(autoReresh);
    } else {
        megaBoxFriends.fn_favoCardList(autoReresh);
    }
}