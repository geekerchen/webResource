(function (a) { /*a("#inputForm .box-footer [class*=col-sm-offset]").append('<div class="form-error">'+a.validator.messages["errorMessage"]+"</div>");*/
    a.extend(a.validator.defaults, {
        ignore: ":hidden:not(.required),input.select2-focusser,hidden",
        errorClass: "has-error",
        errorContainer: ".form-error",
        errorPlacement: function (b, c) {
            if (c.closest(".icheck").size() > 0) {
                c = c.closest(".icheck");
                c.parent().css("position", "relative");
                b.insertAfter(c);
                b.css({top: c.position().top + c.outerHeight() + 2, left: c.position().left + 5});
                return
            }
            if (c.next().hasClass("select2")) {
                c = c.next();
                c.parent().css("position", "relative")
            } else {
                if (c.closest(".input-group").length > 0) {
                    c = c.closest(".input-group");
                    c.parent().css("position", "relative")
                }
            }
            b.insertAfter(c);
            b.css({top: c.position().top + c.outerHeight() - 5, left: c.position().left + 5})
        },
        highlight: function (b) {
            a(b).closest(".form-group").addClass("has-error")
        },
        unhighlight: function (b) {
            a(b).closest(".form-group").removeClass("has-error")
        },
        success: function (b) {
            b.remove()
        }
    })
}(jQuery));
jQuery.validator.addMethod("userName", function (b, a) {
    return this.optional(a) || /^[\u0391-\uFFE5\w]+$/.test(b)
}, $.validator.messages.userName);
jQuery.validator.addMethod("realName", function (b, a) {
    return this.optional(a) || /^[\u4e00-\u9fa5]{2,30}$/.test(b)
}, $.validator.messages.realName);
jQuery.validator.addMethod("abc", function (b, a) {
    return this.optional(a) || /^[a-zA-Z0-9_]*$/.test(b)
}, $.validator.messages.abc);
jQuery.validator.addMethod("noEqualTo", function (b, a, c) {
    return b != $(c).val()
}, $.validator.messages.noEqualTo);
jQuery.validator.addMethod("mobile", function (c, b) {
    var a = /^1[3,4,5,6,7,8,9]\d{9}$/g;
    return this.optional(b) || (a.test(c))
}, $.validator.messages.mobile);
jQuery.validator.addMethod("simplePhone", function (c, b) {
    var a = /^(\d{3,4}-?)?\d{7,9}$/g;
    return this.optional(b) || (a.test(c))
}, $.validator.messages.simplePhone);
jQuery.validator.addMethod("phone", function (c, b) {
    var a = /(^0[1-9]{1}\d{8,10}$)|(^1[3,4,5,6,7,8,9]\d{9}$)/g;
    return this.optional(b) || (a.test(c))
}, $.validator.messages.phone);
jQuery.validator.addMethod("zipCode", function (c, b) {
    var a = /^[0-9]{6}$/;
    return this.optional(b) || (a.test(c))
}, $.validator.messages.zipCode);
jQuery.validator.addMethod("select2", function (c, b) {
    return  c != "-1";
}, $.validator.messages.select2);
$.validator.addMethod("integer", function (b, a) {
    return this.optional(a) || /^-?\d+$/.test(b)
}, $.validator.messages.integer);
$.validator.addMethod("absNum", function (b, a) {
    return this.optional(a) || /^((0{1}\.\d{1,2})|([1-9]\d*\.{1}\d{1,2})|([1-9]+\d*))$/.test(b)
}, $.validator.messages.absNum);
$.validator.addMethod("absInt", function (b, a) {
    return this.optional(a) || /^[1-9]\d*$/.test(b)
}, $.validator.messages.absInt);
$.validator.addMethod("ipv4", function (b, a) {
    return this.optional(a) || /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/i.test(b)
}, $.validator.messages.ipv4);
$.validator.addMethod("ipv6", function (b, a) {
    return this.optional(a) || /^((([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}:[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){5}:([0-9A-Fa-f]{1,4}:)?[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){4}:([0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){3}:([0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){2}:([0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|(([0-9A-Fa-f]{1,4}:){0,5}:((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|(::([0-9A-Fa-f]{1,4}:){0,5}((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|([0-9A-Fa-f]{1,4}::([0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})|(::([0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){1,7}:))$/i.test(b)
}, $.validator.messages.ipv6);
jQuery.validator.addMethod("qq", function (c, b) {
    var a = /^[1-9][0-9]{4,}$/;
    return this.optional(b) || (a.test(c))
}, $.validator.messages.qq);
jQuery.validator.addMethod("idcard", function (b, a) {
    var c = function (g) {
        g = g.toString();
        var i = new Array(true, false, false, false, false);
        var h = {
            11: "北京",
            12: "天津",
            13: "河北",
            14: "山西",
            15: "内蒙古",
            21: "辽宁",
            22: "吉林",
            23: "黑龙江",
            31: "上海",
            32: "江苏",
            33: "浙江",
            34: "安徽",
            35: "福建",
            36: "江西",
            37: "山东",
            41: "河南",
            42: "湖北",
            43: "湖南",
            44: "广东",
            45: "广西",
            46: "海南",
            50: "重庆",
            51: "四川",
            52: "贵州",
            53: "云南",
            54: "西藏",
            61: "陕西",
            62: "甘肃",
            63: "青海",
            64: "宁夏",
            65: "新疆",
            71: "台湾",
            81: "香港",
            82: "澳门",
            91: "国外"
        };
        var g, j, e;
        var f, k;
        var d = new Array();
        d = g.split("");
        if (h[parseInt(g.substr(0, 2))] == null) {
            return i[4]
        }
        switch (g.length) {
            case 15:
                if ((parseInt(g.substr(6, 2)) + 1900) % 4 == 0 || ((parseInt(g.substr(6, 2)) + 1900) % 100 == 0 && (parseInt(g.substr(6, 2)) + 1900) % 4 == 0)) {
                    ereg = /^[1-9][0-9]{5}[0-9]{2}((01|03|05|07|08|10|12)(0[1-9]|[1-2][0-9]|3[0-1])|(04|06|09|11)(0[1-9]|[1-2][0-9]|30)|02(0[1-9]|[1-2][0-9]))[0-9]{3}$/
                } else {
                    ereg = /^[1-9][0-9]{5}[0-9]{2}((01|03|05|07|08|10|12)(0[1-9]|[1-2][0-9]|3[0-1])|(04|06|09|11)(0[1-9]|[1-2][0-9]|30)|02(0[1-9]|1[0-9]|2[0-8]))[0-9]{3}$/
                }
                if (ereg.test(g)) {
                    return i[0]
                } else {
                    return i[2]
                }
                break;
            case 18:
                if (parseInt(g.substr(6, 4)) % 4 == 0 || (parseInt(g.substr(6, 4)) % 100 == 0 && parseInt(g.substr(6, 4)) % 4 == 0)) {
                    ereg = /^[1-9][0-9]{5}19[0-9]{2}((01|03|05|07|08|10|12)(0[1-9]|[1-2][0-9]|3[0-1])|(04|06|09|11)(0[1-9]|[1-2][0-9]|30)|02(0[1-9]|[1-2][0-9]))[0-9]{3}[0-9Xx]$/
                } else {
                    ereg = /^[1-9][0-9]{5}19[0-9]{2}((01|03|05|07|08|10|12)(0[1-9]|[1-2][0-9]|3[0-1])|(04|06|09|11)(0[1-9]|[1-2][0-9]|30)|02(0[1-9]|1[0-9]|2[0-8]))[0-9]{3}[0-9Xx]$/
                }
                if (ereg.test(g)) {
                    f = (parseInt(d[0]) + parseInt(d[10])) * 7 + (parseInt(d[1]) + parseInt(d[11])) * 9 + (parseInt(d[2]) + parseInt(d[12])) * 10 + (parseInt(d[3]) + parseInt(d[13])) * 5 + (parseInt(d[4]) + parseInt(d[14])) * 8 + (parseInt(d[5]) + parseInt(d[15])) * 4 + (parseInt(d[6]) + parseInt(d[16])) * 2 + parseInt(d[7]) * 1 + parseInt(d[8]) * 6 + parseInt(d[9]) * 3;
                    j = f % 11;
                    k = "F";
                    e = "10X98765432";
                    k = e.substr(j, 1);
                    if (k == d[17]) {
                        return i[0]
                    } else {
                        return i[3]
                    }
                } else {
                    return i[2]
                }
                break;
            default:
                return i[1];
                break
        }
    };
    return this.optional(a) || c(b)
}, $.validator.messages.idcard);