window.onpageshow =  function(event) {
    var isOnIOS = navigator.userAgent.match(/iPad/i)|| navigator.userAgent.match(/iPhone/i);
    if(!isApp() && isOnIOS) {
        var transNo = fn_getCookieCancel("TRANSNO");
        if(transNo) {
            initOccupSeatCancel(transNo);
        }
    }
};
function fn_getCookieCancel(name) {
    var value = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    return value? value[2] : null;
}
function fn_setCookieCancel(cname, cvalue) {
    var d = new Date();
    d.setTime(d.getTime() + (20 * 60 * 1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires + ";path=/";
}
function initOccupSeatCancel(transNo) {
    var paramData = { transNo:transNo };

    $.ajax({
        url: "/on/oh/ohz/PayBooking/initOccupSeat.do",
        type: "POST",
        contentType: "application/json;charset=UTF-8",
        dataType: "json",
        data: JSON.stringify(paramData),
        success: function (data, textStatus, jqXHR) {
            fn_setCookieCancel("TRANSNO","");
            if( typeof(fn_seatInfo) == 'function' ) {
                fn_seatInfo('init');
            }
        },
        error: function(xhr,status,error){
        }
    });
}