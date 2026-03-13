/*******************************************************************************
 * 01. 업무구분 : Native Header Info
 * 02. 화면명   : 모바일 공통
 * 03. 화면설명 :
 * 04. 작성자   :
 * 05. 작성일   :
 * =============================================================================
 * 06. 수정이력 : 수정자          내용
 * =============================================================================
 *
 ******************************************************************************/
/* 이벤트 */
var Event = function() {
    // 이벤트 메인
    // AppHeader.Event.main
    this.main = {
        header: {
            type: 'default'
        },
        title: {
            type: 'text',
            text: '이벤트'
        },
        btnLeft: {
            type: 'back'
        },
    },

    // 이벤트 메인(신버전)
    // AppHeader.Event.newMain
    this.newMain = {
        header: {
            type: 'default',
            isViewLight: false,
            overlay: 'feed',
            bgColor: '00ffffff',
            txtColor: 'ffffff',
            scrollBgColor: '160F2B'
        },
        title: {
            type: 'text',
            text: '이벤트'
        },
        btnLeft: {
            type: 'back',
            txtColor: 'ffffff'
        },
    },

    // 이벤트상세
    // AppHeader.Event.detail
	this.detail = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '이벤트 상세'
            },
            btnLeft: {
                type: 'back'
            },
            btnRight: {
                type: 'sub',
                image: 'ico-share',
                callback: 'fn_snsShare'
            },
            refresh: true
    };

    // 참여 이벤트 (나의 이벤트 응모내역)
    // AppHeader.Event.myEvent
    this.myEvent = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '나의 응모내역'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 이벤트 당첨자발표 상세
    // AppHeader.Event.winnerDetail
    this.winnerDetail = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '당첨자 발표'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 투표결과(이벤트상세)
    // AppHeader.Event.detailResult
    this.detailResult = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '이벤트 상세'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 배너오픈 등
    // AppHeader.Event.openUrl
    this.openUrl = function(title) {
        var data = {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: title || '소식'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup'
        };
        return data;
    };

    // 이동페이지
    // AppHeader.Event.openBackPop
    this.openBackPop = function(title) {
        var data = {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: title
                },
                btnLeft: {
                    type: 'back'
                },
                animation: 'popup'
        };
        return data;
    };

    // 사운드 무비
    // AppHeader.Event.soundMovie
    this.soundMovie = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '사운드 무비'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 굿즈 소진현황
    // AppHeader.Event.goodsStockPrco
    this.goodsStockPrco = {
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
        animation: 'popup'
    };
};

/* 예매 */
var Booking = function() {
    // 이벤트 넷퍼넬 해더
    // AppHeader.Booking.newEv
    this.newEv = {
        header: {
            type: 'default'
        },
        title: {
            type: 'text',
            text: '접속 대기 안내'
        },
        btnRight: {
            type: 'close'
        },
        animation: 'popup'
    };
    // 예매상세
    // AppHeader.Booking.detail
    this.detail = function(closeAction) {
        if (!closeAction) closeAction = 'fn_ticketClose';
        var data = {
                header: {
                    type: 'default',
                    bgColor: '201D3E',
                    txtColor: 'ffffff',
                    closeAction : closeAction
                },
                title: {
                    type: 'text',
                    text: '예매상세'
                },
                btnRight: {
                    type: 'close',
                    txtColor: 'ffffff'
                },
                animation: 'popup'
        };
        return data;
    };
    // 이벤트 NEW영화별 예매
    // AppHeader.Booking.newEvMovie
    this.newEvMovie = function() {
        var data = {
            header: {
                bgColor: "660ED8",
                type: "HORIZONTAL_SELECT_TEXT",
                index: 1,
                backAction: 'fn_backActPopupClose'
            },
            title: {
                type: 'text',
                text: ''
            },
            btnLeft: {
                text: "이벤트 예매",
                txtColor: "white"
            },
            btnLeftSub: {
            	text: ""
            }
        };
        return data;
    };

    // NEW영화별 예매
    // AppHeader.Booking.newMovie
    this.newMovie = function() {
        var data = {
    	    header: {
    	        bgColor: "660ED8",
    	        type: "HORIZONTAL_SELECT_TEXT",
    	        index: 1,
                backAction: 'fn_backActPopupClose'
    	    },
            title: {
                type: 'text',
                text: ''
            },
            btnLeft: {
                link: "/nbooking/theater",
                text: "극장별 예매",
                txtColor: "FFFFFF",
                txtColorDisable: "B2FFFFFF"
            },
            btnLeftSub: {
            	link: "/nbooking/movie",
            	text: "영화별 예매",
            	txtColor: "FFFFFF",
            	txtColorDisable: "B2FFFFFF"
            }
        };
        return data;
    };

    // NEW극장별 예매
    // AppHeader.Booking.newTheater
    this.newTheater = function() {
    	var data = {
    			header: {
    				bgColor: "660ED8",
    				type: "HORIZONTAL_SELECT_TEXT",
    				index: 0,
                    backAction: 'fn_backActPopupClose'
    			},
    			title: {
    				type: 'text',
    				text: ''
    			},
    			btnLeft: {
    				link: "/nbooking/theater",
    				text: "극장별 예매",
    				txtColor: "FFFFFF",
    				txtColorDisable: "B2FFFFFF"
    			},
    			btnLeftSub: {
    				link: "/nbooking/movie",
    				text: "영화별 예매",
    				txtColor: "FFFFFF",
    				txtColorDisable: "B2FFFFFF"
    			}
    	};
    	return data;
    };

    // 영화별 예매
    // AppHeader.Booking.movie
    this.movie = function(closeAction) {
    	if (!closeAction) closeAction = 'fn_goback';
    	var data = {
    			header: {
    				type: 'default',
    				closeAction: closeAction
    			},
    			title: {
    				type: 'text',
    				text: '영화 선택'
    			},
    			btnLeft: {
    				type: 'sub',
    				image: 'ico-list-line',
    				callback: 'fn_changeViewType'
    			},
    			btnRight: {
    				type: 'close'
    			}
    	};
    	return data;
    };

    // 극장별 예매
    // AppHeader.Booking.theater
    this.theater = {
            header: {
                type: 'default',
                bgColor: '160F2B',
                txtColor: 'ffffff'
            },
            title: {
                type: 'text',
                text: '극장별 예매'
            },
            btnLeft: {
                type: 'back',
                txtColor: 'ffffff'
            }
    };

    // 대관예매
    // AppHeader.Booking.privateBooking
    this.privateBooking = {
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

    // 좌석도
    // AppHeader.Booking.seat
    this.seat = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: ''
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 결제하기
    // AppHeader.Booking.pay
    this.pay = function(closeAction) {
        if (!closeAction) closeAction = 'fn_goSeat';
        var data = {
                header: {
                    type: 'default',
                    bgColor: 'ffffff',
                    txtColor: '000000',
                    closeAction: closeAction
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
/*
        var data = {
                header: {
                    type: 'default',
                    bgColor: '201D3E',
                    txtColor: 'ffffff',
                    closeAction: closeAction
                },
                title: {
                    type: 'text',
                    text: '결제하기'
                },
                btnLeft: {
                    type: 'back',
                    txtColor: 'ffffff'
                }
        };
*/
        return data;
    };

    // 영화예매(영화선택)
    // AppHeader.Booking.movieReserve
    this.movieReserve = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '영화 선택'
            },
            btnLeft: {
                type: 'sub',
                image: 'ico-list-line',
                callback: 'fn_changeViewType'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 극장예매(극장선택)
    // AppHeader.Booking.theaterReserve
    this.theaterReserve = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '극장 선택'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 예매완료
    // AppHeader.Booking.finish
    this.finish = {
            header: {
                type: 'default',
                bgColor: '201D3E',
                txtColor: 'ffffff'
            },
            title: {
                type: 'text',
                text: '예매상세'
            },
            btnRight: {
                type: 'close',
                txtColor: 'ffffff'
            },
            animation: 'popup'
    };

    // 모바일티켓
    // AppHeader.Booking.mobileTicket
    this.mobileTicket = function(closeAction) {
        if (!closeAction) closeAction = 'fn_ticketClose';
        var data = {
                header: {
                    type: 'default',
                    overlay: 'feed',
                    bgColor: '00ffffff',
                    txtColor: 'ffffff',
                    scrollBgColor: 'ffffff',
                    scrollTxtColor : '000000',
                    closeAction : closeAction
                },
                title: {
                    type: 'text',
                    text: '모바일 티켓'
                },
                btnRight: {
                    type: 'close',
                    txtColor :'ffffff',
                    scrollColor :'000000'
                },
                btnLeft: {
                	type: 'sub',
                    txtColor :'ffffff',
                    scrollColor :'000000',
                    image: 'https://img.megabox.co.kr/static/mb/images/2024renewal/common/btn_share_w60.png',
                    callback: 'fn_openShareLayer'
                },
                animation: 'popup'
        };
        if(isApp()){
        	data.btnRight.type = 'sub';
        	data.btnRight.txtColor  = 'ffffff';
        	data.btnRight.scrollColor  = '000000';
        	data.btnRight.image = 'https://img.megabox.co.kr/static/mb/images/2024renewal/common/ico-close-w60.png';
        	data.btnRight.callback = 'fn_ticketClose';
        }
        return data;
    }

    // 티켓나누기
    // AppHeader.Booking.shareTicket
    this.shareTicket = function(closeAction) {
        if (!closeAction) closeAction = 'fn_ticketDtl';
        var data = {
                header: {
                    type: 'default',
                    closeAction : closeAction
                },
                title: {
                    type: 'text',
                    text: '티켓나누기'
                },
                btnRight: {
                    type: 'close'
                },
                animation : 'popup'
        };
        return data;
    };

    // 비회원 예매 내역
    // AppHeader.Booking.nonMember
    this.nonMember = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '비회원 예매 내역'
            },
            btnLeft: {
                type: 'back'
            },
            btnRight: {
                type: 'menu'
            }
    };

    // 전자출입명부
    // AppHeader.Booking.internetPass
    this.internetPass = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '전자출입명부'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };
};

