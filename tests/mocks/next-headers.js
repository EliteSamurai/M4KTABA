const headers = () => new Map();
const cookies = () => ({
  get: () => undefined,
  set: () => {},
  delete: () => {},
});

module.exports = { headers, cookies };
module.exports.headers = headers;
module.exports.cookies = cookies;
