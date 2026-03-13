/**
 * @autor 김진규
 * ex)
 * 		var data = $(dataForm).serializeObject;
 * 		var formArray = Array();
 * 		$(formClass).forEach(function(i){
 * 			formArray.push($(formClass)[i].serializeObject();
 * 		});
 *
 * 		--console.log(data); --
 * 		data = {
 * 			form.getElementByName = element.value
 * 		}
 */
jQuery.fn.serializeObject = function(){
	var obj = null; /* 리턴 오브젝트 */
	try{
		/*this = 해당폼*/
		/*폼 태그 벨류값이 있어야 하며, 폼 태그 네임이 form이여야함*/
		if(this[0].tagName && this[0].tagName.toUpperCase() == "FORM"){
			/*제이쿼리 시리얼라이즈어레이를 이용해서 키와 벨류 값을 나눠 row로 만듬*/
			var itemArr = this.serializeArray();

			if(itemArr){ /*값이 있다면*/
				obj = {}; /*리턴 오브젝트를 초기화 한 후*/
				$.each(itemArr, function(){ /*itemArr 로우 만큼*/
					obj[this.name] = this.value; /*오브젝트에 키 : 벨류 형식으로 저장한다.*/
				});
			}
		}
	}catch(e){
		alert(e.message);
	}finally{}
	return obj;
}

jQuery.fn.serializeObjectKV = function(){
	var obj = null; /* 리턴 오브젝트 */
	try{
		/*this = 해당폼*/
		/*폼 태그 벨류값이 있어야 하며, 폼 태그 네임이 form이여야함*/
		if(this[0].tagName && this[0].tagName.toUpperCase() == "FORM"){
			/*제이쿼리 시리얼라이즈어레이를 이용해서 키와 벨류 값을 나눠 row로 만듬*/
			var itemArr = this.serializeArray();

			if(itemArr){ /*값이 있다면*/
				obj = {}; /*리턴 오브젝트를 초기화 한 후*/
				$.each(itemArr, function(){ /*itemArr 로우 만큼*/
					obj[this.name] = this.value; /*오브젝트에 키 : 벨류 형식으로 저장한다.*/
					obj["key"] = this.name;
				});
			}
		}
	}catch(e){
		alert(e.message);
	}finally{}
	return obj;
}

jQuery.fn.serializeFormArray = function(){
	var formArray = Array();
	if(this[0].class){
		try{
			for(var i in this.length){
				formArray.push(this[i].serializeObject());
			}
		}catch(e){
			alert(e.message);
		}finally{}
	}
	return formArray;
}