/* 영화 */
var Movie = function() {
    // 영화상세
    // AppHeader.Movie.detail
    this.detail = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text'
            },
            btnLeft: {
                type: 'back'
            },
            btnRightSub: {
                type: 'sub',
                image: 'https://img.megabox.co.kr/static/mb/images/2024renewal/common/btn_love_bl30.png',
                callback: 'fn_imissYou'
            },
            btnRight: {
                type: 'sub',
                image: 'ico-share',
                callback: 'fn_shareBox'
            }
    };

    // 한줄평
    // AppHeader.Movie.oneLineWrite
    this.oneLineWrite = function(onelnEvalDivCd) {
        var title = onelnEvalDivCd == "PREV" ? "실관람평 작성" : "기대평 작성";
        var data = {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: title
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup'
        };
        return data;
    };

    // 무비포스트
    // AppHeader.Movie.moviePost
    this.moviePost = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '무비포스트'
            },
            btnLeft: {
                type: 'back'
            },
            btnRight: {
                type: 'menu'
            },
            btnRightSub: {
                type: 'sub',
                image: 'ico-pencil',
                callback: 'fn_checkLoginSession',
                params: 'fn_writeMoviePost'
            }
    };

    // 무비포스트 상세
    // AppHeader.Movie.postDetail
    this.postDetail = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '무비포스트 상세'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 무비포스트 작성
    // AppHeader.Movie.postWrite
    this.postWrite = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '무비포스트 작성'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 큐레이션
    // AppHeader.Movie.curation
    this.curation = {
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
            btnRight: {
                type: 'sub',
                image: 'ico-share',
                callback: 'fn_shareBox'
            }
    };

    // 영화목록
    // AppHeader.Movie.list
    this.list = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '영화'
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
                callback: 'fn_movieSearch'
            }
    };

    // 영화상세 스틸컷
    // AppHeader.Movie.stillcutPhotoView
    this.stillcutPhotoView = function(movieName) {
        if (!movieName) movieName = '스틸컷';
        var data = {
                header: {
                    type: 'default',
                    bgColor: '0b0b0b',
                    txtColor: 'ffffff'
                },
                title: {
                    type: 'text',
                    text: movieName
                },
                btnRight: {
                    type: 'close',
                    txtColor : 'ffffff'
                },
                animation: 'popup'
        };
        return data;
    };

    // 영화검색
    // AppHeader.Movie.search
    this.search = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '영화검색'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 무비포스트 영화 선택
    // AppHeader.Movie.postRegister
    this.postRegister = function(closeAction) {
        if (!closeAction) closeAction = 'gfn_selLayerCls';
        var data = {
                header: {
                    type: 'default',
                    closeAction: closeAction
                },
                title: {
                    type: 'text',
                    text: '무비포스트 영화 선택'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup'
        };
        return data;
    };

    this.nscreen = {
        header: {
            type: 'default',
            overlay: "feed",
            bgColor: "00ffffff",
            txtColor: "00ffffff",
            scrollBgColor: "160F2B",
            scrollTxtColor: "ffffff",
            isViewLight: false
        }
        , btnLeft: {
            type: 'back'
            , txtColor: "ffffff"
        }
        , title: {
            type: "text"
            , text: 'N스크린'
        }
    }

    this.nscreenForOldVersion = {
        header: {
            type: 'default',
        }
        , btnLeft: {
            type: 'back'
        }
        , title: {
            type: "text"
            , text: 'N스크린'
        }
    }

    this.soundMovie = {
        header: {
            type: 'default',
        }
        , btnLeft: {
            type: 'back'
        }
        , title: {
            type: "text"
            , text: '사운드무비'
        }
    }
};

