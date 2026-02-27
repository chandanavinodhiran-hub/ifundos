import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, ArrowRight, CheckCircle2, Shield } from "lucide-react";

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">My Payments</h1>
        <p className="text-muted-foreground mt-1">
          Track disbursements tied to verified milestones
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-amber-600" />
            </div>

            <div className="space-y-2 max-w-lg">
              <p className="text-muted-foreground text-sm">
                No payments yet. Payments are released automatically when milestone
                evidence is verified and approved. Each payment is tied to a specific
                deliverable — no milestone, no payment.
              </p>
            </div>

            {/* Payment flow visual */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap justify-center">
              <span className="w-8 h-8 rounded-full bg-leaf-100 flex items-center justify-center text-leaf-600 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <span className="font-medium text-xs">Milestone Verified</span>
              <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
              <span className="w-8 h-8 rounded-full bg-ocean-100 flex items-center justify-center text-ocean-600 font-bold text-xs">
                <Shield className="w-4 h-4" />
              </span>
              <span className="font-medium text-xs">FM Approves</span>
              <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
              <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-xs">
                <CreditCard className="w-4 h-4" />
              </span>
              <span className="font-medium text-xs">Payment Released</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
