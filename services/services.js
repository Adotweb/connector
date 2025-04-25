const { app, ipcMain }  = require("electron");
const { downloadRepo } = require("./download_repo");


const userDataPath = app.getPath("userData");

const services = new Map();


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
	outward_id : "string"
}



ipcMain.on("create", (event, data) => {
	try {

		const {owner, repo} = data

		downloadRepo(owner, repo, data.branch || "master", userDataPath)	
				
			
	}catch(e){
		console.log(e)
	}
})


ipcMain.handle("create_service", async (ev, data) => {

	console.log(data)

	try {
		const {owner, repo} = data;

		

		let ret = await downloadRepo(owner, repo, data.branch || "master", userDataPath)
	
		return {
			success : true,
			data : ret
		}
	} catch(e){
		return {
			success : true, 
			error : e
		}
	}

})

ipcMain.handle("get_services", async () => {
	return {
		running : services, 
		all : []
	}
})

function create_service(service){


}


//returns a list of all currently downloaded services
function get_services(){

}

function get_service_status(name){

		

}

module.exports = {
	create_service,
	get_services,
	userDataPath
}
