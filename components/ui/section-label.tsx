import * as React from "react";
import { cn } from "@/lib/utils";

const SectionLabel = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => <h2 ref={ref} className={cn("section-label mb-3", className)} {...props} />
);
SectionLabel.displayName = "SectionLabel";

export { SectionLabel };
