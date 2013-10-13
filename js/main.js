$(function(){
	function checkLogin(fns){
		var status = '';
		FB.getLoginStatus(function(status){
			if(status.status == 'connected') fns.success();
			else fns.error();
		})
	}

	checkLogin({
		success: function(){
			console.log("Hey, you're logged!")
		},
		error: function(){
			console.log('You refused!');
		}
	})
});