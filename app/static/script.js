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

// Global variables for date selection
let selectedYear = null;
let selectedMonth = null;
let latestAvailableYear = 0;
let latestAvailableMonth = 0;
let isDateSelectorOpen = false;
let isInitialLoad = true; // Flag to track first page load
let currentDemoFilter = 'age'; // Track current demographic filter
let currentSiteKey = null; // Track which site page is currently being viewed
const availableYears = [2021, 2022, 2023, 2024, 2025];
const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
let chart3ActiveDataIndex = -1;
let chart3AllData = [];
let chart3IsLongClickActive = false;
let chart3LongClickTimer = null;

// Site chart long-press tracking
let siteChartActiveIndex = { chart1: -1, chart2: -1, chart3: -1 };
let siteChartLongClickActive = { chart1: false, chart2: false, chart3: false };
let siteChartLongClickTimer = { chart1: null, chart2: null, chart3: null };
let siteChartData = { chart1: [], chart2: [], chart3: [] };

// Default Chart.js events snapshot for restore
const chartDefaultEvents = (typeof Chart !== 'undefined' && Chart.defaults && Array.isArray(Chart.defaults.events))
    ? [...Chart.defaults.events]
    : ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove', 'touchend'];

// Global synchronized line state for site charts
let syncedLineIndex = -1; // Shared index across all 3 charts
let syncedLineOpacity = 1; // For fade-out effect
let fadeOutInterval = null; // Animation interval

document.addEventListener("DOMContentLoaded", function () {
    // Ensure the BWM box is active on initial load
    const bwmBox = document.querySelector('.new-site');
    if (bwmBox) {
        bwmBox.classList.add('active');
    }
    
    // Initial load: BWM Overview
    currentSiteKey = null; // Start in overview mode
    fetchAndRender();
    isInitialLoad = false; // Mark initial load complete after first fetch

    // Listen for Demographic Filter changes (Age/Gender)
    const dropdown = document.getElementById('demographicFilter');
    if (dropdown) {
        dropdown.addEventListener('change', function() {
            updateDemographicChartOnly(this.value);
        });
    }
});

