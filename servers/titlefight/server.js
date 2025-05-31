const express = require('express');
const app = express();
const fs = require('fs');
const crypto = require('crypto');

const { createSocket } = require('dgram');
const { createServer } = require('net');

const MATCHMAKING_PORT = 10023;

function GetExpressServerInstance()
{
    const app = express();
    app.set('x-powered-by', false);
    app.set('etag', false);

    app.use((req, res, next) => {
        console.log(`[${req.method}] ${req.originalUrl}`);
        next();
    });

    return app;
}

function StartExpressServer(app, port)
{
    app.use((req, res) => res.status(404).send(''));
    app.listen(port);
}


const ipmapper = GetExpressServerInstance();
ipmapper.all('/ipmapping-rest/otgc/IPMapping/battleroyale/location', (req, res) => {
    res.status(200).end();
});

// error_code sceNpLookupTitleSmallStorageAsync(s32 transId, vm::ptr<void> data, u32 maxSize, vm::ptr<u32> contentLength, s32 prio, vm::ptr<void> option)
// data = param_1 + 0x2d0
// maxSize = 0x1358
// contentLength = param_1 + 0x1628

StartExpressServer(ipmapper, 10012);


// const matchmaker = createSocket('udp4');
// matchmaker.on('message', (msg, info) => {
//     console.log(msg);
// });

// matchmaker.bind(MATCHMAKING_PORT);


const matchmaker = createServer();
matchmaker.on('connection', conn => {
    console.log('Connection has been made!');
    conn.on('data', buf => {
        console.log(buf);
    });
});

// battleroyale-final.ps3.online.scea.com
// matchmaking is udp over 

matchmaker.listen(MATCHMAKING_PORT, () => {
    console.log(`Matchmaker is listenong on 0.0.0.0:${MATCHMAKING_PORT}`);
});

