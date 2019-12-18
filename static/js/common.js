//form序列化为json
$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

//获取url后的参数值
function getUrlParam(key) {
	var href = window.location.href;
	var url = href.split("?");
	if(url.length <= 1){
		return "";
	}
	var params = url[1].split("&");
	
	for(var i=0; i<params.length; i++){
		var param = params[i].split("=");
		if(key == param[0]){
			return param[1];
		}
	}
}

function getDomainByDic(key) {
	//通过Ajax同步请求，获取地址信息
	var item = null;
	$.ajax({
		type : 'GET',
		url : '/dictType/getDomainByDic/'+key,
		contentType: "application/json; charset=utf-8",  
		async:false,
		success : function(data) {
			if(data.groupname != null){
				item=data.groupname;
			}else{
				item="ws://127.0.0.1:8082/wsaccess";
			}
		}
	});
	return item;
}