// ==========================================
// PART 2: DATA FETCHING
// ==========================================
async function fetchAndRender(siteKey = null, demoFilter = null) {
    // Use provided demoFilter or fall back to currentDemoFilter
    const filterToUse = demoFilter || currentDemoFilter;
    
    let url = `/api/data?demo_filter=${filterToUse}`;
    const siteId = siteKey ? siteIdMap[siteKey] : null;

    if (siteId) url += `&site_id=${siteId}`;

    // Always pass the selected period so backend can align responses for overview and site views
    if (selectedYear && selectedMonth) {
        url += `&year=${selectedYear}&month=${selectedMonth}`;
    }

    try {
        const response = await fetch(url);
        const result = await response.json();

        if (result.status === "success") {
            const apiData = result.data;

            // 1. Update Top KPI Cards
            updateKPICards(apiData.kpis, apiData.view);

            // 2. Update data period display
            updateDataPeriod(apiData, siteKey);

            // 3. Render Charts based on View
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

// Update only the demographic chart when filter changes
async function updateDemographicChartOnly(demoFilter) {
    // Store the current filter
    currentDemoFilter = demoFilter;
    
    try {
        const params = new URLSearchParams({ demo_filter: demoFilter });
        if (selectedYear && selectedMonth) {
            params.append('year', selectedYear);
            params.append('month', selectedMonth);
        }

        const response = await fetch(`/api/data?${params.toString()}`);
        const result = await response.json();

        if (result.status === "success") {
            const apiData = result.data;
            
            // Only update chart 2 (demographics doughnut)
            if (chart2Instance) chart2Instance.destroy();
            
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
                            position: 'right',
                            align: 'center',
                            labels: {
                                boxWidth: 12,
                                padding: 12,
                                font: { size: 12 }
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error("Error updating demographic chart:", error);
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

function updateDataPeriod(apiData, siteKey) {
    // Extract the true database maximum (this is the upper limit for date selection)
    let dbMaxYear = apiData.latest_year || null;
    let dbMaxMonth = apiData.latest_month || null;

    // Fall back to the dataset if the API did not provide explicit latest values
    if (!dbMaxYear || !dbMaxMonth) {
        if (siteKey) {
            if (apiData.charts && apiData.charts.length > 0) {
                const lastChart = apiData.charts[apiData.charts.length - 1];
                dbMaxYear = dbMaxYear || lastChart.year;
                dbMaxMonth = dbMaxMonth || lastChart.month_num;
            }
        } else if (apiData.master_graph && apiData.master_graph.length > 0) {
            const lastData = apiData.master_graph[apiData.master_graph.length - 1];
            dbMaxYear = dbMaxYear || lastData.year;
            dbMaxMonth = dbMaxMonth || lastData.month_num;
        }
    }

    // ONLY update the global max if we got a valid value (this should stay constant)
    if (dbMaxYear && dbMaxMonth && (latestAvailableYear === 0 || latestAvailableMonth === 0)) {
        latestAvailableYear = dbMaxYear;
        latestAvailableMonth = dbMaxMonth;
    }

    if (!selectedYear || !selectedMonth) {
        selectedYear = latestAvailableYear;
        selectedMonth = latestAvailableMonth;
    }

    if (!selectedYear || !selectedMonth) return;

    // Update the header with the latest period
    const dataPeriodElement = document.getElementById('dataPeriod');
    if (dataPeriodElement && selectedMonth && selectedYear) {
        // Always render with arrows (hidden by default)
        const currentMonthName = monthNames[selectedMonth - 1];
        const selectorHTML = `
            <span class="latest-label">Latest:</span>
            <div class="date-value-container">
                <div class="month-control">
                    <button class="date-arrow up-arrow" onclick="changeMonth(-1); event.stopPropagation();">▲</button>
                    <span class="date-value">${currentMonthName}</span>
                    <button class="date-arrow down-arrow" onclick="changeMonth(1); event.stopPropagation();">▼</button>
                </div>
                <div class="year-control">
                    <button class="date-arrow up-arrow" onclick="changeYear(-1); event.stopPropagation();">▲</button>
                    <span class="date-value">${selectedYear}</span>
                    <button class="date-arrow down-arrow" onclick="changeYear(1); event.stopPropagation();">▼</button>
                </div>
            </div>
        `;
        dataPeriodElement.innerHTML = selectorHTML;
        
        // Make it interactive for all pages (overview and site views)
        dataPeriodElement.style.cursor = 'pointer';
        // Remove old event listeners to prevent duplicates
        dataPeriodElement.removeEventListener('mouseenter', showArrows);
        dataPeriodElement.removeEventListener('mouseleave', hideArrows);
        // Add new event listeners
        dataPeriodElement.addEventListener('mouseenter', showArrows);
        dataPeriodElement.addEventListener('mouseleave', hideArrows);
    }
}

// Show arrows on hover
function showArrows() {
    const arrows = document.querySelectorAll('#dataPeriod .date-arrow');
    arrows.forEach(arrow => {
        arrow.style.opacity = '1';
        arrow.style.pointerEvents = 'auto';
    });
}

// Hide arrows on mouse leave
function hideArrows() {
    const arrows = document.querySelectorAll('#dataPeriod .date-arrow');
    arrows.forEach(arrow => {
        arrow.style.opacity = '0';
        arrow.style.pointerEvents = 'none';
    });
}

// Change year (no looping, just increment/decrement)
function changeYear(direction) {
    const newYear = selectedYear + direction;
    const newMonth = selectedMonth;
    
    // Check if the new date would exceed the latest available date
    if (direction > 0) { // Going forward
        if (newYear > latestAvailableYear) return; // Can't go beyond latest year
        if (newYear === latestAvailableYear && newMonth > latestAvailableMonth) return; // Can't go beyond latest month in latest year
    }
    
    // Check if going back before 2021
    if (newYear < 2021) return;
    
    selectedYear = newYear;
    updateDateSelectorDisplay();
    fetchDataForSelectedDate();
}

// Change month (with looping)
function changeMonth(direction) {
    let newMonth = selectedMonth + direction;
    let newYear = selectedYear;
    
    // Handle month wrapping
    if (newMonth > 12) {
        newMonth = 1;
        newYear += 1;
    } else if (newMonth < 1) {
        newMonth = 12;
        newYear -= 1;
    }
    
    // Check if the new date would exceed the latest available date
    if (newYear > latestAvailableYear) return; // Can't go beyond latest year
    if (newYear === latestAvailableYear && newMonth > latestAvailableMonth) return; // Can't go beyond latest month
    
    // Check if going back before 2021
    if (newYear < 2021) return;
    
    selectedMonth = newMonth;
    selectedYear = newYear;
    updateDateSelectorDisplay();
    fetchDataForSelectedDate();
}

// Update date selector display
function updateDateSelectorDisplay() {
    const currentMonthName = monthNames[selectedMonth - 1];
    const dataPeriodElement = document.getElementById('dataPeriod');
    
    const selectorHTML = `
        <span class="latest-label">Latest:</span>
        <div class="date-value-container">
            <div class="month-control">
                <button class="date-arrow up-arrow" onclick="changeMonth(-1); event.stopPropagation();">▲</button>
                <span class="date-value">${currentMonthName}</span>
                <button class="date-arrow down-arrow" onclick="changeMonth(1); event.stopPropagation();">▼</button>
            </div>
            <div class="year-control">
                <button class="date-arrow up-arrow" onclick="changeYear(-1); event.stopPropagation();">▲</button>
                <span class="date-value">${selectedYear}</span>
                <button class="date-arrow down-arrow" onclick="changeYear(1); event.stopPropagation();">▼</button>
            </div>
        </div>
    `;
    
    dataPeriodElement.innerHTML = selectorHTML;
}

// Fetch data for selected date
async function fetchDataForSelectedDate() {
    try {
        if (!selectedYear || !selectedMonth) {
            selectedYear = latestAvailableYear;
            selectedMonth = latestAvailableMonth;
        }
        if (!selectedYear || !selectedMonth) return;

        // Build URL based on current view (site or overview)
        let url = `/api/data?year=${selectedYear}&month=${selectedMonth}&demo_filter=${currentDemoFilter}`;
        if (currentSiteKey) {
            const siteId = siteIdMap[currentSiteKey];
            url += `&site_id=${siteId}`;
        }
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.status === "success") {
            const apiData = result.data;
            
            // Update KPI cards with appropriate view type
            updateKPICards(apiData.kpis, currentSiteKey ? 'site' : 'overview');
            
            // Update based on current view
            if (currentSiteKey) {
                // Update site charts
                renderSiteCharts(apiData, currentSiteKey);
            } else {
                // Update all overview charts (membership, demographics, and master graph)
                renderOverviewCharts(apiData);
            }
        }
    } catch (error) {
        console.error("Error fetching data for selected date:", error);
    }
}

// Update master graph with date filtering
function updateMasterGraphWithDateFilter(masterGraphData) {
    // Backend already filters data to selectedYear/selectedMonth
    // Just re-render chart3 with the filtered data
    
    if (chart3Instance) chart3Instance.destroy();
    renderChart3Helper(masterGraphData);
}

// ==========================================
// PART 3: CHART RENDERING
// ==========================================

// Helper function to render Chart 3 (can be called from anywhere)
function renderChart3Helper(masterGraphData) {
    const ctx3 = document.getElementById('chart3');
    if (!ctx3) return;
    
    if (chart3Instance) chart3Instance.destroy();
    
    // Create labels and data from filtered masterGraphData
    const allData = masterGraphData.filter(item => item.site_id === 1);
    const labels = [];
    
    allData.forEach((item) => {
        labels.push(item.month_num === 1 ? item.year : '');
    });

    // Helper function to extract data for a specific site (all monthly data)
    const getSiteData = (id) => masterGraphData
        .filter(item => item.site_id === id)
        .map(item => item.contribution_index);

    // Custom plugin for vertical lines (bold for January, subtle for other months)
    const verticalLinePlugin = {
        id: 'verticalLinePlugin',
        afterDatasetsDraw: (chart) => {
            const ctx = chart.ctx;
            const xAxis = chart.scales.x;
            const yAxis = chart.scales.y;
            
            // Draw grid lines for all data points
            allData.forEach((item, index) => {
                const x = xAxis.getPixelForValue(index);
                
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(x, yAxis.top);
                ctx.lineTo(x, yAxis.bottom);
                
                // Bold line for January (month_num === 1), subtle for other months
                if (item.month_num === 1) {
                    ctx.lineWidth = 1.5;
                    ctx.strokeStyle = 'rgba(120, 120, 120, 0.7)';
                } else {
                    ctx.lineWidth = 0.8;
                    ctx.strokeStyle = 'rgba(150, 150, 150, 0.2)';
                }
                ctx.setLineDash([]);
                ctx.stroke();
                ctx.restore();
            });
            
            // Draw the interactive vertical line when user long-clicks (use global variable)
            if (chart3IsLongClickActive && chart3ActiveDataIndex !== null && chart3ActiveDataIndex !== -1) {
                const x = xAxis.getPixelForValue(chart3ActiveDataIndex);
                
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(x, yAxis.top);
                ctx.lineTo(x, yAxis.bottom);
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'rgba(0, 102, 102, 0.6)';
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.restore();
            }
        }
    };

    chart3Instance = new Chart(ctx3, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Heritage Centre', data: getSiteData(1), borderColor: '#366d75', tension: 0.3, fill: false, pointRadius: 3, pointHoverRadius: 5 },
                { label: 'Stadium Merdeka', data: getSiteData(2), borderColor: '#68d3d8', tension: 0.3, fill: false, pointRadius: 3, pointHoverRadius: 5 },
                { label: 'Suffolk House',   data: getSiteData(3), borderColor: '#4a6fa5', tension: 0.3, fill: false, pointRadius: 3, pointHoverRadius: 5 },
                { label: 'No. 8 Heeren Street', data: getSiteData(4), borderColor: '#f4d35e', tension: 0.3, fill: false, pointRadius: 3, pointHoverRadius: 5 },
                { label: 'Rumah Penghulu Abu Seman', data: getSiteData(5), borderColor: '#ee964b', tension: 0.3, fill: false, pointRadius: 3, pointHoverRadius: 5 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'point',
                intersect: true
            },
            plugins: {
                title: { display: true, text: 'CONTRIBUTION INDEX BY MONTH AND YEAR' },
                legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } },
                tooltip: {
                    enabled: true,
                    mode: 'point',
                    intersect: true,
                    backgroundColor: 'rgba(0, 51, 77, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#006666',
                    borderWidth: 2,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        title: (tooltipItems) => {
                            if (tooltipItems.length > 0) {
                                const dataIndex = tooltipItems[0].dataIndex;
                                if (allData[dataIndex]) {
                                    return `${allData[dataIndex].month_name} ${allData[dataIndex].year}`;
                                }
                            }
                            return '';
                        },
                        label: (context) => {
                            const value = context.parsed.y;
                            if (value !== null && value !== undefined) {
                                return `${context.dataset.label}: ${value.toFixed(2)}`;
                            }
                            return `${context.dataset.label}: N/A`;
                        },
                        // Add footer to show instruction in normal mode
                        footer: (tooltipItems) => {
                            if (!chart3IsLongClickActive && tooltipItems.length > 0) {
                                return 'Long-press to see all sites';
                            }
                            return '';
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        drawOnChartArea: false,
                        drawBorder: false
                    }
                },
                y: { 
                    beginAtZero: true, 
                    title: { display: true, text: 'Contribution Index (0.00 - 1.00)' },
                    grid: {
                        color: 'rgba(200, 200, 200, 0.5)',
                        drawBorder: false
                    }
                }
            }
        },
        plugins: [verticalLinePlugin]
    });
    
    // Store for use in event handlers
    chart3AllData = allData;
    
    // Setup long-click event listeners for the canvas
    setupChart3LongClickListeners();
}

// Setup long-click event listeners for Chart 3
function setupChart3LongClickListeners() {
    const canvas = document.getElementById('chart3');
    if (!canvas) return;
    
    let previousActiveIndex = null;
    
    canvas.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        
        chart3LongClickTimer = setTimeout(() => {
            chart3IsLongClickActive = true;
            canvas.style.cursor = 'crosshair';
            
            // Switch tooltip to index mode
            chart3Instance.options.interaction.mode = 'index';
            chart3Instance.options.interaction.intersect = false;
            chart3Instance.options.plugins.tooltip.mode = 'index';
            chart3Instance.options.plugins.tooltip.intersect = false;
            
            const points = chart3Instance.getElementsAtEventForMode(e, 'index', { intersect: false }, true);
            
            if (points.length) {
                chart3ActiveDataIndex = points[0].index;
                previousActiveIndex = chart3ActiveDataIndex;
                
                const activeElements = chart3Instance.data.datasets.map((dataset, datasetIndex) => ({
                    datasetIndex: datasetIndex,
                    index: chart3ActiveDataIndex
                }));
                
                chart3Instance.setActiveElements(activeElements);
                chart3Instance.tooltip.setActiveElements(activeElements, { x: e.offsetX, y: e.offsetY });
                chart3Instance.tooltip.options.enabled = true;
                chart3Instance.update('none');
            }
        }, 500);
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (chart3IsLongClickActive) {
            const points = chart3Instance.getElementsAtEventForMode(e, 'index', { intersect: false }, true);
            
            if (points.length > 0) {
                const newActiveIndex = points[0].index;
                
                if (newActiveIndex !== previousActiveIndex) {
                    chart3ActiveDataIndex = newActiveIndex;
                    previousActiveIndex = newActiveIndex;
                    
                    const activeElements = chart3Instance.data.datasets.map((dataset, datasetIndex) => ({
                        datasetIndex: datasetIndex,
                        index: chart3ActiveDataIndex
                    }));
                    
                    chart3Instance.setActiveElements(activeElements);
                    chart3Instance.tooltip.setActiveElements(activeElements, { x: e.offsetX, y: e.offsetY });
                    chart3Instance.update('none');
                } else {
                    chart3Instance.tooltip.setActiveElements(
                        chart3Instance.tooltip.getActiveElements(),
                        { x: e.offsetX, y: e.offsetY }
                    );
                }
            }
        }
    });
    
    canvas.addEventListener('mouseup', () => {
        clearTimeout(chart3LongClickTimer);
        
        if (chart3IsLongClickActive) {
            chart3ActiveDataIndex = null;
            previousActiveIndex = null;
            chart3IsLongClickActive = false;
            canvas.style.cursor = 'default';
            
            chart3Instance.options.interaction.mode = 'point';
            chart3Instance.options.interaction.intersect = true;
            chart3Instance.options.plugins.tooltip.mode = 'point';
            chart3Instance.options.plugins.tooltip.intersect = true;
            
            chart3Instance.setActiveElements([]);
            chart3Instance.tooltip.setActiveElements([], { x: 0, y: 0 });
            chart3Instance.update();
        }
    });
    
    canvas.addEventListener('mouseleave', () => {
        clearTimeout(chart3LongClickTimer);
        if (chart3IsLongClickActive) {
            chart3ActiveDataIndex = null;
            previousActiveIndex = null;
            chart3IsLongClickActive = false;
            canvas.style.cursor = 'default';
            
            chart3Instance.options.interaction.mode = 'point';
            chart3Instance.options.interaction.intersect = true;
            chart3Instance.options.plugins.tooltip.mode = 'point';
            chart3Instance.options.plugins.tooltip.intersect = true;
            
            chart3Instance.setActiveElements([]);
            chart3Instance.tooltip.setActiveElements([], { x: 0, y: 0 });
            chart3Instance.update();
        }
    });
    
    // Touch support
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        
        chart3LongClickTimer = setTimeout(() => {
            chart3IsLongClickActive = true;
            
            chart3Instance.options.interaction.mode = 'index';
            chart3Instance.options.interaction.intersect = false;
            chart3Instance.options.plugins.tooltip.mode = 'index';
            chart3Instance.options.plugins.tooltip.intersect = false;
            
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            const points = chart3Instance.getElementsAtEventForMode(
                { x, y, native: e },
                'index',
                { intersect: false },
                true
            );
            
            if (points.length) {
                chart3ActiveDataIndex = points[0].index;
                previousActiveIndex = chart3ActiveDataIndex;
                
                const activeElements = chart3Instance.data.datasets.map((dataset, datasetIndex) => ({
                    datasetIndex: datasetIndex,
                    index: chart3ActiveDataIndex
                }));
                
                chart3Instance.setActiveElements(activeElements);
                chart3Instance.tooltip.setActiveElements(activeElements, { x, y });
                chart3Instance.tooltip.options.enabled = true;
                chart3Instance.update('none');
            }
        }, 500);
    });
    
    canvas.addEventListener('touchmove', (e) => {
        if (chart3IsLongClickActive) {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            const points = chart3Instance.getElementsAtEventForMode(
                { x, y, native: e },
                'index',
                { intersect: false },
                true
            );
            
            if (points.length) {
                const newActiveIndex = points[0].index;
                
                if (newActiveIndex !== previousActiveIndex) {
                    chart3ActiveDataIndex = newActiveIndex;
                    previousActiveIndex = newActiveIndex;
                    
                    const activeElements = chart3Instance.data.datasets.map((dataset, datasetIndex) => ({
                        datasetIndex: datasetIndex,
                        index: chart3ActiveDataIndex
                    }));
                    
                    chart3Instance.setActiveElements(activeElements);
                    chart3Instance.tooltip.setActiveElements(activeElements, { x, y });
                    chart3Instance.update('none');
                } else {
                    chart3Instance.tooltip.setActiveElements(
                        chart3Instance.tooltip.getActiveElements(),
                        { x, y }
                    );
                }
            }
        } else {
            clearTimeout(chart3LongClickTimer);
        }
    });
    
    canvas.addEventListener('touchend', () => {
        clearTimeout(chart3LongClickTimer);
        if (chart3IsLongClickActive) {
            chart3ActiveDataIndex = null;
            previousActiveIndex = null;
            chart3IsLongClickActive = false;
            
            chart3Instance.options.interaction.mode = 'point';
            chart3Instance.options.interaction.intersect = true;
            chart3Instance.options.plugins.tooltip.mode = 'point';
            chart3Instance.options.plugins.tooltip.intersect = true;
            
            chart3Instance.setActiveElements([]);
            chart3Instance.tooltip.setActiveElements([], { x: 0, y: 0 });
            chart3Instance.update();
        }
    });
}

