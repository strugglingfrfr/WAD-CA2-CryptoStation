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
        <td>
          <button onclick="location.href='crypto.html?id=${c._id}'">View</button>
          <button onclick="deleteCrypto('${c._id}')">Delete</button>
        </td>
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

// delete function to delete a crypto, has a confirmation pop up to make sure there is no accidental deletions 
async function deleteCrypto(id) {
    const confirmDelete = confirm("Are you sure you want to delete this crypto?");
  
    if (!confirmDelete) return;
  
    try {
      await fetch(`/api/cryptos/${id}`, {
        method: "DELETE"
      });
  
      loadCryptoList(); // refresh table
    } catch (err) {
      console.log("error deleting crypto", err);
    }
  }

// user side add crypto form function , only make viisble hen user preses add you crypto button 
function openAddCrypto() {
    document.getElementById("addCryptoModal").style.display = "flex";
  }
  
  function closeAddCrypto() {
    document.getElementById("addCryptoModal").style.display = "none";
  }

// handle add crypto form submit
document.getElementById("add-crypto-form").addEventListener("submit", async function (e) {
    e.preventDefault();
  
    const newCrypto = {
      name: document.getElementById("name").value,
      symbol: document.getElementById("symbol").value,
      price: Number(document.getElementById("price").value),
      marketCap: Number(document.getElementById("marketCap").value),
      monthlyHigh: Number(document.getElementById("monthlyHigh").value),
      monthlyLow: Number(document.getElementById("monthlyLow").value)
    };
  
    try {
      const res = await fetch("/api/cryptos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newCrypto)
      });
  
      const savedCrypto = await res.json();
  
      // close modal
      closeAddCrypto();
  
      // reset form
      document.getElementById("add-crypto-form").reset();
  
      // re-fetch cryptos so table updates
      loadCryptoList();

    } catch (err) {
      console.error("Error adding crypto:", err);
    }
  });
  
// user side edit functions , user can edit the market cap etc and that will also change in the db 
//function to enable the editing mode
 function enableEdit() {
    // hide text values
    document.getElementById("stat-mcap").style.display = "none";
    document.getElementById("stat-high").style.display = "none";
    document.getElementById("stat-low").style.display = "none";
  
    // show inputs
    document.getElementById("edit-mcap").hidden = false;
    document.getElementById("edit-high").hidden = false;
    document.getElementById("edit-low").hidden = false;
  
    // prefill inputs with current values
    document.getElementById("edit-mcap").value =
      document.getElementById("stat-mcap").innerText.replace(/[$,]/g, "");
  
    document.getElementById("edit-high").value =
      document.getElementById("stat-high").innerText.replace("$", "");
  
    document.getElementById("edit-low").value =
      document.getElementById("stat-low").innerText.replace("$", "");
  
    // change button to save
    const btn = document.getElementById("editBtn");
    btn.innerText = "Save";
    btn.onclick = saveEdit;
  }

//function to save the changes to backend
  async function saveEdit() {
    const updatedData = {
      marketCap: Number(document.getElementById("edit-mcap").value),
      monthlyHigh: Number(document.getElementById("edit-high").value),
      monthlyLow: Number(document.getElementById("edit-low").value)
    };
  
    try {
      const res = await fetch(`/api/cryptos/${cryptoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatedData)
      });
  
      const updated = await res.json();
  
      // update UI text
      document.getElementById("stat-mcap").innerText =
        `$${updated.marketCap.toLocaleString()}`;
      document.getElementById("stat-high").innerText =
        `$${updated.monthlyHigh}`;
      document.getElementById("stat-low").innerText =
        `$${updated.monthlyLow}`;
  
      // hide inputs
      document.getElementById("edit-mcap").hidden = true;
      document.getElementById("edit-high").hidden = true;
      document.getElementById("edit-low").hidden = true;
  
      // show text again
      document.getElementById("stat-mcap").style.display = "inline";
      document.getElementById("stat-high").style.display = "inline";
      document.getElementById("stat-low").style.display = "inline";
  
      // revert button
      const btn = document.getElementById("editBtn");
      btn.innerText = "Edit";
      btn.onclick = enableEdit;
  
    } catch (err) {
      console.log("error updating crypto", err);
    }
  }
  