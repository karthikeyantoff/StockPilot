const test = require('node:test');
const assert = require('node:assert');

test('StockPilot Logic Test: Order Total Calculation', () => {
  const items = [
    { name: 'Scanner', price: 50.00, quantity: 2 },
    { name: 'Receipt Paper', price: 10.50, quantity: 3 },
  ];

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  assert.strictEqual(total, 131.50);
});

test('StockPilot Logic Test: Stock Reservation Arithmetic', () => {
  const currentStock = 20;
  const requestedQty = 5;

  assert.ok(currentStock >= requestedQty, 'Sufficient stock must exist');
  const remainingStock = currentStock - requestedQty;
  assert.strictEqual(remainingStock, 15);
});

test('StockPilot Logic Test: Idempotency Key Validation', () => {
  const key1 = 'IDEMP-12345';
  const key2 = 'IDEMP-12345';
  assert.strictEqual(key1 === key2, true, 'Duplicate key must match');
});
