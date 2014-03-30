
// Parameters
var width = 800,
    height = 600
    viewAngle = 45,
    aspect = width/height,
    near = 0.1,
    far = 1000.0;

var renderer = null;
var scene = null;
var camera = null;


var mouse = {
    down: false,
    prevY: 0,
    prevX: 0
}

var camObject = null;
var keysPressed = [];
var ruins = [];

var skyDome = null;
var canRotateClouds = false;

var fireTexture = null;
var smokeTexture = null;
var pineTexture = null;
var limeTexture = null;

var shoulderRotationJoint;
var shoulderTiltingJoint;
var upperArm;
var elbowJoint;
var lowerArm;
var wrist;
var hand;
var thumb;
var indexfinger;
var middlefinger;
var pinky;

var fps = {
    width: 100,
    height: 50,
    svg: null,
    data: [],
    ticks: 0,
    time: null
}
var spotLight = null;
var spotLightObj = null;
var ambientLight = null;

var flameParticleSys = null;
var smokeParticleSys = null;

var trees = [];

// for easier conversion
function colorToVec4(color){
    var res = new THREE.Vector4(color.r, color.g, color.b, color.a);
    return res;
}

function colorToVec3(color) {
	var res = new THREE.Vector3(color.r, color.g, color.b);
    return res;
}

