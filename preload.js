const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSources: () => ipcRenderer.invoke('get-sources'),
                                getAudioMetadata: (filePath) => ipcRenderer.invoke('get-audio-metadata', filePath),
                                getAccentColor: () => ipcRenderer.invoke('get-accent-color'),
                                showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
                                startRender: () => ipcRenderer.send('start-render'),
                                sendFrame: (data) => ipcRenderer.send('render-frame', data),
                                encodeVideo: (data) => ipcRenderer.invoke('encode-video', data),
                                onRenderProgress: (callback) => ipcRenderer.on('render-progress', (event, ...args) => callback(...args)),
});
