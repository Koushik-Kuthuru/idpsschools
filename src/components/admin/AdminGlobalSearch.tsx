"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ClipboardList,
  GraduationCap,
  LayoutGrid,
  Loader2,
  Search,
  Settings,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAdminSearch } from "@/hooks/useAdminSearch";
import {
  getSearchPlaceholder,
  SEARCH_SCOPE_OPTIONS,
  type AdminSearchGroup,
  type AdminSearchResult,
  type SearchScopeFilter,
  type SearchResultCategory,
} from "@/lib/adminSearch";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function categoryIcon(category: SearchResultCategory) {
  if (category === "students" || category === "academic") return GraduationCap;
  if (category === "staff") return Users;
  if (category === "admission") return ClipboardList;
  if (category === "finance") return Wallet;
  if (category === "inventory") return BookOpen;
  if (category === "settings") return Settings;
  return LayoutGrid;
}

type AdminGlobalSearchProps = {
  schoolId: string;
  onOpenChange?: (open: boolean) => void;
};

export default function AdminGlobalSearch({ schoolId, onOpenChange }: AdminGlobalSearchProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const resultsPanelRef = useRef<HTMLDivElement>(null);
  const scopePanelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const skipFocusPanelRef = useRef(false);
  const [resultsAnchor, setResultsAnchor] = useState<{ top: number; left: number; width: number } | null>(
    null
  );
  const [scopeAnchor, setScopeAnchor] = useState<{ top: number; left: number; width: number } | null>(
    null
  );
  const { loading, search } = useAdminSearch(schoolId);

  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<SearchScopeFilter>("all");
  const [scopeOpen, setScopeOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const groups = useMemo(
    () => (query.trim() ? search(query, { scope }) : []),
    [query, scope, search]
  );

  const flatResults = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  const selectedScope =
    SEARCH_SCOPE_OPTIONS.find((option) => option.value === scope) ?? SEARCH_SCOPE_OPTIONS[0];

  const searchActive = focused || scopeOpen || resultsOpen;
  const showBackdrop = resultsOpen && !scopeOpen;

  const closeSearch = () => {
    setResultsOpen(false);
    setScopeOpen(false);
    setFocused(false);
    setActiveIndex(0);
    inputRef.current?.blur();
  };

  const setPanelOpen = (next: boolean) => {
    setResultsOpen(next);
    if (!next) setActiveIndex(0);
  };

  const shouldOpenPanel = (hasQuery: boolean) => hasQuery || scope === "all";

  const navigateTo = (result: AdminSearchResult) => {
    closeSearch();
    setQuery("");
    router.push(result.href);
  };

  const runSearch = () => {
    if (!query.trim()) {
      inputRef.current?.focus();
      return;
    }
    setPanelOpen(true);
  };

  useEffect(() => {
    onOpenChange?.(showBackdrop);
  }, [showBackdrop, onOpenChange]);

  useEffect(() => {
    if (!showBackdrop) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showBackdrop]);

  const isInsideSearchUi = (target: Node) =>
    Boolean(
      containerRef.current?.contains(target) ||
        resultsPanelRef.current?.contains(target) ||
        scopePanelRef.current?.contains(target)
    );

  useLayoutEffect(() => {
    if (!resultsOpen) {
      setResultsAnchor(null);
      return;
    }
    const update = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setResultsAnchor({ top: rect.bottom + 8, left: rect.left, width: rect.width });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [resultsOpen]);

  useLayoutEffect(() => {
    if (!scopeOpen) {
      setScopeAnchor(null);
      return;
    }
    const update = () => {
      const el = categoryRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setScopeAnchor({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 176) });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [scopeOpen]);

  useEffect(() => {
    if (!searchActive) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!isInsideSearchUi(event.target as Node)) closeSearch();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSearch();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [searchActive]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, scope, groups.length]);

  useEffect(() => {
    if (query.trim()) return;
    setPanelOpen(scope === "all" && focused);
  }, [scope, query, focused]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (flatResults.length > 0) {
        const target = flatResults[activeIndex] ?? flatResults[0];
        if (target) navigateTo(target);
      } else {
        runSearch();
      }
      return;
    }

    if (!flatResults.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setPanelOpen(true);
      setActiveIndex((prev) => (prev + 1) % flatResults.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setPanelOpen(true);
      setActiveIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length);
    }
  };

  let runningIndex = -1;

  return (
    <>
      {showBackdrop && typeof document !== "undefined"
        ? createPortal(
            <button
              type="button"
              aria-label="Close search"
              className="fixed inset-0 top-16 z-40 bg-black/35 transition-opacity animate-in fade-in duration-150"
              onClick={closeSearch}
            />,
            document.body
          )
        : null}

      <div
        ref={containerRef}
        className={cn("relative w-full max-w-2xl", searchActive && "z-50")}
      >
        <div
          className={cn(
            "flex h-9 items-stretch overflow-hidden rounded-lg border transition-all",
            searchActive
              ? "border-[#144835]/30 ring-2 ring-[#144835]/10 bg-white"
              : "border-gray-200 bg-white hover:border-gray-300"
          )}
        >
        <div ref={categoryRef} className="relative shrink-0 border-r border-gray-200">
          <button
            type="button"
            aria-label="Search category"
            aria-expanded={scopeOpen}
            onClick={() => {
              setScopeOpen((open) => !open);
              setPanelOpen(false);
            }}
            className="flex h-full min-w-[5rem] max-w-[6.5rem] items-center justify-between gap-1 bg-gray-50 px-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <span className="truncate">{selectedScope.label}</span>
            <ChevronDown
              size={12}
              className={cn("shrink-0 text-gray-500 transition-transform", scopeOpen && "rotate-180")}
            />
          </button>

          {scopeOpen && scopeAnchor && typeof document !== "undefined"
            ? createPortal(
                <div
                  ref={scopePanelRef}
                  style={{
                    position: "fixed",
                    top: scopeAnchor.top,
                    left: scopeAnchor.left,
                    width: scopeAnchor.width,
                    zIndex: 50,
                  }}
                  className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg animate-in fade-in zoom-in-95 duration-150"
                >
                  {SEARCH_SCOPE_OPTIONS.map((option) => {
                    const selected = option.value === scope;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          skipFocusPanelRef.current = true;
                          setScope(option.value);
                          setScopeOpen(false);
                          setPanelOpen(false);
                          inputRef.current?.focus();
                        }}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-semibold transition-colors",
                          selected
                            ? "bg-[#144835]/5 text-[#144835]"
                            : "text-gray-700 hover:bg-gray-50 hover:text-[#144835]"
                        )}
                      >
                        <span>{option.label}</span>
                        {selected ? <Check size={14} className="shrink-0" /> : null}
                      </button>
                    );
                  })}
                </div>,
                document.body
              )
            : null}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            const value = e.target.value;
            setQuery(value);
            setPanelOpen(shouldOpenPanel(Boolean(value.trim())));
          }}
          onFocus={() => {
            setFocused(true);
            if (skipFocusPanelRef.current) {
              skipFocusPanelRef.current = false;
              return;
            }
            setPanelOpen(shouldOpenPanel(Boolean(query.trim())));
          }}
          onKeyDown={handleKeyDown}
          placeholder={getSearchPlaceholder(scope)}
          aria-label="Search portal"
          aria-expanded={resultsOpen}
          aria-autocomplete="list"
          role="combobox"
          className="min-w-0 flex-1 border-0 bg-transparent px-3 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />

        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setActiveIndex(0);
              setPanelOpen(scope === "all");
              inputRef.current?.focus();
            }}
            className="shrink-0 px-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={14} />
          </button>
        ) : null}

        <button
          type="button"
          aria-label="Search"
          onClick={runSearch}
          className="shrink-0 inline-flex w-10 items-center justify-center bg-[#a2c144] text-[#144835] hover:bg-[#95b33d] transition-colors"
        >
          <Search size={16} strokeWidth={2.25} />
        </button>
      </div>

      {resultsOpen && resultsAnchor && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={resultsPanelRef}
              style={{
                position: "fixed",
                top: resultsAnchor.top,
                left: resultsAnchor.left,
                width: resultsAnchor.width,
                zIndex: 50,
              }}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-150"
            >
          {query.trim() ? (
            <>
              <div className="border-b border-gray-100 bg-gray-50/60 px-4 py-2.5 flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  {selectedScope.label} results
                </p>
                {loading ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400">
                    <Loader2 size={12} className="animate-spin" />
                    Indexing...
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-gray-400">
                    {flatResults.length} match{flatResults.length === 1 ? "" : "es"}
                  </span>
                )}
              </div>

              <div className="max-h-[min(24rem,70vh)] overflow-y-auto py-1">
                {groups.length > 0 ? (
              groups.map((group: AdminSearchGroup) => {
                const Icon = categoryIcon(group.category);
                return (
                  <div key={group.category} className="py-1">
                    {scope === "all" ? (
                      <div className="px-4 py-1.5 flex items-center gap-2">
                        <Icon size={12} className="text-[#144835]" />
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          {group.label}
                        </p>
                      </div>
                    ) : null}
                    <ul>
                      {group.items.map((result) => {
                        runningIndex += 1;
                        const itemIndex = runningIndex;
                        const active = itemIndex === activeIndex;

                        return (
                          <li key={result.id}>
                            <button
                              type="button"
                              onMouseEnter={() => setActiveIndex(itemIndex)}
                              onClick={() => navigateTo(result)}
                              className={cn(
                                "w-full px-4 py-2.5 text-left flex items-start gap-3 transition-colors",
                                active ? "bg-[#144835]/5" : "hover:bg-gray-50"
                              )}
                            >
                              <div className="min-w-0 flex-1">
                                <p
                                  className={cn(
                                    "text-xs truncate",
                                    active ? "font-bold text-[#144835]" : "font-semibold text-gray-900"
                                  )}
                                >
                                  {result.title}
                                </p>
                                {result.subtitle ? (
                                  <p className="text-[11px] text-gray-500 truncate mt-0.5">{result.subtitle}</p>
                                ) : null}
                              </div>
                              <ArrowRight
                                size={14}
                                className={cn(
                                  "shrink-0 mt-0.5 transition-opacity",
                                  active ? "text-[#144835] opacity-100" : "text-gray-300 opacity-0"
                                )}
                              />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })
                ) : (
                  <div className="px-4 py-8 text-center">
                    <p className="text-xs font-bold text-gray-900">No results found</p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Try another keyword or switch the scope to All.
                    </p>
                  </div>
                )}
              </div>

              {groups.length > 0 ? (
                <div className="border-t border-gray-100 px-4 py-2 bg-gray-50/50">
                  <p className="text-[10px] font-medium text-gray-400">
                    Use ↑ ↓ to navigate, Enter to open, Esc to close
                  </p>
                </div>
              ) : null}
            </>
          ) : (
            <div className="px-4 py-6">
              <p className="text-xs font-bold text-gray-900">Search the admin portal</p>
              <p className="text-[11px] text-gray-500 mt-1">
                Find students, teachers, pages, fees, and more. Choose a scope on the left or search
                everything.
              </p>
              <div className="mt-4 space-y-2">
                {SEARCH_SCOPE_OPTIONS.slice(1, 5).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      skipFocusPanelRef.current = true;
                      setScope(option.value);
                      setPanelOpen(false);
                      inputRef.current?.focus();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#144835] transition-colors"
                  >
                    <Search size={12} className="shrink-0 text-gray-400" />
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
            </div>,
            document.body
          )
        : null}
      </div>
    </>
  );
}
