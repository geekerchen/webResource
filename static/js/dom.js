
listernDom();
$("#menu a").click(function(){
	alert(2);
	listernDom();
});

function listernDom(){	
	var str = "<div class='fullscreen' id='fullscreen2' style='position: fixed;top:20px;left:50%'>全屏按钮</div>";
	var scriptStr = '<script type="text/javascript" src="../js/common3.js"></script>';
	$(".layui-show iframe").load(function(){
		$(".layui-show iframe").contents().find("body").append(str);
		$(".layui-show iframe").contents().find("body").append(scriptStr);
	        alert("加载完成！");
	        var Obtn = $(".layui-show iframe").contents().find("#fullscreen2");
	        $(Obtn).click(function(){
	            toggleFullscreen();
	        });
	    });
}