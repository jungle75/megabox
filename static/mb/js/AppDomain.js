/*******************************************************************************
 * 01. 업무구분 : Native Domain Info
 * 02. 화면명   : 모바일 공통
 * 03. 화면설명 : 웹에서 네이티브 호출하는 인터페이스
 * 04. 작성자   : 채운기
 * 05. 작성일   : 2019.06.18
 * =============================================================================
 * 06. 수정이력 : 수정자          내용
 * =============================================================================
 *   2019.06.18   채운기    최초생성
 ******************************************************************************/

/**
 * 화면 컨트롤 플래그 값
 */
var Flag = function() {
    // 새로고침사용:O, 전체창닫기:X, 현재창닫기:X
    this.isRefresh = {
            refresh: true, isCloseAll: false, isClose: false
    };
    // 새로고침사용:O, 전체창닫기:O, 현재창닫기:X
    this.isRefreshCloseAll = {
            refresh: true, isCloseAll: true, isClose: false
    };
    // 새로고침사용:O, 전체창닫기:X, 현재창닫기:O
    this.isRefreshClose = {
            refresh: true, isCloseAll: false, isClose: true
    };
    // 새로고침사용:X, 전체창닫기:O, 현재창닫기:X
    this.isCloseAll = {
            refresh: false, isCloseAll: true, isClose: false
    };
    // 새로고침사용:X, 전체창닫기:X, 현재창닫기:O
    this.isClose = {
            refresh: false, isCloseAll: false, isClose: true
    };
    // 새로고침사용:X, 전체창닫기:X, 현재창닫기:X
    this.isDefault = {
            refresh: false, isCloseAll: false, isClose: false
    };
};

