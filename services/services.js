const { app, ipcMain }  = require("electron");
const { downloadRepo } = require("./download_repo");


const {processes, startProcess, stopProcess, services} = require("./run_services")


const userDataPath = app.getPath("userData");


//this is just a sample service object
const service = {
	//name we call the service
	service_name : "string",
	//place the service is stored
	path : "string",	
	//running?
	running : "boolean",
	//environment variables
	env : {},
	//github repo were pulling from
	github_url : "string",		
	//command we execute on start
	run_command : "string",
	//the port the service is listening on
	inward_port : "number",	
	//the id we can connect to the service with
	outward_id : "string", 
	//the logs of running
	logs : "string"
}


ipcMain.handle("download_repo", async (ev, data) => {
	try {
		const {owner, repo} = data;
		//we download the data to the repos folder	
		let ret = await downloadRepo(owner, repo, data.branch || "master", userDataPath + "/repos/")
		return {
			success : true,
			data : ret
		}
	} catch(e){

		return {
			success : false, 
			error : "" + e //convert the error to a string
		}
	}
})

//this method creates a config file so we can rerun the configuration once we have an error or similar
//ipcMain.handle("create_service_config", async)

ipcMain.handle("run_service", async (ev, data) => {
	try {
		const {name, path, command, github_url, inward_port, env, outward_id} = data;
	
		let new_service_obj = Object.assign({}, service);

		new_service_obj.service_name = name;
		new_service_obj.path = path;
		new_service_obj.run_command = command;
		new_service_obj.github_url = github_url;
		new_service_obj.inward_port = inward_port;
		new_service_obj.env = env;
		new_service_obj.running = true
		new_service_obj.outward_id = outward_id;

		console.log(new_service_obj)
		startProcess(new_service_obj);
	
		return {
			success : true
		}
	}catch(e){
		console.log(e)
		return {
			success: false,
			error : "" + e
		}
	}
})

ipcMain.handle("stop_service", async (ev, data) => {
	try {
		const {name} = data;

		stopProcess(name);
	
		return {
			success : true
		}
	}catch(e){
		return {
			success: false,
			error : "" + e
		}
	}
})


ipcMain.handle("get_services", async () => {
	return [...services.values()]
})


module.exports = {
	userDataPath
}