function renderOverviewCharts(apiData) {
    // Cleanup old instances to prevent "ghost" charts
    if (chart1Instance) chart1Instance.destroy();
    if (chart2Instance) chart2Instance.destroy();
    if (chart3Instance) chart3Instance.destroy();

    // --- CHART 1: HORIZONTAL STACKED MEMBERSHIP ---
    const ctx1 = document.getElementById('chart1');
    
    // Backend now handles filtering and aggregation based on latest year/month
    // Just extract years and data from the response
    const years = apiData.membership_chart.map(item => item.year);
    const generalMembersData = apiData.membership_chart.map(item => item.avg_members || 0);
    const councilMembersData = apiData.membership_chart.map(item => item.avg_council || 0);
    
    chart1Instance = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: years,
            datasets: [
                { 
                    label: 'General Members', 
                    data: generalMembersData, 
                    backgroundColor: '#68d3d8' 
                },
                { 
                    label: 'Council Members', 
                    data: councilMembersData, 
                    backgroundColor: '#4a6fa5' 
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { stacked: true }, y: { stacked: true } },
            plugins: { title: { display: true, text: 'AVERAGE ANNUAL MEMBERSHIP COMPOSITION' } }
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
    // Render chart with master graph data
    renderChart3Helper(apiData.master_graph);
}

function renderSiteCharts(apiData, siteKey) {
    if (chart1Instance) chart1Instance.destroy();
    if (chart2Instance) chart2Instance.destroy();
    if (chart3Instance) chart3Instance.destroy();

    // Store chart data for long-press tooltips
    siteChartData.chart1 = apiData.charts;
    siteChartData.chart2 = apiData.charts;
    siteChartData.chart3 = apiData.charts;

    // Create labels showing year for January, empty string for other months
    const labels = [];
    apiData.charts.forEach(m => {
        // Show year only at the start of each year (January)
        if (m.month_name === 'JAN' || labels.length === 0) {
            labels.push(m.year);
        } else {
            labels.push('');
        }
    });

    // Vertical line plugin for site charts
    const createVerticalLinePlugin = (chartKey) => ({
        id: `verticalLinePlugin_${chartKey}`,
        afterDatasetsDraw: (chart) => {
            // Draw line when either the chart is active OR there's a synced line from another chart
            const shouldDrawLine = (siteChartLongClickActive[chartKey] && siteChartActiveIndex[chartKey] !== -1) || 
                                   (syncedLineIndex !== -1 && !siteChartLongClickActive[chartKey]);
            
            if (shouldDrawLine) {
                const ctx = chart.ctx;
                const xAxis = chart.scales.x;
                const yAxis = chart.scales.y;
                
                // Use exact index position for perfect alignment across charts
                const indexToDraw = syncedLineIndex !== -1 ? syncedLineIndex : siteChartActiveIndex[chartKey];
                if (indexToDraw === -1) return;
                const x = xAxis.getPixelForValue(indexToDraw);
                
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(x, yAxis.top);
                ctx.lineTo(x, yAxis.bottom);
                ctx.lineWidth = 2;
                ctx.strokeStyle = `rgba(0, 102, 102, ${0.6 * syncedLineOpacity})`; // Apply opacity
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.restore();
            }
        }
    });

    // Chart 1: Donations
    chart1Instance = new Chart(document.getElementById('chart1'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{ 
                label: 'Donations', 
                data: apiData.charts.map(d => d.donations), 
                borderColor: '#366d75',
                tension: 0.3,
                fill: false,
                pointRadius: 2,
                pointHoverRadius: 4
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            interaction: {
                mode: 'point',
                intersect: true
            },
            plugins: {
                title: { display: true, text: 'DONATIONS OVER TIME' },
                tooltip: {
                    enabled: true,
                    mode: 'point',
                    intersect: true,
                    backgroundColor: 'rgba(0, 51, 77, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#006666',
                    borderWidth: 2,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        title: (tooltipItems) => {
                            if (tooltipItems.length > 0) {
                                const dataIndex = tooltipItems[0].dataIndex;
                                // Try to get data from siteChartData first
                                if (siteChartData.chart1 && siteChartData.chart1[dataIndex]) {
                                    const data = siteChartData.chart1[dataIndex];
                                    return `${data.month_name || 'N/A'} ${data.year || ''}`;
                                }
                                // Fallback to chart label if siteChartData is missing
                                if (chart1Instance && chart1Instance.data && chart1Instance.data.labels && chart1Instance.data.labels[dataIndex]) {
                                    return chart1Instance.data.labels[dataIndex];
                                }
                            }
                            return 'Date';
                        },
                        label: (context) => {
                            const value = context.parsed.y;
                            if (value !== null && value !== undefined) {
                                return `Donations: ${value}`;
                            }
                            return 'Donations: N/A';
                        }
                    }
                }
            },
            scales: {
                y: { beginAtZero: true }
            }
        },
        plugins: [createVerticalLinePlugin('chart1')]
    });

    // Chart 2: Volunteers
    chart2Instance = new Chart(document.getElementById('chart2'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{ 
                label: 'Volunteers', 
                data: apiData.charts.map(v => v.volunteers), 
                borderColor: '#68d3d8',
                tension: 0.3,
                fill: false,
                pointRadius: 2,
                pointHoverRadius: 4
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            interaction: {
                mode: 'point',
                intersect: true
            },
            plugins: {
                title: { display: true, text: 'VOLUNTEERS OVER TIME' },
                tooltip: {
                    enabled: true,
                    mode: 'point',
                    intersect: true,
                    backgroundColor: 'rgba(0, 51, 77, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#006666',
                    borderWidth: 2,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        title: (tooltipItems) => {
                            if (tooltipItems.length > 0) {
                                const dataIndex = tooltipItems[0].dataIndex;
                                // Try to get data from siteChartData first
                                if (siteChartData.chart2 && siteChartData.chart2[dataIndex]) {
                                    const data = siteChartData.chart2[dataIndex];
                                    return `${data.month_name || 'N/A'} ${data.year || ''}`;
                                }
                                // Fallback to chart label if siteChartData is missing
                                if (chart2Instance && chart2Instance.data && chart2Instance.data.labels && chart2Instance.data.labels[dataIndex]) {
                                    return chart2Instance.data.labels[dataIndex];
                                }
                            }
                            return 'Date';
                        },
                        label: (context) => {
                            const value = context.parsed.y;
                            if (value !== null && value !== undefined) {
                                return `Volunteers: ${value}`;
                            }
                            return 'Volunteers: N/A';
                        }
                    }
                }
            },
            scales: {
                y: { beginAtZero: true }
            }
        },
        plugins: [createVerticalLinePlugin('chart2')]
    });

    // Chart 3: Sponsorships
    chart3Instance = new Chart(document.getElementById('chart3'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{ 
                label: 'Sponsorships', 
                data: apiData.charts.map(s => s.sponsorships), 
                borderColor: '#4a6fa5',
                tension: 0.3,
                fill: false,
                pointRadius: 2,
                pointHoverRadius: 4
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            interaction: {
                mode: 'point',
                intersect: true
            },
            plugins: {
                title: { display: true, text: 'SPONSORSHIPS OVER TIME' },
                tooltip: {
                    enabled: true,
                    mode: 'point',
                    intersect: true,
                    backgroundColor: 'rgba(0, 51, 77, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#006666',
                    borderWidth: 2,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        title: (tooltipItems) => {
                            if (tooltipItems.length > 0) {
                                const dataIndex = tooltipItems[0].dataIndex;
                                // Try to get data from siteChartData first
                                if (siteChartData.chart3 && siteChartData.chart3[dataIndex]) {
                                    const data = siteChartData.chart3[dataIndex];
                                    return `${data.month_name || 'N/A'} ${data.year || ''}`;
                                }
                                // Fallback to chart label if siteChartData is missing
                                if (chart3Instance && chart3Instance.data && chart3Instance.data.labels && chart3Instance.data.labels[dataIndex]) {
                                    return chart3Instance.data.labels[dataIndex];
                                }
                            }
                            return 'Date';
                        },
                        label: (context) => {
                            const value = context.parsed.y;
                            if (value !== null && value !== undefined) {
                                return `Sponsorships: ${value}`;
                            }
                            return 'Sponsorships: N/A';
                        }
                    }
                }
            },
            scales: {
                y: { beginAtZero: true }
            }
        },
        plugins: [createVerticalLinePlugin('chart3')]
    });

    // Setup long-press listeners for all site charts
    setupSiteChartLongPress('chart1', chart1Instance);
    setupSiteChartLongPress('chart2', chart2Instance);
    setupSiteChartLongPress('chart3', chart3Instance);
}