/* 이벤트 */
var Event = function() {
    /**
     * 이벤트상세
     * AppDomain.Event.detail
     * @param params
     * - netfunnelAt
     * - eventNo
     * @param flag
     */
    this.detail = function(params, flag) {
        if(controlAction.isExec()) return;
        if (!params) return;
        if (!params['eventNo']) return;

        controlAction.on();

        if (!flag) flag = AppDomain.Flag.isRefresh;
        if (!params['netfunnelAt']) params['netfunnelAt'] = 'N';
        if (!params['shareAt']) params['shareAt'] = 'Y';

        var openData = AppHeader.Event.detail;

        if(params['shareAt'] == 'N'){
        	openData['btnRight'] = null;
        } else {
        	openData['btnRight'] = {
                type: 'sub',
                image: 'ico-share',
                callback: 'fn_snsShare'
        	}
        }

        openData['domain'] = '/event/detail?eventNo='+params['eventNo'];
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 참여 이벤트 (나의 이벤트 응모내역)
     * AppDomain.Event.myEvent
     * @param flag
     */
    this.myEvent = function(flag) {
        if(controlAction.isExec()) return;

        controlAction.on();

        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Event.myEvent;
        openData['domain'] = '/mypage/myevent';
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 이벤트 당첨자발표 상세
     * AppDomain.Event.winnerDetail
     * @param params
     * - eventNo
     * @param flag
     */
    this.winnerDetail = function(params, flag) {
        if (!params) return;
        if (!params['eventNo']) return;

        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Event.winnerDetail;
        openData['domain'] = '/event/winner/detail';
        openData['params'] = params;
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        if (isApp()) {
            AppHandler.Common.href(openData);
        } else {
        	openData['layerTopBtnAt'] = 'Y';
            gfn_moCusLayer(openData);
        }
    }

    /**
     * 투표결과(이벤트상세)
     * AppDomain.Event.detailResult
     * @param params
     * - eventNo
     * @param flag
     */
    this.detailResult = function(params, flag) {
        if(controlAction.isExec()) return;
        if (!params) return;
        if (!params['eventNo']) return;

        controlAction.on();

        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Event.detailResult;
        openData['domain'] = '/event/detail/result';
        openData['params'] = params;
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 배너오픈
     * AppDomain.Event.openUrl
     * @param params
     * - url
     * - title
     * @param flag
     */
    this.openUrl = function(params, flag) {
        if (!params) return;
        if (!params['url']) return;

        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Event.openUrl(params['title']);
        openData['domain'] = params['url'];
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.link(openData);
    }


    /**
     * 이벤트 - 포인트 전환
     * AppDomain.Event.openUrl
     * @param params
     * - url
     * - title
     * @param flag
     */
    this.changePoint = function(eventNo, flag) {
        if (!eventNo) return;
        if (!flag) flag = AppDomain.Flag.isDefault;

        controlAction.on();

        var openData = AppHeader.Event.openBackPop('포인트 전환');
        openData['domain'] = '/event/point-trans';
        openData['params'] = {eventNo:eventNo};
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    }

    /**
     * 굿즈 소진현황
     * AppDomain.Event.goodsStockPrco
     * @param params
     * - brchNo
     * @param flag
     */
    this.goodsStockPrco = function(params, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
            domain: '/event/goodsStockPrco',
            params: params,
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '굿즈 소진현황'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup',
            refresh: flag.refresh,
            isCloseAll: flag.isCloseAll,
            isClose: flag.isClose
        }

        if (isApp()) {
            AppHandler.Common.href(data);
        }
    };
}

/* 예매 */
var Booking = function() {
    /**
     * 좌석도
     * AppDomain.Booking.seat
     * @param params
     * - playSchdlNo
     * - admisClassCd
     * - hotDealEventNo
     * - startPoint
     * @param flag
     */
    this.seat = function(params, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;
        if (!params) return;

        if (!params['hotDealEventNo']) {
            params['hotDealEventNo'] = '';
        }

        if(!params['startPoint']) {
            params[startPoint] = "/main";
        }

        var openData = AppHeader.Booking.seat;
        openData['domain'] = '/booking/seat';
        openData['params'] = params;
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 좌석도 (form type)
     * AppDomain.Booking.seatForm
     * @param form
     * @param flag
     */
    this.seatForm = function(form, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Booking.seat;
        openData['domain'] = '/booking/seat';
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

    	if (typeof sessionStorage.NetFunnel_ID != "undefined"){
    		var netKey = sessionStorage.NetFunnel_ID;
	    	openData['netKey'] = netKey;
    	}

        AppHandler.Common.submit(form, openData);

    };

    /**
     * 분리된 좌석도 (form type)
     * AppDomain.Booking.seatForm
     * @param form
     * @param flag
     */
    this.newEvSeatForm = function(form, flag) {
    	if (!flag) flag = AppDomain.Flag.isDefault;

    	var openData = AppHeader.Booking.seat;
    	openData['domain'] = '/megaEv/booking/seat';
    	openData['refresh'] = flag.refresh;
    	openData['isCloseAll'] = flag.isCloseAll;
    	openData['isClose'] = flag.isClose;

    	if (typeof sessionStorage.NetFunnel_ID != "undefined"){
    		var netKey = sessionStorage.NetFunnel_ID;
    		openData['netKey'] = netKey;
    	}

    	AppHandler.Common.submit(form, openData);

    };

    /**
     * 좌석도 (form type)
     * AppDomain.Booking.seatFormToHref
     * @param formId
     * @param flag
     */
    this.seatFormToHref = function(formId, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Booking.seat;
        openData['domain'] = '/booking/seat';
        openData['params'] = $("#"+formId).serializeObject();
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 결제하기
     * AppDomain.Booking.pay
     * @param form
     * @param flag
     */
    this.pay = function(form, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Booking.pay('fn_goSeat');
        openData['domain'] = '/on/oh/ohz/PayBooking/completeSeat.do';
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.submit(form, openData);
    };

    /**
     * 영화예매(영화선택)
     * AppDomain.Booking.movieReserve
     * @param flag
     */
    this.movieReserve = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Booking.movieReserve;
        openData['domain'] = '/booking/movie';
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);

    };

    /**
     * 극장예매(극장선택)
     * AppDomain.Booking.theaterReserve
     * @param params
     * - brchNo
     * @param flag
     */
    this.theaterReserve = function(params, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Booking.theaterReserve;
        openData['domain'] = '/booking/theater';
        openData['params'] = params;
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);

    };

    /**
     * 극장예매(극장선택)
     * AppDomain.Booking.theaterReserve
     * @param params
     * - brchNo
     * @param flag
     */
    this.newEvTheaterReserve = function(params, flag) {
    	if (!flag) flag = AppDomain.Flag.isDefault;

    	var openData = AppHeader.Booking.theaterReserve;
    	openData['domain'] = '/megaEv/nbooking/theater';
    	openData['params'] = params;
    	openData['refresh'] = flag.refresh;
    	openData['isCloseAll'] = flag.isCloseAll;
    	openData['isClose'] = flag.isClose;

    	AppHandler.Common.href(openData);

    };

    /**
     * 바로예매 (영화 정보 존재시)
     * AppDomain.Booking.quickBooking
     * @param params
     * - movieNo
     * - theaterType
     * - imageUrl
     * @param flag
     */
    this.quickBooking = function(params, flag) {
        if(controlAction.isExec()) return;
        if (!params) return;
        if (!params['movieNo']) return;

        controlAction.on();

        if (!flag) flag = AppDomain.Flag.isDefault;
        if (!params['theaterType']) params['theaterType'] = '';

        var openData = AppHeader.Booking.newMovie('fn_goback');
        openData['domain'] = '/booking/movie';
        openData['params'] = params;
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 바로예매 (영화 정보 존재시)
     * AppDomain.Booking.quickBooking
     * @param params
     * - movieNo
     * - theaterType
     * - imageUrl
     * @param flag
     */
    this.newEvQuickBooking = function(params, flag) {
    	if(controlAction.isExec()) return;
    	if (!params) return;
    	if (!params['movieNo']) return;

    	controlAction.on();

    	if (!flag) flag = AppDomain.Flag.isDefault;
    	if (!params['theaterType']) params['theaterType'] = '';

    	var openData = AppHeader.Booking.newEvMovie('fn_goback');
    	openData['domain'] = '/megaEv/nbooking/movie';
    	openData['params'] = params;
    	openData['refresh'] = flag.refresh;
    	openData['isCloseAll'] = flag.isCloseAll;
    	openData['isClose'] = flag.isClose;

    	AppHandler.Common.href(openData);
    };

    /**
     * 영화별 예매 화면으로 이동 (영화 정보 존재시)
     * AppDomain.Booking.moiveReserveScheduleMove
     * @param params
     * - movieNo
     * - theaterType
     * - imageUrl
     * @param flag
     */
    this.movieReserveScheduleMove = function(params, flag) {
        if(controlAction.isExec()) return;
        if (!params) return;
        if (!params['movieNo']) return;
        if (!params['brchNo1']) return;

        controlAction.on();

        if (!flag) flag = AppDomain.Flag.isDefault;
        if (!params['theaterType']) params['theaterType'] = '';

        var openData = AppHeader.Booking.newMovie('fn_goback');
        openData['domain'] = '/booking/movie';
        openData['params'] = params;
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 영화별 예매 화면으로 이동 (영화 정보 존재시)
     * AppDomain.Booking.moiveReserveScheduleMove
     * @param params
     * - movieNo
     * - theaterType
     * - imageUrl
     * @param flag
     */
    this.newEvMovieReserveScheduleMove = function(params, flag) {
    	if(controlAction.isExec()) return;
    	if (!params) return;
    	if (!params['movieNo']) return;
    	if (!params['brchNo1']) return;

    	controlAction.on();

    	if (!flag) flag = AppDomain.Flag.isDefault;
    	if (!params['theaterType']) params['theaterType'] = '';

    	var openData = AppHeader.Booking.newEvMovie('fn_goback');
    	openData['domain'] = '/megaEv/nbooking/movie';
    	openData['params'] = params;
    	openData['refresh'] = flag.refresh;
    	openData['isCloseAll'] = flag.isCloseAll;
    	openData['isClose'] = flag.isClose;

    	AppHandler.Common.href(openData);
    };

    /**
     * 영화별 예매 화면으로 이동 (넷퍼넬 화면 > 예매화면 이동함수)
     * AppDomain.Booking.moiveReserveScheduleMove
     * @param params
     * - movieNo
     * - theaterType
     * - imageUrl
     * @param flag
     */
    this.newMovieReserveScheduleMove = function(params, flag) {
    	if(controlAction.isExec()) return;
    	if (!params) return;
    	if (!params['movieNo']) return;

    	controlAction.on();

    	if (!flag) flag = AppDomain.Flag.isDefault;
    	if (!params['theaterType']) params['theaterType'] = '';

    	var openData = AppHeader.Booking.newEvMovie('fn_goback');
    	openData['domain'] = '/megaEv/nbooking/movie';
    	openData['params'] = params;
    	openData['refresh'] = flag.refresh;
    	openData['isCloseAll'] = flag.isCloseAll;
    	openData['isClose'] = false;

    	if (typeof sessionStorage.NetFunnel_ID != "undefined"){
    		var netKey = sessionStorage.NetFunnel_ID;
	    	openData['netKey'] = netKey;
    	}

    	if (isApp()) {
    		AppHandler.Common.href(openData);
    	}else{
    		AppHandler.Common.alert("모바일 앱에서 이용가능합니다");
    		return;
    	}
    };

    /**
     * 극장별 예매 (극장 정보 존재시)
     * AppDomain.Booking.theaterReserveSchedule
     * @param params
     * - brchNo
     * @param flag
     */
    this.theaterReserveSchedule = function (params, flag) {
        if (!params) return;
        if (!params['brchNo']) return;
        if (!params.brchDirectAt) {//없을때 Y처리 바로 해당지점으로이동
            params.brchDirectAt = 'Y';
        }

        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Booking.newTheater('');
        openData['domain'] = '/booking/theater';
        openData['params'] = params;
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 극장별 예매 (극장 정보 존재시) 영화별 예매 에서 극장별 예매로 이동
     * AppDomain.Booking.theaterReserveScheduleMove
     * @param params
     * - brchNo1
     * @param flag
     */
    this.theaterReserveScheduleMove = function (params, flag) {
        if (!params) return;
        if (!params['brchNo1']) return;
        if (!params.brchDirectAt) {//없을때 Y처리 바로 해당지점으로이동
            params.brchDirectAt = 'Y';
        }

        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Booking.newTheater('');
        openData['domain'] = '/booking/theater';
        openData['params'] = params;
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 극장별 예매 (극장 정보 존재시) 영화별 예매 에서 극장별 예매로 이동
     * AppDomain.Booking.theaterReserveScheduleMove
     * @param params
     * - brchNo1
     * @param flag
     */
    this.newEvTheaterReserveScheduleMove = function (params, flag) {
    	if (!params) return;
    	if (!params['brchNo1']) return;
    	if (!params.brchDirectAt) {//없을때 Y처리 바로 해당지점으로이동
    		params.brchDirectAt = 'Y';
    	}

    	if (!flag) flag = AppDomain.Flag.isDefault;

    	var openData = AppHeader.Booking.newTheater('');
    	openData['domain'] = '/megaEv/nbooking/theater';
    	openData['params'] = params;
    	openData['refresh'] = flag.refresh;
    	openData['isCloseAll'] = flag.isCloseAll;
    	openData['isClose'] = flag.isClose;

    	AppHandler.Common.href(openData);
    };

    /**
     * 대관예매
     * AppDomain.Booking.privateBooking
     */
    this.privateBooking = function(flag) {
        if(controlAction.isExec()) return;

        controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Booking.privateBooking;
        openData['domain'] = '/booking/privatebooking';
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 예매완료
     * AppDomain.Booking.mobileTicket
     * @param form
     * @param flag
     */
    this.finish = function (form, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Booking.finish;
        openData['domain'] = '/booking/payment-successcomplete';
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.submit(form, openData);
    };

    /**
     * 예매상세
     * AppDomain.Booking.detail
     * @param params
     * - completeTransNo
     * @param flag
     */
    this.detail = function(params, flag) {
        if (!params) return;
        if (!params['completeTransNo']) return;

        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Booking.detail('fn_ticketClose');
        openData['domain'] = '/booking/payment-successcomplete';
        openData['params'] = params;
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        if (isApp()) {
            AppHandler.Common.href(openData);
        } else {
            openData['layerHeaderBlockAt'] = 'Y';
            gfn_moCusLayer(openData);
        }
    };

    /**
     * 모바일 티켓
     * AppDomain.Booking.mobileTicket
     * @param params
     * - tranNo
     * - bokdType
     * @param flag
     */
    this.mobileTicket = function(params, flag, url) {
        if (!params) return;
        if (!params['tranNo']) return;

        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Booking.mobileTicket('fn_ticketClose');
        if(url) {
            openData['domain'] = url;
        } else {
            openData['domain'] = '/mypage/mobileticket';
        }

        var authToken = "";
        if(params.authToken) {
            authToken = params.authToken;
        }

        openData['params'] = {
                imageType: 'TYPE1',  // 이미지 사이즈 타입 : 숫자가 클수록 사이즈가 작음 (TYPE1 이 약 200Kb)
                tranNo: params['tranNo'],
                bokdType: params['bokdType'],
                authToken: authToken
        };
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        if (isApp()) {
            AppHandler.Common.href(openData);
        } else {
            openData['layerHeaderBlockAt'] = 'Y';
            openData['changeFunNmAt'] = 'N';
            gfn_moCusLayer(openData);
        }
    };

    /**
     * 모바일 티켓 (type form)
     * AppDomain.Booking.ticket
     * @param form
     * @param flag
     */
    this.ticket = function (form, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Booking.mobileTicket('fn_ticketClose');
        openData['domain'] = '/mypage/mobileticket';
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.submit(form, openData);
    };

    /**
     * 이벤트 서버 모바일 티켓 (type form)
     * AppDomain.Booking.megaEvTicket
     * @param form
     * @param flag
     */
    this.megaEvTicket = function (form, flag) {
    	if (!flag) flag = AppDomain.Flag.isDefault;

    	var openData = AppHeader.Booking.mobileTicket('fn_ticketClose');
    	openData['domain'] = '/megaEv/mypage/mobileticket';
    	openData['refresh'] = flag.refresh;
    	openData['isCloseAll'] = flag.isCloseAll;
    	openData['isClose'] = flag.isClose;

    	AppHandler.Common.submit(form, openData);
    };

    /**
     * 티켓나누기
     * AppDomain.Booking.shareTicket
     * @param params
     * - sellTranNo
     * - seatUniqNo
     * @param flag
     */
    this.shareTicket = function(params, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Booking.shareTicket('fn_ticketDtl');
        openData['domain'] = '/on/oh/ohb/MobileTicket/viewMobileTicketSharePage.do';
        openData['params'] = params;
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 비회원 예매 내역
     * AppDomain.Booking.nonMember
     * @param flag
     */
    this.nonMember = function(flag, params) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Booking.nonMember;
        openData['domain'] = '/non-member';
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        if(params) {
            openData['params'] = params;
        }

        AppHandler.Common.href(openData);
    }

    /**
     * 전자출입명부
     * AppDomain.Booking.internetPass
     * @param flag
     */
    this.internetPass = function(params, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Booking.internetPass;
        openData['domain'] = '/on/oh/ohb/MobileTicket/internetPass';
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        if (params) {
            openData['params'] = params;
        }

        if (isApp()) {
            AppHandler.Common.href(openData);
        } else {
            openData['layerHeaderBlockAt'] = 'Y';
            openData['changeFunNmAt'] = 'N';
            gfn_moCusLayer(openData);
        }
    }

    /**
     * tdi 광고
     * AppDomain.Booking.tdiAdLink
     * @param flag
     */
    this.tdiAdLink = function(params, flag) {
        var data = {
            domain: params.linkUrl
            , title: {
                type: "text"
                , text: ''
            }, btnLeft: {
                type: 'back'
            }
        }
        AppHandler.Common.href(data);
    }

    /**
     * 카카오 차량번호 추가
     * @param option
     * @param flag
     */
    this.parkingNoReg = function(paramData, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;
        var data = {
            domain: '/on/oh/ohb/MobileTicket/moveParkingNoReg.do',
            params: paramData,
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '차량번호 추가'
            },
            btnLeft: {
                type: 'back'
            },
            animation: 'popup',
            refresh: flag.refresh,
            isCloseAll: flag.isCloseAll,
            isClose: flag.isClose
        };

        if (isApp()) {
            AppHandler.Common.href(data);
        } else {
            data.layerGrayAt  = 'Y';
            gfn_moCusLayer(data);
        }
    }

    /**
     * 카카오 주차등록 차량 목록
     * @param option
     * @param flag
     */
    this.parkingRegList = function(paramData, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
            domain: '/on/oh/ohb/MobileTicket/moveParkingRegList.do',
            params: paramData,
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '주차등록 차량'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup',
            refresh: flag.refresh,
            isCloseAll: flag.isCloseAll,
            isClose: flag.isClose
        };

        if (isApp()) {
            AppHandler.Common.href(data);
        } else {
            data.layerGrayAt  = 'Y';
            gfn_moCusLayer(data);
        }
    }

    /**
     * 카카오주차 이용 약관 페이지 이동
     * @param option
     * @param flag
     */
    this.parkingUseInfo = function(paramData, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
            domain: '/on/oh/ohb/MobileTicket/moveParkingUseInfo.do',
            params: paramData,
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '제3자 정보 제공동의'
            },
            btnRight: {
                type: 'close'
            },
            refresh: flag.refresh,
            isCloseAll: flag.isCloseAll,
            isClose: flag.isClose
        };

        if (isApp()) {
            AppHandler.Common.href(data);
        } else {
            data.layerGrayAt  = 'Y';
            gfn_moCusLayer(data);
        }
    }
}

/* 영화 */
var Movie = function() {
    var that = this;

    this.genre = function() {
        that.list('genre');
    };

    /**
     * 영화목록
     * AppDomain.Movie.list
     * @param tabName
     * @param flag
     */
    this.list = function(tabName, flag, movieCttsTyCd, movieCttsOrd) {
        if(controlAction.isExec()) return;

        controlAction.on();

        flag = flag || AppDomain.Flag.isDefault;

        var openData = AppHeader.Movie.list;
        openData['domain'] = '/movie/' + tabName || 'boxoffice';
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;


        /////////////////////////////////////////////////////
        ////// TODO 영화 콘텐트 클릭으로 이동 /////////////////
        /////////////////////////////////////////////////////
        if(movieCttsTyCd != "" && movieCttsTyCd != null && movieCttsTyCd != "undefined"){
            var params = {
                movieCttsTyCd: movieCttsTyCd,
                movieCttsOrd: movieCttsOrd
            };
            openData['params'] = params;
        }
        /////////////////////////////////////////////////////


        AppHandler.Common.href(openData);
    };

    /**
     * 영화상세
     * AppDomain.Movie.detail
     * @param params
     * - rpstMovieNo
     * - tabCd
     * @param flag
     */
    this.detail = function(params, flag) {
        if(controlAction.isExec()) return; controlAction.on();
        if (!params) return;
        if (!params['rpstMovieNo']) return;

        if (!flag) flag = AppDomain.Flag.isRefresh;

        var openData = AppHeader.Movie.detail;
        openData['domain'] = '/movie-detail';
        openData['params'] = params;
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 영화상세
     * AppDomain.Movie.backwordDetail
     * @param params
     * - rpstMovieNo
     * - tabCd
     * - backword
     * @param flag
     */
    this.backwordDetail = function (params, flag) {
        if(controlAction.isExec()) return; controlAction.on();
        if (!params) return;
        if (!params['rpstMovieNo']) return;

        if (params['backword']) {
            params['back'] = params['backword'];
        } else {
            params['back'] = '';
        }

        if (!flag) flag = AppDomain.Flag.isRefresh;

        var openData = AppHeader.Movie.detail;
        openData['domain'] = '/movie-detail';
        openData['params'] = params;
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 영화상세 무대인사
     * AppDomain.Movie.backwordDetail
     * @param params
     * - rpstMovieNo
     * - tabCd
     * - backword
     * @param flag
     */
    this.backwordDetailWithStageGreeting = function (params, flag) {
        if(controlAction.isExec()) return; controlAction.on();
        if (!params) return;
        if (!params['rpstMovieNo']) return;

        if (params['backword']) {
            params['back'] = params['backword'];
        } else {
            params['back'] = '';
        }

        if (!flag) flag = AppDomain.Flag.isRefresh;

        var openData = AppHeader.Movie.detail;
        openData['domain'] = '/movie-detail/curtaincall';
        openData['params'] = params;
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 영화상세
     * AppDomain.Movie.detailBackBranch
     * @param params
     * - brchNo1
     * - brchNo2
     * - brchNo3
     * - playDe
     * - movieNo
     * - startPoint
     * @param flag
     */
    this.detailBackBranch = function (params, flag) {
        if(controlAction.isExec()) return; controlAction.on();
        if (!params) return;
        if (!params['movieNo']) return;

        params['rpstMovieNo'] = params['movieNo'];

        if (!flag) flag = AppDomain.Flag.isRefresh;

        var openData = AppHeader.Movie.detail;
        openData['domain'] = '/movie-detail';
        openData['params'] = params;
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 영화상세 - 한줄평
     * AppDomain.Movie.detailOneLine
     * @param params
     * - rpstMovieNo
     * - tabCd
     * - backword
     * @param flag
     */
    this.detailOneLine = function (params, flag) {
        if(controlAction.isExec()) return; controlAction.on();
        if (!params) return;
        if (!params['rpstMovieNo']) return;

        if (!flag) flag = AppDomain.Flag.isRefresh;

        if (params['backword']) {
            params['back'] = params['backword']
        }

        var openData = AppHeader.Movie.detail;
        openData['domain'] = '/movie-detail/comment';
        openData['params'] = params;
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /*
     * 영화상세 스틸컷
     * AppDomain.Movie.stillcutPhotoView
     * @param params
     * @param flag
     */
    this.stillcutPhotoView = function(params, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Movie.stillcutPhotoView(params['stillMovieName']);
        openData['domain'] = '/on/oh/oha/Movie/stillcutPhotoV.do';
        openData['params'] = params;
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 영화검색
     * AppDomain.Movie.search
     * @param flag
     */
    this.search = function(flag) {
        if(controlAction.isExec()) return; controlAction.on();

        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Movie.search;
        openData['domain'] = '/movie/search';
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 무비포스트
     * AppDomain.Movie.moviePost
     * @param params
     * @param flag
     */
    this.moviePost = function(params, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        if (!params) {
            params = { searchWord: '' };
        }

        if (!params['searchWord']) params['searchWord'] = '';

        var openData = AppHeader.Movie.moviePost;
        openData['domain'] = '/moviepost/all';
        openData['params'] = params;
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 무비포스트 상세
     * AppDomain.Movie.postDetail
     * @param moviePostNo
     * @param flag
     */
    this.postDetail = function(moviePostNo, flag) {
        if(controlAction.isExec()) return;
        if (!moviePostNo) return;

        controlAction.on();

        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Movie.postDetail;
        openData['domain'] = '/moviepost/detail';
        openData['params'] = { moviePostNo: moviePostNo };
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        if (isApp()) {
            AppHandler.Common.href(openData);
        } else {
            gfn_moCusLayer(openData);
        }
    };

    /**
     * 큐레이션 - 소개
     * AppDomain.Movie.curationIntroduce
     * @param flag
     */
    this.curationIntroduce = function(flag) {
        if(controlAction.isExec()) return;

        controlAction.on();

        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Movie.curation;
        openData['domain'] = '/curation/specialcontent';
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 큐레이션 - 클레식소사이어티
     * AppDomain.Movie.curationClassicsociety
     * @param flag
     */
    this.curationClassicsociety = function(flag) {
        if(controlAction.isExec()) return;

        controlAction.on();

        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Movie.curation;
        openData['domain'] = '/curation/classicsociety';
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 큐레이션 - 필름소사이어티
     * AppDomain.Movie.curationFilmsociety
     * @param flag
     */
    this.curationFilmsociety = function(flag) {
        if(controlAction.isExec()) return;

        controlAction.on();

        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Movie.curation;
        openData['domain'] = '/curation/filmsociety';
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 큐레이션 - 디즈니시네마
     * AppDomain.Movie.curationDisney
     * @param flag
     */
    this.curationDisney = function(flag) {
        if(controlAction.isExec()) return;

        controlAction.on();

        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Movie.curation;
        openData['domain'] = '/curation/disney';
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 기대평쓰기
     * AppDomain.Movie.oneLineReview
     * @param params
     * @param flag
     */
    this.oneLineReview = function(params, flag) {
        if(controlAction.isExec()) return;
        if (!params) return;

        controlAction.on();

        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Movie.oneLineWrite(params['onelnEvalDivCd']);
        if(isApp()) {
            openData.header['closeAction'] = params.myPage == 'Y' ? "gfn_selLayerCls(\'last\')" : "gfn_selLayerClsMsg";
        }
        openData['domain'] = '/movie/oneline-review';
        openData['params'] = params;
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;
        openData['closeMsgType'] = params.myPage == 'Y' ? 'last' : 'end';
        openData['openerAction'] = 'fn_rtnOneLineReview';
        openData['closeHeaderData'] = params.myPage == 'Y' ? AppDomain.MyMegabox.Headers.ticketBook : AppHeader.Movie.detail;

        gfn_moCusLayer(openData);
    };

    /**
     * 무비포스트 작성
     * AppDomain.Movie.posting
     * @param params
     * - movieNm
     * - atchFileNo
     * - movieNo
     * - rpstMovieNo
     * - moviePostImgDivCd
     * - myPage
     * @param flag
     */
    this.posting = function(params, flag) {
        if(controlAction.isExec()) return;
        if (!params) return;

        controlAction.on();

        if (!flag) flag = AppDomain.Flag.isDefault;
        if (!params['movieNo']) params['movieNo'] = params['rpstMovieNo'];
        if (!params['rpstMovieNo']) params['rpstMovieNo'] = params['movieNo'];
        params['mergeType'] = 'I';

        var openData = AppHeader.Movie.postWrite;
        openData['domain'] = '/moviepost/writePost';
        openData['params'] = params;
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        if (isApp()) {
            AppHandler.Common.href(openData);
        } else {
            gfn_moCusLayer(openData);
        }
    };

    /**
     * 무비포스트 수정
     * AppDomain.Movie.postModify
     * @param params
     * - movieNo
     * - moviePostNo
     * @param flag
     */
    this.postModify = function(params, flag) {
        if (controlAction.isExec()) return;
        if (!params) return;

        controlAction.on();

        if (!flag) flag = AppDomain.Flag.isDefault;
        params['mergeType'] = 'U';

        var openData = AppHeader.Movie.postWrite;
        openData.title['text'] = '무비포스트 수정';
        openData['domain'] = '/moviepost/writePost';
        openData['params'] = params;
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;


        if (isApp()) {
            AppHandler.Common.href(openData);
        } else {
            gfn_moCusLayer(openData);
        }
    };

    /**
     * 무비포스트 등록
     * AppDomain.Movie.postRegister
     * @param params
     * @param flag
     */
    this.postRegister = function(params, flag) {
        if(controlAction.isExec()) return;

        controlAction.on();

        if (!flag) flag = AppDomain.Flag.isDefault;

        params = params || {};
        var closeHeader = params['myPage'] == 'Y' ? AppHeader.MyMegabox.movieStory : AppHeader.Movie.moviePost;
        if(params['reselected'] == 'Y') {
            closeHeader = AppHeader.Movie.postWrite;
            params['reselected'] = '';
        }

        var openData = AppHeader.Movie.postRegister('gfn_selLayerCls');
        openData['domain'] = '/moviepost/write';
        openData['params'] = params;
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;
        if(window.location.pathname == '/main') openData['params'].isMain = 'Y';

        if(isApp() && openData['params'].isMain == 'Y') {
            openData['header'].closeAction = '';
            AppHandler.Common.href(openData);
        } else {
            openData['closeHeaderData'] = closeHeader;
            gfn_moCusLayer(openData);
        }
    };

    /**
     * 사운드무비
     * AppDomain.Movie.soundMovie
     * @param flag
     */
    this.soundMovie = function(flag) {
        if(controlAction.isExec()) return;

        controlAction.on();

        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Movie.soundMovie;
        openData['domain'] = '/soundmovie';
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };
};

/* 멤버십 */
var Membership = function() {
    /**
     * 스페셜멤버십 가입
     * AppDomain.Membership.filmJoin
     */
    this.filmJoin = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Membership.filmJoin;
        openData['domain'] = '/curation/filmsociety/join';
        openData['params'] = {accMyAt : isMypage()? 'Y' : 'N'};
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        if (isApp()) {
            if (!controlAction.isExec()) {
                controlAction.on();
                AppHandler.Common.href(openData);
            }
        } else {
            openData['openerAction'] = 'fn_reClassicJoin';
            gfn_moCusLayer(openData);
        }
    };

    /**
     * 스페셜멤버십 가입
     * AppDomain.Membership.classicJoin
     */
    this.classicJoin = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Membership.classicJoin;
        openData['domain'] = '/curation/classicsociety/join';
        openData['params'] = {accMyAt : isMypage()? 'Y' : 'N'};
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        if (isApp()) {
            if (!controlAction.isExec()) {
                controlAction.on();
                AppHandler.Common.href(openData);
            }
        } else {
            openData['openerAction'] = 'fn_reClassicJoin';
            gfn_moCusLayer(openData);
        }
    };

    /**
     * 클럽멤버십 리스트
     * AppDomain.Membership.clubMbShip
     * @param flag
     */
    this.clubMbShip = function(flag) {
    	if(controlAction.isExec()) return;

    	controlAction.on();

    	if (!flag) flag = AppDomain.Flag.isDefault;

    	var openData = AppHeader.Membership.clubMbShip;
    	openData['domain'] = '/megaClubMembership';
    	openData['refresh'] = flag.refresh;
    	openData['isCloseAll'] = flag.isCloseAll;
    	openData['isClose'] = flag.isClose;

    	AppHandler.Common.href(openData);
    };

    /**
     * 클럽멤버십 안내
     * AppDomain.Membership.clubMbShipInfo
     * @param flag
     */
    this.clubMbShipInfo = function(flag) {
    	if (!flag) flag = AppDomain.Flag.isDefault;

    	var data = {
    			domain: '/megaClubMembership/megaClubInfo',
    			header: {
    				type: 'default'
    			},
    			title: {
    				type: 'text',
    				text: '클럽 멤버십 안내사항'
    			},
    			btnRight: {
    				type: 'close'
    			},
    			animation: 'popup',
    			refresh: flag.refresh,
    			isCloseAll: flag.isCloseAll,
    			isClose: flag.isClose
    	};

    	if (isApp()) {
    		if (!controlAction.isExec()){
    			controlAction.on();
    			AppHandler.Common.href(data);
    		}
    	} else {
    		data.layerGrayAt  = 'N';
    		gfn_moCusLayer(data);
    	}
    };

    /**
     * 클럽멤버십 - 메가매니아
     * AppDomain.Membership.megaMania
     * @param flag
     */
    this.megaMania = function(flag) {
    	if(controlAction.isExec()) return;

    	controlAction.on();

    	if (!flag) flag = AppDomain.Flag.isDefault;

    	var openData = AppHeader.Membership.megaMania;
    	openData['domain'] = '/megaClubMembership/megaMania';
    	openData['refresh'] = flag.refresh;
    	openData['isCloseAll'] = flag.isCloseAll;
    	openData['isClose'] = flag.isClose;

    	AppHandler.Common.href(openData);
    };

    /**
     * 클럽멤버십 - 메가 패밀리
     * AppDomain.Membership.megaFamily
     * @param flag
     */
    this.megaFamily = function(tab, flag) {
        if(controlAction.isExec()) return;

        controlAction.on();

        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Membership.megaFamily;
        openData['domain'] = '/megaClubMembership/megaFamily';
        if(tab != undefined && tab != null && tab != 'undefined' && tab != '') {
            openData['params'] = { tabIdx: tab };
        }
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 클럽멤버십 - 메가프리미엄
     * AppDomain.Membership.megaPremium
     * @param tab, flag
     */
    this.megaPremium = function(tab, flag) {
        if(controlAction.isExec()) return;

        controlAction.on();

        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Membership.megaPremium;
        openData['domain'] = '/megaClubMembership/megaPremium';
        if(tab != undefined && tab != null && tab != 'undefined' && tab != '') {
            openData['params'] = { tabIdx: tab };
        }
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 클럽멤버십 - 메가트랜디
     * AppDomain.Membership.megaTrendy
     * @param tab, flag
     */
    this.megaTrendy = function(tab, flag) {
        if(controlAction.isExec()) return;

        controlAction.on();

        if (!flag) flag = AppDomain.Flag.isDefault;
        if (!tab) tab = '1';

        var openData = AppHeader.Membership.megaTrendy;
        openData['domain'] = '/megaClubMembership/megaTrendy';
        openData['params'] = { tab: tab };
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 클럽멤버십 - 메가 돌비
     * AppDomain.Membership.megaDolby
     * @param flag
     */
    this.megaDolby = function(tab, flag) {
        if(controlAction.isExec()) return;

        controlAction.on();

        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Membership.megaDolby;
        openData['domain'] = '/megaClubMembership/megaDolby';
        if(tab != undefined && tab != null && tab != 'undefined' && tab != '') {
            openData['params'] = { tabIdx: tab };
        }
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };
};

/* 메가핫딜 */
var Hotdeal = function() {
    /**
     * 메가핫딜 목록
     * AppDomain.Hotdeal.list
     */
    this.list = function(flag) {
        if(controlAction.isExec()) return;
        controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Hotdeal.list;
        openData['domain'] = '/mega-hotdeal';
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 메가핫딜 상세
     * AppDomain.Hotdeal.detail
     */
    this.detail = function(movieNm, eventNo, flag) {
        if(controlAction.isExec()) return;
        controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Hotdeal.detail(movieNm);
        openData['domain'] = '/mega-hotdeal/detail';
        openData['params'] = { eventNo: eventNo };
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 임시예매권
     * AppDomain.Hotdeal.tempTicket
     * @params params
     * - tranNo
     * - eventNo
     * @param flag
     */
    this.tempTicket = function(params, flag) {
        if (controlAction.isExec()) return;
        if (!params) return;
        if (!params['tranNo']) return;

        controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;
        if (!params['eventNo']) params['eventNo'] = '';

        var openData = AppHeader.Hotdeal.tempTicket;
        openData['domain'] = '/on/om/oma/MagaHotdeal/MegaHotdealPayCompltPV.do';
        openData['params'] = params;
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 메가핫딜 안내
     * AppDomain.Hotdeal.guide
     */
    this.guide = function(flag) {
        if(controlAction.isExec()) return;

        controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Hotdeal.guide;
        openData['domain'] = '/mega-hotdeal/guide';
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };
};

/* 극장 */
var Theater = function () {
    /**
     * 극장목록
     * AppDomain.Theater.list
     */
    this.list = function(flag) {
        if(controlAction.isExec()) return;

        controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Theater.list;
        openData['domain'] = '/theater/list';
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 극장상세
     * AppDomain.Theater.detail
     * @param params
     * - brchNo
     * - brchNm
     * - areaCd
     */
    this.detail = function (params, flag) {
        if (controlAction.isExec()) return;
        if (!params) return;

        controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Theater.detail(params['brchNm']);
        openData['domain'] = '/theater';
        openData['params'] = params;
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 특별관
     * AppDomain.Theater.specialDetail
     */
    this.specialDetail = function(kindCd, flag) {
        if (controlAction.isExec()) return;
        if (!kindCd) return;

        controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var jsonUrl = {
             "TBQ" : "/specialtheater/boutique"
           , "MX"  : "/specialtheater/dolbyatmos"
           , "CFT" : "/specialtheater/comfort"
           , "MKB" : "/specialtheater/megakids"
           , "TFC" : "/specialtheater/firstclub"
           , "DBC" : "/specialtheater/dolby"
           , "TBP" : "/specialtheater/boutique/private"
           , "TBS" : "/specialtheater/boutique/suite"
           , "MX4D": "/specialtheater/megamx4d"
           , "LUMINEON": "/specialtheater/megaled"
           , "RCL": "/specialtheater/recliner"
           , "DVA": "/specialtheater/dva"
        }

        var openData = AppHeader.Theater.specialDetail(kindCd);
        openData['domain'] = jsonUrl[kindCd];
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 특별관 리스트로 이동
     * AppDomain.Theater.specialList
     */
    this.specialList = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Theater.specialList;
        openData['domain'] = '/special-theater/list';
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 관람료
     * AppDomain.Theater.admissionFee
     * @param params
     * - areaCd
     * - brchNo
     */
    this.admissionFee = function(params, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Theater.admissionFee;
        openData['domain'] = '/on/oh/ohc/Brch/AdmissionFeePage.do';
        openData['params'] = params;
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        if(isApp()){
        	if(controlAction.isExec()) return;
            controlAction.on();
        	AppHandler.Common.href(openData);
        }else{
        	gfn_moCusLayer(openData);
        }
    }

    /**
     * 관람료
     * AppDomain.Theater.specialAdmissionFee
     */
    this.specialAdmissionFee = function(areaCd, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Theater.admissionFee;
        openData['domain'] = '/on/oh/ohc/Brch/SpecialAdmissionFee.do';
        openData['params'] = { areaCd: areaCd };
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        if(isApp()){
        	if(controlAction.isExec()) return;
            controlAction.on();
        	AppHandler.Common.href(openData);
        }else{
        	openData['layerGrayAt'] = 'Y';
        	gfn_moCusLayer(openData);
        }
    };

    /**
     * 진행중인 무대인사/GV
     * AppDomain.Theater.gvGreetingL
     */
    this.gvGreetingL = function(brchNo, flag) {
    	if (!flag) flag = AppDomain.Flag.isDefault;
    	var data = {
    			domain: '/gvGreetingL',
    			header: {
    				type: 'default'
    			},
    			title: {
    				type: 'text',
    				text: '진행중인 무대인사·GV'
    			},
    			btnRight: {
    				type: 'close'
    			},
    			params : {brchNo : brchNo},
    			animation: 'popup',
    			refresh: flag.refresh,
    			isCloseAll: flag.isCloseAll,
    			isClose: flag.isClose
    	};

    	if (isApp()) {
    		if (!controlAction.isExec()){
    			controlAction.on();
    			AppHandler.Common.href(data);
    		}
    	} else {
    		data.layerAt  = 'Y';
    		gfn_moCusLayer(data);
    	}
    };
};

// 나의 메가박스
var MyMegabox = function() {
    this.Headers = {
            mbshipPointHist: {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '멤버십포인트'
                },
                btnLeft: {
                    type: 'back'
                },
                btnRight: {
                    type: 'menu'
                }
//                ,
//                btnRightSub: {
//                    type: 'sub',
//                    image: 'ico-info',
//                    callback: 'fn_callbackSubInfoBtn'
//                }
            },
            paymentHist: {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '예매/구매 내역'
                },
                btnLeft: {
                    type: 'back'
                }
            },
            movieStory: {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '나의 무비스토리'
                },
                btnLeft: {
                    type: 'back'
                }
            },
            couponList: {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '쿠폰'
                },
                btnLeft: {
                    type: 'back'
                },
                btnRight: {
                    type: 'sub',
                    image: 'ico-info',
                    callback: 'fn_cponLayerOpn'
                }
            },
            movieCouponList: {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '영화관람권'
                },
                btnLeft: {
                    type: 'back'
                },
                btnRight: {
                    type: 'sub',
                    image: 'ico-info',
                    callback: 'fn_mvtckInfoOpn'
                }
            },
            storeCouponList: {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '스토어교환권'
                },
                btnLeft: {
                    type: 'back'
                },
                btnRight: {
                    type: 'sub',
                    image: 'ico-info',
                    callback: 'fn_mvtckInfoOpn'
                }
            },
            regGiftcard: {
    			header: {
    				type: 'default'
    			},
    			title: {
    				type: 'text',
    				text: '카드 등록'
    			},
    			btnRight: {
    				type: 'close'
    			}
            },
            utilDtlsGiftcard: {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '이용내역'
                },
                btnLeft: {
                    type: 'back'
                }
            },
            likeMovie: {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '찜한 영화'
                },
                btnLeft: {
                    type: 'back'
                }
            },
            ticketBook: {
                header: {
                    type: 'default',
                    bgColor: 'F5F5F5'
                },
                title: {
                    type: 'text',
                    text: '티켓북'
                },
                btnLeft: {
                    type: 'back'
                },
                btnRight: {
                    type: 'sub',
                    image: 'ico-plus',
                    callback: 'AppDomain.MyMegabox.watchedMovieReg'
                },
            },
            voteMovie: {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '모두의 영화'
                },
                btnLeft: {
                    type: 'back'
                }
            },
            voteMovieChoice: {
                header: {
                    type: 'default',
                    backAction: 'fn_goBack'
                },
                title: {
                    type: 'text',
                    text: '모두의 영화'
                },
                btnLeft: {
                    type: 'back'
                }
            },
            voteMovieResult: {
                header: {
                    type: 'default',
                    closeAction: 'AppHandler.Common.goMain'
                },
                title: {
                    type: 'text',
                    text: '모두의 영화'
                },
                btnRight: {
                    type: 'close'
                }
            }
    };

    // 멤버십 등급이력
    this.mbshipClassHist = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/myMegabox/membership-history',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '멤버십 등급 이력'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        if (isApp()) {
            if (controlAction.isExec()) return; controlAction.on();
            AppHandler.Common.href(data);
        } else {
            data.layerGrayAt = 'Y';
            gfn_moCusLayer(data);
        }
    };

    // 멤버십 월별 등급이력
    this.mbshipClassMonthHist = function(params, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;
        let openData = {};
        if(params != "" && params != undefined && params != null) {
            openData = {
                aplcYear : params
            };
        }
        var data = {
            domain: '/myMegabox/membership-month-history',
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '멤버십 월별 등급 이력'
            },
            btnRight: {
                type: 'close'
            },
            params: openData,
            animation: 'popup',
            refresh: flag.refresh,
            isCloseAll: flag.isCloseAll,
            isClose: flag.isClose
        };

        if (isApp()) {
            if (controlAction.isExec()) return; controlAction.on();
            AppHandler.Common.href(data);
        } else {
            data.layerGrayAt = 'Y';
            gfn_moCusLayer(data);
        }
    };

    // 멤버십 포인트 내역
    this.mbshipPointHist = function(tab, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;
        if (!tab) tab = '01';

        var data = {
                domain: '/mypage/point-list',
                params: {tab: tab},
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '멤버십포인트'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    // 포인트 선물하기
    this.mbshipPointGift = function(flag) {
         if (!flag) flag = AppDomain.Flag.isDefault;

         var data = {
                 domain: '/mypage/point-gift',
                 header: {
                     type: 'default'
                 },
                 title: {
                     type: 'text',
                     text: '포인트 선물하기'
                 },
                 btnLeft: {
                     type: 'back'
                 },
                 refresh: flag.refresh,
                 isCloseAll: flag.isCloseAll,
                 isClose: flag.isClose
         };

         //if (isApp()) {
             AppHandler.Common.href(data);
         //} else {
         //    data.changeFunNmAt = 'N';
         //    data.openerAction  = 'fn_rtnMbshipPointGift'
         //    gfn_moCusLayer(data);
         //}
    };

    // 포인트 비밀번호 설정
    this.mbshipPointChage = function(flag) {
         if (!flag) flag = AppDomain.Flag.isDefault;

         var data = {
                 domain: '/mypage/point-password',
                 header: {
                     type: 'default'
                 },
                 title: {
                     type: 'text',
                     text: '포인트 비밀번호 설정'
                 },
                 btnLeft: {
                     type: 'back'
                 },
                 refresh: flag.refresh,
                 isCloseAll: flag.isCloseAll,
                 isClose: flag.isClose
         };

         if (isApp()) {
             AppHandler.Common.href(data);
         } else {
             data.changeFunNmAt = 'N';
             gfn_moCusLayer(data);
         }
    };

    // 영화관람권, 스토어교환권 목록
    this.movieStoreCouponList = function(pDivCd, params, flag) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.movieCouponList;
        data.domain = '/mypage/movie-coupon';

        if (pDivCd != 'MOVIE') {
            data = this.Headers.storeCouponList;
            data.domain = '/mypage/store-coupon';
        }

        data.params = {};

        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        if(params != undefined) {
            for(var key in params) {
                data.params[key] = params[key];
            }
        }

        AppHandler.Common.href(data);
    };

    // 메가박스 쿠폰목록
    /*AppDomain.MyMegabox.mageboxCouponList()*/
    this.mageboxCouponList = function(tab, flag) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.couponList;
        data.domain = '/myMegabox/discount';
        data.params = {
                tab: tab
        };
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    };

    /*제휴 쿠폰*/
    /*AppDomain.MyMegabox.mageboxAlliedCouponList()*/
    this.mageboxAlliedCouponList = function(tab, flag) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.couponList;
        data.domain = '/myMegabox/cooperation';
        data.params = {
                tab: tab
        };
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    };

    /*제휴 쿠폰*/
    /*AppDomain.MyMegabox.mageboxNeibhAdCouponList()*/
    this.mageboxNeibhAdCouponList = function(tab, flag) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.couponList;
        data.domain = '/myMegabox/cooperation';
        data.params = {
                tab: tab
        };
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    };

    // 메가박스 쿠폰등록 페이지
    /*AppDomain.MyMegabox.mageboxCouponReg('STORE');*/
    this.mageboxCouponReg = function(cponType, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var title = "";
        switch(cponType){
            case "MOVIE" : title = "영화관람권 등록"	;	break;
            case "STORE" : title = "스토어 교환권 등록";	break;
            default 	 : title = "쿠폰 등록";		break;
        }
        var data = {
                domain: '/mypage/reg-coupon',
                params: {
                    cponType : cponType
                },
                header: {
                    type: 'default',
                    closeAction : 'fn_closeEvent'
                },
                title: {
                    type: 'text',
                    text: title
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        if (isApp()) {
            if (!controlAction.isExec()){
                controlAction.on();
                AppHandler.Common.href(data);
            }
        } else {
            data.layerGrayAt  = 'Y';
            data.openerAction = 'fn_rtnMageboxCouponReg';
            gfn_moCusLayer(data);
        }
    };

    // 메가박스 쿠폰등록 페이지
    /*AppDomain.MyMegabox.mageboxCmboCouponReg('STORE');*/
    this.mageboxCmboCouponReg = function(cponType, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var title = "";
        switch(cponType){
            case "STORE" : title = "스토어 교환권 등록";	break;
            default 	 : title = "쿠폰 등록";		break;
        }
        var data = {
            domain: '/mypage/reg-coupon',
            params: {
                cponType : cponType
            },
            header: {
                type: 'default',
                closeAction : 'fn_closeEvent'
            },
            title: {
                type: 'text',
                text: title
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup',
            refresh: flag.refresh,
            isCloseAll: flag.isCloseAll,
            isClose: flag.isClose
        };

        if (isApp()) {
            if (!controlAction.isExec()){
                controlAction.on();
                AppHandler.Common.href(data);
            }
        } else {
            data.layerGrayAt  = 'Y';
            data.openerAction = 'megaCmboCoupon.fn_getList';
            gfn_moCusLayer(data);
        }
    };

    // 기프트카드 리스트
    this.giftCardList = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/on/oh/ohh/MyGiftCard/GiftCardListL.do',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '나의 기프트카드'
                },
                btnLeft: {
                    type: 'back'
                },
                btnRight: {
                    type: 'menu'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    // 예매/구매내역
    /*AppDomain.MyMegabox.paymentHist(params)*/
    this.paymentHist = function(params, flag) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.paymentHist;
        data.domain = '/mypage/bookinglist';
        data.params = {};
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        if(params != undefined) {
            for(var key in params) {
                data.params[key] = params[key];
            }
        }

        AppHandler.Common.href(data);
    };

    //나의 포인트 이용내역
    /*AppDomain.MyMegabox.myPointHist(params)*/
    this.myPointHist = function(tab, params, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;
        if (!tab) tab = '02';

        var data = {
            domain: '/mypage/point-list',
            params: {tab: tab},
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '멤버십포인트'
            },
            btnLeft: {
                type: 'back'
            },
            refresh: flag.refresh,
            isCloseAll: flag.isCloseAll,
            isClose: flag.isClose
        };

        AppHandler.Common.href(data);

    };

    // 비회원 예매/구매내역
    this.paymentNonHist = function(params) {
        var data = {
            domain: '/mypage/bookinglist',
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '비회원 예매 내역'
            },
            btnRight: {
                type: 'BackMenu'
            },
            animation: 'popup',
            isClose: true,
            isCloseAll: true
        };

        if(params != undefined) {
            for(var key in params) {
                data.params[key] = params[key];
            }
        }

        AppHandler.Common.href(data);
    };

    // 영화관람권/ 스토어 교환권 상세
    this.mvtckDetail = function(option, params, flag){
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: option.url,
                params: params,
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: option.title + ' 상세'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        if (isApp()) {
            if (controlAction.isExec()) return; controlAction.on();
            AppHandler.Common.href(data);
        } else {
            gfn_moCusLayer(data);
        }
    };

    // 예매/구매내역 상세 헤더
    this.headerPaymentHistDetail = function(params) {
        var data = {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: params.title + ' 상세'
                },
                btnRight: {
                    type: 'close'
                }
        };

        return data;
    };

    // 예매/구매내역 상세
    this.paymentHistDetail = function(params, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data        = this.headerPaymentHistDetail(params);
        data.domain     = '/on/oh/ohh/MyBokdPurc/MyBokdPayInfoPopup.do',
        data.params     = params;
        data.animation  = 'popup',
        data.layerGrayAt= 'N',
        data.refresh    = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose    = flag.isClose;

        if (isApp()) {
            AppHandler.Common.href(data);
        } else {
            data.openerAction = 'fn_rtnPaymentHistDetail';
            gfn_moCusLayer(data);
        }
    };

    /*비회원 디테일*/
    this.paymentHistNonDetail = function(params, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data        = this.headerPaymentHistDetail(params);
        //data.domain     = '/on/oh/ohh/NonMbBokd/BokdPayInfoPopup.do',
        data.domain     = '/non-member/bokd/detail',
        data.params     = params;
        data.refresh    = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose    = flag.isClose;

        if (isApp()) {
            AppHandler.Common.href(data);
        } else {
            //data.openerAction = 'fn_rtnPaymentHistDetail';
            data.openerAction = 'fn_getList';
            gfn_moCusLayer(data);
        }
    };

    /* 환불 수수료 결제 */
    this.paymentFdkDetail = function(option, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/on/oh/ohz/PayBooking/MyBokdPayFdkPopup.do',
                params: option.params,
                header: {
                    type: 'default',
                    bgColor: '000000',
                    txtColor: 'ffffff',
                    closeAction : 'gfn_selLayerClsMsg'
                },
                title: {
                    type: 'text',
                    text: '결제취소'
                },
                btnRight: {
                    type: 'close',
                    txtColor: 'ffffff'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        data.closeHeaderData    = option.headerData;
        data.closeMsgType       = 'confirm';
        data.closeMsg           = '진행중인 결제를 중단하시겠습니까?';
        data.openerAction       = 'fn_nextCancelBokd';
        data.layerHeaderBlockAt = 'Y';
        gfn_moCusLayer(data);
    };

    /*AppDomain.MyMegabox.savePointRec();*/
    this.savePointRec = function(transNo, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/on/oh/ohh/MyBokdPurc/MyBokdCashRecPopup.do',
                params: {transNo : transNo},
                header: {
                    type: 'default',
                    closeAction: 'gfn_selLayerCls'
                },
                title: {
                    type: 'text',
                    text: '제휴포인트 추후 적립'
                },
                btnRight: {
                    type: 'close'
                },
                openerAction : 'fn_rtnSavePointRec',
                closeHeaderData : AppDomain.MyMegabox.Headers.paymentHist
        };

        gfn_moCusLayer(data);
    };

    // 나만의 메가박스
    /*AppDomain.MyMegabox.myOwnMegabox();*/
    this.myOwnMegabox = function(flag) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/mypage/manage-myinfo/mbFavorBrchRegM',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '나의 메가박스'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };


    /* 선호 영화관 설정
     * AppDomain.MyMegabox.favorBrchListConf();*/
    this.favorBrchListConf = function(flag){
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain			:	"/on/oh/ohh/PersonInfoMng/mbFavorBrchRegMa.do"
                , params		:	{
                    menuId: 'M-MY-PI-0501'
                    , mappingId : 	''
                }

                , title			:	{
                    type	:	"text"
                    , text	:	"선호극장 설정 변경"
                }
                , btnRight: {
                    type: 'close'
                }
        }
        AppHandler.Common.href(data);
    }

    // 본 영화 등록
    this.watchedMovieReg = function(flag) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/moviestory/watchedMovie/registe',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '본 영화 등록'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };
        if(isApp()) {
            AppHandler.Common.href(data);
        } else {
            data.openerAction = 'fn_rtnWatchedMovieReg';
            gfn_moCusLayer(data);
        }
    };

    // 내 정보 관리
    this.myInfoMng = function(flag) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/mypage/manage-myinfo',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '내 정보 관리'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    // 중앙페이 결제수단 관리
    this.joongAngPayMng = function(option, flag) {
    	if (controlAction.isExec()) return; controlAction.on();
    	if (!flag) flag = AppDomain.Flag.isDefault;

    	var data = {
    			domain: '/mypage/joongAngPayMng',
    			params: option,
    			header: {
    				type: 'default'
    			},
    			title: {
    				type: 'text',
    				text: '중앙페이 결제수단 관리'
    			},
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);

    };

    // 나의 기프트카드
    this.myGiftCard = function(option, flag) {
    	if (controlAction.isExec()) return; controlAction.on();
    	if (!flag) flag = AppDomain.Flag.isDefault;

    	var data = {
    			domain: '/mypage/myGiftCard',
    			params: option,
    			header: {
    				type: 'default'
    			},
    			title: {
    				type: 'text',
    				text: '나의 기프트카드'
    			},
    			btnLeft: {
    				type: 'back'
    			},
    			btnRight: {
    				type: 'sub',
    				image: 'ico-plus',
    				callback: 'fn_moveRegGiftCard'
    			},
    			refresh: flag.refresh,
    			isCloseAll: flag.isCloseAll,
    			isClose: flag.isClose
    	};

    	if(option != undefined && option.hasOwnProperty("utilDtlsBack") && option.utilDtlsBack == 'Y') {
    		data.animation = 'popup';
    	}
    	AppHandler.Common.href(data);
    };

    // 기프트카드 등록
    this.regGiftCard = function(flag) {
    	if (!flag) flag = AppDomain.Flag.isDefault;

    	var data = {
    			domain: '/mypage/myGiftCard/reg-giftCard',
    			header: {
    				type: 'default'
    			},
    			title: {
    				type: 'text',
    				text: '카드 등록'
    			},
    			btnRight: {
    				type: 'close'
    			},
//                btnRightSub: {
//                    type: 'sub',
//                    image: 'ico-info',
//                    callback: 'fn_regInfoOpn'
//                },
    			animation: 'popup',
    			refresh: flag.refresh,
    			isCloseAll: flag.isCloseAll,
    			isClose: flag.isClose
    	};

    	if (isApp()) {
    		if (!controlAction.isExec()){
    			controlAction.on();
    			AppHandler.Common.href(data);
    		}
    	} else {
    		data.layerGrayAt  = 'Y';
    		gfn_moCusLayer(data);
    	}
    };

    // 기프트카드 정지
    this.stopGiftCard = function(option, flag) {
    	if (!flag) flag = AppDomain.Flag.isDefault;

    	var data = {
    			domain: '/mypage/myGiftCard/stop-giftCard',
    			params: option.paramData,
    			header: {
    				type: 'default'
    			},
    			title: {
    				type: 'text',
    				text: '카드정지'
    			},
    			btnRight: {
    				type: 'close'
    			},
    			animation: 'popup',
    			refresh: flag.refresh,
    			isCloseAll: flag.isCloseAll,
    			isClose: flag.isClose
    	};

    	if (isApp()) {
    		if (!controlAction.isExec()){
    			controlAction.on();
    			AppHandler.Common.href(data);
    		}
    	} else {
    		data.layerGrayAt  = 'Y';
    		gfn_moCusLayer(data);
    	}
    };

    // 기프트카드 잔액이전
    this.balTransGiftCard = function(option, flag) {
    	if (!flag) flag = AppDomain.Flag.isDefault;

    	var data = {
    			domain: '/mypage/myGiftCard/balTrans-giftCard',
    			params: option.paramData,
    			header: {
    				type: 'default'
    			},
    			title: {
    				type: 'text',
    				text: '잔액이전'
    			},
    			btnRight: {
    				type: 'close'
    			},
    			animation: 'popup',
    			refresh: flag.refresh,
    			isCloseAll: flag.isCloseAll,
    			isClose: flag.isClose
    	};

    	if (isApp()) {
    		if (!controlAction.isExec()){
    			controlAction.on();
    			AppHandler.Common.href(data);
    		}
    	} else {
    		data.layerGrayAt  = 'Y';
    		gfn_moCusLayer(data);
    	}
    };

    // 기프트카드 환불신청
    this.refundGiftCard = function(option, flag) {
    	if (!flag) flag = AppDomain.Flag.isDefault;

    	var data = {
    			domain: '/mypage/myGiftCard/refund-giftCard',
    			params: option.paramData,
    			header: {
    				type: 'default'
    			},
    			title: {
    				type: 'text',
    				text: '환불신청'
    			},
    			btnRight: {
    				type: 'close'
    			},
    			animation: 'popup',
    			refresh: flag.refresh,
    			isCloseAll: flag.isCloseAll,
    			isClose: flag.isClose
    	};

    	if (isApp()) {
    		if (!controlAction.isExec()){
    			controlAction.on();
    			AppHandler.Common.href(data);
    		}
    	} else {
    		data.layerGrayAt  = 'Y';
    		gfn_moCusLayer(data);
    	}
    };

    //기프트카드 충전 완료 페이지
    this.giftRechgComplPage = function(form, params, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var params = {
            domain: params.domain,
            params: params,
            header: {
                type: 'default',
                closeAction : 'AppHandler.Common.goMain'
            },
            title: {
                type: 'text',
                text: '충전완료'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup',
            refresh: flag.refresh,
            isCloseAll: flag.isCloseAll,
            isClose: flag.isClose
        };

        AppHandler.Common.submit(form, params);
    }

    // 기프트카드 일반충전
    this.giftCardRechg = function(form, flag) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
            domain: '/giftCard/rechg',
            // params: {giftCardNo : form.giftCardNo},
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '일반충전'
            },
            btnLeft: {
                type: 'back'
            },
            refresh: flag.refresh,
            isCloseAll: flag.isCloseAll,
            isClose: flag.isClose
        };

        AppHandler.Common.submit(form, data);
    };
    // 기프트카드 자동충전
    this.giftCardAutoRechg = function(form, flag) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
            domain: '/giftCard/autorechg',
            // params: {giftCardNo : form.giftCardNo},
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '자동충전/해지'
            },
            btnLeft: {
                type: 'back'
            },
            refresh: flag.refresh,
            isCloseAll: flag.isCloseAll,
            isClose: flag.isClose
        };

        AppHandler.Common.submit(form, data);
    };

    // 기프트카드 이용내역
    this.utilDtlsGiftcard = function(option, flag) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
            domain: '/mypage/myGiftCard/cardUtilDtls',
            params: option.paramData,
            header: {
                type: 'default',
                backAction: 'fn_goMyGift'
            },
            title: {
                type: 'text',
                text: '이용내역'
            },
            btnLeft: {
                type: 'back'
            },
            animation: 'popup',
            refresh: flag.refresh,
            isCloseAll: flag.isCloseAll,
            isClose: flag.isClose,
        };
        AppHandler.Common.href(data);
    }

    // 기프트카드 > 리워드 혜택안내
    this.giftCardRewardInfo = function(option, flag) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
            domain: '/mypage/myGiftCard/giftCardRewardInfo',
            header: {
                type: 'default',
                backAction: 'fn_goMyGift'
            },
            title: {
                type: 'text',
                text: '리워드 및 혜택안내'
            },
            btnLeft: {
                type: 'back'
            },
            animation: 'popup',
            refresh: flag.refresh,
            isCloseAll: flag.isCloseAll,
            isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    // 기프트카드 > 리워드 적립내역
    this.giftCardRewardHist = function(option, flag) {
    	if (controlAction.isExec()) return; controlAction.on();
    	if (!flag) flag = AppDomain.Flag.isDefault;

    	var data = {
    			domain: '/mypage/myGiftCard/giftCardRewardHist',
    			header: {
    				type: 'default',
    				backAction: 'fn_goMyGift'
    			},
    			title: {
    				type: 'text',
    				text: 'BOX 적립내역'
    			},
    			btnLeft: {
    				type: 'back'
    			},
    			animation: 'popup',
    			refresh: flag.refresh,
    			isCloseAll: flag.isCloseAll,
    			isClose: flag.isClose
    	};

    	AppHandler.Common.href(data);
    };
    // 마의페이지
    this.myPage = function(flag) {
    	if (controlAction.isExec()) return; controlAction.on();
    	if (!flag) flag = AppDomain.Flag.isDefault;

    	var data = {
    			domain: '/myMegabox',
    			header: {
    				type: 'default'
    			},
    			title: {
    				type: 'text',
    				text: '나의 메가박스'
    			},
    			btnLeft: {
    				type: 'back'
    			},
    			refresh: flag.refresh,
    			isCloseAll: flag.isCloseAll,
    			isClose: flag.isClose
    	};

    	if(isApp()){
    		AppHandler.Common.goMy(data);
    	}else{
    		AppHandler.Common.href(data);
    	}
    };

    // 문의내역
    this.qnaList = function(inqLclCd, flag) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/mypage/myinquiry',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '나의 문의내역'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        if (inqLclCd != undefined) {
            data.domain += '?inqLclCd=' + inqLclCd;
        }

        AppHandler.Common.href(data);
    };

    // 문의내역 상세
    this.qnaDetail = function(option, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/mypage/myinquiry/detail',
                params: option.paramData,
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: option.title +' 상세'
                },
                btnRight: {
                    type: 'close'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        if (isApp()) {
            AppHandler.Common.href(data);
        } else {
           gfn_moCusLayer(data);
        }
    };

    // 비회원 문의내역 상세
    this.nonMbQnaDetail = function(option, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
            domain: '/non-member/nmbrinquiry/detail',
            params: option.paramData,
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: option.title +' 상세'
            },
            btnRight: {
                type: 'close'
            },
            refresh: flag.refresh,
            isCloseAll: flag.isCloseAll,
            isClose: flag.isClose
        };

        if (isApp()) {
            AppHandler.Common.href(data);
        } else {
            gfn_moCusLayer(data);
        }
    };

    // 비회원 문의 내역 모바일웹용
    this.nonMbInquiryList = function(formname, flag) {
        if(controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
            domain: '/non-member/nmbrinquiry',
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '비회원 문의내역'
            },
            btnLeft: {
                type: 'back'
            },
            refresh: flag.refresh,
            isCloseAll: flag.isCloseAll,
            isClose: flag.isClose
        };

        AppHandler.Common.submit(formname, data);
    };

    // 이벤트 응모내역
    this.eventEntryHist = function(flag) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/mypage/myevent',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '나의 응모내역'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    // 무비스토리 (본영화/보고싶어/한줄평/무비포스트)
    this.movieStory = function(divCd, flag) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        if(divCd != '') {
            var data = this.Headers.movieStory;
            data.domain = '/mypage/moviestory';
            data.params = {
                    divCd: divCd
            };
            data.refresh = flag.refresh;
            data.isCloseAll = flag.isCloseAll;
            data.isClose = flag.isClose;

            AppHandler.Common.href(data);
        }
    };

    // 찜한영화
    this.likeMovie = function(flag) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.likeMovie;
        data.domain = '/mypage/likemovie';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    };

    // 티켓북
    this.ticketBook = function(flag) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.ticketBook;
        data.domain = '/mypage/ticketbook';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    };

    // 스페셜 멤버십 가입
    this.specialMembership = function(flag) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/mypage/special-membership',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '스페셜 멤버십'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    // VIP 쿠폰북 안내
    this.vipCouponBookGuide = function(flag) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/vipcoupon/guide',
                header: {
                    type: 'default',
                    overlay: 'clear',
                    bgColor: '160F2B',
                    txtColor: 'ffffff'
                },
                title: {
                    type: 'text',
                    text: 'VIP 쿠폰북'
                },
                btnRight: {
                    type: 'close',
                    txtColor: 'ffffff'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    // VIP 쿠폰북 선택
    this.vipCouponBook = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/vipcoupon/getcoupons',
                header: {
                    type: 'default',
                    overlay: 'clear',
                    bgColor: '160F2B',
                    txtColor: 'ffffff'
                },
                title: {
                    type: 'text',
                    text: 'VIP 쿠폰북'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    // VIP 쿠폰북 최종 선택
    this.vipCouponBookFinal = function(form, thisYear, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/vipcoupon/getcoupons/detail',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: thisYear +' VIP 쿠폰북 선택'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.submit(form, data);
    };

    /*나의 문의내역*/
    this.myinquiry = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/mypage/myinquiry',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '나의 문의내역'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    /**
     * 주문내역/멤버쉽카드
     * Web에서만 사용
     * App는 네이티브에서 직접 호출
     */
    this.myTicketMember = function(flag) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/mypage/ticketlist',
                header: {
                    type: 'default',
                    overlay: 'clear',
                    bgColor: 'opacity',
                    txtColor: 'ffffff'
                },
                title: {
                    type: 'logo'
                },
                btnLeft: {
                    type: 'sub',
                    image: 'ico-barcode-w',
                    callback: 'ticket',
                    params: 'membership',
                    txtColor: 'ffffff'
                },
                btnRight: {
                    type: 'close',
                    txtColor: 'ffffff'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    // 자주쓰는 신용카드
    this.favorUseCreditCard = function(form, flag) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/mypage/manage-myinfo/favorUseCreditCardLb',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '자주쓰는 신용카드'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };
        AppHandler.Common.href(data);
    };

    // 자주쓰는 할인수단
    this.favorUsePayDcMean = function(form, flag) {
    	if (controlAction.isExec()) return; controlAction.on();
    	if (!flag) flag = AppDomain.Flag.isDefault;

    	var data = {
    			domain: '/mypage/manage-myinfo/favorUsePayDcMeanLb',
    			header: {
    				type: 'default'
    			},
    			title: {
    				type: 'text',
    				text: '자주쓰는 할인카드'
    			},
    			btnRight: {
    				type: 'close'
    			},
    			animation: 'popup',
    			refresh: flag.refresh,
    			isCloseAll: flag.isCloseAll,
    			isClose: flag.isClose
    	};
    	AppHandler.Common.href(data);
    };

    // 마케팅 정보 수신동의
    this.marketingAgree = function(flag) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;
        var data = {
                domain: '/mypage/marketing-agree',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '마케팅 정보 수신동의'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };
        AppHandler.Common.href(data);
    }

    // 비밀번호 변경
    this.changePassword = function(flag) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;
        var data = {
                domain: '/change-password',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '비밀번호 변경'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        }
        AppHandler.Common.href(data);
    }

    // 비밀번호 변경 본인인증 확인
    this.changePasswordAuth = function(formname, flag) {
        if(controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
            domain: '/change-password',
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '비밀번호 변경'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup',
            refresh: flag.refresh,
            isCloseAll: flag.isCloseAll,
            isClose: flag.isClose
        }

        AppHandler.Common.submit(formname, data);
    };

    // 회원정보관리
    this.myInfo = function(flag) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isRefresh;
        var data = {
                domain: '/mypage/manage-myinfo/personInfoMng',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '회원정보 관리'
                },
                btnLeft: {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };
        AppHandler.Common.href(data);
    }

    // 회원정보관리 본인인증 확인
    this.myInfoAuth = function(formname, flag) {
        if(controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
            domain: '/mypage/manage-myinfo/personInfoMng',
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '회원정보 관리'
            },
            btnLeft: {
                type: 'back'
            },
            refresh: flag.refresh,
            isCloseAll: flag.isCloseAll,
            isClose: flag.isClose
        };

        AppHandler.Common.submit(formname, data);
    };

    // 쿠폰상세
    this.dcCouponDetail = function(type, params, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;
        var data = {
                domain: '/on/oh/ohh/MyDcCpCpon/infoDcCpono.do',
                params: params,
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '쿠폰상세'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose,
                changeFunNmAt: 'N'
        };

        if (type == 'CPON_CP') {
            data.domain = '/on/oh/ohh/MyDcCpCpon/infoCpCpono.do';
        } else if (type == 'CPON_AD') {
            data.domain = '/on/oh/ohh/MyAdDcCpon/infoNeibhAdCpono.do';
        }
        if (isApp()) {
            if (controlAction.isExec()) return; controlAction.on();
            AppHandler.Common.href(data);
        } else {
            gfn_moCusLayer(data);
        }
    }

    // 쿠폰선물
    this.couponGift = function(params, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;
        var data = {
            domain: '/on/oh/ohh/MyDcCpCpon/goToGiftCoupon.do',
            params: params,
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '쿠폰 선물하기'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup',
            refresh: flag.refresh,
            isCloseAll: flag.isCloseAll,
            isClose: flag.isClose,
            changeFunNmAt: 'N'
        };

        if (isApp()) {
            if (controlAction.isExec()) return; controlAction.on();
            AppHandler.Common.href(data);
        } else {
            gfn_moCusLayer(data);
        }
    }

    /**
     * 비회원 문의내역 확인
     * AppDomain.MyMegabox.nonMbInqCheck
     * @param flag
     */
    this.nonMbInqCheck = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
            domain:	'/nonMember-inq/check',
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '비회원 문의내역 확인'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup',
            refresh: flag.refresh,
            isCloseAll: flag.isCloseAll,
            isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    /**
     * 비회원 문의 내역 페이지 이동
     * AppDomain.MyMegabox.nonMbInquiry
     * @param flag
     */
    this.nonMbInquiry = function(flag, params) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.MyMegabox.nonMbInquiry;
        openData['domain'] = '/non-member/nmbrinquiry';
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        if(params) {
            openData['params'] = params;
        }

        AppHandler.Common.href(openData);
    }

    // 모두의영화 메인
    this.voteMovie = function(flag) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.voteMovie;
        data.domain = '/myScnBoard/voteMovie';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    };

    // 모두의영화
    this.voteMovieChoice = function(form, paramData, flag) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.voteMovieChoice;
        data.domain = '/voteMovie/choice';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        if(paramData) {
            data.params = paramData;
        }

        AppHandler.Common.submit(form, data);
    };

    // 모두의영화-결과
    this.voteMovieResult = function(flag, params) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.voteMovieResult;
        data.domain = '/voteMovie/result';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        if(params) {
            data.params = params;
        }

        AppHandler.Common.href(data);
    };
};

