function getwsLoad(){
	var target=getDomainByDic("link_address");/* 对应你的服务端程序地址 */
	ws = new WebSocket(target);
	
	ws.onopen=function(){
		console.log("连接成功")
	};
	
	ws.onmessage =function (event){
	  	var obj = JSON.parse(event.data);
	  	console.log(obj);
	}
}

/*!
 * 项目自定义的公共JavaScript，可覆盖core.js里的方法
 */
js.iframeWindow=function(layero){
	var ifr = $(layero).find('iframe');
	if (ifr.length > 0){
		return ifr[0].contentWindow;
	}
	// 取不到iframe返回null
	return null;
}


function convertDateFromString(dateString) {
	if (dateString) { 
	var date = new Date(dateString.replace(/：/,"/")) 
	return date;
	}
	}

Date.prototype.format = function (format) {
    var args = {
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),
        "h+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds(),
        "q+": Math.floor((this.getMonth() + 3) / 3),
        "S": this.getMilliseconds()
    };
    if (/(y+)/.test(format))
        format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var i in args) {
        var n = args[i];
        if (new RegExp("(" + i + ")").test(format))
            format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? n : ("00" + n).substr(("" + n).length));
    }
    return format;
};

//form序列化为json
$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    //setCheckBoxVal(a);
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || null);
        } else {
            o[this.name] = this.value || null;
        }
    });
    return o;
};

function setCheckBoxVal(a){
	var o = {};
	$.each(a, function() {
        if ($("input[name='"+this.name +"']").attr("type") == 'radio') {
        } else if ($("input[name='"+this.name +"']").attr("type") == 'checkbox'){
           
        }else{
        	o.push(this);
        }
    });
}

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

//自动填充表单
var fillForm = function ($form, json) {
    var jsonObj = json;
    if (typeof json === 'string') {
        jsonObj = $.parseJSON(json);
    }

    for (var key in jsonObj) {  //遍历json字符串
        var objtype = jsonObjType(jsonObj[key]); // 获取值类型
         if (objtype === "array") { //如果是数组，一般都是数据库中多对多关系

            var obj1 = jsonObj[key];
            for (var arraykey in obj1) {
                //alert(arraykey + jsonObj[arraykey]);
                var arrayobj = obj1[arraykey];
                for (var smallkey in arrayobj) {
                    setCkb(key, arrayobj[smallkey]);
                    break;
                }
            }
        } else if (objtype === "object") { //如果是对象，啥都不错，大多数情况下，会有 xxxId 这样的字段作为外键表的id
        	

        }else if (objtype === "class") { //如果是对象，啥都不错，大多数情况下，会有 xxxId 这样的字段作为外键表的id
        	var obj1 = jsonObj[key];
        	for (var key1 in obj1) {
               $("[name=" +  key1 + "]", $form).val(obj1[key1]);
            }

        } else if (objtype === "string") { //如果是字符串
            /*var str = jsonObj[key];
            var date = new Date(str);
            var re =/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/;
            if (re.test(date)) {  
                $("[name=" + key + "]", $form).val(date.format("yyyy-MM-dd"));
                continue;
            }else{
            	 $("[name=" + key + "]", $form).val(str);
            }*/
            var tagobjs = $("[name=" + key + "]", $form);
           
            if ($(tagobjs[0]).attr("type") == "radio") {//如果是radio控件
                $.each(tagobjs, function (keyobj,value) {
                    if ($(value).attr("value") == jsonObj[key]) {
                    	$(value).iCheck('uncheck');
                    	$(value).iCheck('check');
                    }
                });
                continue;
            }else{
            	$("[name=" + key + "]", $form).val(jsonObj[key]); 
            }
        } else { //其他的直接赋值
            $("[name=" + key + "]", $form).val(jsonObj[key]);
        }
    }
}

var setCkb = function (name, value) {
    //alert(name + " " + value);
    //$("[name=" + name + "][value=" + value + "]").attr("checked", "checked");  不知为何找不到具体标签;
    $("[name=" + name + "][val=" + value + "]").attr("checked", "checked");
}

var fillckb = function (name, json) {
    var jsonObj = json;
    if (typeof json === 'string') {
        jsonObj = $.parseJSON(json);
    }
    var str = jsonObj[name];
    if (typeof str === "string") {
        var array = str.split(",");
        $.each(array, function (key, value) {
            setCkb(name, value);
        });
    }
}

