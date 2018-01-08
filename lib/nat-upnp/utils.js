var utils = exports;

utils.getNamespace = function getNamespace(data, uri) {
  var ns;

  if (data['s:Envelope']) {
    Object.keys(data['s:Envelope']['$']).some(function(key) {
      if (!/^xmlns:/.test(key)) return;
      if (data['s:Envelope']['$'][key] !== uri) {
        return;
      }

      ns = key.replace(/^xmlns:/, '');
      return true;
    });
  }

  return ns ? ns + ':' : '';
};
