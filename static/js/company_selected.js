loadData()
function loadData(){
	//getCompany()
	//判断当前页是否存在工厂下拉框
	if($("#plantId").length > 0){
		var isEditHtml = $("#plantId").attr("is-editHtml");
		$.ajax({
			type : "GET",
			url: "/plant/plantList",
			data:{
				plantId:localStorage.getItem("plantIds")
			},
			contentType: "application/json; charset=utf-8",
			async:false,
			success:function(data){
				var arr=new Array();
				if(isEditHtml != undefined && isEditHtml == "true"){
					arr.push({id:'-1',text:"全部"});
				}else{
					arr.push({id:'-1',text:"请选择"});
				}

				if(data.length > 0){
					$.each(data, function(k, v) {
						var obj ={};
							obj.id=v.id;
							obj.text=v.plantSname;
							arr.push(obj);
					});
				}
				$("#plantId").select2({
		             data:arr
		        });

				if(localStorage.getItem("plantId") != null){
					$("#plantId").val(localStorage.getItem("plantId")).trigger("change");
				}
			}
		});

		//判断当前页是否存在产线下拉框
		if($("#lineId").length > 0){
			$("#plantId").on("select2:select",function(e){
				$('#lineId').select2({
					data:lineData($("#plantId").val())
				});
				if(typeof getDcsPermission == 'function'){
					getDcsPermission();
				}

				if(typeof getReaultKpiData == 'function'){
					getReaultKpiData();
				}
				if (typeof plantShiftTypeDataAll == 'function'){
					$("#shiftId").empty();
					plantShiftTypeDataAll($("#lineId").val())
				}

			});

			$('#lineId').select2({
				data:lineData($("#plantId").val())
			});

		}

		//判断当前页是否存在工段下拉框
		if($("#sectionId").length > 0){
			//选择产线带出倒班类型
			$("#lineId").change(function(){
				if (typeof plantShiftTypeDataAll == 'function' ){
					plantShiftTypeDataAll($(this).val());
				}
				 sectionData($("#plantId").val(),$(this).val())
			});
		}
	}
}

//触发方法事件
function getMethod(mothod){
	if(typeof mothod == "function"){
		mothod
	}
}

//根据工厂ID获取产线数据
function lineData(plantId){
	var arr=new Array();
	var isEditHtml = $("#lineId").attr("is-editHtml");
	$.ajax({
		type : "GET",
		url: "/lines/list_line/"+plantId,
		contentType: "application/json; charset=utf-8",
		async:false,
		success:function(data){
			$('#lineId').empty();
			if(isEditHtml != undefined && isEditHtml == "true"){
				arr.push({id:'-1',text:"全部"});
			}else{
				if(isEditHtml == "false"){
					arr.push({id:'-1',text:"请选择"});
				}
			}
			if(data.length > 0){
				$.each(data, function(k, v) {
					var obj ={};
					obj.id=v.id;
					obj.text=v.lineName;
					arr.push(obj);
				});
			}

			$("#lineId").select2({
				data:arr
			});
		}
	});
	return arr;
}

function validateSelect(){
	var plantId = $("#plantId").val();
	var lineId =$("#lineId").val();
	var sectionId =$("#sectionId").val();
	var processId =$("#processId").val();
	var flag = plantId +''+lineId+''+sectionId+''+processId;
	return flag;
}
//类型:Plant,Line,Section,PrdSystem,Process
//factionModelingTreeData("隐藏域ID","文本ID","弹出框标题","选中公司编号","类型",是否需要获取上级合集,选择项类型)
function factionModelingTreeData(hideId,inputId,title,plantId,type,isParentNode,selectType){
		if(typeof(selectType) == "undefined" || selectType == null){
			selectType=type;
		}

		var options = {
			type: 2,
			maxmin: true,
			shadeClose: false,
			title: title,
			area: layerSize.min,
			content: 'pages/layui-winFrm/selectFactoryModeling.html?plantId='+plantId+"&type="+type+"&selectType="+selectType,
			contentFormData: {},
			success: function(layero, index){
			},
			btn: ['<i class="fa fa-check"></i> 确定'],
			btn1: function(index, layero){
				var win = js.iframeWindow(layero);
				var items = win.getlayerDatas();
				console.log(items);
				if(items != null){
					$("#lId,#secId,#systemId,#proceId,#hostId").val("");
					$("#"+hideId).val(items[0]);
					$("#"+inputId).val(items[1]);
					if(isParentNode != undefined){
						if(isParentNode == true){
							$("#lId,#secId,#systemId,#proceId,#hostId").val("");
							var node = JSON.parse(items[2]);
							//console.log(node);
							switch (type) {
								case "Line":
									if(typeof(node[0]) != 'undefined'){
										$("#lId").val(node[0].lineId);
									}
									break;
								case "Section":
									if(typeof(node[0]) != 'undefined'){
										$("#lId").val(node[0].lineId);
									}

									if(typeof(node[1]) != 'undefined'){
										$("#secId").val(node[1].sectionId);
									}
									break;
								case "PrdSystem":
									if(typeof(node[0]) != 'undefined'){
										$("#lId").val(node[0].lineId);
									}

									if(typeof(node[1]) != 'undefined'){
										$("#secId").val(node[1].sectionId);
									}

									if(typeof(node[2]) != 'undefined'){
										$("#systemId").val(node[2].systemId);
									}
									break;
								case "Process":
									if(typeof(node[0]) != 'undefined'){
										$("#lId").val(node[0].lineId);
									}

									if(typeof(node[1]) != 'undefined'){
										$("#secId").val(node[1].sectionId);
									}

									if(typeof(node[2]) != 'undefined'){
										$("#systemId").val(node[2].systemId);
									}
									if(typeof(node[3]) != 'undefined'){
										$("#proceId").val(node[3].processId);
									}
									break;
								case "HostSettings":
									if(typeof(node[0]) != 'undefined'){
										$("#lId").val(node[0].lineId);
									}

									if(typeof(node[1]) != 'undefined'){
										$("#secId").val(node[1].sectionId);
									}

									console.log(node);
									console.log(node[2]);
									if(typeof(node[2]) != "undefined"){
										$("#systemId").val(node[2].systemId);
									}
									console.log(node[3]);
									if(typeof(node[3]) != 'undefined'){
										$("#proceId").val(node[3].processId);
									}

									if(typeof(node[4]) != 'undefined'){
										$("#hostId").val(node[4].hostId);
									}
									break;
							}
                            if (typeof getHost == "function"){
                                getHost();
                            }
							if (typeof selectShiftType == "function"){
								selectShiftType();
							}
						}
					}
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
}



function getCompany(){
	$.ajax({
		type : "GET",
		url: "/companys/companyList",
		contentType: "application/json; charset=utf-8",
		async:false,
		success:function(data){
			var isEditHtml = $("#company").attr("is-editHtml");
			var arr=new Array();
			// if(isEditHtml != undefined && isEditHtml == "true"){
				arr.push({id:'-1',text:"全部"});
			// }
			if(data.obj.length > 0){
				$.each(data.obj, function(k, v) {
					var obj ={};
						obj.id=v.id;
						obj.text=v.subcompanyName;
						arr.push(obj);
				});
			}
			
			$("#company").select2({
	             data:arr
	        });
		}
	});
}