 
  const CONTRACT_ADDRESS = "0x5c2cDA03F4e3af7CBa6170349Fec888729295fB9";
  const _ABI = [{
      "inputs": [
        {
          "internalType": "string",
          "name": "_name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_category",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_manufactureDate",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_expiryDate",
          "type": "string"
        }
      ],
      "name": "addProduct",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_productId",
          "type": "uint256"
        }
      ],
      "name": "deleteProduct",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getAllProducts",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_productId",
          "type": "uint256"
        }
      ],
      "name": "getExpiryTimestamp",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "nextProductId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "productIds",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "products",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "productId",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "category",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "manufactureDate",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "expiryDate",
          "type": "string"
        },
        {
          "internalType": "address",
          "name": "manufacturer",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "isActive",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_productId",
          "type": "uint256"
        }
      ],
      "name": "verifyProduct",
      "outputs": [
        {
          "internalType": "string",
          "name": "status",
          "type": "string"
        },
        {
          "internalType": "int256",
          "name": "daysLeft",
          "type": "int256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];


function formatHMS(ms){
  if(ms <= 0) return "00:00:00";
  const sec = Math.floor(ms/1000);
  const h = Math.floor(sec/3600);
  const m = Math.floor((sec % 3600)/60);
  const s = sec % 60;
  return `${two(h)}:${two(m)}:${two(s)}`;
}

function expiryEndOfDay(yyyy_mm_dd){
  return new Date(yyyy_mm_dd + "T23:59:59");
}


 let web3, contract, account;
let allProductsData = []; // For search & filter

const connectBtn = document.getElementById('connectBtn');
const productsArea = document.getElementById('productsArea');
const netSpan = document.getElementById('net');
const accSpan = document.getElementById('acc');
const fab = document.getElementById('fab');

function short(addr) { return addr ? addr.slice(0,6)+"..."+addr.slice(-4) : '—'; }

/* ================== CONNECT WALLET ================== */
async function connectWallet() {
  if (!window.ethereum) return alert("Install MetaMask!");
  web3 = new Web3(window.ethereum);
  contract = new web3.eth.Contract(_ABI, CONTRACT_ADDRESS);
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    account = accounts[0];
    connectBtn.textContent = 'Connected ' + short(account);
    connectBtn.classList.add('connected');
    accSpan.textContent = short(account);
    const netId = await web3.eth.net.getId();
    netSpan.textContent = netId;
    await loadProducts();
  } catch (e) { console.error(e); }
}
connectBtn.onclick = connectWallet;

/* ================== COUNTDOWN ================== */
function startCountdown(productId, expiryTs) {
  const el = document.getElementById(`timer_${productId}`);
  const update = () => {
    const diff = expiryTs - Math.floor(Date.now() / 1000);
    if (diff <= 0) {
      const past = Math.abs(diff);
      if (past < 86400) {
        const h = Math.floor(past / 3600), m = Math.floor((past % 3600)/60), s = past % 60;
        el.innerHTML = `<span class="countdown-expired">Expired • ${h}h ${m}m ${s}s ago</span>`;
      } else {
        const days = Math.floor(past / 86400);
        let text = "Expired • ";
        if (days >= 365) text += `${Math.floor(days/365)} year${days>=730?'s':''} ago`;
        else if (days >= 30) text += `${Math.floor(days/30)} month${days>=60?'s':''} ago`;
        else text += `${days} day${days>1?'s':''} ago`;
        el.innerHTML = `<span class="countdown-expired">${text}</span>`;
      }
      return;
    }
    const d = Math.floor(diff / 86400), h = Math.floor((diff % 86400)/3600),
          m = Math.floor((diff % 3600)/60), s = diff % 60;
    el.innerHTML = d > 0
      ? `<span class="countdown-valid">${d}d ${h}h ${m}m ${s}s left</span>`
      : `<span class="countdown-valid">${h}h ${m}m ${s}s left</span>`;
  };
  update();
  setInterval(update, 1000);
}

/* ================== LOAD PRODUCTS ================== */
async function loadProducts() {
  productsArea.innerHTML = "<div class='empty'>Loading...</div>";
  allProductsData = [];

  try {
    let ids = await contract.methods.getAllProducts().call();
    ids = [...new Set(ids)];

    for (let id of ids) {
      const p = await contract.methods.products(id).call();
      if (!p.isActive) continue;

      const verify = await contract.methods.verifyProduct(id).call();
      const isExpired = verify[0] === "Product expired";

      const productData = {
        id: id,
        productId: p.productId,
        name: p.name.toLowerCase(),
        category: p.category.toLowerCase(),
        fullName: p.name,
        fullCategory: p.category,
        manufactureDate: p.manufactureDate,
        expiryDate: p.expiryDate,
        status: verify[0],
        daysLeft: parseInt(verify[1]),
        cardClass: isExpired ? "expired" : "valid",
        expiryTs: Math.floor(new Date(p.expiryDate).getTime() / 1000)
      };
      allProductsData.push(productData);
    }

    applyFilters(); // Show with current filter
  } catch (err) {
    console.error(err);
    productsArea.innerHTML = "<div class='empty'>Failed to load products</div>";
  }
}

/* ================== RENDER & FILTER ================== */
function renderProducts(list) {
  productsArea.innerHTML = "";
  if (list.length === 0) {
    productsArea.innerHTML = "<div class='empty'>No products found.</div>";
    return;
  }
  list.forEach(p => {
    const timerHtml = `<p id="timer_${p.id}" class="timer"></p>`;
    const card = `
      <div class="card ${p.cardClass}" id="card_${p.id}">
        <h3>${p.fullName}</h3>
        <p>${p.fullCategory} • ID: ${p.productId}</p>
        <p>MFG: ${p.manufactureDate}</p>
        <p>EXP: ${p.expiryDate}</p>
        ${timerHtml}
        <button onclick="verifyProduct(${p.productId})">Verify</button>
        <button onclick="deleteProduct(${p.productId})">Delete</button>
      </div>`;
    productsArea.innerHTML += card;
    startCountdown(p.id, p.expiryTs);
  });
}

function applyFilters() {
  const filter = document.getElementById("filterSelect").value;
  const query = document.getElementById("searchInput").value.trim().toLowerCase();

  let filtered = allProductsData;

  if (filter === "valid") filtered = filtered.filter(p => p.status !== "Product expired");
  if (filter === "expired") filtered = filtered.filter(p => p.status === "Product expired");
  if (query) {
    filtered = filtered.filter(p => p.name.includes(query) || p.category.includes(query));
  }

  renderProducts(filtered);
}

// Live filtering
document.getElementById("filterSelect").addEventListener("change", applyFilters);
document.getElementById("searchInput").addEventListener("input", applyFilters);

/* ================== VERIFY & DELETE ================== */
async function verifyProduct(id) {
  try {
    const res = await contract.methods.verifyProduct(id).call();
    const days = parseInt(res[1]);
    let msg = days < 0 ? `Expired • ${Math.abs(days)} days ago`
             : days === 0 ? "Expires today"
             : `${days} days left`;
    alert(`Status: ${res[0]}\n${msg}`);
  } catch (e) { alert("Verify failed"); }
}

async function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;
  try {
    await contract.methods.deleteProduct(id).send({ from: account });
    alert("Product deleted!");
    loadProducts();
  } catch (e) { alert("Delete failed: " + e.message); }
}

