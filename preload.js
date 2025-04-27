const { contextBridge, ipcRenderer, shell, clipboard } = require('electron')

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
  // we can also expose variables, not just functions
})

contextBridge.exposeInMainWorld("services", {
	download_repo : (msg) => ipcRenderer.invoke("download_repo", msg),
	run_service : (msg) => ipcRenderer.invoke("run_service", msg),
	run_new_service : (msg) => ipcRenderer.invoke("run_new_service", msg),
	stop_service : (msg) => ipcRenderer.invoke("stop_service", msg),
	delete_service : (msg) => ipcRenderer.invoke("delete_service", msg),
	edit_service : (msg) => ipcRenderer.invoke("edit_service", msg),

	get_services : () => ipcRenderer.invoke("get_services"),
	
})

contextBridge.exposeInMainWorld("host", {
	get_host_id : () => ipcRenderer.invoke("get_host_id"),
	
})
