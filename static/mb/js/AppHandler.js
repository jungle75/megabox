/*******************************************************************************
 * 01. 업무구분 : Native Handler
 * 02. 화면명   : 모바일 공통
 * 03. 화면설명 : 웹에서 네이티브 호출하는 인터페이스
 * 04. 작성자   : 채운기
 * 05. 작성일   : 2019.04.16
 * =============================================================================
 * 06. 수정이력 : 수정자          내용
 * =============================================================================
 *   2019.04.16   채운기    최초생성
 ******************************************************************************/

/**
 * 모바일 앱 체크
 * @returns Boolean - 앱:true, 웹:false
 */
var isApp = function() {
    var result = false;
    var filterData = 'MegaBox';

    if (navigator.userAgent.indexOf(filterData) > -1) {
        return result = true;
    }

    return result;
};

var isMypage = function() {
    var pathname = document.location.pathname;

    if (pathname.indexOf('/myMegabox') != -1) return true;
    if (pathname.indexOf('/mypage')    != -1) return true;
    if (pathname.indexOf('/ohh')       != -1) return true;

    return false;
}

/**
 * 모바일 OS 구분
 * @returns String - IOS, Android
 */
function osType() {
    var type = 'IOS';
    if (navigator.userAgent.indexOf('Android') > -1 || navigator.userAgent.indexOf('ANDROID') > -1) {
        type = 'ANDROID';
    }
    return type;
};

function osTypeWithWeb() {
    var type = 'MOBILEWEB';
    if (navigator.userAgent.toLocaleLowerCase().indexOf('android') > -1) {
        type = 'ANDROID';
    } else if(navigator.userAgent.toLocaleLowerCase().indexOf('iphone') > -1) {
        type = 'IOS';
    }
    return type;
}

var setCookie = function(name, value, expires, path, domain, secure) {
    var time = new Date();
    expires = expires ? time.setDate(time.getDate() + expires) : '';
    path = path ? '; path='+path : '';
    domain = domain ? '; domain=' + domain : '';
    secure = secure ? '; secure' : '';
    document.cookie=name+'='+escape(value)+(expires?'; expires='+time.toGMTString():'')+path+domain+secure;
}

/**
 * 파라메터 Null 체크
 * @param param: String
 * @returns Boolean: Null 일 때, true
 */
function isNull(param) {
    if (param == null || param == undefined || param == 'undefined' || param == '') {
        return true;
    }
    else {
        return false;
    }
}

/**
 * 앱 RNB TAG 명 적용
 * @param param: String
 * @returns Boolean: Null 일 때, true
 */
function orderTagName(){
	return ",";
}

/**
 * Native 인터페이스
 */
