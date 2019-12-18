initMenu();
var slideMenu = null;
$(".layui-tab-title").hide();
function initMenu(){
	 $.ajax({  
	     url:"/permissions/current",  
	     type:"get",  
	     async:false,
	     success:function(data){
	    	 if(!$.isArray(data)){
	    		 location.href='/login.html';
	    		 return;
	    	 }
	    	 var menu = $(".topMenuDiv_top");
	    	 var first_id,first_name;
	    	 slideMenu = data;
	    	 $.each(data, function(i,item){
	    		 var a = $("<a href='javascript:;'></a>");
	    		 var css = item.css; //设置图标
	    		 if(css!=null && css!=""){
	            	 a.append("<i aria-hidden='true' class='fa" + css +"'></i>");
	             }
	             a.append("<span>"+item.name+"</span>");
	             a.attr("lay-id", item.id);
	             var href = item.href;
	             if(href != null && href != ""){
	                a.attr("data-url", href);
	             }
	             var div = $("<div class='menuItem' id='"+ item.id+"'></div>");
	             if(i == 0){
	            	 div.addClass("active");
	            	 first_id=item.id;
	            	 first_name = item.name;
	             }
	             div.append(a);
	             console.log(a);
                 menu.append(div);
	    	 });
	    	 extandMenu(first_id,first_name);
	     }
	 });
}

$(".menuItem").each(function(){
	var id = $(this).attr("id");
	var name = $(this).text();
	var _this = $(this);
	_this.click(function(){
		$(".menuItem").removeClass("active");
		_this.addClass("active");
		extandMenu(id,name);
		topMenuContraction();//隐藏菜单
	})
});

function extandMenu(id,name){
	$.ajax({  
	     url:"/permissions/currentSub",  
	     type:"get",  
	     async:false,
	     data:{
	    	 id:id
	     },
	     success:function(data){
	    	 if(!$.isArray(data)){
	    		 location.href='/login.html';
	    		 return;
	    	 }
	    	 var menu = $("#menu");
		     menu.html("");
		     $("#drillcrumb").html(name);
	    	 $.each(data, function(i,item){
	             var a = $("<a href='javascript:;'></a>");
	             
	             var css = item.css; //设置图标
	             if(css!=null && css!=""){
	            	 a.append("<i aria-hidden='true' class='fa " + css +"'></i>");
	             }
	             a.append("<cite>"+item.name+"</cite>");
	             a.attr("lay-id", item.id);
	             
	             var href = item.href;
	             if(href != null && href != ""){
	                a.attr("data-url", href);
	             }
	             
	             var li = $("<li class='layui-nav-item'></li>");
	             if (i == 0) {
	            	 li.addClass("layui-nav-itemed");
	             }
	             li.append(a);
                 menu.append(li);
	             
	             console.log("二级菜单");
	             //多级菜单
	             setChild(li, item.child); 
	        });
	    	 layui.use(['layer', 'element'], function() {
	    		 var element = layui.element; //导航的hover效果、二级菜单等功能，需要依赖element模块
		    	 element.render('nav','demo');
	    	 });    	
    	}
     });
	
}


function setChild(parentElement, child){
    if(child != null && child.length > 0){
    	console.log("三级菜单");
        $.each(child, function(j,item2){
            var ca = $("<a href='javascript:;'></a>");
            if(item2.href!=null && item2.href!="" ){
            	ca.attr("data-url", item2.href);
            }
            if(item2.id!=null && item2.id!="" ){
            	ca.attr("lay-id", item2.id);
            }
            var css2 = item2.css;
            if(css2!=null && css2!=""){
                ca.append("<i aria-hidden='true' class='fa " + css2 +"'></i>");
            }

            ca.append("<cite>"+item2.name+"</cite>");

            var dd = $("<dd></dd>");
            dd.append(ca);

            var dl = $("<dl class='layui-nav-child'></dl>");
            dl.append(dd);

            parentElement.append(dl);

            // 递归
            setChild(dd, item2.child);
        });
    }
}


// 登陆用户头像昵称
showLoginInfo();
function showLoginInfo(){
	$.ajax({
		type : 'get',
		url : '/users/current',
		async : false,
		success : function(data) {
			$(".admin-header-user span").text(data.nickname);
			
			var pro = window.location.protocol;
			var host = window.location.host;
			var domain = pro + "//" + host;
			
			var sex = data.sex;
			var url = data.headImgUrl;
			if(url == null || url == ""){
				if(sex == 1){
					url = "/img/avatars/person.png";
				} else {
					url = "/img/avatars/person.png";
				}
				
				url = domain + url;
			} else {
				url = domain + "/statics" + url;
			}
			var img = $(".admin-header-user img");
			img.attr("src", url);
		}
	});
}

showUnreadNotice();
function showUnreadNotice(){
	$.ajax({
		type : 'get',
		url : '/notices/count-unread',
		success : function(data) {
			$("[unreadNotice]").each(function(){
				if(data>0){
					$(this).html("<span class='layui-badge'>"+data+"</span>");
				}else{
					$(this).html("");
				}
			});
			
		}
	});
}

