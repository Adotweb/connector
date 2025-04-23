const { app, BrowserWindow } = require('electron')

const { userDataPath } = require("./services/services.js")

console.log(userDataPath)

const path = require("path");

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
	  //titleBarStyle : "hidden",
	  webPreferences : {
		preload : path.join(__dirname, "preload.js"),
	  },
		
  })

  win.loadFile('./pages/index.html')
}

app.whenReady().then(() => {
  createWindow()
})
