import { authService } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export type Project = {
  id: number;
  user_id: number;
  title: string;
  thumbnail_url: string | null;
  created_at: string;
};

function buildAuthHeaders(): HeadersInit {
  const token = authService.getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE_URL}/projects`, {
    method: 'GET',
    headers: buildAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error('Failed to fetch projects');
  }

  const data = await res.json();
  return data as Project[];
}

export async function fetchProjectById(id: number | string): Promise<Project> {
  const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'GET',
    headers: buildAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error('Failed to fetch project details');
  }

  return await res.json();
}

export async function createProject(
  title: string,
  thumbnailUrl: string | null
): Promise<Project> {
  const res = await fetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify({ title, thumbnailUrl }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || 'Failed to create project');
  }

  const data = await res.json();
  return data as Project;
}

export async function updateProject(
  id: number | string, 
  title: string,
  thumbnailUrl?: string | null
) {
  const body: any = { title };
  if (thumbnailUrl !== undefined) {
    body.thumbnailUrl = thumbnailUrl;
  }

  const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'PUT',
    headers: buildAuthHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error('Error updating project');
  }
  return res.json();
}

export async function deleteProject(id: number | string) {
  const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error('Error deleting project');
  }
  return res.json();
}

export async function updateProjectTitle(id: number | string, newTitle: string) {
  return updateProject(id, newTitle);
}

export const getAllProjects = fetchProjects;