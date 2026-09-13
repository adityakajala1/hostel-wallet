/* ============================================
   HOSTEL WALLET - APP LOGIC
   Complete Expense Tracking Application
   ============================================ */

// Transaction data storage
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let currentFilter = 'all';
let transactionType = 'expense';
let expenseChart = null;

// Category icons mapping
const categoryIcons = {
  food: '🍔',
  transport: '🚌',
  shopping: '🛍️',
  entertainment: '🎮',
  education: '📚',
  health: '💊',
  income: '💵',
  other: '📦'
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

function initializeApp() {
  // Set today's date as default
  document.getElementById('date').valueAsDate = new Date();

  // Transaction type toggle
  const typeButtons = document.querySelectorAll('.type-btn');
  typeButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      typeButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      transactionType = this.getAttribute('data-type');
    });
  });

  // Form submission
  document.getElementById('transaction-form').addEventListener('submit', addTransaction);

  // Filter buttons
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      filterButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.getAttribute('data-filter');
      displayTransactions();
    });
  });

  // Load and display data
  updateDashboard();
  displayTransactions();
  renderChart();
}

// Add new transaction
function addTransaction(e) {
  e.preventDefault();

  const description = document.getElementById('description').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const category = document.getElementById('category').value;
  const date = document.getElementById('date').value;

  if (!description || !amount || !category || !date) {
    alert('Please fill in all fields!');
    return;
  }

  const transaction = {
    id: Date.now(),
    description,
    amount,
    category,
    date,
    type: transactionType,
    timestamp: new Date().toISOString()
  };

  transactions.push(transaction);
  saveTransactions();

  // Reset form
  document.getElementById('transaction-form').reset();
  document.getElementById('date').valueAsDate = new Date();

  // Update UI
  updateDashboard();
  displayTransactions();
  renderChart();

  // Show success feedback
  showNotification('Transaction added successfully!');
}

// Delete transaction
function deleteTransaction(id) {
  if (confirm('Are you sure you want to delete this transaction?')) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    updateDashboard();
    displayTransactions();
    renderChart();
    showNotification('Transaction deleted!', 'danger');
  }
}

// Display transactions in list
function displayTransactions() {
  const transactionList = document.getElementById('transaction-list');
  const emptyState = document.getElementById('empty-state');

  let filteredTransactions = transactions;

  if (currentFilter !== 'all') {
    filteredTransactions = transactions.filter(t => t.type === currentFilter);
  }

  // Sort by date (newest first)
  filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (filteredTransactions.length === 0) {
    transactionList.innerHTML = '';
    emptyState.classList.add('show');
    return;
  }

  emptyState.classList.remove('show');

  transactionList.innerHTML = filteredTransactions.map(transaction => {
    const icon = categoryIcons[transaction.category] || '📦';
    const formattedDate = new Date(transaction.date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    return `
      <div class="transaction-item ${transaction.type}">
        <div class="transaction-details">
          <div class="transaction-icon">${icon}</div>
          <div class="transaction-info">
            <h4>${transaction.description}</h4>
            <div class="transaction-meta">
              <span>${transaction.category}</span>
              <span>•</span>
              <span>${formattedDate}</span>
            </div>
          </div>
        </div>
        <div class="transaction-actions">
          <span class="transaction-amount">
            ${transaction.type === 'income' ? '+' : '-'}₹${transaction.amount.toFixed(2)}
          </span>
          <button class="delete-btn" onclick="deleteTransaction(${transaction.id})">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

// Update dashboard balances
function updateDashboard() {
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expense;

  document.getElementById('total-balance').textContent = `₹${balance.toFixed(2)}`;
  document.getElementById('total-income').textContent = `₹${income.toFixed(2)}`;
  document.getElementById('total-expense').textContent = `₹${expense.toFixed(2)}`;
}

// Render expense chart
function renderChart() {
  const ctx = document.getElementById('expense-chart');
  const noDataMessage = document.getElementById('no-data-message');

  const expenses = transactions.filter(t => t.type === 'expense');

  if (expenses.length === 0) {
    if (expenseChart) {
      expenseChart.destroy();
      expenseChart = null;
    }
    ctx.style.display = 'none';
    noDataMessage.classList.add('show');
    return;
  }

  ctx.style.display = 'block';
  noDataMessage.classList.remove('show');

  // Group expenses by category
  const categoryTotals = {};
  expenses.forEach(transaction => {
    if (categoryTotals[transaction.category]) {
      categoryTotals[transaction.category] += transaction.amount;
    } else {
      categoryTotals[transaction.category] = transaction.amount;
    }
  });

  const labels = Object.keys(categoryTotals).map(cat => {
    const icon = categoryIcons[cat] || '📦';
    return `${icon} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`;
  });
  const data = Object.values(categoryTotals);

  const colors = [
    '#FF6384',
    '#36A2EB',
    '#FFCE56',
    '#4BC0C0',
    '#9966FF',
    '#FF9F40',
    '#FF6384',
    '#C9CBCF'
  ];

  if (expenseChart) {
    expenseChart.destroy();
  }

  expenseChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            font: {
              size: 12,
              family: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ₹${value.toFixed(2)} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

// Save transactions to localStorage
function saveTransactions() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Show notification
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    background: ${type === 'success' ? '#34c759' : '#ff3b30'};
    color: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    animation: slideIn 0.3s ease;
    font-weight: 600;
  `;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 2500);
}

// Export transactions (bonus feature)
function exportTransactions() {
  const dataStr = JSON.stringify(transactions, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `hostel-wallet-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
}
