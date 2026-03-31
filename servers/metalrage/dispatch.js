const ZAccountDispatch = require('./dispatch/account.dispatch');
const ZCardDispatch = require('./dispatch/card.dispatch');
const ZGateDispatch = require('./dispatch/gate.dispatch');
const ZLobbyDispatch = require('./dispatch/lobby.dispatch');

// CQ = Client Question
// SA = Server Answer
// NETWORK_EVENT_INFO
    // ushort EventMessage (0 = OK)
    // uint ErrorMessage (0 = OK)
// SN = Server Notification
// CN = Client Notification
module.exports = [
    new ZAccountDispatch(),
    new ZGateDispatch(),
    new ZCardDispatch(),
    new ZLobbyDispatch()
];