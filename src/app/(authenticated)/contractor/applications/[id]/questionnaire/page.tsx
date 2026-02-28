"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  ArrowLeft,
  Save,
  Send,
  CheckCircle2,
  AlertTriangle,
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
        <Loader2 className="w-6 h-6 animate-spin text-sovereign-gold" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <AlertTriangle className="w-8 h-8 text-red-500" />
        <p className="text-sovereign-stone">{error}</p>
        <Button
          variant="neu-outline"
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
    <div className="space-y-6 max-w-3xl pb-[100px] md:pb-0">
      {/* Back button */}
      <Button
        variant="neu-ghost"
        size="sm"
        onClick={() => router.push("/contractor/applications")}
        className="text-sovereign-stone"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Applications
      </Button>

      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: "#b8943f" }}>QUESTIONNAIRE</p>
        <h1 className="text-[22px] font-extrabold text-sovereign-charcoal">
          Interview Questionnaire
        </h1>
        {data.rfpTitle && (
          <p className="text-[13px] text-sovereign-stone mt-1">{data.rfpTitle}</p>
        )}
      </div>

      {/* Submitted Banner */}
      {isSubmitted && (
        <Card variant="neu-inset" className="p-4 flex items-center gap-3 accent-left-green">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <p className="font-medium text-sovereign-charcoal">
              Responses submitted successfully
            </p>
            <p className="text-sm text-sovereign-stone mt-0.5">
              Your questionnaire responses have been submitted and are now under
              review.
            </p>
          </div>
        </Card>
      )}

      {/* Deadline info */}
      {data.rfpDeadline && (
        <div className="flex items-center gap-2 text-sm text-sovereign-stone">
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
        <Card variant="neu-inset" className="p-3 flex items-center gap-2 accent-left-red">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800 text-xs font-medium"
          >
            Dismiss
          </button>
        </Card>
      )}

      {/* Questions */}
      {questions.length === 0 ? (
        <Card variant="neu-raised" className="p-4">
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-sovereign-stone">
              No questionnaire questions found for this application.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((q, i) => {
            const options = parseSafe<string[]>(q.options, []);
            const currentAnswer = answers[q.id] || "";

            return (
              <Card key={q.id} variant="neu-raised" className="p-4">
                <div className="flex flex-col space-y-1.5 pb-3">
                  <div className="text-base font-medium flex items-start gap-2">
                    <span className="shadow-neu-inset bg-neu-dark/30 text-sovereign-charcoal text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>
                      {q.questionText}
                      {q.isRequired && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </span>
                  </div>
                  <Badge
                    variant="neu"
                    className="w-fit text-xs ml-8"
                  >
                    {q.questionType.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="ml-8">
                  {isSubmitted ? (
                    // Read-only view
                    <div className="bg-neu-dark/20 shadow-neu-inset rounded-xl p-3">
                      <p className="text-sm">
                        {currentAnswer || (
                          <span className="text-sovereign-stone italic">
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
                          className="bg-neu-dark/30 border-0 shadow-neu-inset rounded-xl"
                        />
                      )}

                      {q.questionType === "LONG_ANSWER" && (
                        <Textarea
                          value={currentAnswer}
                          onChange={(e) => updateAnswer(q.id, e.target.value)}
                          placeholder="Enter your detailed response..."
                          rows={4}
                          className="bg-neu-dark/30 border-0 shadow-neu-inset rounded-xl"
                        />
                      )}

                      {q.questionType === "MULTIPLE_CHOICE" && (
                        <div className="space-y-2">
                          {options.map((opt, oi) => (
                            <label
                              key={oi}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-neu-dark/20 cursor-pointer"
                            >
                              <input
                                type="radio"
                                name={`question-${q.id}`}
                                value={opt}
                                checked={currentAnswer === opt}
                                onChange={() => updateAnswer(q.id, opt)}
                                className="w-4 h-4 accent-[#b8943f]"
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
                            className="text-sm bg-neu-dark/30 border-0 shadow-neu-inset rounded-xl"
                          />
                          {fileNames[q.id] && (
                            <p className="text-xs text-sovereign-stone">
                              Selected: {fileNames[q.id]}
                            </p>
                          )}
                          <p className="text-xs text-sovereign-stone">
                            Accepted formats: PDF, JPG, PNG, DOCX
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Action Buttons */}
      {!isSubmitted && questions.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="neu-outline"
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
            variant="neu-gold"
            onClick={handleSubmit}
            disabled={submitting}
            className="gap-2"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Submit Responses
          </Button>
        </div>
      )}
    </div>
  );
}
