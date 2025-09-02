'use client';

import Map from '../components/screens/map';

export default function GeoQuesterApp() {
  const renderScreen = () => {
    return <Map />;
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-[#073B4C] to-[#0A4A5C] text-white overflow-hidden">
      {renderScreen()}
    </div>
  );
}
