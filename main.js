const { app, BrowserWindow, shell, ipcMain } = require('electron')
//all imports of self defined functions

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

//this launches the app
const createWindow = () => {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
	  //titleBarStyle : "hidden",
	  webPreferences : {
		preload : path.join(__dirname, "preload.js"),
		
	  },
	  //hides the bar that says "file | view" etc.
	  titleBarStyle : "hidden"
		
  })

	//expose the pages/index.html file for the frontend
  win.loadFile('./pages/index.html')
}

//before we quit the app we want to run some cleanup
app.on("before-quit", (e) => {
	//we prevent the next steps (actually closing the app)
	//until we are done with the cleanup
	e.preventDefault()	

	//this gets all services and stops the processes behind them
	let process_names = [...processes.keys()]
	process_names.forEach(p => {
		console.log(p)
		stopProcess(p)
	})

	//we wait a bit so that cleanup is done
	setTimeout(() => {

		//this creates  JSON object of all our services so we can store it and refire it when we open the app again
		let file = JSON.stringify([...services.values()])
		fs.writeFileSync(path.join(userDataPath, "services", "services.json"), file, "utf8")

		//then we exit the app
		app.exit()
	}, 1000)
})

app.whenReady().then(() => {
	
	//starts the connection to the relay server
	start_ws()

	//function above
	check_app_folders()
	//start app
  	createWindow()
})
