import { Octokit } from '@octokit/rest';

export const getOctokit = (token?: string) => {
  return new Octokit({
    auth: token || process.env.GITHUB_TOKEN,
  });
};

export const octokitAdmin = new Octokit({
  auth: process.env.GITHUB_ADMIN_TOKEN || process.env.GITHUB_TOKEN,
});
