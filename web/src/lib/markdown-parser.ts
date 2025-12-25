import fs from 'fs/promises';
import path from 'path';

export interface RawRepo {
  owner: string;
  name: string;
  url: string;
  description: string;
}

export interface ParsedCategory {
  name: string;
  repos: RawRepo[];
}

export interface Repo {
  id: string;
  owner: string;
  name: string;
  url: string;
  description: string;
  languages: string[];
  topics: string[];
}

export interface ParsedData {
  repos: Repo[];
  languages: ParsedCategory[];
  topics: ParsedCategory[];
}

// Regex to match: - [owner/repo](url) - description
const REPO_PATTERN = /^\- \[([\w\-\.]+)\/([\w\-\.]+)\]\(([^)]+)\)\s+\-\s*(.+)$/;

// Regex to match: ## Category Name
const CATEGORY_PATTERN = /^##\s+([A-Za-z0-9#\-\s]+)$/;

export async function parseMarkdownFiles(): Promise<ParsedData> {
  const projectRoot = path.resolve(process.cwd(), '..');
  const readmePath = path.join(projectRoot, 'README.md');
  const topicsPath = path.join(projectRoot, 'topics.md');

  const [readmeContent, topicsContent] = await Promise.all([
    fs.readFile(readmePath, 'utf-8'),
    fs.readFile(topicsPath, 'utf-8')
  ]);

  const languages = parseMarkdownFile(readmeContent);
  const topics = parseMarkdownFile(topicsContent);

  // Merge repos from both files
  const reposMap = new Map<string, Repo>();

  // First pass: collect all repos with languages
  for (const lang of languages) {
    for (const repo of lang.repos) {
      const id = `${repo.owner}/${repo.name}`;
      if (!reposMap.has(id)) {
        reposMap.set(id, {
          id,
          owner: repo.owner,
          name: repo.name,
          url: repo.url,
          description: repo.description,
          languages: [],
          topics: []
        });
      }
      reposMap.get(id)!.languages.push(lang.name);
    }
  }

  // Second pass: add topics
  for (const topic of topics) {
    for (const repo of topic.repos) {
      const id = `${repo.owner}/${repo.name}`;
      if (!reposMap.has(id)) {
        reposMap.set(id, {
          id,
          owner: repo.owner,
          name: repo.name,
          url: repo.url,
          description: repo.description,
          languages: [],
          topics: []
        });
      }
      reposMap.get(id)!.topics.push(topic.name);
    }
  }

  return {
    repos: Array.from(reposMap.values()),
    languages,
    topics
  };
}

function parseMarkdownFile(content: string): ParsedCategory[] {
  const lines = content.split('\n');
  const categories: ParsedCategory[] = [];
  let currentCategory: ParsedCategory | null = null;

  for (const line of lines) {
    const categoryMatch = line.match(CATEGORY_PATTERN);
    if (categoryMatch) {
      const name = categoryMatch[1].trim().replace(/\s+$/, '');
      currentCategory = { name, repos: [] };
      categories.push(currentCategory);
      continue;
    }

    const repoMatch = line.match(REPO_PATTERN);
    if (repoMatch && currentCategory) {
      const [, owner, name, url, description] = repoMatch;
      currentCategory.repos.push({
        owner,
        name,
        url,
        description: description.trim()
      });
    }
  }

  return categories;
}