$(function(){
	fireTexture = THREE.ImageUtils.loadTexture("./textures/fire.png");
	smokeTexture = THREE.ImageUtils.loadTexture("./textures/smoke.png");
	pineTexture = THREE.ImageUtils.loadTexture("./textures/pine.png");
	limeTexture = THREE.ImageUtils.loadTexture("./textures/lime.png");
	
    // get div element 
    var ctx = $("#main");
    // create WebGL-based renderer for our content.
    renderer = new THREE.WebGLRenderer();

    // create camera
    camera = new THREE.PerspectiveCamera( viewAngle, aspect, near, far);

    // create scene
    scene = new THREE.Scene();
    camObject = new THREE.Object3D();
    camObject.add(camera);
    spotLightObj = new THREE.Object3D();
    spotLightObj.position.z = 0.5;
	//spotLightObj.position.x = 0.1;
    camera.add(spotLightObj);

    // add camera to scene and set its position.
    scene.add(camObject);
    camObject.position.z = 5;
    camObject.position.y = 1.0;
    // define renderer viewport size
    renderer.setSize(width,height);

    // add generated canvas element to HTML page
    ctx.append(renderer.domElement);

    // directional light for the moon
    var directionalLight = new THREE.DirectionalLight( 0x88aaff, 1.0 ); 
    directionalLight.position.set( 1, 1, -1 ); 

    scene.add( directionalLight );

    // Add ambient light, simulating surround scattering light
    //ambientLight = new THREE.AmbientLight(0x282a2f);
	ambientLight = new THREE.AmbientLight(0x080a0f);
    scene.add( ambientLight  );
    

    scene.fog = new THREE.Fog(0x172747, 1.0, 50.0);
    // Add our flashlight
    var distance  = 10.0;
    var intensity = 3.0;
    spotLight = new THREE.SpotLight( 0xffffff, 
				     intensity,
				     distance ); 
    spotLight.castShadow = false; 
    spotLight.position = new THREE.Vector3(0,0,1);
    spotLight.target = spotLightObj;
    spotLight.exponent = 60.5;
    spotLight.angle = 0.21;
    scene.add( spotLight );

    // create cube  material
    var material =
	new THREE.MeshBasicMaterial(
	    {
		color: 0xFFFFFF,
	    });
    
    var loader = new THREE.JSONLoader();
    // Create ground from cube and some rock
    var rockTexture = THREE.ImageUtils.loadTexture("rock.jpg");

	
	// RUINS //
	
    // texture wrapping mode set as repeating
    rockTexture.wrapS = THREE.RepeatWrapping;
    rockTexture.wrapT = THREE.RepeatWrapping;
    var customPhongShader = new THREE.ShaderMaterial({
	vertexShader: $("#light-vs").text(),
	fragmentShader: $("#light-fs").text(),
	transparent: false,
	uniforms: { 
	    map: {
		type: 't', 
		value: rockTexture
	    },
	    // setting struct field happens by using dot notation. 
	    // Each field needs to be set separately. 
	    "dirLight.pos": {
		type: 'v3',
		value: directionalLight.position
	    },

	    u_ambient: { 
		type: 'v4',
		value: colorToVec4(ambientLight.color) /* global ambient */
	    },
		
		"dirLight.intensity": {
			type: 'f',
			value: directionalLight.intensity
		},
		
		"dirLight.color": {
			type: 'v4',
			value: colorToVec4(directionalLight.color)
		},

		"material.specularColor": {
			type: 'v3',
			value: new THREE.Vector3( 0.7, 0.8, 0.46 )
		},
		
		"material.shininess": {
			type: 'f',
			value: 80.0
		},
		
		"spotLight.pos": {
			type: 'v3',
			value: camObject.position
		},
		
		"spotLight.color": {
			type: 'v4',
			value: colorToVec4(spotLight.color)
		},
		
		"spotLight.exponent": {
			type: 'f',
			value: spotLight.exponent * 2.3
		},
		
		"spotLight.constAtt": {
			type: 'f',
			value: 0.5
		},
		
		"spotLight.linearAtt": {
			type: 'f',
			value: 0.1
		},
		
		"spotLight.quadraticAtt": {
			type: 'f',
			value: 0.01
		},
		
		"uFogColor": {
			type: 'v3',
			value: colorToVec3(scene.fog.color)
		},
		
		"uFogNear": {
			type: 'f',
			value: scene.fog.near
		},
		
		"uFogFar": {
			type: 'f',
			value: scene.fog.far
		}
		
	}
    });

    function handler(geometry, materials) {
	var m = new THREE.Mesh(geometry, customPhongShader)
	m.renderDepth = 2;
	ruins.push(m);
	checkIsAllLoaded();
    }
    
    function checkIsAllLoaded(){
	if ( ruins.length == 5 ) {
	    $.each(ruins, function(i,mesh){
		scene.add(mesh);
		// mesh is rotated around 
		mesh.rotation.x = Math.PI/2.0;

	    });
	    // arcs
	    ruins[0].position.z = 13;
	    // corner
	    ruins[1].position.x = 13;

	    // crumbled place
	    ruins[2].position.x = -13;


	    ruins[3].position.z = -13;
	}
    }
    loader.load("meshes/ruins30.js", handler);    
    loader.load("meshes/ruins31.js", handler);
    loader.load("meshes/ruins33.js", handler);
    loader.load("meshes/ruins34.js", handler); 
    loader.load("meshes/ruins35.js", handler);
	
	
	// SKYDOME //
	
	var cloudTexture = THREE.ImageUtils.loadTexture("./textures/clouds.png");
	
	function skyHandler(geometry, materials) {
		skyDome = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: cloudTexture,
			//depthWrite: false,
			transparent: true,
			blending: THREE.NormalBlending,
			}));
		scene.add(skyDome);
		skyDome.position = camObject.position;
		skyDome.scale.set(40.0,40.0,40.0);
		skyDome.renderDepth = 9002;
		canRotateClouds = true;
	}
	
	loader.load("meshes/sky.js", skyHandler);

	
	// SKYBOX // 
	
    var skyboxMaterials = [];
    skyboxMaterials.push ( new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture("./textures/nightsky_west.png")}));
    skyboxMaterials.push ( new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture("./textures/nightsky_east.png")}));
    skyboxMaterials.push ( new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture("./textures/nightsky_up.png")}));
    skyboxMaterials.push ( new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture("./textures/nightsky_down.png")}));
    skyboxMaterials.push ( new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture("./textures/nightsky_north.png")}));
    skyboxMaterials.push ( new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture("./textures/nightsky_south.png")}));
    $.each(skyboxMaterials, function(i,d){
	d.side = THREE.BackSide;
	d.depthWrite = false;

    });
    var sbmfm = new THREE.MeshFaceMaterial(skyboxMaterials);
    sbmfm.depthWrite = false;
    // Create a new mesh with cube geometry 
    var skybox = new THREE.Mesh(
	new THREE.CubeGeometry( 1,1,1,1,1,1 ), 
	sbmfm
    );

    skybox.position = camObject.position;
	skybox.renderDepth = 0;
    scene.add(skybox);

	
    // GROUND //
    var ground = new THREE.Mesh( new THREE.CubeGeometry(100,0.2,100,1,1,1), customPhongShader);
    
    // Do a little magic with vertex coordinates so ground looks more interesting
    $.each(ground.geometry.faceVertexUvs[0], function(i,d){

	d[0] = new THREE.Vector2(0,25);
	d[2] = new THREE.Vector2(25,0);
	d[3] = new THREE.Vector2(25,25);
    });
		
    ground.renderDepth = 1;
    scene.add(ground);

	// HAND //
	
    initWavingHand();
	
	
	// TREES //
	
	initTrees();
	
	/////////////////////
	/* PARTICLE SYSTEMS */
	/////////////////////
	
	// flame particles with some per-update randomization of velocity
	flameParticleSys = new CustomParticleSystem({
		maxParticles: 10,
		energyDecrementFactor: 1.3,
		throughPutFactor : 3.8,
		material : new THREE.ParticleBasicMaterial({
			color: 0xffffff,
			size: 0.7,
			map: fireTexture,
			transparent: true,
			blending: THREE.CustomBlending,
			blendEquation: THREE.AddEquation,
			blendSrc: THREE.SrcAlphaFactor,
			blendDst: THREE.OneFactor,
			depthWrite : false
		}),
		onParticleInit: function(particle){
			particle.set(0.0,0.0,0.0);
			var xVariance = (Math.random() - 0.5) * 0.5;
			var zVariance = (Math.random() - 0.5) * 0.5;
			particle.velocity = new THREE.Vector3(xVariance, 1.0, zVariance).normalize();
			particle.energy = 1.0;
		},
		onParticleUpdate: function(particle, delta){
			var xVariance = (Math.random() - 0.5) * 1.8;
			var zVariance = (Math.random() - 0.5) * 1.8;
			var yVariance = (Math.random() - 0.5) * 0.8;
			var randomVel = particle.velocity.clone();
			randomVel.x += xVariance;
			randomVel.z += zVariance;
			randomVel.y += yVariance;
			
			particle.add(randomVel.multiplyScalar(delta * 0.6));
			
			particle.energy -= delta * flameParticleSys.options.energyDecrementFactor;
		}
	});
	scene.add(flameParticleSys.ps);
	flameParticleSys.ps.position = new THREE.Vector3(5.0, 0.1, 5.0);
	
	// smoke particles with less speed (velocity and throughput), randomness,
	// and more size, lifespan than the flame particles
	smokeParticleSys = new CustomParticleSystem({
		maxParticles: 12,
		energyDecrementFactor: 0.16,
		throughPutFactor : 1.3,
		material : new THREE.ParticleBasicMaterial({
			color: 0xffffff,
			size: 1.5,
			map: smokeTexture,
			transparent: true,
			blending: THREE.CustomBlending,
			blendEquation: THREE.AddEquation,
			blendSrc: THREE.SrcAlphaFactor,
			blendDst: THREE.OneFactor,
			depthWrite : false
		}),
		onParticleInit: function(particle){
			var xPosVariance = (Math.random() - 0.5) * 0.3;
			var zPosVariance = (Math.random() - 0.5) * 0.3;
			particle.set(xPosVariance,0.0,zPosVariance);
			var xVariance = (Math.random() - 0.5) * 0.5;
			var zVariance = (Math.random() - 0.5) * 0.5;
			particle.velocity = new THREE.Vector3(xVariance, 1.0, zVariance).normalize();
			particle.energy = 1.0;
		},
		onParticleUpdate: function(particle, delta){
			particle.add(particle.velocity.clone().multiplyScalar(delta * 0.2));
			
			particle.energy -= delta * smokeParticleSys.options.energyDecrementFactor;
		}
	});
	// make smoke system a child of flame system
	flameParticleSys.ps.add(smokeParticleSys.ps);
	smokeParticleSys.ps.position = new THREE.Vector3(0.0, 0.4, 0.0);

	/////////////////////
	
	
	// TIME AND INPUT //
	
    fps.time = new Date();
    // request frame update and call update-function once it comes
    requestAnimationFrame(update);

    // Setup simple input handling with mouse
    document.onmousedown = function(ev){
	mouse.down = true;
	mouse.prevY = ev.pageY;
	mouse.prevX = ev.pageX;
    }

    document.onmouseup = function(ev){
	mouse.down = false;
    }

    document.onmousemove = function(ev){
	if ( mouse.down ) {

	    var rot = (ev.pageY - mouse.prevY) * 0.01;
	    var rotY = (ev.pageX - mouse.prevX) * 0.01;

	    camObject.rotation.y -= rotY;
	    camera.rotation.x -= rot;

	    mouse.prevY = ev.pageY;
	    mouse.prevX = ev.pageX;
	}
    }

    // setup input handling with keypresses
    document.onkeydown = function(event) {
	keysPressed[event.keyCode] = true;
    }
    
    document.onkeyup = function(event) {
	keysPressed[event.keyCode] = false;
    }
    
    
    // querying supported extensions
    var gl = renderer.context;
    var supported = gl.getSupportedExtensions();

    console.log("**** Supported extensions ***'");
    $.each(supported, function(i,d){
	console.log(d);
    });
    //Create SVG element
    fps.svg = d3.select("#fps")
	.append("svg")
	.attr("width", fps.width)
	.attr("height", fps.height);

});

