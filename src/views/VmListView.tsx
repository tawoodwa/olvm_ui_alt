import { useQuery } from '@tanstack/react-query';
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
import { listVms } from '../api/vms';
import type { Vm } from '../api/vms';

export function VmListView() {
  const { data, isLoading, isError, error } = useQuery<Vm[], Error>({
    queryKey: ['vms'],
    queryFn: listVms,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography color="error">
          Failed to load virtual machines: {error.message}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Virtual Machines
      </Typography>

      <Paper>
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
            {data && data.length > 0 ? (
              data.map((vm) => (
                <TableRow key={vm.id}>
                  <TableCell>{vm.name}</TableCell>
                  <TableCell>{vm.status}</TableCell>
                  <TableCell>{vm.clusterName}</TableCell>
                  <TableCell>{vm.hostName}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography variant="body2">
                    No virtual machines found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
