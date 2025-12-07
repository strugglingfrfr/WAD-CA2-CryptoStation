// get the current page url
const params = new URLSearchParams(window.location.search);
const cryptoId = params.get("id");

// decide what to load based on the page
if (window.location.pathname.includes("index.html") || window.location.pathname.endsWith("/")) {
  loadCryptoList();
} else if (window.location.pathname.includes("crypto.html")) {
  loadCryptoDetails();
  loadPriceHistory();
}

// store cryptos for search
let cryptoCache = [];

// load all cryptos and show in table
async function loadCryptoList() {
  try {
    const res = await fetch("/api/cryptos");
    const data = await res.json();

    cryptoCache = data;

    displayStats(data);
    displayTable(data);
    buildTicker(data); // build ticker

  } catch (err) {
    console.log("error loading cryptos", err);
  }
}

// show stats card values
function displayStats(data) {
  let totalMcap = 0;
  let highest = data[0];
  let lowest = data[0];

  data.forEach(c => {
    totalMcap += c.marketCap;

    if (c.price > highest.price) highest = c;
    if (c.price < lowest.price) lowest = c;
  });

  document.getElementById("total-mcap").innerText = "$" + totalMcap.toLocaleString();
  document.getElementById("highest-coin").innerText = highest.name + " ($" + highest.price + ")";
  document.getElementById("lowest-coin").innerText = lowest.name + " ($" + lowest.price + ")";
}

