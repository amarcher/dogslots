$(document).ready(function() {

// load a texture, set wrap mode to repeat
var texture = THREE.ImageUtils.loadTexture( "bone2.png" );
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set( 4, 4 );
videoTexture = new THREE.Texture( "bone2.png" );
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 36, window.innerWidth/window.innerHeight, 0.1, 5000 );

var renderer = new THREE.WebGLRenderer();
// renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setSize( 432, 600 );
document.body.appendChild( renderer.domElement );

var geometry = new THREE.CylinderGeometry( 893, 893, 100, 200);
var material = new THREE.MeshBasicMaterial({
  map: new THREE.ImageUtils.loadTexture('images/SLOT_DOGS_lineup_3_big_top.jpg')
});
var material2 = new THREE.MeshBasicMaterial({
  map: new THREE.ImageUtils.loadTexture('images/SLOT_DOGS_lineup_3_big_bottom.jpg')
});
var cylander = new THREE.Mesh( geometry, material );
var cylander2 = new THREE.Mesh( geometry, material2 );
cylander2.position.set(0,-50,0);
cylander.position.set(0,50,0);
scene.add( cylander );
scene.add( cylander2 );

camera.position.z = 1180;

var render = function () {
	requestAnimationFrame( render );
	cylander.rotation.y += 0.016;
	cylander2.rotation.y += 0.012;
	renderer.render(scene, camera);
};

render();

});