/* 멤버십 */
var Membership = function() {
    // 스페셜멤버십 가입
    // AppHeader.Membership.filmJoin
    this.filmJoin = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '스페셜멤버십 가입'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 스페셜멤버십 가입
    // AppHeader.Membership.classicJoin
    this.classicJoin = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '스페셜멤버십 가입'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 클럽 멤버십
    // AppHeader.Membership.clubMbShip
    this.clubMbShip = {
            header: {
                type: 'default',
                bgColor : 'F5F5F5'
            },
            title: {
                type: 'text',
                text: '클럽 멤버십'
            },
            btnLeft: {
                type: 'back'
            },
            btnRight: {
                type: 'sub',
                image: 'ico-share',
                callback: 'fn_shareBox'
            },
            btnRightSub: {
                type: 'sub',
                image: 'ico-info',
                callback: 'AppDomain.Membership.clubMbShipInfo'
            }
    };

    // 메가 매니아
    // AppHeader.Membership.megaMania
    this.megaMania = {
    		header: {
    			type: 'default'
    		},
    		title: {
    			type: 'text',
    			text: '메가 매니아'
    		},
    		btnLeft: {
    			type: 'back'
    		},
            btnRight: {
                type: 'sub',
                image: 'ico-share',
                callback: 'fn_shareBox'
            }
    };

    // 메가 패밀리
    // AppHeader.Membership.megaFamily
    this.megaFamily = {
        header: {
            type: 'default'
        },
        title: {
            type: 'text',
            text: '메가 패밀리'
        },
        btnLeft: {
            type: 'back'
		},
        btnRight: {
            type: 'sub',
            image: 'ico-share',
            callback: 'fn_shareBox'
        }
    };

    // 메가 프리미엄
    // AppHeader.Membership.megaPremium
    this.megaPremium = {
        header: {
            type: 'default'
        },
        title: {
            type: 'text',
            text: '메가 프리미엄'
        },
        btnLeft: {
            type: 'back'
		},
        btnRight: {
            type: 'sub',
            image: 'ico-share',
            callback: 'fn_shareBox'
        }
    };

    // 메가 트렌디
    // AppHeader.Membership.megaTrendy
    this.megaTrendy = {
        header: {
            type: 'default'
        },
        title: {
            type: 'text',
            text: '메가 트렌디'
        },
        btnLeft: {
            type: 'back'
		},
        btnRight: {
            type: 'sub',
            image: 'ico-share',
            callback: 'fn_shareBox'
        }
    };

    // 메가 돌비
    // AppHeader.Membership.megaDolby
    this.megaDolby = {
        header: {
            type: 'default'
        },
        title: {
            type: 'text',
            text: '메가 돌비'
        },
        btnLeft: {
            type: 'back'
		},
        btnRight: {
            type: 'sub',
            image: 'ico-share',
            callback: 'fn_shareBox'
        }
    };

    // MiL.k 계정 연동 약관 동의
    // AppHeader.Membership.milkLinkService
    this.milkLinkService = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: 'MiL.k 계정 연동'
            },
            btnLeft: {
                type: 'back'
            }
    };

    this.milkService = {
            header: {
                type: 'default',
                parentAction: 'fn_milkAuthInfo'
            },
            title: {
                type: 'text',
                text: 'MiL.k 계정 연동'
            },
            btnLeft: {
                type: 'back'
            }
    };
};

/* 메가핫딜 */
var Hotdeal = function () {
    // 메가핫딜 목록
    // AppHeader.Hotdeal.list
    this.list = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '메가핫딜'
            },
            btnLeft: {
                type: 'back'
            },
            btnRight: {
                type: 'menu'
            },
            btnRightSub: {
                type: 'sub',
                image: 'ico-info',
                callback: 'fn_openDtailPop'
            }
    };

    // 메가핫딜 상세
    // AppHeader.Hotdeal.detail
    this.detail = function(movieNm) {
        var data = {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: movieNm
                },
                btnLeft: {
                    type: 'back'
                },
                btnRight: {
                    type: 'sub',
                    image: 'ico-share',
                    callback: 'fn_shareBox'
                }
        };
        return data;
    };

    // 임시예매권
    // AppHeader.Hotdeal.tempTicket
    this.tempTicket = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '임시예매권'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 메가핫딜 안내
    // AppHeader.Hotdeal.guide
    this.guide = {
            header: {
                type: 'default',
                bgColor: 'f5f4f4'
            },
            title: {
                type: 'text',
                text: ''
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };
};

/* 극장 */
var Theater = function() {
    // 극장목록
    // AppHeader.Theater.list
    this.list = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '극장선택'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 극장상세
    // AppHeader.Theater.detail
    this.detail = function(brchNm) {
        if (!brchNm) brchNm = '극장상세';
        var data = {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: brchNm
                },
                btnLeft: {
                    type: 'back'
                }
        };
        return data;
    };

    // 특별관
    // AppHeader.Theater.specialDetail
    this.specialDetail = function(kindCd) {
        var data = {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: '특별관',
                    // action: {
                    //     type: 'click',
                    //     callback: 'fn_specialLayerOpn'
                    // }
                },
                btnLeft: {
                    type: 'back'
                }
        };

        if(kindCd == 'TBQ') {
            data.title.text = 'BOUTIQUE by MEGA';
        }
        else if(kindCd == 'TBP') {
            data.title.text = 'BOUTIQUE PRIVATE by MEGA';
        }
        else if(kindCd == 'TBS') {
            data.title.text = 'BOUTIQUE SUITE by MEGA';
        }
        else if(kindCd == 'MX') {
            data.title.text = 'MEGA | DOLBY ATMOS';
        }
        else if(kindCd == 'CFT') {
            data.title.text = 'COMFORT by MEGA';
        }
        else if(kindCd == 'MKB') {
            data.title.text = 'MEGABOX KIDS';
        }
        else if(kindCd == 'TFC') {
            data.title.text = 'THE FIRST CLUB';
        }
        else if(kindCd == 'BCY') {
            data.title.text = 'BALCONY M';
        }
        else if(kindCd == 'DBC') {
            data.title.text = 'DOLBY CINEMA';
        }
        else if(kindCd == 'PTC') {
            data.title.text = 'PUPPY CINEMA';
        }
        else if(kindCd == 'MX4D') {
            data.title.text = 'MEGA | MX4D';
        }
        else if(kindCd == 'LUMINEON') {
            data.title.text = 'MEGA | LED';
        }
        else if(kindCd == 'RCL') {
            data.title.text = 'LE RECLINER by MEGA';
        }
        else if(kindCd == 'DVA') {
            data.title.text = 'DOLBY VISION+ATMOS';
        }

        return data;
    };

    // 특별관 리스트
    // AppHeader.Theater.specialList
    this.specialList = {
        header: {
            type: 'default'
        },
        title: {
            type: 'text',
            text: '특별관'
        },
        btnLeft: {
            type: 'back'
        }
    };

    // 관람료
    // AppHeader.Theater.admissionFee
    this.admissionFee = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '관람료'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 진행중인 무대인사·GV
    // AppHeader.Theater.gvGreetingL
    this.gvGreetingL = {
    		header: {
    			type: 'default'
    		},
    		title: {
    			type: 'text',
    			text: '진행중인 무대인사·GV'
    		},
    		btnLeft: {
    			type: 'back'
    		}
    };
};

