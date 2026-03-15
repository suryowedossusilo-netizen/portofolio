// assets/js/project-renderer.js
class ProjectRenderer {
    constructor(githubPortfolio) {
        this.github = githubPortfolio;
    }

    // Render untuk featured projects (halaman utama)
    async renderFeatured(containerSelector, limit = 3) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        // Tampilkan loading
        container.innerHTML = this.getLoadingHTML();

        try {
            const projects = await this.github.getProjects();
            const featuredProjects = projects.slice(0, limit);
            
            if (featuredProjects.length === 0) {
                container.innerHTML = this.getEmptyHTML();
                return;
            }

            container.innerHTML = featuredProjects.map(project => 
                this.renderFeaturedCard(project)
            ).join('');
        } catch (error) {
            console.error('Error rendering featured projects:', error);
            container.innerHTML = this.getErrorHTML();
        }
    }

    // Render untuk semua projects (halaman projects)
    async renderAll(containerSelector, filter = 'all') {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        // Tampilkan loading
        container.innerHTML = this.getLoadingHTML();

        try {
            const projects = await this.github.getProjects();
            
            if (projects.length === 0) {
                container.innerHTML = this.getEmptyHTML();
                return;
            }

            // Filter berdasarkan kategori
            const filteredProjects = filter === 'all' 
                ? projects 
                : projects.filter(p => p.category.toLowerCase().includes(filter.toLowerCase()));

            container.innerHTML = filteredProjects.map(project => 
                this.renderFullCard(project)
            ).join('');

            // Simpan data untuk filter
            container.setAttribute('data-projects', JSON.stringify(projects));
        } catch (error) {
            console.error('Error rendering all projects:', error);
            container.innerHTML = this.getErrorHTML();
        }
    }

    // Card untuk featured (lebih ringkas)
    renderFeaturedCard(project) {
        // Ambil maksimal 3 tech stack
        const techIcons = {
            'JavaScript': 'fab fa-js',
            'TypeScript': 'fab fa-js',
            'Python': 'fab fa-python',
            'Java': 'fab fa-java',
            'HTML': 'fab fa-html5',
            'CSS': 'fab fa-css3-alt',
            'PHP': 'fab fa-php',
            'Ruby': 'fas fa-gem',
            'Go': 'fab fa-golang',
            'C++': 'fas fa-code',
            'C#': 'fab fa-microsoft',
            'Dart': 'fab fa-dart',
            'Swift': 'fab fa-swift',
            'Kotlin': 'fab fa-kotlin'
        };

        const techStack = project.tech.slice(0, 3).map(tech => 
            `<span class="tech-tag"><i class="${techIcons[tech] || 'fas fa-code'}"></i> ${tech}</span>`
        ).join('');

        // Estimasi jumlah fitur (bisa ditambahkan logic untuk membaca README nanti)
        const featureCount = Math.floor(Math.random() * 8) + 3;

        return `
            <div class="project-card" data-category="${project.category.toLowerCase()}">
                <div class="project-image">
                    <div class="project-badges">
                        <span class="category-badge">${project.category}</span>
                    </div>
                    <div class="github-stats">
                        <span><i class="fas fa-star"></i> ${project.stars}</span>
                        <span><i class="fas fa-code-branch"></i> ${project.forks}</span>
                    </div>
                </div>
                <div class="project-content">
                    <div class="project-header">
                        <h3 class="project-title">${project.title}</h3>
                        <span class="feature-count"><i class="fas fa-code-branch"></i> ${featureCount} Fitur</span>
                    </div>
                    <div class="project-category-text">${project.category}</div>
                    <p class="project-description">${project.description}</p>
                    <div class="tech-stack">
                        ${techStack}
                    </div>
                </div>
            </div>
        `;
    }

    // Card untuk halaman projects (lebih lengkap dengan link)
    renderFullCard(project) {
        const techIcons = {
            'JavaScript': 'fab fa-js',
            'TypeScript': 'fab fa-js',
            'Python': 'fab fa-python',
            'Java': 'fab fa-java',
            'HTML': 'fab fa-html5',
            'CSS': 'fab fa-css3-alt',
            'PHP': 'fab fa-php',
            'Ruby': 'fas fa-gem',
            'Go': 'fab fa-golang',
            'C++': 'fas fa-code',
            'C#': 'fab fa-microsoft',
            'Dart': 'fab fa-dart',
            'Swift': 'fab fa-swift',
            'Kotlin': 'fab fa-kotlin'
        };

        const techStack = project.tech.map(tech => 
            `<span class="tech-tag"><i class="${techIcons[tech] || 'fas fa-code'}"></i> ${tech}</span>`
        ).join('');

        // Estimasi jumlah fitur
        const featureCount = Math.floor(Math.random() * 8) + 3;

        return `
            <div class="project-card" data-category="${project.category.toLowerCase()}">
                <div class="project-image">
                    <div class="project-badges">
                        <span class="category-badge">${project.category}</span>
                    </div>
                    <div class="github-stats">
                        <span><i class="fas fa-star"></i> ${project.stars}</span>
                        <span><i class="fas fa-code-branch"></i> ${project.forks}</span>
                    </div>
                </div>
                <div class="project-content">
                    <div class="project-header">
                        <h3 class="project-title">${project.title}</h3>
                        <span class="feature-count"><i class="fas fa-code-branch"></i> ${featureCount} Fitur</span>
                    </div>
                    <div class="project-category-text">${project.category}</div>
                    <p class="project-description">${project.description}</p>
                    <div class="tech-stack">
                        ${techStack}
                    </div>
                    <div class="project-footer">
                        <a href="${project.github}" target="_blank" class="project-link">
                            <i class="fab fa-github"></i> GitHub
                        </a>
                        ${project.demo ? `<a href="${project.demo}" target="_blank" class="project-link">
                            <i class="fas fa-external-link-alt"></i> Demo
                        </a>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // Helper untuk loading state
    getLoadingHTML() {
        return `
            <div class="loading-projects">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Memuat proyek dari GitHub...</p>
            </div>
        `;
    }

    // Helper untuk empty state
    getEmptyHTML() {
        return `
            <div class="no-projects">
                <i class="fas fa-folder-open"></i>
                <p>Belum ada proyek yang ditemukan</p>
            </div>
        `;
    }

    // Helper untuk error state
    getErrorHTML() {
        return `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Gagal memuat proyek. Silakan refresh halaman.</p>
            </div>
        `;
    }
}

window.ProjectRenderer = ProjectRenderer;
