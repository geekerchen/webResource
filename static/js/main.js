$(function() {
		localStorage.setItem("clientWidth",$(top.window).width());
		 getMenuList($("#menu"),"/permissions/current");
		 $(".sidebar").height($(window).height());
	    js.initTabPage("tabpanel", {
	        height: function() {
	            var g = $(window).height(),
	            e = $(".main-header:visible").outerHeight(),
	            f = $(".main-footer:visible").outerHeight(),
	            d = g - e - f;
	            return d < 300 ? 300 : d
	        }
	    });
	    $(window).resize(function(){  //浏览器窗口大小变化事件
            $("#menuDiv").height($(window).height() - 50);
            $(".slimScrollDiv").height($(window).height() - 50);
		});
	    var b = $("#desktopTabPage");
	    if (b.size() > 0) {
	        var a = b.data("url");
	        if (a != "" && a != ctx) {
	            js.addTabPage(null, '<i class="fa fa-home"></i> ' + b.data("title"), a, false, false)
	        }
	    }
	    var c = $("#modifyPasswordTip");
	    if (c.size() > 0 && c.data("message") != "") {
	        js.confirm(c.data("message"),
	        function() {
	            $("#modifyPassword").click()
	        })
	    }
	    window.isMenuClickFlag = false;
	    $(window).bind("hashchange",
	    function(g) {
	        if (!window.isMenuClickFlag) {
	            var f = window.location.hash.replace("#", "");
	            if (f && f != "" && f != window.location.pathname) {
	            	//console.log($("1"+$("a.addTabPage").length()))
	                var d = $('a.addTabPage[data-href="' + f + '"]:eq(0)');
	                if (d && d.length > 0) {
	                    d.click()
	                } else {
	                    js.addTabPage(null, js.text("tabpanel.newTabPage"), f)
	                }
	            } else {
	            	//console.log($("2"+$("a.addTabPage").length()))
	                $(".sidebar-menu > li:eq(0):not(.active) > a:eq(0)").click()
	            }
	        }
	        window.isMenuClickFlag = false
	    }).trigger("hashchange");

	    //全屏按钮事件
	    $("#fullScreen").click(function() {
			toggleFullscreen(document);
	    });

	    $("#fullScreen2").click(function() {
	    	/*var pageId = js.getCurrentTabPage().attr("id");
	    	var $doc = $("#"+pageId).prop('contentWindow').document;*/
	    	var $doc = document.getElementsByClassName('tabpanel_content')[0];
	    	//toggleFullscreen($doc);
            openFullscreen($doc);
	    });
	    $("#exitScreenBtn").click(function(){
            var pageId = js.getCurrentTabPage().attr("id");
            var $doc = $("#"+pageId).prop('contentWindow').document;
            toggleFullscreen($doc);
	    });

    //打开全屏方法   DOM全屏
    function openFullscreen(element) {
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullScreen();
        }
    }

	    // 全屏方法   DOM全屏
	   var toggleFullscreen = function($doc){
		   if (!$doc.fullscreenElement &&    // alternative standard method
			   !$doc.mozFullScreenElement && !$doc.webkitFullscreenElement && !$doc.msFullscreenElement ) {  // current working methods
			 if ($doc.documentElement.requestFullscreen) {
			   $doc.documentElement.requestFullscreen();
			 } else if ($doc.documentElement.msRequestFullscreen) {
			   $doc.documentElement.msRequestFullscreen();
			 } else if ($doc.documentElement.mozRequestFullScreen) {
			   $doc.documentElement.mozRequestFullScreen();
			 } else if ($doc.documentElement.webkitRequestFullscreen) {
			   $doc.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
			 }
		   } else {
			 if ($doc.exitFullscreen) {
			   $doc.exitFullscreen();
			 } else if ($doc.msExitFullscreen) {
			   $doc.msExitFullscreen();
			 } else if ($doc.mozCancelFullScreen) {
			   $doc.mozCancelFullScreen();
			 } else if ($doc.webkitExitFullscreen) {
			   $doc.webkitExitFullscreen();
			 }
		   }
		 }
	    
/*	    function update_iframe_pos(){
	     	var pageId = js.getCurrentTabPage().attr("id");
		    if(document.fullscreenElement || document.mozFullScreenElement ||document.webkitFullscreenElement ||document.msFullscreenElement){
		    	$("#"+pageId).addClass("ifr_fixed");
		    	reLayOut(true);
		    }else{
		    	$("#"+pageId).removeClass("ifr_fixed");
		    	reLayOut(false);
		    	if(localStorage.getItem("collapse") == '1'){
		    		 $('#toggle').trigger("click");
			    }else{
			    	return;
			    }
		    }
	     }*/


    function update_iframe_pos(){
        if(document.fullscreenElement || document.mozFullScreenElement ||document.webkitFullscreenElement ||document.msFullscreenElement){
            $("#menuDiv").height($(window).height() - 50);
            $(".slimScrollDiv").height($(window).height() - 50);
        }else{
            $("#menuDiv").height($(window).height() - 50);
            $(".slimScrollDiv").height($(window).height() - 50);
        }
    }
	  //添加退出全屏时的监听事件
	    window.addEventListener("fullscreenchange", function(e) {
	    	update_iframe_pos();
	    });
	    window.addEventListener("mozfullscreenchange", function(e) {
	    	update_iframe_pos();
	    });
	    window.addEventListener("webkitfullscreenchange", function(e) {
	    	update_iframe_pos();
	    });
	    window.addEventListener("msfullscreenchange", function(e) {
	    	update_iframe_pos();
	    });
	    
/*	     function reLayOut(flag){
	     	if(flag){
	     		$(".main-header").hide();
	     		$("#menu").hide();
	     		$(".tabpanel_move_content").hide();
	     		$(".tabpanel_tab_content").hide();
	     		$("#exitScreenBtn").show();
	     		$("#fullScreenMouseArea").show();
	     		$("#toggle").hide();
	     		$("#menuDiv").hide();
	     		$(".sidebar").height($(window).height());
	     		$("#fullMenuDiv").height($(window).height());
	     		$(".main-sidebar .slimScrollDiv:nth-child(1)").hide();
	     		$(".main-sidebar .slimScrollDiv:nth-child(2)").show();
	     	}else{
	     		$(".main-header").show();
	     		$(".tabpanel_move_content").show();
	     		$(".main-sidebar").width(200);
	     		$(".tabpanel_tab_content").show();
	     		$("#exitScreenBtn").hide();
	     		$("#fullScreenMouseArea").hide();
	     		$("#menuDiv").show()
	     		$("#menu").show();
	     		$("#fullMenu").hide();
	     		$("#toggle").show();
	     		$(".main-sidebar").show();
	     		$(".main-sidebar .slimScrollDiv:nth-child(2)").hide();
	     		$(".main-sidebar .slimScrollDiv:nth-child(1)").show();
	     		$(".sidebar").height($(window).height()-50);
	     		$("#fullMenuDiv").height($(window).height()-50);
	     	}
	     }
	    全屏状态下显示菜单
		$("#fullScreenMouseArea").mouseover(function(e){
			var layid = js.getCurrentTabPage().data("id");
			if(layid){ 
				$("#fullMenu").html("");
		    	getMenuList($("#fullMenu"),"/permissions/dcsTreeList/"+layid,function(){
		    		$(".main-sidebar").show().width(150);
		    		$(".main-sidebar .slimScrollDiv:nth-child(2)").height($(window).height()).find("section").height($(window).height());
					$("#fullMenu").show();
					$('#toggle').trigger("click");
		    	});
			}else{
				return;
			}
		});
		
		//悬浮菜单移开事件
		$("#fullMenuDiv").mouseleave(function(){
			if(document.fullscreenElement ||
		        document.mozFullScreenElement ||
		        document.webkitFullscreenElement ||
		        document.msFullscreenElement){
	        		$('#toggle').trigger("click");
		        }else{
		        	return;
		        }
		})*/
	    
	    
	    //主题切换点击事件
	    $("#switchSkin").click(function() {
	        layer.open({
	            type: 2, 
	             shadeClose: true,
				  title:"主题中心",
				  skin:"dailog",
				  area: ['624px', '520px'],
				  content: ctx +'/dialog/base.html', //这里content是一个URL，如果你不想让iframe出现滚动条，你还可以content: ['http://sentsin.com', 'no']
				  btn: ['关闭'],
				  btnAlign: 'c',
				  anim :-1,
				  shade: 0,
				  skin: "myDialog",
				  isOutAnim: false,
				  resize : false,
				  success: function(d, e) {
		           
		        },
	        })
	    });
	    
	    function getMenuList(dom,url,callback){
	    	$.ajax({  
	   	     url:url,  
	   	     type:"get",  
	   	     async:false,
	   	     success:function(data){
	   	    	 if(!$.isArray(data)){
	   	    		 location.href='/login.html';
	   	    		 return;
	   	    	 }
	   	    	menuList = data;
	   	    	initMenu(dom,data);
	   	    	if(typeof callback != undefined && typeof callback == "function" && data.length >0){
	   	    		callback();
	   	    	}
	   	     }
	    	
	    });
	}
	    
			function initMenu(menu,data){
				$.each(data, function(i,item) {
					var a = $('<a href="javascript:" class="addTabPage" > </a>');
					a.attr("title",item.name);
					if(item.href !=null &&　item.href!=""){
			        	a.attr("data-href", item.href);
			        }else{
			        	a.attr("data-href", "blank");
			        }
					if(item.fullScreen ==1){
						a.attr("data-dcs", "1");
					}
			        if(item.id!=null && item.id!="" ){
		            	a.attr("data-id", item.id);
		            }
					a.attr("data-href",item.href);
					var css = item.css;
					if(css!=null && css!=""){
			        	 a.append('<i class="fa '+css+'"></i> ');
			         }
					a.append('<span>'+item.name +'</span>');
					if(item.child.length > 0){
						a.append('<span class="pull-right-container"><i class="fa fa-angle-left pull-right"></i></span>');
					}
					var li = $('<li class="treeview"></li>');
					li.append(a);
					menu.append(li);
					setChild(li,item.child);
				});
			}
			
			//toggle左侧菜单  
			$(".admin-side-toggle").bind('click',function(){
				$('#toggle').trigger("click");
			});

			
			
			function setChild(parentElement, child){
		    if(child != null && child.length > 0){
		    	var dl = $("<ul class='treeview-menu'></ul>");
		        $.each(child, function(j,item2){
		        	var ca = $('<a href="javascript:" class="addTabPage" > </a>');	  
		            ca.attr("title", item2.name);
		            if(item2.id!=null && item2.id!="" ){
		            	ca.attr("data-id", item2.id);
		            }
		            if(item2.href !=null &&　item2.href!=""){
		            	ca.attr("data-href", item2.href);
		            }
		            if(item2.fullScreen == 1){
						ca.attr("data-dcs", "1");
						
					}

		            if(item2.isExternalLink != null){
						ca.attr("data-isDcs", item2.isExternalLink);
					}

		            var css2 = item2.css;
		            if(css2!=null && css2!=""){
		                ca.append('<i class="fa '+css2+'"></i> ');
		            }
		            
		           ca.append('<span>'+item2.name +'</span>');
		            if(item2.child.length > 0){
						ca.append('<span class="pull-right-container"><i class="fa fa-angle-left pull-right"></i></span>');
					}
		            var dd =  $('<li class="treeview"></li>');
		            dd.append(ca);
		           
		            dl.append(dd);           
		            // 递归
		            parentElement.append(dl);
		            setChild(dd, item2.child);
		        });
		    }
		}
	}); 

