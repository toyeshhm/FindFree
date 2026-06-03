async function run() {
  const res = await fetch('https://backflipp.wishabi.com/flipp/items/search?locale=en&postal_code=10001&q=free');
  const json = await res.json();
  console.log(json.items[0]);
}
run();
