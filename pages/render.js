let host_id;

document.addEventListener("DOMContentLoaded", async e => {

	//get the host_id so we can display it	
	host_id = await host.get_host_id();	

	document.getElementById("host_id").innerHTML = host_id; 
})


//this method is used when we get a message in the creation process
//it just takes the message and puts it into the bar on the right
function create_success_status_message(msg){
	let message = document.createElement("div")
	document.getElementById("status_window").appendChild(message)
	message.outerHTML = `
		<div class="rounded-full border-2 border-green-800 text-white bg-green-500 py-2 px-4 w-full">
			${msg}
			<div>${new Date().toUTCString()}</div>
		</div>
	`


}

//similar for errors
function create_error_status_message(msg){
	let message = document.createElement("div")

	document.getElementById("status_window").appendChild(message)
	message.outerHTML = `
		<div class="rounded-full font-bold text-lg border-2 border-red-800 text-white bg-red-500 py-2 px-4 w-full">
			${msg}
			<div>${new Date().toUTCString()}</div>
		</div>
	`

}

//this is the method that actually creates the service, but first it checks if the things mentioned even make sense (i.e. if the github url is valied etc.)
async function create_service(){


	//we change the button so it cannot do anything and shows three dots to show something is happening
	let button = document.getElementById("create-button")
	button.innerHTML = "..."
	button.onclick = () => {}

	//in case we edited before we want to make the input writable
	document.getElementById("service_name").removeAttribute("readonly");
	//we get the service name and the repo we want to pull from
	let service_name = document.getElementById("service_name").value;
	let github_url = document.getElementById("github_url").value;

	//split into owner and repo 
	//the filter is so that we dont get artifacts
	let [owner, repo] = github_url.split("/").filter(s => s!= "")

	//this will be the port that the relay will try to hit when a request comes in
	let inward_port = document.getElementById("inward_port").value;
	//in the start command we replace all newlines with && so that commands are adjoined
	let start_command = document.getElementById("start_command").value.replaceAll(/\n*/, "&&").replaceAll("\s+", " ");

	//we prepare an object that we can write to
	let env = {}; 
	//we split the text into lines of the form KEY=VALUE and split them into [KEY, VALUE], so we can write them to the above object
	document.getElementById("env_variables").value.replaceAll("\n+", "\n").split("\n").map(line => line.split("=").filter(s => s!="")).forEach(([key, value]) => {
		env[key] = value;	
	});


	//we check if the repo exists and throw (and show) an error when it doesnt
	let github_check = await fetch("https://github.com/" + github_url).then(res => {
		if(res.status == 404){
			return res.status
		}
		return res.text()
	})
	//this means that the specified repo does not exist
	if(github_check == 404){
		create_error_status_message(`the repo ${github_url} does not exist`)		
		return
	}

	//else we show success
	create_success_status_message(`found repo ${github_url}`)		


	//we try to download the repo in the backend
	let { success, data } = await services.download_repo({owner, repo})
	
	//if this fails somehow we show that something has failed
	if(!success){
		create_error_status_message("something went wrong with this repo")
		return
	}

	let {path} = data

	create_success_status_message(`successfully installed ${github_url}`)


	//after we run the new service with all its data
	let {success : new_success, data : new_data} = await services.run_new_service({
		path, 
		name : service_name, 
		command : start_command,
		github_url,
		inward_port,
		outward_id : Math.random() * 10_000_000,
		env 
	})


	//we are done and close the creator popup
	toggle_service_creator_popup()
}

