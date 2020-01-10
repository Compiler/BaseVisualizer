#version 460 core


in VS_OUT_FG_IN
{
    vec2 texCoords;
	vec3 position;
	//vec3 normals;
	vec4 color;
	mat3 matTBN;

	vec3 tangentLightPos;
    vec3 tangentViewPos;
    vec3 tangentFragPos;

} fg_in;

out vec4 fragColor;


struct Material {
    sampler2D diffuse;
    sampler2D specular;
	sampler2D normalMap;
	sampler2D parallaxMap;
    float shininess;
}; 

struct PointLight {
    vec3 position;
  
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
	vec4 color;

	float intensity;

	//Attenuation
	float reach;
};



struct SpotLight {
    vec3 position;
	vec3 direction;
	float angle;//angle of 2d projected cone 
	float innerAngle; // angle from edge to begining of softness, 0 for sharp shadow
  
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
	vec4 color;

	//Attenuation
	float reach;

};

#define POINT_LIGHT_COUNT 1
#define SPOT_LIGHT_COUNT 1

uniform Material u_material;
uniform PointLight u_PointLight[POINT_LIGHT_COUNT];
uniform SpotLight u_SpotLight[SPOT_LIGHT_COUNT];
uniform float u_brightness;
uniform bool u_normalMapping, u_visualizeTangentSpace, u_useParallax;


vec3 pointLightCalculation(PointLight light, vec4 diffuseMap, vec4 specularMap, vec3 normal, vec3 viewDir){
	
	vec3 myMappedPosition = /*fg_in.position;*/fg_in.tangentFragPos;
	vec3 myLightPos = /*light.position;*/fg_in.tangentLightPos;
    vec3 ambient = diffuseMap.rgb * (light.ambient * light.color.rgb);
	
	//vec3 lightToFragDirection = normalize(light.position - myMappedPosition);  
	vec3 lightToFragDirection = normalize(myLightPos - myMappedPosition);
	vec3 halfwayDir = normalize(lightToFragDirection + viewDir);

	float diff = max(dot(normal, lightToFragDirection), 0.0);
	vec3 diffuse = (diff * diffuseMap.rgb) * (light.color.rgb * light.diffuse);

    vec3 reflectDir = reflect(-lightToFragDirection, normal);  
    float spec = pow(max(dot(normal, halfwayDir), 0.0), u_material.shininess);
    vec3 specular = (specularMap.rgb * spec) *  (light.color.rgb * light.specular);  

    float attDistance = length(myLightPos - myMappedPosition);
	
	//vec3 l = (light.position - fg_in.position) / length(light.position - fg_in.position);
	
	float attenuation = pow(max(1 - pow(attDistance/light.reach,4),0),2) 
						* (1 / (0.1f+(attDistance * attDistance)));

	diffuse*= attenuation; specular*= 0*attenuation;ambient *= attenuation*attenuation;
	
	return (ambient + diffuse + specular) * fg_in.color.rgb * light.intensity;
}


vec3 spotLightCalculation(SpotLight light, vec4 diffuseMap, vec4 specularMap, vec3 normal, vec3 viewDir){
	fragColor.a = diffuseMap.a;
	
	vec3 myMappedPosition = /*fg_in.position;*/fg_in.tangentFragPos;
	vec3 myLightPos = /*light.position;*/fg_in.tangentLightPos;
	
    vec3 ambient = diffuseMap.rgb * (light.ambient * light.color.rgb);
	vec3 lightToFragDirection = normalize(myLightPos - myMappedPosition);  
	vec3 halfwayDir = normalize(lightToFragDirection + viewDir);

	float theta = degrees(acos(dot(lightToFragDirection, normalize(transpose(fg_in.matTBN) * -light.direction))));
    float attDistance = length(myLightPos - myMappedPosition);

	float softness = smoothstep(0.0, 1.0, (theta - light.angle) / (light.innerAngle - light.angle));


	float diff = max(dot(normal, lightToFragDirection), 0.0);
	vec3 diffuse = (diff * diffuseMap.rgb) * (light.color.rgb * light.diffuse);

    float spec = pow(max(dot(normal, halfwayDir), 0.0), u_material.shininess);
    vec3 specular = (specularMap.rgb * spec) *  (light.color.rgb * 1);  

	float attenuation = pow(max(1 - pow(attDistance/light.reach,4),0),2) 
						* (1 / (0.1f+(attDistance * attDistance)));
	
	diffuse*= attenuation * softness; specular*= attenuation * softness;ambient*= attenuation* attenuation;
	
	return ((ambient + diffuse + specular) * fg_in.color.rgb) * softness;
}


