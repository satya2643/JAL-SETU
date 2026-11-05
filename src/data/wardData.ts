export interface WardInfo {
  id: number;
  name: string;
  teluguName: string;
  locality: string;
  zone: string;
  zoneName: string;
  feeder: string;
  timing: string;
  eveningTiming?: string;
  status: 'Scheduled' | 'Supplying Now' | 'Low Pressure Alert' | 'Maintenance' | 'Completed';
  linePressure: string;
  pressureBar: number;
  pressurePercent: number;
  nextSupplyCountdown: string;
  reservoirSource: string;
  valveOperator: string;
  operatorPhone: string;
  tankerAvailability: 'Instant (20m)' | 'Available (45m)' | 'Delayed';
  notice?: string;
  lastUpdated: string;
  scheduledSupplyStartTime?: string;
  scheduledSupplyEndTime?: string;
  alertDispatchedAt?: string;
  alertLeadMinutes?: number;
  advanceNoticeCompliant?: boolean;
}

export interface ReservoirInfo {
  id: string;
  name: string;
  teluguName: string;
  percentage: number;
  level: string;
  maxLevel: string;
  status: string;
  inflow: string;
  outflow: string;
  accentColor: string;
}

export const INITIAL_RESERVOIRS: ReservoirInfo[] = [
  {
    id: 'meghadrigedda',
    name: 'Meghadrigedda',
    teluguName: 'మేఘాద్రిగెడ్డ',
    percentage: 84,
    level: '48.2 ft',
    maxLevel: '52.0 ft',
    status: 'Full Reserve',
    inflow: '210 Cusecs',
    outflow: '185 Cusecs',
    accentColor: 'primary',
  },
  {
    id: 'thatipudi',
    name: 'Thatipudi',
    teluguName: 'తాటిపూడి',
    percentage: 91,
    level: '294 ft',
    maxLevel: '297 ft',
    status: 'Steady Flow',
    inflow: '340 Cusecs',
    outflow: '310 Cusecs',
    accentColor: 'secondary',
  },
  {
    id: 'mudasarlova',
    name: 'Mudasarlova',
    teluguName: 'ముదసర్లోవ',
    percentage: 78,
    level: '162 ft',
    maxLevel: '169 ft',
    status: 'Normal Reserve',
    inflow: '95 Cusecs',
    outflow: '90 Cusecs',
    accentColor: 'primary',
  },
  {
    id: 'raiwada',
    name: 'Raiwada Canal',
    teluguName: 'రైవాడ కెనాల్',
    percentage: 88,
    level: '112.5 ft',
    maxLevel: '114.0 ft',
    status: 'Active Discharge',
    inflow: '420 Cusecs',
    outflow: '390 Cusecs',
    accentColor: 'secondary',
  },
];

