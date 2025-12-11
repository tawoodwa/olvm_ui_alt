import {
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useVmInventory } from '../hooks/useVmInventory';

export function VmListView() {
  const { vms, isLoading, isError, error } = useVmInventory();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error" gutterBottom>
          Error loading virtual machines
        </Typography>
        <Typography variant="body2">
          {error?.message ?? 'Unknown error'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h4" gutterBottom>
        Virtual Machines
      </Typography>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Cluster</TableCell>
              <TableCell>Host</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vms.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography variant="body2">
                    No virtual machines found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {vms.map((vm) => (
              <TableRow key={vm.id} hover>
                <TableCell>{vm.name}</TableCell>
                <TableCell>{vm.status ?? '-'}</TableCell>
                <TableCell>{vm.clusterName ?? '-'}</TableCell>
                <TableCell>{vm.hostName ?? '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
