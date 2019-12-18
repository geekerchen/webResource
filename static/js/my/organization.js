function checkOrganization() {
	var orgs = [];
	$.ajax({
		type : 'get',
		url : '/organzation/owns',
		contentType : "application/json; charset=utf-8",
		async : false,
		success : function(data) {
			orgs = data;
			$("[permission]").each(function() {
				var per = $(this).attr("permission");
				if ($.inArray(per, data) < 0) {
					$(this).hide();
				}
			});
		}
	});
	
	return orgs;
}