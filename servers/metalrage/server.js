const NetworkClient = require('./client.js');
const { createServer } = require('net');

const SERVER_PORT = 9211;
const GAME_PORT = 30907;

class DispatchServer
{
    constructor()
    {
        this.server = createServer();
        this.services = require('./dispatch.js');
        this.clients = [];

        this.server.on('connection', (socket) => this.onConnection(socket));
    }

    start()
    {
        this.server.listen(SERVER_PORT, () => {
            console.log(`[DispatchServer] Listening on port: ${SERVER_PORT}`);
        });

        return this;
    }
    
    onConnection(socket)
    {
        console.log(`[DispatchServer] A connection appears to have been made...`);
        const client = new NetworkClient(socket, (client, type, data) => {
            for (const service of this.services)
            {
                if (service.dispatch(client, type, data))
                    return;
            }
            
            console.log(`[DispatchServer] Unable to find service for request of type 0x${type.toString(16)}!`);
        });
    
        socket.on('close', () => {
            console.log(`[DispatchServer] A connection was closed...`);
        });
    }
};

const dispatch = new DispatchServer().start();

const game = createServer();
game.on('connection', socket => {
    console.log(`[GameServer] A connection appears to have been made...`);
    dispatch.onConnection(socket);
    // socket.on('data', data => {
    //     console.log(`[GameServer] RECV: ${data.length}`);
    //     console.log(data);
    // });
});


game.listen(GAME_PORT, () => {
    console.log(`[GameServer] Listening on port: ${GAME_PORT}`);
});