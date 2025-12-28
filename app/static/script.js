// ==========================================
// PART 1: DATA & GLOBALS
// ==========================================

let detailCharts = [];      // Stores the 3 small charts
let mainOverviewChart = null; // Stores the big Overview chart

const siteData = {
    "bwm": {
        title: "Barisan Warisan Malaysia",
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
// PART 2: INTERACTION FUNCTIONS (MIXED MODE)
// ==========================================

function updateDashboard(siteKey) {
    const data = siteData[siteKey];
    if (!data) return;

    // 1. Update Main Title
    document.querySelector('.header-center h1').innerText = data.title;

    // 2. CONDITIONAL TOP SECTION
    if (siteKey === 'bwm') {
        // --- CASE 1: BWM (Default Mixed Mode) ---
        
        // Box 1: Image
        document.getElementById('info-box-1-title').innerText = "COUNCIL MEMBER";
        document.getElementById('icon-1').innerHTML = '<img src="./images/council member.jpg" style="width:60%; height:60%; object-fit:contain;">';
        document.getElementById('info-box-1-value').innerText = data.council;

        // Box 2: Image
        document.getElementById('info-box-2-title').innerText = "MEMBERSHIPS";
        document.getElementById('icon-2').innerHTML = '<img src="./images/membership.png" style="width:60%; height:60%; object-fit:contain;">';
        document.getElementById('info-box-2-value').innerText = data.members;

        // Box 3: EMOJI (📈)
        document.getElementById('info-box-3-title').innerText = "MEMBERSHIP GROWTH";
        document.getElementById('icon-3').innerText = "📈"; // Just text for emoji
        document.getElementById('info-box-3-value').innerText = data.growth;

    } else {
        // --- CASE 2: OTHER SITES (All Images) ---
        
        const latestDonation = data.donations[data.donations.length - 1] + "k";
        const latestVolunteer = data.volunteers[data.volunteers.length - 1];
        const latestSponsorship = data.sponsorships[data.sponsorships.length - 1] + "k";

        // Box 1: Donations (Image)
        document.getElementById('info-box-1-title').innerText = "LATEST DONATIONS";
        document.getElementById('icon-1').innerHTML = '<img src="./images/donations.png" style="width:60%; height:60%; object-fit:contain;">';
        document.getElementById('info-box-1-value').innerText = latestDonation;

        // Box 2: Volunteers (Image)
        document.getElementById('info-box-2-title').innerText = "ACTIVE VOLUNTEERS";
        document.getElementById('icon-2').innerHTML = '<img src="./images/volunteers.png" style="width:60%; height:60%; object-fit:contain;">';
        document.getElementById('info-box-2-value').innerText = latestVolunteer;

        // Box 3: Sponsorships (Image - Switched from Emoji!)
        document.getElementById('info-box-3-title').innerText = "LATEST SPONSORSHIPS";
        document.getElementById('icon-3').innerHTML = '<img src="./images/sponsorships.png" style="width:60%; height:60%; object-fit:contain;">';
        document.getElementById('info-box-3-value').innerText = latestSponsorship;
    }

    // 3. Update Bottom Section & Charts
    if(data.stats) {
        document.getElementById('stat-donations').innerText = data.stats.donations;
        document.getElementById('stat-sponsorships').innerText = data.stats.sponsorships;
        document.getElementById('stat-volunteers').innerText = data.stats.volunteers;
    }
    
    document.getElementById('overview-panel').style.display = 'none';
    document.getElementById('detail-panel').style.display = 'flex';
    document.getElementById('resetBtn').style.display = 'block';

    renderDetailCharts(data);
}

function showOverview() {
    // Reset Views
    document.getElementById('overview-panel').style.display = 'block';
    document.getElementById('detail-panel').style.display = 'none';
    document.getElementById('resetBtn').style.display = 'none';
    document.querySelector('.header-center h1').innerText = "Data Dashboard";

    // --- RESET TO DEFAULT (Mixed Mode) ---
    document.getElementById('info-box-1-title').innerText = "COUNCIL MEMBER";
    document.getElementById('icon-1').innerHTML = '<img src="./images/council member.jpg" style="width:60%; height:60%; object-fit:contain;">';
    document.getElementById('info-box-1-value').innerText = "500";

    document.getElementById('info-box-2-title').innerText = "MEMBERSHIPS";
    document.getElementById('icon-2').innerHTML = '<img src="./images/membership.png" style="width:60%; height:60%; object-fit:contain;">';
    document.getElementById('info-box-2-value').innerText = "75,000";

    document.getElementById('info-box-3-title').innerText = "MEMBERSHIP GROWTH";
    document.getElementById('icon-3').innerText = "📈"; // Reset to Emoji
    document.getElementById('info-box-3-value').innerText = "12%";

    if (mainOverviewChart) {
        mainOverviewChart.data.datasets.forEach(ds => ds.hidden = false);
        mainOverviewChart.update();
    }
}

function renderDetailCharts(data) {
    const years = ['2021', '2022', '2023', '2024', '2025'];
    const ctxDonation = document.getElementById('donationChart');
    const ctxVolunteer = document.getElementById('volunteerChart');
    const ctxSponsor = document.getElementById('sponsorshipChart');

    detailCharts.forEach(chart => chart.destroy());
    detailCharts = [];

    const createConfig = (label, datasetData, color) => ({
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: label,
                data: datasetData,
                borderColor: color,
                backgroundColor: color,
                tension: 0.3,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                y: { beginAtZero: true, ticks: { font: { size: 10 } } }
            }
        }
    });

    detailCharts.push(new Chart(ctxDonation, createConfig("Donations", data.donations, '#366d75')));
    detailCharts.push(new Chart(ctxVolunteer, createConfig("Volunteers", data.volunteers, '#68d3d8')));
    detailCharts.push(new Chart(ctxSponsor, createConfig("Sponsorships", data.sponsorships, '#4a6fa5')));
}

