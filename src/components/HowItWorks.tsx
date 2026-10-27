import React from 'react';
import { UploadCloud, Search, CheckCircle2, UserCheck, Sparkles, MapPin } from 'lucide-react';

interface HowItWorksProps {
  onListClick: () => void;
  onBrowseClick: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onListClick, onBrowseClick }) => {
  return (
    <section id="how-it-works" className="py-16 bg-white border-b border-slate-200 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-mono font-bold text-blue-700">
            <span>CIRCULAR CAMPUS LIFECYCLE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How Circuit2Circuit Works
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            A verified student-to-student pipeline designed to eliminate component wastage and make engineering labs affordable for every batch.
          </p>
        </div>

        {/* 3-Step Process Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          
          {/* Step 1 */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-7 flex flex-col justify-between relative group hover:border-emerald-500/50 hover:shadow-md transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <UploadCloud className="w-6 h-6 text-emerald-600" />
                </div>
                <span className="text-2xl font-mono font-black text-slate-300 group-hover:text-emerald-600 transition-colors">
                  01
                </span>
              </div>

              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                  For 4th-Year Seniors
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  List Unused Electronics
                </h3>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                Graduating or finished your capstone project? Post your Arduino Uno, ESP32, sensors, multimeters, and passive components. Choose to <strong className="text-slate-900">sell at fair student prices</strong> or <strong className="text-emerald-700">donate to juniors</strong> for lab viva.
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Take 60 seconds to post</span>
              <button 
                onClick={onListClick}
                className="font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
              >
                List Hardware →
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-7 flex flex-col justify-between relative group hover:border-blue-500/50 hover:shadow-md transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700">
                  <Search className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-2xl font-mono font-black text-slate-300 group-hover:text-blue-600 transition-colors">
                  02
                </span>
              </div>

              <div>
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
                  For 1st, 2nd & 3rd Years
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  Search & Request Components
                </h3>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                Need an ultrasonic sensor for tomorrow’s lab or a breadboard with jumper wires for a project? Filter by your BTech year, browse lab-ready kits, and <strong className="text-slate-900">rent for weeks</strong> or <strong className="text-blue-700">claim free donations</strong>.
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Instant on-campus catalog</span>
              <button 
                onClick={onBrowseClick}
                className="font-bold text-blue-700 hover:text-blue-800 cursor-pointer"
              >
                Search Inventory →
              </button>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-7 flex flex-col justify-between relative group hover:border-emerald-500/50 hover:shadow-md transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <span className="text-2xl font-mono font-black text-slate-300 group-hover:text-emerald-600 transition-colors">
                  03
                </span>
              </div>

              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                  Peer Handover On Campus
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  Test Together & Build
                </h3>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                Meet between class hours at the ECE department foyer, central library, or SAC canteen. Quickly power on the board, inspect pins, get debugging tips from the senior, and start wiring your circuit.
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                Zero shipping delay
              </span>
              <span className="text-blue-700 font-bold">Safe campus spots</span>
            </div>
          </div>

        </div>

        {/* Dual Roles Callout Banner */}
        <div className="mt-10 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            
            {/* 4th-Year Role Card */}
            <div className="space-y-3 pb-6 md:pb-0 md:pr-6">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <h4 className="text-base font-extrabold text-slate-900">4th-Year Senior Benefits</h4>
              </div>
              <ul className="text-xs sm:text-sm text-slate-600 space-y-2 list-disc list-inside">
                <li>Recover capital invested in final-year capstone projects.</li>
                <li>Clear out hostel rooms and project benches before graduation.</li>
                <li>Donate components to junior buddies or department lab clubs.</li>
                <li>Share code repos, pinout schematics, and viva troubleshooting tips.</li>
              </ul>
            </div>

            {/* 1st to 3rd-Year Role Card */}
            <div className="space-y-3 pt-6 md:pt-0 md:pl-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h4 className="text-base font-extrabold text-slate-900">1st, 2nd & 3rd-Year Student Benefits</h4>
              </div>
              <ul className="text-xs sm:text-sm text-slate-600 space-y-2 list-disc list-inside">
                <li>Rent microcontrollers just for the 2–3 weeks of practical lab exams.</li>
                <li>Claim free breadboards, resistors, and capacitors donated by seniors.</li>
                <li>Never get stuck waiting 5 to 7 days for e-commerce delivery before viva.</li>
                <li>Receive tested, pre-soldered components that work with lab equipment.</li>
              </ul>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