// Build safe active elements for a chart, clamping index to available data
function buildActiveElementsForChart(chart, sharedIndex) {
    if (!chart || !chart.data || !chart.data.datasets || chart.data.datasets.length === 0) return [];
    const labelsLen = Array.isArray(chart.data.labels) ? chart.data.labels.length : 0;
    const dataLen = chart.data.datasets[0].data ? chart.data.datasets[0].data.length : 0;
    const maxIndex = Math.max(labelsLen - 1, dataLen - 1);
    if (maxIndex < 0) return [];
    const clampedIndex = Math.min(Math.max(sharedIndex, 0), maxIndex);
    return [{ datasetIndex: 0, index: clampedIndex }];
}

// Helper functions for managing all 3 site charts
function setActiveElementsOnAllCharts(activeElements) {
    if (chart1Instance) {
        const elems = buildActiveElementsForChart(chart1Instance, activeElements[0].index);
        chart1Instance.setActiveElements(elems);
        chart1Instance.tooltip.options.enabled = true;
        chart1Instance.tooltip.setActiveElements(elems);
    }
    if (chart2Instance) {
        const elems = buildActiveElementsForChart(chart2Instance, activeElements[0].index);
        chart2Instance.setActiveElements(elems);
        chart2Instance.tooltip.options.enabled = true;
        chart2Instance.tooltip.setActiveElements(elems);
    }
    if (chart3Instance) {
        const elems = buildActiveElementsForChart(chart3Instance, activeElements[0].index);
        chart3Instance.setActiveElements(elems);
        chart3Instance.tooltip.options.enabled = true;
        chart3Instance.tooltip.setActiveElements(elems);
    }
}

