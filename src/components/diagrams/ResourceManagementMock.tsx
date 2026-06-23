"use client";

import React, { useState, useMemo } from "react";
import * as LucideIcons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Asset {
  id: string;
  name: string;
  category: "Camera & Lens" | "Lighting" | "Audio" | "Grip & Support";
  location: string;
  defaultLocation: string;
  rate: string;
  status: "Available" | "Booked" | "In Maintenance" | "Retired";
  serial: string;
}

interface Kit {
  id: string;
  name: string;
  description: string;
  assetIds: string[];
  rate: string;
}

interface Booking {
  id: string;
  resourceId: string;
  resourceName: string;
  projectName: string;
  workOrder: string;
  operator: string;
  startDayIdx: number;
  endDayIdx: number;
  color: "violet" | "pink" | "orange" | "emerald";
}

interface CalendarResource {
  id: string;
  name: string;
  category: string;
}

const INITIAL_ASSETS: Asset[] = [
  {
    id: "asset-1",
    name: "ARRI Alexa 35 Camera Body",
    category: "Camera & Lens",
    location: "L.A. Studio A",
    defaultLocation: "L.A. Studio A",
    rate: "$1,800/day",
    status: "Available",
    serial: "AX-35-9082",
  },
  {
    id: "asset-2",
    name: "Cooke S7/i 50mm Prime Lens",
    category: "Camera & Lens",
    location: "L.A. Studio A",
    defaultLocation: "L.A. Studio A",
    rate: "$450/day",
    status: "Available",
    serial: "CK-S7-1049",
  },
  {
    id: "asset-3",
    name: "O'Connor 2560 Tripod System",
    category: "Grip & Support",
    location: "L.A. Studio A",
    defaultLocation: "L.A. Studio A",
    rate: "$200/day",
    status: "Available",
    serial: "OC-25-3920",
  },
  {
    id: "asset-4",
    name: "SmallHD Cine 7 Monitor",
    category: "Camera & Lens",
    location: "L.A. Studio A",
    defaultLocation: "L.A. Studio A",
    rate: "$200/day",
    status: "Available",
    serial: "SH-C7-8821",
  },
  {
    id: "asset-5",
    name: "RED V-Raptor 8K Camera",
    category: "Camera & Lens",
    location: "N.Y. Vault",
    defaultLocation: "N.Y. Vault",
    rate: "$1,500/day",
    status: "Booked",
    serial: "RD-VR-2019",
  },
  {
    id: "asset-6",
    name: "Sony FX6 Cinema Camera",
    category: "Camera & Lens",
    location: "On Location",
    defaultLocation: "L.A. Studio A",
    rate: "$650/day",
    status: "Available",
    serial: "SN-FX6-5542",
  },
  {
    id: "asset-7",
    name: "Aputure 600d Pro LED",
    category: "Lighting",
    location: "L.A. Studio A",
    defaultLocation: "L.A. Studio A",
    rate: "$250/day",
    status: "Available",
    serial: "AP-600-4491",
  },
  {
    id: "asset-8",
    name: "Astera Titan Tubes (8-Tube Kit)",
    category: "Lighting",
    location: "Transit",
    defaultLocation: "N.Y. Vault",
    rate: "$350/day",
    status: "In Maintenance",
    serial: "AS-TT-0831",
  },
  {
    id: "asset-9",
    name: "Sennheiser MKH416 Boom Mic",
    category: "Audio",
    location: "N.Y. Vault",
    defaultLocation: "N.Y. Vault",
    rate: "$150/day",
    status: "Available",
    serial: "SH-416-2219",
  },
  {
    id: "asset-10",
    name: "Sound Devices 833 Recorder",
    category: "Audio",
    location: "On Location",
    defaultLocation: "N.Y. Vault",
    rate: "$300/day",
    status: "Booked",
    serial: "SD-833-4012",
  },
  {
    id: "asset-11",
    name: "Freefly Movi Pro Stabilizer",
    category: "Grip & Support",
    location: "L.A. Studio A",
    defaultLocation: "L.A. Studio A",
    rate: "$400/day",
    status: "Available",
    serial: "FF-MP-7731",
  },
  {
    id: "asset-12",
    name: "EasyRig Vario 5 Vest",
    category: "Grip & Support",
    location: "On Location",
    defaultLocation: "L.A. Studio A",
    rate: "$200/day",
    status: "Available",
    serial: "ER-V5-1102",
  },
];