var CustomParticleSystem = function(options)
{
	this.prevTime = new Date();
	this.options = options;
	this.particles = new THREE.Geometry();
	this.numAlive = 0;
	this.throughPut = 0.0;
	this.throughPutFactor = 0.0;
	if(options.throughPutFactor !== undefined)
	{
		this.throughPutFactor = options.throughPutFactor;
	}
	
	// add vertices equal to the maxParticles option
	for (var i=0; i<this.options.maxParticles; i++)
	{
		this.particles.vertices.push(new THREE.Vector3(0));
	}
	
	this.ps = new THREE.ParticleSystem(this.particles, this.options.material);
	
	this.ps.renderDepth = 0;
	this.ps.sortParticles = false;
	this.ps.geometry.__webglParticleCount = 0;
	
	this.getMaxParticleCount = function(){
		return this.ps.geometry.vertices.length;
	}
	this.getNumParticlesAlive = function(){
		return this.numAlive;
	}
	this.setNumParticlesAlive = function(particleCount){
		this.numAlive = particleCount;
	}
	
	this.removeDeadParticles = function(){
		var endPoint = this.getNumParticlesAlive();
		for(var p=0; p<endPoint; p++)
		{
			var particle = this.ps.geometry.vertices[p];
			if(particle.energy <= 0.0)
			{
				// remove the dead particle from the array
				var tmp = this.ps.geometry.vertices.splice(p,1);
				// push it back to the end of the array
				this.ps.geometry.vertices.push(tmp[0]);
				// no need to go as far
				endPoint--;
				// one less alive now
				this.setNumParticlesAlive(this.getNumParticlesAlive() - 1);
			}
		}
	}
	
	this.init = function(particleCount){
		var previouslyAlive = this.getNumParticlesAlive();
		var newTotal = particleCount + previouslyAlive;
		// new total is new total if there is space
		newTotal = (newTotal > this.getMaxParticleCount()) ? this.getMaxParticleCount : newTotal;
		this.setNumParticlesAlive(newTotal);
		
		// init new particles
		for(var p = previouslyAlive; p<newTotal; p++)
		{
			var particle = this.ps.geometry.vertices[p];
			if(particle !== undefined)
			{
				this.options.onParticleInit(particle);
			}
		}
		// must set up update flag
		this.ps.geometry.verticesNeedUpdate = true;
	}
	
	this.update = function(){
		// handle time
		var now = new Date();
		var delta = (now.getTime() - this.prevTime.getTime())/1000.0;
	
		this.ps.geometry.__webglParticleCount = this.getNumParticlesAlive();
		
		this.removeDeadParticles();
		
		var endPoint = this.getNumParticlesAlive();
		for(var p=0; p<endPoint; p++)
		{
			var particle = this.ps.geometry.vertices[p];
			if(particle !== undefined)
			{
				this.options.onParticleUpdate(particle, delta);
			}
		}
		
		// handle through put of new particles
		this.throughPut += (this.throughPutFactor * delta);
		var howManyToCreate = Math.floor(this.throughPut);
		if(howManyToCreate >= 1)
		{
			this.throughPut -= howManyToCreate;
			this.init(howManyToCreate);
		}
		
		this.ps.geometry.verticesNeedUpdate = true;
		
		this.prevTime = now;
	}

}