// ==========================================
// PART 3: INITIALIZATION (Run on Load)
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    // --- 1. OVERVIEW CHART (Save to global variable) ---
    const ctxMembership = document.getElementById('membershipTrendChart');
    if (ctxMembership) {
        mainOverviewChart = new Chart(ctxMembership, {
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
                responsive: true, maintainAspectRatio: false, 
                plugins: { title: { display: true, text: 'CULTURAL SITES GROWTH (OVERVIEW)' }, legend: { position: 'top', labels: { boxWidth: 10 } } },
                scales: { x: { grid: { display: false } } }
            }
        });
    }

    // --- 2. BAR CHART ---
    const ctxDemographic = document.getElementById('demographicBarChart');
    if (ctxDemographic) {
        new Chart(ctxDemographic, {
            type: 'bar',
            data: {
                labels: ['2021', '2022', '2023', '2024', '2025'], 
                datasets: [
                    { label: 'Membership Only', data: [320, 350, 380, 420, 450], backgroundColor: '#68d3d8', barPercentage: 0.6, categoryPercentage: 0.7 },
                    { label: 'Council Member', data: [40, 45, 50, 55, 60], backgroundColor: '#4a6fa5', barPercentage: 0.6, categoryPercentage: 0.7 }
                ]
            },
            options: {
                indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } }, title: { display: true, text: 'MEMBERSHIP COMPOSITION' } },
                scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, grid: { display: false }, ticks: { autoSkip: false, font: { weight: 'bold' } } } }
            }
        });
    }

    // --- 3. PIE CHART ---
    const pieData = {
        age: { labels: ['<18', '18-24', '25-34', '35-44', '45+'], data: [15, 25, 30, 20, 10], colors: ['#366d75', '#68d3d8', '#4a6fa5', '#8884d8', '#cccccc'] },
        gender: { labels: ['Male', 'Female'], data: [45, 55], colors: ['#366d75', '#68d3d8'] }
    };

    let pieChartInstance = null;
    function renderPieChart(filterType) {
        const ctxPie = document.getElementById('demographicPieChart');
        if (!ctxPie) return;
        const selectedData = pieData[filterType];
        if (pieChartInstance) pieChartInstance.destroy();
        pieChartInstance = new Chart(ctxPie, {
            type: 'doughnut',
            data: { labels: selectedData.labels, datasets: [{ data: selectedData.data, backgroundColor: selectedData.colors, borderWidth: 0 }] },
            options: {
                responsive: true, maintainAspectRatio: false, layout: { padding: 0 },
                plugins: { legend: { position: 'right', labels: { boxWidth: 10 } }, title: { display: true, text: filterType === 'age' ? 'MEMBER AGE' : 'MEMBER GENDER' } }
            }
        });
    }
    renderPieChart('age');
    const dropdown = document.getElementById('demographicFilter');
    if (dropdown) dropdown.addEventListener('change', function() { renderPieChart(this.value); });
});