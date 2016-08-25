var modelViewLocation;
var modelPostionLocation;
var mouseChoordLocation;
var TriAnimation = function(canvas)
{
  this.gl = null;
  this.mvMatrix = null;
  this.shaderProgram = null;
  this.vertexPositionAttribute = null;
  this.vertexColorAttribute = null;
  this.perspectiveMatrix = null;
  this.objects = [];
  this.mouseAngleX = 0;
  this.mouseAngleY = 0;
};

TriAnimation.prototype.begin = function()
{
  this.pInitWebGL(canvas);      // Initialize the GL context

  // Only continue if WebGL is available and working

  if (this.gl) {
    this.gl.clearColor(1.0, 10.0, 0.0, 0.5);  // Clear to black, fully opaque
    this.gl.clearDepth(1.0);                 // Clear everything
    this.gl.enable(this.gl.DEPTH_TEST);           // Enable depth testing
    this.gl.depthFunc(this.gl.LEQUAL);            // Near things obscure far things
    this.pInitShader();
  }
};

TriAnimation.prototype.update = function(mouseX, mouseY, canvasW, canvasH)
{
  // Clear the canvas before we start drawing on it.

  this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

  // Establish the perspective with which we want to view the
  // scene. Our field of view is 45 degrees, with a width/height
  // ratio of 640:480, and we only want to see objects between 0.1 units
  // and 100 units away from the camera.

  //perspectiveMatrix = makePerspective(90, canvasW/canvasH, 0.1, 100.0);
  perspectiveMatrix = makeOrtho(-100, 100, -100, 100, -100, 100);
  /*
  var test;
  var x = 2*mouseX/canvasW- 1.0;
    var y = 1.0 - (2*mouseY/canvasH); // note: Y axis oriented top -> down in screen space
    var z = -100;

    var invViewProjection = [1.7449455676516328, 0, 0, 0, 0, 0.9999999999999998, 0, 0, 0, 0, 0, -1, 0, 0, -4.995, 5.005];
    
    var m = invViewProjection;
    var w = m[3] * x + m[7] * y + m[11] * z + m[15]; // required for perspective divide
    if (w !== 0){
        var invW = 1.0/w;
        test[0] *= invW;
        test[1] *= invW;
        test[2] *= invW;
    }
  */
  // Set the drawing position to the "identity" point, which is
  // the center of the scene.

  loadIdentity();

  // Now move the drawing position a bit to where we want to start
  // drawing the square.

  mvTranslate([-0.0, 0.0, -1]);
  
  if(this.objects)
  {
    for(var i = 0; i < this.objects.length; i++)
    {
      this.objects[i].update(mouseX, mouseY);
    }
  }
  this.gl.uniform2f(mouseChoordLocation, mouseX / 100, mouseY / 100);
};

TriAnimation.prototype.createShape = function(vertices, colors)
{
  console.log(this.vertexColorAttribute);
  var triangle = new Shape(this.gl, "triangle",vertices,colors,this.vertexPositionAttribute, 
    this.vertexColorAttribute
  );
  triangle.initDraw();
  this.objects.push(triangle);
  console.log(this.objects);
};

TriAnimation.prototype.pInitShader = function()
{
  var fragmentShader = this.pGetShader("shader-fs");
  var vertexShader = this.pGetShader("shader-vs");
  
  // Create the shader program
  
  shaderProgram = this.gl.createProgram();
  this.gl.attachShader(shaderProgram, vertexShader);
  this.gl.attachShader(shaderProgram, fragmentShader);
  this.gl.linkProgram(shaderProgram);
  
  // If creating the shader program failed, alert
  
  if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
  }
  
  this.gl.useProgram(shaderProgram);
  
  this.vertexPositionAttribute = this.gl.getAttribLocation(shaderProgram, "aVertexPosition");
  this.gl.enableVertexAttribArray(this.vertexPositionAttribute);
  
  this.vertexColorAttribute = this.gl.getAttribLocation(shaderProgram, "aVertexColor");
  this.gl.enableVertexAttribArray(this.vertexColorAttribute);
  modelViewLocation = this.gl.getUniformLocation(shaderProgram,"uMVMatrix");
  modelPostionLocation = this.gl.getUniformLocation(shaderProgram, "uPMatrix");
  mouseChoordLocation = this.gl.getUniformLocation(shaderProgram, "mouseCoord");
};

