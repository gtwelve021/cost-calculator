import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  Check,
  CheckCheck,
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
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";
import PhoneInput from "react-phone-input-2";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { getCountries } from "libphonenumber-js/min";
import {
  ModalAction,
  ModalShell,
} from "../components/cost-calculator/ModalShell";
import { QuoteSidebar } from "../components/cost-calculator/QuoteSidebar";
import {
  activityCategories,
  addOnGroups,
  changeStatusImage,
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
import { isValidLeadEmail } from "../utils/email";
import { getSubmissionIssues, isLeadFormComplete } from "../utils/gating";
import { sanitizeLeadFullNameInput } from "../utils/lead";
import {
  getLockedPhonePrefixLength,
  getPhoneInputValue,
  getPhoneSelection,
  isValidLeadPhoneNumber,
  normalizePhoneNumber,
  shouldClearPhoneInput,
  shouldPreventPhonePrefixEdit,
} from "../utils/phone";
import { loadCalculatorState, saveCalculatorState } from "../utils/persistence";
import { submitQuoteToSheet } from "../utils/sheets";

const DEFAULT_PHONE_COUNTRY = "ae";
const DEFAULT_PHONE_DIAL_CODE = "971";
const MAINLAND_CONSULTATION_MESSAGE =
  "Mainland license pricing starts from AED 50,000. Submit your details for a consultation.";
const CHANGE_STATUS_MODAL_COPY = [
  "Change of Status is the in-country visa transition process for applicants already inside the UAE.",
  "It allows visa processing without exiting and re-entering the country, depending on your selected visa allocations.",
  "The calculator estimates this cost based on how many applicants you set as inside the UAE.",
] as const;
const REGION_NAMES =
  typeof Intl !== "undefined" && typeof Intl.DisplayNames !== "undefined"
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;
const RESIDENCE_COUNTRY_OPTIONS = (() => {
  const options = getCountries()
    .map((code) => ({
      code,
      label: REGION_NAMES?.of(code) ?? code,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return options;
})();
const UNLOCK_DELAY_MS = 180;
const informationalCards = [
  {
    href: "#calculate-now",
    titleTop: "How Much It Will",
    titleAccent: "Actually",
    titleBottom: "Cost?",
    accentClassName: "text-[#111111]",
    Icon: WalletCards,
  },
  {
    href: "#why-trade",
    titleTop: "What Is Included",
    titleAccent: "In That Cost?",
    titleBottom: "",
    accentClassName: "text-[#3b3b3b]",
    Icon: ReceiptText,
  },
  {
    href: "#cc-faq",
    titleTop: "Whether The Cost",
    titleAccent: "Will Change",
    titleBottom: "Later?",
    accentClassName: "text-[#555555]",
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
    question: "What is the kanoony cost calculator?",
    answer:
      "It is a guided estimator for planning your kanoony company setup. You can model license, activity, visa, and add-on choices in one place and see the estimated total update instantly.",
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
      "Yes. The calculator is structured around the main cost drivers in a kanoony setup, including the license package, activity count, visa selections, and optional support services.",
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
  residenceCountry: z
    .string()
    .trim()
    .min(1, "Current country of residence is required."),
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
  email: z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      if (!value) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Email address is required.",
        });
        return;
      }

      if (!isValidLeadEmail(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter a valid email address.",
        });
      }
    }),
  consent: z.boolean().refine((value) => value, {
    message: "This field is required.",
  }),
});

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-3">
      <h2 className=" text-2xl font-semibold leading-tight mb-2">{title}</h2>
      <p className="text-sm leading-7 text-gray-600">{description}</p>
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

