const ZAccountDispatch = require('./dispatch/account.dispatch');
const ZGateDispatch = require('./dispatch/gate.dispatch');

// CQ = Client Question
// SA = Server Answer
// NETWORK_EVENT_INFO
    // ushort EventMessage (0 = OK)
    // uint ErrorMessage (0 = OK)
// SN = Server Notification
module.exports = [
    new ZAccountDispatch(),
    new ZGateDispatch()
];