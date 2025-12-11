import { apiClient } from './client';

export interface Vm {
  id: string;
  name: string;
  status?: string;
  clusterId?: string;
  clusterName?: string;
  hostId?: string;
  hostName?: string;
}

interface VmApiModel {
  id: string;
  name: string;
  status?: { state: string };
  cluster?: { id: string; name?: string };
  host?: { id: string; name?: string };
}

interface VmsResponse {
  vm?: VmApiModel[];
}

export async function listVms(): Promise<Vm[]> {
  const res = await apiClient.get<VmsResponse>('/vms');
  const data = res.data;

  return (data.vm ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    status: v.status?.state,
    clusterId: v.cluster?.id,
    clusterName: v.cluster?.name,
    hostId: v.host?.id,
    hostName: v.host?.name,
  }));
}
