define([
  'lib/jQuery',
  'lib/Dat',
  'lib/FileSaver',
  'math3d/Camera',
  'editor/Sculpt',
  'object/Shader',
  'object/Render',
  'states/StateMultiresolution',
  'misc/Export',
  'misc/Tablet'
], function ($, Dat, saveAs, Camera, Sculpt, Shader, Render, StateMultiresolution, Export, Tablet) {

  'use strict';

  function Gui(sculptgl) {
    this.sculptgl_ = sculptgl; //main application

    //ui shading
    this.ctrlColor_ = null; //color controller
    this.ctrlFlatShading_ = null; //flat shading controller
    this.ctrlShowWireframe_ = null; //wireframe controller
    this.ctrlShaders_ = null; //shaders controller

    //ui info
    this.ctrlNbVertices_ = null; //display number of vertices controller
    this.ctrlNbTriangles_ = null; //display number of triangles controller

    //ui sculpting
    this.ctrlSculpt_ = null; //sculpt controller
    this.ctrlClay_ = null; //clay sculpting controller
    this.ctrlNegative_ = null; //negative sculpting controller
    this.ctrlContinuous_ = null; //continuous sculpting controller
    this.ctrlSymmetry_ = null; //symmetry controller
    this.ctrlSculptCulling_ = null; //sculpt culling controller
    this.ctrlRadius_ = null; //radius controller
    this.ctrlIntensity_ = null; //intensity sculpting controller

    //ui camera
    this.ctrlCameraType_ = null; //camera type controller
    this.ctrlFov_ = null; //vertical field of view controller
    this.resetCamera_ = this.resetCamera; //reset camera position and rotation

    //files functions
    this.open_ = this.openFile; //open file button (trigger hidden html input...)
    this.saveOBJ_ = this.saveFileAsOBJ; //save mesh as OBJ
    this.savePLY_ = this.saveFileAsPLY; //save mesh as PLY
    this.saveSTL_ = this.saveFileAsSTL; //save mesh as STL

    //online exporters
    this.keySketchfab_ = ''; //sketchfab api key
    this.exportSketchfab_ = this.exportSketchfab; //upload file on sketchfab

    //background functions
    this.resetBg_ = this.resetBackground; //reset background
    this.importBg_ = this.importBackground; //import background image

    //misc
    this.dummyFunc_ = function () {}; //empty function... stupid trick to get a simple button in dat.gui
  }

  Gui.prototype = {
    /** Initialize dat-gui stuffs */
    initGui: function () {
      var guiContainer = document.getElementById('gui-container');
      var guiEditing = new Dat.GUI();
      this.initEditingGui(guiEditing);
      guiContainer.appendChild(guiEditing.domElement);

      this.initGeneralGui();

      var main = this.sculptgl_;
      guiEditing.domElement.addEventListener('mouseout', function () {
        main.focusGui_ = false;
      }, false);
      guiEditing.domElement.addEventListener('mouseout', function () {
        main.focusGui_ = false;
      }, false);
    },
    /** Initialize the general gui (on the left) */
    initGeneralGui: function () {
      var main = this.sculptgl_;

      // File
      $('#load-file').on('click', this.open_.bind(this));
      $('#save-obj').on('click', this.saveOBJ_.bind(this));
      $('#save-ply').on('click', this.savePLY_.bind(this));
      $('#save-stl').on('click', this.saveSTL_.bind(this));

      // History
      $('#undo').on('click', main.undo_.bind(main));
      $('#redo').on('click', main.redo_.bind(main));

      // Reset camera
      $('#resetcamera').on('click', this.resetCamera_.bind(this));

      // Background
      $('#resetbg').on('click', this.resetBg_.bind(this));
      $('#importbg').on('click', this.importBg_.bind(this));

      //Camera fold
      // this.ctrlFov_ = cameraFold.add(main.camera_, 'fov_', 10, 80).name('Fov');
      // this.ctrlFov_.onChange(function (value)
      // {
      //   main.camera_.updateProjection();
      //   main.render();
      // });

      // Options
      $('.togglable').on('click', function () {
        var group = $(this).data('radio');
        if (group) {
          $(this).siblings('li[data-radio=' + group + ']').removeClass('checked');
          $(this).addClass('checked');

          if (group === 'camera-mode') {
            main.camera_.mode_ = (parseInt($(this).data('value'), 10));
          }
          if (group === 'camera-type') {
            main.camera_.type_ = (parseInt($(this).data('value'), 10));
            // self.ctrlFov_.__li.hidden = main.camera_.type_ === Camera.projType.ORTHOGRAPHIC;
            main.camera_.updateProjection();
            main.render();
          }
        } else {
          $(this).toggleClass('checked');

          if ($(this).data('value') === 'radius') {
            Tablet.useOnRadius_ = !Tablet.useOnRadius_;
          } else if ($(this).data('value') === 'intensity') {
            Tablet.useOnIntensity_ = !Tablet.useOnIntensity_;
          } else if ($(this).data('value') === 'pivot') {
            main.camera_.toggleUsePivot();
            main.camera_.usePivot_ = !main.camera_.usePivot_;
            main.render();
          }
        }
      });

      // About
      $('#about').on('click', function () {
        $('#about-popup').addClass('visible');
      });

      $('#about-popup .cancel').on('click', function () {
        $('#about-popup').removeClass('visible');
      });

      // Buttons
      $('#reset').on('click', main.resetEgg_.bind(main));
      $('#export').on('click', this.exportSketchfab_.bind(this));
    },
    /** Initialize the mesh editing gui (on the right) */
    initEditingGui: function (gui) {
      var main = this.sculptgl_;

      //sculpt fold
      var foldSculpt = gui.addFolder('Paint');
      var optionsSculpt = {
        'Brush (1)': Sculpt.tool.BRUSH,
        'Inflate (2)': Sculpt.tool.INFLATE,
        'Rotate (3)': Sculpt.tool.ROTATE,
        'Smooth (4)': Sculpt.tool.SMOOTH,
        'Flatten (5)': Sculpt.tool.FLATTEN,
        'Pinch (6)': Sculpt.tool.PINCH,
        'Crease (7)': Sculpt.tool.CREASE,
        'Drag (8)': Sculpt.tool.DRAG,
        'Paint (9)': Sculpt.tool.COLOR,
        'Scale (0)': Sculpt.tool.SCALE
      };
      this.ctrlSculpt_ = foldSculpt.add(main.sculpt_, 'tool_', optionsSculpt).name('Tool');
      this.ctrlSculpt_.__li.hidden = true;
      // this.ctrlSculpt_.onChange(function (value) {
      //   main.sculpt_.tool_ = parseInt(value, 10);
      //   var tool = main.sculpt_.tool_;
      //   var st = Sculpt.tool;
      //   self.ctrlClay_.__li.hidden = tool !== st.BRUSH;
      //   self.ctrlNegative_.__li.hidden = tool !== st.BRUSH && tool !== st.INFLATE && tool !== st.CREASE;
      //   self.ctrlContinuous_.__li.hidden = tool === st.ROTATE || tool === st.DRAG || tool === st.SCALE;
      //   self.ctrlIntensity_.__li.hidden = self.ctrlContinuous_.__li.hidden;
      //   self.ctrlColor_.__li.hidden = tool !== st.COLOR;
      // });
      // this.ctrlClay_ = foldSculpt.add(main.sculpt_, 'clay_').name('Clay');
      // this.ctrlNegative_ = foldSculpt.add(main.sculpt_, 'negative_').name('Negative (N)');
      // this.ctrlContinuous_ = foldSculpt.add(main, 'continuous_').name('Continuous');
      // this.ctrlSymmetry_ = foldSculpt.add(main, 'symmetry_').name('Symmetry');
      // this.ctrlSculptCulling_ = foldSculpt.add(main.sculpt_, 'culling_').name('Sculpt culling');
      this.ctrlRadius_ = foldSculpt.add(main.picking_, 'rDisplay_', 5, 200).name('Radius');
      this.ctrlIntensity_ = foldSculpt.add(main.sculpt_, 'intensity_', 0, 1).name('Intensity');
      foldSculpt.open();

      //multires fold
      var foldMultires = gui.addFolder('Multires');
      foldMultires.add(this, 'subdivide');
      // foldMultires.add(this, 'lower');
      // foldMultires.add(this, 'higher');
      foldMultires.open();
      foldMultires.__ul.hidden = true;

      //mesh fold
      var foldMesh = gui.addFolder('Mesh');
      this.ctrlNbVertices_ = foldMesh.add(this, 'dummyFunc_').name('Ver : 0');
      this.ctrlNbTriangles_ = foldMesh.add(this, 'dummyFunc_').name('Tri : 0');
      var optionsShaders = {
        'Phong': Shader.mode.PHONG
        //   'Transparency': Shader.mode.TRANSPARENCY,
        //   'Normal shader': Shader.mode.NORMAL,
        //   'Clay': Shader.mode.MATERIAL,
        //   'Chavant': Shader.mode.MATERIAL + 1,
        //   'Skin': Shader.mode.MATERIAL + 2,
        //   'Drink': Shader.mode.MATERIAL + 3,
        //   'Red velvet': Shader.mode.MATERIAL + 4,
        //   'Orange': Shader.mode.MATERIAL + 5,
        //   'Bronze': Shader.mode.MATERIAL + 6
      };
      this.ctrlShaders_ = foldMesh.add(new Shader(), 'type_', optionsShaders).name('Shader');
      this.ctrlShaders_.onChange(function (value) {
        if (main.multimesh_) {
          main.multimesh_.updateShaders(parseInt(value, 10), main.textures_, main.shaders_);
          main.render();
        }
      });
      this.ctrlFlatShading_ = foldMesh.add(new Render(), 'flatShading_').name('flat (slower)');
      this.ctrlFlatShading_.onChange(function (value) {
        if (main.multimesh_) {
          main.multimesh_.setFlatShading(value);
          main.render();
        }
      });
      this.ctrlShowWireframe_ = foldMultires.add(new Render(), 'showWireframe_').name('wireframe');
      this.ctrlShowWireframe_.onChange(function (value) {
        if (main.multimesh_) {
          main.multimesh_.setWireframe(value);
          main.render();
        }
      });

      this.ctrlColor_ = foldSculpt.addColor(main.sculpt_, 'color_').name('Color');
      this.ctrlColor_.onChange(function (value) {
        if (value.length === 3) { // rgb [255, 255, 255]
          main.sculpt_.color_ = [value[0], value[1], value[2]];
        } else if (value.length === 7) { // hex (24 bits style) "#ffaabb"
          var intVal = parseInt(value.slice(1), 16);
          main.sculpt_.color_ = [(intVal >> 16), (intVal >> 8 & 0xff), (intVal & 0xff)];
        } else // fuck it
          main.sculpt_.color_ = [255, 192, 0];
      });
      // this.ctrlColor_.__li.hidden = true;
      foldMesh.open();
      foldMesh.__ul.hidden = true;
    },
    /** Update information on mesh */
    updateMesh: function () {
      var main = this.sculptgl_;
      if (!main.mesh_ || !main.multimesh_)
        return;
      var mesh = main.multimesh_.getCurrent();
      this.ctrlShaders_.object = main.multimesh_.render_.shader_;
      this.ctrlShaders_.updateDisplay();
      this.updateMeshInfo(mesh.getNbVertices(), mesh.getNbTriangles());
    },
    /** Update number of vertices and triangles */
    updateMeshInfo: function (nbVertices, nbTriangles) {
      this.ctrlNbVertices_.name('Ver : ' + nbVertices);
      this.ctrlNbTriangles_.name('Tri : ' + nbTriangles);
    },
    /** Open file */
    openFile: function () {
      $('#fileopen').trigger('click');
    },
    /** Reset background */
    resetBackground: function () {
      var bg = this.sculptgl_.background_;
      if (bg) {
        var gl = bg.gl_;
        gl.deleteTexture(bg.backgroundLoc_);
        this.sculptgl_.background_ = null;
      }
    },
    /** Immort background */
    resetCamera: function () {
      this.sculptgl_.camera_.reset();
      this.sculptgl_.render();
    },
    /** Immort background */
    importBackground: function () {
      $('#backgroundopen').trigger('click');
    },
    /** Save file as OBJ*/
    saveFileAsOBJ: function () {
      if (!this.sculptgl_.mesh_)
        return;
      var blob = Export.exportOBJ(this.sculptgl_.mesh_);
      saveAs(blob, 'yourMesh.obj');
    },
    /** Save file as PLY */
    saveFileAsPLY: function () {
      if (!this.sculptgl_.mesh_)
        return;
      var blob = Export.exportBinaryPLY(this.sculptgl_.mesh_);
      saveAs(blob, 'yourMesh.ply');
    },
    /** Save file as STL */
    saveFileAsSTL: function () {
      if (!this.sculptgl_.mesh_)
        return;
      var blob = Export.exportSTL(this.sculptgl_.mesh_);
      saveAs(blob, 'yourMesh.stl');
    },
    /** Export to Sketchfab */
    exportSketchfab: function () {
      if (!this.sculptgl_.mesh_)
        return;
      Export.exportSketchfab(this.sculptgl_.mesh_);
    },
    /** Subdivide the mesh */
    subdivide: function () {
      var main = this.sculptgl_;
      var mul = main.multimesh_;
      if (mul.sel_ !== mul.meshes_.length - 1)
        return;
      main.states_.pushState(new StateMultiresolution(mul, StateMultiresolution.SUBDIVISION));
      var mesh = mul.addLevel();
      main.mesh_ = mesh;
      this.updateMeshInfo(mesh.getNbVertices(), mesh.getNbTriangles());
      main.render();
    },
    /** Go to lower subdivision level */
    lower: function () {
      var main = this.sculptgl_;
      var mul = main.multimesh_;
      if (mul.sel === 0)
        return;
      main.states_.pushState(new StateMultiresolution(mul, StateMultiresolution.LOWER));
      var mesh = mul.lowerLevel();
      main.mesh_ = mesh;
      this.updateMeshInfo(mesh.getNbVertices(), mesh.getNbTriangles());
      main.render();
    },
    /** Go to higher subdivision level */
    higher: function () {
      var main = this.sculptgl_;
      var mul = main.multimesh_;
      if (mul.sel_ === mul.meshes_.length - 1)
        return;
      main.states_.pushState(new StateMultiresolution(mul, StateMultiresolution.HIGHER));
      var mesh = mul.higherLevel();
      main.mesh_ = mesh;
      this.updateMeshInfo(mesh.getNbVertices(), mesh.getNbTriangles());
      main.render();
    },
    getFlatShading: function () {
      return this.ctrlFlatShading_.getValue();
    },
    getWireframe: function () {
      return this.ctrlShowWireframe_.getValue();
    },
    getShader: function () {
      return this.ctrlShaders_.getValue();
    },
    setSculptTool: function (value) {
      this.ctrlSculpt_.setValue(value);
    },
    setNegative: function (value) {
      this.ctrlNegative_.setValue(value);
    }
  };

  return Gui;
});