// --- Data Structure ---
const businessData = {
    manufacturer: {
        title: "Manufacturer Marketing Plan (B2B)",
        roadmap: [
            { level: "Beginner", items: ["Introduction to B2B Marketing", "LinkedIn Profile Setup", "Basic Website Optimization"] },
            { level: "Intermediate", items: ["B2B SEO Strategy", "Content Marketing for Manufacturers", "Google Ads (Search)"] },
            { level: "Advanced", items: ["Marketing Automation", "CRM Integration", "Advanced Analytics"] }
        ],
        videos: [
            { id: "v1", title: "Learn LinkedIn Marketing (Hindi)", url: "https://www.youtube.com/watch?v=YS2EeeJOhaA", duration: "25 Mins", level: "Beginner", thumb: "https://img.youtube.com/vi/YS2EeeJOhaA/mqdefault.jpg" },
            { id: "v2", title: "Learn SEO (Hindi)", url: "https://www.youtube.com/watch?v=83RXYrqRLeM", duration: "30 Mins", level: "Intermediate", thumb: "https://img.youtube.com/vi/83RXYrqRLeM/mqdefault.jpg" },
            { id: "v3", title: "Learn Google Ads (Hindi)", url: "https://www.youtube.com/watch?v=6hDNbGIZ8UI", duration: "40 Mins", level: "Advanced", thumb: "https://img.youtube.com/vi/6hDNbGIZ8UI/mqdefault.jpg" }
        ],
        tasks: [
            { week: "Week 1", items: ["Optimize LinkedIn Company Page", "Create 3 B2B Posts", "Watch LinkedIn Video"] },
            { week: "Week 2", items: ["Keyword Research for Products", "Update Website Meta Tags", "Watch SEO Video"] },
            { week: "Week 3", items: ["Setup Google Ads Account", "Create First B2B Search Campaign", "Watch Google Ads Video"] }
        ],
        tools: [
            { name: "LinkedIn Sales Navigator", desc: "B2B Lead Generation", icon: "ph-linkedin-logo" },
            { name: "Google Keyword Planner", desc: "SEO Keyword Research", icon: "ph-magnifying-glass" },
            { name: "HubSpot CRM", desc: "Manage B2B Leads", icon: "ph-users" }
        ],
        kpis: [
            { name: "B2B Leads", desc: "Qualified leads per month", icon: "ph-user-plus" },
            { name: "LinkedIn Connections", desc: "Relevant industry contacts", icon: "ph-handshake" },
            { name: "Website Enquiries", desc: "Form submissions", icon: "ph-envelope" }
        ]
    },
    retail: {
        title: "Retail Shop Marketing Plan",
        roadmap: [
            { level: "Beginner", items: ["Google Business Profile Setup", "Local SEO Basics", "WhatsApp Business Setup"] },
            { level: "Intermediate", items: ["Instagram Local Marketing", "Facebook Offers", "Customer Reviews Strategy"] },
            { level: "Advanced", items: ["Local Inventory Ads", "Loyalty Programs", "POS Integration"] }
        ],
        videos: [
            { id: "v4", title: "Google Business Profile (Hindi)", url: "https://youtu.be/fMe9nRfEhig", duration: "20 Mins", level: "Beginner", thumb: "https://img.youtube.com/vi/fMe9nRfEhig/mqdefault.jpg" },
            { id: "v5", title: "Instagram Marketing (Hindi)", url: "https://www.youtube.com/watch?v=tBwjPtzIXxE", duration: "35 Mins", level: "Intermediate", thumb: "https://img.youtube.com/vi/tBwjPtzIXxE/mqdefault.jpg" },
            { id: "v6", title: "WhatsApp Marketing (Hindi)", url: "https://www.youtube.com/watch?v=W2HkjKnATXw", duration: "15 Mins", level: "Intermediate", thumb: "https://img.youtube.com/vi/W2HkjKnATXw/mqdefault.jpg" }
        ],
        tasks: [
            { week: "Week 1", items: ["Create/Verify Google Business Profile", "Upload Store Photos", "Get 5 Initial Reviews"] },
            { week: "Week 2", items: ["Set up Instagram Professional Account", "Post 5 Product Images", "Watch Insta Video"] },
            { week: "Week 3", items: ["Set up WhatsApp Business", "Create Broadcast List", "Send First Offer"] }
        ],
        tools: [
            { name: "Google My Business", desc: "Local Search Visibility", icon: "ph-storefront" },
            { name: "Canva", desc: "Create Offer Graphics", icon: "ph-paint-brush" },
            { name: "WhatsApp Business App", desc: "Customer Communication", icon: "ph-whatsapp-logo" }
        ],
        kpis: [
            { name: "Store Visits", desc: "Footfall from online", icon: "ph-sneaker" },
            { name: "Google Reviews", desc: "Rating and count", icon: "ph-star" },
            { name: "WhatsApp Enquiries", desc: "Direct messages", icon: "ph-chat-circle" }
        ]
    },
    service: {
        title: "Service Business Marketing Plan",
        roadmap: [
            { level: "Beginner", items: ["Website Basics", "Service Pages SEO", "Google My Business"] },
            { level: "Intermediate", items: ["Local Service Ads", "Content Marketing (Blogs)", "Lead Generation Forms"] },
            { level: "Advanced", items: ["Automated Email Follow-ups", "Retargeting Ads", "Conversion Rate Optimization"] }
        ],
        videos: [
            { id: "v7", title: "SEO Tutorial (Hindi)", url: "https://www.youtube.com/watch?v=49PWJcjvYKk", duration: "45 Mins", level: "Beginner", thumb: "https://img.youtube.com/vi/49PWJcjvYKk/mqdefault.jpg" },
            { id: "v8", title: "Google Ads (Hindi)", url: "https://www.youtube.com/watch?v=6hDNbGIZ8UI", duration: "40 Mins", level: "Intermediate", thumb: "https://img.youtube.com/vi/6hDNbGIZ8UI/mqdefault.jpg" },
            { id: "v9", title: "Landing Page (Hindi)", url: "https://www.youtube.com/watch?v=T1I4VIv2duU", duration: "30 Mins", level: "Advanced", thumb: "https://img.youtube.com/vi/T1I4VIv2duU/mqdefault.jpg" }
        ],
        tasks: [
            { week: "Week 1", items: ["Audit Service Website", "Optimize Titles & Descriptions", "Watch SEO Video"] },
            { week: "Week 2", items: ["Create a High-Converting Landing Page", "Add Lead Forms", "Watch Landing Page Video"] },
            { week: "Week 3", items: ["Set up Google Ads Campaign", "Define Negative Keywords", "Launch First Campaign"] }
        ],
        tools: [
            { name: "WordPress / Wix", desc: "Website CMS", icon: "ph-browser" },
            { name: "Google Analytics", desc: "Track Website Traffic", icon: "ph-chart-bar" },
            { name: "Mailchimp", desc: "Email Marketing", icon: "ph-envelope-simple" }
        ],
        kpis: [
            { name: "Leads Generated", desc: "Form fills & calls", icon: "ph-phone-call" },
            { name: "Conversion Rate", desc: "Traffic to lead %", icon: "ph-percent" },
            { name: "Website Traffic", desc: "Monthly visitors", icon: "ph-users" }
        ]
    },
    startup: {
        title: "Startup Marketing Plan",
        roadmap: [
            { level: "Beginner", items: ["Brand Positioning", "Social Media Foundations", "Basic Content Creation"] },
            { level: "Intermediate", items: ["Content Marketing", "Growth Hacking Basics", "Community Building"] },
            { level: "Advanced", items: ["Influencer Marketing", "PR & Outreach", "Product-Led Growth"] }
        ],
        videos: [
            { id: "v10", title: "Social Media Marketing (Hindi)", url: "https://www.youtube.com/watch?v=tBwjPtzIXxE", duration: "35 Mins", level: "Beginner", thumb: "https://img.youtube.com/vi/tBwjPtzIXxE/mqdefault.jpg" },
            { id: "v11", title: "Content Marketing (Hindi)", url: "https://www.youtube.com/watch?v=T1I4VIv2duU", duration: "30 Mins", level: "Intermediate", thumb: "https://img.youtube.com/vi/T1I4VIv2duU/mqdefault.jpg" },
            { id: "v12", title: "SEO Basics (Hindi)", url: "https://www.youtube.com/watch?v=83RXYrqRLeM", duration: "30 Mins", level: "Advanced", thumb: "https://img.youtube.com/vi/83RXYrqRLeM/mqdefault.jpg" }
        ],
        tasks: [
            { week: "Week 1", items: ["Define Target Audience Persona", "Setup Brand Guidelines", "Watch Social Media Video"] },
            { week: "Week 2", items: ["Create 1 Month Content Calendar", "Write First Blog Post", "Watch Content Video"] },
            { week: "Week 3", items: ["Optimize Website for Core Keywords", "Submit to Directories", "Watch SEO Video"] }
        ],
        tools: [
            { name: "Notion", desc: "Planning & Workspace", icon: "ph-notebook" },
            { name: "Buffer / Hootsuite", desc: "Social Media Scheduling", icon: "ph-calendar-plus" },
            { name: "Google Trends", desc: "Market Interest Tracking", icon: "ph-trend-up" }
        ],
        kpis: [
            { name: "User Acquisition", desc: "New signups", icon: "ph-user-plus" },
            { name: "Brand Mentions", desc: "Social listening", icon: "ph-speaker-hifi" },
            { name: "CAC", desc: "Customer Acquisition Cost", icon: "ph-currency-dollar" }
        ]
    },
    freelancer: {
        title: "Freelancer Marketing Plan",
        roadmap: [
            { level: "Beginner", items: ["Portfolio Setup", "Personal Branding Basics", "Niche Selection"] },
            { level: "Intermediate", items: ["LinkedIn Networking", "Cold Emailing", "Fiverr/Upwork Optimization"] },
            { level: "Advanced", items: ["Thought Leadership", "Webinar/Course Creation", "Agency Transition"] }
        ],
        videos: [
            { id: "v13", title: "LinkedIn Profile Optimization", url: "https://www.youtube.com/watch?v=I3exinRuSUE", duration: "25 Mins", level: "Beginner", thumb: "https://img.youtube.com/vi/I3exinRuSUE/mqdefault.jpg" },
            { id: "v14", title: "Instagram Personal Branding", url: "https://www.youtube.com/watch?v=tBwjPtzIXxE", duration: "35 Mins", level: "Intermediate", thumb: "https://img.youtube.com/vi/tBwjPtzIXxE/mqdefault.jpg" },
            { id: "v15", title: "Portfolio Website Guide", url: "https://www.youtube.com/watch?v=T1I4VIv2duU", duration: "30 Mins", level: "Advanced", thumb: "https://img.youtube.com/vi/T1I4VIv2duU/mqdefault.jpg" }
        ],
        tasks: [
            { week: "Week 1", items: ["Build/Update Portfolio Website", "Gather 3 Client Testimonials", "Watch Portfolio Video"] },
            { week: "Week 2", items: ["Optimize LinkedIn Profile", "Connect with 50 Prospects", "Watch LinkedIn Video"] },
            { week: "Week 3", items: ["Define IG Visual Theme", "Post 3 Value-Driven Reels", "Watch IG Video"] }
        ],
        tools: [
            { name: "Webflow / Framer", desc: "Portfolio Builder", icon: "ph-layout" },
            { name: "Calendly", desc: "Meeting Scheduling", icon: "ph-calendar-check" },
            { name: "Hunter.io", desc: "Find Email Addresses", icon: "ph-at" }
        ],
        kpis: [
            { name: "Inbound Leads", desc: "Direct inquiries", icon: "ph-envelope-open" },
            { name: "Profile Views", desc: "LinkedIn/Portfolio traffic", icon: "ph-eye" },
            { name: "Closing Rate", desc: "Proposals won", icon: "ph-check-circle" }
        ]
    }
};

