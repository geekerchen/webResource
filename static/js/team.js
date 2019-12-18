var obj = {};
//工厂下拉框初始化
function initSelectPlant(){
	$.ajax({
		type : 'get',
		url : '/plant/all',
		async : false,
		contentType : "application/json: charset=utf-8",
		success : function(data){
			$.each(data, function(k, v) {
				$("#plantId").append("<option value ='" + v.id + "'>" + v.plantName + "</option>");
			});
		}
	})
	
}



//根据工厂选择带出产线
	$("#plantId").change(function(){
		obj["plantId"]= $("#plantId").val();
		$.ajax({
			type : 'get',
			url : '/lines/list_line/',
			data : obj,
			async : false,
			contentType : "application/json: charset=utf-8",
			success : function(data){
				$.each(data,function(k,v){
					$("#lineId").append("<option value ='" + v.id + "'>" + v.plantName + "</option>");
				});
			}
		})
	});

//根据产线带出工段
	$("#lineId").change(function(){
		obj["plantId"] = $("#plantId").val();
		obj["lineId"] = $("#lineId").val();
		$.ajax({
			type : 'get',
			url : '/sections/list_section/',
			data : obj,
			async : false,
			contentType : "application/json: charset=utf-8",
			success : function(data){
				$.each(data,function(k,v){
					$("#secId").append("<option value ='" + v.id + "'>" + v.plantName + "</option>");
				});
			}
		})
	});

//根据工段带出工序
	$("#secId").change(function(){
		obj["plantId"] = $("#plantId").val();
		obj["lineId"] = $("#lineId").val();
		obj["secId"] = $("#secId").val();
		$.ajax({
			type : 'get',
			url : '/processs/list_process/',
			data : obj,
			async : false,
			contentType : "application/json: charset=utf-8",
			success : function(data){
				$.each(data,function(k,v){
					$("#proceId").append("<option value ='" + v.id + "'>" + v.plantName + "</option>");
				});
			}
		})
	});







