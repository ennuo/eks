const NetworkClient = require("../client");
const { MAX_MAP_COUNT, MAX_MECH_COUNT, MAX_SLOT_COUNT } = require('../datatypes/enums');

const CQ_LOGIN_WASABII = 0x00110151;
const CQ_CREATE = 0x210201;
const CQ_LOGIN_AGAIN = 0x110124;
const SA_LOGIN_WASABII = 0x00110152;
const SA_CREATE = 0x210202;
const SA_LOGIN_AGAIN = 0x110125;

const SN_WAIT = 0x110131;
const SN_MAP_INFO = 0x210115;
const SN_LICENSE_INFO = 0x260101;

const SN_DEFAULT_INFO = 0x210101;
const SN_PLAY_INFO = 0x210102;
const SN_RECORD_INFO = 0x210103;
const SN_MECH_LEVEL = 0x210104;
const SN_RANK = 0x210105;
const SN_ITEM_INFO = 0x210111;
const SN_EXPIRATION_ITEM = 0x210112;
const SN_COMPLETE = 0x210121;


// ZDispatchGate
const CQ_LEAVE = 0x220131;

const SN_SERVER_ADD = 0x220101;
const SN_CHANNEL_ADD = 0x220102;

const SA_LEAVE = 0x220132;

const ACCOUNT_LEVEL = {
    SPECTATOR: '1\0',
    MC: '2\0',
    GM: '3\0',
    DEV: '4\0'
};

