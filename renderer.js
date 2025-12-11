window.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENT REFERENCES ---
    const canvas = document.getElementById('visualizerCanvas'), ctx = canvas.getContext('2d'), startMessage = document.getElementById('startMessage'), settingsButton = document.getElementById('settingsButton'), settingsPanel = document.getElementById('settingsPanel'), closeSettingsButton = document.getElementById('closeButton'), visualizerOptionsFieldset = document.getElementById('visualizerOptionsFieldset'), fillCheckbox = document.getElementById('fillCheckbox'), directionSelect = document.getElementById('directionSelect'), rotationSlider = document.getElementById('rotationSlider'), selectPfpButton = document.getElementById('selectPfpButton'), clearPfpButton = document.getElementById('clearPfpButton'), pfpPreview = document.getElementById('pfpPreview'), dynamicEffectsFieldset = document.getElementById('dynamicEffectsFieldset'), visualizerSelect = document.getElementById('visualizerSelect'), dynamicCheckbox = document.getElementById('dynamicCheckbox'), shakeSlider = document.getElementById('shakeSlider'), aberrationSlider = document.getElementById('aberrationSlider'), glowSlider = document.getElementById('glowSlider'), glowColor = document.getElementById('glowColor'), scanlineSlider = document.getElementById('scanlineSlider'), accentColorCheckbox = document.getElementById('accentColorCheckbox'), gradientControls = document.getElementById('gradientControls'), gradientPickerContainer = document.getElementById('gradientPickerContainer'), addColorButton = document.getElementById('addColorButton'), backgroundColorInput = document.getElementById('backgroundColor'), gradientBgCheckbox = document.getElementById('gradientBgCheckbox'), sensitivitySlider = document.getElementById('sensitivitySlider'), smoothingSlider = document.getElementById('smoothingSlider'), trailSlider = document.getElementById('trailSlider'), metadataDisplay = document.getElementById('metadataDisplay'), metaTitle = document.getElementById('metaTitle'), metaArtist = document.getElementById('metaArtist'), silentMessage = document.getElementById('silentMessage'), audioSourceSelect = document.getElementById('audioSourceSelect'), microphoneSelectRow = document.getElementById('microphoneSelectRow'), microphoneSelect = document.getElementById('microphoneSelect'), rainbowCheckbox = document.getElementById('rainbowCheckbox'), rainbowControls = document.getElementById('rainbowControls'), rainbowSpeedSlider = document.getElementById('rainbowSpeedSlider'), extractColorsButton = document.getElementById('extractColorsButton');

    // --- GLOBAL STATE ---
    let audioContext, analyser, frequencyData, timeDomainData;
    let silenceCounter = 0, silentMessageInterval = null, dynamicRotation = 0, rainbowHueOffset = 0;
    let profileImage = null;
    const defaultSettings = { visualizerType: 'centerBars', dynamicEffects: false, shake: 15, aberration: 5, glow: 15, glowColor: '#ffffff', scanlines: 20, useAccentColor: false, gradientColors: ['#ff00ff', '#00ffff'], gradientBackground: false, backgroundColor: '#000000', sensitivity: 2.5, smoothing: 0.8, trailAmount: 0.1, audioType: 'system', microphoneId: 'default', filledShapes: true, circularDirection: 'outward', rotationSpeed: 5, profileImagePath: null, rainbowMode: false, rainbowSpeed: 5 };
    let settings = { ...defaultSettings }, backgroundRgb = { r: 0, g: 0, b: 0 };
    const silenceMessages = { system: ["It's kinda quiet in here...", "Play some music to get started!", "Waiting for audio..."], microphone: ["Is this thing on?", "Testing, 1, 2, 3...", "Your microphone is quiet."] };

    // --- CORE DRAWING LOOP ---
    function draw() {
        requestAnimationFrame(draw);
        if (!analyser) return;
        analyser.getByteFrequencyData(frequencyData);
        analyser.getByteTimeDomainData(timeDomainData);
        // Apply smoothing from settings
        analyser.smoothingTimeConstant = settings.smoothing;

        const avgVolume = getAverageVolume(frequencyData);
        const intensity = Math.min(1, avgVolume / 140);
        
        const fastFade = 0.95; 
        const transitionSpeed = 4;
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
        if (settings.dynamicEffects) { const shakeAmount = intensity * settings.shake; ctx.translate((Math.random() - 0.5) * shakeAmount, (Math.random() - 0.5) * shakeAmount); const effectiveGlow = intensity * (settings.glow / 2.0); if (effectiveGlow > 1) { ctx.shadowBlur = effectiveGlow; ctx.shadowColor = settings.glowColor; } }
        if (settings.dynamicEffects && settings.aberration > 0) { const aberrationAmount = intensity * settings.aberration; ctx.globalCompositeOperation = 'lighter'; drawFuncs[settings.visualizerType](`rgba(255,0,0,0.7)`, -aberrationAmount); drawFuncs[settings.visualizerType](`rgba(0,255,0,0.7)`, 0); drawFuncs[settings.visualizerType](`rgba(0,0,255,0.7)`, aberrationAmount); ctx.globalCompositeOperation = 'source-over'; } else { drawFuncs[settings.visualizerType](); }
        ctx.shadowBlur = 0; ctx.restore();
        if (settings.dynamicEffects) { const lineOpacity = intensity * (settings.scanlines / 100); if (lineOpacity > 0.05) { ctx.fillStyle = `rgba(0, 0, 0, ${lineOpacity})`; for (let y = 0; y < canvas.height; y += 4) { ctx.fillRect(0, y, canvas.width, 2); } } }
        drawProfileImage(); drawWatermark(intensity); handleSilence(avgVolume);
    }
    
    // --- DRAWING FUNCTIONS ---
    const drawFuncs = {
        centerBars: (c, o=0) => { const l=frequencyData.length, w=(canvas.width/2)/(l/2), h=canvas.width/2; for(let i=0;i<l/2;i++){ const H=frequencyData[i]*settings.sensitivity, C=c||getDrawColor(i/(l/2)); ctx.fillStyle=C; const x1=h+(i*w)+o, x2=h-(i*w)-w+o; ctx.fillRect(x1,canvas.height/2-H/2,w,H); ctx.fillRect(x2,canvas.height/2-H/2,w,H); } },
        upwardBars: (c, o=0) => { const l=frequencyData.length, w=canvas.width/l; for(let i=0;i<l;i++){ const H=frequencyData[i]*settings.sensitivity, C=c||getDrawColor(i/l); ctx.fillStyle=C; const x=i*w+o; ctx.fillRect(x,canvas.height,w,-H); }},
        dualSidedBars: (c, o=0) => { const l=frequencyData.length, w=canvas.width/l; for(let i=0;i<l;i++){ const H=frequencyData[i]*settings.sensitivity, C=c||getDrawColor(i/l); ctx.fillStyle=C; const x=i*w+o; ctx.fillRect(x,0,w,H/2); ctx.fillRect(x,canvas.height,w,-H/2); }},
        floorAndCeiling: (c, o=0) => { const l=Math.floor(frequencyData.length/2), w=canvas.width/l; for(let i=0;i<l;i++){ const H=frequencyData[i]*settings.sensitivity, C=c||getDrawColor(i/l); ctx.fillStyle=C; const x=i*w+o; ctx.fillRect(x,0,w,H); ctx.fillRect(canvas.width-x-w,canvas.height,w,-H); }},
        circle: (c, o=0) => { const l=frequencyData.length, hX=canvas.width/2+o, hY=canvas.height/2; ctx.lineWidth=4; for(let i=1;i<l;i++){ const H=frequencyData[i]*(settings.sensitivity/2), a=(i/l)*2*Math.PI, C=c||getDrawColor(i/l); ctx.strokeStyle=C; const r=settings.circularDirection==='inward' ? Math.max(0, hY - H) : 150; const rEnd=settings.circularDirection==='inward' ? hY : 150+H; const sX=hX+Math.cos(a)*r, sY=hY+Math.sin(a)*r, eX=hX+Math.cos(a)*rEnd, eY=hY+Math.sin(a)*rEnd; ctx.beginPath(); ctx.moveTo(sX,sY); ctx.lineTo(eX,eY); ctx.stroke(); }},
        sunburst: (c, o=0) => { const l=Math.floor(frequencyData.length/2), hX=canvas.width/2+o, hY=canvas.height/2, C=c||getDrawColor(0.5); settings.filledShapes?ctx.fillStyle=C:ctx.strokeStyle=C; ctx.lineWidth=3; ctx.beginPath(); for(let i=1;i<l;i++){ const H=frequencyData[i]*(settings.sensitivity/1.5), a=(i/l)*2*Math.PI, x=hX+Math.cos(a)*H, y=hY+Math.sin(a)*H; i===1?ctx.moveTo(x,y):ctx.lineTo(x,y); } ctx.closePath(); settings.filledShapes?ctx.fill():ctx.stroke();},
        spokes: (c, o=0) => { const l=Math.floor(frequencyData.length/4), hX=canvas.width/2+o, hY=canvas.height/2; ctx.lineWidth=2; for(let i=1;i<l;i+=2){ const H=frequencyData[i]*settings.sensitivity, a=(i/l)*2*Math.PI, C=c||getDrawColor(i/l); ctx.strokeStyle=C; const rEnd=50+H; const sX=hX+Math.cos(a)*50, sY=hY+Math.sin(a)*50, eX=hX+Math.cos(a)*rEnd, eY=hY+Math.sin(a)*rEnd; ctx.beginPath(); ctx.moveTo(sX,sY); ctx.lineTo(eX,eY); ctx.stroke(); }},
        blob: (c, o=0) => { const l=Math.floor(frequencyData.length/2), hX=canvas.width/2+o, hY=canvas.height/2, C=c||getDrawColor(0.5); settings.filledShapes?ctx.fillStyle=C:ctx.strokeStyle=C; ctx.lineWidth=3; ctx.beginPath(); for(let i=1;i<l;i++){ const H=frequencyData[i]*(settings.sensitivity/1.5), r=150+H, a=(i/l)*2*Math.PI, x=hX+Math.cos(a)*r, y=hY+Math.sin(a)*r; i===1?ctx.moveTo(x,y):ctx.lineTo(x,y); } ctx.closePath(); settings.filledShapes?ctx.fill():ctx.stroke();},
        polygons: (c, o=0) => { const hX=canvas.width/2+o, hY=canvas.height/2; const bass=frequencyData[2]*(settings.sensitivity/2), mids=frequencyData[150]*(settings.sensitivity/2), highs=frequencyData[500]*(settings.sensitivity/2); const C=c||getDrawColor(0.5); settings.filledShapes?ctx.fillStyle=C:ctx.strokeStyle=C; ctx.lineWidth=2; drawPolygon(hX,hY,3,100+bass,dynamicRotation,C); drawPolygon(hX,hY,4,150+mids,-dynamicRotation,C); drawPolygon(hX,hY,5,200+highs,dynamicRotation/2,C); },
        nestedPolygons: (c, o=0) => { const hX=canvas.width/2+o, hY=canvas.height/2; const bass=frequencyData[4]*settings.sensitivity; for (let i=3; i>0; i--) { const C = c || getDrawColor(i/3); ctx.strokeStyle=C; ctx.lineWidth=2; drawPolygon(hX,hY,3,50*i + bass/i, dynamicRotation * (i%2===0?-1:1) * (1/i)); }},
        starfield: (c, o=0) => { const l=Math.floor(frequencyData.length/2); for(let i=1; i<l; i+=5) { const H=frequencyData[i]*(settings.sensitivity/2); if(H < 10) continue; const x = (i/l) * canvas.width + o; const y = (i%100/100) * canvas.height; const C=c||getDrawColor(i/l); ctx.strokeStyle=C; drawPolygon(x,y,4,H/10,dynamicRotation,C); }},
        shatter: (c, o=0) => { const l=frequencyData.length, hX=canvas.width/2+o, hY=canvas.height/2; const avg=getAverageVolume(frequencyData)*(settings.sensitivity/1.5); const C=c||getDrawColor(0.5); settings.filledShapes?ctx.fillStyle=C:ctx.strokeStyle=C; ctx.lineWidth=3; ctx.beginPath(); for(let i=1;i<l;i++){const a=(i/l)*2*Math.PI, r=100+Math.max(0, avg + (Math.random()-0.5)*avg*0.5), x=hX+Math.cos(a)*r, y=hY+Math.sin(a)*r; i===1?ctx.moveTo(x,y):ctx.lineTo(x,y);} ctx.closePath(); settings.filledShapes?ctx.fill():ctx.stroke(); },
        flower: (c,o=0) => { const l=Math.floor(frequencyData.length/2), hX=canvas.width/2+o, hY=canvas.height/2; const C=c||getDrawColor(0.5); settings.filledShapes?ctx.fillStyle=C:ctx.strokeStyle=C; ctx.lineWidth=3; ctx.beginPath(); const petals=6; for(let i=1;i<l;i++){ const H=frequencyData[i]*(settings.sensitivity/2); const r=150+H + Math.sin(i/l*2*Math.PI*petals)*50; const a=(i/l)*2*Math.PI; const x=hX+Math.cos(a)*r; const y=hY+Math.sin(a)*r; i===1?ctx.moveTo(x,y):ctx.lineTo(x,y); } ctx.closePath(); settings.filledShapes?ctx.fill():ctx.stroke();},
        frequencyWave: (c, o=0) => { const l=frequencyData.length, w=canvas.width/l; let x=o; ctx.lineWidth=3; ctx.strokeStyle=c||getDrawColor(0.5); ctx.beginPath(); for(let i=0;i<l;i++){ const H=frequencyData[i]*(settings.sensitivity/1.5), y=canvas.height-H; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); x+=w;} ctx.stroke(); },
        circularWaveform: (c, o=0) => { const l=timeDomainData.length, hX=canvas.width/2+o, hY=canvas.height/2, C=c||settings.gradientColors[0]; ctx.strokeStyle=C; ctx.lineWidth=3; ctx.beginPath(); for(let i=0;i<l;i++){ const d=(timeDomainData[i]-128), r=200+(d*(settings.sensitivity/1.5)), a=(i/l)*2*Math.PI, x=hX+Math.cos(a)*r, y=hY+Math.sin(a)*r; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); } ctx.closePath(); ctx.stroke();},
        waveform: (c, o=0) => { const l=timeDomainData.length, w=canvas.width*1.0/l; let x=o; ctx.lineWidth=3; ctx.strokeStyle=c||settings.gradientColors[0]; ctx.beginPath(); for(let i=0;i<l;i++){ const v=timeDomainData[i]/128.0, y=v*canvas.height/2; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); x+=w;} ctx.lineTo(canvas.width+o,canvas.height/2); ctx.stroke();}
    };
    function drawPolygon(x,y,s,r,rot,C){ctx.beginPath(); for(let i=0;i<s;i++){ctx.lineTo(x+r*Math.cos(rot+i*2*Math.PI/s),y+r*Math.sin(rot+i*2*Math.PI/s));} ctx.closePath(); settings.filledShapes?ctx.fill():ctx.stroke();}
    function drawProfileImage() { if (!profileImage || !profileImage.complete) return; const centerX = canvas.width / 2, centerY = canvas.height / 2; const size = 120; ctx.save(); ctx.beginPath(); ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(profileImage, centerX - size / 2, centerY - size / 2, size, size); ctx.restore(); }
    
    // --- HELPER FUNCTIONS ---
    function updateContrast() {
        const r = backgroundRgb.r, g = backgroundRgb.g, b = backgroundRgb.b;
        const yiq = ((r*299)+(g*587)+(b*114))/1000;
        document.documentElement.style.setProperty('--text-color', yiq >= 128 ? '#000000' : '#ffffff');
        const uiBtns = document.querySelectorAll('.ui-button, #closeButton');
        uiBtns.forEach(btn => btn.style.color = yiq >= 128 ? '#000' : '#fff');
    }
    function extractColorsFromImage(path) {
        const img = new Image();
        img.onload = () => {
            const hiddenCanvas = document.createElement('canvas');
            const hiddenCtx = hiddenCanvas.getContext('2d');
            hiddenCanvas.width = 10; hiddenCanvas.height = 10;
            hiddenCtx.drawImage(img, 0, 0, 10, 10);
            const data = hiddenCtx.getImageData(0, 0, 10, 10).data;
            const colors = [];
            const indices = [0, 36, 360, 396, 220]; 
            indices.forEach(idx => {
                const r = data[idx], g = data[idx+1], b = data[idx+2];
                colors.push("#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1));
            });
            settings.gradientColors = [...new Set(colors)].slice(0, 5);
            if(settings.gradientColors.length < 2) settings.gradientColors.push('#ffffff');
            updateGradientUI(); saveSettings();
        }
        img.src = path;
    }

    // --- OTHER FUNCTIONS & EVENT LISTENERS ---
    function saveSettings() { localStorage.setItem('visualizerSettings', JSON.stringify(settings)); }
    function loadSettings() { const saved = localStorage.getItem('visualizerSettings'); if (saved) settings = { ...defaultSettings, ...JSON.parse(saved) }; visualizerSelect.value = settings.visualizerType; dynamicCheckbox.checked = settings.dynamicEffects; shakeSlider.value = settings.shake; aberrationSlider.value = settings.aberration; glowSlider.value = settings.glow; glowColor.value = settings.glowColor; scanlineSlider.value = settings.scanlines; accentColorCheckbox.checked = settings.useAccentColor; backgroundColorInput.value = settings.backgroundColor; sensitivitySlider.value = settings.sensitivity; smoothingSlider.value = (settings.smoothing || 0.8) * 100; trailSlider.value = settings.trailAmount * 100; audioSourceSelect.value = settings.audioType; fillCheckbox.checked = settings.filledShapes; directionSelect.value = settings.circularDirection; rotationSlider.value = settings.rotationSpeed; rainbowCheckbox.checked = settings.rainbowMode; rainbowSpeedSlider.value = settings.rainbowSpeed; gradientBgCheckbox.checked = settings.gradientBackground; backgroundRgb = hexToRgb(settings.backgroundColor); dynamicEffectsFieldset.classList.toggle('disabled', !settings.dynamicEffects); if(settings.profileImagePath) setProfileImage(settings.profileImagePath); handleVisualizerOptionsVisibility(); handleRainbowModeVisibility(); updateContrast(); }
    async function initializeAndStartLiveVisualizer() { startMessage.style.opacity = '0'; settingsButton.classList.add('visible'); setTimeout(() => startMessage.style.display = 'none', 500); await startOrUpdateAudioSource(); await populateMicrophoneList(); updateAudioSourceUI(); handleAccentCheck(); updateGradientUI(); handleVisualizerOptionsVisibility(); handleRainbowModeVisibility(); }
    async function startOrUpdateAudioSource() { if (audioContext) { await audioContext.close(); audioContext = null; } let stream; try { if (settings.audioType === 'microphone') { stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: settings.microphoneId ? { exact: settings.microphoneId } : undefined }}); } else { const sources = await window.electronAPI.getSources(); if (!sources || sources.length === 0) throw new Error("No screen sources found."); stream = await navigator.mediaDevices.getUserMedia({ audio: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: sources[0].id }}, video: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: sources[0].id }}}); } audioContext = new AudioContext(); const source = audioContext.createMediaStreamSource(stream); setupAnalyser(source); } catch (err) { alert(`Could not start audio source: ${err.message}\n\nPlease ensure permissions are granted.`); } }
    function setupAnalyser(sourceNode) { analyser = sourceNode.context.createAnalyser(); analyser.fftSize = 2048; sourceNode.connect(analyser); const bufferLength = analyser.frequencyBinCount; frequencyData = new Uint8Array(bufferLength); timeDomainData = new Uint8Array(bufferLength); }
    async function populateMicrophoneList() { try { const devices = await navigator.mediaDevices.enumerateDevices(); const microphones = devices.filter(device => device.kind === 'audioinput'); microphoneSelect.innerHTML = ''; microphones.forEach(mic => { const option = document.createElement('option'); option.value = mic.deviceId; option.textContent = mic.label || `Microphone ${microphoneSelect.options.length + 1}`; microphoneSelect.appendChild(option); }); microphoneSelect.value = settings.microphoneId; } catch (e) { console.error("Could not enumerate devices:", e); } }
    function updateAudioSourceUI() { if (settings.audioType === 'microphone') { microphoneSelectRow.classList.remove('hidden'); } else { microphoneSelectRow.classList.add('hidden'); } }
    function updateGradientUI() { gradientPickerContainer.innerHTML = ''; settings.gradientColors.forEach((color, index) => { const row = document.createElement('div'); row.className = 'gradient-color-row'; const colorInput = document.createElement('input'); colorInput.type = 'color'; colorInput.value = color; colorInput.addEventListener('input', (e) => { settings.gradientColors[index] = e.target.value; saveSettings(); }); const removeBtn = document.createElement('button'); removeBtn.className = 'remove-color-btn'; removeBtn.textContent = '×'; removeBtn.onclick = () => { if (settings.gradientColors.length > 2) { settings.gradientColors.splice(index, 1); updateGradientUI(); saveSettings(); } }; row.appendChild(colorInput); row.appendChild(removeBtn); gradientPickerContainer.appendChild(row); }); }
    async function handleAccentCheck() { if (settings.useAccentColor) { gradientControls.classList.add('disabled'); const accentHex = await window.electronAPI.getAccentColor(); const accentHSL = hexToHsl(accentHex); const startColor = hslToHex(accentHSL.h, accentHSL.s, Math.max(0, accentHSL.l - 20)); const endColor = hslToHex(accentHSL.h, Math.min(100, accentHSL.s + 10), Math.min(100, accentHSL.l + 20)); settings.gradientColors = [startColor, accentHex, endColor]; } else { gradientControls.classList.remove('disabled'); } updateGradientUI(); saveSettings(); }
    function handleSilence(avgVolume) { const silenceThreshold = 3, silenceDuration = 180; if (avgVolume < silenceThreshold) { silenceCounter++; } else { silenceCounter = 0; silentMessage.classList.add('hidden'); if (silentMessageInterval) { clearInterval(silentMessageInterval); silentMessageInterval = null; } } if (silenceCounter > silenceDuration && !silentMessageInterval) { silentMessage.classList.remove('hidden'); let messageIndex = 0; const messages = silenceMessages[settings.audioType]; silentMessage.textContent = messages[messageIndex]; silentMessageInterval = setInterval(() => { messageIndex = (messageIndex + 1) % messages.length; silentMessage.textContent = messages[messageIndex]; }, 4000); } }
    function drawWatermark(intensity) { ctx.font = '16px "Segoe UI", Arial, sans-serif'; const opacity = 0.1 + intensity * 0.6; ctx.fillStyle = `rgba(${backgroundRgb.r > 128 ? 0 : 255}, ${backgroundRgb.g > 128 ? 0 : 255}, ${backgroundRgb.b > 128 ? 0 : 255}, ${opacity})`; ctx.textAlign = 'right'; ctx.fillText('Made by EchoesRealmArrow', canvas.width - 20, canvas.height - 20); ctx.textAlign = 'left'; }
    function setupCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    function hexToRgb(hex) { const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 0, g: 0, b: 0 }; }
    function hexToHsl(H) { let r = 0, g = 0, b = 0; if (H.length == 7) { r = parseInt(H.substring(1,3), 16); g = parseInt(H.substring(3,5), 16); b = parseInt(H.substring(5,7), 16); } r /= 255; g /= 255; b /= 255; let cmin = Math.min(r,g,b), cmax = Math.max(r,g,b), delta = cmax - cmin, h = 0, s = 0, l = 0; if (delta == 0) h = 0; else if (cmax == r) h = ((g - b) / delta) % 6; else if (cmax == g) h = (b - r) / delta + 2; else h = (r - g) / delta + 4; h = Math.round(h * 60); if (h < 0) h += 360; l = (cmax + cmin) / 2; s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1)); s = +(s * 100).toFixed(1); l = +(l * 100).toFixed(1); return { h, s, l }; }
    function hslToHex(h, s, l) { s /= 100; l /= 100; let c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c/2, r = 0, g = 0, b = 0; if (h >= 0 && h < 60) { r = c; g = x; b = 0; } else if (h >= 60 && h < 120) { r = x; g = c; b = 0; } else if (h >= 120 && h < 180) { r = 0; g = c; b = x; } else if (h >= 180 && h < 240) { r = 0; g = x; b = c; } else if (h >= 240 && h < 300) { r = x; g = 0; b = c; } else if (h >= 300 && h < 360) { r = c; g = 0; b = x; } r = Math.round((r + m) * 255).toString(16); g = Math.round((g + m) * 255).toString(16); b = Math.round((b + m) * 255).toString(16); if (r.length == 1) r = "0" + r; if (g.length == 1) g = "0" + g; if (b.length == 1) b = "0" + b; return "#" + r + g + b; }
    function getAverageVolume(dataArray) { let sum = 0; if (dataArray) { for (let i = 0; i < dataArray.length; i++) { sum += dataArray[i]; } return sum / dataArray.length; } return 0; }
    function getMultiStopGradientColor(fraction) { if (!settings.gradientColors || settings.gradientColors.length < 2) return (settings.gradientColors && settings.gradientColors[0]) || '#ffffff'; const stopIndex = fraction * (settings.gradientColors.length - 1); const startIndex = Math.floor(stopIndex); const endIndex = Math.min(startIndex + 1, settings.gradientColors.length - 1); const localFraction = stopIndex - startIndex; const start = hexToRgb(settings.gradientColors[startIndex]); const end = hexToRgb(settings.gradientColors[endIndex]); const r = Math.round(start.r + (end.r - start.r) * localFraction); const g = Math.round(start.g + (end.g - start.g) * localFraction); const b = Math.round(start.b + (end.b - start.b) * localFraction); return `rgb(${r}, ${g}, ${b})`; }
    function getDrawColor(fraction) { if (settings.rainbowMode) { const hue = (fraction * 360) + rainbowHueOffset; return `hsl(${hue % 360}, 100%, 50%)`; } return getMultiStopGradientColor(fraction); }
    function handleVisualizerOptionsVisibility() { const type = visualizerSelect.value; const hasFillOption = ['blob', 'sunburst', 'polygons', 'nestedPolygons', 'shatter', 'flower'].includes(type); const hasDirectionOption = ['circle'].includes(type); const hasRotationOption = ['polygons', 'nestedPolygons', 'starfield'].includes(type); visualizerOptionsFieldset.classList.toggle('hidden', !hasFillOption && !hasDirectionOption && !hasRotationOption); fillCheckbox.parentElement.style.display = hasFillOption ? '' : 'none'; directionSelect.parentElement.style.display = hasDirectionOption ? '' : 'none'; rotationSlider.parentElement.style.display = hasRotationOption ? '' : 'none'; }
    function handleRainbowModeVisibility() { rainbowControls.classList.toggle('hidden', !settings.rainbowMode); gradientControls.classList.toggle('disabled', settings.rainbowMode || settings.useAccentColor); accentColorCheckbox.disabled = settings.rainbowMode; }
    function setProfileImage(path) { if (path) { profileImage = new Image(); profileImage.src = path; settings.profileImagePath = path; pfpPreview.src = path; pfpPreview.classList.remove('hidden'); } else { profileImage = null; settings.profileImagePath = null; pfpPreview.src = '#'; pfpPreview.classList.add('hidden'); } saveSettings(); }
    
    // --- EVENT LISTENERS ---
    setupCanvas(); loadSettings(); window.addEventListener('resize', setupCanvas);
    startMessage.addEventListener('click', initializeAndStartLiveVisualizer, { once: true });
    settingsButton.addEventListener('click', () => settingsPanel.classList.toggle('open'));
    closeSettingsButton.addEventListener('click', () => settingsPanel.classList.remove('open'));
    selectPfpButton.addEventListener('click', async () => { const paths = await window.electronAPI.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }] }); if (paths && paths[0]) setProfileImage(`file://${paths[0]}`); });
    clearPfpButton.addEventListener('click', () => setProfileImage(null));
    extractColorsButton.addEventListener('click', async () => { const paths = await window.electronAPI.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }] }); if (paths && paths[0]) extractColorsFromImage(`file://${paths[0]}`); });
    audioSourceSelect.addEventListener('change', () => { settings.audioType = audioSourceSelect.value; updateAudioSourceUI(); saveSettings(); startOrUpdateAudioSource(); });
    microphoneSelect.addEventListener('change', () => { settings.microphoneId = microphoneSelect.value; saveSettings(); startOrUpdateAudioSource(); });
    visualizerSelect.addEventListener('change', (e) => { settings.visualizerType = e.target.value; handleVisualizerOptionsVisibility(); saveSettings(); });
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
    draw();
});