TriAnimation.prototype.pGetShader = function(id)
{
  var shaderScript = document.getElementById(id);

  // Didn't find an element with the specified ID; abort.

  if (!shaderScript) {
    return null;
  }

  // Walk through the source element's children, building the
  // shader source string.

  var theSource = "";
  var currentChild = shaderScript.firstChild;

  while(currentChild) {
    if (currentChild.nodeType == 3) {
      theSource += currentChild.textContent;
    }

    currentChild = currentChild.nextSibling;
  }

  // Now figure out what type of shader script we have,
  // based on its MIME type.

  var shader;

  if (shaderScript.type == "x-shader/x-fragment") {
    shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = this.gl.createShader(this.gl.VERTEX_SHADER);
  } else {
    return null;  // Unknown shader type
  }

  // Send the source to the shader object

  this.gl.shaderSource(shader, theSource);

  // Compile the shader program

  this.gl.compileShader(shader);

  // See if it compiled successfully

  if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
    alert("An error occurred compiling the shaders: " + this.gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
};

TriAnimation.prototype.pInitWebGL = function()
{
  try {
    this.gl = canvas.getContext("experimental-webgl");
  }
  catch(e) {
  }
  // If we don't have a GL context, give up now
  if (!this.gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
};

var Shape = function(gl, shape, vertices, colors, vertexPosAttrib, vertexColorAttrib)
{
  switch(shape)
  {
    case "triangle":
      this.gl = gl;
      this.polygon = Shape.polygon.TRIANGLE;
      this.vertices = vertices; 
      this.currentVertices = vertices;
      this.colors = colors;
      this.centroid = [0,0,0];
      this.pCalcCentroid(vertices);
      this.pVerticesBuffer = null;
      this.pColorsBuffer = null;
      this.vertexPosAttrib = vertexPosAttrib;
      this.vertexColorAttrib = vertexColorAttrib;
      this.currentVector = [0, 0, 0];
      this.currentCentroid = [0, 0, 0];
      this.pCosAngle = 0;
      this.pSinAngle = 0;
      this.pAngle = 0;
      this.pXChange = 0;
      this.pYChange = 0;
      break;
    case "square":
      this.polygon = SQUARE;
      this.vertices = vertices;
      this.pCalcCentroid(vertices);
      break;
    case "trapezoid":
      this.polygon = TRAPEZOID;
      this.vertices = vertices;
      this.pCalcCentroid(vertices);
      break;
    default:
      this.polygon = UNDEFINED;
      this.vertices = NULL;
      console.error("UNDEFINED Shape created");
      break;
  }
};

Shape.polygon = {TRIANGLE:3, SQUARE:4, TRAPEZOID:5, UNDEFINED:0};

//Private functions. Do not use!
Shape.prototype.pCalcCentroid = function(vertices)
{
  var sumX = 0.0;
  var sumY = 0.0;
  var sumZ = 0.0;
  var length = this.vertices.length;
  for(var i = 0; i < this.vertices.length; i++)
  {
    if(i % this.polygon === 0)
    {
      sumX += this.vertices[i];
    }
    else if(i % this.polygon === 1)
    {
      sumY += this.vertices[i]; 
    }
    else if(i % this.polygon === 2)
    {
      sumZ += this.vertices[i];
    }
    //sumX += this.vertices[i][0];
    //sumY += this.vertices[i][1];
  }
  this.centroid[0] = sumX / this.polygon;
  this.centroid[1] = sumY / this.polygon;
  this.centroid[2] = sumZ / this.polygon;
  this.currentCentroid = this.centroid.slice(0);
};

Shape.prototype.initDraw = function()
{
  this.pVerticesBuffer = this.gl.createBuffer();
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.pVerticesBuffer);
  this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.DYNAMIC_DRAW);
  this.pColorsBuffer = this.gl.createBuffer();
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.pColorsBuffer);
  this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.colors), this.gl.DYNAMIC_DRAW);
};

