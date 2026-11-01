// RIHAISH Real Estate & Society Intelligence Dataset
// Features high-growth expansion corridors and prime urban centers across Pakistan

export const CITIES = [
  { id: 'all', name: 'All Cities', count: 28 },
  { id: 'karachi', name: 'Karachi', count: 11, shardId: 'shard-khi', shardStatus: 'Healthy' },
  { id: 'lahore', name: 'Lahore', count: 10, shardId: 'shard-lhr', shardStatus: 'Healthy' },
  { id: 'islamabad', name: 'Islamabad / Rawalpindi', count: 7, shardId: 'shard-isb', shardStatus: 'Healthy' },
];

export const SOCIETIES = [
  // Karachi (Established & High-Growth Developing Expansion Corridors)
  { id: 'dha-khi', name: 'DHA Phase 8', city: 'karachi', type: 'Established', growthRate: '14.5%', tier: 'Tier 1' },
  { id: 'bahria-khi', name: 'Bahria Town Precinct 15', city: 'karachi', type: 'High Growth', growthRate: '22.8%', tier: 'Tier 2' },
  { id: 'scheme-33', name: 'Scheme 33 (Gulshan-e-Maymar Belt)', city: 'karachi', type: 'Emerging High Density', growthRate: '19.4%', tier: 'Tier 2' },
  { id: 'northern-bypass', name: 'Northern Bypass Growth Corridor', city: 'karachi', type: 'Emerging Frontier', growthRate: '31.2%', tier: 'Tier 3' },
  { id: 'malir-expressway', name: 'Malir Expressway Extension Hub', city: 'karachi', type: 'Infrastructure Boom', growthRate: '28.5%', tier: 'Tier 3' },
  { id: 'surjani-41', name: 'Surjani Town Sector 41', city: 'karachi', type: 'Affordable Growth', growthRate: '17.2%', tier: 'Tier 3' },
  
  // Lahore (Established & High-Growth Expansion Corridors)
  { id: 'dha-lhr', name: 'DHA Phase 9 Prism', city: 'lahore', type: 'High Growth Prime', growthRate: '24.1%', tier: 'Tier 1' },
  { id: 'bahria-lhr', name: 'Bahria Orchard Phase 4', city: 'lahore', type: 'High Growth', growthRate: '20.6%', tier: 'Tier 2' },
  { id: 'lda-city', name: 'LDA City Jinnah Sector', city: 'lahore', type: 'Government Mega Project', growthRate: '29.3%', tier: 'Tier 2' },
  { id: 'al-kabir', name: 'Al-Kabir Town Phase 2 (Raiwind Road)', city: 'lahore', type: 'Rapid Development', growthRate: '26.4%', tier: 'Tier 3' },
  { id: 'fazaia-lhr', name: 'Fazaia Housing Scheme Raiwind', city: 'lahore', type: 'Emerging', growthRate: '16.8%', tier: 'Tier 2' },
  { id: 'central-park', name: 'Central Park Housing Ferozepur Rd', city: 'lahore', type: 'Affordable Suburban', growthRate: '18.9%', tier: 'Tier 3' },

  // Islamabad & Rawalpindi (Established & High-Growth Corridors)
  { id: 'gulberg-isb', name: 'Gulberg Greens Executive Block', city: 'islamabad', type: 'Prime Agro-Urban', growthRate: '21.7%', tier: 'Tier 1' },
  { id: 'capital-smart', name: 'Capital Smart City Silicon Village', city: 'islamabad', type: 'AI Smart City', growthRate: '34.6%', tier: 'Tier 2' },
  { id: 'faisal-town-2', name: 'Faisal Town Phase 2 (Motorway M-2)', city: 'islamabad', type: 'Emerging High Yield', growthRate: '38.2%', tier: 'Tier 3' },
  { id: 'b17-multi', name: 'Multi Gardens B-17 Sector G', city: 'islamabad', type: 'Fast Developing', growthRate: '23.5%', tier: 'Tier 2' },
  { id: 'new-metro-city', name: 'New Metro City Mandra-Gujar Khan', city: 'islamabad', type: 'New Frontier Corridor', growthRate: '41.0%', tier: 'Tier 3' },
  { id: 'park-view-city', name: 'Park View City Hills Block', city: 'islamabad', type: 'Luxury High-Elevation', growthRate: '27.4%', tier: 'Tier 2' }
];

