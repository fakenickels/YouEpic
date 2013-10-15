$(function(){
	//TODO: success expection on gh-pages. Oh Jesus!
	var form = $('#urls-form'), 
		inputsField = $('#inputs-field'),
		commentsBox = $('#comments-box'),
		photosBox = $('#photos-watcher'),
		actionBtn = $('button[type=submit]', form),
		totalInputs = 1;

	console.log(actionBtn)

	// MeninoGaiato
	var MG = {
		
		init: function(){

			// #comments-watcher
			$('#urls-form').submit(function(e){
				e.preventDefault();

				actionBtn.addClass('disabled').text('Aguarde...');

				MG.forceLogin(function( response ){
					console.log('forceLogin called');
					if( response == 'ok' ){
						var urls = inputsField.find('input').vals(), 
							total = urls.length-1,
							posts = [];


						$.each(urls, function(i, url){
							var urlID = MG.parseObjID(url), 
								arrForThis = undefined;

							//TODO: Check a other user [user friend] comments too 
							console.log('preparing to get comments from ' + urlID);
							console.log('total (counting from zero) == ' + total)
							MG.getComments(urlID, null, function(data){
								console.log('parsing comments from ' + urlID, 'index ' + i)
								arrForThis = data;
								arrForThis.urlID = urlID;

								posts.push( arrForThis );
								// At last, can show user comments [because AJAX can be slooow]
								if( i == total){
									MG.showComments( posts );
									actionBtn.toggleClass('disabled').text('Pronto');
								}
							});
						})
					}
				}, function(){
					alert('Recarregue a página');
				})
			});

			$('#add-url').click(function(){
				MG.addInput();
			});

			$('button.url-remove-btn', form).click(function(){
				$(this).parent().remove();
			});

			// end of #comments-watcher
			// #photos-watcher

			$('a[href=#photos-watcher]').bind('click', function(){
				console.log('#photos-watcher!');
				$('#photos-watcher .progress').toggleClass('active');
				MG.forceLogin(function(){
					MG.getUserPhotos( 5, function(data){
						MG.showPhotos(data, function(){
							$('#photos-watcher .progress').toggleClass('active');
						})
					});
				}, function(){
					alert('Que tal recarregar a página?')
				});
			});
		},

		localStorage: {
			init: function(){
				if( !localStorage.MeninoGaiato )
					localStorage.setItem(MeninoGaiato, '{ urls: [] }');
			},

			addURL: function( url ){
				var obj = JSON.parse(localStorage.MeninoGaiato);
				if( url.constructor === Array )
					obj.urls.push(url);
				else 
					obj.urls = obj.urls.concat(url);

				localStorage.MeninoGaiato = JSON.stringify(obj);
			},

			delURL: function( url ){
				var obj = JSON.parse(localStorage.MeninoGaiato), newArr = [];

				$.each(obj.urls, function(i, u){
					if( url != u ) newArr.push(u)
				});

				obj.urls = newArr;
				localStorage.MeninoGaiato = JSON.stringify( obj );
			} 
		},

		delInput: function( el ){
			$(this).parent().remove();
		},

		addInput: function(){
			var div = '<div class="form-group well">'
				div += "<input type='url' class='form-control' name='form-url-$id' placeholder='http://facebook.com/something-else'/>";
				div += "<br/><button type='button' ref-url='$id' class='btn btn-danger url-remove-btn'>remover</button>";
				div += '</div>';
				div.replace(/\$id/g, totalInputs);
				totalInputs++;

			div = $(div);

			div.find('button').bind('click', MG.delInput);
			div.appendTo(inputsField);
		},

		parseObjID: function( url ){
			var id = url.match(/(fbid=\d+)|(permalink\/\d+)/g);
				id = id[0].match(/\d+/g);

			return id[0]; 
		},

		//TODO: make MG#getComments support data paging
		getComments: function( objID, userID, fn ){
			var fql = 'SELECT fromid, likes, time, comment_count, post_id_cursor, text FROM comment WHERE post_id = $id';
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

				console.log(userComments)

				// When end of data receiving and parsing
				fn( userComments );
			})
		},

		showComments: function( posts ){
			console.log('preparing to show commments');
			console.log(posts);

			$.each( post, function(i, post){
				//TODO: Finish this later. Okay?
				//TODO: Use templates
				var postDiv = $('<div class="post"><h3>post #' + post.urlID + '</h3></div>');
					postDiv.appendTo(commentsBox);

				$.each(post, function( i, comment){
					var div = '<div class="comment well">';
						div += '<h3>' + comment.text + '</h3>';
						div += '<p class="lead">'+ comment.likes +' Likes</p>';
						div += '<p class="lead">'+ comment.comment_count +'  replies</p>';
						div += '</div>';

					div = $(div);

					div.appendTo(postDiv);
				});
			});
		},

		getUserPhotos: function(limit, fn){
			limit = limit | 3;
			 
			var query = 'SELECT pid, caption, link, like_info, src_big FROM photo WHERE aid IN ( SELECT aid FROM album WHERE owner = me() ) ORDER BY like_info.like_count DESC LIMIT 0,' + limit;
			FB.api({
				method: 'fql.query',
				query: query
			}, function(data){
				console.log('')
				fn(data);
			});
		},		

		showPhotos: function( photos, fn ){
			console.log('preparing to show photos');
			console.log(photos);

			$.each( photos, function(i, photo){
				var div = '<div class="photo well">';
					div += '<img src="'+ photo.src_big +'" />'
					div += '<p class="lead">Curtidas ' + photo.like_info.like_count + '<p>';
					div += '</div>';

				div = $(div);

				div.appendTo(photosBox);
			});

			fn();
		},

		checkLogin: function(fns){
			var status = '';
			FB.getLoginStatus(function(status){
				if(status.status == 'connected') fns.success();
				else fns.error();
			})
		},

		forceLogin: function( fn ){
			MG.checkLogin({
				success: function(){
					console.log("Hey, you're logged!");
					fn('ok')
				},
				error: function(){
					FB.login(function(){
						checkLogin();
					}, {scope: 'user_photos,user_videos,user_status,friends_photos'});
				}
			});		
		},

		sortBy: function( key, objsArr ){
			var sortedArr;

			sortedArr = objsArr.sort(function( a, b ){
				return a[key] < b[key];
			});

			return sortedArr;
		}
	}

	MG.init();

	window.MG = MG;

	$.fn.vals = function( filter ){
		var vals = [];

		$(this).each(function(){
			vals.push( $(this).val() );
		});

		return vals;
	}
});