const MOCK_KITS: Kit[] = [
  {
    id: "kit-1",
    name: "A-Camera Interview Kit",
    description: "Complete commercial A-camera setup including premium lenses, field monitoring, and steady support.",
    assetIds: ["asset-1", "asset-2", "asset-3", "asset-4"],
    rate: "$2,650/day",
  },
  {
    id: "kit-2",
    name: "Compact Audio Bag Kit",
    description: "Field recording and boom audio capture package, optimized for single-system workflows.",
    assetIds: ["asset-9", "asset-10"],
    rate: "$450/day",
  },
  {
    id: "kit-3",
    name: "3-Point Studio Lighting Pack",
    description: "High-output LED fixtures with active diffusion and control interfaces.",
    assetIds: ["asset-7", "asset-8"],
    rate: "$600/day",
  },
];

const WEEK_DAYS = [
  { label: "Mon", date: "Jun 15" },
  { label: "Tue", date: "Jun 16" },
  { label: "Wed", date: "Jun 17" },
  { label: "Thu", date: "Jun 18" },
  { label: "Fri", date: "Jun 19" },
  { label: "Sat", date: "Jun 20" },
  { label: "Sun", date: "Jun 21" },
];

const CALENDAR_RESOURCES: CalendarResource[] = [
  { id: "asset-1", name: "ARRI Alexa 35", category: "Camera" },
  { id: "asset-5", name: "RED V-Raptor 8K", category: "Camera" },
  { id: "asset-7", name: "Aputure 600d Pro", category: "Lighting" },
  { id: "asset-10", name: "Sound Devices 833", category: "Audio" },
  { id: "crew-1", name: "Marcus Chen", category: "Director of Photography" },
  { id: "crew-2", name: "Sarah Jenkins", category: "Lead Editor" },
  { id: "crew-3", name: "Amelia Lewis", category: "Executive Producer" },
];

const INITIAL_BOOKINGS: Booking[] = [
  {
    id: "booking-1",
    resourceId: "asset-1",
    resourceName: "ARRI Alexa 35",
    projectName: "Commercial Video Campaign",
    workOrder: "A-Camera Package",
    operator: "Marcus Chen",
    startDayIdx: 1,
    endDayIdx: 3,
    color: "violet",
  },
  {
    id: "booking-2",
    resourceId: "asset-5",
    resourceName: "RED V-Raptor 8K",
    projectName: "Apparel Brand Spotlight",
    workOrder: "B-Camera Package",
    operator: "Sarah Jenkins",
    startDayIdx: 0,
    endDayIdx: 1,
    color: "pink",
  },
  {
    id: "booking-3",
    resourceId: "asset-7",
    resourceName: "Aputure 600d Pro",
    projectName: "Commercial Video Campaign",
    workOrder: "Key Light Setup",
    operator: "Marcus Chen",
    startDayIdx: 2,
    endDayIdx: 4,
    color: "orange",
  },
  {
    id: "booking-4",
    resourceId: "asset-10",
    resourceName: "Sound Devices 833",
    projectName: "Apparel Brand Spotlight",
    workOrder: "Audio Field Kit",
    operator: "Sarah Jenkins",
    startDayIdx: 3,
    endDayIdx: 5,
    color: "emerald",
  },
  {
    id: "booking-5",
    resourceId: "crew-1",
    resourceName: "Marcus Chen",
    projectName: "Commercial Video Campaign",
    workOrder: "Director of Photography",
    operator: "Marcus Chen",
    startDayIdx: 1,
    endDayIdx: 3,
    color: "violet",
  },
  {
    id: "booking-6",
    resourceId: "crew-2",
    resourceName: "Sarah Jenkins",
    projectName: "Apparel Brand Spotlight",
    workOrder: "Lead Editor",
    operator: "Sarah Jenkins",
    startDayIdx: 0,
    endDayIdx: 1,
    color: "pink",
  },
];

