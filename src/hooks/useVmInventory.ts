import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listVms, type Vm } from '../api/vms';
import { listClusters, type Cluster } from '../api/clusters';
import { listHosts, type Host } from '../api/hosts';

export interface VmInventory {
  vms: Vm[];
  clusters: Cluster[];
  hosts: Host[];
  isLoading: boolean;
  isError: boolean;
  error?: Error;
}

export function useVmInventory(): VmInventory {
  const vmsQuery = useQuery<Vm[], Error>({
    queryKey: ['vms'],
    queryFn: listVms,
  });

  const clustersQuery = useQuery<Cluster[], Error>({
    queryKey: ['clusters'],
    queryFn: listClusters,
  });

  const hostsQuery = useQuery<Host[], Error>({
    queryKey: ['hosts'],
    queryFn: listHosts,
  });

  const isLoading =
    vmsQuery.isLoading || clustersQuery.isLoading || hostsQuery.isLoading;

  const isError =
    vmsQuery.isError || clustersQuery.isError || hostsQuery.isError;

  const error = vmsQuery.error || clustersQuery.error || hostsQuery.error;

  const clustersById = useMemo(
    () =>
      new Map<string, Cluster>(
        (clustersQuery.data ?? []).map((c) => [c.id, c]),
      ),
    [clustersQuery.data],
  );

  const hostsById = useMemo(
    () =>
      new Map<string, Host>((hostsQuery.data ?? []).map((h) => [h.id, h])),
    [hostsQuery.data],
  );

  // Enrich VMs with cluster/host names resolved via IDs
  const enrichedVms: Vm[] = useMemo(
    () =>
      (vmsQuery.data ?? []).map((vm) => {
        const cluster = vm.clusterId ? clustersById.get(vm.clusterId) : undefined;
        const host = vm.hostId ? hostsById.get(vm.hostId) : undefined;

        return {
          ...vm,
          clusterName: cluster?.name ?? vm.clusterName,
          hostName: host?.name ?? vm.hostName,
        };
      }),
    [vmsQuery.data, clustersById, hostsById],
  );

  return {
    vms: enrichedVms,
    clusters: clustersQuery.data ?? [],
    hosts: hostsQuery.data ?? [],
    isLoading,
    isError,
    error: error ?? undefined,
  };
}
