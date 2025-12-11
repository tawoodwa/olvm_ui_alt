// src/layout/AppLayout.tsx
import { ReactNode, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AppBar,
  Box,
  Collapse,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import ComputerIcon from '@mui/icons-material/Computer';
import StorageIcon from '@mui/icons-material/Storage';
import DnsIcon from '@mui/icons-material/Dns';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

import { listVms } from '../api/vms';
import type { Vm } from '../api/vms';

const drawerWidth = 260;

interface AppLayoutProps {
  children: ReactNode;
}

interface HostGroup {
  name: string;
  vms: Vm[];
}

interface ClusterGroup {
  name: string;
  hosts: HostGroup[];
}

function buildInventory(vms: Vm[]): ClusterGroup[] {
  const clusterMap = new Map<string, Map<string, Vm[]>>();

  for (const vm of vms) {
    const clusterName = vm.clusterName || 'Unassigned cluster';
    const hostName = vm.hostName || 'Unassigned host';

    let hostsMap = clusterMap.get(clusterName);
    if (!hostsMap) {
      hostsMap = new Map<string, Vm[]>();
      clusterMap.set(clusterName, hostsMap);
    }

    let vmList = hostsMap.get(hostName);
    if (!vmList) {
      vmList = [];
      hostsMap.set(hostName, vmList);
    }

    vmList.push(vm);
  }

  return Array.from(clusterMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([clusterName, hostMap]) => ({
      name: clusterName,
      hosts: Array.from(hostMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([hostName, vmsForHost]) => ({
          name: hostName,
          vms: vmsForHost.slice().sort((a, b) => a.name.localeCompare(b.name)),
        })),
    }));
}

export function AppLayout({ children }: AppLayoutProps) {
  // Reuse the same vms query here; React Query will cache/dedupe it.
  const {
    data: vms,
    isLoading: vmsLoading,
    isError: vmsError,
  } = useQuery<Vm[], Error>({
    queryKey: ['vms'],
    queryFn: listVms,
  });

  const inventory = useMemo(
    () => (vms ? buildInventory(vms) : []),
    [vms],
  );

  // Track which clusters and hosts are expanded in the tree
  const [expandedClusters, setExpandedClusters] = useState<Record<string, boolean>>({});
  const [expandedHosts, setExpandedHosts] = useState<Record<string, boolean>>({});

  const toggleCluster = (clusterName: string) => {
    setExpandedClusters((prev) => ({
      ...prev,
      [clusterName]: !(prev[clusterName] ?? true),
    }));
  };

  const toggleHost = (clusterName: string, hostName: string) => {
    const key = `${clusterName}::${hostName}`;
    setExpandedHosts((prev) => ({
      ...prev,
      [key]: !(prev[key] ?? false),
    }));
  };

  const isClusterExpanded = (clusterName: string) =>
    expandedClusters[clusterName] ?? true;

  const isHostExpanded = (clusterName: string, hostName: string) =>
    expandedHosts[`${clusterName}::${hostName}`] ?? false;

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      {/* Top bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar variant="dense">
          <Typography variant="h6" noWrap sx={{ mr: 4 }}>
            OLVM Manager
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Datacenter: <strong>home.lab</strong>
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Left navigation / tree */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: 1,
            borderColor: 'divider',
          },
        }}
      >
        {/* Offset for AppBar */}
        <Toolbar variant="dense" />

        <Box sx={{ overflow: 'auto' }}>
          {/* Datacenter header */}
          <List>
            <ListItemButton selected>
              <ListItemText
                primary="Datacenter"
                secondary="home.lab"
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItemButton>
          </List>

          <Divider />

          {/* Inventory tree: Datacenter > Clusters > Hosts > VMs */}
          <List sx={{ py: 0 }}>
            {vmsLoading && (
              <ListItem>
                <ListItemText primary="Loading inventory..." />
              </ListItem>
            )}

            {vmsError && (
              <ListItem>
                <ListItemText primary="Failed to load inventory" />
              </ListItem>
            )}

            {!vmsLoading && !vmsError && inventory.length === 0 && (
              <ListItem>
                <ListItemText primary="No VMs found" />
              </ListItem>
            )}

            {!vmsLoading &&
              !vmsError &&
              inventory.map((cluster) => {
                const clusterExpanded = isClusterExpanded(cluster.name);

                return (
                  <Box key={cluster.name}>
                    {/* Cluster level */}
                    <ListItemButton onClick={() => toggleCluster(cluster.name)}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <DnsIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={cluster.name}
                        secondary={
                          cluster.hosts.length > 0
                            ? `Hosts: ${cluster.hosts.length}`
                            : undefined
                        }
                      />
                      {clusterExpanded ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>

                    <Collapse in={clusterExpanded} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {cluster.hosts.map((host) => {
                          const hostExpanded = isHostExpanded(
                            cluster.name,
                            host.name,
                          );
                          const hostKey = `${cluster.name}::${host.name}`;

                          return (
                            <Box key={hostKey}>
                              {/* Host level */}
                              <ListItemButton
                                sx={{ pl: 4 }}
                                onClick={() =>
                                  toggleHost(cluster.name, host.name)
                                }
                              >
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                  <ComputerIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={host.name}
                                  secondary={
                                    host.vms.length > 0
                                      ? `${host.vms.length} VM${
                                          host.vms.length === 1 ? '' : 's'
                                        }`
                                      : 'No VMs'
                                  }
                                />
                                {hostExpanded ? <ExpandLess /> : <ExpandMore />}
                              </ListItemButton>

                              {/* VM level */}
                              <Collapse
                                in={hostExpanded}
                                timeout="auto"
                                unmountOnExit
                              >
                                <List component="div" disablePadding>
                                  {host.vms.map((vm) => (
                                    <ListItemButton
                                      key={vm.id}
                                      sx={{ pl: 7 }}
                                      // Later we can hook this up to selection / details
                                    >
                                      <ListItemIcon sx={{ minWidth: 32 }}>
                                        <ComputerIcon fontSize="small" />
                                      </ListItemIcon>
                                      <ListItemText primary={vm.name} />
                                    </ListItemButton>
                                  ))}
                                </List>
                              </Collapse>
                            </Box>
                          );
                        })}
                      </List>
                    </Collapse>
                  </Box>
                );
              })}
          </List>

          <Divider />

          {/* Other sections like Events / Tasks remain simple for now */}
          <List>
            <ListItemButton>
              <ListItemText primary="Events" />
            </ListItemButton>
            <ListItemButton>
              <ListItemText primary="Tasks" />
            </ListItemButton>
          </List>

          <Divider />

          {/* Placeholder for future Storage tree */}
          <List>
            <ListItemButton>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <StorageIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Storage" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>

      {/* Main content pane */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          bgcolor: 'background.default',
          p: 2,
        }}
      >
        {/* Offset for AppBar */}
        <Toolbar variant="dense" />
        {children}
      </Box>
    </Box>
  );
}
