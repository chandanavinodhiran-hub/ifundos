import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyContractsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy-800">My Contracts</h1>
      <Card>
        <CardHeader><CardTitle>My Contracts</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This module will be available in Phase 2.</p>
        </CardContent>
      </Card>
    </div>
  );
}
