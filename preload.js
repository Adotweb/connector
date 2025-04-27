const { contextBridge, ipcRenderer } = require('electron')

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
	get_services : () => ipcRenderer.invoke("get_services"),

	
})
