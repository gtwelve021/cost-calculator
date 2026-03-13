import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  CircleAlert,
  Minus,
  Plus,
  ReceiptText,
  ScanSearch,
  Search,
  WalletCards,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import PhoneInput from "react-phone-input-2";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { AnimatedSection } from "../components/AnimatedSection";
import {
  ModalAction,
  ModalShell,
} from "../components/cost-calculator/ModalShell";
import { QuoteSidebar } from "../components/cost-calculator/QuoteSidebar";
import {
  activityCategories,
  addOnGroups,
  defaultCalculatorState,
  heroImage,
} from "../config/calculatorConfig";
import { useSheetData } from "../hooks/useSheetData";
import type {
  BusinessActivityCategory,
  CalculatorState,
  LeadFormData,
} from "../types/calculator";
import { calculateQuote } from "../utils/calculations";
import { cn } from "../utils/cn";
import { formatAed } from "../utils/currency";
import { getSubmissionIssues, isLeadFormComplete } from "../utils/gating";
import { sanitizeLeadFullNameInput } from "../utils/lead";
import {
  getPhoneSelection,
  isValidLeadPhoneNumber,
  normalizePhoneNumber,
} from "../utils/phone";
import { loadCalculatorState, saveCalculatorState } from "../utils/persistence";

const DEFAULT_PHONE_COUNTRY = "pk";
const DEFAULT_PHONE_DIAL_CODE = "92";
const UNLOCK_DELAY_MS = 180;
const informationalCards = [
  {
    href: "#calculate-now",
    titleTop: "How Much It Will",
    titleAccent: "Actually",
    titleBottom: "Cost?",
    accentClassName: "text-[#49b8c8]",
    Icon: WalletCards,
  },
  {
    href: "#why-trade",
    titleTop: "What Is Included",
    titleAccent: "In That Cost?",
    titleBottom: "",
    accentClassName: "text-[#7a53a3]",
    Icon: ReceiptText,
  },
  {
    href: "#cc-faq",
    titleTop: "Whether The Cost",
    titleAccent: "Will Change",
    titleBottom: "Later?",
    accentClassName: "text-[#5e97a9]",
    Icon: ScanSearch,
  },
] as const;
const calculatorAudience = [
  "Solo founders starting a business in Dubai",
  "Entrepreneurs setting up trading or e-commerce business activities",
  "Business owners comparing free zone trade license costs in Dubai",
  "Overseas investors planning a Dubai company formation remotely",
  "Founders expanding into a new venture, setting up a separate legal entity, or adding a new licensed business activity",
] as const;
const calculatorCoverage = [
  "Trade license type and duration",
  "Business activities selection",
  "Number of shareholders",
  "Visa allocations (investor, employment, and dependant)",
  "Additional business setup services through\u200dmPlus",
] as const;
const setupFactors = [
  "Trade license type and duration",
  "Office or desk requirements",
  "Number and type of business activities",
  "Immigration eligibility",
  "Number of shareholders",
  "Whether your business activities require additional approvals",
  "Visa allocations and change of status (if applicable)",
  "Any extra support services you choose to add to your setup",
] as const;
const nextSteps = [
  "Review Your Cost Breakdown And Compare Setup Structures",
  "Confirm Your Business Activity Eligibility And Visa Requirements",
  "Move Straight To Payment And Company Setup. No Manual Quotes, No Additional Follow-Ups",
] as const;
const faqItems = [
  {
    question: "What is the G12 Free Zone cost calculator?",
    answer:
      "It is a guided estimator for planning your G12 company setup. You can model license, activity, visa, and add-on choices in one place and see the estimated total update instantly.",
  },
  {
    question:
      "How does the free zone cost calculator help entrepreneurs plan costs?",
    answer:
      "It lets founders compare setup scenarios before speaking with an advisor. That makes it easier to set a realistic budget and understand which decisions are driving the total.",
  },
  {
    question: "Can I calculate license, visa, and office-related costs here?",
    answer:
      "Yes. The calculator is structured around the main cost drivers in a G12 setup, including the license package, activity count, visa selections, and optional support services.",
  },
  {
    question:
      "Can I use the calculator if I am expanding an existing business?",
    answer:
      "Yes. It works for founders launching a new company, adding another legal entity, or comparing alternative structures for a new line of business.",
  },
  {
    question: "Can I estimate setup costs for multiple business activities?",
    answer:
      "Yes. Activity selection is built into the flow, and the quote updates as you add more activities beyond the included baseline.",
  },
  {
    question: "How long does it take to get results from the calculator?",
    answer:
      "The estimate updates immediately while you configure the setup. Once your choices are complete, you can submit the instant quote request without waiting for a manual estimate.",
  },
] as const;

const leadFormSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required."),
  phone: z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      if (!value) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Phone number is required.",
        });
        return;
      }

      if (!isValidLeadPhoneNumber(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter a valid phone number.",
        });
      }
    }),
  email: z.string().trim().min(1, "Email address is required."),
  consent: z.boolean().refine((value) => value, {
    message: "This field is required.",
  }),
});

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ab8134]">
        {eyebrow}
      </p>
      <div className="space-y-2">
        <h2 className=" text-[1.75rem] font-semibold leading-tight text-[#111723] md:text-[2.15rem]">
          {title}
        </h2>
        <p className="max-w-[42rem] text-sm leading-7 text-slate-500 md:text-[0.98rem]">
          {description}
        </p>
      </div>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-2 inline-flex items-center gap-2 text-[0.95rem] font-medium text-[#f15b43]">
      <CircleAlert size={15} />
      {message}
    </p>
  );
}