function logout(){
	$.ajax({
		type : 'get',
		url : '/logout',
		success : function(data) {
			localStorage.removeItem("token");
			location.href='/login.html';
		}
	});
}



resize();
function resize(){  
    var $content = $('#admin-body');
    console.log($content.height());
    $content.find('iframe').height($content.height()-4);
    console.log($content.find('iframe').height());
}

var active;

layui.use(['layer', 'element'], function() {
	var $ = layui.$,
	layer = layui.layer;
	var element = layui.element; //导航的hover效果、二级菜单等功能，需要依赖element模块
    element.on('nav(demo)', function(elem){
      //layer.msg(elem.text());
    });
	
	  //触发事件  
	  /* active = {  
	       tabAdd: function(obj){
	    	 var lay_id = $(this).attr("lay-id");
	    	 var title = $(this).html() + '<i class="layui-icon" data-id="' + lay_id + '"></i>';
	         //新增一个Tab项  
	         element.tabAdd('admin-tab', {  
	           title: title,
	           content: '<iframe src="' + $(this).attr('data-url') + '"></iframe>',
	           id: lay_id
	         });  
	         element.tabChange("admin-tab", lay_id);    
	       }, 
	       tabDelete: function(lay_id){
    	      element.tabDelete("admin-tab", lay_id);
    	   },
	       tabChange: function(lay_id){
	         element.tabChange('admin-tab', lay_id);
	       }  
	   };  */
	   //添加tab  
	   $(document).on('click','a',function(){  
/*	       if(!$(this)[0].hasAttribute('data-url') || $(this).attr('data-url')===''){
	    	   return;  
	       }
	       var tabs = $(".layui-tab-title").children();
	       var lay_id = $(this).attr("lay-id");

	       for(var i = 0; i < tabs.length; i++) {
	           if($(tabs).eq(i).attr("lay-id") == lay_id) { 
	        	   active.tabChange(lay_id);
	               return;  
	           }    
	       }*/  
	       //active["tabAdd"].call(this);
		   if(!$(this)[0].hasAttribute('data-url') || $(this).attr('data-url')===''){
	    	   return;  
	       }
		   var src = $(this).attr('data-url');
		   $("#contentIframe").prop("src",src);
	       resize();  
	   });  
	   
	   
	     
	   //iframe自适应  
	  /* function resize(){  
	       var $content = $('.admin-nav-card .layui-tab-content');
	       if($("#admin-body .layui-tab-title").hasClass('tabTitle')){
	    	   $content.height($(this).height() - 50);
	       }else{
	    	   $content.height($(this).height() - 86);
	       }
	         
	       $content.find('iframe').each(function() {  
	           $(this).height($content.height());  
	       });  
	   }  
	   resize();*/
	   //iframe自适应  
	   function resize(){  
	       var $content = $('#admin-body');
	       console.log($content.height());
	       $content.find('iframe').height($content.height() - 4);
	   }  
	   
	   $(window).on('resize', function() {  
	      /* var $content = $('.admin-nav-card .layui-tab-content');
	       if($("#admin-body .layui-tab-title").hasClass('tabTitle')){
	    	   $content.height($(this).height() - 86);
	    	   console.log($content.height());
	       }else{
	    	   $content.height($(this).height() - 147);
	    	   console.log($content.height());
	       }	       
	       //$content.height($(this).height() - 86);  
	       $content.find('iframe').each(function() {  
	           $(this).height($content.height());  
	       });  */
		   /*chen新增部分*/
		   var content = $("#admin-body .contentBox");
		   content.height($(this).height()-100);
		   resize();
	   }).resize();  
	   
	   //toggle左侧菜单  
	   $('.admin-side-toggle').on('click', function() {
	       var sideWidth = $('#admin-side').width();  
	       if(sideWidth === 225) {  
	           $('#admin-body').animate({  
	               left: '0'  
	           });
	           $('#admin-footer').animate({  
	               left: '0'  
	           });  
	           $('#admin-side').animate({  
	               width: '0'  
	           });  
	       } else {  
	           $('#admin-body').animate({  
	               left: '225px'  
	           });  
	           $('#admin-footer').animate({  
	               left: '225px'  
	           });  
	           $('#admin-side').animate({  
	               width: '225px'  
	               });  
	           }  
	       });
	   
	    //手机设备的简单适配
	    var treeMobile = $('.site-tree-mobile'),
	    shadeMobile = $('.site-mobile-shade');
	    treeMobile.on('click', function () {
	        $('body').addClass('site-mobile');
	    });
	    shadeMobile.on('click', function () {
	        $('body').removeClass('site-mobile');
	    });
});

/************ chen 该部分用于全局全屏 ***************/
//远程连接全屏
$(".fullscreen").click(function(){
	var el = document.getElementById("contentBox");
	fullScreen(el);
});

