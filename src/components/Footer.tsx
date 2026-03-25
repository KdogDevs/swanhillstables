import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="mb-4">
              <h3 className="font-serif text-2xl font-semibold">Swan Hill</h3>
              <div className="flex items-center gap-3 mt-1">
                <div className="h-px w-8 bg-accent" />
                <span className="text-accent text-xs uppercase tracking-[0.3em]">Stables</span>
                <div className="h-px w-8 bg-accent" />
              </div>
            </div>
            <p className="text-primary-foreground/80 max-w-md leading-relaxed">
              Quality boarding and instruction for horses and riders of all levels. 
              We're dedicated to exceptional care and a welcoming environment for everyone.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/team" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Our Team
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">
              Contact
            </h4>
            <ul className="space-y-3 text-primary-foreground/80">
              <li>5808 Harper Rd</li>
              <li>Northport, Alabama</li>
              <li className="pt-2">
                <a href="mailto:stables@swanhillstables.com" className="hover:text-primary-foreground transition-colors">
                  stables@swanhillstables.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-12 pt-8 text-center text-primary-foreground/60 text-sm">
          © {new Date().getFullYear()} Swan Hill Stables. All rights reserved.
        </div>
      </div>
    </footer>
  );
};