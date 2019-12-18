function showDictSelect(id, type, all) {
	var data = getDict(type);
	var select = $("#" + id);
	select.empty();

	if (all != undefined && all) {
		select.append("<option value=''>全部</option>");
	}
	var arr=new Array();
	$.each(data, function(k, v) {
		//select.append("<option value ='" + k + "'>" + v + "</option>");
		var obj ={};
		obj.id=k;
		obj.text=v;
		arr.push(obj);
	});
	select.select2({
        data:arr
   });	
	return data;
}

function getDict(type) {
	var v = sessionStorage[type];
	if (v == null || v == "" || v=={}) {
		$.ajax({
			type : 'get',
			url : '/dicts/type',
			data:{
				type:type
			},
			async : false,
			success : function(data) {
				console.log(data);
				v = {};
				$.each(data, function(i, d) {
					v[d.dictCode] = d.dictName;
				});

				sessionStorage[type] = JSON.stringify(v);
			}
		});
	}

	return JSON.parse(sessionStorage[type]);
}

function getDictData(type) {
	var data = new Array();
	$.ajax({
		type : 'get',
		url : '/dicts/type',
		data:{
			type:type
		},
		async : false,
		success : function(reault) {
			$.each(reault, function(i, d) {
				var v = {};
				v.dictCode = d.dictCode;
				v.dictName = d.dictName;
				data.push(v);
			});
		}
	});
	return data
}


function selectDictData(hideId,inputId,btnId,type){
	$("#"+btnId+",#"+inputId).click(function(){
		if ($("#"+btnId).hasClass("disabled")){
			return true;
		}
		var options = {
			type: 2,
			maxmin: false,
			shadeClose: true,
			title: '选择字典数据',
			area: ['300px', '380px'],
			content: 'pages/layui-winFrm/Dict_id.html?type='+type,
			contentFormData: {},
			success: function(layero, index){
			},
			btn: ['<i class="fa fa-check"></i> 确定'],
			btn1: function(index, layero){
				var win = js.iframeWindow(layero);
				var items = win.getlayerDatas();
				if(items != null){
					$("#"+hideId).val(items[0]);
					$("#"+inputId).val(items[1]);
					js.layer.close(index);
				}
			}
		};
		options.btn.push('<i class="fa fa-refresh"></i> 清除');
		options['btn'+options.btn.length] = function(index, layero){
			$("#"+hideId).val("");
			$("#"+inputId).val("");
		};
		js.layer.open(options);
	});

}