var Bridge = function() {

    /**
     * IOS, Android 구분별 Native Handler
     * @returns Object
     */
    var Handler = function() {
        var appHandler;
        if (osType() == 'IOS') {
            appHandler = window.webkit.messageHandlers.MegaBox;
        }
        else {
            appHandler = window.MegaBox;
        }
        return appHandler;
    };

    /**
     * 하단 탭 메뉴로 이동
     * @param item: String - 탭 구분 (movie, store, booking, event, my)
     * @return N/A
     */
    this.selectTabBar = function(item, params) {
        var object = {
                type: 'selectTabBar',  // Native 메소드 명 (IOS용)
                data: {
                    item: item,
                    params: params
                }
        };

        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().selectTabBar(JSON.stringify(object));
        }
    };

    /**
     * 메인 메뉴로 이동(NEW)
     * @param link
     * @return N/A
     */
    this.newSelectTabBar = function(link, params) {
    	var object = {
    			type: 'selectTabBar',  // Native 메소드 명 (IOS용)
    			data: {
    				link: link,
    				params: params
    			}
    	};

    	if (osType() == 'IOS') {
    		Handler().postMessage(object);
    	}
    	else {
    		Handler().selectTabBar(JSON.stringify(object));
    	}
    };

    /**
     * 새로운 화면 오픈
     * @param data: Object - 화면호출 시 필요한 정보
     * @return N/A
     */
    this.open = function(data) {
        var object = { type: 'open', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().open(JSON.stringify(object));
        }
    };

    /**
     * 현재 화면 닫기
     * @returns N/A
     */
    this.close = function() {
        var object = { type: 'close' };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().close();
        }
    };

    /**
     * 사이드 메뉴 닫기
     * @returns N/A
     */
    this.sideMenuClose = function() {
        var object = { type: 'sideMenuClose' };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().sideMenuClose();
        }
    };

    /**
     * Native Toast
     * @param message: String - 메시지 내용
     * @returns N/A
     */
    this.toast = function(message) {
        var object = {
                type: 'toast',
                data: {
                    message: message
                }
        };

        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().toast(JSON.stringify(object));
        }
    };

    /**
     * Native Alert
     * @param title  : String - 타이틀
     * @param message: String - 내용
     * @param okText : String - 확인 버튼 텍스트
     * @param okFunc : String - 확인 버튼 콜백 함수 (콜백이 없을 때, '' 값으로 세팅)
     * @param okData : Object - 확인 버튼 콜백 함수 파라메터
     * @returns okFunc(okData)
     */
    this.alert = function(title, message, okText, okFunc, okData) {
        var object = {
                type: 'alert',
                data: {
                    title: title,
                    message: message,
                    okText: okText,
                    okFunc: okFunc,
                    okData: okData
                }
        };

        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().alert(JSON.stringify(object));
        }
    };

    /**
     * Native Confirm
     * @param title     : String - 타이틀
     * @param message   : String - 내용
     * @param okText    : String - 확인 버튼 텍스트
     * @param okFunc    : String - 확인 버튼 콜백 함수 (콜백이 없을 때, '' 값으로 세팅)
     * @param okData    : Object - 확인 버튼 콜백 함수 파라메터
     * @param cancelText: String - 취소 버튼 텍스트
     * @param cancelFunc: String - 취소 버튼 콜백 함수 (콜백이 없을 때, '' 값으로 세팅)
     * @param cancelData: Object - 취소 버튼 콜백 함수 파라메터
     * @returns okFunc(okData) or cancelFunc(cancelData)
     */
    this.confirm = function(title, message, okText, okFunc, okData, cancelText, cancelFunc, cancelData) {
        var object = {
                type: 'confirm',
                data: {
                    title: title,
                    message: message,
                    okText: okText,
                    okFunc: okFunc,
                    okData: okData,
                    cancelText: cancelText,
                    cancelFunc: cancelFunc,
                    cancelData: cancelData
                }
        };

        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().confirm(JSON.stringify(object));
        }
    };

    /**
     * 권한 체크 후 설정 화면 호출
     * @param data 권한 체크 정보
     * @returns data.callback({ success: 1 })
     */
    this.checkPermission = function(data) {
        var object = { type: 'checkPermission', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().checkPermission(JSON.stringify(object));
        }
    };

    /**
     * 위치정보 가져오기
     * @param data 콜백 함수 정보
     * @returns data.callback({ success: 1, latitude: '123.456', longitude: '123.456' })
     */
    this.location = function(data) {
        var object = { type: 'location', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().location(JSON.stringify(object));
        }
    };

    /**
     * GPS 여부 가져오기
     * @param data 콜백 함수 정보
     * @returns data.callback({ })
     */
    this.isGpsEnable = function(data) {

    	var object = { type: 'isGpsEnable', data: data };

        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().isGpsEnable(JSON.stringify(object));
        }

    };

    /**
     * 알림동의 여부 확인
     * @param data 콜백 함수 정보
     * @returns data.callback({ })
     */
    this.isNotificationEnable = function(data) {

    	var object = { type: 'isNotificationEnable', data: data };

    	if (osType() == 'IOS') {
    		Handler().postMessage(object);
    	}
    	else {
    		Handler().isNotificationEnable(JSON.stringify(object));
    	}

    };

    /**
     * 극장리스트 조회
     * @param data 콜백 함수 정보
     * @returns data.callback({ })
     */
    this.selectBranchList = function(data) {

    	var object = { type: 'selectBranchList', data: data };

    	if (osType() == 'IOS') {
    		Handler().postMessage(object);
    	}
    	else {
    		Handler().selectBranchList(JSON.stringify(object));
    	}

    };

    /**
     * 알림동의 설정 이동
     * @param data 콜백 함수 정보
     * @returns data.callback({ })
     */
    this.notificationOn = function(data) {

    	var object = { type: 'notificationOn', data: data };

    	if (osType() == 'IOS') {
    		Handler().postMessage(object);
    	}
    	else {
    		Handler().notificationOn(JSON.stringify(object));
    	}

    };

    /**
     * 흔들어 멤버십 GET / 자주쓰는 신용카드 유효기간 가져오기
     * @param data 콜백 함수 정보
     * @returns data.callback({ })
     */
    this.isShakeEnable = function(data) {

    	var object = { type: 'getData', data: data };

    	if (osType() == 'IOS') {
    		Handler().postMessage(object);
    	}
    	else {
    		Handler().getData(JSON.stringify(object));
    	}

    };

    /**
     * 흔들어 멤버십 SET / 자주쓰는 신용카드 유효기간 저장(암호화)
     * @param data 콜백 함수 정보
     * @returns data.callback({ })
     */
    this.setShakeEnable = function(data) {

    	var object = { type: 'saveData', data: data };

    	if (osType() == 'IOS') {
    		Handler().postMessage(object);
    	}
    	else {
    		Handler().saveData(JSON.stringify(object));
    	}

    };

    /**
     * GPS 여부 가져오기
     * @param data 콜백 함수 정보
     * @returns data.callback({ })
     */
    this.gpsOn = function() {

    	var object = { type: 'gpsOn'};

    	if (osType() == 'IOS') {
    		return;
    	}
    	else {
    		Handler().gpsOn();
    	}

    };

    /**
     * 장바구니 현재 카운트 SET
     * @param data 콜백 함수 정보
     * @returns data.callback({ })
     */
    this.setOrderBkCount = function(data) {

    	var object = { type: 'setOrderBkCount', data: data };

    	if (osType() == 'IOS') {
    		Handler().postMessage(object);
    	}
    	else {
    		Handler().setOrderBkCount(JSON.stringify(object));
    	}

    };

    /**
     * 카메라 화면 호출
     * @param data 콜백 함수 정보
     * @returns data.callback({ success: 1, image: 'base64 string' })
     */
    this.camera = function(data) {
        var object = { type: 'camera', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().camera(JSON.stringify(object));
        }
    };

    /**
     * 앨범 화면 호출
     * @param data 콜백 함수 정보
     * @returns data.callback({ success: 1, image: 'base64 string' })
     */
    this.photoLibrary = function(data) {
        var object = { type: 'photoLibrary', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().photoLibrary(JSON.stringify(object));
        }
    };

    /**
     * 연락처 선택 화면
     * @param data 콜백 함수 정보
     * @returns data.callback({ success: 1, phoneNumber: '01012341234', name: '홍길동' })
     */
    this.contactPicker = function(data) {
        var object = { type: 'contactPicker', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().contactPicker(JSON.stringify(object));
        }
    };

    /**
     * 해더 변경
     * @param data 해더 정보
     * @returns N/A
     */
    this.setHeader = function(data) {
        var object = { type: 'setHeader', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().setHeader(JSON.stringify(object));
        }
    };

    /**
     * 현재 설치된 앱 버젼 가져오기
     * @oaram data 앱 버젼 리턴받을 함수 정보
     * @returns data.callback({ os: 'IOS or Android', code: 9, version: '1.0.0' })
     */
    this.appCurrentVersion = function(data) {
        var object = { type: 'appCurrentVersion', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().appCurrentVersion(JSON.stringify(object));
        }
    };

    /**
     * 모바일티켓 > 인스타그램 공유
     * @oaram
     * @returns
     */
    this.instagramShare = function(data) {
    	var object = { type: 'instagramShare', data: data };
    	if (osType() == 'IOS') {
    		Handler().postMessage(object);
    	}
    	else {
    		Handler().instagramShare(JSON.stringify(object));
    	}
    };

    /**
     * 모두의영화 > 인스타그램 공유
     * @oaram
     * @returns
     */
    this.voteInstagramShare = function(data) {
        var object = { type: 'voteInstagramShare', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().voteInstagramShare(JSON.stringify(object));
        }
    };

    /**
     * 모두의영화 > 이미지 다운로드
     * @oaram
     * @returns
     */
    this.voteImageDownload = function(data) {
        var object = { type: 'voteImageDownload', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().voteImageDownload(JSON.stringify(object));
        }
    };

    /**
     * 티켓북 상세
     * @oaram
     * @returns
     */
    this.ticketBookDetail = function(data) {
    	var object = { type: 'ticketBookDetail', data: data };
    	if (osType() == 'IOS') {
    		Handler().postMessage(object);
    	}
    	else {
    		Handler().ticketBookDetail(JSON.stringify(object));
    	}
    };

    /**
     * 앱스토어 이동
     * @returns N/A
     */
    this.appStore = function() {
        var object = { type: 'appStore' };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().appStore(JSON.stringify(object));
        }
    };

    /**
     * 로그인 (로그인 정보 세팅)
     * @param data 로그인정보
     * @returns N/A
     */
    this.login = function(data) {
        var object = { type: 'login', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().login(JSON.stringify(object));
        }
    };

    /**
     * 로그아웃
     * @returns N/A
     */
    this.logout = function(data) {
        var object = { type: 'logout', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().logout();
        }
    };

    /**
     * 좌석도 화면 오픈
     */
    this.seat = function(data) {
        var object = { type: 'seat', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().seat(JSON.stringify(object));
        }
    };

    /**
     * 포토카드
     */
    this.photoCard = function() {
        var object = { type: 'photoCard' };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().photoCard(JSON.stringify(object));
        }
    };

    /**
     * 게임존
     */
    this.gameZone = function() {
    	var object = { type: 'gameZone' };
    	if (osType() == 'IOS') {
    		Handler().postMessage(object);
    	}
    	else {
    		Handler().gameZone(JSON.stringify(object));
    	}
    };

    /**
     * 광고 동영상 플레이
     */
    this.adVideoPlay = function(data) {
        var object = { type: 'adVideoPlay', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().adVideoPlay(JSON.stringify(object));
        }
    };

    /**
     * 동영상 플레이
     */
    this.videoPlay = function(data) {
        var object = { type: 'videoPlay', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().videoPlay(JSON.stringify(object));
        }
    };

    /**
     * 티켓버튼 세팅
     */
    this.setTicketButton = function(data) {
        var object = { type: 'setTicketButton', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().setTicketButton(JSON.stringify(object));
        }
    };

    /**
     * 웹 브라우저 오픈
     * @param data: Object - 웹 URL
     * @return N/A
     */
    this.link = function(data) {
        var object = { type: 'link', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().link(JSON.stringify(object));
        }
    };

    /**
     * 바코드 스캐너
     * @param data: Object
     * @return N/A
     */
    this.barcodeScanner = function(data) {
        var object = { type: 'barcodeScanner', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().barcodeScanner(JSON.stringify(object));
        }
    };

    /**
     * 해더 버튼 세팅
     */
    this.setHeaderButton = function(data) {
        var object = { type: 'setHeaderButton', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().setHeaderButton(JSON.stringify(object));
        }
    };

    /**
     * 사용자 설정 세팅
     */
    this.settingAlive = function(data) {
        var object = { type: 'settingAlive', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().settingAlive(JSON.stringify(object));
        }
    };

    /**
     * 설정 값 가져오기
     */
    this.getSettingAlive = function(data) {
        var object = { type: 'getSettingAlive', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().getSettingAlive(JSON.stringify(object));
        }
    };

    /**
     * 이미지 다운로드
     */
    this.imageDownload = function(data) {
        var object = { type: 'imageDownload', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().imageDownload(JSON.stringify(object));
        }
    };

    /**
     * 간편로그인
     * @param data { type:'FACEBOOK', callback:'javascriptFunctionName' }
     * @returns N/A
     */
    this.simpleLogin = function(data) {
        var object = { type: 'simpleLogin', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().simpleLogin(JSON.stringify(object));
        }
    };

    /**
     * SNS 공유
     */
    this.share = function(data) {
        var object = { type: 'share', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().share(JSON.stringify(object));
        }
    };

    /**
     * 로딩바 show
     */
    this.startLoadingBar = function() {
        var object = { type: 'startLoadingBar' };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().startLoadingBar();
        }
    };

    /**
     * 로딩바 hide
     */
    this.stopLoadingBar = function() {
        var object = { type: 'stopLoadingBar' };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().stopLoadingBar();
        }
    };

    /**
     * 부모창 새로고침
     * @param targets ['opener','movie','store','booking','event','my','side']
     * @param isClose 현재창 닫기 여부
     * @param params 사용자정보
     */
    this.parentRefresh = function(targets, isClose, params, jsFunction) {
        var object = {
                type: 'parentRefresh',
                data: {
                    targets: targets,
                    isClose: isClose,
                    params: params,
                    jsFunction: jsFunction
                }
        };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().parentRefresh(JSON.stringify(object));
        }
    };

    /**
     * 부모창 새로고침(NEW)
     * @param targets ['my']
     * @param isClose 현재창 닫기 여부
     * @param params 사용자정보
     */
    this.newParentRefresh = function(targets, isClose, url ) {
    	var object = {
			type: 'newParentRefresh',
			data: {
				withTabTargets : targets,
				isClose: isClose,
				url : url
			}
    	};
    	if (osType() == 'IOS') {
    		Handler().postMessage(object);
    	}
    	else {
    		Handler().newParentRefresh(JSON.stringify(object));
    	}
    };

    /**
     * Access Token 세팅
     */
    this.setAccessToken = function(accessToken) {
        var object = {
                type: 'setAccessToken',
                data: {
                    accessToken: accessToken
                }
        };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().setAccessToken(JSON.stringify(object));
        }
    };

    /**
     * 키보드 화면 덮어쓰기
     */
    this.keyboardCovered = function(isCovered) {
        var object = {
                type: 'keyboardCovered',
                data: {
                    isCovered: isCovered
                }
        };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().keyboardCovered(JSON.stringify(object));
        }
    };

    /**
     * 현재화면 새로고침
     */
    this.reload = function() {
    	var object = { type: 'reload' };
    	if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().reload();
        }
    };

    this.getNetfunneKey = function() {
    	var object = { type: 'getNetfunneKey' };
    	if (osType() == 'IOS') {
    		Handler().postMessage(object);
    	}
    	else {
    		Handler().getNetfunneKey();
    	}
    };

    /**
     * 이전 세션값을 가져온다
     *
     * @author AJ
     * @Date 2023.06.19
     */

    this.sessionRecovery = function(delay) {
        Handler().sessionRecovery(delay);
    };

    /**
     * 모바일앱 새 창 생성 시 서버로 전송된 GET 파라미터를 받아온다.
     *
     * @author AJ
     * @Date 2020.07.02
     */
    this.getUrlParam = function (data) {
        var object = {
            type: 'getUrlParam',
            data: data
        }
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        } else {
            Handler().getUrlParam(JSON.stringify(object));
        }
    }

    /**
     * 모바일오더 간편주문 팝업을 호출한다.
     *
     * @author AJ
     * @Date 2020.07.29
     */
    this.simpleOrderPopup = function (data) {
        var object = {
            type: 'simpleOrderPopup',
            data: data
        }
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        } else {
            Handler().simpleOrderPopup(JSON.stringify(object));
        }
    }

    /**
     * 모바일오더 간편주문 팝업을 닫는다.
     *
     * @author AJ
     * @Date 2020.08.05
     */
    this.simpleOrderPopupClose = function (data) {
        var object = {
            type: 'simpleOrderPopupClose',
            data: data
        }
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        } else {
            Handler().simpleOrderPopupClose(JSON.stringify(object));
        }
    }

    /**
     * 마케팅 팝업 노출(이벤트 넛징팝업, 알림넛징팝업, 기기알림넛징팝업)
     */
    this.marketingPopup = function () {
        const object = {
            type: 'marketingPopup'
        }

        if (osType() == 'IOS') {
            Handler().postMessage(object)
        } else {
            Handler().marketingPopup(JSON.stringify(object));
        }
    }

    /**
     * 현재 기기의 가로, 세로 크기를 불러온다.
     *
     * @author AJ
     * @Date 2020.09.02
     */
    this.getScreenSize = function () {
        var object = {
            type: 'getScreenSize'
        }
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        } else {
            Handler().getScreenSize(JSON.stringify(object));
        }
    }
    /**
     * 채널톡 창을 연다
     *
     * @author park.seungsae
     * @Date 2022.08.04
     * ios >= 4.1.19
     * aos >= 4.1.22
     */
    this.openChannelTalk = function () {
        let object = {
            type: 'openChannelTalk'
        }
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        } else {
            Handler().openChannelTalk(JSON.stringify(object));
        }
    }

    /**
     * 채널톡 창을 연다
     *
     * @author kwon.ohjin
     * @Date 2022.11.25
     */
    this.openOrderBanner = function (paramData) {
        let object = {
            type: 'openOrderBanner',
        };

        if(paramData instanceof Object) {
            object = {
                type: 'openOrderBanner',
                data: {
                    imgSrcPath: paramData.imgSrcPath,
                    leftBtnName: paramData.leftBtnName,
                    leftBtnLinkUrl: paramData.leftBtnLinkUrl,
                    rightBtnName: paramData.rightBtnName,
                    rightBtnLinkUrl: paramData.rightBtnLinkUrl
                }
            }
        }
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        } else {
            Handler().openOrderBanner(JSON.stringify(object));
        }
    }

    /**
     * 네트워크 타입 및 상태체크
     *
     * @author KOJ
     * @Date 2021.06.15
     */
    this.checkNetworkType = function(data) {
        var object = { type: 'checkNetworkType', data: data };
        if (osType() == 'IOS') {
            Handler().postMessage(object);
        }
        else {
            Handler().checkNetworkType(JSON.stringify(object));
        }
    };

    /**
     * 디바이스 정보 호출
     *
     * @author KOJ
     * @Date 2021.06.15
     */
    this.deviceInfo = function(data) {
    	var object = { type: 'deviceInfo', data: data };
    	if (osType() == 'IOS') {
    		Handler().postMessage(object);
    	}
    	else {
    		Handler().deviceInfo(JSON.stringify(object));
    	}
    };

    /**
     * 앱스플라이어 인앱 이벤트
     * @param event String - 이벤트이름
     * @param data json - 파라미터
     * @returns N/A
     */
    this.sendEvent = function(event, data) {
        var jsonData = {
            type: 'sendEvent',
            data: {
                eventName: event,
                eventValue: data//  data
            }
        }

        if (osType() == 'IOS') {
            Handler().postMessage(jsonData);
        }
        else {
            Handler().sendEvent(JSON.stringify(jsonData));
        }
    };

    /**
     * 앱스플라이어 appsflterId 가져오기
     * @param data
     * @returns data.callback
     */
    this.appsFlyerUID = function(data) {
        var jsonData = {
            type: 'appsFlyerUID',
            data: data//  data
        }

        if (osType() == 'IOS') {
            Handler().postMessage(jsonData);
        }
        else {
            Handler().appsFlyerUID(JSON.stringify(jsonData));
        }
    };
};

