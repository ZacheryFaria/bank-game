import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function App() {
  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="border-primary border-2 p-4">
          <h1 className="text-center text-3xl font-bold tracking-wider">
            BANK GAME v1.0
          </h1>
          <p className="text-muted-foreground mt-2 text-center text-sm">
            System Online | Session Active
          </p>
        </div>

        {/* Control Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Control Panel</CardTitle>
            <CardDescription>Available Actions</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button>Execute</Button>
            <Button variant="secondary">Configure</Button>
            <Button variant="destructive">Terminate</Button>
            <Button variant="outline">Cancel</Button>
          </CardContent>
        </Card>

        {/* Bank Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Configuration</CardTitle>
            <CardDescription>Update Parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-sm">Bank Name</label>
              <Input placeholder="Enter bank name..." />
            </div>
            <div>
              <label className="mb-2 block text-sm">
                Base Interest Rate (%)
              </label>
              <Input type="number" placeholder="0.00" step="0.01" />
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Overview</CardTitle>
            <CardDescription>Current Holdings by Risk Class</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Risk Class</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Interest Rate</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">AAA</TableCell>
                  <TableCell>$1,250,000</TableCell>
                  <TableCell>3.5%</TableCell>
                  <TableCell className="text-primary">Active</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">AA</TableCell>
                  <TableCell>$875,000</TableCell>
                  <TableCell>4.2%</TableCell>
                  <TableCell className="text-primary">Active</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">BBB</TableCell>
                  <TableCell>$450,000</TableCell>
                  <TableCell>6.8%</TableCell>
                  <TableCell className="text-accent">Warning</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">CCC</TableCell>
                  <TableCell>$125,000</TableCell>
                  <TableCell>12.5%</TableCell>
                  <TableCell className="text-destructive">Critical</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Status Bar */}
        <div className="border-primary text-muted-foreground flex justify-between border p-2 text-xs">
          <span>React 19 | Vite | Tailwind 4 | shadcn/ui</span>
          <span>Theme: Terminal | Status: Operational</span>
        </div>
      </div>
    </div>
  )
}

export default App