//works similar to create_service but instead edits the provided reference
async function edit_service(service_ref){

	let button = document.getElementById("create-button")
	button.innerHTML = "..."
	button.onclick = () => {}

	//we dont use service_name because it cannot be changed, but have to make it readonly	
	document.getElementById("service_name").setAttribute("readonly");

	//everything else stays the same, except for the last part

	let github_url = document.getElementById("github_url").value;

	//split into owner and repo 
	let [owner, repo] = github_url.split("/").filter(s => s!= "")


	let inward_port = document.getElementById("inward_port").value;
	let start_command = document.getElementById("start_command").value.replaceAll("\n*", "&&").replaceAll("\s+", " ");
	let env = {}; 
	document.getElementById("env_variables").value.replaceAll("\n+", "\n").split("\n").map(line => line.split("=").filter(s => s!="")).forEach(([key, value]) => {
		env[key] = value;	
	});

	let github_check = await fetch("https://github.com/" + github_url).then(res => {
		if(res.status == 404){
			return res.status
		}
		return res.text()
	})
	//this means that the specified repo does not exist
	if(github_check == 404){
		create_error_status_message(`the repo ${github_url} does not exist`)		
		return
	}


	create_success_status_message(`found repo ${github_url}`)		

	let { success, data } = await services.download_repo({owner, repo})
	

	if(!success){
		create_error_status_message("something went wrong with this repo")
		return
	}

	let {path} = data

	create_success_status_message(`successfully installed ${github_url}`)


	//instead of running the service, we edit the service, this uses the already registered service, but fills in new information, this way the logs will be preservered
	let {success : new_success, data : new_data} = await services.edit_service({
		//we provide the reference here
		service_name : service_ref,
		path, 

		//the name cannot be changed
		name : service_ref, 
		run_command : start_command,
		github_url,
		inward_port,
		env, 

		//copy the old logs and outward id
		logs : service_objects.get(service_ref).logs,
		outward_id : service_objects.get(service_ref).outward_id,
	})

	//after all of this we are done
	toggle_service_creator_popup()
}


//self explanatory
async function delete_cached_service(service_name){
	let result = await services.delete_service(service_objects.get(service_name))
	toggle_service_dashboard(service_name);
}


//self explanatory
async function edit_cached_service(service_name){
	toggle_service_dashboard(service_name)
	toggle_service_creator_popup(service_objects.get(service_name))
}

//a variable that indicates if the creator popup is open
let popup_open = false;

//if the editing_service variable is given, we know that we are editing and can put in preset values (this way we dont have to fill all of them in again)
function toggle_service_creator_popup(editing_service){

	//we want the same function to toggle instead of having to seperate functions	
	popup_open = !popup_open;

	//get a reference to the handle in the DOM
	let popup = document.getElementById("popup")

	//check if we are currently opening the popup
	if(popup_open){

		//all comments are made here because i cannot write them inside,
		//all of the code below is for the creator popup and uses a lot of tailwind classes for style
		//this is a popup that opens once we want to create a new service
		//we need to use stopPropagation so that the child element does not trigger the toggle function
		//

		popup.outerHTML = `
			<div id="popup" class="absolute z-15 w-[100vw] h-[100vh] p-10 flex justify-center  items-center " 
			style="background-color : #000000AE"
			onclick="toggle_service_creator_popup(this)">
				
				<div onclick="event.stopPropagation()" 
				class="z-20 w-3/5  bg-white flex flex-col items-center items-center max-h-[90%]  gap-4 rounded p-8 overflow-y-scroll">
					<div class="font-bold text-3xl w-full">New Service</div>	
				

					<div class="bottom-part w-full flex justify-between">
						<div  class="w-1/2 flex flex-col items-start gap-4">
							<input id="service_name" type="text" placeholder="Service Name" 
								class="outline-none bg-gray-300 rounded-full px-4 py-2 w-full">
						
							<input id="github_url" type="text" placeholder="github owner/repository" 
								class="outline-none bg-gray-300 rounded-full px-4 py-2 w-full">
							
							<input id="inward_port" type="text" placeholder="Inward Port (port your app listens to)" 
								class="outline-none bg-gray-300 rounded-full px-4 py-2 w-full">


							<textarea placeholder="start command e.g:\n\nnpm install \nnpm run start\n\n(enter will adjoin the commands using &&)" 
							name="start_command" id="start_command"  rows="8" resize="false"
							class="outline-none bg-gray-300 rounded-lg px-4 py-2 w-full"></textarea>	

							<textarea placeholder='Environment Variables\nusage:\n\nENV_VAR=value\n\nnew lines will be treated as seperators'
							name="start_command" id="env_variables"  rows="8" resize="false"
							class="outline-none bg-gray-300 rounded-lg px-4 py-2 w-full"></textarea>	



							<button id="create-button" class="p-2 rounded-md border-2 border-black hover:bg-black hover:border-white hover:text-white transition duration-150 w-full font-bold"
							onclick="${editing_service ? `edit_service('${editing_service.service_name}')` : 'create_service()'}">
								Create Service
							</button>	

						</div>

						<div class="status w-1/2 flex flex-col items-center px-4 gap-2" id="status_window">

						</div>
						
					</div>
				</div>		
			</div>
		`


		//if we are editing we use the preset 
		if(editing_service){
			document.getElementById("service_name").value = editing_service.service_name 
			document.getElementById("github_url").value = editing_service.github_url 
			document.getElementById("inward_port").value = editing_service.inward_port 
			document.getElementById("start_command").value = editing_service.run_command
			document.getElementById("env_variables").value = Object.entries(editing_service.env).map(([key, value]) => `${key}=${value}`).join("\n")
			
						
		}
	}else{
		//if we are not opening (i.e. closing) we want to make the popup handle contain nothing again
		popup.outerHTML = `<div class="hidden" id="popup"></div>`		
	}

	
}


