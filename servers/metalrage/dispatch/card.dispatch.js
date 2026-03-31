const NetworkClient = require("../client");

const CN_LOAD = 0x250102;

const SN_PACKAGE_CARD = 0x250304;
const SN_LOAD_FAILED = 0x250101;
const SN_CARD_LIST = 0x250301;
const SN_COUPON = 0x250302;

const SA_POINT_GAMBLE = 0x250202;
const SA_OPEN = 0x250112;
const SA_CLOSE = 0x250114;
const SA_COUPON_GAMBLE = 0x250212;
const SA_USE_MASTERCARD = 0x250352;
const SA_REWARD = 0x250312;
const SA_EXCHANGE = 0x250322;
const SA_WANT_CARD = 0x250332;
const SA_SEND_USER_ITEM = 0x250402;
const SA_CARD_COMBINATION_TYPE = 0x250502;
const SA_DESTROY_SOCKET = 0x250512;

module.exports = 
class ZCardDispatch 
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
            case CN_LOAD:
            {


                return true;
            }
            default: return false;
        }
    }
};