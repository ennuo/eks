const express = require('express');
const app = express();
const fs = require('fs');
const crypto = require('crypto');
const { join } = require('path');

app.set('x-powered-by', false);
app.set('etag', false);


function generateUpdateInfo()
{
    let xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    xml += '<updateinfo titlename="Lbp2-Hub">';

    function addEntity(name, path)
    {
        let xml = `<entity entityname="${name}">`;
        xml += `<updates updatecount="0">`;

        // xml += `<update requiresversion="1">`;

        // xml += `<delta provides="2">`;


        // xml += `<files filecount="1">`;

        // xml += `<file filetag="0">`;

        //     <file filetag="wad.bin">
        //     <href>http://sefirah.local:443/dcds/wad.bin</href>
        //     <md5sum>70240f8adb33cd1fd30fc6e605cf1166</md5sum>
        //     <resultSignature>79e6a63cfc5c2024024284f61ba7b24b3ac208353c52bf48ad90669b4a2adbeb</resultSignature>
        //     <diffSignature>79e6a63cfc5c2024024284f61ba7b24b3ac208353c52bf48ad90669b4a2adbeb</diffSignature>
        //     <size>16</size>
        //     <finalFileSize>16</finalFileSize>
        //     <fileSizeDifference>16</fileSizeDifference>
        // </file>

        // if theres diffs add resultSignature / diffSignature / fileSizeDifference / finalFileSize

        // xml += `<href>http://sefirah.local:443/dcds/${path}</href>`;
        // const data = fs.readFileSync(`static/dcds/${path}`);
        // const size = data.length;
        // const md5 = crypto.createHash('md5').update(data);
        // xml += `<md5sum>${md5.digest('hex')}</md5sum>`;
        // xml += `<size>${size}</size>`;
        // xml += `<finalFileSize>${size}</finalFileSize>`;

        // xml += `</file>`;


        // xml += `</files>`;

        // xml += `</delta>`;

        // xml += `</update>`;
        xml += `</updates>`;
        xml += `</entity>`;

        entities.push(xml);
    }

    const entities = [];

    addEntity('SwordsWAD', 'wad.bin');
    addEntity('TestEntity', 'wad.bin');
    addEntity('389288', 'gamedata/audio/nightmarebc/i_nightmarebc.fsb');
    addEntity('389290', 'gamedata/audio/nightmarebc/i_nightmarebc_prev.fsb');
    addEntity('389291', 'gamedata/audio/sound_objects/sound_object_nightmarebc.txt');

    xml += `<entities entitycount="${entities.length}">`;
    for (const entity of entities)
        xml += entity;

    xml += '</entities>';
    return xml + '</updateinfo>';
}




const updates = generateUpdateInfo();

app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.originalUrl}`);
    next();
});

app.get('/', (req, res) => res.status(200).send(''));
app.all('/updateinfo/Lbp2-Hub', (req, res) => {
    res.status(200).contentType('text/xml').send(updates);
});
app.use(express.static(join(__dirname, './static'), { etag: false }));
app.use((req, res) => res.status(404).send(''));

app.listen(443);