// ==========================================
// PART 1: DATA & GLOBALS
// ==========================================

let chart1Instance = null;
let chart2Instance = null;
let chart3Instance = null;

const siteData = {
    "heritage-centre": {
        title: "Heritage Centre",
        council: 120, members: "15,000", growth: "5%",
        donations: [10, 20, 35, 50, 70],
        volunteers: [5, 15, 20, 25, 30],
        sponsorships: [2, 4, 6, 8, 10]
    },
    "stadium-merdeka": {
        title: "Stadium Merdeka",
        council: 50, members: "8,500", growth: "22%",
        donations: [20, 40, 60, 80, 100],
        volunteers: [10, 20, 30, 40, 50],
        sponsorships: [5, 10, 15, 20, 25]
    },
    "suffolk-house": {
        title: "Suffolk House",
        council: 40, members: "5,300", growth: "15%",
        donations: [15, 25, 35, 45, 55],
        volunteers: [8, 12, 16, 20, 24],
        sponsorships: [3, 6, 9, 12, 15]
    },
    "heren-street": {
        title: "No 8 Heeren Street",
        council: 30, members: "2,000", growth: "10%",
        donations: [5, 10, 15, 20, 25],
        volunteers: [2, 4, 6, 8, 10],
        sponsorships: [1, 2, 3, 4, 5]
    },
    "rumah": {
        title: "Rumah Penghulu Abu Seman",
        council: 25, members: "1,200", growth: "8%",
        donations: [8, 12, 18, 24, 30],
        volunteers: [3, 6, 9, 12, 15],
        sponsorships: [2, 3, 5, 7, 9]
    }
};

// ==========================================
// PART 2: INTERACTION FUNCTIONS
// ==========================================

function updateDashboard(siteKey) {
    const data = siteData[siteKey];
    if (!data) return;

    // Update active state for site boxes
    document.querySelectorAll('.site-box').forEach(box => box.classList.remove('active'));
    const activeBox = document.querySelector(`.site-box[onclick*="${siteKey}"]`);
    if (activeBox) activeBox.classList.add('active');

    // Update section header with site name
    document.getElementById('section-header-1').innerText = data.title.toUpperCase();

    // Update info cards
    const latestDonation = data.donations[data.donations.length - 1] + "k";
    const latestVolunteer = data.volunteers[data.volunteers.length - 1];
    const latestSponsorship = data.sponsorships[data.sponsorships.length - 1] + "k";

    document.getElementById('info-box-1-title').innerText = "LATEST DONATIONS";
    document.getElementById('icon-1').innerHTML = '<img src="./images/donations.png" style="width:50%; height:50%; object-fit:contain;">';
    document.getElementById('info-box-1-value').innerText = latestDonation;

    document.getElementById('info-box-2-title').innerText = "ACTIVE VOLUNTEERS";
    document.getElementById('icon-2').innerHTML = '<img src="./images/volunteers.png" style="width:60%; height:60%; object-fit:contain;">';
    document.getElementById('info-box-2-value').innerText = latestVolunteer;

    document.getElementById('info-box-3-title').innerText = "LATEST SPONSORSHIPS";
    document.getElementById('icon-3').innerHTML = '<img src="./images/sponsorships.png" style="width:60%; height:60%; object-fit:contain;">';
    document.getElementById('info-box-3-value').innerText = latestSponsorship;

    // Hide filter dropdown for site-specific view
    const filterContainer = document.getElementById('filter-container');
    if (filterContainer) filterContainer.style.display = 'none';

    // Render site-specific charts
    renderSiteCharts(data);
}

function showOverview() {
    // Update active state for BWM site box
    document.querySelectorAll('.site-box').forEach(box => box.classList.remove('active'));
    const bwmBox = document.querySelector('.site-box.new-site');
    if (bwmBox) bwmBox.classList.add('active');

    // Reset section header
    document.getElementById('section-header-1').innerText = "ORGANISATION DATA";

    // Reset info cards
    document.getElementById('info-box-1-title').innerText = "COUNCIL MEMBER";
    document.getElementById('icon-1').innerHTML = '<img src="./images/council member.jpg" style="width:50%; height:50%; object-fit:contain;">';
    document.getElementById('info-box-1-value').innerText = "500";

    document.getElementById('info-box-2-title').innerText = "MEMBERSHIPS";
    document.getElementById('icon-2').innerHTML = '<img src="./images/membership.png" style="width:60%; height:60%; object-fit:contain;">';
    document.getElementById('info-box-2-value').innerText = "75,000";

    document.getElementById('info-box-3-title').innerText = "MEMBERSHIP GROWTH";
    document.getElementById('icon-3').innerHTML = '<span style="font-size: 1.2rem;">📈</span>';
    document.getElementById('info-box-3-value').innerText = "+12%";

    // Show filter dropdown
    const filterContainer = document.getElementById('filter-container');
    if (filterContainer) filterContainer.style.display = 'block';

    // Render overview charts
    renderOverviewCharts();
}

