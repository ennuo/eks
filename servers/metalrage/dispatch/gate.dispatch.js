const NetworkClient = require("../client");

const CQ_LEAVE = 0x220131;
const CQ_ENTER = 0x220111;

const SN_SERVER_ADD = 0x220101;
const SN_CHANNEL_ADD = 0x220102;

const SA_LEAVE = 0x220132;
const SA_ENTER = 0x220112;

module.exports = 
class ZGateDispatch 
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
            case CQ_ENTER:
            {
                const [msg, body] = client.getMessageBuffer(SA_ENTER, 0x10);
                body.writeUint16LE(0x0000, 0);
                body.writeUint32LE(0x0000, 2)

                body.writeUint16LE(0, 6); // Account Index

                client.send(msg);


                return true;
            }
            case CQ_LEAVE:
            {
                const [msg, body] = client.getMessageBuffer(SA_LEAVE, 0xE);
                body.writeUint16LE(0x0000, 0);
                body.writeUint32LE(0x0000, 2);

                body.writeUint32LE(0x0, 6);
                body.writeUint32LE(0x0, 10);

                client.send(msg);

                return true;
            }
            default: return false;
        }
    }
};