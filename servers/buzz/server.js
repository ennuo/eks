const express = require('express');
const app = express();

const fs = require('fs');
const crypto = require('crypto');
const { createServer } = require('net');


const GAMESERVER_PORT = 10071;
let BIN_COUNTER = 0x0;

const RT_HEADER_SIZE = 0x3;

const RtMessageType = {
    ClientConnectTcp: 0x00,
    ClientDisconnect: 0x01,
    ClientAppBroadcast: 0x02,
    ClientAppSingle: 0x03,
    ClientAppList: 0x04,
    ClientEcho: 0x05,
    ServerConnectReject: 0x06,
    ServerConnectAcceptTcp: 0x07,
    ServerConnectNotify: 0x8,
    ServerDisconnectNotify: 0x9,
    ServerApp: 0x0a,
    ClientAppToServer: 0x0b,
    UdpApp: 0xc,
    ClientSetRecvFlag: 0x0d,
    ClientSetAggTime: 0x0e,
    ClientFlushAll: 0x0f,
    ClientFlushSingle: 0x10,
    ServerForcedDisconnect: 0x11,
    ClientCryptKeyPublic: 0x12,
    ServerCryptKeyPeer: 0x14,
    ClientConnectTcpAuxUdp: 0x15,
    ClientConnectAuxUdp: 0x16,
    ClientConnectReadyAuxUdp: 0x17,
    ServerInfoAuxUdp: 0x18,
    ServerConnectAcceptAuxUdp: 0x19,
    ServerConnectComplete: 0x1a,
    ClientCryptKeyPeer: 0x1b,
    ServerSystemMessage: 0x1c,
    ServerCheatQuery: 0x1d,
    ServerMemoryPoke: 0x1e,
    ServerEcho: 0x1f,
    ClientDisconnectWithReason: 0x20,
    ClientConnectReadyTcp: 0x21,
    ServerConnectRequire: 0x22,
    ClientConnectReadyAcquire: 0x23,
    ClientHello: 0x24,
    ServerHello: 0x25,
    ServerStartupInfoNotify: 0x26,
    ClientPeerQuery: 0x27,
    ServerPeerQueryNotify: 0x28,
    ClientPeerQueryList: 0x29,
    ServerPeerQueryListNotify: 0x2a,
    ClientWallClockQuery: 0x2b,
    ServerWallClockQueryNotify: 0x2c,
    ClientTimeBaseQuery: 0x2d,
    ServerTimeBaseQueryNotify: 0x2e,
    ClientTokenMessage: 0x2f,
    ServerTokenMessage: 0x30,
    ClientSystemMessage: 0x31,
    ClientAppBroadcastQoS: 0x32,
    ClientAppSingleQoS: 0x33,
    ClientAppListQoS: 0x34,
    ClientMaxMsgLen: 0x35,
    ServerMaxMsgLen: 0x36
};

function LookupMessageType(type)
{
    for (const key of Object.keys(RtMessageType))
    {
        if (RtMessageType[key] == type)
            return key;
    }
    
    return 'UNKNOWN (0x' + type.toString(16) + ')';
}

const gs = createServer();
const cert = fs.readFileSync('scert.cert');



gs.on('connection', conn => {
    console.log('Connection has been made!');

    conn.on('data', buf => {

        const id = buf[0];
        const len = buf.readUint16LE(1);
        const payload = buf.subarray(3);

        // rt version is like 118 i think

        console.log(`RECV: Type ${LookupMessageType(id)} w/ len = ${len}`);
        switch (id)
        {
            case RtMessageType.ClientConnectTcp:
            {

                let msg = Buffer.alloc(RT_HEADER_SIZE + 0x18);
                msg[0] = RtMessageType.ServerConnectAcceptTcp;
                msg.writeUint16LE(msg.length - RT_HEADER_SIZE, 1);

                msg.writeUint16LE(0x0000, RT_HEADER_SIZE + 0x00); // PlayerId
                msg.writeUint32LE(0x10ec, RT_HEADER_SIZE + 0x02); // ScertId
                msg.writeUint16LE(0x0001, RT_HEADER_SIZE + 0x06); // PlayerCount
                msg.write('127.0.0.1', RT_HEADER_SIZE + 0x08); // Ip

                conn.write(msg);

                msg = Buffer.alloc(RT_HEADER_SIZE + 0x2);
                msg[0] = RtMessageType.ServerConnectComplete;
                msg.writeUint16LE(msg.length - RT_HEADER_SIZE, 1);

                msg.writeUint16LE(0x0001, RT_HEADER_SIZE + 0x00); // ClientCountAtConnect

                conn.write(msg);

                break;
            }
            case RtMessageType.ClientHello:
            {
                // Send back empty hello message,
                // apparently not proper, but it's enough to get the
                // game to just accept it.
                
                console.log('SEND: Hello!');

                const msg = Buffer.alloc(RT_HEADER_SIZE + cert.length);
                msg[0] = RtMessageType.ServerHello;
                msg.writeUint16LE(cert.length, 1);
                cert.copy(msg, RT_HEADER_SIZE);
                conn.write(msg);

                break;
            }

            case RtMessageType.ClientDisconnectWithReason:
            {
                console.log(`Client disconnected with reason: 0x${payload[0].toString(16)}`);
                break;                
            }
        }

        fs.writeFileSync('buf' + (BIN_COUNTER++) + '.bin', buf);
    });
});

gs.listen(GAMESERVER_PORT, () => {
    console.log(`Buzz gameserver listening on port: ${GAMESERVER_PORT}`);
});


app.set('x-powered-by', false);
app.set('etag', false);

app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
});


app.use((req, res) => res.status(404).send(''));
app.listen(80);
