const { WebSocket } = require("ws");
const { ipcMain } = require("electron");
const { services } = require("../services/run_services");
const { uniqueNamesGenerator, adjectives, colors, animals} = require("unique-names-generator")


//we generate a random hostname that is memorable (something like fast_tiger)
const host_id = uniqueNamesGenerator({
	dictionaries : [adjectives, colors, animals],
	length : 2
});

//this registers the "get_host_id" function so we can use it in the frontend
ipcMain.handle("get_host_id", async () => {
	return host_id
})

function start_ws(){

	//we first connect a new websocket to the relay server (written and documented in connector_hub)
	let ws = new WebSocket("https://connector.neptunapp.org/");


	//as soon as we opened we send a host-login event to notify the relay that a new host is loggin in
	ws.onopen = () => {	
		ws.send(JSON.stringify({
			sender : "host",
			method : "login",
			body : {
				host_id,
			}
		}))
	}

	//whenever we get a message we process the method, 
	//currently only very simple rest requests work (i.e. HTML page requests with GET and in specific cases POST)
	ws.onmessage = proto => {
		let message = JSON.parse(proto.data)
	
		switch(message.method){
			case "rest-request" : handle_rest(ws, message, message.meta.request_id)		
				break;
		}	
	
	}

	//we send a keepalive signal to the relay every 3 seconds to keep the connection alive
	setInterval(() => {
		ws.send(JSON.stringify({
			sender : "host",
			method : "keepalive"
		}))	
	}, 3_000)

}


//this function is mostly copied from chatgpt annotataed with some lines for better adaptation in the project
async function fetchFromRequest(req, baseUrl = '') {
  // Reconstruct full URL

	//split the service name because the url will be something like /service_name/sub_path, so we can get the service_name
	let service_name = req.url.split("/")[1];

	//get the inward path of the service so we know where we have to fetch on localhost
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
  })


	let ret;
	// Check the content type, and return the output of the given method
	const contentType = response.headers.get('content-type');

	if (contentType.includes('application/json')) {
    		ret = await response.json();
	} else if (contentType.includes('text/plain')) {
    		ret = await response.text();
	} else if (contentType.includes('text/html')) {
    		ret = await response.text();
	} else if (contentType.includes('application/octet-stream')) {
    		ret = await response.blob();
	} else {
  		return response;
	}
	return ret

}


//intermediate function that handles 
async function handle_rest(socket, message, request_id){

	let body = message.body;
	//we compute the rest response
	let response = await fetchFromRequest(body);

	//then we send, the response in the right format
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