// 혜택
var Benefit = function() {
    this.Headers = {
            viplounge: {
                header: {
                    type: 'default',
                    overlay: 'clear',
                    bgColor: 'opacity',
                    txtColor: 'ffffff'
                },
                title: {
                    type: 'text',
                    text: ''
                },
                btnLeft: {
                    type: 'back',
                    txtColor: 'ffffff'
                }
            },
            mbshipGuide: {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '메가박스 멤버십'
                },
                btnLeft: {
                    type: 'back'
                }
            },
            discountGuide: {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '제휴/할인'
                },
                btnLeft: {
                    type: 'back'
                },
                btnRight: {
                    type: 'menu'
                },
                btnRightSub: {
                    type: 'sub',
                    image: 'ico-search',
                    callback: 'AppDomain.Benefit.discountGuideSearch'
                }
            }
    };

    // VIP 라운지
    this.viplounge = function(flag) {

        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/benefit/viplounge',
                header: {
                     type: 'default',
                     overlay: 'clear',
                     bgColor: 'opacity',
                     txtColor: 'ffffff'
                },
                title: {
                    type: 'text',
                    text: ''
                },
                btnLeft: {
                    type: 'back',
                    txtColor: 'ffffff'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);

        /*
        var data = this.Headers.viplounge;
        data.domain = '/benefit/viplounge';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);*/
    };

    /**
     * 멤버십 안내
     * AppDomain.Benefit.membershipGuide
     */
    this.membershipGuide = function(flag) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Benefit.membershipGuide;
        openData['domain'] = '/benefit/membership';
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    // 포인트 상세 안내
    this.pointDetailGuide = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/benefit/membership',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '포인트 상세 안내'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    // 중앙멤버십 신청
    this.jggMbshipRequest = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/benefit/viplounge/joongang',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '중앙멤버십 신청하기'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    // VIP 스템프 미션
    this.vipStampMission = function(thisYear, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/benefit/viplounge/stamp',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: 'VIP 스탬프 미션'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    // 제휴/할인
    this.discountGuide = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.discountGuide;
        data.domain = '/benefit/discount/guide';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    };

    // 제휴/할인 검색
    this.discountGuideSearch = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/benefit/discount/cardList',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '제휴/할인 검색'
                },
                btnLeft: {
                    type: 'back'
                },
                btnRight: {
                    type: 'menu'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

};