var jsonObjType = function (obj) {
    if (typeof obj === "object") {
        var teststr = JSON.stringify(obj);
        if (teststr[0] == '{' && teststr[teststr.length - 1] == '}') return "class";
        if (teststr[0] == '[' && teststr[teststr.length - 1] == ']') return "array";
    }
    return typeof obj;
}

//加载字典数据
function initDictByCode(dictObj,code,callback){
	if(!dictObj[code]){
		jQuery.ajax({
			url : '/dicts/type',
			data:{
				type:code
			},
    		type:"GET",
       		dataType:"JSON",
            success: function (back) {
               if(back){
            	   dictObj[code]= back;
               }
               if(typeof callback == 'function'){
            	   callback();
               }
             }
         });
	}
}

//查询普通表单的数据作为 数据字典对象
function initDictTable(dictObj,url,data,code,callback){
    if(!dictObj[code]){
        jQuery.ajax({
            url : url,
            data:data,
            type:"GET",
            dataType:"JSON",
            success: function (back) {
                if(back){
                    dictObj[code]= back;
                }
                if(typeof callback == 'function'){
                    callback();
                }
            }
        });
    }
}

/**
 *   加载 下拉框选择，通过首字母 去检索数据
 * @param url  请求地址
 * @param data  查询参数
 * @param k     下拉隐藏对应的字段
 * @param v     下拉显示值对应的字段
 * @param s     拼音对应的字段
 * @param callback
 */
//查询普通表单的数据
function initSelectData(url,data,k,v,s,dom,callback){
        $.ajax({
            url : url,
            data:data,
            type:"GET",
            dataType:"JSON",
            success: function (back) {
                var res = [];
                var respinyin = new Map();
                res.push({text:"请选择",id:"-1"});
                $.each(back,function (key,val) {
                    res.push({text: val[v], id: val[k]});
                    if(s != undefined){
                        respinyin.set(val[k],val[v] +"|" + val[s]);
                    }
                });
                initSelectOpt(dom,res,respinyin);
                if(typeof callback == 'function'){
                    callback(res);
                }
            }
        });
}

function initSelectOpt(dom,data,respinyin){
    $('#'+ dom).select2({
        placeholder:"--请选择--",
        width:'100%',
        data:data,
        formatResult: function (item) {
            var str = item.text;
            var idx = str.indexOf('|');
            return str.substring(0,idx);
        },
        formatSelection: function (item) {
            var str = item.text;
            var idx = str.indexOf('|');
            return str.substring(0,idx);
        },
        matcher:function(params,res){
            var result = null;
            if( params.term != undefined &&  params.term.trim() != ""){
                if(respinyin.size >0){   //如果有拼音查询
                    var term = params.term.toLowerCase();
                    //通过 数据id 获取 对应的文字信息
                    if(respinyin.get(res.id) != undefined && respinyin.get(res.id).indexOf(term) > -1) {
                        result = res;
                    }
                }else {
                    var term = params.term;  //没有拼音查询
                    if (res.text.indexOf(term) > -1) {
                        result = res;
                    }
                }
            }
            else{
                result =  res;
            }
            return result;
        }
    });
}

//加载form 普通表单数据
function loadTableDicts(obj,arr,type,name,key,text,all){
    var html = "";
    var defaultVal;
    if(all != undefined && "select"== type){
        html+="<option  value = '' >全部</option>";
    }else{
        html+= "<option value=''>请选择</option>";
    }
    try {
        defaultVal = obj.attr("defaultVal") == undefined? "":obj.attr("defaultVal");
    }catch (e) {
        defaultVal = "";
    }
    if(arr.length > 0){
        //html+= "<option value=''>请选择</option>";
        for(var a = 0;a < arr.length;a++){
            if("select"== type){
                var selected = arr[a][key] == defaultVal? "selected":"";
               html+="<option "+ selected +" value = '"+arr[a][key]+"' >"+arr[a][text]+"</option>";
            }else{
                if(!arr[a][key]){
                }else{
                    var checked = arr[a][key] == defaultVal? "checked":"";
                    html+="<input "+checked+" class='i-checks' name = '"+name+"' type='"+type+"' value = '"+arr[a][key]+"'><label class='ml10 mr20'>"+arr[a][text] +"</label>";
                }
            }
        }
    }else{
        html+="<option  value = '' ></option>";
    }
    obj.html(html);
}