Shape.prototype.update = function(mouseX, mouseY)
{
  //TODO: Change this line to outside of this function
  var rangeForChange = 30;
  //TODO: UPDATE THE LINE BELOW TO WORK WITH DIFFERENT SHAPES
  if(((mouseX >= this.vertices[0] - rangeForChange) && (mouseX <= this.vertices[0] + rangeForChange) && (mouseY >= this.vertices[1] - rangeForChange) && (mouseY <= this.vertices[1] + rangeForChange)) || ((mouseX >= this.vertices[3] - rangeForChange) && (mouseX <= this.vertices[3] + rangeForChange) && (mouseY >= this.vertices[4] - rangeForChange) && (mouseY <= this.vertices[4] + rangeForChange)) || ((mouseX >= this.vertices[6] - rangeForChange) && (mouseX <= this.vertices[6] + rangeForChange) && (mouseY >= this.vertices[7] - rangeForChange) && (mouseY <= this.vertices[7] + rangeForChange)))
  {    //Move triangle to mouse
    var changeX = 0;
    var changeY = 0;
    var rotateAngle = [[Math.cos(0.157079633), -Math.sin(0.157079633)], [Math.sin(0.157079633), Math.cos(0.157079633)]];
    if(((mouseX >= this.vertices[0] - rangeForChange) && (mouseX <= this.vertices[0] + rangeForChange) && (mouseY >= this.vertices[1] - rangeForChange) && (mouseY <= this.vertices[1] + rangeForChange)))
    {
      changeX = (mouseX - this.currentCentroid[0]) / 5;
      changeY = (mouseY - this.currentCentroid[1]) / 5;
      
    }
    else if((mouseX >= this.vertices[3] - rangeForChange) && (mouseX <= this.vertices[3] + rangeForChange) && (mouseY >= this.vertices[4] - rangeForChange) && (mouseY <= this.vertices[4] + rangeForChange))
    {
      changeX = (mouseX - this.currentCentroid[0]) / 5;
      changeY = (mouseY - this.currentCentroid[1]) / 5;
    }
    else
    {
      changeX = (mouseX - this.currentCentroid[0]) / 5;
      changeY = (mouseY - this.currentCentroid[1]) / 5;
    }
    this.pCosAngle = 0.9876883405449989;
    this.pSinAngle = 0.1564344653567952;
    /*
    loadIdentity();
    this.pCosAngle = Math.cos(this.pAngle);
    this.pSinAngle = Math.sin(this.pAngle);
    //this.pCosAngle = 0.9876883405449989;
    //this.pSinAngle = 0.1564344653567952;
    multMatrix(transMatrix);
    //this.currentVertices = multiply(this.currentVertices * transMatrix);
    console.log(this.currentVertices); 
    //console.log(mvMatrix);
    this.pXChange += changeX;
    this.pYChange += changeY;
    */
    //Translating the triangle
    /*
    var current4MVertices = [
      this.currentVertices[0], this.currentVertices[1], this.currentVertices[2], 1,
      this.currentVertices[3], this.currentVertices[4], this.currentVertices[5], 1,
      this.currentVertices[6], this.currentVertices[7], this.currentVertices[8], 1,
      this.currentVertices[9], this.currentVertices[10], this.currentVertices[11], 1,
    ]
    var transMatrix = [
      1, 0, 0, 2,
      0, 1, 0, 1,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
    current4MVertices = mMultiply(current4MVertices, transMatrix);
    var rotMatrix = [
      this.pCosAngle, -this.pSinAngle, 0, 0,
      this.pSinAngle, this.pCosAngle, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
    current4MVertices = mMultiply(current4MVertices, rotMatrix);
    this.currentVertices = [
      current4MVertices[0], current4MVertices[1], current4MVertices[2],
      current4MVertices[4], current4MVertices[5], current4MVertices[6],
      current4MVertices[8], current4MVertices[9], current4MVertices[10],
      current4MVertices[12], current4MVertices[13], current4MVertices[14]
    ] 
    */
    //transMatrix.elements[0][3] = this.pXChange;//Shift in the x direction
    //transMatrix.elements[1][3] = this.pYChange;//Shift in the y direction
    //transMatrix.elements[2][3] = 0;//Shift in the z direction
    //var rotMatrix = Matrix.I(4);

    //rotMatrix.elements[0][0] = this.pCosAngle;//Math.cos(0.157079633);
    //rotMatrix.elements[0][1] = -this.pSinAngle;//-Math.sin(0.157079633);
    //rotMatrix.elements[1][0] = this.pSinAngle;//Math.sin(0.157079633);
    //rotMatrix.elements[1][1] = this.pCosAngle;//Math.cos(0.157079633);
    
    //console.log(Math.cos(0.157079633));//0.9876883405449989
    //console.log("SIN: " + Math.sin(0.157079633));//0.1564344653567952
    /*
    var vMatrix = Matrix.I(4);
    vMatrix.elements[0][0] = 0.5;
    vMatrix.elements[1][1] = 0.5;
    vMatrix.elements[2][2] = 0.5;
    multMatrix(vMatrix);
    this.pAngle += 0.0174532925;
    */
    //this.pCosAngle += 0.999847695;
    //this.pSinAngle += 0.0174524064;
    //mvTranslate([2.0, 1.0, 0]);
    //console.log(mvMatrix);
    //this.gl.uniformMatrix4fv(modelViewLocation, false, [0,0,0,0,1,0,0,0,0,1,0,0,2,1,0,0]);
    //this.gl.uniformMatrix4fv(modelPostionLocation, false, [0,0,0,0,1,0,0,0,0,1,0,0,2,1,0,0])
    /*
    var rotateX = [this.currentVertices[0], this.currentVertices[3], this.currentVertices[6], this.currentCentroid[0]];
    var rotateY = [this.currentVertices[1], this.currentVertices[4], this.currentVertices[7], this.currentCentroid[1]];
    var rotateMatrix = [rotateX, rotateY];
    var rotatedMatrix = multiply(rotateAngle, rotateMatrix);
    this.currentVertices[0] = rotatedMatrix[0][0];
    this.currentVertices[1] = rotatedMatrix[1][0];
    this.currentVertices[3] = rotatedMatrix[0][1];
    this.currentVertices[4] = rotatedMatrix[1][1];
    this.currentVertices[6] = rotatedMatrix[0][2];
    this.currentVertices[7] = rotatedMatrix[1][2];
    this.currentCentroid[0] = rotatedMatrix[0][3];
    this.currentCentroid[1] = rotatedMatrix[1][3];

    this.currentVertices[0] += changeX;//(mouseX - this.currentVertices[0]);
    this.currentVertices[3] += changeX;//(mouseX - this.currentVertices[3]);
    this.currentVertices[6] += changeX;//(mouseX - this.currentVertices[6]);
    this.currentVertices[1] += changeY;//(mouseY - this.currentVertices[1]);
    this.currentVertices[4] += changeY;//(mouseY - this.currentVertices[4]);
    this.currentVertices[7] += changeY;//(mouseY - this.currentVertices[7]);
    this.currentCentroid[0] += changeX;
    this.currentCentroid[1] += changeY;*/
    
  }
  else
  {
    this.currentVertices = this.vertices.slice(0);
    this.currentCentroid = this.centroid.slice(0);
    this.pAngle = 0;
    this.pCosAngle = 0;
    this.pSinAngle = 0;
    this.pXChange = 0;
    this.pYChange = 0;
  }
  
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.pVerticesBuffer);
  this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.currentVertices), this.gl.DYNAMIC_DRAW);//DYNAMIC_DRAW is for things that are drawn multiple times
  this.gl.vertexAttribPointer(this.vertexPositionAttrib, 3, this.gl.FLOAT, false, 0, 0);

  // Set the colors attribute for the vertices.

  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.pColorsBuffer);
  this.gl.vertexAttribPointer(this.vertexColorAttrib, 4, this.gl.FLOAT, false, 0, 0);
  
  // Draw the shape.

  setMatrixUniforms(this.gl);
  this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 3);
};

