    var toggleFullscreen = function(){
        if(document.fullscreenElement ||
           document.mozFullScreenElement ||
           document.webkitFullscreenElement ||
           document.msFullscreenElement){
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }else{
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.mozRequestFullScreen) {
                document.documentElement.mozRequestFullScreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
            } else if (document.body.msRequestFullscreen) {
                document.body.msRequestFullscreen();
            }
        }
 
        //更新iframe定位
        update_iframe_pos();
    }
 
    //退出全屏时恢复全屏按钮、iframe的定位方式
    var update_iframe_pos = function(){
        if(document.fullscreenElement ||
            document.mozFullScreenElement ||
            document.webkitFullscreenElement ||
            document.msFullscreenElement){
            $("#ifr_diagnose").addClass("ifr_fixed");
            $("#fullscreen").addClass("full_fixed");
        }else{
            $("#ifr_diagnose").removeClass("ifr_fixed");
            $("#fullscreen").removeClass("full_fixed");
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