function fullScreen(el) {
    var rfs = el.requestFullScreen || el.webkitRequestFullScreen || el.mozRequestFullScreen || el.msRequestFullScreen;
    if(typeof rfs != "undefined" && rfs) {
        rfs.call(el);
    } else if(typeof window.ActiveXObject != "undefined") {
            //for IE，这里其实就是模拟了按下键盘的F11，使浏览器全屏
            var wscript = new ActiveXObject("WScript.Shell");
            if(wscript != null) {
                wscript.SendKeys("{F11}");
            }
    }
    
}
function exitFullScreen() {
    var el = document;
    var cfs = el.cancelFullScreen || el.webkitCancelFullScreen || el.mozCancelFullScreen || el.exitFullScreen;
    if(typeof cfs != "undefined" && cfs) {
        cfs.call(el);
    } else if(typeof window.ActiveXObject != "undefined") {
            //for IE，这里和fullScreen相同，模拟按下F11键退出全屏
            var wscript = new ActiveXObject("WScript.Shell");
            if(wscript != null) {
                wscript.SendKeys("{F11}");
            }
        }
    reLayout(false);
}

function reLayout(){
	$("#contentBox").height($("document").height());
	/*$(".fullscreen").css({"position":"fixed","top":"0","right":"0","color":"red"});
	var node = $(".exitScreen").clone();
	$("#contentIframe body").append(node);*/
	
}

//根据Ul改变对应  active样式

$(".menuItem").each(function(){
	var id = $(this).attr("id");
	var name = $(this).text();
	var _this = $(this);
	_this.click(function(){
		$(".menuItem").removeClass("active");
		_this.addClass("active");
		extandMenu(id,name);
	});
});
var isAdd = true;

//顶部菜单最大高度
var TOP_MENU_MAX_HEIGHT = "185"; 

//显示隐藏的一级菜单
$("#topMenuContr").click(function(){

	if($(".topMenuDiv_top").height() > 70){
		$(this).removeClass("menu_Contraction").removeClass("leftcolor");
		$(this).addClass("menu_Expand");
		topMenuContraction();
	}else{
		$(this).removeClass("menu_Expand").removeClass("leftcolor");
		$(this).addClass("menu_Contraction");
		topMenuExpand();
	}
});

//光标不在菜单区域时，如果菜单时展开的则收缩。
$(".topMenuDiv").hover(function() {}, function() {
	if ($(".topMenuDiv_top").height() > 70) {
    	topMenuContraction();
    }
});

/**
* 菜单收缩
*/

function topMenuContraction() {
	$("#topMenuContr").removeClass("menu_Contraction").removeClass("leftcolor");
    $("#topMenuContr").addClass("menu_Expand");
    $("#topMenuContr").parent().removeClass("menu_Contraction").removeClass("leftcolor");
   	$(".topMenuDiv_top .slideItemText").removeClass("slideItemTextExpand");
	$(".topMenuDiv_top").each(function() {$.dequeue(this, "fx")}).animate({
		height:50
	} , 0);
	if ($("#divFloatBg").offset().top >= 67 ) {
	    $("#divFloatBg").hide();
	}
	$(".topMenuDiv_top").removeClass("topMenuDivOver").removeClass("leftcolor")
	$("#topMenuContr").css("height","35px");
	$(".topItemSelect").removeClass("topItemSelectBorder").removeClass("logobordercolor");
}

/**
* 菜单展开
*/
function topMenuExpand() {
	$(".topMenuDiv_top").addClass("topMenuDivOver").addClass("leftcolor");
	$(".topMenuDiv_top .slideItemText").addClass("slideItemTextExpand");
	if(isIE() && document.documentMode==5){
		$("#topMenuContr").css("height",parseInt(TOP_MENU_MAX_HEIGHT));
	}else{
		$("#topMenuContr").css("height",parseInt(TOP_MENU_MAX_HEIGHT)-7);
	}	
	$("#topMenuContr").parent().addClass("menu_Contraction").addClass("leftcolor");
	$(".topItemSelect").addClass("topItemSelectBorder").addClass("logobordercolor");
	$(".topMenuDiv_top").each(function() {$.dequeue(this, "fx")}).animate({
   		height: TOP_MENU_MAX_HEIGHT
		//height:"100px"
   	} , 0);
}



/*主题换肤弹窗**/
$(".themeCtrl").click(function(){
	layer.open({
	  type: 2, 
	  title:"主题中心",
	  skin:"dailog",
	  area: ['624px', '500px'],
	  content: 'pages/dialog/base.html', //这里content是一个URL，如果你不想让iframe出现滚动条，你还可以content: ['http://sentsin.com', 'no']
	  btn: ['关闭'],
	  btnAlign: 'c',
	  anim :-1,
	  shade: 0,
	  skin: "myDialog",
	  isOutAnim: false,
	  resize : false
	});
});

function initTheme(theme){
	console.log(theme);
	if(!theme || theme == 0){
		$("#theme").attr("href","css/theme/style.css");
	}else{
		$("#theme").attr("href","css/theme/style"+ theme +".css");
	}
}

function isIE(){
	return false;
}