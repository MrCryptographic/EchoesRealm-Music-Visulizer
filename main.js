const { app, BrowserWindow, ipcMain, dialog, desktopCapturer, systemPreferences } = require('electron');
const path = require('path');

// Allow audio to capture/play without waiting for a user gesture
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

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