vec2 computeParallaxCoords(vec3 viewDir, float scale){

// number of depth layers
	const float magg = 16;
    const float minLayers = 8* magg;
    const float maxLayers = 32 * magg;
    float numLayers = mix(maxLayers, minLayers, abs(dot(vec3(0.0, 0.0, 1.0), viewDir)));  
    // calculate the size of each layer
    float layerDepth = 1.0 / numLayers;
    // depth of current layer
    float currentLayerDepth = 0.0;
    // the amount to shift the texture coordinates per layer (from vector P)
    vec2 P = viewDir.xy * scale; 
    vec2 deltaTexCoords = P / numLayers;
	// get initial values
	vec2 currentTexCoords = fg_in.texCoords;
	float currentDepthMapValue = texture(u_material.parallaxMap, currentTexCoords).r;
  
	while(currentLayerDepth < currentDepthMapValue)
	{
		// shift texture coordinates along direction of P
		currentTexCoords -= deltaTexCoords;
		// get depthmap value at current texture coordinates
		currentDepthMapValue = texture(u_material.parallaxMap, currentTexCoords).r;  
		// get depth of next layer
		currentLayerDepth += layerDepth;  
	}

		// get texture coordinates before collision (reverse operations)
	vec2 prevTexCoords = currentTexCoords + deltaTexCoords;

	// get depth after and before collision for linear interpolation
	float afterDepth  = currentDepthMapValue - currentLayerDepth;
	float beforeDepth = texture(u_material.parallaxMap, prevTexCoords).r - currentLayerDepth + layerDepth;
 
	// interpolation of texture coordinates
	float weight = afterDepth / (afterDepth - beforeDepth);
	vec2 finalTexCoords = prevTexCoords * weight + currentTexCoords * (1.0 - weight);

	return finalTexCoords;  
	
	
	//float heightShift = scale * texture(u_material.parallaxMap, fg_in.texCoords).r;
	//return fg_in.texCoords - viewDir.xy * heightShift;
	//return fg_in.texCoords - ((viewDir.xy / viewDir.z) * heightShift);
}


void main(){
    vec3 viewDir = normalize(fg_in.tangentViewPos - fg_in.tangentFragPos);
	vec2 parallaxMap;
	parallaxMap = fg_in.texCoords;
	if(u_useParallax)
		parallaxMap = computeParallaxCoords(viewDir, 0.075f);

	 
	vec4 diffuseMap = texture(u_material.diffuse, parallaxMap);
	vec4 specularMap = texture(u_material.specular, parallaxMap); 


	
	vec3 norm = fg_in.matTBN[2];
	
	if(u_normalMapping){
		norm = normalize(texture(u_material.normalMap, parallaxMap).rgb * 2.0 - 1.0); 
		//norm.r = -norm.r;
	}

    vec3 result = vec3(0);
	for(int i =0; i < POINT_LIGHT_COUNT; i++)
		result += pointLightCalculation(u_PointLight[i], diffuseMap, specularMap, norm, viewDir); 
	for(int i =0; i < SPOT_LIGHT_COUNT; i++)
		result += spotLightCalculation(u_SpotLight[i],  diffuseMap, specularMap, norm, viewDir); 
	fragColor.rgb = pow(result.rgb, vec3(1.0f/2.2f));
	if(u_visualizeTangentSpace){
		fragColor.rgb = viewDir;
	}

	
}	
