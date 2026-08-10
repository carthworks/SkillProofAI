import axios from 'axios';

/**
 * Calculates a GitHub score based on user's public GitHub profile.
 * Maximum score is 100.
 */
export async function calculateGithubScore(githubUsername: string): Promise<number> {
  if (!githubUsername) return 0;

  try {
    const response = await axios.get(`https://api.github.com/users/${githubUsername}`, {
      // Optional: Add headers for authorization if rate limits are hit in the future
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'TalentForge-POC'
      },
      timeout: 10000,
    });

    const data = response.data;

    let score = 0;

    // 1. Public Repositories (Max 30 points) - 2 points per repo
    const repos = data.public_repos || 0;
    score += Math.min(30, repos * 2);

    // 2. Followers (Max 30 points) - 2 points per follower
    const followers = data.followers || 0;
    score += Math.min(30, followers * 2);

    // 3. Account Age (Max 20 points) - 5 points per year
    if (data.created_at) {
      const createdYear = new Date(data.created_at).getFullYear();
      const currentYear = new Date().getFullYear();
      const ageYears = Math.max(0, currentYear - createdYear);
      score += Math.min(20, ageYears * 5);
    }

    // 4. Profile Completeness (Max 20 points)
    // 5 points each for bio, company, location, blog
    if (data.bio) score += 5;
    if (data.company) score += 5;
    if (data.location) score += 5;
    if (data.blog) score += 5;

    return Math.min(100, Math.round(score));
  } catch (error) {
    console.error(`[GitHub Service] Failed to calculate score for ${githubUsername}:`, (error as Error).message);
    return 0; // Return 0 if API fails or user not found
  }
}
