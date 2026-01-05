// Global State
let currentArtifact = null;
let activeEntity = null;    // NEW: Remembers which 3D model is on screen
let isRotating = false;     // NEW: Remembers if spinning is ON or OFF
let isXray = false;         // NEW: Remembers if X-ray is ON or OFF
let collected = new Set();
const TOTAL_TALISMANS = 8;
let glowIntervals = {};

const ARTIFACTS = {
    dog: { name: "Dog", power: "Immortality", color: 0x00ffcc, markerId: "marker-dog", entityId: "entity-dog", quiz: { q: "Power of Dog?", a: "Immortality", options: ["Speed", "Immortality", "Flight"] } },
    dragon: { name: "Dragon", power: "Fire", color: 0xff3300, markerId: "marker-dragon", entityId: "entity-dragon", quiz: { q: "Power of Dragon?", a: "Fire", options: ["Ice", "Fire", "Wind"] } },
    horse: { name: "Horse", power: "Healing", color: 0x66ff66, markerId: "marker-horse", entityId: "entity-horse", quiz: { q: "Power of Horse?", a: "Healing", options: ["Healing", "Speed", "Strength"] } },
    monkey: { name: "Monkey", power: "Shapeshifting", color: 0xffcc00, markerId: "marker-monkey", entityId: "entity-monkey", quiz: { q: "Power of Monkey?", a: "Shapeshifting", options: ["Flight", "Shapeshifting", "Fire"] } },
    rabbit: { name: "Rabbit", power: "Speed", color: 0x9966ff, markerId: "marker-rabbit", entityId: "entity-rabbit", quiz: { q: "Power of Rabbit?", a: "Speed", options: ["Speed", "Healing", "Flight"] } },
    rat: { name: "Rat", power: "Animation", color: 0xff66cc, markerId: "marker-rat", entityId: "entity-rat", quiz: { q: "Power of Rat?", a: "Animation", options: ["Animation", "Teleport", "Strength"] } },
    rooster: { name: "Rooster", power: "Flight", color: 0xffffff, markerId: "marker-rooster", entityId: "entity-rooster", quiz: { q: "Power of Rooster?", a: "Flight", options: ["Flight", "Speed", "Fire"] } },
    sheep: { name: "Sheep", power: "Astral Projection", color: 0x9999ff, markerId: "marker-sheep", entityId: "entity-sheep", quiz: { q: "Power of Sheep?", a: "Astral Projection", options: ["Healing", "Astral Projection", "Speed"] } }
};

//function startGame() {
    //document.getElementById("start-screen").style.display = "none";
    // Mobile browsers require a user gesture to play audio/speech
    //const video = document.querySelector('video');
    //if (video) { video.play(); }
    
    //speak("System Initialized. Scan a talisman.");
//}

function startGame() {
    const startScreen = document.getElementById("start-screen");
    startScreen.style.opacity = "0";
    setTimeout(() => { 
        startScreen.style.display = "none"; 
    }, 500); // Fades out then removes

    const video = document.querySelector('video');
    if (video) {
        video.style.display = "block"; // Force visibility
        video.play();
    }
    speak("System Online.");
}

document.addEventListener("DOMContentLoaded", () => {
    Object.keys(ARTIFACTS).forEach(key => {
        const data = ARTIFACTS[key];
        const marker = document.getElementById(data.markerId);
        
        marker.addEventListener("markerFound", () => {
            currentArtifact = key;
            const entity = document.getElementById(data.entityId);
            activeEntity = entity;
            applyGlow(entity, data.color, key);
            playScanSound();
            registerCollection(key);
        });

        marker.addEventListener("markerLost", () => {
            removeGlow(key);
            if(currentArtifact === key) currentArtifact = null;
        });
    });
});

