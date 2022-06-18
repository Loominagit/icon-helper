/*
    fetch-icons.js
    by loomintrx

    This script is used to download the icon packs.

    The main idea of this script is to retrieve the required icon packs so the bot don't have to
    fetch HTTP requests everytime you use the slash commands. It's also useful to prevent rate limiting.

    If you somehow lose your icons folder, you can re-download them using this script.
*/

const fs = require('node:fs');
const axios = require('axios');
const stream = require('node:stream');
const path = require('node:path');
const dotenv = require('dotenv');

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
const fluent_startFromThisIcon = '';

// For this variable, use the following fomat: /([a-z]+)\/([a-z0-9_]+)/
// Example: 'action/android', 'action/3d_rotation'
const material_startFromThisIcon = '';

// The icon packs that you want to download
// Can be either 'fluent', 'material', and 'all'
// You can download multiple icon packs by assigning it to array. Example: ['fluent', 'material']

const downloadIcons = 'material';

//////////////////////////////////////////////////////
// INITIALIZE ////////////////////////////////////////
//////////////////////////////////////////////////////

// progress bar
const progress = new cliProgress.SingleBar({
    format: '    > Downloading {icon}... | Progress: {percentage}%',
    hideCursor: true
}, cliProgress.Presets.shades_classic);

