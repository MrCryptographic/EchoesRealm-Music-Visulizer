window.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENT REFERENCES ---
    const canvas = document.getElementById('visualizerCanvas'), ctx = canvas.getContext('2d'), epilepsyWarning = document.getElementById('epilepsyWarning'), acceptWarningButton = document.getElementById('acceptWarningButton'), uiContainer = document.getElementById('uiContainer'), settingsButton = document.getElementById('settingsButton'), settingsPanel = document.getElementById('settingsPanel'), closeSettingsButton = document.getElementById('closeButton'), visualizerOptionsFieldset = document.getElementById('visualizerOptionsFieldset'), fillCheckbox = document.getElementById('fillCheckbox'), directionSelect = document.getElementById('directionSelect'), rotationSlider = document.getElementById('rotationSlider'), selectPfpButton = document.getElementById('selectPfpButton'), clearPfpButton = document.getElementById('clearPfpButton'), pfpPreview = document.getElementById('pfpPreview'), dynamicEffectsFieldset = document.getElementById('dynamicEffectsFieldset'), visualizerSelect = document.getElementById('visualizerSelect'), dynamicCheckbox = document.getElementById('dynamicCheckbox'), shakeSlider = document.getElementById('shakeSlider'), aberrationSlider = document.getElementById('aberrationSlider'), glowSlider = document.getElementById('glowSlider'), glowColor = document.getElementById('glowColor'), scanlineSlider = document.getElementById('scanlineSlider'), accentColorCheckbox = document.getElementById('accentColorCheckbox'), gradientControls = document.getElementById('gradientControls'), gradientPickerContainer = document.getElementById('gradientPickerContainer'), addColorButton = document.getElementById('addColorButton'), extractColorsButton = document.getElementById('extractColorsButton'), backgroundColorInput = document.getElementById('backgroundColor'), gradientBgCheckbox = document.getElementById('gradientBgCheckbox'), sensitivitySlider = document.getElementById('sensitivitySlider'), smoothingSlider = document.getElementById('smoothingSlider'), trailSlider = document.getElementById('trailSlider'), metadataDisplay = document.getElementById('metadataDisplay'), metaTitle = document.getElementById('metaTitle'), metaArtist = document.getElementById('metaArtist'), silentMessage = document.getElementById('silentMessage'), audioSourceSelect = document.getElementById('audioSourceSelect'), microphoneSelectRow = document.getElementById('microphoneSelectRow'), microphoneSelect = document.getElementById('microphoneSelect'), rainbowCheckbox = document.getElementById('rainbowCheckbox'), rainbowControls = document.getElementById('rainbowControls'), rainbowSpeedSlider = document.getElementById('rainbowSpeedSlider');
    const visBtns = document.querySelectorAll('.vis-btn');

    // --- GLOBAL STATE ---
    let audioContext, analyser, frequencyData, timeDomainData;
    let silenceCounter = 0, silentMessageInterval = null, dynamicRotation = 0, rainbowHueOffset = 0;
    let profileImage = null; 
    let matrixDrops =[]; 

    const defaultSettings = { 
        visualizerType: 'centerBars', dynamicEffects: false, shake: 15, aberration: 5, glow: 15, glowColor: '#ffffff', scanlines: 20, 
        useAccentColor: false, gradientColors:['#ff00ff', '#00ffff'], gradientBackground: false, backgroundColor: '#000000', 
        sensitivity: 2.5, smoothing: 0.8, trailAmount: 0.1, audioType: 'system', microphoneId: 'default', 
        filledShapes: true, circularDirection: 'outward', rotationSpeed: 5, profileImagePath: null, rainbowMode: false, rainbowSpeed: 5 
    };
    
    let settings = { ...defaultSettings };
    let backgroundRgb = { r: 0, g: 0, b: 0 };
    
    const silenceMessages = { 
        system:["It's kinda quiet in here...", "Play some music to get started!", "Waiting for audio..."], 
        microphone:["Is this thing on?", "Testing, 1, 2, 3...", "Your microphone is quiet."] 
    };

    // --- INITIALIZATION ---
    setupCanvas();
    loadSettings();
    window.addEventListener('resize', setupCanvas);

    acceptWarningButton.addEventListener('click', async () => {
        epilepsyWarning.style.opacity = '0';
        setTimeout(() => { epilepsyWarning.style.display = 'none'; }, 500);
        uiContainer.classList.add('visible');
        
        await startOrUpdateAudioSource();
        await populateMicrophoneList();
        updateAudioSourceUI();
        handleAccentCheck();
        updateGradientUI();
        handleVisualizerOptionsVisibility();
        handleRainbowModeVisibility();
        
        if (audioContext && audioContext.state === 'suspended') await audioContext.resume();
        draw(); 
    }, { once: true });


    // --- CORE DRAWING LOOP ---
    function draw() {
        requestAnimationFrame(draw);
        if (!analyser) return;

        analyser.getByteFrequencyData(frequencyData);
        analyser.getByteTimeDomainData(timeDomainData);
        analyser.smoothingTimeConstant = settings.smoothing;

        const avgVolume = getAverageVolume(frequencyData);
        const intensity = Math.min(1, avgVolume / 140);
        
        const fastFade = 0.95, transitionSpeed = 4;
        const effectiveTrailAmount = fastFade - (fastFade - settings.trailAmount) * Math.min(1, intensity * transitionSpeed);
        
        // Background Drawing
        if (settings.gradientBackground && settings.gradientColors.length >= 2 && !settings.rainbowMode) {
            const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            settings.gradientColors.forEach((color, i) => grad.addColorStop(i / (settings.gradientColors.length - 1), color));
            ctx.fillStyle = grad;
            ctx.globalAlpha = effectiveTrailAmount;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1.0;
        } else if (settings.gradientBackground && settings.rainbowMode) {
             const h = rainbowHueOffset % 360;
             ctx.fillStyle = `hsl(${h}, 50%, 10%)`;
             ctx.globalAlpha = effectiveTrailAmount;
             ctx.fillRect(0, 0, canvas.width, canvas.height);
             ctx.globalAlpha = 1.0;
        } else {
            ctx.fillStyle = `rgba(${backgroundRgb.r}, ${backgroundRgb.g}, ${backgroundRgb.b}, ${effectiveTrailAmount})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        dynamicRotation += intensity * (settings.rotationSpeed / 100);
        if (settings.rainbowMode) rainbowHueOffset += settings.rainbowSpeed / 10;
        
        ctx.save();
        
        if (settings.dynamicEffects) { 
            const shakeAmount = intensity * settings.shake; 
            ctx.translate((Math.random() - 0.5) * shakeAmount, (Math.random() - 0.5) * shakeAmount); 
            const effectiveGlow = intensity * (settings.glow / 2.0); 
            if (effectiveGlow > 1) { 
                ctx.shadowBlur = effectiveGlow; 
                ctx.shadowColor = settings.glowColor; 
            } 
        }
        
        if (settings.dynamicEffects && settings.aberration > 0) { 
            const aberrationAmount = intensity * settings.aberration; 
            ctx.globalCompositeOperation = 'lighter'; 
            if(drawFuncs[settings.visualizerType]) drawFuncs[settings.visualizerType](`rgba(255,0,0,0.7)`, -aberrationAmount); 
            if(drawFuncs[settings.visualizerType]) drawFuncs[settings.visualizerType](`rgba(0,255,0,0.7)`, 0); 
            if(drawFuncs[settings.visualizerType]) drawFuncs[settings.visualizerType](`rgba(0,0,255,0.7)`, aberrationAmount); 
            ctx.globalCompositeOperation = 'source-over'; 
        } else { 
            if (drawFuncs[settings.visualizerType]) {
                drawFuncs[settings.visualizerType](); 
            }
        }
        
        ctx.shadowBlur = 0; 
        ctx.restore();
        
        if (settings.dynamicEffects) { 
            const lineOpacity = intensity * (settings.scanlines / 100); 
            if (lineOpacity > 0.05) { 
                ctx.fillStyle = `rgba(0, 0, 0, ${lineOpacity})`; 
                for (let y = 0; y < canvas.height; y += 4) { ctx.fillRect(0, y, canvas.width, 2); } 
            } 
        }
        
        drawProfileImage(); 
        handleSilence(avgVolume);
    }
    
    // --- DRAWING FUNCTIONS ---
    const drawFuncs = {
        centerBars: (c, o=0) => { const l=frequencyData.length, w=(canvas.width/2)/(l/2), h=canvas.width/2; for(let i=0;i<l/2;i++){ const H=frequencyData[i]*settings.sensitivity, C=c||getDrawColor(i/(l/2)); ctx.fillStyle=C; const x1=h+(i*w)+o, x2=h-(i*w)-w+o; ctx.fillRect(x1,canvas.height/2-H/2,w,H); ctx.fillRect(x2,canvas.height/2-H/2,w,H); } },
        upwardBars: (c, o=0) => { const l=frequencyData.length, w=canvas.width/l; for(let i=0;i<l;i++){ const H=frequencyData[i]*settings.sensitivity, C=c||getDrawColor(i/l); ctx.fillStyle=C; const x=i*w+o; ctx.fillRect(x,canvas.height,w,-H); }},
        dualSidedBars: (c, o=0) => { const l=frequencyData.length, w=canvas.width/l; for(let i=0;i<l;i++){ const H=frequencyData[i]*settings.sensitivity, C=c||getDrawColor(i/l); ctx.fillStyle=C; const x=i*w+o; ctx.fillRect(x,0,w,H/2); ctx.fillRect(x,canvas.height,w,-H/2); }},
        floorAndCeiling: (c, o=0) => { const l=Math.floor(frequencyData.length/2), w=canvas.width/l; for(let i=0;i<l;i++){ const H=frequencyData[i]*settings.sensitivity, C=c||getDrawColor(i/l); ctx.fillStyle=C; const x=i*w+o; ctx.fillRect(x,0,w,H); ctx.fillRect(canvas.width-x-w,canvas.height,w,-H); }},
        bars3D: (c, o=0) => { const l=Math.floor(frequencyData.length/2); const w=canvas.width/l; for(let i=0;i<l;i++){ const H=frequencyData[i]*settings.sensitivity * 1.5; if (H < 1) continue; const C=c||getDrawColor(i/l); const x=i*w+o, y=canvas.height-H, depth = w * 0.8; ctx.fillStyle=C; ctx.fillRect(x,y,w-2,H); ctx.fillStyle = C; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+depth, y-depth); ctx.lineTo(x+w-2+depth, y-depth); ctx.lineTo(x+w-2, y); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fill(); ctx.fillStyle = C; ctx.beginPath(); ctx.moveTo(x+w-2, y); ctx.lineTo(x+w-2+depth, y-depth); ctx.lineTo(x+w-2+depth, canvas.height-depth); ctx.lineTo(x+w-2, canvas.height); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill(); } },
        circle: (c, o=0) => { const l=frequencyData.length, hX=canvas.width/2+o, hY=canvas.height/2; ctx.lineWidth=4; for(let i=1;i<l;i++){ const H=frequencyData[i]*(settings.sensitivity/2), a=(i/l)*2*Math.PI, C=c||getDrawColor(i/l); ctx.strokeStyle=C; const r=settings.circularDirection==='inward' ? Math.max(0, hY - H) : 150; const rEnd=settings.circularDirection==='inward' ? hY : 150+H; const sX=hX+Math.cos(a)*r, sY=hY+Math.sin(a)*r, eX=hX+Math.cos(a)*rEnd, eY=hY+Math.sin(a)*rEnd; ctx.beginPath(); ctx.moveTo(sX,sY); ctx.lineTo(eX,eY); ctx.stroke(); }},
        sunburst: (c, o=0) => { const l=Math.floor(frequencyData.length/2), hX=canvas.width/2+o, hY=canvas.height/2, C=c||getDrawColor(0.5); settings.filledShapes?ctx.fillStyle=C:ctx.strokeStyle=C; ctx.lineWidth=3; ctx.beginPath(); for(let i=1;i<l;i++){ const H=frequencyData[i]*(settings.sensitivity/1.5), a=(i/l)*2*Math.PI, x=hX+Math.cos(a)*H, y=hY+Math.sin(a)*H; i===1?ctx.moveTo(x,y):ctx.lineTo(x,y); } ctx.closePath(); settings.filledShapes?ctx.fill():ctx.stroke();},
        spokes: (c, o=0) => { const l=Math.floor(frequencyData.length/4), hX=canvas.width/2+o, hY=canvas.height/2; ctx.lineWidth=2; for(let i=1;i<l;i+=2){ const H=frequencyData[i]*settings.sensitivity, a=(i/l)*2*Math.PI, C=c||getDrawColor(i/l); ctx.strokeStyle=C; const rEnd=50+H; const sX=hX+Math.cos(a)*50, sY=hY+Math.sin(a)*50, eX=hX+Math.cos(a)*rEnd, eY=hY+Math.sin(a)*rEnd; ctx.beginPath(); ctx.moveTo(sX,sY); ctx.lineTo(eX,eY); ctx.stroke(); }},
        blob: (c, o=0) => { const l=Math.floor(frequencyData.length/2), hX=canvas.width/2+o, hY=canvas.height/2, C=c||getDrawColor(0.5); settings.filledShapes?ctx.fillStyle=C:ctx.strokeStyle=C; ctx.lineWidth=3; ctx.beginPath(); for(let i=1;i<l;i++){ const H=frequencyData[i]*(settings.sensitivity/1.5), r=150+H, a=(i/l)*2*Math.PI, x=hX+Math.cos(a)*r, y=hY+Math.sin(a)*r; i===1?ctx.moveTo(x,y):ctx.lineTo(x,y); } ctx.closePath(); settings.filledShapes?ctx.fill():ctx.stroke();},
        polygons: (c, o=0) => { const hX=canvas.width/2+o, hY=canvas.height/2; const bass=frequencyData[2]*(settings.sensitivity/2), mids=frequencyData[150]*(settings.sensitivity/2), highs=frequencyData[500]*(settings.sensitivity/2); const C=c||getDrawColor(0.5); settings.filledShapes?ctx.fillStyle=C:ctx.strokeStyle=C; ctx.lineWidth=2; drawPolygon(hX,hY,3,100+bass,dynamicRotation,C); drawPolygon(hX,hY,4,150+mids,-dynamicRotation,C); drawPolygon(hX,hY,5,200+highs,dynamicRotation/2,C); },
        nestedPolygons: (c, o=0) => { const hX=canvas.width/2+o, hY=canvas.height/2; const bass=frequencyData[4]*settings.sensitivity; for (let i=3; i>0; i--) { const C = c || getDrawColor(i/3); ctx.strokeStyle=C; ctx.lineWidth=2; drawPolygon(hX,hY,3,50*i + bass/i, dynamicRotation * (i%2===0?-1:1) * (1/i)); }},
        starfield: (c, o=0) => { const l=Math.floor(frequencyData.length/2); for(let i=1; i<l; i+=5) { const H=frequencyData[i]*(settings.sensitivity/2); if(H < 10) continue; const x = (i/l) * canvas.width + o; const y = (i%100/100) * canvas.height; const C=c||getDrawColor(i/l); ctx.strokeStyle=C; drawPolygon(x,y,4,H/10,dynamicRotation,C); }},
        shatter: (c, o=0) => { const l=frequencyData.length, hX=canvas.width/2+o, hY=canvas.height/2; const avg=getAverageVolume(frequencyData)*(settings.sensitivity/1.5); const C=c||getDrawColor(0.5); settings.filledShapes?ctx.fillStyle=C:ctx.strokeStyle=C; ctx.lineWidth=3; ctx.beginPath(); for(let i=1;i<l;i+=2){ const H=frequencyData[i]*(settings.sensitivity/1.5); const a=(i/l)*2*Math.PI; const r=100 + (H * (Math.random() * 1.5)); const x=hX+Math.cos(a)*r, y=hY+Math.sin(a)*r; i===1?ctx.moveTo(x,y):ctx.lineTo(x,y); } ctx.closePath(); settings.filledShapes?ctx.fill():ctx.stroke(); },
        flower: (c,o=0) => { const l=Math.floor(frequencyData.length/2), hX=canvas.width/2+o, hY=canvas.height/2; const C=c||getDrawColor(0.5); settings.filledShapes?ctx.fillStyle=C:ctx.strokeStyle=C; ctx.lineWidth=3; ctx.beginPath(); const petals=6; for(let i=1;i<l;i++){ const H=frequencyData[i]*(settings.sensitivity/2); const r=150+H + Math.sin(i/l*2*Math.PI*petals)*50; const a=(i/l)*2*Math.PI; const x=hX+Math.cos(a)*r; const y=hY+Math.sin(a)*r; i===1?ctx.moveTo(x,y):ctx.lineTo(x,y); } ctx.closePath(); settings.filledShapes?ctx.fill():ctx.stroke();},
        kaleidoscope: (c, o=0) => { const l = Math.floor(frequencyData.length / 4); const cx = canvas.width / 2 + o, cy = canvas.height / 2; const slices = 12; const angleStep = (Math.PI * 2) / slices; for (let s = 0; s < slices; s++) { ctx.save(); ctx.translate(cx, cy); ctx.rotate(s * angleStep + dynamicRotation); if (s % 2 !== 0) ctx.scale(1, -1); ctx.beginPath(); ctx.moveTo(0, 0); for (let i = 0; i < l; i++) { const H = frequencyData[i] * (settings.sensitivity / 1.5); const r = (i / l) * (Math.min(canvas.width, canvas.height) / 2) + H; const theta = (i / l) * (angleStep); const x = Math.cos(theta) * r; const y = Math.sin(theta) * r; ctx.lineTo(x, y); } ctx.closePath(); const C = c || getDrawColor(s / slices); settings.filledShapes ? ctx.fillStyle = C : ctx.strokeStyle = C; ctx.lineWidth = 2; settings.filledShapes ? ctx.fill() : ctx.stroke(); ctx.restore(); } },
        matrix: (c, o=0) => { if(matrixDrops.length < canvas.width/20) { for(let i=0; i<canvas.width/20; i++) matrixDrops[i] = Math.random()*canvas.height; } ctx.fillStyle = c || getDrawColor(0.5); ctx.font = "15px monospace"; const l=frequencyData.length; for(let i=0; i<matrixDrops.length; i++) { const H = frequencyData[i % l] * settings.sensitivity; const char = String.fromCharCode(0x30A0 + Math.random()*96); ctx.fillText(char, i*20 + o, matrixDrops[i]); if(matrixDrops[i]*H > 10000 && Math.random() > 0.95) matrixDrops[i] = 0; matrixDrops[i] += (H/50) + 2; if(matrixDrops[i] > canvas.height) matrixDrops[i] = 0; } },
        helix: (c, o=0) => { const hY=canvas.height/2; ctx.lineWidth=2; for(let i=0; i<canvas.width; i+=5) { const idx = Math.floor((i/canvas.width) * frequencyData.length); const H = frequencyData[idx] * settings.sensitivity; const y1 = hY + Math.sin(i*0.02 + dynamicRotation)*50 + Math.sin(i*0.1)*H; const y2 = hY + Math.sin(i*0.02 + dynamicRotation + Math.PI)*50 - Math.sin(i*0.1)*H; ctx.fillStyle = c || getDrawColor(i/canvas.width); ctx.fillRect(i+o, y1, 3, 3); ctx.fillRect(i+o, y2, 3, 3); if(i%20===0) { ctx.strokeStyle = ctx.fillStyle; ctx.beginPath(); ctx.moveTo(i+o, y1); ctx.lineTo(i+o, y2); ctx.stroke(); } } },
        pixelGrid: (c, o=0) => { const cols=32, rows=18; const cw=canvas.width/cols, ch=canvas.height/rows; for(let y=0; y<rows; y++){ for(let x=0; x<cols; x++){ const idx = Math.floor(((x+y*cols)/(cols*rows)) * frequencyData.length); const val = frequencyData[idx]; if(val > 255 - (settings.sensitivity*50)) { ctx.fillStyle = c || getDrawColor(val/255); ctx.fillRect(x*cw+o, y*ch, cw-2, ch-2); } } } },
        radar: (c, o=0) => { const cx=canvas.width/2+o, cy=canvas.height/2, radius=Math.min(canvas.width, canvas.height)/2; const angle = dynamicRotation % (Math.PI*2); ctx.strokeStyle = c || getDrawColor(0.5); ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(angle)*radius, cy + Math.sin(angle)*radius); ctx.stroke(); ctx.fillStyle = `rgba(${backgroundRgb.r}, ${backgroundRgb.g}, ${backgroundRgb.b}, 0.1)`; ctx.arc(cx, cy, radius, angle, angle+0.5); ctx.fill(); for(let i=0; i<10; i++) { const r = (i/10)*radius; const val = frequencyData[i*10]; if(val>100) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.strokeStyle = `rgba(255,255,255,${val/255})`; ctx.stroke(); } } },
        waves: (c, o=0) => { const l=frequencyData.length; for(let j=0; j<5; j++) { ctx.beginPath(); ctx.lineWidth=2; ctx.strokeStyle = c || getDrawColor(j/5); for(let i=0; i<canvas.width; i+=10) { const idx = Math.floor((i/canvas.width)*l); const val = frequencyData[idx] * settings.sensitivity; const y = canvas.height/2 + (j*30) - 60 + Math.sin(i*0.01 + dynamicRotation + j)*50 - val/2; i===0?ctx.moveTo(i+o, y):ctx.lineTo(i+o, y); } ctx.stroke(); } },
        frequencyWave: (c, o=0) => { const l=frequencyData.length, w=canvas.width/l; let x=o; ctx.lineWidth=3; const g = c ? c : ctx.createLinearGradient(0,0,canvas.width,0); if(!c && !settings.rainbowMode){ settings.gradientColors.forEach((col,i)=>g.addColorStop(i/(settings.gradientColors.length-1), col)); } ctx.strokeStyle=settings.rainbowMode ? getDrawColor(0.5) : g; ctx.beginPath(); for(let i=0;i<l;i++){ const H=frequencyData[i]*(settings.sensitivity/1.5), y=canvas.height-H; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); x+=w;} ctx.stroke(); },
        heartbeat: (c, o=0) => { const l = timeDomainData.length, w = canvas.width / l; let x = o; ctx.lineWidth = 4; const g = c ? c : ctx.createLinearGradient(0,0,canvas.width,0); if(!c && !settings.rainbowMode){ settings.gradientColors.forEach((col,i)=>g.addColorStop(i/(settings.gradientColors.length-1), col)); } ctx.strokeStyle = settings.rainbowMode ? getDrawColor(0.5) : g; ctx.beginPath(); for(let i=0; i<l; i++) { let v = (timeDomainData[i] - 128.0) * settings.sensitivity; v = Math.sign(v) * Math.pow(Math.abs(v), 1.2); const y = canvas.height/2 - v; if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); x += w; } ctx.stroke(); },
        circularWaveform: (c, o=0) => { const l=timeDomainData.length, hX=canvas.width/2+o, hY=canvas.height/2; const g = c ? c : ctx.createLinearGradient(0,0,canvas.width,canvas.height); if(!c && !settings.rainbowMode){ settings.gradientColors.forEach((col,i)=>g.addColorStop(i/(settings.gradientColors.length-1), col)); } ctx.strokeStyle = settings.rainbowMode ? getDrawColor(0.5) : g; ctx.lineWidth=3; ctx.beginPath(); for(let i=0;i<l;i++){ const d=(timeDomainData[i]-128), r=200+(d*(settings.sensitivity/1.5)), a=(i/l)*2*Math.PI, x=hX+Math.cos(a)*r, y=hY+Math.sin(a)*r; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); } ctx.closePath(); ctx.stroke();},
        waveform: (c, o=0) => { const l=timeDomainData.length, w=canvas.width*1.0/l; let x=o; ctx.lineWidth=3; const g = c ? c : ctx.createLinearGradient(0,0,canvas.width,0); if(!c && !settings.rainbowMode){ settings.gradientColors.forEach((col,i)=>g.addColorStop(i/(settings.gradientColors.length-1), col)); } ctx.strokeStyle=settings.rainbowMode ? getDrawColor(0.5) : g; ctx.beginPath(); for(let i=0;i<l;i++){ const v=timeDomainData[i]/128.0, y=v*canvas.height/2; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); x+=w;} ctx.lineTo(canvas.width+o,canvas.height/2); ctx.stroke();},
        tunnel: (c, o=0) => { const hX = canvas.width / 2 + o, hY = canvas.height / 2; const bass = frequencyData[2] * (settings.sensitivity / 2); ctx.lineWidth = 2 + bass/20; const numRings = 15; for(let i=1; i<=numRings; i++) { const phase = ((i + dynamicRotation/2) % numRings) / numRings; const r = phase * Math.max(canvas.width, canvas.height); const C = c || getDrawColor(phase); ctx.globalAlpha = Math.max(0, 1 - phase); settings.filledShapes ? ctx.fillStyle = C : ctx.strokeStyle = C; const currentRot = dynamicRotation*(i%2==0?1:-1); if(settings.circularDirection === 'inward') { drawPolygon(hX, hY, 6, Math.max(0.1, Math.max(canvas.width, canvas.height) - r), currentRot, C); } else { drawPolygon(hX, hY, 6, Math.max(0.1, r), currentRot, C); } } ctx.globalAlpha = 1.0; },
        hyperspace: (c, o=0) => { if(!window.stars) window.stars = Array.from({length: 400}, () => ({x: (Math.random()-0.5)*2000, y: (Math.random()-0.5)*2000, z: Math.random()*2000})); const cx = canvas.width/2 + o, cy = canvas.height/2; const avg = getAverageVolume(frequencyData); const speed = 2 + (avg/255)*30 * settings.sensitivity; ctx.globalCompositeOperation = 'screen'; window.stars.forEach((star, i) => { star.z -= speed; if(star.z <= 0) { star.z = 2000; star.x = (Math.random()-0.5)*2000; star.y = (Math.random()-0.5)*2000; } const px = cx + (star.x / star.z) * 500, py = cy + (star.y / star.z) * 500; if (px >= 0 && px <= canvas.width && py >= 0 && py <= canvas.height) { const size = Math.max(0.1, (2000 - star.z) / 400); const C = c || getDrawColor(i / 400); ctx.fillStyle = C; ctx.beginPath(); ctx.arc(px, py, size, 0, Math.PI*2); ctx.fill(); if(avg > 100 && i % 10 === 0) { ctx.strokeStyle = C; ctx.globalAlpha = (avg-100)/155 * 0.5; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke(); ctx.globalAlpha = 1.0; } } }); ctx.globalCompositeOperation = 'source-over'; },
        wireframeSphere: (c, o=0) => { const cx = canvas.width/2 + o, cy = canvas.height/2; const rBase = Math.min(canvas.width, canvas.height) / 4; const bands = 12, segments = 24, l = frequencyData.length; ctx.lineWidth = 1.5; for(let i=0; i<=bands; i++) { const theta = (i / bands) * Math.PI; ctx.beginPath(); for(let j=0; j<=segments; j++) { const phi = (j / segments) * Math.PI * 2 + dynamicRotation; const freqIdx = Math.floor(((i*segments + j) / (bands*segments)) * (l/2)); const H = frequencyData[freqIdx] * (settings.sensitivity/2); const r = rBase + H; const x3d = r * Math.sin(theta) * Math.cos(phi), y3d = r * Math.cos(theta), z3d = r * Math.sin(theta) * Math.sin(phi); const fov = 500, z = z3d + fov, x = cx + (x3d * fov) / z, y = cy + (y3d * fov) / z; if (j===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.closePath(); const C = c || getDrawColor(i/bands); settings.filledShapes ? ctx.fillStyle = C : ctx.strokeStyle = C; settings.filledShapes ? (ctx.globalAlpha=0.1, ctx.fill(), ctx.globalAlpha=1.0) : null; ctx.stroke(); } },
        rings: (c, o=0) => { const hX = canvas.width / 2 + o, hY = canvas.height / 2; const buckets = 5; const l = Math.floor(frequencyData.length / 2); for(let b=1; b<=buckets; b++) { ctx.beginPath(); const C = c || getDrawColor(b/buckets); settings.filledShapes ? ctx.fillStyle = C : ctx.strokeStyle = C; ctx.lineWidth = 3; const baseRadius = b * 80; for(let i=0; i<l; i++) { const H = frequencyData[Math.floor(i * (frequencyData.length / l))] * (settings.sensitivity/2); const deformation = (i % b === 0) ? H : H/2; const r = baseRadius + deformation; const a = (i/l)*2*Math.PI + (dynamicRotation * (b%2==0?1:-1)); const x = hX + Math.cos(a)*r, y = hY + Math.sin(a)*r; if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); } ctx.closePath(); settings.filledShapes ? ctx.globalAlpha = 0.2 : ctx.globalAlpha = 1; settings.filledShapes ? ctx.fill() : ctx.stroke(); ctx.globalAlpha = 1.0; } },
        floatingDust: (c, o=0) => { if(!window.dustArray) window.dustArray = Array.from({length: 150}, () => ({x: Math.random(), y: Math.random(), s: Math.random(), v: Math.random()*0.001 + 0.0005})); const l = frequencyData.length; const avg = getAverageVolume(frequencyData); const intensity = Math.min(1, avg / 140); window.dustArray.forEach((dust, i) => { const freqIdx = Math.floor((i / 150) * l); const H = frequencyData[freqIdx] * settings.sensitivity; dust.y -= (dust.v + (H / 20000) * (intensity + 0.1)); if(dust.y < 0) { dust.y = 1; dust.x = Math.random(); } const px = dust.x * canvas.width + o, py = dust.y * canvas.height; const radius = (dust.s * 5) + (H / 20); ctx.beginPath(); ctx.arc(px, py, Math.max(0.1, radius), 0, Math.PI*2); const C = c || getDrawColor(dust.y); ctx.fillStyle = C; ctx.globalAlpha = Math.min(1, H/100 + 0.2); ctx.fill(); }); ctx.globalAlpha = 1.0; },
        
        // --- 3 NEW VISUALIZERS ---
        cube: (c, o=0) => {
            const cx = canvas.width/2 + o, cy = canvas.height/2;
            const bass = frequencyData[2] * (settings.sensitivity / 2);
            const size = 100 + bass;
            const nodes = [[-1,-1,-1], [1,-1,-1],[1,1,-1], [-1,1,-1], [-1,-1,1], [1,-1,1],[1,1,1], [-1,1,1]];
            const edges = [[0,1], [1,2],[2,3], [3,0], [4,5], [5,6], [6,7], [7,4], [0,4], [1,5], [2,6],[3,7]];
            const angleX = dynamicRotation;
            const angleY = dynamicRotation * 1.3;
            ctx.strokeStyle = c || getDrawColor(0.5);
            ctx.lineWidth = 3;
            ctx.beginPath();
            edges.forEach(edge => {
                const drawNode = (n) => {
                    let x = nodes[n][0], y = nodes[n][1], z = nodes[n][2];
                    let ty = y*Math.cos(angleX) - z*Math.sin(angleX), tz = y*Math.sin(angleX) + z*Math.cos(angleX);
                    y = ty; z = tz;
                    let tx = x*Math.cos(angleY) + z*Math.sin(angleY); z = -x*Math.sin(angleY) + z*Math.cos(angleY);
                    x = tx;
                    const scale = 400 / (400 + z * size);
                    return[cx + x * size * scale, cy + y * size * scale];
                };
                const [x1, y1] = drawNode(edge[0]);
                const [x2, y2] = drawNode(edge[1]);
                ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
            });
            ctx.stroke();
        },
        lightning: (c, o=0) => {
            const avg = getAverageVolume(frequencyData) * settings.sensitivity;
            if (avg < 30) return;
            ctx.lineWidth = 2 + (avg / 40);
            ctx.strokeStyle = c || getDrawColor(Math.random());
            ctx.shadowBlur = 10;
            ctx.shadowColor = ctx.strokeStyle;
            ctx.beginPath();
            let x = o;
            let y = canvas.height / 2;
            ctx.moveTo(x, y);
            const segments = 30;
            const segWidth = canvas.width / segments;
            for (let i = 1; i <= segments; i++) {
                x += segWidth;
                y = (canvas.height / 2) + (Math.random() - 0.5) * (avg * 4);
                ctx.lineTo(x, y);
                if (Math.random() > 0.85) {
                    const curX = x, curY = y;
                    ctx.lineTo(curX + (Math.random()-0.5)*150, curY + (Math.random()-0.5)*150);
                    ctx.moveTo(curX, curY);
                }
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        },
        blackHole: (c, o=0) => {
            const cx = canvas.width / 2 + o, cy = canvas.height / 2;
            const bass = frequencyData[2] * (settings.sensitivity / 1.5);
            const l = Math.floor(frequencyData.length / 3);
            for (let i = 0; i < l; i+=2) {
                const val = frequencyData[i] * settings.sensitivity;
                const angle = (i / l) * Math.PI * 2 + dynamicRotation * (i%2===0?-2:2);
                const r = 120 + bass + val;
                const x = cx + Math.cos(angle) * r;
                const y = cy + Math.sin(angle) * r;
                ctx.fillStyle = c || getDrawColor(i/l);
                ctx.beginPath(); ctx.arc(x, y, 2 + val/50, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(cx + Math.cos(angle - 0.2) * (r - 30), cy + Math.sin(angle - 0.2) * (r - 30));
                ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 1; ctx.globalAlpha = 0.4; ctx.stroke(); ctx.globalAlpha = 1.0;
            }
            ctx.beginPath(); ctx.arc(cx, cy, 100 + bass/2, 0, Math.PI * 2); ctx.fillStyle = "#000000"; ctx.fill();
            ctx.lineWidth = 4; ctx.strokeStyle = c || getDrawColor(0.5); ctx.stroke();
        }
    };
    function drawPolygon(x,y,s,r,rot,C){ctx.beginPath(); for(let i=0;i<s;i++){ctx.lineTo(x+r*Math.cos(rot+i*2*Math.PI/s),y+r*Math.sin(rot+i*2*Math.PI/s));} ctx.closePath(); settings.filledShapes?ctx.fill():ctx.stroke();}
    function drawProfileImage() { if (!profileImage || !profileImage.complete) return; const centerX = canvas.width / 2, centerY = canvas.height / 2; const size = 120; ctx.save(); ctx.beginPath(); ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(profileImage, centerX - size / 2, centerY - size / 2, size, size); ctx.restore(); }
    
    // --- HELPER FUNCTIONS ---
    function updateContrast() {
        const r = backgroundRgb.r, g = backgroundRgb.g, b = backgroundRgb.b;
        const yiq = ((r*299)+(g*587)+(b*114))/1000;
        document.documentElement.style.setProperty('--text-color', yiq >= 128 ? '#000000' : '#ffffff');
        const uiBtns = document.querySelectorAll('.ui-button, #closeButton, .vis-btn');
        uiBtns.forEach(btn => {
            if(!btn.classList.contains('active')) btn.style.color = yiq >= 128 ? '#000' : '#fff';
        });
    }

    function extractColorsFromImage(base64Data) {
        const img = new Image();
        img.onload = () => {
            const hiddenCanvas = document.createElement('canvas');
            const hiddenCtx = hiddenCanvas.getContext('2d');
            hiddenCanvas.width = 10; hiddenCanvas.height = 10;
            hiddenCtx.drawImage(img, 0, 0, 10, 10);
            try {
                const data = hiddenCtx.getImageData(0, 0, 10, 10).data;
                const colors = [];
                const indices =[0, 36, 360, 396, 220]; 
                indices.forEach(idx => {
                    const r = data[idx], g = data[idx+1], b = data[idx+2];
                    colors.push("#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1));
                });
                settings.gradientColors = [...new Set(colors)].slice(0, 5);
                if(settings.gradientColors.length < 2) settings.gradientColors.push('#ffffff');
                updateGradientUI(); saveSettings();
            } catch (e) {
                console.error("Canvas read error:", e);
                alert("Could not extract colors. The image data could not be parsed.");
            }
        }
        img.src = base64Data;
    }

    // --- OTHER FUNCTIONS & EVENT LISTENERS ---
    function saveSettings() { localStorage.setItem('visualizerSettings', JSON.stringify(settings)); }
    function loadSettings() { 
        const saved = localStorage.getItem('visualizerSettings'); if (saved) settings = { ...defaultSettings, ...JSON.parse(saved) }; 
        
        visBtns.forEach(btn => { btn.classList.toggle('active', btn.dataset.vis === settings.visualizerType); });

        dynamicCheckbox.checked = settings.dynamicEffects; shakeSlider.value = settings.shake; aberrationSlider.value = settings.aberration; glowSlider.value = settings.glow; glowColor.value = settings.glowColor; scanlineSlider.value = settings.scanlines; accentColorCheckbox.checked = settings.useAccentColor; backgroundColorInput.value = settings.backgroundColor; sensitivitySlider.value = settings.sensitivity; smoothingSlider.value = (settings.smoothing || 0.8) * 100; trailSlider.value = settings.trailAmount * 100; audioSourceSelect.value = settings.audioType; fillCheckbox.checked = settings.filledShapes; directionSelect.value = settings.circularDirection; rotationSlider.value = settings.rotationSpeed; rainbowCheckbox.checked = settings.rainbowMode; rainbowSpeedSlider.value = settings.rainbowSpeed; gradientBgCheckbox.checked = settings.gradientBackground; backgroundRgb = hexToRgb(settings.backgroundColor); dynamicEffectsFieldset.classList.toggle('disabled', !settings.dynamicEffects); if(settings.profileImagePath) setProfileImage(settings.profileImagePath); handleVisualizerOptionsVisibility(); handleRainbowModeVisibility(); updateContrast(); 
    }
    
    async function startOrUpdateAudioSource() { if (audioContext) { await audioContext.close(); audioContext = null; } let stream; try { if (settings.audioType === 'microphone') { stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: settings.microphoneId ? { exact: settings.microphoneId } : undefined }}); } else { const sources = await window.electronAPI.getSources(); if (!sources || sources.length === 0) throw new Error("No screen sources found."); stream = await navigator.mediaDevices.getUserMedia({ audio: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: sources[0].id }}, video: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: sources[0].id }}}); } audioContext = new AudioContext(); const source = audioContext.createMediaStreamSource(stream); setupAnalyser(source); } catch (err) { alert(`Could not start audio source: ${err.message}\n\nPlease ensure permissions are granted.`); } }
    function setupAnalyser(sourceNode) { analyser = sourceNode.context.createAnalyser(); analyser.fftSize = 2048; sourceNode.connect(analyser); const bufferLength = analyser.frequencyBinCount; frequencyData = new Uint8Array(bufferLength); timeDomainData = new Uint8Array(bufferLength); }
    async function populateMicrophoneList() { try { const devices = await navigator.mediaDevices.enumerateDevices(); const microphones = devices.filter(device => device.kind === 'audioinput'); microphoneSelect.innerHTML = ''; microphones.forEach(mic => { const option = document.createElement('option'); option.value = mic.deviceId; option.textContent = mic.label || `Microphone ${microphoneSelect.options.length + 1}`; microphoneSelect.appendChild(option); }); microphoneSelect.value = settings.microphoneId; } catch (e) { console.error("Could not enumerate devices:", e); } }
    function updateAudioSourceUI() { if (settings.audioType === 'microphone') { microphoneSelectRow.classList.remove('hidden'); } else { microphoneSelectRow.classList.add('hidden'); } }
    function updateGradientUI() { gradientPickerContainer.innerHTML = ''; settings.gradientColors.forEach((color, index) => { const row = document.createElement('div'); row.className = 'gradient-color-row'; const colorInput = document.createElement('input'); colorInput.type = 'color'; colorInput.value = color; colorInput.addEventListener('input', (e) => { settings.gradientColors[index] = e.target.value; saveSettings(); }); const removeBtn = document.createElement('button'); removeBtn.className = 'remove-color-btn'; removeBtn.textContent = '×'; removeBtn.onclick = () => { if (settings.gradientColors.length > 2) { settings.gradientColors.splice(index, 1); updateGradientUI(); saveSettings(); } }; row.appendChild(colorInput); row.appendChild(removeBtn); gradientPickerContainer.appendChild(row); }); }
    async function handleAccentCheck() { if (settings.useAccentColor) { gradientControls.classList.add('disabled'); const accentHex = await window.electronAPI.getAccentColor(); const accentHSL = hexToHsl(accentHex); const startColor = hslToHex(accentHSL.h, accentHSL.s, Math.max(0, accentHSL.l - 20)); const endColor = hslToHex(accentHSL.h, Math.min(100, accentHSL.s + 10), Math.min(100, accentHSL.l + 20)); settings.gradientColors =[startColor, accentHex, endColor]; } else { gradientControls.classList.remove('disabled'); } updateGradientUI(); saveSettings(); }
    function handleSilence(avgVolume) { const silenceThreshold = 3, silenceDuration = 180; if (avgVolume < silenceThreshold) { silenceCounter++; } else { silenceCounter = 0; silentMessage.classList.add('hidden'); if (silentMessageInterval) { clearInterval(silentMessageInterval); silentMessageInterval = null; } } if (silenceCounter > silenceDuration && !silentMessageInterval) { silentMessage.classList.remove('hidden'); let messageIndex = 0; const messages = silenceMessages[settings.audioType]; silentMessage.textContent = messages[messageIndex]; silentMessageInterval = setInterval(() => { messageIndex = (messageIndex + 1) % messages.length; silentMessage.textContent = messages[messageIndex]; }, 4000); } }
    function drawWatermark(intensity) { ctx.font = '16px "Segoe UI", Arial, sans-serif'; const opacity = 0.1 + intensity * 0.6; ctx.fillStyle = `rgba(${backgroundRgb.r > 128 ? 0 : 255}, ${backgroundRgb.g > 128 ? 0 : 255}, ${backgroundRgb.b > 128 ? 0 : 255}, ${opacity})`; ctx.textAlign = 'right'; ctx.fillText('Made by EchoesRealmArrow', canvas.width - 20, canvas.height - 20); ctx.textAlign = 'left'; }
    function setupCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    function hexToRgb(hex) { const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 0, g: 0, b: 0 }; }
    function hexToHsl(H) { let r = 0, g = 0, b = 0; if (H.length == 7) { r = parseInt(H.substring(1,3), 16); g = parseInt(H.substring(3,5), 16); b = parseInt(H.substring(5,7), 16); } r /= 255; g /= 255; b /= 255; let cmin = Math.min(r,g,b), cmax = Math.max(r,g,b), delta = cmax - cmin, h = 0, s = 0, l = 0; if (delta == 0) h = 0; else if (cmax == r) h = ((g - b) / delta) % 6; else if (cmax == g) h = (b - r) / delta + 2; else h = (r - g) / delta + 4; h = Math.round(h * 60); if (h < 0) h += 360; l = (cmax + cmin) / 2; s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1)); s = +(s * 100).toFixed(1); l = +(l * 100).toFixed(1); return { h, s, l }; }
    function hslToHex(h, s, l) { s /= 100; l /= 100; let c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c/2, r = 0, g = 0, b = 0; if (h >= 0 && h < 60) { r = c; g = x; b = 0; } else if (h >= 60 && h < 120) { r = x; g = c; b = 0; } else if (h >= 120 && h < 180) { r = 0; g = c; b = x; } else if (h >= 180 && h < 240) { r = 0; g = x; b = c; } else if (h >= 240 && h < 300) { r = x; g = 0; b = c; } else if (h >= 300 && h < 360) { r = c; g = 0; b = x; } r = Math.round((r + m) * 255).toString(16); g = Math.round((g + m) * 255).toString(16); b = Math.round((b + m) * 255).toString(16); if (r.length == 1) r = "0" + r; if (g.length == 1) g = "0" + g; if (b.length == 1) b = "0" + b; return "#" + r + g + b; }
    function getAverageVolume(dataArray) { let sum = 0; if (dataArray) { for (let i = 0; i < dataArray.length; i++) { sum += dataArray[i]; } return sum / dataArray.length; } return 0; }
    function getMultiStopGradientColor(fraction) { if (!settings.gradientColors || settings.gradientColors.length < 2) return (settings.gradientColors && settings.gradientColors[0]) || '#ffffff'; const stopIndex = fraction * (settings.gradientColors.length - 1); const startIndex = Math.floor(stopIndex); const endIndex = Math.min(startIndex + 1, settings.gradientColors.length - 1); const localFraction = stopIndex - startIndex; const start = hexToRgb(settings.gradientColors[startIndex]); const end = hexToRgb(settings.gradientColors[endIndex]); const r = Math.round(start.r + (end.r - start.r) * localFraction); const g = Math.round(start.g + (end.g - start.g) * localFraction); const b = Math.round(start.b + (end.b - start.b) * localFraction); return `rgb(${r}, ${g}, ${b})`; }
    function getDrawColor(fraction) { if (settings.rainbowMode) { const hue = (fraction * 360) + rainbowHueOffset; return `hsl(${hue % 360}, 100%, 50%)`; } return getMultiStopGradientColor(fraction); }
    function handleVisualizerOptionsVisibility() { const type = settings.visualizerType; const hasFillOption =['blob', 'sunburst', 'polygons', 'nestedPolygons', 'shatter', 'flower', 'kaleidoscope', 'tunnel', 'rings', 'wireframeSphere', 'honeycomb', 'blackHole'].includes(type); const hasDirectionOption = ['circle', 'tunnel'].includes(type); const hasRotationOption =['polygons', 'nestedPolygons', 'starfield', 'kaleidoscope', 'tunnel', 'rings', 'wireframeSphere', 'vortex', 'laser', 'cube', 'blackHole'].includes(type); visualizerOptionsFieldset.classList.toggle('hidden', !hasFillOption && !hasDirectionOption && !hasRotationOption); fillCheckbox.parentElement.style.display = hasFillOption ? '' : 'none'; directionSelect.parentElement.style.display = hasDirectionOption ? '' : 'none'; rotationSlider.parentElement.style.display = hasRotationOption ? '' : 'none'; }
    function handleRainbowModeVisibility() { rainbowControls.classList.toggle('hidden', !settings.rainbowMode); gradientControls.classList.toggle('disabled', settings.rainbowMode || settings.useAccentColor); accentColorCheckbox.disabled = settings.rainbowMode; }
    
    function setProfileImage(base64Data) { 
        if (base64Data) { 
            profileImage = new Image(); 
            profileImage.src = base64Data; 
            settings.profileImagePath = base64Data; 
            pfpPreview.src = base64Data; 
            pfpPreview.classList.remove('hidden'); 
        } else { 
            profileImage = null; 
            settings.profileImagePath = null; 
            pfpPreview.src = '#'; 
            pfpPreview.classList.add('hidden'); 
        } 
        saveSettings(); 
    }

    // --- EVENT LISTENERS ---
    
    visBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            settings.visualizerType = e.target.dataset.vis;
            visBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            handleVisualizerOptionsVisibility();
            saveSettings();
            updateContrast();
        });
    });

    settingsButton.addEventListener('click', () => settingsPanel.classList.toggle('open'));
    closeSettingsButton.addEventListener('click', () => settingsPanel.classList.remove('open'));
    
    selectPfpButton.addEventListener('click', async () => { 
        const paths = await window.electronAPI.showOpenDialog({ properties: ['openFile'], filters:[{ name: 'Images', extensions:['png', 'jpg', 'jpeg'] }] }); 
        if (paths && paths[0]) {
            const b64 = await window.electronAPI.readFileBase64(paths[0]);
            if (b64) setProfileImage(b64);
        }
    });
    
    clearPfpButton.addEventListener('click', () => setProfileImage(null));
    
    extractColorsButton.addEventListener('click', async () => { 
        const paths = await window.electronAPI.showOpenDialog({ properties:['openFile'], filters:[{ name: 'Images', extensions:['png', 'jpg', 'jpeg'] }] }); 
        if (paths && paths[0]) {
            const b64 = await window.electronAPI.readFileBase64(paths[0]);
            if (b64) extractColorsFromImage(b64);
        }
    });
    
    audioSourceSelect.addEventListener('change', () => { settings.audioType = audioSourceSelect.value; updateAudioSourceUI(); saveSettings(); startOrUpdateAudioSource(); });
    microphoneSelect.addEventListener('change', () => { settings.microphoneId = microphoneSelect.value; saveSettings(); startOrUpdateAudioSource(); });
    fillCheckbox.addEventListener('change', (e) => { settings.filledShapes = e.target.checked; saveSettings(); });
    directionSelect.addEventListener('change', (e) => { settings.circularDirection = e.target.value; saveSettings(); });
    rotationSlider.addEventListener('input', (e) => { settings.rotationSpeed = parseInt(e.target.value); saveSettings(); });
    accentColorCheckbox.addEventListener('change', (e) => { settings.useAccentColor = e.target.checked; handleAccentCheck(); handleRainbowModeVisibility(); });
    addColorButton.addEventListener('click', () => { if (settings.gradientColors.length < 8) { settings.gradientColors.push('#ffffff'); updateGradientUI(); saveSettings(); } });
    backgroundColorInput.addEventListener('input', (e) => { settings.backgroundColor = e.target.value; backgroundRgb = hexToRgb(e.target.value); saveSettings(); updateContrast(); });
    gradientBgCheckbox.addEventListener('change', (e) => { settings.gradientBackground = e.target.checked; saveSettings(); });
    sensitivitySlider.addEventListener('input', (e) => { settings.sensitivity = parseFloat(e.target.value); saveSettings(); });
    smoothingSlider.addEventListener('input', (e) => { settings.smoothing = parseInt(e.target.value) / 100; saveSettings(); });
    trailSlider.addEventListener('input', (e) => { settings.trailAmount = parseFloat(e.target.value) / 100; saveSettings(); });
    dynamicCheckbox.addEventListener('change', (e) => { settings.dynamicEffects = e.target.checked; dynamicEffectsFieldset.classList.toggle('disabled', !e.target.checked); saveSettings(); });
    shakeSlider.addEventListener('input', (e) => { settings.shake = parseInt(e.target.value); saveSettings(); });
    aberrationSlider.addEventListener('input', (e) => { settings.aberration = parseInt(e.target.value); saveSettings(); });
    glowSlider.addEventListener('input', (e) => { settings.glow = parseInt(e.target.value); saveSettings(); });
    glowColor.addEventListener('input', (e) => { settings.glowColor = e.target.value; saveSettings(); });
    scanlineSlider.addEventListener('input', (e) => { settings.scanlines = parseInt(e.target.value); saveSettings(); });
    rainbowCheckbox.addEventListener('change', (e) => { settings.rainbowMode = e.target.checked; handleRainbowModeVisibility(); saveSettings(); });
    rainbowSpeedSlider.addEventListener('input', (e) => { settings.rainbowSpeed = parseInt(e.target.value); saveSettings(); });
});