//退出登录
function logout(){
	$.ajax({
		type : 'get',
		url : '/logout',
		success : function(data) {
			localStorage.clear();
			localStorage.removeItem("token");
			location.href='/login.html';
		}
	});
}




//登陆用户头像昵称
showLoginInfo();
function showLoginInfo(){
	$.ajax({
		type : 'get',
		url : '/users/current',
		async : false,
		success : function(data) {
			$("#userInfo span").text(data.nickname);
			$("#company .name").attr("plantId",data.plantId);
			//localStorage.setItem("plantId",data.plantId);
			/*if(localStorage.getItem("plantId") == null){
				console.log(data.subCompanyId);
				$("#company .name").attr("plantId",data.subCompanyId);
				$("#company .name").text($(".plants[plantid='"+data.subCompanyId+"']").text());
			}*/
			//报警按钮权限
			localStorage.setItem("hasAlarmConfimAuth",true);
			getUsers(data.id)
			getPlant(data.id)
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
				url = "/img/avatars/person.png";
			}
			var img = $("#userInfo img");
			img.attr("src", url);
		}
	});
}


//获取用户角色
function getUsers(id){
	$.ajax({
		type : "GET",
		url: "/roles/userId",
		data:{
			userId:id
		},
		contentType: "application/json; charset=utf-8",
		async:false,
		success:function(data){
			var html ="";
			if(data.length > 0){
				alertData(data[0].id)
			}
		}
	});
}