export const PROPERTIES_DATA = [
  // 1. Capital Smart City - Emerging Frontier
  {
    id: 'prop-001',
    title: '10 Marla Smart Residential Plot with Pre-Installed IoT Grid',
    society: 'Capital Smart City Silicon Village',
    societyId: 'capital-smart',
    city: 'islamabad',
    type: 'Plot',
    subtype: 'Residential Plot',
    price: 9500000, // PKR 95 Lacs
    priceFormatted: 'PKR 95.0 Lacs',
    pricePerSqFt: 'PKR 4,222/sq.yd',
    size: '10 Marla (250 Sq.Yd)',
    sizeNumeric: 250,
    bedrooms: 0,
    bathrooms: 0,
    status: 'Available',
    completionStatus: 'Under Construction (72% complete)',
    completionPct: 72,
    featured: true,
    aiInvestmentScore: 9.4,
    aiScoreBreakdown: {
      locationPotential: 9.6,
      infrastructureGrowth: 9.8,
      legalSafety: 9.2,
      liquidityScore: 9.0
    },
    recommendation: 'STRONG BUY',
    confidencePct: 94,
    forecast3YrYield: '+34.6%',
    priceHistory: [
      { year: '2022', price: 5800000 },
      { year: '2023', price: 6900000 },
      { year: '2024', price: 8100000 },
      { year: '2025', price: 9100000 },
      { year: '2026 (Current)', price: 9500000 },
      { year: '2027 (AI Proj)', price: 11400000, lower: 10800000, upper: 12100000 },
      { year: '2028 (AI Proj)', price: 13200000, lower: 12200000, upper: 14300000 },
      { year: '2029 (AI Proj)', price: 15400000, lower: 14000000, upper: 16900000 }
    ],
    leaseStatus: {
      verified: true,
      title: 'RDA / Rawalpindi Development Authority Approved NOC',
      nocNumber: 'RDA/MP&TE/F-PHS-TAX-28/2021',
      issuingAuthority: 'Rawalpindi Development Authority',
      statusType: 'Direct Transfer / Clear Title',
      transferType: 'Society Allotment Letter',
      verificationDate: '12 Jan 2026',
      notes: 'Fully vetted masterplan alignment with direct M-2 Dedicated Interchange'
    },
    facilities: [
      { name: 'Grand Jamia Mosque', distance: '0.4 km', driveTime: '2 mins', rating: 4.9, type: 'mosque' },
      { name: 'Future World School & Smart Campus', distance: '1.1 km', driveTime: '4 mins', rating: 4.8, type: 'school' },
      { name: 'Smart Medical Complex & ER', distance: '1.8 km', driveTime: '6 mins', rating: 4.7, type: 'hospital' },
      { name: 'Silicon Village Commercial Boulevard', distance: '0.6 km', driveTime: '3 mins', rating: 4.9, type: 'market' },
      { name: 'M-2 Motorway Interchange Access', distance: '1.2 km', driveTime: '3 mins', rating: 5.0, type: 'transport' },
      { name: 'Central Urban Lake & Theme Park', distance: '0.8 km', driveTime: '3 mins', rating: 4.9, type: 'park' }
    ],
    constructionMilestones: [
      { date: 'Feb 2026', title: 'Silicon Village Underground Utilities & Smart Meters Completed', status: 'Completed', pct: 100, verifiedByAdmin: true },
      { date: 'Jan 2026', title: 'Main 150-ft Boulevard Asphalt Layer 2 Laid', status: 'Completed', pct: 100, verifiedByAdmin: true },
      { date: 'Apr 2026', title: 'Commercial Plaza Sub-structure Foundation', status: 'In Progress', pct: 60, verifiedByAdmin: false },
      { date: 'Aug 2026', title: 'Final Possession Handover for Block B', status: 'Scheduled', pct: 0, verifiedByAdmin: false }
    ],
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Located right adjacent to the Silicon Village hub, this 10 Marla plot offers direct access to the dedicated M-2 interchange. High speed optical fiber network, smart automated streetlighting, underground electricity, and rapid construction milestones underway.'
  },

  // 2. Northern Bypass Growth Corridor - Karachi Emerging High Yield
  {
    id: 'prop-002',
    title: '120 Sq.Yd High Yield Commercial / Residential Mixed Plot',
    society: 'Northern Bypass Growth Corridor',
    societyId: 'northern-bypass',
    city: 'karachi',
    type: 'Plot',
    subtype: 'Residential Plot',
    price: 3200000, // PKR 32 Lacs
    priceFormatted: 'PKR 32.0 Lacs',
    pricePerSqFt: 'PKR 2,962/sq.yd',
    size: '120 Sq.Yd (5 Marla Equivalent)',
    sizeNumeric: 120,
    bedrooms: 0,
    bathrooms: 0,
    status: 'Available',
    completionStatus: 'Under Construction (58% complete)',
    completionPct: 58,
    featured: true,
    aiInvestmentScore: 9.1,
    aiScoreBreakdown: {
      locationPotential: 9.4,
      infrastructureGrowth: 9.7,
      legalSafety: 8.8,
      liquidityScore: 8.5
    },
    recommendation: 'STRONG BUY (High Multiplier)',
    confidencePct: 91,
    forecast3YrYield: '+42.5%',
    priceHistory: [
      { year: '2022', price: 1600000 },
      { year: '2023', price: 2100000 },
      { year: '2024', price: 2600000 },
      { year: '2025', price: 2950000 },
      { year: '2026 (Current)', price: 3200000 },
      { year: '2027 (AI Proj)', price: 4100000, lower: 3800000, upper: 4450000 },
      { year: '2028 (AI Proj)', price: 5200000, lower: 4700000, upper: 5800000 },
      { year: '2029 (AI Proj)', price: 6500000, lower: 5700000, upper: 7300000 }
    ],
    leaseStatus: {
      verified: true,
      title: 'SBCA & Sindh Board of Revenue 99-Year Registered Lease (Leez)',
      nocNumber: 'SBCA/DIR-PLG/2022/941',
      issuingAuthority: 'Sindh Building Control Authority & KDA',
      statusType: '99-Year Government Leasehold Verified',
      transferType: 'Sub-Lease Registered with Sub-Registrar',
      verificationDate: '08 Feb 2026',
      notes: 'Clean title verified against Survey dehat records with no litigation flags'
    },
    facilities: [
      { name: 'Madina Jamia Masjid', distance: '0.3 km', driveTime: '1 min', rating: 4.7, type: 'mosque' },
      { name: 'City Grammar High School', distance: '1.4 km', driveTime: '5 mins', rating: 4.5, type: 'school' },
      { name: 'Al-Khidmat Medical Hospital', distance: '3.2 km', driveTime: '9 mins', rating: 4.6, type: 'hospital' },
      { name: 'Central Sector 4 Commercial Bazaar', distance: '0.8 km', driveTime: '3 mins', rating: 4.7, type: 'market' },
      { name: 'M-10 Northern Bypass Main Connector', distance: '0.5 km', driveTime: '2 mins', rating: 4.9, type: 'transport' },
      { name: 'Community Botanical Park', distance: '0.9 km', driveTime: '4 mins', rating: 4.6, type: 'park' }
    ],
    constructionMilestones: [
      { date: 'Jan 2026', title: 'Boundary Wall and Guard Posts Erected', status: 'Completed', pct: 100, verifiedByAdmin: true },
      { date: 'Feb 2026', title: 'Water Supply Pipeline Connection Hookup', status: 'In Progress', pct: 75, verifiedByAdmin: true },
      { date: 'May 2026', title: 'Main Sector Road Carpeting & Grid Transformer', status: 'Scheduled', pct: 20, verifiedByAdmin: false }
    ],
    images: [
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'An exceptional high-yield development opportunity in the expanding Northern Bypass belt. Ideal for long-term multi-bagger returns as port traffic cargo routes and industrial zones rapidly expand northward.'
  },

  // 3. LDA City Jinnah Sector - Lahore Mega Government Project
  {
    id: 'prop-003',
    title: '1 Kanal Prime Boulevard Plot near Sports Complex',
    society: 'LDA City Jinnah Sector',
    societyId: 'lda-city',
    city: 'lahore',
    type: 'Plot',
    subtype: 'Residential Plot',
    price: 16500000, // PKR 1.65 Crore
    priceFormatted: 'PKR 1.65 Crore',
    pricePerSqFt: 'PKR 3,666/sq.yd',
    size: '1 Kanal (500 Sq.Yd)',
    sizeNumeric: 500,
    bedrooms: 0,
    bathrooms: 0,
    status: 'Available',
    completionStatus: 'Under Construction (81% complete)',
    completionPct: 81,
    featured: true,
    aiInvestmentScore: 9.3,
    aiScoreBreakdown: {
      locationPotential: 9.5,
      infrastructureGrowth: 9.6,
      legalSafety: 9.9,
      liquidityScore: 9.1
    },
    recommendation: 'STRONG BUY',
    confidencePct: 95,
    forecast3YrYield: '+29.3%',
    priceHistory: [
      { year: '2022', price: 9200000 },
      { year: '2023', price: 11500000 },
      { year: '2024', price: 13800000 },
      { year: '2025', price: 15400000 },
      { year: '2026 (Current)', price: 16500000 },
      { year: '2027 (AI Proj)', price: 19500000, lower: 18400000, upper: 20600000 },
      { year: '2028 (AI Proj)', price: 23100000, lower: 21500000, upper: 24800000 },
      { year: '2029 (AI Proj)', price: 27500000, lower: 25000000, upper: 29800000 }
    ],
    leaseStatus: {
      verified: true,
      title: 'Lahore Development Authority (LDA) Government Exemption File / Allotment',
      nocNumber: 'LDA/TP/CMP-2020/712',
      issuingAuthority: 'Lahore Development Authority (Government of Punjab)',
      statusType: 'Direct LDA Transfer / 100% Legal Ownership',
      transferType: 'Official LDA Allotment Letter',
      verificationDate: '15 Feb 2026',
      notes: 'State-backed infrastructure project connected directly to Lahore Ring Road Southern Loop'
    },
    facilities: [
      { name: 'Jinnah Sector Grand Mosque', distance: '0.5 km', driveTime: '2 mins', rating: 4.9, type: 'mosque' },
      { name: 'Beaconhouse National University Campus Area', distance: '3.5 km', driveTime: '8 mins', rating: 4.8, type: 'school' },
      { name: 'Indus Hospital Lahore Jubilee Town Wing', distance: '4.8 km', driveTime: '11 mins', rating: 4.7, type: 'hospital' },
      { name: 'LDA City Civic Commercial Center', distance: '0.7 km', driveTime: '3 mins', rating: 4.8, type: 'market' },
      { name: 'Lahore Ring Road Ferozepur Rd Interchange', distance: '1.5 km', driveTime: '4 mins', rating: 5.0, type: 'transport' },
      { name: 'Mega Sports Complex & 300-Kanal Park', distance: '0.4 km', driveTime: '2 mins', rating: 4.9, type: 'park' }
    ],
    constructionMilestones: [
      { date: 'Dec 2025', title: 'Electrification and Underground Cable Conduit Completed', status: 'Completed', pct: 100, verifiedByAdmin: true },
      { date: 'Jan 2026', title: 'Sewerage Treatment Plant Module 1 Active', status: 'Completed', pct: 100, verifiedByAdmin: true },
      { date: 'Mar 2026', title: 'Road Signage & Green Belt Landscaping', status: 'In Progress', pct: 85, verifiedByAdmin: true }
    ],
    images: [
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Located in the most sought-after Jinnah Sector of LDA City, this 1 Kanal plot borders the designated sports and civic hub. Direct access via Lahore Ring Road guarantees massive capital appreciation as balloting possessions roll out.'
  },

  // 4. Faisal Town Phase 2 - Emerging M-2 Motorway Hub
  {
    id: 'prop-004',
    title: '5 Marla Residential Plot near Central Commercial Square',
    society: 'Faisal Town Phase 2 (Motorway M-2)',
    societyId: 'faisal-town-2',
    city: 'islamabad',
    type: 'Plot',
    subtype: 'Residential Plot',
    price: 3600000, // PKR 36 Lacs
    priceFormatted: 'PKR 36.0 Lacs',
    pricePerSqFt: 'PKR 2,880/sq.yd',
    size: '5 Marla (125 Sq.Yd)',
    sizeNumeric: 125,
    bedrooms: 0,
    bathrooms: 0,
    status: 'Available',
    completionStatus: 'Under Construction (45% complete)',
    completionPct: 45,
    featured: false,
    aiInvestmentScore: 9.5,
    aiScoreBreakdown: {
      locationPotential: 9.7,
      infrastructureGrowth: 9.8,
      legalSafety: 9.1,
      liquidityScore: 9.3
    },
    recommendation: 'STRONG BUY (High Momentum)',
    confidencePct: 93,
    forecast3YrYield: '+38.2%',
    priceHistory: [
      { year: '2023', price: 2100000 },
      { year: '2024', price: 2800000 },
      { year: '2025', price: 3300000 },
      { year: '2026 (Current)', price: 3600000 },
      { year: '2027 (AI Proj)', price: 4700000, lower: 4300000, upper: 5100000 },
      { year: '2028 (AI Proj)', price: 6100000, lower: 5500000, upper: 6700000 },
      { year: '2029 (AI Proj)', price: 7800000, lower: 6900000, upper: 8700000 }
    ],
    leaseStatus: {
      verified: true,
      title: 'RDA Approved Layout Plan & Society Allotment File',
      nocNumber: 'RDA/DEV-FT2/2023/89',
      issuingAuthority: 'Rawalpindi Development Authority',
      statusType: 'Direct Developer Allotment with Biometric Verification',
      transferType: 'Zedem International Registered Certificate',
      verificationDate: '20 Jan 2026',
      notes: 'Backed by proven delivery track record of Faisal Hills & Faisal Town Phase 1'
    },
    facilities: [
      { name: 'Central Sector Mosque', distance: '0.4 km', driveTime: '2 mins', rating: 4.8, type: 'mosque' },
      { name: 'Roots Millennium School Proposed Site', distance: '1.2 km', driveTime: '4 mins', rating: 4.7, type: 'school' },
      { name: 'Quaid-e-Azam International Hospital Reach', distance: '9.5 km', driveTime: '14 mins', rating: 4.8, type: 'hospital' },
      { name: 'Faisal Boulevard Commercial Complex', distance: '0.5 km', driveTime: '2 mins', rating: 4.9, type: 'market' },
      { name: 'M-2 Thalian Interchange Direct Access', distance: '1.8 km', driveTime: '4 mins', rating: 5.0, type: 'transport' },
      { name: 'Family Lakeside Promenade Park', distance: '0.6 km', driveTime: '3 mins', rating: 4.8, type: 'park' }
    ],
    constructionMilestones: [
      { date: 'Jan 2026', title: 'Heavy Earth Moving & Leveling 80% Complete', status: 'Completed', pct: 100, verifiedByAdmin: true },
      { date: 'Feb 2026', title: 'Main Entrance Gate Structure & Security Complex', status: 'In Progress', pct: 70, verifiedByAdmin: true },
      { date: 'Jun 2026', title: 'Phase 1 Road Network Paving', status: 'Scheduled', pct: 10, verifiedByAdmin: false }
    ],
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1524813686514-a57563d77d61?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'A top choice for early-stage capital gains in the Islamabad-Rawalpindi expansion belt. Strategically situated with direct access from the Motorway, featuring rapid ground earthworks and high liquidity in secondary trade.'
  },

  // 5. DHA Phase 8 Karachi - Established Prime
  {
    id: 'prop-005',
    title: '500 Sq.Yd Luxury Designer Villa with Sea Breeze Frontage',
    society: 'DHA Phase 8',
    societyId: 'dha-khi',
    city: 'karachi',
    type: 'House',
    subtype: 'Luxury Villa',
    price: 185000000, // PKR 18.5 Crore
    priceFormatted: 'PKR 18.5 Crore',
    pricePerSqFt: 'PKR 41,111/sq.yd',
    size: '500 Sq.Yd (5 Bed Luxury)',
    sizeNumeric: 500,
    bedrooms: 5,
    bathrooms: 6,
    status: 'Available',
    completionStatus: 'Ready to Move (100%)',
    completionPct: 100,
    featured: true,
    aiInvestmentScore: 8.7,
    aiScoreBreakdown: {
      locationPotential: 9.8,
      infrastructureGrowth: 8.2,
      legalSafety: 9.9,
      liquidityScore: 8.6
    },
    recommendation: 'HOLD / BUY FOR CAPITAL SECURITY',
    confidencePct: 96,
    forecast3YrYield: '+14.5%',
    priceHistory: [
      { year: '2022', price: 125000000 },
      { year: '2023', price: 145000000 },
      { year: '2024', price: 165000000 },
      { year: '2025', price: 175000000 },
      { year: '2026 (Current)', price: 185000000 },
      { year: '2027 (AI Proj)', price: 202000000, lower: 195000000, upper: 210000000 },
      { year: '2028 (AI Proj)', price: 220000000, lower: 210000000, upper: 232000000 },
      { year: '2029 (AI Proj)', price: 242000000, lower: 228000000, upper: 258000000 }
    ],
    leaseStatus: {
      verified: true,
      title: 'Pakistan Defence Officers Housing Authority (DHA) 99-Year Registered Lease',
      nocNumber: 'DHA-KHI/TP/Z-E/2021',
      issuingAuthority: 'Defence Housing Authority Karachi & Cantonment Board Clifton (CBC)',
      statusType: 'Direct DHA Transfer with "A" Category Clear Title',
      transferType: 'DHA Karachi Registered Sub-Lease Deed',
      verificationDate: '10 Feb 2026',
      notes: 'Clean title with CBC tax clearance certificate and DHA architectural approval'
    },
    facilities: [
      { name: 'Masjid-e-Saheem Phase 8', distance: '0.3 km', driveTime: '1 min', rating: 5.0, type: 'mosque' },
      { name: 'The City School DHA Campus', distance: '1.2 km', driveTime: '4 mins', rating: 4.9, type: 'school' },
      { name: 'South City Hospital Clifton', distance: '5.5 km', driveTime: '12 mins', rating: 4.9, type: 'hospital' },
      { name: 'Do Darya Marine Promenade & Food Street', distance: '1.5 km', driveTime: '4 mins', rating: 5.0, type: 'market' },
      { name: 'Abdul Sattar Edhi Avenue Signal Free Expressway', distance: '0.8 km', driveTime: '2 mins', rating: 4.9, type: 'transport' },
      { name: 'Creek Park & Golf Club', distance: '1.1 km', driveTime: '3 mins', rating: 5.0, type: 'park' }
    ],
    constructionMilestones: [
      { date: 'Jan 2026', title: 'Occupancy Certificate Issued by CBC', status: 'Completed', pct: 100, verifiedByAdmin: true }
    ],
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Ultra-modern 5-bedroom architect-designed luxury villa in DHA Phase 8 Zone E. Features Spanish porcelain tiling, Italian designer kitchen, infinity plunge pool, basement home theater, and panoramic sea breeze terrace.'
  },

  // 6. Al-Kabir Town Phase 2 - Lahore Rapid Suburban
  {
    id: 'prop-006',
    title: '3 Marla Ready Affordable Home on Main Boulevard Extension',
    society: 'Al-Kabir Town Phase 2 (Raiwind Road)',
    societyId: 'al-kabir',
    city: 'lahore',
    type: 'House',
    subtype: 'Compact Townhouse',
    price: 8200000, // PKR 82 Lacs
    priceFormatted: 'PKR 82.0 Lacs',
    pricePerSqFt: 'PKR 10,933/sq.yd',
    size: '3 Marla (75 Sq.Yd, 3 Bed)',
    sizeNumeric: 75,
    bedrooms: 3,
    bathrooms: 3,
    status: 'Available',
    completionStatus: 'Ready to Move (100%)',
    completionPct: 100,
    featured: false,
    aiInvestmentScore: 9.0,
    aiScoreBreakdown: {
      locationPotential: 9.1,
      infrastructureGrowth: 9.3,
      legalSafety: 8.9,
      liquidityScore: 9.5
    },
    recommendation: 'STRONG BUY (High Rental Yield)',
    confidencePct: 92,
    forecast3YrYield: '+26.4%',
    priceHistory: [
      { year: '2022', price: 4800000 },
      { year: '2023', price: 5900000 },
      { year: '2024', price: 6800000 },
      { year: '2025', price: 7600000 },
      { year: '2026 (Current)', price: 8200000 },
      { year: '2027 (AI Proj)', price: 9800000, lower: 9100000, upper: 10400000 },
      { year: '2028 (AI Proj)', price: 11500000, lower: 10600000, upper: 12400000 },
      { year: '2029 (AI Proj)', price: 13400000, lower: 12100000, upper: 14700000 }
    ],
    leaseStatus: {
      verified: true,
      title: 'LDA Approved Housing Society Scheme with Registry Allotment',
      nocNumber: 'LDA/MP-II/AKT-2019/332',
      issuingAuthority: 'Lahore Development Authority',
      statusType: 'Society Allotment with Registered Transfer',
      transferType: 'Direct Society Transfer',
      verificationDate: '01 Feb 2026',
      notes: 'Fully developed sector with gas, underground electricity, and 24/7 security'
    },
    facilities: [
      { name: 'Al-Kabir Grand Jamia Mosque', distance: '0.2 km', driveTime: '1 min', rating: 4.8, type: 'mosque' },
      { name: 'Superior University Raiwind Campus', distance: '2.1 km', driveTime: '5 mins', rating: 4.7, type: 'school' },
      { name: 'Bahria International Hospital (Orchard)', distance: '3.8 km', driveTime: '8 mins', rating: 4.9, type: 'hospital' },
      { name: 'Al-Kabir Commercial Hub & Supermarket', distance: '0.4 km', driveTime: '2 mins', rating: 4.8, type: 'market' },
      { name: 'Raiwind Road 8-Lane Express Highway', distance: '0.6 km', driveTime: '2 mins', rating: 4.9, type: 'transport' },
      { name: 'Theme Park & Zoo', distance: '0.5 km', driveTime: '2 mins', rating: 4.7, type: 'park' }
    ],
    constructionMilestones: [
      { date: 'Dec 2025', title: 'Civil Structure Finishing and Paint Handover', status: 'Completed', pct: 100, verifiedByAdmin: true }
    ],
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Move-in ready 3 Marla modern home featuring 3 ensuite bedrooms, stylish American open kitchen, solid woodwork, and rooftop terrace. High rental demand due to proximity to Superior University and Comsats.'
  },

  // 7. Scheme 33 - Karachi Urban Corridor
  {
    id: 'prop-007',
    title: '200 Sq.Yd West-Open Residential Plot in Gated Society',
    society: 'Scheme 33 (Gulshan-e-Maymar Belt)',
    societyId: 'scheme-33',
    city: 'karachi',
    type: 'Plot',
    subtype: 'Residential Plot',
    price: 11000000, // PKR 1.10 Crore
    priceFormatted: 'PKR 1.10 Crore',
    pricePerSqFt: 'PKR 5,500/sq.yd',
    size: '200 Sq.Yd (8 Marla Equivalent)',
    sizeNumeric: 200,
    bedrooms: 0,
    bathrooms: 0,
    status: 'Available',
    completionStatus: 'Ready for Construction (90%)',
    completionPct: 90,
    featured: false,
    aiInvestmentScore: 8.9,
    aiScoreBreakdown: {
      locationPotential: 9.0,
      infrastructureGrowth: 8.8,
      legalSafety: 9.2,
      liquidityScore: 9.1
    },
    recommendation: 'BUY FOR CAPITAL APPRECIATION',
    confidencePct: 91,
    forecast3YrYield: '+19.4%',
    priceHistory: [
      { year: '2022', price: 6500000 },
      { year: '2023', price: 7800000 },
      { year: '2024', price: 9200000 },
      { year: '2025', price: 10200000 },
      { year: '2026 (Current)', price: 11000000 },
      { year: '2027 (AI Proj)', price: 12600000, lower: 12000000, upper: 13300000 },
      { year: '2028 (AI Proj)', price: 14500000, lower: 13600000, upper: 15400000 },
      { year: '2029 (AI Proj)', price: 16800000, lower: 15500000, upper: 18100000 }
    ],
    leaseStatus: {
      verified: true,
      title: 'KDA 99-Year Leasehold with Registered Sub-Lease',
      nocNumber: 'KDA/SCH-33/SEC-19/2021',
      issuingAuthority: 'Karachi Development Authority (KDA)',
      statusType: '99-Year Leez Verified / Clear Chain of Title',
      transferType: 'Sub-Lease Registered with Sub-Registrar Gulshan Town',
      verificationDate: '18 Jan 2026',
      notes: 'No litigation; cleared under KDA Masterplan Survey 2026'
    },
    facilities: [
      { name: 'Al-Madina Mosque', distance: '0.4 km', driveTime: '2 mins', rating: 4.8, type: 'mosque' },
      { name: 'Beaconhouse Gulshan-e-Maymar', distance: '2.4 km', driveTime: '6 mins', rating: 4.7, type: 'school' },
      { name: 'Memon Medical Institute Hospital', distance: '4.5 km', driveTime: '10 mins', rating: 4.9, type: 'hospital' },
      { name: 'Maymar Super Highway Commercial Market', distance: '1.2 km', driveTime: '4 mins', rating: 4.8, type: 'market' },
      { name: 'M-9 Karachi-Hyderabad Motorway', distance: '2.0 km', driveTime: '5 mins', rating: 5.0, type: 'transport' },
      { name: 'Sector Green Park', distance: '0.5 km', driveTime: '2 mins', rating: 4.6, type: 'park' }
    ],
    constructionMilestones: [
      { date: 'Dec 2025', title: 'Underground Gas and Water Supply Connection Active', status: 'Completed', pct: 100, verifiedByAdmin: true }
    ],
    images: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Prime 200 sq.yd West-Open plot in a secured, boundary-walled society in Scheme 33. Outstanding construction potential with nearby university campuses and rapid expressway connections.'
  },

  // 8. New Metro City Mandra-Gujar Khan - Developing Frontier Corridor
  {
    id: 'prop-008',
    title: '7 Marla Early-Mover Commercial & Residential Hub Plot',
    society: 'New Metro City Mandra-Gujar Khan',
    societyId: 'new-metro-city',
    city: 'islamabad',
    type: 'Plot',
    subtype: 'Residential Plot',
    price: 2450000, // PKR 24.5 Lacs
    priceFormatted: 'PKR 24.5 Lacs',
    pricePerSqFt: 'PKR 1,400/sq.yd',
    size: '7 Marla (175 Sq.Yd)',
    sizeNumeric: 175,
    bedrooms: 0,
    bathrooms: 0,
    status: 'Available',
    completionStatus: 'Under Construction (64% complete)',
    completionPct: 64,
    featured: true,
    aiInvestmentScore: 9.6,
    aiScoreBreakdown: {
      locationPotential: 9.8,
      infrastructureGrowth: 9.9,
      legalSafety: 9.2,
      liquidityScore: 9.4
    },
    recommendation: 'STRONG BUY (Max Growth Rate)',
    confidencePct: 92,
    forecast3YrYield: '+41.0%',
    priceHistory: [
      { year: '2023', price: 1300000 },
      { year: '2024', price: 1750000 },
      { year: '2025', price: 2150000 },
      { year: '2026 (Current)', price: 2450000 },
      { year: '2027 (AI Proj)', price: 3350000, lower: 3000000, upper: 3700000 },
      { year: '2028 (AI Proj)', price: 4450000, lower: 3950000, upper: 4950000 },
      { year: '2029 (AI Proj)', price: 5800000, lower: 5100000, upper: 6500000 }
    ],
    leaseStatus: {
      verified: true,
      title: 'Tehsil Municipal Administration (TMA) Gujar Khan Approved NOC',
      nocNumber: 'TMA/GK-DEV/2023/104',
      issuingAuthority: 'TMA Gujar Khan & District Council Rawalpindi',
      statusType: 'Direct Developer Allotment with Biometric Record',
      transferType: 'BSM Developers Registered File',
      verificationDate: '25 Jan 2026',
      notes: 'Strategically located on Main GT Road with 8-lane grand entrance boulevard'
    },
    facilities: [
      { name: 'Grand Jamia Masjid Eiffel Tower Replica Site', distance: '0.5 km', driveTime: '2 mins', rating: 4.8, type: 'mosque' },
      { name: 'Roots Millennium Smart Campus', distance: '1.0 km', driveTime: '3 mins', rating: 4.7, type: 'school' },
      { name: 'Tehsil Headquarters Hospital Gujar Khan', distance: '4.5 km', driveTime: '8 mins', rating: 4.5, type: 'hospital' },
      { name: 'Clock Tower Commercial Plaza', distance: '0.4 km', driveTime: '2 mins', rating: 4.9, type: 'market' },
      { name: 'Main GT Road N-5 Frontage Access', distance: '0.2 km', driveTime: '1 min', rating: 5.0, type: 'transport' },
      { name: 'Theme Glow Park & Laser Fountain', distance: '0.6 km', driveTime: '2 mins', rating: 4.8, type: 'park' }
    ],
    constructionMilestones: [
      { date: 'Jan 2026', title: 'Main Grand Entrance Arch & Security Gantry Complete', status: 'Completed', pct: 100, verifiedByAdmin: true },
      { date: 'Feb 2026', title: 'Sector A & B Water Tank & Tubewell Network', status: 'Completed', pct: 100, verifiedByAdmin: true },
      { date: 'Apr 2026', title: 'Sector B Main Boulevard Carpeting', status: 'In Progress', pct: 50, verifiedByAdmin: false }
    ],
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'An aggressive growth pick on the Main GT Road belt connecting Islamabad, Rawalpindi, and northern Punjab. Rapid delivery speed by BSM Developers making it a prime candidate for 2-3x capital gains.'
  }
];

export const COMPARATIVE_SOCIETIES_METRICS = [
  { name: 'Capital Smart City', city: 'Islamabad', growthRate: '34.6%', avgPriceSqYd: 'PKR 38,000', facilityScore: 9.6, legalStatus: 'RDA Approved', velocityPct: 88 },
  { name: 'Faisal Town Phase 2', city: 'Islamabad', growthRate: '38.2%', avgPriceSqYd: 'PKR 28,800', facilityScore: 9.1, legalStatus: 'RDA Approved', velocityPct: 92 },
  { name: 'LDA City Jinnah Sector', city: 'Lahore', growthRate: '29.3%', avgPriceSqYd: 'PKR 33,000', facilityScore: 9.5, legalStatus: 'Govt LDA Exemption', velocityPct: 84 },
  { name: 'Northern Bypass Corridor', city: 'Karachi', growthRate: '31.2%', avgPriceSqYd: 'PKR 26,600', facilityScore: 8.8, legalStatus: 'SBCA 99-Yr Lease', velocityPct: 78 },
  { name: 'DHA Phase 9 Prism', city: 'Lahore', growthRate: '24.1%', avgPriceSqYd: 'PKR 54,000', facilityScore: 9.7, legalStatus: 'DHA Clear Title', velocityPct: 90 },
  { name: 'New Metro City Mandra', city: 'Islamabad', growthRate: '41.0%', avgPriceSqYd: 'PKR 14,000', facilityScore: 9.2, legalStatus: 'TMA Approved', velocityPct: 95 }
];

export const B2B_SUBSCRIPTION_PLANS = [
  {
    id: 'starter',
    name: 'Starter Society Portal',
    price: 'PKR 45,000',
    billingPeriod: 'per month',
    description: 'Essential presence for emerging housing schemes and sector developers.',
    features: [
      'Up to 50 Verified Plot / Property Listings',
      'Direct Government NOC & Lease Record Badge',
      'Quarterly Construction Milestone Updates',
      'Basic Lead Capture & Inquiry Inbox',
      'Standard AI Proximity Indexing'
    ],
    popular: false,
    cta: 'Register as Society'
  },
  {
    id: 'growth',
    name: 'Growth & Developer Tier',
    price: 'PKR 95,000',
    billingPeriod: 'per month',
    description: 'Comprehensive promotion & investor analytics for fast-selling projects.',
    features: [
      'Up to 250 Verified Plot / Property Listings',
      'Featured High-Growth Discovery Placements',
      'Bi-Weekly Construction Milestone Photo Tracking',
      'AI 1/3/5-Year Forecast Exposure on Property Pages',
      'Direct WhatsApp & Lead Routing to Sales Team',
      'Dedicated Rihaish Verification Specialist'
    ],
    popular: true,
    cta: 'Choose Growth Tier'
  },
  {
    id: 'enterprise',
    name: 'Enterprise Mega-Project',
    price: 'PKR 220,000',
    billingPeriod: 'per month',
    description: 'Full ecosystem marketing, API inventory sync, and investor syndicate access.',
    features: [
      'Unlimited Plot / Villa / Commercial Inventory',
      'Top-of-Page AI Investment Spotlight in City Hubs',
      'Weekly Verified Drone & Milestone Audit Reports',
      'API Inventory Sync with Society Management System',
      'Investor Portfolio Watchlist Inclusion & Push Alerts',
      'Dedicated Account Manager & 24/7 Priority Support'
    ],
    popular: false,
    cta: 'Contact Enterprise Sales'
  }
];

export const DEMO_ACCOUNTS = [
  { role: 'buyer', name: 'Zeeshan Tariq', email: 'buyer@rihaish.ai', badge: 'Verified Resident / Buyer' },
  { role: 'investor', name: 'Hamza Khan', email: 'investor@rihaish.ai', badge: 'Pro Real Estate Investor' },
  { role: 'society_admin', name: 'Danish Rasheed', email: 'admin@capitalsmartcity.pk', badge: 'Capital Smart City Admin' },
  { role: 'admin', name: 'Rihaish Master Authority', email: 'superadmin@rihaish.ai', badge: 'Rihaish Platform Master' }
];
