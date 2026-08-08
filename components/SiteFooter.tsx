// External links are placeholders until real destinations exist.
const GITHUB_PROFILE_URL = "#";
const SOURCE_REPO_URL = "#";

export function SiteFooter() {
  return (
    <footer className="border-t border-curb px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="flex items-center gap-1">
                <span className="h-[3px] w-3 bg-hazard" />
                <span className="h-[3px] w-3 bg-hazard" />
                <span className="h-[3px] w-3 bg-hazard/40" />
              </span>
              <span className="font-display text-xl leading-none tracking-tight text-paint uppercase">
                Chicago Pothole Tracker
              </span>
            </div>
            <p className="mt-3 font-mono text-[0.65rem] tracking-[0.18em] text-paint-dim uppercase">
              An independent civic accountability project
            </p>
          </div>

          <div className="flex flex-col gap-1.5 text-sm text-paint-dim sm:items-end">
            <p>
              Built by{" "}
              <a
                href={GITHUB_PROFILE_URL}
                className="text-paint transition-colors hover:text-hazard focus-visible:ring-2 focus-visible:ring-ice focus-visible:outline-none"
              >
                Faris Siddiqi
              </a>
            </p>
            <a
              href={SOURCE_REPO_URL}
              className="transition-colors hover:text-hazard focus-visible:ring-2 focus-visible:ring-ice focus-visible:outline-none"
            >
              Source code on GitHub
            </a>
          </div>
        </div>

        <p className="mt-12 max-w-md text-xs leading-relaxed text-paint-dim/70">
          Not affiliated with the City of Chicago. Data comes from the
          city&apos;s open 311 portal.
        </p>
      </div>
    </footer>
  );
}
