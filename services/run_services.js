const { spawn } = require('child_process');

//most of this is copied from chatgpt

//a map to store services (things that hold information about processes)
const services = new Map()

// A Map to store processes
const processes = new Map();

// Start a process
function startProcess(service) {
	const {run_command, path, service_name : name, env} = service	
  
	const proc = spawn(run_command, {cwd : path, stdio: 'pipe', shell : true , env : {
		...process.env,
		...env
	}});


  // Log output to console
  proc.stdout.on('data', (data) => {

	  services.get(name).logs += `\n[${new Date().toUTCString()}] ${data}`
		console.log(`\n[${new Date().toUTCString()}] ${data}`)
  });

  proc.stderr.on('data', (data) => {
	  services.get(name).logs += `\n[${new Date().toUTCString()}, error] ${data}`
		console.error(`\n[${new Date().toUTCString()}] ${data}`)
  });

  proc.on('close', (code) => {
    console.log(`[${name}] exited with code ${code}`);
	  services.get(name).running = false
    processes.delete(name); // Clean up if needed
  });


	

  // Store the process
  processes.set(name, proc);
	services.set(name, service)

}

// Kill a process
function stopProcess(name) {
  const proc = processes.get(name);
  if (proc) {
	  services.get(name).running = false
    proc.kill();
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