//加载form查询数据字典项
function loadFormDicts(obj,arr,type,name,all){

	var html = "";
	var defaultVal = obj.attr("defaultVal") == undefined? "":obj.attr("defaultVal");
	if(all != undefined && "select"== type){
        /*html+="<option  value = '' >&nbsp;</option>";*/
		 html+="<option  value = '' >请选择</option>";
    }
	for(var a = 0;a < arr.length;a++){
		if("select"== type){
			var selected = arr[a].dictCode == defaultVal? "selected":"";
			html+="<option "+ selected +" value = '"+arr[a].dictCode+"' >"+arr[a].dictName+"</option>";
		}else{
			if(!arr[a].dictCode){
			}else{
				var checked = arr[a].dictCode == defaultVal? "checked":"";
				html+="<input "+checked+" class='i-checks' name = '"+name+"' type='"+type+"' value = '"+arr[a].dictCode+"'><label class='ml10 mr20'>"+arr[a].dictName +"</label>";
			}
		}
    }
	obj.html(html);
}
//列表数据字典项格式化
function listDictFormat(value,dicts){
	if (!value) return '';
    var valArray = value.toString().split(',');
    var showVal = '';
    if (valArray.length > 1) {
    	for (var k = 0; k < valArray.length; k++) {
           if(dicts && dicts.length>0){
        	   for(var a = 0;a < dicts.length;a++){
                	if(dicts[a].dictCode ==valArray[k]){
                		showVal = showVal + dicts[a].dictName + ',';
                		 break;
                	}
                }
           }
        }
        showVal=showVal.substring(0, showVal.length - 1);
    }else{
    	if(dicts && dicts.length>0){
    	   for(var a = 0;a < dicts.length;a++){
            	if(dicts[a].dictCode == value){
            		showVal =  dicts[a].dictName;
            		 break;
            	}
            }
       }
    }
    return showVal;
}

function getDictTypeData(data,code,name){
	var arr = [{typecode: "", typename: "全部"}];
	$.each(data,function(k,v){
		arr.push({
			'typecode':v[code],
			'typename':v[name]
		});
	});
	return arr;
}


/**
 * select2 联想框  ccs                                       
 * @param obj   jq文档对象
 * @param opt   控制参数 
 * @returns
 */
var opt = {
	pageSize:2,  //分页
	width:'350px', //宽度
	height:'600px', //高度
	url:"/equipments", //请求地址
	id:"eqpCode",   //表单 name
	text:"eqpCode,eqpName", //显示内容 ','隔开，可显示多个元素
	name:"eqpName",  //input查询 参数
	data:{
		"name":"eqpName",  //额外查询参数
	}
}
	//selectData($("#lineId"),opt);
function selectData(obj,opt,val){
	obj.select2({
	    language: "zh-CN",
	    allowClear: false,
	    width: opt.width,
	    height:opt.height,
	    placeholder: "请输入关键字",
	    ajax: {
	        url: opt.url,
	        type:"get",
	        dataType:'json',
            async:false,
	        contentType:"application/json; charset=utf-8",
	        headers: {'Authorization' : localStorage.getItem("token")},
	        delay: 250,
	        data: function (params) {
	            params.offset = opt.pageSize == undefined?10:opt.pageSize;
	            params.page = params.page || 1;
	            var data2= {
	            	pageNo:(params.page-1)*params.offset,
	            	pageSize:params.offset
	            };
	            opt.data[opt.name] = params.term;
	            return  $.extend(data2, opt.data);
	        },
	        cache: true,
	        processResults: function (res, params) {
	            if (res.list) {
	                var lists = res.list;
	                var options = [];
	                var textFiled = opt.text.split(",");
	                for (var i = 0, len = lists.length; i < len; i++) {
	                	var text = "";
	                	for (var j = 0; j < textFiled.length; j++) {
	                		text += lists[i][textFiled[j]] + " ";
						}
	                	
	                    var option = {
	                        "id": lists[i][opt.id],
	                        "text": text
	                                };
	                                options.push(option);
	                            }
	                            return {
	                                results: options,
	                                pagination: {
	                                    more: (params.page * params.offset) < res.count
	                                }
	                            };
	                        if(val != undefined){
	                            obj.val(val).select2().trigger("change");
                            }
	                        }
	                    },
	                    escapeMarkup: function (markup) {
	                        return markup;
	                    },
	                    minimumInputLength: 1
	                }
	            });

	};

