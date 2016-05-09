define([
  'lib/jQuery',
  'misc/Utils'
], function ($, Utils) {

  'use strict';

  var normalizeArray = function (array) {
    for (var i = 0, l = array.length; i < l; ++i) {
      var j = i * 3;
      var nx = array[j];
      var ny = array[j + 1];
      var nz = array[j + 2];
      var len = 1.0 / Math.sqrt(nx * nx + ny * ny + nz * nz);
      array[j] *= len;
      array[j + 1] *= len;
      array[j + 2] *= len;
    }
    return array;
  };

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
    return new Blob([data]);
  };

  /** Export STL file */
  Export.exportSTL = function (mesh) {
    return Export.exportBinarySTL(mesh);
  };

  /** Export Ascii STL file */
  Export.exportAsciiSTL = function (mesh) {
    var vAr = mesh.verticesXYZ_;
    var iAr = mesh.indicesABC_;
    var triNormals = normalizeArray(new Float32Array(mesh.triNormalsXYZ_));
    normalizeArray(mesh.triNormalsXYZ_, triNormals);
    var data = 'solid mesh\n';
    var nbTriangles = mesh.getNbTriangles();
    for (var i = 0; i < nbTriangles; ++i) {
      var j = i * 3;
      data += ' facet normal ' + triNormals[j] + ' ' + triNormals[j + 1] + ' ' + triNormals[j + 2] + '\n';
      data += '  outer loop\n';
      var iv1 = iAr[j] * 3;
      var iv2 = iAr[j + 1] * 3;
      var iv3 = iAr[j + 2] * 3;
      data += '   vertex ' + vAr[iv1] + ' ' + vAr[iv1 + 1] + ' ' + vAr[iv1 + 2] + '\n';
      data += '   vertex ' + vAr[iv2] + ' ' + vAr[iv2 + 1] + ' ' + vAr[iv2 + 2] + '\n';
      data += '   vertex ' + vAr[iv3] + ' ' + vAr[iv3 + 1] + ' ' + vAr[iv3 + 2] + '\n';
      data += '  endloop\n';
      data += ' endfacet\n';
    }
    data += 'endsolid mesh\n';
    return new Blob([data]);
  };

  /** Export binary STL file */
  Export.exportBinarySTL = function (mesh) {
    var vAr = mesh.verticesXYZ_;
    var iAr = mesh.indicesABC_;
    var triNormals = normalizeArray(new Float32Array(mesh.triNormalsXYZ_));
    var nbTriangles = mesh.getNbTriangles();

    var data = new Uint8Array(84 + nbTriangles * 50);
    var nbTriBuff = new Uint8Array(new Uint32Array([nbTriangles]).buffer);
    data.set(nbTriBuff, 80);

    var verBuffer = new Uint8Array(vAr.buffer);
    var norBuffer = new Uint8Array(triNormals.buffer);
    var offset = 84;
    var inc = 0;
    for (var i = 0; i < nbTriangles; ++i) {
      var k = i * 12;
      for (inc = 0; inc < 12; ++inc) {
        data[offset++] = norBuffer[k++];
      }
      k = i * 3;
      var iv1 = iAr[k] * 12;
      for (inc = 0; inc < 12; ++inc) {
        data[offset++] = verBuffer[iv1++];
      }
      var iv2 = iAr[k + 1] * 12;
      for (inc = 0; inc < 12; ++inc) {
        data[offset++] = verBuffer[iv2++];
      }
      var iv3 = iAr[k + 2] * 12;
      for (inc = 0; inc < 12; ++inc) {
        data[offset++] = verBuffer[iv3++];
      }
      offset += 2;
    }
    return new Blob([data]);
  };

  /** Export PLY file */
  Export.exportPLY = function (mesh) {
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
    var i = 0;
    var j = 0;
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
    return new Blob([data]);
  };

  /** Export binary PLY file */
  Export.exportBinaryPLY = function (mesh) {
    var vAr = mesh.verticesXYZ_;
    var cAr = mesh.colorsRGB_;
    var iAr = mesh.indicesABC_;
    var nbVertices = mesh.getNbVertices();
    var nbTriangles = mesh.getNbTriangles();
    var endian = Utils.littleEndian ? 'little' : 'big';
    var header = 'ply\nformat binary_' + endian + '_endian 1.0\ncomment created by SculptGL\n';
    header += 'element vertex ' + nbVertices + '\n';
    header += 'property float x\nproperty float y\nproperty float z\n';
    header += 'property uchar red\nproperty uchar green\nproperty uchar blue\n';
    header += 'element face ' + nbTriangles + '\n';
    header += 'property list uchar uint vertex_indices\nend_header\n';

    var i = 0;
    var j = 0;
    var k = 0;
    var inc = 0;

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
      for (inc = 0; inc < 12; ++inc) {
        data[k++] = verBuffer[j++];
      }
      j = i * 3;
      data[k] = (cAr[j] * 0xff) | 0;
      data[k + 1] = (cAr[j + 1] * 0xff) | 0;
      data[k + 2] = (cAr[j + 2] * 0xff) | 0;
    }

    var bufIndex = new Uint8Array(iAr.buffer);
    offset += vertSize;
    for (i = 0; i < nbTriangles; ++i) {
      j = i * 12;
      k = offset + i * 13;
      data[k] = 3;
      for (inc = 0; inc < 12; ++inc) {
        data[++k] = bufIndex[j++];
      }
    }
    return new Blob([data]);
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
    // var blob = Export.exportOBJ(mesh, 'specular');

    var verts = mesh.verticesXYZ_;
    var tempRot = new Float32Array(verts.length);
    for (var i = 0, l = verts.length / 3; i < l; ++i) {
      var j = i * 3;
      tempRot[j] = verts[j];
      tempRot[j + 1] = -verts[j + 2];
      tempRot[j + 2] = verts[j + 1];
    }
    mesh.verticesXYZ_ = tempRot;
    var blob = Export.exportBinaryPLY(mesh);
    mesh.verticesXYZ_ = verts;

    var zip = window.zip;
    zip.useWebWorkers = true;
    zip.workerScriptsPath = 'lib/';
    zip.createWriter(new zip.BlobWriter('application/zip'), function (writer) {
      writer.add('easteregg.ply', new zip.BlobReader(blob), function () {
        writer.close(function (compressed) {
          var options = {
            'fileModel': compressed,
            'filenameModel': 'easteregg.zip',
            'title': ''
          };
          window.Sketchfab.showUploader(options);
          // Prevent shortcut keys from triggering in Sketchfab export
          $('.skfb-uploader').on('keydown', function (e) {
            e.stopPropagation();
          });
        });
      }, function ( /*currentIndex, totalIndex*/ ) {});
    }, function ( /*error*/ ) {});
  };

  return Export;
});