function renderSiteCharts(data) {
    const years = ['2021', '2022', '2023', '2024', '2025'];

    // Destroy existing charts
    if (chart1Instance) chart1Instance.destroy();
    if (chart2Instance) chart2Instance.destroy();
    if (chart3Instance) chart3Instance.destroy();

    // Chart 1: Donations (line chart)
    const ctx1 = document.getElementById('chart1');
    chart1Instance = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: 'Donations',
                data: data.donations,
                borderColor: '#366d75',
                backgroundColor: '#366d75',
                tension: 0.3,
                pointRadius: 5,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'DONATIONS TREND' },
                legend: { display: false }
            },
            scales: {
                x: { grid: { display: false } },
                y: { beginAtZero: true }
            }
        }
    });

    // Chart 2: Volunteers (line chart)
    const ctx2 = document.getElementById('chart2');
    chart2Instance = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: 'Volunteers',
                data: data.volunteers,
                borderColor: '#68d3d8',
                backgroundColor: '#68d3d8',
                tension: 0.3,
                pointRadius: 5,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'VOLUNTEERS TREND' },
                legend: { display: false }
            },
            scales: {
                x: { grid: { display: false } },
                y: { beginAtZero: true }
            }
        }
    });

    // Chart 3: Sponsorships (line chart)
    const ctx3 = document.getElementById('chart3');
    chart3Instance = new Chart(ctx3, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: 'Sponsorships',
                data: data.sponsorships,
                borderColor: '#4a6fa5',
                backgroundColor: '#4a6fa5',
                tension: 0.3,
                pointRadius: 5,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'SPONSORSHIPS TREND' },
                legend: { display: false }
            },
            scales: {
                x: { grid: { display: false } },
                y: { beginAtZero: true }
            }
        }
    });
}

function renderOverviewCharts() {
    // Destroy existing charts
    if (chart1Instance) chart1Instance.destroy();
    if (chart2Instance) chart2Instance.destroy();
    if (chart3Instance) chart3Instance.destroy();

    // Chart 1: Bar Chart
    const ctx1 = document.getElementById('chart1');
    chart1Instance = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: ['2021', '2022', '2023', '2024', '2025'],
            datasets: [
                { label: 'Membership Only', data: [320, 350, 380, 420, 450], backgroundColor: '#68d3d8', barPercentage: 0.6, categoryPercentage: 0.7 },
                { label: 'Council Member', data: [40, 45, 50, 55, 60], backgroundColor: '#4a6fa5', barPercentage: 0.6, categoryPercentage: 0.7 }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } },
                title: { display: true, text: 'MEMBERSHIP COMPOSITION' }
            },
            scales: {
                x: { stacked: true, grid: { display: false } },
                y: { stacked: true, grid: { display: false }, ticks: { autoSkip: false, font: { weight: 'bold' } } }
            }
        }
    });

    // Chart 2: Pie Chart (will be initialized by renderPieChart function)
    renderPieChart('age');

    // Chart 3: Membership Trend Chart
    const ctx3 = document.getElementById('chart3');
    chart3Instance = new Chart(ctx3, {
        type: 'line',
        data: {
            labels: ['2021', '2022', '2023', '2024', '2025'],
            datasets: [
                { label: 'BWM', data: [120, 150, 200, 280, 350], borderColor: '#366d75', tension: 0.4, pointRadius: 4, borderWidth: 3 },
                { label: 'Stadium Merdeka', data: [100, 130, 180, 240, 310], borderColor: '#4a6fa5', tension: 0.4, pointRadius: 4, borderWidth: 3 },
                { label: 'Suffolk House', data: [80, 100, 140, 190, 250], borderColor: '#68d3d8', tension: 0.4, pointRadius: 4, borderWidth: 3 },
                { label: 'No 8 Heeren St', data: [40, 60, 90, 120, 160], borderColor: '#8884d8', tension: 0.4, pointRadius: 4, borderWidth: 3 },
                { label: 'Rumah Penghulu', data: [20, 35, 50, 80, 110], borderColor: '#999999', tension: 0.4, pointRadius: 4, borderWidth: 3 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'CULTURAL SITES GROWTH (OVERVIEW)' },
                legend: { position: 'top', labels: { boxWidth: 10 } }
            },
            scales: {
                x: { grid: { display: false } }
            }
        }
    });
}

// ==========================================
// PART 3: INITIALIZATION (Run on Load)
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
    // Initialize with overview charts
    renderOverviewCharts();

    // Set up filter dropdown event listener
    const dropdown = document.getElementById('demographicFilter');
    if (dropdown) {
        dropdown.addEventListener('change', function() {
            renderPieChart(this.value);
        });
    }
});

// Pie chart rendering function
const pieData = {
    age: {
        labels: ['<18', '18-24', '25-34', '35-44', '45+'],
        data: [15, 25, 30, 20, 10],
        colors: ['#366d75', '#68d3d8', '#4a6fa5', '#8884d8', '#cccccc']
    },
    gender: {
        labels: ['Male', 'Female'],
        data: [45, 55],
        colors: ['#366d75', '#68d3d8']
    }
};

function renderPieChart(filterType) {
    const ctx2 = document.getElementById('chart2');
    if (!ctx2) return;

    const selectedData = pieData[filterType];

    // Destroy existing chart2 if it exists
    if (chart2Instance) chart2Instance.destroy();

    chart2Instance = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: selectedData.labels,
            datasets: [{
                data: selectedData.data,
                backgroundColor: selectedData.colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: 0 },
            plugins: {
                legend: { position: 'right', labels: { boxWidth: 10 } },
                title: {
                    display: true,
                    text: filterType === 'age' ? 'MEMBER AGE' : 'MEMBER GENDER'
                }
            }
        }
    });
}