/* 나의메가박스 */
var MyMegabox = function() {
    // 나의 메가박스 메인
    // AppHeader.MyMegabox.main
    this.main = {
        header: {
            type: 'default',
            bgColor: 'F5F5F5'
        },
        title: {
            type: 'text',
            text: 'MY'
        },
        btnLeft: {
            type: 'back'
        },
        btnRight: {
            type: 'menu'
        },
        btnRightSub: {
            type: 'sub',
            image: 'ico-home',
            callback: 'AppHandler.Common.goMain'
        },
        refresh : true,
        animaition : 'slide'
    }

    // 예매/구매 내역
    // AppHeader.MyMegabox.bookinglist
    this.bookinglist = {
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
    };

    // 무비스토리
    // AppHeader.MyMegabox.movieStory
    this.movieStory = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '나의 무비스토리'
            },
            btnLeft: {
                type: 'back'
            },
            btnRight: {
                type: 'menu'
            }
    };

    // 쿠폰목록
    // AppHeader.MyMegabox.coupon
    this.coupon = {
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
            // btnRight: {
            //     type: 'menu'
            // },
            btnRight: {
                type: 'sub',
                image: 'ico-info',
                callback: 'fn_cponLayerOpn'
            }
    };

    // 영화관람권
    // AppHeader.MyMegabox.movieCoupon
    this.movieCoupon = {
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
                type: 'menu'
            },
            btnRightSub: {
                type: 'sub',
                image: 'ico-info',
                callback: 'fn_mvtckInfoOpn'
            }
    };

    // 스토어교환권
    // AppHeader.MyMegabox.storeCoupon
    this.storeCoupon = {
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
                type: 'menu'
            },
            btnRightSub: {
                type: 'sub',
                image: 'ico-info',
                callback: 'fn_mvtckInfoOpn'
            }
    };

    // AppHeader.MyMegabox.nonMbInquiry
    this.nonMbInquiry = {
        header: {
            type: 'default'
        },
        title: {
            type: 'text',
            text: '비회원 문의내역'
        },
        btnLeft: {
            type: 'back'
        }
    };

    // 멤버십 등급이력
    // AppHeader.MyMegabox.mbshipClassHist
    this.mbshipClassHist = {
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
            animation: 'popup'
    };

    // 멤버십 월별 등급이력
    // AppHeader.MyMegabox.mbshipClassMonthHist
    this.mbshipClassMonthHist = {
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
        animation: 'popup'
    };

    // 멤버십 포인트 내역
    // AppHeader.MyMegabox.pointList
    this.pointList = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '멤버십포인트'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 포인트 선물하기
    // AppHeader.MyMegabox.mbshipPointGift
    this.mbshipPointGift = {
             header: {
                 type: 'default'
             },
             title: {
                 type: 'text',
                 text: '포인트 선물하기'
             },
             btnLeft: {
                 type: 'back'
             }
    };

    // 포인트 비밀번호 설정
    // AppHeader.MyMegabox.mbshipPointChage
    this.mbshipPointChage = {
             header: {
                 type: 'default'
             },
             title: {
                 type: 'text',
                 text: '포인트 비밀번호 설정'
             },
             btnLeft: {
                 type: 'back'
             }
    };

    // 메가박스 쿠폰등록 페이지
    // AppHeader.MyMegabox.mageboxCouponReg
    this.mageboxCouponReg = {
            header: {
                type: 'default',
                closeAction : 'fn_closeEvent'
            },
            title: {
                type: 'text',
                text: ''
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 기프트카드 리스트
    // AppHeader.MyMegabox.giftCardList
    this.giftCardList = {
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
            }
    };

    // 비회원 예매/구매내역
    // AppHeader.MyMegabox.paymentNonHist
    this.paymentNonHist = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '예매/구매 내역'
            },
            btnLeft: {
                type: 'back'
            },
            btnRight: {
                type: 'menu'
            }
    };

    // 영화관람권/ 스토어 교환권 상세
    // AppHeader.MyMegabox.mvtckDetail
    this.mvtckDetail = function(title) {
        var data = {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: title + ' 상세'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup'
        };
        return data;
    };


    // 예매/구매내역 상세 헤더
    // AppHeader.MyMegabox.headerPaymentHistDetail
    this.headerPaymentHistDetail = function(title) {
        var data = {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: title + ' 상세'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup'
        };
        return data;
    };

    // 환불 수수료 결제
    // AppHeader.MyMegabox.paymentFdkDetail
    this.paymentFdkDetail = {
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
            animaation: 'popup'
    };

    // 나만의 메가박스
    // AppHeader.MyMegabox.myOwnMegabox
    this.myOwnMegabox = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '나의 메가박스'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 선호 영화관 설정
    // AppHeader.MyMegabox.favorBrchListConf
    this.favorBrchListConf = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '선호 영화관 설정'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 본 영화 등록
    // AppHeader.MyMegabox.watchedMovieReg
    this.watchedMovieReg = {
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
            animation: 'popup'
    };

    // 내 정보 관리
    // AppHeader.MyMegabox.myInfoMng
    this.myInfoMng = {
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
            btnRight: {
                type: 'menu'
            }
    };

    // 문의내역
    // AppHeader.MyMegabox.qnaList
    this.qnaList = {
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
            btnRight: {
                type: 'menu'
            }
    };

    // 문의내역 상세
    // AppHeader.MyMegabox.qnaDetail
    this.qnaDetail = function(title) {
        var data = {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: title +' 상세'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup'
        };
        return data;
    };

    // 이벤트 응모내역
    // AppHeader.MyMegabox.eventEntryHist
    this.eventEntryHist = {
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
            btnRight: {
                type: 'menu'
            }
    };

    // 스페셜 멤버십 가입
    // AppHeader.MyMegabox.specialMembership
    this.specialMembership = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '스페셜 멤버십'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // VIP 쿠폰북 안내
    // AppHeader.MyMegabox.vipCouponBookGuide
    this.vipCouponBookGuide = {
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
            animation: 'popup'
    };

    // VIP 쿠폰북 선택
    // AppHeader.MyMegabox.vipCouponBook
    this.vipCouponBook = {
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
            }
    };

    // VIP 쿠폰북 최종 선택
    // AppHeader.MyMegabox.vipCouponBookFinal
    this.vipCouponBookFinal = function(thisYear) {
        var data = {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: thisYear +' VIP 쿠폰북 선택'
                },
                btnLeft: {
                    type: 'back'
                }
        };
        return data;
    };

    // 나의 문의내역
    // AppHeader.MyMegabox.myinquiry
    this.myinquiry = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '나의 문의내역'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 주문내역/멤버쉽카드
    // AppHeader.MyMegabox.myTicketMember
    this.myTicketMember = {
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
            animation: 'popup'
    };

    // 자주쓰는 할인수단
    // AppHeader.MyMegabox.favorUsePayDcMean
    this.favorUsePayDcMean = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '자주쓰는 할인수단'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 마케팅 정보 수신동의
    // AppHeader.MyMegabox.marketingAgree
    this.marketingAgree = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '마케팅 정보 수신동의'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 비밀번호 변경
    // AppHeader.MyMegabox.changePassword
    this.changePassword = {
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
            animation: 'popup'
    };

    // 비밀번호 변경 본인인증 확인
    // AppHeader.MyMegabox.changePasswordAuth
    this.changePasswordAuth = {
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
        animation: 'popup'
    };

    // 회원정보관리
    // AppHeader.MyMegabox.myInfo
    this.myInfo = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '회원정보 관리'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 회원정보관리 본인인증 확인
    // AppHeader.MyMegabox.myInfo
    this.myInfoAuth = {
        header: {
            type: 'default'
        },
        title: {
            type: 'text',
            text: '회원정보 관리'
        },
        btnLeft: {
            type: 'back'
        }
    }

    // 비회원 문의 내역 모바일웹용
    // AppHeader.MyMegabox.nonMbInquiryList
    this.nonMbInquiryList = {
        header: {
            type: 'default'
        },
        title: {
            type: 'text',
            text: '비회원 문의내역'
        },
        btnLeft: {
            type: 'back'
        }
    }

    // 쿠폰상세
    // AppHeader.MyMegabox.dcCouponDetail
    this.dcCouponDetail = {
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
            animation: 'popup'
    };

    // 쿠폰상세
    // AppHeader.MyMegabox.couponGift
    this.couponGift = {
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
        animation: 'popup'
    };

    // 모바일티켓
    // AppHeader.MyMegabox.mobileTicket
    this.mobileTicket = {
            header: {
                type: 'default',
                overlay: 'feed',
                bgColor: '00ffffff',
                txtColor: 'ffffff',
                scrollBgColor: 'ffffff',
                scrollTxtColor : '000000',
                closeAction	: 'fn_ticketClose'
            },
            title: {
                type: 'text',
                text: '모바일 티켓'
            },
            btnRight: {
                type: 'sub',
                txtColor :'ffffff',
                scrollColor :'000000',
                image: 'https://img.megabox.co.kr/static/mb/images/2024renewal/common/ico-close-w60.png',
                callback: 'fn_ticketClose'
            },
            btnLeft: {
            	type: 'sub',
                txtColor :'ffffff',
                scrollColor :'000000',
                image: 'https://img.megabox.co.kr/static/mb/images/2024renewal/common/btn_share_w60.png',
                callback: 'fn_openShareLayer'
            },
            animation: 'popup'
    };
    // 나의 기프트카드
    // AppHeader.MyMegabox.myGiftCard
    this.myGiftCard = {
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
            }
    };
    // 나의 기프트카드 등록
    // AppHeader.MyMegabox.regGiftCard
    this.regGiftCard = {
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
    };
    // 일반충전
    // AppHeader.MyMegabox.giftCardRechg
    this.giftCardRechg = {
        header: {
            type: 'default'
        },
        title: {
            type: 'text',
            text: '일반충전'
        },
        btnLeft: {
            type: 'back'
        }
    };
    // 자동충전
    // AppHeader.MyMegabox.giftCardAutoRechg
    this.giftCardAutoRechg = {
        header: {
            type: 'default'
        },
        title: {
            type: 'text',
            text: '자동충전/해지'
        },
        btnLeft: {
            type: 'back'
        }
    };
    // 모두의영화
    this.voteMovie = {
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
    };
    //모두의영화 > 영화선택
    this.voteMovieChoice = {
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
    };
    //모두의영화 > 결과
    this.voteMovieResult = {
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

/* 혜택 */
var Benefit = function() {
    // VIP LOUNGE
    // AppHeader.Benefit.viplounge
    this.viplounge = {
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
    };

    // 멤버십 안내
    // AppHeader.Benefit.membershipGuide
    this.membershipGuide = {
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
    };

    // 제휴/할인
    // AppHeader.Benefit.discountGuide
    this.discountGuide = {
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
    };

    // 포인트 상세 안내
    // AppHeader.Benefit.pointDetailGuide
    this.pointDetailGuide = {
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
            animation: 'popup'
    };

    // 중앙멤버십 신청
    // AppHeader.Benefit.jggMbshipRequest
    this.jggMbshipRequest = {
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
            animation: 'popup'
    };

    // VIP 스템프 미션
    // AppHeader.Benefit.vipStampMission
    this.vipStampMission = {
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
            animation: 'popup'
    };

    // 제휴/할인 검색
    // AppHeader.Benefit.discountGuideSearch
    this.discountGuideSearch = {
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
            }
    };
};

