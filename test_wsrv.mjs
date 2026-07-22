async function testWsrv() {
  const testUrl = 'https://http2.mlstatic.com/D_NQ_NP_688679-MLA82680700141_022025-O.webp';
  const proxiedUrl = `https://wsrv.nl/?url=${encodeURIComponent(testUrl)}&w=600&output=webp`;

  console.log("Probando proxy CDN wsrv.nl...");
  console.log("Original:", testUrl);
  console.log("Proxied:", proxiedUrl);

  try {
    const res = await fetch(proxiedUrl);
    console.log("Status CDN:", res.status);
    console.log("Content-Type CDN:", res.headers.get('content-type'));
  } catch (err) {
    console.error("Error:", err.message);
  }
}

testWsrv();
