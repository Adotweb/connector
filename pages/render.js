let dashboard


document.addEventListener("DOMContentLoaded", () => {
	dashboard = document.getElementById("dashboard")

	document.getElementById("button").onclick = () => {
		invoke()
	}
})


function invoke(){
	console.log("hello")

	let r = document.getElementById("repo").value;

	let [owner, repo] = r.split("/").filter(s => s!= "")



	services.create({
		owner, repo
	});
}






setInterval(async () => {

	console.log("hello")

	let all_services = await services.get_services()

	console.log(all_services)

}, 5_000)
