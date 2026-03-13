var App = App || {};

App.MobileOrder = (function () {

    'use strict';

    var module = {

        /**
         * 로그인 여부를 확인한다.
         *
         * @author AJ
         */
        fn_loginChk: function () {
            var loginChk;

            $.ajax({
                url: "/on/oh/ohg/MbLogin/selectLoginSession.do",
                async: false,
                success: function (result) {

                    var loginAt = result.resultMap.result;
                    var nonMbLogin = result.resultMap.nonMbLogin;
                    if (loginAt != 'Y' || nonMbLogin == 'Y') {
                        loginChk = false;
                    } else {
                        loginChk = true;
                    }
                }
            });

            return loginChk;
        },

        /**
         * 앱 버전을 체크한다.
         *
         * @author AJ
         * @param {string} callback
         */
        fn_appVersionChk: function (callback) {
            if (isApp()) {
                var data = {
                    callback: callback
                };
                AppHandler.Common.appCurrentVersion(data);
            } else {
                AppHandler.Common.alert("모바일오더는 앱전용 서비스 입니다.");
            }
        },

        /**
         * 위치정보 서비스 사용동의 여부를 확인한다(AGREE16).
         *
         * @author AJ
         * @param {string} callback
         */
        fn_locationAgreeChk: function (callback) {
            $.ajax({
                url: '/on/oh/ohd/StoreCmbo/selectAgree.do',
                type: "POST",
                contentType: "application/json;charset=UTF-8",
                data: '',
                dataType: "json",
                success: function (data) {
                    var agreeAt = false;
                    if (data.agreeList.length > 0) {
                        if (data.agreeList[0].policAgreeAt == "Y") {
                            agreeAt = true;
                        } else {
                            agreeAt = false;
                        }
                    } else {
                        agreeAt = false;
                    }
                    eval(callback)(agreeAt);
                },
                error: function (xhr, status, error) {
                    AppHandler.Common.alert('위치정보 동의여부 확인 실패');
                },
            });
        },

        /**
         * 위치정보 서비스 사용동의 처리한다(AGREE16).
         *
         * @author AJ
         * @param {string} callback
         */
        fn_locationAgree: function (callback) {
            var paramData = {
                policAgreeDivCd: 'AGREE16',
                policAgreeAt: 'Y'
            };

            $.ajax({
                url: '/on/oh/ohz/MySetting/updateMbPushAgree.do',
                type: "POST",
                contentType: "application/json;charset=UTF-8",
                dataType: "json",
                data: JSON.stringify(paramData),
                success: function (data, textStatus, jqXHR) {
                    if (data.result != undefined) {
                        var result = data.result;
                        if (result.statCd == '1') {
                            eval(callback)();
                        } else {
                            AppHandler.Common.alert('위치정보 서비스 사용동의 여부 변경 실패');
                        }
                    } else {
                        AppHandler.Common.alert('위치정보 서비스 사용동의 여부 변경 실패');
                    }
                }
            });
        },

        /**
         * 메가박스 앱 위치 동의 설정 화면으로 이동한다.
         *
         * @author AJ
         */
        fn_mvLocationService: function() {
            if(controlAction.isExec()) return;
            controlAction.on();
            AppDomain.Setting.main(AppDomain.Flag.isClose);
        },

        /**
         * GPS 동의 여부를 확인한다.
         *
         * @author AJ
         * @param {string} callback
         */
        fn_gpsChk: function (callback) {
            var data = {
                callback: callback
            };

            if (isApp()) {
                AppHandler.Common.isGpsEnable(data);
            } else {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(function (position) {
                        eval(callback)({gps: true, permission: true});
                    }, function (error) {
                        eval(callback)({gps: false, permission: false});
                    }, {
                        enableHighAccuracy: false,
                        maximumAge: 0,
                        timeout: Infinity
                    });
                } else {
                    eval(callback)({gps: false, permission: false});
                }
            }
        },

        /**
         * 모바일오더 주문가능한 지점을 조회한다.
         *
         * @author AJ
         * @param {number} latitude
         * @param {number} longitude
         * @param {string} callback
         */
        fn_selectOrderBrch: function (latitude, longitude, deviceInfo, callback) {

            var paramData = {
                brchLat: latitude,
                brchLon: longitude,
                deviceInfo : deviceInfo
            };

            if (this.fn_loginChk()) {
                $.ajax({
                    url: '/on/oh/ohd/StorePreOrder/selectCmboBrch.do',
                    type: "POST",
                    contentType: "application/json;charset=UTF-8",
                    data: JSON.stringify(paramData),
                    dataType: "json",
                    success: function (data) {
                        eval(callback)(data);
                    }
                });
            } else {
                AppDomain.Member.loginConfirm();
            }
        },

        /**
         * 당일 예매 현황을 조회한다.
         *
         * @author AJ
         * @param {string} callback
         */
        fn_selectTodayAdvanceTicket: function (callback) {
            $.ajax({
                url: '/on/oh/ohd/StoreCmbo/bokdDtlsCnfmSearchSt.do',
                type: "POST",
                contentType: "application/json;charset=UTF-8",
                data: '',
                dataType: "json",
                success: function (data) {
                    var bokdInfo = data.bokdDtlsCnfm;
                    eval(callback)(bokdInfo);
                }
            });
        },

        /**
         * 모바일오더 PUSH 알림 설정 값을 조회한다(AGREE12).
         *
         * @param {string} callback
         */
        fn_selectPushAlive: function (callback) {
            var paramData = {agreeItems: ['AGREE12',]};

            $.ajax({
                url: '/on/oh/ohz/MySetting/selectMbPushAgreeInfo.do',
                type: "POST",
                contentType: "application/json;charset=UTF-8",
                dataType: "json",
                data: JSON.stringify(paramData),
                success: function (data, textStatus, jqXHR) {
                    eval(callback)(data.pushAgreeInfo[0]);
                },
                error: function (xhr, status, error) {
                    AppHandler.Common.alert('PUSH 알림 설정 값 조회 실패');
                },
            });
        },

        /**
         * 모바일오더 알림 설정 값을 수정한다.
         *
         * @param {string} pushYn: 모바일오더 알림설정 수정 요청 값
         * @param {string} callback
         */
        fn_updatePushAlive: function (pushYn, callback) {
            if (controlAction.isExec()) return;

            var paramData = {
                policAgreeDivCd: 'AGREE12',
                policAgreeAt: pushYn
            };

            $.ajax({
                url: '/on/oh/ohz/MySetting/updateMbPushAgree.do',
                type: "POST",
                contentType: "application/json;charset=UTF-8",
                dataType: "json",
                data: JSON.stringify(paramData),
                beforeSend: function () {
                    controlAction.on();
                },
                success: function (data, textStatus, jqXHR) {
                    if (data.result != undefined) {
                        var result = data.result;
                        if (result.statCd == '1') {
                            eval(callback)(pushYn);
                        } else {
                            AppHandler.Common.alert('PUSH 알림 설정 값 갱신 실패');
                        }
                    } else {
                        AppHandler.Common.alert('PUSH 알림 설정 값 갱신 실패');
                    }
                },
                error: function (xhr, status, error) {
                    AppHandler.Common.alert('PUSH 알림 설정 값 갱신 실패');
                },
                complete: function () {
                    controlAction.off();
                }
            });
        },

        /**
         * GPS 정보를 받아온다.
         *
         * @author AJ
         * @param {string} callback
         */
        fn_getLocationParam: function (callback) {
            if (isApp()) { // 앱일 시 네이티브의 위치 정보 조회 기능 사용
                var data = {
                    callback: callback
                };
                AppHandler.Common.location(data);
            } else { // 웹일 시 브라우저 GPS 기능 사용
                if (navigator.geolocation) { // [GPS 지원시] 브라우저는 최초 권한 허용 팝업 뜬 후 동의시
                    navigator.geolocation.getCurrentPosition(function (position) {
                        var locationParam = {
                            success: 1,
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        };
                        eval(callback)(locationParam);
                    }, function (error) {
                        eval(callback)({});
                    }, {
                        enableHighAccuracy: false,
                        maximumAge: 0,
                        timeout: Infinity
                    });
                } else {
                    eval(callback)({});
                }
            }
        },

        /**
         * 현재 GPS 위치 기준으로 지점 리스트 조회
         *
         * @author AJ
         * @param {string} callback
         */
        fn_selectCmboBrchList: function (locationParam, callback) {
            $.extend(locationParam, {
                policAgreeAt: 'P'
            });

            $.ajax({
                url: '/on/oh/ohd/StorePreOrder/selectCmboBrch.do',
                type: "POST",
                contentType: "application/json;charset=UTF-8",
                dataType: "json",
                data: JSON.stringify(locationParam),
                success: function (data, textStatus, jqXHR) {
                    eval(callback)(data);
                },
                error: function (xhr, status, error) {
                    AppHandler.Common.alert('지점 리스트 조회 실패.');
                },
            });

        },

        /**
         * 현재 매점의 모바일오더 상품 분류를 조회한다.
         *
         * @author AJ
         * @param {string} brchNo 지점 번호
         * @param {string} storeNo 매점 번호
         * @param {string} callback
         */
        fn_selectCmboPrdtCl: function (brchNo, storeNo, callback) {
            var paramData = {
                brchNo: brchNo,
                storeNo: storeNo
            };

            $.ajax({
                url: "/on/oh/ohd/StorePreOrder/selectCmboPrdtClList.do",
                type: "POST",
                contentType: "application/json;charset=UTF-8",
                data: JSON.stringify(paramData),
                success: function (data, textStatus, jqXHR) {
                    eval(callback)(data.cmboPrdtClList.DataList);
                }
            });
        },

        /**
         * 모바일오더 상품 정보를 조회한다.
         *
         * @author AJ
         * @param {string} brchNo  지점 번호
         * @param {string} storeNo  지점 번호
         * @param {string[]} itemNoList  상품 번호
         * @param {string} callback
         */
        fn_selectBrchItemInfo(brchNo, storeNo,  itemNoList, callback) {
            var paramData = {
                brchNo: brchNo,
                storeNo: storeNo,
                itemNoList: itemNoList
            };
            $.ajax({
                url: "/on/oh/ohd/StoreCmbo/selectBrchItemList.do",
                type: "POST",
                contentType: "application/json;charset=UTF-8",
                data: JSON.stringify(paramData),
                success: function (data, textStatus, jqXHR) {
                    eval(callback)(data.brchItemList);
                },
                error: function (xhr, status, error) {
                    var err = JSON.parse(xhr.responseText);
                    AppHandler.Common.alert(err.msg);
                },
            });
        },

        /**
         * 장바구니에 물품을 담는다.
         *
         * @author AJ
         * @param {string} brchNo  지점 번호
         * @param {string} storeNo 매점 번호
         * @param {Object[]} basketList 상품 정보
         * @param {string} callback
         */
        fn_insertBasket: function (brchNo, storeNo, basketList, callback) {
            if (controlAction.isExec()) return;

            var paramData = {
                brchNo: brchNo,
                storeNo: storeNo,
                basketList: basketList
            };

            $.ajax({
                url: "/on/oh/ohd/StorePreOrder/insertCmboMenuDtlsPM.do",
                type: "POST",
                contentType: "application/json;charset=UTF-8",
                data: JSON.stringify(paramData),
                beforeSend: function () {
                    controlAction.on();
                },
                success: function (data, textStatus, jqXHR) {
                    eval(callback)(data.basketInfo);
                },
                error: function (xhr, status, error) {
                    var err = JSON.parse(xhr.responseText);
                    AppHandler.Common.alert(err.msg);
                },
                complete: function () {
                    controlAction.off();
                }
            });
        },

        /**
         * 장바구니에 여러 개의 물품을 담는다.
         *
         * @author AJ
         * @param {string} brchNo  지점 번호
         * @param {string} storeNo 매점 번호
         * @param {Object[][]} basketList 상품 정보
         * @param {string} callback
         */
        fn_insertMultiBasket: function (brchNo, storeNo, basketList, callback) {
            if (controlAction.isExec()) return;

            var paramData = {
                brchNo: brchNo,
                storeNo: storeNo,
                basketList: basketList
            };

            $.ajax({
                url: "/on/oh/ohd/StorePreOrder/insertMultiCmboMenuDtlsPM.do",
                type: "POST",
                contentType: "application/json;charset=UTF-8",
                data: JSON.stringify(paramData),
                beforeSend: function () {
                    controlAction.on();
                },
                success: function (data, textStatus, jqXHR) {
                    eval(callback)(data.result);
                },
                error: function (xhr, status, error) {
                    var err = JSON.parse(xhr.responseText);
                    AppHandler.Common.alert(err.msg);
                },
                complete: function () {
                    controlAction.off();
                }
            });
        },

        /**
         * 장바구니 객체를 생성한다.
         *
         * @author AJ
         * @param {string} brchNo  지점 번호
         * @param {string} storeNo 매점 번호
         * @param {Object[]} itemList 상품 정보
         */
        fn_createBasketList: function(brchNo, storeNo, itemList) {
            var basketList = [];
            var itemId = makeItemId('basket', 8);    /* 난수번호 생성 (seed, length) */
            $.each(itemList, function (idx, obj) {
                var rData = {
                    brchNo: brchNo,
                    storeNo: storeNo,
                    itemNo: obj["itemNo"] || '',		  /* 아이템 번호 */
                    itemNm: obj["itemNm"] || '',	      /* 아이템 네임 */
                    itemLclCd: obj["itemLclCd"] || '',	  /* 대, 중 분류 */
                    itemMclCd: obj["itemMclCd"] || '',	  /* 대, 중 분류 */
                    sellAmt: Number(obj["sellAmt"]) || 0, /* 기본 판매금액 */
                    sellQty: 1,
                    addAmt: Number(obj["addAmt"]) || 0,	  /* 추가금액 */
                    rpstPrdtCd: obj["rpstPrdtCd"],        /* 메인아이템 번호 없으면 메인 아이템 */
                    basisItemNo: obj["basisItemNo"],      /* 기본아이템 번호 */
                    basisItemNm: obj["basisItemNm"],      /* 기본아이템 네임 */
                    itemId: itemId,	                      /* 난수 */
                    kitchnAt: obj["kitchnAt"] || 'N',
                    indeOrderAt: obj["indeOrderAt"] || 'N',
                    grpNo: obj["grpNo"] || ''
                }
                basketList.push(rData);
            });
            return basketList;
        },

        /**
         * 현재 지점의 모바일오더 운영 여부를 확인한다.
         *
         * @author AJ
         * @param {string} brchNo 지점 번호
         */
        fn_orderBrchChk: function (brchNo) {
            var paramData = {
                brchNo: brchNo,
            };

            var isOpen = false;

            $.ajax({
                url: "/on/oh/ohd/StoreCmbo/selectOrderTime.do",
                type: "POST",
                async: false,
                contentType: "application/json;charset=UTF-8",
                data: JSON.stringify(paramData),
                success: function (data, textStatus, jqXHR) {
                    isOpen = !_.isEmpty(data.selectOrderTime);
                }
            });

            return isOpen;
        },

        /**
         * 현재 지점의 모바일오더 운영 시간을 확인한다.
         *
         * @author AJ
         * @param {string} brchNo 지점 번호
         * @param {string} storeNo 매점 번호
         */
        fn_orderTimeChk: function (brchNo, storeNo) {
            var checkTime = {
                chk: null,
                text: null
            };

            var paramData = {
                brchNo: brchNo,
                storeNo: storeNo
            };

            $.ajax({
                url: "/on/oh/ohd/StoreCmbo/selectOrderTime.do",
                type: "POST",
                async: false,
                contentType: "application/json;charset=UTF-8",
                data: JSON.stringify(paramData),
                success: function (data, textStatus, jqXHR) {
                    var open = _.find(data.selectOrderTime, isOpen);
                    var close = _.find(data.selectOrderTime, _.negate(isOpen));

                    if (!_.isEmpty(open)) {
                        checkTime.chk = true;
                        checkTime.text = parseTime(open.orderAbleStartTime) + " ~ " + parseTime(open.orderAbleEndTime);
                    } else if (!_.isEmpty(close)) {
                        checkTime.chk = false;
                        checkTime.text = parseTime(close.orderAbleStartTime) + " ~ " + parseTime(close.orderAbleEndTime);
                    } else {
                        checkTime.chk = false;
                        checkTime.text = '모바일오더 운영 가능 요일이 아닙니다.';
                    }
                }
            });

            return checkTime;

            function parseTime(time) {
                return time.substring(0, 2) + '시 ' + time.substring(2, 4) + '분';
            }

            function isOpen(value) {
                return value.openAt === 'Y';
            }
        },

        /**
         * 장바구니 유효성을 검사한다.
         *
         * @param {string} brchNo 지점 번호
         * @param {string} storeNo 매점 번호
         * @param {string} itemId 장바구니 번호
         * @param {string} callback
         * @param {Object} param
         */
        fn_selectBasketStatus: function (brchNo, storeNo, itemId, callback, param) {
            var paramData = {
                brchNo: brchNo,
                storeNo: storeNo
            };
            if (itemId) {
                paramData.itemId = itemId;
            }

            function handleError() {
                this.fn_deleteBasket(itemId, 'App.MobileOrder.fn_basketCnt(\"' + brchNo + '", \"' + storeNo + '\")');
            }

            var obj = this; // ajax 내부에서 모듈 함수 호출 시 this 변수를 바인딩 하기 위해 사용한다.
            $.ajax({
                url: "/on/oh/ohd/StoreCmbo/selectBasketStatus.do",
                type: "POST",
                contentType: "application/json;charset=UTF-8",
                data: JSON.stringify(paramData),
                beforeSend: function () {
                    if (controlAction.isExec()) return;
                    controlAction.on();
                },
                success: function (data, textStatus, jqXHR) {
                    controlAction.off();

                    try {
                        var isValid = true;
                        var isSoldOut = false;
                        var isCompSoldOut = false;
                        var isBeer = false;

                        $.each(data.result.basketStatusList, function (idx, obj) {
                            if (obj.sellAt == 'N' || obj.exhbtAt == 'N' || (obj.itemDivCd == 'IDSE' && obj.compSellAt == 'N')) {
                                isValid = false;
                            }
                            if (obj.soldOutAt == 'Y') {
                                isSoldOut = true;
                            }
                            if (obj.itemDivCd == 'IDSE' && obj.compSoldOutAt == 'Y') {
                                isCompSoldOut = true;
                            }
                            if (obj.beerAt == 'Y') {
                                isBeer = true;
                            }
                        });

                        if (!isValid) {
                            AppHandler.Common.alert('일시적으로 판매가 중지된 상품입니다.');
                        } else if (isSoldOut) {
                            AppHandler.Common.alert('품절상품입니다.');
                        } else if (isCompSoldOut) {
                            AppHandler.Common.alert('구성상품 품절입니다.');
                        } else if (isBeer) {
                            AppHandler.Common.alert('19세 미만 청소년에게 주류 판매를 금지합니다.');
                        } else {
                            param = param || {};
                            // 상태값 검증 후 장바구니를 핸들링 하기 위해 장바구니 ID 를 전달한다.
                            param.itemId = itemId;
                            // 조리상품 존재 시 얼럿을 노출하기 위해 조리상품 이름을 전달한다.
                            var cookItemList = data.result.basketStatusList.filter(function (element) {
                                return element.cookAt == 'Y';
                            });
                            if (cookItemList.length > 0) {
                                param.cookItemNm = cookItemList.map(function (element) {
                                    return element.itemNm;
                                }).reduce(function (accumulator, currentValue) {
                                    return accumulator + ', ' + currentValue;
                                });
                            }
                            eval(callback)(param);
                        }
                    } catch (e) {
                        AppHandler.Common.alert('조회하는데 에러가 발생했습니다.');
                        handleError.bind(obj)();
                    }
                },
                error: function (xhr, status, error) {
                    var err = JSON.parse(xhr.responseText);
                    AppHandler.Common.alert(err.msg);
                    handleError.bind(obj)();
                },
                complete: function () {
                    controlAction.off();
                },
            });
        },

        fn_basketCnt: function (brchNo, storeNo) {
            var rtCnt = 0;
            var paramData = {brchNo: brchNo, storeNo: storeNo}

            $.ajax({
                url: "/on/oh/ohd/StoreCmbo/selectBasketCnt.do",
                async: false,
                type: "POST",
                contentType: "application/json;charset=UTF-8",
                data: JSON.stringify(paramData),
                success: function (result) {
                    AppHandler.Common.setOrderBkCount({count: result.basketCnt});
                    rtCnt = result.basketCnt;
                }
            });
            return rtCnt;
        },

        fn_deleteBasket: function (itemId, callback) {
            var paramData = {
                itemId: itemId
            }

            $.ajax({
                url: "/on/oh/ohd/StorePreOrder/deleteTbHtBasket.do",
                type: "POST",
                contentType: "application/json;charset=UTF-8",
                dataType: "json",
                data: JSON.stringify(paramData),
                tryCount: 0,
                retryLimit: 3,
                beforeSend: function () {
                    if (controlAction.isExec()) return;
                    controlAction.on();
                },
                success: function (data, textStatus, jqXHR) {
                    if (callback) {
                        eval(callback)();
                    }
                },
                complete: function () {
                    controlAction.off();
                },
                error: function (xhr, status, error) {
                    this.tryCount++;
                    if(this.tryCount <= this.retryLimit) {
                        $.ajax(this);
                        return;
                    } else {
                        var err = JSON.parse(xhr.responseText);
                        AppHandler.Common.alert(err.msg);
                    }
                }
            });
        },

        fn_brchDist2kmChk: function (brchNo, locationParam, callback) {
            if (!locationParam.brchLat || !locationParam.brchLon) {
                AppHandler.Common.alert('앱 위치정보 조회 실패. 다시 시도해 주세요.');
                return;
            }

            var paramData = $.extend({
                brchNo: brchNo,
                policAgreeAt: "P",
                policAgreeDivCd: "AGREE16"
            }, locationParam);

            $.ajax({
                url: "/on/oh/ohd/StorePreOrder/selectMyLocation.do",
                type: "POST",
                contentType: "application/json;charset=UTF-8",
                data: JSON.stringify(paramData),
                success: function (data, textStatus, jqXHR) {
                    var brchDist = parseFloat(data.nearbyTheater.brchDist);

                    if (brchDist > 2) {
                        AppHandler.Common.alert("2Km이내의 극장에서 주문 가능합니다. \n선택하신 극장과의 거리는 " + brchDist + "Km 입니다. ");
                    } else {
                        eval(callback)();
                    }
                },
                error: function (xhr, status, error) {
                    var err = JSON.parse(xhr.responseText);
                    alert(err.message);
                }
            });
        },

        /**
         * 사회적 거리두기 대상 지역일 경우 노출 메시지를 반환한다.
         *
         * @param {string} brchNo 지점 번호
         */
        fn_coronaBrchPopup: function (brchNo) {
            var areaCdList = ['10', '30', '35']; // 서울, 경기, 인천
            var brchNoList = [];
            var msg = '[서울/경기/인천지역] 상영관 내부에서는 음료만 취식 가능하며, 팝콘/스낵/주류는 입장 전 취식 또는 포장으로 가능합니다.';

            return new Promise(function (resolve, reject) {
                /* 전 지점 적용 처리 START */
                resolve('4/25(월)부터 상영관 내에서 모든 상품이 취식 가능합니다.');
                return;
                /* 전 지점 적용 처리 END */

                $.ajax({
                    url: "/on/oh/ohd/StoreCmbo/selectBrchAreaCd.do",
                    type: "POST",
                    contentType: "application/json;charset=UTF-8",
                    data: JSON.stringify({brchNo: brchNo}),
                    success: function (data) {
                        var areaInfo = data.result;
                        _.chain(areaInfo)
                            .filter(function (value) {
                                return areaCdList.indexOf(value.areaCd) > -1 || brchNoList.indexOf(brchNo) > -1;
                            })
                            .take(1)
                            .value()
                            .forEach(function () {
                                resolve(msg);
                            });
                    },
                    error: function (xhr, status, error) {
                        reject(error);
                    }
                });
            });
        }
    };

    return module;
})();