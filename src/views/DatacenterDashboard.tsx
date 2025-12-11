// src/views/DatacenterDashboard.tsx
import {
  Box,
  CircularProgress,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import { useVmInventory } from '../hooks/useVmInventory';

export function DatacenterDashboard() {
  const { vms, isLoading, isError, error } = useVmInventory();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Datacenter summary
        </Typography>
        <Typography variant="body1" color="error" gutterBottom>
          Error loading datacenter metrics
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error?.message ?? 'Unknown error'}
        </Typography>
      </Box>
    );
  }

  const datacenterName = 'home.lab';

  const clusterNames = new Set<string>();
  const hostNames = new Set<string>();
  let inactiveVmCount = 0;

  let runningVmCount = 0;
  let stoppedVmCount = 0;

  for (const vm of vms) {
    if (vm.clusterName) {
      clusterNames.add(vm.clusterName);
    }

    if (vm.hostName) {
      hostNames.add(vm.hostName);
    } else {
      inactiveVmCount += 1;
    }

    const status = (vm.status ?? '').toLowerCase();
    if (status === 'up' || status === 'running') {
      runningVmCount += 1;
    } else {
      stoppedVmCount += 1;
    }
  }

  const totalVms = vms.length;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Datacenter summary
      </Typography>

      {/* Top summary tiles, similar idea to OLVM dashboard */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Data centers
            </Typography>
            <Typography variant="h4">1</Typography>
            <Typography variant="body2" color="text.secondary">
              {datacenterName}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Clusters
            </Typography>
            <Typography variant="h4">
              {clusterNames.size || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              From VM metadata
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Hosts
            </Typography>
            <Typography variant="h4">
              {hostNames.size || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Unique VM host names
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Virtual machines
            </Typography>
            <Typography variant="h4">{totalVms}</Typography>
            <Typography variant="body2" color="text.secondary">
              All VMs in this environment
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Running VMs
            </Typography>
            <Typography variant="h4">{runningVmCount}</Typography>
            <Typography variant="body2" color="text.secondary">
              Status = up / running
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Inactive VMs
            </Typography>
            <Typography variant="h4">{inactiveVmCount}</Typography>
            <Typography variant="body2" color="text.secondary">
              VMs without a host assignment
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Global utilization placeholders */}
      <Typography variant="h6" gutterBottom>
        Global utilization
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              CPU
            </Typography>
            <Typography variant="h4" sx={{ mt: 1 }}>
              N/A
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Hook up host metrics later.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Memory
            </Typography>
            <Typography variant="h4" sx={{ mt: 1 }}>
              N/A
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Will pull from hosts / clusters when available.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Storage
            </Typography>
            <Typography variant="h4" sx={{ mt: 1 }}>
              N/A
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Will mirror OLVM storage domain stats later.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
