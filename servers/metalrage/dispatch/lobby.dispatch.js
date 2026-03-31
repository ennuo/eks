const NetworkClient = require("../client");

const CQ_CREATE = 0x220201;
const SA_CREATE = 0x220202;

module.exports = 
class ZLobbyDispatch 
{
    /**
     * Handles a client network message
     * @param {NetworkClient} client - The network client that sent the message
     * @param {number} type  - The type of message sent
     * @param {Buffer} body  - The data contained in the message
     * @returns {boolean} - Whether or not the message was handled in this service
     */
    dispatch(client, type, body)
    {
        switch (type)
        {
            case CQ_CREATE:
            {
                const [msg, body] = client.getMessageBuffer(SA_CREATE, 0x10);
                body.writeUint16LE(0x0000, 0);
                body.writeUint32LE(0x00000000, 2)
                body.writeUint32LE(0, 6); // room index
                client.send(msg);

                return true;
            }
            default: return false;
        }
    }
};