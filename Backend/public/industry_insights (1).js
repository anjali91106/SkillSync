// Article data
const articles = [
    {
        id: 1,
        title: "Top Tech Trends in 2026",
        category: "Industry Insights",
        date: "Feb 2026",
        description: "AI, Cloud Computing, and Full Stack roles are dominating the market. Discover the key technologies shaping the future of work and how professionals can adapt to stay competitive.",
        fullContent: "The technology landscape in 2026 is experiencing unprecedented transformation. Artificial Intelligence continues to evolve at breakneck speed, with generative AI becoming more sophisticated and integrated into everyday business operations. Cloud computing has shifted from a competitive advantage to a necessity, with multi-cloud strategies becoming the norm. Full Stack developers are in high demand as companies seek versatile professionals who can handle both frontend and backend challenges. The rise of edge computing, quantum computing experiments, and the Internet of Things (IoT) are creating new opportunities and challenges. Professionals who continuously upskill and adapt to these changes will find themselves at the forefront of innovation."
    },
    {
        id: 2,
        title: "Remote Work Best Practices",
        category: "Knowledge Sharing",
        date: "Feb 2026",
        description: "Learn how to maintain productivity and work-life balance in a distributed team environment with proven strategies and tools.",
        fullContent: "Remote work has evolved from a temporary solution to a permanent fixture in the modern workplace. Successful remote teams have mastered the art of digital collaboration through a combination of the right tools and established best practices. Key strategies include creating dedicated workspace routines, maintaining clear communication channels, and establishing boundaries between work and personal life. Tools like Slack, Zoom, and project management platforms have become essential, but the human element remains crucial. Regular virtual team building activities, clear documentation practices, and asynchronous communication strategies help distributed teams thrive. The most successful remote workers are those who can self-manage, communicate proactively, and maintain strong relationships with colleagues despite physical distance."
    },
    {
        id: 3,
        title: "AI Integration in Business",
        category: "Industry Insights",
        date: "Jan 2026",
        description: "How artificial intelligence is revolutionizing business operations across different sectors and what it means for the future workforce.",
        fullContent: "Artificial Intelligence is no longer a futuristic concept but a present-day reality transforming business operations. From customer service chatbots to predictive analytics, AI is enhancing efficiency and decision-making across industries. The retail sector uses AI for personalized recommendations and inventory management. Healthcare leverages AI for diagnostic assistance and drug discovery. Financial institutions employ AI for fraud detection and algorithmic trading. However, successful AI integration requires more than just technology – it demands a cultural shift, data infrastructure investment, and ethical considerations. Companies that balance automation with human expertise are seeing the best results. The future workforce will need to develop AI literacy and focus on skills that complement rather than compete with artificial intelligence."
    },
    {
        id: 4,
        title: "Mentorship Programs That Work",
        category: "Knowledge Sharing",
        date: "Jan 2026",
        description: "Building effective mentorship relationships that accelerate career growth and knowledge transfer within organizations.",
        fullContent: "Effective mentorship programs are becoming increasingly important in today's fast-paced work environment. Successful mentorship goes beyond casual advice – it requires structured approaches, clear goals, and mutual commitment. The best programs pair mentors and mentees based on complementary skills and career aspirations, establish regular meeting schedules, and set measurable objectives. Modern mentorship has evolved to include peer mentoring, reverse mentoring where junior employees mentor senior staff on new technologies, and group mentoring sessions. Technology platforms are facilitating these relationships through matching algorithms and progress tracking. Organizations that invest in mentorship see higher employee retention, faster skill development, and stronger company culture. The key is creating an environment where knowledge sharing is valued and both mentors and mentees benefit from the relationship."
    },
    {
        id: 5,
        title: "Cybersecurity in the Cloud Era",
        category: "Industry Insights",
        date: "Dec 2025",
        description: "Understanding the security challenges and solutions for cloud-based infrastructure in an increasingly connected world.",
        fullContent: "As organizations increasingly migrate to cloud infrastructure, cybersecurity has become more complex and critical. The shared responsibility model of cloud computing means that while providers secure the infrastructure, customers must secure their data and applications. Key challenges include misconfigurations, identity and access management, and compliance with regulations like GDPR and CCPA. Modern cloud security requires a multi-layered approach including encryption, continuous monitoring, and automated threat detection. Zero Trust architectures are gaining prominence as traditional perimeter-based security becomes obsolete. Security teams must also address the challenges of multi-cloud environments, container security, and the growing sophistication of cyber threats. The future of cloud security lies in AI-powered threat detection, DevSecOps practices, and a security-first culture across the organization."
    },
    {
        id: 6,
        title: "Building Inclusive Teams",
        category: "Knowledge Sharing",
        date: "Dec 2025",
        description: "Practical strategies for creating diverse and inclusive work environments that drive innovation and business success.",
        fullContent: "Building inclusive teams is not just a moral imperative but a business necessity in today's global marketplace. Diverse teams consistently outperform homogeneous ones in innovation, problem-solving, and financial performance. Creating an inclusive environment requires intentional effort across multiple dimensions: recruitment practices that eliminate bias, policies that support work-life balance, and leadership that models inclusive behavior. Successful organizations implement regular bias training, create employee resource groups, and establish clear channels for feedback and concerns. They also recognize that diversity goes beyond demographics to include diversity of thought, experience, and perspective. The most inclusive teams create psychological safety where all members feel valued and empowered to contribute their best work. This requires ongoing commitment, measurement, and adaptation as the organization evolves."
    },
    {
        id: 7,
        title: "The Future of E-commerce",
        category: "Industry Insights",
        date: "Nov 2025",
        description: "Emerging trends in online retail, from social commerce to augmented reality shopping experiences.",
        fullContent: "E-commerce continues to evolve rapidly, driven by changing consumer expectations and technological innovations. Social commerce has emerged as a dominant force, with platforms like Instagram and TikTok becoming major shopping destinations. Augmented reality is revolutionizing the try-before-you-buy experience, allowing customers to visualize products in their space before purchasing. Voice commerce through smart speakers is gaining traction, while same-day delivery has become the new standard for many categories. Personalization powered by AI is creating unique shopping experiences for each customer, and sustainability concerns are driving demand for eco-friendly packaging and carbon-neutral shipping options. The future of e-commerce will be characterized by seamless integration between online and offline experiences, greater emphasis on social proof and community building, and continued innovation in payment technologies including cryptocurrency and buy-now-pay-later options."
    },
    {
        id: 8,
        title: "Effective Agile Retrospectives",
        category: "Knowledge Sharing",
        date: "Nov 2025",
        description: "Making the most of sprint retrospectives to continuously improve team processes and collaboration.",
        fullContent: "Agile retrospectives are a powerful tool for continuous improvement, yet many teams struggle to make them truly effective. Successful retrospectives go beyond routine discussions to create actionable insights and meaningful change. The key is creating a psychologically safe environment where team members feel comfortable sharing honest feedback. Effective facilitation techniques vary from simple start-stop-continue exercises to more sophisticated methods like the sailboat or 4Ls (liked, learned, lacked, longed for). The best retrospectives result in concrete action items with clear owners and follow-up mechanisms. Teams should experiment with different formats to keep retrospectives engaging and productive. Virtual retrospectives require special attention to engagement and participation. Regularly measuring the impact of retrospective improvements helps teams see the value and maintain momentum. When done well, retrospectives become the engine of continuous improvement that drives high-performing agile teams."
    }
];

