$('#urls-form').submit(function(e){
	e.preventDefault();

	actionBtn.addClass('disabled').text('Aguarde...');

	MG.forceLogin(function( response ){
		console.log('forceLogin called');
		if( response == 'ok' ){

			commentsBox.cleanup();
			var comments_urls = inputsField.find('input').vals(), 
				total = urls.length-1,
				posts = [];


			$.each(comments_urls, function(i, url){
				var commentID = MG.parseObjID(url), 
					arrForThis;

				//TODO: Check a other user [user friend] comments too 
				console.log('preparing to get comment ' + commentID);
				MG.getComment(urlID, null, function(data){
					console.log('parsing comments ' + commentID, 'index ' + i)
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
	});
});