const axios = require('axios');
const AdmZip = require('adm-zip');
const fs = require('fs');


async function downloadRepo(owner, repo, branch = 'master', outputDir) {
  	const url = `https://github.com/${owner}/${repo}/archive/refs/heads/${branch}.zip`;
  	const zipPath = outputDir + "/current_download.zip"

  	// Download ZIP
  	const response = await axios({
    		url,
    		method: 'GET',
    		responseType: 'arraybuffer',
  	});

  	fs.writeFileSync(zipPath, response.data);

  	// Extract ZIP
  	const zip = new AdmZip(zipPath);
  	zip.extractAllTo(outputDir, true);

  	// Clean up ZIP file
  	fs.unlinkSync(zipPath);


	return true
}


module.exports = {
	downloadRepo
}
