var assert = require('assert'),
    net = require('net'),
    natUpnp = require('..');

describe('NAT-UPNP/Client', function() {
  var c;
  beforeEach(function() {
    c = natUpnp.createClient();
  });

  it('should add port mapping', function(callback) {
    c.portMapping({
      public: ~~(Math.random() * 65536),
      private: ~~(Math.random() * 65536),
      ttl: 5
    }, function(err) {
      assert.equal(err, null);
      callback();
    });
  });

  it('should get external ip address', function(callback) {
    c.externalIp(function(err, ip) {
      assert.equal(err, null);
      assert(net.isIP(ip));
      callback();
    });
  });
});