export default function ResourceManagementMock() {
  const [activeTab, setActiveTab] = useState<"inventory" | "kits" | "calendar">("inventory");
  
  // Dynamic State
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  
  // Custom Filter State
  const [categoryFilter, setCategoryFilter] = useState<"all" | Asset["category"]>("all");
  const [locationFilter, setLocationFilter] = useState<"all" | Asset["location"]>("all");
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);

  // Kits view state
  const [expandedKits, setExpandedKits] = useState<Set<string>>(new Set());

  // Booking Modal States
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [newBookingData, setNewBookingData] = useState<{
    resourceId: string;
    resourceName: string;
    startDayIdx: number;
    endDayIdx: number;
    projectName: string;
    workOrder: string;
    operator: string;
    color: "violet" | "pink" | "orange" | "emerald";
  }>({
    resourceId: "",
    resourceName: "",
    startDayIdx: 0,
    endDayIdx: 0,
    projectName: "Commercial Video Campaign",
    workOrder: "General Booking",
    operator: "Marcus Chen",
    color: "violet",
  });

  // Filters calculation
  const filteredInventory = useMemo(() => {
    return assets.filter((asset) => {
      const matchesCategory = categoryFilter === "all" || asset.category === categoryFilter;
      const matchesLocation = locationFilter === "all" || asset.location === locationFilter;
      return matchesCategory && matchesLocation;
    });
  }, [assets, categoryFilter, locationFilter]);

  // Tab List
  const tabs = [
    { id: "inventory", label: "Inventory Pool", icon: LucideIcons.Archive },
    { id: "kits", label: "Pre-packaged Kits", icon: LucideIcons.Briefcase },
    { id: "calendar", label: "Schedule Timeline", icon: LucideIcons.Calendar },
  ] as const;

  // Custom checkbox handlers
  const toggleSelectAsset = (assetId: string) => {
    setSelectedAssets((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) {
        next.delete(assetId);
      } else {
        next.add(assetId);
      }
      return next;
    });
  };

  const toggleSelectAll = (filteredIds: string[]) => {
    setSelectedAssets((prev) => {
      const next = new Set(prev);
      const allSelected = filteredIds.every((id) => next.has(id));
      if (allSelected) {
        filteredIds.forEach((id) => next.delete(id));
      } else {
        filteredIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // Kits Status Calculation & Deployment
  const getKitStatus = (kit: Kit) => {
    const kitAssets = assets.filter((a) => kit.assetIds.includes(a.id));
    const allAvailable = kitAssets.every((a) => a.status === "Available");
    const anyMaintenance = kitAssets.some((a) => a.status === "In Maintenance");
    if (allAvailable) return "Available";
    if (anyMaintenance) return "Maintenance Required";
    return "Booked / Deployed";
  };

  const toggleKitDeployment = (kit: Kit) => {
    const currentStatus = getKitStatus(kit);
    setAssets((prevAssets) =>
      prevAssets.map((asset) => {
        if (kit.assetIds.includes(asset.id)) {
          if (currentStatus === "Available") {
            return { ...asset, status: "Booked", location: "On Location" };
          } else if (currentStatus === "Booked / Deployed") {
            return { ...asset, status: "Available", location: asset.defaultLocation };
          }
        }
        return asset;
      })
    );
  };

  const toggleKitExpanded = (kitId: string) => {
    setExpandedKits((prev) => {
      const next = new Set(prev);
      if (next.has(kitId)) {
        next.delete(kitId);
      } else {
        next.add(kitId);
      }
      return next;
    });
  };

  // Calendar Interactions
  const handleCellClick = (resource: CalendarResource, dayIdx: number) => {
    setSelectedBooking(null);
    setNewBookingData({
      resourceId: resource.id,
      resourceName: resource.name,
      startDayIdx: dayIdx,
      endDayIdx: dayIdx,
      projectName: "New Promo Campaign",
      workOrder: "Field Operations",
      operator: "Marcus Chen",
      color: "violet",
    });
    setIsNewBookingOpen(true);
  };

  const createBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const booking: Booking = {
      id: `booking-${Date.now()}`,
      resourceId: newBookingData.resourceId,
      resourceName: newBookingData.resourceName,
      projectName: newBookingData.projectName,
      workOrder: newBookingData.workOrder,
      operator: newBookingData.operator,
      startDayIdx: Number(newBookingData.startDayIdx),
      endDayIdx: Number(newBookingData.endDayIdx),
      color: newBookingData.color,
    };

    setBookings((prev) => [...prev, booking]);
    
    // Auto-update inventory status if resource matches asset ID
    if (booking.resourceId.startsWith("asset-")) {
      setAssets((prev) =>
        prev.map((a) =>
          a.id === booking.resourceId
            ? { ...a, status: "Booked", location: "On Location" }
            : a
        )
      );
    }

    setIsNewBookingOpen(false);
  };

  const deleteBooking = (bookingId: string) => {
    const bookingToDelete = bookings.find((b) => b.id === bookingId);
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    
    // Restore asset availability
    if (bookingToDelete && bookingToDelete.resourceId.startsWith("asset-")) {
      setAssets((prev) =>
        prev.map((a) =>
          a.id === bookingToDelete.resourceId
            ? { ...a, status: "Available", location: a.defaultLocation }
            : a
        )
      );
    }
    
    setSelectedBooking(null);
  };

  // Pantone Style Color Mapping
  const getBookingColorClasses = (color: string) => {
    switch (color) {
      case "violet":
        return "bg-violet-500/10 border-violet-500/20 border-l-4 border-l-violet-500 text-violet-300";
      case "pink":
        return "bg-pink-500/10 border-pink-500/20 border-l-4 border-l-pink-500 text-pink-300";
      case "orange":
        return "bg-orange-500/10 border-orange-500/20 border-l-4 border-l-orange-500 text-orange-300";
      case "emerald":
        return "bg-emerald-500/10 border-emerald-500/20 border-l-4 border-l-emerald-500 text-emerald-300";
      default:
        return "bg-blue-500/10 border-blue-500/20 border-l-4 border-l-blue-500 text-blue-300";
    }
  };

  return (
    <div className="my-8 w-full border border-white/5 rounded-2xl bg-[#0e0e0e] shadow-2xl relative font-sans text-[#fafaf9] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5 pointer-events-none rounded-2xl" />

      {/* Main Inner Container */}
      <div className="p-6 md:p-8 space-y-6 relative z-10">
        
        {/* Header Summary section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-white">Resource Pool</h1>
            {filteredInventory.length > 0 && (
              <span className="text-xs font-mono bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded text-gray-400">
                {filteredInventory.length} Assets Active
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-xs rounded-lg border border-white/5 bg-white/5 text-gray-300 hover:text-white transition-colors flex items-center gap-1.5 font-medium">
              <LucideIcons.Plus size={14} />
              <span>Add Resource</span>
            </button>
            <button className="px-3 py-1.5 text-xs rounded-lg border border-white/5 text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5 font-medium">
              <LucideIcons.Download size={14} />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Tab Selection & Filtering Controls Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="bg-[#141414] border border-[#27272a] rounded-full p-1 inline-flex gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-1.5 text-[13px] rounded-full font-medium transition-all duration-200 outline-none ${
                    isActive
                      ? "bg-[#27272a]/80 text-white shadow-sm font-semibold"
                      : "text-[#a1a1aa] hover:text-white hover:bg-[#27272a]/30"
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Filters (Visible in Inventory tab) */}
          {activeTab === "inventory" && (
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {/* Category Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsCategoryMenuOpen(!isCategoryMenuOpen);
                    setIsLocationMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-[#141414] hover:bg-[#1c1c1c] text-gray-300 hover:text-white border border-[#27272a] rounded-lg transition-colors outline-none"
                >
                  <span>Category: <strong className="text-white font-semibold">{categoryFilter === "all" ? "All" : categoryFilter}</strong></span>
                  <LucideIcons.ChevronDown size={12} className={`text-gray-500 transition-transform ${isCategoryMenuOpen ? "rotate-180" : ""}`} />
                </button>
                
                <AnimatePresence>
                  {isCategoryMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setIsCategoryMenuOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-0 mt-1.5 w-48 bg-[#141414] border border-[#27272a] rounded-xl shadow-xl z-40 p-1"
                      >
                        {["all", "Camera & Lens", "Lighting", "Audio", "Grip & Support"].map((category) => (
                          <button
                            key={category}
                            onClick={() => {
                              setCategoryFilter(category as any);
                              setIsCategoryMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between transition-colors ${
                              categoryFilter === category
                                ? "bg-white/10 text-white font-medium"
                                : "text-gray-400 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <span>{category === "all" ? "All Categories" : category}</span>
                            {categoryFilter === category && <LucideIcons.Check size={12} className="text-white" />}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Location Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsLocationMenuOpen(!isLocationMenuOpen);
                    setIsCategoryMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-[#141414] hover:bg-[#1c1c1c] text-gray-300 hover:text-white border border-[#27272a] rounded-lg transition-colors outline-none"
                >
                  <span>Location: <strong className="text-white font-semibold">{locationFilter === "all" ? "All" : locationFilter}</strong></span>
                  <LucideIcons.ChevronDown size={12} className={`text-gray-500 transition-transform ${isLocationMenuOpen ? "rotate-180" : ""}`} />
                </button>
                
                <AnimatePresence>
                  {isLocationMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setIsLocationMenuOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-0 mt-1.5 w-48 bg-[#141414] border border-[#27272a] rounded-xl shadow-xl z-40 p-1"
                      >
                        {["all", "L.A. Studio A", "N.Y. Vault", "On Location", "Transit"].map((location) => (
                          <button
                            key={location}
                            onClick={() => {
                              setLocationFilter(location as any);
                              setIsLocationMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between transition-colors ${
                              locationFilter === location
                                ? "bg-white/10 text-white font-medium"
                                : "text-gray-400 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <span>{location === "all" ? "All Locations" : location}</span>
                            {locationFilter === location && <LucideIcons.Check size={12} className="text-white" />}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {(categoryFilter !== "all" || locationFilter !== "all") && (
                <button
                  onClick={() => {
                    setCategoryFilter("all");
                    setLocationFilter("all");
                  }}
                  className="text-xs text-red-400 hover:text-red-300 px-2 py-1 flex items-center gap-1 transition-colors font-medium"
                >
                  <LucideIcons.X size={12} />
                  <span>Clear</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tab Content Display Area */}
        <div className={`min-h-[360px] ${(selectedBooking || isNewBookingOpen) ? "grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start" : "block"}`}>
          <div className="w-full min-w-0">
            <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="w-full space-y-4"
            >
              
              {/* --- INVENTORY TAB --- */}
              {activeTab === "inventory" && (
                <div className="space-y-4">
                  {filteredInventory.length === 0 ? (
                    /* Minimal Empty State following Rule 4 & 5 */
                    <div className="py-16 text-center border border-dashed border-white/[0.06] rounded-xl">
                      <LucideIcons.Archive className="w-8 h-8 opacity-10 mx-auto text-white/50 mb-3" />
                      <h3 className="text-sm font-semibold text-white tracking-tight">No assets match your filters</h3>
                      <p className="text-[11px] text-white/25 mt-1 max-w-xs mx-auto">
                        Try resetting your category or location parameters to view available hardware.
                      </p>
                      <button
                        onClick={() => {
                          setCategoryFilter("all");
                          setLocationFilter("all");
                        }}
                        className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-full bg-white/[0.06] text-white/70 hover:bg-white/[0.10] border border-white/[0.06] transition-colors"
                      >
                        <LucideIcons.X size={12} />
                        <span>Clear Filters</span>
                      </button>
                    </div>
                  ) : (
                    /* Custom grid table */
                    <div className="border border-white/5 rounded-2xl overflow-hidden bg-[#121212]/30">
                      {/* Grid Header */}
                      <div className="grid grid-cols-[40px_2.5fr_1.5fr_1.5fr_1fr_1.2fr] gap-2 items-center px-4 py-3 bg-white/[0.02] text-[10px] text-gray-500 uppercase font-bold tracking-wider border-b border-white/5">
                        <button
                          onClick={() => toggleSelectAll(filteredInventory.map((a) => a.id))}
                          className="w-4 h-4 rounded border flex items-center justify-center transition-colors outline-none bg-transparent border-white/20 hover:border-white/40 animate-none"
                        >
                          {filteredInventory.every((a) => selectedAssets.has(a.id)) && (
                            <LucideIcons.Check size={10} strokeWidth={3} className="text-white" />
                          )}
                        </button>
                        <span>Resource Name</span>
                        <span>Category</span>
                        <span>Location</span>
                        <span>Day Rate</span>
                        <span>Status</span>
                      </div>
                      
                      {/* Grid Rows */}
                      <div className="divide-y divide-white/5">
                        {filteredInventory.map((asset) => {
                          const isSelected = selectedAssets.has(asset.id);
                          return (
                            <div
                              key={asset.id}
                              className={`grid grid-cols-[40px_2.5fr_1.5fr_1.5fr_1fr_1.2fr] gap-2 items-center px-4 py-3 transition-colors text-sm ${
                                isSelected ? "bg-white/[0.03]" : "bg-transparent hover:bg-white/[0.01]"
                              }`}
                            >
                              {/* Custom checkbox */}
                              <button
                                onClick={() => toggleSelectAsset(asset.id)}
                                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors outline-none ${
                                  isSelected
                                    ? "bg-blue-500 border-blue-500 text-white"
                                    : "bg-transparent border-white/20 hover:border-white/40"
                                }`}
                              >
                                {isSelected && <LucideIcons.Check size={10} strokeWidth={3} />}
                              </button>

                              {/* Asset Info */}
                              <div className="flex flex-col truncate">
                                <span className="font-semibold text-white truncate">{asset.name}</span>
                                <span className="text-[10px] font-mono text-gray-500 truncate mt-0.5">{asset.serial}</span>
                              </div>

                              {/* Category */}
                              <span className="text-gray-400 font-medium text-xs truncate">{asset.category}</span>

                              {/* Location */}
                              <span className="text-gray-300 font-medium text-xs truncate flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0" />
                                {asset.location}
                              </span>

                              {/* Rate */}
                              <span className="font-mono text-gray-300 font-medium text-xs">{asset.rate}</span>

                              {/* Status Badge */}
                              <div>
                                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                                  asset.status === "Available"
                                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                                    : asset.status === "Booked"
                                    ? "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                                    : asset.status === "In Maintenance"
                                    ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                                    : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                                }`}>
                                  {asset.status}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* --- KITS TAB --- */}
              {activeTab === "kits" && (
                <div className="space-y-4">
                  {MOCK_KITS.map((kit) => {
                    const isExpanded = expandedKits.has(kit.id);
                    const status = getKitStatus(kit);
                    const kitAssets = assets.filter((a) => kit.assetIds.includes(a.id));

                    return (
                      <div
                        key={kit.id}
                        className="bg-[#121212] border border-white/5 rounded-2xl overflow-hidden transition-all"
                      >
                        {/* Accordion Trigger */}
                        <div
                          onClick={() => toggleKitExpanded(kit.id)}
                          className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-center text-gray-400 shrink-0">
                              <LucideIcons.Briefcase size={20} />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-white tracking-tight !m-0">
                                {kit.name}
                              </h3>
                              <p className="text-xs text-gray-500 font-light mt-0.5 line-clamp-1 max-w-md">
                                {kit.description}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 border-t md:border-t-0 border-white/5 pt-2.5 md:pt-0">
                            <div className="text-left md:text-right">
                              <span className="text-[10px] text-gray-500 block uppercase tracking-wider font-semibold">Kit Rate</span>
                              <span className="text-sm font-mono font-medium text-white">{kit.rate}</span>
                            </div>
                            
                            <div className="text-left md:text-right min-w-[120px]">
                              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                                status === "Available"
                                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                                  : status === "Maintenance Required"
                                  ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                                  : "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                              }`}>
                                {status}
                              </span>
                            </div>

                            <LucideIcons.ChevronDown
                              size={16}
                              className={`text-gray-500 transition-transform hidden md:block ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </div>

                        {/* Collapsible constituents details */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: "auto" }}
                              exit={{ height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden border-t border-white/5 bg-[#0a0a0a]/40"
                            >
                              <div className="p-4 space-y-3">
                                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Kit Assembly Checklist</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleKitDeployment(kit);
                                    }}
                                    disabled={status === "Maintenance Required"}
                                    className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors border ${
                                      status === "Available"
                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                                        : status === "Booked / Deployed"
                                        ? "bg-zinc-800 border-white/5 text-gray-300 hover:bg-zinc-700"
                                        : "bg-zinc-900 border-white/5 text-zinc-600 cursor-not-allowed"
                                    }`}
                                  >
                                    {status === "Booked / Deployed" ? "Disassemble Kit (Return)" : "Assemble & Deploy Kit"}
                                  </button>
                                </div>
                                
                                <div className="space-y-2">
                                  {kitAssets.map((asset) => (
                                    <div
                                      key={asset.id}
                                      className="flex items-center justify-between text-xs px-3 py-2 bg-[#121212]/50 border border-white/5 rounded-xl"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className={`w-1.5 h-1.5 rounded-full ${asset.status === 'Available' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                                        <div>
                                          <span className="font-semibold text-white">{asset.name}</span>
                                          <span className="text-[10px] text-gray-500 ml-2 font-mono">{asset.serial}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4 text-gray-400">
                                        <span className="text-[11px]">{asset.location}</span>
                                        <span className="w-px h-3 bg-white/10" />
                                        <span className="font-mono text-[11px]">{asset.rate}</span>
                                        <span className="w-px h-3 bg-white/10" />
                                        <span className={`text-[10px] font-bold ${
                                          asset.status === "Available"
                                            ? "text-emerald-400"
                                            : asset.status === "In Maintenance"
                                            ? "text-amber-400"
                                            : "text-blue-400"
                                        }`}>
                                          {asset.status}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* --- TIMELINE CALENDAR TAB --- */}
              {activeTab === "calendar" && (
                <div className="space-y-4">
                  {/* Timeline controller header */}
                  <div className="flex items-center justify-between bg-[#121212] border border-white/5 px-4 py-3 rounded-xl">
                    <div className="flex items-center gap-2">
                      <button className="h-7 w-7 rounded-md border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                        <LucideIcons.ChevronLeft size={14} />
                      </button>
                      <span className="text-xs font-semibold text-white">June 15 – June 21, 2026</span>
                      <button className="h-7 w-7 rounded-md border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                        <LucideIcons.ChevronRight size={14} />
                      </button>
                    </div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Week View (Mon - Sun)</span>
                  </div>

                  {/* Scrollable calendar grid container */}
                  <div className="border border-white/5 bg-[#121212]/20 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                      <div className="min-w-[1000px] select-none">
                        {/* Days row header */}
                        <div className="grid grid-cols-[220px_repeat(7,1fr)] bg-white/[0.02] border-b border-white/5">
                          <div className="border-r border-white/5 py-3 px-4 flex items-center">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold font-mono">Resource / Agent</span>
                          </div>
                          {WEEK_DAYS.map((day, dayIdx) => (
                            <div key={dayIdx} className="border-r border-white/5 py-3 text-center flex flex-col justify-center items-center">
                              <span className="text-[10px] text-gray-500 uppercase font-bold">{day.label}</span>
                              <span className="text-xs font-semibold text-white mt-0.5">{day.date}</span>
                            </div>
                          ))}
                        </div>

                        {/* Resource Schedule Rows */}
                        <div className="divide-y divide-white/5">
                          {CALENDAR_RESOURCES.map((resource) => {
                            const resourceBookings = bookings.filter((b) => b.resourceId === resource.id);
                            return (
                              <div key={resource.id} className="grid grid-cols-[220px_repeat(7,1fr)] relative min-h-[64px]">
                                {/* Resource Title Column (Sticky left) */}
                                <div className="col-start-1 row-start-1 sticky left-0 z-20 bg-[#0e0e0e] border-r border-b border-white/5 p-3 flex flex-col justify-center shadow-[4px_0_12px_rgba(0,0,0,0.4)]">
                                  <span className="text-xs font-semibold text-white truncate">{resource.name}</span>
                                  <span className="text-[10px] text-gray-500 truncate mt-0.5 font-light">{resource.category}</span>
                                </div>
                                
                                {/* Background Empty Cells with Hover Glowing Blue Indicator */}
                                {WEEK_DAYS.map((_, dayIdx) => (
                                  <div
                                    key={dayIdx}
                                    style={{ gridColumnStart: dayIdx + 2, gridRowStart: 1 }}
                                    className="border-r border-b border-white/5 h-16 hover:bg-blue-500/[0.04] hover:shadow-[inset_0_0_12px_rgba(59,130,246,0.15)] transition-all cursor-crosshair relative group z-0"
                                    onClick={() => handleCellClick(resource, dayIdx)}
                                  >
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                      <span className="text-[10px] text-blue-400 font-semibold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.2)]">
                                        + Book
                                      </span>
                                    </div>
                                  </div>
                                ))}

                                {/* Colored Booking Blocks */}
                                {resourceBookings.map((b) => {
                                  const colorClasses = getBookingColorClasses(b.color);
                                  return (
                                    <div
                                      key={b.id}
                                      style={{
                                        gridColumnStart: b.startDayIdx + 2,
                                        gridColumnEnd: b.endDayIdx + 3,
                                        gridRowStart: 1,
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setIsNewBookingOpen(false);
                                        setSelectedBooking(b);
                                      }}
                                      className={`z-10 m-1.5 rounded-lg border p-2 flex flex-col justify-center pointer-events-auto cursor-pointer shadow-md select-none transition-all hover:brightness-110 active:scale-[0.98] ${colorClasses}`}
                                    >
                                      <span className="text-xs font-semibold truncate text-white leading-tight">{b.projectName}</span>
                                      <span className="text-[10px] opacity-75 truncate mt-0.5 leading-none">{b.workOrder}</span>
                                      <div className="flex items-center gap-1 mt-1 text-[9px] opacity-60">
                                        <LucideIcons.User size={8} />
                                        <span className="truncate">{b.operator}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Details Panel / Form */}
        <AnimatePresence mode="wait">
          {selectedBooking && (
            <motion.div
              key="booking-details"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="w-full lg:w-[320px] shrink-0 glass-panel border border-white/10 rounded-2xl overflow-hidden relative z-10"
            >
              {/* Pantone border bar */}
              <div
                className="h-1"
                style={{
                  backgroundColor:
                    selectedBooking.color === "violet" ? "#8b5cf6" :
                    selectedBooking.color === "pink" ? "#ec4899" :
                    selectedBooking.color === "orange" ? "#f97316" :
                    "#10b981"
                }}
              />
              
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold font-mono">CONFIRMED RESERVATION</span>
                    <h2 className="text-sm font-semibold text-white tracking-tight !m-0 mt-1">{selectedBooking.projectName}</h2>
                  </div>
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <LucideIcons.X size={16} />
                  </button>
                </div>
                
                <div className="space-y-3 divide-y divide-white/5">
                  <div className="grid grid-cols-[80px_1fr] text-xs pt-1.5">
                    <span className="text-zinc-500 font-medium">Resource:</span>
                    <span className="text-white font-semibold flex items-center gap-1.5 truncate">
                      <LucideIcons.Package size={12} className="text-zinc-400 shrink-0" />
                      <span className="truncate">{selectedBooking.resourceName}</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] text-xs pt-2">
                    <span className="text-zinc-500 font-medium">Work Order:</span>
                    <span className="text-zinc-300 font-medium truncate">{selectedBooking.workOrder}</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] text-xs pt-2">
                    <span className="text-zinc-500 font-medium">Operator:</span>
                    <span className="text-white font-semibold flex items-center gap-1.5 truncate">
                      <LucideIcons.User size={12} className="text-zinc-400 shrink-0" />
                      <span className="truncate">{selectedBooking.operator}</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] text-xs pt-2">
                    <span className="text-zinc-500 font-medium">Timeline:</span>
                    <span className="text-zinc-300 font-mono font-medium text-[11px] leading-relaxed">
                      {WEEK_DAYS[selectedBooking.startDayIdx].label} ({WEEK_DAYS[selectedBooking.startDayIdx].date}) – <br />
                      {WEEK_DAYS[selectedBooking.endDayIdx].label} ({WEEK_DAYS[selectedBooking.endDayIdx].date})
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => deleteBooking(selectedBooking.id)}
                    className="btn-danger w-full justify-center"
                  >
                    <LucideIcons.Trash2 size={12} />
                    <span>Release Booking</span>
                  </button>
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="btn-glass w-full justify-center"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {isNewBookingOpen && (
            <motion.div
              key="new-booking-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="w-full lg:w-[320px] shrink-0 glass-panel border border-white/10 rounded-2xl relative z-10 overflow-hidden"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">New Booking Request</h2>
                  <button
                    onClick={() => setIsNewBookingOpen(false)}
                    className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <LucideIcons.X size={16} />
                  </button>
                </div>

                <form onSubmit={createBooking} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Target Resource</label>
                    <input
                      type="text"
                      readOnly
                      value={newBookingData.resourceName}
                      className="w-full bg-[#141414] border border-white/5 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-400 outline-none cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Project Name</label>
                    <input
                      type="text"
                      required
                      value={newBookingData.projectName}
                      onChange={(e) => setNewBookingData({ ...newBookingData, projectName: e.target.value })}
                      placeholder="e.g. Apparel Brand Spotlight"
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs font-medium text-white placeholder-zinc-600 outline-none focus:border-white/30 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Work Order Details</label>
                    <input
                      type="text"
                      required
                      value={newBookingData.workOrder}
                      onChange={(e) => setNewBookingData({ ...newBookingData, workOrder: e.target.value })}
                      placeholder="e.g. A-Camera Pack & Rigging"
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs font-medium text-white placeholder-zinc-600 outline-none focus:border-white/30 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Operator / Crew</label>
                    <input
                      type="text"
                      required
                      value={newBookingData.operator}
                      onChange={(e) => setNewBookingData({ ...newBookingData, operator: e.target.value })}
                      placeholder="e.g. Marcus Chen"
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs font-medium text-white placeholder-zinc-600 outline-none focus:border-white/30 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Start Day</label>
                      <select
                        value={newBookingData.startDayIdx}
                        onChange={(e) => {
                          const startVal = Number(e.target.value);
                          setNewBookingData({
                            ...newBookingData,
                            startDayIdx: startVal,
                            endDayIdx: Math.max(newBookingData.endDayIdx, startVal)
                          });
                        }}
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs font-medium text-white outline-none cursor-pointer"
                      >
                        {WEEK_DAYS.map((d, i) => (
                          <option key={i} value={i}>{d.label} ({d.date})</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">End Day</label>
                      <select
                        value={newBookingData.endDayIdx}
                        onChange={(e) => setNewBookingData({ ...newBookingData, endDayIdx: Number(e.target.value) })}
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs font-medium text-white outline-none cursor-pointer"
                      >
                        {WEEK_DAYS.map((d, i) => (
                          <option key={i} value={i} disabled={i < newBookingData.startDayIdx}>{d.label} ({d.date})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block mb-1.5">Accent Tag</label>
                    <div className="flex items-center gap-3">
                      {(["violet", "pink", "orange", "emerald"] as const).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewBookingData({ ...newBookingData, color: c })}
                          className={`w-6 h-6 rounded-full border transition-all ${
                            newBookingData.color === c ? "scale-110 ring-2 ring-white/20 border-white" : "opacity-60 hover:opacity-100 border-transparent"
                          }`}
                          style={{
                            backgroundColor:
                              c === "violet" ? "rgb(139, 92, 246)" :
                              c === "pink" ? "rgb(236, 72, 153)" :
                              c === "orange" ? "rgb(249, 115, 22)" :
                              "rgb(16, 185, 129)"
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-3 border-t border-white/5">
                    <button
                      type="submit"
                      className="btn-primary w-full justify-center"
                    >
                      Confirm Booking
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsNewBookingOpen(false)}
                      className="btn-glass w-full justify-center"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      </div>

      {/* Bulk actions float bar for checkboxes */}
      <AnimatePresence>
        {selectedAssets.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#141414] border border-white/10 rounded-full px-5 py-3 shadow-2xl flex items-center gap-4 z-30"
          >
            <span className="text-xs text-gray-300 font-medium">
              {selectedAssets.size} item{selectedAssets.size > 1 ? "s" : ""} selected
            </span>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAssets((prev) =>
                    prev.map((a) =>
                      selectedAssets.has(a.id) ? { ...a, status: "Available" } : a
                    )
                  );
                  setSelectedAssets(new Set());
                }}
                className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md hover:bg-emerald-500/20 transition-colors"
              >
                Mark Available
              </button>
              <button
                onClick={() => {
                  setAssets((prev) =>
                    prev.map((a) =>
                      selectedAssets.has(a.id) ? { ...a, status: "In Maintenance" } : a
                    )
                  );
                  setSelectedAssets(new Set());
                }}
                className="px-2.5 py-1 text-[11px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-md hover:bg-amber-500/20 transition-colors"
              >
                Maintenance
              </button>
              <button
                onClick={() => {
                  setSelectedAssets(new Set());
                }}
                className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>



    </div>
  );
}