// Global variables
let currentFilter = 'all';
let searchTerm = '';

// DOM elements
const articlesContainer = document.getElementById('articlesContainer');
const filterButtons = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');
const noResults = document.getElementById('noResults');
const modal = document.getElementById('articleModal');
const closeModal = document.querySelector('.close-modal');
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    renderArticles();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderArticles();
        });
    });

    // Search functionality
    searchInput.addEventListener('input', function() {
        searchTerm = this.value.toLowerCase();
        clearSearchBtn.style.display = searchTerm ? 'block' : 'none';
        renderArticles();
    });

    clearSearchBtn.addEventListener('click', function() {
        searchInput.value = '';
        searchTerm = '';
        this.style.display = 'none';
        renderArticles();
    });

    // Modal functionality
    closeModal.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Mobile menu toggle
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Render articles based on current filter and search
function renderArticles() {
    const filteredArticles = articles.filter(article => {
        const matchesFilter = currentFilter === 'all' || article.category === currentFilter;
        const matchesSearch = article.title.toLowerCase().includes(searchTerm) || 
                             article.description.toLowerCase().includes(searchTerm);
        return matchesFilter && matchesSearch;
    });

    if (filteredArticles.length === 0) {
        articlesContainer.innerHTML = '';
        noResults.style.display = 'block';
    } else {
        noResults.style.display = 'none';
        articlesContainer.innerHTML = filteredArticles.map(article => createArticleCard(article)).join('');
        
        // Add click listeners to "Read More" buttons
        document.querySelectorAll('.read-more-btn').forEach(button => {
            button.addEventListener('click', function() {
                const articleId = parseInt(this.dataset.articleId);
                openModal(articleId);
            });
        });
    }
}

// Create article card HTML
function createArticleCard(article) {
    const categoryClass = article.category === 'Knowledge Sharing' ? 'knowledge-sharing' : '';
    
    return `
        <article class="article-card">
            <h3 class="article-title">${article.title}</h3>
            <div class="article-meta">
                <span class="category-badge ${categoryClass}">${article.category}</span>
                <span class="article-date">${article.date}</span>
            </div>
            <p class="article-description">${article.description}</p>
            <button class="read-more-btn" data-article-id="${article.id}">
                Read More <i class="fas fa-arrow-right"></i>
            </button>
        </article>
    `;
}

// Open modal with article details
function openModal(articleId) {
    const article = articles.find(a => a.id === articleId);
    if (!article) return;

    document.getElementById('modalTitle').textContent = article.title;
    document.getElementById('modalCategory').textContent = article.category;
    document.getElementById('modalCategory').className = 'category-badge ' + 
        (article.category === 'Knowledge Sharing' ? 'knowledge-sharing' : '');
    document.getElementById('modalDate').textContent = article.date;
    document.getElementById('modalDescription').textContent = article.description;
    document.getElementById('modalFullContent').innerHTML = `<p>${article.fullContent}</p>`;

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModalFunc() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Smooth scroll to section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Add scroll effect to navbar
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.backdropFilter = 'blur(10px)';
    } else {
        navbar.style.background = '#fff';
        navbar.style.backdropFilter = 'none';
    }
});

// Add animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', function() {
    const animateElements = document.querySelectorAll('.article-card, .knowledge-card');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Utility function to debounce search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debounce to search
searchInput.addEventListener('input', debounce(function() {
    searchTerm = this.value.toLowerCase();
    clearSearchBtn.style.display = searchTerm ? 'block' : 'none';
    renderArticles();
}, 300));
