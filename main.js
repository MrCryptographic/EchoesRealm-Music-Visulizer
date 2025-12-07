const { app, BrowserWindow, ipcMain, dialog, desktopCapturer, systemPreferences } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

ffmpeg.setFfmpegPath(ffmpegPath);

let tempDir = null;

ipcMain.handle('get-sources', async () => await desktopCapturer.getSources({ types: ['screen'] }));
ipcMain.handle('get-accent-color', () => { return process.platform === 'win32' ? systemPreferences.getAccentColor() : '#3498db'; }); // Changed default for Linux
ipcMain.handle('get-audio-metadata', async (event, filePath) => { try { const { parseFile } = await import('music-metadata'); const metadata = await parseFile(filePath); return { title: metadata.common.title, artist: metadata.common.artist, album: metadata.common.album }; } catch (error) { console.error("Could not read metadata:", error.message); return null; } });
ipcMain.handle('show-open-dialog', async (event, options) => { const result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), options); return result.filePaths; });
ipcMain.on('start-render', () => { tempDir = path.join(os.tmpdir(), `visualizer-render-${Date.now()}`); if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir); });
ipcMain.on('render-frame', (event, { frame, frameNumber }) => { if (!tempDir) return; const base64Data = frame.replace(/^data:image\/png;base64,/, ""); const framePath = path.join(tempDir, `frame-${String(frameNumber).padStart(6, '0')}.png`); fs.writeFileSync(framePath, base64Data, 'base64'); });
ipcMain.handle('encode-video', async (event, { audioPath, imagePath, fps }) => { const { filePath } = await dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), { title: 'Save Video', defaultPath: `visualizer-output.mp4`, filters: [{ name: 'Videos', extensions: ['mp4'] }] }); if (!filePath) return { success: false, error: 'Save cancelled' }; return new Promise((resolve, reject) => { const command = ffmpeg(); command.input(path.join(tempDir, 'frame-%06d.png')).inputFPS(fps); if (imagePath) command.input(imagePath); command.input(audioPath); const filters = imagePath ? '[1:v]scale=1280:720[bg];[0:v]scale=1280:720,format=rgba,colorchannelmixer=aa=0.8[fg];[bg][fg]overlay[v]' : '[0:v]scale=1280:720[v]'; command.complexFilter(filters).outputOptions(['-map [v]', `-map ${imagePath ? '2:a' : '1:a'}`, '-c:v libx264', '-c:a aac', '-b:a 192k', '-pix_fmt yuv420p', '-y']).on('progress', (progress) => event.sender.send('render-progress', { percent: progress.percent })).on('end', () => { if(tempDir) fs.rm(tempDir, { recursive: true, force: true }, () => {}); resolve({ success: true, path: filePath }); }).on('error', (err) => { if(tempDir) fs.rm(tempDir, { recursive: true, force: true }, () => {}); reject(new Error(err.message)); }).save(filePath); }); });

function createWindow() { const win = new BrowserWindow({ width: 1280, height: 720, backgroundColor: '#000', webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, } }); win.loadFile('index.html'); }
app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

const { app, BrowserWindow, ipcMain, dialog, desktopCapturer, systemPreferences } = require('electron');
const path = require('path');

ipcMain.handle('get-sources', async () => await desktopCapturer.getSources({ types: ['screen'] }));

ipcMain.handle('get-accent-color', () => {
  if (process.platform === 'win32') {
    return systemPreferences.getAccentColor();
  }
  return '#3498db'; // Default for Linux/Mac
});

ipcMain.handle('get-audio-metadata', async (event, filePath) => {
  try {
    const { parseFile } = await import('music-metadata');
    const metadata = await parseFile(filePath);
    return { title: metadata.common.title, artist: metadata.common.artist, album: metadata.common.album };
  } catch (error) {
    console.error("Could not read metadata:", error.message);
    return null;
  }
});

ipcMain.handle('show-open-dialog', async (event, options) => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(focusedWindow, options);
    return result.filePaths;
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    backgroundColor: '#000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });