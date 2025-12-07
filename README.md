# EchoesRealm Visualizer

## ⚠️ Note on Video Rendering
The offline video rendering feature uses FFmpeg. While functional, it may require specific system resources or configurations depending on your OS.

![EchoesRealm Visualizer](https://i.imgur.com/k9yXQ7p.png)

A high-performance, real-time music visualizer built with Electron. It captures audio from your system or microphone and renders it into a variety of stunning, deeply customizable visual patterns.

## Features

-   **Live Audio Capture:** Visualize audio from any source (Spotify, YouTube, System Sounds) or a microphone.
-   **Massive Visualizer Library:** Choose from over 15 unique visualizer styles, ranging from classic bars to abstract geometry and organic shapes.
-   **Dynamic Effects Engine:** A robust post-processing engine adding screen shake, chromatic aberration, glows, and scanlines that react to audio intensity.
-   **Particle System:** An integrated physics-based particle system where sparks fly off the visualizer beat.
-   **Profile Picture Overlay:** Upload a custom image to display in the center of the visualizer.
-   **Deep Customization:**
    -   **Rainbow Mode:** Automatically cycles through colors.
    -   **Gradient Control:** Create custom multi-stop gradients.
    -   **OS Accent Sync:** Match your visualizer to your Windows system colors.
    -   **Rotation & Direction:** Control the speed and flow of circular visualizers.
-   **Persistent Settings:** All your configurations are saved automatically.

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

### 🐧 Linux Audio Troubleshooting (PipeWire)
If the visualizer doesn't move when "System Audio" is selected:
1.  Install **pavucontrol**: `sudo apt install pavucontrol`
2.  Run the visualizer.
3.  Open **pavucontrol**, go to the **Recording** tab.
4.  Find "Electron" and change the source to **"Monitor of [Your Audio Output]"**.

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
-   **Use OS Accent Color:** (Windows) Matches system theme.
-   **Gradient Colors:** Manually build a gradient with up to 8 colors.
-   **Sensitivity:** Reactivity multiplier. High = more movement.
-   **Motion Blur:** Controls the trail length. Low slider = Long trails. High slider = Sharp/Fast.

---

## Built With
-   **Electron** - App Framework
-   **Web Audio API** - Audio Analysis
-   **HTML5 Canvas** - Rendering
-   **FFmpeg** - Video Export

## License
MIT License