export const INITIAL_WARDS: WardInfo[] = [
  {
    id: 32,
    name: 'Ward 32 (MVP Colony Sector 1-6)',
    teluguName: 'వార్డు 32 (ఎంవిపి కాలనీ సెక్టార్ 1-6)',
    locality: 'MVP Colony, Isukathota, Lawsons Bay Fringe',
    zone: 'Zone III',
    zoneName: 'Zone III (Central Visakhapatnam)',
    feeder: 'Thatipudi Feeder Line',
    timing: '06:00 AM – 07:45 AM',
    eveningTiming: '06:30 PM – 07:30 PM',
    status: 'Scheduled',
    linePressure: 'Normal (2.4 Bar)',
    pressureBar: 2.4,
    pressurePercent: 96,
    nextSupplyCountdown: '4 Hours 12 Mins',
    scheduledSupplyStartTime: '06:00 AM',
    scheduledSupplyEndTime: '07:45 AM',
    alertDispatchedAt: '05:15 AM',
    alertLeadMinutes: 45,
    advanceNoticeCompliant: true,
    reservoirSource: 'Thatipudi Reservoir',
    valveOperator: 'R. Satyanarayana (GVMC Field Asst.)',
    operatorPhone: '+91 94401 23821',
    tankerAvailability: 'Instant (20m)',
    notice: 'Booster pump in Sector 3 running at full capacity.',
    lastUpdated: '10 mins ago',
  },
  {
    id: 14,
    name: 'Ward 14 (Seethamdhara & HB Colony)',
    teluguName: 'వార్డు 14 (సీతమ్మధార & హెచ్‌బి కాలనీ)',
    locality: 'Seethamdhara, HB Colony, TP Gudem, Balayya Sastri Layout',
    zone: 'Zone II',
    zoneName: 'Zone II (North Central)',
    feeder: 'Mudasarlova Reservoir Feeder',
    timing: '05:30 AM – 07:00 AM',
    eveningTiming: '05:45 PM – 06:45 PM',
    status: 'Supplying Now',
    linePressure: 'High (2.7 Bar)',
    pressureBar: 2.7,
    pressurePercent: 98,
    nextSupplyCountdown: 'Live Currently Running',
    reservoirSource: 'Mudasarlova Reservoir',
    valveOperator: 'K. Appa Rao (Valve Operator #4)',
    operatorPhone: '+91 94403 89102',
    tankerAvailability: 'Instant (20m)',
    notice: 'Primary distribution line fully pressurized.',
    lastUpdated: 'Just now',
  },
  {
    id: 45,
    name: 'Ward 45 (Gajuwaka Industrial Belt)',
    teluguName: 'వార్డు 45 (గాజువాక ఇండస్ట్రియల్ బెల్ట్)',
    locality: 'Old Gajuwaka, High School Road, Chaitanya Nagar',
    zone: 'Zone V',
    zoneName: 'Zone V (Gajuwaka & Industrial Corridor)',
    feeder: 'Meghadrigedda Primary Feeder',
    timing: '07:30 AM – 09:00 AM',
    eveningTiming: '07:00 PM – 08:15 PM',
    status: 'Low Pressure Alert',
    linePressure: 'Moderate (1.6 Bar)',
    pressureBar: 1.6,
    pressurePercent: 68,
    nextSupplyCountdown: '1 Hour 35 Mins',
    reservoirSource: 'Meghadrigedda Reservoir',
    valveOperator: 'Ch. Venkat (Sub-Engineer Zone V)',
    operatorPhone: '+91 94408 55410',
    tankerAvailability: 'Available (45m)',
    notice: 'Desiltation pipeline works in progress near Kanithi road.',
    lastUpdated: '18 mins ago',
  },
  {
    id: 1,
    name: 'Ward 1 (Bheemunipatnam Coastal)',
    teluguName: 'వార్డు 1 (భీమునిపట్నం కోస్టల్)',
    locality: 'Bheemili Beach Road, Kummaripalem, Old Post Office',
    zone: 'Zone I',
    zoneName: 'Zone I (Bheemunipatnam & Rushikonda)',
    feeder: 'Gosthani River Infiltration Well',
    timing: '06:15 AM – 07:30 AM',
    status: 'Scheduled',
    linePressure: 'Normal (2.2 Bar)',
    pressureBar: 2.2,
    pressurePercent: 92,
    nextSupplyCountdown: '3 Hours 45 Mins',
    reservoirSource: 'Gosthani Source & Thatipudi',
    valveOperator: 'M. Ramesh Babu',
    operatorPhone: '+91 94405 11983',
    tankerAvailability: 'Available (45m)',
    lastUpdated: '25 mins ago',
  },
  {
    id: 5,
    name: 'Ward 5 (Madhurawada IT SEZ & PM Palem)',
    teluguName: 'వార్డు 5 (మధురవాడ & పి.ఎం. పాలెం)',
    locality: 'PM Palem Cricket Stadium, Kommadi, Midhilapuri Vuda Colony',
    zone: 'Zone I',
    zoneName: 'Zone I (Bheemunipatnam & Rushikonda)',
    feeder: 'Gambheeram Reservoir & Thatipudi',
    timing: '06:00 AM – 07:15 AM',
    eveningTiming: '06:00 PM – 07:00 PM',
    status: 'Scheduled',
    linePressure: 'Normal (2.5 Bar)',
    pressureBar: 2.5,
    pressurePercent: 95,
    nextSupplyCountdown: '2 Hours 10 Mins',
    reservoirSource: 'Gambheeram & Thatipudi Feeder',
    valveOperator: 'P. Shiva Prasad',
    operatorPhone: '+91 94402 77129',
    tankerAvailability: 'Instant (20m)',
    lastUpdated: '12 mins ago',
  },
  {
    id: 18,
    name: 'Ward 18 (Siripuram & Waltair Uplands)',
    teluguName: 'వార్డు 18 (సిరిపురం & వాల్తేరు అప్‌లాండ్స్)',
    locality: 'Siripuram Junction, Dutt Island, Andhra University Campus',
    zone: 'Zone III',
    zoneName: 'Zone III (Central Visakhapatnam)',
    feeder: 'Kailasagiri Elevated Service Reservoir (ELSR)',
    timing: '05:45 AM – 07:15 AM',
    eveningTiming: '05:30 PM – 06:45 PM',
    status: 'Supplying Now',
    linePressure: 'High (2.8 Bar)',
    pressureBar: 2.8,
    pressurePercent: 99,
    nextSupplyCountdown: 'Live Currently Running',
    reservoirSource: 'Thatipudi Feeder',
    valveOperator: 'D. Srinivasa Rao',
    operatorPhone: '+91 94409 32115',
    tankerAvailability: 'Instant (20m)',
    lastUpdated: '5 mins ago',
  },
  {
    id: 28,
    name: 'Ward 28 (Maharanipeta & Jagadamba)',
    teluguName: 'వార్డు 28 (మహారాణిపేట & జగదాంబ సెంటర్)',
    locality: 'Collectorate, KGH Down, Zilla Parishad, Poorna Market',
    zone: 'Zone IV',
    zoneName: 'Zone IV (South Visakhapatnam)',
    feeder: 'Town Hall Distribution Network',
    timing: '06:30 AM – 08:00 AM',
    status: 'Scheduled',
    linePressure: 'Normal (2.3 Bar)',
    pressureBar: 2.3,
    pressurePercent: 94,
    nextSupplyCountdown: '5 Hours 05 Mins',
    reservoirSource: 'Meghadrigedda Reservoir',
    valveOperator: 'B. Jagannadha Rao',
    operatorPhone: '+91 94407 88204',
    tankerAvailability: 'Instant (20m)',
    lastUpdated: '30 mins ago',
  },
  {
    id: 58,
    name: 'Ward 58 (Gopalapatnam & NAD Kotha Road)',
    teluguName: 'వార్డు 58 (గోపాలపట్నం & ఎన్‌ఎడి కొత్త రోడ్డు)',
    locality: 'NAD Flyover, Gopalapatnam Main Road, Simhachalam Railway Gate',
    zone: 'Zone VI',
    zoneName: 'Zone VI (West Visakhapatnam)',
    feeder: 'Raiwada Feeder Conduit',
    timing: '06:00 AM – 07:30 AM',
    status: 'Scheduled',
    linePressure: 'Normal (2.4 Bar)',
    pressureBar: 2.4,
    pressurePercent: 95,
    nextSupplyCountdown: '3 Hours 55 Mins',
    reservoirSource: 'Raiwada Reservoir',
    valveOperator: 'S. Trinadh',
    operatorPhone: '+91 94404 66321',
    tankerAvailability: 'Available (45m)',
    lastUpdated: '14 mins ago',
  },
  {
    id: 72,
    name: 'Ward 72 (Kurmannapalem & Steel Plant Township)',
    teluguName: 'వార్డు 72 (కూర్మన్నపాలెం & స్టీల్ ప్లాంట్)',
    locality: 'Kurmannapalem Junction, Duvvada Station Road, Sector 6',
    zone: 'Zone VII',
    zoneName: 'Zone VII (Steel Plant & Duvvada)',
    feeder: 'Yeleru Left Bank Canal (YLBC)',
    timing: '07:00 AM – 08:30 AM',
    status: 'Scheduled',
    linePressure: 'Normal (2.6 Bar)',
    pressureBar: 2.6,
    pressurePercent: 97,
    nextSupplyCountdown: '4 Hours 40 Mins',
    reservoirSource: 'Yeleru Canal System',
    valveOperator: 'V. Krishna Murthy',
    operatorPhone: '+91 94406 44109',
    tankerAvailability: 'Instant (20m)',
    lastUpdated: '22 mins ago',
  },
  {
    id: 88,
    name: 'Ward 88 (Pendurthi & Vepagunta)',
    teluguName: 'వార్డు 88 (పెందుర్తి & వేపగుంట)',
    locality: 'Pendurthi Junction, Sujatha Nagar, Chinnamushidiwada',
    zone: 'Zone VIII',
    zoneName: 'Zone VIII (Pendurthi & Anandapuram)',
    feeder: 'Mudasarlova & Raiwada Branch',
    timing: '06:45 AM – 08:15 AM',
    status: 'Maintenance',
    linePressure: 'Low (1.1 Bar)',
    pressureBar: 1.1,
    pressurePercent: 45,
    nextSupplyCountdown: 'Under Valve Replacement',
    reservoirSource: 'Raiwada System',
    valveOperator: 'G. Mohan Kumar',
    operatorPhone: '+91 94402 11094',
    tankerAvailability: 'Delayed',
    notice: 'Emergency valve rubber gasket replacement in progress. Est. restoration 09:30 AM.',
    lastUpdated: '8 mins ago',
  },
];

