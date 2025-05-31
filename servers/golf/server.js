const Blowfish = require('blowfish-node');

const bodyParser = require('body-parser');
const express = require('express');

const { createHash } = require('crypto');
const { join } = require('path');
const { writeFileSync, readFileSync } = require('fs');

const BASE_GAME_PORT = 18443;
const BASE_GAME_URL = `http://cmnap.scej-online.jp:${BASE_GAME_PORT}/ebg6ps3`;

// On Vita, all the versions are 1
// On PS3, they're all 1030
const DAILY_VERSION = 1030;
const RANK_VERSION = 1030;
const LOBBY_VERSION = 1030;

const SS_OK = 0;
const SS_ERR = 1;

const PRIMARY_KEY = 'D9-Zs.2zsB@6';
const SECONDARY_KEY = 'l.2F5@B@w@E@26';

function golfDumpBuffer(buffer, name)
{
    writeFileSync(join(__dirname,`work/${name}.bin`), buffer);
}

function golfDoDecrypt(buffer, key = PRIMARY_KEY)
{
    const bf = new Blowfish(key, Blowfish.MODE.ECB, Blowfish.PADDING.PKCS5);
    return Buffer.from(bf.decode(buffer, Blowfish.TYPE.UINT8_ARRAY));
}

function golfDoEncrypt(buffer, key = PRIMARY_KEY)
{
    const bf = new Blowfish(key, Blowfish.MODE.ECB, Blowfish.PADDING.PKCS5);
    return Buffer.from(bf.encode(buffer, Blowfish.TYPE.UINT8_ARRAY));
}

// Generates the server info response for /ss.infor
// Version = 2 for PS3, 3 for Vita, no idea if it's platform or version, doesn't really matter
function golfCreateServerInfo(version, error = undefined)
{
    function tag(key, value = '')
    {
        return `<${key}>${value}</${key}>`;
    }

    function gameapi(name, route)
    {
        const key = `gameapi_${name}`;
        return `<${key}>${BASE_GAME_URL}/${route ?? name}</${key}>`;
    }

    let xml = '';

    if (error)
    {
        xml += tag('ss', SS_ERR);
        xml += tag('msg' + version, `<lang${version}>${error}</lang${version}>`);
        
        return Buffer.from(xml, 'ascii').toString('base64');
    }

    xml += tag('daily_ver', DAILY_VERSION);
    xml += tag('rank_ver', RANK_VERSION);
    xml += tag('lobby_ver', LOBBY_VERSION);
    
    xml += tag('ss', SS_OK);
    // If we don't have an error, 
    // we still need to include an empty tag to prevent 
    // the game from thinking there's an unknown error.
    xml += tag('msg' + version); 

    // Where are these even used?
    xml += tag('scerturl' + version, `${BASE_GAME_URL}/scert`);
    xml += tag('scertport' + version, BASE_GAME_PORT);

    xml += `<gameurl${version}>`;
        xml += gameapi('login');
        xml += gameapi('geteula', 'eula');
        xml += gameapi('getinfo', 'info');
        xml += gameapi('getboardlist', 'boardlist');
        xml += gameapi('getscorelist', 'scorelist');
        xml += gameapi('regscore');
        xml += gameapi('uploaddata');
        xml += gameapi('getservertime', 'servertime');
        xml += gameapi('getregulationdata', 'regulationdata');
        xml += gameapi('getfinishboardlist', 'finishboardlist');
        xml += gameapi('getsignboardlist', 'signboardlist');
        xml += gameapi('getsignboarddetail', 'signboardetail');
    xml += `</gameurl${version}>`;

    // I have no idea what this is actually supposed to be used for,
    // so just return the base game URL.
    xml += tag('realurl' + version, `${BASE_GAME_URL}`);

    xml += tag('interval' + version, 120);
    xml += tag('registscore_limithour' + version, 1);
    xml += tag('finishboardlist_limitnum' + version, 1);

    return Buffer.from(xml, 'ascii').toString('base64');
}

function golfAddIntegerBlock(buffer, id, value)
{
    const block = Buffer.alloc(0x8);
    block.writeUint16LE(id, 0);
    block.writeUint16LE(block.length / 4, 2);
    block.writeUint32LE(value, 4);

    if (buffer) buffer = Buffer.concat([ buffer, block ]);
    else buffer = block;

    return buffer;
}

function golfAddBlock(buffer, id, data = undefined)
{
    let block;
    if (Buffer.isBuffer(data))
    {
        block = Buffer.alloc(0x4 + (Math.ceil(data.length / 4) * 4));
        // extra bytes use pkcs7 padding
        data.copy(block, 4, 0, data.length);
    }
    else block = Buffer.alloc(0x4);

    block.writeUint16LE(id, 0);
    block.writeUint16LE(block.length / 4, 2);

    if (buffer) buffer = Buffer.concat([ buffer, block ]);
    else buffer = block;

    return buffer;
}

function golfStartMessage(status)
{
    let buffer = golfAddBlock(null, 0x8000);
    return golfAddIntegerBlock(buffer, 0x0, status);
}

function golfEndMessage(buffer)
{
    return golfDoEncrypt(golfAddBlock(buffer, 0x8010));
}

function golfGetServerTime()
{
    return (process.hrtime.bigint() / 1000n) + (62_135_596_800n * 1000n * 1000n);
}

console.log(golfDoDecrypt(readFileSync('C:/Users/Aidan/Desktop/enc.bin'), SECONDARY_KEY).toString('utf-8'))

const http = express();

// I don't believe in Express headers.
http.set('etag', false);
http.set('x-powered-by', false);

http.use(bodyParser.raw({
    inflate: true,
    type: () => true
}));