// --- DOM Elements ---
const businessSelect = document.getElementById("businessType");
const planContent = document.getElementById("plan-content");
const welcomeMessage = document.getElementById("welcome-message");
const progressContainer = document.getElementById("progress-container");
const downloadBtn = document.getElementById("download-btn");

const roadmapContainer = document.getElementById("roadmap-container");
const videosContainer = document.getElementById("videos-container");
const tasksContainer = document.getElementById("tasks-container");
const kpiContainer = document.getElementById("kpi-container");
const toolsContainer = document.getElementById("tools-container");

const progressBarFill = document.getElementById("progress-bar-fill");
const progressText = document.getElementById("progress-text");
const pdfBusinessTitle = document.getElementById("pdf-business-title");

// --- State ---
let currentBusiness = null;
let savedProgress = {};
try {
    savedProgress = JSON.parse(localStorage.getItem('growthAcademyProgress')) || {};
} catch (e) {
    console.warn("Could not read localStorage for progress", e);
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    try {
        const lastSelected = localStorage.getItem('growthAcademySelectedBusiness');
        if (lastSelected && businessData[lastSelected]) {
            businessSelect.value = lastSelected;
            generatePlan(lastSelected);
        }
    } catch (e) {
        console.warn("Could not read localStorage for selected business", e);
    }
});

