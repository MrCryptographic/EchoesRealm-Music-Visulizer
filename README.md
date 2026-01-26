<img width="512" height="512" alt="icon" src="https://github.com/user-attachments/assets/1fdfb7a1-a862-4bf7-a142-e972fcf87840" />

# EchoesRealm Visualizer

A high-performance, real-time music visualizer built with Electron. It captures audio from your system or microphone and renders it into a variety of stunning, deeply customizable visual patterns. Designed for live performance, desktop customization, and visual aesthetics.

## Features

-   **Live Audio Capture:** Visualize audio from any source (Spotify, YouTube, System Sounds) or a microphone.
-   **Massive Visualizer Library:** Choose from **21 unique visualizer styles**, ranging from classic bars to abstract geometry, digital rain, and organic shapes.
-   **Dynamic Effects Engine:** A robust post-processing engine adding screen shake, chromatic aberration, glows, and scanlines that react to audio intensity.
-   **Particle System:** An integrated physics-based particle system where sparks fly off the visualizer beat.
-   **Profile Picture Overlay:** Upload a custom image to display in the center of the visualizer.
-   **Deep Customization:**
    -   **Rainbow Mode:** Automatically cycles through colors.
    -   **Smart Gradients:** Extract color palettes directly from any image file or build your own multi-stop gradients.
    -   **Gradient Backgrounds:** Apply your color palette to the background with dynamic fading.
    -   **OS Accent Sync:** Match your visualizer to your system colors.
    -   **Rotation & Direction:** Control the speed and flow of circular visualizers.
-   **Persistent Settings:** All your configurations are saved automatically.
-   **Cross-Platform:** Runs on Windows and Linux.

---

## Installation

### Prerequisites

-   **Node.js** & **npm**:
    -   **Windows/macOS:** Download the LTS version from [nodejs.org](https://nodejs.org/).
    -   **Linux:** Use **[nvm](https://github.com/nvm-sh/nvm)**. Avoid `sudo apt install npm` to prevent permission issues.

### Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/MrCryptographic/EchoesRealm-Music-Visualizer.git
    cd EchoesRealm-Visualizer
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the app:**
    ```bash
    npm start
    ```

---

## 🐧 Linux Audio Troubleshooting (Universal)

If you select **"System Audio"** but the visualizer doesn't move (or it only reacts to your microphone):

Linux privacy settings often default applications to the Microphone. You must manually route the System Audio (Monitor) to the application.

1.  **Install PulseAudio Volume Control:**
    *   **Mint/Ubuntu/Debian/Neon:** `sudo apt install pavucontrol`
    *   **Arch/Manjaro:** `sudo pacman -S pavucontrol`
    *   **Fedora:** `sudo dnf install pavucontrol`
2.  **Run the Visualizer** and play some music.
3.  Open **pavucontrol** (PulseAudio Volume Control) from your app menu.
4.  Go to the **Recording** tab.
5.  Find **"EchoesRealm Visualizer"** (or "Electron").
6.  Click the dropdown next to it and select **"Monitor of [Your Audio Output]"**.

The visualizer will immediately start reacting to your system audio.

---

## Settings Guide

Click the **gear icon** (top-right) to open the sidebar.

### 🎵 Audio
-   **Audio Source:** Switch between `System Audio` (what you hear) and `Microphone`.
-   **Microphone:** Select specifically which input device to use.

### 👁️ Visualizer Types
-   **Center Bars:** Symmetrical bars growing outward from the center.
-   **Upward Bars:** Classic bars growing from the bottom up.
-   **Dual-Sided Bars:** Bars growing from both top and bottom edges.
-   **Floor & Ceiling:** Mirrored bars on top and bottom.
-   **Circular Lines:** Lines radiating from a center circle.
-   **Sunburst:** A connected, sharp star-shape expanding with the beat.
-   **Spokes:** Defined rays reacting to bass and mids.
-   **Blob:** A solid, organic, pulsating circle.
-   **Polygons:** Rotating concentric shapes (triangle, square, pentagon) reacting to Bass, Mids, and Highs.
-   **Nested Polygons:** A hypnotic tunnel of rotating triangles.
-   **Starfield:** Twinkling stars scattered across the screen that react to frequency.
-   **Shatter:** A pulsating core that explodes into particles on heavy beats.
-   **Flower:** An organic, petal-like shape that blooms.
-   **Matrix Rain:** Digital code drops that fall faster and brighter with the music.
-   **DNA Helix:** Intertwining sine waves forming a double helix structure.
-   **Pixel Grid:** A retro grid of blocks that light up based on frequency intensity.
-   **Radar:** A sweeping radial scanner effect.
-   **Waves:** Multiple stacked 3D sine waves mimicking an ocean.
-   **Frequency Wave:** A smooth line graph of the audio spectrum.
-   **Circular Waveform:** The raw audio waveform wrapped into a circle.
-   **Waveform:** Classic oscilloscope line.

### ⚙️ Visualizer Options
*(Options appear based on the selected visualizer)*
-   **Fill Shapes:** Toggle between solid fills or outlines.
-   **Direction:** Make circular visualizers grow `Outward` or `Inward`.
-   **Rotation Speed:** Controls how fast polygon-based visualizers spin based on audio intensity.

### 🖼️ Overlay Image
-   **Profile Image:** Select a local image file (PNG/JPG) to display as a circular avatar in the center of the screen.

### ⚡ Effects Engine
-   **Shake Intensity:** How violently the screen shakes on loud beats.
-   **Color Aberration:** Splits RGB channels for a glitch effect.
-   **Glow Intensity:** Radius of the bloom/glow effect.
-   **Glow Color:** The color of the glow shadow.
-   **Scan Line Intensity:** CRT-style horizontal lines overlay.
-   **Enable Particles:** Turns the particle physics system on/off.
    -   **Amount:** Particles spawned per beat.
    -   **Gravity:** How fast particles fall.
    -   **Lifespan:** How long particles fade out.

### 🎨 Color & Style
-   **Rainbow Mode:** Cycles through the color spectrum automatically.
-   **Use OS Accent Color:** Matches system theme.
-   **Gradient Colors:** 
    -   **Manual:** Build a custom gradient with up to 8 colors.
    -   **Extract from Image:** Upload an image to automatically generate a matching color palette.
-   **Gradient Background:** Applies the current gradient to the background (affected by Motion Blur).
-   **Background:** Sets the solid background color (if Gradient Background is off).
-   **Sensitivity:** Reactivity multiplier. High = more movement.
-   **Responsiveness (Smoothing):** Controls how snappy or smooth the bars move.
-   **Motion Blur:** Controls the trail length. Low slider = Long trails. High slider = Sharp/Fast.

---

## Built With
-   **Electron** - App Framework
-   **Web Audio API** - Audio Analysis
-   **HTML5 Canvas** - Rendering

## License
MIT License
