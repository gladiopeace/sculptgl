define([], function () {

  'use strict';

  var Export = {};

  /** Export OBJ file */
  Export.exportOBJ = function (mesh, mtl_name) {
    var vAr = mesh.verticesXYZ_;
    var cAr = mesh.colorsRGB_;
    var iAr = mesh.indicesABC_;
    var data = 's 0\n';
    if (mtl_name) {
      data += 'mtllib ' + mtl_name + '.mtl\n';
      data += 'usemtl ' + mtl_name + '\n';
    }
    var nbVertices = mesh.getNbVertices();
    var nbTriangles = mesh.getNbTriangles();
    var i = 0,
      j = 0;
    for (i = 0; i < nbVertices; ++i) {
      j = i * 3;
      if (mtl_name)
        data += 'v ' + vAr[j] + ' ' + vAr[j + 1] + ' ' + vAr[j + 2] + ' ' + cAr[j] + ' ' + cAr[j + 1] + ' ' + cAr[j + 2] + '\n';
      else
        data += 'v ' + vAr[j] + ' ' + vAr[j + 1] + ' ' + vAr[j + 2] + '\n';
    }
    for (i = 0; i < nbTriangles; ++i) {
      j = i * 3;
      data += 'f ' + (1 + iAr[j]) + ' ' + (1 + iAr[j + 1]) + ' ' + (1 + iAr[j + 2]) + '\n';
    }
    return data;
  };

  /** Export STL file */
  Export.exportSTL = function (mesh) {
    return Export.exportAsciiSTL(mesh);
  };

  /** Export Ascii STL file */
  Export.exportAsciiSTL = function (mesh) {
    var vAr = mesh.verticesXYZ_;
    var iAr = mesh.indicesABC_;
    var triNormals = mesh.triNormalsXYZ_;
    var data = 'solid mesh\n';
    var nbTriangles = mesh.getNbTriangles();
    var i = 0,
      j = 0;
    for (i = 0; i < nbTriangles; ++i) {
      j = i * 3;
      data += ' facet normal ' + triNormals[j] + ' ' + triNormals[j + 1] + ' ' + triNormals[j + 2] + '\n';
      data += '  outer loop\n';
      var iv1 = iAr[j] * 3,
        iv2 = iAr[j + 1] * 3,
        iv3 = iAr[j + 2] * 3;
      data += '   vertex ' + vAr[iv1] + ' ' + vAr[iv1 + 1] + ' ' + vAr[iv1 + 2] + '\n';
      data += '   vertex ' + vAr[iv2] + ' ' + vAr[iv2 + 1] + ' ' + vAr[iv2 + 2] + '\n';
      data += '   vertex ' + vAr[iv3] + ' ' + vAr[iv3 + 1] + ' ' + vAr[iv3 + 2] + '\n';
      data += '  endloop\n';
      data += ' endfacet\n';
    }
    data += 'endsolid mesh\n';
    return data;
  };

  /** Export PLY file */
  Export.exportPLY = function (mesh) {
    return Export.exportAsciiPLY(mesh);
  };

  /** Export Ascii PLY file */
  Export.exportAsciiPLY = function (mesh) {
    var vAr = mesh.verticesXYZ_;
    var cAr = mesh.colorsRGB_;
    var iAr = mesh.indicesABC_;
    var data = 'ply\nformat ascii 1.0\ncomment created by SculptGL\n';
    var nbVertices = mesh.getNbVertices();
    var nbTriangles = mesh.getNbTriangles();
    var i = 0,
      j = 0;
    data += 'element vertex ' + nbVertices + '\n';
    data += 'property float x\nproperty float y\nproperty float z\n';
    data += 'property uchar red\nproperty uchar green\nproperty uchar blue\n';
    data += 'element face ' + nbTriangles + '\n';
    data += 'property list uchar uint vertex_indices\nend_header\n';
    for (i = 0; i < nbVertices; ++i) {
      j = i * 3;
      data += vAr[j] + ' ' +
        vAr[j + 1] + ' ' +
        vAr[j + 2] + ' ' +
        ((cAr[j] * 0xff) | 0) + ' ' +
        ((cAr[j + 1] * 0xff) | 0) + ' ' +
        ((cAr[j + 2] * 0xff) | 0) + '\n';
    }
    for (i = 0; i < nbTriangles; ++i) {
      j = i * 3;
      data += '3 ' + iAr[j] + ' ' + iAr[j + 1] + ' ' + iAr[j + 2] + '\n';
    }
    return data;
  };

  /** Export OBJ file to Sketchfab */
  Export.exportSketchfab = function (mesh) {
    // create a zip containing the .obj model
    var model = Export.exportOBJ(mesh, 'specular');
    var mtl = Export.exportSpecularMtl();
    var zip = new window.JSZip();
    zip.file('model.obj', model);
    zip.file('specular.mtl', mtl);
    var blob = zip.generate({
      type: 'blob',
      compression: 'DEFLATE'
    });

    var options = {
      'fileModel': blob,
      'filenameModel': 'model.zip',
      'title': ''
    };

    window.Sketchfab.showUploader(options);
  };

  return Export;
});