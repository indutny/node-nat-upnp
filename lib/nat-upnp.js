var nat = exports;

nat.ssdp = require('./nat-upnp/ssdp');
nat.device = require('./nat-upnp/device');
nat.createClient = require('./nat-upnp/client').create;
