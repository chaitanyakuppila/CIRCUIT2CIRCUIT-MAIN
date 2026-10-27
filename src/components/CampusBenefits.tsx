import React from 'react';
import { Leaf, Wallet, Clock, Users, ShieldCheck } from 'lucide-react';

export const CampusBenefits: React.FC = () => {
  const benefits = [
    {
      icon: Leaf,
      iconColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50 border-emerald-200',
      title: 'Zero Silicon Campus E-Waste',
      description: 'Engineering colleges discard working breadboards and ICs annually. Circuit2Circuit gives every working chip a second, third, and fourth life across graduating batches.'
    },
    {
      icon: Wallet,
      iconColor: 'text-blue-700',
      bgColor: 'bg-blue-50 border-blue-200',
      title: 'Massive Student Budget Relief',
      description: 'Why spend ₹600 on an Arduino or ₹400 on a sensor module for a single 10-day lab assignment? Rent for ₹30/week or pick up free senior donations.'
    },
    {
      icon: Clock,
      iconColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50 border-emerald-200',
      title: 'Zero Courier Delays Before Viva',
      description: 'E-commerce deliveries take 4 to 7 days to arrive in campus hostels. Circuit2Circuit handovers happen on the spot between classes at the ECE department or library.'
    },
    {
      icon: Users,
      iconColor: 'text-blue-700',
      bgColor: 'bg-blue-50 border-blue-200',
      title: 'Senior-to-Junior Tech Mentorship',
      description: 'When seniors handover hardware, they pass on hard-earned knowledge: common wiring pitfalls, library compatibility, and expected viva questions from professors.'
    }
  ];

  return (
    <section id="campus-impact" className="py-16 bg-slate-50 border-b border-slate-200 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-mono font-bold text-blue-700">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>THE CIRCULAR CAMPUS ADVANTAGE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Why Circuit2Circuit Matters on Campus
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Engineered specifically around BTech semester workflows, lab exam schedules, and hostel logistics.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:border-emerald-500/50 transition-all shadow-2xs group"
              >
                <div className="space-y-4">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${b.bgColor} ${b.iconColor}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {b.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {b.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Circular Electronics Visual Banner */}
        <div className="mt-12 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="flex items-center gap-5">
            <img 
              src="/assets/aistudio/CIRCUIT2CIRCUIT_7c14473a.jpeg" 
              alt="Circuit2Circuit Eco-System" 
              className="w-14 h-14 rounded-xl object-contain border border-slate-200 shadow-2xs shrink-0"
              referrerPolicy="no-referrer"
            />
            <div>
              <h4 className="text-base font-extrabold text-slate-900">The “Rent · Donate · Sell · Build” Circle</h4>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                When a 4th-year senior finishes their project, that silicon becomes the foundation for a 1st-year’s first working LED circuit. That’s true engineering sustainability.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