function getPlant(id){
	$.ajax({
		type : "GET",
		url: "/plant/list_plant",
		data:{
			userId:id
		},
		contentType: "application/json; charset=utf-8",
		async:false,
		success:function(data){
			console.log(data);
			var html ="";
			if(data.length > 0){
				var plants = new Array();
				$.each(data, function(k, v) {
					html +="<li><a class='plants' plantId='"+v.id +"'><i class='fa fa-codepen'></i>"+ v.plantSname +"</a></li>";
					plants.push(v.id);
				});
				$("#company .dropdown-menu").html(html);
				//console.log(localStorage.getItem("plantId"));
				if(localStorage.getItem("plantId") !=  'undefined' && localStorage.getItem("plantId") != null){
					$("#company .name").attr("plantId",localStorage.getItem("plantId"));
					$("#company .name").text($(".plants[plantid='"+localStorage.getItem("plantId")+"']").text());
				}else{
					$("#company .name").attr("plantId",data[0].id);
					$("#company .name").text(data[0].plantSname);
					localStorage.setItem("plantId",data[0].id);
				}
				localStorage.setItem("plantIds",plants);
			}
		}
	});
}


//获取公司权限
function alertData(id){
	$.ajax({
		type : "GET",
		url: "/roles/getRoleAlertByRoleId",
		data:{
			roleId:id
		},
		contentType: "application/json; charset=utf-8",
		async:false,
		success:function(data){
			var str = new Array();
			str.push("*");
			//公司名称
			$.each(data, function(k, v) {
				str.push(v.areaName);
			});
			var item = "{";
			if(data.length > 0){
				item +="\""+data[0].sysName+"\":{\"look\":1,\"confirm\":"+data[0].confirm+"}";
			}
			item +="}";
			localStorage.setItem("alarmSystem",item);
			localStorage.setItem("extra",JSON.stringify({area:str.toString()}));
			var arr = new Array();
			if(data.length > 0){
				arr.push({"报警设置":{"look" : parseInt(data[0].rightAuth)}});
				arr.push({"设备详情":{"look" : parseInt(data[0].rightAuth)}});
				arr.push({"单点信息":{"look" : parseInt(data[0].rightAuth)}});
			}
			localStorage.setItem("rightAuth",JSON.stringify(arr));
		}
	});
}


$("#company li>a").click(function(){
	var _this = $(this);
	if(_this.attr("plantId") == $("#company .name").attr("roleplantIdId")){
		return;
	}else{
		js.confirm("确定要切换公司吗？",function(){
			$("#company .name").text(_this.text());
			$("#company .name").attr("plantId",_this.attr("plantId"));
			localStorage.setItem("plantId",_this.attr("plantId"));
			top.location.reload();
		});
	}
});