function CounterField({
  label,
  description,
  value,
  onChange,
  min = 0,
  max = 25,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="rounded-[1.6rem] border border-[#e6ebf2] bg-white px-5 py-4 shadow-[0_18px_40px_rgba(60,91,125,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[#111723]">{label}</h3>
          <p className="mt-1 max-w-[24rem] text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-full border border-[#e5ebf3] bg-[#fbfcfe] px-2 py-2">
          <button
            type="button"
            onClick={() => onChange(Math.max(min, value - 1))}
            className="grid h-10 w-10 place-items-center rounded-full text-[#425d7b] transition hover:bg-white"
            aria-label={`Decrease ${label}`}
          >
            <Minus size={16} />
          </button>
          <span className="min-w-[2ch] text-center text-lg font-semibold text-[#111723]">
            {value}
          </span>
          <button
            type="button"
            onClick={() => onChange(Math.min(max, value + 1))}
            className="brand-gradient brand-gradient-hover grid h-10 w-10 place-items-center rounded-full"
            aria-label={`Increase ${label}`}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryCard({
  category,
  preview,
  selectedCount,
  onOpen,
}: {
  category: BusinessActivityCategory;
  preview: string[];
  selectedCount: number;
  onOpen: () => void;
}) {
  return (
    <div className="rounded-[1.8rem] border border-[#e6ebf2] bg-white p-5 shadow-[0_18px_40px_rgba(60,91,125,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <span
            className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#111723]"
            style={{ backgroundColor: category.accent }}
          >
            {category.badge}
          </span>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-[#111723]">
              {category.name}
            </h3>
            <p className="text-sm leading-6 text-slate-500">
              {category.description}
            </p>
          </div>
        </div>

        <div className="rounded-full bg-[#f6eee0] px-3 py-2 text-xs font-semibold text-[#ab8134]">
          {selectedCount} selected
        </div>
      </div>

      <div className="mt-5 min-h-[5rem] rounded-[1.4rem] bg-[#f8fbfe] px-4 py-3">
        {preview.length > 0 ? (
          <div className="space-y-2 text-sm text-slate-600">
            {preview.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-6 text-slate-500">
            No activities selected in this group yet.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="mt-5 inline-flex w-full items-center justify-center rounded-full border border-[#d8e1eb] px-4 py-3 text-sm font-semibold text-[#111723] transition hover:border-[#bfd0e3] hover:bg-[#f5f8fc]"
      >
        Explore {category.name} activities
      </button>
    </div>
  );
}

function CalculateNowLink({ className = "" }: { className?: string }) {
  return (
    <a
      href="#calculate-now"
      className={cn(
        "inline-flex items-center rounded-full border border-[#d7deea] bg-white px-4 py-2.5 text-sm font-semibold text-[#111723] transition hover:border-[#bfd0e3] hover:bg-[#f5f8fc]",
        className,
      )}
    >
      calculate now
    </a>
  );
}

function FaqAccordionItem({
  answer,
  isOpen,
  onToggle,
  question,
}: {
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  question: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[#e5ebf3] bg-white shadow-[0_14px_34px_rgba(60,91,125,0.08)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-base font-semibold text-[#111723] md:text-lg">
          {question}
        </span>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f6eee0] text-[#ab8134]">
          {isOpen ? <Minus size={16} /> : <Plus size={16} />}
        </span>
      </button>

      {isOpen ? (
        <div className="px-5 pb-5 text-sm leading-7 text-slate-500">
          {answer}
        </div>
      ) : null}
    </div>
  );
}

export function CostCalculatorPage() {
  const {
    licenses: licenseOptions,
    visas: visaOptions,
    addOns: addOnOptions,
    activities: businessActivities,
    pricingConfig,
  } = useSheetData();

  const persistedState = useMemo(() => loadCalculatorState(), []);
  const initialState = persistedState ?? defaultCalculatorState;
  const phoneFieldWrapperRef = useRef<HTMLDivElement | null>(null);

  const {
    control,
    formState: { errors },
    trigger,
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    mode: "onChange",
    defaultValues: initialState.leadForm,
  });

  const watchedLead = useWatch({ control });
  const leadForm = useMemo<LeadFormData>(
    () => ({
      fullName: watchedLead.fullName ?? "",
      phone: watchedLead.phone ?? "",
      email: watchedLead.email ?? "",
      consent: watchedLead.consent ?? false,
    }),
    [
      watchedLead.consent,
      watchedLead.email,
      watchedLead.fullName,
      watchedLead.phone,
    ],
  );

  const [selectedLicenseId, setSelectedLicenseId] = useState<string | null>(
    initialState.selectedLicenseId,
  );
  const [durationYears, setDurationYears] = useState(
    initialState.durationYears,
  );
  const [shareholderCount, setShareholderCount] = useState(
    initialState.shareholderCount,
  );
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>(
    initialState.selectedActivityIds,
  );
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>(
    initialState.selectedAddOnIds,
  );
  const [investorVisaEnabled, setInvestorVisaEnabled] = useState(
    initialState.investorVisaEnabled,
  );
  const [employeeVisaCount, setEmployeeVisaCount] = useState(
    initialState.employeeVisaCount,
  );
  const [dependentVisaCount, setDependentVisaCount] = useState(
    initialState.dependentVisaCount,
  );
  const [applicantsInsideUae, setApplicantsInsideUae] = useState(
    initialState.applicantsInsideUae,
  );
  const [activityQuery, setActivityQuery] = useState("");
  const [activityModalQuery, setActivityModalQuery] = useState("");
  const [quoteStarted, setQuoteStarted] = useState(() =>
    isLeadFormComplete(initialState.leadForm),
  );
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [leadValidationAttempted, setLeadValidationAttempted] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied">("idle");
  const [licenseModalId, setLicenseModalId] = useState<string | null>(null);
  const [visaModalId, setVisaModalId] = useState<string | null>(null);
  const [addOnGroupModalId, setAddOnGroupModalId] = useState<string | null>(
    null,
  );
  const [activityCategoryModalId, setActivityCategoryModalId] = useState<
    string | null
  >(null);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [phoneDropdownWidth, setPhoneDropdownWidth] = useState<number | null>(
    null,
  );

  const licenseSectionRef = useRef<HTMLElement | null>(null);
  const activitiesSectionRef = useRef<HTMLElement | null>(null);
  const visasSectionRef = useRef<HTMLElement | null>(null);
  const addOnsSectionRef = useRef<HTMLElement | null>(null);
  const quoteSidebarRef = useRef<HTMLDivElement | null>(null);
  const shareResetRef = useRef<number | null>(null);

  const totalVisaApplicants =
    (investorVisaEnabled ? 1 : 0) + employeeVisaCount + dependentVisaCount;

  const state = useMemo<CalculatorState>(
    () => ({
      leadForm,
      selectedLicenseId,
      durationYears,
      shareholderCount,
      selectedActivityIds,
      selectedAddOnIds,
      investorVisaEnabled,
      employeeVisaCount,
      dependentVisaCount,
      applicantsInsideUae,
    }),
    [
      applicantsInsideUae,
      dependentVisaCount,
      durationYears,
      employeeVisaCount,
      investorVisaEnabled,
      leadForm,
      selectedActivityIds,
      selectedAddOnIds,
      selectedLicenseId,
      shareholderCount,
    ],
  );

  const quote = useMemo(
    () =>
      calculateQuote(state, pricingConfig, {
        licenses: licenseOptions,
        activities: businessActivities,
        visas: visaOptions,
        addOns: addOnOptions,
      }),
    [state],
  );

  const leadReady = isLeadFormComplete(leadForm);
  const calculatorUnlocked = quoteStarted && leadReady;
  const selectedLicense =
    licenseOptions.find((item) => item.id === selectedLicenseId) ?? null;
  const selectedActivitySet = useMemo(
    () => new Set(selectedActivityIds),
    [selectedActivityIds],
  );
  const selectedAddOnSet = useMemo(
    () => new Set(selectedAddOnIds),
    [selectedAddOnIds],
  );
  const selectedActivities = useMemo(
    () =>
      businessActivities.filter((activity) =>
        selectedActivitySet.has(activity.id),
      ),
    [selectedActivitySet],
  );
  const selectedAddOns = useMemo(
    () => addOnOptions.filter((addOn) => selectedAddOnSet.has(addOn.id)),
    [selectedAddOnSet],
  );

  const submissionIssues = useMemo(
    () => getSubmissionIssues(state, pricingConfig.minimumActivities),
    [state],
  );

  const filteredCategories = useMemo(() => {
    const query = activityQuery.trim().toLowerCase();

    if (!query) {
      return activityCategories;
    }

    return activityCategories.filter((category) => {
      const categoryActivities = businessActivities.filter(
        (activity) => activity.categoryId === category.id,
      );

      return [
        category.name,
        category.description,
        ...categoryActivities.flatMap((activity) => [
          activity.name,
          activity.code,
        ]),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [activityQuery]);

  const activeLicenseModal =
    licenseOptions.find((item) => item.id === licenseModalId) ?? null;
  const activeVisaModal =
    visaOptions.find((item) => item.id === visaModalId) ?? null;
  const activeAddOnGroup =
    addOnGroups.find((item) => item.id === addOnGroupModalId) ?? null;
  const activeActivityCategory =
    activityCategories.find((item) => item.id === activityCategoryModalId) ??
    null;

  const modalActivities = useMemo(() => {
    if (!activeActivityCategory) {
      return [];
    }

    const query = activityModalQuery.trim().toLowerCase();

    return businessActivities.filter((activity) => {
      if (activity.categoryId !== activeActivityCategory.id) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [activity.name, activity.code, activity.description]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [activeActivityCategory, activityModalQuery]);

  useEffect(() => {
    saveCalculatorState(state);
  }, [state]);

  useEffect(() => {
    setApplicantsInsideUae((current) => Math.min(current, totalVisaApplicants));
  }, [totalVisaApplicants]);

  useEffect(() => {
    return () => {
      if (shareResetRef.current) {
        window.clearTimeout(shareResetRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const node = phoneFieldWrapperRef.current;

    if (!node) {
      return;
    }

    const updateWidth = () => {
      setPhoneDropdownWidth(node.getBoundingClientRect().width);
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);

      return () => {
        window.removeEventListener("resize", updateWidth);
      };
    }

    const observer = new ResizeObserver(() => {
      updateWidth();
    });
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  const scrollToRef = (ref: RefObject<HTMLElement | HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleContinue = async () => {
    setLeadValidationAttempted(true);
    const valid = await trigger();

    if (!valid) {
      return;
    }

    setShowSuccess(false);
    setIsUnlocking(true);
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, UNLOCK_DELAY_MS);
    });
    setQuoteStarted(true);
    setIsUnlocking(false);
    window.setTimeout(() => {
      scrollToRef(licenseSectionRef);
    }, 40);
  };

  const handleConfirmQuote = async () => {
    setLeadValidationAttempted(true);
    setSubmitAttempted(true);
    const validLead = await trigger();

    if (!validLead) {
      return;
    }

    if (submissionIssues.length > 0) {
      scrollToRef(quoteSidebarRef);
      return;
    }

    setShowSuccess(true);
    scrollToRef(quoteSidebarRef);
  };

  const handleShare = async () => {
    const shareText = `G12 estimate: ${formatAed(quote.total)}`;

    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: "G12 Cost Calculator",
          text: shareText,
          url: window.location.href,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(
          `${shareText} - ${window.location.href}`,
        );
      } else {
        return;
      }

      setShareStatus("copied");
      if (shareResetRef.current) {
        window.clearTimeout(shareResetRef.current);
      }
      shareResetRef.current = window.setTimeout(() => {
        setShareStatus("idle");
      }, 1800);
    } catch {
      setShareStatus("idle");
    }
  };

  const toggleActivity = (activityId: string) => {
    setShowSuccess(false);
    setSelectedActivityIds((current) =>
      current.includes(activityId)
        ? current.filter((item) => item !== activityId)
        : [...current, activityId],
    );
  };

  const toggleAddOn = (addOnId: string) => {
    setShowSuccess(false);
    setSelectedAddOnIds((current) =>
      current.includes(addOnId)
        ? current.filter((item) => item !== addOnId)
        : [...current, addOnId],
    );
  };

  const updateEmployeeCount = (value: number) => {
    setShowSuccess(false);
    setEmployeeVisaCount(value);
  };

  const updateDependentCount = (value: number) => {
    setShowSuccess(false);
    setDependentVisaCount(value);
  };

  const updateApplicantsInside = (value: number) => {
    setShowSuccess(false);
    setApplicantsInsideUae(Math.min(totalVisaApplicants, value));
  };

  return (
    <>
      <main className="min-h-[50vh] bg-[#f5f5f8] ">
        <section
          className="overflow-visible pb-6 pt-16 bg-white bg-cover bg-no-repeat bg-[position:50%_50%]"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="mx-auto max-w-[1280px] px-4 md:px-6">
            <h1 className="max-w-xl font-semibold leading-12 text-4xl mb-6">
              Calculate Your Dubai Trade <br />
              License Cost Now
            </h1>

            <div id="calculate-now" className="relative">
              <div className="relative pt-0 pb-16 z-10 grid gap-8 lg:grid-cols-[58%_36%] lg:items-start lg:justify-between">
                <div className="space-y-8">
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      void handleContinue();
                    }}
                    className="rounded-[2rem] border border-[#e4ebf3] bg-[#f3f3f4] px-6 py-6 shadow-[0_22px_58px_rgba(60,91,125,0.11)] md:px-7 md:py-7"
                  >
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <h2 className=" text-[1.85rem] font-semibold text-[#111723]">
                          Tell Us a Few Details to Get Started
                        </h2>
                        <p className="max-w-[30rem] text-sm leading-7 text-slate-500">
                          The more we know about your business goals, the more
                          accurate your setup path.
                        </p>
                      </div>

                      {leadReady ? (
                        <div className="inline-flex items-center gap-2 rounded-full bg-[#e9f6e5] px-4 py-2 text-sm font-semibold text-[#5c9151]">
                          <Check size={16} />
                          Ready to calculate
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-6 grid gap-4">
                      <Controller
                        control={control}
                        name="fullName"
                        render={({ field }) => (
                          <div>
                            <label
                              htmlFor="lead-full-name"
                              className="mb-3 block text-[1.05rem] font-semibold text-[#343434]"
                            >
                              Enter your full name *
                            </label>
                            <input
                              {...field}
                              id="lead-full-name"
                              value={field.value ?? ""}
                              onChange={(event) =>
                                field.onChange(
                                  sanitizeLeadFullNameInput(event.target.value),
                                )
                              }
                              className={cn(
                                "w-full rounded-[0.95rem] border bg-[#f7f7f8] px-5 py-4 text-[1rem] text-[#343434] outline-none transition placeholder:text-[#9b9b9b] focus:bg-white",
                                errors.fullName
                                  ? "border-[#f15b43] ring-1 ring-[#f15b43]/15"
                                  : "border-[#d8d8dc] focus:border-[#343434]",
                              )}
                              placeholder="Your name"
                              aria-label="Enter your full name"
                            />
                            <FieldError message={errors.fullName?.message} />
                          </div>
                        )}
                      />

                      <Controller
                        control={control}
                        name="phone"
                        render={({ field }) => (
                          <div
                            ref={phoneFieldWrapperRef}
                            style={
                              phoneDropdownWidth
                                ? ({
                                    ["--phone-dropdown-width" as string]: `${phoneDropdownWidth}px`,
                                  } as CSSProperties)
                                : undefined
                            }
                          >
                            <label
                              htmlFor="lead-phone"
                              className="mb-3 block text-[1.05rem] font-semibold text-[#343434]"
                            >
                              Enter phone number *
                            </label>
                            <PhoneInput
                              country={
                                getPhoneSelection(
                                  field.value ?? "",
                                  DEFAULT_PHONE_COUNTRY,
                                  DEFAULT_PHONE_DIAL_CODE,
                                ).country || DEFAULT_PHONE_COUNTRY
                              }
                              value={field.value ?? ""}
                              onBlur={field.onBlur}
                              onChange={(value, country) => {
                                field.onChange(
                                  normalizePhoneNumber(value, country),
                                );
                              }}
                              enableSearch
                              disableSearchIcon
                              countryCodeEditable={false}
                              searchPlaceholder="Search"
                              placeholder="Phone number"
                              containerClass="phone-field"
                              buttonClass={cn(
                                "phone-field__button",
                                errors.phone
                                  ? "phone-field__button--error"
                                  : "",
                              )}
                              inputClass={cn(
                                "phone-field__input",
                                errors.phone ? "phone-field__input--error" : "",
                              )}
                              dropdownClass="phone-field__dropdown"
                              searchClass="phone-field__search"
                              inputProps={{
                                id: "lead-phone",
                                name: field.name,
                                "aria-label": "Enter phone number",
                              }}
                            />
                            <FieldError message={errors.phone?.message} />
                          </div>
                        )}
                      />

                      <Controller
                        control={control}
                        name="email"
                        render={({ field }) => (
                          <div>
                            <label
                              htmlFor="lead-email"
                              className="mb-3 block text-[1.05rem] font-semibold text-[#343434]"
                            >
                              Enter email address *
                            </label>
                            <input
                              {...field}
                              id="lead-email"
                              type="email"
                              value={field.value ?? ""}
                              className={cn(
                                "w-full rounded-[0.95rem] border bg-[#f7f7f8] px-5 py-4 text-[1rem] text-[#343434] outline-none transition placeholder:text-[#9b9b9b] focus:bg-white",
                                errors.email
                                  ? "border-[#f15b43] ring-1 ring-[#f15b43]/15"
                                  : "border-transparent focus:border-[#343434]",
                              )}
                              placeholder="Email address"
                              aria-label="Enter email address"
                            />
                            <FieldError message={errors.email?.message} />
                          </div>
                        )}
                      />

                      <Controller
                        control={control}
                        name="consent"
                        render={({ field }) => (
                          <div>
                            <label className="flex cursor-pointer items-start gap-3 rounded-[1.2rem] border border-[#dfe6ef] bg-[#fbfcfe] px-4 py-4 text-sm text-slate-600">
                              <input
                                type="checkbox"
                                checked={field.value ?? false}
                                onChange={(event) =>
                                  field.onChange(event.target.checked)
                                }
                                className="mt-0.5 h-4 w-4 rounded border-[#b9c7d7] text-[#ab8134]"
                                aria-label="Terms and privacy policy"
                              />
                              <span>
                                I confirm that I have read and understood G12
                                Free Zone's{' '}
                                <a
                                  href="https://meydanfz.ae/terms-and-conditions"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline"
                                >
                                  Terms
                                </a>{' '}
                                and{' '}
                                <a
                                  href="https://meydanfz.ae/privacy-policy"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline"
                                >
                                  Privacy Policy
                                </a>{' '}
                                and consent to the processing of my personal
                                data for the purposes of communication and
                                service delivery. I agree to be contacted via
                                email, phone, or WhatsApp. I acknowledge that
                                G12 Free Zone operates 24/7 and that contact
                                may occur outside standard business hours,
                                including after 6:00 PM UAE time. I further
                                acknowledge that G12 Free Zone will never
                                request passwords, one-time passcodes (OTPs), or
                                payments to personal or unknown bank accounts
                                and that I should verify any suspicious or
                                unexpected communication by calling 800 FZ1 (800
                                391) before taking any action.
                              </span>
                            </label>
                            <FieldError message={errors.consent?.message} />
                          </div>
                        )}
                      />
                    </div>

                    {leadValidationAttempted &&
                    !leadReady &&
                    !Object.keys(errors).length ? (
                      <p className="mt-4 text-sm text-slate-500">
                        Complete all fields to unlock the calculator.
                      </p>
                    ) : null}

                    <button
                      type="submit"
                      disabled={isUnlocking}
                      className="brand-gradient brand-gradient-hover mt-6 inline-flex w-full items-center justify-center rounded-full px-6 py-4 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isUnlocking ? "Unlocking calculator..." : "Calculate"}
                    </button>

                    <p className="mt-4 text-sm text-slate-500">
                      This is a required step to calculate your business setup
                      cost.
                    </p>
                  </form>

                  <AnimatePresence initial={false}>
                    {calculatorUnlocked ? (
                      <motion.div
                        key="calculator-sections"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 18 }}
                        className="space-y-8"
                      >
                        <AnimatedSection delay={0.02}>
                          <section
                            ref={licenseSectionRef}
                            className="scroll-mt-24"
                          >
                            <SectionHeading
                              eyebrow="Step 2"
                              title="Choose your G12 license"
                              description="Select the license package that matches your launch speed and growth plans, then adjust the duration and shareholder count."
                            />

                            <div className="mt-6 grid gap-5 xl:grid-cols-2">
                              {licenseOptions.map((license) => {
                                const selected =
                                  selectedLicenseId === license.id;

                                return (
                                  <div
                                    key={license.id}
                                    className={cn(
                                      "overflow-hidden rounded-[2rem] border bg-white p-6 shadow-[0_18px_40px_rgba(60,91,125,0.08)] transition",
                                      selected
                                        ? "border-[#ab8134] ring-2 ring-[#eddcbf]"
                                        : "border-[#e6ebf2]",
                                    )}
                                  >
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="space-y-3">
                                        <span className="inline-flex rounded-full bg-[#f6eee0] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#ab8134]">
                                          {license.timeline}
                                        </span>
                                        <div>
                                          <h3 className="text-[1.55rem] font-semibold text-[#111723]">
                                            {license.name}
                                          </h3>
                                          <p className="mt-1 text-sm font-medium text-[#a77b35]">
                                            {license.tagline}
                                          </p>
                                        </div>
                                      </div>

                                      {selected ? (
                                        <span className="inline-flex items-center gap-2 rounded-full bg-[#e9f6e5] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#5c9151]">
                                          <Check size={14} />
                                          Selected
                                        </span>
                                      ) : null}
                                    </div>

                                    <img
                                      src={license.image}
                                      alt={license.name}
                                      className="mt-5 h-40 w-full rounded-[1.5rem] border border-[#edf1f7] bg-[#f8fafc] object-cover p-5"
                                    />

                                    <p className="mt-5 text-sm leading-7 text-slate-500">
                                      {license.description}
                                    </p>

                                    <ul className="mt-5 space-y-3">
                                      {license.features.map((feature) => (
                                        <li
                                          key={feature}
                                          className="flex items-start gap-3 text-sm text-slate-600"
                                        >
                                          <span className="mt-1 grid h-5 w-5 place-items-center rounded-full bg-[#f6eee0] text-[#ab8134]">
                                            <Check size={12} />
                                          </span>
                                          {feature}
                                        </li>
                                      ))}
                                    </ul>

                                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setLicenseModalId(license.id)
                                        }
                                        className="inline-flex flex-1 items-center justify-center rounded-full border border-[#d7deea] px-4 py-3 text-sm font-semibold text-[#111723] transition hover:bg-[#f5f8fc]"
                                        aria-label={`Learn more about ${license.name}`}
                                      >
                                        Learn More
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setShowSuccess(false);
                                          setSelectedLicenseId(license.id);
                                        }}
                                        className={cn(
                                          "inline-flex flex-1 items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition",
                                          selected
                                            ? "bg-[#111723] text-white"
                                            : "brand-gradient brand-gradient-hover text-white",
                                        )}
                                      >
                                        {selected
                                          ? "Selected"
                                          : license.selectLabel}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="mt-6 grid gap-5 xl:grid-cols-2">
                              <div className="rounded-[1.8rem] border border-[#e6ebf2] bg-white p-6 shadow-[0_18px_40px_rgba(60,91,125,0.08)]">
                                <h3 className="text-lg font-semibold text-[#111723]">
                                  License Duration
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                  Extend your setup duration. The additional
                                  cost follows G12's multi-year pricing grid.
                                </p>
                                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                  {[1, 2, 3, 4, 5, 6].map((year) => {
                                    const selected = durationYears === year;

                                    return (
                                      <button
                                        key={year}
                                        type="button"
                                        onClick={() => {
                                          setShowSuccess(false);
                                          setDurationYears(year);
                                        }}
                                        className={cn(
                                          "rounded-[1.2rem] border px-4 py-3 text-left transition",
                                          selected
                                            ? "border-[#ab8134] bg-[#f6eee0] text-[#ab8134]"
                                            : "border-[#d8e1eb] bg-[#fbfcfe] text-[#111723] hover:border-[#bfd0e3]",
                                        )}
                                      >
                                        <span className="block text-sm font-semibold">
                                          {year === 1
                                            ? "1 Year"
                                            : `${year} Years`}
                                        </span>
                                        <span className="mt-1 block text-xs text-slate-500">
                                          +
                                          {formatAed(
                                            pricingConfig.durations[year] ?? 0,
                                          )}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <CounterField
                                label="Shareholders"
                                description={`Up to ${pricingConfig.includedShareholders} shareholders are included. Each additional shareholder adds ${formatAed(pricingConfig.extraShareholderFee)}.`}
                                value={shareholderCount}
                                min={1}
                                max={15}
                                onChange={(value) => {
                                  setShowSuccess(false);
                                  setShareholderCount(value);
                                }}
                              />
                            </div>
                          </section>
                        </AnimatedSection>
                        <AnimatedSection delay={0.06}>
                          <section
                            ref={activitiesSectionRef}
                            className="scroll-mt-24"
                          >
                            <SectionHeading
                              eyebrow="Step 3"
                              title="Choose your business activities"
                              description={`The first ${pricingConfig.includedActivityCount} activities are included. Each additional activity adds ${formatAed(pricingConfig.extraActivityFee)}.`}
                            />

                            <div className="mt-6 rounded-[1.8rem] border border-[#e6ebf2] bg-white px-5 py-4 shadow-[0_18px_40px_rgba(60,91,125,0.08)]">
                              <label
                                htmlFor="activity-search"
                                className="mb-2 block text-sm font-medium text-[#28394c]"
                              >
                                Search activity categories
                              </label>
                              <div className="relative">
                                <Search
                                  size={18}
                                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                  id="activity-search"
                                  value={activityQuery}
                                  onChange={(event) =>
                                    setActivityQuery(event.target.value)
                                  }
                                  className="w-full rounded-[1.2rem] border border-[#d7deea] bg-[#f8fafc] py-3 pl-12 pr-4 text-sm outline-none transition focus:border-[#ab8134] focus:bg-white"
                                  placeholder="Search categories, activity names, or codes"
                                  aria-label="Search activity categories"
                                />
                              </div>
                            </div>

                            <div className="mt-6 grid gap-5 xl:grid-cols-2">
                              {filteredCategories.map((category) => {
                                const categorySelections =
                                  selectedActivities.filter(
                                    (activity) =>
                                      activity.categoryId === category.id,
                                  );
                                const preview = categorySelections
                                  .slice(0, 2)
                                  .map((activity) => activity.name);

                                if (categorySelections.length > 2) {
                                  preview.push(
                                    `+${categorySelections.length - 2} more selected`,
                                  );
                                }

                                return (
                                  <CategoryCard
                                    key={category.id}
                                    category={category}
                                    preview={preview}
                                    selectedCount={categorySelections.length}
                                    onOpen={() => {
                                      setActivityModalQuery("");
                                      setActivityCategoryModalId(category.id);
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </section>
                        </AnimatedSection>
                        <AnimatedSection delay={0.1}>
                          <section
                            ref={visasSectionRef}
                            className="scroll-mt-24"
                          >
                            <SectionHeading
                              eyebrow="Step 4"
                              title="Select your visa requirements"
                              description="Use the investor toggle and visa counters to reflect who needs residency support. Change of status only applies to applicants already inside the UAE."
                            />

                            <div className="mt-6 grid gap-5 xl:grid-cols-3">
                              {visaOptions.map((visa) => {
                                const isInvestor = visa.id === "investor-visa";
                                const count =
                                  visa.id === "employee-visa"
                                    ? employeeVisaCount
                                    : visa.id === "dependent-visa"
                                      ? dependentVisaCount
                                      : investorVisaEnabled
                                        ? 1
                                        : 0;

                                return (
                                  <div
                                    key={visa.id}
                                    className="rounded-[2rem] border border-[#e6ebf2] bg-white p-6 shadow-[0_18px_40px_rgba(60,91,125,0.08)]"
                                  >
                                    <img
                                      src={visa.image}
                                      alt={visa.name}
                                      className="h-36 w-full rounded-[1.4rem] border border-[#edf1f7] bg-[#f8fafc] object-cover p-5"
                                    />

                                    <div className="mt-5 flex items-start justify-between gap-4">
                                      <div>
                                        <h3 className="text-[1.35rem] font-semibold text-[#111723]">
                                          {visa.name}
                                        </h3>
                                        <p className="mt-2 text-sm leading-6 text-slate-500">
                                          {visa.description}
                                        </p>
                                      </div>
                                      <div className="rounded-full bg-[#f6eee0] px-3 py-1 text-xs font-semibold text-[#ab8134]">
                                        {formatAed(visa.fee)}
                                      </div>
                                    </div>

                                    <div className="mt-6 flex items-center justify-between gap-4">
                                      <button
                                        type="button"
                                        onClick={() => setVisaModalId(visa.id)}
                                        className="inline-flex items-center justify-center rounded-full border border-[#d7deea] px-4 py-3 text-sm font-semibold text-[#111723] transition hover:bg-[#f5f8fc]"
                                        aria-label={`Learn more about ${visa.name}`}
                                      >
                                        Learn More
                                      </button>

                                      {isInvestor ? (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setShowSuccess(false);
                                            setInvestorVisaEnabled(
                                              (current) => !current,
                                            );
                                          }}
                                          className={cn(
                                            "inline-flex min-w-[9rem] items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition",
                                            investorVisaEnabled
                                              ? "brand-gradient brand-gradient-hover text-white"
                                              : "border border-[#d7deea] text-[#111723] hover:bg-[#f5f8fc]",
                                          )}
                                        >
                                          {investorVisaEnabled
                                            ? "Investor Selected"
                                            : "Add Investor Visa"}
                                        </button>
                                      ) : (
                                        <div className="flex items-center gap-3 rounded-full border border-[#e5ebf3] bg-[#fbfcfe] px-2 py-2">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              visa.id === "employee-visa"
                                                ? updateEmployeeCount(
                                                    Math.max(
                                                      0,
                                                      employeeVisaCount - 1,
                                                    ),
                                                  )
                                                : updateDependentCount(
                                                    Math.max(
                                                      0,
                                                      dependentVisaCount - 1,
                                                    ),
                                                  )
                                            }
                                            className="grid h-10 w-10 place-items-center rounded-full text-[#425d7b] transition hover:bg-white"
                                            aria-label={`Decrease ${visa.name}`}
                                          >
                                            <Minus size={16} />
                                          </button>
                                          <span className="min-w-[2ch] text-center text-lg font-semibold text-[#111723]">
                                            {count}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              visa.id === "employee-visa"
                                                ? updateEmployeeCount(
                                                    employeeVisaCount + 1,
                                                  )
                                                : updateDependentCount(
                                                    dependentVisaCount + 1,
                                                  )
                                            }
                                            className="brand-gradient brand-gradient-hover grid h-10 w-10 place-items-center rounded-full"
                                            aria-label={`Increase ${visa.name}`}
                                          >
                                            <Plus size={16} />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {totalVisaApplicants > 0 ? (
                              <div className="mt-6 grid gap-5 xl:grid-cols-2">
                                <CounterField
                                  label="Applicants Inside the UAE"
                                  description={`Only applicants inside the UAE incur the ${formatAed(pricingConfig.changeStatusInsideFee)} change-of-status fee.`}
                                  value={applicantsInsideUae}
                                  min={0}
                                  max={totalVisaApplicants}
                                  onChange={updateApplicantsInside}
                                />

                                <div className="rounded-[1.6rem] border border-[#e6ebf2] bg-white px-5 py-4 shadow-[0_18px_40px_rgba(60,91,125,0.08)]">
                                  <h3 className="text-lg font-semibold text-[#111723]">
                                    Change of Status Summary
                                  </h3>
                                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                                    <div className="flex items-center justify-between gap-4">
                                      <span>Total visa applicants</span>
                                      <span className="font-semibold text-[#111723]">
                                        {totalVisaApplicants}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                      <span>Applicants outside the UAE</span>
                                      <span className="font-semibold text-[#111723]">
                                        {Math.max(
                                          0,
                                          totalVisaApplicants -
                                            applicantsInsideUae,
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                      <span>Applicants inside the UAE</span>
                                      <span className="font-semibold text-[#111723]">
                                        {applicantsInsideUae}
                                      </span>
                                    </div>
                                    <div className="border-t border-[#eef2f6] pt-3">
                                      <div className="flex items-center justify-between gap-4 font-semibold text-[#ab8134]">
                                        <span>Change of status total</span>
                                        <span>
                                          {formatAed(quote.changeStatusTotal)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </section>
                        </AnimatedSection>
                        <AnimatedSection delay={0.14}>
                          <section
                            ref={addOnsSectionRef}
                            className="scroll-mt-24"
                          >
                            <SectionHeading
                              eyebrow="Step 5"
                              title="Add optional G12 services"
                              description="Choose add-ons in grouped packages. All selections remain local-only and feed directly into the quote sidebar."
                            />

                            <div className="mt-6 space-y-5">
                              {addOnGroups.map((group) => {
                                const groupItems = addOnOptions.filter(
                                  (item) => item.groupId === group.id,
                                );

                                return (
                                  <div
                                    key={group.id}
                                    className="rounded-[2rem] border border-[#e6ebf2] bg-white p-6 shadow-[0_18px_40px_rgba(60,91,125,0.08)]"
                                  >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                      <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ab8134]">
                                          {group.name}
                                        </p>
                                        <h3 className="mt-2 text-[1.45rem] font-semibold text-[#111723]">
                                          {group.name}
                                        </h3>
                                        <p className="mt-2 max-w-[42rem] text-sm leading-7 text-slate-500">
                                          {group.description}
                                        </p>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          setAddOnGroupModalId(group.id)
                                        }
                                        className="inline-flex items-center justify-center rounded-full border border-[#d7deea] px-4 py-3 text-sm font-semibold text-[#111723] transition hover:bg-[#f5f8fc]"
                                        aria-label={`Learn more about ${group.name}`}
                                      >
                                        Learn More
                                      </button>
                                    </div>

                                    <div className="mt-5 flex flex-wrap gap-3">
                                      {groupItems.map((item) => {
                                        const selected = selectedAddOnSet.has(
                                          item.id,
                                        );

                                        return (
                                          <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => toggleAddOn(item.id)}
                                            aria-pressed={selected}
                                            className={cn(
                                              "rounded-full border px-4 py-3 text-left text-sm transition",
                                              selected
                                                ? "border-[#ab8134] bg-[#f6eee0] text-[#ab8134]"
                                                : "border-[#d7deea] bg-[#fbfcfe] text-[#28394c] hover:border-[#bfd0e3]",
                                            )}
                                          >
                                            <span className="font-semibold">
                                              {item.name}
                                            </span>
                                            <span className="ml-2 text-slate-500">
                                              {formatAed(item.fee)}
                                            </span>
                                            {item.recommended ? (
                                              <span className="ml-2 rounded-full bg-[#e9f6e5] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5c9151]">
                                                Recommended
                                              </span>
                                            ) : null}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </section>
                        </AnimatedSection>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>

                <QuoteSidebar
                  ref={quoteSidebarRef}
                  quote={quote}
                  selectedLicense={selectedLicense}
                  durationYears={durationYears}
                  shareholderCount={shareholderCount}
                  selectedActivities={selectedActivities}
                  selectedAddOns={selectedAddOns}
                  visaOptions={visaOptions}
                  investorVisaEnabled={investorVisaEnabled}
                  employeeVisaCount={employeeVisaCount}
                  dependentVisaCount={dependentVisaCount}
                  applicantsInsideUae={applicantsInsideUae}
                  submitAttempted={submitAttempted}
                  submissionIssues={submissionIssues}
                  showSuccess={showSuccess}
                  leadName={leadForm.fullName}
                  shareStatus={shareStatus}
                  onShare={() => {
                    void handleShare();
                  }}
                  onConfirm={() => {
                    void handleConfirmQuote();
                  }}
                  onEditCompanySetup={() => scrollToRef(licenseSectionRef)}
                  onEditActivities={() => scrollToRef(activitiesSectionRef)}
                  onEditVisas={() => scrollToRef(visasSectionRef)}
                  onEditAddOns={() => scrollToRef(addOnsSectionRef)}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden p-0 text-center">
          <div className="mx-auto max-w-[1280px]">
            <div className="mx-auto max-w-xl space-y-6">
              <h2 className="text-4xl font-semibold leading-14">
                How Much Does it Cost to Get a Trade License in Dubai?
              </h2>
              <p className="text-lg leading-6">
                <strong>
                  Searching for the cost of a trade license in Dubai?
                </strong>
                <br />
                You probably want to know three things before you move forward
              </p>
            </div>
          </div>

          <div className="mx-auto max-w-[1280px] mt-10 grid gap-7 md:grid-cols-3">
            {informationalCards.map((card) => (
              <a
                key={`${card.titleTop}-${card.titleAccent}`}
                href={card.href}
                className="group rounded-[1.9rem] bg-white px-8 py-10 text-center transition hover:-translate-y-0.5"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.2rem] bg-[linear-gradient(180deg,#eef5f8_0%,#d9edf0_100%)] text-[#6fa4b1]">
                  <card.Icon size={34} strokeWidth={1.8} />
                </div>
                <div className="mt-9 space-y-1">
                  <p className="text-[1.1rem] font-semibold leading-tight text-[#202020] md:text-[1.25rem]">
                    {card.titleTop}
                  </p>
                  <p
                    className={cn(
                      "text-[1.1rem] font-semibold leading-tight md:text-[1.25rem]",
                      card.accentClassName,
                    )}
                  >
                    {card.titleAccent}
                  </p>
                  {card.titleBottom ? (
                    <p className="text-[1.1rem] font-semibold leading-tight text-[#202020] md:text-[1.25rem]">
                      {card.titleBottom}
                    </p>
                  ) : null}
                </div>
                <span className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#1473e6] px-6 py-3 text-[0.98rem] font-semibold text-white transition group-hover:bg-[#0f67d5]">
                  Learn More
                  <ArrowRight size={18} />
                </span>
              </a>
            ))}
          </div>
          <div className="mx-auto max-w-[1280px] px-4 pb-10 pt-8 md:px-6 md:pb-16 md:pt-16">
            <p className="mx-auto max-w-4xl leading-6 text-base">
              Use this calculator to get a realistic estimate for setting up a
              company in G12 Free Zone, based on how business models are
              actually evaluated and approved.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-[1280px] space-y-10 px-4 py-10 md:px-6 md:py-16">
        <AnimatedSection delay={0.04}>
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <div className="rounded-[2rem] border border-[#e6ebf2] bg-white px-6 py-7 shadow-[0_22px_58px_rgba(60,91,125,0.09)] md:px-8">
              <h2 className=" text-[1.85rem] font-semibold leading-tight text-[#111723] md:text-[2.35rem]">
                Who Is This Calculator For?
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-500 md:text-base">
                This calculator is built for
              </p>

              <div className="mt-6 grid gap-3">
                {calculatorAudience.map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.4rem] border border-[#ebf0f6] bg-[#f8fbfe] px-4 py-4 text-sm leading-7 text-[#34465a] md:text-[0.98rem]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#d8e3ef] bg-[linear-gradient(42deg,#d6a456_0%,#ab8134_70%)] px-6 py-7 text-white shadow-[0_28px_65px_rgba(171,129,52,0.28)] md:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Ready to estimate
              </p>
              <p className="mt-4 text-lg leading-8 text-white/90">
                Already know your business activity and visa requirements?
                Get your estimate now. Instant results, no waiting.
              </p>
              <CalculateNowLink className="mt-8 border-white/25 bg-white text-[#ab8134] hover:border-white hover:bg-[#fbf4e9]" />
            </div>
          </section>
        </AnimatedSection>

        <AnimatedSection delay={0.08}>
          <section
            id="why-trade"
            className="rounded-[2.2rem] border border-[#e6ebf2] bg-white px-6 py-8 shadow-[0_24px_60px_rgba(60,91,125,0.1)] md:px-8"
          >
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-center">
              <div>
                <h2 className=" text-[1.9rem] font-semibold leading-tight text-[#111723] md:text-[2.55rem]">
                  See Exactly What Goes Into Your Dubai Trade License Cost
                </h2>
                <p className="mt-3 max-w-[38rem] text-sm leading-7 text-slate-500 md:text-base">
                  Build your setup step by step. Adjust your inputs and watch
                  your estimate update instantly.
                </p>
                <CalculateNowLink className="mt-6" />
              </div>

              <div className="rounded-[1.9rem] border border-[#d8e3ef] bg-[linear-gradient(160deg,#f6f9fd_0%,#e7f0fb_100%)] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ab8134]">
                  The cost calculator covers
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {calculatorCoverage.map((item) => (
                    <div
                      key={item}
                      className="rounded-[1.35rem] border border-white/80 bg-white/80 px-4 py-4 text-sm font-medium leading-6 text-[#27384a]"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        <AnimatedSection delay={0.12}>
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
            <div className="rounded-[2rem] border border-[#e6ebf2] bg-white px-6 py-7 shadow-[0_22px_58px_rgba(60,91,125,0.09)] md:px-8">
              <h2 className=" text-[1.85rem] font-semibold leading-tight text-[#111723] md:text-[2.35rem]">
                Why Your Trade License Cost Depends on Your Setup
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-500 md:text-base">
                No two setups are the same and neither are the costs. Your
                total depends on how you configure your company.
              </p>

              <div className="mt-5 rounded-[1.6rem] bg-[#f8fbfe] px-5 py-5">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#ab8134]">
                  Your estimate will change based on:
                </p>
                <ul className="mt-4 grid gap-3 text-sm leading-7 text-slate-600 md:grid-cols-2 md:text-[0.98rem]">
                  {setupFactors.map((item) => (
                    <li
                      key={item}
                      className="rounded-[1.2rem] border border-[#e5edf6] bg-white px-4 py-3"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-5 text-sm leading-7 text-slate-500 md:text-base">
                That's why this cost calculator lets you test different setups
                and compare scenarios, so you can see exactly how each decision
                impacts your cost before you commit.
              </p>
              <CalculateNowLink className="mt-6" />
            </div>

            <div className="rounded-[2rem] border border-[#e6ebf2] bg-[linear-gradient(180deg,#ffffff_0%,#f3f7fb_100%)] px-6 py-7 shadow-[0_22px_58px_rgba(60,91,125,0.09)] md:px-8">
              <h2 className=" text-[1.65rem] font-semibold leading-tight text-[#111723] md:text-[2rem]">
                How Accurate Is This Cost Estimate?
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-500 md:text-base">
                The estimate you receive reflects current G12 Free Zone
                pricing, standard visa structures, and typical approval
                scenarios, so you can plan with confidence.
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-500 md:text-base">
                Final pricing is confirmed after business activity approval,
                immigration clearance, and document verification, and may
                adjust depending on changes made during your application.
                This cost calculator helps you understand whether your budget
                aligns before you speak to an advisor.
              </p>
              <CalculateNowLink className="mt-6" />
            </div>
          </section>
        </AnimatedSection>

        <AnimatedSection delay={0.16}>
          <section className="rounded-[2.2rem] border border-[#e6ebf2] bg-white px-6 py-8 shadow-[0_24px_60px_rgba(60,91,125,0.1)] md:px-8">
            <div className="max-w-[48rem]">
              <h2 className=" text-[1.9rem] font-semibold leading-tight text-[#111723] md:text-[2.55rem]">
                What Happens After You Get Your Cost Estimate
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-500 md:text-base">
                Your results are generated instantly, giving you a clear view of
                the estimated setup structure before you make a decision.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {nextSteps.map((item, index) => (
                <div
                  key={item}
                  className="rounded-[1.7rem] border border-[#dfe7f0] bg-[linear-gradient(180deg,#fbfdff_0%,#f1f6fb_100%)] px-5 py-5"
                >
                  <div className="text-[2rem] font-semibold leading-none text-[#ab8134]">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-600 md:text-[0.98rem]">
                    {item}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-4 rounded-[1.6rem] bg-[#f8fbfe] px-5 py-5 md:flex-row md:items-center md:justify-between">
              <p className="max-w-[42rem] text-sm leading-7 text-slate-500 md:text-base">
                Not ready to commit? No problem. Many founders use this
                estimate purely to compare options before making a decision.
              </p>
              <CalculateNowLink />
            </div>
          </section>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <section
            id="cc-faq"
            className="rounded-[2.2rem] border border-[#e6ebf2] bg-white px-6 py-8 shadow-[0_24px_60px_rgba(60,91,125,0.1)] md:px-8"
          >
            <div className="max-w-[46rem]">
              <h2 className=" text-[1.9rem] font-semibold leading-tight text-[#111723] md:text-[2.55rem]">
                Common Questions Founders Ask Before Checking Trade License
                Costs
              </h2>
            </div>

            <div className="mt-6 space-y-4">
              {faqItems.map((item, index) => (
                <FaqAccordionItem
                  key={item.question}
                  question={item.question}
                  answer={item.answer}
                  isOpen={openFaqIndex === index}
                  onToggle={() =>
                    setOpenFaqIndex((current) =>
                      current === index ? -1 : index,
                    )
                  }
                />
              ))}
            </div>
          </section>
        </AnimatedSection>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d9e2ed] bg-white/92 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b8ea8]">
              Grand Total
            </p>
            <p className="text-lg font-semibold text-[#ab8134]">
              {formatAed(quote.total)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => scrollToRef(quoteSidebarRef)}
            className="brand-gradient brand-gradient-hover inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
          >
            View Estimate
          </button>
        </div>
      </div>

      {activeLicenseModal ? (
        <ModalShell
          isOpen
          title={activeLicenseModal.name}
          imageSrc={activeLicenseModal.image}
          onClose={() => setLicenseModalId(null)}
          footer={
            <ModalAction
              label={activeLicenseModal.selectLabel}
              onClick={() => {
                setShowSuccess(false);
                setSelectedLicenseId(activeLicenseModal.id);
                setLicenseModalId(null);
              }}
            />
          }
        >
          {activeLicenseModal.modalCopy.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </ModalShell>
      ) : null}

      {activeVisaModal ? (
        <ModalShell
          isOpen
          title={activeVisaModal.name}
          imageSrc={activeVisaModal.image}
          onClose={() => setVisaModalId(null)}
          footer={
            <ModalAction label="Close" onClick={() => setVisaModalId(null)} />
          }
        >
          {activeVisaModal.modalCopy.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </ModalShell>
      ) : null}

      {activeAddOnGroup ? (
        <ModalShell
          isOpen
          title={activeAddOnGroup.name}
          onClose={() => setAddOnGroupModalId(null)}
          footer={
            <ModalAction
              label="Close"
              onClick={() => setAddOnGroupModalId(null)}
            />
          }
        >
          {activeAddOnGroup.modalCopy.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </ModalShell>
      ) : null}

      {activeActivityCategory ? (
        <ModalShell
          isOpen
          title={`${activeActivityCategory.name} Activities`}
          onClose={() => setActivityCategoryModalId(null)}
          footer={
            <ModalAction
              label="Save selected activities"
              onClick={() => setActivityCategoryModalId(null)}
            />
          }
        >
          <div className="space-y-5">
            <div>
              <label
                htmlFor="activity-modal-search"
                className="mb-2 block text-sm font-medium text-[#28394c]"
              >
                Search activities
              </label>
              <div className="relative">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="activity-modal-search"
                  value={activityModalQuery}
                  onChange={(event) =>
                    setActivityModalQuery(event.target.value)
                  }
                  className="w-full rounded-[1.2rem] border border-[#d7deea] bg-[#f8fafc] py-3 pl-12 pr-4 text-sm outline-none transition focus:border-[#ab8134] focus:bg-white"
                  placeholder="Search within this activity group"
                  aria-label="Search activities"
                />
              </div>
            </div>

            <div className="space-y-3">
              {modalActivities.map((activity) => {
                const selected = selectedActivitySet.has(activity.id);

                return (
                  <label
                    key={activity.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-4 rounded-[1.4rem] border px-4 py-4 transition",
                      selected
                        ? "border-[#ab8134] bg-[#f6eee0]"
                        : "border-[#e5ebf3] bg-[#fbfcfe]",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleActivity(activity.id)}
                      className="mt-1 h-4 w-4 rounded border-[#b9c7d7] text-[#ab8134]"
                      aria-label={activity.name}
                    />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-[#111723]">
                          {activity.name}
                        </p>
                        <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7b8ea8]">
                          {activity.code}
                        </span>
                        {activity.preApproval ? (
                          <span className="rounded-full bg-[#fff1d8] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#a77b35]">
                            Pre-approval
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm leading-6 text-slate-500">
                        {activity.description}
                      </p>
                    </div>
                  </label>
                );
              })}

              {!modalActivities.length ? (
                <div className="rounded-[1.4rem] border border-dashed border-[#d7deea] px-4 py-5 text-sm text-slate-500">
                  No activities matched your search inside this category.
                </div>
              ) : null}
            </div>
          </div>
        </ModalShell>
      ) : null}
    </>
  );
}
