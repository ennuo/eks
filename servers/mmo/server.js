const { createServer } = require('net');

const makeLAMSKeyID = key => {
    let v0 = 0n, v1 = -0x37af6800n;

    const loop = (start, end) => {
        let v = 0n;
        for (let i = start; i > end; --i) {
            let c = 0x20n;
            if ((i - 1) < key.length)
                c = BigInt(key.charCodeAt((i - 1)));
            v = v * 0x1bn + c;
        }
        return v;
    }

    v0 = loop(32, 0);
    if (key.length > 32)
        v1 = loop(64, 32);

    return Number((v0 + v1 * -0x21524111n) & 0xFFFFFFFFn);
}

const TransactionType = {
    StartConnect: 0,
    TimeSync: 1,
    ListGames: 2,
    JoinGame: 3,
    JoinGameComplete: 4,
    CreateGame: 5,
    SearchGames: 6
};


// Game
    // GameId
    // SlotId
    // HostId
    // NetEnv
    // Players
        // PlayerId
        // Username
    // Attributes


const GameAttributes = {
    JoinMode: makeLAMSKeyID("__JOIN_MODE"),
    MaxPlayers: makeLAMSKeyID("__MAX_PLAYERS"),
    GameType: makeLAMSKeyID("GAME_TYPE")
};

function mmoOnData(conn, data)
{
    if (data.length < 4) return conn.end();
    const type = data.readUint16BE(0);
    const size = data.readUint16BE(2);

    if (size + 4 != data.length) return conn.end();

    switch (type)
    {
        case TransactionType.ListGames:
        {
            const reply = Buffer.alloc(0x8);
            reply.writeUint16BE(TransactionType.ListGames, 0);
            reply.writeUint16BE(reply.length, 2);
            reply.writeUInt32BE(0);

            break;
        }

        case TransactionType.CreateGame:
        {


            break;
        }

        default:
        {
            break;
        }
    }









}


function mmoHandleConnection(conn)
{
    console.log('[TCP:9211] A connection appears to have been made...');
    conn.on('data', () => mmoOnData(conn, data));
}


const server = createServer(mmoHandleConnection);
server.listen(30907, () => {
    console.log('[TCP] Listening on port: ' + 30907);
});