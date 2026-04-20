import { forwardRef } from "react";
import { ArrowRight, Copy, Download, Pencil, Share2 } from "lucide-react";
import type {
  AddOnOption,
  BusinessActivity,
  LicenseOption,
  QuoteBreakdown,
  VisaOption,
} from "../../types/calculator";
import { formatAed } from "../../utils/currency";

interface QuoteSidebarProps {
  quote: QuoteBreakdown;
  selectedLicense: LicenseOption | null;
  showCompanySetupSection?: boolean;
  showPricing?: boolean;
  mainlandMessage?: string | null;
  durationYears: number;
  shareholderCount: number;
  includedShareholders: number;
  extraShareholderFee: number;
  selectedActivities: BusinessActivity[];
  selectedAddOns: AddOnOption[];
  visaOptions: VisaOption[];
  investorVisaEnabled: boolean;
  employeeVisaCount: number;
  dependentVisaCount: number;
  applicantsInsideUae: number;
  submitAttempted: boolean;
  submissionIssues: string[];
  showSuccess: boolean;
  leadName: string;
  shareStatus: "idle" | "copied";
  onShare: () => void;
  onConfirm: () => void;
  onDownloadPdf?: () => void;
  onEditCompanySetup?: () => void;
  onEditActivities?: () => void;
  onEditVisas?: () => void;
  onEditAddOns?: () => void;
}

interface SummaryRow {
  label: string;
  value: string;
}

function QuoteSection({
  onEdit,
  rows,
  title,
  total,
}: {
  onEdit?: () => void;
  rows: SummaryRow[];
  title: string;
  total: string;
}) {
  return (
    <div className="border-t border-[#e5ebf3] py-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-black">
          {title}
        </h3>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-full border border-[#e5ebf3] px-2 py-2 text-xs font-semibold text-[#425d7b] transition brand-gradient brand-gradient-hover hover:border-[#cad5e4] hover:text-white"
            aria-label={`Edit ${title.toLowerCase()}`}
          >
            <Pencil size={10} />
          </button>
        ) : null}
      </div>

      <div className="mt-4 space-y-2.5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-start justify-between gap-4 text-sm text-slate-600"
          >
            <span>{row.label}</span>
            <span className="text-right font-semibold text-[#111723]">
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 pb-3">
        <div className="flex items-center justify-between gap-4 text-sm font-semibold text-[#111111]">
          <span>Total Cost</span>
          <span>{total}</span>
        </div>
      </div>
    </div>
  );
}