// build html table rows
function displayTable(list) {
  const table = document.getElementById("crypto-table");
  table.innerHTML = "";

  list.forEach((c, index) => {
    const change = randomChange();
    const changeClass = change >= 0 ? "green" : "red";

    table.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${c.name} (${c.symbol})</td>
        <td>$${c.price.toLocaleString()}</td>
        <td class="${changeClass}">${change}%</td>
        <td>$${c.marketCap.toLocaleString()}</td>
        <td><button onclick="location.href='crypto.html?id=${c._id}'">View</button></td>
      </tr>
    `;
  });
}

// ticker maker
function buildTicker(data) {
    const ticker = document.getElementById("ticker");
    ticker.innerHTML = "";
  
    data.forEach(c => {
      const change = randomChange();
      const changeClass = change >= 0 ? "green" : "red";
  
      ticker.innerHTML += `
        <div class="ticker-item">
          ${c.symbol}: $${c.price} <span class="${changeClass}">${change}%</span>
        </div>
      `;
    });
  
    // duplicate elements for smooth infinite loop
    ticker.innerHTML += ticker.innerHTML;
  }
  

// creates random realistic daily change
function randomChange() {
  return (Math.random() * 4 - 2).toFixed(2);
}

// search bar function
function searchCrypto() {
  const text = document.getElementById("search").value.toLowerCase();

  const filtered = cryptoCache.filter(c =>
    c.name.toLowerCase().includes(text) ||
    c.symbol.toLowerCase().includes(text)
  );

  displayTable(filtered);
  displayStats(filtered);
}

// load crypto details for details page
async function loadCryptoDetails() {
  try {
    const res = await fetch(`/api/cryptos/${cryptoId}`);
    const c = await res.json();

    document.getElementById("crypto-name").innerText = `${c.name} (${c.symbol})`;
    document.getElementById("crypto-price").innerText = "Price: $" + c.price;
    document.getElementById("crypto-marketcap").innerText = "Market Cap: $" + c.marketCap;
    document.getElementById("crypto-high").innerText = "Monthly High: $" + c.monthlyHigh;
    document.getElementById("crypto-low").innerText = "Monthly Low: $" + c.monthlyLow;

  } catch (err) {
    console.log("error loading single crypto", err);
  }
}

// load chart
async function loadPriceHistory() {
  try {
    const res = await fetch(`/api/history/${cryptoId}`);
    const { labels, prices } = await res.json();

    const ctx = document.getElementById("priceChart");

    new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: "Price",
          data: prices,
          borderColor: "lightgreen",
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: false }
        }
      }
    });

  } catch (err) {
    console.log("error loading chart data", err);
  }
}

//SECOND PAGE: CRYPTO DETAILS (KRAKEN-STYLE)
// load crypto details into name, price and stats
async function loadCryptoDetails() {
    try {
      const res = await fetch(`/api/cryptos/${cryptoId}`);
      const c = await res.json();
  
      // name
      document.getElementById("crypto-name").innerText = `${c.name} (${c.symbol})`;
  
      // big price in header
      document.getElementById("asset-price-big").innerText = `$${c.price}`;
  
      // stats (labels are in HTML)
      document.getElementById("stat-mcap").innerText = `$${c.marketCap.toLocaleString()}`;
      document.getElementById("stat-high").innerText = `$${c.monthlyHigh}`;
      document.getElementById("stat-low").innerText = `$${c.monthlyLow}`;
    } catch (err) {
      console.log("error loading crypto details", err);
    }
  }
  
  // load price history and draw chart + 24h change
  async function loadPriceHistory() {
    try {
      const res = await fetch(`/api/history/${cryptoId}`);
      const { labels, prices } = await res.json();
  
      // "24h" change from last 2 points
      const prev = prices[prices.length - 2];
      const now = prices[prices.length - 1];
      const diff = now - prev;
      const pct = ((diff / prev) * 100).toFixed(2);
  
      const changeText = `${pct}%`;
      const changeClass = pct >= 0 ? "green-text" : "red-text";
  
      const changeMain = document.getElementById("asset-change");
      const changeStat = document.getElementById("stat-change");
  
      changeMain.innerText = changeText;
      changeStat.innerText = changeText;
  
      changeMain.classList.add(changeClass);
      changeStat.classList.add(changeClass);
  
      // last label as "last updated"
      document.getElementById("stat-updated").innerText =
        labels[labels.length - 1];
  
      drawOKXStyleChart(labels, prices);
    } catch (err) {
      console.log("error loading chart data", err);
    }
  }
  
  // segmented neon line chart with short x-axis labels
  // segmented neon line chart with built-in tooltip 
  function drawOKXStyleChart(labels, prices) {
    const canvas = document.getElementById("priceChart");

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext("2d");

    // short-form dates (Nov 7)
    const shortLabels = labels.map(d => {
        const date = new Date(d);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric"
        });
    });

    const segmentColors = prices.map((p, i) =>
        i === 0 ? "#4cd4a8" : (p >= prices[i - 1] ? "#4cd4a8" : "#ff5c5c")
    );

    new Chart(ctx, {
        type: "line",
        data: {
            labels: shortLabels,
            datasets: [{
                data: prices,
                borderWidth: 2.3,
                borderColor: "#4cd4a8",
                segment: {
                    borderColor: ctx => segmentColors[ctx.p0DataIndex]
                },
                pointRadius: 0,
                tension: 0.35,
                fill: true,
                backgroundColor: "rgba(0,255,180,0.05)"
            }]
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,

            interaction: {
                mode: "index",
                intersect: false
            },

            plugins: {
                legend: { display: false },

                tooltip: {
                    enabled: true,
                    displayColors: false,
                    backgroundColor: "#0d0f13",
                    borderColor: "#4cd4a8",
                    borderWidth: 1,
                    titleColor: "#4cd4a8",
                    bodyColor: "#e6e6e6",

                    callbacks: {
                        title: (items) => shortLabels[items[0].dataIndex],
                        label: (ctx) => "$" + ctx.parsed.y.toLocaleString()
                    }
                }
            },

            scales: {
                x: {
                    ticks: {
                        color: "#6bc6ff",
                        maxRotation: 0,
                        minRotation: 0,
                        autoSkip: true,
                        autoSkipPadding: 25,
                        maxTicksLimit: 8
                    },
                    grid: { color: "rgba(255,255,255,0.04)" }
                },

                y: {
                    ticks: {
                        color: "#6bc6ff",
                        callback: value => "$" + value.toLocaleString()
                    },
                    grid: { color: "rgba(255,255,255,0.04)" }
                }
            }
        }
    });
}
