const { WebSocket } = require("ws");
const { ipcMain } = require("electron");
const { services } = require("../services/run_services");

const host_id = require("crypto").randomUUID();

ipcMain.handle("get_host_id", async () => {
	return host_id
})

function start_ws(){

let ws = new WebSocket("http://localhost:3500");




ws.onopen = () => {	
	ws.send(JSON.stringify({
		sender : "host",
		method : "login",
		body : {
			host_id,
		}

	}))
}

ws.onmessage = proto => {
	let message = JSON.parse(proto.data)
	

	switch(message.method){
		case "rest-request" : handle_rest(ws, message, message.meta.request_id)		
			break;
	}	

}


setInterval(() => {
	ws.send(JSON.stringify({
		sender : "host",
		method : "keepalive"
	}))	
}, 3_000)

}

async function fetchFromRequest(req, baseUrl = '') {
  // Reconstruct full URL


	//selbst geschrieben
	let service_name = req.url.split("/")[1];

	console.log(service_name, services)


	let inward_port = services.get(service_name).inward_port;

  const url = `http://localhost:${inward_port}`;

  // Rebuild headers
  const headers = { ...req.headers };
  
  // Some headers like host/content-length should be stripped
  delete headers['host'];
  delete headers['content-length'];
  delete headers['connection'];

  // Determine body
  let body = undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (req.body) {
      if (typeof req.body === 'object') {
        body = JSON.stringify(req.body);
        headers['content-type'] = headers['content-type'] || 'application/json';
      } else {
        body = req.body; // raw string, Buffer, etc.
      }
    }
  }

  // Fire the fetch
  const response = await fetch(url, {
    method: req.method,
    headers,
    body,
  });

  return response;
}

function handle_rest(socket, message, request_id){

	let body = message.body;


	let response = fetchFromRequest(body);

	socket.send(JSON.stringify({
		sender : "host",
		method : "rest-response",
		meta : {
			request_id
		},
		body : response
	}))

}


module.exports = {
	start_ws
}
