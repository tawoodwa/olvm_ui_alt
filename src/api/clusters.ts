import { apiClient } from './client';

export interface Cluster {
  id: string;
  name: string;
}

interface ClusterApiModel {
  id: string;
  name?: string;
}

interface ClustersResponse {
  cluster?: ClusterApiModel[];
}

export async function listClusters(): Promise<Cluster[]> {
  const res = await apiClient.get<ClustersResponse>('/clusters');
  const data = res.data;

  return (data.cluster ?? []).map((c) => ({
    id: c.id,
    name: c.name || c.id,
  }));
}