// --- Event Listeners ---
businessSelect.addEventListener('change', (e) => {
    const selected = e.target.value;
    if (selected) {
        try {
            localStorage.setItem('growthAcademySelectedBusiness', selected);
        } catch (err) {
            console.warn("localStorage not available", err);
        }
        generatePlan(selected);
    } else {
        hidePlan();
    }
});

downloadBtn.addEventListener('click', downloadPDF);

// --- Functions ---
function hidePlan() {
    planContent.classList.add('hidden');
    progressContainer.classList.add('hidden');
    downloadBtn.classList.add('hidden');
    welcomeMessage.classList.remove('hidden');
    currentBusiness = null;
}

function generatePlan(businessKey) {
    const data = businessData[businessKey];
    if (!data) return;

    currentBusiness = businessKey;
    pdfBusinessTitle.innerText = data.title;

    // Render Sections
    renderRoadmap(data.roadmap);
    renderVideos(data.videos);
    renderTasks(data.tasks, businessKey);
    renderKPIs(data.kpis);
    renderTools(data.tools);

    // Update UI Visibility
    welcomeMessage.classList.add('hidden');
    planContent.classList.remove('hidden');
    progressContainer.classList.remove('hidden');
    downloadBtn.classList.remove('hidden');

    updateProgress();
}