// Helper to generate a realistic ward entry if any ward from 1 to 98 is queried
export function getWardByNumber(wardNum: number): WardInfo {
  const existing = INITIAL_WARDS.find((w) => w.id === wardNum);
  if (existing) return existing;

  // Determine Zone based on standard GVMC divisions
  let zone = 'Zone IV';
  let zoneName = 'Zone IV (Central GVMC)';
  let feeder = 'Thatipudi Feeder Line';
  let source = 'Thatipudi Reservoir';

  if (wardNum <= 12) {
    zone = 'Zone I';
    zoneName = 'Zone I (Bheemunipatnam / Rushikonda / Madhurawada)';
    feeder = 'Gosthani / Gambheeram Feeder';
    source = 'Thatipudi & Gosthani';
  } else if (wardNum <= 24) {
    zone = 'Zone II';
    zoneName = 'Zone II (Asilmetta / Seethamdhara / Resapuvanipalem)';
    feeder = 'Mudasarlova Reservoir Feeder';
    source = 'Mudasarlova Reservoir';
  } else if (wardNum <= 36) {
    zone = 'Zone III';
    zoneName = 'Zone III (MVP Colony / Waltair / Lawson\'s Bay)';
    feeder = 'Thatipudi Primary Feeder';
    source = 'Thatipudi Reservoir';
  } else if (wardNum <= 48) {
    zone = 'Zone IV';
    zoneName = 'Zone IV (Town Hall / Poorna Market / Port Area)';
    feeder = 'Meghadrigedda Feeder Line';
    source = 'Meghadrigedda Reservoir';
  } else if (wardNum <= 65) {
    zone = 'Zone V';
    zoneName = 'Zone V (Gajuwaka / Auto Nagar / BHPV)';
    feeder = 'Meghadrigedda Primary Feeder';
    source = 'Meghadrigedda Reservoir';
  } else if (wardNum <= 78) {
    zone = 'Zone VI';
    zoneName = 'Zone VI (Gopalapatnam / Marripalem / NAD)';
    feeder = 'Raiwada Main Feeder';
    source = 'Raiwada Reservoir';
  } else if (wardNum <= 88) {
    zone = 'Zone VII';
    zoneName = 'Zone VII (Steel Plant / Kurmannapalem / Vadlapudi)';
    feeder = 'Yeleru Left Bank Canal';
    source = 'Yeleru System';
  } else {
    zone = 'Zone VIII';
    zoneName = 'Zone VIII (Pendurthi / Vepagunta / Anandapuram)';
    feeder = 'Raiwada & Mudasarlova Feeder';
    source = 'Raiwada Reservoir';
  }

  return {
    id: wardNum,
    name: `Ward ${wardNum} (GVMC Division ${wardNum})`,
    teluguName: `వార్డు ${wardNum} (జీవీఎంసీ డివిజన్ ${wardNum})`,
    locality: `Visakhapatnam Municipal Division ${wardNum}, ${zoneName}`,
    zone,
    zoneName,
    feeder,
    timing: '06:00 AM – 07:30 AM',
    eveningTiming: '06:00 PM – 07:00 PM',
    status: wardNum % 7 === 0 ? 'Supplying Now' : wardNum % 13 === 0 ? 'Low Pressure Alert' : 'Scheduled',
    linePressure: wardNum % 13 === 0 ? 'Moderate (1.7 Bar)' : 'Normal (2.4 Bar)',
    pressureBar: wardNum % 13 === 0 ? 1.7 : 2.4,
    pressurePercent: wardNum % 13 === 0 ? 70 : 95,
    nextSupplyCountdown: wardNum % 7 === 0 ? 'Live Currently Running' : '3 Hours 30 Mins',
    scheduledSupplyStartTime: '06:00 AM',
    scheduledSupplyEndTime: '07:30 AM',
    alertDispatchedAt: '05:15 AM',
    alertLeadMinutes: 45,
    advanceNoticeCompliant: true,
    reservoirSource: source,
    valveOperator: `K. Narayana (Ward ${wardNum} Officer)`,
    operatorPhone: '+91 94401 00000',
    tankerAvailability: 'Available (45m)',
    lastUpdated: '15 mins ago',
  };
}
