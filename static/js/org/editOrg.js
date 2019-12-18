	layui.config({
	    base: '../../layui/lay/modules/'
	}).extend({
	    treeSelect: 'treeSelect/treeSelect'
	});
	
	layui.use('layer', function(){
	    var layer = layui.layer;
	});
	
	showDictSelect("orgtype", "cmtype");
	showDictSelect("status", "status");
	
	//获取选中机构编码（添加机构，传递值为“”）
    var code = getUrlParam("code");
	 layui.use(['treeSelect','form','layer'], function () {
		 var treeSelect= layui.treeSelect;
	        treeSelect.render({
	            // 选择器
	            elem: '#pentOrg',
	            // 数据
	            data: '/organzation/comboTreeList',
	            // 异步加载方式：get/post，默认get
	            type: 'get',
	            // 占位符
	            placeholder: '请选择上级机构，不选则添加为根目录',
	            // 是否开启搜索功能：true/false，默认false
	            search: false,
	            // 点击回调
	            click: function(d){
	                //console.log(d);
	            },
	            // 加载完成后的回调函数
	            success: function (data) {
		   	   		 if(code != ""){
		   	   				$.ajax({
		   	   					type : 'get',
		   	   					url : '/organzation/findOrgByCode/'+code,
		   	   					async : false,
		   	   					success : function(data) {
		   	   						$(".txt_orgcode").val(data.orgcode);
		   	   						//判断当前目录是否存在上级，存在则选中上级 否则不选中
		   	   						if(data.orgparentCode != "0")
		   	   							treeSelect.checkNode('tree', data.orgparentCode);
		   	   						else{
			   	   						treeSelect.revokeNode('tree', function(d){});
		   	   						}
		   	   						$(".txt_orgname").val(data.orgname);
		   	   						$(".sel_type").val(data.orgtype);
		   	   						$(".txt_des").val(data.orgdes);
		   	   						$(".txt_sort").val(data.sort);
		   	   						$(".sel_status").val(data.status);
		   	   					}
		   	   				});
		   	   			}
	            	}
	        });
	    });
	 
	 function add() {
			$('#form').bootstrapValidator();
			var bootstrapValidator = $("#form").data('bootstrapValidator');
			bootstrapValidator.validate();
		    if(!bootstrapValidator.isValid()){
			   return;
		    }
		    
		    var formdata = $("#form").serializeObject();

			$.ajax({
				type : 'post',
				url : '/organzation',
				contentType: "application/json; charset=utf-8",  
				data : JSON.stringify(formdata),
				success : function(data) {
					layer.msg("添加成功", {shift: -1, time: 1000}, function(){
                        location.href = "orgList.html";
                    });
				}
			});
		}
	 
	 $('#form').bootstrapValidator();
	 
	 function update() {
			if($(".txt_parentCode").val() == code){
	            layer.msg("父级菜单不能是自己");
	            return;
			}
			
			$('#form').bootstrapValidator();
			var bootstrapValidator = $("#form").data('bootstrapValidator');
			bootstrapValidator.validate();
		    if(!bootstrapValidator.isValid()){
			   return;
		    }
		    
		    var formdata = $("#form").serializeObject();

			$.ajax({
				type : 'put',
				url : '/organzation/',
				contentType: "application/json; charset=utf-8",  
				data : JSON.stringify(formdata),
				success : function(data) {
					layer.msg("修改成功", {shift: -1, time: 1000}, function(){
                     location.href = "orgList.html";
                 });
				}
			});
		}
	