/**
 * 앱, 웹 구분별 이벤트
 */
var Common = function() {

    this.Bridge = new Bridge();

    /**
     * 신고 사유 팝업 추가
     */
    // this.popup = function () {
    //     var html = '';
    //     html += '<div class="layer-dimmed" style="z-index:999998; pointer-events:none;"></div>\n' +
    //         '    <div class="layer-report">\n' +
    //         '        <div class="title-area">\n' +
    //         '            <p>신고 사유</p>\n' +
    //         '        </div>\n' +
    //         '        <div class="radio-group">\n' +
    //         '            <ul>\n' +
    //         '                <li>\n' +
    //         '                    <div class="bg-radio">\n' +
    //         '                        <input type="radio" name="report" id="first" checked>\n' +
    //         '                        <label for="first" >폭력적 또는 혐오스러운 콘텐츠</label>\n' +
    //         '                    </div>\n' +
    //         '                </li>\n' +
    //         '                <li>\n' +
    //         '                    <div class="bg-radio">\n' +
    //         '                        <input type="radio" name="report" id="second">\n' +
    //         '                        <label for="second">성적인 콘텐츠</label>\n' +
    //         '                    </div>\n' +
    //         '                </li>\n' +
    //         '                <li>\n' +
    //         '                    <div class="bg-radio">\n' +
    //         '                        <input type="radio" name="report" id="third">\n' +
    //         '                        <label for="third" >증오 또는 학대하는 콘텐츠</label>\n' +
    //         '                    </div>\n' +
    //         '                </li>\n' +
    //         '                <li>\n' +
    //         '                    <div class="bg-radio">\n' +
    //         '                        <input type="radio" name="report" id="four">\n' +
    //         '                        <label for="four" >스포일러가 포함된 콘텐츠</label>\n' +
    //         '                    </div>\n' +
    //         '                </li>\n' +
    //         '            </ul>\n' +
    //         '        </div>\n' +
    //         '        <div class="btn-wrap">\n' +
    //         '            <span><button class="btn" onclick="fn_closePopup()">취소</button></span><span><button class="btn" id="btn_confirm">확인</button></span>\n' +
    //         '        </div>\n' +
    //         '    </div>'
    //
    //     $('#popupWrap').append(html);
    // };

    /**
     * toast
     * @param message: String
     * @returns N/A
     */
    this.toast = function(message) {
        // 모바일 앱 일 때
        if (isApp()) {
            this.Bridge.toast(message);
        }
        else {
            // TODO - 웹 Toast Message 구현
        }
    };

    /**
     * alert
     * @param data: Object
     * @returns N/A
     */
    this.alert = function(data) {

        // 파라메터 Object 일 때
        if (data instanceof Object) {
            var title = isNull(data.title) ? '' : data.title;
            var message = isNull(data.message) ? '' : data.message;
            var okText = isNull(data.okText) ? '확인' : data.okText;
            var okFunc = isNull(data.okFunc) ? '' : data.okFunc;
            var okData = isNull(data.okData) ? '' : data.okData;

            // 모바일 앱 일 때
            if (isApp()) {
                this.Bridge.alert(title, message, okText, okFunc, okData);
            }
            else {
                // 콜백 함수가 있을 때
                if (okFunc != '') {
                    alert(message);

                    // 콜백 함수 파라메터가 있을 때
                    if (okData != '') {
                        eval(okFunc)(okData);
                    }
                    else {
                        eval(okFunc)();
                    }
                }
                else {
                    alert(message);
                }
            }
        }
        // 파라메터 String 일 때
        else {
            // 모바일 앱 일 때
            if (isApp()) {
                this.Bridge.alert('', data, '확인', '', '');
            }
            else {
                alert(data);
            }
        }
    };

    /**
     * confirm
     * @param data: Object
     * @returns Boolean
     */
    this.confirm = function(data) {

        // 파라메터 Object 일 때
        if (data instanceof Object) {
            var title = isNull(data.title) ? '' : data.title;
            var message = isNull(data.message) ? '' : data.message;
            var okText = isNull(data.okText) ? '확인' : data.okText;
            var okFunc = isNull(data.okFunc) ? '' : data.okFunc;
            var okData = isNull(data.okData) ? '' : data.okData;
            var cancelText = isNull(data.cancelText) ? '취소' : data.cancelText;
            var cancelFunc = isNull(data.cancelFunc) ? '' : data.cancelFunc;
            var cancelData = isNull(data.cancelData) ? '' : data.cancelData;

            // 모바일 앱 일 때
            if (isApp()) {
                this.Bridge.confirm(title, message, okText, okFunc, okData, cancelText, cancelFunc, cancelData);

                // 모바일 앱은 Native에서 호출하기 때문에 항상 false
                // 버튼별 콜백 함수를 세팅해서 사용한다.
                return false;
            }
            else {
                if (confirm(message)) {
                    // 콜백 함수가 있을 때
                    if (okFunc != '') {
                        // 콜백 함수 파라메터가 있을 때
                        if (okData != '') {
                            eval(okFunc)(okData);
                        }
                        else {
                            eval(okFunc)();
                        }
                    }
                    else {
                        return true;
                    }
                } else {
                    // 콜백 함수가 있을 때
                    if (cancelFunc != '') {
                        // 콜백 함수 파라메터가 있을 때
                        if (cancelData != '') {
                            eval(cancelFunc)(cancelData);
                        }
                        else {
                            eval(cancelFunc)();
                        }
                    }
                    else {
                        return false;
                    }
                }
            }
        }
    };

    /**
     * form.submit()
     * @param form: Object - form 객체
     * @param data: Object - 화면호출 시 필요한 정보
     * @returns N/A
     */
    this.submit = function(form, data) {
        if (isNull(form) || isNull(data.domain)) return;
        // 모바일 앱 일 때
        if (isApp()) {
            if (isNull(data.params)) data.params = {};
            if (isNull(data.header)) data.header = {};
            if (isNull(data.header.type)) data.header.type = 'default';
            if (isNull(data.title)) data.title = {};
            if (isNull(data.title.type)) data.title.type = 'logo';

            form.find('input').each(function(i) {
                data.params[$(this).attr('name')] = encodeURIComponent($(this).val());
            });

            this.Bridge.open(data);
        }
        else {
            form.attr('action', data.domain);
            var attr = '?';
            if (!isNull(data.params)) {
                $.each(data.params, function(k, v) {

                    //넷퍼넬 키값 존재시 파라미터 셋팅
//                    if( $(form).find("#netfunnel_key").length > 0 ){
//                        attr = k + "=" + v;
//                    }else{
//                        if( form.find('[name="'+k+'"]').length == 0 ){
//                            form.append("<input type='hidden' name='"+k+"' value='" + v + "' />");
//                        }else {
//                            form.find('[name="'+k+'"]').val(v);
//                        }
//                    }
                    if(k != 'netfunnel_key') {
                        attr += k + "=" + v + "&";

                        if( $(form).find("#netfunnel_key").length == 0 ){
                            if( form.find('[name="'+k+'"]').length == 0 ){
                                form.append("<input type='hidden' name='"+k+"' value='" + v + "' />");
                            }else {
                                form.find('[name="'+k+'"]').val(v);
                            }
                        }
                    }
                });
            }

            /**
             * 넷퍼넬 키값 존재시
             *  키값을 제외하고 URL노출
             */
            if( $(form).find("#netfunnel_key").length > 0 ){
                if(attr == '?') attr = '';
                form.attr('action', data.domain + attr.substring(0, attr.length-1));
            }

            if (isNull(data.isClose)) data.isClose = false;
            if (data.isClose) {
                form.target = '_self';
            }
            form.submit();
        }
        controlAction.lazyOff(500);
    }

    /**
     * location.href
     * @param data: Object - 화면호출 시 필요한 정보
     */
    this.href = function(data) {
        if (isNull(data.domain)) return;

        // 모바일 앱 일 때
        if (isApp()) {
            if (isNull(data.params)) data.params = {};
            if (isNull(data.header)) data.header = { type: 'default' };
            if (isNull(data.title)) data.title = { type: 'logo' };

            $.each(data.params, function(key, value){
                var encodeValue = encodeURIComponent(value);
                data.params[key] = encodeValue;
            });

            this.Bridge.open(data);
        }
        else {
            var queryString = "";
            for(var key in data.params) {
                if(queryString != "") {
                    queryString += "&"
                }
                queryString += (key + "=" + data.params[key]);
            }

            if (isNull(data.isClose)) data.isClose = false;
            if (!data.isClose) {
                if(queryString != "") {
                    location.href = data.domain + "?" + queryString;
                } else {
                    location.href = data.domain;
                }
            }
            else {
                if(queryString != "") {
                    location.replace(data.domain + "?" + queryString);
                } else {
                    location.replace(data.domain);
                }
            }
        }
        controlAction.lazyOff(500);
    };

    /**
     * location.link - 웹 브라우저
     * @param data
     * - domain: 링크주소
     * - isClose: 현재창 닫기 여부
     * - isScheme: 스키마 체크 여부
     */
    this.link = function(data) {
        if (isNull(data.domain)) return;

        // 모바일 앱 일 때
        if (isApp()) {
            this.Bridge.link(data);
        }
        else {
            if (isNull(data.isClose)) data.isClose = false;
            if (!data.isClose) {
                location.href = data.domain;
            }
            else {
                location.replace(data.domain);
            }
        }
        controlAction.lazyOff(500);
    };

    /**
     * 현재 화면 닫기
     * @returns N/A
     */
    this.close = function(step) {
        if(!step){
            step = -1;
        }
        // 모바일 앱 일 때
        if (isApp()) {
            this.Bridge.close();
        }
        else {
            if(document.referrer) {
                var lastSplit = document.referrer.lastIndexOf("/");
                if(document.referrer.indexOf("main") > -1
                    || lastSplit == document.referrer.length-1) {
                    this.goMain();
                } else if(document.referrer.indexOf("myMegabox") > - 1) {
                    this.goMy();
                } else if(document.referrer.indexOf("eventNo") > - 1){
                    location.replace(document.referrer);
                } else {
                    history.go(step);
                }
            } else {
                history.go(step);
            }
        }
    };

    /**
     * 사이드 메뉴 닫기
     * @returns N/A
     */
    this.sideMenuClose = function() {
        // 모바일 앱 일 때
        if (isApp()) {
            this.Bridge.sideMenuClose();
        }
        else {
            // TODO: 사이드 메뉴 닫기
        }
    };

    /**
     * 메인 화면으로 이동 (Native 영화 탭)
     * @returns N/A
     */
    this.goMain = function(isClose) {
        // 모바일 앱 일 때
        if (isApp()) {
            this.Bridge.selectTabBar('movie');
        }
        else {
            if (isClose) {
                location.replace('/main');
            }
            else {
                var data = {domain: '/main'};
                location.href = '/main';
            }
        }
    };

    /**
     * 메인 화면으로 이동 (Native 영화 탭)
     * @returns N/A
     */
    this.newGoMain = function(isClose) {
    	// 모바일 앱 일 때
    	if (isApp()) {
    		this.Bridge.newSelectTabBar('/main');
    	}
    	else {
    		if (isClose) {
    			location.replace('/main');
    		}
    		else {
    			var data = {domain: '/main'};
    			location.href = '/main';
    		}
    	}
    };

    /**
     * 스토어 화면으로 이동 (Native 스토어 탭)
     * @returns N/A
     */
    this.goStore = function() {
        // 모바일 앱 일 때
        if (isApp()) {
            this.Bridge.selectTabBar('store');
        }
        else {
            //location.replace('/store');
            location.href = '/store';
        }
    };

    /**
     * 스토어 화면으로 이동 (Native 스토어 탭)
     * @returns N/A
     */
    this.newGoStore = function() {
    	// 모바일 앱 일 때
    	if (isApp()) {
    		this.Bridge.newSelectTabBar('/store');
    	}
    	else {
    		//location.replace('/store');
    		location.href = '/store';
    	}
    };

    /**
     * 스토어 화면으로 이동 (Native 스토어 탭)
     * @returns N/A
     */
    this.newGoStoreCat = function(prdtClCd) {
        // 모바일 앱 일 때
        if (isApp()) {
            this.Bridge.newSelectTabBar('/store?prdtClCd=' + prdtClCd);
        }
        else {
            //location.replace('/store');
            location.href = '/store?prdtClCd=' + prdtClCd;
        }
    };

    /**
     * 이벤트 화면으로 이동 (Native 이벤트 탭)
     * @returns N/A
     */
    this.newGoEvent = function(tabDivCd) {
    	// 모바일 앱 일 때
    	if (isApp()) {
	    	var url = '/event';

	        if (tabDivCd) {
	        	url = url + '?tabDivCd=' + tabDivCd;
	        }

	        this.Bridge.newSelectTabBar(url);

	    } else {
	        if(tabDivCd) {
	            //location.replace('/event?tabDivCd='+tabDivCd);
	            location.href = '/event?tabDivCd='+tabDivCd;
	        } else {
	            //location.replace('/event');
	            location.href = '/event';
	        }
	    }
    };

    /**
     * 선호극장 화면으로 이동 (Native 스토어 탭)
     * @returns N/A
     */
    this.goFavorTheat = function() {
    	// 모바일 앱 일 때
    	if (isApp()) {
    		this.Bridge.selectTabBar('favorTheat');
    	}
    	else {
    		location.href = '/favorTheat';
    	}
    };

    /**
     * 선호극장 화면으로 이동 (Native 스토어 탭)
     * @returns N/A
     */
    this.newGoFavorTheat = function() {
    	// 모바일 앱 일 때
    	if (isApp()) {
    		this.Bridge.newSelectTabBar('/favorTheat');
    	}
    	else {
    		location.href = '/favorTheat';
    	}
    };

    /**
     * 예매 화면으로 이동 (Native 예매 탭)
     * @returns N/A
     */
    this.goBooking = function() {
        // 모바일 앱 일 때
        if (isApp()) {
            this.Bridge.selectTabBar('booking');
        }
        else {
            //location.replace('/booking');
            location.href = '/booking';
        }
    };

    /**
     * 이벤트 화면으로 이동 (Native 이벤트 탭)
     * @returns N/A
     */
    this.goEvent = function(tabDivCd, version) {
        if (isApp()) {

        	if (version >= 410) {
                if (osType() === 'ANDROID' && version >= 412) {
                    var openData = AppHeader.Event.newMain;
                } else if (osType() === 'IOS' && version >= 411) {
                    var openData = AppHeader.Event.newMain;
                } else {
                    var openData = AppHeader.Event.main;
                }
                if (tabDivCd){
                	openData['domain'] = '/event?tabDivCd='+tabDivCd;
                }else{
                	openData['domain'] = '/event';
                }
        		openData['animation'] = 'slide';
        		openData['refresh'] = false;
        		openData['isCloseAll'] = false;
        		openData['isClose'] = false;

        		AppHandler.Common.href(openData);

        	}else{

                var params = null;
                if (tabDivCd) {
                    params = { tabDivCd: tabDivCd };
                }
                this.Bridge.selectTabBar('event', params);

        	}

        } else {
            if(tabDivCd) {
                //location.replace('/event?tabDivCd='+tabDivCd);
                location.href = '/event?tabDivCd='+tabDivCd;
            } else {
                //location.replace('/event');
                location.href = '/event';
            }
        }
    };

    /**
     * 마이 화면으로 이동 (Native 마이 탭)
     * @returns N/A
     */
    this.goMy = function(data) {
        // 모바일 앱 일 때
    	if (isApp()) {
            var openData = AppHeader.MyMegabox.main;
            openData['domain'] = '/myMegabox;'
            if(data){
            	openData['isClose'] = data.isClose;
            	openData['isCloseAll'] = data.isCloseAll;
            }
            AppHandler.Common.href(openData);
            // this.Bridge.selectTabBar('/myMegabox', openData);
        }
        else {
            //location.replace('/myMegabox');
            location.href = '/myMegabox';
        }
    };

    this.goMyRefresh = function () {
        // 모바일 앱 일 때
        if (isApp()) {
            this.Bridge.selectTabBar('my', {'': ''});
        } else {
            //location.replace('/myMegabox');
            location.href = '/myMegabox';
        }
    };

    /**
     * 모바일오더 화면으로 이동 (Native 모바일오더 탭)
     * @returns N/A
     */
    this.goOrder = function (data) {
        //모바일 앱 일 때
        if (isApp()) {
            this.Bridge.newSelectTabBar('/order',data);
        } else {
             location.href = '/re/AppOnly/order';
        }
    };


    /**
     * 권한 체크 후 설정 화면 호출
     * @param data 권한 체크 정보
     * @returns data.callback({success:1})
     */
    this.checkPermission = function(data) {
        if (isNull(data.permission) || isNull(data.callback)) return;

        // 모바일 앱 일 때
        if (isApp()) {
            this.Bridge.checkPermission(data);
        }
        else {
            // TODO: 모바일 웹
        }
    };

    this.goPc = function() {
        // 모바일 앱 일 때
        if (isApp()) {
            //this.Bridge.selectTabBar('movie');
        }
        else {

            var returnPath = "";

            if( location.pathname.indexOf("/event") > -1 ||
                location.pathname.indexOf("/store") > -1 ||
                location.pathname.indexOf("/movie") > -1
                    ){
                returnPath = location.pathname;
            }

            $.ajaxMegaBox({
                url      : "/getToken",
                async    : false,
                success  : function (data, textStatus, jqXHR) {
                },
                error    : function (data, textStatus, jqXHR) {
                },
                complete : function (data, textStatus, jqXHR) {
                    setCookie("FROM_MOBILE_WEB", "Y", 30, "", location.host.substr(location.host.indexOf(".")));
                    location.href = $(".PCVER").data("url") + "/sessionCpResponse?returnPath="+ returnPath + location.search + "&token="+ encodeURIComponent(data.responseJSON.token);
                }
            });
        }
    };

    /**
     * 위치정보 가져오기
     * @param data 콜백 함수 정보
     * @returns data.callback({success:1, latitude:'31.123', longitude:'128.123'})
     */
    this.location = function(data) {
        if (isNull(data.callback)) return;

        // 모바일 앱 일 때
        if (isApp()) {
            this.Bridge.location(data);
        }
        else {
            // TODO: 모바일 웹
        }
    };

    /**
     * GPS 설정 여부 가져오기
     * @param data 콜백 함수 정보
     * @returns data.callback()
     */
    this.isGpsEnable = function(data) {

    	if (isNull(data.callback)) return;

        // 모바일 앱 일 때
        if (isApp()) {
        	this.Bridge.isGpsEnable(data);
        }
        else {
            // TODO: 모바일 웹
        	AppHandler.Common.alert("모바일 앱에서 이용가능합니다");
        }

    };

    /**
     * 알림동의 여부 가져오기
     * @param data 콜백 함수 정보
     * @returns data.callback()
     */
    this.isNotificationEnable = function(data) {

    	if (isNull(data.callback)) return;

    	// 모바일 앱 일 때
    	if (isApp()) {
    		this.Bridge.isNotificationEnable(data);
    	}
    	else {
    		// TODO: 모바일 웹
    		AppHandler.Common.alert("모바일 앱에서 이용가능합니다");
    		return;
    	}

    };

    /**
     * 이벤트 넷퍼넬 이동
     * @returns N/A
     */
    this.goNewEv = function(movieNo, movieNm, eventNo) {
        // 모바일 앱 일 때
        if (isApp()) {
            var openData = AppHeader.Booking.newEv;
            openData['domain'] = '/megaEv?movieNo='+movieNo+'&movieNm='+movieNm+'&eventNo='+eventNo;
            AppHandler.Common.href(openData);
        }
        else {
    		// TODO: 모바일 웹
    		AppHandler.Common.alert("모바일 앱에서 이용가능합니다");
    		return;
        }
    };

    /**
     * 극장리스트
     * @param data 콜백 함수 정보
     * @returns data.callback()
     */
    this.selectBranchList = function(data) {

    	// 모바일 앱 일 때
    	if (isApp()) {
    		this.Bridge.selectBranchList(data);
    	}
    	else {
    		// TODO: 모바일 웹
    		AppHandler.Common.alert("모바일 앱에서 이용가능합니다");
    		return;
    	}

    };

    /**
     * 알림동의 설정 이동
     * @param data 콜백 함수 정보
     * @returns data.callback()
     */
    this.notificationOn = function(data) {

    	// 모바일 앱 일 때
    	if (isApp()) {
    		this.Bridge.notificationOn(data);
    	}
    	else {
    		// TODO: 모바일 웹
    		AppHandler.Common.alert("모바일 앱에서 이용가능합니다");
    		return;
    	}

    };

    /**
     * 흔들어 설정 여부 가져오기 / 자주쓰는 신용카드 유효기간 가져오기
     * @param data 콜백 함수 정보
     * @returns data.callback()
     */
    this.isShakeEnable = function(data) {

    	if (isNull(data.callback)) return;

    	// 모바일 앱 일 때
    	if (isApp()) {
    		this.Bridge.isShakeEnable(data);
    	}
    	else {
    		// TODO: 모바일 웹
    	}

    };

    /**
     * 흔들어 설정 여부 SET / 자주쓰는 신용카드 유효기간 저장(암호화)
     * @param data 콜백 함수 정보
     * @returns data.callback()
     */
    this.setShakeEnable = function(data) {

    	// 모바일 앱 일 때
    	if (isApp()) {
    		this.Bridge.setShakeEnable(data);
    	}
    	else {
    		// TODO: 모바일 웹
    	}

    };


    /**
     * GPS 켜기
     * @param data 콜백 함수 정보
     * @returns data.callback()
     */
    this.gpsOn = function() {

    	// 모바일 앱 일 때
    	if (isApp()) {
    		this.Bridge.gpsOn();
    	}
    	else {
    		// TODO: 모바일 웹
    		AppHandler.Common.alert("모바일 앱에서 이용가능합니다");
    	}

    };

    /**
     * 장바구니 현재 카운트 SET
     * @param data 콜백 함수 정보
     * @returns data.callback()
     */
    this.setOrderBkCount = function (data) {

        // 모바일 앱 일 때
        if (isApp()) {
            this.Bridge.setOrderBkCount(data);
        } else {
            var cartCount = $('#cartCount');
            cartCount.html(data.count);

            if (data.count > 0) {
                cartCount.removeClass('display-none');
            } else {
                cartCount.addClass('display-none');
            }
        }
    };



    /**
     * 카메라 화면 호출
     * @param data 콜백 함수 정보
     * @returns data.callback({success:1, image:'base64 string'})
     */
    this.camera = function(data) {
        if (isNull(data.callback)) return;

        // 모바일 앱 일 때
        if (isApp()) {
            this.Bridge.camera(data);
        }
        else {
            // TODO: 모바일 웹
        }
    };

    /**
     * 앨범 화면 호출
     * @param data 콜백 함수 정보
     * @returns data.callback({success:1, image:'base64 string'})
     */
    this.photoLibrary = function(data) {
        if (isNull(data.callback)) return;

        // 모바일 앱 일 때
        if (isApp()) {
            this.Bridge.photoLibrary(data);
        }
        else {
            // TODO: 모바일 웹
        }
    };

    /**
     * 연락처 선택 화면 호출
     * @param data 콜백 함수 정보
     * @returns data.callback({success:1, phoneNumber:'01012341234', name:'홍길동'})
     */
    this.contactPicker = function(data) {
        if (isNull(data.callback)) return;

        // 모바일 앱 일 때
        if (isApp()) {
            this.Bridge.contactPicker(data);
        }
        else {
            // TODO: 모바일 웹
        }
    };

    /**
     * 해더 변경
     * @param data 해더 정보
     * @returns N/A
     */
    this.setHeader = function(data) {
        // 모바일 앱 일 때
        if (isApp()) {
            if (isNull(data.header) || isNull(data.header.type) || isNull(data.title.type)) return;
            this.Bridge.setHeader(data);
        }
        else {
            // TODO: 모바일 웹
        }
    };

    /**
     * 이메일 체크
     * @param data 해더 정보
     * @returns N/A
     */
    this.verifyEmail = function(email) {
        var emailVal = email;
        var regExp = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i;
        return emailVal.match(regExp) != null ? 'Y' : 'N'
    };

    /**
     * 현재 설치된 앱 버젼 가져오기
     * @oaram data 앱 버젼 리턴받을 함수 정보
     * @returns data.callback({ os: 'IOS or ANDROID', code: 9, version: '1.0.0' })
     */
    this.appCurrentVersion = function(data) {
        if (isApp()) {
            if (isNull(data.callback)) return;
            this.Bridge.appCurrentVersion(data);
        }
    };

    /**
     * 모바일 티켓 > 인스타그램 공유
     * @oaram
     * @returns
     */
    this.instagramShare = function(data) {
    	if (isApp()) {
    		this.Bridge.instagramShare(data);
    	}
    };

    /**
     * 모바일 티켓 > 인스타그램 공유
     * @oaram
     * @returns
     */
    this.voteInstagramShare = function(data) {
        if (isApp()) {
            this.Bridge.voteInstagramShare(data);
        }
    };

    /**
     * 티켓북 상세 이동
     * @oaram
     * @returns
     */
    this.ticketBookDetail = function(data) {
    	if (isApp()) {
    		this.Bridge.ticketBookDetail(data);
    	}
    };

    /**
     * 앱스토어, 플레이스토어 이동
     * @returns N/A
     */
    this.appStore = function() {
        if (isApp()) {
            this.Bridge.appStore();
        }
    };

    /**
     * 로그인 (로그인 정보 세팅)
     * @param data 로그인 정보
     * @returns N/A
     */
    this.login = function(data) {
        if (isNull(data)) return;
        if (isNull(data.autoLogin)) data.autoLogin = 'N';
        if (isNull(data.nonMbLogin)) data.nonMbLogin = 'N';
        if (data.autoLogin == 'Y' && data.nonMbLogin == 'N') {
            if (isNull(data.mbNo) || isNull(data.loginId)) return;
        }
        if (data.autoLogin == 'Y' && data.nonMbLogin == 'Y') {
            if (isNull(data.nonMbNm) || isNull(data.nonMbTelno) || isNull(data.nonMbByymmdd)) return;
        }

        if (isNull(data.action)) data.action = 'close';

        if (isApp()) {
            if (data.action != 'close' && data.action != 'main' && data.action != 'none' && data.action != 'refresh') {
                var script = data.action;
                data.action = 'none';
                this.Bridge.login(data);
                eval(script)({refresh: false, isCloseAll: false, isClose: true});
            }
            else {
                this.Bridge.login(data);
            }
        }
        else {
            if (data.action == 'main') {
                this.goMain();
            }
            else if (data.action == 'close') {
                this.close();
            }
            else if (data.action == 'refresh') {
                this.close();
            }
            else {
                if(data.action != 'none') {
                    eval(data.action)({refresh: false, isCloseAll: false, isClose: true});
                }
            }
        }
    };

    /**
     * 로그아웃
     * @returns N/A
     */
    this.logout = function() {
        if (isApp()) {
            $.ajax({
                url: '/api/session/clear',
                type: 'POST',
                contentType: 'application/json;charset=UTF-8',
                data: null,
                success: function (data, status, xhr) {
                    AppHandler.Common.logoutApp(data);
                },
                error: function(xhr, status, error) {
                    AppHandler.Common.logoutApp();
                }
            });

        }
        else {
            location.href = '/on/oh/ohg/MbLogin/mbLogout.do';
        }
    };

    this.logoutApp = function(data) {
        this.Bridge.logout(data);
    };

    /**
     * 좌석도 화면 오픈
     * @param data
     * @returns N/A
     */
    this.seat = function(data) {
        if (isNull(data.playSchdlNo) || isNull(data.admisClassCd)) return;

        if (isApp()) {
            this.Bridge.seat(data);
        }
        else {

        }
    };

    /**
     * 포토카드 오픈
     * @param data
     * @returns N/A
     */
    this.photoCard = function() {
        if (isApp()) {
            this.Bridge.photoCard();
        }
    };

    /**
     * 게임존 오픈
     * @param data
     * @returns N/A
     */
    this.gameZone = function() {
    	if (isApp()) {
    		this.Bridge.gameZone();
    	} else {
    		AppHandler.Common.alert("모바일 앱에서 이용가능합니다.");
    	}
    };

    /**
     * 광고 동영상 플레이
     * @param data
     * @returns N/A
     */
    this.adVideoPlay = function(data) {
        if (isNull(data.videoFile)) return;
        if (isApp()) {
            this.Bridge.adVideoPlay(data);
        }
    };

    /**
     * 동영상 플레이
     * @param data
     * @returns N/A
     */
    this.videoPlay = function(data) {
        if (isNull(data.videoFile)) return;
        if (isApp()) {
            this.Bridge.videoPlay(data);
        }
        else {
            location.href = data.videoFile;
        }
    };

    /**
     * 티켓버튼 세팅
     * @param data
     * @returns N/A
     */
    this.setTicketButton = function(data) {
        if (isApp()) {
            this.Bridge.setTicketButton(data);
        }
    };

    /**
     * 바코드 스캐너
     * @param data: Object
     * @return N/A
     */
    this.barcodeScanner = function(data) {
        if (isApp()) {
            this.Bridge.barcodeScanner(data);
        }
    };

    /**
     * 해더 버튼 세팅
     * @param data
     * @returns N/A
     */
    this.setHeaderButton = function(data) {
        if (isApp()) {
            this.Bridge.setHeaderButton(data);
        }
    };

    this.snSshare = function(id, imgUrl, title, content, webUrl, headerTitle, friendInvCd) {

    	var url = "/sns/share";

    	if(id == "memberShipShare") {
    		url = "/sns/memberShipShare";
    	}

    	if(headerTitle == null || headerTitle == undefined || headerTitle == "") {
            headerTitle = "공유하기";
        }

        var paramData = {
            id : id,
            imgUrl : imgUrl,
            title : title,
            content : content,
            webUrl: webUrl,
            headerTitle : headerTitle,
            friendInvCd : friendInvCd
        };
        $.ajax({
            url: url,
            type: "POST",
            contentType: "application/json;charset=UTF-8",
            data: JSON.stringify(paramData),
            success: function (data, textStatus, jqXHR) {

                if ($("#"+id).length == 0) {
                    if ($('[id^=tmpLayer]').length != 0) {
                        $('.container:last').append('<div id="'+ id +'" class="display-none layer-popup-bt"></div>');
                    } else {
                        $('body').append('<div id="'+ id +'" class="display-none layer-popup-bt"></div>');
                    }
                }
                $("#"+id).html(data);
                gfn_miniLayer(id);
            },
            error: function(xhr,status,error){
                 var err = JSON.parse(xhr.responseText);
                 alert(xhr.status);
                 alert(err.message);
            }
        });
    };

    /**
     * 사용자 설정 세팅
     */
    this.settingAlive = function(data) {
        if (isApp()) {
            this.Bridge.settingAlive(data);
        }
    };

    /**
     * 설정 값 가져오기
     */
    this.getSettingAlive = function(data) {
        if (isApp()) {
            this.Bridge.getSettingAlive(data);
        }
    };

    /**
     * 이미지 다운로드
     * @param data { image:'image url', callback:'javascriptFunctionName' }
     * @returns { success:1 }
     */
    this.imageDownload = function(data) {
        if (isNull(data.image)) return;
        if (isApp()) {
            this.Bridge.imageDownload(data);
        }
    };

    /**
     * 간편로그인
     * @param type: 'FACEBOOK'
     * @param callback: 'javascriptFunctionName'
     * @param simpleLoginWithPopup: window
     * @returns window
     */
    this.simpleLogin = function(type, callback, simpleLoginWithPopup) {
        if (isApp()) {
            var data = {
                    type: type,
                    callback: callback
            };
            this.Bridge.simpleLogin(data);
            return null;
        }
        else {
            var url = '/on/oc/ocz/SimpleLogin/simpleLogin.do?lnkgTy=' + type;

            if(simpleLoginWithPopup) {
                simpleLoginWithPopup.close();
            }

            if(type != "FACEBOOK"){
                simpleLoginWithPopup = window.open(url, 'simpleLoginWithPopup', 'width=420, height=550');
            } else {
                simpleLoginWithPopup = window.open(url, 'simpleLoginWithPopup', 'width=650, height=600, scrollbars=yes');
            }

            return simpleLoginWithPopup;
        }
    };

    /**
     * SNS 공유
     */
    this.share = function(data) {
        if (isApp()) {
            this.Bridge.share(data);
        }
    };

    /**
     * 로딩바 show
     */
    this.startLoadingBar = function() {
        if (isApp()) {
            this.Bridge.startLoadingBar();
        }
        else {
            if ($("body #bg-loading").length === 0) {
                var html =
                    "<div id=\"bg-loading\" class=\"bg-loading\">" +
                    "	<div class=\"spinner-border\" role=\"status\">" +
                    // "		<span class=\"sr-only\">Loading...</span>" +
                    "	</div>" +
                    "</div>";
                $('body').append(html);
            }
        }
    };

    /**
     * 로딩바 hide
     */
    this.stopLoadingBar = function() {
        if (isApp()) {
            this.Bridge.stopLoadingBar();
        }
        else {
            $("body #bg-loading").remove();
        }
    };

    /**
     * 부모창 새로고침
     * @param
     * data
     * - targets ['opener','movie','store','booking','event','my','side']
     * - isClose 현재창 닫기 여부
     * - step 뒤로가기 스텝 (isClose true 일 때, 웹에서만 사용)
     * - params 사용자 정보
     */
    this.parentRefresh = function(data) {
        if (!data) {
            data = { targets: ['opener'] };
        }
        if (!data.targets) {
            data.targets = ['opener'];
        }

        if (!data.isClose) {
            data.isClose = false;
        }

        if (isApp()) {
            this.Bridge.parentRefresh(data.targets, data.isClose, data.params, data.jsFunction);
        }
        else {
            if (data.isClose) {
                if (!data.step) data.step = -1;
                this.close(data.step);
            }
        }
    };

    /**
     * 부모창 새로고침(New)
     * @param
     * data
     * - targets ['opener','movie','store','booking','event','my','side']
     * - isClose 현재창 닫기 여부
     * - step 뒤로가기 스텝 (isClose true 일 때, 웹에서만 사용)
     * - params 사용자 정보
     */
    this.newParentRefresh = function(data) {

    	if (isApp()) {
    		this.Bridge.newParentRefresh(data.targets, data.isClose, data.url);
    	}
    	else {
    		if (data.isClose) {
    			if (!data.step) data.step = -1;
    			this.close(data.step);
    		}
    	}
    };

    /**
     * Access Token 세팅
     */
    this.setAccessToken = function(accessToken) {
        if (isApp()) {
            this.Bridge.setAccessToken(accessToken);
        }
    };

    /**
     * 키보드 화면 덮어쓰기
     * @param isCovered
     * - ture : 화면 위로 덮어쓰기
     * - false : 화면을 위로 밀기
     */
    this.keyboardCovered = function(isCovered) {
        if (isApp()) {
            this.Bridge.keyboardCovered(isCovered);
        }
    };

    /**
     * 현재화면 새로고침
     */
    this.reload = function() {
    	if (isApp()) {
    		this.Bridge.reload();
    	}
    	else {
    		location.reload();
    	}
    };

    this.getNetfunneKey = function() {
    	if (isApp()) {
    		this.Bridge.getNetfunneKey();
    	}
    };

    /**
     * 이전 세션 가져오기
     * @param delay
     * - ture : 화면 위로 덮어쓰기
     * - false : 화면을 위로 밀기
     */
    this.sessionRecovery = function(delay) {
        if (isApp()) {
            this.Bridge.sessionRecovery(delay);
        }
    };

    /**
     * 모바일앱 새 창 생성 시 서버로 전송된 GET 파라미터를 받아온다.
     *
     * @author AJ
     * @Date 2020.07.02
     */
    this.getUrlParam = function (callbackFn) {
        window._getUrlParamAppCurrentVersionCallback = function (args) {
            var version = parseInt(args.version.replace(/\./gi, ""));

            if (isApp()) {
                if ((osType() == "IOS" && version >= 409) || (osType() == "ANDROID" && version >= 406)) {
                    var data = {
                        callback: callbackFn
                    }
                    this.Bridge.getUrlParam(data);
                }
            }
        }.bind(this);

        var data = {
            callback: "_getUrlParamAppCurrentVersionCallback"
        };

        this.appCurrentVersion(data);
    }

    /**
     * 'data-urlparam' 속성을 가진 HTML element 들의 값을 치환한다.
     *  EX) <p data-urlparam={파라미터를 조회할 키}>...</p>
     *
     * @author AJ
     * @date 2020.07.02
     * @see setViewParamsCallback (mobileLayout.js)
     */
    this.setViewParam = function () {
        this.getUrlParam('setViewParamsCallback');
    }

    /**
     * 모바일오더 간편주문 팝업을 호출한다.
     *
     * @author AJ
     * @Date 2020.07.29
     */
    this.simpleOrderPopup = function () {
        if(isApp()) {
            var data = {};
            this.Bridge.simpleOrderPopup(data);
        }
    }

    /**
     * 모바일오더 간편주문 팝업을 닫는다.
     *
     * @author AJ
     * @Date 2020.08.05
     */
    this.simpleOrderPopupClose = function () {
        if(isApp()) {
            var data = {};
            this.Bridge.simpleOrderPopupClose(data);
        }
    }

    /**
     * 현재 기기의 가로, 세로 크기를 불러온다.
     *
     * @author AJ
     * @Date 2020.09.02
     * @callback getScreenSize
     */
    this.getScreenSize = function () {
        if(isApp()) {
            var data = {};
            this.Bridge.getScreenSize();
        }
    }

    /**
     * 네트워크 상태 및 타입체크
     */
    this.checkNetworkType = function(data) {
        if (isApp()) {
            this.Bridge.checkNetworkType(data);
        }
    };

    /**
     * 디바이스 정보 호출
     */
    this.deviceInfo = function(data) {
    	if (isApp()) {
    		this.Bridge.deviceInfo(data);
    	}
    };

    this.sendEventData = function(eventName, eventValue) {
        this.Bridge.sendEvent(eventName, eventValue);
    };

    /**
     * 앱스플라이어 인앱 이벤트
     * @param eventName
     * @param eventValue
     */
    this.sendEvent = function(eventName, eventValue) {
        if (isNull(eventValue) || isNull(eventName)) return;

        // 모바일 앱 일 때 aos 4.2.15 ios 4.2.12 미만 불가
        if (isApp() && AppHeader.Mapping.versionChk('4.2.15', '4.2.12')) {
            $.ajax({
                url: '/on/oc/ocz/commOn/isAppsFlyerActivated.do',
                type: 'POST',
                contentType: 'application/json;charset=UTF-8',
                data: null,
                success: function (data, status, xhr) {
                    if(data.isAppsFlyerActivated) {
                        //console.log(eventValue);
                        AppHandler.Common.sendEventData(eventName, eventValue);
                    }
                },
                error: function(xhr, status, error) {
                }
            });
        }
    };

    /**
     * 앱스플라이어 인앱 이벤트
     * @param data
     */
    this.appsFlyerUID = function(data) {
        // 모바일 앱 일 때 aos 4.2.15 ios 4.2.12 미만 불가
        if (isApp() && AppHeader.Mapping.versionChk('4.2.15', '4.2.12')) {
            this.Bridge.appsFlyerUID(data);
        }
    };

    /**
     * 모두의영화 > 이미지 다운로드
     * @oaram
     * @returns
     */
    this.voteImageDownload = function(data) {
        if (isApp()) {
            this.Bridge.voteImageDownload(data);
        }
    };
};

var AppHandler = new function() {
    this.Common = new Common();
}