// tests/mocks/stripe-js.js
const loadStripe = async () => ({
  _mock: true,
});

module.exports = { loadStripe };
module.exports.loadStripe = loadStripe;
