import React from 'react';
import { GraduationCap, ArrowRight, BookOpen, Layers, Cpu, Award } from 'lucide-react';
import { BTechYear } from '../types';

interface YearGuideProps {
  onSelectYearFilter: (year: BTechYear) => void;
}

export const YearGuide: React.FC<YearGuideProps> = ({ onSelectYearFilter }) => {
  const years = [
    {
      year: '1st Year' as BTechYear,
      tag: 'Freshmen & First-Year Labs',
      badgeColor: 'border-emerald-300 text-emerald-700 bg-emerald-50',
      icon: BookOpen,
      role: 'Request Rentals, Purchases & Donations',
      rulesSummary: 'Allowed: Request to rent or buy components, or ask about donations. (Listing is reserved for seniors).',
      typicalLabs: 'Basic Electrical & Electronics (BEE), Engineering Physics, Workshop Practice',
      componentsNeeded: 'Solderless breadboards, male-to-male jumper wires, basic resistors (220Ω, 1kΩ), ceramic capacitors, multimeters',
      actionPrompt: 'Look for Free Senior Donations & Starter Packs',
      description: 'First years only need components for introductory circuits and ohm’s law verification. Don’t buy full retail boxes when 4th-year seniors regularly donate their starter breadboards and jumper wires!'
    },
    {
      year: '2nd Year' as BTechYear,
      tag: 'Core Circuitry & Microcontrollers',
      badgeColor: 'border-blue-300 text-blue-700 bg-blue-50',
      icon: Layers,
      role: 'List for Rent & Donate · Request All',
      rulesSummary: 'Allowed: List items for Rent, list Free Donations. Request to rent or buy items, or ask about donations.',
      typicalLabs: 'Analog Electronics Lab, Digital Logic Design, Microprocessor & Microcontroller Lab',
      componentsNeeded: 'Arduino Uno R3, 74-series TTL logic ICs, ultrasonic sensors (HC-SR04), 16x2 I2C displays, 5V single relay boards',
      actionPrompt: 'Rent Arduino Boards for Semester Lab Exams',
      description: 'Second year introduces breadboard-heavy IC logic and early embedded microcontroller programming. Rent an Arduino Uno for 3 weeks of practical exams or buy pre-tested sensor modules from seniors.'
    },
    {
      year: '3rd Year' as BTechYear,
      tag: 'IoT, Embedded Systems & Mini-Projects',
      badgeColor: 'border-blue-300 text-blue-700 bg-blue-50',
      icon: Cpu,
      role: 'List for Rent & Donate · Request All',
      rulesSummary: 'Allowed: List items for Rent, list Free Donations. Request to rent or buy items, or ask about donations.',
      typicalLabs: 'IoT Systems & Cloud Computing Lab, Robotics Mini-Project, Embedded RTOS Lab',
      componentsNeeded: 'ESP32 Wi-Fi/BLE modules, Raspberry Pi Pico, L298N motor drivers, SG90 servo packs, DHT11/22 climate sensors',
      actionPrompt: 'Browse Second-Hand IoT Hardware',
      description: 'Third-year mini-projects require network-capable boards like ESP32 and motor drivers for autonomous robots. Buy verified boards from seniors at up to 60% below new prices.'
    },
    {
      year: '4th Year' as BTechYear,
      tag: 'Capstone Projects & Alumni Hand-off',
      badgeColor: 'border-emerald-300 text-emerald-700 bg-emerald-50',
      icon: Award,
      role: 'List for Sale & Donate',
      rulesSummary: 'Allowed: List items for Sale, list Free Donations to juniors before graduation.',
      typicalLabs: 'Major Project Phase 1 & 2, Industrial Automation Capstone, BTech Thesis Showcase',
      componentsNeeded: 'Specialized sensors (LiDAR, thermal, MPU6050, high-torque steppers), post-evaluation liquidation',
      actionPrompt: 'List Your Leftover Hardware for Cash / Karma',
      description: 'After your final capstone presentation, pass on your components rather than packing them home. Sell your dev boards to juniors or donate spares to earn gratitude and clear your shelf.'
    }
  ];

  return (
    <section id="year-guide" className="py-16 bg-white border-b border-slate-200 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-mono font-bold text-emerald-800">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
            <span>BTECH ACADEMIC ROADMAP</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How Each BTech Year Participates
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            From 1st-year breadboard basics to 4th-year capstone handovers—see how your semester fits into the Circuit2Circuit campus ecosystem.
          </p>
        </div>

        {/* 4-Year Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          {years.map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.year}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-7 flex flex-col justify-between hover:border-blue-300 transition-all shadow-xs group"
              >
                <div className="space-y-4">
                  
                  {/* Top Bar inside card */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${item.badgeColor}`}>
                      {item.year}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      Role: <strong className="text-slate-900">{item.role}</strong>
                    </span>
                  </div>

                  {/* Year Title */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
                      <Icon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                        {item.tag}
                      </h3>
                      <p className="text-xs font-medium text-slate-500">
                        {item.typicalLabs}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Marketplace Rules Box */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700">
                    <span className="font-bold text-emerald-700 block mb-0.5">Marketplace Permissions:</span>
                    <p className="text-slate-600 leading-relaxed">{item.rulesSummary}</p>
                  </div>

                  {/* Essential components preview */}
                  <div className="bg-slate-100 rounded-xl p-3 border border-slate-200 text-xs">
                    <span className="text-slate-500 font-medium block mb-1">Common Components:</span>
                    <p className="text-slate-800 font-mono text-[11px] leading-relaxed">
                      {item.componentsNeeded}
                    </p>
                  </div>

                </div>

                {/* Footer Action */}
                <div className="pt-5 mt-5 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">{item.actionPrompt}</span>
                  <button
                    onClick={() => onSelectYearFilter(item.year)}
                    className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 group-hover:translate-x-1 transition-all cursor-pointer"
                  >
                    <span>View {item.year} Items</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
