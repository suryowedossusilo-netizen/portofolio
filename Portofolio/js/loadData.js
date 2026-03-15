// Data Loading Functions - PERBAIKAN MODAL + GITHUB API INTEGRATION

// ============================================
// KONFIGURASI GITHUB API
// ============================================

const GITHUB_CONFIG = {
    username: 'suryowedossusilo-netizen',
    apiUrl: 'https://api.github.com',
    cacheDuration: 60 * 60 * 1000,
    excludeRepos: ['username.github.io', 'repo-yang-di-exclude'],
    filterTopics: []
};

// ============================================
// CACHE HELPERS
// ============================================

function getGitHubCache() {
    const cached = localStorage.getItem('github_projects_cache');
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > GITHUB_CONFIG.cacheDuration) return null;
    return data;
}

function setGitHubCache(data) {
    localStorage.setItem('github_projects_cache', JSON.stringify({
        data,
        timestamp: Date.now()
    }));
}

// ============================================
// GITHUB API FUNCTIONS
// ============================================

async function fetchGitHubRepos() {
    try {
        // Cek cache dulu
        const cached = getGitHubCache();
        if (cached) {
            console.log('Using cached GitHub data');
            return cached;
        }

        const response = await fetch(
            `${GITHUB_CONFIG.apiUrl}/users/${GITHUB_CONFIG.username}/repos?sort=updated&per_page=100`
        );

        if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
        
        const repos = await response.json();
        const filtered = filterGitHubRepos(repos);
        const transformed = filtered.map(transformGitHubRepo);
        
        // Simpan ke cache
        setGitHubCache(transformed);
        
        return transformed;
    } catch (error) {
        console.error('GitHub fetch error:', error);
        return getGitHubCache() || [];
    }
}

function filterGitHubRepos(repos) {
    return repos.filter(repo => {
        if (GITHUB_CONFIG.excludeRepos.includes(repo.name)) return false;
        if (repo.fork) return false;
        
        if (GITHUB_CONFIG.filterTopics.length > 0) {
            const hasTopic = GITHUB_CONFIG.filterTopics.some(topic => 
                repo.topics.includes(topic)
            );
            if (!hasTopic) return false;
        }
        
        return true;
    });
}

function transformGitHubRepo(repo) {
    const title = repo.name
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());

    let category = 'web';
    const topics = repo.topics || [];
    const lang = repo.language?.toLowerCase() || '';
    
    if (topics.includes('mobile') || topics.includes('android') || topics.includes('ios') || 
        lang === 'dart' || lang === 'kotlin' || lang === 'swift') {
        category = 'aplikasi';
    } else if (topics.includes('design') || topics.includes('ui') || topics.includes('ux')) {
        category = 'design';
    }

    const technologies = [...new Set([
        repo.language,
        ...topics.filter(t => !['portfolio', 'showcase', 'web', 'app', 'design'].includes(t))
    ])].filter(Boolean).slice(0, 6);

    return {
        id: `github-${repo.id}`,
        title: title,
        category: category,
        shortDesc: repo.description || `Repository ${repo.name} oleh ${GITHUB_CONFIG.username}`,
        fullDesc: repo.description || `Repository ${repo.name} oleh ${GITHUB_CONFIG.username}. Terakhir diupdate ${new Date(repo.updated_at).toLocaleDateString('id-ID')}.`,
        technologies: technologies,
        features: [
            `${repo.stargazers_count} stars`,
            `${repo.forks_count} forks`,
            repo.language ? `Primary language: ${repo.language}` : 'Multi-language project'
        ],
        images: [
            `https://opengraph.githubassets.com/1/${repo.full_name}`
        ],
        icon: 'fab fa-github',
        color: generateRepoColor(repo.language),
        date: repo.created_at ? repo.created_at.substring(0, 7) : new Date().toISOString().substring(0, 7),
        demoLink: repo.homepage || null,
        repoLink: repo.html_url,
        githubData: {
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            updated: repo.updated_at,
            language: repo.language
        }
    };
}

