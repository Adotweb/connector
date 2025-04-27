document.addEventListener("DOMContentLoaded", e => {

	toggle_service_creator_popup()
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
	
	let service_name = document.getElementById("service_name").value;
	let github_url = document.getElementById("github_url").value;

	//split into owner and repo 
	let [owner, repo] = github_url.split("/").filter(s => s!= "")

	let inward_port = document.getElementById("github_url").value;
	let start_command = document.getElementById("start_command").value;
	let env_command = document.getElementById("env_variables").value;

	let github_check = await fetch("https://github.com/" + github_url).then(res => {
		console.log(res.status)
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

	let {success : new_success, data : new_data} = await services.run_service({
		path, 
		name : service_name, 
		command : start_command,
		github_url,
		inward_port,
		outward_id : Math.random() * 10_000_000,
		env : env_command
	})
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



							<button class="p-2 rounded-md border-2 border-black hover:bg-black hover:border-white hover:text-white transition duration-150 w-full font-bold"
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


//we poll the status over time so we are updated (event based is not needed here)
setInterval(async () => {


	let all_services = await services.get_services()

	let services = document.getElementById("")	

	all_services.forEach(service => {
		let service = document.createElement("")
	})

	console.log(all_services)

}, 5_000)