/* ================== ADD PRODUCT MODAL ================== */
fab.onclick = () => {
  const tpl = document.getElementById('addModalTpl');
  const node = tpl.content.cloneNode(true);
  document.body.appendChild(node);

  const wrap = document.getElementById('modalWrap');
  const cancel = document.getElementById('m_cancel');
  const addBtn = document.getElementById('m_add');

  cancel.onclick = () => wrap.remove();

 addBtn.onclick = async () => {
  const name = document.getElementById('m_name').value.trim();
  const category = document.getElementById('m_category').value.trim();
  const mfg = document.getElementById('m_mfg').value;
  const exp = document.getElementById('m_exp').value;

  if (!name || !category || !mfg || !exp) return alert("Fill all fields");
  if (new Date(exp) <= new Date(mfg)) return alert("Expiry must be after manufacture date");

  try {
    const receipt = await contract.methods
      .addProduct(name, category, mfg, exp)
      .send({ from: account, gas: 300000 });

    // SAFELY extract the new product ID from the event
    let newId = "unknown";

    if (receipt.events && receipt.events.ProductAdded) {
      // Web3.js v1 sometimes returns event directly
      if (receipt.events.ProductAdded.returnValues) {
        newId = receipt.events.ProductAdded.returnValues.productId;
      }
      // Sometimes it's nested under a transaction hash
      else if (typeof receipt.events.ProductAdded === "object") {
        const event = receipt.events.ProductAdded;
        newId = event.returnValues ? event.returnValues.productId : event.productId || "unknown";
      }
    }

    // Fallback: read from contract (very safe)
    if (newId === "unknown") {
      const nextId = await contract.methods.nextProductId().call();
      newId = Number(nextId) - 1; // since we just incremented
    }

    alert(`Product added successfully! ID: ${newId}`);
    wrap.remove();
    await loadProducts();

  } catch (err) {
    console.error("Add failed:", err);
    alert("Transaction failed: " + (err.message || "User rejected"));
  }
};
};
// NEAR-EXPIRY ALERT SYSTEM (1 day or less left)
let alertedProductIds = new Set(); // Prevent duplicate alerts