//重置方法
function reloadGrid(flag,msg,formId,grid,isTree){
	if(flag){
		if(msg != null && msg != ''){
			js.showMessage(msg);
		}
	}
	$("#"+formId)[0].reset();
	
	if(isTree){
		$("#"+grid).dataGrid("refreshTree","0","0"); 
	}else{
		$("#"+grid).dataGrid("refresh","1","20");
	}
}

function reload(formId,grid){
	//$("#"+formId)[0].reset();
    $("input").val("");
    $("#plantIds").val(localStorage.getItem("plantIds"));
    $("#plantId").val(localStorage.getItem("plantId"));
	$("#"+grid).dataGrid("refresh","1","20");

	$("select").select2();
}

/*function reload(formId,grid,value){
    $("#"+formId)[0].reset();
    $("input[name='plantIds']").val(localStorage.getItem("plantIds"));
    $(".no-Reset").val(value);
    $("select").select2();
    $("#"+grid).dataGrid("refresh","1","20");
}*/

//解决IE10以下不支持Function.bind
if (!Function.prototype.bind) {
    Function.prototype.bind = function(oThis) {
        if (typeof this !== "function") {
            throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }
        var aArgs = Array.prototype.slice.call(arguments, 1),
            fToBind = this,
            fNOP = function() {},
            fBound = function() {
                return fToBind.apply(this instanceof fNOP && oThis ? this : oThis,
                    aArgs.concat(Array.prototype.slice.call(arguments)));
            };
        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();
        return fBound;
    };
}

//重新调整jqgrid每列的宽度
function jqgridColResize(){  
    var td=$('#tdCompute')//获取计算实际列长度的容器  
        ,tds//临时保存列  
        ,arr=[];//用于保存最大的列宽  
     //遍历每行获得每行中的最大列宽  
    $('.ui-jqgrid-htable tr,.ui-jqgrid-btable tr:gt(0)').each(function(){  
       $(this).find('td,th').each(function(idx){  
         arr[idx]=Math.max(arr[idx]?arr[idx]:0,td.html($(this).text())[0].offsetWidth);  
       })           
    });  
    $('.ui-jqgrid-labels th').each(function(idx){this.style.width=arr[idx]+'px'});//设置页头单元格宽度         
    $('.ui-jqgrid-btable tr:eq(0) td').each(function(idx){this.style.width=arr[idx]+'px'});//设置内容表格中控制单元格宽度的单元格，在第一行  
  }

//数组去重
function uniq(array){
    var temp = {}, r = [], len = array.length, val, type;
    for (var i = 0; i < len; i++) {
        val = array[i];
        type = typeof val;
        if (!temp[val]) {
            temp[val] = [type];
            r.push(val);
        } else if (temp[val].indexOf(type) < 0) {
            temp[val].push(type);
            r.push(val);
        }
    }
    return r;
}

function unique(arr,attribute){
    var new_arr=[];
    var json_arr=[];
    for(var i=0; i<arr.length; i++){
        if(new_arr.indexOf(arr[i][attribute]) ==-1){    //  -1代表没有找到
            new_arr.push(arr[i][attribute]);   //如果没有找到就把这个name放到arr里面，以便下次循环时用
            json_arr.push(arr[i]);
        } else{
        }
    }
    return json_arr;
}

//自动填充表单值
function fillFormData(form,result){
	$.each(form[0], function(k, v) {
		if(v.localName == "select"){
			$("select[name='"+v.name+"']").val(result[v.name]).trigger("change");
		}
		if(v.localName == "input"){
			if(v.className == "i-checks"){
               // $("input[name='"+v.name+"'][value='"+result[v.name]+"']").removeProp('checked');
				$("input[name='"+v.name+"'][value='"+result[v.name]+"']").iCheck('check');
              //  $("input[name='"+v.name+"'][value='"+result[v.name]+"']").iCheck('update');
			}else{
				$("input[name='"+v.name+"']").val(result[v.name]);
			}
		}
		if(v.localName == "textarea"){
			$("textarea[name='"+v.name+"']").val(result[v.name]);
		}
	});
}

/**
 * @Description: 自动填充页面property属性值
 * @param: i 顺序号
 * @param: obj 行记录
 */
function fillPropertyData(data) {
	$.each($("[data-property]"), function(i, obj) {
		var propertyName = $(obj).data("property");
		for(var item in data) {
			if(item == propertyName) {
				$(obj).html(data[item]);
			}
		}
	});
}

/**
 *  获取角色所属的公司，并执行回调
 * @param call  成功的回调
 */
