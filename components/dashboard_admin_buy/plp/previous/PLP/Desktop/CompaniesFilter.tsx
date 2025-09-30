import React, {
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useState,
  useEffect,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, Star, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Skeleton from "react-loading-skeleton";
import ChevronUp from "@/components/ui/icons_custom/ChevronUp";
import ChevronDown from "@/components/ui/icons_custom/ChevronDown";
import companies from "@/constants/companies";
import { Company } from "@/constants/interfaces";
import CompanySelectionDialog from "@/components/ui/CompanySelectionDialog";

interface CompaniesFilterProps {
  isPending: boolean;
  company?: string;
  setCompany: Dispatch<SetStateAction<string | undefined>>;
  selectedCompanies?: string[];
  setSelectedCompanies?: Dispatch<SetStateAction<string[]>>;
}

const CompaniesFilter: FunctionComponent<CompaniesFilterProps> = ({
  setCompany,
  isPending,
  company,
  selectedCompanies: propSelectedCompanies,
  setSelectedCompanies: propSetSelectedCompanies,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Find selected company name
  const selectedCompany = companies.find((item) => item.id === company);

  // Use passed selectedCompanies or local state
  const [localSelectedCompanies, setLocalSelectedCompanies] = useState<string[]>(company ? [company] : []);
  const selectedCompanies = propSelectedCompanies || localSelectedCompanies;
  const setSelectedCompanies = propSetSelectedCompanies || setLocalSelectedCompanies;

  // Track if company change is from URL initialization
  const [isInitializingFromUrl, setIsInitializingFromUrl] = useState(false);
  const hasInitializedFromUrl = React.useRef(false);

  // Initialize company from URL on component mount (only once)
  useEffect(() => {
    if (hasInitializedFromUrl.current) return;

    const companyNameFromUrl = searchParams.get('companyname');
    if (companyNameFromUrl) {
      // Find company by English name
      const companyFromUrl = companies.find(c => c.englishName === companyNameFromUrl);
      if (companyFromUrl) {
        hasInitializedFromUrl.current = true;
        setIsInitializingFromUrl(true);
        setCompany(companyFromUrl.id);
        // Add to panel for both mobile and desktop when loading from URL
        setSelectedCompanies([companyFromUrl.id]);
        // Reset the flag after a short delay to ensure URL update doesn't trigger
        setTimeout(() => setIsInitializingFromUrl(false), 100);
      }
    } else {
      hasInitializedFromUrl.current = true; // Mark as initialized even if no company in URL
    }
  }, [searchParams, setCompany, setSelectedCompanies]); // Remove isMobile dependency since behavior is same for both

  // Function to update URL with company query string
  const updateCompanyInUrl = React.useCallback((companyId: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());

    if (companyId && companyId !== "0") {
      // Find the company to get its English name
      const selectedCompany = companies.find(c => c.id === companyId);
      if (selectedCompany) {
        params.set('companyname', selectedCompany.englishName);
      }
    } else {
      // Remove companyname parameter if no company selected or "All Companies" selected
      params.delete('companyname');
    }

    // Update the URL without causing a page reload
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  // Update URL when company changes from user interaction (not from URL initialization)
  useEffect(() => {
    if (company && !isInitializingFromUrl) {
      updateCompanyInUrl(company);
    }
  }, [company, isInitializingFromUrl, updateCompanyInUrl]);

  const handleSelectCompany = (companyId: string) => {
    if (companyId === "0") {
      // Select all companies - clear selection
      setCompany("0"); // Set company to "0" for "همه ی شرکت ها"
      setSelectedCompanies(["0"]); // Set selectedCompanies to include "0"
      // URL will be updated by useEffect watching company changes
    } else {
      if (isMobile) {
        // Mobile mode: single selection only
        setSelectedCompanies([companyId]);
        setCompany(companyId);
        // URL will be updated by useEffect watching company changes
      } else {
        // Desktop mode: multiple selection
        const newSelected = selectedCompanies.includes(companyId)
          ? selectedCompanies.filter(id => id !== companyId)
          : [...selectedCompanies, companyId];

        setSelectedCompanies(newSelected);

        // If only one company selected, set it as the main filter
        if (newSelected.length === 1) {
          setCompany(newSelected[0]);
          // URL will be updated by useEffect watching company changes
        } else if (newSelected.length === 0) {
          setCompany("0"); // Default to "همه ی شرکت ها" when no companies selected
          // URL will be updated by useEffect watching company changes
        } else {
          // Multiple companies selected, clear main filter
          setCompany(undefined);
          // URL will be updated by useEffect watching company changes
        }
      }
    }
  };

  const handleClearAll = () => {
    if (isMobile) {
      // In mobile mode, clear all means select "همه ی شرکت ها"
      setCompany("0");
      setSelectedCompanies(["0"]);
      // URL will be updated by useEffect watching company changes
    } else {
      // In desktop mode, clear all means no selection
      setCompany(undefined);
      setSelectedCompanies([]);
      // URL will be updated by useEffect watching company changes
    }
  };

  return (
    <>
      <div className="bg-white border border-secondary rounded-md flex flex-col px-4 py-2.5 gap-y-2.5 shadow-1 font-IranYekanRegular">
        {isPending ? (
          <div className="flex items-center justify-between">
            <Skeleton width={20} height={20} style={{ borderRadius: "5px" }} />
            <Skeleton width={155} height={20} style={{ borderRadius: "5px" }} />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            {isExpanded ? (
              <ChevronUp
                className="text-dark cursor-pointer"
                onClick={() => setIsExpanded((prevState) => !prevState)}
              />
            ) : (
              <ChevronDown
                className="text-dark cursor-pointer"
                onClick={() => setIsExpanded((prevState) => !prevState)}
              />
            )}
            <div className="direction-rtl text-black text-sm"> شرکت</div>
          </div>
        )}

        {isExpanded && (
          <>
            {isPending ? (
              <Skeleton
                width={209}
                height={20}
                style={{ borderRadius: "5px" }}
                containerClassName="flex justify-center w-full items-center"
              />
            ) : (
              <div className="space-y-4">
                {/* Company Search Dialog Button */}
                <div>
                  <div className="text-xs text-muted-foreground font-IranYekanBold direction-rtl mb-2">
                    جستجوی شرکت
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(true)}
                    className="w-full justify-between direction-rtl h-10 font-IranYekanRegular"
                  >
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      {selectedCompany ? selectedCompany.name : "همه ی شرکت ها"}
                    </div>
                    <div className="flex items-center gap-1">
                      {selectedCompany && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </Button>
                </div>

                {/* Selected Companies Display - Hidden in mobile mode */}
                {!isMobile && selectedCompanies.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground font-IranYekanBold direction-rtl">
                      شرکت‌های انتخاب شده ({selectedCompanies.length})
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {selectedCompanies.map((companyId) => {
                        const company = companies.find(c => c.id === companyId);
                        return company ? (
                          <div
                            key={companyId}
                            className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-md text-sm"
                          >
                            {/* Delete button on the left */}
                            <button
                              onClick={() => handleSelectCompany(companyId)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>

                            {/* Company Logo and Name on the right */}
                            <div className="flex items-center gap-2 flex-1 justify-end">
                              {/* Company Name */}
                              <span className="font-IranYekanRegular text-right">{company.name}</span>

                              {/* Company Logo */}
                              {company.logoUrl ? (
                                <div className="w-6 h-6 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                                  <img
                                    src={company.logoUrl}
                                    alt={company.name}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const parent = target.parentElement;
                                      if (parent) {
                                        parent.innerHTML = `<div class="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">${company.name.charAt(0)}</div>`;
                                      }
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                  {company.name.charAt(0)}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Clear All Button - Hidden in mobile mode */}
                {!isMobile && selectedCompanies.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="w-full text-center text-xs text-muted-foreground hover:text-destructive transition-colors font-IranYekanRegular direction-rtl py-1"
                  >
                    پاک کردن همه انتخاب‌ها
                  </button>
                )}

                {/* Company Selection Dialog */}
                <CompanySelectionDialog
                  open={dialogOpen}
                  onOpenChange={setDialogOpen}
                  selectedCompanies={selectedCompanies}
                  onSelectCompany={handleSelectCompany}
                  isMobile={isMobile}
                />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default CompaniesFilter;