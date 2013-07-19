/**
Toolkit to upload files to the Sketchfab API

Usage:
	// upload to sketchfab
	Sketchfab.upload({fileModel: blob, filenameModel:"model.zip", title:"My Model"}, callback);

	// dislay an upload window
	Sketchfab.showUploader({fileModel: blob, filenameModel:"model.zip"}, callback);

*/

var Sketchfab = Sketchfab || {};

/**
 *
 * @param options 
 * @param callback callback function that will be called afer upload error or success
 */
Sketchfab.upload = function(options, callback) {

  var fd = new FormData();

  for (var prop in options) {
	fd.append(prop, options[prop]);
  }

  var xhr = new XMLHttpRequest();
  xhr.open("POST", 'https://api.sketchfab.com/v1/models');

  var result = function(data) {
    var res = JSON.parse(xhr.responseText);
	return callback(null, res);
  };

  var updateProgress = function(oEvent) {
    if(oEvent.lengthComputable) {
      var percentComplete = oEvent.loaded * 100.0 / oEvent.total;
      $("div.skfb-uploader p").html("Uploading... "+ percentComplete + " % completed");
    }
  }

  xhr.addEventListener("load", result, false);
  xhr.addEventListener("progress", updateProgress, false);
  xhr.send(fd);

};

Sketchfab.showUploader = function(options, callback) {

  // Dynamically insert stylesheet
  // This is quite ugly, we should use somethign like requiretxt to do it
  var sheet = document.createElement('style');
  sheet.innerHTML = ".skfb-uploader { "
                    + "position:absolute; top: 50%; left: 50%; "
                    + "width:300px; height: 200px; margin-left: -150px; margin-top: -100px; "
                    + "background-color: white; "
                  + "}" 
                  + ".skfb-uploader .btn { }" ;
  document.body.appendChild(sheet);

  var formTpl = _.template("<p><label>Title:</label><input type='text' value='<%= title %>' class='js-data-title'></input></p>"
                              + "<a class='btn js-cancel' href='#'>Cancel</a><a class='btn js-ok' href='#'>Upload</a>");

  var uploadTpl = _.template("<p>Uploading...</p>");

  var successTpl = _.template("<h1>Upload Success</h1>" 
                              + "<p><a href='<%= url %>' target='_blank'>See your model on sketchfab.com</a></p>" 
                              + "<p><label>Share URL:</label><input type='text' value='<%= url %>'></input></p>");

  // TODO display error message
  var errorTpl = _.template("<h1>Upload Error</h1>" 
                              + "<p>There was an error uploading your model</p>");


  // Create the upload box
  var uploaderbox = document.createElement('div');
  uploaderbox.className = "skfb-uploader";
  document.body.appendChild(uploaderbox);

  uploaderbox.innerHTML = formTpl(options);


  var onUpload = function(err, data) {
    if(err) { 
        uploaderbox.innerHTML = errorTpl();
    }
    var url = "https://sketchfab.com/show/" + data.result.id;
    uploaderbox.innerHTML = successTpl({url : url});
  };

  var onClick = function(evt) {
    // get the new title
    var titleElement = uploaderbox.querySelector('.js-data-title');
    options.title = titleElement.value;

    uploaderbox.innerHTML = uploadTpl();
    Sketchfab.upload(options, onUpload);

    evt.preventDefault();
  };

  var onCancel = function(evt) {
    // delete the upload box
    uploaderbox.parentNode.removeChild(uploaderbox);
    evt.preventDefault();
  };

  var okBtn = uploaderbox.querySelector('.js-ok');
  okBtn.addEventListener("click", onClick);

  var cancelBtn = uploaderbox.querySelector('.js-cancel');
  cancelBtn.addEventListener("click", onCancel);

};