function renderRoadmap(roadmapData) {
    roadmapContainer.innerHTML = roadmapData.map(rm => `
        <div class="card roadmap-card">
            <span class="level-badge badge-${rm.level.toLowerCase()}">${rm.level} Level</span>
            <h3>${rm.level} Milestones</h3>
            <ul>
                ${rm.items.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
    `).join('');
}

function renderVideos(videosData) {
    // Note: To avoid CORS / tainted canvas issues when running locally (file:// protocol),
    // we use a data attribute data-html2canvas-ignore to not render the thumbnail images in the PDF.
    videosContainer.innerHTML = videosData.map(v => `
        <div class="card video-card">
            <div class="video-thumb" data-html2canvas-ignore="true">
                <img src="${v.thumb}" alt="${v.title}">
                <i class="ph-fill ph-play-circle play-icon"></i>
            </div>
            <div class="video-info">
                <div class="video-meta">
                    <span class="level-badge badge-${v.level.toLowerCase()}">${v.level}</span>
                    <span class="video-duration"><i class="ph ph-clock"></i> ${v.duration}</span>
                </div>
                <h3>${v.title}</h3>
                <a href="${v.url}" target="_blank" class="btn-watch" data-html2canvas-ignore="true">
                    <i class="ph ph-youtube-logo"></i> Watch Video
                </a>
            </div>
        </div>
    `).join('');
}

function renderTasks(tasksData, businessKey) {
    let taskHtml = '';
    
    tasksData.forEach((week, wIndex) => {
        taskHtml += `
            <div class="task-week">
                <h3>${week.week} Implementation</h3>
        `;
        
        week.items.forEach((item, tIndex) => {
            const taskId = `${businessKey}-w${wIndex}-t${tIndex}`;
            const isCompleted = savedProgress[taskId] === true;
            
            // Fix: pass event object explicitly
            taskHtml += `
                <div class="task-item ${isCompleted ? 'completed' : ''}" onclick="toggleTask(event, '${taskId}', this)">
                    <input type="checkbox" class="custom-checkbox" id="${taskId}" ${isCompleted ? 'checked' : ''} onclick="event.stopPropagation(); toggleTask(event, '${taskId}', this.parentElement)">
                    <span class="task-label">${item}</span>
                </div>
            `;
        });
        
        taskHtml += `</div>`;
    });
    
    tasksContainer.innerHTML = taskHtml;
}

