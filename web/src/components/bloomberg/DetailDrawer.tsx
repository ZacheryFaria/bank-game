import * as React from "react"
import { Sheet, SheetPortal, SheetOverlay } from "@/components/ui/sheet"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Tab configuration for DetailDrawer
 */
interface Tab {
  value: string
  label: string
  content: React.ReactNode
}

/**
 * Bloomberg-styled drawer component that slides in from the right
 *
 * @example
 * // Simple drawer with children
 * <DetailDrawer
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Mortgage Loans"
 * >
 *   <div>Drawer content here</div>
 * </DetailDrawer>
 *
 * @example
 * // Drawer with tabs
 * <DetailDrawer
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Credit Card Portfolio"
 *   tabs={[
 *     { value: "overview", label: "Overview", content: <OverviewTab /> },
 *     { value: "buckets", label: "Buckets", content: <BucketsTab /> },
 *     { value: "transactions", label: "Transactions", content: <TransactionsTab /> },
 *   ]}
 * />
 */
interface DetailDrawerProps {
  /** Whether the drawer is open */
  open: boolean
  /** Callback when the drawer open state changes */
  onOpenChange: (open: boolean) => void
  /** Title displayed in the amber header bar */
  title: string
  /** Optional tab configuration. If provided, renders tabbed interface */
  tabs?: Tab[]
  /** Content to display when not using tabs */
  children?: React.ReactNode
  /** Additional className for SheetContent */
  className?: string
}

export function DetailDrawer({
  open,
  onOpenChange,
  title,
  tabs,
  children,
  className,
}: DetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetPortal>
        <SheetOverlay />
        <SheetPrimitive.Content
          className={cn(
            "fixed z-50 gap-4 bg-background shadow-lg transition ease-in-out",
            "data-[state=closed]:duration-300 data-[state=open]:duration-500",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "inset-y-0 right-0 h-full border-l",
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
            "w-full sm:max-w-2xl lg:max-w-3xl bg-card border-border",
            "overflow-hidden flex flex-col p-0",
            className
          )}
        >
          <div className="bg-bloomberg-amber px-4 py-2 flex items-center justify-between">
            <h2 className="text-black font-bold text-sm uppercase tracking-wider">
              {title}
            </h2>
            <button
              onClick={() => onOpenChange(false)}
              className="hover:bg-black/10 rounded-sm p-1 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-black" />
            </button>
          </div>

          {tabs && tabs.length > 0 ? (
            <Tabs defaultValue={tabs[0]?.value} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="bg-secondary/50 border-b border-border rounded-none w-full justify-start h-auto p-0">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-bloomberg-amber data-[state=active]:bg-transparent font-mono text-xs uppercase tracking-wider"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {tabs.map((tab) => (
                <TabsContent
                  key={tab.value}
                  value={tab.value}
                  className="flex-1 overflow-auto p-4 m-0"
                >
                  {tab.content}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="flex-1 overflow-auto p-4">{children}</div>
          )}
        </SheetPrimitive.Content>
      </SheetPortal>
    </Sheet>
  )
}

export type { DetailDrawerProps, Tab }