function initTrees()
{
	var fromGround = 4.0;
	var n = 0;

	trees[n] = new THREE.Object3D();
	trees[n].position.set(3.0,fromGround,0.0);
	scene.add(trees[n]);
	
	n = 1;
	trees[n] = new THREE.Object3D();
	trees[n].position.set(4.0,fromGround,8.0);
	scene.add(trees[n]);
	
	n = 2;
	trees[n] = new THREE.Object3D();
	trees[n].position.set(-3.0,fromGround,10.0);
	scene.add(trees[n]);
	
	n = 3;
	trees[n] = new THREE.Object3D();
	trees[n].position.set(-8.0,fromGround,-5.0);
	scene.add(trees[n]);
	
	n = 4;
	trees[n] = new THREE.Object3D();
	trees[n].position.set(1.0,fromGround,-15.0);
	scene.add(trees[n]);
	
	n = 5;
	trees[n] = new THREE.Object3D();
	trees[n].position.set(13.0,fromGround,-1.0);
	scene.add(trees[n]);
	
	n = 6;
	trees[n] = new THREE.Object3D();
	trees[n].position.set(-4.7,fromGround,6.0);
	scene.add(trees[n]);
	
	n = 7;
	trees[n] = new THREE.Object3D();
	trees[n].position.set(23.0,4.0,7.0);
	scene.add(trees[n]);
	
	n = 8;
	trees[n] = new THREE.Object3D();
	trees[n].position.set(-34.0,4.0,-12.0);
	scene.add(trees[n]);
	
	n = 9;
	trees[n] = new THREE.Object3D();
	trees[n].position.set(-9.0,4.0,22.0);
	scene.add(trees[n]);
	
	n = 10;
	trees[n] = new THREE.Object3D();
	trees[n].position.set(-19.0,4.0,14.0);
	scene.add(trees[n]);
	
	n = 11;
	trees[n] = new THREE.Object3D();
	trees[n].position.set(17.0,4.0,-25.0);
	scene.add(trees[n]);
	
	
	var geometry = new THREE.PlaneGeometry( 5, 8 );
	var pineMaterial = new THREE.MeshPhongMaterial( {
		map: pineTexture,
		transparent: true,
		blending: THREE.NormalBlending,
		depthWrite: false,
		side: THREE.DoubleSide} );
	
	var limeMaterial = new THREE.MeshPhongMaterial( {
		map: limeTexture,
		transparent: true,
		blending: THREE.NormalBlending,
		depthWrite: false,
		side: THREE.DoubleSide} );
					
	for(i = 0; i<trees.length; i++)
	{
		if(i<4)
		{
			var plane1 = new THREE.Mesh( geometry, pineMaterial );
		}
		else
		{
			var plane1 = new THREE.Mesh( geometry, limeMaterial );
		}
		var plane2 = plane1.clone();
		plane2.rotation.y = Math.PI/2.0;
		
		// flip both
		plane1.rotation.x = Math.PI;
		plane2.rotation.x = Math.PI;
		
		trees[i].add(plane1);
		trees[i].add(plane2);
	}
}

