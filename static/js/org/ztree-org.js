////角色编辑中获取机构列表信息
function getOrgTree(){
	var root = {
		id:0,
		name : "葛洲坝水泥生产总部",
		open : true,
	};
		$.ajax({
			type : 'get',
			url : '/organzation/comboTreeList',
			contentType : "application/json; charset=utf-8",
			async : false,
			success : function(data) {
				var length = data.length;
				var children = [];
				for (var i = 0; i < length; i++) {
					var d = data[i];
					var node = createNodes(d);
					children[i] = node;
				}
				console.log(children);
				root.children = children;
			}
		});
		return root;
}

function initOrgDatas(orgcode){
	$.ajax({
		type : 'get',
		url : '/organzation/listByRoleId/' + orgcode,
		success : function(data) {
			var length = data.length;
			var ids = [];
			for(var i=0; i<length; i++){
				ids.push(data[i]['orgcode']);
			}
			
			initOrgCheck(ids);
		}
	});
}

function initOrgCheck(ids) {
	var treeObj = $.fn.zTree.getZTreeObj("orgTree");
	var length = ids.length;
	for(var i=0; i<length; i++){
		var node = treeObj.getNodeByParam("id", ids[i], null);
		treeObj.checkNode(node, true, false);
	}
	
}

function getCheckedOrgIds(){
	var treeObj = $.fn.zTree.getZTreeObj("orgTree");
	var nodes = treeObj.getCheckedNodes(true);
	
	var length = nodes.length;
	var ids = [];
	for(var i=0; i<length; i++){
		var n = nodes[i];
		var id = n['id'];
		ids.push(id);
	}
	
	return ids;
}

function createNodes(d) {
	var id = d['id'];
	var pId = d['parentCode'];
	var name = d['name'];
	var child = d['children'];

	var node = {
		open : true,
		id : id,
		name : name,
		pId : pId,
	};

	if (child != null) {
		var length = child.length;
		if (length > 0) {
			var children = [];
			for (var i = 0; i < length; i++) {
				children[i] = createNode(child[i]);
			}

			node.children = children;
		}

	}
	return node;
}


////角色中机构树形初始化列表
function getOrgSettting() {
	var setting = {
		check : {
			enable : true,
			chkboxType : {
				"Y" : "",
				"N" : ""
			}
		},
		async : {
			enable : true,
		},
		data : {
			simpleData : {
				enable : true,
				idKey : "id",
				pIdKey : "parentCode",
				rootPId : 0
			}
		},
		callback : {
			onCheck : zTreeOnCheck
		}
	};

	return setting;
}

function zTreeOnCheck(event, treeId, treeNode) {
//	console.log(treeNode.id + ", " + treeNode.name + "," + treeNode.checked
//			+ "," + treeNode.pId);
//	console.log(JSON.stringify(treeNode));
}