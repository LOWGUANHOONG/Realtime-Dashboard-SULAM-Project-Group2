// ==========================================
// PART 1: GLOBALS & INITIALIZATION
// ==========================================
let chart1Instance = null;
let chart2Instance = null;
let chart3Instance = null;

const siteIdMap = {
    "heritage-centre": 1,
    "stadium-merdeka": 2,
    "suffolk-house": 3,
    "heren-street": 4,
    "rumah": 5
};

document.addEventListener("DOMContentLoaded", function () {
    // Ensure the BWM box is active on initial load
    const bwmBox = document.querySelector('.new-site');
    if (bwmBox) {
        bwmBox.classList.add('active');
    }
    
    // Initial load: BWM Overview
    fetchAndRender();

    // Listen for Demographic Filter changes (Age/Gender)
    const dropdown = document.getElementById('demographicFilter');
    if (dropdown) {
        dropdown.addEventListener('change', function() {
            fetchAndRender(null, this.value);
        });
    }
});

// ==========================================
// PART 2: DATA FETCHING
// ==========================================
async function fetchAndRender(siteKey = null, demoFilter = 'age') {
    let url = `/api/data?demo_filter=${demoFilter}`;
    const siteId = siteKey ? siteIdMap[siteKey] : null;

    if (siteId) url += `&site_id=${siteId}`;

    try {
        const response = await fetch(url);
        const result = await response.json();

        if (result.status === "success") {
            const apiData = result.data;

            // 1. Update Top KPI Cards
            updateKPICards(apiData.kpis, apiData.view);

            // 2. Render Charts based on View
            if (apiData.view === "overview") {
                renderOverviewCharts(apiData);
            } else {
                renderSiteCharts(apiData, siteKey);
            }
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

function updateKPICards(kpis, view) {
    if (view === "overview") {
        document.getElementById('info-box-1-title').innerText = "COUNCIL MEMBERS";
        document.getElementById('info-box-1-value').innerText = kpis.council_members || 0;

        document.getElementById('info-box-2-title').innerText = "TOTAL MEMBERSHIPS";
        document.getElementById('info-box-2-value').innerText = (kpis.total_members || 0).toLocaleString();

        document.getElementById('info-box-3-title').innerText = "MEMBERSHIP GROWTH";
        document.getElementById('info-box-3-value').innerText = kpis.growth_pct || "0%";

        document.getElementById('section-header-1').innerText = "BWM ORGANISATION OVERVIEW";
        document.getElementById('filter-container').style.display = 'block';
    } else {
        document.getElementById('info-box-1-title').innerText = "LATEST DONATIONS";
        document.getElementById('info-box-1-value').innerText = kpis.donations;

        document.getElementById('info-box-2-title').innerText = "ACTIVE VOLUNTEERS";
        document.getElementById('info-box-2-value').innerText = kpis.volunteers;

        document.getElementById('info-box-3-title').innerText = "LATEST SPONSORSHIPS";
        document.getElementById('info-box-3-value').innerText = kpis.sponsorships;

        document.getElementById('filter-container').style.display = 'none';
    }
}

// ==========================================
// PART 3: CHART RENDERING
// ==========================================

function renderOverviewCharts(apiData) {
    // Cleanup old instances to prevent "ghost" charts
    if (chart1Instance) chart1Instance.destroy();
    if (chart2Instance) chart2Instance.destroy();
    if (chart3Instance) chart3Instance.destroy();

    // --- CHART 1: HORIZONTAL STACKED MEMBERSHIP ---
    const ctx1 = document.getElementById('chart1');
    const years = apiData.membership_chart.map(item => item.year);
    
    chart1Instance = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [
                { 
                    label: 'General Members', 
                    data: apiData.membership_chart.map(item => item.avg_members || 0), 
                    backgroundColor: '#68d3d8' 
                },
                { 
                    label: 'Council Members', 
                    data: apiData.membership_chart.map(item => item.avg_council || 0), 
                    backgroundColor: '#4a6fa5' 
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { stacked: true }, y: { stacked: true } },
            plugins: { title: { display: true, text: 'ANNUAL AVG MEMBERSHIP COMPOSITION' } }
        }
    });

    // --- CHART 2: DEMOGRAPHICS DOUGHNUT ---
    const ctx2 = document.getElementById('chart2');
    chart2Instance = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: apiData.demographics.map(d => d.label),
            datasets: [{
                data: apiData.demographics.map(d => d.value),
                backgroundColor: ['#366d75', '#68d3d8', '#4a6fa5', '#f4d35e', '#ee964b'],
                borderWidth: 2,
                hoverOffset: 10
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            layout: {
                padding: { left: 110, right: 100 , top: 0, bottom: 0 }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'right', // Moves legend to the right
                    align: 'center',   // Centers legend vertically
                    labels: {
                        boxWidth: 12,
                        padding: 12,
                        font: { size: 12 }
                    }
                }
            }
        }
    });

    // --- CHART 3: MULTI-LINE MASTER GRAPH ---
    const ctx3 = document.getElementById('chart3');
    
    // 1. Create a unique list of Year-Month labels (using only one site's data to avoid duplicates)
    const labels = apiData.master_graph
        .filter(item => item.site_id === 1)
        .map(item => `${item.month_name} ${item.year}`);

    // 2. Helper function to extract data for a specific site
    const getSiteData = (id) => apiData.master_graph
        .filter(item => item.site_id === id)
        .map(item => item.contribution_index);

    chart3Instance = new Chart(ctx3, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Heritage Centre', data: getSiteData(1), borderColor: '#366d75', tension: 0.3, fill: false },
                { label: 'Stadium Merdeka', data: getSiteData(2), borderColor: '#68d3d8', tension: 0.3, fill: false },
                { label: 'Suffolk House',   data: getSiteData(3), borderColor: '#4a6fa5', tension: 0.3, fill: false },
                { label: 'No. 8 Heeren Street', data: getSiteData(4), borderColor: '#f4d35e', tension: 0.3, fill: false },
                { label: 'Rumah Penghulu Abu Seman', data: getSiteData(5), borderColor: '#ee964b', tension: 0.3, fill: false }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'CONTRIBUTION INDEX BY CULTURAL SITE' },
                legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } }
            },
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Index Score' } }
            }
        }
    });

}

