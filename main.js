require.config({
  baseUrl: 'src'
});

require([
  'Sculptgl'
], function (SculptGL) {

  'use strict';

  (function () {
    var vendors = ['moz', 'webkit'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
      window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    }
    if (!window.requestAnimationFrame)
      window.alert('browser is too old. Probably no webgl there anyway');
  }());

  var sculptgl = new SculptGL();
  sculptgl.start();
});