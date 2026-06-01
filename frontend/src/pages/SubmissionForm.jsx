import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { api } from "../lib/api";
import { useToast } from "../components/ToastProvider";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

export const SubmissionForm = () => {
  const { submissionId } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState("github");
  const [file, setFile] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/submissions/${submissionId}`).then(setSubmission).catch(() => setSubmission(null)).finally(() => setLoading(false));
  }, [submissionId]);

  const project = submission?.project_id;
  const role = project?.role_id?.name?.toLowerCase() || "";
  const defaultType = useMemo(() => {
    if (role.includes("software") || role.includes("data")) return "github";
    if (role.includes("ux")) return "figma";
    return "gdoc";
  }, [role]);

  useEffect(() => {
    if (submission) {
      setMode(submission.submission_type || defaultType);
    }
  }, [submission, defaultType]);

  const editValue = (field) => (event) => setSubmission((current) => ({ ...current, [field]: event.target.value }));

  const saveDraft = async () => {
    if (!submission) return;
    setSaving(true);
    try {
      await api.put(`/submissions/${submissionId}`, {
        approach_text: submission.approach_text,
        problem_understanding: submission.problem_understanding,
        proposed_solution: submission.proposed_solution,
        tradeoffs: submission.tradeoffs,
        success_metrics: submission.success_metrics,
        reflection_text: submission.reflection_text,
        submission_link: submission.submission_link,
        submission_type: submission.submission_type,
      });
      toast.pushToast("Draft saved", "success");
    } catch (error) {
      toast.pushToast(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const uploadPdf = async () => {
    if (!file) return null;
    const formData = new FormData();
    formData.append("file", file);
    const payload = await api.postForm("/upload/submission", formData);
    return payload.url;
  };

  const handleSubmit = async () => {
    if (!submission) return;
    setSubmitting(true);
    try {
      let submissionLink = submission.submission_link;
      if (role.includes("ux") && mode === "figma") {
        submissionLink = submission.submission_link;
      }
      if (role.includes("ux") && mode === "figma-pdf" && file) {
        submissionLink = await uploadPdf();
      }
      await api.put(`/submissions/${submissionId}`, {
        approach_text: submission.approach_text,
        problem_understanding: submission.problem_understanding,
        proposed_solution: submission.proposed_solution,
        tradeoffs: submission.tradeoffs,
        success_metrics: submission.success_metrics,
        reflection_text: submission.reflection_text,
        submission_link: submissionLink,
        submission_type: mode === "figma-pdf" ? "figma" : mode,
      });
      await api.post(`/submissions/${submissionId}/submit`);
      const graded = await api.post(`/submissions/${submissionId}/grade`);
      setSubmission(graded);
      toast.pushToast("Submission graded", "success");
    } catch (error) {
      toast.pushToast(error.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="space-y-4"><div className="h-48 animate-pulse rounded-[32px] bg-slate-200" /></div>;
  }

  if (!submission || !project) {
    return <p className="rounded-[32px] border border-slate-200/40 bg-white/90 p-8 text-slate-700">Submission not found.</p>;
  }

  const statusColors = {
    draft: "border-slate-300 bg-slate-50",
    submitted: "border-indigo-300 bg-indigo-50",
    graded: "border-emerald-300 bg-emerald-50",
  };

  const statusBadgeColors = {
    draft: "bg-slate-200 text-slate-900",
    submitted: "bg-indigo-200 text-indigo-900",
    graded: "bg-emerald-200 text-emerald-900",
  };

  const isGraded = submission.status === "graded";

  return (
    <div className="space-y-8">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-indigo-600">Submission</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950">{project.title}</h1>
          </div>
          <span className={`rounded-full px-4 py-2 text-sm font-semibold border ${statusBadgeColors[submission.status] || "bg-slate-200 text-slate-900"}`}>{submission.status}</span>
        </div>
        {isGraded && submission.ai_score && (
          <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-900">Final Score</p>
                <p className="mt-2 text-4xl font-bold text-emerald-600">{submission.ai_score}%</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-emerald-700">Grading Complete</p>
                <p className="mt-1 text-sm text-emerald-900">Review feedback and resubmit to improve</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {isGraded && submission.ai_feedback && (
        <Card className="border-l-4 border-l-indigo-600">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-950">Feedback & Grading</h2>
            <div className="prose prose-sm max-w-none text-slate-700">
              <p className="whitespace-pre-wrap">{submission.ai_feedback}</p>
            </div>
            {submission.ai_meta?.accessible === false && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                ⚠️ Could not access all submission materials. Review may be incomplete.
              </div>
            )}
          </div>
        </Card>
      )}

      <Card>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-slate-950">Challenge brief</h2>
            <Badge variant="subtle">{project.difficulty_level}</Badge>
          </div>
          <details className="rounded-3xl border border-slate-300 bg-white p-5 text-slate-950 group">
            <summary className="cursor-pointer text-sm font-semibold text-slate-700 group-open:text-indigo-600">View Challenge</summary>
            <div className="mt-4 space-y-4 text-sm leading-7 text-slate-700">
              <p>{project.problem_statement}</p>
              <p>{project.context}</p>
              <p>{project.deliverables}</p>
            </div>
          </details>
        </div>
      </Card>

      <Card className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-700 font-medium">
            Problem understanding
            <Textarea value={submission.problem_understanding} onChange={editValue("problem_understanding")} placeholder="Explain your understanding of the problem" required />
          </label>
          <label className="space-y-2 text-sm text-slate-700 font-medium">
            Proposed solution
            <Textarea value={submission.proposed_solution} onChange={editValue("proposed_solution")} placeholder="Describe your solution approach" required />
          </label>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-700 font-medium">
            Tradeoffs
            <Textarea value={submission.tradeoffs} onChange={editValue("tradeoffs")} placeholder="What tradeoffs did you make?" required />
          </label>
          <label className="space-y-2 text-sm text-slate-700 font-medium">
            Success metrics
            <Textarea value={submission.success_metrics} onChange={editValue("success_metrics")} placeholder="How would you measure success?" required />
          </label>
        </div>
        <label className="space-y-2 text-sm text-slate-700 font-medium">
          Reflection (optional)
          <Textarea value={submission.reflection_text} onChange={editValue("reflection_text")} placeholder="Any additional thoughts?" />
        </label>
      </Card>

      <Card className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Submission link</p>
            <p className="mt-2 text-sm text-slate-600">Provide the link or upload required assets for your role.</p>
          </div>
          <Badge variant="info">{mode === "figma-pdf" ? "PDF upload" : mode.toUpperCase()}</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {role.includes("ux") ? (
            ["figma", "figma-pdf"].map((option) => (
              <button
                key={option}
                type="button"
                className={`rounded-3xl border px-4 py-3 text-left text-sm font-medium transition ${
                  submission.submission_type === option
                    ? "border-indigo-400 bg-indigo-50 text-slate-950"
                    : "border-slate-300 bg-white text-slate-700 hover:border-indigo-400"
                }`}
                onClick={() => {
                  setMode(option);
                  setSubmission((current) => ({ ...current, submission_type: option }));
                }}
              >
                {option === "figma" ? "Figma link" : "Upload PDF"}
              </button>
            ))
          ) : (
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value)}
              className="rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-indigo-400"
            >
              {role.includes("software") || role.includes("data") ? (
                <option value="github">GitHub</option>
              ) : (
                <>
                  <option value="gdoc">Google Doc</option>
                  <option value="notion">Notion</option>
                  <option value="other">Other</option>
                </>
              )}
            </select>
          )}
        </div>
        {mode === "figma-pdf" ? (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">Upload PDF</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="text-sm text-slate-700 file:rounded-lg file:border file:border-slate-300 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-50"
            />
          </div>
        ) : (
          <label className="space-y-2 text-sm text-slate-700 font-medium">
            Link
            <Input value={submission.submission_link} onChange={editValue("submission_link")} placeholder="https://" required />
          </label>
        )}
        <p className="text-sm text-slate-600">Written answers are primary for grading.</p>
      </Card>

      <Card className="space-y-6">
        <div className="space-y-3 text-sm text-slate-600">
          <p><span className="font-semibold text-slate-950">Checklist</span> — confirm before submitting.</p>
          <ul className="space-y-2 pl-4 list-disc text-slate-700">
            <li>Answered all fields honestly</li>
            <li>Link is publicly accessible</li>
            <li>Written answers are primary basis</li>
          </ul>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={saveDraft} disabled={saving}>{saving ? "Saving..." : "Save Draft"}</Button>
          {!isGraded ? (
            <Button variant="primary" onClick={handleSubmit} disabled={submitting}>{submitting ? "Submitting..." : "Submit for review"}</Button>
          ) : (
            <div className="text-sm text-emerald-700 font-medium">✓ Already graded. Edit above to resubmit.</div>
          )}
        </div>
      </Card>
    </div>
  );
};