var angle = 0.0;
var movement = 0.0;
var moving = false;
function update(){
    // render everything 
    renderer.setClearColorHex(0x000000, 1.0);
    renderer.clear(true);
    renderer.render(scene, camera); 
    angle += 0.001;
    moving = false;
    if ( keysPressed["W".charCodeAt(0)] == true ){
	var dir = new THREE.Vector3(0,0,-1);
	var dirW = dir.applyMatrix4(camObject.matrixRotationWorld);
	camObject.translate(0.1, dirW);
	moving = true;
    }

    if ( keysPressed["S".charCodeAt(0)] == true ){

	var dir = new THREE.Vector3(0,0,-1);
	var dirW = dir.applyMatrix4(camObject.matrixRotationWorld);
	camObject.translate(-0.1, dirW);
	moving = true;

    }
    if ( keysPressed["A".charCodeAt(0)] == true ){
	var dir = new THREE.Vector3(-1,0,0);
	var dirW = dir.applyMatrix4(camObject.matrixRotationWorld);
	camObject.translate(0.1, dirW);
	moving = true;
    }

    if ( keysPressed["D".charCodeAt(0)] == true ){

	var dir = new THREE.Vector3(-1,0,0);
	var dirW = dir.applyMatrix4(camObject.matrixRotationWorld);
	camObject.translate(-0.1, dirW);
	moving = true;
    }
    if ( keysPressed["Q".charCodeAt(0)] == true ){

	shoulderRotationJoint.rotation.y += 0.1;

    }
    if ( keysPressed["E".charCodeAt(0)] == true ){

	shoulderRotationJoint.rotation.y -= 0.1;

    }
	
	if ( keysPressed["P".charCodeAt(0)] == true ){

		customParticleSys.init(1);
    }
    // so strafing and moving back-fourth does not double the bounce
    if ( moving ) {
	movement+=0.1;
	camObject.position.y = Math.sin(movement*2.30)*0.07+1.2; 
    }
    spotLight.position = camObject.position;

    var dir = new THREE.Vector3(0,0,-1);
    var dirW = dir.applyMatrix4(camObject.matrixRotationWorld);

    spotLight.target.position = dirW;
    elbowJoint.rotation.z = Math.sin(12*angle);

    shoulderTiltingJoint.rotation.z = Math.cos(12*angle);
    wrist.rotation.x = Math.sin(25*angle);
	
	if(canRotateClouds)
	{
		skyDome.rotation.y = angle;
	}
	// update particle systems
	if(flameParticleSys != null)
	{
		flameParticleSys.update();
	}
	if(smokeParticleSys != null)
	{
		smokeParticleSys.update();
	}
	
    // request another frame update
    requestAnimationFrame(update);
    
    fps.ticks++;
    var tmp = new Date();
    var diff = tmp.getTime()-fps.time.getTime();

    if ( diff > 1000.0){
	fps.data.push(fps.ticks);
	if ( fps.data.length > 15 ) {
	    fps.data.splice(0, 1);
	}
	fps.time = tmp;
	fps.ticks = 0;
	displayFPS();
    }
    
}
  