//this works similar but for a different popup
let service_popup_open = false;

//we provide the service name so we can see what service were looking at
function toggle_service_dashboard(service_name){

	let service = service_objects.get(service_name)


	service_popup_open = !service_popup_open;

	let popup = document.getElementById("popup")


	if(service_popup_open){


		//this is a popup that opens once we want to create a new service
		//we need to use stopPropagation so that the child element does not trigger the toggle function
		popup.outerHTML = `
			<div id="popup" class="absolute z-15 w-[100vw] h-[100vh] p-10 flex justify-center items-center" 
			style="background-color : #000000AE"
			onclick="toggle_service_dashboard(this)">
				
				<div onclick="event.stopPropagation()" 
				class="z-20 w-3/5  bg-white flex flex-col  max-w-800px items-start   gap-4 rounded p-8 max-h-[90%] overflow-scroll">
					<div class="title font-bold text-xl">${service.service_name}</div>
					<div class="status font-bold text-lg">Status : ${service.running ? "Running" : "Stopped"}</div>
					<div class="port font-bold text-lg">Inward Port : ${service.inward_port}</div>
			<div class="port font-bold text-lg">Environment Variables : ${Object.entries(service.env).map(([key, value]) => `<div>${key} : ${value}</div>`)}</div>
					<div class="port font-bold text-lg">Start Command : ${service.run_command}</div>
				
					<div class="logs-text text-lg">Logs</div>


					<textarea id="${service.service_name}-logs" 
						value="${service.logs}"
							name="start_command" rows="8" resize="false"
							class="outline-none bg-gray-300 rounded-lg px-4 py-2 w-full min-h-[400px]"></textarea>	

					
					

					${
						service.running ? `
					<button class="p-2 rounded-md border-2 border-red-5000 hover:bg-red-500 hover:border-white hover:text-white transition duration-150 w-full font-bold"
					onclick="stop_cached_service('${service_name}')">
						Stop Service
					</button>	` : `<button class="p-2 rounded-md border-2 border-black hover:bg-black hover:border-white hover:text-white transition duration-150 w-full font-bold"
					onclick="run_cached_service('${service_name}')">
						Run Service
					</button>`
					}

					<button class="p-2 rounded-md border-2 border-red-500 hover:bg-red-500 hover:border-white hover:text-white transition duration-150 w-full font-bold"
					onclick="delete_cached_service('${service_name}')">
						Delete
					</button>

					<button class="p-2 rounded-md border-2 border-yellow-500 hover:bg-yellow-500 hover:border-white hover:text-white transition duration-150 w-full font-bold"
					onclick="edit_cached_service('${service_name}')">
						Edit
					</button>



				</div>		
			</div>
		`
	}else{
		popup.outerHTML = `<div class="hidden" id="popup"></div>`		
	}

	
}

