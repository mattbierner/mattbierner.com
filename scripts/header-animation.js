const initializeHeaderAnimation = () => {
    const canvas = document.querySelector("[data-hero-field]");
    const title = document.getElementById("intro-title");
    const hero = canvas && canvas.closest(".hero");

    if (!canvas || !title || !hero) {
        return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const palette = ["#0057ff", "#ff2d20", "#ffd400", "#00b96b", "#00b8ff"];
    const blobCount = 18;
    const blobMergeDistance = 24;
    const titlePadding = 22;
    const titleInfluence = 92;
    const damping = 0.94;
    const lavaTimeScale = 0.42;
    const lavaDriftStrength = 0.026;
    const lavaRiseStrength = 0.041;
    const lavaFallStrength = 0.032;
    const lavaSideCurrentStrength = 0.014;
    const softBoundsStrength = 0.006;
    const pointerRepelInfluence = 230;
    const pointerAttractInfluence = 520;
    const pointerRepelStrength = 0.052;
    const pointerAttractStrength = 0.19;
    const blobStickDistance = 76;
    const blobStickStrength = 0.0055;
    const blobRepelOverlap = 15;
    const blobRepelStrength = 0.032;
    const startupForceDuration = 1600;
    const sceneScaleReferenceWidth = 780;
    const minSceneScale = 0.62;
    const maxPixelRatio = 3;

    const contextAttributes = {
        alpha: false,
        antialias: false,
        depth: false,
        premultipliedAlpha: false,
        stencil: false,
    };

    const gl = canvas.getContext("webgl", contextAttributes)
        || canvas.getContext("experimental-webgl", contextAttributes);

    if (!gl) {
        canvas.hidden = true;
        return;
    }

    const vertexShaderSource = `
attribute vec2 a_position;

uniform vec2 u_resolution;

varying vec2 v_position;

void main() {
    v_position = vec2(
        (a_position.x * 0.5 + 0.5) * u_resolution.x,
        (0.5 - a_position.y * 0.5) * u_resolution.y
    );
    gl_Position = vec4(a_position, 0.0, 1.0);
}`;

    const fragmentShaderSource = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

const int BLOB_COUNT = ${blobCount};
const int COLOR_COUNT = ${palette.length};
const float FAR_DISTANCE = 8192.0;

uniform vec4 u_blobs[BLOB_COUNT];
uniform vec4 u_meta[BLOB_COUNT];
uniform vec3 u_palette[COLOR_COUNT];
uniform float u_mergeRadius;
uniform float u_colorBlendRadius;
uniform float u_edgeWidth;

varying vec2 v_position;

float smoothUnion(float distanceA, float distanceB, float radius) {
    if (distanceA > FAR_DISTANCE * 0.5) {
        return distanceB;
    }

    float blend = clamp(0.5 + 0.5 * (distanceB - distanceA) / radius, 0.0, 1.0);

    return mix(distanceB, distanceA, blend) - radius * blend * (1.0 - blend);
}

vec3 paletteColor(float colorIndex) {
    vec3 color = u_palette[0];

    if (abs(colorIndex - 1.0) < 0.5) {
        color = u_palette[1];
    } else if (abs(colorIndex - 2.0) < 0.5) {
        color = u_palette[2];
    } else if (abs(colorIndex - 3.0) < 0.5) {
        color = u_palette[3];
    } else if (abs(colorIndex - 4.0) < 0.5) {
        color = u_palette[4];
    }

    return color;
}

void main() {
    float sceneDistance = FAR_DISTANCE;
    vec3 blendedColor = vec3(0.0);
    float blendedWeight = 0.0;

    for (int index = 0; index < BLOB_COUNT; index++) {
        vec4 blob = u_blobs[index];
        vec2 delta = v_position - blob.xy;
        float reach = blob.z + u_colorBlendRadius;

        if (abs(delta.x) > reach || abs(delta.y) > reach) {
            continue;
        }

        float sqDistance = dot(delta, delta);

        if (sqDistance > reach * reach) {
            continue;
        }

        float blobDistance = sqrt(sqDistance) - blob.z;
        vec4 meta = u_meta[index];
        float colorWeight = 1.0 - smoothstep(-u_colorBlendRadius, u_colorBlendRadius, blobDistance);

        sceneDistance = smoothUnion(sceneDistance, blobDistance, u_mergeRadius);
        blendedColor += paletteColor(meta.y) * colorWeight;
        blendedWeight += colorWeight;
    }

    if (blendedWeight < 0.001) {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        return;
    }

    vec3 shapeColor = blendedColor / blendedWeight;
    float fillAlpha = 1.0 - smoothstep(-u_edgeWidth, u_edgeWidth, sceneDistance);
    vec3 color = mix(vec3(1.0), shapeColor, fillAlpha);

    gl_FragColor = vec4(color, 1.0);
}`;

    let animationFrame = null;
    let viewportWidth = 1;
    let viewportHeight = 1;
    let canvasWidth = 1;
    let canvasHeight = 1;
    let pixelRatio = 1;
    let sceneScale = 1;
    let titleBox = null;
    let blobs = [];
    let metricsDirty = true;
    let previousFrameTime = null;
    let physicsStartTime = null;
    const pointerState = {
        active: false,
        attracting: false,
        left: 0,
        top: 0,
        pointerId: null,
    };

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const randomBetween = (min, max) => min + Math.random() * (max - min);

    const hexToRgb = (color) => {
        const value = Number.parseInt(color.slice(1), 16);

        return [
            ((value >> 16) & 255) / 255,
            ((value >> 8) & 255) / 255,
            (value & 255) / 255,
        ];
    };

    const compileShader = (shaderType, shaderSource) => {
        const shader = gl.createShader(shaderType);

        if (!shader) {
            return null;
        }

        gl.shaderSource(shader, shaderSource);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.warn("Header shader compile failed:", gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    };

    const createShaderProgram = () => {
        const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
        const program = gl.createProgram();

        if (!vertexShader || !fragmentShader || !program) {
            return null;
        }

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.warn("Header shader link failed:", gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }

        return program;
    };

    const program = createShaderProgram();
    const positionBuffer = gl.createBuffer();

    if (!program || !positionBuffer) {
        canvas.hidden = true;
        return;
    }

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const uniforms = {
        resolution: gl.getUniformLocation(program, "u_resolution"),
        blobs: gl.getUniformLocation(program, "u_blobs[0]"),
        meta: gl.getUniformLocation(program, "u_meta[0]"),
        palette: gl.getUniformLocation(program, "u_palette[0]"),
        mergeRadius: gl.getUniformLocation(program, "u_mergeRadius"),
        colorBlendRadius: gl.getUniformLocation(program, "u_colorBlendRadius"),
        edgeWidth: gl.getUniformLocation(program, "u_edgeWidth"),
    };

    if (positionLocation < 0 || Object.values(uniforms).some((location) => !location)) {
        canvas.hidden = true;
        return;
    }

    const blobUniforms = new Float32Array(blobCount * 4);
    const metaUniforms = new Float32Array(blobCount * 4);
    const paletteUniforms = new Float32Array(palette.length * 3);

    palette.forEach((color, index) => {
        paletteUniforms.set(hexToRgb(color), index * 3);
    });

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.useProgram(program);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.uniform3fv(uniforms.palette, paletteUniforms);
    gl.clearColor(1, 1, 1, 1);

    const renderBlobs = (timeValue) => {
        for (let index = 0; index < blobCount; index++) {
            const blob = blobs[index];
            const offset = index * 4;

            blobUniforms[offset] = blob.left * sceneScale;
            blobUniforms[offset + 1] = blob.top * sceneScale;
            blobUniforms[offset + 2] = blob.radius * sceneScale;
            blobUniforms[offset + 3] = 0;
            metaUniforms[offset] = 0;
            metaUniforms[offset + 1] = blob.colorIndex;
            metaUniforms[offset + 2] = 0;
            metaUniforms[offset + 3] = 0;
        }

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.uniform2f(uniforms.resolution, viewportWidth, viewportHeight);
        gl.uniform1f(uniforms.mergeRadius, blobMergeDistance * sceneScale);
        gl.uniform1f(uniforms.colorBlendRadius, blobMergeDistance * sceneScale * 1.75);
        gl.uniform1f(uniforms.edgeWidth, Math.max(0.8, 1.6 / pixelRatio));
        gl.uniform4fv(uniforms.blobs, blobUniforms);
        gl.uniform4fv(uniforms.meta, metaUniforms);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const resizeCanvas = (width, height) => {
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }
    };

    const refreshMetrics = () => {
        const canvasRect = canvas.getBoundingClientRect();
        const nextPixelRatio = clamp(window.devicePixelRatio || 1, 1, maxPixelRatio);
        const width = Math.max(1, canvasRect.width);
        const height = Math.max(1, canvasRect.height);
        const nextSceneScale = clamp(width / sceneScaleReferenceWidth, minSceneScale, 1);

        viewportWidth = width;
        viewportHeight = height;
        canvasWidth = width / nextSceneScale;
        canvasHeight = height / nextSceneScale;
        pixelRatio = nextPixelRatio;
        sceneScale = nextSceneScale;

        resizeCanvas(Math.max(1, Math.ceil(width * pixelRatio)), Math.max(1, Math.ceil(height * pixelRatio)));

        const titleRect = title.getBoundingClientRect();
        titleBox = {
            left: (titleRect.left - canvasRect.left) / sceneScale,
            top: (titleRect.top - canvasRect.top) / sceneScale,
            width: titleRect.width / sceneScale,
            height: titleRect.height / sceneScale,
        };

        if (blobs.length === 0) {
            seedBlobs();
        }

        metricsDirty = false;
    };

    const markMetricsDirty = () => {
        metricsDirty = true;
    };

    const getPointerPosition = (event) => {
        const canvasRect = canvas.getBoundingClientRect();

        return {
            left: (event.clientX - canvasRect.left) / sceneScale,
            top: (event.clientY - canvasRect.top) / sceneScale,
        };
    };

    const updatePointerState = (event, attracting) => {
        const pointer = getPointerPosition(event);

        pointerState.active = true;
        pointerState.attracting = attracting;
        pointerState.left = pointer.left;
        pointerState.top = pointer.top;

        if (attracting) {
            pointerState.pointerId = event.pointerId;
        }
    };

    const clearPointerState = () => {
        if (!pointerState.attracting) {
            pointerState.active = false;
            pointerState.pointerId = null;
        }
    };

    const getStartupForceScale = (timeValue) => {
        if (physicsStartTime === null) {
            physicsStartTime = timeValue;
        }

        const progress = clamp((timeValue - physicsStartTime) / startupForceDuration, 0, 1);

        return progress * progress * (3 - 2 * progress);
    };

    const isInteractiveTarget = (target) => {
        if (!(target instanceof Element)) {
            return false;
        }

        return target.closest("a, button, input, select, textarea, summary, label");
    };

    const updatePointerHover = (event) => {
        if (isInteractiveTarget(event.target)) {
            clearPointerState();
            return;
        }

        updatePointerState(event, false);
    };

    const blobProfiles = [
        { minRadius: 34, maxRadius: 54 },
        { minRadius: 26, maxRadius: 44 },
        { minRadius: 40, maxRadius: 62 },
        { minRadius: 24, maxRadius: 39 },
        { minRadius: 32, maxRadius: 58 },
    ];

    const getBlobRadius = (blob) => blob.radius;

    const getBlobProfile = (index) => {
        const profile = blobProfiles[index % blobProfiles.length];

        return {
            radius: randomBetween(profile.minRadius, profile.maxRadius),
        };
    };

    const getSeedYRange = (flowDirection) => flowDirection < 0
        ? { min: canvasHeight * 0.62, max: canvasHeight * 1.16 }
        : { min: canvasHeight * -0.18, max: canvasHeight * 0.42 };

    const isOverTitle = (left, top, radius) => {
        if (!titleBox) {
            return false;
        }

        const padding = titlePadding + radius;

        return left > titleBox.left - padding
            && left < titleBox.left + titleBox.width + padding
            && top > titleBox.top - padding
            && top < titleBox.top + titleBox.height + padding;
    };

    const getSeedPosition = (flowDirection, radius) => {
        const yRange = getSeedYRange(flowDirection);

        for (let attempt = 0; attempt < 24; attempt++) {
            const left = randomBetween(canvasWidth * -0.08, canvasWidth * 1.08);
            const top = randomBetween(yRange.min, yRange.max);

            if (!isOverTitle(left, top, radius)) {
                return { left, top };
            }
        }

        const left = randomBetween(canvasWidth * -0.08, canvasWidth * 1.08);
        const top = flowDirection < 0
            ? Math.max(yRange.min, titleBox.top + titleBox.height + titlePadding + radius)
            : Math.min(yRange.max, titleBox.top - titlePadding - radius);

        return { left, top };
    };

    const seedBlobs = () => {
        blobs = [];

        for (let index = 0; index < blobCount; index++) {
            const flowDirection = index % 3 === 0 ? 1 : -1;
            const profile = getBlobProfile(index);
            const position = getSeedPosition(flowDirection, profile.radius);

            blobs.push({
                colorIndex: index % palette.length,
                left: position.left,
                top: position.top,
                radius: profile.radius,
                velocityX: randomBetween(-0.6, 0.6),
                velocityY: randomBetween(-0.6, 0.6),
                phase: randomBetween(0, Math.PI * 2),
                flowDirection,
                flowSpeed: randomBetween(0.82, 1.18),
            });
        }
    };

    const roundedRectDistance = (left, top, box, radius) => {
        const centerX = box.left + box.width / 2;
        const centerY = box.top + box.height / 2;
        const halfWidth = box.width / 2 + titlePadding;
        const halfHeight = box.height / 2 + titlePadding;
        const localX = Math.abs(left - centerX) - (halfWidth - radius);
        const localY = Math.abs(top - centerY) - (halfHeight - radius);
        const outsideX = Math.max(localX, 0);
        const outsideY = Math.max(localY, 0);

        return Math.sqrt(outsideX * outsideX + outsideY * outsideY) + Math.min(Math.max(localX, localY), 0) - radius;
    };

    const getDistanceNormal = (distanceAt, left, top, fallbackAngle = 0) => {
        const epsilon = 1;
        const deltaX = distanceAt(left + epsilon, top) - distanceAt(left - epsilon, top);
        const deltaY = distanceAt(left, top + epsilon) - distanceAt(left, top - epsilon);
        const normalLength = Math.hypot(deltaX, deltaY);

        if (normalLength < 0.0001) {
            return {
                x: Math.cos(fallbackAngle),
                y: Math.sin(fallbackAngle),
            };
        }

        return {
            x: deltaX / normalLength,
            y: deltaY / normalLength,
        };
    };

    const applyTitleSdfForce = (blob, frameScale) => {
        const radius = blob.radius;
        const reach = titleInfluence + radius + titlePadding;

        if (blob.left < titleBox.left - reach
            || blob.left > titleBox.left + titleBox.width + reach
            || blob.top < titleBox.top - reach
            || blob.top > titleBox.top + titleBox.height + reach) {
            return;
        }

        const distanceAt = (left, top) => roundedRectDistance(left, top, titleBox, 18) - radius;
        const distance = distanceAt(blob.left, blob.top);

        if (distance >= titleInfluence) {
            return;
        }

        const normal = getDistanceNormal(distanceAt, blob.left, blob.top, blob.phase);
        const strength = (1 - clamp(distance / titleInfluence, 0, 1)) ** 2;

        blob.velocityX += normal.x * strength * 4.2 * frameScale;
        blob.velocityY += normal.y * strength * 4.2 * frameScale;
    };

    const applyLavaDriftForce = (blob, timeValue, frameScale) => {
        const time = (timeValue / 1000) * lavaTimeScale;
        const radius = getBlobRadius(blob);
        const topTurn = -radius * 0.12;
        const bottomTurn = canvasHeight + radius * 0.2;

        if (blob.flowDirection < 0 && blob.top < topTurn) {
            blob.flowDirection = 1;
            blob.velocityY = Math.max(blob.velocityY, 0) * 0.35;
        } else if (blob.flowDirection > 0 && blob.top > bottomTurn) {
            blob.flowDirection = -1;
            blob.velocityY = Math.min(blob.velocityY, 0) * 0.35;
        }

        const driftX = Math.sin(time * 0.42 + blob.phase * 1.7)
            + Math.cos(time * 0.31 + blob.top * 0.012 + blob.phase);
        const driftY = Math.cos(time * 0.36 + blob.phase * 1.3)
            + Math.sin(time * 0.24 + blob.left * 0.01 - blob.phase * 0.7);
        const sideCurrent = Math.sin(time * 0.2 + blob.phase * 1.9 + blob.top * 0.007);
        const verticalCurrent = blob.flowDirection < 0 ? -lavaRiseStrength : lavaFallStrength;

        blob.velocityX += driftX * lavaDriftStrength * frameScale;
        blob.velocityX += sideCurrent * lavaSideCurrentStrength * blob.flowSpeed * frameScale;
        blob.velocityY += driftY * lavaDriftStrength * 0.24 * frameScale;
        blob.velocityY += verticalCurrent * blob.flowSpeed * frameScale;
    };

    const applyPointerForce = (blob, frameScale) => {
        if (!pointerState.active) {
            return;
        }

        const influence = pointerState.attracting ? pointerAttractInfluence : pointerRepelInfluence;
        const deltaX = blob.left - pointerState.left;
        const deltaY = blob.top - pointerState.top;
        const sqDistance = deltaX * deltaX + deltaY * deltaY;

        if (sqDistance > influence * influence) {
            return;
        }

        const distance = Math.max(0.001, Math.sqrt(sqDistance));
        const normalX = deltaX / distance;
        const normalY = deltaY / distance;
        const normalizedDistance = clamp(distance / influence, 0, 1);
        const falloff = pointerState.attracting ? 1 - normalizedDistance : (1 - normalizedDistance) ** 2;
        const direction = pointerState.attracting ? -1 : 1;
        const strength = (pointerState.attracting ? pointerAttractStrength : pointerRepelStrength) * falloff * frameScale;

        blob.velocityX += normalX * direction * strength;
        blob.velocityY += normalY * direction * strength;
    };

    const applyBlobImpulse = (blob, impulseX, impulseY) => {
        blob.velocityX += impulseX;
        blob.velocityY += impulseY;
    };

    const applyBlobPairForces = (frameScale) => {
        for (let index = 0; index < blobs.length; index++) {
            const blobA = blobs[index];
            const radiusA = blobA.radius;

            for (let nextIndex = index + 1; nextIndex < blobs.length; nextIndex++) {
                const blobB = blobs[nextIndex];
                const radiusB = blobB.radius;
                const sumRadii = radiusA + radiusB;
                const maxInteraction = sumRadii + blobStickDistance;
                const deltaX = blobB.left - blobA.left;
                const deltaY = blobB.top - blobA.top;
                const sqDistance = deltaX * deltaX + deltaY * deltaY;

                if (sqDistance > maxInteraction * maxInteraction) {
                    continue;
                }

                const distance = Math.max(0.001, Math.sqrt(sqDistance));
                const normalX = deltaX / distance;
                const normalY = deltaY / distance;
                const overlap = sumRadii - distance;
                const edgeDistance = distance - sumRadii;

                if (overlap > blobRepelOverlap) {
                    const repel = ((overlap - blobRepelOverlap) / Math.min(radiusA, radiusB)) ** 2 * blobRepelStrength * frameScale;

                    applyBlobImpulse(blobA, -normalX * repel, -normalY * repel);
                    applyBlobImpulse(blobB, normalX * repel, normalY * repel);
                }

                if (edgeDistance < blobStickDistance) {
                    const closeness = 1 - clamp(Math.max(edgeDistance, 0) / blobStickDistance, 0, 1);
                    const deepOverlapFade = 1 - clamp((overlap - blobRepelOverlap) / blobRepelOverlap, 0, 1);
                    const stick = closeness * deepOverlapFade * blobStickStrength * frameScale;

                    applyBlobImpulse(blobA, normalX * stick, normalY * stick);
                    applyBlobImpulse(blobB, -normalX * stick, -normalY * stick);
                }
            }
        }
    };

    const applySoftBoundsForce = (blob, frameScale) => {
        const radius = getBlobRadius(blob);
        const minLeft = -radius * 0.8;
        const maxLeft = canvasWidth + radius * 0.8;
        const minTop = -radius * 0.55;
        const maxTop = canvasHeight + radius * 0.55;

        if (blob.left < minLeft) {
            blob.velocityX += (minLeft - blob.left) * softBoundsStrength * frameScale;
        } else if (blob.left > maxLeft) {
            blob.velocityX += (maxLeft - blob.left) * softBoundsStrength * frameScale;
        }

        if (blob.top < minTop) {
            blob.velocityY += (minTop - blob.top) * softBoundsStrength * frameScale;
        } else if (blob.top > maxTop) {
            blob.velocityY += (maxTop - blob.top) * softBoundsStrength * frameScale;
        }
    };

    const updateBlobPhysics = (timeValue) => {
        const deltaTime = previousFrameTime === null
            ? 1 / 60
            : clamp((timeValue - previousFrameTime) / 1000, 0, 1 / 30);
        const frameScale = deltaTime * 60;
        const forceScale = getStartupForceScale(timeValue);
        const scaledFrame = frameScale * forceScale;

        previousFrameTime = timeValue;

        for (const blob of blobs) {
            applyTitleSdfForce(blob, scaledFrame);
            applyLavaDriftForce(blob, timeValue, scaledFrame);
            applyPointerForce(blob, frameScale);
            applySoftBoundsForce(blob, scaledFrame);
        }

        applyBlobPairForces(scaledFrame);

        for (const blob of blobs) {
            const damp = damping ** frameScale;

            blob.velocityX *= damp;
            blob.velocityY *= damp;
            blob.left += blob.velocityX * frameScale;
            blob.top += blob.velocityY * frameScale;
        }
    };

    const startPointerAttraction = (event) => {
        if (event.button !== 0 || isInteractiveTarget(event.target)) {
            return;
        }

        updatePointerState(event, true);

        if (hero.setPointerCapture) {
            hero.setPointerCapture(event.pointerId);
        }

        event.preventDefault();
    };

    const updatePointerInteraction = (event) => {
        if (pointerState.attracting && pointerState.pointerId === event.pointerId) {
            updatePointerState(event, true);
            event.preventDefault();
            return;
        }

        updatePointerHover(event);
    };

    const stopPointerAttraction = (event) => {
        if (!pointerState.attracting || pointerState.pointerId !== event.pointerId) {
            return;
        }

        updatePointerState(event, false);
        pointerState.attracting = false;
        pointerState.pointerId = null;

        if (hero.hasPointerCapture && hero.hasPointerCapture(event.pointerId)) {
            hero.releasePointerCapture(event.pointerId);
        }
    };

    const clearPointerHover = () => {
        clearPointerState();
    };

    const drawFrame = (timeValue) => {
        if (metricsDirty || !titleBox) {
            refreshMetrics();
        }

        updateBlobPhysics(timeValue);
        renderBlobs(timeValue);
    };

    const animate = (timeValue) => {
        drawFrame(timeValue);
        animationFrame = window.requestAnimationFrame(animate);
    };

    const start = () => {
        console.log("Starting header animation");
        if (!animationFrame) {
            previousFrameTime = null;
            animationFrame = window.requestAnimationFrame(animate);
        }
    };

    const stop = () => {
        console.log("Stopping header animation");
        if (animationFrame) {
            window.cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
    };

    const ANIMATION_PREF_KEY = "header-animation";

    const getStoredAnimationPreference = () => {
        try {
            const value = window.localStorage.getItem(ANIMATION_PREF_KEY);
            if (value === "on" || value === "off") {
                return value;
            }
        } catch (error) {
            // localStorage may be unavailable (private mode, disabled storage); ignore.
        }
        return null;
    };

    const setStoredAnimationPreference = (value) => {
        try {
            if (value === null) {
                window.localStorage.removeItem(ANIMATION_PREF_KEY);
            } else {
                window.localStorage.setItem(ANIMATION_PREF_KEY, value);
            }
        } catch (error) {
            // ignore
        }
    };

    const shouldAnimate = () => {
        const stored = getStoredAnimationPreference();
        if (stored === "on") {
            return true;
        }
        if (stored === "off") {
            return false;
        }
        return !prefersReducedMotion.matches;
    };

    const animationToggle = document.querySelector("[data-hero-animation-toggle]");

    const updateAnimationToggle = (animating) => {
        if (!animationToggle) {
            return;
        }

        const label = animating ? "Pause hero animation" : "Play hero animation";
        animationToggle.setAttribute("aria-pressed", String(animating));
        animationToggle.setAttribute("aria-label", label);
        animationToggle.setAttribute("title", label);
    };

    if (animationToggle) {
        animationToggle.hidden = false;
        animationToggle.addEventListener("click", () => {
            const nextAnimating = !shouldAnimate();
            setStoredAnimationPreference(nextAnimating ? "on" : "off");
            updateAnimationToggle(nextAnimating);

            if (nextAnimating) {
                start();
            } else {
                stop();
            }
        });
    }

    window.addEventListener("resize", markMetricsDirty);
    window.addEventListener("orientationchange", markMetricsDirty);

    if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", markMetricsDirty);
    }

    hero.addEventListener("pointerdown", startPointerAttraction);
    hero.addEventListener("pointermove", updatePointerInteraction);
    hero.addEventListener("pointerup", stopPointerAttraction);
    hero.addEventListener("pointercancel", stopPointerAttraction);
    hero.addEventListener("pointerleave", clearPointerHover);

    if (document.fonts) {
        document.fonts.ready.then(markMetricsDirty);
    }

    refreshMetrics();
    drawFrame(0);
    updateAnimationToggle(shouldAnimate());

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            stop();
        } else if (shouldAnimate()) {
            start();
        }
    });

    window.addEventListener("pagehide", stop);
    window.addEventListener("pageshow", () => {
        markMetricsDirty();
        if (shouldAnimate()) {
            start();
        }
    });

    prefersReducedMotion.addEventListener("change", () => {
        if (getStoredAnimationPreference() !== null) {
            return;
        }

        const animating = shouldAnimate();
        updateAnimationToggle(animating);

        if (animating) {
            start();
        } else {
            stop();
        }
    });

    console.log("Initializing header animation");

    if (shouldAnimate()) {
        start();
    }
};

initializeHeaderAnimation();