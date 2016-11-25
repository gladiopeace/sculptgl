/**
   Toolkit to upload files to the Sketchfab API

   Usage:
   // upload to sketchfab
   Sketchfab.upload({fileModel: blob, filenameModel:"model.zip", title:"My Model"}, callback);

   // dislay an upload window
   Sketchfab.showUploader({fileModel: blob, filenameModel:"model.zip"}, callback);

*/

var Sketchfab = Sketchfab || {};
var demoToken = 'babc9a5cd4f343f9be0c7bd9cf93600c'; // demo account
var token = demoToken;
var api = 'https://api.sketchfab.com';

Sketchfab._me = null;
Sketchfab.me = function() {
    return Sketchfab._me;
}

/**
 *
 * @param options
 * @param callback callback function that will be called afer upload error or success
 */
Sketchfab.upload = function(options, callback) {

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

    var result = function(data) {
        var res = JSON.parse(xhr.responseText);
	    return callback(null, res);
    };

    var updateProgress = function(oEvent) {
        // if(oEvent.lengthComputable) {
        //     var percentComplete = oEvent.loaded * 100.0 / oEvent.total;
        //     uploaderbox.querySelector(".percentage").innerHTML = percentComplete + '%';
        // }
    };

    var transferCanceled = function(event) {
        console.log(xhr.status);
        console.log(event);
    };

    var transferFailed = transferCanceled;

    xhr.addEventListener("error", transferFailed, false);
    xhr.addEventListener("load", result, false);
    xhr.addEventListener("progress", updateProgress, false);
    xhr.addEventListener("abort", transferCanceled, false);

    xhr.setRequestHeader("Authorization", "Token " + options.token);
    xhr.send(fd);

};

Sketchfab.showUploader = function(options, callback) {


    // Dynamically insert stylesheet
    // This is quite ugly, we should use somethign like requiretxt to do it
    var sheet = document.createElement('style');
    sheet.innerHTML = ".skfb-uploader { "
        + "position:absolute; top: 50%; left: 50%; "
        + "width:440px; height: 440px; margin-left: -235px; margin-top: -235px; padding: 15px 30px; "
        + "background-color: #222; "
        + "}"
        + ".skfb-uploader .btn { }" ;
    document.body.appendChild(sheet);

    var formTpl = _.template("<h1>Publish to Sketchfab</h1>"
                             + "<p id='login-status'></p>"
                             + "<div><input type='text' value='<%= name %>' placeholder='Model name' class='js-data-title'></input></div>"
                             + "<div><textarea value='' placeholder='Model description (optional)' class='js-data-description'></textarea></div>"
                             + "<a class='cancel js-cancel' href='#'><i class='icon-remove'></i></a><a class='upload-button btn js-ok' href='#'>Publish model</a>");

    var uploadTpl = _.template("<p>Uploading...</p>");

    var successTpl = _.template("<h1>Success!</h1>"
                                + "<div><p class='success'>Your model has been published to Sketchfab.com</p></div>"
                                + "<div><a href='<%= url %>' target='_blank' class='btn direct-link'>See your model on sketchfab.com</a></div>"
                                + "<div><label>Share URL</label><input type='text' value='<%= url %>' readonly></input></div>"
                                + "<a class='cancel js-cancel' href='#'><i class='icon-remove'></i></a>");

    // TODO display error message
    var errorTpl = _.template("<h1>Upload Error</h1>"
                              + "<p>There was an error uploading your model</p>"
                              + "<a class='cancel js-cancel' href='#'><i class='icon-remove'></i></a>");


    // Create the upload box
    var uploaderbox = document.createElement('div');
    uploaderbox.className = "skfb-uploader";
    document.body.appendChild(uploaderbox);

    uploaderbox.innerHTML = formTpl(options);

    var me = Sketchfab.me();
    if (!Sketchfab.me()) {
        $('#login-status').html("You are not logged into Sketchfab, the model will be published to a demo account or you can <a href='https://sketchfab.com/login' target='_blank'> sign into Sketchfab</a>");
        token = demoToken;
    } else {
        $('#login-status').html("Your are logged into Sketchfab, the model will be uploaded to your account");
        token = me.accessToken;
    }

    var bindCancelButton = function() {
        var cancelBtn = uploaderbox.querySelector('.js-cancel');
        cancelBtn.addEventListener("click", onCancel);
    };

    var onClick = function(evt) {
        // get the new title
        var titleElement = uploaderbox.querySelector('.js-data-title');
        var descriptionElement = uploaderbox.querySelector('.js-data-description');
        var button = uploaderbox.querySelector('.upload-button');
        options.name = titleElement.value;
        options.description = descriptionElement.value;
        options.token = token;
        button.classList.add('uploading');
        button.innerHTML = '<span class="spinner"></span> Uploading... <span class="percentage"></span>';

        Sketchfab.upload(options, function(err, data) {
            if(err || data.error !== undefined) {
                uploaderbox.innerHTML = errorTpl();
            } else {
                var url = "https://sketchfab.com/models/" + data.uid;
                uploaderbox.innerHTML = successTpl({url : url});
                bindCancelButton();
            }
        });

        evt.preventDefault();
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
