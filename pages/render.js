let dashboard


document.addEventListener("DOMContentLoaded", () => {
	dashboard = document.getElementById("dashboard")

	document.getElementById("button").onclick = () => {
		invoke()
	}
})


async function invoke(){
	console.log("hello")

	let r = document.getElementById("repo").value;

	let [owner, repo] = r.split("/").filter(s => s!= "")

	let value = await services.create_service({
		owner, repo
	})


	console.log(value)
}






setInterval(async () => {


	let all_services = await services.get_services()

	console.log(all_services)

}, 5_000)