function updateAllCharts(mode = '') {
    if (chart1Instance) {
        chart1Instance.update(mode || undefined);
        // Always show tooltip if there are active elements
        if (chart1Instance.getActiveElements && chart1Instance.getActiveElements().length > 0) {
            chart1Instance.tooltip.setActiveElements(chart1Instance.getActiveElements());
            chart1Instance.draw();
        }
    }
    if (chart2Instance) {
        chart2Instance.update(mode || undefined);
        // Always show tooltip if there are active elements
        if (chart2Instance.getActiveElements && chart2Instance.getActiveElements().length > 0) {
            chart2Instance.tooltip.setActiveElements(chart2Instance.getActiveElements());
            chart2Instance.draw();
        }
    }
    if (chart3Instance) {
        chart3Instance.update(mode || undefined);
        // Always show tooltip if there are active elements
        if (chart3Instance.getActiveElements && chart3Instance.getActiveElements().length > 0) {
            chart3Instance.tooltip.setActiveElements(chart3Instance.getActiveElements());
            chart3Instance.draw();
        }
    }
}

// Helper to update tooltip positions on all charts without redrawing (smooth cursor tracking)
function updateTooltipPositionsOnAllCharts() {
    if (chart1Instance && chart1Instance.getActiveElements && chart1Instance.getActiveElements().length > 0) {
        const activeElements = chart1Instance.getActiveElements();
        chart1Instance.tooltip.setActiveElements(activeElements);
        chart1Instance.draw();
    }
    if (chart2Instance && chart2Instance.getActiveElements && chart2Instance.getActiveElements().length > 0) {
        const activeElements = chart2Instance.getActiveElements();
        chart2Instance.tooltip.setActiveElements(activeElements);
        chart2Instance.draw();
    }
    if (chart3Instance && chart3Instance.getActiveElements && chart3Instance.getActiveElements().length > 0) {
        const activeElements = chart3Instance.getActiveElements();
        chart3Instance.tooltip.setActiveElements(activeElements);
        chart3Instance.draw();
    }
}