var Member = function() {
    /*AppDomain.Member.loginConfirm()*/
    this.loginConfirm = function() {
        var data = {
                message: '로그인 후 사용가능합니다.\n로그인 하시겠습니까?',
                okFunc: 'AppDomain.Member.login'
        };
        AppHandler.Common.confirm(data);
    };

    /*AppDomain.Member.loginConfirmParamCallback()*/
    this.loginConfirmParamCallback = function(param) {
        var data = {
            message: '로그인 후 사용가능합니다.\n로그인 하시겠습니까?',
            okFunc: 'fn_goLogin'
        };
        AppHandler.Common.confirm(data);
    }

    // 로그인
    /*AppDomain.Member.login();*/
    this.login = function(flag, complete, close) {
        if (!flag) flag = AppDomain.Flag.isClose;
        if (!complete) complete = '';   //로그인 후 실행 function name
        var data = {
                domain:	'/login',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '로그인'
                },
                btnRight: {
                    type: 'close'
                },
                params : {
                    complete : complete
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };
        if(close) data.params.close = close;

        AppHandler.Common.href(data);
    };

    // 비회원로그인
    this.loginNon = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain:	'/nonMember-login',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '비회원 예매확인'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    // 회원가입
    this.join = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/join',
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '회원가입'
                },
                btnLeft: {
                    type: 'back'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    //ID/PW찾기
    this.findIdPwd = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
            domain: '/user-find',
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '아이디/비밀번호찾기'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup',
            refresh: flag.refresh,
            isCloseAll: flag.isCloseAll,
            isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    //회원 재인증
    this.memberCheck = function(flag, certType) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
            domain: '/member-check',
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '회원 재인증'
            },
            btnRight: {
                type: 'close'
            },
            params: {
                certType : certType
            },
            animation: 'popup',
            refresh: flag.refresh,
            isCloseAll: flag.isCloseAll,
            isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };

    // 회원가입 - 회원정보입력
    this.infoRegister = function(flag, formname) {
        if(controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
            domain: '/sign-up',
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '정보입력'
            },
            btnLeft: {
                type: 'back'
            },
            refresh: flag.refresh,
            isCloseAll: flag.isCloseAll,
            isClose: flag.isClose
        };

        AppHandler.Common.submit(formname, data);
    };

    //회원가입완료
    this.signup = function(flag, form) {
        if(controlAction.isExec()) return; controlAction.on();
        var data = {
            domain: '/on/oh/ohg/MbJoin/insertMbJoin.rest',
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '회원가입 완료'
            },
            btnRight: {
                type: 'close'
            },
            params: {},
            refresh: flag.refresh,
            isCloseAll: flag.isCloseAll,
            isClose: flag.isClose
        }
        AppHandler.Common.submit(form, data);
    };
    // 회원가입 약관 동의
    this.agreeChk = function(kind, flag) {
    	if (!flag) flag = AppDomain.Flag.isDefault;

    	var data = {
    			domain: '/join/agreeChk.rest',
    			header: {
    				type: 'default'
    			},
    			title: {
    				type: 'text',
    				text: '약관 동의'
    			},
    			btnRight: {
    				type: 'close'
    			},
                params: {
                	kind: kind
                },
//                btnRightSub: {
//                    type: 'sub',
//                    image: 'ico-info',
//                    callback: 'fn_regInfoOpn'
//                },
    			animation: 'popup',
    			refresh: flag.refresh,
    			isCloseAll: flag.isCloseAll,
    			isClose: flag.isClose
    	};

    	if (isApp()) {
    		if (!controlAction.isExec()){
    			controlAction.on();
    			AppHandler.Common.href(data);
    		}
    	} else {
    		data.layerGrayAt  = 'Y';
    		gfn_moCusLayer(data);
    	}
    };
};

