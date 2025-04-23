const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
  // we can also expose variables, not just functions
})

contextBridge.exposeInMainWorld("services", {
	create : (msg) => ipcRenderer.send("create", msg),


	get_services : () => ipcRenderer.invoke("get_services"),

	on_msg : (callback) => ipcRenderer.on("response", (_, data) => callback(data))	
})
