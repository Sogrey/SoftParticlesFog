/* 
THREE.js r100 
*/

// Global Variables
var canvas = document.getElementById("myCanvas");
var camera0, scene0, renderer, controls, clock, stats;
var composer, depthTarget, depthRendTexture;
var textureLoader, smokeTexture, smokeParticles;

init();
animate();

function init() {
	// Renderer
	renderer = new THREE.WebGLRenderer({
		canvas: canvas,
		antialias: true
	});
	renderer.setSize(window.innerWidth, window.innerHeight);

	// Scene
	scene0 = new THREE.Scene();
	scene0.background = new THREE.Color(0x101020);

	// Camera
	camera0 = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
	camera0.position.set(0, 5.5, 10);

	// Clock
	clock = new THREE.Clock();

	//Stats
	stats = new Stats();
	document.body.appendChild(stats.dom);

	// Loaders
	textureLoader = new THREE.TextureLoader();

	// Controls
	controls = new THREE.OrbitControls(camera0);

	// Textures
	smokeTexture = textureLoader.load('./img/smokeBig_64.png');

	// Lights
	var ambientL = new THREE.AmbientLight(0xffffff, 0.3);
	var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
	dirLight.position.set(12, 50, 15);
	scene0.add(ambientL, dirLight);


	createStartingMesh();
	initParticles();
	initPostProcessing();

	// Resize Event
	window.addEventListener("resize", onWindowResize, false);
}

function createStartingMesh() {

	// Ground
	var floor = new THREE.Mesh(
		new THREE.PlaneBufferGeometry(30, 400),
		new THREE.MeshPhongMaterial({
			color: 0x105020,
			shininess: 0,
		})
	);
	floor.rotation.x -= 90 * Math.PI / 180;
	scene0.add(floor);

	// Cube
	var cube = new THREE.Mesh(
		new THREE.BoxGeometry(2, 2, 2),
		new THREE.MeshPhongMaterial({
			color: 0x404040
		})
	);
	cube.position.set(0, 1, 0);
	scene0.add(cube);

	// Walls
	var wall1 = new THREE.Mesh(
		new THREE.BoxGeometry(20, 7, 1),
		new THREE.MeshPhongMaterial({
			color: 0x404040
		})
	);
	wall1.position.set(0, 3.5, -150);

	var wall2 = new THREE.Mesh(
		new THREE.BoxGeometry(300, 7, 1),
		new THREE.MeshPhongMaterial({
			color: 0x404040
		})
	);
	wall2.position.set(-10, 3.5, 0);
	wall2.rotation.y += 90 * Math.PI / 180;

	var wall3 = wall2.clone();
	wall3.position.set(10, 3.5, 0);

	scene0.add(wall1, wall2, wall3);
}

function initParticles() {

	// SMOKE
	var smokeGeo = new THREE.BufferGeometry();

	var numOfParticles = 20; // 20
	var spreadX = 18,
		spreadY = 4,
		spreadZ = 18; // 18 4 18
	var origin = new THREE.Vector3(0, 1, 0); // 0 1 0

	var posArr = [];
	var colors = [];
	for (var i = 0; i < numOfParticles; i++) {
		var x = Math.random() * spreadX - spreadX / 2.0 + origin.x;
		var y = Math.random() * spreadY - spreadY / 2.0 + origin.y;
		var z = Math.random() * spreadZ - spreadZ / 2.0 + origin.z;

		posArr.push(x, y, z);

		colors.push(Math.random() * 255, Math.random() * 255, Math.random() * 255);
	}

	smokeGeo.addAttribute('position', new THREE.Float32BufferAttribute(posArr, 3));
	// smokeGeo.addAttribute('color', new THREE.Float32BufferAttribute(posArr, 3));

	var softParticlesMaterial = new THREE.ShaderMaterial({
		defines: Object.assign({}, softParticlesShader.defines),
		uniforms: THREE.UniformsUtils.clone(softParticlesShader.uniforms),
		vertexShader: softParticlesShader.vertexShader,
		fragmentShader: softParticlesShader.fragmentShader,

		transparent: true,
		blending: THREE.AdditiveBlending,
		depthTest: false,
		depthWrite: false
	});

	var uniforms = softParticlesMaterial.uniforms;

	uniforms.map.value = smokeTexture;
	uniforms.diffuse.value = new THREE.Color(1.0, 1.0, 1.0);
	uniforms.size.value = 25;
	uniforms.opacity.value = 0.10;
	uniforms.sizeAttenuation.value = true;
	uniforms.fCamNear.value = camera0.near;
	uniforms.fCamFar.value = camera0.far;
	uniforms.screenSize.value = new THREE.Vector2(canvas.width, canvas.height);

	smokeParticles = new THREE.Points(smokeGeo, softParticlesMaterial);
	scene0.add(smokeParticles);
}

function initPostProcessing() {

	composer = new THREE.EffectComposer(renderer);

	// Depth Render Target and Texture
	depthRendTexture = new THREE.DepthTexture();
	depthRendTexture.type = THREE.UnsignedShortType;
	depthRendTexture.minFilter = THREE.NearestFilter;
	depthRendTexture.maxFilter = THREE.NearestFilter;

	depthTarget = new THREE.WebGLRenderTarget(canvas.width, canvas.height, {
		format: THREE.RGBAFormat,
		depthTexture: depthRendTexture,
		depthBuffer: true,
	});

	smokeParticles.material.uniforms.sceneDepthTexture.value = depthRendTexture;

	// Passes
	var renderPass = new THREE.RenderPass(scene0, camera0);
	var fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);

	composer.addPass(renderPass);
	composer.addPass(fxaaPass);

	fxaaPass.renderToScreen = true;
}

function onWindowResize() {
	camera0.aspect = window.innerWidth / window.innerHeight;
	camera0.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
	depthTarget.setSize(window.innerWidth, window.innerHeight);
}

function animate() {

	stats.begin();
	var delta = clock.getDelta();

	renderer.render(scene0, camera0, depthTarget, true);

	smokeParticles.rotation.y += 0.002;

	composer.render(scene0, camera0);

	requestAnimationFrame(animate);
	stats.end();
}