/* 멤버 */
var Member = function() {
    // 로그인
    // AppHeader.Member.login
    this.login = {
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
            animation: 'popup'
    };

    // 비회원로그인
    // AppHeader.Member.loginNon
    this.loginNon = {
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
            animation: 'popup'
    };

    // 회원가입
    // AppHeader.Member.join
    this.join = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '회원가입'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // ID/PW찾기
    // AppHeader.Member.findIdPwd
    this.findIdPwd = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '아이디/비밀번호찾기'
            },
            btnLeft: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 회원 재인증
    // AppHeader.Member.findIdPwd
    this.memberCheck = {
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
            animation: 'popup'
    };

    // 회원가입 - 회원정보입력
    // AppHeader.Member.infoRegister
    this.infoRegister = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '정보입력'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 회원가입완료
    // AppHeader.Member.signup
    this.signup = {
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
            animation: 'popup'
    };
    // AppHeader.Member.agreeChk
    this.agreeChk = {
			header: {
				type: 'default'
			},
			title: {
				type: 'text',
				text: '약관 동의'
			},
			btnRight: {
				type: 'close'
			}
    };
};

/* 설정 */
var Setting = function() {
    // 알림함
    // AppHeader.Setting.notification
    this.notification = {
            header: {
                type: 'default',
                txtColor: 'ffffff',
                overlay: 'clear'
            },
            title: {
                type: 'text',
                text: '알림'
            },
            btnLeft: {
                type: 'back',
                txtColor: 'ffffff'
            },
            animation: 'popup',
            refresh: true
    };

    // 설정
    // AppHeader.Setting.main
    this.main = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '설정'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 선호극장설정
    // AppHeader.Setting.favorTheater
    this.favorTheater = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '선호극장설정'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };
};

/* 고객센터 */
var Support = function() {
    // 고객센터
    // AppHeader.Support.main
    this.main = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '고객센터'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 이용약관
    // AppHeader.Support.terms
    this.terms = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '이용약관'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 위치기반서비스 이용약관
    // AppHeader.Support.terms
    this.lcinfo = {
    		header: {
    			type: 'default'
    		},
    		title: {
    			type: 'text',
    			text: '위치기반서비스 이용약관'
    		},
    		btnRight: {
    			type: 'close'
    		},
    		animation: 'popup'
    };

    // 개인정보 취급 방침
    // AppHeader.Support.privacy
    this.privacy = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '개인정보처리방침'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 공지사항
    // AppHeader.Support.notice
    this.notice = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '공지사항'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 공지사항 상세
    // AppHeader.Support.noticeDetail
    this.noticeDetail = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '공지사항'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 자주묻는 질문
    // AppHeader.Support.faq
    this.faq = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '자주묻는 질문'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 1:1 문의
    // AppHeader.Support.inquiry
    this.inquiry = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '1:1 문의'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 분실물 문의 - 접수
    // AppHeader.Support.lostForm
    this.lostForm = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '분실물 문의'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 분실물 문의
    // AppHeader.Support.lose
    this.lose = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '분실물 문의'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 문의내역 상세
    // AppHeader.Support.lostDetail
    this.lostDetail = function(title) {
        if (!title) title = '문의내역';
        var data = {
                header: {
                    type: 'default'
                },
                title: {
                    type: 'text',
                    text: title+' 상세'
                },
                btnRight: {
                    type: 'close'
                },
                animation: 'popup'
        };
        return data;
    };

    // 단체관람 및 대관문의
    // AppHeader.Support.rent
    this.rent = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '단체관람 및 대관문의'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 앱개선문의
    // AppHeader.Support.app
    this.app = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '앱개선 문의'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 기프트카드 이용약관
    // AppHeader.Support.giftcardinfo
    this.giftcardinfo = {
        header: {
            type: 'default'
        },
        title: {
            type: 'text',
            text: '기프트카드 이용약관'
        },
        btnLeft: {
            type: 'back'
        }
    };
};

