"""
GitHub Client - Fetch code từ GitHub repository
"""
import re
from typing import Dict, List, Optional
import requests


class GitHubClient:
    """Client để fetch code từ GitHub"""
    
    def __init__(self, token: Optional[str] = None):
        self.token = token
        self.base_url = "https://api.github.com"
        self.headers = {
            "Accept": "application/vnd.github.v3+json"
        }
        if token:
            self.headers["Authorization"] = f"token {token}"
    
    def parse_github_url(self, url: str) -> Optional[Dict[str, str]]:
        """
        Parse GitHub URL thành owner, repo, branch, path
        
        Examples:
            https://github.com/owner/repo
            https://github.com/owner/repo/tree/branch
            https://github.com/owner/repo/blob/branch/path/to/file.js
        """
        # Pattern: https://github.com/{owner}/{repo}
        pattern = r"https://github\.com/([^/]+)/([^/]+)(?:/tree/([^/]+))?(?:/blob/([^/]+)/(.+))?/?$"
        match = re.match(pattern, url)
        
        if not match:
            return None
        
        owner = match.group(1)
        repo = match.group(2)
        branch = match.group(3) or match.group(4) or "main"  # Use branch or default to main
        file_path = match.group(5) if match.group(5) else None
        
        return {
            "owner": owner,
            "repo": repo,
            "branch": branch,
            "path": file_path
        }
    
    def fetch_repo_contents(
        self,
        owner: str,
        repo: str,
        path: str = "",
        branch: str = "main",
        max_files: int = 20
    ) -> List[Dict]:
        """
        Fetch contents từ GitHub repository
        
        Returns:
            List of files với content
        """
        url = f"{self.base_url}/repos/{owner}/{repo}/contents/{path}"
        params = {"ref": branch}
        
        try:
            response = requests.get(url, headers=self.headers, params=params, timeout=10)
            response.raise_for_status()
            items = response.json()
            
            # Nếu là single file
            if isinstance(items, dict) and items.get("type") == "file":
                return [self._fetch_file_content(items)]
            
            # Nếu là directory
            files = []
            for item in items:
                if item.get("type") == "file":
                    # Fetch file content
                    file_data = self._fetch_file_content(item)
                    if file_data:
                        files.append(file_data)
                        if len(files) >= max_files:
                            break
                elif item.get("type") == "dir" and len(files) < max_files:
                    # Recursive fetch (limit depth)
                    sub_files = self.fetch_repo_contents(
                        owner, repo, item["path"], branch, max_files - len(files)
                    )
                    files.extend(sub_files)
            
            return files
        
        except requests.exceptions.RequestException as e:
            return [{"error": f"Failed to fetch from GitHub: {str(e)}"}]
    
    def _fetch_file_content(self, file_item: Dict) -> Optional[Dict]:
        """Fetch content của một file"""
        download_url = file_item.get("download_url")
        if not download_url:
            return None
        
        try:
            response = requests.get(download_url, headers=self.headers, timeout=10)
            response.raise_for_status()
            
            # Limit file size (1MB)
            content = response.text
            if len(content.encode('utf-8')) > 1024 * 1024:
                content = content[:50000] + "\n... (file too large, truncated)"
            
            return {
                "name": file_item.get("name"),
                "path": file_item.get("path"),
                "size": file_item.get("size"),
                "content": content,
                "type": file_item.get("type"),
                "sha": file_item.get("sha")
            }
        except requests.exceptions.RequestException as e:
            return {
                "name": file_item.get("name"),
                "path": file_item.get("path"),
                "error": f"Failed to fetch content: {str(e)}"
            }
    
    def fetch_from_url(self, github_url: str, max_files: int = 20) -> Dict:
        """
        Fetch code từ GitHub URL
        
        Returns:
            {
                "owner": "...",
                "repo": "...",
                "branch": "...",
                "files": [...]
            }
        """
        parsed = self.parse_github_url(github_url)
        if not parsed:
            return {"error": "Invalid GitHub URL"}
        
        files = self.fetch_repo_contents(
            parsed["owner"],
            parsed["repo"],
            parsed.get("path", ""),
            parsed["branch"],
            max_files
        )
        
        return {
            "url": github_url,
            "owner": parsed["owner"],
            "repo": parsed["repo"],
            "branch": parsed["branch"],
            "path": parsed.get("path"),
            "files": files,
            "total_files": len(files)
        }