function checkNearExpiry() {
  if (!allProductsData || allProductsData.length === 0) return;

  const now = Math.floor(Date.now() / 1000);
  const ONE_DAY = 24 * 60 * 60; // 86400 seconds

  allProductsData.forEach(p => {
    const timeLeft = p.expiryTs - now;

    // Only trigger if:
    // - Still valid (timeLeft > 0)
    // - Less than or equal to 1 day left
    // - Not already alerted
    if (timeLeft <= ONE_DAY && timeLeft > 0 && !alertedProductIds.has(p.id)) {
      alertedProductIds.add(p.id);

      // Calculate nice message
      let timeText = "";
      if (timeLeft < 3600) {
        const mins = Math.floor(timeLeft / 60);
        timeText = `${mins} minute${mins !== 1 ? 's' : ''}`;
      } else {
        const hours = Math.floor(timeLeft / 3600);
        const mins = Math.floor((timeLeft % 3600) / 60);
        timeText = hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''}` : "";
        timeText += mins > 0 ? ` ${mins} minute${mins !== 1 ? 's' : ''}` : "";
      }

      // Beautiful alert
      const msg = `
EXPIRY WARNING!

"${p.fullName}"
Category: ${p.fullCategory}

Expires in: ${timeText.trim() || "less than a minute"}!

Act fast — eat, freeze, or donate!
      `.trim();

      alert(msg);

      // Visual flash effect
      const card = document.getElementById(`card_${p.id}`);
      if (card) {
        card.style.border = "4px solid #f59e0b";
        card.style.boxShadow = "0 0 20px rgba(251, 146, 60, 0.7)";
        card.style.transform = "scale(1.03)";
        setTimeout(() => {
          card.style.border = "";
          card.style.boxShadow = "";
          card.style.transform = "";
        }, 4000);
      }

    }
  });
}

// Run every 30 seconds
setInterval(checkNearExpiry, 30000);

// Reset alerts when products reload (so you get warned again if you refresh)
const oldLoadProducts = loadProducts;
loadProducts = async function() {
  await oldLoadProducts();
  alertedProductIds.clear(); // Fresh start
  checkNearExpiry();
};