/* 언어변환 */
var Language = function() {
    /**
     * AppDomain.Language.setLangChg
     */
    this.setLangChg = function(locale, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var locale = '${locale}' == "en" ? "kr" : "en";;
        var imgSvrUrl = '${imgSvrUrl}';
        var data = {
                domain: '/booking',
                params: {
                    megaboxLanguage: locale
                },
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '영화 선택'
                },
                btnLeft: {
                    type: 'sub',
                    image: 'ico-list-block',
                    callback: 'fn_changeViewType'
                },
                btnRight: {
                    type: 'close'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.href(data);
    };
};

/* 설정 */
var Setting = function() {
    /**
     * 설정
     * AppDomain.Setting.main
     */
    this.main = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Setting.main;
        openData['domain'] = '/setting';
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 알림함
     * AppDomain.Setting.notification
     */
    this.notification = function(flag) {
        if (fn_rlyLoginchk()) {
            if (controlAction.isExec()) return; controlAction.on();
            if (!flag) flag = AppDomain.Flag.isDefault;

            var openData = AppHeader.Setting.notification;
            openData['domain'] = '/setting/notification';
            openData['refresh'] = flag.refresh;
            openData['isCloseAll'] = flag.isCloseAll;
            openData['isClose'] = flag.isClose;

            AppHandler.Common.href(openData);
        }
    };

    /**
     * 선호극장설정
     * AppDomain.Setting.favorTheater
     */
    this.favorTheater = function(flag) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Setting.favorTheater;
        openData['domain'] = '/on/oh/ohh/PersonInfoMng/mbFavorBrchRegMa.do';
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };
};

