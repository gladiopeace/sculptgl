/**
   Toolkit to upload files to the Sketchfab API

   Usage:
   // upload to sketchfab
   Sketchfab.upload({fileModel: blob, filenameModel:"model.zip", title:"My Model"}, callback);

   // dislay an upload window
   Sketchfab.showUploader({fileModel: blob, filenameModel:"model.zip"}, callback);

*/

var Sketchfab = Sketchfab || {};
var api = 'https://api.sketchfab.com';

Sketchfab.oauth2Client = new SketchfabOAuth2( {
    hostname: 'sketchfab.com',
    client_id: 'udPPOQZjcb8cWv9twrm6BwswxmhUmKzpTzNaxZZi',
    redirect_uri: 'https://labs.sketchfab.com/sculptfab/authentication.html'
} );

/**
 *
 * @param options
 * @param callback callback function that will be called afer upload error or success
 */
Sketchfab.upload = function(options, token, callback) {

    var fd = new FormData();

    for (var prop in options) {
        if (prop !== 'modelFile') {
            fd.append(prop, options[prop]);
        } else {
            fd.append(prop, options[prop], options['filename']);
        }
    }

    var xhr = new XMLHttpRequest();
    xhr.open("POST", api + '/v2/models', true);

    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            var res = JSON.parse(xhr.responseText);
            switch (xhr.status) {
                case 201:
                    return callback(null, res);
                case 401:
                    return callback(res, null);
            }
        }
    }

    xhr.setRequestHeader("Authorization", "Bearer " + token);
    xhr.send(fd);

};

Sketchfab.showUploader = function(options, callback) {


    // Dynamically insert stylesheet
    // This is quite ugly, we should use somethign like requiretxt to do it
    var sheet = document.createElement('style');
    sheet.innerHTML = ".skfb-uploader { "
        + "position:absolute; top: 50%; left: 50%; "
        + "width:460px; height: 380px; margin-left: -235px; margin-top: -235px; padding: 15px 30px; "
        + "background-color: #222; color: #FFF; "
        + "}"
        + ".skfb-uploader .btn { }"
        + "#login-status { display: none; }" ;
    document.body.appendChild(sheet);

    var formTpl = _.template([
        "<h1>Publish to Sketchfab</h1>",
        "<p id='login-status'></p>",
        "<div><input type='text' value='<%= name %>' placeholder='Model name' class='js-data-title'></input></div>",
        "<div><textarea value='' placeholder='Model description (optional)' class='js-data-description'></textarea></div>",
        "<a class='cancel js-cancel' href='#'><i class='icon-remove'></i></a><a class='upload-button btn js-ok' href='#'>Publish model</a>",
    ].join(''));

    var uploadTpl = _.template("<p>Uploading...</p>");

    var successTpl = _.template([
        "<h1>Success!</h1>",
        "<div><p class='success'>Your model has been published to Sketchfab.com</p></div>",
        "<div><a href='<%= url %>' target='_blank' class='btn direct-link'>See your model on sketchfab.com</a></div>",
        "<div><label>Share URL</label><input type='text' value='<%= url %>' readonly></input></div>",
        "<a class='cancel js-cancel' href='#'><i class='icon-remove'></i></a>",
    ].join(''));

    // TODO display error message
    var errorTpl = _.template([
        "<h1>Upload Error</h1>",
        "<p>There was an error uploading your model</p>",
        "<a class='cancel js-cancel' href='#'><i class='icon-remove'></i></a>",
    ].join(''));

    // Create the upload box
    var uploaderbox = document.createElement('div');
    uploaderbox.className = "skfb-uploader";
    document.body.appendChild(uploaderbox);

    uploaderbox.innerHTML = formTpl(options);

    var bindCancelButton = function() {
        var cancelBtn = uploaderbox.querySelector('.js-cancel');
        cancelBtn.addEventListener("click", onCancel);
    };

    var onClick = function(evt) {

        evt.preventDefault();

        Sketchfab.oauth2Client.connect().then( function onSuccess( grant ) {
            var titleElement = uploaderbox.querySelector('.js-data-title');
            var descriptionElement = uploaderbox.querySelector('.js-data-description');
            var button = uploaderbox.querySelector('.upload-button');
            button.classList.add('uploading');

            options.name = titleElement.value;
            options.description = descriptionElement.value;

            Sketchfab.upload(options, grant.access_token, function(err, data) {
                if(err) {
                    uploaderbox.innerHTML = errorTpl();
                    bindCancelButton();
                } else {
                    var url = "https://sketchfab.com/models/" + data.uid;
                    uploaderbox.innerHTML = successTpl({url : url});
                    bindCancelButton();
                }
            });

        } ).catch( function onError( error ) {
            console.error( error );
            uploaderbox.innerHTML = errorTpl();
            bindCancelButton();
        } );
    };

    var onCancel = function(evt) {
        // delete the upload box
        uploaderbox.parentNode.removeChild(uploaderbox);
        evt.preventDefault();
    };

    var okBtn = uploaderbox.querySelector('.js-ok');
    okBtn.addEventListener("click", onClick);

    bindCancelButton();
};