function generateRepoColor(language) {
    const colors = {
        'JavaScript': 'linear-gradient(135deg, #f7df1e 0%, #323330 100%)',
        'TypeScript': 'linear-gradient(135deg, #3178c6 0%, #235a97 100%)',
        'Python': 'linear-gradient(135deg, #3776ab 0%, #ffd43b 100%)',
        'Java': 'linear-gradient(135deg, #007396 0%, #5382a1 100%)',
        'PHP': 'linear-gradient(135deg, #777bb4 0%, #4f5b93 100%)',
        'HTML': 'linear-gradient(135deg, #e34c26 0%, #f06529 100%)',
        'CSS': 'linear-gradient(135deg, #264de4 0%, #2965f1 100%)',
        'Vue': 'linear-gradient(135deg, #42b883 0%, #35495e 100%)',
        'React': 'linear-gradient(135deg, #61dafb 0%, #282c34 100%)',
        'Dart': 'linear-gradient(135deg, #00b4ab 0%, #0175c2 100%)',
        'Swift': 'linear-gradient(135deg, #fa7343 0%, #ffac45 100%)',
        'Kotlin': 'linear-gradient(135deg, #7f52ff 0%, #a97bff 100%)',
        'Go': 'linear-gradient(135deg, #00add8 0%, #29beb0 100%)',
        'Rust': 'linear-gradient(135deg, #dea584 0%, #000000 100%)',
        'C++': 'linear-gradient(135deg, #00599c 0%, #044f88 100%)',
        'Ruby': 'linear-gradient(135deg, #cc342d 0%, #9b111e 100%)'
    };
    return colors[language] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
}

function getLanguageColor(language) {
    const colors = {
        'JavaScript': '#f1e05a',
        'TypeScript': '#2b7489',
        'Python': '#3572A5',
        'Java': '#b07219',
        'PHP': '#4F5D95',
        'HTML': '#e34c26',
        'CSS': '#563d7c',
        'Vue': '#41b883',
        'React': '#61dafb',
        'Dart': '#00B4AB',
        'Swift': '#ffac45',
        'Kotlin': '#A97BFF',
        'Go': '#00ADD8',
        'Rust': '#dea584',
        'C++': '#f34b7d',
        'Ruby': '#701516'
    };
    return colors[language] || '#8b949e';
}

// ============================================
// LOAD PROJECTS - MODIFIED WITH GITHUB
// ============================================

async function loadProjects() {
    try {
        // Load dari GitHub API
        const githubProjects = await fetchGitHubRepos();
        
        // Load dari local JSON (untuk project non-GitHub)
        let localProjects = [];
        try {
            const response = await fetch('data/projects.json');
            const data = await response.json();
            localProjects = data.projects || [];
        } catch (e) {
            console.log('No local projects or error loading:', e);
        }

        // Gabungkan data (GitHub + Local)
        const allProjects = [...githubProjects, ...localProjects];
        
        // Sort by date (terbaru dulu)
        allProjects.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

        const container = document.getElementById('projectsContainer');
        if (!container) return;

        renderProjects(allProjects);
        window.allProjects = allProjects;

    } catch (error) {
        console.error('Error loading projects:', error);
        // Fallback: coba load local saja
        loadLocalProjectsOnly();
    }
}

async function loadLocalProjectsOnly() {
    try {
        const response = await fetch('data/projects.json');
        const data = await response.json();
        renderProjects(data.projects);
        window.allProjects = data.projects;
    } catch (error) {
        console.error('Error loading local projects:', error);
        const container = document.getElementById('projectsContainer');
        if (container) {
            container.innerHTML = '<p class="error-message">Gagal memuat project. Coba refresh halaman.</p>';
        }
    }
}

// Fungsi untuk load projects dari JSON
async function loadProjects() {
    try {
        const response = await fetch('data/projects.json');
        const projects = await response.json();
        renderProjects(projects);
    } catch (error) {
        console.error('Error loading projects:', error);
        // Fallback data jika JSON error
        const fallbackProjects = [
            {
                id: 1,
                title: "TUGAS KULIAH",
                category: "web",
                description: "Kumpulan tugas kuliah (wijaya putra) berisi berbagai project akademik dan latihan pemrograman.",
                image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80",
                tech: ["Python", "Web"],
                stars: 0,
                forks: 0,
                link: "https://github.com/suryowedossusilo-netizen/TUGAS-KULIAH"
            },
            {
                id: 2,
                title: "SuryoWedossusilo Netizen",
                category: "web",
                description: "Repository personal branding dan netizen profile dengan berbagai fitur interaktif.",
                image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80",
                tech: ["Web", "JavaScript"],
                stars: 0,
                forks: 0,
                link: "https://github.com/suryowedossusilo-netizen/SuryoWedossusilo-Netizen"
            },
            {
                id: 3,
                title: "Uwp Funrun",
                category: "aplikasi",
                description: "Repository dengan fokus pada HTML dan teknologi frontend modern.",
                image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80",
                tech: ["HTML", "CSS"],
                stars: 0,
                forks: 0,
                link: "https://github.com/suryowedossusilo-netizen/FUN-RUN-UWP"
            }
        ];
        renderProjects(fallbackProjects);
    }
}

