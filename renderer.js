// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const {ipcRenderer} = require('electron');

ipcRenderer.on('status-update', (event, arg) => {
  document.getElementById("status").innerHTML = arg.text; 
});

document.getElementById('folderSelect').addEventListener('change',function(){
  ipcRenderer.send('marmaste-file-upload', {'path': this.files[0].path});
});

ipcRenderer.on('finished', (event, arg) => {
  document.getElementById("loading-gif").style.visibility = "hidden";
  document.getElementById("link-title").innerHTML = arg['link'];
})

ipcRenderer.on('started', (event, arg) => {
  document.getElementById("loading-gif").style.visibility = "visible";
})