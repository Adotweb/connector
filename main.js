const { app, BrowserWindow, shell, ipcMain } = require('electron')

const { uniqueNamesGenerator, adjectives, colors, animals} = require("unique-names-generator")

const fs = require("fs")
const { userDataPath } = require("./services/services.js")

const path = require("path");
const { start_ws } = require('./relay/relay.js');
const { services, processes, stopProcess } = require('./services/run_services.js');


//check if app folders are already created (so we dont get any conflicts later)
//in part inspired by ai (namely chatgpt)
function check_app_folders(){
	let inner_folders = [
		"repos", //the downlaoded repos are stored here,
		"services", //the service data (this means pointing data) is stored here
	]		

	inner_folders.forEach(folder => {
		//check if does not exist and create
		if(!fs.existsSync(path.join(userDataPath, folder))){
			fs.mkdirSync(path.join(userDataPath, folder))
		}
	})
}


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


app.on("will-quit", () => {

	let file = JSON.stringify([...services.values()])

	//this runs cleanup
	let process_names = [...processes.keys()]
	process_names.forEach(p => stopProcess(p))

	console.log(file)
	
	fs.writeFileSync(path.join(userDataPath, "services", "services.json"), file, "utf8")

})

app.whenReady().then(() => {

	start_ws()

	check_app_folders()
  	createWindow()
})