function registerCollection(key) {
    if (!collected.has(key)) {
        collected.add(key);
        const percent = (collected.size / TOTAL_TALISMANS) * 100;
        document.getElementById("power-fill").style.height = percent + "%";
        if (collected.size === TOTAL_TALISMANS) gameSuccess();
    }
}

function applyGlow(entity, color, key) {
    if (!entity || !entity.object3D) return;
    removeGlow(key);
    entity.object3D.traverse(mesh => {
        if (mesh.isMesh) {
            mesh.material.emissive = new THREE.Color(color);
            mesh.material.emissiveIntensity = 0.2; // Keep it low to see the stone detail
            mesh.material.needsUpdate = true;
            let up = true;
            glowIntervals[key] = setInterval(() => {
                //mesh.material.emissiveIntensity = (mesh.material.emissiveIntensity || 0.5) + (up ? 0.05 : -0.05);
                //if (mesh.material.emissiveIntensity >= 1.5) up = false;
                //if (mesh.material.emissiveIntensity <= 0.5) up = true;
                let intensity = mesh.material.emissiveIntensity;
                intensity = up ? intensity + 0.01 : intensity - 0.01;
                if (intensity >= 0.5) up = false;
                if (intensity <= 0.1) up = true;
                mesh.material.emissiveIntensity = intensity;
            }, 100);
        }
    });
}

function removeGlow(key) {
    if (glowIntervals[key]) { clearInterval(glowIntervals[key]); delete glowIntervals[key]; }
}

window.startQuiz = function() {
    if (!currentArtifact) { alert("Scan a talisman first!"); return; }
    const q = ARTIFACTS[currentArtifact].quiz;
    document.getElementById("quiz-container").classList.remove("hidden");
    document.getElementById("quiz-question").innerText = q.q;
    const opts = document.getElementById("quiz-options");
    opts.innerHTML = "";
    q.options.forEach(o => {
        const b = document.createElement("button");
        b.className = "quiz-btn";
        b.innerText = o;
        b.onclick = () => {
            speak(o === q.a ? "Correct!" : "Try again!");
            document.getElementById("quiz-container").classList.add("hidden");
        };
        opts.appendChild(b);
    });
};

//window.triggerVoiceInfo = function() {
    //if (currentArtifact) speak(`${ARTIFACTS[currentArtifact].name} Talisman. Power: ${ARTIFACTS[currentArtifact].power}`);
//};

window.triggerVoiceInfo = function() {
    if (currentArtifact) {
        speak(`${ARTIFACTS[currentArtifact].name}. Power: ${ARTIFACTS[currentArtifact].power}`);
    } else {
        alert("Scan a talisman first!");
    }
};

window.toggleRotation = function() {
    if (!activeEntity) return alert("No talisman detected!");
    isRotating = !isRotating;
    if (isRotating) {
        // Starts rotation
        activeEntity.setAttribute('animation', 'property: rotation; to: 0 360 0; loop: true; dur: 4000; easing: linear');
    } else {
        // Stops rotation
        activeEntity.removeAttribute('animation');
    }
};

window.toggleXray = function() {
    if (!activeEntity) return alert("No talisman detected!");
    isXray = !isXray;
    activeEntity.object3D.traverse(node => {
        if (node.isMesh) {
            node.material.transparent = true;
            node.material.opacity = isXray ? 0.3 : 1.0; // 0.3 makes it "ghostly"
        }
    });
};

function speak(t) {
    speechSynthesis.cancel();
    speechSynthesis.speak(new SpeechSynthesisUtterance(t));
}

function playScanSound() {
    new Audio("https://cdn.pixabay.com/audio/2022/03/15/audio_6dfe9a8c36.mp3").play();
}

function gameSuccess() {
    const end = document.createElement("div");
    end.id = "game-success";
    end.innerHTML = `<h1>✨ ASCENDED ✨</h1><p>All Talismans Found</p><button onclick="location.reload()">REPLAY</button>`;
    document.body.appendChild(end);
    speak("The power is yours. All talismans collected.");
}