function CategoryCard({
  category,
  selectedCount,
  onOpen,
}: {
  category: BusinessActivityCategory;
  selectedCount: number;
  onOpen: () => void;
}) {
  const selected = selectedCount > 0;

  return (
    <div className="relative w-full snap-start overflow-hidden rounded-2xl border border-[#e2e9f2] bg-white p-5 shadow-[0_8px_22px_rgba(71,103,136,0.08)] transition hover:shadow-[0_10px_28px_rgba(71,103,136,0.12)]">
      {category.image ? (
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          <div
            className="absolute -right-10 -top-12 h-32 w-40 rounded-3xl bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${category.image})` }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.86)_42%,rgba(255,255,255,0.96)_100%)]" />
        </div>
      ) : null}

      <div className="relative flex items-start justify-between gap-3">
        <div
          className="grid h-11 w-11 place-items-center rounded-xl text-sm font-semibold text-[#2f4863]"
          style={{ backgroundColor: category.accent }}
        >
          {category.badge}
        </div>

        <div
          className={cn(
            "grid h-7 w-7 place-items-center rounded-lg border text-xs",
            selected
              ? "border-[#111111] bg-[#111111] text-white"
              : "border-[#cfd9e6] bg-white text-transparent",
          )}
          aria-hidden="true"
        >
          ✓
        </div>
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="relative mt-5 w-full text-left"
      >
        <h3 className="text-sm leading-none font-semibold">{category.name}</h3>
        <div className="mt-3 flex items-center justify-between text-sm text-[#4f5f72]">
          <span>
            {selected ? `${selectedCount} selected` : "Select your activity"}
          </span>
          <ArrowRight size={16} className="rotate-[-27deg] text-[#111723]" />
        </div>
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
    <div className="border-b-2 border-black/10">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-base font-semibold text-[#111723] md:text-lg">
          {question}
        </span>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f3f3f3] text-[#111111]">
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
  const initialPhoneSelection = useMemo(
    () =>
      getPhoneSelection(
        initialState.leadForm.phone ?? "",
        DEFAULT_PHONE_COUNTRY,
        DEFAULT_PHONE_DIAL_CODE,
      ),
    [initialState.leadForm.phone],
  );
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
      residenceCountry: watchedLead.residenceCountry ?? "",
      phone: watchedLead.phone ?? "",
      email: watchedLead.email ?? "",
      consent: watchedLead.consent ?? false,
    }),
    [
      watchedLead.consent,
      watchedLead.email,
      watchedLead.fullName,
      watchedLead.phone,
      watchedLead.residenceCountry,
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
  const [shareholderCounterSelected, setShareholderCounterSelected] = useState(
    initialState.shareholderCount > 1,
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
  const [isChangeStatusModalOpen, setIsChangeStatusModalOpen] = useState(false);
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
  const [isConsentExpanded, setIsConsentExpanded] = useState(false);
  const [selectedFreeZoneLocation, setSelectedFreeZoneLocation] = useState<
    "dubai" | "northern-emirates" | null
  >(null);
  const [phoneCountry, setPhoneCountry] = useState(
    initialPhoneSelection.country || DEFAULT_PHONE_COUNTRY,
  );
  const [phoneDialCode, setPhoneDialCode] = useState(
    initialPhoneSelection.dialCode || DEFAULT_PHONE_DIAL_CODE,
  );

  const licenseSectionRef = useRef<HTMLDivElement | null>(null);
  const activitiesSectionRef = useRef<HTMLDivElement | null>(null);
  const visasSectionRef = useRef<HTMLDivElement | null>(null);
  const addOnsSectionRef = useRef<HTMLDivElement | null>(null);
  const quoteSidebarRef = useRef<HTMLDivElement | null>(null);
  const shareResetRef = useRef<number | null>(null);

  const totalVisaApplicants =
    (investorVisaEnabled ? 1 : 0) + employeeVisaCount + dependentVisaCount;
  const applicantsOutsideUae = Math.max(
    0,
    totalVisaApplicants - applicantsInsideUae,
  );
  const changeStatusCardImage = changeStatusImage;

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
  const isMainlandSelected =
    (selectedLicense?.name ?? "").trim().toLowerCase() === "mainland";
  const isFreeZoneSelected =
    (selectedLicense?.name ?? "").trim().toLowerCase() === "free zone";
  const canShowFreeZonePricing =
    !isFreeZoneSelected || selectedFreeZoneLocation !== null;
  const canShowPostLocationSections = canShowFreeZonePricing;
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
    if (!isFreeZoneSelected) {
      setSelectedFreeZoneLocation(null);
    }
  }, [isFreeZoneSelected]);

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

  const scrollToRef = (ref: RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handlePhoneInputKeyDown = (
    event: ReactKeyboardEvent<HTMLInputElement>,
    dialCode: string,
    onChange: (value: string) => void,
  ) => {
    const input = event.currentTarget;
    const prefixLength = getLockedPhonePrefixLength(dialCode);

    if (
      shouldPreventPhonePrefixEdit({
        key: event.key,
        selectionStart: input.selectionStart,
        selectionEnd: input.selectionEnd,
        prefixLength,
        hasModifier: event.ctrlKey || event.metaKey || event.altKey,
      })
    ) {
      event.preventDefault();
      return;
    }

    if (
      shouldClearPhoneInput({
        key: event.key,
        selectionStart: input.selectionStart,
        selectionEnd: input.selectionEnd,
        inputValue: input.value,
        dialCode,
      })
    ) {
      event.preventDefault();
      onChange("");

      window.requestAnimationFrame(() => {
        const phoneInput = document.getElementById(
          "lead-phone",
        ) as HTMLInputElement | null;

        if (!phoneInput) {
          return;
        }

        const lockedPrefixLength = getLockedPhonePrefixLength(dialCode);
        phoneInput.setSelectionRange(lockedPrefixLength, lockedPrefixLength);
      });
    }
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
    if (isMainlandSelected) {
      scrollToRef(quoteSidebarRef);
      return;
    }

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

    void submitQuoteToSheet({
      fullName: leadForm.fullName,
      currentCountryOfResidence:
        RESIDENCE_COUNTRY_OPTIONS.find(
          (item) => item.code === leadForm.residenceCountry,
        )?.label ?? leadForm.residenceCountry,
      phone: leadForm.phone,
      email: leadForm.email,
      licenseName: selectedLicense?.name ?? "",
      durationYears,
      shareholders: shareholderCount,
      activities: selectedActivities.map((a) => a.name),
      investorVisa: investorVisaEnabled,
      employeeVisas: employeeVisaCount,
      dependentVisas: dependentVisaCount,
      applicantsInsideUae,
      addOns: selectedAddOns.map((a) => a.name),
      totalAed: quote.total,
    });

    setShowSuccess(true);
    scrollToRef(quoteSidebarRef);
  };

  const handleShare = async () => {
    const shareText = `kanoony estimate: ${formatAed(quote.total)}`;

    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: "kanoony Cost Calculator",
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
                <div className="space-y-12">
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      void handleContinue();
                    }}
                    className="flex flex-col items-start gap-8 overflow-hidden isolate rounded-[10px] border border-white/45 bg-white/7 p-[40px_24px] backdrop-blur-[22px] backdrop-saturate-[180%] shadow-[inset_6px_4px_20px_0px_#cad4dd3d,inset_-3px_-3px_10px_1px_rgb(255_255_255),11.845px_9.871px_30.993px_0_rgba(39,67,103,0.13)] md:px-7 md:py-10"
                  >
                    <div className="relative mb-2 space-y-2">
                      <h2 className="text-2xl leading-12 font-semibold mb-4">
                        Tell Us a Few Details to Get Started
                      </h2>
                      <p className="text-sm leading-7 font-normal text-black/70">
                        The more we know about your business goals, the more
                        accurate your setup path.
                      </p>
                    </div>

                    <div className="grid gap-4">
                      <Controller
                        control={control}
                        name="fullName"
                        render={({ field }) => (
                          <div>
                            <label
                              htmlFor="lead-full-name"
                              className="mb-3 block text-sm font-semibold text-black"
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
                                "w-full rounded-lg border bg-white px-4 py-3 text-sm text-[#343434] outline-none transition placeholder:text-[#9b9b9b] focus:bg-transparent",
                                errors.fullName
                                  ? "border-[#f15b43] ring-1 ring-[#f15b43]/15"
                                  : "border-[#EDEDED] focus:border-[#111111]",
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
                              className="mb-3 block text-sm font-semibold text-black"
                            >
                              Enter phone number *
                            </label>
                            {(() => {
                              const phoneSelection = getPhoneSelection(
                                field.value ?? "",
                                phoneCountry,
                                phoneDialCode,
                              );
                              const dialCode =
                                phoneSelection.dialCode || phoneDialCode;

                              return (
                                <PhoneInput
                                  country={
                                    phoneSelection.country || phoneCountry
                                  }
                                  value={getPhoneInputValue(
                                    field.value ?? "",
                                    dialCode,
                                  )}
                                  onBlur={field.onBlur}
                                  onChange={(value, country) => {
                                    const countryData =
                                      typeof country === "object" &&
                                      country !== null
                                        ? (country as {
                                            countryCode?: string;
                                            dialCode?: string;
                                          })
                                        : undefined;
                                    const selectedCountry =
                                      typeof countryData?.countryCode ===
                                      "string"
                                        ? countryData.countryCode.toLowerCase()
                                        : phoneCountry;
                                    const selectedDialCode =
                                      typeof countryData?.dialCode === "string"
                                        ? countryData.dialCode
                                        : phoneDialCode;

                                    setPhoneCountry(
                                      selectedCountry || DEFAULT_PHONE_COUNTRY,
                                    );
                                    setPhoneDialCode(
                                      selectedDialCode ||
                                        DEFAULT_PHONE_DIAL_CODE,
                                    );

                                    const normalized = normalizePhoneNumber(
                                      value,
                                      countryData,
                                    );

                                    field.onChange(
                                      normalized ||
                                        (selectedDialCode
                                          ? `+${selectedDialCode}`
                                          : ""),
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
                                    errors.phone
                                      ? "phone-field__input--error"
                                      : "",
                                  )}
                                  dropdownClass="phone-field__dropdown"
                                  searchClass="phone-field__search"
                                  inputProps={{
                                    id: "lead-phone",
                                    name: field.name,
                                    "aria-label": "Enter phone number",
                                    onKeyDown: (
                                      event: ReactKeyboardEvent<HTMLInputElement>,
                                    ) =>
                                      handlePhoneInputKeyDown(
                                        event,
                                        dialCode,
                                        field.onChange,
                                      ),
                                  }}
                                />
                              );
                            })()}
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
                              className="mb-3 block text-sm font-semibold text-black"
                            >
                              Enter email address *
                            </label>
                            <input
                              {...field}
                              id="lead-email"
                              type="email"
                              value={field.value ?? ""}
                              className={cn(
                                "w-full rounded-lg border bg-white px-4 py-3 text-sm text-[#343434] outline-none transition placeholder:text-[#9b9b9b] focus:bg-transparent",
                                errors.email
                                  ? "border-[#f15b43] ring-1 ring-[#f15b43]/15"
                                  : "border-[#EDEDED] focus:border-[#111111]",
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
                        name="residenceCountry"
                        render={({ field }) => (
                          <div>
                            <label
                              htmlFor="lead-residence-country"
                              className="mb-3 block text-sm font-semibold text-black"
                            >
                              Current Country of Residence *
                            </label>
                            <select
                              id="lead-residence-country"
                              value={field.value}
                              onBlur={field.onBlur}
                              onChange={(event) =>
                                field.onChange(event.target.value)
                              }
                              className={cn(
                                "select-field w-full rounded-lg border bg-white px-4 py-3 text-sm text-[#343434] outline-none transition focus:bg-transparent",
                                errors.residenceCountry
                                  ? "border-[#f15b43] focus:border-[#f15b43]"
                                  : "border-[#EDEDED] focus:border-[#111111]",
                              )}
                              aria-label="Current Country of Residence"
                            >
                              <option value="">Select country</option>
                              {RESIDENCE_COUNTRY_OPTIONS.map((item) => (
                                <option key={item.code} value={item.code}>
                                  {item.label}
                                </option>
                              ))}
                            </select>
                            <FieldError
                              message={errors.residenceCountry?.message}
                            />
                          </div>
                        )}
                      />
                      <Controller
                        control={control}
                        name="consent"
                        render={({ field }) => (
                          <div>
                            <label className="flex cursor-pointer items-start gap-3 text-xs font-normal text-gray-600">
                              <input
                                type="checkbox"
                                checked={field.value ?? false}
                                onChange={(event) =>
                                  field.onChange(event.target.checked)
                                }
                                className="mt-0.5 h-4 w-4 rounded border-[#b9c7d7] text-[#111111]"
                                aria-label="Terms and privacy policy"
                              />
                              <span className="consent-text">
                                I confirm that I have read and understood
                                kanoony's{" "}
                                <a
                                  href="https://kanoony.com/terms-and-conditions"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Terms
                                </a>{" "}
                                and{" "}
                                <a
                                  href="https://kanoony.com/privacy-policy"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Privacy Policy
                                </a>{" "}
                                and consent to the processing of my personal
                                data for the purposes of communication and
                                service delivery. I agree to be contacted via
                                email, phone, or WhatsApp. I acknowledge that
                                kanoony operates 24/7 and that contact may occur
                                outside standard business hours, including after
                                6:00 PM UAE time.
                                {isConsentExpanded ? (
                                  <>
                                    <br />
                                    <br />I further acknowledge that kanoony
                                    will never request passwords, one-time
                                    passcodes (OTPs), or payments to personal or
                                    unknown bank accounts and that I should
                                    verify any suspicious or unexpected
                                    communication by calling{" "}
                                    <strong>800 FZ1 (800 391)</strong> before
                                    taking any action.
                                  </>
                                ) : (
                                  "..."
                                )}
                                <button
                                  type="button"
                                  className="ml-1 text-[#0b63ce] underline underline-offset-2"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    setIsConsentExpanded((current) => !current);
                                  }}
                                >
                                  {isConsentExpanded
                                    ? "Read less"
                                    : "Read more"}
                                </button>
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
                      className="instant-quote-btn brand-gradient brand-gradient-hover gap-3 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isUnlocking ? "Unlocking calculator..." : "Calculate"}{" "}
                      <span
                        className="instant-quote-btn__icon"
                        aria-hidden="true"
                      >
                        <ArrowRight size={18} />
                      </span>
                    </button>

                    {calculatorUnlocked ? (
                      <div className="bg-[#ECFDF5] w-full border-l-4 border-green-600 px-4 py-2 rounded-lg">
                        <p className="text-sm text-green-600 font-normal flex items-center gap-2">
                          <span className="bg-green-600 rounded-full">
                            <Check size={18} className="text-white p-[2px]" />
                          </span>{" "}
                          You're all set. Let's explore your business setup
                          options.
                        </p>
                      </div>
                    ) : null}
                  </form>

                  {calculatorUnlocked ? (
                    <>
                      <div
                        ref={licenseSectionRef}
                        className="relative scroll-mt-24"
                      >
                        <SectionHeading
                          title="Select Jurisdiction"
                          description="Where do you want to open the business?"
                        />

                        <div className="mt-6 grid gap-5 xl:grid-cols-2">
                          {licenseOptions.map((license) => {
                            const selected = selectedLicenseId === license.id;

                            return (
                              <div
                                key={license.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => {
                                  setShowSuccess(false);
                                  setSelectedLicenseId(license.id);
                                }}
                                onKeyDown={(
                                  event: ReactKeyboardEvent<HTMLDivElement>,
                                ) => {
                                  if (
                                    event.key === "Enter" ||
                                    event.key === " "
                                  ) {
                                    event.preventDefault();
                                    setShowSuccess(false);
                                    setSelectedLicenseId(license.id);
                                  }
                                }}
                                className={cn(
                                  "cursor-pointer overflow-hidden isolate rounded-xl p-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9d9d9] focus-visible:ring-offset-2 border border-white/50 bg-white/10 backdrop-blur-[22px] backdrop-saturate-[180%] shadow-[inset_6px_4px_20px_0px_#cad4dd3d,inset_-3px_-3px_10px_1px_rgb(255_255_255),11.845px_9.871px_30.993px_0_rgba(39,67,103,0.13)]",
                                  selected
                                    ? "border-[#111111] ring-2 ring-[#d9d9d9]"
                                    : "border-[#e6ebf2]",
                                )}
                              >
                                <div className="w-full overflow-hidden rounded-2xl aspect-[286/386]">
                                  <img
                                    src={license.image}
                                    alt={license.name}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div className="pt-5 flex flex-col gap-4">
                                  <div className="flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-gray-900 leading-12">
                                      {license.name}
                                    </h3>
                                    <span className="p-2 text-xs font-medium">
                                      {license.timeline}
                                    </span>
                                  </div>

                                  <p className="text-sm font-normal leading-12 text-gray-600">
                                    {license.description}
                                  </p>

                                  <div className="mt-2 flex items-center justify-between">
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        setLicenseModalId(license.id);
                                      }}
                                      className="text-xs font-medium text-[#7F98A8] flex items-center gap-1 p-1"
                                      aria-label={`Learn more about ${license.name}`}
                                    >
                                      Learn More <ArrowRight size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setShowSuccess(false);
                                        setSelectedLicenseId(license.id);
                                      }}
                                      className={cn(
                                        "px-6 py-3 rounded-full inline-flex items-center gap-2",
                                        selected
                                          ? "bg-[#111723] text-white brand-gradient brand-gradient-hover"
                                          : "bg-white/10 border border-gray-200 backdrop-blur-[22px] backdrop-saturate-[180%] text-black shadow-[inset_3px_3px_10px_#ccdbe870,inset_-3px_-3px_10px_1px_rgb(255_255_255),11.845px_9.871px_30.993px_0_rgba(39,67,103,0.13)]",
                                      )}
                                    >
                                      {selected ? (
                                        <>
                                          <CheckCheck
                                            size={16}
                                            aria-hidden="true"
                                          />{" "}
                                          Selected
                                        </>
                                      ) : (
                                        "Select"
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {isMainlandSelected ? (
                          <div className="mt-6 rounded-xl border border-[#f0d6c2] bg-[#fff7f0] px-5 py-4 text-sm font-medium leading-7 text-[#6b3c18]">
                            {MAINLAND_CONSULTATION_MESSAGE}
                          </div>
                        ) : (
                          <>
                            {isFreeZoneSelected ? (
                              <div className="mt-6 overflow-hidden isolate rounded-xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-[40px] backdrop-saturate-[80%] shadow-[inset_3px_3px_50px_#ccdbe845,inset_-3px_-3px_20px_0px_rgb(255_255_255/18%),11.845px_9.871px_30.993px_0_rgba(39,67,103,0.13)]">
                                <h3 className="text-base font-semibold text-gray-900 leading-12">
                                  Select Location
                                </h3>
                                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedFreeZoneLocation("dubai")
                                    }
                                    className={cn(
                                      "px-6 py-3 rounded-full inline-flex items-center justify-center gap-2",
                                      selectedFreeZoneLocation === "dubai"
                                        ? "rounded-full inline-flex items-center gap-2 bg-[#111723] text-white brand-gradient brand-gradient-hover"
                                        : "bg-white/10 border border-gray-200 backdrop-blur-[22px] backdrop-saturate-[180%] text-black shadow-[inset_3px_3px_10px_#ccdbe870,inset_-3px_-3px_10px_1px_rgb(255_255_255),11.845px_9.871px_30.993px_0_rgba(39,67,103,0.13)]",
                                    )}
                                  >
                                    Dubai
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedFreeZoneLocation(
                                        "northern-emirates",
                                      )
                                    }
                                    className={cn(
                                      "px-6 py-3 rounded-full inline-flex items-center justify-center gap-2",
                                      selectedFreeZoneLocation ===
                                        "northern-emirates"
                                        ? "rounded-full inline-flex items-center gap-2 bg-[#111723] text-white brand-gradient brand-gradient-hover"
                                        : "bg-white/10 border border-gray-200 backdrop-blur-[22px] backdrop-saturate-[180%] text-black shadow-[inset_3px_3px_10px_#ccdbe870,inset_-3px_-3px_10px_1px_rgb(255_255_255),11.845px_9.871px_30.993px_0_rgba(39,67,103,0.13)]",
                                    )}
                                  >
                                    Northern Emirates
                                  </button>
                                </div>
                              </div>
                            ) : null}
                            {canShowPostLocationSections ? (
                              <div className="mt-6 grid gap-5 xl:grid-cols-2">
                              <div className="overflow-hidden isolate rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-[40px] backdrop-saturate-[80%] shadow-[inset_3px_3px_50px_#ccdbe845,inset_-3px_-3px_20px_0px_rgb(255_255_255/18%),11.845px_9.871px_30.993px_0_rgba(39,67,103,0.13)]">
                                <h3 className="text-base font-semibold text-gray-900 leading-12">
                                  Duration of Business License
                                </h3>
                                <div className="mt-5 flex flex-wrap gap-3">
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
                                          "rounded-full border px-5 py-3 text-left transition shadow-[inset_3px_3px_50px_#ccdbe845,inset_-3px_-3px_20px_0px_rgb(255_255_255/18%),11.845px_9.871px_30.993px_0_rgba(39,67,103,0.13)]",
                                          selected
                                            ? "  brand-gradient brand-gradient-hover text-white"
                                            : " bg-[#fbfcfe] text-[#111723] ",
                                        )}
                                      >
                                        <span className="block text-sm font-semibold transition">
                                          {selected
                                            ? year === 1
                                              ? "1 Year"
                                              : `${year} Years`
                                            : year}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>

                                <p className="mt-7 text-xs leading-4 text-gray-400">
                                  * Discounts available on multi-year licenses
                                </p>
                              </div>

                              <div className="overflow-hidden isolate rounded-xl px-5 py-4 border border-white/50 bg-white/10 backdrop-blur-[22px] backdrop-saturate-[180%] shadow-[inset_6px_4px_20px_0px_#cad4dd3d,inset_-3px_-3px_10px_1px_rgb(255_255_255),11.845px_9.871px_30.993px_0_rgba(39,67,103,0.13)]">
                                <h3 className="text-base font-semibold text-gray-900 leading-12">
                                  Number of Shareholders
                                </h3>

                                <div
                                  className={cn(
                                    "mt-5 flex items-center gap-3",
                                    shareholderCounterSelected
                                      ? "justify-between"
                                      : "justify-end",
                                  )}
                                >
                                  {shareholderCounterSelected ? (
                                    <div className="flex items-center gap-3 rounded-full border border-[#e5ebf3] bg-[#fbfcfe] px-2 py-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setShowSuccess(false);
                                          setShareholderCount(
                                            Math.max(1, shareholderCount - 1),
                                          );
                                        }}
                                        className="grid h-8 w-8 place-items-center rounded-full text-[#425d7b] transition hover:bg-white"
                                        aria-label="Decrease Shareholders"
                                      >
                                        <Minus size={16} />
                                      </button>
                                      <span className="min-w-[2ch] text-center text-base font-semibold text-gray-900 leading-12">
                                        {shareholderCount}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setShowSuccess(false);
                                          setShareholderCount(
                                            Math.min(15, shareholderCount + 1),
                                          );
                                        }}
                                        className="brand-gradient brand-gradient-hover grid h-8 w-8 place-items-center rounded-full"
                                        aria-label="Increase Shareholders"
                                      >
                                        <Plus size={16} />
                                      </button>
                                    </div>
                                  ) : null}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowSuccess(false);
                                      setShareholderCounterSelected(
                                        (current) => {
                                          const next = !current;
                                          if (!next) {
                                            setShareholderCount(1);
                                          }
                                          return next;
                                        },
                                      );
                                    }}
                                    aria-label="Select Shareholders"
                                    className={cn(
                                      "px-6 py-3 rounded-full inline-flex items-center gap-2",
                                      shareholderCounterSelected
                                        ? "rounded-full inline-flex items-center gap-2 bg-[#111723] text-white brand-gradient brand-gradient-hover"
                                        : "  text-black border border-white/50 bg-white/10 backdrop-blur-[22px] backdrop-saturate-[180%] shadow-[inset_6px_4px_20px_0px_#cad4dd3d,inset_-3px_-3px_10px_1px_rgb(255_255_255),11.845px_9.871px_30.993px_0_rgba(39,67,103,0.13)]",
                                    )}
                                  >
                                    {shareholderCounterSelected ? (
                                      <>
                                        <CheckCheck
                                          size={16}
                                          aria-hidden="true"
                                        />
                                        Selected
                                      </>
                                    ) : (
                                      "Select"
                                    )}
                                  </button>
                                </div>

                                <p className="mt-7 text-xs leading-4 text-gray-400">
                                  * Includes{" "}
                                  {pricingConfig.includedShareholders}{" "}
                                  shareholders;{" "}
                                  {formatAed(pricingConfig.extraShareholderFee)}{" "}
                                  for each additional.
                                </p>
                              </div>
                              </div>
                            ) : null}
                          </>
                        )}
                      </div>
                      {!isMainlandSelected && canShowPostLocationSections ? (
                        <div
                          ref={activitiesSectionRef}
                          className="relative scroll-mt-24 overflow-hidden isolate rounded-xl p-6 border border-white/50 bg-white/10 backdrop-blur-[22px] backdrop-saturate-[180%] shadow-[inset_6px_4px_20px_0px_#cad4dd3d,inset_-3px_-3px_10px_1px_rgb(255_255_255),11.845px_9.871px_30.993px_0_rgba(39,67,103,0.13)]"
                        >
                          <SectionHeading
                            title="Select Your Business Activities"
                            description={`Choose business activities from 2,500+ options.`}
                          />
                          <div className="mt-8 flex items-center gap-3 rounded-xl bg-[#eaf4ff] px-4 py-3 text-[#2d68a6]">
                            <span className="mt-0.5 rounded-lg bg-[#2a4bcf] p-1 text-white">
                              <CircleAlert size={12} />
                            </span>
                            <p className="text-xs font-normal leading-4">
                              You get 3 business activity groups included with
                              your license at no cost. Any additional activities
                              will incur a charge of AED 1,000 each.
                            </p>
                          </div>
                          <div className="mt-6 shadow-[0_8px_22px_rgba(71,103,136,0.08)]">
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
                                className="w-full rounded-lg border border-[#E0E0E0] bg-white py-3 pl-12 pr-4 text-sm outline-none transition focus:border-[#111111] focus:bg-white"
                                placeholder="Search business activity group"
                                aria-label="Search activity categories"
                              />
                            </div>
                          </div>

                          <div className="mt-6 rounded-2xl border border-[#dbe6f3] bg-[#eaf3fb] p-2">
                            <div className="grid grid-flow-col grid-rows-2 auto-cols-[12rem] gap-2 overflow-x-auto pb-2 pr-2">
                              {filteredCategories.map((category) => {
                                const categorySelections =
                                  selectedActivities.filter(
                                    (activity) =>
                                      activity.categoryId === category.id,
                                  );

                                return (
                                  <CategoryCard
                                    key={category.id}
                                    category={category}
                                    selectedCount={categorySelections.length}
                                    onOpen={() => {
                                      setActivityModalQuery("");
                                      setActivityCategoryModalId(category.id);
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : null}
                      {!isMainlandSelected && canShowPostLocationSections ? (
                        <div
                          ref={visasSectionRef}
                          className="relative scroll-mt-24"
                        >
                          <SectionHeading
                            title="Select Visa Types"
                            description="Choose visa types for yourself, your team, and your dependents."
                          />

                          <div className="mt-6 grid gap-5 xl:grid-cols-2">
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
                                  className="overflow-hidden isolate rounded-xl  p-4  transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9d9d9] focus-visible:ring-offset-2 border border-white/50 bg-white/10 backdrop-blur-[22px] backdrop-saturate-[180%] shadow-[inset_6px_4px_20px_0px_#cad4dd3d,inset_-3px_-3px_10px_1px_rgb(255_255_255),11.845px_9.871px_30.993px_0_rgba(39,67,103,0.13)]"
                                >
                                  <div className="w-full overflow-hidden rounded-2xl">
                                    <img
                                      src={visa.image}
                                      alt={visa.name}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>

                                  <div className="mt-5 mb-2 flex items-start justify-between gap-4">
                                    <h3 className="text-base font-semibold text-gray-900 leading-12">
                                      {visa.name}
                                    </h3>

                                    <button
                                      type="button"
                                      onClick={() => setVisaModalId(visa.id)}
                                      className="text-xs font-medium flex items-center gap-1 p-1"
                                      aria-label={`Learn more about ${visa.name}`}
                                    >
                                      Learn More{" "}
                                      <ArrowRight
                                        size={16}
                                        className="rotate-[-27deg]"
                                      />
                                    </button>
                                  </div>
                                  <p className="text-xs font-normal leading-12 text-gray-600">
                                    {visa.description}
                                  </p>
                                  <div className="mt-6 flex items-center justify-end gap-4">
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
                                          "inline-flex items-center justify-between gap-2 px-4 py-2 rounded-full bg-white/10 border border-gray-200 backdrop-blur-[22px] backdrop-saturate-[180%] text-black shadow-[inset_3px_3px_10px_#ccdbe870,inset_-3px_-3px_10px_1px_rgb(255_255_255),11.845px_9.871px_30.993px_0_rgba(39,67,103,0.13)]",
                                          investorVisaEnabled
                                            ? "bg-white"
                                            : "hover:bg-white",
                                        )}
                                        aria-label="Toggle Investor Visa"
                                      >
                                        <span className="">
                                          {investorVisaEnabled ? "Yes" : "No"}
                                        </span>
                                        <span
                                          className={cn(
                                            "relative grid h-7 w-[3.2rem] place-items-center rounded-full transition ",
                                            investorVisaEnabled
                                              ? "brand-gradient brand-gradient-hover"
                                              : "bg-white",
                                          )}
                                        >
                                          <span
                                            className={cn(
                                              "h-5 w-5 rounded-full bg-white shadow-[inset_3px_3px_10px_#ccdbe870,inset_-3px_-3px_10px_1px_rgb(255_255_255),11.845px_9.871px_30.993px_0_rgba(39,67,103,0.13)] transition-transform",
                                              investorVisaEnabled
                                                ? "translate-x-[0.7rem]"
                                                : "-translate-x-[0.7rem]",
                                            )}
                                          />
                                        </span>
                                      </button>
                                    ) : (
                                      <div
                                        className={cn(
                                          "flex w-full items-center gap-3",
                                          count > 0
                                            ? "justify-between"
                                            : "justify-end",
                                        )}
                                      >
                                        {count > 0 ? (
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
                                              className="grid h-8 w-8 place-items-center rounded-full text-[#425d7b] transition hover:bg-white"
                                              aria-label={`Decrease ${visa.name}`}
                                            >
                                              <Minus size={16} />
                                            </button>
                                            <span className="min-w-[2ch] text-center text-base font-semibold text-gray-900 leading-12">
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
                                              className="brand-gradient brand-gradient-hover grid h-8 w-8 place-items-center rounded-full"
                                              aria-label={`Increase ${visa.name}`}
                                            >
                                              <Plus size={16} />
                                            </button>
                                          </div>
                                        ) : null}

                                        <button
                                          type="button"
                                          onClick={() => {
                                            setShowSuccess(false);
                                            if (visa.id === "employee-visa") {
                                              updateEmployeeCount(
                                                count > 0 ? 0 : 1,
                                              );
                                            } else {
                                              updateDependentCount(
                                                count > 0 ? 0 : 1,
                                              );
                                            }
                                          }}
                                          className={cn(
                                            "px-6 py-3 rounded-full inline-flex items-center gap-2",
                                            count > 0
                                              ? "rounded-full inline-flex items-center gap-2 bg-[#111723] text-white brand-gradient brand-gradient-hover"
                                              : "  text-black border border-white/50 bg-white/10 backdrop-blur-[22px] backdrop-saturate-[180%] shadow-[inset_6px_4px_20px_0px_#cad4dd3d,inset_-3px_-3px_10px_1px_rgb(255_255_255),11.845px_9.871px_30.993px_0_rgba(39,67,103,0.13)]",
                                          )}
                                          aria-label={
                                            count > 0
                                              ? `Select ${visa.name}`
                                              : `Select ${visa.name}`
                                          }
                                        >
                                          {count > 0 ? (
                                            <>
                                              <CheckCheck
                                                size={16}
                                                aria-hidden="true"
                                              />
                                              Selected
                                            </>
                                          ) : (
                                            "Select"
                                          )}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {totalVisaApplicants > 0 ? (
                            <div className="mt-6 overflow-hidden isolate rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-[40px] backdrop-saturate-[80%] shadow-[inset_3px_3px_50px_#ccdbe845,inset_-3px_-3px_20px_0px_rgb(255_255_255/18%),11.845px_9.871px_30.993px_0_rgba(39,67,103,0.13)]">
                              <div className="w-full overflow-hidden rounded-2xl aspect-[286/128]">
                                <img
                                  src={changeStatusCardImage}
                                  alt="Change of Status"
                                  className="h-full w-full object-cover"
                                />
                              </div>

                              <div className="mt-5 mb-2 flex items-start justify-between gap-4">
                                <h3 className="text-base font-semibold text-gray-900 leading-12">
                                  Change of Status
                                </h3>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setIsChangeStatusModalOpen(true)
                                  }
                                  className="text-xs font-medium flex items-center gap-1 p-1"
                                  aria-label="Learn more about Change of Status"
                                >
                                  Learn More{" "}
                                  <ArrowRight
                                    size={16}
                                    className="rotate-[-27deg]"
                                  />
                                </button>
                              </div>

                              <p className="text-xs font-normal leading-12 text-gray-600">
                                Required for applicants currently in the UAE, so
                                their visa can be processed locally without
                                needing to exit and re-enter.
                              </p>

                              <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <p className="text-[#9aaabc] text-sm font-medium leading-6">
                                  Applicants Outside the UAE:{" "}
                                  {applicantsOutsideUae}
                                </p>

                                <div className="flex w-full items-center justify-between gap-3 md:w-auto">
                                  <p className="text-sm font-semibold text-[#111723] leading-6 whitespace-nowrap">
                                    Applicants Inside the UAE:
                                  </p>
                                  <div className="flex items-center gap-3 rounded-full border border-[#e5ebf3] bg-[#fbfcfe] px-2 py-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateApplicantsInside(
                                          Math.max(0, applicantsInsideUae - 1),
                                        )
                                      }
                                      className="grid h-8 w-8 place-items-center rounded-full text-[#425d7b] transition hover:bg-white"
                                      aria-label="Decrease Applicants Inside the UAE"
                                    >
                                      <Minus size={16} />
                                    </button>
                                    <span className="min-w-[2ch] text-center text-base font-semibold text-gray-900 leading-12">
                                      {applicantsInsideUae}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateApplicantsInside(
                                          Math.min(
                                            totalVisaApplicants,
                                            applicantsInsideUae + 1,
                                          ),
                                        )
                                      }
                                      className="brand-gradient brand-gradient-hover grid h-8 w-8 place-items-center rounded-full"
                                      aria-label="Increase Applicants Inside the UAE"
                                    >
                                      <Plus size={16} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                      {!isMainlandSelected && canShowPostLocationSections ? (
                        <div
                          ref={addOnsSectionRef}
                          className="relative scroll-mt-24"
                        >
                          <SectionHeading
                            title="Add-ons"
                            description="Customise your setup with additional services to help you start and scale with confidence."
                          />

                          <div className="mt-6 space-y-5 p-6 rounded-xl border border-white/50 bg-white/60 backdrop-blur-[22px] backdrop-saturate-[180%] shadow-[inset_6px_4px_20px_0px_#cad4dd3d,inset_-3px_-3px_10px_1px_rgb(255_255_255),11.845px_9.871px_30.993px_0_rgba(39,67,103,0.13)]">
                            {addOnGroups.map((group) => {
                              const groupItems = addOnOptions.filter(
                                (item) => item.groupId === group.id,
                              );

                              return (
                                <div
                                  key={group.id}
                                  className="overflow-hidden isolate rounded-xl border-t border-white/20 "
                                >
                                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
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
                                      className="text-xs font-medium flex items-center gap-1 p-1"
                                      aria-label={`Learn more about ${group.name}`}
                                    >
                                      Learn More{" "}
                                      <ArrowRight
                                        size={16}
                                        className="rotate-[-27deg]"
                                      />
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
                                            "rounded-full border px-4 py-3 text-left text-xs transition",
                                            selected
                                              ? "border-[#111111] bg-[#f3f3f3] text-[#111111]"
                                              : "border-[#d7deea] bg-[#fbfcfe] text-[#28394c] hover:border-[#bfd0e3]",
                                          )}
                                        >
                                          <span className="font-semibold">
                                            {item.name}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </div>

                <QuoteSidebar
                  ref={quoteSidebarRef}
                  quote={quote}
                  selectedLicense={selectedLicense}
                  showCompanySetupSection={canShowFreeZonePricing}
                  showPricing={canShowFreeZonePricing}
                  mainlandMessage={
                    isMainlandSelected ? MAINLAND_CONSULTATION_MESSAGE : null
                  }
                  durationYears={durationYears}
                  shareholderCount={shareholderCount}
                  includedShareholders={pricingConfig.includedShareholders}
                  extraShareholderFee={pricingConfig.extraShareholderFee}
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

        <section className="hidden overflow-hidden p-0 text-center">
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
                <span className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#111111] px-6 py-3 text-[0.98rem] font-semibold text-white transition group-hover:bg-[#111111]">
                  Learn More
                  <ArrowRight size={18} />
                </span>
              </a>
            ))}
          </div>
          <div className="mx-auto max-w-[1280px] px-4 pb-10 pt-8 md:px-6 md:pb-16 md:pt-16">
            <p className="mx-auto max-w-4xl leading-6 text-base">
              Use this calculator to get a realistic estimate for setting up a
              company in kanoony, based on how business models are actually
              evaluated and approved.
            </p>
          </div>
        </section>

        <div className="hidden mx-auto max-w-[1280px] space-y-10 px-4 py-10 md:px-6 md:py-16">
          <section className="relative grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <div className="rounded-[2rem] bg-white px-6 py-7 shadow-[0_22px_58px_rgba(60,91,125,0.09)] md:px-8">
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

            <div className="rounded-[2rem] border border-[#d8e3ef] bg-[linear-gradient(135deg,#1f1f1f_0%,#000000_70%)] px-6 py-7 text-white shadow-[0_28px_65px_rgba(0,0,0,0.22)] md:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Ready to estimate
              </p>
              <p className="mt-4 text-lg leading-8 text-white/90">
                Already know your business activity and visa requirements? Get
                your estimate now. Instant results, no waiting.
              </p>
              <CalculateNowLink className="mt-8 border-white/25 bg-white text-[#111111] hover:border-white hover:bg-[#f3f3f3]" />
            </div>
          </section>

          <section
            className="relative rounded-[2.2rem] bg-white px-6 py-8  md:px-8"
            id="why-trade"
          >
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-center">
              <div>
                <h2 className=" text-4xl font-semibold leading-14">
                  See Exactly What Goes Into Your Dubai Trade License Cost
                </h2>
                <p className="mt-3 max-w-[38rem] text-sm leading-7 text-slate-500 md:text-base">
                  Build your setup step by step. Adjust your inputs and watch
                  your estimate update instantly.
                </p>
                <CalculateNowLink className="mt-6" />
              </div>

              <div className="rounded-[1.9rem] border border-[#d8e3ef] bg-[linear-gradient(160deg,#f6f9fd_0%,#e7f0fb_100%)] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#111111]">
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

          <section className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
            <div className="rounded-[2rem] bg-white px-6 py-7 shadow-[0_22px_58px_rgba(60,91,125,0.09)] md:px-8">
              <h2 className=" text-[1.85rem] font-semibold leading-tight text-[#111723] md:text-[2.35rem]">
                Why Your Trade License Cost Depends on Your Setup
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-500 md:text-base">
                No two setups are the same and neither are the costs. Your total
                depends on how you configure your company.
              </p>

              <div className="mt-5 rounded-[1.6rem] bg-[#f8fbfe] px-5 py-5">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#111111]">
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

            <div className="rounded-[2rem] bg-[linear-gradient(180deg,#ffffff_0%,#f3f7fb_100%)] px-6 py-7 shadow-[0_22px_58px_rgba(60,91,125,0.09)] md:px-8">
              <h2 className=" text-[1.65rem] font-semibold leading-tight text-[#111723] md:text-[2rem]">
                How Accurate Is This Cost Estimate?
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-500 md:text-base">
                The estimate you receive reflects current kanoony pricing,
                standard visa structures, and typical approval scenarios, so you
                can plan with confidence.
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-500 md:text-base">
                Final pricing is confirmed after business activity approval,
                immigration clearance, and document verification, and may adjust
                depending on changes made during your application. This cost
                calculator helps you understand whether your budget aligns
                before you speak to an advisor.
              </p>
              <CalculateNowLink className="mt-6" />
            </div>
          </section>

          <section className="relative rounded-[2.2rem] px-6 py-8  md:px-8">
            <div className="max-w-[48rem]">
              <h2 className=" text-4xl font-semibold leading-14">
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
                  <div className="text-[2rem] font-semibold leading-none text-[#111111]">
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
                Not ready to commit? No problem. Many founders use this estimate
                purely to compare options before making a decision.
              </p>
              <CalculateNowLink />
            </div>
          </section>

          <section
            className="relative rounded-[2.2rem] bg-white px-6 py-8 md:px-8"
            id="cc-faq"
          >
            <div className="max-w-2xl">
              <h2 className=" text-4xl font-semibold leading-14">
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
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d9e2ed] bg-white/92 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4">
          <div>
            {isMainlandSelected ? (
              <p className="text-xs font-semibold leading-5 text-[#6b3c18]">
                {MAINLAND_CONSULTATION_MESSAGE}
              </p>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b8ea8]">
                  Grand Total
                </p>
                <p className="text-lg font-semibold text-[#111111]">
                  {canShowFreeZonePricing
                    ? formatAed(quote.total)
                    : "Select Location"}
                </p>
              </>
            )}
          </div>
          {!isMainlandSelected ? (
            <button
              type="button"
              onClick={() => scrollToRef(quoteSidebarRef)}
              className="brand-gradient brand-gradient-hover inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
            >
              View Estimate
            </button>
          ) : null}
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

      {isChangeStatusModalOpen ? (
        <ModalShell
          isOpen
          title="Change of Status"
          imageSrc={changeStatusCardImage}
          onClose={() => setIsChangeStatusModalOpen(false)}
          footer={
            <ModalAction
              label="Close"
              onClick={() => setIsChangeStatusModalOpen(false)}
            />
          }
        >
          {CHANGE_STATUS_MODAL_COPY.map((paragraph) => (
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
                  className="w-full rounded-[1.2rem] border border-[#d7deea] bg-[#f8fafc] py-3 pl-12 pr-4 text-sm outline-none transition focus:border-[#111111] focus:bg-white"
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
                        ? "border-[#111111] bg-[#f3f3f3]"
                        : "border-[#e5ebf3] bg-[#fbfcfe]",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleActivity(activity.id)}
                      className="mt-1 h-4 w-4 rounded border-[#b9c7d7] text-[#111111]"
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
                          <span className="rounded-full bg-[#f1f1f1] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3b3b3b]">
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
