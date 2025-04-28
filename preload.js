const { contextBridge, ipcRenderer, shell, clipboard } = require('electron')

//exposes all the service functions registered to the frontend
contextBridge.exposeInMainWorld("services", {
	download_repo : (msg) => ipcRenderer.invoke("download_repo", msg),
	run_service : (msg) => ipcRenderer.invoke("run_service", msg),
	run_new_service : (msg) => ipcRenderer.invoke("run_new_service", msg),
	stop_service : (msg) => ipcRenderer.invoke("stop_service", msg),
	delete_service : (msg) => ipcRenderer.invoke("delete_service", msg),
	edit_service : (msg) => ipcRenderer.invoke("edit_service", msg),

	get_services : () => ipcRenderer.invoke("get_services"),
	
})


//exposes the "get_host_id" function to the frontend
contextBridge.exposeInMainWorld("host", {
	get_host_id : () => ipcRenderer.invoke("get_host_id"),
	
})
