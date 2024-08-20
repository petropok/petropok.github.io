import './style.css'

import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';


if ( WebGL.isWebGLAvailable() ) {
	var canvReference = document.getElementById("ship-canvas");
	const renderer = new THREE.WebGLRenderer({
		antialias:true,
		canvas: canvReference
	});

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

	const geometry = new THREE.BoxGeometry( 1, 1, 1 );
	const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
	const cube = new THREE.Mesh( geometry, material );
	scene.background = new THREE.Color( 0x3F51B5 );
	scene.add( cube );

	camera.position.z = 5;

	function animate() {
		requestAnimationFrame( animate );

		cube.rotation.x += 0.01;
		cube.rotation.y += 0.01;

		renderer.render( scene, camera );
	}

	animate();
} else {

	const warning = WebGL.getWebGLErrorMessage();
	document.getElementById( 'container' ).appendChild( warning );

}