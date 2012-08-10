var assert = require('assert'),
    natUpnp = require('..');

describe('NAT-UPNP/Client', function() {
  var c;
  beforeEach(function() {
    c = natUpnp.createClient();
  });

  it('should find router device', function(callback) {
    c.portMapping({
      public: ~~(Math.random() * 65536),
      private: ~~(Math.random() * 65536),
      ttl: 5
    }, function(err) {
      assert.equal(err, null);
      callback();
    });
  });
});