function clearAllChartsActiveElements() {
    if (chart1Instance) {
        chart1Instance.setActiveElements([]);
        chart1Instance.tooltip.setActiveElements([], { x: 0, y: 0 });
        chart1Instance.draw();
    }
    if (chart2Instance) {
        chart2Instance.setActiveElements([]);
        chart2Instance.tooltip.setActiveElements([], { x: 0, y: 0 });
        chart2Instance.draw();
    }
    if (chart3Instance) {
        chart3Instance.setActiveElements([]);
        chart3Instance.tooltip.setActiveElements([], { x: 0, y: 0 });
        chart3Instance.draw();
    }
}

// Helper function to start fade-out animation
function startLinesFadeOut() {
    // Clear any existing fade-out animation
    if (fadeOutInterval) clearInterval(fadeOutInterval);
    
    syncedLineOpacity = 1;
    const fadeOutDuration = 300; // milliseconds
    const steps = 30;
    const stepDuration = fadeOutDuration / steps;
    let currentStep = 0;
    
    fadeOutInterval = setInterval(() => {
        currentStep++;
        syncedLineOpacity = 1 - (currentStep / steps);
        
        // Update all 3 charts
        if (chart1Instance) chart1Instance.update();
        if (chart2Instance) chart2Instance.update();
        if (chart3Instance) chart3Instance.update();
        
        if (currentStep >= steps) {
            clearInterval(fadeOutInterval);
            fadeOutInterval = null;
            syncedLineIndex = -1;
            syncedLineOpacity = 1;
            
            // Clear tooltips completely when line fades out
            clearAllChartsActiveElements();
            
            // Final update to clear the line completely
            if (chart1Instance) chart1Instance.update();
            if (chart2Instance) chart2Instance.update();
            if (chart3Instance) chart3Instance.update();
        }
    }, stepDuration);
}

