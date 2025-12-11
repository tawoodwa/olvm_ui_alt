// src/App.tsx
import { useMemo, useState } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Collapse,
  CssBaseline,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DnsIcon from '@mui/icons-material/Dns';
import ComputerIcon from '@mui/icons-material/Computer';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

import { VmListView } from './views/VmListView';
import { DatacenterDashboard } from './views/DatacenterDashboard';
import { useVmInventory } from './hooks/useVmInventory';
import type { Vm } from './api/vms';

const drawerWidth = 320;
const INACTIVE_LABEL = 'Inactive VMs';

interface HostGroup {
  name: string;
  vms: Vm[];
}

interface ClusterGroup {
  name: string;
  hosts: HostGroup[];
}

type MainView = 'datacenter' | 'vms';

function buildClusterTree(vms: Vm[]): ClusterGroup[] {
  const clusterMap = new Map<string, Map<string, Vm[]>>();

  for (const vm of vms) {
    const clusterName = vm.clusterName || 'Unassigned cluster';
    const hostName = vm.hostName || INACTIVE_LABEL;

    let hostsMap = clusterMap.get(clusterName);
    if (!hostsMap) {
      hostsMap = new Map<string, Vm[]>();
      clusterMap.set(clusterName, hostsMap);
    }

    let hostVms = hostsMap.get(hostName);
    if (!hostVms) {
      hostVms = [];
      hostsMap.set(hostName, hostVms);
    }

    hostVms.push(vm);
  }

  return Array.from(clusterMap.entries())
    .sort(([aName], [bName]) => aName.localeCompare(bName))
    .map(([clusterName, hostsMap]) => ({
      name: clusterName,
      hosts: Array.from(hostsMap.entries())
        .sort(([aName, bName]) => {
          const aInactive = aName === INACTIVE_LABEL;
          const bInactive = bName === INACTIVE_LABEL;
          if (aInactive && !bInactive) return 1; // inactive last
          if (!aInactive && bInactive) return -1;
          return aName.localeCompare(bName);
        })
        .map(([hostName, vmsForHost]) => ({
          name: hostName,
          vms: vmsForHost.slice().sort((a, b) => a.name.localeCompare(b.name)),
        })),
    }));
}

