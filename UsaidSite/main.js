var triAnimation;
var canvas;
var mouseX;
var mouseY;
var black = [0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0];//Just because I don't want to bother creating a new array every time
var rect;

function start()
{
  canvas = document.getElementById("glcanvas");

  canvas.width = window.innerWidth;//document.body.clientWidth; //document.width is obsolete
  canvas.height = window.innerHeight;//document.body.clientHeight; //document.height is obsolete
  canvasW = canvas.width;
  canvasH = canvas.height;
  triAnimation = new TriAnimation(canvas);
  triAnimation.begin();
  triAnimation.createShape([
      -20,  30.0,  0.0,
      -20, -20.0,  0.0,
      -10, 30.0, 0.0
    ], black);
  triAnimation.createShape([
      -10.0,  30.0,  0.0,
      -10.0, -20.0,  0.0,
      -19.0, -15.0, 0.0
    ], black);
    triAnimation.createShape([
      -19.0, -15.0,  0.0,
      -20.0, -20.0,  0.0,
      10.0, -30.0, 0.0
    ], black);
    triAnimation.createShape([
      -20.0, -20.0,  0.0,
      10.0, -30.0,  0.0,
      -10.0, -30.0, 0.0
    ], black);
    triAnimation.createShape([
      -10.0, -20.0,  0.0,
      20.0, -20.0,  0.0,
      10.0, -30.0, 0.0
    ], black);
    triAnimation.createShape([
      10.0, 30.0,  0.0,
      20.0, -20.0,  0.0,
      10.0, -20.0, 0.0
    ], black);
    triAnimation.createShape([
      20.0, -20.0,  0.0,
      20.0, 30.0,  0.0,
      10.0, 30.0, 0.0
    ], black);
    console.log("Finished init!");

  setInterval(drawScene, 15);
  
  canvas.onmousemove = mouseTracker;
}

function drawScene()
{
  canvas.width = window.innerWidth;//document.body.clientWidth; //document.width is obsolete
  canvas.height = window.innerHeight;//document.body.clientHeight; //document.height is obsolete
  canvasW = canvas.width;
  canvasH = canvas.height;
  rect = canvas.getBoundingClientRect();
  triAnimation.update(mouseX, mouseY, rect.right, rect.bottom);
}

function mouseTracker(e)
{
  /*
  var rect = canvas.getBoundingClientRect();//find a way to optimize this! Gaaah!
  mouseX = ((event.clientX - rect.left) - (rect.right/ 2));
  mouseY = (event.clientY - rect.top) - (rect.bottom/ 2);
*/
  mouseX = ((e.offsetX / canvas.clientWidth) * 2 - 1) * 100;
  mouseY = -1 * ((e.offsetY / canvas.clientHeight) * 2 - 1) * 100;
  //console.log(((e.offsetX / canvas.clientWidth)*2-1) * 100, ((e.offsetY / canvas.clientHeight) * 2 - 1) * 100); 
}
