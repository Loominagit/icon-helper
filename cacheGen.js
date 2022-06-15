const fs = require('node:fs');
const fetch = require('node-fetch');

if (!fs.existsSync('./.cache')) fs.mkdirSync('./.cache/');

// eslint-disable-next-line no-unused-vars
const downloadFile = async (url, path) => {
	const result = await fetch(url);
	const fileStream = fs.createWriteStream(path);
	await new Promise((resolve, reject) => {
		result.body.pipe(fileStream);
		result.body.on('error', reject);
		fileStream.on('finish', resolve);
	});
};

module.exports = {
    async generateFluentTreeCache () {
        // We need to limit the function to run once per 1 hour to prevent rate limiting.
        if (fs.existsSync('./.cache/lfr')) {
            const time = fs.readFileSync('./.cache/lfr');
            const diff = Math.floor((Date.now() - Number(time)) / 1000);
            if (diff < 3600) {
                console.log(`The fluent cache has been generated ${diff} seconds ago, no need to generate new cache!`);
                return 1;
            }
        } else {
            console.log('Generating new and updated cache...');
        }

        console.log('Retrieving the Fluent Icons root tree...');
        const rootTree = await fetch('https://api.github.com/repos/microsoft/fluentui-system-icons/contents');
        const rootTreeJSON = await rootTree.json();
    
        console.log('Looking for assets directory...');
        for (const e of rootTreeJSON) {
            if (e.path === 'assets') {
                console.log('Downloading assets directory tree...');

                // Since GitHub doesn't allow listing more than 1,000 files,
                // we need to use the git tree to retrieve ALL the icons name.

                const assetsTree = await fetch(e.git_url);
                //console.log(assetsTree);
                const assetsTreeJSON = (await assetsTree.json()).tree;

                // We only need the names because we are using the GitHub listing later on.
                const iconNames = [];
                for (const ic of assetsTreeJSON) {
                    iconNames.push(ic.path);
                }

                fs.writeFileSync('./.cache/fluent.json', JSON.stringify(iconNames));
                fs.writeFileSync('./.cache/lfr', Date.now().toString());

                console.log('Done!');
                return 0;
            }
        }
        console.log('Directory not found. Please contact the developer.');
    }
};