export const QuoteSidebar = forwardRef<HTMLDivElement, QuoteSidebarProps>(
  function QuoteSidebar(
    {
      applicantsInsideUae,
      dependentVisaCount,
      durationYears,
      employeeVisaCount,
      extraShareholderFee,
      includedShareholders,
      investorVisaEnabled,
      leadName,
      onConfirm,
      onDownloadPdf,
      onEditActivities,
      onEditAddOns,
      onEditCompanySetup,
      onEditVisas,
      onShare,
      quote,
      selectedActivities,
      selectedAddOns,
      selectedLicense,
      showCompanySetupSection = true,
      showPricing = true,
      mainlandMessage,
      shareStatus,
      showSuccess,
      shareholderCount,
      visaOptions,
    },
    ref,
  ) {
    const totalVisaApplicants =
      (investorVisaEnabled ? 1 : 0) + employeeVisaCount + dependentVisaCount;
    const applicantsOutsideUae = Math.max(
      0,
      totalVisaApplicants - applicantsInsideUae,
    );

    const groupedActivities = Array.from(
      selectedActivities.reduce<Map<string, BusinessActivity[]>>(
        (map, activity) => {
          const existing = map.get(activity.category) ?? [];
          existing.push(activity);
          map.set(activity.category, existing);
          return map;
        },
        new Map(),
      ),
    );

    const selectedActivityRows = groupedActivities.map(
      ([category, activities]) => ({
        label: category,
        value:
          activities.length === 1
            ? activities[0].name
            : `${activities[0].name} +${activities.length - 1}`,
      }),
    );

    const visaMap = new Map(visaOptions.map((option) => [option.id, option]));
    const visaRows: SummaryRow[] = [];

    if (investorVisaEnabled) {
      visaRows.push({
        label: "Investor Visa (1)",
        value: formatAed(visaMap.get("investor-visa")?.fee ?? 0),
      });
    }

    if (employeeVisaCount > 0) {
      visaRows.push({
        label: `Employee Visa (${employeeVisaCount})`,
        value: formatAed(
          (visaMap.get("employee-visa")?.fee ?? 0) * employeeVisaCount,
        ),
      });
    }

    if (dependentVisaCount > 0) {
      visaRows.push({
        label: `Dependent Visa (${dependentVisaCount})`,
        value: formatAed(
          (visaMap.get("dependent-visa")?.fee ?? 0) * dependentVisaCount,
        ),
      });
    }

    if (totalVisaApplicants > 0) {
      visaRows.push({
        label: "Visa Allocation Fee",
        value: formatAed(quote.visaAllocationFee),
      });
      visaRows.push({
        label: "Immigration Card Fee",
        value: formatAed(quote.immigrationCardFee),
      });
    }

    const hasQuoteSections =
      (showPricing && showCompanySetupSection && selectedLicense !== null) ||
      selectedActivityRows.length > 0 ||
      visaRows.length > 0 ||
      totalVisaApplicants > 0 ||
      selectedAddOns.length > 0;

    const additionalShareholders = Math.max(
      0,
      shareholderCount - includedShareholders,
    );

    const companySetupRows: SummaryRow[] = [
      {
        label: "License Type",
        value: selectedLicense
          ? selectedLicense.name.replace(" Business License", "")
          : "",
      },
      {
        label: "License Duration",
        value: durationYears === 1 ? "1 Year" : `${durationYears} Years`,
      },
      { label: "Shareholders", value: String(shareholderCount) },
    ];

    if (additionalShareholders > 0) {
      companySetupRows.push({
        label: `Additional Shareholders (${additionalShareholders})`,
        value: `${formatAed(extraShareholderFee)}`,
      });
    }

    const firstName = leadName.trim().split(/\s+/)[0] ?? "there";
    const isMainlandMode = Boolean(mainlandMessage);

    if (isMainlandMode) {
      return (
        <aside
          ref={ref}
          className="relative self-start overflow-hidden rounded-3xl border border-white/45 bg-white/90 p-6 shadow-[inset_3px_3px_10px_#ccdbe870,inset_-3px_-3px_10px_1px_rgb(255_255_255),11.845px_9.871px_30.993px_0_rgba(39,67,103,0.13)] backdrop-blur-xl lg:sticky lg:top-24"
        >
          <div className="relative z-10 space-y-5">
            <h2 className="text-2xl font-bold leading-12 capitalize text-[#0b0f17]">
              Mainland Consultation
            </h2>
            <p className="text-sm font-normal leading-relaxed text-gray-600">
              Share your details to request a consultation and receive a
              tailored mainland setup estimate.
            </p>
            <p className="rounded-xl border border-[#f0d6c2] bg-[#fff7f0] px-4 py-4 text-sm font-medium leading-7 text-[#6b3c18]">
              {mainlandMessage}
            </p>

            {showSuccess ? (
              <div className="space-y-3">
                <div className="rounded-xl z-10 relative bg-white px-5 py-5 shadow-[0_20px_50px_rgba(60,91,125,0.14)]">
                  <div className="flex items-center gap-4">
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-[linear-gradient(180deg,#e8e8e8_0%,#ffffff_100%)] text-lg font-semibold text-[#111111]">
                      MF
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[#111111]">
                        Thank You, {firstName}!
                      </h3>
                      <p className="mt-1 max-w-[18rem] text-xs leading-2 text-slate-500">
                        A member of our team will contact you within 60 minutes to
                        get you started.
                      </p>
                    </div>
                  </div>
                </div>
                {onDownloadPdf ? (
                  <button
                    type="button"
                    onClick={onDownloadPdf}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#d7deea] bg-white px-5 py-3 text-sm font-semibold text-[#111111] transition hover:border-[#bfd0e3] hover:bg-[#f5f8fc]"
                  >
                    Download PDF Form
                    <Download size={16} />
                  </button>
                ) : null}
              </div>
            ) : (
              <button
                type="button"
                onClick={onConfirm}
                className="instant-quote-btn brand-gradient brand-gradient-hover inline-flex w-full items-center justify-center gap-3 rounded-full border border-transparent px-6 py-4 text-base font-semibold relative z-10"
              >
                Request Consultation
                <span className="instant-quote-btn__icon" aria-hidden="true">
                  <ArrowRight size={18} />
                </span>
              </button>
            )}
          </div>
        </aside>
      );
    }

    return (
      <aside
        ref={ref}
        className="relative self-start overflow-hidden rounded-3xl border border-white/45 bg-white/90 p-6 shadow-[inset_3px_3px_10px_#ccdbe870,inset_-3px_-3px_10px_1px_rgb(255_255_255),11.845px_9.871px_30.993px_0_rgba(39,67,103,0.13)] backdrop-blur-xl lg:sticky lg:top-24"
      >
        <div className="relative z-10 mb-10 space-y-1">
          <h2 className="text-2xl font-bold leading-12 capitalize text-[#0b0f17]">
            Your Business Setup Estimate
          </h2>
          <p className="text-sm font-normal leading-relaxed text-gray-600">
            {showPricing
              ? "Here's your total cost, based on the options you selected."
              : "Select a Free Zone location to view pricing and company setup details."}
          </p>
        </div>
        {showPricing && hasQuoteSections ? (
          <div className="h-80 overflow-auto pr-2">
            {showCompanySetupSection && selectedLicense ? (
              <QuoteSection
                title="Company Setup"
                onEdit={onEditCompanySetup}
                total={formatAed(quote.companySetupTotal)}
                rows={companySetupRows}
              />
            ) : null}

            {selectedActivityRows.length > 0 ? (
              <QuoteSection
                title="Business Activities"
                onEdit={onEditActivities}
                total={formatAed(quote.activitiesTotal)}
                rows={selectedActivityRows}
              />
            ) : null}

            {visaRows.length > 0 ? (
              <QuoteSection
                title="Visa Selection & Fees"
                onEdit={onEditVisas}
                total={formatAed(quote.visaTotal)}
                rows={visaRows}
              />
            ) : null}

            {totalVisaApplicants > 0 ? (
              <QuoteSection
                title="Change of Status"
                total={formatAed(quote.changeStatusTotal)}
                rows={[
                  {
                    label: `Applicants Outside the UAE (${applicantsOutsideUae})`,
                    value: formatAed(quote.outsideStatusTotal),
                  },
                  {
                    label: `Applicants Inside the UAE (${applicantsInsideUae})`,
                    value: formatAed(quote.insideStatusTotal),
                  },
                ]}
              />
            ) : null}

            {selectedAddOns.length > 0 ? (
              <QuoteSection
                title="Additional Services"
                onEdit={onEditAddOns}
                total={formatAed(quote.addOnsTotal)}
                rows={selectedAddOns.map((item) => ({
                  label: item.name,
                  value: formatAed(item.fee),
                }))}
              />
            ) : null}
          </div>
        ) : null}
        <div className="relative mt-16">
          <div className="space-y-4">
            <div className="relative rounded-xl bg-white px-5 py-4 shadow-[0_20px_50px_rgba(60,91,125,0.14)] z-10">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[#252b35]">
                    Grand Total
                  </p>
                  <strong className="mt-1 block text-lg font-semibold leading-none text-[#111111]">
                    {showPricing
                      ? formatAed(quote.total)
                      : "Select Location"}
                  </strong>
                </div>

                {showPricing ? (
                  <button
                    type="button"
                    onClick={onShare}
                    className="inline-flex  min-w-[3.4rem] flex-col items-center gap-0 rounded-lg p-3 text-[#111111] transition hover:bg-[#f3f3f3]"
                    aria-label="Share"
                  >
                    {shareStatus === "copied" ? (
                      <Copy size={22} />
                    ) : (
                      <Share2 size={22} />
                    )}
                    <span className="text-xs font-medium text-slate-500">
                      {shareStatus === "copied" ? "Copied" : "Share"}
                    </span>
                  </button>
                ) : null}
              </div>
            </div>

            {showSuccess ? (
              <div className="space-y-3">
                <div className="rounded-xl z-10 relative bg-white px-5 py-5 shadow-[0_20px_50px_rgba(60,91,125,0.14)]">
                  <div className="flex items-center gap-4">
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-[linear-gradient(180deg,#e8e8e8_0%,#ffffff_100%)] text-lg font-semibold text-[#111111]">
                      MF
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[#111111]">
                        Thank You, {firstName}!
                      </h3>
                      <p className="mt-1 max-w-[18rem] text-xs leading-2 text-slate-500">
                        A member of our team will contact you within 60 minutes to
                        get you started.
                      </p>
                    </div>
                  </div>
                </div>
                {onDownloadPdf ? (
                  <button
                    type="button"
                    onClick={onDownloadPdf}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#d7deea] bg-white px-5 py-3 text-sm font-semibold text-[#111111] transition hover:border-[#bfd0e3] hover:bg-[#f5f8fc]"
                  >
                    Download PDF Form
                    <Download size={16} />
                  </button>
                ) : null}
              </div>
            ) : (
              <button
                type="button"
                onClick={onConfirm}
                className="instant-quote-btn brand-gradient brand-gradient-hover inline-flex w-full items-center justify-center gap-3 rounded-full border border-transparent px-6 py-3 text-base font-semibold relative z-10"
              >
                Get Instant Quote
                <span className="instant-quote-btn__icon" aria-hidden="true">
                  <ArrowRight size={18} />
                </span>
              </button>
            )}

          </div>
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[240px] rounded-3xl bg-[linear-gradient(0deg,rgba(24,24,24,0.14)_0%,rgba(24,24,24,0)_100%)]"
          aria-hidden="true"
        />
      </aside>
    );
  },
);
