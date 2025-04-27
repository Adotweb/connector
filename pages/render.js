document.addEventListener("DOMContentLoaded", e => {

	//toggle_service_creator_popup()
})


//this function is used to display the data from the backend not to create a new service 
function create_service_module({
	service_name,
	path,	
	running,
	env,
	github_url,		
	run_command,
	inward_port,	
	outward_id}){

	let service_card = document.createElement("div");

	div.outerHTML = `
		<div class="">
			
		</div>
	`

}


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

	let button = document.getElementById("create-button")
	button.innerHTML = "..."
	button.onclick = () => {}

	let service_name = document.getElementById("service_name").value;
	let github_url = document.getElementById("github_url").value;

	//split into owner and repo 
	let [owner, repo] = github_url.split("/").filter(s => s!= "")

	let inward_port = document.getElementById("inward_port").value;
	let start_command = document.getElementById("start_command").value.replaceAll("\n+", "&&").replaceAll("\s+", " ");
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

	let {success : new_success, data : new_data} = await services.run_new_service({
		path, 
		name : service_name, 
		command : start_command,
		github_url,
		inward_port,
		outward_id : Math.random() * 10_000_000,
		env 
	})

	//after all of this we are done
	toggle_service_creator_popup()
}




let popup_open = false;
function toggle_service_creator_popup(){
	popup_open = !popup_open;

	let popup = document.getElementById("popup")
	if(popup_open){


		//this is a popup that opens once we want to create a new service
		//we need to use stopPropagation so that the child element does not trigger the toggle function
		popup.outerHTML = `
			<div id="popup" class="absolute z-15 w-[100vw] h-[100vh] p-10 flex justify-center items-center" 
			style="background-color : #000000AE"
			onclick="toggle_service_creator_popup(this)">
				
				<div onclick="event.stopPropagation()" 
				class="z-20 w-3/5  bg-white flex flex-col items-center items-center  gap-4 rounded p-8">
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
							onclick="create_service()">
								Create Service
							</button>	

						</div>

						<div class="status w-1/2 flex flex-col items-center px-4 gap-2" id="status_window">

						</div>
						
					</div>
				</div>		
			</div>
		`
	}else{
		popup.outerHTML = `<div class="hidden" id="popup"></div>`		
	}

	
}



let service_popup_open = false;
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
				class="z-20 w-3/5  bg-white flex flex-col items-start   gap-4 rounded p-8">
					<div class="title font-bold text-xl">${service.service_name}</div>
					<div class="status font-bold text-lg">Status : ${service.running ? "Running" : "Stopped"}</div>
					<div class="port font-bold text-lg">Inward Port : ${service.inward_port}</div>
			<div class="port font-bold text-lg">Environment Variables : ${Object.entries(service.env).map(([key, value]) => `<div>${key} : ${value}</div>`)}</div>
					<div class="port font-bold text-lg">Start Command : ${service.run_command}</div>
				
					<div class="logs-text text-lg">Logs</div>


					<textarea id="${service.service_name}-logs" 
						value="${service.logs}"
							name="start_command" rows="8" resize="false"
							class="outline-none bg-gray-300 rounded-lg px-4 py-2 w-full"></textarea>	

					
					

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

async function run_cached_service(service_name){
	let service = service_objects.get(service_name);
	await services.run_service(service);
	toggle_service_dashboard(service_name)
}

async function stop_cached_service(service_name){
	let service = service_objects.get(service_name);
	await services.stop_service(service);
	toggle_service_dashboard(service_name)
}

let service_objects = new Map();


//we poll the status over time so we are updated (event based is not needed here)
setInterval(async () => {

	let all_services = await services.get_services()

	let service_list = document.getElementById("service-list")	
	
	all_services.forEach((service, index) => {

		let element = `
			<div id="${service.service_name}" class="hello w-full h-min rounded drop-shadow-xl bg-white flex items-center flex-col p-4 ">				
				<div class="title text-xl font-bold">${service.service_name}</div>
				<div class="content  text-lg flex flex-col items-center p-4">
					<div class="flex">Status : ${service.running ? `<div class="font-bold text-green-400 ml-2">running</div>` : `<div class="font-bold text-red-400 ml-2">stopped</div>`}
					</div>
				<div class="flex">Listening on Port: <div class="font-bold ml-w">${service.inward_port}</div></div>					
					
				<div class="flex">URL : <div class="font-bold text-green-400 ml-2"><a href="https://neptunapp.connector/${service.outward_id}">https://neptunapp.connector/${service.outward_id}</a></div></div>
					
				</div>

				<div class="flex p-4">
							<button onclick="toggle_service_dashboard('${service.service_name}')" 
							class="bg-black text-white border-white border-2 hover:border-black hover:bg-white hover:text-black transition duration-150 
							p-1 font-bold text-lg rounded">
				
								Service Dashboard
							</button>
		
						</div>	

					</div>	


		`


		//we update the logs of the current thing were vewing (if it exists)

		let logs = document.getElementById(service.service_name + "-logs")

		if(logs){
			//updates the logs
			logs.innerHTML = service.logs;		
			

		}

		//for all objects we already have we check if they have changed and if they have modify them, if not we return and move on
		if(service_objects.has(service.service_name)){
			if(JSON.stringify(service_objects.get(service.service_name)) == JSON.stringify(service)){
				return	
			}else{
				let service_object = document.getElementById(service.service_name);
				service_object.outerHTML = element
				return

			}
		}

		//for all new objects we create a new card and append it
		let service_object = document.createElement("div");
		service_list.appendChild(service_object);

		service_object.outerHTML = element
				
	})
	
	all_services.forEach((service) => service_objects.set(service.service_name, service))
}, 1_000)
