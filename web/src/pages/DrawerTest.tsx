import { useState } from "react"
import { DetailDrawer } from "@/components/bloomberg/DetailDrawer"
import {
  Panel,
  DataGrid,
  DataGridHeader,
  DataGridBody,
  DataGridRow,
  DataGridHead,
  DataGridCell,
} from "@/components/bloomberg"
import { Button } from "@/components/ui/button"
import { BloombergLayout, BloombergHeader, BloombergMain } from "@/components/bloomberg"

export function DrawerTest() {
  const [simpleOpen, setSimpleOpen] = useState(false)
  const [tabbedOpen, setTabbedOpen] = useState(false)

  const tabs = [
    {
      value: "overview",
      label: "Overview",
      content: (
        <Panel title="Product Overview" headerColor="cyan">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Total Balance</div>
                <div className="text-2xl font-mono">$4,210,000</div>
              </div>
              <div>
                <div className="text-muted-foreground">Active Loans</div>
                <div className="text-2xl font-mono">1,247</div>
              </div>
              <div>
                <div className="text-muted-foreground">Avg Loan Size</div>
                <div className="text-2xl font-mono">$337,628</div>
              </div>
              <div>
                <div className="text-muted-foreground">Avg Rate</div>
                <div className="text-2xl font-mono">5.5%</div>
              </div>
            </div>
          </div>
        </Panel>
      ),
    },
    {
      value: "buckets",
      label: "Buckets",
      content: (
        <Panel title="Loan Aging Buckets" headerColor="amber">
          <DataGrid>
            <DataGridHeader>
              <tr>
                <DataGridHead>Age</DataGridHead>
                <DataGridHead className="text-right">Count</DataGridHead>
                <DataGridHead className="text-right">Balance</DataGridHead>
                <DataGridHead className="text-right">Default Rate</DataGridHead>
              </tr>
            </DataGridHeader>
            <DataGridBody>
              <DataGridRow>
                <DataGridCell>0-12 months</DataGridCell>
                <DataGridCell numeric>342</DataGridCell>
                <DataGridCell numeric>$1,245,000</DataGridCell>
                <DataGridCell numeric variant="positive">
                  0.2%
                </DataGridCell>
              </DataGridRow>
              <DataGridRow>
                <DataGridCell>13-24 months</DataGridCell>
                <DataGridCell numeric>421</DataGridCell>
                <DataGridCell numeric>$1,680,000</DataGridCell>
                <DataGridCell numeric variant="positive">
                  0.6%
                </DataGridCell>
              </DataGridRow>
              <DataGridRow>
                <DataGridCell>25-36 months</DataGridCell>
                <DataGridCell numeric>284</DataGridCell>
                <DataGridCell numeric>$945,000</DataGridCell>
                <DataGridCell numeric variant="positive">
                  1.2%
                </DataGridCell>
              </DataGridRow>
            </DataGridBody>
          </DataGrid>
        </Panel>
      ),
    },
    {
      value: "transactions",
      label: "Transactions",
      content: (
        <Panel title="Recent Transactions" headerColor="green">
          <DataGrid>
            <DataGridHeader>
              <tr>
                <DataGridHead>Date</DataGridHead>
                <DataGridHead>Type</DataGridHead>
                <DataGridHead className="text-right">Amount</DataGridHead>
              </tr>
            </DataGridHeader>
            <DataGridBody>
              <DataGridRow>
                <DataGridCell>2024-01-15</DataGridCell>
                <DataGridCell>Interest Income</DataGridCell>
                <DataGridCell numeric variant="positive">
                  +$12,450
                </DataGridCell>
              </DataGridRow>
              <DataGridRow>
                <DataGridCell>2024-01-15</DataGridCell>
                <DataGridCell>New Origination</DataGridCell>
                <DataGridCell numeric>$425,000</DataGridCell>
              </DataGridRow>
              <DataGridRow>
                <DataGridCell>2024-01-14</DataGridCell>
                <DataGridCell>Default</DataGridCell>
                <DataGridCell numeric variant="negative">
                  -$3,200
                </DataGridCell>
              </DataGridRow>
            </DataGridBody>
          </DataGrid>
        </Panel>
      ),
    },
    {
      value: "timeseries",
      label: "Time Series",
      content: (
        <Panel title="Historical Performance" headerColor="blue">
          <div className="text-center py-8 text-muted-foreground">
            Chart visualization would go here
          </div>
        </Panel>
      ),
    },
  ]

  return (
    <BloombergLayout>
      <BloombergHeader title="DetailDrawer Component Test" />
      <BloombergMain>
        <div className="p-8 space-y-6">
          <Panel title="DetailDrawer Component Tests" headerColor="amber">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold mb-2 text-bloomberg-cyan">
                  Test 1: Simple Drawer
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Click to open a simple drawer with basic content
                </p>
                <Button onClick={() => setSimpleOpen(true)}>Open Simple Drawer</Button>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="text-lg font-bold mb-2 text-bloomberg-cyan">
                  Test 2: Tabbed Drawer
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Click to open a drawer with tab navigation (Overview, Buckets, Transactions,
                  Time Series)
                </p>
                <Button onClick={() => setTabbedOpen(true)}>Open Tabbed Drawer</Button>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="text-lg font-bold mb-2 text-bloomberg-cyan">
                  Test 3: Clickable Table Rows
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Click on any row to open the detail drawer
                </p>
                <DataGrid>
                  <DataGridHeader>
                    <tr>
                      <DataGridHead>Product</DataGridHead>
                      <DataGridHead className="text-right">Balance</DataGridHead>
                      <DataGridHead className="text-right">Default Rate</DataGridHead>
                    </tr>
                  </DataGridHeader>
                  <DataGridBody>
                    <DataGridRow
                      className="cursor-pointer"
                      onClick={() => setTabbedOpen(true)}
                    >
                      <DataGridCell variant="highlight">Mortgages</DataGridCell>
                      <DataGridCell numeric>$4,210,000</DataGridCell>
                      <DataGridCell numeric variant="positive">
                        0.8%
                      </DataGridCell>
                    </DataGridRow>
                    <DataGridRow
                      className="cursor-pointer"
                      onClick={() => setTabbedOpen(true)}
                    >
                      <DataGridCell variant="highlight">Credit Cards</DataGridCell>
                      <DataGridCell numeric>$840,000</DataGridCell>
                      <DataGridCell numeric variant="warning">
                        3.2%
                      </DataGridCell>
                    </DataGridRow>
                    <DataGridRow
                      className="cursor-pointer"
                      onClick={() => setTabbedOpen(true)}
                    >
                      <DataGridCell variant="highlight">Auto Loans</DataGridCell>
                      <DataGridCell numeric>$620,000</DataGridCell>
                      <DataGridCell numeric variant="positive">
                        1.4%
                      </DataGridCell>
                    </DataGridRow>
                  </DataGridBody>
                </DataGrid>
              </div>
            </div>
          </Panel>
        </div>

        <DetailDrawer open={simpleOpen} onOpenChange={setSimpleOpen} title="Mortgage Loans">
          <div className="space-y-4">
            <Panel title="Summary" headerColor="cyan">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Balance:</span>
                  <span className="font-mono">$4,210,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Rate:</span>
                  <span className="font-mono">5.5%</span>
                </div>
                <div className="flex justify-between">
                  <span>Default Rate:</span>
                  <span className="font-mono text-bloomberg-green">0.8% ✓</span>
                </div>
              </div>
            </Panel>
            <Panel title="Details" headerColor="blue">
              <p className="text-sm text-muted-foreground">
                This is a simple drawer without tabs. You can put any content here.
              </p>
            </Panel>
          </div>
        </DetailDrawer>

        <DetailDrawer
          open={tabbedOpen}
          onOpenChange={setTabbedOpen}
          title="Credit Card Portfolio"
          tabs={tabs}
        />
      </BloombergMain>
    </BloombergLayout>
  )
}
