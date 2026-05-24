// External links are placeholders until real destinations exist.
const GITHUB_PROFILE_URL = "#";
const SOURCE_REPO_URL = "#";

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-300 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="size-3 bg-chicago-red" />
              <span className="font-display text-lg font-semibold tracking-tight text-ink">
                Chicago Pothole Tracker
              </span>
            </div>
            <p className="mt-2 font-mono text-[0.7rem] tracking-[0.15em] text-neutral-400 uppercase">
              An independent civic accountability project
            </p>
          </div>

          <div className="flex flex-col gap-1 text-sm text-neutral-600 sm:items-end">
            <p>
              Built by{" "}
              <a
                href={GITHUB_PROFILE_URL}
                className="rounded-sm font-medium text-ink transition-colors hover:text-chicago-blue focus-visible:ring-2 focus-visible:ring-chicago-blue focus-visible:outline-none"
              >
                Faris Siddiqi
              </a>
            </p>
            <a
              href={SOURCE_REPO_URL}
              className="rounded-sm transition-colors hover:text-chicago-blue focus-visible:ring-2 focus-visible:ring-chicago-blue focus-visible:outline-none"
            >
              Source code on GitHub
            </a>
          </div>
        </div>

        <p className="mt-10 max-w-md text-xs leading-relaxed text-neutral-400">
          This site is not affiliated with the City of Chicago. Data comes from
          the city&apos;s open 311 portal.
        </p>
      </div>
    </footer>
  );
}
