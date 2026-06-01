import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";

export const Drafts = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        const response = await api.get("/submissions");
        // Filter for draft and graded submissions (resubmittable)
        const drafts = response.filter((sub) => sub.status === "draft" || sub.status === "graded");
        setSubmissions(drafts);
      } catch (error) {
        console.error("Failed to fetch drafts:", error);
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDrafts();
  }, []);

  const getStatusBadgeColor = (status) => {
    if (status === "draft") return "bg-slate-200 text-slate-900";
    if (status === "graded") return "bg-emerald-200 text-emerald-900";
    return "bg-slate-200 text-slate-900";
  };

  const getStatusLabel = (status) => {
    if (status === "graded") return "Graded - Ready to Resubmit";
    return "Draft";
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <Card>
          <p className="text-sm uppercase tracking-[0.25em] text-indigo-600">My Drafts</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">Saved Submissions</h1>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-[28px] bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-indigo-600">My Drafts</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">Saved Submissions</h1>
          <p className="mt-2 text-sm text-slate-600">
            View your saved drafts and resubmit graded work to improve your score.
          </p>
        </div>
      </Card>

      {submissions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {submissions.map((submission) => (
            <Card key={submission._id} className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm text-slate-500">
                    {submission.project_id?.role_id?.name || "Project"}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">
                    {submission.project_id?.title || "Untitled"}
                  </h3>
                </div>
                <Badge className={getStatusBadgeColor(submission.status)}>
                  {getStatusLabel(submission.status)}
                </Badge>
              </div>

              {submission.status === "graded" && submission.ai_score && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-emerald-900">Last Score</span>
                    <span className="text-xl font-bold text-emerald-600">{submission.ai_score}%</span>
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-500">
                Last updated {new Date(submission.updatedAt).toLocaleDateString()}
              </p>

              <div className="flex gap-2 pt-2">
                <Link to={`/submit/${submission._id}`} className="flex-1">
                  <Button variant="primary" className="w-full">
                    {submission.status === "graded" ? "Resubmit" : "Continue"}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <p className="text-slate-600">No saved drafts yet.</p>
          <p className="mt-2 text-sm text-slate-500">
            Start a project submission to see it here.
          </p>
        </Card>
      )}
    </div>
  );
};
