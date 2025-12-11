// src/App.tsx
import { useMemo, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
  Collapse,
  CircularProgress,
} from '@mui/material';
import DnsIcon from '@mui/icons-material/Dns';
import ComputerIcon from '@mui/icons-material/Computer';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { VmListView } from './views/VmListView';
import { useVmInventory } from './hooks/useVmInventory';
import type { Vm } from './api/vms';

const drawerWidth = 320;

interface HostGroup {
  name: string;
  vms: Vm[];
}

interface ClusterGroup {
  name: string;
  hosts: HostGroup[];
}

function buildClusterTree(vms: Vm[]): ClusterGroup[] {
  const clusterMap = new Map<string, Map<string, Vm[]>>();

  for (const vm of vms) {
    const clusterName = vm.clusterName || 'Unassigned cluster';
    // Default host bucket for VMs without a host assignment:
    const hostName = vm.hostName || 'Inactive VMs';

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

  const inactiveLabel = 'Inactive VMs';

  return Array.from(clusterMap.entries())
    .sort(([aName], [bName]) => aName.localeCompare(bName))
    .map<ClusterGroup>(([clusterName, hostsMap]) => ({
      name: clusterName,
      hosts: Array.from(hostsMap.entries())
        .sort(([aName], [bName]) => {
          const aIsInactive = aName === inactiveLabel;
          const bIsInactive = bName === inactiveLabel;

          if (aIsInactive && !bIsInactive) return 1;   // Inactive goes last
          if (!aIsInactive && bIsInactive) return -1;  // Normal hosts before
          return aName.localeCompare(bName);
        })
        .map<HostGroup>(([hostName, vmsForHost]) => ({
          name: hostName,
          vms: vmsForHost.slice().sort((a, b) => a.name.localeCompare(b.name)),
        })),
    }));
}

export default function App() {
  const { vms, isLoading, isError, error } = useVmInventory();

  const [expandedClusters, setExpandedClusters] = useState<Record<string, boolean>>({});
  const [expandedHosts, setExpandedHosts] = useState<Record<string, boolean>>({});

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

  return (
    <>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap sx={{ mr: 4 }}>
            OLVM Manager
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Datacenter: <strong>home.lab</strong>
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', height: '100vh' }}>
        {/* Left navigation tree */}
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: (theme) => `1px solid ${theme.palette.divider}`,
            },
          }}
        >
          <Toolbar />
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Datacenter
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              home.lab
            </Typography>
          </Box>
          <Divider />

          {isLoading && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 4,
              }}
            >
              <CircularProgress size={24} />
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
            <List component="nav" disablePadding>
              {clusterTree.map((cluster, clusterIndex) => {
                const clusterExpanded = Object.prototype.hasOwnProperty.call(
                  expandedClusters,
                  cluster.name,
                )
                  ? expandedClusters[cluster.name]
                  : clusterIndex === 0;

                const totalVms = cluster.hosts.reduce(
                  (sum, host) => sum + host.vms.length,
                  0,
                );

                return (
                  <Box key={cluster.name}>
                    <ListItemButton
                      onClick={() =>
                        handleClusterToggle(cluster.name, clusterExpanded)
                      }
                    >
                      <DnsIcon fontSize="small" sx={{ mr: 1 }} />
                      <ListItemText
                        primary={cluster.name}
                        secondary={`${cluster.hosts.length} host${
                          cluster.hosts.length === 1 ? '' : 's'
                        } • ${totalVms} VM${totalVms === 1 ? '' : 's'}`}
                      />
                      {clusterExpanded ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>

                    <Collapse in={clusterExpanded} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {cluster.hosts.map((host, hostIndex) => {
                          const hostKey = `${cluster.name}::${host.name}`;
                          const hostExpanded = Object.prototype.hasOwnProperty.call(
                            expandedHosts,
                            hostKey,
                          )
                            ? expandedHosts[hostKey]
                            : hostIndex === 0;

                          return (
                            <Box key={hostKey}>
                              <ListItemButton
                                sx={{ pl: 4 }}
                                onClick={() =>
                                  handleHostToggle(hostKey, hostExpanded)
                                }
                              >
                                <ComputerIcon fontSize="small" sx={{ mr: 1 }} />
                                <ListItemText
                                  primary={host.name}
                                  secondary={`${host.vms.length} VM${
                                    host.vms.length === 1 ? '' : 's'
                                  }`}
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
                                      sx={{ pl: 8 }}
                                    >
                                      <DesktopWindowsIcon
                                        fontSize="small"
                                        sx={{ mr: 1 }}
                                      />
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
                    <Divider />
                  </Box>
                );
              })}
            </List>
          )}
        </Drawer>

        {/* Main content area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            mt: 8, // offset AppBar
            overflow: 'auto',
          }}
        >
          <Routes>
            <Route path="/" element={<VmListView />} />
          </Routes>
        </Box>
      </Box>
    </>
  );
}
