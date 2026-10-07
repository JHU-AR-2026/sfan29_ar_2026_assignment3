var createScene = function () {
    var scene = new BABYLON.Scene(engine);

    var ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);
    ground.isVisible = false;

    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);

    var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 32 }, scene);
    sphere.position.y = 1;
    sphere.position.x = 1;

    var cylinder = BABYLON.MeshBuilder.CreateCylinder("cylinder", { height: 2, diameter: 1 }, scene);
    cylinder.position.y = 1;
    cylinder.position.x = -1;

    // Vertex Shader
    BABYLON.Effect.ShadersStore["customVertexShader"] = `
    precision highp float;

    attribute vec3 position;
    attribute vec3 normal;

    uniform mat4 world;
    uniform mat4 worldViewProjection;

    varying vec3 vPosW;
    varying vec3 vNormalW;

    void main() {
        vec4 pw = world * vec4(position, 1.0);
        vPosW = pw.xyz;
        vNormalW = normalize(mat3(world) * normal);
        gl_Position = worldViewProjection * vec4(position, 1.0);
    }`;

    // Fragment Shader with 2 Lights
    BABYLON.Effect.ShadersStore["customFragmentShader"] = `
    precision highp float;

    varying vec3 vPosW;
    varying vec3 vNormalW;

    uniform float uMatAmbient;
    uniform vec3  uMatDiffuse;
    uniform vec3  uMatSpecular;
    uniform float uMatShininess;

    uniform vec3 uCameraPos;

    // Light 1
    uniform vec3 uPointLightColor;
    uniform vec3 uPointLightPos;

    // Light 2
    uniform vec3 uPointLightColor2;
    uniform vec3 uPointLightPos2;

    vec3 shadePointLight(
        vec3 lColor, vec3 lPos, vec3 N, vec3 V, vec3 kd, vec3 ks, float shin)
    {
        vec3 lightDir = lPos - vPosW;
        float dist = length(lightDir);
        vec3 L = normalize(lightDir);

        float attenuation = 1.0 / (1.0 + 0.1 * dist + 0.05 * dist * dist);

        float diff = max(dot(N, L), 0.0);
        vec3 diffuse = kd * diff * lColor;

        vec3 R = reflect(-L, N);
        float spec = 0.0;
        if (diff > 0.0) {
            spec = pow(max(dot(R, V), 0.0), shin);
        }
        vec3 specular = ks * spec * lColor;

        return (diffuse + specular) * attenuation;
    }

    void main()
    {
        vec3 N = normalize(vNormalW);
        vec3 V = normalize(uCameraPos - vPosW);

        // Constant ambient term (evaluated once)
        vec3 color = uMatAmbient * uMatDiffuse;

        // Light 1 contribution
        color += shadePointLight(
            uPointLightColor,
            uPointLightPos,
            N, V,
            uMatDiffuse, uMatSpecular, uMatShininess
        );

        // Light 2 contribution
        color += shadePointLight(
            uPointLightColor2,
            uPointLightPos2,
            N, V,
            uMatDiffuse, uMatSpecular, uMatShininess
        );

        gl_FragColor = vec4(color, 1.0);
    }`;

    var shaderMat = new BABYLON.ShaderMaterial("custom", scene, "custom", {
        attributes: ["position", "normal"],
        uniforms: [
            "world", "worldViewProjection",
            "uCameraPos",
            "uMatAmbient", "uMatDiffuse", "uMatSpecular", "uMatShininess",
            "uPointLightColor", "uPointLightPos",
            "uPointLightColor2", "uPointLightPos2"
        ]
    });

    // Material parameters
    shaderMat.setFloat("uMatAmbient", 0.0);
    shaderMat.setColor3("uMatDiffuse",  new BABYLON.Color3(0.06, 0.05, 0.81));
    shaderMat.setColor3("uMatSpecular", new BABYLON.Color3(1.0, 1.0, 1.0));
    shaderMat.setFloat("uMatShininess", 2.0);

    // Light 1 (Cool cyan-blue from upper right)
    shaderMat.setColor3("uPointLightColor", new BABYLON.Color3(0.06, 0.81, 0.03));
    shaderMat.setVector3("uPointLightPos", new BABYLON.Vector3(3.0, 3.5, -5.0));

    // Light 2 (Warm amber-yellow from upper left)
    shaderMat.setColor3("uPointLightColor2", new BABYLON.Color3(0.08, 0.65, 0.6));
    shaderMat.setVector3("uPointLightPos2", new BABYLON.Vector3(-6.0, 3.5, -2.5));

    // Update camera position per frame
    scene.onBeforeRenderObservable.add(function () {
        shaderMat.setVector3("uCameraPos", camera.position);
    });

    sphere.material = shaderMat;
    cylinder.material = shaderMat;

    return scene;
};

export default createScene;