//
// Matrix utility functions
//

function loadIdentity() {
  mvMatrix = Matrix.I(4);
}
function multMatrix(m) {
  mvMatrix = mvMatrix.x(m);
}

function mvTranslate(v) {
  multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
  //console.log(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
}

function setMatrixUniforms(gl) {
  var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

  var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
}

function translate(inputMatrix, translationX, translationY, transformedMatrix)
{
  transformedMatrix[0] = inputMatrix[0] + translationX;
  transformedMatrix[1] = inputMatrix[1] + translationY;
  transformedMatrix[3] = inputMatrix[3] + translationX;
  transformedMatrix[4] = inputMatrix[4] + translationY;
  transformedMatrix[6] = inputMatrix[6] + translationX;
  transformedMatrix[7] = inputMatrix[7] + translationY;
}
function multiply(a, b) {
  var aNumRows = a.length, aNumCols = a[0].length,
      bNumRows = b.length, bNumCols = b[0].length,
      m = new Array(aNumRows);  // initialize array of rows
  for (var r = 0; r < aNumRows; ++r) {
    m[r] = new Array(bNumCols); // initialize the current row
    for (var c = 0; c < bNumCols; ++c) {
      m[r][c] = 0;             // initialize the current cell
      for (var i = 0; i < aNumCols; ++i) {
        m[r][c] += a[r][i] * b[i][c];
      }
    }
  }
  return m;
}
function makeTranslation(tx, ty, tz) {
  return [
     1,  0,  0,  0,
     0,  1,  0,  0,
     0,  0,  1,  0,
     tx, ty, tz, 1
  ];
}
 
