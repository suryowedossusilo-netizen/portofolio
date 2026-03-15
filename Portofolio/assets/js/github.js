// assets/js/github.js
class GitHubPortfolio {
    constructor(username, options = {}) {
        this.username = username; // Perbaiki: jangan pakai string literal
        this.excludeRepos = options.excludeRepos || [];
        this.filterTopics = options.filterTopics || [];
        this.cacheKey = `github_projects_${username}`;
        this.cacheExpiry = 60 * 60 * 1000; // 1 jam cache
    }

    // Ambil data dari GitHub API
    async fetchRepos() {
        try {
            // Cek cache dulu
            const cached = this.getCache();
            if (cached) return cached;

            const response = await fetch(`https://api.github.com/users/${this.username}/repos?sort=updated&per_page=100`);
            
            if (!response.ok) throw new Error('Failed to fetch GitHub repos');
            
            const repos = await response.json();
            const filteredRepos = this.filterRepos(repos);
            
            // Simpan ke cache
            this.setCache(filteredRepos);
            
            return filteredRepos;
        } catch (error) {
            console.error('GitHub API Error:', error);
            return this.getCache() || []; // Fallback ke cache lama
        }
    }

    // Filter repo yang tidak perlu ditampilkan
    filterRepos(repos) {
        return repos.filter(repo => {
            // Exclude repo tertentu
            if (this.excludeRepos.includes(repo.name)) return false;
            
            // Exclude fork (opsional, hapus kalau mau tampilkan fork)
            if (repo.fork) return false;
            
            // Filter berdasarkan topic (opsional)
            if (this.filterTopics.length > 0) {
                const hasTopic = this.filterTopics.some(topic => 
                    repo.topics && repo.topics.includes(topic)
                );
                if (!hasTopic) return false;
            }
            
            return true;
        });
    }

    // Transform data GitHub ke format portfolio
    transformRepo(repo) {
        return {
            id: repo.id,
            title: this.formatTitle(repo.name),
            category: this.detectCategory(repo.topics || [], repo.language),
            description: repo.description || 'Tidak ada deskripsi',
            image: this.getProjectImage(repo),
            tech: this.getTechStack(repo),
            demo: repo.homepage,
            github: repo.html_url,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            updated: repo.updated_at,
            language: repo.language
        };
    }

    // Format nama repo (ganti-dash-jadi-spasi)
    formatTitle(name) {
        return name
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    // Deteksi kategori berdasarkan topic/bahasa
    detectCategory(topics, language) {
        if (topics.includes('mobile') || topics.includes('android') || topics.includes('ios')) {
            return 'Aplikasi';
        }
        if (topics.includes('design') || topics.includes('ui') || topics.includes('ux')) {
            return 'Design';
        }
        if (['JavaScript', 'TypeScript', 'HTML', 'CSS', 'Vue', 'React'].includes(language)) {
            return 'Web Development';
        }
        return 'Lainnya';
    }

    // Ambil gambar project (prioritas: Open Graph > screenshot > placeholder)
    getProjectImage(repo) {
        // Cek apakah ada file screenshot di repo
        return `https://opengraph.githubassets.com/1/${repo.full_name}`;
    }

    // Ambil tech stack dari topics + language
    getTechStack(repo) {
        const tech = [...(repo.topics || [])];
        if (repo.language && !tech.includes(repo.language)) {
            tech.unshift(repo.language);
        }
        return tech.slice(0, 5); // Max 5 tech
    }

    // Cache helpers
    getCache() {
        const cached = localStorage.getItem(this.cacheKey);
        if (!cached) return null;
        
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp > this.cacheExpiry) return null;
        
        return data;
    }

    setCache(data) {
        localStorage.setItem(this.cacheKey, JSON.stringify({
            data,
            timestamp: Date.now()
        }));
    }

    // Method utama: ambil dan transform semua data
    async getProjects() {
        const repos = await this.fetchRepos();
        return repos.map(repo => this.transformRepo(repo));
    }
}

// Export untuk digunakan di file lain
window.GitHubPortfolio = GitHubPortfolio;
