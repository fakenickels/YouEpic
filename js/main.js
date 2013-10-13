$(function(){
	var form = $('#urls-form'), 
		inputsField = $('#inputs-field'),
		commentsBox = $('#comments-box'),
		totalInputs = 1;

	$('#urls-form').submit(function(e){
		e.preventDefault();

		$('button[type=submit]', this).addClass('disabled').text('Aguarde...');

		forceLogin(function( response ){
			if( response == 'ok' ){
				var urls = inputsField.find('input').vals(), 
					total = ursl.length-1,
					comments = [];

				$.each(urls, function(i, url){
					var urlID = parseObjID(url);

					getComments(urlID, null, function(data){
						comments.concat(data);

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
		console.log('?')
	});

	function showComments( comments ){
		$.each( comments, function(i, comment){
			var div = '<div class="comment">';
				div += '<p class"lead">' + comment.message + '</p>';
				div += '<p>'+ comment.likes +'Likes</p>';
				div += '<p>'+ comment.comment_count +' replies</p>';
				div += '</div>';

			div = $(div);

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
				if( obj.fromid == userID )
					userComments.push( obj );
			});

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
			val.push( $(this).val() );
		});

		return vals;
	}
});