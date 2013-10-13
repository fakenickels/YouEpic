$(function(){
	var form = $('#urls-form'), 
		inputsField = $('#inputs-field'),
		commentsBox = $('#comments-box'),
		totalInputs = 1;

	$('#urls-form').submit(function(e){
		e.preventDefault();

		$('button[type=submit]', this).addClass('disabled').text('Aguarde...');

		forceLogin(function( response ){
			console.log('forceLogin called');
			if( response == 'ok' ){
				var urls = inputsField.find('input').vals(), 
					total = urls.length-1,
					comments = [];

				$.each(urls, function(i, url){
					var urlID = parseObjID(url);

					//TODO: Check a other user [user friend] comments too 
					console.log('preparing to get comments from ' + urlID);
					console.log('total ' + total)
					getComments(urlID, null, function(data){
						console.log('parsing comments from ' + urlID, 'id ' + i)
						comments = comments.concat(data);

						console.log('Am I here?');
						if( i == total)
							showComments( comments );
					});
				})
			}
		})
	});

	$('#add-url').click(function(){
		addInput();
	});

	$('button.url-remove-btn', form).click(function(){
		$(this).parent().remove();
	});

	function showComments( comments ){
		console.log('preparing to show commments');
		console.log(comments);
		$('button[type=submit]', this).text('Pronto');
		$.each( comments, function(i, comment){
			//TODO: Finish this later. Okay?
			var div = '<div class="comment well">';
				div += '<h3>' + comment.text + '</h3>';
				div += '<p class="lead">'+ comment.likes +' Likes</p>';
				div += '<p class="lead">'+ comment.comment_count +'  replies</p>';
				div += '</div>';

			div = $(div);
			console.log(div);

			div.appendTo(commentsBox);
		});
	}

	function checkLogin(fns){
		var status = '';
		FB.getLoginStatus(function(status){
			if(status.status == 'connected') fns.success();
			else fns.error();
		})
	}

	function forceLogin( fn ){
		checkLogin({
			success: function(){
				console.log("Hey, you're logged!");
				fn('ok')
			},
			error: function(){
				FB.login(function(){
					checkLogin();
				}, {scope: 'user_photos,user_videos,user_status'});
			}
		});		
	}

	function parseObjID( url ){
		var id = url.match(/(fbid=\d+)|(permalink\/\d+)/g);
			id = id[0].match(/\d+/g);

		return id[0]; 
	}

	function getComments( objID, userID, fn ){
		var fql = 'SELECT fromid, likes, time, comment_count, text FROM comment WHERE post_id = $id';
			fql = fql.replace('$id', objID);

		var userComments = [];
		FB.api({
			method: 'fql.query',
			query: fql
		}, function(data){
			userID = userID || FB.getUserID();

			$.each(data, function(i, obj){
				console.log( 'validating user ' + (obj.fromid == userID) )
				if( obj.fromid == userID )
					userComments.push( obj );
			});

			console.log(userComments)
			fn( userComments );
		})
	}

	function addInput(){
		var div = '<div class="form-group">'
			div += "<input type='url' class='form-control' name='form-url-$id' placeholder='http://facebook.com/something-else'/>";
			div += "<button type='button' ref-url='$id' class='btn btn-danger url-remove-btn'>remover</button>";
			div += '</div>';
			div.replace(/\$id/g, totalInputs);
			totalInputs++;

			div = $(div);

			div.find('button').bind('click', delInput);
			div.appendTo(inputsField);
	}

	function delInput( el ){
		$(this).parent().remove();
	}

	$.fn.vals = function( filter ){
		var vals = [];

		$(this).each(function(){
			vals.push( $(this).val() );
		});

		return vals;
	}
});