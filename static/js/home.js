var isAdd = true;

//顶部菜单最大高度
var TOP_MENU_MAX_HEIGHT = "185";
jQuery(document).ready(function(){

    //菜单展开或者收缩
    jQuery("#topMenuContr").bind("click", function() {
    	if (jQuery(".topMenuDiv_top").height() > 70) {
    		jQuery(this).removeClass("menuNavSpan_Contraction").removeClass("leftcolor");
    		jQuery(this).addClass("menuNavSpan_Expand");
    		topMenuContraction();
    	} else {
    		jQuery(this).removeClass("menuNavSpan_Expand");
    		jQuery(this).addClass("menuNavSpan_Contraction").addClass("leftcolor");
	        topMenuExpand();
	    }
    }); 
});