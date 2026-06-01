import { clsx } from "clsx";

export const Card = ({ className, children, ...props }) => (
  <div className={clsx("rounded-[28px] border border-slate-200/40 bg-white/95 p-8 shadow-xl shadow-slate-950/5", className)} {...props}>
    {children}
  </div>
);
