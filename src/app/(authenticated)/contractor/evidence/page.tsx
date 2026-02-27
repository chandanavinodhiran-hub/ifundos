import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Camera, FileText, BarChart3 } from "lucide-react";

export default function EvidenceUploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Submit Evidence</h1>
        <p className="text-muted-foreground mt-1">
          Submit milestone deliverables for AI verification
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evidence Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-leaf-100 flex items-center justify-center">
              <Upload className="w-8 h-8 text-leaf-600" />
            </div>

            <div className="space-y-2 max-w-lg">
              <p className="text-muted-foreground text-sm">
                No milestones to verify yet. After contract award, you&apos;ll upload
                evidence here for each milestone: site photos, drone surveys, survival
                data, and progress reports. AI will verify authenticity before fund
                manager review.
              </p>
            </div>

            <div className="flex items-center gap-6 text-xs text-muted-foreground pt-2">
              <div className="flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-leaf-500" />
                <span>Site Photos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-ocean-500" />
                <span>Reports</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-purple-500" />
                <span>Survey Data</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