/* 스토어 */
var Store = function() {
    // 상세
    // AppHeader.Store.detail
    this.detail = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '상품상세'
            },
            btnLeft : {
                type: 'back'
            }
    };

    // 사용가능 극장
    // AppHeader.Store.storeUseBrchHeader
    this.storeUseBrchHeader = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '사용가능 극장'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 주문표
    // AppHeader.Store.comboOrder
    this.comboOrder = {
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
            animation: 'popup'
    };

    // 결제
    // AppHeader.Store.payment
    this.payment = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '결제하기'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 선물하기
    // AppHeader.Store.gift
    this.gift = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '선물하기'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 결제 완료
    // AppHeader.Store.payComplete
    this.payComplete = {
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
            animation: 'popup'
    };
};

/* 모바일오더 */
var MobileOrder = function() {
    // 모바일오더 안내
    // AppHeader.MobileOrder.guide
    this.guide = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '모바일오더'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 모바일오더 메뉴 목록
    // AppHeader.MobileOrder.list
    this.list = {
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
            }
    };

    // 장바구니
    // AppHeader.MobileOrder.cart
    this.cart = {
            header: {
                type: 'default',
                closeAction: 'fn_mvCmboMenu'  //fn_goCmboMenu
            },
            title: {
                type: "text",
                text: "장바구니"
            },
            btnLeft: {
                type: 'back'
            }
    };


    // 모바일오더 메뉴 -> 스토어교환권 레이어
    // AppHeader.MobileOrder.comboSearchVcCmbnd
    this.comboSearchVcCmbnd = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '스토어 교환권'
            },
            btnRight: {
                type: 'close'
            },
            animation: 'popup'
    };

    // 결제
    // AppHeader.MobileOrder.payment
    this.payment = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '결제하기'
            },
            btnLeft: {
                type: 'back'
            }
    };

    // 상세
    // AppHeader.MobileOrder.detail
    this.detail = {
            header: {
                type: 'default'
            },
            title: {
                type: 'text',
                text: '상품상세'
            },
            btnLeft: {
                type: 'back'
            },
            btnRight: {
                type: 'sub',
                image: 'ico-cart',
                callback: 'fn_mvBasketPV'
            }
    };
    // 주문표
    this.wating = {
    		header: {
    			type: 'default'
    		},
    		title: {
    			type: 'text',
    			text: '주문내역'
    		},
    		btnLeft: {
    			type: 'back'
    		}
    };
    // 상품리스트
    this.list = {
        header: {
            type: 'default'
        },
        title: {
            type: 'text',
            text: '모바일오더'
        },
        btnLeft: {
            type: 'back'
        }
    };
};