//this runs a service that is already registered
async function run_cached_service(service_name){
	let service = service_objects.get(service_name);
	await services.run_service(service);
	toggle_service_dashboard(service_name)
}

//this stops a service that is already registered
async function stop_cached_service(service_name){
	let service = service_objects.get(service_name);
	await services.stop_service(service);
	toggle_service_dashboard(service_name)
}



//this is where we store the service objects so we can reference them in toggle and when showing the service dashboard popup
let service_objects = new Map();


//we poll the status over time so we are updated (event based is not needed here)
setInterval(async () => {


	//first we get all services registered in the backend
	let all_services = await services.get_services()

	console.log(all_services)
	
	//the deleted ones are those that do not come with the all_services call	
	let deleted = [...service_objects.keys()].filter(name => !all_services.map(service => service.service_name).includes(name))

	//we then also remove the deleted ones from the DOM
	deleted.forEach(name => {
		//we delete from the service_objects set
		service_objects.delete(name)
		//and from the DOM
		document.getElementById(name).outerHTML = ""
	})


	//a reference to the DOM
	let service_list = document.getElementById("service-list")	


	//for all services left we check if they are updated
	all_services.forEach((service, index) => {

		//we precompute this element because we need it at multiple points later (two cases)
		//it just shows information (running status etc.) of a given service and sets a handle so we can access it later
		let element = `
			<div id="${service.service_name}" class="hello w-full h-min rounded drop-shadow-xl bg-white flex items-center flex-col p-4  wrap-anywhere ">				
				<div class="title text-xl font-bold">${service.service_name}</div>
				<div class="content  text-lg flex flex-col items-center pb-4">
					<div class="flex">Status : ${service.running ? `<div class="font-bold text-green-400 ml-2">running</div>` : `<div class="font-bold text-red-400 ml-2">stopped</div>`}
					</div>
				<div class="flex">Listening on Port: <div class="font-bold ml-w">${service.inward_port}</div></div>					
					
				<div class="font-bold text-green-400 ml-2 w-full  ">https://connector.neptunapp.org/${host_id}/${service.service_name}</div>
					
				</div>

				<div class="flex p-4 w-full justify-center">
							<button onclick="toggle_service_dashboard('${service.service_name}')" 
							class="w-[60%] bg-black text-white border-white border-2 hover:border-black hover:bg-white hover:text-black transition duration-150 
							p-1 font-bold text-lg rounded-md">
				
								Service Dashboard
							</button>
		
						</div>	

					</div>	


		`


		//we update the logs of the current thing were vewing (if it is currently opened in the dashboard, i.e. when we are looking at service-x this puts the logs in practically real-time into the dashboard logs-window)
		let logs = document.getElementById(service.service_name + "-logs")
		if(logs){
			//updates the logs
			logs.innerHTML = service.logs;		
		
		}

		//for all objects we already have cached we check if they have changed and if they have modify them, if not we return and move on
		if(service_objects.has(service.service_name)){
			//if nothing has changed we just return and move on with the next object
			if(JSON.stringify(service_objects.get(service.service_name)) == JSON.stringify(service)){
				return	
			}else{
				//if something has changed we put the element into the dashboard and move on
				let service_object = document.getElementById(service.service_name);
				service_object.outerHTML = element
				return
			}
		}

		//for all new (this means yet uncached) objects we create a new card and append it
		let service_object = document.createElement("div");
		//we need to first append because we cannot set outerHTML if we dont
		service_list.appendChild(service_object);
		service_object.outerHTML = element		
	})


	//then we copy the services we got from the update to service_objects	
	all_services.forEach((service) => service_objects.set(service.service_name, service))

	//we repeat this every second so everything stays in sink and is nice and tidy
}, 1_000)
