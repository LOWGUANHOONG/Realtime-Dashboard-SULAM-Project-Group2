// A big object containing data for each site
const siteData = {
    "bwm": {
        title: "Barisan Warisan Malaysia",
        council: 120,
        members: "15,000",
        growth: "5%"
    },
    "stadium-merdeka": {
        title: "Stadium Merdeka",
        council: 50,
        members: "8,500",
        growth: "22%"
    },
    "heren-street": {
        title: "No 8 Heeren Street",
        council: 30,
        members: "2,000",
        growth: "10%"
    }
};
// Function to update site information
function updateDashboard(siteKey) {
    // 1. Get the data for the site that was clicked
    const data = siteData[siteKey];

    // 2. Update the Dashboard Title
    document.querySelector('.header-center h1').innerText = data.title;

    // 3. Update the Top Cards (using the IDs we created earlier)
    document.getElementById('council-count').innerText = data.council;
    document.getElementById('member-count').innerText = data.members;
    document.getElementById('growth-rate').innerText = data.growth;

    // 4. Optional: Add a 'active' class to the clicked button to show it's selected
    console.log("Switched to: " + data.title);
}