function getPlantList(call){
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
            if(data.length > 0){
                $.each(data, function(k, v) {
                    var obj ={};
                    obj.dictCode=v.id;
                    obj.dictName=v.plantSname;
                    arr.push(obj);
                });
            }
            loadFormDicts($("#plantId"),arr,'select','plantId');
            if(typeof call == 'function'){
                call(arr);
            }
        }
    });
}

/**
 * 对 打开新页面传参问题
 * @param $this  a 标签
 * @param call   回调方法
 * @returns {boolean}
 */
function addTabPage($this,call){

    var href = $this.data("href");
    if(typeof call  == 'function'){
        href = call(href);
    }
    var title = $this.data("title") || $this.attr("title") || $this.text();
    if (href && href != "" && href != "blank") {
        js.addTabPage($this, $.trim(title || js.text("tabpanel.newTabPage")), href);
        return false;
    }
    return true;
}

/**
 * jqgrid  编辑框 验证
 * @param value
 * @param name
 * @returns {*[]}
 * @constructor
 */
function ValidateTvalue(value,name){
    //#region 验证分数是否为数值
    var regu = "^[0-9]+(.[0-9]{2})?$";
    //var regu = "/^\+?(\d*\.\d{2})$/";
    var re = new RegExp(regu);
    if (re.test(value)) {
        return [true, ""];
    }
    else {
        return [false, "请输入数值型.如：1"];
    }
    //#endregion
}


/**
 * grid编辑   获取动态下拉数据源
 * @param dictDatas
 * @returns {Array}
 */
function editSelectSource(dictDatas) {
    var items = [];
    if(dictDatas.length > 0){
        $.each(dictDatas,function (k,v) {
            items.push({"cssStyle":"","cssClass":"","dictValue":v.dictCode,"dictLabel":v.dictName})
        });
    }
    return items;
}

/**
 *  校验 文件的格式是否 符合要求
 * @param file   待校验的文件名
 */
function validFile(file,regStr){
    var fileName = file.substr(file.indexOf(".")); //文件后缀名
    var reg = new RegExp(regStr);
    var res = false;
    if(reg.test(fileName)){
        res = true;
    }
    return res;
}

//字符串去除 空格
String.prototype.trim = function(){
    return this.replace(/^(\s*)|(\s*)$/g, '');
}

/**
 *  展开tree的一个节点，直到末级
 * @param node   节点
 * @param treeObject  tree
 */
function expandFirstNode(node,treeObject) {
    if(node.children != undefined && node.children.length >0){
        treeObject.expandNode(node, true, false, false);//默认展开第一级节点
        expandFirstNode(node.children[0],treeObject);
    }else{
        treeObject.selectNode(node,false,false);
    }
}
/**
 *  展开tree的选中父节点，直到末级
 * @param node   节点
 * @param treeObject  tree
 */
function expandNode(node,treeObject) {
    for(var i=node.length-1;i>=0;i--){
        treeObject.expandNode(node[i], true, false, false);//默认展开第一级节点
    }

}

function getSroragePlantId(){
    var plantId = null;
    if(localStorage.getItem("plantId") != undefined){
        plantId =  localStorage.getItem("plantId");
    }else if(localStorage.getItem("plantIds") != undefined){
        plantId =  localStorage.getItem("plantIds").split(",")[0];
    }else{
        plantId = "-1";
    }
    return plantId;
}

//重置
$("#formReset").click(function(){
    $(this).closest("form")[0].reset();
    $(".reset").val('');
});
//初始化 layer全局弹窗大小
js.initLayerSize = function() {
    var size = {};
    var size1080 = {
        max:['1200px','780px'],  //新增修改
        middle:['992px','646px'], //二层弹窗
        maxMiddle:['868px','540px'], //三层弹窗
        minMiddle:['768px','500px'], // 四层弹窗
        min:['300px','360px']     // ztree 弹窗
    };
    var size1366 = {
        max:['992px','580px'],
        middle:['780px','500px'],
        maxMiddle:['500px','360px'],
        minMiddle:['500px','360px'],
        min:['300px','360px']
    };
    var clientWidth = localStorage.getItem("clientWidth")|| 1920;
    if(clientWidth > 1366){
        size = size1080;
    }else{
        size = size1366;
    }
    return size;
}

/**
 * 初始化layer的 四层layer 尺寸
 */
var layerSize = js.initLayerSize();

if($('.gridBox').length >0){
    $(".gridBox").height($(window).height()/2 -2);
}


