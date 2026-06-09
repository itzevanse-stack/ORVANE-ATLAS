// Orvane Atlas — News Proxy
// Vercel serverless function
// Fetches real estate news from GDELT and returns filtered results

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate'); // Cache 15 mins

  const { query, limit = 12 } = req.query;

  const QUERIES = [
    '"real estate" investment returns capital',
    '"property market" investment growth wealth',
    '"commercial property" investment yield returns',
    '"real estate" Nigeria OR Dubai OR London OR Qatar',
    '"property investment" profit capital growth',
    '"real estate market" 2025 OR 2026 growth',
    '"land acquisition" investment development Africa',
    '"REIT" investment returns property fund',
  ];

  const selectedQuery = query || QUERIES[Math.floor(Math.random() * QUERIES.length)];

  const KEYWORDS = [
    'real estate','property','housing','realty','mortgage',
    'investment','investor','capital','yield','returns',
    'profit','wealth','asset','portfolio','fund','market',
    'development','land','commercial','residential','reit',
    'property market','housing market','real estate market',
    'property value','rental yield','capital growth',
  ];

  function isRelevant(title) {
    const t = (title || '').toLowerCase();
    return KEYWORDS.some(kw => t.includes(kw));
  }

  function detectMarket(title) {
    const t = (title || '').toLowerCase();
    if (t.includes('nigeria') || t.includes('lagos') || t.includes('abuja')) return 'Nigeria';
    if (t.includes('dubai') || t.includes('uae') || t.includes('abu dhabi')) return 'UAE';
    if (t.includes('london') || t.includes('uk') || t.includes('britain')) return 'UK';
    if (t.includes('qatar') || t.includes('doha')) return 'Qatar';
    if (t.includes('africa') || t.includes('ghana') || t.includes('kenya')) return 'Africa';
    if (t.includes('canada') || t.includes('toronto')) return 'Canada';
    if (t.includes('usa') || t.includes('america') || t.includes('new york')) return 'USA';
    return 'Global';
  }

  function detectCategory(title) {
    const t = (title || '').toLowerCase();
    if (t.includes('invest')) return 'Investment';
    if (t.includes('luxury') || t.includes('premium')) return 'Luxury';
    if (t.includes('commercial') || t.includes('office')) return 'Commercial';
    if (t.includes('residential') || t.includes('housing')) return 'Residential';
    if (t.includes('rent') || t.includes('yield')) return 'Rental';
    if (t.includes('land') || t.includes('develop')) return 'Development';
    if (t.includes('reit') || t.includes('fund')) return 'Funds & REITs';
    return 'Market News';
  }

  function getImageQuery(title) {
    const t = (title || '').toLowerCase();
    if (t.includes('dubai') || t.includes('uae')) return 'Dubai skyline luxury real estate';
    if (t.includes('london') || t.includes('uk')) return 'London financial district property';
    if (t.includes('nigeria') || t.includes('lagos')) return 'Lagos Nigeria modern city';
    if (t.includes('qatar') || t.includes('doha')) return 'Doha Qatar architecture';
    if (t.includes('africa')) return 'Africa modern city skyline';
    if (t.includes('luxury')) return 'luxury villa property';
    if (t.includes('commercial')) return 'commercial real estate office';
    return 'real estate investment building';
  }

  function formatDate(d) {
    try {
      return new Date(d.replace(/T(\d{6})/, 'T$1:00'))
        .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { return ''; }
  }

  try {
    const gdeltUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(selectedQuery)}&mode=artlist&maxrecords=25&format=json&sourcelang=english&timespan=7d`;

    const gdeltRes = await fetch(gdeltUrl);
    const gdeltData = await gdeltRes.json();

    const articles = (gdeltData.articles || [])
      .filter(a => a.title && a.url && isRelevant(a.title))
      .slice(0, parseInt(limit))
      .map(a => ({
        title: a.title,
        url: a.url,
        source: a.domain || '',
        date: formatDate(a.seendate || ''),
        market: detectMarket(a.title),
        category: detectCategory(a.title),
        imageQuery: getImageQuery(a.title),
      }));

    res.status(200).json({
      success: true,
      count: articles.length,
      query: selectedQuery,
      articles,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      articles: [],
    });
  }
}
