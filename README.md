# EchoesRealm Visualizer
## BIG NOTE: The Render Video option is kind of broken, from my experience.


[Video Preview](https://github.com/user-attachments/files/23537124/2025-11-13.18-43-32.mp3)


A high-performance, real-time music visualizer built with Electron. It can capture and react to any audio on your system (or from a microphone) and offers a deeply customizable visual experience. The application also features a powerful offline rendering engine to export your creations as high-quality videos.

## Features

-   **Live Audio Capture:** Visualize any audio playing on your system (e.g., Spotify, YouTube) or from any connected microphone.
-   **Extensive Visualizer Library:** Choose from a wide variety of visualizer types, from classic frequency bars to abstract geometric shapes.
-   **Powerful Effects Engine:** Apply and customize a suite of dynamic effects—like screen shake, color aberration, glow, and particles—that react to the music's intensity.
-   **Deep Customization:**
    -   Create complex multi-color gradients.
    -   Automatically match your OS accent color (Windows only).
    -   Control visualizer-specific options like fill/outline and direction.
    -   Fine-tune particle physics, including gravity and lifespan.
-   **Offline Video Rendering:** Select a local audio file, choose an optional album art, and export your customized visualizer as an MP4 video file using FFmpeg.
-   **Persistent Settings:** Your entire configuration is automatically saved and loaded between sessions.

---

## Installation and Setup

### Prerequisites

You must have **Node.js** and **npm** installed on your system.
-   **Windows/macOS:** Download the LTS version from the [official Node.js website](https://nodejs.org/).
-   **Linux:** It is **highly recommended** to install Node.js using **[nvm (Node Version Manager)](https://github.com/nvm-sh/nvm)** to avoid system-wide permission issues. Do **not** use `sudo apt install npm`.

### Running the Application

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/MrCryptographic/EchoesRealm-Music-Visualizer.git
    ```

2.  **Navigate to the project directory:**
    ```bash
    cd EchoesRealm-Visualizer
    ```

3.  **Install dependencies:** This is a crucial step that downloads Electron, FFmpeg, and all other necessary libraries.
    ```bash
    npm install
    ```

4.  **Start the application:**
    ```bash
    npm start
    ```

### ❗️ Important Note for Linux Users (PipeWire/PulseAudio)

Modern Linux distributions use PipeWire for audio. If the **System Audio** source fails to capture sound (especially if you use tools like EasyEffects/PulseEffects), you can manually route the audio using `pavucontrol`.

1.  Install the tool: `sudo apt install pavucontrol`
2.  Start the visualizer and play some music.
3.  Open `pavucontrol` and go to the **"Recording"** tab.
4.  You will see "Electron" or "Chromium". Change its capture source from the default to **"Monitor of [Your Speakers/Headphones]"**. The visualizer will immediately start working.

---

## Settings Explained

Click the **gear icon** in the top-right to open the settings sidebar.

### Audio

-   **Audio Source:**
    -   `System Audio`: Captures whatever sound is currently playing out of your speakers.
    -   `Microphone`: Switches to using a microphone input.
-   **Microphone:** (Visible only when "Microphone" is selected) A dropdown list of all available microphone devices on your system.

### Visualizer

-   **Visualizer Type:** The base algorithm for the visualizer.
    -   `Center Bars`: Symmetrical frequency bars that grow outwards from the center line.
    -   `Upward Bars`: Frequency bars that grow upwards from the bottom of the screen.
    -   `Dual-Sided Bars`: Bars that grow from the top and bottom edges towards the center.
    -   `Floor & Ceiling`: Mirrored bars that grow from the top and bottom, creating a symmetrical pattern.
    -   `Circular Lines`: Lines that radiate from a central point.
    -   `Sunburst`: A connected, star-like shape that expands and contracts with the audio.
    -   `Spokes`: Similar to Circular Lines but focuses on fewer, more distinct lines for bass and mids.
    -   `Blob`: A solid, organic, pulsating circular shape.
    -   `Polygons`: Concentric, rotating shapes (triangles, squares, pentagons) that react to different frequency bands.
    -   `Shatter`: A circular base that "shatters" into particles based on audio intensity.
    -   `Frequency Wave`: A smooth, flowing line graph of the audio frequencies.
    -   `Circular Waveform`: The raw audio waveform wrapped into a circle.
    -   `Waveform`: A classic oscilloscope-style line showing the raw audio waveform.

-   **Visualizer Options:** (This section appears for compatible visualizers)
    -   **Fill Shapes:** Toggles between solid shapes (`checked`) and outlines (`unchecked`) for visualizers like `Blob`, `Sunburst`, and `Polygons`.
    -   **Direction:** For `Circular Lines`, switches between lines growing `Outward` from the center or `Inward` from the screen edge.

### Dynamic Effects Engine

These effects are only active when **Enable Dynamic Effects** is checked. Their strength is tied to the real-time volume of the audio.

-   **Shake Intensity:** Controls the maximum amount of screen shake during loud moments.
-   **Color Aberration:** Splits the visualizer into its Red, Green, and Blue channels and offsets them for a glitchy, chromatic effect. This slider controls the maximum offset distance.
-   **Glow Intensity:** Controls the brightness and radius of an outer glow effect.
-   **Glow Color:** Sets the color of the glow.
-   **Scan Line Intensity:** Overlays dark, horizontal lines on the screen, which become more opaque with volume, mimicking an old CRT monitor.

-   **Enable Particles:** Master toggle for the particle system.
-   **Particle Amount:** Controls how many particles are spawned relative to the audio intensity.
-   **Particle Gravity:** Controls the downward force applied to particles each frame. A higher value means they fall faster.
-   **Particle Lifespan:** Controls how long particles stay on screen before fading out.

### Color & Style

-   **Use OS Accent Color:** (Windows only) When checked, automatically creates a three-point gradient based on your Windows accent color, disabling the manual gradient controls.
-   **Gradient Colors:**
    -   Click a color box to change that color in the gradient.
    -   Click the `+` button to add a new color stop (up to 8 total).
    -   Click the `×` button to remove a color stop (minimum of 2).
-   **Background:** Sets the solid color of the background.
-   **Sensitivity:** A multiplier for how much the visualizers react to the audio. Higher values create larger visualizer movements.
-   **Motion Blur:** Controls the length of the "ghosting" trail. A lower value creates a longer, smoother trail. A higher value creates a sharper, more immediate effect.

---

## Built With

-   [Electron](https://www.electronjs.org/)
-   [Node.js](https://nodejs.org/)
-   [FFmpeg](https://ffmpeg.org/) via `fluent-ffmpeg`
-   [music-metadata](https://github.com/Borewit/music-metadata-browser)

## Author

-   **EchoesRealmArrow**

## License

This project is licensed under the MIT License.
