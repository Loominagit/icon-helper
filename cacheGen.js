/*
    cacheGen.js

    The main idea of this script is to cache the list of icons so you don't have to request
    to the git tree everytime you start up the bot. It's also useful to prevent rate limiting.
*/

const fs = require('node:fs');
const fetch = require('node-fetch');

const RATE_LIMIT = 3600;

if (!fs.existsSync('./.cache')) fs.mkdirSync('./.cache/');

module.exports = {
    async generateFluentTreeCache () {
        // We need to limit the function to run once per 1 hour to prevent rate limiting.
        if (fs.existsSync('./.cache/lfr')) {
            const time = fs.readFileSync('./.cache/lfr');
            const diff = Math.floor((Date.now() - Number(time)) / 1000);
            if (diff < RATE_LIMIT) {
                console.log(`The FluentIcons cache has been generated ${diff} seconds ago, no need to generate new cache.`);
                return 1;
            }
        } else {
            console.log('Building new FluentIcons cache...');
        }

        console.log('Retrieving the Fluent Icons root tree...');
        const rootTree = await fetch('https://api.github.com/repos/microsoft/fluentui-system-icons/contents');
        const rootTreeJSON = await rootTree.json();
    
        console.log('Looking for assets directory...');

        // The reason why I am using for loop to look through
        const dir = rootTreeJSON.find(value => value.path === 'assets');
        if (dir) {
            console.log('Downloading assets directory tree...');

            // Since GitHub doesn't allow listing more than 1,000 files,
            // we need to use the git tree to retrieve ALL the icons name.

            const assetsTree = await fetch(dir.git_url);
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
        console.log('Directory not found. Please contact the developer.');
    }
};