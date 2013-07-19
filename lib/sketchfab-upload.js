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

  xhr.addEventListener("load", result, false);
  xhr.send(fd);

};