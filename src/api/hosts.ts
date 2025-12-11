import { apiClient } from './client';

export interface Host {
  id: string;
  name: string;
}

interface HostApiModel {
  id: string;
  name?: string;
}

interface HostsResponse {
  host?: HostApiModel[];
}

export async function listHosts(): Promise<Host[]> {
  const res = await apiClient.get<HostsResponse>('/hosts');
  const data = res.data;

  return (data.host ?? []).map((h) => ({
    id: h.id,
    name: h.name || h.id,
  }));
}