/* 고객센터 */
var Support = function() {
    /**
     * 고겍센터
     * AppDomain.Support.main
     */
    this.main = function(flag) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Support.main;
        openData['domain'] = '/support';
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 이용약관
     * AppDomain.Support.terms
     */
    this.terms = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Support.terms;
        openData['domain'] = '/support/terms';
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        if(isApp()){
            if(controlAction.isExec()) return; controlAction.on();
            AppHandler.Common.href(openData);
        }else{
            gfn_moCusLayer(openData);
        }
    };

    /**
     * 위치기반서비스 이용약관
     * AppDomain.Support.lcinfo
     */
    this.lcinfo = function(flag) {
    	if (!flag) flag = AppDomain.Flag.isDefault;

    	var openData = AppHeader.Support.lcinfo;
    	openData['domain'] = '/support/lcinfo';
    	openData['refresh'] = flag.refresh;
    	openData['isCloseAll'] = flag.isCloseAll;
    	openData['isClose'] = flag.isClose;

    	if(isApp()){
    		if(controlAction.isExec()) return; controlAction.on();
    		AppHandler.Common.href(openData);
    	}else{
    		gfn_moCusLayer(openData);
    	}
    };

    /**
     * 개인정보 취급방침
     * AppDomain.Support.privacy
     */
    this.privacy = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Support.privacy;
        openData['domain'] = '/support/privacy';
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        if(isApp()){
            if(controlAction.isExec()) return; controlAction.on();
            AppHandler.Common.href(openData);
        }else{
            gfn_moCusLayer(openData);
        }
    };

    /**
     * 공지사항
     * AppHeader.Support.notice
     */
    this.notice = function(data, flag) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;
        var openData = AppHeader.Support.notice;
        openData['domain'] = '/support/notice';
        if(data){
        	openData['params'] = data;
        }
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 공지사항 상세
     * AppDomain.Support.noticeDetail
     */
    this.noticeDetail = function(form, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Support.noticeDetail;
        openData['domain'] = '/support/notice/detail';
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        if (isApp()) {
            if (controlAction.isExec()) return; controlAction.on();
            AppHandler.Common.submit(form, openData);
        } else {
            openData['params'] = $(form).serializeObject();
            gfn_moCusLayer(openData);
        }
    };

    /**
     * 자주묻는 질문
     * AppDomain.Support.faq
     */
    this.faq = function(flag) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Support.faq;
        openData['domain'] = '/support/faq';
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 1:1 문의
     * AppDomain.Support.inquiry
     */
    this.inquiry = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Support.inquiry;
        openData['domain'] = '/support/inquiry';
        openData['params'] = {accMyAt : isMypage()? 'Y' : 'N'};
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        if (isApp()) {
           if (controlAction.isExec()) return; controlAction.on();
            AppHandler.Common.href(openData);
        } else {
            openData['openerAction'] = 'fn_rtnCustInqReg';
            gfn_moCusLayer(openData);
        }
    };

    /**
     * 분실물 문의 - 접수
     * AppDomain.Support.lostForm
     */
    this.lostForm = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Support.lostForm;
        openData['domain'] = '/support/lost/form';
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        if (isApp()) {
            if (!controlAction.isExec()) {
                controlAction.on();
                AppHandler.Common.href(openData);
            }
        } else {
            openData['openerAction'] = 'fn_rtnCustInqReg';
            gfn_moCusLayer(openData);
        }
    }

    /**
     * 분실물 문의
     * AppDomain.Support.lost
     */
    this.lose = function(flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Support.lose;
        openData['domain'] = '/support/lost';
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 문의내역 상세
     * AppDomain.Support.lostDetail
     */
    this.lostDetail = function(option, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Support.lostDetail(option.title);
        openData['domain'] = '/support/lost/detail';
        openData['params'] = option.paramData;
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        if (isApp()) {
            if(controlAction.isExec()) return; controlAction.on();
            AppHandler.Common.href(openData);
        } else {
           gfn_moCusLayer(openData);
        }
    };

    /**
     * 단체관람 및 대관문의
     * AppDomain.Support.rent
     */
    this.lent = function(areaCd, brchNo, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Support.rent;
        openData['domain'] = '/support/rent';
        openData['params'] = {accMyAt : isMypage()? 'Y' : 'N', areaCd : areaCd, brchNo : brchNo};
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        if (isApp()) {
            if (controlAction.isExec()) return; controlAction.on();
            AppHandler.Common.href(openData);
        } else {
            openData['openerAction'] = 'fn_rtnCustInqReg';
            gfn_moCusLayer(openData);
        }
    };

    /**
     * 앱개선 문의
     * AppDomain.Support.app
     */
    this.app = function(flag) {
        if (controlAction.isExec()) return; controlAction.on();
        if (!flag) flag = AppDomain.Flag.isDefault;

        var openData = AppHeader.Support.app;
        openData['domain'] = '/support/app-inquiry';
        openData['refresh'] = flag.refresh;
        openData['isCloseAll'] = flag.isCloseAll;
        openData['isClose'] = flag.isClose;

        AppHandler.Common.href(openData);
    };

    /**
     * 공지사항
     * AppHeader.Support.giftcardinfo
     */
    this.giftcardinfo = function(flag) {

    	if (!flag) flag = AppDomain.Flag.isDefault;

    	var openData = AppHeader.Support.giftcardinfo;
    	openData['domain'] = '/support/giftcardinfo';
    	openData['refresh'] = flag.refresh;
    	openData['isCloseAll'] = flag.isCloseAll;
    	openData['isClose'] = flag.isClose;

    	if(isApp()){
    		if(controlAction.isExec()) return; controlAction.on();
    		AppHandler.Common.href(openData);
    	}else{
    		gfn_moCusLayer(openData);
    	}
    };
};