// Render projects ke DOM
function renderProjects(projects) {
    const container = document.getElementById('projectsContainer');
    
    if (projects.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-folder-open"></i>
                <h3>Tidak ada project</h3>
                <p>Project dengan kategori ini belum tersedia.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = projects.map(project => `
        <article class="project-card" data-category="${project.category}">
            <div class="project-image">
                <img src="${project.image}" alt="${project.title}" loading="lazy">
                <div class="project-overlay"></div>
                <span class="project-category">${project.category}</span>
                <div class="star-badge">
                    <i class="fas fa-star"></i> ${project.stars}
                </div>
            </div>
            <div class="project-content">
                <h3 class="project-title">${project.title}</h3>
                <p class="project-description">${project.description}</p>
                <div class="tech-stack">
                    ${project.tech.map(t => `<span class="tech-tag">${t}</span>`).join('')}
                </div>
                <div class="project-meta">
                    <div class="project-stats">
                        <span><i class="fas fa-code-branch"></i> ${project.forks}</span>
                        <span><i class="fas fa-eye"></i> 0</span>
                    </div>
                    <a href="${project.link}" class="project-link" target="_blank">
                        Detail <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        </article>
    `).join('');
}

// Filter functionality
function filterProjects(category) {
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-filter') === category) {
            btn.classList.add('active');
        }
    });
    
    // Filter cards with animation
    const cards = document.querySelectorAll('.project-card');
    cards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        
        if (category === 'all' || cardCategory === category) {
            card.style.display = 'block';
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 10);
        } else {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.display = 'none';
            }, 300);
        }
    });
}

function attachDetailButtons() {
    document.querySelectorAll('.btn-view-detail').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const projectId = this.getAttribute('data-project-id');
            openProjectModal(projectId);
        });
    });
}

// ============================================
// LOAD FEATURED PROJECTS - MODIFIED WITH GITHUB
// ============================================