const download = async (url, outpath) => {
    return axios({
        method: 'get',
        url: url,
        responseType: 'stream'
    }).then(response => {
        const writer = fs.createWriteStream(outpath);
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

process.title = 'IPDL by loominatrx';
const setHeader = (packName, github_link) => {
    process.stdout.write('\033c');
    console.log(`
    //////////////////////////////////////////////////////
    // Icon pack downloader (IPDL) ///////////////////////
    //////////////////////////////////////////////////////

    // Currently downloading: ${packName}
    // GitHub: ${github_link}

    // NOTE: This may took long time to finish! You can sit back, relax,
    // enjoy some coffee while waiting the download to finish.

    // DO NOT CLOSE THIS SCRIPT WHILE IT'S DOWNLOADING!
    `);
};

const githubHeader = {
    'Accept': 'application/vnd.github.v3+json',
    'Authorization': 'token ' + process.env.GITHUB_PERSONAL_ACCESS_TOKEN
};

const stopdl = (line, variable, value, pack_name) => {
    progress.stop();
    console.log('    > IPDL only downloaded some of the icons due to the script detected some error');
    console.log('      while downloading.');
    console.log();
    console.log(`    > You can continue the download by editing this script file and replace line ${line} with:`);
    console.log(`    > const ${variable} = '${value}';`);
    console.log();
    console.log('    > If you want to download this specific icon pack, replace line 44 with:');
    console.log(`    > const downloadIcons = '${pack_name}';`);
    console.log();
    console.log('    > Then, re-run this script.');
    console.log();
    process.exit();
};

const packs = {
    fluent: async () => {

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
    
        // If 'fluent_startFromThisIcon' is not empty, start from there.
        if (fluent_startFromThisIcon !== '') {
            if (typeof fluent_startFromThisIcon !== 'string') throw new Error('`lastDownloadedIconName` must be a string!');
            const index = assetsTree.findIndex(value => value.path === fluent_startFromThisIcon);
            if (index >= 0) {
                assetsTree = assetsTree.slice(index);
            } else throw new Error('Icon not found');
            console.log('    > Continuing download...');
        } else {
            console.log('    > Starting download...');
        }
    
        // Start the progress bar
        progress.start(assetsTree.length, 0, {icon: assetsTree[0].path});
    
        // Download every icon from the array that we just fetched.
        for (const ic of assetsTree) {
    
            const name = ic.path;
            const blobs = (await axios({
                method: 'get',
                url: `https://api.github.com/repos/microsoft/fluentui-system-icons/contents/assets/${name}/SVG`,
                headers: githubHeader
            })).data;
    
            // update current downloading icon
            progress.increment(0, {icon: name});
    
            // get the variatns
            const variants = blobs.slice(blobs.length-2); // will retrieve both regular and filled variant with the highest resolution possible.
    
            for (const blob of variants) {
                
                const blobFile = blob.name.replace(/^ic_fluent_([a-z_0-9]+)_([0-9]+)_/g, '');
                const downloadURL = blob.download_url;
    
                const blobPath = path.join(__dirname, 'icons', 'fluent-icons', name);
                if (!fs.existsSync(blobPath)) fs.mkdirSync(blobPath, { recursive: true });
    
                const outPath = path.join(blobPath, blobFile);
                await download(downloadURL, outPath)
                    .then(() => {
                        // This will change the SVG color to white.
                        const svg = fs.readFileSync(outPath, {encoding: 'utf-8'})
                            .replace(/#212121/g, '#F1F1F1');
                        fs.writeFileSync(outPath, svg);
                    })
                    .catch(err => {
                        //const fluent_startFromThisIcon
                        fs.appendFileSync('error.log', `${new Date().toLocaleString()}: ${err}\n`);
                        stopdl(33, 'fluent_startFromThisIcon', name, 'fluent');
                    });
            }
            progress.increment();
        }
        progress.stop();
        console.log('    > Icon pack successfully downloaded without any error.');
    
    },
    material: async () => {

        setHeader('Material Icons', 'https://github.com/google/material-design-icons');
    
        console.log('    > Retrieving the Material Icons src tree...');
        let srcTree = (await axios('https://api.github.com/repos/google/material-design-icons/contents/src')).data;

        // TIL: some icons don't have all these variants, gotta use different approach...
        //const variants = ['materialicons', 'materialiconsoutlined', 'materialiconsround', 'materialiconssharp', 'materialiconstwotone'];

        // continue download
        let continueDL;
        if (material_startFromThisIcon !== '') {

            continueDL = material_startFromThisIcon.match(/(?<category>[a-z]+)\/(?<icon_name>[a-z0-9_]+)/).groups;
            if (!continueDL) throw new Error('\'material_startFromThisIcon\' doesn\'t follow the correct format!');

            const categoryIndex = srcTree.findIndex(e => e.name === continueDL.category);
            if (categoryIndex >= 0) 
                srcTree = srcTree.slice(categoryIndex);
            else
                throw new Error('Category not found');

            console.log('    > Continuing download...');
        } else {
            console.log('    > Starting download...');
        }

        // Loop through the dir
        for (const category of srcTree) {
            const categoryDir = (await axios({
                method: 'get',
                url: category.url,
                headers: githubHeader
            })).data;
            let icons = categoryDir.map(e => e.name);

            if (continueDL && category.name === continueDL.category) {
                const iconIndex = icons.findIndex(e => e === continueDL.icon_name);
                if (iconIndex >= 0)
                    icons = icons.slice(iconIndex);
                else
                    throw new Error('Icon not found');
            }

            console.log(`\n    > Downloading ${category.name} icons...`);
            progress.start(icons.length, 0, {icon: icons[0]});

            for (const icon of icons) {
                progress.increment(0, {icon: icon});
                let variants = (await axios({
                    method: 'get',
                    url: `https://api.github.com/repos/google/material-design-icons/contents/src/${category.name}/${icon}/`,
                    headers: githubHeader
                })).data;

                variants = variants.map(e => e.name);

                for (const variant of variants) {
                    // fetch the highest resolution avilable
                    const blobs = (await axios({
                        method: 'get',
                        url: `https://api.github.com/repos/google/material-design-icons/contents/src/${category.name}/${icon}/${variant}`,
                        headers: githubHeader
                    })).data;

                    const downloadURL = blobs[blobs.length-1].download_url;

                    const blobFile = variant === 'materialicons' ? 'regular.svg' : variant.replace('materialicons', '') + '.svg';
                    const blobPath = path.join(__dirname, 'icons', 'material-icons', category.name, icon);
                    if (!fs.existsSync(blobPath)) fs.mkdirSync(blobPath, {recursive: true});

                    const outPath = path.join(blobPath, blobFile);
                    await download(downloadURL, outPath)
                        .catch(err => {
                            fs.appendFileSync('error.log', `${new Date().toLocaleString()}: ${err}\n`);
                            stopdl(37, 'material_startFromThisIcon', icon, 'material');
                        });
                }
                progress.increment(1);
            }

            progress.stop();
            console.log(`    > Done!`);
        }
    
        progress.stop();
        console.log('    > Icon pack successfully downloaded without any error.');
    },
};

(async () => {
    if (typeof downloadIcons === 'string') {
        if (downloadIcons === 'all') {
            for (const method of packs.values()) {
                await method();
            }
        } else if (packs[downloadIcons]) {
            await packs[downloadIcons]();
        } else {
            console.log('Icon pack not available.');
            process.exit();
        }
    } else if (downloadIcons instanceof Array && downloadIcons.every(e => typeof e === 'string')) {
        for (const pack of downloadIcons) {
            await pack();
        }
    } else {
        throw new Error('\'downloadIcons\' should be either Array or string.');
    }
})();
