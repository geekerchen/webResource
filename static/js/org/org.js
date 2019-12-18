var orgs = checkOrganization();
initMenuList();

function initMenuList(){
	$.ajax({
		type : 'get',
		url : '/organzation/orgs',
		contentType: "application/json; charset=utf-8",  
		async:false,
		success : function(data) {
			var length = data.length;
			for(var i=0; i<length; i++){
				var d = data[i];
				var tr = "<tr data-tt-id='" + d['orgcode'] + "' data-tt-parent-id='" + d['orgparentCode'] + "'>";
				//编码
				var td1 = "<td>" + d['orgcode'] +"</td>";
				tr +=td1;
				
				//名称
				var td2 = "<td>" + d['orgname'] +"</td>";
				tr +=td2;
				
				//类型
				var td3 = "<td>" + d['dicts']['val'] +"</td>";
				tr +=td3;
				
				//描述
				var td4 = "<td>" + d['orgdes'] +"</td>";
				tr +=td4;
				
				//排序
				var td5 = "<td>" + d['sort'] +"</td>";
				tr +=td5;
				
				var td5 = "<td>"
				//状态
				if(d['status'] == "0"){
					td5+= "启用";
				}else{
					td5+= "禁用";
				}
				td5+="</td>";
				tr +=td5;
				var id = d['orgcode'];
				var href = "upOrg.html?code=" + id;
				var edit = buttonEdit(href, "sys:org:add", orgs);
				var del = buttonDel(id, "sys:org:del", orgs);
                tr += "<td>"+edit + del+"</td>";
				tr += "</tr>"
				$("#dt-table").append(tr);
			}
		}
	});
}

	$("#dt-table").treetable({  
	      expandable : true,
	      initialState:"expanded",
	});

layui.use('layer', function(){
    var layer = layui.layer;
});

function del(id){
	layer.confirm('确定要删除吗？', {
        btn : [ '确定', '取消' ]
    }, function() {
        $.ajax({
            type : 'POST',
            url : '/organzation/del/' + id,
            success : function(data) {
            	layer.msg("删除成功", {shift: -1, time: 1000}, function(){
            		location.reload();
                });
            }
        });
    });
}

	var option = {
		expandable : true,
		clickableNodeNames : true,
		onNodeExpand : function() {
			var d = this;
		},
		onNodeCollapse : function() {
			var d = this;
		}
	};
	
	$("#dt-table").treetable(option);