var MovieFeed = function () {
    this.list = {
        header: {
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

    this.detail = {
        header: {
            type: 'default',
            overlay: "feed",
            bgColor: "00ffffff",
            txtColor: "00ffffff",
            scrollBgColor: "ffffff",
            scrollTxtColor: "000000"
        }
        , btnRight: {
            type: 'close'
        }
        , title: {
            type: "text"
            , text: ''
        }
    }

    this.detailForOldVersion = {
        header: {
            type: 'default',
        }
        , btnRight: {
            type: 'close'
        }
        , title: {
            type: "text"
            , text: ''
        }
    }
}

/**
 * 주소 별 해더 매핑
 * App 에서 호출
 */
var Mapping = function() {
	this.path = function(sPageUrl) {

		var defaultData = {
				header: {
					type: 'default'
				},
				title: {
					type: 'logo'
				},
				btnLeft: {
					type: 'back'
				}
		};

		// 영화 목록
		if (sPageUrl.indexOf('/movie/boxoffice') == 0 || sPageUrl.indexOf('/movie/comingsoon') == 0 || sPageUrl.indexOf('/movie/curation') == 0) {
			try { return Header.Movie.list; } catch (e) { return defaultData; }
		}
		// 영화 상세
		else if (sPageUrl.indexOf('/movie-detail') == 0) {
			try { return Header.Movie.detail; } catch (e) { return defaultData; }
		}
		// 한줄평
		else if (sPageUrl.indexOf('/movie/oneline-review') == 0) {
			var onelnEvalDivCd = '';
			var aUrl = sPageUrl.split('?');
			if (aUrl.length > 1) {
				var aParams = aUrl[1].split('&');
				for (var i=0; i<aParams.length; i++) {
					var aMap = aParams[i].split('=');
					if (aMap[0] == 'onelnEvalDivCd' && aMap.length > 0) {
						onelnEvalDivCd = aMap[1];
						break;
					}
				}
			}
			try { return Header.Movie.oneLineWrite(onelnEvalDivCd); } catch (e) { return defaultData; }
		}
		// 무비포스트 상세
		else if (sPageUrl.indexOf('/moviepost/detail') == 0) {
			try { return Header.Movie.postDetail; } catch (e) { return defaultData; }
		}
		// 무비포스트
		else if (sPageUrl.indexOf('/moviepost') == 0) {
			try { return Header.Movie.moviePost; } catch (e) { return defaultData; }
		}
		// 큐레이션 - 소개
		else if (sPageUrl.indexOf('/curation/specialcontent') == 0) {
			try { return Header.Movie.curation; } catch (e) { return defaultData; }
		}
		// 큐레이션 - 클래식
		else if (sPageUrl.indexOf('/curation/classicsociety') == 0) {
			try { return Header.Movie.curation; } catch (e) { return defaultData; }
		}
		// 큐레이션 - 필름
		else if (sPageUrl.indexOf('/curation/filmsociety') == 0) {
			try { return Header.Movie.curation; } catch (e) { return defaultData; }
		}
		//스토어 상세
		else if (sPageUrl.indexOf('/store/detail') == 0) {
			try { return Header.Store.detail; } catch (e) { return defaultData; }
		}
		// 모바일오더 안내
		else if (sPageUrl.indexOf('/mobile-order/guide') == 0) {
			try { return Header.MobileOrder.guide; } catch (e) { return defaultData; }
		}
		// 예매 - 영화별
		else if (sPageUrl.indexOf('/booking/movie') == 0) {
			try { return Header.Booking.movie(); } catch (e) { return defaultData; }
		}
		// 예매 - 극장별
		else if (sPageUrl.indexOf('/booking/theater') == 0) {
			try { return Header.Booking.theater; } catch (e) { return defaultData; }
		}
		// 예매 - new영화별
		else if (sPageUrl.indexOf('/nbooking/movie') == 0) {
			try { return Header.Booking.newMovie(); } catch (e) { return defaultData; }
		}
		// 예매 - new극장별
		else if (sPageUrl.indexOf('/nbooking/theater') == 0) {
			try { return Header.Booking.newTheater(); } catch (e) { return defaultData; }
		}
		// 선호극장 - gv/시사회 페이지
		else if(sPageUrl.indexOf('/gvGreetingL') == 0){
			try { return Header.Theater.gvGreetingL; } catch (e) { return defaultData; }
		}
		// 예매 - 대관
		else if (sPageUrl.indexOf('/booking/privatebooking') == 0) {
			try { return Header.Booking.privateBooking; } catch (e) { return defaultData; }
		}
		// 모바일티켓
		// TODO: - 상영시간이 종료되었으면 예매내역으로
		else if (sPageUrl.indexOf('/mypage/mobileticket') == 0) {
			try { return Header.MyMegabox.mobileTicket; } catch (e) { return defaultData; }
		}
		// 예매/구매내역
		// - 상영시간이 종료되지 않았으면 모바일티켓으로
		else if (sPageUrl.indexOf('/mypage/bookinglist') == 0) {
			var headerData = defaultData;
			try { headerData = Header.MyMegabox.bookinglist; } catch (e) { headerData = defaultData; }

			var aUrl = sPageUrl.split('?');
			if (aUrl.length > 1) {
				var aQuery = aUrl[1].split('&');
				for (var i=0; i<aQuery.length; i++) {
					var aParams = aQuery[i].split('=');
					if (aParams.length > 1 && aParams[0] == 'tranNo') {
						$.ajax({
				            url: "/api/booking/validate",
				            type: "POST",
				            contentType: "application/json;charset=UTF-8",
				            async: false,
				            data: JSON.stringify({
				            	tranNo: aParams[1]
				            }),
				            success: function (data, textStatus, jqXHR) {
								if (data) {
									var bokdType = "";
									if(data.sellPrdtKindCd == "SPD53") {
										bokdType = "private";
									}

									// 모바일티켓
									try { headerData = Header.MyMegabox.mobileTicket; } catch (e) { headerData = defaultData; }
									headerData.domain = '/mypage/mobileticket?tranNo='+aParams[1]+'&bokdType='+bokdType;

									if (data.friendYn) {
										// 프렌즈 멤버쉽 결제 일 때
										if (data.friendYn == 'Y') {
											// 예매상세
											try { headerData = Header.Booking.finish; } catch (e) { headerData = defaultData; }
										}
									}
								}
				            },
				            error: function(xhr,status,error) {
				            	console.log('/api/booking/validate Error');
				            }
				        });

						return headerData;
					}
				}
			}

			return headerData;
		}
        // 이벤트 목록
        else if (sPageUrl.indexOf('/event') == 0 && sPageUrl.indexOf('/event/detail') != 0) {
            try {
                if(this.versionChk('4.1.2', '4.1.1')){
                    return Header.Event.newMain;
                } else {
                    return Header.Event.main;
                }
            } catch (e) {
                return defaultData;
            }
        }
		// 이벤트 상세
		else if (sPageUrl.indexOf('/event/detail') == 0) {
			try { return Header.Event.detail; } catch (e) { return defaultData; }
		}
		// 멤버쉽
		else if (sPageUrl.indexOf('/mypage/point-list') == 0) {
			try { return Header.MyMegabox.pointList; } catch (e) { return defaultData; }
		}
		// 영화관람권
		else if (sPageUrl.indexOf('/mypage/movie-coupon') == 0) {
			try { return Header.MyMegabox.movieCoupon; } catch (e) { return defaultData; }
		}
		// 스토어교환권
		else if (sPageUrl.indexOf('/mypage/store-coupon') == 0) {
			try { return Header.MyMegabox.storeCoupon; } catch (e) { return defaultData; }
		}
		// 쿠폰
		else if (sPageUrl.indexOf('/mypage/discount-coupon') == 0) {
			try { return Header.MyMegabox.coupon; } catch (e) { return defaultData; }
		}
		else if (sPageUrl.indexOf('/myMegabox/discount') == 0) {
			try { return Header.MyMegabox.coupon; } catch (e) { return defaultData; }
		}
		else if (sPageUrl.indexOf('/myMegabox/cooperation') == 0) {
			try { return Header.MyMegabox.coupon; } catch (e) { return defaultData; }
		}
		// 나의무비스토리
		else if (sPageUrl.indexOf('/mypage/moviestory') == 0) {
			try { return Header.MyMegabox.movieStory; } catch (e) { return defaultData; }
		}
		// 극장목록
		else if (sPageUrl.indexOf('/theater/list') == 0) {
			try { return Header.Theater.list; } catch (e) { return defaultData; }
		}
		// 극장상세
		else if (sPageUrl.indexOf('/theater') == 0) {
			var brchNm = null;
			var aUrl = sPageUrl.split('?');
			if (aUrl.length > 1) {
				var aParams = aUrl[1].split('&');
				for (var i=0; i<aParams.length; i++) {
					var aMap = aParams[i].split('=');
					if (aMap[0] == 'brchNm' && aMap.length > 0) {
						brchNm = aMap[1];
						break;
					}
				}
			}
			try { return Header.Theater.detail(brchNm); } catch (e) { return defaultData; }
		}
		// 특별관 리스트
		else if (sPageUrl.indexOf('/special-theater/list') == 0) {
			try { return Header.Theater.specialDetail(); } catch (e) { return defaultData; }
		}
		// 특별관
		else if (sPageUrl.indexOf('/specialtheater') == 0) {
			var kindCd = '';
			var aUrl = sPageUrl.split('?');
			if (aUrl.length > 1) {
				var aParams = aUrl[1].split('&');
				for (var i=0; i<aParams.length; i++) {
					var aMap = aParams[i].split('=');
					if (aMap[0] == 'kindCd' && aMap.length > 0) {
						kindCd = aMap[1];
						break;
					}
				}
			}
			try { return Header.Theater.specialDetail(kindCd); } catch (e) { return defaultData; }
		}
		// 멤버쉽 안내
		else if (sPageUrl.indexOf('/benefit/membership') == 0) {
			try { return Header.Benefit.membershipGuide; } catch (e) { return defaultData; }
		}
		// VIP라운지
		else if (sPageUrl.indexOf('/benefit/viplounge') == 0) {
			try { return Header.Benefit.viplounge; } catch (e) { return defaultData; }
		}
		// 제휴/할인
		else if (sPageUrl.indexOf('/benefit/discount/guide') == 0) {
			try { return Header.Benefit.discountGuide; } catch (e) { return defaultData; }
		}
		// 공지사항상세
		else if (sPageUrl.indexOf('/support/notice/detail') == 0) {
			try { return Header.Support.noticeDetail; } catch (e) { return defaultData; }
		}
		// 공지사항
		else if (sPageUrl.indexOf('/support/notice') == 0) {
			try { return Header.Support.notice; } catch (e) { return defaultData; }
		}
		// 고객센터
		else if (sPageUrl.indexOf('/support') == 0) {
			try { return Header.Support.main; } catch (e) { return defaultData; }
		}
		// 알림함
		else if (sPageUrl.indexOf('/setting/notification') == 0) {
			try { return Header.Setting.notification; } catch (e) { return defaultData; }
		}
		// 설정
		else if (sPageUrl.indexOf('/setting') == 0) {
			try { return Header.Setting.main; } catch (e) { return defaultData; }
		}
		// 회원가입
		else if (sPageUrl.indexOf('/join') == 0) {
			try { return Header.Member.join; } catch (e) { return defaultData; }
		}
		// 로그인
		else if (sPageUrl.indexOf('/login') == 0) {
			try { return Header.Member.login; } catch (e) { return defaultData; }
		}
		// 비회원 로그인
		else if (sPageUrl.indexOf('/nonMember-login') == 0) {
			try { return Header.Member.loginNon; } catch (e) { return defaultData; }
		}
		// 메가핫딜
		else if (sPageUrl.indexOf('/mega-hotdeal') == 0) {
			try { return Header.Hotdeal.list; } catch (e) { return defaultData; }
		}
		// 주문표
		else if (sPageUrl.indexOf('/mobile-order/waiting') == 0) {
			try { return Header.MobileOrder.wating; } catch (e) { return defaultData; }
		} else if(sPageUrl.indexOf('/mobile-order/list') == 0) {
            try { return Header.MobileOrder.list; } catch (e) { return defaultData; }
        }
		// 무비피드 리스트
        else if(sPageUrl.indexOf('/movieFeed/list') == 0) {
            try { return Header.MovieFeed.list; } catch (e) { return defaultData; }
        }
        else if(sPageUrl.indexOf('/movieFeed/detail') > -1) {
            try { return Header.MovieFeed.detail; } catch (e) { return defaultData; }
        }
        // N스크린
        else if(sPageUrl.indexOf('/nscreen') > -1) {
            try {
                if(AppHeader.Mapping.versionChk('4.1.2', '4.1.1')) {
                    return Header.Movie.nscreen;
                } else {
                    return Header.Movie.nscreenForOldVersion;
                }
            } catch (e) { return defaultData; }
        }
        // 사운드 무비
		else if (sPageUrl.indexOf('/soundmovie') == 0) {
			try { return Header.Event.soundMovie; } catch (e) { return defaultData; }
		}
		// MiL.k 계정 연동 (인증코드)
		else if (sPageUrl.indexOf('/milkLinkService') == 0) {
			try { return Header.Membership.milkLinkService; } catch (e) { return defaultData; }
		}
		// MiL.k 계정 연동 (OTT)
		else if (sPageUrl.indexOf('/mypage/milk-service') == 0) {
			try { return Header.Membership.milkService; } catch (e) { return defaultData; }
		}
		// 모바일오더 결제하기
		else if (sPageUrl.indexOf('/mobile-order/payment') == 0) {
			try { return Header.MobileOrder.payment; } catch (e) { return defaultData; }
		}
		// 기프트카드 등록
		else if(sPageUrl.indexOf('/mypage/myGiftCard/reg-giftCard') == 0){
			try { return Header.MyMegabox.regGiftCard; } catch (e) { return defaultData; }
		}
		// 기프트카드 등록(카카오)
		else if(sPageUrl.indexOf('/kakaoGiftCardReg') == 0){
			try { return Header.MyMegabox.regGiftCard; } catch (e) { return defaultData; }
		}
		// 나의 기프트 카드
		else if(sPageUrl.indexOf('/mypage/myGiftCard') == 0){
			try { return Header.MyMegabox.myGiftCard; } catch (e) { return defaultData; }
		}
        // 나의 기프트 카드
        else if(sPageUrl.indexOf('/giftCard/rechg') == 0){
            try { return Header.MyMegabox.giftCardRechg; } catch (e) { return defaultData; }
        }
        // 나의 기프트 카드
        else if(sPageUrl.indexOf('/giftCard/autorechg') == 0){
            try { return Header.MyMegabox.giftCardAutoRechg; } catch (e) { return defaultData; }
        }
        // 나의 메가박스
        else if(sPageUrl.indexOf('/myMegabox') == 0) {
            try { return Header.MyMegabox.main; } catch (e) { return defaultData; }
        }
        // 매니아 클럽
        else if(sPageUrl.indexOf('/megaClubMembership/megaMania') == 0) {
            try { return Header.Membership.megaMania; } catch (e) { return defaultData; }
        }
		// 패밀리 클럽
        else if(sPageUrl.indexOf('/megaClubMembership/megaFamily') == 0) {
        	try { return Header.Membership.megaFamily; } catch (e) { return defaultData; }
        }
        // 프리미엄 클럽
        else if(sPageUrl.indexOf('/megaClubMembership/megaPremium') == 0) {
            try { return Header.Membership.megaPremium; } catch (e) { return defaultData; }
        }
        // 트렌디 클럽
        else if(sPageUrl.indexOf('/megaClubMembership/megaTrendy') == 0) {
            try { return Header.Membership.megaTrendy; } catch (e) { return defaultData; }
        }
        // 돌비 클럽
        else if(sPageUrl.indexOf('/megaClubMembership/megaDolby') == 0) {
            try { return Header.Membership.megaDolby; } catch (e) { return defaultData; }
        }
		// 클럽 멤버십
        else if(sPageUrl.indexOf('/megaClubMembership') == 0) {
        	try { return Header.Membership.clubMbShip; } catch (e) { return defaultData; }
        }
        // 모두의영화
        else if (sPageUrl.indexOf('/myScnBoard/voteMovie') == 0) {
            try { return Header.MyMegabox.voteMovie; } catch (e) { return defaultData; }
        }
        // 모두의영화 > 영화선택
        else if (sPageUrl.indexOf('/voteMovie/choice') == 0) {
            try { return Header.MyMegabox.voteMovieChoice; } catch (e) { return defaultData; }
        }
        // 모두의영화 > 결과
        else if (sPageUrl.indexOf('/voteMovie/result') == 0) {
            try { return Header.MyMegabox.voteMovieResult; } catch (e) { return defaultData; }
        }
		else{
			return defaultData;
		}
	};

    /**
     * @author AJ
     * @description user agent 에서 버전 정보를 가져온다. (AOS 4.1.2, IOS 4.1.1 이상)
     * @return {array} 버전 정보 (user agent 에 버전 정보가 없는 경우 null 반환)
     */
    this.version = function () {
        var re = /[/]MegaBox[/](Android|IOS)[/]MOBILE_APP_(\d+).(\d+).(\d+)/;
        var userAgent = navigator.userAgent;
        var result = re.exec(userAgent);
        return result;
    }

    /**
     * @author AJ
     * @description 앱 버전 체크 (AOS 4.1.2 / IOS 4.1.1 미만일 경우 무조건 false 를 리턴한다.)
     */
    this.versionChk = function (aosVersion, iosVersion) {
        try {
            var version = this.version();
            if (version) {
                var target = ((version[1] === 'Android') ? aosVersion : iosVersion).split('.');
                for(var i  = 0; i < target.length; i++) {
                    if(version[i + 2] != target[i]){
                        return parseInt(version[i + 2]) >= parseInt(target[i]);
                    }
                }
                return true;
            } else {
                return false;
            }
        } catch (e) {
            console.error(e.message);
            return false;
        }
    }
};

var Header = new function() {
    this.Event = new Event();
    this.Booking = new Booking();
    this.Movie = new Movie();
    this.Membership = new Membership();
    this.Hotdeal = new Hotdeal();
    this.Theater = new Theater();
    this.MyMegabox = new MyMegabox();
    this.Benefit = new Benefit();
    this.Member = new Member();
    this.Setting = new Setting();
    this.Support = new Support();
    this.Store = new Store();
    this.MobileOrder = new MobileOrder();
    this.MovieFeed = new MovieFeed();
    this.Mapping = new Mapping();
};

var AppHeader = new function() {
    this.Event = new Event();
    this.Booking = new Booking();
    this.Movie = new Movie();
    this.Membership = new Membership();
    this.Hotdeal = new Hotdeal();
    this.Theater = new Theater();
    this.MyMegabox = new MyMegabox();
    this.Benefit = new Benefit();
    this.Member = new Member();
    this.Setting = new Setting();
    this.Support = new Support();
    this.Store = new Store();
    this.MobileOrder = new MobileOrder();
    this.Mapping = new Mapping();
};