function renderSiteCharts(apiData, siteKey) {
    if (chart1Instance) chart1Instance.destroy();
    if (chart2Instance) chart2Instance.destroy();
    if (chart3Instance) chart3Instance.destroy();

    const labels = apiData.charts.map(m => `${m.month_name} ${m.year}`);

    // Chart 1: Donations
    chart1Instance = new Chart(document.getElementById('chart1'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{ label: 'Donations', data: apiData.charts.map(d => d.donations), borderColor: '#366d75' }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Chart 2: Volunteers
    chart2Instance = new Chart(document.getElementById('chart2'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{ label: 'Volunteers', data: apiData.charts.map(v => v.volunteers), borderColor: '#68d3d8' }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Chart 3: Sponsorships
    chart3Instance = new Chart(document.getElementById('chart3'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{ label: 'Sponsorships', data: apiData.charts.map(s => s.sponsorships), borderColor: '#4a6fa5' }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// ==========================================
// PART 4: SIDEBAR INTERACTION
// ==========================================
function updateDashboard(siteKey) {
    document.querySelectorAll('.site-box').forEach(el => el.classList.remove('active'));
    // Find the box that was clicked and add active class
    const clickedBox = document.querySelector(`.site-box[onclick*="${siteKey}"]`);
    if (clickedBox) clickedBox.classList.add('active');

    fetchAndRender(siteKey);
}

function showOverview() {
    document.querySelectorAll('.site-box').forEach(el => el.classList.remove('active'));
    // Add active class to BWM box when showing overview
    const bwmBox = document.querySelector('.new-site');
    if (bwmBox) bwmBox.classList.add('active');
    
    fetchAndRender();
}