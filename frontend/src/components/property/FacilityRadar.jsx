import React from 'react';
import { 
  Compass, 
  Clock, 
  MapPin, 
  Star, 
  GraduationCap, 
  Cross, 
  ShoppingCart, 
  Bus, 
  Trees, 
  Building 
} from 'lucide-react';

export default function FacilityRadar({ facilities = [] }) {
  const getIcon = (type) => {
    switch (type) {
      case 'mosque':
        return <Building className="w-4 h-4 text-emerald-500" />;
      case 'school':
        return <GraduationCap className="w-4 h-4 text-blue-500" />;
      case 'hospital':
        return <Cross className="w-4 h-4 text-rose-500" />;
      case 'market':
        return <ShoppingCart className="w-4 h-4 text-amber-500" />;
      case 'transport':
        return <Bus className="w-4 h-4 text-purple-500" />;
      case 'park':
        return <Trees className="w-4 h-4 text-teal-500" />;
      default:
        return <MapPin className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
            <Compass className="w-5 h-5 mr-2 text-teal-600 dark:text-teal-400" />
            Facility & Proximity Intelligence
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Geospatial proximity computed against verified urban amenity datasets
          </p>
        </div>

        <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 text-xs font-bold border border-teal-500/20">
          <Star className="w-3.5 h-3.5 fill-current" />
          <span>Walk / Drive Index: 9.2/10</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {facilities.map((fac, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-teal-500/30 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 shadow-xs flex items-center justify-center">
                {getIcon(fac.type)}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[170px]">
                  {fac.name}
                </p>
                <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{fac.distance}</span>
                  <span>•</span>
                  <span className="flex items-center text-teal-600 dark:text-teal-400 font-medium">
                    <Clock className="w-3 h-3 mr-0.5" />
                    {fac.driveTime}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center justify-end">
                <Star className="w-3 h-3 fill-current mr-0.5" />
                {fac.rating}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