// Setup long-press event listeners for site charts
function setupSiteChartLongPress(chartKey, chartInstance) {
    const canvasId = chartKey;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    let previousActiveIndex = null;
    
    canvas.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        
        // Clear any fade-out animation when starting a new press
        if (fadeOutInterval) {
            clearInterval(fadeOutInterval);
            fadeOutInterval = null;
        }
        syncedLineOpacity = 1;
        
        siteChartLongClickTimer[chartKey] = setTimeout(() => {
            siteChartLongClickActive[chartKey] = true;
            canvas.style.cursor = 'crosshair';
            setSiteChartsPressMode(true); // disable events + force index mode
            
            const points = chartInstance.getElementsAtEventForMode(e, 'index', { intersect: false }, true);
            
            if (points.length) {
                siteChartActiveIndex[chartKey] = points[0].index;
                syncedLineIndex = points[0].index; // Sync across all charts
                previousActiveIndex = syncedLineIndex;
                
                const activeElements = [{ datasetIndex: 0, index: syncedLineIndex }];
                setActiveElementsOnAllCharts(activeElements);
                updateAllCharts('none');
            }
        }, 500);
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (siteChartLongClickActive[chartKey]) {
            const points = chartInstance.getElementsAtEventForMode(e, 'index', { intersect: false }, true);
            
            if (points.length > 0) {
                const newActiveIndex = points[0].index;
                
                if (newActiveIndex !== previousActiveIndex) {
                    // Index changed - update all charts with new data
                    siteChartActiveIndex[chartKey] = newActiveIndex;
                    syncedLineIndex = newActiveIndex; // Sync across all charts
                    previousActiveIndex = newActiveIndex;
                    
                    const activeElements = [{ datasetIndex: 0, index: syncedLineIndex }];
                    setActiveElementsOnAllCharts(activeElements);
                    updateAllCharts('none');
                } else {
                    // Index same - just update tooltip position for smooth cursor tracking
                    updateTooltipPositionsOnAllCharts();
                }
            } else {
                // No point under cursor: keep showing current info while pressed
                updateTooltipPositionsOnAllCharts();
            }
        }
    });
    
    canvas.addEventListener('mouseup', () => {
        clearTimeout(siteChartLongClickTimer[chartKey]);
        
        if (siteChartLongClickActive[chartKey]) {
            siteChartActiveIndex[chartKey] = -1;
            siteChartLongClickActive[chartKey] = false;
            canvas.style.cursor = 'default';
            
            // Reset interaction mode and events back to defaults
            setSiteChartsPressMode(false);
            
            // Clear tooltips on ALL 3 charts
            clearAllChartsActiveElements();

            // Start fade-out animation for the line
            startLinesFadeOut();
        }
    });
    
    canvas.addEventListener('mouseleave', () => {
        clearTimeout(siteChartLongClickTimer[chartKey]);
        if (siteChartLongClickActive[chartKey]) {
            siteChartActiveIndex[chartKey] = -1;
            siteChartLongClickActive[chartKey] = false;
            canvas.style.cursor = 'default';
            
            // Reset interaction mode and events back to defaults
            setSiteChartsPressMode(false);
            
            // Clear tooltips on ALL 3 charts
            clearAllChartsActiveElements();
            
            // Start fade-out animation for the line
            startLinesFadeOut();
        }
    });
    
    // Touch support
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        
        // Clear any fade-out animation when starting a new press
        if (fadeOutInterval) {
            clearInterval(fadeOutInterval);
            fadeOutInterval = null;
        }
            syncedLineOpacity = 1;
        
        siteChartLongClickTimer[chartKey] = setTimeout(() => {
            siteChartLongClickActive[chartKey] = true;
            
            // Disable hover events and force index mode during long press
            setSiteChartsPressMode(true);
            
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            const points = chartInstance.getElementsAtEventForMode(
                { x, y, native: e },
                'index',
                { intersect: false },
                true
            );
            
            if (points.length) {
                siteChartActiveIndex[chartKey] = points[0].index;
                syncedLineIndex = points[0].index; // Sync across all charts
                previousActiveIndex = syncedLineIndex;
                // Normalized position not needed when syncing by index
                
                const activeElements = [{ datasetIndex: 0, index: syncedLineIndex }];
                setActiveElementsOnAllCharts(activeElements);
                updateAllCharts('none');
            }
        }, 500);
    });
    
    canvas.addEventListener('touchmove', (e) => {
        if (siteChartLongClickActive[chartKey]) {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            const points = chartInstance.getElementsAtEventForMode(
                { x, y, native: e },
                'index',
                { intersect: false },
                true
            );
            
            if (points.length) {
                const newActiveIndex = points[0].index;
                
                if (newActiveIndex !== previousActiveIndex) {
                    // Index changed - update all charts with new data
                    siteChartActiveIndex[chartKey] = newActiveIndex;
                    syncedLineIndex = newActiveIndex; // Sync across all charts
                    previousActiveIndex = newActiveIndex;
                    // Syncing purely by index
                    
                    const activeElements = [{ datasetIndex: 0, index: syncedLineIndex }];
                    setActiveElementsOnAllCharts(activeElements);
                    updateAllCharts('none');
                } else {
                    // Index same - just update tooltip position for smooth cursor tracking
                    updateTooltipPositionsOnAllCharts();
                }
            } else {
                // No point under finger: keep showing current info while pressed
                updateTooltipPositionsOnAllCharts();
            }
        } else {
            clearTimeout(siteChartLongClickTimer[chartKey]);
        }
    });
    
    canvas.addEventListener('touchend', () => {
        clearTimeout(siteChartLongClickTimer[chartKey]);
        if (siteChartLongClickActive[chartKey]) {
            siteChartActiveIndex[chartKey] = -1;
            siteChartLongClickActive[chartKey] = false;
            
            // Reset interaction mode and events back to defaults
            setSiteChartsPressMode(false);
            
            // Clear tooltips on ALL 3 charts
            clearAllChartsActiveElements();
            
            // Start fade-out animation for the line
            startLinesFadeOut();
        }
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
    
    // Update current site tracking
    currentSiteKey = siteKey;

    fetchAndRender(siteKey);
}

function showOverview() {
    document.querySelectorAll('.site-box').forEach(el => el.classList.remove('active'));
    // Add active class to BWM box when showing overview
    const bwmBox = document.querySelector('.new-site');
    if (bwmBox) bwmBox.classList.add('active');
    
    // Update current site tracking to null (overview mode)
    currentSiteKey = null;
    
    // Sync the dropdown to the current filter
    const dropdown = document.getElementById('demographicFilter');
    if (dropdown) {
        dropdown.value = currentDemoFilter;
    }
    
    fetchAndRender();
}

// Toggle long-press mode on all site charts: disable default hover events and force index mode
function setSiteChartsPressMode(active) {
    const interactionMode = active ? 'index' : 'point';
    const intersect = !active;
    const eventsValue = active ? [] : chartDefaultEvents;
    if (chart1Instance) {
        chart1Instance.options.interaction.mode = interactionMode;
        chart1Instance.options.interaction.intersect = intersect;
        chart1Instance.options.events = eventsValue;
    }
    if (chart2Instance) {
        chart2Instance.options.interaction.mode = interactionMode;
        chart2Instance.options.interaction.intersect = intersect;
        chart2Instance.options.events = eventsValue;
    }
    if (chart3Instance) {
        chart3Instance.options.interaction.mode = interactionMode;
        chart3Instance.options.interaction.intersect = intersect;
        chart3Instance.options.events = eventsValue;
    }
}