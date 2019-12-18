            var setting = {
                view: {
                    selectedMulti: false
                },
            async: {
                enable: true,
                url:"/plant/list_plant",
                autoParam:[],
                contentType: "application/json",
                otherParam:{},
                dataFilter: filter //异步获取的数据filter 里面可以进行处理  filter 在下面
            },
            data: {  
                simpleData: {  
                    enable:true,  
                    idKey: "id",  
                    pIdKey: "pid",  
                    rootPId: ""  
                }  
            },//个人理解加上这个就能按级别显示，其中的id pid 对应你的实体类
            callback: {  
                onClick: function(treeId, treeNode) {  
                    var treeObj = $.fn.zTree.getZTreeObj(treeNode);  
                    var selectedNode = treeObj.getSelectedNodes()[0];  
                    $("#txtId").val(selectedNode.id);  
                    $("#txtAddress").val(selectedNode.name);  
                }  
            } //这里是节点点击事件
        };

        function filter(treeId, parentNode, childNodes) {
            alert(childNodes.length);
            if (!childNodes) return null;
            for (var i=0, l=childNodes.length; i<l; i++) {
                childNodes[i].name = childNodes[i].name.replace(/\.n/g, '.');
            }
            return childNodes;
        }

        $(document).ready(function(){
            $.fn.zTree.init($("#treeDemo"), setting);
        });