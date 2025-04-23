
document.addEventListener("DOMContentLoaded", () => {
	document.getElementById("button").onclick = () => {
		invoke()
	}

	document.getElementById("hello").innerHTML = versions.node()


})


function invoke(){
	console.log("hello")
	services.create({
		"hello" : "siuu"
	});
}