// for displaying fps meter 
function displayFPS(){

    fps.svg.selectAll("rect").remove();
    
    fps.svg.append("rect")
	.attr("x", 0)
	.attr("y", 0)
	.attr("width", 100)
	.attr("height", 50)
	.attr("fill", "rgb(0,0,0)");

    fps.svg.selectAll("rect")
	.data(fps.data)
	.enter()
	.append("rect")
	.attr("x", function(d, i) {
	    return (i * (2+1));  //Bar width of 20 plus 1 for padding
	})
	.attr("y", function(d,i){
	    return 50-(d/2);
	})
	.attr("width", 2)
	.attr("height", function(d,i){
	    return (d/2);
	})
	.attr("fill", "#FFFFFF");

    fps.svg.selectAll("text").remove();
    fps.svg
	.append("text")
	.text( function(){
	    return fps.data[fps.data.length-1] + " FPS";
	})
	.attr("x", 50)
	.attr("y", 25)
	.attr("fill", "#FFFFFF");
}

function initWavingHand()
{
	shoulderRotationJoint = new THREE.Object3D();
    shoulderRotationJoint.position.y = 0.5;
    shoulderTiltingJoint = new THREE.Mesh( 
	new THREE.SphereGeometry(0.2,10,10), 
	new THREE.MeshLambertMaterial({ color: 0xFF0000, transparent: true})
    );
    upperArm  = new THREE.Mesh( new THREE.CubeGeometry(0.125,0.5,0.125),
				new THREE.MeshLambertMaterial({ color: 0x00FF00, transparent: true}));
    upperArm.position.y = 0.45;
    elbowJoint = new THREE.Mesh( 
	new THREE.SphereGeometry(0.12,10,10), 
	new THREE.MeshLambertMaterial({ color: 0xFF00FF, transparent: true})
    );
    lowerArm = new THREE.Mesh( new THREE.CubeGeometry(0.125,0.5,0.125),
				new THREE.MeshLambertMaterial({ color: 0xFFFF00, transparent: true}));
    

    wrist = new THREE.Object3D();
    hand = new THREE.Mesh( new THREE.CubeGeometry(0.25,0.25,0.25),
			   new THREE.MeshLambertMaterial({ color: 0x0000FF, transparent: true}));
    shoulderRotationJoint.add(shoulderTiltingJoint);
    shoulderTiltingJoint.add(upperArm);
    
    scene.add(shoulderRotationJoint);
    shoulderRotationJoint.add(shoulderTiltingJoint);
    shoulderTiltingJoint.add(upperArm);
    upperArm.add(elbowJoint);
    elbowJoint.position.y = 0.25;
    elbowJoint.add(lowerArm);
    lowerArm.position.y = 0.25;
    lowerArm.add(wrist);
    wrist.position.y = 0.25;
    wrist.add(hand);
    hand.position.y = 0.05;
    thumb =  new THREE.Mesh( new THREE.CubeGeometry(0.05,0.25,0.05),
			     new THREE.MeshLambertMaterial({ color: 0xFFAAAA, transparent: true}));
    hand.add(thumb);
    thumb.position.x = 0.2;
    thumb.rotation.z = 2.0;


    indexfinger =  new THREE.Mesh( new THREE.CubeGeometry(0.05,0.25,0.05),
				   new THREE.MeshLambertMaterial({ color: 0xFFAAAA, transparent: true}));
    hand.add(indexfinger);
    indexfinger.position.x = 0.10;
    indexfinger.position.y = 0.2;
    
    
    middlefinger =  new THREE.Mesh( new THREE.CubeGeometry(0.05,0.25,0.05),
				    new THREE.MeshLambertMaterial({ color: 0xFFAAAA, transparent: true}));
    hand.add(middlefinger);
    middlefinger.position.x = 0.0;
    middlefinger.position.y = 0.2;
    
    pinky =  new THREE.Mesh( new THREE.CubeGeometry(0.05,0.25,0.05),
				    new THREE.MeshLambertMaterial({ color: 0xFFAAAA, transparent: true}));
    hand.add(pinky);
    pinky.position.x = -0.1;
    pinky.position.y = 0.2;
}