var Store = function() {

    this.Headers = {
            storeDtlPage: {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '상품상세'
                },
//                btnRight: {
//                    type: 'close'

//                }
                btnLeft : {
                    type: 'back'
                }
            },

            storeUseBrchHeader : {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '사용가능 극장'
                },
                btnRight: {
                    type: 'close'
                }
            }
    };

    // 주문표
    this.comboOrder = function(data, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;
        var data = {
                domain: '/mobile-order/waiting',
                params: {
                    transNo: data.transNo,
                    brchNm : data.brchNm,
                    brchNo : data.brchNo,
                    storeNo: data.storeNo,
                    firstAt: data.firstAt,
                    payList: data.payList
                },
                header: {
                    type: 'default',
                    closeAction : 'fn_ticketClose'
                },
                title: {
                    type: 'text',
                    text: '주문내역'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        }

        if (isApp()) {
            AppHandler.Common.href(data);
        } else {
            gfn_moCusLayer(data);
        }
    };

    // 상품 디테일
    /*AppDomain.Store.storeDtlPage(prdtCd, prdtNo);*/
    this.storeDtlPage = function(prdtCd, prdtNo, flag, prdt) {  /* 제품번호, 제품코드 */
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = this.Headers.storeDtlPage;
        data.domain = '/store/detail';
        data.params = {};
        if(prdtCd) data.params.prdtCd = prdtCd;
        if(prdtNo) data.params.prdtNo = prdtNo;
        if(prdt) data.params.prdt = prdt;
//        data.animation = 'popup',
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    }

    this.storeDtlNPage = function(prdtCd, prdtNo, flag) {
    	if (!flag) flag = AppDomain.Flag.isDefault;

    	var data = this.Headers.storeDtlPage;
    	data.domain = '/store/ndetail';
    	data.params = {};
    	if(prdtCd) data.params.prdtCd = prdtCd;
    	if(prdtNo) data.params.prdtNo = prdtNo;
    	data.refresh = flag.refresh;
    	data.isCloseAll = flag.isCloseAll;
    	data.isClose = flag.isClose;

    	AppHandler.Common.href(data);
    }

    /*AppDomain.Store.storeUseItemBrch(cmbndKindNo);*/
    this.storeUseItemBrch = function(cmbndKindNo, cmbndNo, flag) {  /* 제품번호, 통합권번호, 제품코드 */
        if (!flag) flag = AppDomain.Flag.isDefault;
        if (controlAction.isExec()) return; controlAction.on();

        var data = this.Headers.storeUseBrchHeader;
        data.domain = '/on/oh/ohd/StoreDtl/selectStoreMobileBrchList.do';
        data.params = {
                cmbndKindNo: cmbndKindNo,
                cmbndNo : cmbndNo
        };
        data.header = {
            type: 'default'
        },
        data.title = {
            type: 'text',
            text: '사용가능 극장'
        },
        data.animation = 'popup',
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    }

    this.useCponBrchList = function(paramData, flag){

    	if (!flag) flag = AppDomain.Flag.isDefault;
        if (controlAction.isExec()) return; controlAction.on();

        var data = this.Headers.storeUseBrchHeader;
        data.domain = '/on/oh/ohh/MyDcCpCpon/infoDcCponoBrchList.do';
        data.params = {
        		cponNo : paramData.cponNo,
        		cancelElement : paramData.cancelElement
        };
        data.header = {
            type: 'default'
        },
        data.title = {
            type: 'text',
            text: '사용가능 극장'
        },
        data.animation = 'popup',
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    }

    // 스토어 디테일 레이어 오픈
    this.storeDtlLayerPageOpn = function(elId, elCttsId, prdtNo){
        var flag = flag || AppDomain.Flag.isDefault;
        var duration = 200;
        var data = {
                domain: '/store/detail',
                params: {
                	prdtNo: prdtNo
                },
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '상품상세'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        if(isApp()){
            AppDomain.Store.storeDtlPage('', prdtNo);
//            AppHandler.Common.href(data);
        }else{
            $.ajax({
                url: "/on/oh/ohd/StoreDtl/selectStoreDtl.do",
                type: "POST",
                contentType: "application/json;charset=UTF-8",
                data: JSON.stringify({prdtNo: prdtNo}),
                success: function (data, status, xhr) {
                    AppHandler.Common.setHeader(data);
                    $("body").addClass("no-scroll");
                    $("#"+elCttsId).html(data);
                    $("#"+elId).css("z-index",gfn_maxZindex()).removeClass("display-none").css("top","0px").elSlideUp(duration);
                },
                error: function(xhr, status, error){
                    AppHandler.Common.alert('Screen loading error');
                }
            });
        }

    }

    this.payment = function(form, params, flag) {
    //결제 페이지
        if (!flag) flag = AppDomain.Flag.isDefault;

        var params = {
                domain: '/store/payment',
                params: params,
                header: {
                    type: 'default',
                    closeAction: 'fn_redisDelete',
                    backAction: 'fn_redisDelete'
                },
                title: {
                    type: 'text',
                    text: '결제하기'
                },
//                btnRight: {
//                    type: 'close'
//                },
                btnLeft : {
                    type: 'back'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

    	if (typeof sessionStorage.NetFunnel_ID != "undefined"){
    		var netKey = sessionStorage.NetFunnel_ID;
    		params['netKey'] = netKey;
    	}

        AppHandler.Common.submit(form, params);
    }

    this.present = function(form, params, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain: '/store/gift',
                params: params,
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '선물하기'
                },
//                btnRight: {
//                    type: 'close'
//                },
                btnLeft: {
                    type: 'back'
                },
//                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

         AppHandler.Common.submit(form, data);
    }

    //결제 완료 페이지
    this.storePayComplPage = function(form, params, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

        var params = {
                domain: params.domain,
                params: params,
                header: {
                    type: 'default',
                    closeAction : 'AppHandler.Common.goStore'
                },
                title: {
                    type: 'text',
                    text: '구매완료'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup',
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };

        AppHandler.Common.submit(form, params);
    }
}

var Layer = function() {

    this.login = function(viewUrl, layerRenderName, completeFunction, closeFunction, ticketingAt, displayNoneTagId) {

    	if(!ticketingAt) {
            ticketingAt = 'Y';
        }
    	var logChk = false;
    	if (completeFunction == 'fn_timeOnClick' || completeFunction == 'fn_loginCallback'){
    		logChk = true;
    	}

        var oData = {
            render : layerRenderName
            , complete: completeFunction
            , close: closeFunction
            , ticketingAt: ticketingAt
        };

        $.ajax({
            url: viewUrl,
            type: "POST",
            contentType: "application/json;charset=UTF-8",
            headers: gfn_appHeaders(),
            data: JSON.stringify(oData),
            success: function (data, status, xhr) {
                if(displayNoneTagId) {
                    $("#"+displayNoneTagId).addClass("display-none");
                } else {
                    $('#headerSub').addClass('display-none');
                    $('.container').addClass('display-none');
                }

                $('#'+layerRenderName).html(data);

                if(isApp()) {
                	if (logChk){
                		var param = {
                				header: {
                					type: 'default',
                					closeAction: 'fn_layerClose2',
                					backAction: 'fn_layerClose2'
                				},
                				title: {
                					type: 'text',
                					text: '로그인'
                				},
                				btnRight: {
                					type: 'close'
                				}
                		};
                	}else{
                		var param = {
                				header: {
                					type: 'default',
                					closeAction: 'fn_layerClose',
                					backAction: 'fn_layerClose'
                				},
                				title: {
                					type: 'text',
                					text: '로그인'
                				},
                				btnRight: {
                					type: 'close'
                				}
                		};
                	}

                    AppHandler.Common.setHeader(param);

                    if(displayNoneTagId) {
                        $("#"+displayNoneTagId).addClass("display-none");
                    } else {
                        $('#headerSub').addClass('display-none');
                    }

                    $('#loginView').css("padding-top","0px");
                    $('body, html').animate({scrollTop:0}, 50);
                }
            },
            error: function(xhr, status, error){
                AppHandler.Common.alert('Screen loading error');
            }
        });
    };

    this.pwChange = function(viewUrl, layerRenderName, completeFunction, closeFunction) {
        var paramData = {
            render : layerRenderName
            , complete: completeFunction
            , close: closeFunction
        };

        $.ajax({
            url: viewUrl,
            type: "POST",
            contentType: "application/json;charset=UTF-8",
            data: JSON.stringify(paramData),
            success: function (data, status, xhr) {
                $('#headerSub').addClass('display-none');
                $('.container').addClass('display-none');
                $('#'+layerRenderName).html(data);

                if(isApp()) {
                    var param = {
                        header: {
                            type: 'default',
                            closeAction: 'fn_layerSubClose',
                            backAction: 'fn_layerSubClose'
                        },
                        title: {
                            type: 'text',
                            text: '비밀번호 변경'
                        },
                        btnRight: {
                            type: 'close'
                        }
                    };

                    AppHandler.Common.setHeader(param);
                    $('#headerSub').addClass('display-none');
                    $('.pwd-header').addClass('display-none');
                    $('#pwChangeView').css("padding-top","0px");
                }
            },
            error: function(xhr, status, error){
                AppHandler.Common.alert('Screen loading error');
            }
        });
    };

    this.marketAgree = function(viewUrl, layerRenderName, completeFunction, closeFunction) {
        var paramData = {
            render : layerRenderName
            , complete: completeFunction
            , close: closeFunction
        };

        $.ajax({
            url: viewUrl,
            type: "POST",
            contentType: "application/json;charset=UTF-8",
            data: JSON.stringify(paramData),
            success: function (data, status, xhr) {
                $('#headerSub').addClass('display-none');
                $('.container').addClass('display-none');
                $('#'+layerRenderName).html(data);

                if(isApp()) {
                    var param = {
                        header: {
                            type: 'default',
                            closeAction: 'fn_layerSubClose',
                            backAction: 'fn_layerSubClose'
                        },
                        title: {
                            type: 'text',
                            text: '마케팅 정보 수신동의'
                        },
                        btnRight: {
                            type: 'close'
                        }
                    };

                    AppHandler.Common.setHeader(param);
                    $('#headerSub').addClass('display-none');
                    $('.mkt-header').addClass('display-none');
                    $('#marketAgreeView').css("padding-top","0px");
                }
            },
            error: function(xhr, status, error){
                AppHandler.Common.alert('Screen loading error');
            }
        });
    };

    this.setting = function(viewUrl, layerRenderName, closeFunction) {
        var oData = {
            render : layerRenderName
            , close: closeFunction
        };

        $.ajax({
            url: viewUrl,
            type: "POST",
            contentType: "application/json;charset=UTF-8",
            headers: gfn_appHeaders(),
            data: JSON.stringify(oData),
            success: function (data, status, xhr) {
                if(isApp()) {
                    var param = {
                        header: {
                            type: 'default',
                            backAction: closeFunction
                        },
                        title: {
                            type: 'text',
                            text: '설정'
                        },
                        btnLeft: {
                            type: 'back'
                        }
                    };
                    AppHandler.Common.setHeader(param);

                    //$('#headerSub').addClass('display-none');
                    //$('#loginView').css("padding-top","0px");
                    //$('body, html').animate({scrollTop:0}, 50);
                }

                $("#theaterChoiceWrap").addClass("display-none");
                $('#'+layerRenderName).html(data);
            },
            error: function(xhr, status, error){
                AppHandler.Common.alert('Screen loading error');
            }
        });
    };

}

var MobileOrder = function() {
    this.Headers = {
            mobileOrderGuide: {
                header: {
                    type: 'default'
                },
                btnRight: {
                    type: 'close'
                },
                title: {
                    type: 'text',
                    text: '모바일오더'
                }
            }
    };

    /*AppDomain.MobileOrder.mobileOrderMenu(brchNo,brchNm);*/
    this.mobileOrderMenu = function(brchNo, brchNm, storeNo, flag) {

        if (!flag) flag = AppDomain.Flag.isDefault;
        //        domain: '/on/oh/ohd/StorePreOrder/cmboMenuPL.do',
        var data = {
                domain: '/mobile-order/list',
                params: {
                    page: 'cmboMenuPL',
                    brchNo: brchNo,
                    brchNm: brchNm,
                    storeNo: storeNo
                },
                header: {
                    type: 'default',
                    overlay: 'clear',
                    bgColor: 'opacity',
                    txtColor: '000000'
                },
                title: {
                    type: 'text',
                    text: "모바일오더"
                },
                btnLeft: {
                    type: 'back',
                    txtColor: '000000'
                },
                btnRight: {
                    type: 'sub',
                    image: 'ico-cart',
                    txtColor: '000000',
                    callback: 'fn_mvBasketPV'
                },
                refresh: flag.refresh,
                isCloseAll: flag.isCloseAll,
                isClose: flag.isClose
        };
        AppHandler.Common.href(data);
    }

    /*AppDomain.MobileOrder.mobileOrderGuide();*/
    this.mobileOrderGuide = function (flag) {
        controlAction.off();
        // AppHandler.Common.goOrder();

        /* 앱 배포 이전 시점까지 임시로 사용! */
        var data = {
            callback: "_mobileOrderGuideAppCurrentVersionCallback"
        }
        AppHandler.Common.appCurrentVersion(data);
        var obj = this;
        window._mobileOrderGuideAppCurrentVersionCallback = function (data) {
            var version = parseInt(data.version.replace(/\./gi, ""));
            if (version >= 410) {
                AppHandler.Common.goOrder();
            } else {
                if (!flag) flag = AppDomain.Flag.isDefault;

                var data = obj.Headers.mobileOrderGuide;
                data.domain = '/mobile-order/guide';
                data.animation = 'popup';
                data.refresh = flag.refresh;
                data.isCloseAll = flag.isCloseAll;
                data.isClose = flag.isClose;

                AppHandler.Common.href(data);
            }
        }
    }

    /* 극장선택, 메뉴리스트
     * AppDomain.MobileOrder.mobileOrderPrdtBrch(form, data)*/
//    this.mobileOrderBrch = function(form, paramData, flag) {
//    	if (!flag) flag = AppDomain.Flag.isDefault;
//
//    }
    /* 극장선택, 메뉴리스트
     * AppDomain.MobileOrder.mobileOrderPrdtBrch(form, data)*/
    this.mobileOrderPrdtBrch = function(form, paramData, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;

//        var data = paramData;
        if(paramData.params.menuId == "M-AM-PO-02"){
            var data = {
                    header: {
                        type: 'default'
                    },
                    btnRight : {
                        type: 'close'
                    }
            }
            $.extend(paramData, data);
        }else{
            var data = {
                    header: {
                        type: 'default'
                    },
                    btnLeft : {
                        type: 'back'
                    },
                    btnRight : {
                        type: 'sub',
                        image: 'ico-cart',
                        txtColor: '000000',
                        callback: 'fn_mvBasketPV'
                    }
            }
            $.extend(paramData, data);
        }

        paramData.animation = 'popup';
        paramData.refresh = flag.refresh;
        paramData.isCloseAll = flag.isCloseAll;
        paramData.isClose = flag.isClose;

        AppHandler.Common.submit(form, paramData);
    }

    /*AppDomain.MobileOrder.cmboMenuList(paramData)*/
    this.cmboMenuList = function(paramData, flag){
        var data = {
                domain:	"/mobile-order/list",
                params		:	{
                    menuId: 'M-AM-PO-03',
                    brchNo: paramData.brchNo,
                    brchNm: paramData.brchNm,
                    storeNo:paramData.storeNo,
                    mappingId: ''
                },
                header: {
                    type: 'default'
                },
                btnLeft : {
                    type: 'back'
                },
                title : {
                    text : '모바일오더',
                    type : 'text'
                },
                btnRight : {
                    type: 'sub',
                    image: 'ico-cart',
                    badge: paramData.basketCnt,
                    txtColor: '000000',
                    callback: 'fn_mvBasketPV'
                }
        }

        data.animation = 'popup';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.close(data);
    }

    /*장바구니*/
    /* AppDomain.MobileOrder.cmboBasket(form, data)*/
    this.cmboBasket = function(form, paramData, flag) {
        if (!flag) flag = AppDomain.Flag.isDefault;
        var data = {
                domain			:	"/mobile-order/cart"
                , params		:	{
                    menuId: 'M-AM-PO-05'
                }
                , title			:	{
                    type	:	"text"
                    , text	:	"장바구니"
                }
                , btnLeft : {
                    txtColor: '000000'
                    , type: 'back'
                }, header : {
                    type : 'default',
                    backAction : 'fn_mvCmboMenu'
                }
        }
        data.animation = 'popup';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.submit(form, data);
    }

    /*나만의메뉴*/
    /* AppDomain.MobileOrder.goMyMenu(form, data)*/
    this.goMyMenu = function(form, paramData, flag) {
    	if (!flag) flag = AppDomain.Flag.isDefault;
    	var data = {
    			domain			:	"/mobile-order/mymenu"
    				, params		:	{
    					menuId: 'M-AM-PO-09'
    				}
    	, title			:	{
    		type	:	"text"
    			, text	:	"나만의 메뉴"
    	}
    	, btnLeft : {
    		txtColor: '000000'
    			, type: 'back'
    	}, header : {
    		type : 'default',
    		backAction : 'fn_goCmboMenu'
    	}
    	}
    	data.animation = 'popup';
    	data.refresh = flag.refresh;
    	data.isCloseAll = flag.isCloseAll;
    	data.isClose = flag.isClose;

    	AppHandler.Common.submit(form, data);
    }


    /* 모바일오더 메뉴 -> 스토어교환권 레이어
     * AppDomain.MobileOrder.comboSearchVcCmbnd()*/
    this.comboSearchVcCmbnd = function(flag){
        if (!flag) flag = AppDomain.Flag.isDefault;
        var data = {
            domain			:	"/on/oh/ohd/StorePreOrder/searchVcCmbnd.do"
            , params		:	{

            }
            , btnRight : {
                type: 'close'
            }
            , title			:	{
                type	:	"text"
                , text	:	"스토어 교환권"
            }
        }
        data.animation = 'popup';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);

    }

    /* 장바구니
     * AppDomain.MobileOrder.cmboBasketPM(form, data)*/
    this.cmboBasketPM = function(form, paramData, flag){
        if (!flag) flag = AppDomain.Flag.isDefault;
        var data = {
                domain			:	"/mobile-order/cart"
                , params		:	{
                    menuId: 'M-AM-PO-05'
                    , mappingId: ''
                }
                , btnLeft : {
                    type: 'back'
                }
                , title			:	{
                    type	:	'text'
                    , text	:	'장바구니'
                }
                , header : {
                    type : 'default',
                    backAction : 'fn_goCmboMenu'
                }
        }

        $.extend(data, paramData);

        data.animation = 'popup';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.submit(form, data);
    }

    /*콤보메뉴 결제*/
    /* AppDomain.MobileOrder.comboPayment(form, paramData)*/
    this.comboPayment = function(form, paramData, flag){
        if (!flag) flag = AppDomain.Flag.isDefault;
        var data = {
            domain			:	"/mobile-order/payment"
            , params		:	{
                menuId: 'M-AM-PO-05'
                , mappingId: ''
            }
            , btnLeft : {
                type: 'back'
            }
            , title			:	{
                type	:	"text"
                , text	:	"결제하기"
            }
            , header : {
                type : 'default',
                backAction : 'fn_comboPrdtList'
            }
        }

        $.extend(data, paramData);

        data.animation = 'popup';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.submit(form, data);
    }
    /*콤보메뉴 디테일*/
    /* AppDomain.MobileOrder.comboPrdtListDtl(itemNo, brchNo, brchNm, itemId, badgeCnt, storeNo)*/
    this.comboPrdtListDtl = function(itemNo, brchNo, brchNm, itemId, badgeCnt, storeNo, flag){
        if (!flag) flag = AppDomain.Flag.isDefault;

        var data = {
                domain			:	"/on/oh/ohd/StorePreOrder/cmboMenuDtlsPM.do"
            	, header: {
                    type: 'default',
                    backAction : 'fn_cmboMenu'
                }
                , params		:	{
                    itemNo : itemNo,
                    brchNo : brchNo,
                    brchNm : brchNm,
                    storeNo: storeNo,
                    menuId: 'M-AM-PO-05'
                }
                , btnLeft : {
                    txtColor: '000000'
                    , type: 'back'
                }
                , btnRight : {
                    type: 'sub',
                    image: 'ico-cart',
                    txtColor: '000000',
                    badge: badgeCnt || 0,
                    callback: 'fn_mvBasketPV'
                }
                , title			:	{
                    type	:	"text"
                    , text	:	"상품상세"
                }
        }
        if(itemId != ''){
            data.params.itemId = itemId;
        }
        data.animation = 'popup';
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    }
}

var MovieFeed = function () {
    this.list = function (flag) {
        if (!flag) flag = AppDomain.Flag.isRefresh;

        var data = {
            domain: "/movieFeed/list"
            , header: {
                type: 'default',
            }
            , btnLeft: {
                type: 'back'
            }
            , title: {
                type: "text"
                , text: "Movie Feed"
            }
        }
        data.refresh = flag.refresh;
        data.isCloseAll = flag.isCloseAll;
        data.isClose = flag.isClose;

        AppHandler.Common.href(data);
    };

    this.detail = function (movieFeedNo, parentAction) {
        var data = {
            domain: "/movieFeed/detail"
            , params: {
                movieFeedNo: movieFeedNo
            }
            , title: {
                type: "text"
                , text: ''
            }
        }

        $.extend(data, Header.MovieFeed.detail);

        if (parentAction) {
            data.header.parentAction = parentAction;
        }

        AppHandler.Common.href(data);
    }

    this.detailForOldVersion = function (movieFeedNo, parentAction) {
        var data = {
            domain: "/movieFeed/detail"
            , params: {
                movieFeedNo: movieFeedNo
            }
        }

        $.extend(data, Header.MovieFeed.detailForOldVersion);

        if (parentAction) {
            data.header.parentAction = parentAction;
        }

        AppHandler.Common.href(data);
    }
}

var _click = false;
var _clickcontrolTimer;
var Interfere = function() {
    this.click = function(delayTime) {
        /*if(!delayTime) { delayTime = 3000; }
        if(_click) {
            return true;
        } else {
            _click = true;
            _clickcontrolTimer = setTimeout(function () {
                _click = false;
                clearTimeout(_clickcontrolTimer);
            }, delayTime);
            return false;
        }*/
        return false;
    };

    this.clear = function() {
        _click = false;
        if(_clickcontrolTimer) {
            clearTimeout(_clickcontrolTimer);
        }
    };
};

$(window).on("beforeunload", function (e){
    if(_clickcontrolTimer) {
        try { clearTimeout(_clickcontrolTimer); } catch(e) {console.log("clearTimeout Exception");}
    }
});

var AppDomain = new function() {
    this.Flag = new Flag();
    this.Event = new Event();
    this.Booking = new Booking();
    this.Movie = new Movie();
    this.Membership = new Membership();
    this.Hotdeal = new Hotdeal();
    this.Theater = new Theater();
    this.MyMegabox = new MyMegabox();
    this.Benefit = new Benefit();
    this.Member = new Member();
    this.Language = new Language();
    this.Setting = new Setting();
    this.Support = new Support();
    this.Store = new Store();
    this.Layer = new Layer();
    this.MobileOrder = new MobileOrder();
    this.MovieFeed = new MovieFeed();
    this.Interfere = new Interfere();
}