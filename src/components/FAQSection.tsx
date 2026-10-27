import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does component rental work between students?',
      a: 'Students agree on a weekly rental period (typically 1 to 3 weeks during lab exam season). The junior student meets the senior at an agreed campus location (e.g. ECE block or library), tests the board, and returns it once their lab submission or practical evaluation is complete.'
    },
    {
      q: 'Where do handovers usually take place?',
      a: 'Handovers occur at public, accessible campus locations such as department lobbies (ECE, CSE, EEE), the central library discussion rooms, student activity centers, or department canteen plazas during lunch break or after 4 PM.'
    },
    {
      q: 'How do I verify that an Arduino or sensor board is working before taking it?',
      a: 'We always recommend a quick bench verification during handover: bring a laptop with Arduino IDE installed or a 9V battery with a multimeter to verify power LEDs, test the standard Blink sketch on digital pin 13, and check pin continuity together.'
    },
    {
      q: 'Can 2nd or 3rd-year students also list components, or only 4th-year seniors?',
      a: 'In line with college rules: 4th-year students can list items for sale or donation; 2nd and 3rd-year students can list items for rent or donation. 1st-year students can browse and request items.'
    },
    {
      q: 'What if a component is donated for free?',
      a: 'Items tagged as "Free Donation" are offered purely as student-to-student goodwill. Juniors simply request the item, meet the senior on campus, and receive the hardware at zero cost.'
    },
    {
      q: 'How are prices agreed upon?',
      a: 'Prices and rental rates are set directly by the student listing the item. Students can discuss price, pickup location, and condition through private in-app chat.'
    }
  ];

  return (
    <section id="faq" className="py-16 bg-white border-b border-slate-200 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-mono font-bold text-blue-700">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>CAMPUS EXCHANGE FAQ</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-600">
            Everything you need to know about testing, renting, and donating lab electronics on campus.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden transition-all shadow-2xs"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <span className="text-sm sm:text-base font-extrabold text-slate-900">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-500 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-emerald-600' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-200">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