function renderKPIs(kpiData) {
    kpiContainer.innerHTML = kpiData.map(kpi => `
        <div class="card kpi-card">
            <div class="kpi-icon">
                <i class="ph ${kpi.icon}"></i>
            </div>
            <div class="kpi-info">
                <h4>${kpi.name}</h4>
                <p>${kpi.desc}</p>
            </div>
        </div>
    `).join('');
}

function renderTools(toolsData) {
    toolsContainer.innerHTML = toolsData.map(tool => `
        <div class="card tool-card">
            <div class="tool-icon">
                <i class="ph ${tool.icon}"></i>
            </div>
            <div class="tool-info">
                <h4>${tool.name}</h4>
                <p>${tool.desc}</p>
            </div>
        </div>
    `).join('');
}

// --- Interaction & Logic ---
window.toggleTask = function(e, taskId, element) {
    const evt = e || window.event;
    const checkbox = element.querySelector('input[type="checkbox"]');
    
    // Toggle state if clicked element is not the checkbox itself
    if (evt.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
    }
    
    if (checkbox.checked) {
        element.classList.add('completed');
        savedProgress[taskId] = true;
    } else {
        element.classList.remove('completed');
        delete savedProgress[taskId];
    }
    
    // Save to local storage
    try {
        localStorage.setItem('growthAcademyProgress', JSON.stringify(savedProgress));
    } catch (err) {
        console.warn("Could not save to localStorage", err);
    }
    
    updateProgress();
};

function updateProgress() {
    if (!currentBusiness) return;
    
    const checkboxes = document.querySelectorAll('.custom-checkbox');
    if (checkboxes.length === 0) return;
    
    let completedCount = 0;
    checkboxes.forEach(cb => {
        if (cb.checked) completedCount++;
    });
    
    const percentage = Math.round((completedCount / checkboxes.length) * 100);
    
    progressBarFill.style.width = `${percentage}%`;
    progressText.innerText = `${percentage}%`;
}

// --- PDF Generation ---
function downloadPDF() {
    console.log("PDF generation requested");
    
    if (typeof html2pdf === 'undefined') {
        const errorMsg = "PDF library (html2pdf.js) is not loaded. Please check your internet connection and try again.";
        console.error(errorMsg);
        alert(errorMsg);
        return;
    }

    try {
        const element = document.getElementById('plan-content');
        if (!element) {
            console.error("Content element not found for PDF export");
            return;
        }

        const safeTitle = businessData[currentBusiness].title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        
        const opt = {
            margin:       10,
            filename:     `${safeTitle}_plan.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, logging: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Add PDF styling class
        element.classList.add('pdf-mode');
        
        // Update button state
        const originalBtnHtml = downloadBtn.innerHTML;
        downloadBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Generating PDF...';
        downloadBtn.disabled = true;

        console.log("Starting html2pdf process...");

        // Generate PDF
        html2pdf().set(opt).from(element).save().then(() => {
            console.log("PDF generated successfully!");
            // Restore state
            element.classList.remove('pdf-mode');
            downloadBtn.innerHTML = originalBtnHtml;
            downloadBtn.disabled = false;
        }).catch(err => {
            console.error("PDF generation failed:", err);
            alert("An error occurred while generating the PDF. If you are opening this file locally (file://), try removing images or hosting on a local server.");
            // Restore state
            element.classList.remove('pdf-mode');
            downloadBtn.innerHTML = originalBtnHtml;
            downloadBtn.disabled = false;
        });
    } catch (e) {
        console.error("Unexpected error during PDF generation:", e);
        alert("An unexpected error occurred: " + e.message);
        
        // Ensure button resets on fatal error
        downloadBtn.innerHTML = '<i class="ph ph-download-simple"></i> Download Plan (PDF)';
        downloadBtn.disabled = false;
        document.getElementById('plan-content').classList.remove('pdf-mode');
    }
}
