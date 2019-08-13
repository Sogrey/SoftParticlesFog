
var softParticlesShader = {
	
	defines: {
		"USE_SIZEATTENUATION": true,
		"USE_MAP": true,
	},
	
	uniforms: {
		
		clippingPlanes: { value: null, needsUpdate: false },
		diffuse: { type: "vec3", value: new THREE.Color( 1 , 1 , 1 ) },
		map: { type: "t", value: null },
		opacity: { type: "f", value: 1 }, 
		scale: { type: "f", value: 329 }, 
		size: { type: "f", value: 1 },
		uvTransform: { type: "m3", value: new THREE.Matrix3().set( 1, 0, 0, 0, 1, 0, 0, 0, 1 ) },
		fCamNear: { type: "f", value: 0.1 },
		fCamFar: { type: "f", value: 1000 },
		sceneDepthTexture: { type: "t", value: null },
		screenSize: { type: "vec2", value: null },
		sizeAttenuation: { type: "bool", value: true },
		
	}, 
	
	vertexShader: [
		"uniform float size;",
		"uniform float scale;",
		"attribute vec3 color;",
		"varying vec3 vColor;",
		
		"void main() {",
			"#include <begin_vertex>",
			"#include <project_vertex>",
			"vColor = color;",
			"gl_PointSize = size;",
			"#ifdef USE_SIZEATTENUATION",
				"bool isPerspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 );",
				"if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );",
			"#endif",
		"}",
	].join( "\n" ),
	
	fragmentShader: [
		"varying vec3 vColor;",

		"uniform vec3 diffuse;",
		
		"uniform float opacity;",
		
		"#include <map_particle_pars_fragment>",
		
		"uniform sampler2D sceneDepthTexture;",
		"uniform vec2 screenSize;",
		"uniform float fCamNear;",
		"uniform float fCamFar;",
		
		"float fadeEdge( float particleDepth, float sceneDepth ){",
			// margin makes it blend through the solid objects a little bit more, creating illusion of density
			"float extraMargin = 0.015; ",
			"float a = ( sceneDepth+extraMargin - particleDepth ) * 120.0;",
			"if( a <= 0.0 ) return 0.0;",
			"if( a >= 1.0 ) return 1.0;",
			
			"if( a < 0.5 ) a = 2.0 * a * a;",
			"else a = -2.0 * pow( a - 1.0 , 2.0 ) + 1.0;",
			
			"return a;",
		"}",
		
		"#include <packing>",
		"float getLinearDepth( float fragCoordZ ) {",

			"float viewZ = perspectiveDepthToViewZ( fragCoordZ, fCamNear, fCamFar );",
			"return viewZToOrthographicDepth( viewZ, fCamNear, fCamFar );",
		"}",
		
		"void main() {",
			"vec3 outgoingLight = vec3( 0.0 );",

			"vec3 tmpColor = vColor;",
			"if(tmpColor==vec3( 0.0 )){tmpColor = diffuse;}",
			"vec4 diffuseColor = vec4( tmpColor, opacity );",
			
			"#include <map_particle_fragment>",
			"outgoingLight = diffuseColor.rgb;",
			
			"vec2 screenCoords = gl_FragCoord.xy / screenSize;",
			"float thisDepth = getLinearDepth( gl_FragCoord.z );",
			"float solidsDepth = texture2D( sceneDepthTexture , screenCoords ).r;",
			"solidsDepth = getLinearDepth( solidsDepth );",
			"float alphaScale = fadeEdge( thisDepth, solidsDepth );",
			"diffuseColor.a *= alphaScale;",
			
			"gl_FragColor = vec4( outgoingLight, diffuseColor.a );",
		"}",
	].join( "\n" ),
}
