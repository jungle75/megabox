$(function(){
	
	$('#gnbGuide a').on('click', function(e){
		e.preventDefault();
		var _href = $(this).attr('href');
		$(this).parent('li').addClass('on').siblings('li').removeClass('on');
		if( $(this).parent('li').hasClass('has') ) {
			// no event
		}
		else {
			$('#gnbGuide a').removeClass('on');
			$(this).addClass('on');
			$('.iframe').attr('src', _href);
		}
	});
	
	$(document).on('click', '.source-view-toggle', function(){
		$(this).closest('.source').toggleClass('on');
		
		_html = $(this).closest('.source').find('.copy').html()
		$(this).closest('.source').find('.xmp').html(_html);
	});
	
}); // end Document ready
