function Reel3D(slotId, imageURL, defaultRotationSpeed) {
	this.canvas = document.getElementById(slotId);
	this.scene = new THREE.Scene();
	this.camera = new THREE.PerspectiveCamera( 36, 233/144, 0.1, 5000 );
	this.renderer = new THREE.WebGLRenderer();
	this.geometry = new THREE.CylinderGeometry( 893, 893, 200, 200);
	this.texture = new THREE.ImageUtils.loadTexture( imageURL );
	this.material = new THREE.MeshBasicMaterial({
  	map: this.texture
	});
	this.cylander = new THREE.Mesh( this.geometry, this.material );
	this.spinning = false;
	this.rotationSpeed = 0;
	this.defaultRotationSpeed = defaultRotationSpeed;
	this.setUpRenderer();
}

Reel3D.prototype = {
	setUpRenderer: function() {
		this.renderer.setSize( 432, 300 );
		this.canvas.appendChild( this.renderer.domElement );
		this.scene.add( this.cylander );
		this.camera.position.z = 1180;
		this.start();
	},

	render: function () {
		requestAnimationFrame( this.render.bind(this) );
		this.cylander.rotation.y += this.rotationSpeed;
		this.renderer.render(this.scene, this.camera);
	},

	start: function() {
		this.rotationSpeed = this.defaultRotationSpeed;
		this.canvas.addEventListener("click", this.stop.bind(this));
	},

	stop: function() {
		this.rotationSpeed = 0;
		this.canvas.removeEventListener("click");
		this.canvas.addEventListener("click", this.start.bind(this));
	}

};

$(document).ready(function() {
	topReel = new Reel3D('slot1', 'images/SLOT_DOGS_lineup_3_big_top.jpg', 0.017);
	bottomReel = new Reel3D('slot2', 'images/SLOT_DOGS_lineup_3_big_bottom.jpg', 0.010);
	topReel.render();
	bottomReel.render();
});