http.use((req, res, next) => {
    console.log(`[${req.method}] ${req.originalUrl}`);
    next();
});

const golfApi = express.Router();

// Decode and decrypt any input data
golfApi.use((req, res, next) => {
    if (req.method == 'GET') return next();
    const buf = req.body;

    // Check for the 'p=' prefix
    if (buf.length < 2 || buf[0] != 0x70 || buf[1] != 0x3d) {
        return res.status(400).end();
    }

    let output = 0;
    let input = 2;

    // Standard enough URI decoding?
    // %XX for non-ascii bytes
    while (input < buf.length) {

        const char = buf[input++];
        if (char == 0x25) {
            const hex = buf.subarray(input, input += 2).toString('ascii');
            buf[output++] = parseInt(hex, 16);
        }
        else buf[output++] = char;
    }

    req.body = golfDoDecrypt(buf.subarray(0, output));
    golfDumpBuffer(req.body, req.url);

    next();
});

golfApi.get('/ss.info', (req, res) => res.send(golfCreateServerInfo(2)));
golfApi.post('/eula', (req, res) => {
    // Sends some data in the body, probably just for regional data or something?
    // Didn't really look into it, just trying to speedrun the login process.

    const eula = 'corporate scam\0';
    const md5 = createHash('md5').update(eula).digest();

    // 0x1 means that the user has to re-read/accept the EULA
    // 0x2/3 means that the user has already accepted the EULA
    let buffer = golfStartMessage(0x1);

    // No idea what this is just set it to 0 for now?
    buffer = golfAddIntegerBlock(buffer, 0x1050, 0);

    buffer = golfAddBlock(buffer, 0x1000);
    buffer = golfAddBlock(buffer, 0x1010, md5);
    buffer = golfAddIntegerBlock(buffer, 0x1030, eula.length);
    buffer = golfAddBlock(buffer, 0x1020, Buffer.from(eula, 'utf-8'));
    
    buffer = golfEndMessage(buffer);

    res.status(200).send(buffer);
});

golfApi.post('/login', (req, res) => {
    // Sends some message header, some extended metadata, then an X-I-5 / NP ticket.
    const payload = golfDoEncrypt(
        Buffer.from("_DUMMY\0", 'utf-8'),
        SECONDARY_KEY
    );

    let buffer = golfStartMessage(0x1);
    buffer = golfAddBlock(buffer, 0x60, payload); // ???
    buffer = golfAddIntegerBlock(buffer, 0x2020, 0); // ???
    buffer = golfAddBlock(buffer, 0x2030, Buffer.from('')); // ???
    buffer = golfAddIntegerBlock(buffer, 0x2021, 0); // ???
    buffer = golfEndMessage(buffer);

    res.status(200).send(buffer);
});

golfApi.post('/servertime', (req, res) => {
    const payload = golfDoEncrypt(
        Buffer.from("_DUMMY\0", 'utf-8'),
        SECONDARY_KEY
    );

    let buffer = golfStartMessage(1);
    buffer = golfAddBlock(buffer, 0x60, payload);
    buffer = golfAddBlock(buffer, 0x5000);
    buffer = golfEndMessage(buffer);


    res.status(200).send(buffer);
});

// header format is a message
// 0x8000 BODY START
// 0x0010 TITLE ID
// 0x0050 ??? (int)
// 0x0020 PSID (string)
// 0x0060 Session Key (encrypted string)
// 0x8010 BODY END

golfApi.post('/info', (req, res) => {
    const payload = golfDoEncrypt(
        Buffer.from("_DUMMY\0", 'utf-8'),
        SECONDARY_KEY
    );

    // 0x23e7ac

    let buffer = golfStartMessage(1);
    buffer = golfAddBlock(buffer, 0x60, payload); // session key?
    buffer = golfAddIntegerBlock(buffer, 0x3000, 0x0); // number of info messages
    // buffer = golfAddBlock(buffer, 0x3010); // info section start
    // buffer = golfAddBlock(buffer, 0x3030, Buffer.from('Server Notification\0', 'ascii')); // info header
    // buffer = golfAddBlock(buffer, 0x3040, Buffer.from('We\'ll golf, okay?\0', 'ascii')); // info body
    // buffer = golfAddBlock(buffer, 0x3020); // info section end
    buffer = golfEndMessage(buffer);

    res.status(200).send(buffer);
});

// sign into boardlist?
golfApi.post('/signboardlist', (req, res) => {
    const payload = golfDoEncrypt(
        Buffer.from("_DUMMY\0", 'utf-8'),
        SECONDARY_KEY
    );

    let buffer = golfStartMessage(1);
    buffer = golfAddBlock(buffer, 0x60, payload); // session key?
    buffer = golfAddBlock(buffer, 0x4270);
    buffer = golfAddBlock(buffer, 0x42a0);
    buffer = golfEndMessage(buffer);

    res.status(200).send(buffer);
});

golfApi.post('/boardlist', (req, res) => {
    const payload = golfDoEncrypt(
        Buffer.from("_DUMMY\0", 'utf-8'),
        SECONDARY_KEY
    );

    let buffer = golfStartMessage(1);
    buffer = golfAddBlock(buffer, 0x60, payload); // session key?
    buffer = golfAddBlock(buffer, 0x4200);
    buffer = golfAddIntegerBlock(buffer, 0x4210, 0);
    buffer = golfAddIntegerBlock(buffer, 0x4220, 0); // some count, or is it a status code?
    buffer = golfEndMessage(buffer);

    res.status(200).send(buffer);

});

http.use('/ebg6ps3', golfApi);
http.use((req, res) => res.status(404).end());
http.listen(BASE_GAME_PORT, () => {
    console.log('[HTTP] Listening on port: ' + BASE_GAME_PORT);
});