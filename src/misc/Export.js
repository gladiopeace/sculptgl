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
    // return Export.exportAsciiPLY(mesh);
    return Export.exportBinaryPLY(mesh);
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

  /** Export Ascii PLY file */
  Export.exportBinaryPLY = function (mesh) {
    var vAr = mesh.verticesXYZ_;
    var cAr = mesh.colorsRGB_;
    var iAr = mesh.indicesABC_;
    var nbVertices = mesh.getNbVertices();
    var nbTriangles = mesh.getNbTriangles();
    var header = 'ply\nformat binary_little_endian 1.0\ncomment created by SculptGL\n';
    header += 'element vertex ' + nbVertices + '\n';
    header += 'property float x\nproperty float y\nproperty float z\n';
    header += 'property uchar red\nproperty uchar green\nproperty uchar blue\n';
    header += 'element face ' + nbTriangles + '\n';
    header += 'property list uchar uint vertex_indices\nend_header\n';

    var i = 0;
    var j = 0;
    var k = 0;

    var headerSize = header.length;
    var vertSize = vAr.length * 4 + cAr.length;
    var indexSize = iAr.length * 4 + nbTriangles;
    var totalSize = headerSize + vertSize + indexSize;
    var data = new Uint8Array(totalSize);

    j = header.length;
    for (i = 0; i < j; ++i) {
      data[i] = header.charCodeAt(i);
    }

    var verBuffer = new Uint8Array(vAr.buffer);
    var offset = headerSize;
    for (i = 0; i < nbVertices; ++i) {
      j = i * 12;
      k = offset + i * 15;
      data[k] = verBuffer[j];
      data[k + 1] = verBuffer[j + 1];
      data[k + 2] = verBuffer[j + 2];
      data[k + 3] = verBuffer[j + 3];
      data[k + 4] = verBuffer[j + 4];
      data[k + 5] = verBuffer[j + 5];
      data[k + 6] = verBuffer[j + 6];
      data[k + 7] = verBuffer[j + 7];
      data[k + 8] = verBuffer[j + 8];
      data[k + 9] = verBuffer[j + 9];
      data[k + 10] = verBuffer[j + 10];
      data[k + 11] = verBuffer[j + 11];
      j = i * 3;
      data[k + 12] = (cAr[j] * 0xff) | 0;
      data[k + 13] = (cAr[j + 1] * 0xff) | 0;
      data[k + 14] = (cAr[j + 2] * 0xff) | 0;
    }

    var bufIndex = new Uint8Array(iAr.buffer);
    offset += vertSize;
    for (i = 0; i < nbTriangles; ++i) {
      j = i * 12;
      k = offset + i * 13;
      data[k] = 3;
      data[k + 1] = bufIndex[j];
      data[k + 2] = bufIndex[j + 1];
      data[k + 3] = bufIndex[j + 2];
      data[k + 4] = bufIndex[j + 3];
      data[k + 5] = bufIndex[j + 4];
      data[k + 6] = bufIndex[j + 5];
      data[k + 7] = bufIndex[j + 6];
      data[k + 8] = bufIndex[j + 7];
      data[k + 9] = bufIndex[j + 8];
      data[k + 10] = bufIndex[j + 9];
      data[k + 11] = bufIndex[j + 10];
      data[k + 12] = bufIndex[j + 11];
    }
    return data;
  };

  Export.exportSpecularMtl = function () {
    var data = 'newmtl specular\n';
    data += 'Ks 1.0 1.0 1.0\n';
    data += 'Ns 200.0\n';
    data += 'd 1.0\n'; // no transparency
    return data;
  };

  /** Export OBJ file to Sketchfab */
  Export.exportSketchfab = function (mesh) {
    // create a zip containing the .obj model
    // var data = Export.exportOBJ(mesh, 'specular');
    // var mtl = Export.exportSpecularMtl();
    // var zip = new window.JSZip();
    // zip.file('model.obj', data);
    // zip.file('specular.mtl', mtl);

    var data = Export.exportBinaryPLY(mesh);
    var options = {
      'fileModel': new Blob([data]),
      'filenameModel': 'model.ply',
      'title': ''
    };

    window.Sketchfab.showUploader(options);
  };

  return Export;
});