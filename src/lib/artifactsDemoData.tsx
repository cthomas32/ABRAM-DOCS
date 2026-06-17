import React from 'react';

export interface ArtifactFeature {
  id: string;
  sectionTitle: string;
  sectionDescription: string;
  documentTitle: string;
  documentType: string;
  userPrompt: string;
  agentOperations: string[];
  assistantResponse: string;
  content: React.ReactNode;
}

export const artifactsDemoData: ArtifactFeature[] = [
  {
    id: "rom",
    sectionTitle: "ROM Generation",
    sectionDescription: "Instantly scope rough order of magnitudes with real-time labor rates and equipment costs automatically pulled from the ABRAM network.",
    documentTitle: "Horizon Campaign - ROM",
    documentType: "invoice",
    userPrompt: "Generate a ROM for the 'Horizon Campaign'. We need a 3-day shoot in LA with a standard commercial crew and a 10-day post schedule.",
    agentOperations: ["query_la_labor_rates", "estimate_equipment_costs", "calculate_post_production"],
    assistantResponse: "I've pulled the current rates for the LA market and compiled a Rough Order of Magnitude. The estimated total is $173,030.00. I've attached the breakdown.",
    content: (
      <div className="font-sans text-xs text-zinc-350 space-y-6">
        <div className="flex justify-between items-start border-b border-white/5 pb-5">
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Production Estimate</h3>
            <p className="text-zinc-500">Project: <span className="text-zinc-300 font-medium">Horizon Campaign</span></p>
            <p className="text-zinc-500">Date: <span className="text-zinc-300 font-medium">June 16, 2026</span></p>
            <p className="text-zinc-500">Shoot Days: <span className="text-zinc-300 font-medium">3 Days (Los Angeles)</span></p>
          </div>
          <div className="text-right space-y-1">
            <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Grand Total</h3>
            <p className="text-2xl font-light text-emerald-400">$173,030.00</p>
          </div>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5">
              <th className="py-2.5 font-medium text-zinc-500 uppercase text-[10px] tracking-wider">Description</th>
              <th className="py-2.5 font-medium text-zinc-500 uppercase text-[10px] tracking-wider text-right">Rate</th>
              <th className="py-2.5 font-medium text-zinc-500 uppercase text-[10px] tracking-wider text-center">Days/Units</th>
              <th className="py-2.5 font-medium text-zinc-500 uppercase text-[10px] tracking-wider text-right">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-zinc-300">
            <tr>
              <td className="py-3">
                <div className="font-medium text-zinc-200">Director</div>
                <div className="text-[10px] text-zinc-500">Commercial Daily Rate</div>
              </td>
              <td className="py-3 text-right font-mono text-zinc-400">$4,500</td>
              <td className="py-3 text-center text-zinc-400">5</td>
              <td className="py-3 text-right font-mono text-zinc-200">$22,500</td>
            </tr>
            <tr>
              <td className="py-3">
                <div className="font-medium text-zinc-200">Producer</div>
                <div className="text-[10px] text-zinc-500">Prep + Shoot + Wrap</div>
              </td>
              <td className="py-3 text-right font-mono text-zinc-400">$1,500</td>
              <td className="py-3 text-center text-zinc-400">8</td>
              <td className="py-3 text-right font-mono text-zinc-200">$12,000</td>
            </tr>
            <tr>
              <td className="py-3">
                <div className="font-medium text-zinc-200">Camera Package</div>
                <div className="text-[10px] text-zinc-500">Alexa 35 + Master Primes</div>
              </td>
              <td className="py-3 text-right font-mono text-zinc-400">$3,200</td>
              <td className="py-3 text-center text-zinc-400">3</td>
              <td className="py-3 text-right font-mono text-zinc-200">$9,600</td>
            </tr>
            <tr>
              <td className="py-3">
                <div className="font-medium text-zinc-200">Grip & Lighting Truck</div>
                <div className="text-[10px] text-zinc-500">5-Ton Package + Expendables</div>
              </td>
              <td className="py-3 text-right font-mono text-zinc-400">$2,800</td>
              <td className="py-3 text-center text-zinc-400">3</td>
              <td className="py-3 text-right font-mono text-zinc-200">$8,400</td>
            </tr>
            <tr>
              <td className="py-3">
                <div className="font-medium text-zinc-200">Post-Production</div>
                <div className="text-[10px] text-zinc-500">Edit, Color, Mix, Conform</div>
              </td>
              <td className="py-3 text-right font-mono text-zinc-400">$2,500</td>
              <td className="py-3 text-center text-zinc-400">10</td>
              <td className="py-3 text-right font-mono text-zinc-200">$25,000</td>
            </tr>
            <tr>
              <td className="py-3">
                <div className="font-medium text-zinc-200">Locations & Permits</div>
                <div className="text-[10px] text-zinc-500">LA FilmLA + Private Stage</div>
              </td>
              <td className="py-3 text-right font-mono text-zinc-400">$6,500</td>
              <td className="py-3 text-center text-zinc-400">3</td>
              <td className="py-3 text-right font-mono text-zinc-200">$19,500</td>
            </tr>
            <tr>
              <td className="py-3">
                <div className="font-medium text-zinc-200">Crew Labor</div>
                <div className="text-[10px] text-zinc-500">Camera, G&E, Sound, Art</div>
              </td>
              <td className="py-3 text-right font-mono text-zinc-400">$15,333</td>
              <td className="py-3 text-center text-zinc-400">3</td>
              <td className="py-3 text-right font-mono text-zinc-200">$46,000</td>
            </tr>
          </tbody>
        </table>
        
        <div className="flex justify-end pt-2">
          <div className="w-full sm:w-1/2 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-505 border-t border-white/5 pt-3">
              <span>Subtotal:</span>
              <span className="font-mono text-zinc-300">$143,000.00</span>
            </div>
            <div className="flex justify-between text-zinc-505">
              <span>Contingency (10%):</span>
              <span className="font-mono text-zinc-300">$14,300.00</span>
            </div>
            <div className="flex justify-between text-zinc-505 pb-3 border-b border-white/5">
              <span>Production Fee (10%):</span>
              <span className="font-mono text-zinc-300">$15,730.00</span>
            </div>
            <div className="flex justify-between text-zinc-200 font-semibold text-sm">
              <span>Grand Total:</span>
              <span className="font-mono text-emerald-400">$173,030.00</span>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "plan",
    sectionTitle: "Project Planning",
    sectionDescription: "Generate timelines and deliverable schedules that sync directly with your calendar and crew availability.",
    documentTitle: "Horizon Timeline & Deliverables",
    documentType: "timeline",
    userPrompt: "Based on the ROM, draft a production timeline. We want to shoot starting June 24, with delivery needed by July 12.",
    agentOperations: ["sync_calendar_availability", "draft_production_schedule", "set_milestones"],
    assistantResponse: "Here is the drafted timeline. I've scheduled prep for June 18-20, principal photography for June 24-26, and post to hit your July 12 delivery date.",
    content: (
      <div className="font-sans text-xs text-zinc-350 space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h3 className="text-sm font-semibold text-zinc-200">Project Roadmap</h3>
          <span className="bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 px-2.5 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
            On Schedule
          </span>
        </div>
        
        {/* Timeline Layout with 3-Column flex to prevent any overlapping */}
        <div className="space-y-6 relative">
          {/* Vertical Connecting Line */}
          <div className="absolute left-[111px] top-3 bottom-3 w-px bg-white/5 z-0"></div>

          {/* Item 1 */}
          <div className="flex items-start gap-4 relative z-10">
            {/* Column 1: Date */}
            <div className="w-24 shrink-0 text-right pr-2 space-y-0.5">
              <span className="text-zinc-400 font-semibold block">June 18-20</span>
              <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">3 Days</span>
            </div>
            
            {/* Column 2: Dot */}
            <div className="w-8 shrink-0 flex justify-center pt-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-750 ring-4 ring-[#18181b]"></div>
            </div>
            
            {/* Column 3: Details */}
            <div className="flex-1 space-y-3 pb-6 border-b border-white/5">
              <div className="flex items-start justify-between">
                <h4 className="font-medium text-zinc-200 text-sm">Pre-Production</h4>
                <span className="bg-blue-500/5 text-blue-400 border border-blue-500/10 px-1.5 py-0.5 rounded text-[10px] font-medium">In Progress</span>
              </div>
              <p className="text-zinc-405 leading-relaxed">Location tech scout, final casting approvals, and wardrobe fittings.</p>
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-white/[0.02] border border-white/5 text-zinc-400 px-2 py-0.5 rounded-full">Assigned: Location Team</span>
                <span className="text-[10px] bg-white/[0.02] border border-white/5 text-zinc-400 px-2 py-0.5 rounded-full">Assigned: Wardrobe Dept</span>
              </div>
              
              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                  <svg className="w-3 h-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  Milestone
                </div>
                <div className="text-zinc-300 font-medium">Final Tech Scout Sign-off</div>
              </div>
            </div>
          </div>
          
          {/* Item 2 */}
          <div className="flex items-start gap-4 relative z-10">
            {/* Column 1: Date */}
            <div className="w-24 shrink-0 text-right pr-2 space-y-0.5">
              <span className="text-amber-500 font-bold block">June 24-26</span>
              <span className="text-[10px] text-amber-500/70 block uppercase tracking-wider">Shoot</span>
            </div>
            
            {/* Column 2: Dot */}
            <div className="w-8 shrink-0 flex justify-center pt-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)] ring-4 ring-[#18181b]"></div>
            </div>
            
            {/* Column 3: Details */}
            <div className="flex-1 space-y-3 pb-6 border-b border-white/5">
              <div className="flex items-start justify-between">
                <h4 className="font-medium text-zinc-100 text-sm">Principal Photography</h4>
                <span className="bg-amber-500/5 text-amber-400 border border-amber-500/10 px-1.5 py-0.5 rounded text-[10px] font-medium">Scheduled</span>
              </div>
              <p className="text-zinc-405 leading-relaxed">3-day shoot at Stage A Studio and Downtown LA practical location.</p>
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-white/[0.02] border border-white/5 text-zinc-400 px-2 py-0.5 rounded-full">Assigned: Full Production Crew</span>
              </div>
            </div>
          </div>
          
          {/* Item 3 */}
          <div className="flex items-start gap-4 relative z-10">
            {/* Column 1: Date */}
            <div className="w-24 shrink-0 text-right pr-2 space-y-0.5">
              <span className="text-zinc-500 font-semibold block">July 1-12</span>
              <span className="text-[10px] text-zinc-600 block uppercase tracking-wider">12 Days</span>
            </div>
            
            {/* Column 2: Dot */}
            <div className="w-8 shrink-0 flex justify-center pt-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-800 ring-4 ring-[#18181b]"></div>
            </div>
            
            {/* Column 3: Details */}
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between">
                <h4 className="font-medium text-zinc-300 text-sm">Post-Production</h4>
                <span className="bg-zinc-800/50 text-zinc-500 border border-zinc-700/30 px-1.5 py-0.5 rounded text-[10px] font-medium">Pending Approval</span>
              </div>
              <p className="text-zinc-500 leading-relaxed">Offline edit, VFX integration, color grading, and final audio mix.</p>
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-white/[0.01] border border-white/5 text-zinc-500 px-2 py-0.5 rounded-full">Assigned: Editorial Team</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-white/[0.01] border border-white/5 rounded-lg p-3 space-y-0.5">
                  <div className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider">Milestone</div>
                  <div className="text-zinc-400 font-medium">Locked Picture (July 5)</div>
                </div>
                <div className="bg-white/[0.01] border border-white/5 rounded-lg p-3 space-y-0.5">
                  <div className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider">Milestone</div>
                  <div className="text-zinc-400 font-medium">Final Color Review (July 10)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "equipment",
    sectionTitle: "Equipment Sourcing",
    sectionDescription: "Check in-house inventory availability, identify production gaps, and automatically book compatible gear from external vendors.",
    documentTitle: "Camera & G&E Requisition",
    documentType: "list",
    userPrompt: "Check our in-house inventory for the upcoming shoot, suggest 1 or 2 items to pair with what we already have, and reserve them.",
    agentOperations: ["check_internal_inventory", "match_compatible_gear", "book_vendor_rentals"],
    assistantResponse: "I've checked our internal inventory and confirmed your RED V-Raptor is available. I've sourced and booked a Cooke Anamorphic lens set and a Teradek transmitter to pair with it, completing your camera package.",
    content: (
      <div className="font-sans text-xs text-zinc-300 space-y-6">
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">Equipment Requisition</h3>
            <p className="text-zinc-500 mt-0.5">Shoot Dates: June 24-26 (3 Days)</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">Est. Subtotal</span>
            <span className="text-lg font-mono text-emerald-400">$6,600.00</span>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Card 1: In-house */}
          <div className="border border-white/5 bg-white/[0.01] rounded-xl overflow-hidden">
            <div className="border-b border-white/5 p-4 flex justify-between items-center bg-white/[0.01]">
              <div className="space-y-0.5">
                <h4 className="font-medium text-zinc-200 text-sm">In-House Inventory</h4>
                <div className="text-[10px] text-zinc-500 flex items-center gap-1.5">
                  <span>Location: <span className="text-zinc-400">Gear Locker A</span></span>
                  <span className="w-0.5 h-0.5 rounded-full bg-zinc-650"></span>
                  <span className="font-mono text-zinc-400">Rate: $0 (Owned)</span>
                </div>
              </div>
              <span className="bg-blue-500/5 text-blue-400 border border-blue-500/10 px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-blue-400"></span> Reserved
              </span>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <tbody className="divide-y divide-white/5 text-zinc-300">
                <tr>
                  <td className="py-[5px] px-4 text-zinc-300">RED V-Raptor 8K VV Camera Body</td>
                  <td className="py-[5px] px-4 text-center text-zinc-400 w-16">1</td>
                  <td className="py-[5px] px-4 text-right font-mono text-zinc-400 w-28">In-House</td>
                </tr>
                <tr>
                  <td className="py-[5px] px-4 text-zinc-300">OConnor 2575D Fluid Head w/ Mitchell</td>
                  <td className="py-[5px] px-4 text-center text-zinc-400 w-16">1</td>
                  <td className="py-[5px] px-4 text-right font-mono text-zinc-400 w-28">In-House</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* Card 2: Rental Camera */}
          <div className="border border-white/5 bg-white/[0.01] rounded-xl overflow-hidden">
            <div className="border-b border-white/5 p-4 flex justify-between items-center bg-white/[0.01]">
              <div className="space-y-0.5">
                <h4 className="font-medium text-zinc-200 text-sm">Vendor Rentals (Camera Gaps)</h4>
                <div className="text-[10px] text-zinc-500 flex items-center gap-1.5">
                  <span>Source: <span className="text-zinc-400">External Rental</span></span>
                  <span className="w-0.5 h-0.5 rounded-full bg-zinc-650"></span>
                  <span className="font-mono text-zinc-400">Est: $3,450</span>
                </div>
              </div>
              <span className="bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-400"></span> Booked
              </span>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-white/[0.02] text-[9px] text-zinc-500 uppercase tracking-wider">
                <tr>
                  <th className="py-[5px] px-4 font-semibold">Item</th>
                  <th className="py-[5px] px-4 font-semibold text-center w-16">Qty</th>
                  <th className="py-[5px] px-4 font-semibold text-right w-28">Daily Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                <tr>
                  <td className="py-[5px] px-4 text-zinc-300">Cooke Anamorphic/i SF 5-Lens Set</td>
                  <td className="py-[5px] px-4 text-center text-zinc-400">1</td>
                  <td className="py-[5px] px-4 text-right font-mono text-zinc-400">$900</td>
                </tr>
                <tr>
                  <td className="py-[5px] px-4 text-zinc-300">Teradek Bolt 4K LT 750</td>
                  <td className="py-[5px] px-4 text-center text-zinc-400">1</td>
                  <td className="py-[5px] px-4 text-right font-mono text-zinc-400">$250</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Card 3: Rental G&E */}
          <div className="border border-white/5 bg-white/[0.01] rounded-xl overflow-hidden">
            <div className="border-b border-white/5 p-4 flex justify-between items-center bg-white/[0.01]">
              <div className="space-y-0.5">
                <h4 className="font-medium text-zinc-200 text-sm">Vendor Rentals (Grip & Electric)</h4>
                <div className="text-[10px] text-zinc-500 flex items-center gap-1.5">
                  <span>Source: <span className="text-zinc-400">External Rental</span></span>
                  <span className="w-0.5 h-0.5 rounded-full bg-zinc-650"></span>
                  <span className="font-mono text-zinc-400">Est: $3,150</span>
                </div>
              </div>
              <span className="bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-400"></span> Booked
              </span>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-white/[0.02] text-[9px] text-zinc-500 uppercase tracking-wider">
                <tr>
                  <th className="py-[5px] px-4 font-semibold">Item</th>
                  <th className="py-[5px] px-4 font-semibold text-center w-16">Qty</th>
                  <th className="py-[5px] px-4 font-semibold text-right w-28">Daily Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                <tr>
                  <td className="py-[5px] px-4 text-zinc-300">3-Ton Grip Truck Package</td>
                  <td className="py-[5px] px-4 text-center text-zinc-400">1</td>
                  <td className="py-[5px] px-4 text-right font-mono text-zinc-400">$650</td>
                </tr>
                <tr>
                  <td className="py-[5px] px-4 text-zinc-300">ARRI SkyPanel S60-C</td>
                  <td className="py-[5px] px-4 text-center text-zinc-400">2</td>
                  <td className="py-[5px] px-4 text-right font-mono text-zinc-400">$200</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "script",
    sectionTitle: "Script Breakdown",
    sectionDescription: "Auto-tag props, wardrobe, cast, and locations directly from your uploaded script files in seconds.",
    documentTitle: "Scene 4 Breakdown",
    documentType: "markdown",
    userPrompt: "I just uploaded the script for the coffee shop scene. Can you break it down and tag the props and wardrobe?",
    agentOperations: ["parse_pdf_script", "extract_entities", "tag_production_elements"],
    assistantResponse: "Script analyzed. I've identified the locations, cast members, and auto-tagged key props like the briefcase and coffee cup, along with wardrobe elements.",
    content: (
      <div className="font-sans text-xs text-zinc-300 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-xl">
          <div className="flex items-center gap-4">
            <div className="bg-zinc-100 text-zinc-950 font-bold text-sm px-3.5 py-1.5 rounded-lg shadow-sm">4</div>
            <div>
              <h3 className="font-semibold text-zinc-200">INT. COFFEE SHOP - DAY</h3>
              <div className="flex items-center gap-2.5 text-[10px] text-zinc-500 mt-1 font-mono uppercase tracking-wider">
                <span>Pgs: 2 1/8</span>
                <span className="w-0.5 h-0.5 rounded-full bg-zinc-650"></span>
                <span>Est Time: 2m 15s</span>
                <span className="w-0.5 h-0.5 rounded-full bg-zinc-650"></span>
                <span>Loc: Set A</span>
              </div>
            </div>
          </div>
          <div className="flex gap-1.5">
            <span className="bg-zinc-800/60 text-zinc-400 border border-white/5 px-2 py-0.5 rounded text-[10px] font-semibold">D/N: D</span>
            <span className="bg-zinc-800/60 text-zinc-400 border border-white/5 px-2 py-0.5 rounded text-[10px] font-semibold">I/E: INT</span>
          </div>
        </div>
        
        {/* Script Content redone with subtle transparent backgrounds and styled borders */}
        <div className="font-mono text-[13px] leading-relaxed max-w-2xl mx-auto space-y-5 text-zinc-350 p-6 bg-zinc-950/40 border border-white/5 rounded-xl shadow-inner">
          <div className="text-center space-y-1">
            <p className="font-bold text-zinc-200 uppercase tracking-wide">MARCUS</p>
            <p className="italic text-zinc-500 text-xs">(checking his <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1 py-0.5 rounded-sm cursor-pointer" title="Prop: Watch">watch</span>)</p>
          </div>
          <p className="text-center w-5/6 mx-auto text-zinc-300">
            I told you, the <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1 py-0.5 rounded-sm cursor-pointer" title="Prop: Briefcase">briefcase</span> stays with me.
          </p>
          
          <p className="text-zinc-400 leading-relaxed pt-2">
            <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-1 py-0.5 rounded-sm font-semibold cursor-pointer" title="Cast: Sarah">SARAH</span> sips her <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1 py-0.5 rounded-sm cursor-pointer" title="Prop: Coffee Cup">coffee</span>, adjusting her <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1 py-0.5 rounded-sm cursor-pointer" title="Wardrobe: Red Scarf">red scarf</span>. She looks out the <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1 py-0.5 rounded-sm cursor-pointer" title="Set Dressing: Window">window</span> at the <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.5 rounded-sm cursor-pointer" title="Vehicles: Black Sedan">black sedan</span> idling outside.
          </p>
        </div>
        
        <h4 className="font-semibold text-zinc-300 text-xs uppercase tracking-wider pt-2">Breakdown Elements</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="border border-white/5 bg-white/[0.01] rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-red-450"></span>
              <h5 className="font-semibold text-zinc-400 text-[10px] uppercase tracking-wider">Cast</h5>
            </div>
            <ul className="text-zinc-400 space-y-1">
              <li>1. Marcus</li>
              <li>2. Sarah</li>
            </ul>
          </div>
          
          <div className="border border-white/5 bg-white/[0.01] rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-orange-450"></span>
              <h5 className="font-semibold text-zinc-400 text-[10px] uppercase tracking-wider">Props</h5>
            </div>
            <ul className="text-zinc-400 space-y-1">
              <li>Briefcase (Black Leather)</li>
              <li>Coffee Cup (Ceramic)</li>
              <li>Wristwatch (Gold)</li>
            </ul>
          </div>
          
          <div className="border border-white/5 bg-white/[0.01] rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-purple-400"></span>
              <h5 className="font-semibold text-zinc-400 text-[10px] uppercase tracking-wider">Wardrobe</h5>
            </div>
            <ul className="text-zinc-400 space-y-1">
              <li>Red Scarf (Silk)</li>
              <li>Marcus Suit (Charcoal)</li>
            </ul>
          </div>
          
          <div className="border border-white/5 bg-white/[0.01] rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-emerald-450"></span>
              <h5 className="font-semibold text-zinc-400 text-[10px] uppercase tracking-wider">Vehicles</h5>
            </div>
            <ul className="text-zinc-400 space-y-1">
              <li>Black Sedan (Running)</li>
            </ul>
          </div>
          
          <div className="border border-white/5 bg-white/[0.01] rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-yellow-400"></span>
              <h5 className="font-semibold text-zinc-400 text-[10px] uppercase tracking-wider">Extras</h5>
            </div>
            <ul className="text-zinc-400 space-y-1">
              <li>3x Baristas</li>
              <li>5x Patrons</li>
            </ul>
          </div>
          
          <div className="border border-white/5 bg-white/[0.01] rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded bg-blue-400"></span>
              <h5 className="font-semibold text-zinc-400 text-[10px] uppercase tracking-wider">Set Dressing</h5>
            </div>
            <ul className="text-zinc-400 space-y-1">
              <li>Coffee Shop Tables</li>
              <li>Espresso Machine</li>
            </ul>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "callsheet",
    sectionTitle: "Call Sheet Generation",
    sectionDescription: "Automatically generate and distribute interactive digital call sheets based on your shoot schedule.",
    documentTitle: "Call Sheet - Day 1",
    documentType: "callsheet",
    userPrompt: "Generate the call sheet for Day 1 of the Horizon Campaign shoot. Call time is 6:00 AM.",
    agentOperations: ["fetch_crew_roster", "check_weather_api", "compile_call_sheet"],
    assistantResponse: "Day 1 Call Sheet generated. Call time set for 6:00 AM. Sunrise is at 5:42 AM. Ready for distribution.",
    content: (
      <div className="font-sans text-xs text-zinc-300 space-y-6">
        <div className="flex justify-between items-start border-b border-white/5 pb-5">
          <div className="space-y-1">
            <h2 className="text-xl font-black tracking-widest uppercase text-zinc-100">CALL SHEET</h2>
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Horizon Campaign</h3>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">DAY 1 OF 3 • WEDNESDAY, JUNE 24, 2026</p>
          </div>
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl text-right space-y-1">
            <h3 className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">General Crew Call</h3>
            <p className="text-3xl font-light text-blue-400">6:00 AM</p>
            <div className="flex gap-3 text-[10px] font-mono text-zinc-450 justify-end">
              <span>Lunch: 12:00 PM</span>
              <span>Est. Wrap: 7:00 PM</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-white/5 p-4 rounded-xl bg-white/[0.01] space-y-3">
            <h4 className="font-semibold text-zinc-400 border-b border-white/5 pb-1.5 text-[10px] uppercase tracking-wider">Weather</h4>
            <div className="flex items-center gap-3">
              <svg className="w-7 h-7 text-yellow-450" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              <div>
                <div className="font-bold text-base">72°F / 60°F</div>
                <div className="text-[10px] text-zinc-500">Mostly Sunny</div>
              </div>
            </div>
            <div className="text-[10px] font-mono text-zinc-500 pt-1">Sunrise: 5:42 AM • Sunset: 8:08 PM</div>
          </div>
          
          <div className="border border-white/5 p-4 rounded-xl bg-white/[0.01] space-y-3">
            <h4 className="font-semibold text-zinc-400 border-b border-white/5 pb-1.5 text-[10px] uppercase tracking-wider">Logistics</h4>
            <ul className="space-y-1 text-zinc-400 font-mono text-[11px]">
              <li><span className="text-zinc-500 font-semibold">CH 1:</span> Production</li>
              <li><span className="text-zinc-500 font-semibold">CH 2:</span> Open</li>
              <li><span className="text-zinc-500 font-semibold">CH 3:</span> Transportation</li>
              <li><span className="text-zinc-500 font-semibold">CH 4:</span> Camera / G&E</li>
            </ul>
          </div>
          
          <div className="border border-white/5 p-4 rounded-xl bg-white/[0.01] space-y-3">
            <h4 className="font-semibold text-zinc-400 border-b border-white/5 pb-1.5 text-[10px] uppercase tracking-wider">Hospital</h4>
            <p className="text-zinc-300 font-medium text-[13px]">Cedars-Sinai Medical Center</p>
            <p className="text-[10px] text-zinc-500 font-mono">8700 Beverly Blvd, Los Angeles</p>
            <p className="text-[10px] text-red-400 font-mono pt-1">Distance: 3.2 mi (12 mins)</p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-zinc-350 uppercase tracking-wider text-[10px] border-b border-white/5 pb-2">Shooting Schedule</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white/[0.02] text-zinc-550 border-b border-white/5">
                  <th className="py-2 px-3 font-semibold w-24">Time</th>
                  <th className="py-2 px-3 font-semibold w-12">Sc</th>
                  <th className="py-2 px-3 font-semibold">Set / Description</th>
                  <th className="py-2 px-3 font-semibold w-16 text-center">Cast</th>
                  <th className="py-2 px-3 font-semibold w-16 text-right">Pgs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                <tr>
                  <td className="py-3 px-3 font-mono text-[10px] text-zinc-500">7:00 AM</td>
                  <td className="py-3 px-3 font-bold text-center">4</td>
                  <td className="py-3 px-3">
                    <span className="font-medium text-zinc-200">INT. COFFEE SHOP - DAY</span>
                    <div className="text-[10px] text-zinc-500 mt-0.5">Marcus refuses to give up the briefcase.</div>
                  </td>
                  <td className="py-3 px-3 text-center text-zinc-400">1, 2</td>
                  <td className="py-3 px-3 text-right font-mono text-zinc-400">2 1/8</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-mono text-[10px] text-zinc-500">10:30 AM</td>
                  <td className="py-3 px-3 font-bold text-center">5</td>
                  <td className="py-3 px-3">
                    <span className="font-medium text-zinc-200">EXT. ALLEYWAY - DAY</span>
                    <div className="text-[10px] text-zinc-500 mt-0.5">Sarah spots the black sedan following them.</div>
                  </td>
                  <td className="py-3 px-3 text-center text-zinc-400">2</td>
                  <td className="py-3 px-3 text-right font-mono text-zinc-400">1 4/8</td>
                </tr>
                <tr className="bg-blue-500/[0.03] text-blue-300 border-y border-blue-500/10 font-medium">
                  <td className="py-2.5 px-3 font-mono text-[10px]">12:00 PM</td>
                  <td colSpan={4} className="py-2.5 px-3 text-center uppercase tracking-wider text-[10px]">Lunch (60 Mins)</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-mono text-[10px] text-zinc-500">1:00 PM</td>
                  <td className="py-3 px-3 font-bold text-center">8</td>
                  <td className="py-3 px-3">
                    <span className="font-medium text-zinc-200">INT. WAREHOUSE - DAY</span>
                    <div className="text-[10px] text-zinc-500 mt-0.5">The exchange.</div>
                  </td>
                  <td className="py-3 px-3 text-center text-zinc-400">1, 2, 4</td>
                  <td className="py-3 px-3 text-right font-mono text-zinc-400">3 2/8</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-semibold text-zinc-350 uppercase tracking-wider text-[10px] border-b border-white/5 pb-2">Cast Calls</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white/[0.02] text-zinc-550 border-b border-white/5 text-[9px] uppercase tracking-wider">
                  <th className="py-2 px-3 font-semibold w-8 text-center">ID</th>
                  <th className="py-2 px-3 font-semibold">Role / Name</th>
                  <th className="py-2 px-3 font-semibold text-center w-24">P/U Time</th>
                  <th className="py-2 px-3 font-semibold text-center w-24">Call Time</th>
                  <th className="py-2 px-3 font-semibold text-center w-24">H/MU</th>
                  <th className="py-2 px-3 font-semibold text-center w-24">Set Call</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                <tr>
                  <td className="py-3 px-3 text-center font-bold text-zinc-500">1</td>
                  <td className="py-3 px-3">
                    <div className="font-medium text-zinc-200">Marcus</div>
                    <div className="text-[10px] text-zinc-500">Marcus Vance</div>
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-[10px] text-zinc-500">Self</td>
                  <td className="py-3 px-3 text-center font-mono text-[10px] text-zinc-300 font-semibold">6:00 AM</td>
                  <td className="py-3 px-3 text-center font-mono text-[10px] text-zinc-450">6:15 AM</td>
                  <td className="py-3 px-3 text-center font-mono text-[10px] text-blue-450 font-bold">7:00 AM</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 text-center font-bold text-zinc-500">2</td>
                  <td className="py-3 px-3">
                    <div className="font-medium text-zinc-200">Sarah</div>
                    <div className="text-[10px] text-zinc-500">Sarah Jenkins</div>
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-[10px] text-zinc-500">5:15 AM</td>
                  <td className="py-3 px-3 text-center font-mono text-[10px] text-zinc-300 font-semibold">5:45 AM</td>
                  <td className="py-3 px-3 text-center font-mono text-[10px] text-zinc-450">6:00 AM</td>
                  <td className="py-3 px-3 text-center font-mono text-[10px] text-blue-450 font-bold">7:00 AM</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }
];
