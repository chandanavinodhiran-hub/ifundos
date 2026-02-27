"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  ArrowLeft,
  Save,
  Send,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  Calendar,
} from "lucide-react";

interface QuestionnaireQuestion {
  id: string;
  questionText: string;
  questionType: string; // SHORT_ANSWER | LONG_ANSWER | MULTIPLE_CHOICE | FILE_UPLOAD
  isRequired: boolean;
  sortOrder: number;
  options: string | null; // JSON array for multiple choice
}

interface QuestionnaireResponse {
  id: string;
  questionId: string;
  responseText: string | null;
  filePath: string | null;
}

interface QuestionnaireData {
  applicationId: string;
  rfpTitle: string;
  rfpDeadline: string | null;
  questionnaireStatus: string;
  questions: QuestionnaireQuestion[];
  responses: QuestionnaireResponse[];
}

function parseSafe<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export default function QuestionnaireResponsePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: applicationId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<QuestionnaireData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [fileNames, setFileNames] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchQuestionnaire() {
      try {
        const res = await fetch(
          `/api/applications/${applicationId}/questionnaire`
        );
        if (!res.ok) throw new Error("Failed to fetch questionnaire");
        const result = await res.json();
        setData(result);

        // Pre-fill existing responses
        if (result.responses && Array.isArray(result.responses)) {
          const prefilled: Record<string, string> = {};
          const files: Record<string, string> = {};
          for (const resp of result.responses) {
            if (resp.responseText) {
              prefilled[resp.questionId] = resp.responseText;
            }
            if (resp.filePath) {
              files[resp.questionId] = resp.filePath;
            }
          }
          setAnswers(prefilled);
          setFileNames(files);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load questionnaire"
        );
      } finally {
        setLoading(false);
      }
    }
    fetchQuestionnaire();
  }, [applicationId]);

  const updateAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleFileSelect = (questionId: string, file: File | null) => {
    if (!file) return;
    setFileNames((prev) => ({ ...prev, [questionId]: file.name }));
    setAnswers((prev) => ({
      ...prev,
      [questionId]: `[FILE] ${file.name}`,
    }));
  };

  const handleSaveDraft = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const responses = Object.entries(answers).map(
        ([questionId, responseText]) => ({
          questionId,
          responseText,
        })
      );
      const res = await fetch(
        `/api/applications/${applicationId}/questionnaire`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ responses }),
        }
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save draft");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const responses = Object.entries(answers).map(
        ([questionId, responseText]) => ({
          questionId,
          responseText,
        })
      );
      const res = await fetch(
        `/api/applications/${applicationId}/questionnaire`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ responses }),
        }
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to submit responses");
      }
      router.push("/contractor/applications");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-leaf-600" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <AlertTriangle className="w-8 h-8 text-red-500" />
        <p className="text-muted-foreground">{error}</p>
        <Button
          variant="outline"
          onClick={() => router.push("/contractor/applications")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Applications
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const isSubmitted = data.questionnaireStatus === "SUBMITTED";
  const questions = [...data.questions].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/contractor/applications")}
        className="text-muted-foreground"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Applications
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-leaf-600" />
          Interview Questionnaire
        </h1>
        {data.rfpTitle && (
          <p className="text-muted-foreground mt-1">{data.rfpTitle}</p>
        )}
      </div>

      {/* Submitted Banner */}
      {isSubmitted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <p className="font-medium text-green-800">
              Responses submitted successfully
            </p>
            <p className="text-sm text-green-700 mt-0.5">
              Your questionnaire responses have been submitted and are now under
              review.
            </p>
          </div>
        </div>
      )}

      {/* Deadline info */}
      {data.rfpDeadline && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>
            RFP Deadline:{" "}
            {new Date(data.rfpDeadline).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800 text-xs font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Questions */}
      {questions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No questionnaire questions found for this application.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((q, i) => {
            const options = parseSafe<string[]>(q.options, []);
            const currentAnswer = answers[q.id] || "";

            return (
              <Card key={q.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-start gap-2">
                    <span className="bg-leaf-50 text-leaf-700 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>
                      {q.questionText}
                      {q.isRequired && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </span>
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="w-fit text-xs bg-muted/50 ml-8"
                  >
                    {q.questionType.replace(/_/g, " ")}
                  </Badge>
                </CardHeader>
                <CardContent className="ml-8">
                  {isSubmitted ? (
                    // Read-only view
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm">
                        {currentAnswer || (
                          <span className="text-muted-foreground italic">
                            No response provided
                          </span>
                        )}
                      </p>
                    </div>
                  ) : (
                    // Editable view based on type
                    <>
                      {q.questionType === "SHORT_ANSWER" && (
                        <Input
                          value={currentAnswer}
                          onChange={(e) => updateAnswer(q.id, e.target.value)}
                          placeholder="Enter your answer..."
                        />
                      )}

                      {q.questionType === "LONG_ANSWER" && (
                        <Textarea
                          value={currentAnswer}
                          onChange={(e) => updateAnswer(q.id, e.target.value)}
                          placeholder="Enter your detailed response..."
                          rows={4}
                        />
                      )}

                      {q.questionType === "MULTIPLE_CHOICE" && (
                        <div className="space-y-2">
                          {options.map((opt, oi) => (
                            <label
                              key={oi}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                            >
                              <input
                                type="radio"
                                name={`question-${q.id}`}
                                value={opt}
                                checked={currentAnswer === opt}
                                onChange={() => updateAnswer(q.id, opt)}
                                className="w-4 h-4 text-leaf-600 accent-leaf-500"
                              />
                              <span className="text-sm">{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {q.questionType === "FILE_UPLOAD" && (
                        <div className="space-y-2">
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.docx"
                            onChange={(e) =>
                              handleFileSelect(
                                q.id,
                                e.target.files?.[0] || null
                              )
                            }
                            className="text-sm"
                          />
                          {fileNames[q.id] && (
                            <p className="text-xs text-muted-foreground">
                              Selected: {fileNames[q.id]}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Accepted formats: PDF, JPG, PNG, DOCX
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Action Buttons */}
      {!isSubmitted && questions.length > 0 && (
        <>
          <Separator />
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={submitting}
              className="gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Draft
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-leaf-600 hover:bg-leaf-600 text-white gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Submit Responses
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
