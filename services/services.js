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

//register the download_repo function to use in frontend
ipcMain.handle("download_repo", async (ev, data) => {
	//we do in try catch so we can report if an error happened to the frontend
	try {
		const {owner, repo} = data;
		//we download the data to the repos folder and return success if that worked
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
ipcMain.handle("run_new_service", async (ev, data) => {
	try {
		const {name, path, command, github_url, inward_port, env, outward_id} = data;
	
		let new_service_obj = Object.assign({}, service);

		//we create a new object with all the properties of the sent object so that we can put it into startProcess
		//this way we dont have weird side effects with the original service object 
		//(which i created mainly for code completion, purposes so i know what values come where)
		new_service_obj.service_name = name;
		new_service_obj.path = path;
		new_service_obj.run_command = command;
		new_service_obj.github_url = github_url;
		new_service_obj.inward_port = inward_port;
		new_service_obj.env = env;
		new_service_obj.running = true
		new_service_obj.outward_id = outward_id;
		new_service_obj.logs = "";

		//we then start the process with the given data, and return success or an error if one happens
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

//almost the same as above, with the difference that we can run services that already are cached
ipcMain.handle("run_service", async (ev, data) => {
	try {
		const cached_service = data;
	
		//just starts the process with the sent data
		startProcess(cached_service);
	
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


//stops the service with the name
ipcMain.handle("stop_service", async (ev, data) => {
	try {
		const {service_name} = data;
		
		stopProcess(service_name);
	
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

ipcMain.handle("delete_service", async (ev, data) => {
	try {
		const {service_name} = data;
	
		//we delete the process from the map
		services.delete(service_name)	

		//and then stop it
		//this can in theory fail and we lose the handle (becase we deleted it in the line above)
		//but killing processes usually doesnt fail, and if we dont do this we are stuck when we try to stop a process that does not exist and are not able to delete the service because this failed...
		stopProcess(service_name)
		
			
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


//edits the service (basically creates a new one)
ipcMain.handle("edit_service", async (ev, data) => {
	try {
		//data comes with all the new service information here
		const {service_name} = data;
		
		//first we stop the processes
		stopProcess(service_name)
			

		//we need to wait a bit until all the cleanup is done
		//then we restart the process (this time it has the new information)
		setTimeout(() => startProcess(data), 1_000)



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

//just returns all the services in an array (because the name is only for fast lookup)
ipcMain.handle("get_services", async () => {
	return [...services.values()]
})


module.exports = {
	userDataPath
}
