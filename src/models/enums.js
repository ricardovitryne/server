const Enum = require('enum')


module.exports.contactEnum = new Enum([
    'user',
    'group',
    'broadcast',
]);

//todo enums pra o state da session
module.exports.sessionStateEnum = new Enum([
    'STARTING',
    'CONNECTED',
    'isLogged',
    'InChat',
    'TIMEOUT'
]);

module.exports.imageTypeEnum = new Enum([
    'http',
    'base64',
]); 