function makeXRotation(angleInRadians) {
  var c = Math.cos(angleInRadians);
  var s = Math.sin(angleInRadians);
 
  return [
    1, 0, 0, 0,
    0, c, s, 0,
    0, -s, c, 0,
    0, 0, 0, 1
  ];
};
 
function makeYRotation(angleInRadians) {
  var c = Math.cos(angleInRadians);
  var s = Math.sin(angleInRadians);
 
  return [
    c, 0, -s, 0,
    0, 1, 0, 0,
    s, 0, c, 0,
    0, 0, 0, 1
  ];
};
 
function makeZRotation(angleInRadians) {
  var c = Math.cos(angleInRadians);
  var s = Math.sin(angleInRadians);
 
  return [
     c, s, 0, 0,
    -s, c, 0, 0,
     0, 0, 1, 0,
     0, 0, 0, 1,
  ];
}
 
function makeScale(sx, sy, sz) {
  return [
    sx, 0,  0,  0,
    0, sy,  0,  0,
    0,  0, sz,  0,
    0,  0,  0,  1,
  ];
}
function matrixMultiply(a, b) {
  var a00 = a[0*3+0];
  var a01 = a[0*3+1];
  var a02 = a[0*3+2];
  var a10 = a[1*3+0];
  var a11 = a[1*3+1];
  var a12 = a[1*3+2];
  var a20 = a[2*3+0];
  var a21 = a[2*3+1];
  var a22 = a[2*3+2];
  var b00 = b[0*3+0];
  var b01 = b[0*3+1];
  var b02 = b[0*3+2];
  var b10 = b[1*3+0];
  var b11 = b[1*3+1];
  var b12 = b[1*3+2];
  var b20 = b[2*3+0];
  var b21 = b[2*3+1];
  var b22 = b[2*3+2];
  return [a00 * b00 + a01 * b10 + a02 * b20,
          a00 * b01 + a01 * b11 + a02 * b21,
          a00 * b02 + a01 * b12 + a02 * b22,
          a10 * b00 + a11 * b10 + a12 * b20,
          a10 * b01 + a11 * b11 + a12 * b21,
          a10 * b02 + a11 * b12 + a12 * b22,
          a20 * b00 + a21 * b10 + a22 * b20,
          a20 * b01 + a21 * b11 + a22 * b21,
          a20 * b02 + a21 * b12 + a22 * b22];
}
function mMultiply(a, b)
{
  return [
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[1] * b[5] + a[2] * b[6] + a[3] * b[7],
  a[0] * b[8] + a[1] * b[9] + a[2] * b[10] + a[3] * b[11],
  a[0] * b[12] + a[1] * b[13] + a[2] * b[14] + a[3] * b[15],

  a[4] * b[0] + a[5] * b[1] + a[6] * b[2] + a[7] * b[3],
  a[4] * b[4] + a[5] * b[5] + a[6] * b[6] + a[7] * b[7],
  a[4] * b[8] + a[5] * b[9] + a[6] * b[10] + a[7] * b[11],
  a[4] * b[12] + a[5] * b[13] + a[6] * b[14] + a[7] * b[15],

  a[8] * b[0] + a[9] * b[1] + a[10] * b[2] + a[11] * b[3],
  a[8] * b[4] + a[9] * b[5] + a[10] * b[6] + a[11] * b[7],
  a[8] * b[8] + a[9] * b[9] + a[10] * b[10] + a[11] * b[11],
  a[8] * b[12] + a[9] * b[13] + a[10] * b[14] + a[11] * b[15],

  a[12] * b[0] + a[13] * b[1] + a[14] * b[2] + a[15] * b[3],
  a[12] * b[4] + a[13] * b[5] + a[14] * b[6] + a[15] * b[7],
  a[12] * b[8] + a[13] * b[9] + a[14] * b[10] + a[15] * b[11],
  a[12] * b[12] + a[13] * b[13] + a[14] * b[14] + a[15] * b[15]
  ];
}