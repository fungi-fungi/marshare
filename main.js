require('dotenv').config();
const electron = require('electron')
const querystring = require('querystring')
const fs = require('fs')
const request = require('request');


// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
const {ipcMain} = require('electron');
const {clipboard} = require('electron');


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let accessToken = process.env.ACCEESS_KEY;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 600, height: 460})
  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`)

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

}
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
})

ipcMain.on('marmaste-file-upload',  function(event, arg){

  event.sender.send('started', "");

  request(getOptionForCreateFolder(), function(error, response, body){
    if (!error && response.statusCode == 200) {
      event.sender.send('status-update', {text: "Dropbox folder has been created !"});
      request(getOptionsForFileUpload(JSON.parse(body)['path_lower'], arg['path']), function(error, fileUploadResponse, fileUploadBody){
        event.sender.send('status-update', {text: "File uploaded !"});
        request(getOptionToShare(JSON.parse(fileUploadBody)['path_lower']), function(error, shareMarmasetResponce, shareMarmasetBody){
          event.sender.send('status-update', {text: 'Marmaset file shared publicly'});
          request(getOptionsForIndexFileUpload(JSON.parse(shareMarmasetBody)['url'], JSON.parse(body)['path_lower']), function(error, uploadIndexFileResponce, uploadIndexFileBody){
            event.sender.send('status-update', {text: "Index file uploaded"});
            request(getOptionToShare(JSON.parse(uploadIndexFileBody)['path_lower']), function(error, shareIndexResponce, shareIndexFileBody){
              
              var shareLink = JSON.parse(shareIndexFileBody)['url'].replace("www.dropbox.com", "dl.dropbox.com").replace("?dl=0", "");
              event.sender.send('status-update', {text: 'Link is in your clipboard !!!'});
              event.sender.send('finished', {link: shareLink});
              clipboard.writeText(shareLink);
            });
          });
        });
      });

    } else {
      event.sender.send('status-update', {text: "Something went wrong"});
    }
    
  });
});


function getOptionsForFileUpload(folderPath, filePath){
  return {
    url: 'https://content.dropboxapi.com/2/files/upload',
    headers: {
      'User-Agent': 'request',
      'Dropbox-API-Arg': JSON.stringify({'path': folderPath + '/marmasetFile.mview', 'mode': 'add', 'autorename': false}),
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/octet-stream'
    },
    body: fs.createReadStream(filePath),
    method: 'POST'
  };
}

function getOptionsForIndexFileUpload(marmasetFile, folderPath){
  return {
    url: 'https://content.dropboxapi.com/2/files/upload',
    headers: {
      'User-Agent': 'request',
      'Dropbox-API-Arg': JSON.stringify({'path': folderPath + '/index.html', 'mode': 'add', 'autorename': false}),
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/octet-stream'
    },
    body: prepareIndexFile(marmasetFile),
    method: 'POST'
  };
}

function getOptionForCreateFolder(){
  return {
    url: 'https://api.dropboxapi.com/2/files/create_folder',
    headers: {
      'User-Agent': 'request',
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({'path': '/MarmasetShare/' + new Date().getTime()}),
    method: 'POST'
  };
}


function getOptionToShare(filePath){
  return {
    url: 'https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings',
    headers: {
      'User-Agent': 'request',
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({'path': filePath, 'settings': {'requested_visibility': 'public'}}),
    method: 'POST'
  };
}

function prepareIndexFile(mviewPath){
  return "<!DOCTYPE html><meta name='viewport' content='user-scalable=0'/><html><head><title>blah</title><script src='https://viewer.marmoset.co/main/marmoset.js'></script></head><body><script>marmoset.embed( '"+ mviewPath.replace("www.dropbox.com", "dl.dropbox.com") + "', { width: 800, height: 600, autoStart: true, fullFrame: true, pagePreset: false } );</script></body></html>";
}


// ipcMain.on('marmaste-file-upload', (event, arg) => {
//   // event.sender.send('status-update', {text: "File sent"});
//   request('http://www.google.com', function (error, response, body) {
//     if (!error && response.statusCode == 200) {
//       console.log(body);
//     }
//   })
// });

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
