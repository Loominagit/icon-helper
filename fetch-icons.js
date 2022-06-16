/*
    fetch-icons.js

    The main idea of this script is to retrieve the required icon packs so the bot don't have to
    fetch HTTP requests everytime you use the slash commands. It's also useful to prevent rate limiting.

    If you somehow lose your icons folder, you can download them using this script.
*/

const fs = require('node:fs');
const axios = require('axios');
const stream = require('node:stream');
const path = require('node:path');
const dotenv = require('dotenv');

const colors = require('ansi-colors');
const cliProgress = require('cli-progress');

const { promisify } = require('node:util');
const streamFinished = promisify(stream.finished);

//////////////////////////////////////////////////////
// CONFIGURATION /////////////////////////////////////
//////////////////////////////////////////////////////

// If your download somehow got stuck for some reason, you can put your
// last downloaded icon name here and it will start from there.

// For example: your download stopped at 'Building', then you type 'Building' on the variable.
// Please note that the variable is case-sensitive.
const fluent_startFromThisIcon = 'SIM';

// The icon packs that you want to download
// Can be 'fluent', 'material', and 'all'
// You can download multiple icon packs by assigning it to array. Example: ['fluent', 'material']

// eslint-disable-next-line no-unused-vars
const downloadIcons = 'all';

//////////////////////////////////////////////////////
// INITIALIZE ////////////////////////////////////////
//////////////////////////////////////////////////////

// progress bar
const progress = new cliProgress.SingleBar({
    format: colors.white('    {bar}') + ' | {percentage}% | {value}/{total} icons downloaded.',
    hideCursor: true
}, cliProgress.Presets.shades_classic);

const download = async (url, outpath) => {
    const writer = fs.createWriteStream(outpath);
    return axios({
        method: 'get',
        url: url,
        responseType: 'stream'
    }).then(response => {
        response.data.pipe(writer);
        return streamFinished(writer);
    });
};

dotenv.config();
if (!process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
    console.error('Unable to find GITHUB_PERSONAL_ACCESS_TOKEN in your .env file.');
    console.error('This is required to download all the required icons because this will increase.');
    console.error('your requests / hour.');
    console.error('');
    console.error('If you don\'t know how to create Personal Access Token, visit this link:');
    console.error('https://docs.github.com//en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token');
    return -1;
}

process.title = 'IPDL';
const setHeader = (packName, github_link) => {
    console.clear();
    console.log(`
    //////////////////////////////////////////////////////
    // Icon pack downloader //////////////////////////////
    //////////////////////////////////////////////////////

    // Currently downloading: ${packName}
    // GitHub: ${github_link}

    // NOTE: This may took long time to finish! You can sit back, relax,
    // enjoy some coffee while waiting the download to finish.

    // DO NOT CLOSE THIS SCRIPT WHILE IT'S DOWNLOADING!
    `);
};

(async() => {

    setHeader('Fluent Icons', 'https://github.com/microsoft/fluentui-system-icons');

    console.log('    > Retrieving the Fluent Icons root tree...');
    const rootTree = (await axios('https://api.github.com/repos/microsoft/fluentui-system-icons/contents')).data;

    console.log('    > Looking for assets directory...');

    const dir = rootTree.find(value => value.path === 'assets');
    if (!dir) return;

    console.log('    > Retrieving icon lists...');

    // Since GitHub doesn't allow listing more than 1,000 files,
    // we need to use the git tree to retrieve ALL the icons name.

    let assetsTree = (await axios(dir.git_url)).data.tree;
    //console.log(assetsTree);

    // If 'lastDownloadedIconName' is present, start from there.
    if (fluent_startFromThisIcon) {
        if (typeof fluent_startFromThisIcon !== 'string') throw new Error('`lastDownloadedIconName` must be a string!');
        const index = assetsTree.findIndex(value => value.path === fluent_startFromThisIcon);
        if (index) {
            assetsTree = assetsTree.slice(index);
        }
    }

    // Start the progress bar
    console.log('    > Starting download...');
    progress.start(assetsTree.length, 0);

    // Download every icon from the array that we just fetched.
    for (const ic of assetsTree) {

        const name = ic.path;
        const blobs = (await axios({
            method: 'get',
            url: `https://api.github.com/repos/microsoft/fluentui-system-icons/contents/assets/${name}/SVG`,
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': 'token ' + process.env.GITHUB_PERSONAL_ACCESS_TOKEN
            }
        })).data;

        // get the variatns
        const variants = blobs.slice(blobs.length-2); // will retrieve both regular and filled variant with the highest resolution possible.

        for (const blob of variants) {
            const blobFile = blob.name.replace(/^ic_fluent_([a-z_]+)_([0-9]+)_/g, '');
            const downloadURL = blob.download_url;

            const blobPath = path.join(__dirname, 'icons', 'fluent-icons', name);
            if (!fs.existsSync(blobPath)) fs.mkdirSync(blobPath, { recursive: true });

            download(downloadURL, path.join(blobPath, blobFile))
                .catch(err => {
                    progress.stop();
                    console.log('    > IPDL only downloaded some of the icons due to this following error:');
                    console.log('    > ' + err);
                    console.log();
                    console.log('    > You can continue the download by editing `fluent_startFromThisIcon` variable in this script.');
                    console.log('    > Then, re-run this script.');
                    return -1;
                });
        }
        progress.increment();
    }
    progress.stop();
    console.log('    > Icon pack successfully downloaded without any error.');

    console.log('    > Done!');

})();