async function loadFeaturedProjects() {
    try {
        // Coba ambil dari GitHub dulu
        let allProjects = [];
        
        try {
            const githubProjects = await fetchGitHubRepos();
            allProjects = [...githubProjects];
        } catch (e) {
            console.log('GitHub load failed, trying local');
        }
        
        // Tambah local projects
        try {
            const response = await fetch('data/projects.json');
            const data = await response.json();
            allProjects = [...allProjects, ...(data.projects || [])];
        } catch (e) {
            console.log('No local projects');
        }
        
        const container = document.getElementById('featuredProjects');
        if (!container) return;

        // Ambil 3 project terbaru
        const featured = allProjects
            .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
            .slice(0, 3);

        container.innerHTML = featured.map((project, index) => {
            const isGitHub = project.id.toString().startsWith('github-');
            
            return `
            <div class="project-card project-featured reveal stagger-${(index % 3) + 1}" 
                 data-category="${project.category === 'app' ? 'aplikasi' : project.category}">
                
                <div class="project-image" style="${project.color ? `background: ${project.color}` : 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}">
                    ${project.images && project.images[0] ? 
                        `<img src="${project.images[0]}" alt="${project.title}" loading="lazy">` : 
                        `<div class="project-icon-wrapper">
                            <i class="${project.icon || 'fas fa-code'}"></i>
                         </div>`
                    }
                    ${isGitHub && project.githubData ? `
                        <div class="github-stats">
                            <span><i class="fas fa-star"></i> ${project.githubData.stars}</span>
                        </div>
                    ` : ''}
                    <div class="project-overlay">
                        <a href="projects.html" class="btn btn-primary">
                            Lihat Semua Project
                        </a>
                    </div>
                </div>
                
                <div class="project-content">
                    <h3 class="project-title">${project.title}</h3>
                    <p class="project-description">${project.shortDesc || project.shortDescription || ''}</p>
                    <div class="project-tags">
                        ${(project.technologies || []).slice(0, 3).map(tech => 
                            `<span class="tag">${tech}</span>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `}).join('');

    } catch (error) {
        console.error('Error loading featured projects:', error);
    }
}

// ============================================
// MODAL FUNCTIONS - MODIFIED WITH GITHUB STATS
// ============================================

function openProjectModal(projectId) {
    const project = window.allProjects?.find(p => p.id === projectId);
    if (!project) {
        console.error('Project not found:', projectId);
        return;
    }

    closeProjectModal();

    const modal = document.createElement('div');
    modal.className = 'project-modal';
    modal.id = 'projectModal';
    
    modal.innerHTML = `
        <div class="modal-project">
            <div class="modal-header" style="${project.color ? `background: ${project.color}` : 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}">
                <button class="modal-close" onclick="closeProjectModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="modal-icon">
                    <i class="${project.icon || 'fas fa-code'}"></i>
                </div>
                <h2>${project.title}</h2>
                <span class="modal-category">${getCategoryLabel(project.category)}</span>
            </div>
            
            <div class="modal-body">
                ${project.images && project.images.length > 0 ? `
                <div class="modal-gallery">
                    ${project.images.map(img => `
                        <div class="modal-image-wrapper">
                            <img src="${img}" alt="${project.title}" class="modal-image" onerror="this.src='https://placehold.co/600x400/667eea/ffffff?text=No+Image'">
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                
                <div class="modal-info">
                    <div class="modal-section">
                        <h3><i class="fas fa-info-circle"></i> Deskripsi</h3>
                        <p>${project.fullDesc || project.description || project.shortDesc || ''}</p>
                    </div>
                    
                    ${project.features && project.features.length > 0 ? `
                    <div class="modal-section">
                        <h3><i class="fas fa-list-check"></i> Fitur Utama</h3>
                        <ul class="feature-list">
                            ${project.features.map(feat => `<li><i class="fas fa-check"></i> ${feat}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                    
                    <div class="modal-section">
                        <h3><i class="fas fa-layer-group"></i> Teknologi</h3>
                        <div class="tech-stack">
                            ${(project.technologies || []).map(tech => 
                                `<span class="tech-badge">${tech}</span>`
                            ).join('')}
                        </div>
                    </div>
                    
                    ${project.date ? `
                    <div class="modal-meta">
                        <span><i class="far fa-calendar"></i> ${formatDate(project.date)}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="modal-footer">
                ${project.demoLink ? `
                    <a href="${project.demoLink}" target="_blank" class="btn btn-primary" rel="noopener noreferrer">
                        <i class="fas fa-external-link-alt"></i> Live Demo
                    </a>
                ` : ''}
                
                ${project.repoLink || project.githubLink ? `
                    <a href="${project.repoLink || project.githubLink}" target="_blank" class="btn btn-secondary" rel="noopener noreferrer">
                        <i class="fab fa-github"></i> Source Code
                    </a>
                ` : ''}
                
                ${project.githubData ? `
                    <div class="github-stats-modal">
                        <span class="stat-item"><i class="fas fa-star"></i> ${project.githubData.stars}</span>
                        <span class="stat-item"><i class="fas fa-code-branch"></i> ${project.githubData.forks}</span>
                        <span class="stat-item"><i class="fas fa-circle" style="color: ${getLanguageColor(project.githubData.language)}"></i> ${project.githubData.language || 'Unknown'}</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    requestAnimationFrame(() => {
        modal.classList.add('active');
    });
}

function closeProjectModal() {
    const modal = document.getElementById('projectModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
            document.body.style.overflow = '';
        }, 300);
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeProjectModal();
});

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('project-modal')) {
        closeProjectModal();
    }
});

// ============================================
// FILTER FUNCTIONS
// ============================================

function filterProjects(category) {
    const cards = document.querySelectorAll('.project-card');
    const buttons = document.querySelectorAll('.filter-btn');
    
    buttons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === category);
    });
    
    cards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.style.display = 'block';
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 10);
        } else {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.display = 'none';
            }, 300);
        }
    });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatDate(dateString) {
    if (!dateString) return '';
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const [year, month] = dateString.split('-');
    return `${months[parseInt(month) - 1]} ${year}`;
}

function getCategoryLabel(category) {
    const labels = {
        'web': 'Web Development',
        'aplikasi': 'Aplikasi',
        'app': 'Aplikasi',
        'design': 'Design'
    };
    return labels[category] || category;
}

// ============================================
// EXPORTS
// ============================================

window.loadProjects = loadProjects;
window.loadFeaturedProjects = loadFeaturedProjects;
window.openProjectModal = openProjectModal;
window.closeProjectModal = closeProjectModal;
window.filterProjects = filterProjects;