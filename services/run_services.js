const { spawn } = require('child_process');
const kill = require("tree-kill")

const fs = require("fs")
const path = require("path");
const { app } = require('electron');
//most of this is copied from chatgpt

//a map to store services (things that hold information about processes)
const services = new Map()

try {
	let userDataPath = app.getPath("userData");
	let file = JSON.parse(fs.readFileSync(path.join(userDataPath, "services", "services.json"), "utf8"))
	
	file.forEach(service => {
		services.set(service.service_name, service)
	})

}catch(e){
	console.log(e)	
}

// A Map to store processes
const processes = new Map();

// Start a process
function startProcess(service) {
	let {run_command, path, service_name : name, env} = service	
	
	const proc = spawn(run_command, {cwd : path, stdio: 'pipe', shell : true , env : {
		...process.env,
		...env
	}});


	service.running = true;


  // Log output to console
  proc.stdout.on('data', (data) => {

	  services.get(name).logs += `\n[${new Date().toUTCString()}] ${data}`
  });

  proc.stderr.on('data', (data) => {
	  services.get(name).logs += `\n[${new Date().toUTCString()}, error] ${data}`
  });

  proc.on('close', (code) => {

	  if(services.has(name)){
	  	services.get(name).running = false
	  }

    processes.delete(name); // Clean up if needed
  });


	

  // Store the process
  processes.set(name, proc);
	services.set(name, service)

}

// Kill a process
function stopProcess(name) {
  const proc = processes.get(name);
	console.log(proc.pid, name, services.get(name))

  if (proc) {
	  services.get(name).running = false
	
	  kill(proc.pid)

    processes.delete(name);
    console.log(`[${name}] process killed`);
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
