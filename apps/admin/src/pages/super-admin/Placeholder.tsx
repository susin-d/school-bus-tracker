import { Construction } from "lucide-react";

const Placeholder = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-fade-in">
    <Construction className="w-12 h-12 mb-4" />
    <h2 className="text-xl font-display font-bold">{title}</h2>
    <p className="text-sm mt-1">This module is coming soon.</p>
  </div>
);

export default Placeholder;