module.exports = 
class ZAccountDispatch 
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
            case CQ_LOGIN_AGAIN:
            {
                const [msg, body] = client.getMessageBuffer(SA_LOGIN_AGAIN, 0x6);
                body.writeUint16LE(0x0000, 0);
                body.writeUint32LE(0x0000, 2)
                client.send(msg);

                return true;
            }
            case CQ_CREATE:
            {
                if (body.length != 0x1d)
                {
                    client.disconnect();
                    return true;
                }

                const PILOT_ONE = 101;
                const PILOT_TWO = 102;

                // Make sure we're setting a valid pilot
                const pilot = body.readUint32LE(0);
                if (pilot != PILOT_ONE && pilot != PILOT_TWO)
                {
                    client.disconnect();
                    return true;
                }

                const nickname = body.subarray(4).toString('ascii').split('\0').shift();
                if (nickname.length < 2)
                {
                    client.disconnect();
                    return true;
                }

                {
                    const [msg, body] = client.getMessageBuffer(SA_CREATE, 0x6);
                    body.writeUint16LE(0x0000, 0);
                    body.writeUint32LE(0x0000, 2)
                    client.send(msg);
                }

                return true;

                break;
            }
            case CQ_LOGIN_WASABII:
            {
                // can be longer?
                // if (body.length != 0x381)
                // {
                //     client.disconnect();
                //     return true;
                // }

                // Right now, I only particularly care about grabbing the username
                const nickname = body.subarray(0, 0x19).toString('ascii').split('\0').shift();


                console.log(`[ZDispatchAccount::CQ_LOGIN_WASABII] Processing login request for ${nickname}`);

                // If there's too many people online, we can put people in a queue
                // to be certified by the server, although I really doubt that would
                // ever be a problem.
                // {
                //     let [msg, body] = client.getMessageBuffer(SN_WAIT, 0x4);
                //     body.writeUint16LE(0x0000, 0);
                //     body.writeUint16LE(0x0001, 2);
                //     client.send(msg);
                // }

                // Authentication obviously doesn't exist, so report back to the game
                // that the login process succeeded.
                // Fairly sure this tells the game to switch to the gate
                // so every event after this actually does nothing, oops?
                {
                    const [msg, body] = client.getMessageBuffer(SA_LOGIN_WASABII, 0x6);
                    body.writeUint16LE(0x0000, 0);
                    body.writeUint32LE(0x00000000, 2)
                    client.send(msg);
                }

                // Give basic information about the user
                {
                    // struct
                    //  char AccountLevel[1 + 1]
                    //  char Nickname[25 + 1]

                    const [msg, body] = client.getMessageBuffer(SN_DEFAULT_INFO, 0x1c);

                    body.write(ACCOUNT_LEVEL.DEV, 0);
                    body.write(nickname + '\0', 2);

                    client.send(msg);
                }

                // Next step, I believe, would be PlayInfo, but that causes a crash if you don't
                // have a penalty added to the array, so I don't really care about that right now.

                // Record Info
                {
                    // struct
                        // 0x0 - int - Level
                        // 0x4 - 
                        // 0x8 -
                        // 0xc - 
                        // 0x10 -
                        // 0x14 - long - Coupon
                        // 0x1c - int - Win
                        // 0x20 - int - Lose
                        // 0x24 - int - Draw
                        // 0x28 - int - Kill
                        // 0x2c - int - Death

                        // 0x30 - 
                        // 0x34 - 
                        // 0x38 - 
                        // 0x3c - 

                        // 0x40 - long - Level Exp
                        // 0x48 - long - Point
                        // 0x50 - long - Card Exp
                        // 0x54 - int - Item Group



                    // int,__int64,__int64,__int64,__int64,int,int,int,int,int
                    // SetAccountRecord
                        // this
                        // param1 = + 0x10 - Level
                        // param2 = 
                        // param3 =
                        // param4 =
                        // param5 = 
                        // ints
                        // param6 =
                        // param7 = 
                        // param8 = 
                        // param9 =  
                        // param10 = 

                    const [msg, body] = client.getMessageBuffer(SN_RECORD_INFO, 0x58);
                    body.writeUint32LE(1, 0x0); // Level 1
                    
                    client.send(msg);
                }

                // Mech Level
                {
                    const MECH_RECORD_SIZE = 0x1c;

                    const [msg, body] = client.getMessageBuffer(SN_MECH_LEVEL, 0x1 + (MECH_RECORD_SIZE * MAX_MECH_COUNT));
                    let offset = 0;

                    // Just set every mech level to 1
                    body[offset++] = MAX_MECH_COUNT;
                    for (let i = 0; i < MAX_MECH_COUNT; ++i)
                    {
                        body.writeUint32LE(i + 1, offset); // Type
                        body.writeUint32LE(1, offset + 4); // Level
                        body.writeBigUint64LE(0n, offset + 8); // Exp
                        body.writeUint32LE(0, offset + 16); // Kill
                        body.writeUint32LE(0, offset + 20); // Death
                        body.writeUint32LE(0, offset + 24); // Sally

                        offset += MECH_RECORD_SIZE;
                    }

                    client.send(msg);
                }

                // Map Info
                {
                    const [msg, body] = client.getMessageBuffer(SN_MAP_INFO, 0x2 + (4 * MAX_MAP_COUNT));
                    let offset = 0;

                    // Just set every mech level to 1
                    body[offset++] = 0x00;
                    body[offset++] = MAX_MAP_COUNT;
                    for (let i = 0; i < MAX_MAP_COUNT; ++i, offset += 4)
                        body.writeUint32LE(i, offset); // Index
                    
                    client.send(msg);
                }

                // License info
                {
                    const [msg, body] = client.getMessageBuffer(SN_LICENSE_INFO, 0x2 + (9 * MAX_SLOT_COUNT));
                    let offset = 0;

                    // Just set every mech level to 1
                    body[offset++] = 0x00;
                    body[offset++] = MAX_SLOT_COUNT;
                    for (let i = 0; i < MAX_SLOT_COUNT; ++i, offset += 9)
                    {
                        body.writeUint32LE(i + 1, offset); // Mech Type
                        body.writeUint32LE(1, offset + 5); // type, gets remapped, so 1 is purchased, 2 is tutorial, 0 is none
                    }
                    
                    client.send(msg);
                }

                
                // ZDispatchAccount::Complete_SN
                {
                    let [msg, body] = client.getMessageBuffer(SN_COMPLETE, 0x10);
                    body.writeUint16LE(0x0000, 0);
                    body.writeInt32LE(0x0000, 2);
                    client.send(msg);
                }

            
                // So these are for automatically switching gameservers
                // between regions?
                // I imagine it always just chooses the first, only showing the menu
                // if there are multiple.

                // Reconnecting is a pain, so I have it sending the same IP right now,
                // so it doesn't try to disconnect/reconnect.

                // ZDispatchGate::Server_Add_SN
                {
                    let [msg, body] = client.getMessageBuffer(SN_SERVER_ADD, 0x2 + 0xd2);

                    // struct
                        // 0x0 - byte Result (OK = 0)
                        // 0x1 - byte ServerCount
                    
                    // param_1 = char* ServerKey
                    // param_2 = int ServerNumber
                    // param_3 = char* ServerName
                    // param_4 = char* ServerIP
                    // param_5 = int ServerPort
                    // param_6 = int ServerState
                    // param_7 = int CurrentUser
                    // param_8 = int MaxUser

                    // each server is 0xd2 bytes?
                        // 0x00 - char ServerKey[0x5]
                        // 0x05 - char ServerIP[0x10]
                        // 0x15 - char ServerName[0x33]

                        // 0xad - char ServerType[2 + 1] (has to be GS)
                        // 0xb0 - int ServerState
                        // 0xb8 - short ServerPort
                        // 0xba - short MaxUser
                        // 0xcc - int ServerNumber
                        // 0xd0 - short CurrentUser



                    body[0] = 0x00; // Whether or not there's more messages following?
                    body[1] = 0x01; // Server count

                    let offset = 0x2;
                    body.write('Dev0', offset + 0x0);               // 0x00 - char ServerKey[5]
                    body.write('172.19.0.1', offset + 0x5);          // 0x05 - ServerIP[16]
                    body.write('Developer Gate', offset + 0x15);    // 0x15 - ServerName[51]
                    body.write('GS', offset + 0xad);                // 0xad - ServerType[3]

                    body.writeUint32LE(3, offset + 0xB0); // ServerState ; 1 = UNKNOWN, 2 = ???, 3 = ONLINE, 4 = OFFLINE
                    body.writeUint16LE(9211, offset + 0xB8); // ServerPort
                    body.writeUint16LE(128, offset + 0xBA); // MaxUsers
                    body.writeUint32LE(1, offset + 0xCC); // ServerNumber
                    body.writeUint16LE(0, offset + 0xD0); // CurrentUsers
    
                    client.send(msg);
                }

                // ZDispatchGate::Channel_Add_SN
                {
                    const [msg, body] = client.getMessageBuffer(SN_CHANNEL_ADD, 0x2 + 0x5 + 0x37);
                    body[0] = 0x00; // Whether or not there's more messages following?
                    body[1] = 0x01; // Channel count

                    // shared server key for the channel list
                    body.write('Dev0', 0x2);
                    let offset = 0x2 + 0x5;


                    // 0x0 - u8 ChannelNumber
                    // 0x15 - byte -
                    // 0x1e - char ChannelName[0x19]


                    body[offset] = 1; // channel_number
                    body.writeUint16LE(0, offset + 0x1); // current_users
                    body.writeUint16LE(128, offset + 0x3); // max_users
                    body.writeUint32LE(1024, offset + 0x11); // max exp
                    body[offset + 0x15] = 0; // type
                    body[offset + 0x1a] = 1; // is_show
                    body.write('Developer Channel', offset + 0x1e); // channel_name, 0x19 byte string

                    require('fs').writeFileSync('C:/Users/Aidan/Desktop/SN_CHANNEL_ADD.BIN', msg);

                    client.send(msg);
                }

                return true;
            }

            default: return false;
        }



    }
};