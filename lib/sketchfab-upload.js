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
      uploaderbox.querySelector(".percentage").innerHTML = percentComplete + '%';
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
                    + "width:440px; height: 400px; margin-left: -235px; margin-top: -215px; padding: 15px 30px; "
                    + "background-color: #222; "
                  + "}"
                  + ".skfb-uploader .btn { }" ;
  document.body.appendChild(sheet);

  var formTpl = _.template("<h1>Publish to Sketchfab</h1>"
                          + "<div><input type='text' value='<%= title %>' placeholder='Model name' class='js-data-title'></input></div>"
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


  var bindCancelButton = function() {
    var cancelBtn = uploaderbox.querySelector('.js-cancel');
    cancelBtn.addEventListener("click", onCancel);
  };

  var onUpload = function(err, data) {
    if(err) {
        uploaderbox.innerHTML = errorTpl();
    }
    var url = "https://sketchfab.com/show/" + data.result.id;
    uploaderbox.innerHTML = successTpl({url : url});
    bindCancelButton();
    Sketchfab.thumbnail(data.result.id);
  };

  var onClick = function(evt) {
    // get the new title
    var titleElement = uploaderbox.querySelector('.js-data-title');
    var button = uploaderbox.querySelector('.upload-button');
    options.title = titleElement.value;

    button.classList.add('uploading');
    button.innerHTML = '<span class="spinner"></span> Uploading... <span class="percentage"></span>';

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

  bindCancelButton();
};


Sketchfab.thumbnail = function(urlid) {
  var API_TOKEN='7703915b82994083b7fadf31776c2704';
  var fd = new FormData();

  fd.append("token", API_TOKEN);
  fd.append("id", urlid);
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "https://sketchfab.com/v1/models/"+urlid+"/thumbnail");

  var dataURItoBlob = function(dataURI) {
      var byteString;

      if (dataURI.split(',')[0].indexOf('base64') >= 0)
          byteString = atob(dataURI.split(',')[1]);
      else
          byteString = unescape(dataURI.split(',')[1]);
      var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
      // write the bytes of the string to an ArrayBuffer
      var ab = new ArrayBuffer(byteString.length);
      var ia = new Uint8Array(ab);
      for (var i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
      }
      var blob;
      return new Blob([ia], { "type" : mimeString} );
  };

  var createThumbnailFromCanvas = function (data, w, h) {
      var screenShotRatio = 1.0/1.6;
      var widthWanted = 854;
      var size = [ widthWanted, Math.floor(widthWanted*screenShotRatio) ]; //448, 280;
      var img = new Image();
      img.src = data;
      img.onload = function () {
          var canvasImage = document.createElement('canvas');

          canvasImage.setAttribute('width', size[0]);
          canvasImage.setAttribute('height', size[1]);

          var aspectRatio = 1.0/(w/h);
          var targetAspectRatio = screenShotRatio;

          var ctx = canvasImage.getContext('2d', {preserveDrawingBuffer: true});

          var sx = 0;
          var sy = 0;
          var sw = w;
          var sh = h;

          if (aspectRatio < targetAspectRatio) {
              var ww = sh/targetAspectRatio;
              sx = (sw - ww) / 2.0;
              sw = ww;
          } else if (aspectRatio > targetAspectRatio) {
              var hh = sw*targetAspectRatio;
              sy =  (sh-hh)/2;
              sh = hh;
          }

          ctx.fillStyle = "transparent";
          ctx.fillRect(0, 0, size[0], size[1]);
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size[0], size[1]);

          // transform image to blob
          var blob = dataURItoBlob(canvasImage.toDataURL());
          fd.append("image", blob);
          xhr.send(fd);
      };
  };
  var $canvas = $('#canvas')[0];
  createThumbnailFromCanvas($canvas.toDataURL(), $canvas.width, $canvas.height);
};