export default function App() {
  const { vms, isLoading, isError, error } = useVmInventory();

  const [expandedClusters, setExpandedClusters] = useState<Record<string, boolean>>({});
  const [expandedHosts, setExpandedHosts] = useState<Record<string, boolean>>({});
  const [mainView, setMainView] = useState<MainView>('vms');

  const clusterTree = useMemo(() => buildClusterTree(vms), [vms]);

  const handleClusterToggle = (clusterName: string, currentlyOpen: boolean) => {
    setExpandedClusters((prev) => ({
      ...prev,
      [clusterName]: !currentlyOpen,
    }));
  };

  const handleHostToggle = (hostKey: string, currentlyOpen: boolean) => {
    setExpandedHosts((prev) => ({
      ...prev,
      [hostKey]: !currentlyOpen,
    }));
  };

  const handleSelectDatacenter = () => setMainView('datacenter');
  const handleSelectVms = () => setMainView('vms');

  const totalHosts = useMemo(() => {
    const hostNames = new Set<string>();
    for (const cluster of clusterTree) {
      for (const host of cluster.hosts) {
        if (host.name === INACTIVE_LABEL) continue;
        hostNames.add(host.name);
      }
    }
    return hostNames.size;
  }, [clusterTree]);

  const configuredUser =
    import.meta.env.VITE_OVIRT_USER || 'admin@ovirt';

  const userInitial =
    configuredUser && configuredUser.length > 0
      ? configuredUser.charAt(0).toUpperCase()
      : '?';

  return (
    <>
      <CssBaseline />

      {/* Top bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          {/* Left side: product + datacenter */}
          <Typography variant="h6" noWrap sx={{ mr: 4 }}>
            OLVM Manager
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Datacenter: <strong>home.lab</strong>
          </Typography>

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Create VM button (original styling) */}
          <Button
            variant="contained"
            size="small"
            startIcon={<AddCircleOutlineIcon />}
            sx={{
              textTransform: 'none',
              mr: 2,
            }}
            onClick={() => {
              // placeholder for future Create VM flow
            }}
          >
            Create VM
          </Button>

          {/* Current user pill (original styling) */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 1.5,
              py: 0.5,
              borderRadius: 999,
              bgcolor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <Avatar
              sx={{
                width: 24,
                height: 24,
                mr: 1,
                fontSize: 14,
                bgcolor: 'rgba(255, 255, 255, 0.2)',
              }}
            >
              {userInitial}
            </Avatar>
            <Typography
              variant="body2"
              noWrap
              sx={{ maxWidth: 220 }}
              title={configuredUser}
            >
              {configuredUser}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', height: '100vh' }}>
        {/* Left navigation drawer */}
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
        >
          <Toolbar />

          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Datacenter header */}
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Datacenter
              </Typography>
              <ListItemButton
                sx={{ mt: 0.5, borderRadius: 1 }}
                selected={mainView === 'datacenter'}
                onClick={handleSelectDatacenter}
              >
                <ListItemText
                  primary="Default"
                  secondary={`${totalHosts} hosts • ${vms.length} VMs`}
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItemButton>
            </Box>

            <Divider />

            {/* Cluster / host / VM tree */}
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              {isLoading && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mt: 2,
                  }}
                >
                  <CircularProgress size={20} />
                </Box>
              )}

              {isError && (
                <Box sx={{ p: 2 }}>
                  <Typography variant="body2" color="error">
                    Failed to load inventory: {error?.message ?? 'Unknown error'}
                  </Typography>
                </Box>
              )}

              {!isLoading && !isError && (
                <List disablePadding>
                  {clusterTree.map((cluster, clusterIndex) => {
                    const clusterExpanded =
                      Object.prototype.hasOwnProperty.call(
                        expandedClusters,
                        cluster.name,
                      )
                        ? expandedClusters[cluster.name]
                        : clusterIndex === 0;

                    const vmCount = cluster.hosts.reduce(
                      (sum, host) => sum + host.vms.length,
                      0,
                    );
                    const hostCount = cluster.hosts.filter(
                      (h) => h.name !== INACTIVE_LABEL,
                    ).length;

                    return (
                      <Box key={cluster.name}>
                        <ListItemButton
                          onClick={() => {
                            handleClusterToggle(cluster.name, clusterExpanded);
                            handleSelectVms();
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <DnsIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={cluster.name}
                            secondary={`${hostCount} hosts • ${vmCount} VMs`}
                          />
                          {clusterExpanded ? <ExpandLess /> : <ExpandMore />}
                        </ListItemButton>

                        <Collapse in={clusterExpanded} timeout="auto" unmountOnExit>
                          <List component="div" disablePadding>
                            {cluster.hosts.map((host, hostIndex) => {
                              const hostKey = `${cluster.name}::${host.name}`;
                              const hostExpanded =
                                Object.prototype.hasOwnProperty.call(
                                  expandedHosts,
                                  hostKey,
                                )
                                  ? expandedHosts[hostKey]
                                  : hostIndex === 0;

                              const isInactive = host.name === INACTIVE_LABEL;

                              return (
                                <Box key={hostKey}>
                                  <ListItemButton
                                    sx={{ pl: 4 }}
                                    onClick={() => {
                                      handleHostToggle(hostKey, hostExpanded);
                                      handleSelectVms();
                                    }}
                                  >
                                    <ListItemIcon sx={{ minWidth: 32 }}>
                                      <ComputerIcon
                                        fontSize="small"
                                        color={isInactive ? 'disabled' : 'inherit'}
                                      />
                                    </ListItemIcon>
                                    <ListItemText
                                      primary={host.name}
                                      secondary={`${host.vms.length} VMs`}
                                    />
                                    {hostExpanded ? <ExpandLess /> : <ExpandMore />}
                                  </ListItemButton>

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
                                          onClick={handleSelectVms}
                                        >
                                          <ListItemIcon sx={{ minWidth: 32 }}>
                                            <DesktopWindowsIcon fontSize="small" />
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
              )}
            </Box>
          </Box>
        </Drawer>

        {/* Main content pane */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: (theme) => theme.palette.background.default,
            p: 3,
          }}
        >
          {/* offset for AppBar */}
          <Toolbar />
          {mainView === 'datacenter' ? <DatacenterDashboard /> : <VmListView />}
        </Box>
      </Box>
    </>
  );
}
