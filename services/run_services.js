const { spawn } = require('child_process');
const kill = require("tree-kill")

const fs = require("fs")
const path = require("path");
const { app } = require('electron');
//most of this is copied from chatgpt

//a map to store services (things that hold information about processes)
const services = new Map()

//we try to get the services the user has already defined from the path they are stored
//we do this in a try block so that it cannot throw an error
try {
	let userDataPath = app.getPath("userData");
	let file = JSON.parse(fs.readFileSync(path.join(userDataPath, "services", "services.json"), "utf8"))

	//then we set a Map reference for every JSON object in the file
	file.forEach(service => {
		services.set(service.service_name, service)
	})

}catch(e){
	console.log(e)	
}

// A Map to store processes
const processes = new Map();

// Start a process
// in part copied by chatgpt (everything that has less indents)
function startProcess(service) {
	let {run_command, path, service_name : name, env} = service	

	//we replace all \n with && again just to be sure
	run_command = run_command.replaceAll(/\n+/g, "&&");

	console.log(run_command)
	//this actually runs the command, we provide the path where the repo we installed is at, the command we run
	//and the environment variables
	const proc = spawn(run_command, {cwd : path, stdio: 'pipe', shell : true , env : {
		...process.env,
		...env
	}});

	//we set the services running state to true to reflect in the fronted
	service.running = true;


	//write stdout to the logs attribute so we can show in frontend
  proc.stdout.on('data', (data) => {
	  services.get(name).logs += `\n[${new Date().toUTCString()}] ${data}`
  });

	//same with errors
  proc.stderr.on('data', (data) => {
	  services.get(name).logs += `\n[${new Date().toUTCString()}, error] ${data}`
  });

	//once we close we perform some cleanup, set the running state to false and delete from process map
  proc.on('close', (code) => {

		if(services.has(name)){
	  		services.get(name).running = false
	  	}

    		processes.delete(name); 
  });


	

  	//store the process with the name, and store the service (that has the meta information)
  	processes.set(name, proc);
	services.set(name, service)

}

//stops a process?!?!
function stopProcess(name) {
	//get the process 
  	const proc = processes.get(name);

	//if the process exists we set its running state to false and kill it with its PID
  	if (proc) {
	  	services.get(name).running = false	
	  	kill(proc.pid)
    		processes.delete(name);
  	} else {
    		console.log(`[${name}] process not found`);
  	}
}

module.exports = {
	processes, 
	startProcess, 
	stopProcess,
	services
}
